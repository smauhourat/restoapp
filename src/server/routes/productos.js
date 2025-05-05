import express from 'express';
import db from '../db.js';

const router = express.Router();

// Obtener todos los productos
// GET /api/productos con paginación
router.get('/', (req, res) => {
  const { page = 1, perPage = 99999, sortBy = 'nombre', order = 'asc' } = req.query;
  const offset = (page - 1) * perPage;

  // Validar campos de ordenamiento
  const validSortFields = ['nombre', 'descripcion', 'precio_unitario'];
  if (!validSortFields.includes(sortBy)) {
    return res.status(400).json({ error: 'Campo de ordenamiento inválido' });
  }

  const validOrders = ['asc', 'desc'];
  if (!validOrders.includes(order.toLowerCase())) {
    return res.status(400).json({ error: 'Orden inválido (use "asc" o "desc")' });
  }



  const productos = db.prepare(`
    SELECT Producto.*, Proveedor.nombre as proveedor FROM Producto
    LEFT JOIN Proveedor_Producto pp ON Producto.id = pp.producto_id
    LEFT JOIN Proveedor on pp.proveedor_id = Proveedor.id
    ORDER BY ${sortBy} ${order}
    LIMIT ? OFFSET ?
  `).all(perPage, offset);

  const total = db.prepare(`
    SELECT COUNT(*) as total FROM Producto
  `).get().total;

  res.json({
    data: productos,
    total,
    page: parseInt(page),
    perPage: parseInt(perPage),
    totalPages: Math.ceil(total / perPage),
  });
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

    // Validaciones básicas
    if (!nombre || nombre.length < 3) {
      return res.status(400).json({ error: 'Nombre debe tener al menos 3 caracteres' });
    }

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

    // Validaciones básicas
    if (!nombre || nombre.length < 3) {
      return res.status(400).json({ error: 'Nombre debe tener al menos 3 caracteres' });
    }    
    
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