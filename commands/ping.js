// ╔══════════════════════════════════════╗
// ║            👑 QUEEN MD              ║
// ║            PING COMMAND             ║
// ╚══════════════════════════════════════╝

/**
 * Ping Command - Check bot latency and status
 * Shows response time in milliseconds
 */
async function execute(ctx) {
  const { sock, jid, message, config } = ctx;

  try {
    // Record start time for latency measurement
    const start = Date.now();

    // Send ping response
    const response = await sock.sendMessage(jid, {
      text: `╭━━━〔 ⚡ ᴘɪɴɢ 〕━━━╮
┃
┃ 🏓 ᴘᴏɴɢ: ${Date.now() - start}ms
┃ 🤖 ʙᴏᴛ: Queen MD
┃ 🟢 sᴛᴀᴛᴜs: Online
┃ ⚡ ᴠᴇʀsɪᴏɴ: 1.0.0
┃
╰━━━━━━━━━━━━━━╯`,
    });

    console.log(`✅ Ping: ${Date.now() - start}ms`);
  } catch (error) {
    console.error("❌ Ping command error:", error.message);

    try {
      await sock.sendMessage(jid, {
        text: "❌ Failed to measure latency. Please try again.",
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
