import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pino from 'pino';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pairRouter from './pair.js';
import { Handler } from './inconnu/handler/handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const sessionsPath = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsPath)) fs.mkdirSync(sessionsPath);

// Route pour la page web statique
app.use(express.static(path.join(__dirname, 'web')));
app.use('/code', pairRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

// Gérer plusieurs sessions par ID
const socks = new Map();

async function startSock(id) {
  const sessionDir = path.join(sessionsPath, id);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['INCONNU-XD', 'Safari', '1.0.0'],
  });

  socks.set(id, sock);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log(`🔄 Reconnexion session ${id}...`);
        startSock(id);
      } else {
        console.log(`❌ Session ${id} déconnectée définitivement.`);
        socks.delete(id);
        // Optionnel : supprimer dossier session
      }
    } else if (connection === 'open') {
      console.log(`✅ Session ${id} connectée avec succès: ${sock.user.id}`);
    }
  });

  sock.ev.on('messages.upsert', async m => {
    try {
      await Handler(m, sock);
    } catch (err) {
      console.error(`Erreur Handler session ${id}:`, err);
    }
  });
}

app.listen(PORT, () => {
  console.log(`🌐 Serveur démarré sur http://localhost:${PORT}`);
});
