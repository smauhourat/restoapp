
# RestoApp - Memoria del Proyecto

## Stack
- **Frontend**: React 19 + MUI 7 + React Router 7 + Axios
- **Backend**: Express 5 + better-sqlite3 (síncrono) + Zod
- **DB**: SQLite via better-sqlite3

## Arquitectura Multi-Tenant (implementada en feature/multi-tenant)
- **Estrategia**: DB separada por tenant (`data/tenants/tenant_{uuid}.db`)
- **Auth DB**: `src/server/data/auth.db` — empresas, usuarios, refresh_tokens
- **JWT**: access_token (15m) + refresh_token (7d), rotación en cada refresh
- **Roles**: superadmin, admin, operador, visor
- Ver detalles en [architecture.md](architecture.md)

## Patrones importantes
- `req.tenantDb` → DB del tenant inyectada por middleware `authenticate`
- `getAuthDb()` / `getTenantDb(tenantId)` en `src/server/db.js`
- Todas las rutas de negocio tienen `router.use(authenticate)` al inicio
- `.env` está en la raíz del proyecto (lo lee dotenv al arrancar desde raíz)

## Archivos clave
- `src/server/db.js` — getAuthDb + getTenantDb con cache
- `src/server/auth/service.js` — login, refresh, logout, crearEmpresa
- `src/server/middleware/auth.js` — authenticate + authorize
- `src/context/AuthContext.js` — estado de auth en frontend
- `src/api/client.js` — interceptors JWT + refresh automático

## Scripts
- `npm run server` — arrancar backend (desde raíz)
- `npm run migrate` — migración inicial (ejecutar UNA sola vez)
- `npm start` — frontend

## Credenciales iniciales (demo)
- admin@demo.com / Admin1234!  (empresa: Restaurante Demo)
- superadmin@restoapp.com / SuperAdmin1234!
