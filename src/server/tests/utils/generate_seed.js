import Database from 'better-sqlite3';
import fs from 'fs';

console.log(`Current working directory: ${process.cwd()}`);

// Conectar a la base de datos actual
const db = new Database(`${process.cwd()}/src/server/proveedores_v2.db`);

let sql = '';

// Función para escapar strings
function escapeString(str) {
  return str.replace(/'/g, "''");
}

// Obtener datos de cada tabla
const tables = ['Proveedor', 'Producto', 'Proveedor_Producto', 'Pedido', 'Pedido_Renglon', 'HistorialEnvios', 'NrosPedidos'];

tables.forEach(table => {
  let columns = '';
  switch  (table.trim()) {
    case 'Pedido_Renglon':
      columns = 'id, pedido_id, producto_id, cantidad, precio_unitario';
      break;
    case 'NrosPedidos':
      columns = 'id, fecha_generacion, estado';
      break;
    default:
      columns = '*';
      break;
  }

  const rows = db.prepare(`SELECT ${columns} FROM ${table}`).all();
  if (rows.length > 0) {
    //sql += `-- Datos para ${table}\n`;
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
    //sql += '\n';
  }
});

// Escribir a un archivo
fs.writeFileSync(`${process.cwd()}/src/server/tests/utils/seed_test_db.sql`, sql);

console.log(`Script de inicialización generado: ${process.cwd()}/src/server/tests/utils/seed_test_db.sql`);

db.close();