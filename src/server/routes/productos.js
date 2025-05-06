import express from 'express';
import db from '../db.js';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';

const upload = multer({ dest: 'uploads/' }); // Carpeta temporal
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
    SELECT Producto.*, '' as proveedor FROM Producto
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

router.post('/importar', upload.single('archivo'), (req, res) => {
  console.log('entro en la api de importacion')
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Validar estructura mínima
    const validatedData = data.map(row => ({
      nombre: row.Nombre || row.nombre || 'Sin nombre',
      descripcion: row.Descripcion || row.descripcion || '',
      precio: parseFloat(row.Precio || row.precio) || 0,
      unidad: row.Unidad || row.unidad || 'unidad'
    }));

    console.log('req.file.path=>', req.file.path)

    fs.unlinkSync(req.file.path); // Limpiar archivo temporal

    res.json({
      success: true,
      data: validatedData,
      preview: true // Indica que es una previsualización
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para confirmar importación
router.post('/confirmar-importacion', (req, res) => {
  const { productos } = req.body;

  const stmt = db.prepare(`
    INSERT INTO Producto (nombre, descripcion, precio_unitario, unidad_medida)
    VALUES (?, ?, ?, ?)
  `);

  try {
    productos.forEach(producto => {
      stmt.run(
        producto.nombre,
        producto.descripcion,
        producto.precio,
        producto.unidad
      );
    });
    res.json({ success: true, imported: productos.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar en base de datos' });
  }
});

export default router;