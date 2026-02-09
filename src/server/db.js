import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'proveedores_v2.db'));


if (db.open) {
  console.log('Database connection is open.');
} else {
  console.log('Database connection is closed.');
}

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

export default db;