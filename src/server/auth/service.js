import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getAuthDb, getTenantDb } from '../db.js';
import { sendPasswordResetEmail } from '../utils/email.js';

const ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
}

function slugify(nombre) {
  return nombre
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ─── Login ──────────────────────────────────────────────────────────────────
export function login(email, password) {
  const db = getAuthDb();

  const usuario = db.prepare(`
    SELECT u.*, e.nombre as empresa_nombre
    FROM usuarios u
    LEFT JOIN empresas e ON u.empresa_id = e.id
    WHERE u.email = ? AND u.activo = 1
  `).get(email.toLowerCase().trim());

  if (!usuario) {
    throw new Error('Credenciales inválidas');
  }

  const passwordValido = bcrypt.compareSync(password, usuario.password_hash);
  if (!passwordValido) {
    throw new Error('Credenciales inválidas');
  }

  const tokenPayload = {
    sub: usuario.id,
    tenant_id: usuario.empresa_id,
    rol: usuario.rol,
    empresa_nombre: usuario.empresa_nombre ?? 'Sistema',
    nombre: usuario.nombre,
    email: usuario.email,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({ sub: usuario.id });

  // Guardar refresh token hasheado
  const tokenHash = bcrypt.hashSync(refreshToken, 8);
  const expiraEn = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS).toISOString();

  db.prepare(`
    INSERT INTO refresh_tokens (id, usuario_id, token_hash, expira_en)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), usuario.id, tokenHash, expiraEn);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      empresa_nombre: usuario.empresa_nombre ?? 'Sistema',
      tenant_id: usuario.empresa_id,
    },
  };
}

// ─── Refresh ─────────────────────────────────────────────────────────────────
export function refresh(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new Error('Refresh token inválido o expirado');
  }

  const db = getAuthDb();

  // Buscar tokens válidos del usuario
  const tokens = db.prepare(`
    SELECT * FROM refresh_tokens
    WHERE usuario_id = ? AND revocado = 0 AND expira_en > datetime('now')
  `).all(payload.sub);

  const tokenValido = tokens.find((t) => bcrypt.compareSync(refreshToken, t.token_hash));
  if (!tokenValido) {
    throw new Error('Refresh token inválido o expirado');
  }

  // Revocar el token usado (rotación)
  db.prepare('UPDATE refresh_tokens SET revocado = 1 WHERE id = ?').run(tokenValido.id);

  const usuario = db.prepare(`
    SELECT u.*, e.nombre as empresa_nombre
    FROM usuarios u
    LEFT JOIN empresas e ON u.empresa_id = e.id
    WHERE u.id = ? AND u.activo = 1
  `).get(payload.sub);

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  const newPayload = {
    sub: usuario.id,
    tenant_id: usuario.empresa_id,
    rol: usuario.rol,
    empresa_nombre: usuario.empresa_nombre ?? 'Sistema',
    nombre: usuario.nombre,
    email: usuario.email,
  };

  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken({ sub: usuario.id });

  const tokenHash = bcrypt.hashSync(newRefreshToken, 8);
  const expiraEn = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS).toISOString();

  db.prepare(`
    INSERT INTO refresh_tokens (id, usuario_id, token_hash, expira_en)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), usuario.id, tokenHash, expiraEn);

  return { access_token: newAccessToken, refresh_token: newRefreshToken };
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export function logout(refreshToken) {
  if (!refreshToken) return;

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return; // Token expirado o inválido, logout igualmente
  }

  const db = getAuthDb();
  const tokens = db.prepare(`
    SELECT * FROM refresh_tokens
    WHERE usuario_id = ? AND revocado = 0
  `).all(payload.sub);

  for (const t of tokens) {
    if (bcrypt.compareSync(refreshToken, t.token_hash)) {
      db.prepare('UPDATE refresh_tokens SET revocado = 1 WHERE id = ?').run(t.id);
      break;
    }
  }
}

// ─── Crear empresa (solo superadmin) ─────────────────────────────────────────
export function crearEmpresa(nombre, adminEmail, adminPassword, adminNombre) {
  const db = getAuthDb();

  const empresaId = uuidv4();
  let slug = slugify(nombre);

  // Asegurar slug único
  const slugExiste = db.prepare('SELECT id FROM empresas WHERE slug = ?').get(slug);
  if (slugExiste) {
    slug = `${slug}-${empresaId.slice(0, 8)}`;
  }

  db.prepare(`
    INSERT INTO empresas (id, nombre, slug) VALUES (?, ?, ?)
  `).run(empresaId, nombre.trim(), slug);

  // Crear admin de la empresa
  const adminId = crearUsuario(empresaId, adminEmail, adminPassword, adminNombre, 'admin');

  // Inicializar la DB del tenant (crea el archivo y las tablas)
  getTenantDb(empresaId);

  return { empresa_id: empresaId, slug, admin_id: adminId };
}

// ─── Crear usuario ────────────────────────────────────────────────────────────
export function crearUsuario(empresaId, email, password, nombre, rol) {
  const db = getAuthDb();

  const emailNorm = email.toLowerCase().trim();
  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(emailNorm);
  if (existe) {
    throw new Error(`El email ${emailNorm} ya está registrado`);
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const usuarioId = uuidv4();

  db.prepare(`
    INSERT INTO usuarios (id, empresa_id, email, password_hash, nombre, rol)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(usuarioId, empresaId, emailNorm, passwordHash, nombre.trim(), rol);

  return usuarioId;
}

// ─── Listar usuarios de una empresa ──────────────────────────────────────────
export function listarUsuarios(empresaId) {
  const db = getAuthDb();
  return db.prepare(`
    SELECT id, email, nombre, rol, activo, creado_en
    FROM usuarios
    WHERE empresa_id = ?
    ORDER BY nombre ASC
  `).all(empresaId);
}

// ─── Toggle activo empresa ────────────────────────────────────────────────────
export function toggleEmpresaActivo(empresaId, activo) {
  const db = getAuthDb();
  const result = db.prepare('UPDATE empresas SET activo = ? WHERE id = ?').run(activo ? 1 : 0, empresaId);
  if (result.changes === 0) throw new Error('Empresa no encontrada');
}

// ─── Toggle activo usuario ────────────────────────────────────────────────────
export function toggleUsuarioActivo(usuarioId, activo) {
  const db = getAuthDb();
  const result = db.prepare('UPDATE usuarios SET activo = ? WHERE id = ?').run(activo ? 1 : 0, usuarioId);
  if (result.changes === 0) throw new Error('Usuario no encontrado');
}

// ─── Eliminar usuario ─────────────────────────────────────────────────────────
export function eliminarUsuario(usuarioId) {
  const db = getAuthDb();
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(usuarioId);
}

// ─── Solicitar reset de contraseña ───────────────────────────────────────────
export function solicitarReset(email) {
  const db = getAuthDb();

  const usuario = db.prepare(
    `SELECT id, nombre, email FROM usuarios WHERE email = ? AND activo = 1`
  ).get(email.toLowerCase().trim());

  // Si no existe el usuario, no hacemos nada (anti-enumeración)
  if (!usuario) return;

  // Eliminar tokens previos del usuario
  db.prepare(`DELETE FROM password_reset_tokens WHERE usuario_id = ?`)
    .run(usuario.id);

  // Generar token seguro (256 bits de entropía)
  const tokenRaw = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
  const expiraEn = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1 hora

  db.prepare(`
    INSERT INTO password_reset_tokens (id, usuario_id, token_hash, expira_en)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), usuario.id, tokenHash, expiraEn);

  const resetUrl = `${process.env.APP_URL}/reset-password/${tokenRaw}`;

  // Envío asíncrono — no bloquea la respuesta HTTP
  sendPasswordResetEmail(usuario.email, usuario.nombre, resetUrl)
    .catch(err => console.error('[email] Error al enviar reset:', err.message));
}

// ─── Resetear contraseña con token ───────────────────────────────────────────
export function resetPassword(tokenRaw, nuevaPassword) {
  const db = getAuthDb();
  const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');

  const registro = db.prepare(`
    SELECT id, usuario_id, expira_en, usado
    FROM password_reset_tokens
    WHERE token_hash = ?
  `).get(tokenHash);

  if (!registro)        throw new Error('TOKEN_INVALIDO');
  if (registro.usado)   throw new Error('TOKEN_YA_USADO');
  if (new Date(registro.expira_en) < new Date()) throw new Error('TOKEN_EXPIRADO');

  const nuevaHash = bcrypt.hashSync(nuevaPassword, 10);

  db.transaction(() => {
    db.prepare(`UPDATE usuarios SET password_hash = ? WHERE id = ?`)
      .run(nuevaHash, registro.usuario_id);
    db.prepare(`UPDATE password_reset_tokens SET usado = 1 WHERE id = ?`)
      .run(registro.id);
    // Revocar todas las sesiones activas del usuario
    db.prepare(`UPDATE refresh_tokens SET revocado = 1 WHERE usuario_id = ?`)
      .run(registro.usuario_id);
  })();
}
