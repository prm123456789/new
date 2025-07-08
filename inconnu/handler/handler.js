function Handler(msg, sock) {
  const m = msg.messages[0];
  if (!m.message || m.key.fromMe) return;

  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
  const cmd = text.trim().toLowerCase();

  if (cmd === 'ping') {
    sock.sendMessage(m.key.remoteJid, { text: '🏓 Pong INCONNU XD' }, { quoted: m });
  }

  if (cmd === 'menu') {
    sock.sendMessage(m.key.remoteJid, {
      text: `╔══ ❖ MENU INCONNU XD ❖
║ 🧠 ping - Test bot
║ 📜 menu - Voir commandes
║ 🤖 botinfo - Infos du bot
╚═════════════════`
    }, { quoted: m });
  }

  if (cmd === 'botinfo') {
    sock.sendMessage(m.key.remoteJid, {
      text: `🤖 BOT INCONNU XD
👤 Owner : INCONNU BOY
📆 Uptime : quelques secondes
⚙️ Version multi-session`
    }, { quoted: m });
  }
}

export { Handler };
