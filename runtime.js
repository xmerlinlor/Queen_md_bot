function formatRuntime(seconds) {
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

export default async function runtime(sock, msg) {
  const chatId = msg.key.remoteJid;

  const uptime = process.uptime();
  const runtime = formatRuntime(uptime);

  await sock.sendMessage(chatId, {
    text: `╭━━━〔 ⏱️ ʀᴜɴᴛɪᴍᴇ 〕━━━╮
┃
┃ 🤖 ʙᴏᴛ: Queen MD
┃ 🟢 sᴛᴀᴛᴜs: Online
┃ ⏱️ ᴜᴘᴛɪᴍᴇ: ${runtime}
┃
╰━━━━━━━━━━━━━━━━━━╯`
  });
}
