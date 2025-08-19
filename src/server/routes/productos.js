import express from 'express';
import db from '../db.js';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import cleanRequestBody from '../lib/helper.js';

const upload = multer({ dest: 'uploads/' }); // Carpeta temporal
const router = express.Router();

const validSortFields = ['nombre', 'descripcion'];
const validOrders = ['asc', 'desc'];

// Helper: Validate product data
const validateProducto = ({ nombre }) => {
  if (!nombre || nombre.length < 3) return 'Nombre debe tener al menos 3 caracteres';
  return null;
};

const productoExiste = (nombre, id = null) => {
  const query = id
    ? `SELECT COUNT(*) as count FROM Producto WHERE nombre = ? AND id != ?`
    : `SELECT COUNT(*) as count FROM Producto WHERE nombre = ?`;  

  const params = id ? [nombre, id] : [nombre];

  const result = db.prepare(query).get(...params);
  return result.count > 0;  
};

// Obtener todos los productos
// GET /api/productos con paginación
router.get('/', (req, res) => {
  const { page = 1, perPage = 99999, sortBy = 'nombre', order = 'asc' } = req.query;
  const offset = (page - 1) * perPage;

  // Validar campos de ordenamiento
  if (!validSortFields.includes(sortBy) || !validOrders.includes(order.toLowerCase())) {
    return res.status(400).json({ error: 'Parámetros de orden inválidos' });
  }
  
  const productos = db.prepare(`
    SELECT 
      Producto.*, 
      (select count(*) from Proveedor_Producto pp where pp.producto_id == Producto.id) as proveedores,
      (select sum(pp.precio_unitario)/count(*) from Proveedor_Producto pp where pp.producto_id == Producto.id) as precio_promedio
    FROM 
      Producto
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
  const { nombre, descripcion, unidad_medida } = cleanRequestBody(req.body);

    // Validaciones básicas
    const error = validateProducto({ nombre });
    if (error) return res.status(400).json({ error });
    if (productoExiste(nombre)) return res.status(400).json({ error: 'El producto ya existe' })    

    const stmt = db.prepare(`
    INSERT INTO Producto (nombre, descripcion, unidad_medida)
    VALUES (?, ?, ?)
  `);
    console.log('Creando producto:', nombre + '$');
    console.log('Creando producto:', nombre.trim() + '$');
    const result = stmt.run(nombre.trim(), descripcion.trim(), unidad_medida);
    console.log('Producto creado:', result);
    res.json({ id: result.lastInsertRowid, nombre, descripcion, unidad_medida });
});

// Actualizar un producto
router.put('/:id', (req, res) => {
    const { id } = req.params;
  const { nombre, descripcion, unidad_medida } = cleanRequestBody(req.body);

    // Validaciones básicas
    const error = validateProducto({ nombre });
    if (error) return res.status(400).json({ error });
    if (productoExiste(nombre, id)) return res.status(400).json({ error: 'El producto ya existe' });


    const stmt = db.prepare(`
    UPDATE Producto 
    SET nombre = ?, descripcion = ?, unidad_medida = ?
    WHERE id = ?
  `);
    stmt.run(nombre, descripcion, unidad_medida, id);
  res.json({ id, nombre, descripcion, unidad_medida  });
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
  
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log('Datos importados:', data);

    // Validar estructura mínima
    const validatedData = data.map(row => ({
      nombre: row.Nombre || row.nombre || 'Sin nombre',
      descripcion: row.Descripcion || row.descripcion || '',
      unidad: row.Unidad || row.unidad || 'unidad'
    }));

    // No permitimos duplicados por la columna 'Nombre'
    const filteredData = validatedData.filter((obj, index, self) =>
      index === self.findIndex((o) => (o["nombre"] === obj["nombre"]))
    );

    fs.unlinkSync(req.file.path); // Limpiar archivo temporal

    res.json({
      success: true,
      data: filteredData,
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
    INSERT INTO Producto (nombre, descripcion, unidad_medida)
    VALUES (?, ?, ?)
  `);

  try {
    productos.forEach(producto => {
      stmt.run(
        producto.nombre,
        producto.descripcion,
        producto.unidad
      );
    });
    res.json({ success: true, imported: productos.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar en base de datos' });
  }
});

export default router;