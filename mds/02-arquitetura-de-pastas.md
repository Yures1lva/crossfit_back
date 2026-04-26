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
    auth.controller.ts
    auth.service.ts
    auth.module.ts                   ← @Global()

  usuario/
    dto/
      create-usuario.dto.ts
      update-usuario.dto.ts
      response-usuario.dto.ts
    entities/
      usuario.entity.ts
    usuario.controller.ts
    usuario.service.ts
    usuario.module.ts

  campeonato/
    dto/
      create-campeonato.dto.ts
      update-campeonato.dto.ts
      response-campeonato.dto.ts
    entities/
      campeonato.entity.ts
    campeonato.controller.ts
    campeonato.service.ts
    campeonato.module.ts

  inscricao/
    dto/
      create-inscricao.dto.ts
      update-inscricao.dto.ts
      response-inscricao.dto.ts
    entities/
      inscricao.entity.ts
    inscricao.controller.ts
    inscricao.service.ts
    inscricao.module.ts

  common/
    filters/
      all-exceptions.filter.ts
      unique-violation.filter.ts
      database-exception.filter.ts
      index.ts
    pipes/
    interceptors/

  main.ts                            ← Bootstrap (CORS, cookies, Swagger, ValidationPipe)
  app.module.ts                      ← Módulo raiz
  mikro-orm.config.ts                ← Configuração do ORM e banco
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
| POST/PUT/DELETE | `AuthGuard` + `RolesGuard` | `POST /campeonatos` |
| Refresh token | `RefreshTokenGuard` | `POST /auth/refresh` |

---

## Convenções

1. **UUID como PK** — nunca autoincrement
2. **`createdAt` / `updatedAt`** — em toda entidade
3. **`isDeleted`** — soft delete padrão
4. **Nunca retornar entidade bruta** — sempre usar ResponseDto
5. **Nunca hardcodar segredos** — sempre usar `ConfigService`
6. **Controller só roteia** — lógica de negócio no Service
