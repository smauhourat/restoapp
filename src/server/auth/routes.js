import express from 'express';
import {
  login, logout, refresh,
  crearEmpresa, crearUsuario, listarUsuarios,
  toggleEmpresaActivo, toggleUsuarioActivo, eliminarUsuario,
} from './service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendError } from '../utils/http.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return sendError(res, 'Email y contraseña son requeridos');
  }

  try {
    const result = login(email, password);
    res.json(result);
  } catch (err) {
    return sendError(res, err.message, 401);
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refresh_token } = req.body ?? {};

  if (!refresh_token) {
    return sendError(res, 'refresh_token es requerido');
  }

  try {
    const result = refresh(refresh_token);
    res.json(result);
  } catch (err) {
    return sendError(res, err.message, 401);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const { refresh_token } = req.body ?? {};
  logout(refresh_token);
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({
    id: req.user.sub,
    nombre: req.user.nombre,
    email: req.user.email,
    rol: req.user.rol,
    empresa_nombre: req.user.empresa_nombre,
    tenant_id: req.user.tenant_id,
  });
});

// POST /api/auth/empresas — solo superadmin
router.post('/empresas', authenticate, authorize('superadmin'), (req, res) => {
  const { nombre, admin_email, admin_password, admin_nombre } = req.body ?? {};

  if (!nombre || !admin_email || !admin_password || !admin_nombre) {
    return sendError(res, 'nombre, admin_email, admin_password y admin_nombre son requeridos');
  }

  try {
    const result = crearEmpresa(nombre, admin_email, admin_password, admin_nombre);
    res.status(201).json(result);
  } catch (err) {
    return sendError(res, err.message);
  }
});

// POST /api/auth/usuarios — admin de empresa crea usuarios en su tenant
router.post('/usuarios', authenticate, authorize('superadmin', 'admin'), (req, res) => {
  const { email, password, nombre, rol } = req.body ?? {};

  if (!email || !password || !nombre || !rol) {
    return sendError(res, 'email, password, nombre y rol son requeridos');
  }

  const rolesPermitidos = ['operador', 'visor', 'admin'];
  if (!rolesPermitidos.includes(rol)) {
    return sendError(res, `Rol inválido. Debe ser: ${rolesPermitidos.join(', ')}`);
  }

  // Admin solo puede crear usuarios en su propia empresa
  const empresaId = req.user.rol === 'superadmin' ? (req.body.empresa_id ?? null) : req.user.tenant_id;
  if (!empresaId) {
    return sendError(res, 'empresa_id es requerido para superadmin');
  }

  try {
    const id = crearUsuario(empresaId, email, password, nombre, rol);
    res.status(201).json({ id });
  } catch (err) {
    return sendError(res, err.message);
  }
});

// GET /api/auth/usuarios — admin ve usuarios de su empresa
router.get('/usuarios', authenticate, authorize('superadmin', 'admin'), (req, res) => {
  const empresaId = req.user.rol === 'superadmin'
    ? req.query.empresa_id
    : req.user.tenant_id;

  if (!empresaId) {
    return sendError(res, 'empresa_id es requerido');
  }

  try {
    const usuarios = listarUsuarios(empresaId);
    res.json(usuarios);
  } catch (err) {
    return sendError(res, err.message);
  }
});

// PATCH /api/auth/empresas/:id/activo — toggle empresa activo (solo superadmin)
router.patch('/empresas/:id/activo', authenticate, authorize('superadmin'), (req, res) => {
  const { activo } = req.body ?? {};
  if (activo === undefined || activo === null) {
    return sendError(res, 'activo es requerido');
  }
  try {
    toggleEmpresaActivo(req.params.id, activo);
    res.json({ success: true });
  } catch (err) {
    return sendError(res, err.message);
  }
});

// PATCH /api/auth/usuarios/:id/activo — toggle usuario activo
router.patch('/usuarios/:id/activo', authenticate, authorize('superadmin', 'admin'), (req, res) => {
  const { activo } = req.body ?? {};
  if (activo === undefined || activo === null) {
    return sendError(res, 'activo es requerido');
  }
  try {
    toggleUsuarioActivo(req.params.id, activo);
    res.json({ success: true });
  } catch (err) {
    return sendError(res, err.message);
  }
});

// DELETE /api/auth/usuarios/:id — eliminar usuario
router.delete('/usuarios/:id', authenticate, authorize('superadmin', 'admin'), (req, res) => {
  try {
    eliminarUsuario(req.params.id);
    res.json({ success: true });
  } catch (err) {
    return sendError(res, err.message);
  }
});

export default router;
