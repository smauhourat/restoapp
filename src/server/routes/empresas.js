import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getAuthDb } from '../db.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('superadmin'));

router.get('/', (req, res) => {
  const db = getAuthDb();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage, 10) || 10));
  const offset = (page - 1) * perPage;

  const empresas = db.prepare(`
    SELECT id, nombre, slug, activo, creado_en
    FROM empresas
    ORDER BY nombre ASC
    LIMIT ? OFFSET ?
  `).all(perPage, offset);

  const { total } = db.prepare(`SELECT COUNT(*) as total FROM empresas`).get();

  res.json({
    data: empresas,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
});

export default router;
