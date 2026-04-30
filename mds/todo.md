# TODO — Só O Aço Games Backend

## Módulo 1 — Core & Registro ✅ Completo

---

## Módulo 2 — Gestão de Inscrições & Campeonatos

### 2.1 — Entidade `Campeonato`: Campos de Configuração
> O campeonato precisa armazenar as modalidades, tamanhos de camisa e campos dinâmicos do formulário de inscrição.

- [x] Adicionar campo `categorias` (JSON) — array de categorias disponíveis para o campeonato
  - Default pré-setado:
    ```
    iniciante masculino trio, iniciante feminino trio,
    scaled masculino trio, scaled feminino trio,
    intermediário masculino individual, intermediário feminino individual,
    master 35+ masculino individual, master 40+ masculino individual,
    rx masculino individual
    ```
- [x] Adicionar campo `tamanhosCamisa` (JSON) — array de tamanhos disponíveis
  - Default pré-setado:
    ```
    PP Feminino, P Feminino, M Feminino, G Feminino, GG Feminino,
    P Masculino, M Masculino, G Masculino, GG Masculino
    ```
- [x] Adicionar campo `camposFormulario` (JSON) — define quais campos o form de inscrição terá
  - Campos padrão (já vêm pré-configurados mas admin pode adicionar/remover):
    1. Nome do(s) atleta(s) — texto
    2. Categoria — select (puxa de `categorias`)
    3. Tamanho da camisa do(s) atleta(s) — select (puxa de `tamanhosCamisa`)
    4. Data de nascimento — date
    5. CPF — texto com máscara
    6. Box que representa — texto
    7. Foto do atleta/dupla (será postada no Instagram) — upload imagem
    8. Cidade — texto
    9. Comprovante de pagamento — upload imagem/PDF
- [x] Adicionar campo `whatsappNumero` (string, nullable) — número do evento para WhatsApp
- [x] Adicionar campo `valorInscricao` (number, nullable) — valor da inscrição em reais
- [x] Adicionar campo `chavePix` (string, nullable) — chave pix para pagamento
- [x] Criar DTOs atualizados (Create, Update) com validação dos novos campos
- [x] Rodar `schema:update` para aplicar as alterações

### 2.2 — Entidade `Inscricao`: Dados Completos do Atleta
> A inscrição armazena todas as respostas do formulário dinâmico + arquivo de comprovante.

- [x] Adicionar campo `dadosAtleta` (JSON) — respostas do formulário dinâmico
  - Estrutura: `{ campo: valor }` (ex: `{ "nome": "João", "cpf": "123.456.789-00", ... }`)
- [x] Adicionar campo `categoria` (string) — categoria selecionada
- [x] Adicionar campo `tamanhoCamisa` (string) — tamanho selecionado
- [x] Adicionar campo `comprovanteUrl` (string, nullable) — URL do arquivo uploaded
- [x] Adicionar campo `fotoAtletaUrl` (string, nullable) — URL da foto do atleta
- [x] Adicionar campo `observacoesAdmin` (text, nullable) — notas do admin ao aprovar/rejeitar
- [x] Adicionar campo `parceiros` (JSON, nullable) — array `[{ nome, cpf, tamanhoCamisa }]`
- [x] Adicionar campo `fotosAtletas` (JSON, nullable) — array de URLs de fotos
- [x] Adicionar campo `fotoModo` (string, nullable) — `'grupo'` ou `'individual'`
- [x] Adicionar campos de controle: `fotosUpdateCount`, `fotosUpdatedAt`, `comprovanteUpdateCount`, `comprovanteUpdatedAt`
- [x] Status flow expandido: `pending → awaiting_payment → payment_uploaded → approved → rejected`
- [x] Atualizar DTOs (Create, Update, Response)
- [x] Rodar `schema:update`

### 2.3 — Upload de Arquivos & Storage
> Comprovante de pagamento e foto do atleta precisam ser uploaded e armazenados.

- [x] Criar módulo `upload/` (UploadController, UploadService)
- [x] Endpoint `POST /api/v1/upload/image` — aceita imagem (jpg, png, webp), retorna URL
- [x] Endpoint `POST /api/v1/upload/document` — aceita imagem ou PDF, retorna URL
- [x] **StorageProvider abstração** — interface + LocalStorage + SupabaseStorage
- [x] **Supabase Storage em produção** — bucket `comprovantes` (privado, signed URLs) + `atletas` (público)
- [x] Validação: tamanho máximo 5MB, tipos permitidos (image/*, application/pdf)
- [x] Gerar nome único (UUID) para evitar colisões
- [x] **Signed URLs** para comprovantes — `getSignedUrl(bucket, filename, 3600)`

### 2.4 — Rotas Admin: Gestão de Campeonatos
> CRUD completo de campeonatos com configuração de formulário dinâmico.

- [x] `PUT /api/v1/campeonatos/:id/configuracao` — atualizar categorias, camisas, campos do form
- [x] `GET /api/v1/campeonatos/:id/configuracao` — retornar config completa (categorias, camisas, campos)
- [x] Proteger todas as rotas com `@Roles('admin', 'organizer')`
- [x] Validar que categorias e tamanhos são arrays de strings válidos

### 2.5 — Rotas Admin: Gestão de Inscrições
> O admin precisa visualizar, filtrar e aprovar/rejeitar inscrições.

- [x] `GET /api/v1/inscricoes/campeonato/:id` — listar inscrições com filtro por status
- [x] `GET /api/v1/inscricoes/:id` — detalhes completos da inscrição (dados do atleta, comprovante)
- [x] `PATCH /api/v1/inscricoes/:id/aprovar` — mudar status para `approved` + observações
- [x] `PATCH /api/v1/inscricoes/:id/rejeitar` — mudar status para `rejected` + motivo
- [x] `PATCH /api/v1/inscricoes/:id/parceiros-admin` — admin edita/adiciona parceiros da equipe
- [x] `GET /api/v1/inscricoes/campeonato/:id/stats` — contagem por status e por categoria
- [x] Proteger todas as rotas com `@Roles('admin', 'organizer')`

### 2.6 — Rotas do Atleta: Gestão de Inscrição
> O atleta pode gerenciar sua própria inscrição.

- [x] `PATCH /api/v1/inscricoes/:id/comprovante` — enviar/trocar comprovante (limite diário)
- [x] `PATCH /api/v1/inscricoes/:id/fotos` — enviar/trocar fotos (limite diário)
- [x] `PATCH /api/v1/inscricoes/:id/parceiros` — atleta edita/adiciona parceiros da equipe
- [x] `DELETE /api/v1/inscricoes/:id` — cancelar inscrição

---

## Módulo 2.5 — Correções & Evolução de Regras (Inscrições)
> Refinamento das regras de negócio e precificação.

- [x] **Lotes de Venda (`Lote`)**
  - Criar entidade `Lote` (nome, campeonato_id, dataFim, quantidadeTotal, valoresBase JSON).
  - Admin gerencia dinamicamente: adicionar novos lotes, mudar quantidades ou prazos.
- [x] **Precificação Dinâmica por Categoria**
  - Vincular o valor final na hora da inscrição baseado na modalidade (Individual, Dupla, Trio) *versus* o valor do lote ativo (ex: Lote 1 - Individual = R$ 200, Dupla = R$ 400, Trio = R$ 600).
- [x] **Validação de Inscrição Única**
  - Regra de negócio no backend que verifica se o `usuarioId` já possui inscrição `approved` ou `pending` em outra categoria do mesmo `campeonatoId`.
- [x] Atualizar API e Banco de Dados (schema update).

---

## Módulo 2.6 — Inscrição Sem Conta
> Permitir inscrição sem autenticação. Identidade por CPF + email. Vinculação automática futura.

- [x] **Entity `Inscricao`** — `usuario` nullable, novos campos `cpf` (indexado), `email` (indexado), `nomeAtleta`
- [x] **DTO `CreateInscricaoDto`** — Campos `cpf`, `email`, `nomeAtleta` obrigatórios
- [x] **DTO `ResponseInscricaoDto`** — Inclui `cpf`, `email`, `nomeAtleta` na resposta
- [x] **`POST /inscricoes/public`** — Endpoint sem AuthGuard para inscrição pública
- [x] **`POST /upload/public/image/:subfolder`** — Upload público restrito a `atletas` e `comprovantes`
- [x] **`POST /upload/public/document/:subfolder`** — Upload público de documentos
- [x] **`createPublic(dto)`** — Método no service sem vincular usuario
- [x] **Validação duplicidade** — CPF + e-mail + usuarioId (tripla verificação com `$or`)
- [x] **`linkToUser(userId, cpf, email)`** — Vinculação automática no login E no registro
- [x] **Schema update** — Executado com sucesso

---

## Módulo 2.7 — Inscrições em Equipe & Infraestrutura ✅
> Gestão de parceiros, fotos, validações e auto-sync do schema.

- [x] **Parceiros (JSON)** — campo `parceiros` na entidade `Inscricao` (`[{ nome, cpf, tamanhoCamisa }]`)
- [x] **Fotos de atletas** — campos `fotosAtletas` (JSON array), `fotoModo`, `fotosUpdateCount`, `fotosUpdatedAt`
- [x] **Endpoints de parceiros** — `PATCH :id/parceiros` (atleta) e `PATCH :id/parceiros-admin` (admin)
- [x] **Endpoints de fotos** — `PATCH :id/fotos` com limite diário (1x/dia)
- [x] **CPF no auth** — resposta de login/register inclui `cpf` do usuário
- [x] **Auto schema sync** — `updateSchema({ safe: true })` no bootstrap (`main.ts`)
- [x] **Validação 5MB backend** — já presente no `UploadService` (fileFilter)

---

## Próximos Passos (UX Inscrição & Infraestrutura)
- [x] Mostrar o preço na etapa 2 (seleção de modalidade) do formulário de inscrição
- [x] Mostrar o preço/resumo na etapa 3 (hora de pagar) no formulário de inscrição
- [x] Verificar se usuário já possui conta (via email ou CPF) durante a inscrição pública e pedir senha caso já exista
  - Endpoint `POST /auth/check-account` criado
  - Fluxo: Confirmar → check-account → login ou register → submeter inscrição autenticada
- [x] Corrigir lógica de visualização: inscrições recém submetidas não estão aparecendo no painel do usuário ("Minhas Inscrições")
  - `linkToUser` agora roda no login (signIn) além do registro
  - Inscrição agora usa endpoint autenticado (`POST /inscricoes`) em vez de `createPublic`
- [x] Simplificar sistema de preços: campos `precosModalidade` e `loteNome` direto no Campeonato (sem entidade Lote)
- [x] Máscara de dinheiro (`maskCurrency` / `parseCurrencyToNumber`) nos inputs de valor
- [x] Botão de copiar chave PIX na etapa 3 da inscrição
- [x] Modal de cancelamento de inscrição usando `useModal` (substituiu `confirm()` nativo)
- [x] Tornar o campo CPF obrigatório na criação de contas (`/auth/cadastro`)
- [x] Implementar validador local de CPF no frontend
- [x] Planejar arquitetura de storage (preparar para migração/uso do Supabase para banco e storage no futuro)

---

## Módulo 3 — Configuração da Landing Page (futuro)
- [ ] Endpoint para upload de banner do campeonato (bucket `banners` ✅ já criado)
- [ ] Campos de customização visual (cores primária/secundária, texto hero)
- [ ] Endpoint para salvar blocos da LP (seções habilitadas, ordem)
- [ ] Upload de assets de LP (bucket `lp-assets` ✅ já criado)
- [ ] Preview da LP antes de publicar

## Módulo 4 — Escala (futuro)
- [ ] WebSocket para resultados ao vivo
- [ ] Dashboard analítico (gráficos de inscrições por dia)

---

## Módulo 5 — Recuperação de Senha (Brevo SMTP)
> Fluxo de "Esqueci minha senha" usando Brevo (ex-Sendinblue) como provedor SMTP gratuito.

### 5.1 — Configuração do Brevo
- [ ] Criar conta gratuita no [Brevo](https://www.brevo.com/) (300 emails/dia grátis)
- [ ] Gerar credenciais SMTP (host, porta, user, password)
- [ ] Adicionar variáveis de ambiente:
  ```env
  SMTP_HOST=smtp-relay.brevo.com
  SMTP_PORT=587
  SMTP_USER=<brevo-login>
  SMTP_PASS=<brevo-smtp-key>
  SMTP_FROM=noreply@sooacosports.com.br
  ```

### 5.2 — Módulo de E-mail
- [ ] Criar módulo `mail/` (MailService)
- [ ] Instalar `nodemailer` (`npm i nodemailer @types/nodemailer`)
- [ ] `MailService.send(to, subject, html)` — envio genérico via SMTP Brevo
- [ ] Configurar transporte com as variáveis `SMTP_*`
- [ ] Template HTML base para e-mails (logo + footer)

### 5.3 — Fluxo de Recuperação
- [ ] Adicionar campo `resetToken` (string, nullable) e `resetTokenExpires` (Date, nullable) na entidade `Usuario`
- [ ] `POST /auth/forgot-password` — recebe `{ email }`, gera token UUID, salva hash no banco, envia e-mail com link
- [ ] `POST /auth/reset-password` — recebe `{ token, newPassword }`, valida token + expiração, atualiza senha, limpa token
- [ ] Token expira em 1 hora (`resetTokenExpires = now + 1h`)
- [ ] Salvar hash do token no banco (nunca o token bruto)
- [ ] Template de e-mail: "Redefinir sua senha" com botão/link → `https://sooacosports.com.br/redefinir-senha?token=xxx`
- [ ] Rate limit: máximo 3 solicitações por hora por e-mail
- [ ] Rodar `schema:update` (auto-sync cuida disso)

---

## Módulo 6 — Verificação de E-mail
> Garantir que o e-mail do usuário é válido. Modal persistente até verificar.

### 6.1 — Entidade e Fluxo
- [ ] Adicionar campo `emailVerificado` (boolean, default `false`) na entidade `Usuario`
- [ ] Adicionar campo `emailVerifyToken` (string, nullable) na entidade `Usuario`
- [ ] Incluir `emailVerificado` na resposta de login/register (dentro do objeto `usuario`)
- [ ] Rodar `schema:update`

### 6.2 — Endpoints
- [ ] `POST /auth/send-verification` — gera token, envia e-mail com link de verificação
  - Rota autenticada (precisa estar logado)
  - Template: "Confirme seu e-mail" com botão → `https://sooacosports.com.br/verificar-email?token=xxx`
  - Rate limit: máximo 3 envios por hora por usuário
- [ ] `POST /auth/verify-email` — recebe `{ token }`, marca `emailVerificado = true`, limpa token
  - Pode ser rota pública (token é validação suficiente)
- [ ] No `signIn` e `register`, preencher `emailVerificado` no retorno

### 6.3 — Envio automático no cadastro
- [ ] Ao registrar conta (`register`), enviar e-mail de verificação automaticamente
- [ ] Não bloquear o cadastro — o usuário pode usar a plataforma, mas verá o modal



