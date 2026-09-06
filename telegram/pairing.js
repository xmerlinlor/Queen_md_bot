// ╔══════════════════════════════════════╗
// ║          👑 QUEEN MD                ║
// ║       TELEGRAM PAIRING              ║
// ╚══════════════════════════════════════╝

const { Telegraf } = require("telegraf");

const config = require("../config");

const {
  requestPairingCode,
  getConnectionStatus,
} = require("../whatsapp/connection");

let telegramBot = null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const waitingForNumber = new Map();
const pairingAttempts = new Map();

const MAX_ATTEMPTS = 5;
const ATTEMPT_RESET_TIME = 60 * 60 * 1000;
const SESSION_TIMEOUT = 5 * 60 * 1000;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔢 NORMALIZE WHATSAPP NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function normalizeNumber(input) {
  if (!input) return null;

  let number = String(input).trim();

  // Remove +, spaces, -, brackets, etc.
  number = number.replace(/[^\d]/g, "");

  if (!number) return null;

  // Nigeria:
  // 08012345678
  // +2348012345678
  // 2348012345678

  if (number.startsWith("0")) {
    number = "234" + number.substring(1);
  } else if (number.startsWith("234")) {
    // Already international
  } else if (
    number.length === 10 &&
    number.startsWith("8")
  ) {
    number = "234" + number;
  }

  // Basic international validation
  if (number.length < 10 || number.length > 15) {
    return null;
  }

  return number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛡️ PAIRING LIMIT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function canPair(userId) {
  const now = Date.now();

  const data = pairingAttempts.get(userId);

  if (!data) {
    pairingAttempts.set(userId, {
      count: 1,
      firstAttempt: now,
    });

    return true;
  }

  // Reset after 1 hour
  if (
    now - data.firstAttempt >
    ATTEMPT_RESET_TIME
  ) {
    pairingAttempts.set(userId, {
      count: 1,
      firstAttempt: now,
    });

    return true;
  }

  if (data.count >= MAX_ATTEMPTS) {
    return false;
  }

  data.count++;

  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 QUEEN MD STARTUP MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getWelcomeMessage(ctx) {
  const user = ctx.from || {};

  const name =
    user.first_name ||
    user.username ||
    "User";

  return `◆━━━━◆ 👑 𝚀𝚄𝙴𝙴𝙽 𝙼𝙳 ◆━━━━◆
│
│ ▢ ☀️ 𝙶𝚛𝚎𝚎𝚝ɪɴɢs ⑅ ⚚ ${name}
│ ▢ ⚙️ 𝚂ʏsᴛᴇᴍ ⑅ ᴘʀᴏғᴇssɪᴏɴᴀʟ ᴘᴀɪʀɪɴɢ
│ ▢ 🛡️ 𝚂ᴛᴀᴛᴜs ⑅ sᴇᴄᴜʀᴇ • ғᴀsᴛ • ʀᴇʟɪᴀʙʟᴇ
│
◆━━━━━━━━━━━━━━━━◆
│
◆━━━━◆ 📊 𝚂𝚈𝚂𝚃𝙴𝙼 𝙸𝙽𝙵𝙾 ◆━━━━◆
│
│ ▢ ⏱️ 𝚄ᴘᴛɪᴍᴇ ⑅ ᴀᴄᴛɪᴠᴇ
│ ▢ 👥 𝚄sᴇʀs ⑅ ᴏɴʟɪɴᴇ
│ ▢ 🔗 𝚂ᴇssɪᴏɴs ⑅ ʀᴇᴀᴅʏ
│ ▢ 📅 𝚃ᴏᴅᴀʏ ⑅ ᴀᴄᴛɪᴠᴇ
│
◆━━━━━━━━━━━━━━━━◆
│
◆━━━━◆ ⚡ 𝚀𝚄𝙸𝙲𝙺 𝙰𝙲𝚃𝙸𝙾𝙽𝚂 ◆━━━━◆
│
│ ▢ 🔗 /ᴘᴀɪʀ ⑅ ᴘᴀɪʀ ᴡʜᴀᴛsᴀᴘᴘ
│ ▢ ❌ /ᴜɴᴘᴀɪʀ ⑅ ʀᴇᴍᴏᴠᴇ sᴇssɪᴏɴ
│ ▢ ⚡ /ᴘɪɴɢ ⑅ ʟᴀᴛᴇɴᴄʏ ᴄʜᴇᴄᴋ
│ ▢ ⏱️ /ʀᴜɴᴛɪᴍᴇ ⑅ sʏsᴛᴇᴍ ᴜᴘᴛɪᴍᴇ
│ ▢ 📊 /sᴛᴀᴛs ⑅ ʙᴏᴛ sᴛᴀᴛɪsᴛɪᴄs
│ ▢ 🟢 /sᴛᴀᴛᴜs ⑅ ʙᴏᴛ sᴛᴀᴛᴜs
│ ▢ 🚪 /ʟᴏɢᴏᴜᴛ ⑅ ʟᴏɢᴏᴜᴛ ᴀᴄᴛɪᴠᴇ sᴇssɪᴏɴ
│
◆━━━━━━━━━━━━━━━━◆`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❓ HELP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getHelpMessage() {
  return `╭━━〔 ❓ QUEEN MD HELP 〕━━╮
┃
┃ /start
┃ /pair
┃ /status
┃ /help
┃
┃ 📱 HOW TO PAIR
┃
┃ 1️⃣ Send /pair
┃ 2️⃣ Send your WhatsApp number
┃ 3️⃣ Open WhatsApp
┃ 4️⃣ Settings → Linked Devices
┃ 5️⃣ Link a Device
┃ 6️⃣ Link with phone number instead
┃ 7️⃣ Enter the pairing code
┃
┃ 🇳🇬 Example:
┃ 2348012345678
┃
╰━━━━━━━━━━━━━━━━━━━━╯`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getStatusMessage() {
  let status = "🔴 Offline";

  try {
    const connection = getConnectionStatus();

    if (connection === "open") {
      status = "🟢 Connected";
    } else if (connection === "connecting") {
      status = "🟡 Connecting";
    } else if (connection === "closed") {
      status = "🔴 Offline";
    }
  } catch (_) {}

  return `╭━━〔 👑 QUEEN MD STATUS 〕━━╮
┃
┃ 📲 Telegram: 🟢 Online
┃ 📱 WhatsApp: ${status}
┃ 🤖 Mode: Mini Bot
┃ 📊 Version: ${config.botVersion || "1.0.0"}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ SEND STARTUP MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendStartupMenu(ctx) {
  const menu = getWelcomeMessage(ctx);

  /*
   * Add your image URL in config.js:
   *
   * botProfilePicture:
   * "https://your-domain.com/queen-md.jpg"
   */

  const profilePicture =
    config.botProfilePicture;

  if (!profilePicture) {
    await ctx.reply(menu);
    return;
  }

  try {
    await ctx.replyWithPhoto(
      { url: profilePicture },
      {
        caption: menu,
      }
    );
  } catch (photoError) {
    console.error(
      "⚠️ Profile picture failed:",
      photoError.message
    );

    // Fallback to text menu
    await ctx.reply(menu);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📲 START TELEGRAM BOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startPairingBot() {
  if (!config.telegramToken) {
    console.error(
      "❌ TELEGRAM_BOT_TOKEN is not configured"
    );

    return null;
  }

  try {
    telegramBot = new Telegraf(
      config.telegramToken
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🏠 /START
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    telegramBot.start(async (ctx) => {
      try {
        await sendStartupMenu(ctx);
      } catch (error) {
        console.error(
          "❌ /start menu error:",
          error.message
        );

        await ctx.reply(
          "❌ Unable to load Queen MD startup menu."
        );
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔗 /PAIR
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    telegramBot.command("pair", async (ctx) => {
      try {
        const userId = ctx.from.id;

        if (!canPair(userId)) {
          await ctx.reply(
            "❌ Too many pairing attempts.\n\n" +
            "Please try again later."
          );

          return;
        }

        waitingForNumber.set(userId, {
          timestamp: Date.now(),
          attempts: 0,
        });

        await ctx.reply(
          `╭━━〔 📱 WHATSAPP PAIRING 〕━━╮
┃
┃ Send your WhatsApp number.
┃
┃ 🇳🇬 Example:
┃ 2348012345678
┃
┃ You can also send:
┃ +2348012345678
┃ 08012345678
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
        );
      } catch (error) {
        console.error(
          "❌ /pair error:",
          error.message
        );

        await ctx.reply(
          "❌ Unable to start pairing."
        );
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 /STATUS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    telegramBot.command("status", async (ctx) => {
      try {
        await ctx.reply(
          getStatusMessage()
        );
      } catch (error) {
        console.error(
          "❌ /status error:",
          error.message
        );
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❓ /HELP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    telegramBot.command("help", async (ctx) => {
      try {
        await ctx.reply(
          getHelpMessage()
        );
      } catch (error) {
        console.error(
          "❌ /help error:",
          error.message
        );
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📱 RECEIVE WHATSAPP NUMBER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    telegramBot.on("text", async (ctx) => {
      try {
        const userId = ctx.from.id;

        const session =
          waitingForNumber.get(userId);

        // User is not currently pairing
        if (!session) return;

        // Session expired
        if (
          Date.now() - session.timestamp >
          SESSION_TIMEOUT
        ) {
          waitingForNumber.delete(userId);

          await ctx.reply(
            "⏱️ Pairing session expired.\n\n" +
            "Send /pair to start again."
          );

          return;
        }

        const number = normalizeNumber(
          ctx.message.text
        );

        // Invalid number
        if (!number) {
          session.attempts++;

          if (session.attempts >= 3) {
            waitingForNumber.delete(userId);

            await ctx.reply(
              "❌ Too many invalid attempts.\n\n" +
              "Send /pair to try again."
            );

            return;
          }

          await ctx.reply(
            "❌ Invalid WhatsApp number.\n\n" +
            "Example:\n" +
            "2348012345678"
          );

          return;
        }

        // Remove active pairing session
        waitingForNumber.delete(userId);

        await ctx.reply(
          "⏳ Generating your WhatsApp pairing code..."
        );

        console.log(
          `📱 Pairing requested for: ${number}`
        );

        try {
          const code =
            await requestPairingCode(number);

          if (!code) {
            throw new Error(
              "WhatsApp did not return a pairing code."
            );
          }

          await ctx.reply(
            `╭━━〔 🔑 QUEEN MD 〕━━╮
┃
┃ 📱 Number:
┃ ${number}
┃
┃ 🔐 Pairing Code:
┃
┃    ${code}
┃
┃ Open WhatsApp:
┃ Settings
┃ → Linked Devices
┃ → Link a Device
┃ → Link with phone number instead
┃
┃ Enter the code above.
┃
┃ ⚠️ Use a fresh code.
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
          );

          console.log(
            `✅ Pairing code sent to Telegram user ${userId}`
          );
        } catch (error) {
          console.error(
            "❌ WhatsApp pairing error:",
            error.message
          );

          await ctx.reply(
            `❌ Failed to generate pairing code.\n\n` +
            `Error: ${error.message}\n\n` +
            `Please send /pair again.`
          );
        }
      } catch (error) {
        console.error(
          "❌ Telegram text handler error:",
          error.message
        );
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ TELEGRAM ERROR HANDLER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    telegramBot.catch(
      async (error, ctx) => {
        console.error(
          "❌ Telegram error:",
          error.message
        );

        try {
          await ctx.reply(
            "❌ An unexpected error occurred."
          );
        } catch (_) {}
      }
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🚀 LAUNCH
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await telegramBot.launch();

    console.log(
      "╔════════════════════════════════════╗"
    );

    console.log(
      "║     👑 QUEEN MD TELEGRAM ONLINE    ║"
    );

    console.log(
      "║     📱 Pairing System Ready        ║"
    );

    console.log(
      "╚════════════════════════════════════╝"
    );

    // Graceful shutdown
    process.once("SIGINT", () => {
      telegramBot.stop("SIGINT");
    });

    process.once("SIGTERM", () => {
      telegramBot.stop("SIGTERM");
    });

    return telegramBot;

  } catch (error) {
    console.error(
      "❌ Failed to start Telegram bot:",
      error.message
    );

    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  startPairingBot,

  getTelegramBot: () =>
    telegramBot,

  normalizeNumber,
};
