import jwt from 'jsonwebtoken';
import { getTenantDb } from '../db.js';
import { sendError } from '../utils/http.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return sendError(res, 'Token de autenticación requerido', 401);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;

    // Inyectar tenantDb solo si el usuario pertenece a un tenant
    if (payload.tenant_id) {
      req.tenantDb = getTenantDb(payload.tenant_id);
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token expirado', 401);
    }
    return sendError(res, 'Token inválido', 401);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'No autenticado', 401);
    }
    if (!roles.includes(req.user.rol)) {
      return sendError(res, 'No tiene permisos para esta acción', 403);
    }
    next();
  };
}
