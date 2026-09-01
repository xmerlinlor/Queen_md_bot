// ╔══════════════════════════════════════╗
// ║          👑 QUEEN MD                ║
// ║        RUNTIME COMMAND              ║
// ╚══════════════════════════════════════╝

module.exports = async (ctx) => {
  const { sock, jid } = ctx;

  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const runtime = `╭━━〔 ⏱️ RUNTIME 〕━━╮
┃
┃ ⏰ Uptime:
┃ ${hours}h ${minutes}m ${seconds}s
┃
┃ 🟢 Bot Status: Online
┃ 📊 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
┃
╰━━━━━━━━━━━━━━━━━━━━╯`;

  await sock.sendMessage(jid, { text: runtime });
};
