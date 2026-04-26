# CrossFit Arena — Backend (NestJS)

> API REST da plataforma de campeonatos de CrossFit. Construída com NestJS 11, MikroORM 6 e PostgreSQL.

## Contexto

Este backend serve como a camada de regras de negócio e persistência para a plataforma **CrossFit Arena**. É responsável por:

- Autenticação e autorização via JWT (access + refresh token em cookies `httpOnly`)
- Gestão de campeonatos, inscrições, categorias e resultados
- Landing Page configurável por campeonato (banner, cores, regras)
- Confirmação manual de pagamento pelo admin
- Documentação automática via Swagger

---

## Stack Tecnológica

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Framework | NestJS 11 | Arquitetura modular, DI, Guards, Pipes |
| Linguagem | TypeScript 5.7 | Tipagem forte em todo o projeto |
| Banco de Dados | PostgreSQL | Dados relacionais |
| ORM | MikroORM 6 | Mapeamento entidade→tabela, migrations |
| Auth | JWT + bcrypt | Access token + refresh token hasheado |
| Documentação | Swagger (`@nestjs/swagger`) | Auto-gerado a partir dos decorators |
| Validação | class-validator + class-transformer | DTOs autodescritivos e tipados |
| Config | `@nestjs/config` + `.env` | Variáveis de ambiente centralizadas |

---

## Fases de Desenvolvimento

### Módulo 1 — Core & Registro (MVP Launch)

| Entrega | Módulo Backend |
|---|---|
| Setup de infraestrutura e BD | `mikro-orm.config.ts`, `app.module.ts` |
| Sistema de autenticação | `auth/`, `usuario/` |
| Formulário dinâmico de inscrição | `inscricao/` |
| Landing Page personalizada | `campeonato/` (banner, regras, info) |

### Módulo 2 — Gestão de Campeonatos

- CRUD completo de campeonatos
- Categorias (RX, Scaled, Teen, Masters)
- Cronograma e programação de WODs
- Tabelas de classificação

### Módulo 3 — Escala & Comunicação

- Notificações por e-mail
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

# App
PORT=3004
NODE_ENV=development
DOMAIN=localhost
```

---

## Como Rodar Localmente

```bash
npm install
npm run start:dev        # hot reload na porta 3004
npm run migration:up     # aplicar migrations
```

> **Swagger UI:** `http://localhost:3004/api/docs`
> **Frontend:** porta `3000`
