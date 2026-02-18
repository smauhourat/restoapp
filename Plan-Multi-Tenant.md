# 2. Modelo de datos de autenticación (auth.db)

### Empresas (tenants)
```
CREATE TABLE empresas (
  id        TEXT PRIMARY KEY,          -- UUID v4
  nombre    TEXT NOT NULL,
  slug      TEXT UNIQUE NOT NULL,      -- "la-parrilla" para URLs amigables
  activo    INTEGER DEFAULT 1,
  creado_en TEXT DEFAULT (datetime('now'))
);
```
### Usuarios
```
CREATE TABLE usuarios (
  id           TEXT PRIMARY KEY,       -- UUID v4
  empresa_id   TEXT NOT NULL REFERENCES empresas(id),
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,         -- bcrypt
  nombre       TEXT NOT NULL,
  rol          TEXT NOT NULL CHECK(rol IN ('admin', 'operador', 'visor')),
  activo       INTEGER DEFAULT 1,
  creado_en    TEXT DEFAULT (datetime('now'))
);
```

### Refresh tokens (para renovar JWT sin re-login)
```
CREATE TABLE refresh_tokens (
  id         TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  token_hash TEXT NOT NULL,
  expira_en  TEXT NOT NULL,
  revocado   INTEGER DEFAULT 0
);
```
# 3. Flujo de autenticación JWT

### [Login]  
  POST /api/auth/login { email, password }  
  → Verifica credenciales en auth.db  
  → Genera access_token (15 min) + refresh_token (7 días)  
  → access_token payload: { sub: userId, tenant_id, rol, empresa_nombre }  

### [Request autenticado]  
  Authorization: Bearer <access_token>  
  → Middleware extrae tenant_id del token  
  → Abre conexión a tenant_<id>.db  
  → Inyecta db en req.tenantDb  
  → El route handler usa req.tenantDb (jamás la DB de otro tenant)  
  

### [Renovar token]  
  POST /api/auth/refresh { refresh_token }  
  → Nuevo access_token sin re-login  

### [Logout]  
  POST /api/auth/logout  
  → Revoca refresh_token en auth.db  


# 4. Middleware de tenant
### Este es el núcleo de la arquitectura. Cada request autenticado pasa por:

```
// src/server/middleware/auth.js
import jwt from 'jsonwebtoken';
import { getAuthDb, getTenantDb } from '../db.js';

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;                    // { sub, tenant_id, rol }
    req.tenantDb = getTenantDb(payload.tenant_id); // DB del tenant
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    next();
  };
}

// src/server/db.js (refactorizado)
const dbCache = new Map();

export function getTenantDb(tenantId) {
  if (!dbCache.has(tenantId)) {
    const db = new Database(`./data/tenants/tenant_${tenantId}.db`);
    db.pragma('foreign_keys = ON');
    initTenantDb(db); // crea tablas si no existen
    dbCache.set(tenantId, db);
  }
  return dbCache.get(tenantId);
}

export function getAuthDb() { /* singleton para auth.db */ }  
```
El cache de conexiones es crítico: better-sqlite3 es síncrono y abrir/cerrar la DB en cada request sería ineficiente.  


# 5. Adaptación de las rutas existentes
El cambio en las rutas es mínimo: reemplazar la DB global por req.tenantDb:

```
// ANTES (src/server/routes/productos.js)
import db from '../db.js';

router.get('/', (req, res) => {
  const productos = db.prepare('SELECT * FROM Producto').all();
  // ...
});

// DESPUÉS
import { authenticate } from '../middleware/auth.js';

router.use(authenticate); // protege todas las rutas del módulo

router.get('/', (req, res) => {
  const productos = req.tenantDb.prepare('SELECT * FROM Producto').all();
  // ...
});
```


# 6. Estructura de carpetas propuesta
```
src/server/
  auth/
    routes.js          ← POST /login, /logout, /refresh, /register
    service.js         ← lógica de negocio de auth
  middleware/
    auth.js            ← authenticate + authorize (nuevo)
    validate.js        ← sin cambios
  data/
    auth.db            ← nuevo
    tenants/           ← creado automáticamente al registrar empresa
  routes/              ← sin cambios estructurales, solo usan req.tenantDb
  models.js            ← separar en authModels.js + tenantModels.js
  db.js                ← refactorizar con getAuthDb + getTenantDb + cache
```
  
No se necesita agregar WHERE tenant_id = ? a ninguna query existente — el aislamiento lo da la DB separada.


# 7. Frontend: AuthContext
```
// src/context/AuthContext.js
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { nombre, rol, empresa }

  const login = async (email, password) => {
    const { data } = await client.post('/api/auth/login', { email, password });
    localStorage.setItem('access_token', data.access_token);
    setUser(data.user);
  };

  // El access_token va automático via interceptor en src/api/client.js
}
```
```
// src/api/client.js — agregar interceptor (ya tiene la estructura)
client.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

# 8. Roles sugeridos

|Rol|Permisos|   
| :----------- |:--------------|
| admin | Gestión completa + usuarios + configuración|  
|operador|	Crear/editar pedidos, proveedores, productos|  
|visor|	Solo lectura, ver estadísticas|  


# 9. Paquetes a agregar

### Backend
```
npm install jsonwebtoken bcryptjs uuid
```

### Frontend (si se necesita)  
No se requieren paquetes adicionales de auth

# 10. Orden de implementación recomendado
1. Refactorizar db.js → getAuthDb() + getTenantDb(tenantId) con cache  
2. Crear auth.db con tablas de empresas, usuarios y refresh tokens  
3. Implementar rutas de auth (/login, /logout, /refresh)  
4. Crear middleware authenticate y authorize  
5. Agregar router.use(authenticate) a las rutas existentes  
6. Frontend: AuthContext + pantalla de login + interceptor en Axios  
7. Provisioning de tenants: endpoint admin para crear empresa + DB  

## Consideraciones de escala  

< 50 tenants: Esta arquitectura funciona perfectamente sin cambios.  
> 50 tenants: El cache de conexiones empieza a consumir memoria. Se puede implementar un LRU cache con límite (ej: lru-cache), cerrando las DB menos usadas.  

Migración futura a PostgreSQL: Con DB separada por tenant el código de queries no cambia. Solo cambia getTenantDb() para devolver una conexión PG a un schema separado.



# Plan: Multi-Tenant + Autenticación para RestoApp
## Contexto  
La app actualmente no tiene autenticación ni aislamiento de datos entre empresas.
Se implementará multi-tenancy con DB separada por tenant (mejor opción para SQLite) y autenticación con JWT + roles.

La DB existente (proveedores_v2.db) se convertirá en el tenant inicial.
Un superadmin global podrá crear nuevas empresas desde un endpoint protegido.

Arquitectura resultante

```
src/server/
  auth/
    routes.js       ← POST /login, /logout, /refresh, /register-empresa
    service.js      ← lógica de negocio auth
    models.js       ← schema de auth.db
  middleware/
    auth.js         ← authenticate() + authorize()  [NUEVO]
    validate.js     ← sin cambios
  data/
    auth.db         ← usuarios, empresas, refresh_tokens  [NUEVO]
    tenants/
      tenant_{uuid}.db  ← una DB por empresa
  db.js             ← refactorizado: getAuthDb() + getTenantDb()
  server.js         ← agregar rutas auth, init auth.db
  routes/           ← pequeño cambio: db → req.tenantDb
  
```

```
src/
  context/AuthContext.js    [NUEVO]
  components/
    LoginPage.js            [NUEVO]
    ProtectedRoute.js       [NUEVO]
    ResponsiveNavbar.js     [agregar logout + info usuario]
  api/client.js             [agregar interceptor JWT + manejo 401]
  App.js                    [agregar AuthProvider + rutas protegidas]
```

## Pasos de implementación

### PASO 1 — Preparar estructura de carpetas y dependencias
Carpetas a crear:

```
src/server/auth/
src/server/data/
src/server/data/tenants/
```
Dependencias a agregar (en src/server/package.json):
```
jsonwebtoken — generar/verificar JWT
bcryptjs — hashear passwords
uuid — generar IDs de tenant/usuario
```
Variables de entorno (.env):

```
JWT_SECRET=<string largo aleatorio>  
JWT_REFRESH_SECRET=<otro string largo aleatorio>  
JWT_EXPIRES_IN=15m  
JWT_REFRESH_EXPIRES_IN=7d  
SUPERADMIN_SETUP_TOKEN=<token para primer setup>  
```

### PASO 2 — Refactorizar db.js
Archivo: src/server/db.js

Reemplazar el singleton global por dos funciones:

```
// getAuthDb() → singleton para auth.db
// getTenantDb(tenantId) → cache Map de conexiones por tenant
// Las conexiones se cachean para evitar abrir/cerrar en cada request
```
El getTenantDb ejecuta initTenantDatabase(db) (las tablas de negocio) la primera vez que abre una DB de tenant.

### PASO 3 — Crear auth/models.js
Schema de auth.db:

```
empresas: id (UUID), nombre, slug (unique), activo, creado_en
usuarios: id (UUID), empresa_id (FK), email (unique), password_hash, nombre, rol, activo, creado_en
refresh_tokens: id (UUID), usuario_id (FK), token_hash, expira_en, revocado
```
Roles válidos: superadmin, admin, operador, visor
El superadmin tiene empresa_id = NULL.


### PASO 4 — Crear auth/service.js
Funciones:
```
 - login(email, password) → verifica credenciales, genera accessToken + refreshToken
 - refresh(refreshToken) → valida y rota el refresh token
 - logout(refreshToken) → revoca el refresh token
 - crearEmpresa(nombre) → crea empresa + genera tenant DB vacía
 - crearUsuario(empresaId, email, password, nombre, rol) → crea usuario en esa empresa
JWT payload: { sub, tenant_id, rol, empresa_nombre }
```

### PASO 5 — Crear auth/routes.js
Endpoints:

POST /api/auth/login → llama service.login()
POST /api/auth/logout → llama service.logout()
POST /api/auth/refresh → llama service.refresh()
POST /api/auth/empresas → solo superadmin: crea empresa + admin inicial
POST /api/auth/usuarios → admin de empresa: crea usuario en su empresa
GET /api/auth/me → retorna datos del usuario autenticado



### PASO 6 — Crear middleware/auth.js

authenticate(req, res, next):
  - Extrae Bearer token del header
  - Verifica JWT con JWT_SECRET
  - Inyecta req.user = { sub, tenant_id, rol, empresa_nombre }
  - Inyecta req.tenantDb = getTenantDb(tenant_id)  [null si es superadmin]
  - 401 si no hay token o es inválido

authorize(...roles):
  - Middleware factory: verifica que req.user.rol esté en roles[]
  - 403 si no tiene permiso
  
### PASO 7 — Actualizar server.js
Importar getAuthDb, initAuthDatabase
Importar y montar authRoutes en /api/auth
Inicializar auth.db en el arranque
Mantener la inicialización del tenant existente  

### PASO 8 — Actualizar rutas existentes
En los 4 archivos de rutas (pedidos.js, productos.js, proveedores.js, stats.js):

Eliminar import db from '../db.js'
Agregar router.use(authenticate) al inicio
Reemplazar db. por req.tenantDb. en todas las queries
En productos.js, convertir productoExiste() para que reciba db como parámetro

### PASO 9 — Script de migración (setup inicial)
Archivo: src/server/scripts/migrate.js

Script que se ejecuta UNA SOLA VEZ:

Crea data/ y data/tenants/ si no existen
Crea data/auth.db con schema
Genera UUID para la empresa por defecto ("Restaurante Demo")
Copia proveedores_v2.db → data/tenants/tenant_{uuid}.db
Inserta empresa en auth.db
Crea usuario admin por defecto: admin@demo.com / Admin1234!
Crea usuario superadmin: superadmin@restoapp.com / SuperAdmin1234!
Imprime credenciales al finalizar
Script npm: "migrate": "node src/server/scripts/migrate.js"

### PASO 10 — Frontend: AuthContext
Archivo: src/context/AuthContext.js


AuthContext:
  state: { user, isAuthenticated, isLoading }
  user: { nombre, email, rol, empresa_nombre, tenant_id }

  login(email, password):
    - POST /api/auth/login
    - Guarda access_token en localStorage
    - Guarda refresh_token en localStorage (o httpOnly cookie futuro)
    - Setea user en estado

  logout():
    - POST /api/auth/logout
    - Limpia localStorage
    - Navega a /login
	
### PASO 11 — Frontend: actualizar client.js
Agregar dos interceptors:

Request: agrega Authorization: Bearer <token> si hay token
Response error 401: intenta refresh automático, si falla redirige a /login	


### PASO 12 — Frontend: LoginPage.js
Componente con:

Campos email + password
Botón submit con loading state
Muestra error si credenciales incorrectas
Estilo MUI consistente con el resto de la app
Al hacer login exitoso → navega a /

### PASO 13 — Frontend: ProtectedRoute.js

// Wrapper que redirige a /login si no está autenticado
// Opcionalmente acepta prop `roles` para control de acceso por rol
<ProtectedRoute roles={['admin', 'operador']}>
  <MiComponente />
</ProtectedRoute>



### PASO 14 — Frontend: actualizar App.js
Envolver toda la app en <AuthProvider>
Ruta /login pública con <LoginPage>
Todas las demás rutas envueltas en <ProtectedRoute>
<ResponsiveNavbar> recibe info de usuario y botón logout


### PASO 15 — Frontend: actualizar ResponsiveNavbar
Agregar al navbar:

Nombre del usuario + empresa (chip o texto)
Ícono de logout con confirmación
(Opcional) Avatar con inicial del nombre


### Orden crítico de ejecución

1 → instalar deps backend  
2 → db.js (base de todo lo demás)  
3 → auth/models.js  
4 → auth/service.js  
5 → auth/routes.js  
6 → middleware/auth.js  
7 → server.js  
8 → routes/*.js (4 archivos)  
9 → scripts/migrate.js + ejecutar  
10 → client.js (frontend)  
11 → AuthContext.js  
12 → LoginPage.js + ProtectedRoute.js  
13 → App.js  
14 → ResponsiveNavbar.js  

### Verificación
Ejecutar npm run migrate → ver credenciales impresas  
Arrancar backend: npm run server  
POST /api/auth/login con credenciales de admin → recibir tokens  
GET /api/productos sin token → 401  
GET /api/productos con Bearer token → datos del tenant  
Arrancar frontend: npm start  
Navegar a / → redirige a /login  
Login con admin@demo.com → accede a la app con datos existentes  
Login con superadmin → puede crear nueva empresa vía POST /api/auth/empresas  
Crear segunda empresa → verificar que tiene DB propia vacía en data/tenants/  
Verificar que los datos de un tenant NO son visibles desde el otro  

### Archivos críticos a modificar/crear
|Archivo|Acción| 
|src/server/db.js|Refactorizar completo|
src/server/server.js	Agregar auth routes + init  
src/server/routes/pedidos.js	req.tenantDb  
src/server/routes/productos.js	req.tenantDb  
src/server/routes/proveedores.js	req.tenantDb  
src/server/routes/stats.js	req.tenantDb  
src/server/auth/routes.js	Nuevo  
src/server/auth/service.js	Nuevo  
src/server/auth/models.js	Nuevo  
src/server/middleware/auth.js	Nuevo  
src/server/scripts/migrate.js	Nuevo  
src/context/AuthContext.js	Nuevo  
src/components/LoginPage.js	Nuevo  
src/components/ProtectedRoute.js	Nuevo  
src/api/client.js	Agregar interceptors  
src/App.js	AuthProvider + rutas protegidas  
src/components/ResponsiveNavbar.js	Info usuario + logout  



## Implementación completada
### Backend
Archivo	Descripción
src/server/db.js	Refactorizado: getAuthDb() + getTenantDb() con cache
src/server/auth/models.js	Schema de auth.db: empresas, usuarios, refresh_tokens
src/server/auth/service.js	Login, refresh, logout, crearEmpresa, crearUsuario
src/server/auth/routes.js	Endpoints /api/auth/*
src/server/middleware/auth.js	authenticate + authorize
src/server/server.js	Integración completa
src/server/routes/pedidos.js	Usa req.tenantDb
src/server/routes/productos.js	Usa req.tenantDb
src/server/routes/proveedores.js	Usa req.tenantDb
src/server/routes/stats.js	Usa req.tenantDb
src/server/scripts/migrate.js	Script de migración (ya ejecutado)
Frontend

Archivo	Descripción
src/api/client.js	Interceptors JWT + refresh automático
src/context/AuthContext.js	Estado de auth + login/logout
src/components/LoginPage.js	Pantalla de login MUI
src/components/ProtectedRoute.js	Guard de rutas
src/App.js	AuthProvider + rutas protegidas
src/components/ResponsiveNavbar.js	Chip de usuario + botón logout

### Para arrancar

* Backend
npm run server

* Frontend (otra terminal)
npm start
Credenciales iniciales

Admin de empresa:    admin@demo.com      / Admin1234!
Super Admin:         superadmin@restoapp.com / SuperAdmin1234!
El superadmin puede crear nuevas empresas via POST /api/auth/empresas. Cada empresa nueva obtiene su propio archivo .db aislado en src/server/data/tenants/.