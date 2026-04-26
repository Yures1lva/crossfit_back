# Engenharia de Conexão de Dados — CrossFit Arena

> Como front e back se comunicam. Fluxo de autenticação, convenções de API e DTOs.

---

## Fluxo de Autenticação

```
1. LOGIN
   POST /api/v1/auth/login { email, password }
     → bcrypt.compare(senha)
     → Gera access_token (JWT, 15min)
     → Gera refresh_token (JWT, 7d)
     → Hash do refresh com bcrypt → salva no banco
     → Seta cookies: access_token + refresh_token (httpOnly)
     → Seta cookie: user_role (não-httpOnly — Next.js middleware lê)
     → Retorna: { usuario } — SEM tokens no body

2. REQUEST AUTENTICADO
   GET /api/v1/campeonatos (com cookie access_token)
     → AuthGuard extrai token do cookie OU Bearer header
     → JwtService.verifyAsync(token)
     → Injeta payload em request['usuario']

3. REFRESH
   POST /api/v1/auth/refresh (com cookie refresh_token)
     → RefreshTokenGuard valida com JWT_REFRESH_SECRET
     → bcrypt.compare(token, hashDoBanco)
     → Gera novo access_token → seta cookie

4. LOGOUT
   POST /api/v1/auth/logout
     → Limpa todos os cookies
```

---

## Cookies

| Cookie | httpOnly | Duração | Quem lê |
|---|---|---|---|
| `access_token` | ✅ Sim | 15 min | AuthGuard (NestJS) |
| `refresh_token` | ✅ Sim | 7 dias | RefreshTokenGuard (NestJS) |
| `user_role` | ❌ Não | 7 dias | Middleware Edge (Next.js) |

---

## API REST — Convenções

### Prefixo Global
Todas as rotas: `/api/v1/...`

### Headers
```http
Content-Type: application/json
Authorization: Bearer <token> (alternativa ao cookie)
```

### Padrão de Erros
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Inscrições encerradas para este campeonato",
  "path": "/api/v1/campeonatos/uuid/inscrever",
  "timestamp": "2026-04-26T12:00:00.000Z",
  "errorCode": "REGISTRATION_CLOSED"
}
```

---

## Rotas — Módulo 1

### Auth
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/auth/login` | ❌ | Login — seta cookies |
| `POST` | `/auth/register` | ❌ | Cadastro de usuário |
| `POST` | `/auth/refresh` | RefreshGuard | Renova access_token |
| `POST` | `/auth/logout` | ❌ | Limpa cookies |
| `GET` | `/auth/profile` | AuthGuard | Dados do logado |

### Campeonatos
| Método | Rota | Auth | Role | Descrição |
|---|---|---|---|---|
| `GET` | `/campeonatos` | ❌ | — | Lista públicos |
| `GET` | `/campeonatos/:id` | ❌ | — | Detalhe + LP data |
| `POST` | `/campeonatos` | ✅ | `admin` | Cria campeonato |
| `PUT` | `/campeonatos/:id` | ✅ | `admin` | Atualiza |
| `DELETE` | `/campeonatos/:id` | ✅ | `admin` | Soft delete |

### Inscrições
| Método | Rota | Auth | Role | Descrição |
|---|---|---|---|---|
| `POST` | `/campeonatos/:id/inscrever` | ✅ | `athlete` | Inscrição |
| `GET` | `/campeonatos/:id/inscricoes` | ✅ | `admin` | Lista inscrições |
| `PATCH` | `/inscricoes/:id/pagamento` | ✅ | `admin` | Confirma pagamento |

---

## DTOs — Padrão

### Entrada (Create)
```ts
export class CreateCampeonatoDto {
  @IsNotEmpty() @IsString()
  nome!: string;

  @IsOptional() @IsString()
  descricao?: string;

  @IsOptional() @IsString()
  bannerUrl?: string;

  @IsOptional() @IsString()
  regulamento?: string;
}
```

### Saída (Response)
```ts
export class ResponseCampeonatoDto {
  id: string;
  nome: string;
  descricao?: string;
  bannerUrl?: string;
  status: string;
  createdAt: Date;

  constructor(entity: Campeonato) {
    // mapeia apenas campos seguros
  }
}
```

### Update
```ts
export class UpdateCampeonatoDto extends PartialType(CreateCampeonatoDto) {}
```
