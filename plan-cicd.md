# Plan: CI/CD con GitHub Actions → VPS vía SSH

## Context

RestoApp es una app React (CRA) + Express 5 + SQLite multi-tenant.
Actualmente el deploy es manual mediante `deploy.bat`.
El objetivo es automatizar el pipeline de CI/CD usando GitHub Actions,
desplegando en un VPS Linux vía SSH.

**Ramas y entornos:**
| Rama | Entorno | URL destino |
|------|---------|-------------|
| `develop` | Desarrollo | `/var/www/restoapp.adhentux.com.dev` |
| `master` | Producción | `/var/www/restoapp.adhentux.com` |

**VPS conocido (del .env):**
- Host: `66.97.47.170`
- Usuario: `santi`
- Puerto SSH: `5756`

---

## Archivos críticos

- `package.json` — scripts de build y migrate
- `src/server/server.js` — entrada del backend
- `src/server/scripts/migrate.js` — migración única
- `.env` — variables de entorno (NO subir al repo)

---

## Paso 1: Preparar el VPS

Ejecutar UNA VEZ en el VPS como el usuario `santi`:

```bash
# 1. Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instalar PM2 globalmente
sudo npm install -g pm2

# 3. Instalar Nginx
sudo apt-get install -y nginx

# 4. Crear directorios de la app (uno por entorno)
sudo mkdir -p /var/www/restoapp.adhentux.com.dev
sudo mkdir -p /var/www/restoapp.adhentux.com
sudo chown -R santi:santi /var/www/restoapp.adhentux.com.dev
sudo chown -R santi:santi /var/www/restoapp.adhentux.com

# 5. Dentro de cada directorio, crear estructura inicial
mkdir -p /var/www/restoapp.adhentux.com.dev/src/server/data/tenants
mkdir -p /var/www/restoapp.adhentux.com.dev/src/server/uploads
mkdir -p /var/www/restoapp.adhentux.com/src/server/data/tenants
mkdir -p /var/www/restoapp.adhentux.com/src/server/uploads
```

---

## Paso 2: Configurar SSH sin contraseña para GitHub Actions

En tu máquina local, generar un par de claves dedicado para CI/CD:

```bash
ssh-keygen -t ed25519 -C "github-actions-restoapp" -f ~/.ssh/github_actions_restoapp -N ""
```

Esto genera:
- `~/.ssh/github_actions_restoapp` → **clave privada** (va a GitHub Secrets)
- `~/.ssh/github_actions_restoapp.pub` → **clave pública** (va al VPS)

Agregar la clave pública al VPS:

```bash
ssh-copy-id -i ~/.ssh/github_actions_restoapp.pub -p 5756 santi@66.97.47.170
```

O manualmente en el VPS:
```bash
cat >> ~/.ssh/authorized_keys << 'EOF'
[contenido de github_actions_restoapp.pub]
EOF
```

---

## Paso 3: Agregar GitHub Secrets

En GitHub → Settings → Secrets and variables → Actions, crear:

| Secret | Valor |
|--------|-------|
| `SSH_PRIVATE_KEY` | Contenido completo de `~/.ssh/github_actions_restoapp` |
| `SSH_HOST` | `66.97.47.170` |
| `SSH_USER` | `santi` |
| `SSH_PORT` | `5756` |
| `ENV_DEV` | Contenido del `.env` para el entorno dev |
| `ENV_PROD` | Contenido del `.env` para el entorno producción |

Para `ENV_DEV` y `ENV_PROD`, copiar el `.env` actual y ajustar los valores por entorno (JWT secrets distintos, WORK_DIR correspondiente, etc.).

---

## Paso 4: Configurar Nginx en el VPS

Crear dos virtual hosts (uno por entorno).

### `/etc/nginx/sites-available/restoapp-dev`

```nginx
server {
    listen 80;
    server_name restoapp.adhentux.com.dev;

    # Servir frontend estático
    root /var/www/restoapp.adhentux.com.dev/build;
    index index.html;

    # React Router: redirigir al index para rutas del SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy al backend Express (puerto 3002 para dev)
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### `/etc/nginx/sites-available/restoapp-prod`

```nginx
server {
    listen 80;
    server_name restoapp.adhentux.com;

    root /var/www/restoapp.adhentux.com/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar y recargar:
```bash
sudo ln -s /etc/nginx/sites-available/restoapp-dev /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/restoapp-prod /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Paso 5: Configurar PM2 en el VPS

PM2 gestiona el proceso Node como servicio del sistema.

### Archivos ecosystem (crear manualmente en cada WORK_DIR)

**`/var/www/restoapp.adhentux.com.dev/ecosystem.config.js`**:
```js
module.exports = {
  apps: [{
    name: 'restoapp-dev',
    script: 'src/server/server.js',
    cwd: '/var/www/restoapp.adhentux.com.dev',
    env_file: '.env',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
  }]
};
```

**`/var/www/restoapp.adhentux.com/ecosystem.config.js`** (igual pero con `name: 'restoapp-prod'` y cwd de producción).

Guardar el arranque automático:
```bash
pm2 startup
# Ejecutar el comando que PM2 sugiere (sudo ...)
pm2 save
```

---

## Paso 6: Crear los workflows de GitHub Actions

### Estructura de archivos a crear en el repo:

```
.github/
└── workflows/
    ├── deploy-dev.yml     # Push a develop → entorno dev
    └── deploy-prod.yml    # Push a master → entorno producción
```

### `.github/workflows/deploy-dev.yml`

```yaml
name: Deploy → Dev

on:
  push:
    branches: [develop]

jobs:
  deploy:
    name: Build & Deploy (Dev)
    runs-on: ubuntu-latest
    environment: development

    steps:
      - name: Checkout código
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Instalar dependencias
        run: npm ci

      - name: Build frontend
        run: npm run build
        env:
          CI: false
          REACT_APP_API_URL: /api

      - name: Preparar directorio de deploy
        run: |
          mkdir -p deploy_package/src
          cp -r build deploy_package/
          cp -r src/server deploy_package/src/
          cp package.json deploy_package/
          cp package-lock.json deploy_package/

      - name: Copiar archivos al VPS via rsync
        uses: burnett01/rsync-deployments@7.0.1
        with:
          switches: >-
            -avz
            --delete
            --exclude='src/server/data/'
            --exclude='src/server/uploads/'
            --exclude='.env'
            --exclude='ecosystem.config.js'
          path: deploy_package/
          remote_path: /var/www/restoapp.adhentux.com.dev/
          remote_host: ${{ secrets.SSH_HOST }}
          remote_port: ${{ secrets.SSH_PORT }}
          remote_user: ${{ secrets.SSH_USER }}
          remote_key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Instalar dependencias de producción y reiniciar
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.SSH_HOST }}
          port: ${{ secrets.SSH_PORT }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            set -e
            cd /var/www/restoapp.adhentux.com.dev

            # Escribir .env desde secrets
            cat > .env << 'ENVEOF'
            ${{ secrets.ENV_DEV }}
            ENVEOF

            # Instalar dependencias de producción
            npm ci --omit=dev

            # Primera vez: ejecutar migración si no existe auth.db
            if [ ! -f src/server/data/auth.db ]; then
              echo "Ejecutando migración inicial..."
              npm run migrate
            fi

            # Recargar o iniciar con PM2
            pm2 reload restoapp-dev --update-env || pm2 start ecosystem.config.js
            pm2 save

            echo "Deploy DEV completado ✓"
```

### `.github/workflows/deploy-prod.yml`

```yaml
name: Deploy → Producción

on:
  push:
    branches: [master]

jobs:
  deploy:
    name: Build & Deploy (Prod)
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout código
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Instalar dependencias
        run: npm ci

      - name: Build frontend
        run: npm run build
        env:
          CI: false
          REACT_APP_API_URL: /api

      - name: Preparar directorio de deploy
        run: |
          mkdir -p deploy_package/src
          cp -r build deploy_package/
          cp -r src/server deploy_package/src/
          cp package.json deploy_package/
          cp package-lock.json deploy_package/

      - name: Copiar archivos al VPS via rsync
        uses: burnett01/rsync-deployments@7.0.1
        with:
          switches: >-
            -avz
            --delete
            --exclude='src/server/data/'
            --exclude='src/server/uploads/'
            --exclude='.env'
            --exclude='ecosystem.config.js'
          path: deploy_package/
          remote_path: /var/www/restoapp.adhentux.com/
          remote_host: ${{ secrets.SSH_HOST }}
          remote_port: ${{ secrets.SSH_PORT }}
          remote_user: ${{ secrets.SSH_USER }}
          remote_key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Instalar dependencias de producción y reiniciar
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.SSH_HOST }}
          port: ${{ secrets.SSH_PORT }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            set -e
            cd /var/www/restoapp.adhentux.com

            cat > .env << 'ENVEOF'
            ${{ secrets.ENV_PROD }}
            ENVEOF

            npm ci --omit=dev

            if [ ! -f src/server/data/auth.db ]; then
              echo "Ejecutando migración inicial..."
              npm run migrate
            fi

            pm2 reload restoapp-prod --update-env || pm2 start ecosystem.config.js
            pm2 save

            echo "Deploy PROD completado ✓"
```

---

## Paso 7: Secuencia de primer deploy

1. Completar Pasos 1-5 (setup VPS, Nginx, PM2)
2. Hacer push del código con los workflows al repo
3. El primer push a `develop` ejecutará el workflow automáticamente
4. Verificar en GitHub → Actions que el pipeline es verde
5. El `ecosystem.config.js` debe crearse manualmente en el VPS (NO se sobreescribe con rsync)

---

## Flujo completo del pipeline

```
Push a develop/master
        ↓
GitHub Actions runner (ubuntu-latest)
        ↓
npm ci → npm run build (CRA frontend)
        ↓
rsync → VPS (excluyendo data/, uploads/, .env)
        ↓
SSH: npm ci --omit=dev
        ↓
SSH: migrate (solo si no existe auth.db)
        ↓
SSH: pm2 reload (o start si es la primera vez)
        ↓
Nginx sirve build/ + proxy /api/ → Express :3001/:3002
```

---

## Consideraciones de seguridad y persistencia

### Datos que NUNCA se sobreescriben con rsync:
- `src/server/data/` — todas las bases de datos SQLite
- `src/server/uploads/` — archivos subidos por usuarios
- `.env` — variables de entorno
- `ecosystem.config.js` — configuración PM2

### Variables de entorno por entorno

El `.env` de **producción** debe tener:
```env
PORT=3001
NODE_ENV=production
JWT_SECRET=<secreto-fuerte-distinto-al-dev>
JWT_REFRESH_SECRET=<otro-secreto-fuerte>
# ... resto de variables
```

El `.env` de **desarrollo** (en VPS dev) debe tener `PORT=3002`.

### SSL/HTTPS (recomendado tras el primer deploy):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d restoapp.adhentux.com
sudo certbot --nginx -d restoapp.adhentux.com.dev
```

---

## Verificación post-deploy

1. Verificar que el workflow en GitHub → Actions está en verde
2. En el VPS: `pm2 status` → ambas apps deben estar `online`
3. `pm2 logs restoapp-prod --lines 20` → sin errores
4. Abrir la URL en el navegador → login funciona
5. `curl https://restoapp.adhentux.com/api/auth/me` → responde JSON (401 es OK)