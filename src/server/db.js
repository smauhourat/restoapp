import Database from 'better-sqlite3';

const db = new Database('proveedores_v2.db'); // Crea o abre la DB

if (db.open) {
  console.log('Database connection is open.');
} else {
  console.log('Database connection is closed.');
}

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

export default db;