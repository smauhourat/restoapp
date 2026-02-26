# Plan: Recuperación de Contraseña por Email

## Contexto

RestoApp actualmente no tiene ningún mecanismo para que un usuario recupere su contraseña si la olvidó. El único camino es que un admin la resetee manualmente. Se implementará un flujo estándar de recuperación vía email: el usuario ingresa su email, recibe un enlace único y temporal, y puede establecer una nueva contraseña sin exponer la anterior.

**Estado actual del proyecto:**
- No hay librería de email instalada
- No hay tabla de reset tokens en auth.db
- No hay rutas `/forgot-password` ni `/reset-password` en backend ni frontend

---

## Flujo completo

```
[LoginPage]
   └─ Link "¿Olvidaste tu contraseña?"
         │
         ▼
[ForgotPasswordPage]  POST /api/auth/forgot-password
   └─ Input email → servidor busca usuario → genera token seguro
         │         → hashea y guarda en DB con TTL 1h
         │         → envía email con enlace
         │         → SIEMPRE responde con éxito (evita enumeración)
         │
         ▼
[Email recibido]
   └─ Enlace: http://APP_URL/reset-password/<token-raw-64chars>
         │
         ▼
[ResetPasswordPage]  POST /api/auth/reset-password
   └─ Extrae token de la URL → valida hash + expiración + no usado
         │                  → actualiza password_hash
         │                  → marca token como usado
         │                  → revoca todos los refresh_tokens del usuario
         │
         ▼
[LoginPage] con mensaje de éxito
```

---

## Cambios a implementar

### 1. Instalar dependencia

```bash
npm install nodemailer
```

---

### 2. Variables de entorno — `.env`

Agregar al `.env` existente:

```env
# Email (Recuperación de contraseña)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@email.com
SMTP_PASS=tu_app_password
SMTP_FROM=RestoApp <no-reply@restoapp.com>
APP_URL=http://localhost:3000
```

---

### 3. Nueva tabla en Auth DB — `src/server/auth/models.js`

Agregar en la función `initAuthDatabase(db)`:

```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,      -- SHA-256 del token raw
  expira_en  TEXT NOT NULL,      -- datetime ISO, TTL 1 hora
  usado      INTEGER DEFAULT 0   -- 1 = ya utilizado
);
CREATE INDEX IF NOT EXISTS idx_prt_usuario
  ON password_reset_tokens(usuario_id);
```

**Decisión de seguridad**: Se usa SHA-256 (no bcrypt) porque el token es de 32 bytes aleatorios (alta entropía), por lo que no se necesita el factor de costo de bcrypt. SHA-256 es suficiente y más performante.

---

### 4. Servicio de email — `src/server/utils/email.js` (archivo nuevo)

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(destinatario, nombre, resetUrl) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'RestoApp <no-reply@restoapp.com>',
    to: destinatario,
    subject: 'Recuperación de contraseña — RestoApp',
    text: `Hola ${nombre},\n\nRecibiste este email porque solicitaste restablecer tu contraseña.\n\nUsá el siguiente enlace (válido por 1 hora):\n${resetUrl}\n\nSi no lo solicitaste, ignorá este mensaje.\n`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#05636e">Recuperación de contraseña</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Recibiste este email porque solicitaste restablecer tu contraseña en RestoApp.</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}"
             style="background:#05636e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Restablecer contraseña
          </a>
        </p>
        <p style="color:#666;font-size:13px">
          Este enlace expira en <strong>1 hora</strong>.<br>
          Si no solicitaste este cambio, ignorá este email.
        </p>
        <hr style="border:none;border-top:1px solid #eee">
        <p style="color:#999;font-size:12px">RestoApp</p>
      </div>`,
  });
}
```

---

### 5. Lógica de negocio — `src/server/auth/service.js`

Agregar dos funciones nuevas al final del archivo:

#### `solicitarReset(email)`

```javascript
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/email.js';

export function solicitarReset(email) {
  const db = getAuthDb();

  // Siempre responder igual (anti-enumeración)
  const usuario = db.prepare(
    `SELECT id, nombre, email FROM usuarios WHERE email = ? AND activo = 1`
  ).get(email);

  if (!usuario) return; // No lanzar error, simplemente no hacer nada

  // Limpiar tokens viejos del usuario
  db.prepare(`DELETE FROM password_reset_tokens WHERE usuario_id = ?`)
    .run(usuario.id);

  // Generar token seguro
  const tokenRaw = crypto.randomBytes(32).toString('hex'); // 64 chars
  const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
  const expiraEn = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1h
  const id = uuidv4();

  db.prepare(`
    INSERT INTO password_reset_tokens (id, usuario_id, token_hash, expira_en)
    VALUES (?, ?, ?, ?)
  `).run(id, usuario.id, tokenHash, expiraEn);

  const resetUrl = `${process.env.APP_URL}/reset-password/${tokenRaw}`;
  // Envío asíncrono — no bloquea la respuesta
  sendPasswordResetEmail(usuario.email, usuario.nombre, resetUrl)
    .catch(err => console.error('[email] Error al enviar reset:', err.message));
}
```

#### `resetPassword(tokenRaw, nuevaPassword)`

```javascript
export function resetPassword(tokenRaw, nuevaPassword) {
  const db = getAuthDb();
  const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');

  const registro = db.prepare(`
    SELECT id, usuario_id, expira_en, usado
    FROM password_reset_tokens
    WHERE token_hash = ?
  `).get(tokenHash);

  if (!registro)          throw new Error('TOKEN_INVALIDO');
  if (registro.usado)     throw new Error('TOKEN_YA_USADO');
  if (new Date(registro.expira_en) < new Date()) throw new Error('TOKEN_EXPIRADO');

  const nuevaHash = bcrypt.hashSync(nuevaPassword, 10);

  // Actualizar todo en una transacción
  db.transaction(() => {
    db.prepare(`UPDATE usuarios SET password_hash = ? WHERE id = ?`)
      .run(nuevaHash, registro.usuario_id);
    db.prepare(`UPDATE password_reset_tokens SET usado = 1 WHERE id = ?`)
      .run(registro.id);
    // Revocar todos los refresh tokens del usuario (seguridad)
    db.prepare(`UPDATE refresh_tokens SET revocado = 1 WHERE usuario_id = ?`)
      .run(registro.usuario_id);
  })();
}
```

---

### 6. Rutas nuevas — `src/server/auth/routes.js`

Agregar **antes** del bloque `router.use(authenticate)`:

```javascript
// POST /api/auth/forgot-password — público
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, 400, 'El email es requerido');
  try {
    solicitarReset(email);
    // Siempre responder éxito (anti-enumeración de emails)
    res.json({ message: 'Si el email existe, recibirás un enlace en breve.' });
  } catch (err) {
    sendError(res, 500, 'Error al procesar la solicitud');
  }
});

// POST /api/auth/reset-password — público
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return sendError(res, 400, 'Token y contraseña son requeridos');
  try {
    resetPassword(token, password);
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    const mensajes = {
      TOKEN_INVALIDO:  'El enlace no es válido.',
      TOKEN_YA_USADO:  'Este enlace ya fue utilizado.',
      TOKEN_EXPIRADO:  'El enlace ha expirado. Solicitá uno nuevo.',
    };
    sendError(res, 400, mensajes[err.message] || 'Error al restablecer la contraseña');
  }
});
```

---

### 7. Frontend — `src/components/ForgotPasswordPage.js` (archivo nuevo)

Sigue el patrón exacto de `LoginPage.js`:

```jsx
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, CircularProgress, Link
} from '@mui/material';
import apiClient from '../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [enviado, setEnviado]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setEnviado(true);
    } catch {
      setError('Error al procesar la solicitud. Intentá más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
               justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ width: '100%', maxWidth: 420, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={1}>
            Recuperar contraseña
          </Typography>

          {enviado ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Si el email está registrado, recibirás un enlace en los próximos minutos.
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
              </Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <TextField
                label="Email" type="email" fullWidth required
                value={email} onChange={e => setEmail(e.target.value)}
                autoFocus sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" fullWidth
                      disabled={loading} sx={{ py: 1.5 }}>
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Enviar enlace'}
              </Button>
            </Box>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Volver al inicio de sesión
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
```

---

### 8. Frontend — `src/components/ResetPasswordPage.js` (archivo nuevo)

```jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import apiClient from '../api/client';

export default function ResetPasswordPage() {
  const { token }               = useParams();
  const navigate                = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [exito, setExito]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setLoading(true); setError('');
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setExito(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
               justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ width: '100%', maxWidth: 420, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={3}>
            Nueva contraseña
          </Typography>

          {exito ? (
            <Alert severity="success">
              ¡Contraseña actualizada! Redirigiendo al inicio de sesión...
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <TextField
                label="Nueva contraseña" fullWidth required
                type={showPwd ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                autoFocus sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPwd(s => !s)} edge="end">
                        {showPwd ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                label="Confirmar contraseña" fullWidth required
                type="password"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" fullWidth
                      disabled={loading} sx={{ py: 1.5 }}>
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Restablecer contraseña'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
```

---

### 9. Router — `src/App.js`

Agregar dos rutas públicas (sin `<ProtectedRoute>`):

```jsx
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage  from './components/ResetPasswordPage';

// Junto a la ruta de /login:
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password/:token" element={<ResetPasswordPage />} />
```

---

### 10. LoginPage — `src/components/LoginPage.js`

Agregar link debajo del botón de submit:

```jsx
import { Link as RouterLink } from 'react-router-dom';
import { Link } from '@mui/material';

// Debajo del <Button type="submit">:
<Box sx={{ textAlign: 'center', mt: 1 }}>
  <Link component={RouterLink} to="/forgot-password" variant="body2">
    ¿Olvidaste tu contraseña?
  </Link>
</Box>
```

---

## Archivos a modificar / crear

| Acción    | Archivo |
|-----------|---------|
| Modificar | `src/server/auth/models.js` — agregar tabla `password_reset_tokens` |
| Modificar | `src/server/auth/service.js` — agregar `solicitarReset` y `resetPassword` |
| Modificar | `src/server/auth/routes.js` — agregar 2 rutas públicas |
| Modificar | `src/App.js` — agregar 2 rutas públicas |
| Modificar | `src/components/LoginPage.js` — agregar link |
| Modificar | `.env` — agregar vars SMTP y APP_URL |
| **Crear** | `src/server/utils/email.js` — servicio nodemailer |
| **Crear** | `src/components/ForgotPasswordPage.js` |
| **Crear** | `src/components/ResetPasswordPage.js` |

---

## Seguridad

| Aspecto | Decisión |
|---------|----------|
| Generación del token | `crypto.randomBytes(32)` → hex (256 bits de entropía) |
| Almacenamiento | SHA-256 hash del token (nunca el token raw) |
| TTL | 1 hora |
| Uso único | Campo `usado = 1` tras reset exitoso |
| Anti-enumeración | El backend siempre responde con éxito en `/forgot-password` |
| Invalidación de sesiones | Todos los `refresh_tokens` del usuario se revocan al resetear |
| Token anterior | Al solicitar uno nuevo se elimina el token previo del usuario |

---

## Verificación

1. **Backend**: `npm run server` → POST `/api/auth/forgot-password` con `{"email":"admin@demo.com"}` → debe responder 200 con mensaje genérico y enviar email
2. **Email**: Verificar llegada del email con el enlace `/reset-password/<token>`
3. **Reset**: GET del enlace → formulario → submit → verificar login con nueva contraseña
4. **Casos error**: Token expirado (manipular `expira_en` en DB), token ya usado, token inválido → deben mostrar mensajes descriptivos
5. **Anti-enumeración**: POST `/forgot-password` con email inexistente → mismo 200 genérico
6. **Seguridad**: Después del reset, el refresh_token anterior no debe funcionar para hacer refresh