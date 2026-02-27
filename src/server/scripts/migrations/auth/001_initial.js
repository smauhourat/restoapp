export const description = 'Schema inicial de auth: empresas, usuarios, refresh_tokens, password_reset_tokens';

export function up(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS empresas (
      id        TEXT PRIMARY KEY,
      nombre    TEXT NOT NULL,
      slug      TEXT UNIQUE NOT NULL,
      activo    INTEGER DEFAULT 1,
      creado_en TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id            TEXT PRIMARY KEY,
      empresa_id    TEXT REFERENCES empresas(id),
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nombre        TEXT NOT NULL,
      rol           TEXT NOT NULL CHECK(rol IN ('superadmin', 'admin', 'operador', 'visor')),
      activo        INTEGER DEFAULT 1,
      creado_en     TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expira_en  TEXT NOT NULL,
      revocado   INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expira_en  TEXT NOT NULL,
      usado      INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_prt_usuario ON password_reset_tokens(usuario_id);
  `);
}
