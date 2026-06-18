# Gerenciamento de Campeonato — Backend

Módulo responsável por pontuar, classificar e organizar o cronograma de campeonatos CrossFit ao vivo.

---

## Arquitetura

Três módulos NestJS independentes, todos aninhados sob o recurso `campeonatos/:campeonatoId/`:

```
src/
  prova/        → WODs/provas do campeonato
  pontuacao/    → Scores por atleta/prova + cálculo de posições
  bateria/      → Cronograma: heats, raias, arenas
  migrations/
    Migration20260618000000.ts   → cria tabelas prova, pontuacao, bateria
```

---

## Módulo `Prova`

### Entidade

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `campeonato` | ManyToOne | FK para Campeonato |
| `nome` | string | Nome da prova (ex: "WOD 1 – Fran") |
| `tipoValor` | enum | `tempo` / `inteiro` / `posicao_manual` |
| `unidade` | string? | Unidade do inteiro (ex: "reps", "kg", "cal") |
| `timecap` | string? | Tempo máximo (ex: "12:00") |
| `videoUrl` | string? | Link do vídeo explicativo |
| `tarefas` | string[]? | Lista de movimentos/tarefas |
| `cor` | string | Cor hex para identificação visual (default `#D9DD6E`) |
| `status` | enum | `em_andamento` / `concluida` |
| `menorVence` | boolean | `true` = menor valor é melhor (tempo); `false` = maior (reps/kg) |
| `ordem` | number | Ordem de exibição |
| `isDeleted` | boolean | Soft delete |

### Endpoints

```
GET    /campeonatos/:id/provas           → lista todas (público)
GET    /campeonatos/:id/provas/:provaId  → busca uma (público)
POST   /campeonatos/:id/provas           → cria (admin)
PUT    /campeonatos/:id/provas/:provaId  → atualiza (admin)
DELETE /campeonatos/:id/provas/:provaId  → remove soft (admin)
```

---

## Módulo `Pontuacao`

### Entidade

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `campeonato` | ManyToOne | FK |
| `prova` | ManyToOne | FK |
| `inscricao` | ManyToOne | FK — identifica o atleta/equipe |
| `valor` | double? | Valor bruto (segundos para tempo, inteiro para reps/kg) |
| `valorDisplay` | string? | Valor formatado para exibição (ex: "4:23", "150 reps") |
| `posicao` | int? | Posição nesta prova dentro da categoria |
| `pontos` | int? | Pontos calculados pelo índice fixo |

Índice único em `(prova, inscricao)` — um score por atleta por prova.

### Índice Fixo de Pontos

```
1° → 100 pts
2° → 94 pts
3° → 90 pts  (94 - (pos-2)*4)
4° → 86 pts
...
N° → max(0, 94 - (N-2)*4)
```

Implementado em `calcularPontos(posicao: number)`:
```ts
if (posicao === 1) return 100;
if (posicao === 2) return 94;
return Math.max(0, 94 - (posicao - 2) * 4);
```

### Fluxo de Upsert

**Tipo `tempo` / `inteiro` (Path B — valor → sort → posição):**
1. Admin envia `{ inscricaoId, provaId, valor, valorDisplay }`
2. Backend salva o valor
3. `recalcularPosicoes()` ordena todos os scores da categoria nesta prova pelo `valor` (respeitando `menorVence`)
4. Atribui `posicao` e `pontos` automaticamente para todos

**Tipo `posicao_manual` (Path A — posição direta):**
1. Admin envia `{ inscricaoId, provaId, posicaoManual }`
2. Backend salva `posicao = posicaoManual` e `pontos = calcularPontos(posicaoManual)` diretamente
3. **Não** roda `recalcularPosicoes()` — posição é autoritativa

### Endpoints

```
GET    /campeonatos/:id/pontuacoes/tabela?categoria=      → tabela geral (público)
GET    /campeonatos/:id/pontuacoes/prova/:provaId?categoria=  → scores de uma prova (público)
GET    /campeonatos/:id/pontuacoes/inscricao/:inscricaoId → visão do atleta (público)
POST   /campeonatos/:id/pontuacoes                       → upsert score (admin)
DELETE /campeonatos/:id/pontuacoes/prova/:provaId/limpar?categoria=  → limpa prova (admin)
```

### Tabela Geral (`tabelaGeral`)

Retorna `{ provas[], rows[] }` onde cada `row` tem:
- `inscricaoId`, `nomeAtleta`, `box`, `modalidade`, `categoria`
- `pontosPorProva`: `Record<provaId, pontos | null>`
- `totalPontos`: soma de todos os pontos
- `posicaoGeral`: rank na categoria (ordenado por `totalPontos DESC`)

---

## Módulo `Bateria`

### Entidade

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `campeonato` | ManyToOne | FK |
| `prova` | ManyToOne | FK |
| `categoriaKey` | string | Chave de categoria: `"modalidade\|categoria"` |
| `nome` | string | Ex: "Bateria 1", "Bateria Única" |
| `arenaLabel` | string? | Ex: "Arena A", "Box Principal" |
| `horaInicio` | string? | Ex: "09:30" |
| `horaFim` | string? | Ex: "09:45" |
| `lanes` | json | `{ raia, inscricaoId, nomeAtleta, box }[]` |
| `ordem` | number | Ordem dentro da prova |
| `isDeleted` | boolean | Soft delete |

### Geração Automática (`gerarAutomatico`)

```
POST /campeonatos/:id/baterias/gerar
Body: { provaId, categoriaKey, raiasPorBateria }
```

1. Busca todas as inscrições `approved` da categoria
2. Soft-deleta baterias existentes para essa prova+categoria
3. Divide os atletas em grupos de `raiasPorBateria`
4. Cria uma bateria por grupo com `lanes` preenchidas
5. Se cabe em um grupo → nome = "Bateria Única"

### Outros Endpoints

```
GET    /campeonatos/:id/baterias             → lista todas do campeonato
GET    /campeonatos/:id/baterias/prova/:id   → baterias de uma prova
POST   /campeonatos/:id/baterias             → cria manual
PUT    /campeonatos/:id/baterias/:id         → atualiza (horário, arena, raias)
DELETE /campeonatos/:id/baterias/:id         → remove soft
```

---

## Chave de Categoria

Formato: `"modalidade|categoria"` (pipe como separador)

Exemplos:
- `"Individual|RX MASCULINO"`
- `"Individual|MASTER 40+ FEMININO"`
- `"Trio|SCALED"`

Derivada de `[inscricao.modalidade, inscricao.categoria].filter(Boolean).join('|')`.

---

## Migration

`src/migrations/Migration20260618000000.ts`

Cria as tabelas `prova`, `pontuacao` e `bateria` com todos os campos e FK constraints para `campeonato` e `inscricao`.

---

## Registro no App

`src/app.module.ts` importa `ProvaModule`, `PontuacaoModule`, `BateriaModule`.

Cada módulo declara `MikroOrmModule.forFeature([...])` com suas entidades.
