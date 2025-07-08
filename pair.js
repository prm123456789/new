import express from 'express';
import { makeid } from './inconnu/handler/gen-id.js';
import { useMultiFileAuthState, makeWASocket, makeCacheableSignalKeyStore, Browsers, delay } from '@whiskeysockets/baileys';
import fs from 'fs';
import pino from 'pino';
import path from 'path';
import { startSock } from './startSock.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const id = makeid();
  const num = req.query.number?.replace(/[^0-9]/g, '');

  if (!num) return res.send({ code: "❗ Veuillez entrer un numéro valide" });

  const folderPath = path.join('sessions', id);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(folderPath);
  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }).child({ level: "silent" }))
    },
    printQRInTerminal: false,
    browser: Browsers.macOS("Safari"),
    logger: pino({ level: "silent" })
  });

  try {
    if (!sock.authState.creds.registered) {
      await delay(1500);
      const code = await sock.requestPairingCode(num);
      res.send({ code });

      sock.ev.on('creds.update', saveCreds);
      sock.ev.on('connection.update', async ({ connection }) => {
        if (connection === 'open') {
          await delay(2000);
          await sock.ws.close();
          await startSock(id);
        }
      });
    } else {
      res.send({ code: "✅ Déjà connecté" });
    }
  } catch (e) {
    console.error("❌ Erreur pairing :", e);
    res.send({ code: "❗ Erreur pairing" });
  }
});

export default router;
