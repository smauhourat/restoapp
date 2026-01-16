import Database from 'better-sqlite3';
import fs from 'fs';

// Conectar a la base de datos actual
const db = new Database('./proveedores_v2.db');

let sql = '';

// Función para escapar strings
function escapeString(str) {
  return str.replace(/'/g, "''");
}

// Obtener datos de cada tabla
const tables = ['Proveedor', 'Producto', 'Proveedor_Producto', 'Pedido', 'Pedido_Renglon', 'HistorialEnvios', 'NrosPedidos'];

tables.forEach(table => {
  const rows = db.prepare(`SELECT * FROM ${table}`).all();
  if (rows.length > 0) {
    sql += `-- Datos para ${table}\n`;
    rows.forEach(row => {
      const columns = Object.keys(row);
      const values = columns.map(col => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${escapeString(val)}'`;
        return val;
      });
      sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
    });
    sql += '\n';
  }
});

// Escribir a un archivo
fs.writeFileSync('seed_test_db.sql', sql);

console.log('Script de inicialización generado: seed_test_db.sql');

db.close();