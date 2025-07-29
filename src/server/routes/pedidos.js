import express from 'express';
import db from '../db.js';

const router = express.Router();

// Obtener todos los pedidos
// router.get('/', (req, res) => {
//     const pedidos = db.prepare(`
//     SELECT p.id, p.numero_pedido, p.fecha, pr.nombre as proveedor, p.estado, p.total
//     FROM Pedido p
//     JOIN Proveedor pr ON p.proveedor_id = pr.id
//   `).all();
//     res.json(pedidos);
// });

// GET /api/pedidos con paginación
router.get('/', (req, res) => {
  const { page = 1, perPage = 10 } = req.query;
  const offset = (page - 1) * perPage;

  const pedidos = db.prepare(`
    SELECT p.id, p.numero_pedido, p.fecha, pr.nombre as proveedor, p.estado, p.total
    FROM Pedido p
    JOIN Proveedor pr ON p.proveedor_id = pr.id
    ORDER BY p.numero_pedido DESC
    LIMIT ? OFFSET ?
  `).all(perPage, offset);

  const total = db.prepare(`
    SELECT COUNT(*) as total FROM Pedido p
    JOIN Proveedor pr ON p.proveedor_id = pr.id
  `).get().total;

  res.json({
    data: pedidos,
    total,
    page: parseInt(page),
    perPage: parseInt(perPage),
    totalPages: Math.ceil(total / perPage),
  });
});

// Crear un nuevo pedido
router.post('/', (req, res) => {
    const { numero_pedido, fecha, proveedor_id, renglones } = req.body;
    const dbTransaction = db.transaction(() => {
        // Insertar cabecera
        const stmtPedido = db.prepare(`
      INSERT INTO Pedido (numero_pedido, fecha, proveedor_id, estado)
      VALUES (?, ?, ?, 'pendiente')
    `);
        const result = stmtPedido.run(numero_pedido, fecha, proveedor_id);
        const pedido_id = result.lastInsertRowid;

        // Insertar renglones
        const stmtRenglon = db.prepare(`
      INSERT INTO Pedido_Renglon (pedido_id, producto_id, cantidad, precio_unitario)
      VALUES (?, ?, ?, ?)
    `);

        let total = 0;
        renglones.forEach((renglon) => {
            stmtRenglon.run(pedido_id, renglon.producto_id, renglon.cantidad, renglon.precio_unitario);
            total += renglon.cantidad * renglon.precio_unitario;
        });

        // Actualizar total del pedido
        db.prepare('UPDATE Pedido SET total = ? WHERE id = ?').run(total, pedido_id);
        return { id: pedido_id };
    });

    try {
        const result = dbTransaction();
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Obtener detalles de un pedido (con renglones)
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const pedido = db.prepare(`
    SELECT p.*, pr.nombre as proveedor_nombre
    FROM Pedido p
    JOIN Proveedor pr ON p.proveedor_id = pr.id
    WHERE p.id = ?
  `).get(id);

    const renglones = db.prepare(`
    SELECT pr.*, pd.nombre as producto_nombre
    FROM Pedido_Renglon pr
    JOIN Producto pd ON pr.producto_id = pd.id
    WHERE pr.pedido_id = ?
  `).all(id);

    res.json({ ...pedido, renglones });
});

// Actualizar estado de un pedido
router.patch('/:id/estado', (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    db.prepare('UPDATE Pedido SET estado = ? WHERE id = ?').run(estado, id);
    res.json({ success: true });
});


// Registrar envío
router.post('/:id/envios', (req, res) => {
    const { id } = req.params;
    const { metodo_envio, destinatario } = req.body;

    db.prepare(`
    INSERT INTO HistorialEnvios (pedido_id, metodo_envio, destinatario)
    VALUES (?, ?, ?)
  `).run(id, metodo_envio, destinatario);

    res.json({ success: true });
});

// Obtener historial de un pedido
router.get('/:id/envios', (req, res) => {
    const { id } = req.params;
    const historial = db.prepare(`
    SELECT * FROM HistorialEnvios WHERE pedido_id = ?
  `).all(id);

    res.json(historial);
});

// Generar Nro Pedido
router.post('/nropedido', (req, res) => {

  const inserted = db.prepare(`
    INSERT INTO NrosPedidos (estado)
    VALUES (?)
  `).run('ok');

  const result = db.prepare(`
    SELECT nro_pedido FROM NrosPedidos WHERE id = ?
    `).get(inserted.lastInsertRowid)


  //console.log('inserted id =>', result)
  res.json(result);
});

export default router;