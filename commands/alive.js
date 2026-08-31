// ╔══════════════════════════════════════╗
// ║            👑 QUEEN MD              ║
// ║            ALIVE COMMAND            ║
// ╚══════════════════════════════════════╝

/**
 * Alive Command - Check if bot is running
 * Shows bot status and owner information
 */
async function execute(ctx) {
  const { sock, jid, config, message } = ctx;

  try {
    // Get bot uptime
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    // Get bot mode
    const mode = config.mode || "public";

    // Get owner name
    const ownerName = config.ownerName || "Queen MD";

    // Send alive response
    await sock.sendMessage(jid, {
      text: `╭━━━〔 🤖 ᴀʟɪᴠᴇ 〕━━━╮
┃
┃ 🤖 ʙᴏᴛ: Queen MD
┃ 🟢 sᴛᴀᴛᴜs: Online & Active
┃ ⚡ ᴍᴏᴅᴇ: ${mode.toUpperCase()}
┃ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptimeStr}
┃
┃ 👑 ᴏᴡɴᴇʀ: ${ownerName}
┃ ❤️ Mᴀᴅᴇ Wɪᴛʜ Lᴏᴠᴇ
┃
╰━━━━━━━━━━━━━━╯`,
    });

    console.log("✅ Alive command executed");
  } catch (error) {
    console.error("❌ Alive command error:", error.message);

    try {
      await sock.sendMessage(jid, {
        text: "❌ Failed to check alive status. Please try again.",
      });
    } catch (sendError) {
      console.error("Failed to send error message:", sendError.message);
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  execute,
};
