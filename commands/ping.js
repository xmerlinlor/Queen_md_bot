// ╔══════════════════════════════════════╗
// ║          👑 QUEEN MD                ║
// ║        PING COMMAND                 ║
// ╚══════════════════════════════════════╝

module.exports = async (ctx) => {
  const { sock, jid } = ctx;
  const start = Date.now();

  const msg = await sock.sendMessage(jid, { text: "⏱️ Pinging..." });
  const end = Date.now();
  const ping = end - start;

  await sock.sendMessage(jid, {
    text: `🏓 *PONG!*\n\n⚡ Response time: ${ping}ms`,
  });
};
