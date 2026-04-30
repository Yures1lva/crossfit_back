# Plano de Deploy — Passo a Passo

> Render (Backend) + Vercel (Frontend) + Supabase (Banco + Storage)
>
> **Princípio:** código desacoplado das plataformas. Migrar pra containers = trocar só o provider.

---

## Fase 1 — Abstração do Storage (Backend) ✅

Antes de qualquer deploy, precisamos desacoplar o upload de arquivos do disco local.

### 1.1 Criar a interface StorageProvider

```
src/upload/storage/
  storage.interface.ts   ← interface + token de injeção
  local.storage.ts       ← implementação atual (fs local)
  supabase.storage.ts    ← implementação Supabase (S3-compatible)
  index.ts               ← re-exports
```

**`storage.interface.ts`**
```ts
export interface StorageProvider {
    upload(bucket: string, filePath: string, buffer: Buffer, mimeType: string): Promise<string>;
    getPublicUrl(bucket: string, filePath: string): string;
    getSignedUrl(bucket: string, filePath: string, expiresIn?: number): Promise<string>;
    delete(bucket: string, filePath: string): Promise<void>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
```

### 1.2 Implementar LocalStorageProvider ✅

- Mover a lógica do `upload.service.ts` atual pra cá
- `upload()` → salva em `public/uploads/{bucket}/{filePath}`
- `getPublicUrl()` → retorna `/uploads/{bucket}/{filePath}`
- `getSignedUrl()` → retorna a mesma URL pública (local não tem signed)
- `delete()` → `fs.unlinkSync`

### 1.3 Implementar SupabaseStorageProvider ✅

- Única dependência: `@supabase/supabase-js` (instalado)
- Lê `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` do `.env`
- `upload()` → `supabase.storage.from(bucket).upload(filePath, buffer)`
- `getPublicUrl()` → `supabase.storage.from(bucket).getPublicUrl(filePath)`
- `getSignedUrl()` → `supabase.storage.from(bucket).createSignedUrl(filePath, expiresIn)`
- `delete()` → `supabase.storage.from(bucket).remove([filePath])`

### 1.4 Refatorar UploadModule ✅

- Provider factory decide qual usar:
  ```ts
  {
    provide: STORAGE_PROVIDER,
    useFactory: () => {
      if (process.env.STORAGE_DRIVER === 'supabase') {
        return new SupabaseStorageProvider();
      }
      return new LocalStorageProvider();
    },
  }
  ```

### 1.5 Refatorar UploadService ✅

- Injetar `@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider`
- `saveFile(file, subfolder)` → `this.storage.upload(subfolder, filename, file.buffer, file.mimetype)`
- Retornar URL absoluta (em vez de path relativo)

### 1.6 Refatorar UploadController ✅

- Mapeamento de subfolders → buckets:
  - `atletas` → bucket `atletas`
  - `comprovantes` → bucket `comprovantes`
  - `avatars` → bucket `avatars`
  - `banners` → bucket `banners`

### 1.7 Adicionar variáveis ao `.env` ✅

```env
# Storage (local para dev)
STORAGE_DRIVER=local
```

### 1.8 Testar localmente ✅

- [x] Upload de imagem funciona igual antes
- [x] URLs dos uploads continuam acessíveis
- [x] Nenhuma quebra no fluxo de inscrição

---

## Fase 2 — Preparar Cookies e CORS (First-Party com sooacosports.com.br) ✅

Como front (`sooacosports.com.br`) e back (`api.sooacosports.com.br`) compartilham o mesmo domínio raiz, usamos cookies **first-party** com `sameSite: 'lax'` — mais seguro e não será bloqueado por navegadores.

### 2.1 Ajustar CORS no `main.ts` ✅

```ts
const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:3000']
    : ['http://localhost:3000'];

app.enableCors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
});
```

### 2.2 Ajustar cookies no `auth.controller.ts` ✅

- `sameSite: 'lax'` — sempre (first-party, não precisa de `'none'`)
- `secure: true` em produção (HTTPS)
- `domain: '.sooacosports.com.br'` — o ponto inicial abrange subdomínios

```ts
const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    domain: isProd ? process.env.COOKIE_DOMAIN : undefined, // .sooacosports.com.br
};
```

### 2.3 Variáveis de ambiente ✅

```env
FRONTEND_URL=https://sooacosports.com.br
COOKIE_DOMAIN=.sooacosports.com.br
```

### 2.4 Testar localmente ✅

- [x] Login funciona normal em dev
- [x] Cookies são setados corretamente
- [x] CORS não bloqueia localhost:3000 → localhost:3004

---

## Fase 3 — Criar Projeto no Supabase ✅

### 3.1 Criar conta/projeto ✅

1. Acessar [supabase.com](https://supabase.com)
2. Criar novo projeto (região: São Paulo se disponível)
3. Anotar:
   - `Project URL` → `SUPABASE_URL`
   - `service_role key` → `SUPABASE_SERVICE_KEY`
   - `Database Host` → `DB_HOST`
   - `Database Password` → `DB_PASSWORD`

### 3.2 Criar buckets no Storage ✅

Via dashboard do Supabase → Storage:

| Bucket | Público? | Status | Notas |
|---|---|---|---|
| `avatars` | ✅ Sim | ✅ Criado | Fotos de perfil |
| `atletas` | ✅ Sim | ✅ Criado | Fotos dos atletas na inscrição |
| `banners` | ✅ Sim | ✅ Criado | Banners dos campeonatos (pronto para Módulo 3) |
| `comprovantes` | ❌ Não | ✅ Criado (privado/20MB) | Comprovantes de pagamento (acesso via signed URL) |
| `lp-assets` | ✅ Sim | ✅ Criado | Assets de Landing Pages (pronto para Módulo 3) |

### 3.3 Configurar policies nos buckets públicos ✅

Para cada bucket público, criar policy:
- **SELECT** (download): `true` (qualquer um pode ver)
- **INSERT**: via service_key (só o backend insere)

Para `comprovantes` (privado):
- **Nenhuma policy pública** — acesso só via service key do backend
- **Frontend recebe Signed URLs** geradas pelo backend (validade: 1h)

### 3.4 Testar conexão com o banco ✅

- [x] Migrations rodam sem erro
- [x] App conecta e lista dados
- [x] **Auto schema sync** habilitado no bootstrap (`updateSchema({ safe: true })`)

---

## Fase 4 — Deploy do Backend (Render) ✅

### 4.1 Preparar o repositório ✅

1. Garantir que `package.json` tem scripts:
   ```json
   "build": "nest build",
   "start:prod": "node dist/main.js"
   ```
2. Garantir que `.env` **não** está commitado (`.gitignore`)
3. Push para GitHub

### 4.2 Criar Web Service no Render ✅

1. Acessar [render.com](https://render.com) → New Web Service
2. Conectar repositório `crossfit_back`
3. Configurar:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Environment**: Node
   - **Instance Type**: Free (ou Starter)

### 4.3 Configurar variáveis de ambiente no Render ✅

```env
NODE_ENV=production
PORT=3004
DOMAIN=crossfit-api.onrender.com

# Banco (Supabase)
DB_HOST=db.xxxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<supabase-password>
DB_NAME=postgres
DB_POOL_MIN=1
DB_POOL_MAX=5

# JWT
JWT_ACCESS_SECRET=<gerar-64-chars-random>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<gerar-64-chars-random>
JWT_REFRESH_EXPIRES_IN=7d

# Storage
STORAGE_DRIVER=supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...

# CORS
FRONTEND_URL=https://sooacosports.com.br
COOKIE_DOMAIN=.sooacosports.com.br
```

### 4.4 Schema sync automático ✅

O backend agora roda `updateSchema({ safe: true, dropTables: false })` automaticamente ao iniciar.
Novas colunas são criadas sem perder dados existentes. Não precisa mais rodar migrations manualmente.

### 4.5 Testar ✅

- [x] `https://api.sooacosports.com.br/api/docs` abre o Swagger
- [x] `GET /api/v1/campeonatos` retorna dados
- [x] Upload de arquivo funciona e URL aponta pro Supabase
- [x] Comprovantes servidos via Signed URLs
- [x] Schema auto-sincronizado ao deploy

---

## Fase 5 — Deploy do Frontend (Vercel) ✅

### 5.1 Preparar o repositório ✅

1. Garantir que `next.config.ts` permite imagens externas:
   ```js
   images: {
     remotePatterns: [
       { protocol: 'https', hostname: '*.supabase.co' },
       { protocol: 'https', hostname: 'api.sooacosports.com.br' },
     ],
   }
   ```
2. Push para GitHub

### 5.2 Criar projeto na Vercel ✅

1. Acessar [vercel.com](https://vercel.com) → Import Project
2. Conectar repositório `crossfit_home`
3. Framework: Next.js (auto-detectado)

### 5.3 Configurar variáveis de ambiente na Vercel ✅

```env
NEXT_PUBLIC_API_URL=https://api.sooacosports.com.br/api/v1
```

### 5.4 Testar end-to-end ✅

- [x] Página de login funciona
- [x] Cadastro de novo usuário funciona
- [x] Cookies de autenticação funcionam cross-domain
- [x] Fluxo completo de inscrição (formulário → upload → pagamento)
- [x] Admin: listar e aprovar inscrições
- [x] Imagens/comprovantes carregam corretamente (signed URLs)
- [x] Inscrição em equipe: parceiros adicionados/editados via modal
- [x] Validação 5MB no upload

---

## Fase 6 — Pós-Deploy (Em andamento)

### 6.1 Domínio customizado ✅

- [x] Domínio `sooacosports.com.br` configurado na Vercel
- [x] Domínio `api.sooacosports.com.br` configurado no Render
- [x] `FRONTEND_URL`, `COOKIE_DOMAIN` e cookies atualizados

### 6.2 Monitoramento

- Render fornece logs e métricas básicas
- Supabase dashboard mostra queries e storage usage

### 6.3 Backup

- Supabase free faz backup diário automático (retido 7 dias)
- Para plano Pro: backup point-in-time

### 6.4 CI/CD ✅

- Render auto-deploya em push na branch `main` ✅
- Vercel auto-deploya em push na branch `main` ✅
- Schema sync automático no bootstrap (sem intervenção manual) ✅

---

## Resumo Rápido — Onde Cada Coisa Vive

| O que | Onde | URL |
|---|---|---|
| Frontend | Vercel | `sooacosports.com.br` |
| API | Render | `api.sooacosports.com.br` |
| Banco PostgreSQL | Supabase | `db.xxxx.supabase.co` |
| Fotos de Atletas | Supabase Storage (público) | `xxxx.supabase.co/storage/v1/object/public/atletas/` |
| Comprovantes | Supabase Storage (privado) | Signed URLs via backend (validade: 1h) |
| Banners | Supabase Storage (público) | `xxxx.supabase.co/storage/v1/object/public/banners/` (pronto) |
| LP Assets | Supabase Storage (público) | `xxxx.supabase.co/storage/v1/object/public/lp-assets/` (pronto) |
| Avatars | Supabase Storage (público) | `xxxx.supabase.co/storage/v1/object/public/avatars/` (pronto) |
| Swagger/Docs | Render | `api.sooacosports.com.br/api/docs` |

---

## Checklist Geral

> 🤖 = Antigravity faz (código) · 👤 = Você faz (plataforma/config manual)

- [x] **Fase 1** — Abstração do Storage ✅
  - [x] 🤖 1.1 Interface StorageProvider
  - [x] 🤖 1.2 LocalStorageProvider
  - [x] 🤖 1.3 SupabaseStorageProvider
  - [x] 🤖 1.4 UploadModule factory
  - [x] 🤖 1.5 UploadService refatorado
  - [x] 🤖 1.6 UploadController ajustado
  - [x] 🤖 1.7 Variáveis no `.env.example`
  - [x] 🤖 1.8 Testado: upload local funciona com o novo provider
- [x] **Fase 2** — CORS e Cookies ✅
  - [x] 🤖 2.1 CORS restrito por `FRONTEND_URL`
  - [x] 🤖 2.2 Cookies cross-domain (sameSite/secure/COOKIE_DOMAIN)
  - [x] 🤖 2.3 Variáveis no `.env.example`
  - [x] 🤖 2.4 `mikro-orm.config.ts` com SSL condicional (host remoto)
- [x] **Fase 3** — Supabase ✅
  - [x] 👤 3.1 Criar conta e projeto no Supabase
  - [x] 👤 3.2 Buckets criados: avatars, atletas, banners, comprovantes (privado/20MB), lp-assets
  - [x] 👤 3.3 Policies configuradas (público/privado)
  - [x] 👤 3.4 Anotar credenciais
  - [x] 👤 3.5 Conexão testada + schema aplicado
  - [x] 🤖 3.6 `@supabase/supabase-js` instalado + Logger
- [x] **Fase 4** — Render ✅
  - [x] 👤 4.1 Conta criada no Render
  - [x] 👤 4.2 Web Service conectado ao repositório `crossfit_back`
  - [x] 👤 4.3 Variáveis de ambiente preenchidas
  - [x] 🤖 4.4 Auto schema sync no bootstrap (sem migration manual)
  - [x] 👤 4.5 Swagger funcionando em `api.sooacosports.com.br/api/docs`
- [x] **Fase 5** — Vercel ✅
  - [x] 🤖 5.1 `next.config.ts` configurado com `remotePatterns`
  - [x] 🤖 5.1b `.env.local.example` atualizado com URLs de prod
  - [x] 👤 5.2 Projeto criado na Vercel conectando `crossfit_home`
  - [x] 👤 5.3 Variáveis preenchidas na Vercel
  - [x] 👤 5.4 Teste end-to-end: cadastro → login → inscrição → upload → admin aprova ✅
- [x] **Fase 6** — Pós-deploy ✅
  - [x] 👤 6.1 Domínios configurados (`sooacosports.com.br` + `api.sooacosports.com.br`)
  - [x] 👤 6.2 Monitoramento ativo (Render logs + Supabase dashboard)

---
--------------------------------------------------------------------------------------------------

# 🚀 Plano de Migração — VPS Containerizada (Fase 7)

> Migrar **tudo** (Backend + Frontend + Banco + Storage) de Render/Vercel/Supabase para uma **VPS própria** com Docker.
>
> **Objetivo:** controle total, custo fixo, sem cold starts, sem limites de plataforma.
> **Princípio:** zero downtime, zero perda de dados.

---

## Arquitetura Alvo

```
VPS (ex: Hetzner, Contabo, DigitalOcean)
├── docker-compose.yml
│   ├── frontend     ← Next.js (Node 20 Alpine, standalone)
│   ├── app          ← NestJS Backend (Node 20 Alpine)
│   ├── postgres     ← PostgreSQL 16 (volume persistente)
│   ├── minio        ← MinIO (S3-compatible storage, volume persistente)
│   └── nginx        ← Reverse Proxy + SSL (Certbot)
│
├── volumes/
│   ├── pg_data/     ← Dados do PostgreSQL
│   ├── minio_data/  ← Arquivos (fotos, comprovantes, banners)
│   └── certs/       ← Certificados SSL
```

---

## Fase 7.1 — Preparar a VPS

### 7.1.1 Escolher provedor e provisionar

| Provedor | Plano sugerido | vCPU | RAM | SSD | Preço |
|---|---|---|---|---|---|
| **Hetzner** (recomendado) | CX22 | 2 | 4GB | 40GB | ~€4/mês |
| Contabo | VPS S | 4 | 8GB | 200GB | ~€6/mês |
| DigitalOcean | Basic | 2 | 4GB | 80GB | $24/mês |

> 💡 Para o tamanho atual do projeto, 2 vCPU + 4GB RAM é suficiente.

### 7.1.2 Configurar a VPS

```bash
# Conectar via SSH
ssh root@<IP_DA_VPS>

# Atualizar e instalar Docker + Docker Compose
apt update && apt upgrade -y
apt install -y curl git ufw
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# Firewall
ufw allow 22     # SSH
ufw allow 80     # HTTP
ufw allow 443    # HTTPS
ufw enable

# Criar usuário deploy (não rodar como root)
adduser deploy
usermod -aG docker deploy
su - deploy
```

### 7.1.3 Configurar domínio DNS

Atualizar registros DNS para apontar para a VPS:

| Tipo | Nome | Valor |
|---|---|---|
| A | `sooacosports.com.br` | `<IP_DA_VPS>` |
| A | `api.sooacosports.com.br` | `<IP_DA_VPS>` |

> ⚠️ Manter os registros antigos (Render + Vercel) até validar que a VPS funciona. Só trocar quando tudo estiver OK.

---

## Fase 7.2 — Criar docker-compose.yml

### 7.2.1 Estrutura de arquivos na VPS

```
/home/deploy/crossfit/
├── docker-compose.yml
├── .env
├── crossfit_back/       ← clone do repo backend
│   └── Dockerfile
├── crossfit_home/       ← clone do repo frontend
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf
│   └── certs/           ← gerados pelo Certbot
└── backups/             ← dumps automáticos do PostgreSQL
```

### 7.2.2 docker-compose.yml

```yaml
version: '3.8'

services:
  # ── PostgreSQL
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"  # só acessível localmente
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ── MinIO (S3-compatible storage)
  minio:
    image: minio/minio:latest
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "127.0.0.1:9000:9000"   # API (só local)
      - "127.0.0.1:9001:9001"   # Console web (só local)
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ── Backend NestJS
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3004
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_ACCESS_EXPIRES_IN: 15m
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_REFRESH_EXPIRES_IN: 7d
      STORAGE_DRIVER: minio
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_PUBLIC_URL: https://api.sooacosports.com.br/storage
      FRONTEND_URL: https://sooacosports.com.br
      COOKIE_DOMAIN: .sooacosports.com.br
    ports:
      - "127.0.0.1:3004:3004"

  # ── Frontend Next.js
  frontend:
    build:
      context: ./crossfit_home
      dockerfile: Dockerfile
    restart: always
    depends_on:
      - app
    environment:
      NEXT_PUBLIC_API_URL: https://api.sooacosports.com.br/api/v1
    ports:
      - "127.0.0.1:3000:3000"

  # ── Nginx (Reverse Proxy + SSL)
  nginx:
    image: nginx:alpine
    restart: always
    depends_on:
      - app
      - frontend
      - minio
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/letsencrypt:ro
      - certbot_webroot:/var/www/certbot:ro

  # ── Certbot (SSL auto-renew)
  certbot:
    image: certbot/certbot
    volumes:
      - ./nginx/certs:/etc/letsencrypt
      - certbot_webroot:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done'"

volumes:
  pg_data:
  minio_data:
  certbot_webroot:
```

### 7.2.3 Dockerfile — Backend (`crossfit_back/Dockerfile`)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3004
CMD ["node", "dist/main.js"]
```

### 7.2.3b Dockerfile — Frontend (`crossfit_home/Dockerfile`)

> ⚠️ Requer `output: 'standalone'` no `next.config.ts` para funcionar.

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar artefatos do standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

### 7.2.3c Ajuste no `next.config.ts`

Adicionar `output: 'standalone'` para gerar um build otimizado para Docker:

```ts
// next.config.ts
const nextConfig = {
    output: 'standalone',
    // ... resto da config
};
```

### 7.2.4 nginx.conf

```nginx
events { worker_connections 1024; }

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=web:10m rate=50r/s;

    # Redirect HTTP → HTTPS (ambos os domínios)
    server {
        listen 80;
        server_name sooacosports.com.br api.sooacosports.com.br;
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # ── Frontend (sooacosports.com.br)
    server {
        listen 443 ssl;
        server_name sooacosports.com.br;

        ssl_certificate /etc/letsencrypt/live/sooacosports.com.br/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/sooacosports.com.br/privkey.pem;

        location / {
            limit_req zone=web burst=100 nodelay;
            proxy_pass http://frontend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }

    # ── API + Storage (api.sooacosports.com.br)
    server {
        listen 443 ssl;
        server_name api.sooacosports.com.br;

        ssl_certificate /etc/letsencrypt/live/api.sooacosports.com.br/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.sooacosports.com.br/privkey.pem;

        # API
        location /api/ {
            limit_req zone=api burst=50 nodelay;
            proxy_pass http://app:3004;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            client_max_body_size 10M;
        }

        # Storage público (MinIO proxy)
        location /storage/ {
            proxy_pass http://minio:9000/;
            proxy_set_header Host $host;
            expires 7d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 7.2.5 .env (na VPS)

```env
# Banco
DB_USER=crossfit
DB_PASSWORD=<gerar-senha-forte-64-chars>
DB_NAME=crossfit_arena

# JWT
JWT_ACCESS_SECRET=<gerar-64-chars>
JWT_REFRESH_SECRET=<gerar-64-chars>

# MinIO
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=<gerar-senha-forte-32-chars>
```

---

## Fase 7.3 — Implementar MinioStorageProvider

> O código já está preparado para isso graças à abstração `StorageProvider`.

### 7.3.1 Instalar SDK do MinIO

```bash
npm install minio
```

### 7.3.2 Criar `minio.storage.ts`

```ts
// src/upload/storage/minio.storage.ts
import { Client } from 'minio';
import { StorageProvider } from './storage.interface';

export class MinioStorageProvider implements StorageProvider {
    private client: Client;
    private publicUrl: string;

    constructor() {
        this.client = new Client({
            endPoint: process.env.MINIO_ENDPOINT || 'localhost',
            port: Number(process.env.MINIO_PORT || 9000),
            useSSL: false,
            accessKey: process.env.MINIO_ACCESS_KEY || '',
            secretKey: process.env.MINIO_SECRET_KEY || '',
        });
        this.publicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
    }

    async upload(bucket: string, filePath: string, buffer: Buffer, mimeType: string): Promise<string> {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) await this.client.makeBucket(bucket);
        await this.client.putObject(bucket, filePath, buffer, buffer.length, { 'Content-Type': mimeType });
        return this.getPublicUrl(bucket, filePath);
    }

    getPublicUrl(bucket: string, filePath: string): string {
        return `${this.publicUrl}/${bucket}/${filePath}`;
    }

    async getSignedUrl(bucket: string, filePath: string, expiresIn = 3600): Promise<string> {
        return this.client.presignedGetObject(bucket, filePath, expiresIn);
    }

    async delete(bucket: string, filePath: string): Promise<void> {
        await this.client.removeObject(bucket, filePath);
    }
}
```

### 7.3.3 Atualizar UploadModule factory

```ts
// Adicionar ao switch:
if (process.env.STORAGE_DRIVER === 'minio') {
    return new MinioStorageProvider();
}
```

> 💡 Nenhuma mudança no UploadService, Controller ou Frontend. Só troca o driver.

---

## Fase 7.4 — Migrar Dados (Zero Perda)

### 7.4.1 Migrar o banco PostgreSQL

```bash
# 1. Exportar do Supabase (na máquina local)
pg_dump \
  -h db.xxxx.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f crossfit_backup.dump

# 2. Copiar para a VPS
scp crossfit_backup.dump deploy@<IP_VPS>:/home/deploy/crossfit/

# 3. Na VPS — restaurar no container PostgreSQL
docker compose up -d postgres   # subir só o banco
docker compose exec -T postgres pg_restore \
  -U crossfit \
  -d crossfit_arena \
  --no-owner \
  --no-privileges \
  < /home/deploy/crossfit/crossfit_backup.dump
```

### 7.4.2 Migrar o Storage (arquivos)

```bash
# 1. Na máquina local — baixar todos os arquivos do Supabase
# Instalar supabase CLI: npm i -g supabase
# Ou usar o SDK para listar e baixar bucket por bucket

# Script Node para download em massa:
```
```js
// scripts/download-supabase-storage.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BUCKETS = ['atletas', 'comprovantes', 'avatars', 'banners', 'lp-assets'];

async function download() {
    for (const bucket of BUCKETS) {
        const { data: files } = await supabase.storage.from(bucket).list('', { limit: 1000 });
        if (!files) continue;
        const dir = path.join('storage_backup', bucket);
        fs.mkdirSync(dir, { recursive: true });
        for (const file of files) {
            const { data } = await supabase.storage.from(bucket).download(file.name);
            if (data) {
                const buffer = Buffer.from(await data.arrayBuffer());
                fs.writeFileSync(path.join(dir, file.name), buffer);
                console.log(`✅ ${bucket}/${file.name}`);
            }
        }
    }
}
download();
```

```bash
# 2. Copiar para a VPS
scp -r storage_backup/ deploy@<IP_VPS>:/home/deploy/crossfit/

# 3. Na VPS — subir para o MinIO via mc (MinIO Client)
docker compose up -d minio
docker compose exec minio mc alias set local http://localhost:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# Criar buckets
for bucket in atletas comprovantes avatars banners lp-assets; do
    docker compose exec minio mc mb local/$bucket --ignore-existing
done

# Definir políticas (público/privado)
docker compose exec minio mc anonymous set download local/atletas
docker compose exec minio mc anonymous set download local/avatars
docker compose exec minio mc anonymous set download local/banners
docker compose exec minio mc anonymous set download local/lp-assets
# comprovantes permanece privado (sem policy pública)

# Upload dos arquivos
for bucket in atletas comprovantes avatars banners lp-assets; do
    docker compose exec minio mc cp --recursive /storage_backup/$bucket/ local/$bucket/
done
```

### 7.4.3 Verificar integridade

```bash
# Contar registros no banco
docker compose exec postgres psql -U crossfit -d crossfit_arena -c "SELECT COUNT(*) FROM inscricao;"
docker compose exec postgres psql -U crossfit -d crossfit_arena -c "SELECT COUNT(*) FROM usuario;"

# Contar arquivos no MinIO
docker compose exec minio mc ls --recursive local/atletas | wc -l
docker compose exec minio mc ls --recursive local/comprovantes | wc -l
```

---

## Fase 7.5 — Subir Tudo e Validar

### 7.5.1 Build e start

```bash
cd /home/deploy/crossfit
docker compose up -d --build
docker compose logs -f app   # verificar logs do backend
```

### 7.5.2 Gerar certificados SSL

```bash
# Certificado para o frontend
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d sooacosports.com.br \
  --email seu@email.com \
  --agree-tos

# Certificado para a API
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d api.sooacosports.com.br \
  --email seu@email.com \
  --agree-tos

# Reiniciar nginx com SSL
docker compose restart nginx
```

### 7.5.3 Testar

- [ ] `https://sooacosports.com.br` — Frontend carrega
- [ ] `https://api.sooacosports.com.br/api/docs` — Swagger abre
- [ ] Login/cadastro funciona
- [ ] Upload de comprovante funciona (vai pro MinIO)
- [ ] Comprovantes abrem via signed URL
- [ ] Fotos de atletas carregam no frontend
- [ ] Admin aprova/rejeita inscrições normalmente
- [ ] SSR do Next.js funciona (SEO, landing pages dinâmicas)

### 7.5.4 Trocar o DNS

Quando tudo estiver validado:

1. Alterar registro A de `sooacosports.com.br` → `<IP_DA_VPS>`
2. Alterar registro A de `api.sooacosports.com.br` → `<IP_DA_VPS>`
3. Aguardar propagação (até 24h, geralmente minutos)
4. Testar novamente com os domínios reais

---

## Fase 7.6 — Manutenção e Backups

### 7.6.1 Backup automático do banco (cron)

```bash
# /home/deploy/crossfit/backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M)
docker compose exec -T postgres pg_dump -U crossfit -d crossfit_arena -F c > /home/deploy/crossfit/backups/db_$DATE.dump
# Manter últimos 14 dias
find /home/deploy/crossfit/backups/ -name "db_*.dump" -mtime +14 -delete
echo "Backup realizado: db_$DATE.dump"
```

```bash
chmod +x /home/deploy/crossfit/backup.sh
# Agendar: todo dia às 3h da manhã
crontab -e
# Adicionar:
0 3 * * * /home/deploy/crossfit/backup.sh >> /home/deploy/crossfit/backups/backup.log 2>&1
```

### 7.6.2 Atualizar o backend (deploy)

```bash
cd /home/deploy/crossfit

# Backend
cd crossfit_back && git pull origin main && cd ..
docker compose up -d --build app

# Frontend
cd crossfit_home && git pull origin main && cd ..
docker compose up -d --build frontend
# O auto schema sync do main.ts cuida das colunas novas automaticamente
```

### 7.6.3 Monitoramento básico

```bash
# Ver logs em tempo real
docker compose logs -f app

# Ver uso de recursos
docker stats

# Verificar saúde dos containers
docker compose ps
```

### 7.6.4 Rollback em caso de falha

```bash
# Voltar DNS para Render + Vercel (se precisar)
# Os dois continuam rodando enquanto não forem desligados

# Restaurar backup do banco
docker compose exec -T postgres pg_restore \
  -U crossfit -d crossfit_arena --clean --no-owner \
  < /home/deploy/crossfit/backups/db_YYYYMMDD_HHMM.dump
```

---

## Fase 7.7 — Checklist de Migração

> 🤖 = Antigravity faz (código) · 👤 = Você faz (infra)

- [ ] **7.1 — Preparar VPS**
  - [ ] 👤 Contratar VPS (Hetzner CX22 recomendado)
  - [ ] 👤 Instalar Docker + Docker Compose
  - [ ] 👤 Configurar firewall (22, 80, 443)
  - [ ] 👤 Criar usuário `deploy`
- [ ] **7.2 — Docker Compose**
  - [ ] 🤖 Criar `Dockerfile` backend (multi-stage)
  - [ ] 🤖 Criar `Dockerfile` frontend (standalone Next.js)
  - [ ] 🤖 Adicionar `output: 'standalone'` no `next.config.ts`
  - [ ] 🤖 Criar `docker-compose.yml` (postgres, minio, app, frontend, nginx)
  - [ ] 🤖 Criar `nginx.conf` com reverse proxy para ambos os domínios + SSL
  - [ ] 👤 Criar `.env` na VPS com credenciais
- [ ] **7.3 — MinioStorageProvider**
  - [ ] 🤖 Instalar SDK `minio`
  - [ ] 🤖 Implementar `minio.storage.ts`
  - [ ] 🤖 Atualizar factory no `UploadModule`
  - [ ] 🤖 Testar localmente com MinIO em Docker
- [ ] **7.4 — Migrar Dados**
  - [ ] 👤 Exportar banco do Supabase (`pg_dump`)
  - [ ] 👤 Importar no PostgreSQL da VPS (`pg_restore`)
  - [ ] 👤 Baixar arquivos do Supabase Storage
  - [ ] 👤 Subir arquivos no MinIO (mc cp)
  - [ ] 👤 Verificar contagens (banco + arquivos)
- [ ] **7.5 — Validar**
  - [ ] 👤 Gerar certificado SSL (Certbot)
  - [ ] 👤 Testar end-to-end com IP da VPS
  - [ ] 👤 Trocar DNS `sooacosports.com.br` → VPS
  - [ ] 👤 Trocar DNS `api.sooacosports.com.br` → VPS
  - [ ] 👤 Testar com domínios reais
- [ ] **7.6 — Manutenção**
  - [ ] 👤 Configurar cron de backup diário
  - [ ] 👤 Testar rollback
  - [ ] 👤 Desligar Render (só após validação completa)
  - [ ] 👤 Desconectar Vercel (só após validação completa)
  - [ ] 👤 Cancelar/pausar Supabase (manter backup final)

---

## Comparação de Custos

| Item | Atual (Render + Vercel + Supabase) | VPS Containerizada |
|---|---|---|
| Backend | Render Free/Starter (~$0-7/mês) | Incluído na VPS |
| Frontend | Vercel Free (~$0/mês, com limites) | Incluído na VPS |
| Banco | Supabase Free (500MB) | Incluído na VPS |
| Storage | Supabase Free (1GB) | Incluído na VPS (disco da VPS) |
| **Total** | **$0-7/mês** (com limites) | **~€4-6/mês** (sem limites) |
| Cold starts | Sim (Render Free) | Não (sempre ligado) |
| Storage ilimitado | Não (1GB free) | Sim (limitado pelo disco) |
| Build minutes | Limitado (Vercel 6000min/mês) | Ilimitado |
| Controle total | Não | Sim |

> 💡 A VPS compensa quando: (1) precisa de mais storage, (2) quer eliminar cold starts, (3) quer controle total sobre infra, (4) build minutes do Vercel estão estourando.
