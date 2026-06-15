# Plano de Implementação — Notificações WhatsApp

> Canal: WhatsApp via Baileys (mesmo padrão do nextcomp).
> Trigger principal: mudanças de status na inscrição.
> Cron diário: lembrete D-1 para atletas aprovados.

---

## Contexto

| Campo | Valor |
|---|---|
| Telefone do atleta | `inscricao.telefone` (já existe na entity) |
| Instância WhatsApp | `crossfit` |
| Porta do bridge | `8083` no host → `8082` no container |
| `WHATSAPP_ENABLED` | `false` em dev, `true` em prod |

---

## Notificações

| Tipo | Trigger | Destinatário |
|---|---|---|
| `inscricao_aprovada` | `status` → `APPROVED` | `inscricao.telefone` |
| `inscricao_rejeitada` | `status` → `REJECTED` | `inscricao.telefone` |
| `pagamento_confirmado` | `paymentStatus` → `CONFIRMED` | `inscricao.telefone` |
| `lembrete_campeonato` | cron 08:00 BRT — `dataInicio` = amanhã | todos os `APPROVED` do campeonato |

---

## Arquitetura

```
crossfit_back/
├── whatsapp-bridge/
│   ├── index.js          ← Express + Baileys (porta 8082)
│   ├── package.json
│   ├── Dockerfile
│   └── .gitignore        ← ignorar auth/
│
└── src/
    ├── whatsapp/
    │   ├── whatsapp.module.ts
    │   └── whatsapp.service.ts
    │
    └── notificacoes/
        ├── entities/
        │   └── notificacao.entity.ts
        ├── cron/
        │   └── campeonato.cron.ts
        ├── notificacoes.service.ts
        ├── notificacoes.controller.ts
        └── notificacoes.module.ts
```

---

## Fase 1 — WhatsApp Bridge

### 1.1 Criar `whatsapp-bridge/`

Clonar estrutura do nextcomp — única diferença é o nome do browser/instância.

**`whatsapp-bridge/index.js`**
```js
// igual ao nextcomp — trocar apenas:
browser: ['Crossfit', 'Chrome', '124.0.0'],
// e a mensagem de log inicial
```

**`whatsapp-bridge/package.json`**
```json
{
  "name": "crossfit-whatsapp-bridge",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": { "start": "node index.js" },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.9",
    "express": "^4.18.3",
    "pino": "^9.0.0",
    "qrcode": "^1.5.3"
  }
}
```

**`whatsapp-bridge/Dockerfile`**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.js .
EXPOSE 8082
CMD ["node", "index.js"]
```

**`whatsapp-bridge/.gitignore`**
```
auth/
node_modules/
```

### 1.2 Atualizar `docker-compose.yml` na VPS

Adicionar o serviço:

```yaml
whatsapp-bridge:
  build: ./crossfit_back/whatsapp-bridge
  restart: always
  volumes:
    - whatsapp_auth:/app/auth
  ports:
    - "127.0.0.1:8083:8082"

volumes:
  whatsapp_auth:
```

### 1.3 Variáveis de ambiente (`.env` na VPS)

```env
WHATSAPP_BRIDGE_URL=http://whatsapp-bridge:8082
WHATSAPP_INSTANCE=crossfit
WHATSAPP_ENABLED=true
```

---

## Fase 2 — WhatsappModule (Backend NestJS)

### 2.1 `src/whatsapp/whatsapp.service.ts`

- Fila in-memory com intervalo de 4s entre mensagens
- `sendText(phone, text): Promise<boolean>`
- `getStatus()`, `getQr()`, `disconnect()`
- `normalizePhone()` — adiciona `55` se necessário
- `WHATSAPP_ENABLED=false` → só loga, não envia

### 2.2 `src/whatsapp/whatsapp.module.ts`

```ts
@Global()
@Module({
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
```

### 2.3 Registrar no `AppModule`

```ts
imports: [
  // ...
  WhatsappModule,
  ScheduleModule.forRoot(),   // necessário para o cron
]
```

### 2.4 Instalar dependências

```bash
npm install @nestjs/schedule
```

---

## Fase 3 — Entidade Notificacao

### 3.1 `src/notificacoes/entities/notificacao.entity.ts`

```ts
export enum NotificacaoCanal  { WHATSAPP = 'whatsapp', SISTEMA = 'sistema' }
export enum NotificacaoStatus { ENVIADA = 'enviada', ERRO = 'erro', PENDENTE = 'pendente' }

export type NotificacaoTipo =
  | 'inscricao_aprovada'
  | 'inscricao_rejeitada'
  | 'pagamento_confirmado'
  | 'lembrete_campeonato';

@Entity({ tableName: 'notificacao' })
export class Notificacao {
  @PrimaryKey({ type: 'uuid' }) id: string = uuidv4();
  @Property() tipo!: string;
  @Property({ nullable: true, type: 'uuid' }) usuarioId?: string;
  @Property({ nullable: true, type: 'uuid' }) campeonatoId?: string;
  @Property({ nullable: true, type: 'uuid' }) inscricaoId?: string;
  @Enum(() => NotificacaoCanal) canal: NotificacaoCanal = NotificacaoCanal.SISTEMA;
  @Enum(() => NotificacaoStatus) status: NotificacaoStatus = NotificacaoStatus.PENDENTE;
  @Property() titulo!: string;
  @Property({ type: 'text' }) corpo!: string;
  @Property({ nullable: true }) phone?: string;
  @Property({ type: 'json', nullable: true }) metadados?: Record<string, any>;
  @Property({ default: false }) lida: boolean = false;
  @Property({ nullable: true }) erroMsg?: string;
  @Property({ nullable: true }) enviadoEm?: Date;
  @Property({ onCreate: () => new Date() }) criadoEm: Date = new Date();
}
```

### 3.2 Migration

O schema sync automático do bootstrap vai criar a tabela.
Se quiser migration explícita:
```bash
npx mikro-orm migration:create --name CreateNotificacao
```

---

## Fase 4 — NotificacoesService

### 4.1 `src/notificacoes/notificacoes.service.ts`

Métodos públicos:

```ts
// Genérico — persiste no banco + envia WhatsApp se tiver phone
async enviar(params: EnviarParams): Promise<void>

// Trigger: status → APPROVED
async notificarInscricaoAprovada(params: {
  inscricaoId: string;
  nomeAtleta: string;
  phone?: string;
  campeonatoNome: string;
  campeonatoId: string;
  dataInicio?: Date;
  categoria?: string;
  modalidade?: string;
}): Promise<void>

// Trigger: status → REJECTED
async notificarInscricaoRejeitada(params: {
  inscricaoId: string;
  nomeAtleta: string;
  phone?: string;
  campeonatoNome: string;
  campeonatoId: string;
  motivo?: string;
}): Promise<void>

// Trigger: paymentStatus → CONFIRMED
async notificarPagamentoConfirmado(params: {
  inscricaoId: string;
  nomeAtleta: string;
  phone?: string;
  campeonatoNome: string;
  campeonatoId: string;
  dataInicio?: Date;
}): Promise<void>

// Cron — chamado pelo CampeonatoCron
async notificarLembreteCampeonato(params: {
  inscricaoId: string;
  nomeAtleta: string;
  phone?: string;
  campeonatoNome: string;
  campeonatoId: string;
  dataInicio: Date;
}): Promise<void>

// Painel admin
async listar(params): Promise<{ data: Notificacao[]; meta: PaginaMeta }>
async contarNaoLidas(): Promise<number>
async marcarLida(id: string): Promise<Notificacao>
```

### 4.2 Templates de mensagem

**inscricao_aprovada**
```
✅ Olá, *{nome}*!

Sua inscrição no *{campeonato}* foi *aprovada*! 🎉
{categoria ? `📌 Categoria: *{categoria}*\n` : ''}
📅 Data do evento: *{dataInicio}*

Fique atento às próximas instruções. Boa sorte! 💪
```

**inscricao_rejeitada**
```
❌ Olá, *{nome}*,

Sua inscrição no *{campeonato}* foi *rejeitada*.
{motivo ? `📋 Motivo: {motivo}\n` : ''}
Entre em contato com os organizadores para mais informações.
```

**pagamento_confirmado**
```
💰 Olá, *{nome}*!

Seu pagamento no *{campeonato}* foi *confirmado*! ✅
Sua vaga está garantida. 🏋️

📅 Nos vemos em *{dataInicio}*!
```

**lembrete_campeonato**
```
⏰ Olá, *{nome}*!

Lembrete: o *{campeonato}* é *amanhã*! 🏋️‍♀️

Prepare seu equipamento, descanse bem e chegue no horário. 💪
Qualquer dúvida, fale com os organizadores.
```

---

## Fase 5 — NotificacoesController

### 5.1 `src/notificacoes/notificacoes.controller.ts`

```
GET  /notificacoes                    → listar histórico (admin/organizer)
GET  /notificacoes/nao-lidas          → contar não lidas
PATCH /notificacoes/:id/lida          → marcar como lida
GET  /notificacoes/whatsapp/status    → status da conexão
GET  /notificacoes/whatsapp/qr        → QR code (base64 PNG)
POST /notificacoes/whatsapp/desconectar → resetar sessão
POST /notificacoes/cron/executar      → disparar cron manualmente (admin)
```

Guards: `AuthGuard` + `RolesGuard` — roles `admin` e `organizer`.

---

## Fase 6 — CampeonatoCron

### 6.1 `src/notificacoes/cron/campeonato.cron.ts`

```ts
@Cron('0 8 * * *', { timeZone: 'America/Sao_Paulo' })
async executar(): Promise<void>
```

**Lógica:**
1. Buscar campeonatos com `dataInicio` = amanhã e `status` IN `[published, ongoing]`
2. Para cada campeonato: buscar inscrições com `status = APPROVED`
3. Para cada inscrição: chamar `notificacoesService.notificarLembreteCampeonato()`
   - Guard de duplicata: verificar se já enviou `lembrete_campeonato` para essa inscrição hoje

---

## Fase 7 — Hooks no InscricaoService

Nos métodos que mudam o status, adicionar chamada fire-and-forget **após** o flush:

```ts
// Aprovar inscrição
await this.em.flush();
this.notificarAsync(() =>
  this.notificacoes.notificarInscricaoAprovada({
    inscricaoId: inscricao.id,
    nomeAtleta: inscricao.nomeAtleta,
    phone: inscricao.telefone,
    campeonatoNome: inscricao.campeonato.nome,
    campeonatoId: inscricao.campeonato.id,
    dataInicio: inscricao.campeonato.dataInicio,
    categoria: inscricao.categoria,
    modalidade: inscricao.modalidade,
  })
);
```

```ts
// Helper fire-and-forget (no InscricaoService)
private notificarAsync(fn: () => Promise<void>): void {
  fn().catch(err =>
    this.logger.error(`Falha ao notificar: ${err?.message}`)
  );
}
```

**Pontos de hook:**
- `aprovarInscricao()` → `notificarInscricaoAprovada`
- `rejeitarInscricao()` → `notificarInscricaoRejeitada`
- Método que confirma pagamento → `notificarPagamentoConfirmado`

---

## Fase 8 — Deploy na VPS

### 8.1 Atualizar `docker-compose.yml`

```yaml
whatsapp-bridge:
  build: ./crossfit_back/whatsapp-bridge
  restart: always
  volumes:
    - whatsapp_auth:/app/auth
  ports:
    - "127.0.0.1:8083:8082"
```

### 8.2 Atualizar variáveis no `.env` da VPS

```env
WHATSAPP_BRIDGE_URL=http://whatsapp-bridge:8082
WHATSAPP_INSTANCE=crossfit
WHATSAPP_ENABLED=true
```

### 8.3 Rebuild

```bash
cd ~/crossfit
git pull crossfit_back
docker compose up -d --build whatsapp-bridge app
```

### 8.4 Escanear QR

Acessar `https://admin.sooacosports.com.br/painel/configuracoes/whatsapp` (a criar no front) ou usar a rota diretamente:
```
GET https://api.sooacosports.com.br/api/v1/notificacoes/whatsapp/qr
```

---

## Checklist

> 🤖 = código · 👤 = você (config/infra)

- [ ] **Fase 1 — Bridge**
  - [ ] 🤖 Criar `whatsapp-bridge/index.js` (adaptar do nextcomp)
  - [ ] 🤖 Criar `whatsapp-bridge/package.json`
  - [ ] 🤖 Criar `whatsapp-bridge/Dockerfile`
  - [ ] 🤖 Criar `whatsapp-bridge/.gitignore`
- [ ] **Fase 2 — WhatsappModule**
  - [ ] 🤖 `whatsapp.service.ts`
  - [ ] 🤖 `whatsapp.module.ts`
  - [ ] 🤖 Registrar no `AppModule` + instalar `@nestjs/schedule`
- [ ] **Fase 3 — Entidade**
  - [ ] 🤖 `notificacao.entity.ts`
  - [ ] 🤖 Registrar entidade no `MikroOrmModule`
- [ ] **Fase 4 — NotificacoesService**
  - [ ] 🤖 Método genérico `enviar()`
  - [ ] 🤖 `notificarInscricaoAprovada()`
  - [ ] 🤖 `notificarInscricaoRejeitada()`
  - [ ] 🤖 `notificarPagamentoConfirmado()`
  - [ ] 🤖 `notificarLembreteCampeonato()`
  - [ ] 🤖 `listar()`, `contarNaoLidas()`, `marcarLida()`
- [ ] **Fase 5 — Controller**
  - [ ] 🤖 Rotas WhatsApp (status, qr, desconectar)
  - [ ] 🤖 Rotas histórico (listar, nao-lidas, marcar lida)
  - [ ] 🤖 Rota cron manual
- [ ] **Fase 6 — Cron**
  - [ ] 🤖 `campeonato.cron.ts` — lembrete D-1
- [ ] **Fase 7 — Hooks InscricaoService**
  - [ ] 🤖 Hook em `aprovarInscricao()`
  - [ ] 🤖 Hook em `rejeitarInscricao()`
  - [ ] 🤖 Hook em confirmação de pagamento
- [ ] **Fase 8 — Deploy**
  - [ ] 🤖 Atualizar `docker-compose.yml` com `whatsapp-bridge`
  - [ ] 👤 Adicionar vars WhatsApp no `.env` da VPS
  - [ ] 👤 `docker compose up -d --build`
  - [ ] 👤 Escanear QR pelo endpoint `/notificacoes/whatsapp/qr`
  - [ ] 👤 Testar: aprovar inscrição → receber mensagem no celular

---

## Resumo de arquivos novos/modificados

| Arquivo | Ação |
|---|---|
| `whatsapp-bridge/index.js` | Criar |
| `whatsapp-bridge/package.json` | Criar |
| `whatsapp-bridge/Dockerfile` | Criar |
| `src/whatsapp/whatsapp.service.ts` | Criar |
| `src/whatsapp/whatsapp.module.ts` | Criar |
| `src/notificacoes/entities/notificacao.entity.ts` | Criar |
| `src/notificacoes/notificacoes.service.ts` | Criar |
| `src/notificacoes/notificacoes.controller.ts` | Criar |
| `src/notificacoes/notificacoes.module.ts` | Criar |
| `src/notificacoes/cron/campeonato.cron.ts` | Criar |
| `src/inscricao/inscricao.service.ts` | Modificar (hooks) |
| `src/app.module.ts` | Modificar (registrar módulos) |
| `docker-compose.yml` (VPS) | Modificar (bridge container) |
