import express from 'express';
import db from '../db.js';

const router = express.Router();

// Obtener todos los pedidos
router.get('/', (req, res) => {
    const pedidos = db.prepare(`
    SELECT p.id, p.numero_pedido, p.fecha, pr.nombre as proveedor, p.estado, p.total
    FROM Pedido p
    JOIN Proveedor pr ON p.proveedor_id = pr.id
  `).all();
    res.json(pedidos);
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


export default router;