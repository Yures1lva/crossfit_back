# TODO — Só O Aço Games Backend

## Módulo 1 — Core & Registro ✅ Completo

---

## Módulo 2 — Gestão de Inscrições & Campeonatos

### 2.1 — Entidade `Campeonato`: Campos de Configuração
> O campeonato precisa armazenar as modalidades, tamanhos de camisa e campos dinâmicos do formulário de inscrição.

- [ ] Adicionar campo `categorias` (JSON) — array de categorias disponíveis para o campeonato
  - Default pré-setado:
    ```
    iniciante masculino trio, iniciante feminino trio,
    scaled masculino trio, scaled feminino trio,
    intermediário masculino individual, intermediário feminino individual,
    master 35+ masculino individual, master 40+ masculino individual,
    rx masculino individual
    ```
- [ ] Adicionar campo `tamanhosCamisa` (JSON) — array de tamanhos disponíveis
  - Default pré-setado:
    ```
    PP Feminino, P Feminino, M Feminino, G Feminino, GG Feminino,
    P Masculino, M Masculino, G Masculino, GG Masculino
    ```
- [ ] Adicionar campo `camposFormulario` (JSON) — define quais campos o form de inscrição terá
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
- [ ] Adicionar campo `whatsappNumero` (string, nullable) — número do evento para WhatsApp
- [ ] Adicionar campo `valorInscricao` (number, nullable) — valor da inscrição em reais
- [ ] Adicionar campo `chavePix` (string, nullable) — chave pix para pagamento
- [ ] Criar DTOs atualizados (Create, Update) com validação dos novos campos
- [ ] Rodar `schema:update` para aplicar as alterações

### 2.2 — Entidade `Inscricao`: Dados Completos do Atleta
> A inscrição armazena todas as respostas do formulário dinâmico + arquivo de comprovante.

- [ ] Adicionar campo `dadosAtleta` (JSON) — respostas do formulário dinâmico
  - Estrutura: `{ campo: valor }` (ex: `{ "nome": "João", "cpf": "123.456.789-00", ... }`)
- [ ] Adicionar campo `categoria` (string) — categoria selecionada
- [ ] Adicionar campo `tamanhoCamisa` (string) — tamanho selecionado
- [ ] Adicionar campo `comprovanteUrl` (string, nullable) — URL do arquivo uploaded
- [ ] Adicionar campo `fotoAtletaUrl` (string, nullable) — URL da foto do atleta
- [ ] Adicionar campo `observacoesAdmin` (text, nullable) — notas do admin ao aprovar/rejeitar
- [ ] Status flow expandido: `pending → awaiting_payment → payment_uploaded → approved → rejected`
- [ ] Atualizar DTOs (Create, Update, Response)
- [ ] Rodar `schema:update`

### 2.3 — Upload de Arquivos
> Comprovante de pagamento e foto do atleta precisam ser uploaded e armazenados.

- [ ] Criar módulo `upload/` (UploadController, UploadService)
- [ ] Endpoint `POST /api/v1/upload/image` — aceita imagem (jpg, png, webp), retorna URL
- [ ] Endpoint `POST /api/v1/upload/document` — aceita imagem ou PDF, retorna URL
- [ ] Salvar arquivos em `public/uploads/` (dev) ou storage externo (prod)
- [ ] Validação: tamanho máximo 5MB, tipos permitidos (image/*, application/pdf)
- [ ] Gerar nome único (UUID) para evitar colisões

### 2.4 — Rotas Admin: Gestão de Campeonatos
> CRUD completo de campeonatos com configuração de formulário dinâmico.

- [ ] `PUT /api/v1/campeonatos/:id/configuracao` — atualizar categorias, camisas, campos do form
- [ ] `GET /api/v1/campeonatos/:id/configuracao` — retornar config completa (categorias, camisas, campos)
- [ ] Proteger todas as rotas com `@Roles('admin', 'organizer')`
- [ ] Validar que categorias e tamanhos são arrays de strings válidos

### 2.5 — Rotas Admin: Gestão de Inscrições
> O admin precisa visualizar, filtrar e aprovar/rejeitar inscrições.

- [ ] `GET /api/v1/inscricoes/campeonato/:id` — listar inscrições com filtro por status
- [ ] `GET /api/v1/inscricoes/:id` — detalhes completos da inscrição (dados do atleta, comprovante)
- [ ] `PATCH /api/v1/inscricoes/:id/aprovar` — mudar status para `approved` + observações
- [ ] `PATCH /api/v1/inscricoes/:id/rejeitar` — mudar status para `rejected` + motivo
- [ ] `GET /api/v1/inscricoes/campeonato/:id/stats` — contagem por status e por categoria
- [ ] Proteger todas as rotas com `@Roles('admin', 'organizer')`

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
