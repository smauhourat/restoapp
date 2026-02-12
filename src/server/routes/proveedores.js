import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/proveedores con paginación
router.get('/', (req, res) => {
    const { page = 1, perPage = 10 } = req.query;
    const offset = (page - 1) * perPage;

    const proveedores = db.prepare(`
    SELECT *,
    (select count(*) from Proveedor_Producto pp where pp.proveedor_id == Proveedor.id) as productos
    FROM Proveedor
    ORDER BY nombre ASC
    LIMIT ? OFFSET ?
  `).all(perPage, offset);

  //console.log('Proveedores =>', proveedores)

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

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const proveedor = db.prepare(`
    SELECT p.*
    FROM Proveedor p
    WHERE p.id = ?
  `).get(id);
  res.json(proveedor);
});

router.post('/', (req, res) => {
    const { nombre, direccion, telefono, email } = req.body;

    if (!nombre || nombre.trim().length < 3) {
      return res.status(400).json({ error: 'Nombre debe tener al menos 3 caracteres' });
    }

    if (nombre.trim().length > 50) {
      return res.status(400).json({ error: 'Nombre no puede tener más de 50 caracteres' });
    }

    const existente = db.prepare('SELECT id FROM Proveedor WHERE LOWER(nombre) = LOWER(?)').get(nombre.trim());
    if (existente) {
      return res.status(400).json({ error: 'Ya existe un proveedor con ese nombre' });
    }

    if (!telefono || !/^[0-9]+$/.test(telefono)) {
      return res.status(400).json({ error: 'Teléfono es obligatorio y solo acepta números' });
    }

    if (!email || email.trim().length === 0) {
      return res.status(400).json({ error: 'Email es obligatorio' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const stmt = db.prepare(
        'INSERT INTO Proveedor (nombre, direccion, telefono, email) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(nombre.trim(), direccion, telefono, email.trim());
    res.json({ id: result.lastInsertRowid });
});

// Actualizar un proveedor
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, direccion, telefono, email } = req.body;

    if (!nombre || nombre.trim().length < 3) {
      return res.status(400).json({ error: 'Nombre debe tener al menos 3 caracteres' });
    }

    if (nombre.trim().length > 50) {
      return res.status(400).json({ error: 'Nombre no puede tener más de 50 caracteres' });
    }

    const existente = db.prepare('SELECT id FROM Proveedor WHERE LOWER(nombre) = LOWER(?) AND id != ?').get(nombre.trim(), id);
    if (existente) {
      return res.status(400).json({ error: 'Ya existe un proveedor con ese nombre' });
    }

    if (!telefono || !/^[0-9]+$/.test(telefono)) {
      return res.status(400).json({ error: 'Teléfono es obligatorio y solo acepta números' });
    }

    if (!email || email.trim().length === 0) {
      return res.status(400).json({ error: 'Email es obligatorio' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const stmt = db.prepare(`
    UPDATE Proveedor
    SET nombre = ?, direccion = ?, telefono = ?, email = ?
    WHERE id = ?
  `);
    stmt.run(nombre.trim(), direccion, telefono, email.trim(), id);
    res.json({ success: true });
});


// Obtener todos los productos de un proveedor
router.get('/:id/productos', (req, res) => {
    const { id } = req.params;
    const productos = db.prepare(`
    SELECT p.id, p.nombre, p.descripcion, pp.precio_unitario, pp.tiempo_entrega, p.unidad_medida
    FROM Producto p
    JOIN Proveedor_Producto pp ON p.id = pp.producto_id
    WHERE pp.proveedor_id = ?
  `).all(id);
    res.json(productos);
});

// Añadir producto a un proveedor
router.post('/:id/productos', (req, res) => {
  const { id } = req.params;
  const { producto_id, precio_unitario, tiempo_entrega } = req.body;
    const stmt = db.prepare(`
    INSERT INTO Proveedor_Producto (proveedor_id, producto_id, precio_unitario, tiempo_entrega)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, producto_id, precio_unitario, tiempo_entrega);
  res.json({ success: true });
});

// Obtener un producto específico de un proveedor
router.get('/:proveedorId/productos/:productoId', (req, res) => {
    const { proveedorId, productoId } = req.params;
    const producto = db.prepare(`
    SELECT p.id, p.nombre, p.descripcion, pp.precio_unitario, pp.tiempo_entrega, p.unidad_medida
    FROM Producto p
    JOIN Proveedor_Producto pp ON p.id = pp.producto_id
    WHERE pp.proveedor_id = ? AND pp.producto_id = ?
  `).get(proveedorId, productoId);
  console.log('Producto Especifico =>', producto)
    res.json(producto);
});


// Actualizar un producto de un proveedor
router.put('/:proveedorId/productos/:productoId', (req, res) => {
  const { proveedorId, productoId } = req.params;
  const { precio_unitario } = req.body;

  // Validaciones básicas
  if (!precio_unitario || precio_unitario <= 0) {
    return res.status(400).json({ error: 'Debe ingresar un valor numerico positivo.' });
  }

  const stmt = db.prepare(`
    UPDATE Proveedor_Producto
    SET precio_unitario = ?
    WHERE proveedor_id = ? AND producto_id = ?
  `);
  stmt.run(precio_unitario, proveedorId, productoId);
  res.json({ success: true });
});

// Eliminar un proveedor
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    console.log('Id Proveedor =>', id)
    const stmt = db.prepare(`
    DELETE FROM Proveedor 
    WHERE id = ?
  `);
    stmt.run(id);
    res.json({ success: true });
});


// Eliminar producto de un proveedor
router.delete('/:proveedorId/productos/:productoId', (req, res) => {
    const { proveedorId, productoId } = req.params;
    const stmt = db.prepare(`
    DELETE FROM Proveedor_Producto 
    WHERE proveedor_id = ? AND producto_id = ?
  `);
    stmt.run(proveedorId, productoId);
    res.json({ success: true });
});

// Obtener productos NO asignados a un proveedor
router.get('/:id/productos-disponibles', (req, res) => {
  const { id } = req.params;

  const productos = db.prepare(`
    SELECT p.*
    FROM Producto p
    WHERE p.id NOT IN (
      SELECT producto_id
      FROM Proveedor_Producto
      WHERE proveedor_id = ?
    )
    ORDER BY p.nombre
  `).all(id);

  res.json(productos);
});


export default router;