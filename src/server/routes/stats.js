import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', (req, res) => {
  const db = req.tenantDb;

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM Proveedor) AS total_proveedores,
      (SELECT COUNT(*) FROM Producto) AS total_productos,
      (SELECT COUNT(*) FROM Pedido) AS total_pedidos,
      (SELECT COUNT(*) FROM Pedido WHERE estado = 'pendiente') AS pedidos_pendientes,
      (SELECT COUNT(*) FROM Pedido WHERE estado = 'enviado') AS pedidos_enviados,
      (SELECT COUNT(*) FROM Pedido WHERE estado = 'recibido') AS pedidos_recibidos,
      (SELECT COUNT(*) FROM Pedido WHERE estado = 'cancelado') AS pedidos_cancelados,
      ROUND((SELECT CAST(COUNT(*) AS REAL) FROM Pedido WHERE estado = 'pendiente')*100/(SELECT CAST(COUNT(*) AS REAL) FROM Pedido), 2) AS pedidos_pendientes_porc,
      ROUND((SELECT CAST(COUNT(*) AS REAL) FROM Pedido WHERE estado = 'enviado')*100/(SELECT CAST(COUNT(*) AS REAL) FROM Pedido), 2) AS pedidos_enviados_porc,
      ROUND((SELECT CAST(COUNT(*) AS REAL) FROM Pedido WHERE estado = 'recibido')*100/(SELECT CAST(COUNT(*) AS REAL) FROM Pedido), 2) AS pedidos_recibidos_porc,
      ROUND((SELECT CAST(COUNT(*) AS REAL) FROM Pedido WHERE estado = 'cancelado')*100/(SELECT CAST(COUNT(*) AS REAL) FROM Pedido), 2) AS pedidos_cancelados_porc
  `).get();

  res.json(stats);
});

export default router;
