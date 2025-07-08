// index.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pairRouter from './pair.js';
import { startSock } from './startSock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const sessionsPath = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsPath)) fs.mkdirSync(sessionsPath);

app.use(express.static(path.join(__dirname, 'web')));
app.use('/code', pairRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Serveur démarré sur http://localhost:${PORT}`);
});
