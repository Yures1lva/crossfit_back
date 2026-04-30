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
     → linkToUser(userId, cpf, email) — vincula inscrições órfãs
     → Retorna: { usuario: { id, nome, email, cpf, role } } — SEM tokens no body

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

| Cookie | httpOnly | Duração | Quem lê | Domain (prod) |
|---|---|---|---|---|
| `access_token` | ✅ Sim | 15 min | AuthGuard (NestJS) | `.sooacosports.com.br` |
| `refresh_token` | ✅ Sim | 7 dias | RefreshTokenGuard (NestJS) | `.sooacosports.com.br` |
| `user_role` | ❌ Não | 7 dias | Middleware Edge (Next.js) | `.sooacosports.com.br` |

> Cookies usam `sameSite: 'lax'` e `secure: true` em produção (first-party).

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

## Rotas — Completas

### Auth
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/auth/login` | ❌ | Login — seta cookies, retorna `{ usuario }` com CPF |
| `POST` | `/auth/register` | ❌ | Cadastro (CPF obrigatório) + linkToUser |
| `POST` | `/auth/refresh` | RefreshGuard | Renova access_token |
| `POST` | `/auth/logout` | ❌ | Limpa cookies |
| `GET` | `/auth/profile` | AuthGuard | Dados do logado |
| `POST` | `/auth/check-account` | ❌ | Verifica se existe conta por email/CPF |

### Campeonatos
| Método | Rota | Auth | Role | Descrição |
|---|---|---|---|---|
| `GET` | `/campeonatos` | ❌ | — | Lista públicos |
| `GET` | `/campeonatos/:id` | ❌ | — | Detalhe + LP data |
| `GET` | `/campeonatos/:id/configuracao` | ❌ | — | Categorias, camisas, campos |
| `POST` | `/campeonatos` | ✅ | `admin` | Cria campeonato |
| `PUT` | `/campeonatos/:id` | ✅ | `admin` | Atualiza |
| `PUT` | `/campeonatos/:id/configuracao` | ✅ | `admin` | Atualiza config do formulário |
| `DELETE` | `/campeonatos/:id` | ✅ | `admin` | Soft delete |

### Inscrições
| Método | Rota | Auth | Role | Descrição |
|---|---|---|---|---|
| `POST` | `/inscricoes` | ✅ | athlete | Inscrição autenticada |
| `POST` | `/inscricoes/public` | ❌ | — | Inscrição pública (CPF+email) |
| `GET` | `/inscricoes/minhas` | ✅ | athlete | Inscrições do atleta logado |
| `GET` | `/inscricoes/campeonato/:id` | ✅ | admin | Lista por campeonato + filtros |
| `GET` | `/inscricoes/campeonato/:id/stats` | ✅ | admin | Estatísticas |
| `GET` | `/inscricoes/:id` | ✅ | admin | Detalhes completos |
| `PATCH` | `/inscricoes/:id/aprovar` | ✅ | admin | Aprovar + observações |
| `PATCH` | `/inscricoes/:id/rejeitar` | ✅ | admin | Rejeitar + motivo |
| `PATCH` | `/inscricoes/:id/comprovante` | ✅ | athlete | Enviar/trocar comprovante |
| `PATCH` | `/inscricoes/:id/fotos` | ✅ | athlete | Enviar/trocar fotos |
| `PATCH` | `/inscricoes/:id/parceiros` | ✅ | athlete | Editar parceiros da equipe |
| `PATCH` | `/inscricoes/:id/parceiros-admin` | ✅ | admin | Admin edita parceiros |
| `DELETE` | `/inscricoes/:id` | ✅ | athlete | Cancelar inscrição |

### Upload
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/upload/image/:subfolder` | ✅ | Upload imagem autenticado |
| `POST` | `/upload/document/:subfolder` | ✅ | Upload documento autenticado |
| `POST` | `/upload/public/image/:subfolder` | ❌ | Upload público (atletas/comprovantes) |
| `POST` | `/upload/public/document/:subfolder` | ❌ | Upload público de documentos |

### Cidades
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/cidades` | ❌ | Lista cidades (com busca) |
| `POST` | `/cidades` | ✅ | Criar cidade |

---

## DTOs — Padrão

### Entrada (Create)
```ts
export class CreateInscricaoDto {
  @IsNotEmpty() @IsString()
  nomeAtleta!: string;

  @IsNotEmpty() @IsString()
  cpf!: string;

  @IsNotEmpty() @IsEmail()
  email!: string;

  @IsNotEmpty() @IsString()
  categoria!: string;

  @IsNotEmpty() @IsString()
  tamanhoCamisa!: string;

  @IsOptional()
  parceiros?: { nome: string; cpf: string; tamanhoCamisa: string }[];

  @IsOptional() @IsString()
  fotoModo?: 'grupo' | 'individual';
}
```

### Saída (Response)
```ts
export class ResponseInscricaoDto {
  id: string;
  nomeAtleta: string;
  cpf: string;
  email: string;
  categoria: string;
  tamanhoCamisa: string;
  status: string;
  parceiros: any[];
  fotosAtletas: string[];
  fotoModo: string;
  comprovanteUrl: string;
  fotoAtletaUrl: string;
  createdAt: Date;
}
```

### Update
```ts
export class UpdateInscricaoDto extends PartialType(CreateInscricaoDto) {}
```
