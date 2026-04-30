# Plano de Deploy — Passo a Passo

> Render (Backend) + Vercel (Frontend) + Supabase (Banco + Storage)
>
> **Princípio:** código desacoplado das plataformas. Migrar pra containers = trocar só o provider.

---

## Fase 1 — Abstração do Storage (Backend)

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

### 1.2 Implementar LocalStorageProvider

- Mover a lógica do `upload.service.ts` atual pra cá
- `upload()` → salva em `public/uploads/{bucket}/{filePath}`
- `getPublicUrl()` → retorna `/uploads/{bucket}/{filePath}`
- `getSignedUrl()` → retorna a mesma URL pública (local não tem signed)
- `delete()` → `fs.unlinkSync`

### 1.3 Implementar SupabaseStorageProvider

- Única dependência: `@supabase/supabase-js` (instalar)
- Lê `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` do `.env`
- `upload()` → `supabase.storage.from(bucket).upload(filePath, buffer)`
- `getPublicUrl()` → `supabase.storage.from(bucket).getPublicUrl(filePath)`
- `getSignedUrl()` → `supabase.storage.from(bucket).createSignedUrl(filePath, expiresIn)`
- `delete()` → `supabase.storage.from(bucket).remove([filePath])`

### 1.4 Refatorar UploadModule

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

### 1.5 Refatorar UploadService

- Injetar `@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider`
- `saveFile(file, subfolder)` → `this.storage.upload(subfolder, filename, file.buffer, file.mimetype)`
- Retornar URL absoluta (em vez de path relativo)

### 1.6 Refatorar UploadController

- Mapeamento de subfolders → buckets:
  - `atletas` → bucket `atletas`
  - `comprovantes` → bucket `comprovantes`
  - `avatars` → bucket `avatars`
  - `banners` → bucket `banners`

### 1.7 Adicionar variáveis ao `.env`

```env
# Storage (local para dev)
STORAGE_DRIVER=local
```

### 1.8 Testar localmente

- [ ] Upload de imagem funciona igual antes
- [ ] URLs dos uploads continuam acessíveis
- [ ] Nenhuma quebra no fluxo de inscrição

---

## Fase 2 — Preparar Cookies e CORS (First-Party com sooacosports.com.br)

Como front (`sooacosports.com.br`) e back (`api.sooacosports.com.br`) compartilham o mesmo domínio raiz, usamos cookies **first-party** com `sameSite: 'lax'` — mais seguro e não será bloqueado por navegadores.

### 2.1 Ajustar CORS no `main.ts`

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

### 2.2 Ajustar cookies no `auth.controller.ts`

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

### 2.3 Variáveis de ambiente

```env
FRONTEND_URL=https://sooacosports.com.br
COOKIE_DOMAIN=.sooacosports.com.br
```

### 2.4 Testar localmente

- [x] Login funciona normal em dev
- [x] Cookies são setados corretamente
- [x] CORS não bloqueia localhost:3000 → localhost:3004

---

## Fase 3 — Criar Projeto no Supabase

### 3.1 Criar conta/projeto

1. Acessar [supabase.com](https://supabase.com)
2. Criar novo projeto (região: São Paulo se disponível)
3. Anotar:
   - `Project URL` → `SUPABASE_URL`
   - `service_role key` → `SUPABASE_SERVICE_KEY`
   - `Database Host` → `DB_HOST`
   - `Database Password` → `DB_PASSWORD`

### 3.2 Criar buckets no Storage

Via dashboard do Supabase → Storage:

| Bucket | Público? | Notas |
|---|---|---|
| `avatars` | ✅ Sim | Fotos de perfil |
| `atletas` | ✅ Sim | Fotos dos atletas na inscrição |
| `banners` | ✅ Sim | Banners dos campeonatos |
| `comprovantes` | ❌ Não | Comprovantes de pagamento (acesso via signed URL) |
| `lp-assets` | ✅ Sim | Assets de Landing Pages (futuro) |

### 3.3 Configurar policies nos buckets públicos

Para cada bucket público, criar policy:
- **SELECT** (download): `true` (qualquer um pode ver)
- **INSERT**: via service_key (só o backend insere)

Para `comprovantes` (privado):
- **Nenhuma policy pública** — acesso só via service key do backend

### 3.4 Testar conexão com o banco

```bash
# Temporariamente no .env local, trocar as credenciais para o Supabase
DB_HOST=db.xxxx.supabase.co
DB_PASSWORD=<password>

# Rodar migrations
npm run migration:up
```

- [ ] Migrations rodam sem erro
- [ ] App conecta e lista dados

> ⚠️ Voltar o .env local para o PostgreSQL local depois do teste.

---

## Fase 4 — Deploy do Backend (Render)

### 4.1 Preparar o repositório

1. Garantir que `package.json` tem scripts:
   ```json
   "build": "nest build",
   "start:prod": "node dist/main.js"
   ```
2. Garantir que `.env` **não** está commitado (`.gitignore`)
3. Push para GitHub/GitLab

### 4.2 Criar Web Service no Render

1. Acessar [render.com](https://render.com) → New Web Service
2. Conectar repositório `crossfit_back`
3. Configurar:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Environment**: Node
   - **Instance Type**: Free (ou Starter)

### 4.3 Configurar variáveis de ambiente no Render

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
FRONTEND_URL=https://crossfit-home.vercel.app
```

### 4.4 Rodar migrations

Duas opções:
- **Via Render Shell**: `npm run migration:up`
- **Via local** apontando pro banco remoto (temporariamente)

### 4.5 Testar

- [ ] `https://crossfit-api.onrender.com/api/docs` abre o Swagger
- [ ] `GET /api/v1/campeonatos` retorna dados
- [ ] Upload de arquivo funciona e URL aponta pro Supabase

---

## Fase 5 — Deploy do Frontend (Vercel)

### 5.1 Preparar o repositório

1. Garantir que `next.config.js` permite imagens externas:
   ```js
   images: {
     remotePatterns: [
       { protocol: 'https', hostname: '*.supabase.co' },
       { protocol: 'https', hostname: '*.onrender.com' },
     ],
   }
   ```
2. Push para GitHub/GitLab

### 5.2 Criar projeto na Vercel

1. Acessar [vercel.com](https://vercel.com) → Import Project
2. Conectar repositório `crossfit_home`
3. Framework: Next.js (auto-detectado)

### 5.3 Configurar variáveis de ambiente na Vercel

```env
NEXT_PUBLIC_API_URL=https://crossfit-api.onrender.com/api/v1
NEXT_PUBLIC_STORAGE_URL=https://xxxx.supabase.co/storage/v1/object/public
```

### 5.4 Testar end-to-end

- [ ] Página de login funciona
- [ ] Cadastro de novo usuário funciona
- [ ] Cookies de autenticação funcionam cross-domain
- [ ] Fluxo completo de inscrição (formulário → upload → pagamento)
- [ ] Admin: listar e aprovar inscrições
- [ ] Imagens/comprovantes carregam corretamente

---

## Fase 6 — Pós-Deploy (Melhorias)

### 6.1 Domínio customizado (opcional)

- Configurar domínio no Render (ex: `api.crosshub.com.br`)
- Configurar domínio na Vercel (ex: `crosshub.com.br`)
- Atualizar `FRONTEND_URL`, `COOKIE_DOMAIN`, cookies

### 6.2 Monitoramento

- Render fornece logs e métricas básicas
- Supabase dashboard mostra queries e storage usage

### 6.3 Backup

- Supabase free faz backup diário automático (retido 7 dias)
- Para plano Pro: backup point-in-time

### 6.4 CI/CD

- Render auto-deploya em push na branch `main`
- Vercel auto-deploya em push na branch `main`
- Considerar branch `production` separada se quiser controle

---

## Resumo Rápido — Onde Cada Coisa Vive

| O que | Onde | URL |
|---|---|---|
| Frontend | Vercel | `crossfit-home.vercel.app` |
| API | Render | `crossfit-api.onrender.com` |
| Banco PostgreSQL | Supabase | `db.xxxx.supabase.co` |
| Fotos/Avatares | Supabase Storage | `xxxx.supabase.co/storage/v1/object/public/avatars/` |
| Comprovantes | Supabase Storage | Signed URLs (privado, via backend) |
| Swagger/Docs | Render | `crossfit-api.onrender.com/api/docs` |

---

## Checklist Geral

> 🤖 = Antigravity faz (código) · 👤 = Você faz (plataforma/config manual)

- [x] **Fase 1** — Abstração do Storage
  - [x] 🤖 1.1 Interface StorageProvider
  - [x] 🤖 1.2 LocalStorageProvider
  - [x] 🤖 1.3 SupabaseStorageProvider
  - [x] 🤖 1.4 UploadModule factory
  - [x] 🤖 1.5 UploadService refatorado
  - [x] 🤖 1.6 UploadController ajustado
  - [x] 🤖 1.7 Variáveis no `.env.example`
  - [x] 🤖 1.8 Testado: upload local funciona com o novo provider
- [x] **Fase 2** — CORS e Cookies
  - [x] 🤖 2.1 CORS restrito por `FRONTEND_URL`
  - [x] 🤖 2.2 Cookies cross-domain (sameSite/secure/COOKIE_DOMAIN)
  - [x] 🤖 2.3 Variáveis no `.env.example`
  - [x] 🤖 2.4 `mikro-orm.config.ts` com SSL condicional (host remoto)
- [ ] **Fase 3** — Supabase
  - [x] 👤 3.1 Criar conta e projeto no Supabase
  - [x] 👤 3.2 Buckets criados: avatars, atletas, banners, comprovantes (privado/20MB), lp-assets
  - [ ] 👤 3.3 Configurar policies (público/privado) nos buckets ← **AGORA**
  - [x] 👤 3.4 Anotar credenciais: `Project URL`, `service_role key`, `DB Host`, `DB Password`
  - [x] 👤 3.5 Conexão testada + initial migration aplicada com sucesso
  - [x] 🤖 3.6 `@supabase/supabase-js` instalado + Logger adicionado aos providers
- [ ] **Fase 4** — Render
  - [ ] 👤 4.1 Criar conta no [render.com](https://render.com)
  - [ ] 👤 4.2 Conectar repositório `crossfit_back` e criar Web Service
  - [ ] 👤 4.3 Preencher as variáveis de ambiente (copiar do plano acima)
  - [ ] 👤 4.4 Rodar migrations via Render Shell: `npm run migration:up`
  - [ ] 👤 4.5 Testar: abrir `https://<url>/api/docs` e verificar Swagger
- [ ] **Fase 5** — Vercel
  - [ ] 🤖 5.1 Ajustar `next.config` para imagens externas
  - [ ] 👤 5.2 Criar projeto na [vercel.com](https://vercel.com) conectando `crossfit_home`
  - [ ] 👤 5.3 Preencher variáveis: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STORAGE_URL`
  - [ ] 👤 5.4 Teste end-to-end: cadastro → login → inscrição → upload → admin aprova
- [ ] **Fase 6** — Pós-deploy
  - [ ] 👤 6.1 Domínio customizado (se quiser)
  - [ ] 👤 6.2 Monitoramento (logs no Render, dashboard no Supabase)

