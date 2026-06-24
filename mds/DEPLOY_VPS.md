# Deploy CrossFit Arena — VPS Hostinger

## Arquitetura real

```
VPS Hostinger
└── /home/deploy/crossfit/
    ├── docker-compose.yml
    ├── .env                        ← variáveis do backend (app)
    ├── nginx/
    │   ├── nginx.conf
    │   └── certs/                  ← certificados Let's Encrypt
    ├── crossfit_back/              ← repositório git (branch main)
    │   └── whatsapp-bridge/
    └── crossfit_home/              ← repositório git (branch main)

Docker Compose — containers ativos:
  crossfit-app-1              → 127.0.0.1:3004  (NestJS backend)
  crossfit-frontend-1         → 127.0.0.1:3000  (Next.js frontend)
  crossfit-whatsapp-bridge-1  → 127.0.0.1:8082  (Baileys bridge)
  crossfit-nginx-1            → 0.0.0.0:80/443  (reverse proxy)
  crossfit-certbot-1          → renovação SSL automática
```

---

## Atualizar após git push (fluxo normal)

```bash
# 1. Atualizar código
cd /home/deploy/crossfit/crossfit_back && git pull origin main
cd /home/deploy/crossfit/crossfit_home && git pull origin main

# 2. Rebuildar e reiniciar apenas os containers alterados
cd /home/deploy/crossfit
docker compose build app frontend
docker compose up -d app frontend
```

> **Só backend mudou?** `docker compose build app && docker compose up -d app`
> **Só frontend mudou?** `docker compose build frontend && docker compose up -d frontend`

### Verificar que subiu corretamente

```bash
docker compose ps
docker compose logs app --tail 30
docker compose logs frontend --tail 20
```

No log do backend deve aparecer `Schema do banco sincronizado` — confirma que colunas novas foram criadas no Supabase automaticamente.

---

## Atualizar whatsapp-bridge

```bash
cd /home/deploy/crossfit/crossfit_back && git pull origin main
cd /home/deploy/crossfit
docker compose build whatsapp-bridge
docker compose up -d whatsapp-bridge
```

> A sessão do WhatsApp fica salva no volume `whatsapp_auth` — não é perdida no rebuild.

---

## Verificar status geral

```bash
docker compose -f /home/deploy/crossfit/docker-compose.yml ps
docker compose logs app --tail 50
ss -tlnp | grep -E '3000|3004|8082'
```

---

## Primeiro deploy (servidor zerado)

### Pré-requisitos
```bash
apt update && apt install -y docker.io docker-compose-plugin git
```

### Clonar os repos
```bash
mkdir -p /home/deploy/crossfit
cd /home/deploy/crossfit
git clone https://<USUARIO>:<TOKEN>@github.com/<USUARIO>/crossfit_back.git crossfit_back
git clone https://<USUARIO>:<TOKEN>@github.com/<USUARIO>/crossfit_home.git crossfit_home
```

### Criar `.env` (backend)
```bash
nano /home/deploy/crossfit/.env
```
As variáveis necessárias são:

- **DB**: host, port, user, password e dbName do Transaction Pooler do Supabase
- **JWT**: dois secrets aleatórios (access e refresh) gerados com `openssl rand -hex 32`
- **Domínio**: `DOMAIN`, `FRONTEND_URL`, `COOKIE_DOMAIN`
- **Supabase Storage**: URL e service key do projeto
- **WhatsApp**: `WHATSAPP_BRIDGE_URL=http://whatsapp-bridge:8082`, `WHATSAPP_INSTANCE=crossfit`, `WHATSAPP_ENABLED=true`

> Copie o `.env.example` do repositório como base: `cp crossfit_back/.env.example .env`

### Subir tudo
```bash
cd /home/deploy/crossfit
docker compose up -d --build
docker compose ps
```

---

## SSL (Let's Encrypt)

O certbot já roda como container e renova automaticamente a cada 12h.

Para emitir pela primeira vez (nginx na porta 80 deve estar no ar):
```bash
cd /home/deploy/crossfit
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d sooacosports.com.br \
  -d www.sooacosports.com.br \
  -d api.sooacosports.com.br
docker compose restart nginx
```

---

## DNS

| Tipo | Nome  | Valor     | TTL |
|------|-------|-----------|-----|
| A    | `@`   | `<VPS_IP>`| 300 |
| A    | `www` | `<VPS_IP>`| 300 |
| A    | `api` | `<VPS_IP>`| 300 |

---

## Problemas conhecidos

| Problema | Solução |
|----------|---------|
| Container não sobe após build | `docker compose logs <serviço> --tail 50` |
| Schema do banco não sincronizou | Ver log do `app` — `updateSchema` roda no boot |
| WhatsApp desconectou | Acessar `/admin/configuracoes/whatsapp` e escanear QR |
| Sessão WhatsApp perdida | Volume `whatsapp_auth` preserva a sessão entre rebuilds |
| Porta ocupada | `ss -tlnp \| grep <porta>` |
| 401 após deploy | Tokens antigos inválidos — fazer logout e login novamente |
| Supabase IPv6 | Usar Transaction Pooler (porta 6543), não Direct Connection (5432) |
| nginx não recarrega | `docker compose restart nginx` |
