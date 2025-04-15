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

export default router;