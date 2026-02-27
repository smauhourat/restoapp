# Plan: Backup de DBs antes de aplicar migraciones

## Contexto

El script `migrate-runner.js` aplica migraciones a `auth.db` y a todas las tenant DBs de forma idempotente. Sin embargo, si una migración falla a mitad de camino o tiene un bug, no hay forma de volver atrás fácilmente.

Este plan agrega la creación automática de un backup de cada DB **solo cuando hay migraciones pendientes**, antes de aplicarlas, con una política de retención para no acumular backups indefinidamente.

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/server/scripts/migrate-runner.js` | Toda la lógica de backup |
| `.github/workflows/deploy-prod.yml` | `mkdir -p src/server/data/backups` |
| `.github/workflows/deploy-dev.yml` | `mkdir -p src/server/data/backups` |

---

## Parte 1 — migrate-runner.js

### 1.1 Imports (líneas 15–16)

```js
// antes
import { dirname, join } from 'path';
import { readdirSync, existsSync, mkdirSync } from 'fs';

// después
import { basename, dirname, join } from 'path';
import { readdirSync, existsSync, mkdirSync, unlinkSync } from 'fs';
```

### 1.2 Nueva constante (línea 28)

```js
const BACKUPS_DIR = join(DATA_DIR, 'backups');
// → src/server/data/backups/
```

### 1.3 Cuatro funciones nuevas en la sección "Utilidades"

#### `hasPendingMigrations(db, migrationsDir)`
Comprueba si hay migraciones sin aplicar sin ejecutarlas. Reutiliza `ensureMigrationsTable` y `getAppliedVersions` ya existentes.

```js
function hasPendingMigrations(db, migrationsDir) {
  ensureMigrationsTable(db);
  const applied = getAppliedVersions(db);
  const files = getMigrationFiles(migrationsDir);
  return files.some(f => !applied.has(f.replace('.js', '')));
}
```

#### `getBackupTimestamp()`
Genera el string `YYYYMMDD_HHmmss` (hora local del servidor) para el nombre del archivo.

```js
function getBackupTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}
```

#### `pruneBackups(dbBaseName, maxKeep = 5)`
Elimina los backups más antiguos de una DB cuando se supera el límite de retención. El orden alfabético de los nombres (`YYYYMMDD_HHmmss`) equivale al orden cronológico.

```js
function pruneBackups(dbBaseName, maxKeep = 5) {
  const allFiles = existsSync(BACKUPS_DIR)
    ? readdirSync(BACKUPS_DIR).filter(f => f.startsWith(dbBaseName + '_') && f.endsWith('.db'))
    : [];
  allFiles.sort();
  const toDelete = allFiles.slice(0, Math.max(0, allFiles.length - maxKeep));
  for (const f of toDelete) {
    try {
      unlinkSync(join(BACKUPS_DIR, f));
      console.log(`  [backup] Eliminado backup antiguo: ${f}`);
    } catch (err) {
      console.warn(`  [backup] No se pudo eliminar ${f}: ${err.message}`);
    }
  }
}
```

#### `backupDb(db, dbPath)`
Crea el backup usando `VACUUM INTO`. Produce un `.db` limpio sin estado WAL — el método recomendado de hot backup con `better-sqlite3`. El `.replace(/\\/g, '/')` convierte backslashes de Windows a forward slashes dentro del string SQL (no-op en Linux).

```js
function backupDb(db, dbPath) {
  ensureDir(BACKUPS_DIR);
  const dbBaseName = basename(dbPath, '.db');
  const backupName = `${dbBaseName}_${getBackupTimestamp()}.db`;
  const backupPath = join(BACKUPS_DIR, backupName).replace(/\\/g, '/');
  db.exec(`VACUUM INTO '${backupPath}'`);
  console.log(`  [backup] ✓ Creado: ${backupName}`);
  pruneBackups(dbBaseName);
}
```

**Ejemplo de backup generado:**
```
src/server/data/backups/
├── auth_20260227_143022.db
├── tenant_95926d98-4add-49c4-a533-380b0cd87e1e_20260227_143022.db
└── tenant_e77f9943-63e0-4d35-b5e4-3145d48d27d3_20260227_143022.db
```

### 1.4 Modificación de `migrateAuthDb()`

Después de los pragmas, antes de `applyMigrations`:

```js
// Guard !isNew: no hacer backup de una DB recién creada (vacía, sin datos que preservar)
if (!isNew && hasPendingMigrations(db, AUTH_MIGRATIONS_DIR)) {
  backupDb(db, AUTH_DB_PATH);
}
```

### 1.5 Modificación del loop en `migrateTenantDbs()`

Después de los pragmas de cada tenant, antes de `applyMigrations`:

```js
// No hace falta !isNew: el loop solo itera archivos que ya existen en disco
if (hasPendingMigrations(db, TENANT_MIGRATIONS_DIR)) {
  backupDb(db, dbPath);
}
```

---

## Parte 2 — Workflows de CI/CD

En ambos workflows, en el bloque de "Crear directorios persistentes", se agrega una línea:

```bash
# Crear directorios persistentes si no existen
mkdir -p logs
mkdir -p src/server/data/tenants
mkdir -p src/server/data/backups   # ← nueva línea
mkdir -p src/server/uploads
```

> El directorio `src/server/data/` ya está excluido del rsync (`--exclude='src/server/data/'`), así que `backups/` persiste automáticamente entre deploys sin ninguna configuración adicional.

---

## Comportamiento final

| Escenario | Resultado |
|---|---|
| No hay migraciones pendientes | No se crea backup, la salida dice "Sin migraciones pendientes." |
| Hay migraciones pendientes en auth.db (existente) | Se crea `auth_{timestamp}.db` antes de migrar |
| Hay migraciones pendientes en tenant(s) | Se crea `tenant_{uuid}_{timestamp}.db` por cada tenant afectado |
| auth.db no existía (primer deploy) | No se crea backup (DB nueva, sin datos) |
| Se acumulan más de 5 backups del mismo DB | Se elimina el más antiguo automáticamente |

---

## Verificación

1. **Sin migraciones pendientes**: `npm run db:migrate` → sin backups creados, salida muestra "Sin migraciones pendientes."
2. **Con migración pendiente**: agregar `003_test.js` en `migrations/tenant/`, ejecutar `npm run db:migrate` → backups en `src/server/data/backups/`, migración aplicada normalmente.
3. **Retención**: ejecutar 6 veces con diferentes migraciones pendientes → verificar que quedan exactamente 5 backups por DB.
4. **CI**: tras el deploy con una migración pendiente, verificar vía SSH que hay archivos `.db` en `src/server/data/backups/`.