import express from 'express';
import db from './db.js';

const router = express.Router();

// CRUD Proveedores
router.get('/proveedores', (req, res) => {
  const proveedores = db.prepare('SELECT * FROM Proveedor').all();
  res.json(proveedores);
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

export default router;