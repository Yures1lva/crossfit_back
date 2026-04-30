# CrossFit Arena — Backend (NestJS)

> API REST da plataforma de campeonatos de CrossFit. Construída com NestJS 11, MikroORM 6 e PostgreSQL.

## Contexto

Este backend serve como a camada de regras de negócio e persistência para a plataforma **CrossFit Arena**. É responsável por:

- Autenticação e autorização via JWT (access + refresh token em cookies `httpOnly`)
- Gestão de campeonatos, inscrições, categorias e resultados
- Inscrições em equipe (dupla/trio) com gestão de parceiros
- Upload de arquivos com abstração de storage (Local / Supabase / MinIO)
- Inscrição pública (sem conta) com vinculação automática por CPF+email
- Landing Page configurável por campeonato (banner, cores, regras)
- Confirmação manual de pagamento pelo admin
- Auto-sync do schema no bootstrap (sem migrations manuais)
- Documentação automática via Swagger

---

## Stack Tecnológica

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Framework | NestJS 11 | Arquitetura modular, DI, Guards, Pipes |
| Linguagem | TypeScript 5.7 | Tipagem forte em todo o projeto |
| Banco de Dados | PostgreSQL | Dados relacionais (Supabase em prod) |
| ORM | MikroORM 6 | Mapeamento entidade→tabela, auto schema sync |
| Auth | JWT + bcrypt | Access token + refresh token hasheado |
| Storage | StorageProvider (Local/Supabase/MinIO) | Upload abstrato — troca de driver via env |
| Documentação | Swagger (`@nestjs/swagger`) | Auto-gerado a partir dos decorators |
| Validação | class-validator + class-transformer | DTOs autodescritivos e tipados |
| Config | `@nestjs/config` + `.env` | Variáveis de ambiente centralizadas |

---

## Fases de Desenvolvimento

### Módulo 1 — Core & Registro (MVP Launch) ✅

| Entrega | Módulo Backend |
|---|---|
| Setup de infraestrutura e BD | `mikro-orm.config.ts`, `app.module.ts` |
| Sistema de autenticação | `auth/`, `usuario/` |
| Formulário dinâmico de inscrição | `inscricao/` |
| Landing Page personalizada | `campeonato/` (banner, regras, info) |

### Módulo 2 — Gestão Completa ✅

- CRUD completo de campeonatos com configuração dinâmica
- Categorias, lotes de preços, tamanhos de camisa
- Gestão de inscrições (aprovar/rejeitar, estatísticas)
- Inscrição pública sem conta (CPF + email)
- Upload de arquivos (StorageProvider abstrato)
- Inscrições em equipe (parceiros com nome, CPF, camisa)

### Módulo 3 — Configuração da Landing Page (futuro)
- Upload de banner, assets
- Customização visual (cores, textos)

### Módulo 4 — Escala & Comunicação (futuro)
- Recuperação de senha via Brevo SMTP
- Verificação de e-mail com modal persistente
- WebSocket para resultados ao vivo
- Exportação CSV de resultados
- Dashboard analítico

---

## Variáveis de Ambiente (`.env`)

```env
# Banco
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=crossfit_arena

# JWT
JWT_ACCESS_SECRET=seu_secret_aqui
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=seu_refresh_secret_aqui
JWT_REFRESH_EXPIRES_IN=7d

# Storage (local | supabase | minio)
STORAGE_DRIVER=local
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...

# App
PORT=3004
NODE_ENV=development
DOMAIN=localhost
FRONTEND_URL=http://localhost:3000
COOKIE_DOMAIN=localhost
```

---

## Como Rodar Localmente

```bash
npm install
npm run start:dev        # hot reload na porta 3004
# Schema sync é automático no bootstrap
```

> **Swagger UI:** `http://localhost:3004/api/docs`
> **Frontend:** porta `3000`
> **Produção:** `api.sooacosports.com.br`
