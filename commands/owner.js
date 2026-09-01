// ╔══════════════════════════════════════╗
// ║          👑 QUEEN MD                ║
// ║        OWNER COMMAND                ║
// ╚══════════════════════════════════════╝

const config = require("../config");

module.exports = async (ctx) => {
  const { sock, jid } = ctx;

  const ownerInfo = `╭━━〔 👨‍💼 OWNER 〕━━╮
┃
┃ 👤 Name: xmerlinlor
┃ 📱 WhatsApp: ${config.ownerNumber || "Not configured"}
┃ 🔗 GitHub: github.com/xmerlinlor
┃
┃ 📝 For support, contact owner
┃
╰━━━━━━━━━━━━━━━━━━━━╯`;

  await sock.sendMessage(jid, { text: ownerInfo });
};
