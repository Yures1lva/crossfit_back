# Arquitetura de Pastas — CrossFit Arena Backend

> Padrão modular NestJS. Cada módulo segue: `entities/`, `dto/`, `controller`, `service`, `module`.

---

## Estrutura Completa

```
src/
  auth/
    guards/
      auth.guard.ts                  ← Extrai + valida access_token (cookie ou Bearer)
      refresh-token.guard.ts         ← Valida refresh_token
      roles.guard.ts                 ← Verifica role do usuário
    decorators/
      roles.decorator.ts             ← @Roles('admin', 'organizer')
      current-user.decorator.ts      ← @CurrentUser() injeta payload JWT
    dto/
      signin.dto.ts
      response-signin.dto.ts
    auth.controller.ts               ← login, register, refresh, logout, check-account
    auth.service.ts                  ← bcrypt, JWT, linkToUser, CPF no retorno
    auth.module.ts                   ← @Global()

  usuario/
    dto/
      create-usuario.dto.ts
      update-usuario.dto.ts
      response-usuario.dto.ts
    entities/
      usuario.entity.ts             ← nome, email, cpf (obrigatório), role, senha
    usuario.controller.ts
    usuario.service.ts
    usuario.module.ts

  campeonato/
    dto/
      create-campeonato.dto.ts
      update-campeonato.dto.ts
      response-campeonato.dto.ts
    entities/
      campeonato.entity.ts           ← categorias, tamanhosCamisa, precosModalidade, loteNome, etc.
    campeonato.controller.ts         ← CRUD + GET/PUT configuração
    campeonato.service.ts
    campeonato.module.ts

  inscricao/
    dto/
      create-inscricao.dto.ts        ← cpf, email, nomeAtleta obrigatórios
      update-inscricao.dto.ts
      response-inscricao.dto.ts
    entities/
      inscricao.entity.ts            ← usuario nullable, parceiros JSON, fotosAtletas, fotoModo
    inscricao.controller.ts          ← public + autenticado + admin (parceiros, fotos, comprovante)
    inscricao.service.ts             ← createPublic, linkToUser, parceiros, validação duplicidade
    inscricao.module.ts

  upload/
    storage/
      storage.interface.ts           ← StorageProvider interface + token STORAGE_PROVIDER
      local.storage.ts               ← Implementação filesystem local (dev)
      supabase.storage.ts            ← Implementação Supabase Storage (prod atual)
      minio.storage.ts               ← Implementação MinIO (futuro VPS)
      index.ts                       ← re-exports
    upload.controller.ts             ← autenticado + público (subfolder restrito)
    upload.service.ts                ← saveFile, getSignedUrl, 5MB validação
    upload.module.ts                 ← Factory provider decide driver via STORAGE_DRIVER

  cidade/
    cidade.controller.ts             ← Lista cidades com busca
    cidade.service.ts
    cidade.entity.ts
    cidade.module.ts

  common/
    filters/
      all-exceptions.filter.ts
      unique-violation.filter.ts
      database-exception.filter.ts
      index.ts
    pipes/
    interceptors/

  main.ts                            ← Bootstrap (CORS, cookies, Swagger, auto schema sync)
  app.module.ts                      ← Módulo raiz
  mikro-orm.config.ts                ← Config ORM, SSL condicional, schemaGenerator
```

---

## Padrão de um Módulo

```
src/<modulo>/
  dto/
    create-<modulo>.dto.ts           ← payload de entrada (class-validator)
    update-<modulo>.dto.ts           ← PartialType do create
    response-<modulo>.dto.ts         ← payload de saída (nunca retorna entity bruta)
  entities/
    <modulo>.entity.ts               ← entidade MikroORM (UUID, createdAt, updatedAt, isDeleted)
  <modulo>.controller.ts             ← rotas HTTP + @UseGuards + @Roles
  <modulo>.service.ts                ← regras de negócio
  <modulo>.module.ts                 ← imports, exports, providers
```

---

## Segurança — Guards em Todas as Rotas de Escrita

```ts
// ❌ ERRADO — rota desprotegida
@Post()
create(@Body() dto) { ... }

// ✅ CORRETO — guard + role obrigatórios
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'organizer')
@Post()
create(@Body() dto, @CurrentUser() user) { ... }
```

| Tipo de Rota | Guard | Exemplo |
|---|---|---|
| GET público | Nenhum | `GET /campeonatos/:id` |
| GET autenticado | `AuthGuard` | `GET /auth/profile` |
| POST/PUT/DELETE admin | `AuthGuard` + `RolesGuard` | `POST /campeonatos` |
| POST público (inscrição) | Nenhum | `POST /inscricoes/public` |
| POST público (upload) | Nenhum | `POST /upload/public/image/:subfolder` |
| Refresh token | `RefreshTokenGuard` | `POST /auth/refresh` |

---

## Storage — Abstração de Provider

```
STORAGE_DRIVER=local     → LocalStorageProvider (dev — salva em public/uploads/)
STORAGE_DRIVER=supabase  → SupabaseStorageProvider (prod — buckets Supabase)
STORAGE_DRIVER=minio     → MinioStorageProvider (futuro VPS)
```

| Bucket | Acesso | Uso |
|---|---|---|
| `atletas` | Público | Fotos dos atletas |
| `comprovantes` | Privado (signed URL) | Comprovantes de pagamento |
| `avatars` | Público | Fotos de perfil |
| `banners` | Público | Banners de campeonatos |
| `lp-assets` | Público | Assets de landing pages |

---

## Convenções

1. **UUID como PK** — nunca autoincrement
2. **`createdAt` / `updatedAt`** — em toda entidade
3. **`isDeleted`** — soft delete padrão
4. **Nunca retornar entidade bruta** — sempre usar ResponseDto
5. **Nunca hardcodar segredos** — sempre usar `ConfigService`
6. **Controller só roteia** — lógica de negócio no Service
7. **Auto schema sync** — `updateSchema({ safe: true })` no bootstrap
