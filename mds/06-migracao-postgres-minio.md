# Migração — Supabase → Postgres + MinIO (self-hosted na VPS Hostinger)

> Objetivo: tirar a dependência do Supabase (banco + storage) e deixar **tudo containerizado na mesma VPS Hostinger** que já roda o backend/frontend. Banco vira Postgres em container próprio; storage vira MinIO self-hosted. Backend NestJS/MikroORM continua exatamente como está — só troca infra.

## Decisões já tomadas

- **Não** migrar pro Appwrite Databases. O banco continua relacional (Postgres), MikroORM intacto. Reescrever a camada de dados pro SDK de qualquer BaaS foi avaliado e descartado — risco/esforço alto sem ganho real, já que as entidades (`campeonato`, `inscricao`, `prova`, `pontuacao`, `bateria`, `contestacao`...) têm relações reais que o Postgres resolve bem.
- **Appwrite foi tentado e descartado como camada de Storage.** Motivo: a versão atual (2.0) não é mais só "storage" — o stack gerado tem 17 serviços (Traefik, API, Console, Realtime, Workers, ClickHouse, Embedding de IA, Executor/Orchestrator pra Functions/Sites, Geo, Browser, Postgres próprio, Redis). Rodar isso tudo numa VPS de 2 vCPU / 7.8GB **junto** com o stack inteiro do CrossFit (Postgres, app, frontend, whatsapp-bridge, nginx) traria risco real de falta de recurso, só pra usar upload/download de arquivo — uma fração mínima do que a plataforma oferece.
- **MinIO entra no lugar do Appwrite.** Um único container, S3-compatible de verdade (protocolo real, não API própria), leve (dezenas de MB de RAM), resolve exatamente o que a `StorageProvider` do backend precisa: upload, download, delete, URL pública/assinada.

## Arquitetura alvo

```
VPS Hostinger (mesma que já roda tudo hoje — ver DEPLOY_VPS.md)
├── postgres (container próprio, rede interna do compose, sem porta pública)
├── minio (container próprio, API S3 só interna; console em 127.0.0.1:9001)
├── crossfit-app (NestJS)        → DB_HOST=postgres, STORAGE_DRIVER=minio
├── crossfit-frontend (Next.js)  → sem mudança
├── whatsapp-bridge               → sem mudança
└── nginx + certbot                → sem mudança
```

## Pré-requisito

- Backup atual do Supabase feito e guardado fora da VPS (dump `.dump` do Postgres + export dos buckets de Storage). Ver seção "Backup" no final — roda **antes** de começar qualquer fase abaixo.

---

## Fase 1 — Postgres containerizado ✅

1. Serviço `postgres` adicionado ao `docker-compose.yml` (imagem `postgres:17` — mesma major version do Supabase, evita mismatch de `pg_dump`/`pg_restore`), volume nomeado `postgres_data`, **sem** porta publicada — só rede interna do compose.
2. Usuário/banco dedicados (`crossfit_app` / `crossfit_arena`), não o superuser.
3. Conexão validada via `psql` dentro do container.

## Fase 2 — Migrar dados do Supabase pro Postgres novo ✅

1. `pg_dump` do Supabase (formato custom, `-F c`) rodado da própria VPS (precisou instalar `postgresql-client-17` via repositório PGDG, já que o Ubuntu 24.04 só tem cliente 16 por padrão e o Supabase roda servidor 17).
2. `pg_restore --no-owner --no-acl` no container novo.
3. Contagem de linhas validada 1:1 contra o Supabase nas tabelas principais (`usuario`, `campeonato`, `inscricao`, `prova`, `pontuacao`, `bateria`, `contestacao`, `lote`, `cidade`, `notificacao`) — feito em 2026-09-10, todas batendo exatamente.

## Fase 3 — MinIO self-hosted ✅

1. Serviço `minio` adicionado ao `docker-compose.yml` (imagem `minio/minio:latest`), volume `minio_data`, porta 9000 (API S3) **não publicada** (só rede interna, `app` acessa por `MINIO_ENDPOINT=minio`), porta 9001 (console web) publicada só em `127.0.0.1` (acesso via túnel SSH quando precisar mexer no painel).
2. `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` gerados e adicionados ao `.env` da VPS.
3. Buckets criados via `mc` (cliente embutido na própria imagem, rodado com `docker compose exec minio`): `atletas`, `avatars`, `banners`, `comprovantes`, `documentos`, `regulamentos` — mesma nomenclatura dos buckets do Supabase Storage original.

## Fase 4 — `MinioStorageProvider` ✅

Implementado em `src/upload/storage/minio.storage.ts`, mesma interface `StorageProvider` que já existia (`local.storage.ts`, `supabase.storage.ts`):

- Dependência: `minio` (SDK oficial Node).
- `upload()` → `putObject`, garante bucket existente + policy de leitura pública (`ensureBucket`, idempotente/cacheado em memória).
- `getPublicUrl()` → monta URL direto (`MINIO_PUBLIC_URL` ou `http(s)://MINIO_ENDPOINT:MINIO_PORT/bucket/path`) — funciona pros buckets com policy pública.
- `getSignedUrl()` → `presignedGetObject`, pra buckets/arquivos que devem ficar privados (ex: `comprovantes` de pagamento, se decidido não deixar público).
- `delete()` → `removeObject`.
- Branch novo no provider factory (`upload.module.ts`): `STORAGE_DRIVER=minio` → `MinioStorageProvider`.
- Variáveis novas no `.env`: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_USE_SSL` (opcional), `MINIO_PUBLIC_URL` (opcional).

> Ponto em aberto: decidir se `comprovantes` (documentos de pagamento) deve ter policy pública como os demais buckets, ou ficar privado e servido só via `getSignedUrl()`. Os outros buckets (`atletas`, `avatars`, `banners`, `documentos`, `regulamentos`) fazem sentido público, já que são exibidos direto no site.

## Fase 5 — Migrar arquivos existentes

1. Reaproveitar o backup do Storage já feito na Fase 1 (`crossfit_back/backups/storage_<timestamp>/`, 402 arquivos / 322.62MB) — não precisa baixar de novo do Supabase.
2. Subir cada arquivo pro bucket equivalente no MinIO (script simples com `minio` SDK, ou `mc mirror` apontando pra pasta local — mais rápido, já que `mc` já está disponível dentro do próprio container).
3. **Atualizar as URLs salvas no banco** (colunas como `foto_url`, `comprovante_url`, `banner_url`) trocando o domínio do Supabase pela nova URL do MinIO — roda como parte dessa fase, antes do cutover.

## Fase 6 — Cutover

1. Trocar env vars na VPS: `DB_HOST=postgres` (+ user/pass/db do container novo), `STORAGE_DRIVER=minio` + credenciais MinIO.
2. `docker compose up -d --build app`.
3. Conferir log: `Schema do banco sincronizado` (auto-sync do MikroORM, mesmo comportamento de hoje).
4. Smoke test manual: login, listar campeonatos, criar inscrição, upload de foto/comprovante, exibir banner, WhatsApp de notificação ainda funcionando.
5. Manter o projeto Supabase **pausado** (não deletar) por um período de segurança (sugestão: 2 semanas) antes de desligar de vez.

## Fase 7 — Backup pós-migração

Agora que banco e storage moram na mesma VPS, backup **fora da VPS** deixa de ser opcional:

- Cron diário rodando `pg_dump` local do container Postgres.
- Backup do volume `minio_data` (ou `mc mirror` pra fora, mais granular que snapshot de volume).
- Ambos sobem pra um destino externo (Cloudflare R2, Drive, S3 via `rclone`) com retenção (ex: 14-30 dias).
- Documentar restauração testada (não só o backup em si) — rodar um restore de teste depois que a rotina estiver no ar.

---

## Ordem de execução resumida

1. [x] Backup completo do Supabase (banco + storage) guardado fora da VPS. — feito 2026-09-10 (dump 343KB + storage 402 arquivos/322.62MB)
2. [x] Subir Postgres containerizado, restaurar dados, validar contagens. — feito 2026-09-10, contagens batendo 1:1 com o Supabase
3. [x] Subir MinIO self-hosted, criar buckets. — feito 2026-09-10 (Appwrite tentado antes e descartado por peso — ver "Decisões já tomadas")
4. [x] Implementar `MinioStorageProvider` + branch no provider factory. — feito 2026-09-10
5. [ ] Migrar arquivos do backup local → MinIO + atualizar URLs no banco.
6. [ ] Trocar env vars, rebuild `app`, smoke test completo.
7. [ ] Manter Supabase pausado por 2 semanas de segurança.
8. [ ] Configurar backup automático (Postgres + volume MinIO) pra fora da VPS.
9. [ ] Desligar Supabase.
