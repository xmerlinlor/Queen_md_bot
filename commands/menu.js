// ╔══════════════════════════════════════╗
// ║          👑 QUEEN MD                ║
// ║        MENU COMMAND                 ║
// ╚══════════════════════════════════════╝

module.exports = async (ctx) => {
  const { sock, prefix } = ctx;
  const { jid } = ctx.senderInfo;

  const menu = `╭━━〔 👑 QUEEN MD 〕━━╮
┃
┃ 📋 *AVAILABLE COMMANDS*
┃
┃ ${prefix}menu - Show this menu
┃ ${prefix}ping - Check bot response
┃ ${prefix}alive - Bot status
┃ ${prefix}owner - Owner info
┃ ${prefix}runtime - Bot uptime
┃
┃ Made with ❤️ by xmerlinlor
┃
╰━━━━━━━━━━━━━━━━━━━━╯`;

  await sock.sendMessage(jid, { text: menu });
};
