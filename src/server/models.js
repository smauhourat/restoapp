import db from './db.js';

export function initDatabase() {
  // Tabla Proveedor
  db.exec(`
    CREATE TABLE IF NOT EXISTS Proveedor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      direccion TEXT,
      telefono TEXT,
      email TEXT
    );
  `);

  // Tabla Producto
  db.exec(`
    CREATE TABLE IF NOT EXISTS Producto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio_unitario REAL NOT NULL,
      unidad_medida TEXT
    );
  `);

  // Tabla intermedia Proveedor_Producto
  db.exec(`
    CREATE TABLE IF NOT EXISTS Proveedor_Producto (
      proveedor_id INTEGER,
      producto_id INTEGER,
      precio_compra REAL NOT NULL,
      tiempo_entrega INTEGER,
      PRIMARY KEY (proveedor_id, producto_id),
      FOREIGN KEY (proveedor_id) REFERENCES Proveedor(id) ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES Producto(id) ON DELETE CASCADE
    );
  `);

  // Tabla Pedido (Cabecera)
  db.exec(`
    CREATE TABLE IF NOT EXISTS Pedido (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_pedido TEXT UNIQUE NOT NULL,
      fecha TEXT NOT NULL,
      proveedor_id INTEGER NOT NULL,
      estado TEXT NOT NULL,
      total REAL DEFAULT 0,
      FOREIGN KEY (proveedor_id) REFERENCES Proveedor(id)
    );
  `);

  // Tabla Pedido_Renglon (Items)
  db.exec(`
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
  `);
}