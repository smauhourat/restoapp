# Sistema de Migraciones Automáticas de DB

## Problema que resuelve

RestoApp usa SQLite multi-tenant (una DB por empresa). Sin un sistema de migraciones,
cualquier cambio de esquema en producción requería intervención manual en cada DB.

## Arquitectura

```
src/server/scripts/
├── migrate-runner.js              ← runner principal
├── migrate.js                     ← inicialización legacy (primer deploy)
└── migrations/
    ├── auth/
    │   └── 001_initial.js         ← schema de auth.db
    └── tenant/
        └── 001_initial.js         ← schema de cada tenant DB
```

## Cómo funciona

1. El runner crea la tabla `schema_migrations` en cada DB si no existe
2. Lee los archivos de `migrations/auth/` o `migrations/tenant/` ordenados por nombre
3. Aplica solo los que no están registrados (idempotente)
4. Registra cada migración aplicada con timestamp
5. Si `auth.db` es nueva, crea los usuarios iniciales (`seedAuthDb`)

## Cómo agregar un nuevo cambio de esquema

### 1. Crear el archivo de migración

Naming: `NNN_descripcion_corta.js` donde `NNN` es un número secuencial con ceros a la izquierda.

**Para cambios en auth.db** → `src/server/scripts/migrations/auth/002_mi_cambio.js`

**Para cambios en DBs de tenant** → `src/server/scripts/migrations/tenant/002_mi_cambio.js`

```js
// Ejemplo: agregar columna a Producto
export const description = 'Agregar columna activo a Producto';

export function up(db) {
  db.exec(`ALTER TABLE Producto ADD COLUMN activo INTEGER DEFAULT 1`);
}
```

### 2. Ejecutar localmente

```bash
npm run db:migrate
```

### 3. Commitear y hacer push

El deploy corre `db:migrate` automáticamente. Se aplica en **todas las DBs de tenant**.

## Limitaciones de SQLite

SQLite no soporta todas las operaciones DDL. Lo permitido:

| Operación | ¿Permitida? |
|-----------|-------------|
| Agregar columna con DEFAULT | ✓ |
| Renombrar columna (SQLite 3.25+) | ✓ |
| Eliminar columna (SQLite 3.35+) | ✓ |
| Modificar tipo de columna | ✗ |
| Agregar constraint a existente | ✗ |

Para cambios no soportados, usar el patrón rename-create-insert-drop:

```js
export const description = 'Reestructurar tabla Pedido';

export function up(db) {
  db.exec(`
    ALTER TABLE Pedido RENAME TO Pedido_old;

    CREATE TABLE Pedido (
      -- nuevo esquema
    );

    INSERT INTO Pedido SELECT col1, col2, ... FROM Pedido_old;

    DROP TABLE Pedido_old;
  `);
}
```

## En el workflow de deploy

```yaml
# deploy-prod.yml — se ejecuta en cada push a master
npm run db:migrate   # aplica solo migraciones pendientes
```

## Verificación

```bash
# Ver qué migraciones aplicó
sqlite3 src/server/data/auth.db "SELECT * FROM schema_migrations;"

# Ver qué migraciones aplicó un tenant
sqlite3 src/server/data/tenants/tenant_<uuid>.db "SELECT * FROM schema_migrations;"
```