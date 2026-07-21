# Deploy CrossFit Arena — VPS Hostinger

## Arquitetura alvo

```
VPS Hostinger — IP: <VPS_IP>
├── Docker nginx container
│   ├── sooacosports.com.br      → localhost:3005 (crossfit_home)
│   └── api.sooacosports.com.br  → localhost:3004 (crossfit_back)
│
├── PM2 (novos processos)
│   ├── crossfit-back  → node dist/main  :3004
│   └── crossfit-home  → next start      :3005
│
└── Supabase (banco de dados)
    └── PostgreSQL via Transaction Pooler
```

> Confirmar portas livres antes de subir: `ss -tlnp | grep -E '3004|3005'`

---

## Pré-requisitos

- [ ] Repositórios no GitHub com o código atualizado
  - `https://github.com/Yures1lva/crossfit_back`
  - `https://github.com/Yures1lva/crossfit_home`
- [ ] Supabase com banco criado e acessível (Transaction Pooler ativo)
- [ ] Domínio `sooacosports.com.br` com acesso ao painel DNS
- [ ] Token GitHub com permissão `Contents: Read` nos dois repos

---

## FASE 1 — Banco de dados (Supabase)

- [ ] **1.** Acessar Supabase → Connect → **Transaction Pooler** → anotar:
  - `host`: `aws-1-XX.pooler.supabase.com`
  - `port`: `6543`
  - `user`: `postgres.XXXXXXXXXXXXXXXX`
  - `password`: senha do projeto
  - `database`: `postgres`

- [ ] **2.** Garantir que o IP da VPS está autorizado no Supabase
  > Settings → Network → Allowed IPs (ou deixar aberto temporariamente)

---

## FASE 2 — Deploy do Backend (crossfit_back)

```bash
ssh root@<VPS_IP>
# confirmar porta disponível
ss -tlnp | grep -E '3004|3005'

# clonar
cd /var/www
git clone https://Yures1lva:<GITHUB_TOKEN>@github.com/Yures1lva/crossfit_back.git crossfit-back
cd crossfit-back
```

- [ ] **3.** Criar `.env`:
```bash
cp .env.example .env
nano .env
```

Preencher com os valores de produção:
```env
NODE_ENV=production
PORT=3004

DB_HOST=aws-1-XX.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.XXXXXXXXXXXXXXXX
DB_PASSWORD=<SUPABASE_DB_PASSWORD>
DB_NAME=postgres
DB_POOL_MIN=1
DB_POOL_MAX=10

JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<openssl rand -hex 32>
JWT_REFRESH_EXPIRES_IN=7d

DOMAIN=sooacosports.com.br
FRONTEND_URL=https://sooacosports.com.br
COOKIE_DOMAIN=.sooacosports.com.br

STORAGE_DRIVER=supabase
SUPABASE_URL=https://XXXXXXXX.supabase.co
SUPABASE_SERVICE_KEY=<SUPABASE_SERVICE_KEY>
```

- [ ] **4.** Instalar deps e build:
```bash
npm install
npm run build
```

- [ ] **5.** Verificar onde o main foi compilado:
```bash
ls dist/main.js 2>/dev/null && echo "dist/main" || ls dist/src/main.js 2>/dev/null && echo "dist/src/main"
```
> Se for `dist/src/main`, corrigir o script `start:prod` no `package.json`:
> ```bash
> sed -i 's|node dist/main|node dist/src/main|' package.json
> ```

- [ ] **6.** Criar `ecosystem.config.js`:
```bash
cat > /var/www/crossfit-back/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'crossfit-back',
    script: 'npm',
    args: 'run start:prod',
    cwd: '/var/www/crossfit-back',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3004,
    },
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    error_file: '/var/log/pm2/crossfit-back-error.log',
    out_file: '/var/log/pm2/crossfit-back-out.log',
  }],
};
EOF
```

- [ ] **7.** Testar manualmente antes de subir no PM2:
```bash
npm run start:prod 2>&1 | head -30
# deve mostrar "Nest application successfully started"
# Ctrl+C após confirmar
```

- [ ] **8.** Subir no PM2:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## FASE 3 — Deploy do Frontend (crossfit_home)

```bash
cd /var/www
git clone https://Yures1lva:<GITHUB_TOKEN>@github.com/Yures1lva/crossfit_home.git crossfit-home
cd crossfit-home
```

- [ ] **9.** Criar `.env.local`:
```bash
nano .env.local
```
```env
PORT=3005
NEXT_PUBLIC_API_URL=https://api.sooacosports.com.br/api/v1
BACKEND_URL=https://api.sooacosports.com.br/api/v1
NEXT_PUBLIC_APP_URL=https://sooacosports.com.br
```

- [ ] **10.** Instalar deps e build:
```bash
npm install
npm run build
```

- [ ] **11.** Criar `ecosystem.config.js`:
```bash
cat > /var/www/crossfit-home/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'crossfit-home',
    script: 'npm',
    args: 'run start',
    cwd: '/var/www/crossfit-home',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3005,
    },
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    error_file: '/var/log/pm2/crossfit-home-error.log',
    out_file: '/var/log/pm2/crossfit-home-out.log',
  }],
};
EOF
```

- [ ] **12.** Subir no PM2:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 status
# crossfit-back e crossfit-home devem estar online
```

---

## FASE 4 — Nginx

- [ ] **13.** Criar `/etc/nginx/sites-available/crossfit`:
```bash
nano /etc/nginx/sites-available/crossfit
```

```nginx
server {
    listen 80;
    server_name sooacosports.com.br www.sooacosports.com.br;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    server_name sooacosports.com.br www.sooacosports.com.br;
    ssl_certificate     /etc/letsencrypt/live/sooacosports.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sooacosports.com.br/privkey.pem;

    location / {
        proxy_pass         http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    location /_next/static/ {
        proxy_pass   http://localhost:3005;
        expires      1y;
        add_header   Cache-Control "public, immutable";
    }
}

server {
    listen 80;
    server_name api.sooacosports.com.br;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    server_name api.sooacosports.com.br;
    ssl_certificate     /etc/letsencrypt/live/sooacosports.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sooacosports.com.br/privkey.pem;
    client_max_body_size 20M;

    location / {
        proxy_pass         http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

- [ ] **14.** Ativar e testar:
```bash
ln -s /etc/nginx/sites-available/crossfit /etc/nginx/sites-enabled/crossfit
docker exec $(docker ps | grep nginx | awk '{print $1}') nginx -t
```
> Se der erro de SSL (certificado ainda não existe), comente os blocos `listen 443` temporariamente e reativa após o certbot.

---

## FASE 5 — DNS

No painel do domínio `sooacosports.com.br` → Zona DNS, adicionar 3 registros A apontando para o IP da VPS:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | `@` | `<VPS_IP>` | 300 |
| A | `www` | `<VPS_IP>` | 300 |
| A | `api` | `<VPS_IP>` | 300 |

- [ ] **15.** Adicionar os registros
- [ ] **16.** Aguardar propagação e confirmar:
```bash
nslookup sooacosports.com.br 8.8.8.8
# deve retornar o IP da VPS
```

---

## FASE 6 — SSL

- [ ] **17.** Emitir certificado (nginx deve estar servindo o domínio na porta 80 antes disso):
```bash
certbot certonly --webroot -w /var/www/certbot \
  -d sooacosports.com.br \
  -d www.sooacosports.com.br \
  -d api.sooacosports.com.br
```

- [ ] **18.** Recarregar nginx:
```bash
docker exec $(docker ps | grep nginx | awk '{print $1}') nginx -s reload
```

- [ ] **19.** Testar HTTPS:
```bash
curl -I https://sooacosports.com.br | head -3
curl -I https://api.sooacosports.com.br/api/v1 | head -3
```

---

## Notas de deploy — mudanças de banco (Prova: categorias/sexo/horário)

Essa leva de mudanças adiciona 3 colunas novas na tabela `prova` (backend):

| Coluna | Tipo | Default | Migration |
|--------|------|---------|-----------|
| `categorias` | `jsonb`, nullable | `null` (= vale pra todas as categorias) | `Migration20260720000000.ts` |
| `sexo` | `varchar(255)` | `'ambos'` | `Migration20260720000000.ts` |
| `hora_inicio` | `varchar(255)`, nullable | `null` | `Migration20260721000000.ts` |

- [ ] **Não precisa rodar migration manualmente.** O backend sincroniza o schema sozinho no boot (`generator.updateSchema({ safe: true, dropTables: false })` em `main.ts`) — só reiniciar o PM2 (`pm2 restart crossfit-back`) já cria as colunas novas no Supabase. As migrations em `src/migrations/` ficam só como documentação versionada do schema.
- [ ] Confirmar no log do PM2 que apareceu a linha `Schema do banco sincronizado` após o restart:
  ```bash
  pm2 logs crossfit-back --lines 30 --nostream | grep -i "schema"
  ```
- [ ] Compatibilidade: as colunas são `nullable`/com `default`, então provas já existentes continuam funcionando sem edição (equivalem a "vale pra todas as categorias, ambos os sexos").
- [ ] **Não rodar** `crossfit_back/scripts/seed-so-o-aco-2026.ts` em produção sem revisar antes — ele popula dados de teste (12 provas) no campeonato de slug fixo `aaaaa`, feito só pro ambiente local.
- [ ] O DTO de inscrições (`ResponseInscricaoDto`) passou a expor `campeonato.status` — nenhuma migration envolvida, é só um campo a mais na resposta da API.

---

## Atualizar após git push

```bash
# Backend
cd /var/www/crossfit-back && git pull && npm install && npm run build && pm2 restart crossfit-back

# Frontend
cd /var/www/crossfit-home && git pull && npm install && npm run build && pm2 restart crossfit-home
```

---

## Problemas conhecidos

| Problema | Solução |
|----------|---------|
| `nginx -s reload` não funciona | nginx roda em container Docker — usar `docker exec $(docker ps \| grep nginx \| awk '{print $1}') nginx -s reload` |
| `dist/main` não encontrado | Verificar se build gera `dist/src/main` e corrigir `start:prod` no package.json |
| Porta ocupada | Confirmar com `ss -tlnp` antes de escolher porta |
| PM2 não aplica PORT | Adicionar `PORT` no `env_production` do ecosystem.config.js e rodar com `--env production` |
| 401 após migrar | Tokens antigos inválidos — fazer logout e login novamente |
| Supabase IPv6 | VPS é IPv4 — usar Transaction Pooler (porta 6543), não Direct Connection (porta 5432) |
| Certbot falha no challenge | Garantir `location /.well-known/acme-challenge/ { root /var/www/certbot; }` no nginx **antes** de emitir o certificado |
