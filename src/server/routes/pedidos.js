import express from 'express';
import db from '../db.js';
import { validateRequest } from '../middleware/validate.js';
import { sendError } from '../utils/http.js';
import {
  listPedidosSchema,
  createPedidoSchema,
  pedidoIdParamSchema,
  updateEstadoSchema,
  createEnvioSchema,
  historialEnviosSchema,
} from '../validators/pedidos.js';

const router = express.Router();

// GET /api/pedidos con paginación
router.get('/', validateRequest(listPedidosSchema), (req, res) => {
  const { page, perPage } = req.validated.query;
  const offset = (page - 1) * perPage;

  const pedidos = db.prepare(`
    SELECT p.id, p.numero_pedido, p.fecha, pr.nombre as proveedor, p.estado, p.total, (select count(*) from Pedido_Renglon where pedido_id = p.id) as cantidad_renglones
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
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
});

// Crear un nuevo pedido
router.post('/', validateRequest(createPedidoSchema), (req, res) => {
  const { numero_pedido, fecha, proveedor_id, renglones } = req.validated.body;

  const dbTransaction = db.transaction(() => {
    const stmtPedido = db.prepare(`
      INSERT INTO Pedido (numero_pedido, fecha, proveedor_id, estado)
      VALUES (?, ?, ?, 'pendiente')
    `);
    const result = stmtPedido.run(numero_pedido, fecha, proveedor_id);
    const pedidoId = result.lastInsertRowid;

    const stmtRenglon = db.prepare(`
      INSERT INTO Pedido_Renglon (pedido_id, producto_id, cantidad, precio_unitario)
      VALUES (?, ?, ?, ?)
    `);

    let total = 0;
    renglones.forEach((renglon) => {
      stmtRenglon.run(pedidoId, renglon.producto_id, renglon.cantidad, renglon.precio_unitario);
      total += renglon.cantidad * renglon.precio_unitario;
    });

    db.prepare('UPDATE Pedido SET total = ? WHERE id = ?').run(total, pedidoId);
    return { id: pedidoId };
  });

  try {
    const result = dbTransaction();
    res.json(result);
  } catch (err) {
    sendError(res, err.message || 'No se pudo crear el pedido');
  }
});

// Obtener detalles de un pedido (con renglones)
router.get('/:id', validateRequest(pedidoIdParamSchema), (req, res) => {
  const { id } = req.validated.params;
  const pedido = db.prepare(`
    SELECT p.*, pr.nombre as proveedor_nombre
    FROM Pedido p
    JOIN Proveedor pr ON p.proveedor_id = pr.id
    WHERE p.id = ?
  `).get(id);

  if (!pedido) {
    return sendError(res, 'Pedido no encontrado', 404);
  }

  const renglones = db.prepare(`
    SELECT pr.*, pd.nombre as producto_nombre, pd.descripcion as producto_descripcion, pd.unidad_medida as producto_unidad_medida
    FROM Pedido_Renglon pr
    JOIN Producto pd ON pr.producto_id = pd.id
    WHERE pr.pedido_id = ?
  `).all(id);

  res.json({ ...pedido, renglones });
});

// Actualizar estado de un pedido
router.patch('/:id/estado', validateRequest(updateEstadoSchema), (req, res) => {
  const { id } = req.validated.params;
  const { estado } = req.validated.body;

  const result = db.prepare('UPDATE Pedido SET estado = ? WHERE id = ?').run(estado, id);

  if (result.changes === 0) {
    return sendError(res, 'Pedido no encontrado', 404);
  }

  res.json({ success: true });
});


// Registrar envío
router.post('/:id/envios', validateRequest(createEnvioSchema), (req, res) => {
  const { id } = req.validated.params;
  const { metodo_envio, destinatario } = req.validated.body;

  const pedidoExiste = db.prepare('SELECT id FROM Pedido WHERE id = ?').get(id);
  if (!pedidoExiste) {
    return sendError(res, 'Pedido no encontrado', 404);
  }

  db.prepare(`
    INSERT INTO HistorialEnvios (pedido_id, metodo_envio, destinatario)
    VALUES (?, ?, ?)
  `).run(id, metodo_envio, destinatario);

  res.json({ success: true });
});

// Obtener historial de un pedido
router.get('/:id/envios', validateRequest(historialEnviosSchema), (req, res) => {
  const { id } = req.validated.params;

  const pedidoExiste = db.prepare('SELECT id FROM Pedido WHERE id = ?').get(id);
  if (!pedidoExiste) {
    return sendError(res, 'Pedido no encontrado', 404);
  }

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
