import express from 'express';
import db from '../db.js';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import { validateRequest } from '../middleware/validate.js';
import { sendError } from '../utils/http.js';
import {
  listProductosSchema,
  productoIdSchema,
  createProductoSchema,
  updateProductoSchema,
  deleteProductoSchema,
  confirmarImportacionSchema,
} from '../validators/productos.js';

const upload = multer({ dest: 'uploads/' }); // Carpeta temporal
const router = express.Router();

const normalizeNombre = (nombre) => nombre.trim().toUpperCase();

const productoExiste = (nombre, id = null) => {
  const query = id
    ? `SELECT COUNT(*) as count FROM Producto WHERE UPPER(nombre) = ? AND id != ?`
    : `SELECT COUNT(*) as count FROM Producto WHERE UPPER(nombre) = ?`;
  const params = id ? [nombre, id] : [nombre];
  const result = db.prepare(query).get(...params);
  return result.count > 0;
};

// Obtener todos los productos
router.get('/', validateRequest(listProductosSchema), (req, res) => {
  const { page, perPage, sortBy, order, search } = req.validated.query;
  const offset = (page - 1) * perPage;

  let searchCondition = '';
  let queryParams = [perPage, offset];

  if (search) {
    searchCondition = `
      WHERE nombre LIKE ?
        OR descripcion LIKE ?
        OR unidad_medida LIKE ?
    `;
    const pattern = `%${search}%`;
    queryParams = [pattern, pattern, pattern, perPage, offset];
  }

  const sortColumn = sortBy === 'descripcion' ? 'descripcion' : 'nombre';
  const sortDirection = order === 'desc' ? 'DESC' : 'ASC';

  const productos = db.prepare(`
    SELECT 
      Producto.*, 
      (SELECT COUNT(*) FROM Proveedor_Producto pp WHERE pp.producto_id = Producto.id) AS proveedores,
      ROUND((SELECT SUM(pp.precio_unitario) / COUNT(*) FROM Proveedor_Producto pp WHERE pp.producto_id = Producto.id), 2) AS precio_promedio
    FROM Producto
    ${searchCondition}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ? OFFSET ?
  `).all(...queryParams);

  let totalQuery = 'SELECT COUNT(*) as total FROM Producto';
  let totalParams = [];

  if (search) {
    totalQuery += ' WHERE nombre LIKE ? OR descripcion LIKE ? OR unidad_medida LIKE ?';
    const pattern = `%${search}%`;
    totalParams = [pattern, pattern, pattern];
  }

  const total = db.prepare(totalQuery).get(...totalParams).total;

  res.json({
    data: productos,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
});

router.get('/:id', validateRequest(productoIdSchema), (req, res) => {
  const { id } = req.validated.params;
  const producto = db.prepare(`
    SELECT p.*
    FROM Producto p
    WHERE p.id = ?
  `).get(id);

  if (!producto) {
    return sendError(res, 'Producto no encontrado', 404);
  }

  res.json(producto);
});

// Crear un nuevo producto
router.post('/', validateRequest(createProductoSchema), (req, res) => {
  const { nombre, descripcion, unidad_medida } = req.validated.body;
  const nombreUpper = normalizeNombre(nombre);

  if (productoExiste(nombreUpper)) {
    return sendError(res, 'El producto ya existe');
  }

  const descripcionValue = (descripcion ?? '').toUpperCase();

  const stmt = db.prepare(`
    INSERT INTO Producto (nombre, descripcion, unidad_medida)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(nombreUpper, descripcionValue, unidad_medida);
  res.json({ id: result.lastInsertRowid, nombre, descripcion, unidad_medida });
});

// Actualizar un producto
router.put('/:id', validateRequest(updateProductoSchema), (req, res) => {
  const { id } = req.validated.params;
  const { nombre, descripcion, unidad_medida } = req.validated.body;
  const nombreUpper = normalizeNombre(nombre);

  if (productoExiste(nombreUpper, id)) {
    return sendError(res, 'El producto ya existe');
  }

  const stmt = db.prepare(`
    UPDATE Producto 
    SET nombre = ?, descripcion = ?, unidad_medida = ?
    WHERE id = ?
  `);
  const descripcionValue = (descripcion ?? '').toUpperCase();
  const result = stmt.run(nombreUpper, descripcionValue, unidad_medida, id);
  if (result.changes === 0) {
    return sendError(res, 'Producto no encontrado', 404);
  }
  res.json({ id, nombre, descripcion, unidad_medida });
});

// Eliminar un producto
router.delete('/:id', validateRequest(deleteProductoSchema), (req, res) => {
  const { id } = req.validated.params;
  // Verificar que el producto no esté asociado a un proveedor
  const tieneProveedores = db.prepare(`
    SELECT COUNT(*) as count FROM Proveedor_Producto WHERE producto_id = ?
  `).get(id).count > 0;

  if (tieneProveedores) {
    return sendError(res, 'El producto está asociado a proveedores');
  }

  const result = db.prepare('DELETE FROM Producto WHERE id = ?').run(id);
  if (result.changes === 0) {
    return sendError(res, 'Producto no encontrado', 404);
  }
  res.json({ success: true });
});

router.post('/importar', upload.single('archivo'), (req, res) => {
  if (!req.file) {
    return sendError(res, 'Debe adjuntar un archivo');
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const validatedData = data.map((row) => ({
      nombre: row.Nombre || row.nombre || 'Sin nombre',
      descripcion: row.Descripcion || row.descripcion || '',
      unidad: row.Unidad || row.unidad || 'unidad',
    }));

    const filteredData = validatedData.filter(
      (obj, index, self) => index === self.findIndex((o) => o.nombre === obj.nombre),
    );

    return res.json({
      success: true,
      data: filteredData,
      preview: true,
    });
  } catch (error) {
    return sendError(res, error.message || 'Error al procesar el archivo', 500);
  } finally {
    if (req.file) {
      fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
    }
  }
});

// Ruta para confirmar importación
router.post('/confirmar-importacion', validateRequest(confirmarImportacionSchema), (req, res) => {
  const { productos } = req.validated.body;

  const stmt = db.prepare(`
    INSERT INTO Producto (nombre, descripcion, unidad_medida)
    VALUES (?, ?, ?)
  `);

  try {
    productos.forEach((producto) => {
      stmt.run(
        normalizeNombre(producto.nombre),
        (producto.descripcion ?? '').toUpperCase(),
        producto.unidad,
      );
    });
    res.json({ success: true, imported: productos.length });
  } catch (error) {
    sendError(res, 'Error al guardar en base de datos', 500);
  }
});

export default router;
