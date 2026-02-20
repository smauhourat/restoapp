# Estado del Proyecto

> Última actualización: 2026-02-20

## Cambios Recientes
Backend

src/server/auth/service.js — 3 nuevas funciones: toggleEmpresaActivo, toggleUsuarioActivo, eliminarUsuario
src/server/auth/routes.js — 3 nuevos endpoints:
PATCH /api/auth/empresas/:id/activo — activar/desactivar empresa (superadmin)
PATCH /api/auth/usuarios/:id/activo — activar/desactivar usuario (superadmin, admin)
DELETE /api/auth/usuarios/:id — eliminar usuario (superadmin, admin)
Frontend

src/components/EmpresaList.js — renovado con:

Botón "Nueva Empresa" → dialog con nombre, admin nombre/email/contraseña
Switch en cada fila para activar/desactivar la empresa
Ícono de personas para navegar a /empresas/:id/usuarios
src/components/UsuarioList.js (nuevo) — muestra usuarios de la empresa con:

Breadcrumb con flecha de regreso a Empresas
Botón "Nuevo Usuario" → dialog con nombre, email, contraseña, rol (admin/operador/visor)
Switch para activar/desactivar cada usuario
Botón eliminar con diálogo de confirmación
Chips de rol coloreados
src/App.js — agrega ruta /empresas/:empresaId/usuarios protegida con roles={['superadmin']}

## Next Steps
- Implementar dashboard de analytics