# TODO — CrossFit Arena Backend

## Módulo 1 — Core & Registro (MVP Launch)

### Infraestrutura
- [x] Scaffold NestJS project
- [x] Configurar MikroORM + PostgreSQL
- [x] `main.ts` bootstrap (CORS, cookies, Swagger, ValidationPipe)
- [x] Filtros globais de exceção (AllExceptions, UniqueViolation, DatabaseException)
- [x] `.env.example`

### Autenticação (`auth/`)
- [x] `AuthModule` (@Global)
- [x] `AuthService` (signIn, refreshTokens, register)
- [x] `AuthController` (login, register, refresh, logout, profile)
- [x] `AuthGuard` (access_token via cookie/Bearer)
- [x] `RefreshTokenGuard`
- [x] `RolesGuard` + `@Roles()` decorator
- [x] `@CurrentUser()` decorator
- [x] Cookies httpOnly (access + refresh + role)

### Usuários (`usuario/`)
- [x] `Usuario` entity (id, nome, email, password, role, refreshToken, isDeleted)
- [x] `UsuarioService` (CRUD, findByEmail, updateRefreshToken)
- [x] `UsuarioController`
- [x] DTOs (Create, Update, Response)
- [x] Roles: `admin`, `organizer`, `athlete`

### Campeonatos (`campeonato/`)
- [x] `Campeonato` entity (nome, descricao, bannerUrl, regras, cores, datas, status)
- [x] `CampeonatoService` (CRUD)
- [x] `CampeonatoController` (rotas protegidas com guards)
- [x] DTOs (Create, Update, Response)
- [x] Campos de LP configurável (hero banner, cores, regulamento)

### Inscrições (`inscricao/`)
- [x] `Inscricao` entity (usuarioId, campeonatoId, status, paymentStatus, dados)
- [x] `InscricaoService` (inscrever, listar, confirmarPagamento)
- [x] `InscricaoController` (rotas protegidas)
- [x] DTOs (Create, Update, Response)
- [x] Status flow: pending → approved → confirmed

---

## Módulo 2 — Gestão de Campeonatos (futuro)
- [ ] Categorias (RX, Scaled, Teen, Masters)
- [ ] WODs e programação
- [ ] Tabelas de classificação
- [ ] Resultados por atleta

## Módulo 3 — Escala (futuro)
- [ ] Notificações por e-mail
- [ ] WebSocket para resultados ao vivo
- [ ] Dashboard analítico
