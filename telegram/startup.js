// ╔══════════════════════════════════════╗
// ║          👑 QUEEN MD                ║
// ║       PREMIUM STARTUP SYSTEM        ║
// ╚══════════════════════════════════════╝

const fs = require("fs");
const path = require("path");

const PROFILE_IMAGE = path.join(
  __dirname,
  "queen-md.jpg"
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 STARTUP MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getWelcomeMessage(ctx) {
  const name =
    ctx.from?.first_name ||
    ctx.from?.username ||
    "User";

  return `╭━━━〔 👑 𝚀𝚄𝙴𝙴𝙽 𝙼𝙳 〕━━━╮
┃
┃ ☀️ 𝙷ᴇʟʟᴏ, ${name}
┃
┃ ⚙️ 𝚀ᴜᴇᴇɴ 𝙼𝙳 𝙿ᴀɪʀɪɴɢ 𝚂ʏsᴛᴇᴍ
┃ 🛡️ Secure • Fast • Reliable
┃ 📱 WhatsApp Connection Manager
┃
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 ⚡ 𝚀𝚄𝙸𝙲𝙺 𝙰𝙲𝚃𝙸𝙾𝙽𝚂 〕━━╮
┃
┃ 🔗 /pair
┃ └─ Pair your WhatsApp
┃
┃ 🟢 /status
┃ └─ Check connection
┃
┃ ⚡ /ping
┃ └─ Check bot response
┃
┃ ⏱️ /runtime
┃ └─ Check system uptime
┃
┃ 📊 /stats
┃ └─ View bot statistics
┃
┃ ❓ /help
┃ └─ View help menu
┃
╰━━━━━━━━━━━━━━━━━━━━╯

⚚ 𝚀𝚄𝙴𝙴𝙽 𝙼𝙳 • 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝚂𝚈𝚂𝚃𝙴𝙼 ⚚`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ BUTTONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getStartupButtons() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🔗 𝙿𝙰𝙸𝚁 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿",
            callback_data: "start_pair",
          },
        ],
        [
          {
            text: "🟢 𝚂𝚃𝙰𝚃𝚄𝚂",
            callback_data: "start_status",
          },
          {
            text: "⚡ 𝙿𝙸𝙽𝙶",
            callback_data: "start_ping",
          },
        ],
        [
          {
            text: "📊 𝚂𝚃𝙰𝚃𝚂",
            callback_data: "start_stats",
          },
          {
            text: "❓ 𝙷𝙴𝙻𝙿",
            callback_data: "start_help",
          },
        ],
      ],
    },
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 SEND STARTUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendStartup(ctx) {
  const menu = getWelcomeMessage(ctx);
  const buttons = getStartupButtons();

  if (!fs.existsSync(PROFILE_IMAGE)) {
    await ctx.reply(menu, buttons);
    return;
  }

  await ctx.replyWithPhoto(
    {
      source: PROFILE_IMAGE,
    },
    {
      caption: menu,
      ...buttons,
    }
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  sendStartup,
  getWelcomeMessage,
  getStartupButtons,
};
