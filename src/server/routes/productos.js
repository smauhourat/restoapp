import express from 'express';
import db from '../db.js';

const router = express.Router();

// Obtener todos los productos
router.get('/', (req, res) => {
    const productos = db.prepare('SELECT * FROM Producto').all();
    res.json(productos);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const producto = db.prepare(`
    SELECT p.*
    FROM Producto p
    WHERE p.id = ?
  `).get(id); 
  
  res.json(producto);
})

// Crear un nuevo producto
router.post('/', (req, res) => {
    const { nombre, descripcion, precio_unitario, unidad_medida } = req.body;
    const stmt = db.prepare(`
    INSERT INTO Producto (nombre, descripcion, precio_unitario, unidad_medida)
    VALUES (?, ?, ?, ?)
  `);
    const result = stmt.run(nombre, descripcion, precio_unitario, unidad_medida);
    res.json({ id: result.lastInsertRowid });
});

// Actualizar un producto
router.put('/:id', (req, res) => {
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
router.delete('/:id', (req, res) => {
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