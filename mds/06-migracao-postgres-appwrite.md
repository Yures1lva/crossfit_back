# Migração — Supabase → Postgres + Appwrite Storage (self-hosted na VPS Hostinger)

> Objetivo: tirar a dependência do Supabase (banco + storage) e deixar **tudo containerizado na mesma VPS Hostinger** que já roda o backend/frontend. Banco vira Postgres em container próprio; storage vira Appwrite self-hosted (usado só como storage). Backend NestJS/MikroORM continua exatamente como está — só troca infra.

## Decisões já tomadas

- **Não** migrar pro Appwrite Databases. O banco continua relacional (Postgres), MikroORM intacto. Reescrever a camada de dados pro SDK do Appwrite foi avaliado e descartado — risco/esforço alto sem ganho real, já que as entidades (`campeonato`, `inscricao`, `prova`, `pontuacao`, `bateria`, `contestacao`...) têm relações reais que o Postgres resolve bem.
- Appwrite self-hosted entra **só como Storage**, substituindo o `SupabaseStorageProvider` — o `StorageProvider` já é uma interface abstrata no backend (`src/upload/storage/`), então isso é uma implementação nova, não uma reescrita.
- Justificativa de storage dedicado (em vez de disco local na VPS): evitar ponto único de falha compartilhado com o banco, evitar concorrência de I/O com a API, manter path pra escalar horizontal no futuro. Appwrite Storage resolve isso permanecendo self-hosted (sem sair da Hostinger) porque você já opera essa stack em outros projetos.

## Arquitetura alvo

```
VPS Hostinger (mesma que já roda tudo hoje — ver DEPLOY_VPS.md)
├── postgres (novo container, rede interna do compose, sem porta pública)
├── appwrite (stack self-hosted via docker-compose, só o produto Storage é usado)
├── crossfit-app (NestJS)        → DB_HOST=postgres, STORAGE_DRIVER=appwrite
├── crossfit-frontend (Next.js)  → sem mudança
├── whatsapp-bridge               → sem mudança
└── nginx + certbot                → sem mudança
```

## Pré-requisito

- Backup atual do Supabase feito e guardado fora da VPS (dump `.dump` do Postgres + export dos buckets de Storage). Ver seção "Backup" no final — rodar **antes** de começar qualquer fase abaixo.

---

## Fase 1 — Postgres containerizado

1. Adicionar serviço `postgres` ao `docker-compose.yml` existente (imagem `postgres:16`, volume nomeado pra persistência, **sem** publicar porta pro host — só rede interna do compose, o `app` acessa por `DB_HOST=postgres`).
2. Criar database e usuário dedicado da aplicação (não usar superuser `postgres` no app).
3. Subir o container vazio e validar conexão (`docker compose exec postgres psql -U crossfit_app -d crossfit_arena`).

## Fase 2 — Migrar dados do Supabase pro Postgres novo

1. `pg_dump` do Supabase (formato custom, `-F c`) — mesmo comando já validado antes.
2. Copiar o `.dump` pra dentro do host da VPS.
3. `pg_restore` no container novo:
   ```bash
   docker compose exec -T postgres pg_restore -U crossfit_app -d crossfit_arena --no-owner --no-acl < backup.dump
   ```
4. Conferir contagem de linhas das tabelas principais batendo com o Supabase antes de seguir (`usuario`, `campeonato`, `inscricao`, `prova`, `pontuacao`, `bateria`, `contestacao`, `lote`, `cidade`, `notificacao`).

## Fase 3 — Appwrite self-hosted (stack própria)

1. Subir o Appwrite via `docker-compose` (instalador oficial `appwrite/appwrite` cria o compose próprio) num diretório separado na mesma VPS, ou integrado ao compose principal — decidir na hora de executar conforme como você já costuma organizar isso nos outros projetos.
2. Criar o projeto no Appwrite console.
3. Criar os buckets equivalentes aos que existem no Supabase Storage hoje: `atletas`, `comprovantes`, `avatars`, `banners`.
4. Gerar API Key do Appwrite com escopo de Storage (`files.read`, `files.write`, `buckets.read`).

## Fase 4 — Novo `AppwriteStorageProvider`

Implementar a interface já existente (`src/upload/storage/storage.interface.ts`), espelhando `supabase.storage.ts`:

```
src/upload/storage/
  appwrite.storage.ts   ← novo
```

- Dependência: `node-appwrite` (SDK oficial).
- `upload()` → `storage.createFile(bucketId, ID.unique(), file)`.
- `getPublicUrl()` → `storage.getFileView(bucketId, fileId)` (bucket precisa estar com permissão de leitura pública, ou usar `getFilePreview` pra imagens).
- `getSignedUrl()` → Appwrite não tem signed URL igual Supabase; avaliar se dá pra usar permissões por arquivo/JWT do próprio Appwrite, ou se todo bucket relevante pode ser público (comprovante de pagamento pode precisar ficar privado — decidir por bucket).
- `delete()` → `storage.deleteFile(bucketId, fileId)`.
- Provider factory (`upload.module.ts`) ganha um branch novo: `STORAGE_DRIVER=appwrite` → `AppwriteStorageProvider`.
- Variáveis novas no `.env`: `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`.

> Ponto de atenção: mapear `bucket + filePath` do modelo atual (`{bucket}/{filePath}`) pro modelo do Appwrite (`bucketId + fileId` únicos, sem hierarquia de pastas real dentro do bucket) — decidir se o filePath vira parte do nome do arquivo ou se cada "bucket" lógico atual vira um bucket físico no Appwrite (mais simples, é o que a Fase 3 já assume).

## Fase 5 — Migrar arquivos existentes

1. Listar/baixar todos os arquivos dos buckets do Supabase Storage (script simples com `@supabase/supabase-js` + `SUPABASE_SERVICE_KEY`).
2. Subir cada um pro bucket equivalente no Appwrite (script com `node-appwrite`).
3. **Problema a resolver antes de rodar em produção**: as URLs dos arquivos hoje (banco tem a URL do Supabase salva em colunas como `foto_url`, `comprovante_url`, `banner_url`) vão mudar de formato. Precisa de um script de migração que:
   - baixa o arquivo do Supabase,
   - sobe no Appwrite,
   - faz `UPDATE` na linha do banco trocando a URL antiga pela nova (roda como parte da Fase 2, depois do restore, antes do cutover).

## Fase 6 — Cutover

1. Trocar env vars na VPS: `DB_HOST=postgres` (+ user/pass/db do container novo), `STORAGE_DRIVER=appwrite` + credenciais Appwrite.
2. `docker compose up -d --build app`.
3. Conferir log: `Schema do banco sincronizado` (auto-sync do MikroORM, mesmo comportamento de hoje).
4. Smoke test manual: login, listar campeonatos, criar inscrição, upload de foto/comprovante, exibir banner, WhatsApp de notificação ainda funcionando.
5. Manter o projeto Supabase **pausado** (não deletar) por um período de segurança (sugestão: 2 semanas) antes de desligar de vez.

## Fase 7 — Backup pós-migração

Agora que banco e storage moram na mesma VPS, backup **fora da VPS** deixa de ser opcional:

- Cron diário rodando `pg_dump` local do container Postgres.
- Backup dos volumes do Appwrite (arquivos de storage) — snapshot ou sync incremental.
- Ambos sobem pra um destino externo (Cloudflare R2, Drive, S3 via `rclone`) com retenção (ex: 14-30 dias).
- Documentar restauração testada (não só o backup em si) — rodar um restore de teste depois que a rotina estiver no ar.

---

## Ordem de execução resumida

1. [x] Backup completo do Supabase (banco + storage) guardado fora da VPS. — feito 2026-09-10 (dump 343KB + storage 402 arquivos/322.62MB)
2. [x] Subir Postgres containerizado, restaurar dados, validar contagens. — feito 2026-09-10, contagens batendo 1:1 com o Supabase (usuario=134, campeonato=2, inscricao=105, cidade=24, notificacao=73; prova/pontuacao/bateria/contestacao/lote=0 em ambos)
3. [ ] Subir Appwrite self-hosted, criar buckets + API key.
4. [ ] Implementar `AppwriteStorageProvider` + branch no provider factory.
5. [ ] Migrar arquivos Supabase → Appwrite + atualizar URLs no banco.
6. [ ] Trocar env vars, rebuild `app`, smoke test completo.
7. [ ] Manter Supabase pausado por 2 semanas de segurança.
8. [ ] Configurar backup automático (Postgres + volumes Appwrite) pra fora da VPS.
9. [ ] Desligar Supabase.
