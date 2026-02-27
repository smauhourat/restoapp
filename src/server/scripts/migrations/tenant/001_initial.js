export const description = 'Schema inicial de tenant: Proveedor, Producto, Proveedor_Producto, Pedido, Pedido_Renglon, HistorialEnvios, NrosPedidos';

export function up(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Proveedor (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre    TEXT NOT NULL,
      direccion TEXT,
      telefono  TEXT,
      email     TEXT
    );

    CREATE TABLE IF NOT EXISTS Producto (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre       TEXT NOT NULL,
      descripcion  TEXT,
      unidad_medida TEXT
    );

    CREATE TABLE IF NOT EXISTS Proveedor_Producto (
      proveedor_id    INTEGER,
      producto_id     INTEGER,
      precio_unitario REAL NOT NULL,
      tiempo_entrega  INTEGER,
      PRIMARY KEY (proveedor_id, producto_id),
      FOREIGN KEY (proveedor_id) REFERENCES Proveedor(id) ON DELETE CASCADE,
      FOREIGN KEY (producto_id)  REFERENCES Producto(id)  ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Pedido (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_pedido TEXT UNIQUE NOT NULL,
      fecha         TEXT NOT NULL,
      proveedor_id  INTEGER NOT NULL,
      estado        TEXT NOT NULL,
      total         REAL DEFAULT 0,
      FOREIGN KEY (proveedor_id) REFERENCES Proveedor(id)
    );

    CREATE TABLE IF NOT EXISTS Pedido_Renglon (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id       INTEGER NOT NULL,
      producto_id     INTEGER NOT NULL,
      cantidad        REAL NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal        REAL GENERATED ALWAYS AS (cantidad * precio_unitario) VIRTUAL,
      FOREIGN KEY (pedido_id)   REFERENCES Pedido(id)   ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES Producto(id)
    );

    CREATE TABLE IF NOT EXISTS HistorialEnvios (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id    INTEGER NOT NULL,
      metodo_envio TEXT NOT NULL,
      fecha_envio  TEXT DEFAULT (datetime('now')),
      destinatario TEXT,
      FOREIGN KEY (pedido_id) REFERENCES Pedido(id)
    );

    CREATE TABLE IF NOT EXISTS NrosPedidos (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha_generacion TEXT DEFAULT (datetime('now')),
      estado           TEXT NOT NULL,
      nro_pedido       INTEGER GENERATED ALWAYS AS (id + 1000000)
    );
  `);
}
