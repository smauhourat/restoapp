import express from 'express';
import db from '../db.js';

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

// routes.js
router.get('/proveedores/:id/productos', (req, res) => {
    const { id } = req.params;
    const productos = db.prepare(`
    SELECT p.*, pp.precio_compra 
    FROM Producto p
    JOIN Proveedor_Producto pp ON p.id = pp.producto_id
    WHERE pp.proveedor_id = ?
  `).all(id);
    res.json(productos);
});


export default router;