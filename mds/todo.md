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
- [x] Status flow expandido: `pending → awaiting_payment → payment_uploaded → approved → rejected`
- [x] Atualizar DTOs (Create, Update, Response)
- [x] Rodar `schema:update`

### 2.3 — Upload de Arquivos
> Comprovante de pagamento e foto do atleta precisam ser uploaded e armazenados.

- [x] Criar módulo `upload/` (UploadController, UploadService)
- [x] Endpoint `POST /api/v1/upload/image` — aceita imagem (jpg, png, webp), retorna URL
- [x] Endpoint `POST /api/v1/upload/document` — aceita imagem ou PDF, retorna URL
- [x] Salvar arquivos em `public/uploads/` (dev) ou storage externo (prod)
- [x] Validação: tamanho máximo 5MB, tipos permitidos (image/*, application/pdf)
- [x] Gerar nome único (UUID) para evitar colisões

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
- [x] `GET /api/v1/inscricoes/campeonato/:id/stats` — contagem por status e por categoria
- [x] Proteger todas as rotas com `@Roles('admin', 'organizer')`

---

## Módulo 2.5 — Correções & Evolução de Regras (Inscrições)
> Refinamento das regras de negócio e precificação.

- [ ] **Lotes de Venda (`Lote`)**
  - Criar entidade `Lote` (nome, campeonato_id, dataFim, quantidadeTotal, valoresBase JSON).
  - Admin gerencia dinamicamente: adicionar novos lotes, mudar quantidades ou prazos.
- [ ] **Precificação Dinâmica por Categoria**
  - Vincular o valor final na hora da inscrição baseado na modalidade (Individual, Dupla, Trio) *versus* o valor do lote ativo (ex: Lote 1 - Individual = R$ 200, Dupla = R$ 400, Trio = R$ 600).
- [ ] **Validação de Inscrição Única**
  - Regra de negócio no backend que verifica se o `usuarioId` já possui inscrição `approved` ou `pending` em outra categoria do mesmo `campeonatoId`.
- [ ] Atualizar API e Banco de Dados (schema update).

---

## Módulo 3 — Configuração da Landing Page (futuro)
- [ ] Endpoint para upload de banner do campeonato
- [ ] Campos de customização visual (cores primária/secundária, texto hero)
- [ ] Endpoint para salvar blocos da LP (seções habilitadas, ordem)
- [ ] Preview da LP antes de publicar

## Módulo 4 — Escala (futuro)
- [ ] Notificações por e-mail (confirmação inscrição, aprovação)
- [ ] WebSocket para resultados ao vivo
- [ ] Dashboard analítico (gráficos de inscrições por dia)
