# Migraciones de DB — Plan Conceptual

## Contexto

En este proyecto con SQLite + better-sqlite3 no hay un sistema de migraciones
automático — el `migrate.js` actual es solo de inicialización única.
Para cambios de esquema en producción hay dos enfoques:

---

## Opción 1: Migraciones manuales con scripts versionados (recomendada)

Crear un script por cada cambio de esquema, numerado:

```
src/server/scripts/migrations/
├── 001_initial.js          ← el migrate.js actual
├── 002_add_precio_lista.js
├── 003_add_notas_pedido.js
└── ...
```

Y una tabla en la DB que registra cuáles ya corrieron:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT DEFAULT (datetime('now'))
);
```

El runner aplica solo las pendientes en orden:

```js
// src/server/scripts/migrate-runner.js
import Database from 'better-sqlite3';
import { readdirSync } from 'fs';

function runMigrations(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now'))
  )`);

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version)
  );

  const files = readdirSync('./src/server/scripts/migrations')
    .filter(f => f.endsWith('.js'))
    .sort();

  for (const file of files) {
    const version = parseInt(file.split('_')[0]);
    if (!applied.has(version)) {
      const { up } = await import(`./migrations/${file}`);
      db.transaction(() => {
        up(db);
        db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(version);
      })();
      console.log(`Migración ${file} aplicada ✓`);
    }
  }
}
```

Cada script de migración exporta una función `up`:

```js
// 002_add_precio_lista.js
export function up(db) {
  db.exec(`ALTER TABLE productos ADD COLUMN precio_lista REAL DEFAULT 0`);
}
```

---

## Opción 2: Columnas con valor por defecto (SQLite tiene limitaciones)

SQLite solo permite `ALTER TABLE ADD COLUMN` (no puede eliminar ni modificar columnas).
Para la mayoría de los casos alcanza con:

```sql
-- Agregar columna nueva con default → no rompe datos existentes
ALTER TABLE productos ADD COLUMN activo INTEGER DEFAULT 1;

-- Renombrar tabla (workaround para cambios mayores)
ALTER TABLE pedidos RENAME TO pedidos_old;
CREATE TABLE pedidos ( ...nuevo esquema... );
INSERT INTO pedidos SELECT ... FROM pedidos_old;
DROP TABLE pedidos_old;
```

---

## Importante para este proyecto multi-tenant

Cada tenant tiene su propia DB (`tenant_{uuid}.db`). Si cambiás el esquema,
la migración debe correrse en **todas las DBs de tenant**, no solo en `auth.db`:

```js
import { readdirSync } from 'fs';
import { getTenantDb } from '../db.js';

// Correr migración en todos los tenants
const tenantFiles = readdirSync('./src/server/data/tenants')
  .filter(f => f.endsWith('.db'));

for (const file of tenantFiles) {
  const tenantId = file.replace('tenant_', '').replace('.db', '');
  const db = getTenantDb(tenantId);
  runMigrations(db);
}
```

---

## En el workflow de deploy

Una vez que tengas el runner, reemplazás la lógica de migración del workflow:

```bash
# En vez de solo ejecutar en primer deploy:
# if [ ! -f src/server/data/auth.db ]; then ...

# Siempre ejecutar el runner (aplica solo las pendientes):
node src/server/scripts/migrate-runner.js
```

Así cada deploy aplica automáticamente las migraciones nuevas sin tocar
las que ya corrieron.