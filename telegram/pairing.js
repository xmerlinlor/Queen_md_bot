// telegram/pairing.js

const { Telegraf, Markup } = require("telegraf");

const config = require("../config");
const {
  requestPairingCode,
  getConnectionStatus,
  isConnected,
} = require("../whatsapp/connection");

const { sendStartup } = require("./startup");

const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

// ============================================
// SETTINGS
// ============================================

const waitingForNumber = new Map();
const pairingAttempts = new Map();

const MAX_PAIRING_ATTEMPTS = 5;
const PAIRING_TIMEOUT = 120000;

// ============================================
// HELPERS
// ============================================

function getUserId(ctx) {
  return ctx.from?.id?.toString();
}

function getUserName(ctx) {
  return (
    ctx.from?.first_name ||
    ctx.from?.username ||
    "User"
  );
}

function isOwner(ctx) {
  const ownerId = String(
    config.TELEGRAM_OWNER_ID ||
    config.OWNER_ID ||
    ""
  );

  return ownerId && getUserId(ctx) === ownerId;
}

function normalizeNumber(input) {
  if (!input) return null;

  let number = String(input)
    .trim()
    .replace(/[^\d+]/g, "");

  // Remove +
  number = number.replace(/^\+/, "");

  // Nigerian format: 08012345678
  if (number.startsWith("0")) {
    number = "234" + number.slice(1);
  }

  // 8012345678
  else if (number.startsWith("8") && number.length === 10) {
    number = "234" + number;
  }

  // Already international
  if (!/^\d+$/.test(number)) {
    return null;
  }

  if (number.length < 10 || number.length > 15) {
    return null;
  }

  return number;
}

function clearPairingSession(userId) {
  waitingForNumber.delete(userId);
  pairingAttempts.delete(userId);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// /START
// ============================================

bot.start(async (ctx) => {
  const name = getUserName(ctx);

  try {
    await ctx.reply(
      `╭━━━〔 👑 ᴏᴜᴇᴇɴ ᴍᴅ 〕━━━╮
┃
┃ 👋 Hᴇʟʟᴏ ${name}
┃
┃ 📱 Wʜᴀᴛsᴀᴘᴘ Pᴀɪʀɪɴɢ
┃
┃ Cᴏɴɴᴇᴄᴛ ʏᴏᴜʀ WʜᴀᴛsAᴘᴘ
┃ ᴛᴏ Qᴜᴇᴇɴ ᴍᴅ ᴜsɪɴɢ ᴀ
┃ sᴇᴄᴜʀᴇ Pᴀɪʀɪɴɢ Cᴏᴅᴇ.
┃
╰━━━━━━━━━━━━━━━━━━╯`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "📱 Pᴀɪʀ WʜᴀᴛsAᴘᴘ",
            "PAIR_WHATSAPP"
          ),
        ],
        [
          Markup.button.callback(
            "📊 Sᴛᴀᴛᴜs",
            "BOT_STATUS"
          ),
          Markup.button.callback(
            "❓ Hᴇʟᴘ",
            "BOT_HELP"
          ),
        ],
      ])
    );
  } catch (error) {
    console.error("❌ /start error:", error);
  }
});

// ============================================
// /PAIR
// ============================================

bot.command("pair", async (ctx) => {
  await beginPairing(ctx);
});

async function beginPairing(ctx) {
  const userId = getUserId(ctx);

  if (!userId) return;

  waitingForNumber.set(userId, true);

  await ctx.reply(
    `╭━━━〔 📱 WʜᴀᴛsAᴘᴘ Pᴀɪʀɪɴɢ 〕━━━╮
┃
┃ Sᴇɴᴅ ʏᴏᴜʀ WʜᴀᴛsAᴘᴘ ɴᴜᴍʙᴇʀ.
┃
┃ Eхᴀᴍᴘʟᴇ:
┃ ➜ 2348122029123
┃
┃ Oʀ:
┃ ➜ 08122029123
┃
┃ ⚠️ Dᴏ ɴᴏᴛ ᴀᴅᴅ sᴘᴀᴄᴇs.
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
  );
}

// ============================================
// PAIR BUTTON
// ============================================

bot.action("PAIR_WHATSAPP", async (ctx) => {
  try {
    await ctx.answerCbQuery();

    await beginPairing(ctx);
  } catch (error) {
    console.error("❌ Pair button error:", error);
  }
});

// ============================================
// RECEIVE PHONE NUMBER
// ============================================

bot.on("text", async (ctx) => {
  const userId = getUserId(ctx);
  const text = ctx.message?.text?.trim();

  if (!userId || !text) return;

  // Ignore commands
  if (text.startsWith("/")) return;

  // Only process if user requested pairing
  if (!waitingForNumber.has(userId)) {
    return;
  }

  waitingForNumber.delete(userId);

  const number = normalizeNumber(text);

  if (!number) {
    await ctx.reply(
      `❌ Iɴᴠᴀʟɪᴅ WʜᴀᴛsAᴘᴘ ɴᴜᴍʙᴇʀ.

Sᴇɴᴅ ʏᴏᴜʀ ɴᴜᴍʙᴇʀ ʟɪᴋᴇ:

➜ 2348122029123

Oʀ

➜ 08122029123`
    );

    return;
  }

  let attempts = pairingAttempts.get(userId) || 0;

  if (attempts >= MAX_PAIRING_ATTEMPTS) {
    pairingAttempts.delete(userId);

    await ctx.reply(
      "❌ Tᴏᴏ ᴍᴀɴʏ Pᴀɪʀɪɴɢ Aᴛᴛᴇᴍᴘᴛs.\n\nPʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ."
    );

    return;
  }

  pairingAttempts.set(userId, attempts + 1);

  const statusMessage = await ctx.reply(
    `⏳ Gᴇɴᴇʀᴀᴛɪɴɢ ʏᴏᴜʀ WʜᴀᴛsAᴘᴘ Pᴀɪʀɪɴɢ Cᴏᴅᴇ...

📱 Nᴜᴍʙᴇʀ: +${number}

⚡ Pʟᴇᴀsᴇ ᴡᴀɪᴛ...`
  );

  try {
    console.log(
      `🔐 Telegram pairing request from ${userId} for +${number}`
    );

    const codePromise = requestPairingCode(number);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            "Pairing code generation timed out."
          )
        );
      }, PAIRING_TIMEOUT);
    });

    const code = await Promise.race([
      codePromise,
      timeoutPromise,
    ]);

    if (!code) {
      throw new Error(
        "WhatsApp did not return a pairing code."
      );
    }

    const formattedCode = String(code)
      .replace(/\s+/g, "")
      .match(/.{1,4}/g)
      ?.join("-") || String(code);

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMessage.message_id,
      undefined,
      `╭━━━〔 🔐 Pᴀɪʀɪɴɢ Cᴏᴅᴇ 〕━━━╮
┃
┃ 📱 Nᴜᴍʙᴇʀ:
┃ +${number}
┃
┃ 🔑 Cᴏᴅᴇ:
┃
┃   ${formattedCode}
┃
┃ ━━━━━━━━━━━━━━━
┃
┃ 📲 Oᴘᴇɴ WʜᴀᴛsAᴘᴘ
┃
┃ Sᴇᴛᴛɪɴɢs
┃ ➜ Lɪɴᴋᴇᴅ Dᴇᴠɪᴄᴇs
┃ ➜ Lɪɴᴋ A Dᴇᴠɪᴄᴇ
┃ ➜ Lɪɴᴋ Wɪᴛʜ Pʜᴏɴᴇ Nᴜᴍʙᴇʀ
┃
┃ Eɴᴛᴇʀ ᴛʜᴇ ᴄᴏᴅᴇ ᴀʙᴏᴠᴇ.
┃
┃ ⚠️ Dᴏ ɴᴏᴛ sʜᴀʀᴇ ᴛʜɪs ᴄᴏᴅᴇ.
┃
╰━━━━━━━━━━━━━━━━━━╯`
    );

    console.log(
      `✅ Pairing code sent to Telegram user ${userId}`
    );

    // Give WhatsApp some time to finish authentication.
    await sleep(3000);

    pairingAttempts.delete(userId);
  } catch (error) {
    console.error(
      "❌ Telegram pairing error:",
      error
    );

    const errorMessage =
      error?.message ||
      "Unknown pairing error.";

    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMessage.message_id,
        undefined,
        `╭━━━〔 ❌ Pᴀɪʀɪɴɢ Fᴀɪʟᴇᴅ 〕━━━╮
┃
┃ WʜᴀᴛsAᴘᴘ ᴘᴀɪʀɪɴɢ ᴄᴏᴜʟᴅ ɴᴏᴛ
┃ ʙᴇ ᴄᴏᴍᴘʟᴇᴛᴇᴅ.
┃
┃ ❗ Eʀʀᴏʀ:
┃ ${errorMessage}
┃
┃ 🔄 Sᴇɴᴅ /pair ᴛᴏ ᴛʀʏ ᴀɢᴀɪɴ.
┃
╰━━━━━━━━━━━━━━━━━━╯`
      );
    } catch (editError) {
      console.error(
        "❌ Failed to edit pairing message:",
        editError
      );

      await ctx.reply(
        `❌ Pᴀɪʀɪɴɢ Fᴀɪʟᴇᴅ.\n\nEʀʀᴏʀ: ${errorMessage}\n\nSᴇɴᴅ /pair ᴛᴏ ᴛʀʏ ᴀɢᴀɪɴ.`
      );
    }
  }
});

// ============================================
// /STATUS
// ============================================

bot.command("status", async (ctx) => {
  try {
    const status = getConnectionStatus();
    const connected = isConnected();

    await ctx.reply(
      `╭━━━〔 📊 Qᴜᴇᴇɴ ᴍᴅ Sᴛᴀᴛᴜs 〕━━━╮
┃
┃ 📡 WʜᴀᴛsAᴘᴘ:
┃ ${connected ? "🟢 Cᴏɴɴᴇᴄᴛᴇᴅ" : "🔴 Nᴏᴛ Cᴏɴɴᴇᴄᴛᴇᴅ"}
┃
┃ 🔌 Sᴏᴄᴋᴇᴛ:
┃ ${status}
┃
╰━━━━━━━━━━━━━━━━━━╯`
    );
  } catch (error) {
    console.error("❌ /status error:", error);

    await ctx.reply(
      "❌ Fᴀɪʟᴇᴅ ᴛᴏ ɢᴇᴛ sᴛᴀᴛᴜs."
    );
  }
});

// ============================================
// /PING
// ============================================

bot.command("ping", async (ctx) => {
  const start = Date.now();

  const message = await ctx.reply(
    "🏓 Pɪɴɢɪɴɢ..."
  );

  const latency = Date.now() - start;

  try {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      message.message_id,
      undefined,
      `🏓 Pᴏɴɢ!\n\n⚡ Lᴀᴛᴇɴᴄʏ: ${latency}ms`
    );
  } catch (error) {
    console.error("❌ /ping error:", error);
  }
});

// ============================================
// /RUNTIME
// ============================================

bot.command("runtime", async (ctx) => {
  const seconds = Math.floor(process.uptime());

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(
    (seconds % 86400) / 3600
  );
  const minutes = Math.floor(
    (seconds % 3600) / 60
  );
  const secs = seconds % 60;

  await ctx.reply(
    `⏱️ Qᴜᴇᴇɴ ᴍᴅ Rᴜɴᴛɪᴍᴇ\n\n` +
      `${days}d ${hours}h ${minutes}m ${secs}s`
  );
});

// ============================================
// /HELP
// ============================================

bot.command("help", async (ctx) => {
  await sendHelp(ctx);
});

async function sendHelp(ctx) {
  await ctx.reply(
    `╭━━━〔 ❓ Qᴜᴇᴇɴ ᴍᴅ Hᴇʟᴘ 〕━━━╮
┃
┃ 📱 Pᴀɪʀɪɴɢ
┃ /pair
┃
┃ 📊 Sᴛᴀᴛᴜs
┃ /status
┃
┃ 🏓 Pɪɴɢ
┃ /ping
┃
┃ ⏱️ Rᴜɴᴛɪᴍᴇ
┃ /runtime
┃
┃ ❓ Hᴇʟᴘ
┃ /help
┃
┃ 🔓 Uɴᴘᴀɪʀ
┃ /unpair
┃
╰━━━━━━━━━━━━━━━━━━╯`
  );
}

// ============================================
// HELP BUTTON
// ============================================

bot.action("BOT_HELP", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await sendHelp(ctx);
  } catch (error) {
    console.error("❌ Help button error:", error);
  }
});

// ============================================
// STATUS BUTTON
// ============================================

bot.action("BOT_STATUS", async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const status = getConnectionStatus();
    const connected = isConnected();

    await ctx.reply(
      `📊 Qᴜᴇᴇɴ ᴍᴅ Sᴛᴀᴛᴜs\n\n` +
        `WʜᴀᴛsAᴘᴘ: ${
          connected
            ? "🟢 Cᴏɴɴᴇᴄᴛᴇᴅ"
            : "🔴 Nᴏᴛ Cᴏɴɴᴇᴄᴛᴇᴅ"
        }\n` +
        `Sᴛᴀᴛᴜs: ${status}`
    );
  } catch (error) {
    console.error(
      "❌ Status button error:",
      error
    );
  }
});

// ============================================
// /UNPAIR
// ============================================

bot.command("unpair", async (ctx) => {
  await ctx.reply(
    `⚠️ Uɴᴘᴀɪʀ ɪs ʜᴀɴᴅʟᴇᴅ ʙʏ ᴛʜᴇ WʜᴀᴛsAᴘᴘ sᴇssɪᴏɴ.

Iғ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ʀᴇᴍᴏᴠᴇ ᴛʜᴇ sᴇssɪᴏɴ, ᴜsᴇ ᴛʜᴇ WʜᴀᴛsAᴘᴘ ʟɪɴᴋᴇᴅ ᴅᴇᴠɪᴄᴇs sᴇᴛᴛɪɴɢs ᴏʀ ʀᴇᴍᴏᴠᴇ ᴛʜᴇ ᴀᴜᴛʜ sᴇssɪᴏɴ ғʀᴏᴍ ᴛʜᴇ sᴇʀᴠᴇʀ.`
  );
});

// ============================================
// /STATS
// ============================================

bot.command("stats", async (ctx) => {
  const memory = process.memoryUsage();

  const ram = (
    memory.rss /
    1024 /
    1024
  ).toFixed(2);

  await ctx.reply(
    `╭━━━〔 📈 Bᴏᴛ Sᴛᴀᴛs 〕━━━╮
┃
┃ 🟢 Pʀᴏᴄᴇss: Rᴜɴɴɪɴɢ
┃
┃ 🧠 Rᴀᴍ: ${ram} MB
┃
┃ ⏱️ Uᴘᴛɪᴍᴇ:
┃ ${Math.floor(process.uptime())}s
┃
╰━━━━━━━━━━━━━━━━━━╯`
  );
});

// ============================================
// OWNER COMMAND
// ============================================

bot.command("owner", async (ctx) => {
  await ctx.reply(
    `╭━━━〔 👑 Oᴡɴᴇʀ 〕━━━╮
┃
┃ 👑 Mʀ ᴀɴᴅ Mʀs Qᴜᴇᴇɴ
┃
┃ 📱 +2348122029123
┃
╰━━━━━━━━━━━━━━╯`
  );
});

// ============================================
// STARTUP
// ============================================

async function startTelegramBot() {
  try {
    console.log("🚀 Starting Queen MD Telegram pairing bot...");

    if (typeof sendStartup === "function") {
      try {
        await sendStartup(bot);
      } catch (error) {
        console.error(
          "⚠️ Telegram startup notification failed:",
          error.message
        );
      }
    }

    await bot.launch();

    console.log(
      "✅ Queen MD Telegram pairing bot is running."
    );
  } catch (error) {
    console.error(
      "❌ Failed to start Telegram bot:",
      error
    );

    throw error;
  }
}

// ============================================
// TELEGRAM ERROR HANDLER
// ============================================

bot.catch((error, ctx) => {
  console.error(
    `❌ Telegram error for ${ctx?.from?.id || "unknown user"}:`,
    error
  );
});

// ============================================
// PROCESS HANDLERS
// ============================================

process.once("SIGINT", () => {
  try {
    bot.stop("SIGINT");
  } catch (error) {
    console.error(error);
  }
});

process.once("SIGTERM", () => {
  try {
    bot.stop("SIGTERM");
  } catch (error) {
    console.error(error);
  }
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  bot,
  startTelegramBot,
  normalizeNumber,
  beginPairing,
};
