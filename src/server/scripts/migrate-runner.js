/**
 * migrate-runner.js — Runner de migraciones de DB
 *
 * Aplica migraciones pendientes sobre auth.db y todas las DBs de tenant.
 * Es idempotente: registra las versiones aplicadas en la tabla schema_migrations.
 *
 * Uso: node src/server/scripts/migrate-runner.js
 *      npm run db:migrate
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath, pathToFileURL } from 'url';
import { basename, dirname, join } from 'path';
import { readdirSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVER_DIR = join(__dirname, '..');
const DATA_DIR = join(SERVER_DIR, 'data');
const TENANTS_DIR = join(DATA_DIR, 'tenants');
const AUTH_DB_PATH = join(DATA_DIR, 'auth.db');
const AUTH_MIGRATIONS_DIR = join(__dirname, 'migrations', 'auth');
const TENANT_MIGRATIONS_DIR = join(__dirname, 'migrations', 'tenant');
const BACKUPS_DIR = join(DATA_DIR, 'backups');

// ─── Utilidades ───────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function getMigrationFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.js'))
    .sort();
}

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function getAppliedVersions(db) {
  return new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version)
  );
}

function hasPendingMigrations(db, migrationsDir) {
  ensureMigrationsTable(db);
  const applied = getAppliedVersions(db);
  const files = getMigrationFiles(migrationsDir);
  return files.some(f => !applied.has(f.replace('.js', '')));
}

function getBackupTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function pruneBackups(dbBaseName, maxKeep = 5) {
  const allFiles = existsSync(BACKUPS_DIR)
    ? readdirSync(BACKUPS_DIR).filter(f => f.startsWith(dbBaseName + '_') && f.endsWith('.db'))
    : [];
  allFiles.sort(); // YYYYMMDD_HHmmss → orden cronológico equivale a orden alfabético
  const toDelete = allFiles.slice(0, Math.max(0, allFiles.length - maxKeep));
  for (const f of toDelete) {
    try {
      unlinkSync(join(BACKUPS_DIR, f));
      console.log(`  [backup] Eliminado backup antiguo: ${f}`);
    } catch (err) {
      console.warn(`  [backup] No se pudo eliminar ${f}: ${err.message}`);
    }
  }
}

function backupDb(db, dbPath) {
  ensureDir(BACKUPS_DIR);
  const dbBaseName = basename(dbPath, '.db');
  const backupName = `${dbBaseName}_${getBackupTimestamp()}.db`;
  const backupPath = join(BACKUPS_DIR, backupName).replace(/\\/g, '/');
  db.exec(`VACUUM INTO '${backupPath}'`);
  console.log(`  [backup] ✓ Creado: ${backupName}`);
  pruneBackups(dbBaseName);
}

async function applyMigrations(db, migrationsDir, label) {
  ensureMigrationsTable(db);
  const applied = getAppliedVersions(db);
  const files = getMigrationFiles(migrationsDir);
  let count = 0;

  for (const file of files) {
    const version = file.replace('.js', '');
    if (applied.has(version)) continue;

    const filePath = pathToFileURL(join(migrationsDir, file)).href;
    const { up, description } = await import(filePath);

    db.transaction(() => {
      up(db);
      db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(version);
    })();

    console.log(`  [${label}] ✓ ${version} — ${description}`);
    count++;
  }

  if (count === 0) {
    console.log(`  [${label}] Sin migraciones pendientes.`);
  }

  return count;
}

// ─── Auth DB ──────────────────────────────────────────────────────────────────

async function migrateAuthDb() {
  console.log('\n— auth.db');
  ensureDir(DATA_DIR);

  const isNew = !existsSync(AUTH_DB_PATH);
  const db = new Database(AUTH_DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  if (!isNew && hasPendingMigrations(db, AUTH_MIGRATIONS_DIR)) {
    backupDb(db, AUTH_DB_PATH);
  }

  await applyMigrations(db, AUTH_MIGRATIONS_DIR, 'auth');

  // Si es la primera vez, crear usuarios iniciales
  if (isNew) {
    await seedAuthDb(db);
  }

  db.close();
}

async function seedAuthDb(db) {
  const empresaId = uuidv4();
  const adminId = uuidv4();
  const superadminId = uuidv4();

  db.transaction(() => {
    db.prepare('INSERT INTO empresas (id, nombre, slug) VALUES (?, ?, ?)').run(
      empresaId, 'Restaurante Demo', 'restaurante-demo'
    );
    db.prepare(
      'INSERT INTO usuarios (id, empresa_id, email, password_hash, nombre, rol) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(adminId, empresaId, 'admin@demo.com', bcrypt.hashSync('Admin1234!', 10), 'Administrador Demo', 'admin');
    db.prepare(
      'INSERT INTO usuarios (id, empresa_id, email, password_hash, nombre, rol) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(superadminId, null, 'superadmin@restoapp.com', bcrypt.hashSync('SuperAdmin1234!', 10), 'Super Administrador', 'superadmin');
  })();

  console.log('  [auth] ✓ Usuarios iniciales creados');
  console.log('         admin@demo.com / Admin1234!');
  console.log('         superadmin@restoapp.com / SuperAdmin1234!');
}

// ─── Tenant DBs ───────────────────────────────────────────────────────────────

async function migrateTenantDbs() {
  ensureDir(TENANTS_DIR);

  const tenantFiles = existsSync(TENANTS_DIR)
    ? readdirSync(TENANTS_DIR).filter(f => f.endsWith('.db'))
    : [];

  if (tenantFiles.length === 0) {
    console.log('\n— tenants: ninguna DB encontrada, se crearán al primer login.');
    return;
  }

  for (const file of tenantFiles) {
    const dbPath = join(TENANTS_DIR, file);
    console.log(`\n— ${file}`);
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    if (hasPendingMigrations(db, TENANT_MIGRATIONS_DIR)) {
      backupDb(db, dbPath);
    }

    await applyMigrations(db, TENANT_MIGRATIONS_DIR, 'tenant');
    db.close();
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('=== RestoApp — Migraciones de DB ===');

try {
  await migrateAuthDb();
  await migrateTenantDbs();
  console.log('\n=== Migraciones completadas ✓ ===\n');
} catch (err) {
  console.error('\n[ERROR] Fallo en migración:', err.message);
  process.exit(1);
}
