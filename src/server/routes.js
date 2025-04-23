import express from 'express';
import db from './db.js';

const router = express.Router();

// GET /api/proveedores con paginación
router.get('/proveedores', (req, res) => {
  const { page = 1, perPage = 10 } = req.query;
  const offset = (page - 1) * perPage;

  const proveedores = db.prepare(`
    SELECT * FROM Proveedor
    LIMIT ? OFFSET ?
  `).all(perPage, offset);

  const total = db.prepare(`
    SELECT COUNT(*) as total FROM Proveedor
  `).get().total;

  res.json({
    data: proveedores,
    total,
    page: parseInt(page),
    perPage: parseInt(perPage),
    totalPages: Math.ceil(total / perPage),
  });
});

router.post('/proveedores', (req, res) => {
  const { nombre, direccion, telefono, email } = req.body;
  const stmt = db.prepare(
    'INSERT INTO Proveedor (nombre, direccion, telefono, email) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(nombre, direccion, telefono, email);
  res.json({ id: result.lastInsertRowid });
});

// CRUD Productos, Pedidos, etc. (similar a lo anterior)
// ...
// Obtener todos los productos de un proveedor
router.get('/proveedores/:id/productos', (req, res) => {
  const { id } = req.params;
  const productos = db.prepare(`
    SELECT p.id, p.nombre, p.precio_unitario, pp.precio_compra, pp.tiempo_entrega 
    FROM Producto p
    JOIN Proveedor_Producto pp ON p.id = pp.producto_id
    WHERE pp.proveedor_id = ?
  `).all(id);
  res.json(productos);
});

// Añadir producto a un proveedor
router.post('/proveedores/:id/productos', (req, res) => {
  const { id } = req.params;
  const { producto_id, precio_compra, tiempo_entrega } = req.body;
  const stmt = db.prepare(`
    INSERT INTO Proveedor_Producto (proveedor_id, producto_id, precio_compra, tiempo_entrega)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(id, producto_id, precio_compra, tiempo_entrega);
  res.json({ success: true });
});


// Eliminar un proveedor
router.delete('/proveedores/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare(`
    DELETE FROM Proveedor 
    WHERE id = ?
  `);
  stmt.run(id);
  res.json({ success: true });
});


// Eliminar producto de un proveedor
router.delete('/proveedores/:proveedorId/productos/:productoId', (req, res) => {
  const { proveedorId, productoId } = req.params;
  const stmt = db.prepare(`
    DELETE FROM Proveedor_Producto 
    WHERE proveedor_id = ? AND producto_id = ?
  `);
  stmt.run(proveedorId, productoId);
  res.json({ success: true });
});

// Obtener todos los productos
router.get('/productos', (req, res) => {
  const productos = db.prepare('SELECT * FROM Producto').all();
  res.json(productos);
});

// Crear un nuevo producto
router.post('/productos', (req, res) => {
  const { nombre, descripcion, precio_unitario, unidad_medida } = req.body;
  const stmt = db.prepare(`
    INSERT INTO Producto (nombre, descripcion, precio_unitario, unidad_medida)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(nombre, descripcion, precio_unitario, unidad_medida);
  res.json({ id: result.lastInsertRowid });
});

// Actualizar un producto
router.put('/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio_unitario, unidad_medida } = req.body;
  const stmt = db.prepare(`
    UPDATE Producto 
    SET nombre = ?, descripcion = ?, precio_unitario = ?, unidad_medida = ?
    WHERE id = ?
  `);
  stmt.run(nombre, descripcion, precio_unitario, unidad_medida, id);
  res.json({ success: true });
});

// Eliminar un producto
router.delete('/productos/:id', (req, res) => {
  const { id } = req.params;
  // Verificar que el producto no esté asociado a un proveedor
  const tieneProveedores = db.prepare(`
    SELECT COUNT(*) as count FROM Proveedor_Producto WHERE producto_id = ?
  `).get(id).count > 0;

  if (tieneProveedores) {
    return res.status(400).json({ error: 'El producto está asociado a proveedores' });
  }

  db.prepare('DELETE FROM Producto WHERE id = ?').run(id);
  res.json({ success: true });
});

// Obtener todos los pedidos
router.get('/pedidos', (req, res) => {
  const pedidos = db.prepare(`
    SELECT p.id, p.numero_pedido, p.fecha, pr.nombre as proveedor, p.estado, p.total
    FROM Pedido p
    JOIN Proveedor pr ON p.proveedor_id = pr.id
  `).all();
  res.json(pedidos);
});

// Crear un nuevo pedido
router.post('/pedidos', (req, res) => {
  const { numero_pedido, fecha, proveedor_id, renglones } = req.body;
  const dbTransaction = db.transaction(() => {
    // Insertar cabecera
    const stmtPedido = db.prepare(`
      INSERT INTO Pedido (numero_pedido, fecha, proveedor_id, estado)
      VALUES (?, ?, ?, 'pendiente')
    `);
    const result = stmtPedido.run(numero_pedido, fecha, proveedor_id);
    const pedido_id = result.lastInsertRowid;

    // Insertar renglones
    const stmtRenglon = db.prepare(`
      INSERT INTO Pedido_Renglon (pedido_id, producto_id, cantidad, precio_unitario)
      VALUES (?, ?, ?, ?)
    `);

    let total = 0;
    renglones.forEach((renglon) => {
      stmtRenglon.run(pedido_id, renglon.producto_id, renglon.cantidad, renglon.precio_unitario);
      total += renglon.cantidad * renglon.precio_unitario;
    });

    // Actualizar total del pedido
    db.prepare('UPDATE Pedido SET total = ? WHERE id = ?').run(total, pedido_id);
    return { id: pedido_id };
  });

  try {
    const result = dbTransaction();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener detalles de un pedido (con renglones)
router.get('/pedidos/:id', (req, res) => {
  const { id } = req.params;
  const pedido = db.prepare(`
    SELECT p.*, pr.nombre as proveedor_nombre
    FROM Pedido p
    JOIN Proveedor pr ON p.proveedor_id = pr.id
    WHERE p.id = ?
  `).get(id);

  const renglones = db.prepare(`
    SELECT pr.*, pd.nombre as producto_nombre
    FROM Pedido_Renglon pr
    JOIN Producto pd ON pr.producto_id = pd.id
    WHERE pr.pedido_id = ?
  `).all(id);

  res.json({ ...pedido, renglones });
});

// Actualizar estado de un pedido
router.patch('/pedidos/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  db.prepare('UPDATE Pedido SET estado = ? WHERE id = ?').run(estado, id);
  res.json({ success: true });
});


// Registrar envío
router.post('/pedidos/:id/envios', (req, res) => {
  const { id } = req.params;
  const { metodo_envio, destinatario } = req.body;

  db.prepare(`
    INSERT INTO HistorialEnvios (pedido_id, metodo_envio, destinatario)
    VALUES (?, ?, ?)
  `).run(id, metodo_envio, destinatario);

  res.json({ success: true });
});

// Obtener historial de un pedido
router.get('/pedidos/:id/envios', (req, res) => {
  const { id } = req.params;
  const historial = db.prepare(`
    SELECT * FROM HistorialEnvios WHERE pedido_id = ?
  `).all(id);

  res.json(historial);
});

export default router;