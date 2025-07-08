// startSock.js
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Handler } from './inconnu/handler/handler.js';

const socks = new Map();

export async function startSock(id) {
  const sessionDir = path.join('sessions', id);
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
