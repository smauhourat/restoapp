/**
 * Script para copiar datos de un tenant a otro.
 *
 * Uso:
 *   node src/server/scripts/copy-tenant-data.js <src-tenant-id> <dst-tenant-id>
 *
 * Ejemplo:
 *   node src/server/scripts/copy-tenant-data.js \
 *     95926d98-4add-49c4-a533-380b0cd87e1e \
 *     e77f9943-63e0-4d35-b5e4-3145d48d27d3
 *
 * Notas:
 *   - El script TRUNCA las tablas del destino antes de insertar.
 *   - Las columnas generadas (subtotal, nro_pedido) se excluyen del INSERT.
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TENANTS_DIR = join(__dirname, '..', 'data', 'tenants');

// ─── Args ────────────────────────────────────────────────────────────────────
const [srcId, dstId] = process.argv.slice(2);

if (!srcId || !dstId) {
  console.error('Uso: node copy-tenant-data.js <src-tenant-id> <dst-tenant-id>');
  process.exit(1);
}

if (srcId === dstId) {
  console.error('Error: origen y destino son el mismo tenant.');
  process.exit(1);
}

const srcPath = join(TENANTS_DIR, `tenant_${srcId}.db`);
const dstPath = join(TENANTS_DIR, `tenant_${dstId}.db`);

if (!fs.existsSync(srcPath)) {
  console.error(`Error: no existe la DB origen: ${srcPath}`);
  process.exit(1);
}

if (!fs.existsSync(dstPath)) {
  console.error(`Error: no existe la DB destino: ${dstPath}`);
  process.exit(1);
}

console.log(`\n=== Copia de tenant data ===`);
console.log(`  Origen:  tenant_${srcId}.db`);
console.log(`  Destino: tenant_${dstId}.db\n`);

// ─── Abrir DBs ───────────────────────────────────────────────────────────────
const src = new Database(srcPath, { readonly: true });
const dst = new Database(dstPath);

dst.pragma('foreign_keys = OFF');

// ─── Tablas en orden de inserción (respeta FK) ────────────────────────────────
// Columnas explícitas para excluir generadas/virtuales
const TABLES = [
  { name: 'Proveedor',         cols: ['id', 'nombre', 'direccion', 'telefono', 'email'] },
  { name: 'Producto',          cols: ['id', 'nombre', 'descripcion', 'unidad_medida'] },
  { name: 'Proveedor_Producto',cols: ['proveedor_id', 'producto_id', 'precio_unitario', 'tiempo_entrega'] },
  { name: 'NrosPedidos',       cols: ['id', 'fecha_generacion', 'estado'] },
  { name: 'Pedido',            cols: ['id', 'numero_pedido', 'fecha', 'proveedor_id', 'estado', 'total'] },
  { name: 'Pedido_Renglon',    cols: ['id', 'pedido_id', 'producto_id', 'cantidad', 'precio_unitario'] },
  { name: 'HistorialEnvios',   cols: ['id', 'pedido_id', 'metodo_envio', 'fecha_envio', 'destinatario'] },
];

// ─── Ejecutar copia en una transacción ───────────────────────────────────────
const copyAll = dst.transaction(() => {
  // Truncar en orden inverso para respetar FK (aunque están OFF)
  for (const { name } of [...TABLES].reverse()) {
    dst.prepare(`DELETE FROM "${name}"`).run();
    // Resetear autoincrement si aplica
    dst.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(name);
  }

  for (const { name, cols } of TABLES) {
    const rows = src.prepare(`SELECT ${cols.map(c => `"${c}"`).join(', ')} FROM "${name}"`).all();

    if (rows.length === 0) {
      console.log(`  ${name}: (vacío, se omite)`);
      continue;
    }

    const placeholders = cols.map(() => '?').join(', ');
    const colList = cols.map(c => `"${c}"`).join(', ');
    const insert = dst.prepare(
      `INSERT INTO "${name}" (${colList}) VALUES (${placeholders})`
    );

    for (const row of rows) {
      insert.run(cols.map(c => row[c]));
    }

    console.log(`  ${name}: ${rows.length} filas copiadas`);
  }
});

try {
  copyAll();
  console.log('\n✓ Copia completada exitosamente.\n');
} catch (err) {
  console.error('\n✗ Error durante la copia:', err.message);
  process.exit(1);
} finally {
  src.close();
  dst.pragma('foreign_keys = ON');
  dst.close();
}
