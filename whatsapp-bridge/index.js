const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestWaWebVersion,
} = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

let sock = null;
let isConnected = false;
let currentQrDataUrl = null;

const AUTH_DIR = process.env.AUTH_DIR || './auth';

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestWaWebVersion().catch(() => ({
    version: [2, 3000, 1023121],
  }));

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: require('pino')({ level: 'silent' }),
    browser: ['Crossfit', 'Chrome', '124.0.0'],
    connectTimeoutMs: 60_000,
    retryRequestDelayMs: 2_000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      currentQrDataUrl = await QRCode.toDataURL(qr);
      console.log('QR gerado — acesse /api/v1/notificacoes/whatsapp/qr para escanear');
    }

    if (connection === 'open') {
      isConnected = true;
      currentQrDataUrl = null;
      console.log('✅  WhatsApp conectado!\n');
    }

    if (connection === 'close') {
      isConnected = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log(`⚠️  Reconectando (código ${code})...`);
        setTimeout(connect, 5000);
      } else {
        console.log('🔴 Sessão expirada. Desconecte e escaneie novamente.');
      }
    }
  });
}

app.get('/status', (_req, res) => {
  res.json({ connected: isConnected });
});

app.get('/qr', (_req, res) => {
  res.json({ qr: currentQrDataUrl, connected: isConnected });
});

app.post('/disconnect', async (_req, res) => {
  try {
    if (sock) {
      await sock.logout().catch(() => {});
      sock = null;
    }
    isConnected = false;
    currentQrDataUrl = null;

    const authDir = path.resolve(AUTH_DIR);
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }

    setTimeout(connect, 1000);
    res.json({ ok: true, message: 'Sessão encerrada. Reconectando para gerar novo QR…' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/check/:number', async (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'Não conectado' });
  try {
    const digits = req.params.number.replace(/\D/g, '');
    const [result] = await sock.onWhatsApp(digits);
    res.json({ number: digits, exists: !!result?.exists, jid: result?.jid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/message/sendText/:instance', async (req, res) => {
  const { number, text } = req.body;
  if (!isConnected) return res.status(503).json({ error: 'WhatsApp não conectado.' });

  try {
    const digits = number.replace(/\D/g, '');
    const [check] = await sock.onWhatsApp(digits);
    if (!check?.exists) {
      console.log(`❌ Número não encontrado no WhatsApp: ${digits}`);
      return res.status(404).json({ error: `Número ${digits} não encontrado no WhatsApp.` });
    }

    await sock.sendMessage(check.jid, { text });
    console.log(`✉️  → ${check.jid}: ${text.slice(0, 80)}`);
    res.json({ ok: true, jid: check.jid });
  } catch (err) {
    console.error('Erro ao enviar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8082;
app.listen(PORT, () => console.log(`🟡 WhatsApp Bridge (Crossfit) na porta ${PORT}\n`));
connect();
