import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/dashboard', (req, res) => {

    const stats = db.prepare(`
        SELECT 
            (SELECT COUNT(*) FROM Proveedor) AS total_proveedores,
            (SELECT COUNT(*) FROM Producto) AS total_productos,
            (SELECT COUNT(*) FROM Pedido) AS total_pedidos,
            (SELECT COUNT(*) FROM Pedido WHERE estado = 'pendiente') AS pedidos_pendientes,
            (SELECT COUNT(*) FROM Pedido WHERE estado = 'enviado') AS pedidos_enviados,
            (SELECT COUNT(*) FROM Pedido WHERE estado = 'recibido') AS pedidos_recibidos
    `).get();
    
    res.json(stats);
});

export default router;