import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initAuthDatabase } from './auth/models.js';
import { initDatabase } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const AUTH_DB_PATH = join(DATA_DIR, 'auth.db');
const TENANTS_DIR = join(DATA_DIR, 'tenants');

// ─── Auth DB (singleton) ────────────────────────────────────────────────────
let _authDb = null;

if (db.open) {
  console.log('Database connection is open.');
} else {
  console.log('Database connection is closed.');
}

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// ─── Tenant DBs (cache por tenant_id) ──────────────────────────────────────
const _tenantCache = new Map();

export function getTenantDb(tenantId) {
  if (!tenantId) throw new Error('tenantId es requerido');

  if (!_tenantCache.has(tenantId)) {
    const dbPath = join(TENANTS_DIR, `tenant_${tenantId}.db`);
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    initDatabase(db);
    _tenantCache.set(tenantId, db);
  }

  return _tenantCache.get(tenantId);
}

export { TENANTS_DIR, DATA_DIR };
