/**
 * Script de migración inicial — ejecutar UNA SOLA VEZ
 * Convierte proveedores_v2.db en el tenant inicial
 * y crea auth.db con usuarios por defecto
 *
 * Uso: node src/server/scripts/migrate.js
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVER_DIR = join(__dirname, '..');
const DATA_DIR = join(SERVER_DIR, 'data');
const TENANTS_DIR = join(DATA_DIR, 'tenants');
const AUTH_DB_PATH = join(DATA_DIR, 'auth.db');
const OLD_DB_PATH = join(SERVER_DIR, 'proveedores_v2.db');

// ─── Crear directorios si no existen ────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(TENANTS_DIR)) fs.mkdirSync(TENANTS_DIR, { recursive: true });

// ─── Verificar si ya existe auth.db ─────────────────────────────────────────
if (fs.existsSync(AUTH_DB_PATH)) {
  console.log('\n⚠️  Ya existe auth.db. La migración ya fue ejecutada.');
  console.log('   Si querés reiniciarla, elimina manualmente:');
  console.log(`   - ${AUTH_DB_PATH}`);
  console.log(`   - ${TENANTS_DIR}/*.db`);
  process.exit(0);
}

console.log('\n=== Iniciando migración RestoApp ===\n');

// ─── Crear auth.db ───────────────────────────────────────────────────────────
const authDb = new Database(AUTH_DB_PATH);
authDb.pragma('foreign_keys = ON');

authDb.exec(`
  CREATE TABLE IF NOT EXISTS empresas (
    id        TEXT PRIMARY KEY,
    nombre    TEXT NOT NULL,
    slug      TEXT UNIQUE NOT NULL,
    activo    INTEGER DEFAULT 1,
    creado_en TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id            TEXT PRIMARY KEY,
    empresa_id    TEXT REFERENCES empresas(id),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre        TEXT NOT NULL,
    rol           TEXT NOT NULL CHECK(rol IN ('superadmin', 'admin', 'operador', 'visor')),
    activo        INTEGER DEFAULT 1,
    creado_en     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expira_en  TEXT NOT NULL,
    revocado   INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
`);

console.log('✓ auth.db creada');

// ─── Crear empresa inicial ───────────────────────────────────────────────────
const empresaId = uuidv4();
const empresaNombre = 'Restaurante Demo';
const empresaSlug = 'restaurante-demo';

authDb.prepare(`
  INSERT INTO empresas (id, nombre, slug) VALUES (?, ?, ?)
`).run(empresaId, empresaNombre, empresaSlug);

console.log(`✓ Empresa creada: "${empresaNombre}" (id: ${empresaId})`);

// ─── Copiar DB existente como tenant inicial ─────────────────────────────────
const tenantDbPath = join(TENANTS_DIR, `tenant_${empresaId}.db`);

if (fs.existsSync(OLD_DB_PATH)) {
  fs.copyFileSync(OLD_DB_PATH, tenantDbPath);
  console.log(`✓ Base de datos migrada: proveedores_v2.db → tenant_${empresaId}.db`);
} else {
  // Si no existe la DB vieja, crear una vacía con el schema
  const tenantDb = new Database(tenantDbPath);
  tenantDb.pragma('foreign_keys = ON');
  tenantDb.exec(`
    CREATE TABLE IF NOT EXISTS Proveedor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      direccion TEXT,
      telefono TEXT,
      email TEXT
    );
    CREATE TABLE IF NOT EXISTS Producto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      unidad_medida TEXT
    );
    CREATE TABLE IF NOT EXISTS Proveedor_Producto (
      proveedor_id INTEGER,
      producto_id INTEGER,
      precio_unitario REAL NOT NULL,
      tiempo_entrega INTEGER,
      PRIMARY KEY (proveedor_id, producto_id),
      FOREIGN KEY (proveedor_id) REFERENCES Proveedor(id) ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES Producto(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS Pedido (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_pedido TEXT UNIQUE NOT NULL,
      fecha TEXT NOT NULL,
      proveedor_id INTEGER NOT NULL,
      estado TEXT NOT NULL,
      total REAL DEFAULT 0,
      FOREIGN KEY (proveedor_id) REFERENCES Proveedor(id)
    );
    CREATE TABLE IF NOT EXISTS Pedido_Renglon (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      cantidad REAL NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL GENERATED ALWAYS AS (cantidad * precio_unitario) VIRTUAL,
      FOREIGN KEY (pedido_id) REFERENCES Pedido(id) ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES Producto(id)
    );
    CREATE TABLE IF NOT EXISTS HistorialEnvios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      metodo_envio TEXT NOT NULL,
      fecha_envio TEXT DEFAULT (datetime('now')),
      destinatario TEXT,
      FOREIGN KEY (pedido_id) REFERENCES Pedido(id)
    );
    CREATE TABLE IF NOT EXISTS NrosPedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha_generacion TEXT DEFAULT (datetime('now')),
      estado TEXT NOT NULL,
      nro_pedido INTEGER GENERATED ALWAYS AS (id + 1000000)
    );
  `);
  tenantDb.close();
  console.log(`✓ DB de tenant creada vacía (no se encontró proveedores_v2.db)`);
}

// ─── Crear usuarios ──────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@demo.com';
const ADMIN_PASSWORD = 'Admin1234!';
const ADMIN_NOMBRE = 'Administrador Demo';

const SUPERADMIN_EMAIL = 'superadmin@restoapp.com';
const SUPERADMIN_PASSWORD = 'SuperAdmin1234!';
const SUPERADMIN_NOMBRE = 'Super Administrador';

const adminId = uuidv4();
const superadminId = uuidv4();

authDb.prepare(`
  INSERT INTO usuarios (id, empresa_id, email, password_hash, nombre, rol)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(adminId, empresaId, ADMIN_EMAIL, bcrypt.hashSync(ADMIN_PASSWORD, 10), ADMIN_NOMBRE, 'admin');

authDb.prepare(`
  INSERT INTO usuarios (id, empresa_id, email, password_hash, nombre, rol)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(superadminId, null, SUPERADMIN_EMAIL, bcrypt.hashSync(SUPERADMIN_PASSWORD, 10), SUPERADMIN_NOMBRE, 'superadmin');

authDb.close();

// ─── Resultado ───────────────────────────────────────────────────────────────
console.log('\n=== Migración completada ===\n');
console.log('Credenciales creadas:');
console.log('─────────────────────────────────────────────');
console.log(`Admin de empresa:`);
console.log(`  Email:    ${ADMIN_EMAIL}`);
console.log(`  Password: ${ADMIN_PASSWORD}`);
console.log(`  Empresa:  ${empresaNombre}`);
console.log('');
console.log(`Super Admin (gestión de empresas):`);
console.log(`  Email:    ${SUPERADMIN_EMAIL}`);
console.log(`  Password: ${SUPERADMIN_PASSWORD}`);
console.log('─────────────────────────────────────────────');
console.log('\n⚠️  Cambiá estas contraseñas en producción!\n');
