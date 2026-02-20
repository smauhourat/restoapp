import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { sendError } from '../utils/http.js';
import {
  listProveedoresSchema,
  proveedorIdSchema,
  createProveedorSchema,
  updateProveedorSchema,
  createProveedorProductoSchema,
  proveedorProductoDetailSchema,
  updateProveedorProductoSchema,
  deleteProveedorProductoSchema,
  productosDisponiblesSchema,
} from '../validators/proveedores.js';

const router = express.Router();

router.use(authenticate);

// GET /api/proveedores con paginación
router.get('/', validateRequest(listProveedoresSchema), (req, res) => {
  const { page, perPage, search } = req.validated.query;
  const offset = (page - 1) * perPage;
  const db = req.tenantDb;

  let searchCondition = '';
  let queryParams = [perPage, offset];

  if (search) {
    searchCondition = `
      WHERE nombre LIKE ?
        OR email LIKE ?
        OR telefono LIKE ?
    `;
    const pattern = `%${search}%`;
    queryParams = [pattern, pattern, pattern, perPage, offset];
  }

  const proveedores = db.prepare(`
    SELECT *,
      (SELECT COUNT(*) FROM Proveedor_Producto pp WHERE pp.proveedor_id = Proveedor.id) AS productos
    FROM Proveedor
    ${searchCondition}
    ORDER BY nombre ASC
    LIMIT ? OFFSET ?
  `).all(...queryParams);

  let totalQuery = 'SELECT COUNT(*) as total FROM Proveedor';
  let totalParams = [];

  if (search) {
    totalQuery += ' WHERE nombre LIKE ? OR email LIKE ? OR telefono LIKE ?';
    const pattern = `%${search}%`;
    totalParams = [pattern, pattern, pattern];
  }

  const total = db.prepare(totalQuery).get(...totalParams).total;

  res.json({
    data: proveedores,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
});

router.get('/:id', validateRequest(proveedorIdSchema), (req, res) => {
  const { id } = req.validated.params;
  const db = req.tenantDb;

  const proveedor = db.prepare(`
    SELECT p.*
    FROM Proveedor p
    WHERE p.id = ?
  `).get(id);

  if (!proveedor) {
    return sendError(res, 'Proveedor no encontrado', 404);
  }

  res.json(proveedor);
});

router.post('/', validateRequest(createProveedorSchema), (req, res) => {
  const { nombre, direccion, telefono, email } = req.validated.body;
  const db = req.tenantDb;
  const nombreNormalizado = nombre.trim();
  const direccionValue = direccion ?? '';

  const existente = db.prepare('SELECT id FROM Proveedor WHERE LOWER(nombre) = LOWER(?)').get(nombreNormalizado);
  if (existente) {
    return sendError(res, 'Ya existe un proveedor con ese nombre');
  }

  const stmt = db.prepare('INSERT INTO Proveedor (nombre, direccion, telefono, email) VALUES (?, ?, ?, ?)');
  const result = stmt.run(nombreNormalizado, direccionValue, telefono, email.trim());
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', validateRequest(updateProveedorSchema), (req, res) => {
  const { id } = req.validated.params;
  const { nombre, direccion, telefono, email } = req.validated.body;
  const db = req.tenantDb;
  const nombreNormalizado = nombre.trim();
  const direccionValue = direccion ?? '';

  const existente = db.prepare('SELECT id FROM Proveedor WHERE LOWER(nombre) = LOWER(?) AND id != ?').get(nombreNormalizado, id);
  if (existente) {
    return sendError(res, 'Ya existe un proveedor con ese nombre');
  }

  const stmt = db.prepare(`
    UPDATE Proveedor
    SET nombre = ?, direccion = ?, telefono = ?, email = ?
    WHERE id = ?
  `);
  const result = stmt.run(nombreNormalizado, direccionValue, telefono, email.trim(), id);

  if (result.changes === 0) {
    return sendError(res, 'Proveedor no encontrado', 404);
  }

  res.json({ success: true });
});

router.get('/:id/productos', validateRequest(proveedorIdSchema), (req, res) => {
  const { id } = req.validated.params;
  const db = req.tenantDb;

  const productos = db.prepare(`
    SELECT p.id, p.nombre, p.descripcion, pp.precio_unitario, pp.tiempo_entrega, p.unidad_medida
    FROM Producto p
    JOIN Proveedor_Producto pp ON p.id = pp.producto_id
    WHERE pp.proveedor_id = ?
  `).all(id);

  res.json(productos);
});

router.post('/:id/productos', validateRequest(createProveedorProductoSchema), (req, res) => {
  const { id } = req.validated.params;
  const { producto_id, precio_unitario, tiempo_entrega } = req.validated.body;
  const db = req.tenantDb;

  db.prepare(`
    INSERT INTO Proveedor_Producto (proveedor_id, producto_id, precio_unitario, tiempo_entrega)
    VALUES (?, ?, ?, ?)
  `).run(id, producto_id, precio_unitario, tiempo_entrega ?? '');

  res.json({ success: true });
});

router.get('/:proveedorId/productos/:productoId', validateRequest(proveedorProductoDetailSchema), (req, res) => {
  const { proveedorId, productoId } = req.validated.params;
  const db = req.tenantDb;

  const producto = db.prepare(`
    SELECT p.id, p.nombre, p.descripcion, pp.precio_unitario, pp.tiempo_entrega, p.unidad_medida
    FROM Producto p
    JOIN Proveedor_Producto pp ON p.id = pp.producto_id
    WHERE pp.proveedor_id = ? AND pp.producto_id = ?
  `).get(proveedorId, productoId);

  if (!producto) {
    return sendError(res, 'Producto no encontrado para el proveedor', 404);
  }

  res.json(producto);
});

router.put('/:proveedorId/productos/:productoId', validateRequest(updateProveedorProductoSchema), (req, res) => {
  const { proveedorId, productoId } = req.validated.params;
  const { precio_unitario } = req.validated.body;
  const db = req.tenantDb;

  const result = db.prepare(`
    UPDATE Proveedor_Producto
    SET precio_unitario = ?
    WHERE proveedor_id = ? AND producto_id = ?
  `).run(precio_unitario, proveedorId, productoId);

  if (result.changes === 0) {
    return sendError(res, 'Producto no encontrado para el proveedor', 404);
  }

  res.json({ success: true });
});

router.delete('/:id', validateRequest(proveedorIdSchema), (req, res) => {
  const { id } = req.validated.params;
  const db = req.tenantDb;

  const result = db.prepare('DELETE FROM Proveedor WHERE id = ?').run(id);

  if (result.changes === 0) {
    return sendError(res, 'Proveedor no encontrado', 404);
  }

  res.json({ success: true });
});

router.delete('/:proveedorId/productos/:productoId', validateRequest(deleteProveedorProductoSchema), (req, res) => {
  const { proveedorId, productoId } = req.validated.params;
  const db = req.tenantDb;

  const result = db
    .prepare('DELETE FROM Proveedor_Producto WHERE proveedor_id = ? AND producto_id = ?')
    .run(proveedorId, productoId);

  if (result.changes === 0) {
    return sendError(res, 'Producto no encontrado para el proveedor', 404);
  }

  res.json({ success: true });
});

router.get('/:id/productos-disponibles', validateRequest(productosDisponiblesSchema), (req, res) => {
  const { id } = req.validated.params;
  const db = req.tenantDb;

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
