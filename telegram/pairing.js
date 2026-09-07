// telegram/pairing.js

const { Telegraf, Markup } = require("telegraf");

const config = require("../config");

const {
  requestPairingCode,
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

function normalizeNumber(input) {
  if (!input) return null;

  let number = String(input)
    .trim()
    .replace(/[^\d+]/g, "");

  number = number.replace(/^\+/, "");

  // Nigerian local number
  // 08122029123 -> 2348122029123
  if (number.startsWith("0")) {
    number = "234" + number.slice(1);
  }

  // Nigerian number without country code
  // 8122029123 -> 2348122029123
  else if (number.startsWith("8") && number.length === 10) {
    number = "234" + number;
  }

  if (!/^\d+$/.test(number)) {
    return null;
  }

  if (number.length < 10 || number.length > 15) {
    return null;
  }

  return number;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
┃ 📱 WʜᴀᴛsAᴘᴘ Pᴀɪʀɪɴɢ
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

  // User must first use /pair
  if (!waitingForNumber.has(userId)) {
    return;
  }

  waitingForNumber.delete(userId);

  const number = normalizeNumber(text);

  if (!number) {
    await ctx.reply(
      `❌ Iɴᴠᴀʟɪᴅ WʜᴀᴛsAᴘᴘ Nᴜᴍʙᴇʀ.

Sᴇɴᴅ ɪᴛ ʟɪᴋᴇ:

➜ 2348122029123

Oʀ

➜ 08122029123`
    );

    return;
  }

  const attempts =
    pairingAttempts.get(userId) || 0;

  if (attempts >= MAX_PAIRING_ATTEMPTS) {
    pairingAttempts.delete(userId);

    await ctx.reply(
      `❌ Tᴏᴏ ᴍᴀɴʏ Pᴀɪʀɪɴɢ Aᴛᴛᴇᴍᴘᴛs.

Pʟᴇᴀsᴇ ᴡᴀɪᴛ ᴀɴᴅ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.`
    );

    return;
  }

  pairingAttempts.set(
    userId,
    attempts + 1
  );

  const statusMessage = await ctx.reply(
    `⏳ Gᴇɴᴇʀᴀᴛɪɴɢ Yᴏᴜʀ WʜᴀᴛsAᴘᴘ Pᴀɪʀɪɴɢ Cᴏᴅᴇ...

📱 Nᴜᴍʙᴇʀ: +${number}

⚡ Pʟᴇᴀsᴇ ᴡᴀɪᴛ...`
  );

  try {
    console.log(
      `🔐 Pairing requested by Telegram user ${userId} for +${number}`
    );

    /*
     * IMPORTANT:
     *
     * Do NOT check isConnected() here.
     *
     * requestPairingCode() is responsible for
     * creating/preparing the WhatsApp socket.
     */

    const codePromise =
      requestPairingCode(number);

    const timeoutPromise =
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "Pairing code generation timed out after 120 seconds."
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

    const cleanCode = String(code)
      .replace(/[^A-Za-z0-9]/g, "");

    const formattedCode =
      cleanCode.match(/.{1,4}/g)?.join("-") ||
      cleanCode;

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
┃ ➜ Sᴇᴛᴛɪɴɢs
┃ ➜ Lɪɴᴋᴇᴅ Dᴇᴠɪᴄᴇs
┃ ➜ Lɪɴᴋ A Dᴇᴠɪᴄᴇ
┃ ➜ Lɪɴᴋ Wɪᴛʜ Pʜᴏɴᴇ Nᴜᴍʙᴇʀ
┃
┃ Eɴᴛᴇʀ ᴛʜᴇ Cᴏᴅᴇ Aʙᴏᴠᴇ.
┃
┃ ⚠️ Dᴏ ɴᴏᴛ sʜᴀʀᴇ ᴛʜɪs Cᴏᴅᴇ.
┃
╰━━━━━━━━━━━━━━━━━━╯`
    );

    console.log(
      `✅ Pairing code generated for +${number}`
    );

    pairingAttempts.delete(userId);

    // Give Baileys time to process authentication.
    await sleep(3000);
  } catch (error) {
    console.error(
      "❌ Pairing code error:",
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
┃ WʜᴀᴛsAᴘᴘ Pᴀɪʀɪɴɢ Fᴀɪʟᴇᴅ.
┃
┃ ❗ Eʀʀᴏʀ:
┃ ${errorMessage}
┃
┃ 🔄 Sᴇɴᴅ /pair
┃ ᴛᴏ ᴛʀʏ ᴀɢᴀɪɴ.
┃
╰━━━━━━━━━━━━━━━━━━╯`
      );
    } catch (editError) {
      console.error(
        "❌ Failed to edit pairing error:",
        editError
      );

      await ctx.reply(
        `❌ Pᴀɪʀɪɴɢ Fᴀɪʟᴇᴅ.

Eʀʀᴏʀ:
${errorMessage}

Sᴇɴᴅ /pair ᴛᴏ ᴛʀʏ ᴀɢᴀɪɴ.`
      );
    }
  }
});

// ============================================
// /STATUS
// ============================================

bot.command("status", async (ctx) => {
  try {
    const connection =
      require("../whatsapp/connection");

    const status =
      typeof connection.getConnectionStatus ===
      "function"
        ? connection.getConnectionStatus()
        : "unknown";

    const connected =
      typeof connection.isConnected ===
      "function"
        ? connection.isConnected()
        : false;

    await ctx.reply(
      `╭━━━〔 📊 Qᴜᴇᴇɴ ᴍᴅ Sᴛᴀᴛᴜs 〕━━━╮
┃
┃ 📡 WʜᴀᴛsAᴘᴘ:
┃ ${
        connected
          ? "🟢 Cᴏɴɴᴇᴄᴛᴇᴅ"
          : "🔴 Nᴏᴛ Cᴏɴɴᴇᴄᴛᴇᴅ"
      }
┃
┃ 🔌 Sᴏᴄᴋᴇᴛ:
┃ ${status}
┃
╰━━━━━━━━━━━━━━━━━━╯`
    );
  } catch (error) {
    console.error(
      "❌ /status error:",
      error
    );

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
    console.error(
      "❌ /ping error:",
      error
    );
  }
});

// ============================================
// /RUNTIME
// ============================================

bot.command("runtime", async (ctx) => {
  const seconds = Math.floor(
    process.uptime()
  );

  const days = Math.floor(
    seconds / 86400
  );

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
┃ 📈 Sᴛᴀᴛs
┃ /stats
┃
┃ 👑 Oᴡɴᴇʀ
┃ /owner
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
    console.error(
      "❌ Help button error:",
      error
    );
  }
});

// ============================================
// STATUS BUTTON
// ============================================

bot.action("BOT_STATUS", async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const connection =
      require("../whatsapp/connection");

    const status =
      typeof connection.getConnectionStatus ===
      "function"
        ? connection.getConnectionStatus()
        : "unknown";

    const connected =
      typeof connection.isConnected ===
      "function"
        ? connection.isConnected()
        : false;

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

Rᴇᴍᴏᴠᴇ ᴛʜᴇ ʟɪɴᴋᴇᴅ ᴅᴇᴠɪᴄᴇ ғʀᴏᴍ WʜᴀᴛsAᴘᴘ ᴏʀ ʀᴇᴍᴏᴠᴇ ᴛʜᴇ ᴀᴜᴛʜ sᴇssɪᴏɴ ғʀᴏᴍ ᴛʜᴇ sᴇʀᴠᴇʀ.`
  );
});

// ============================================
// /STATS
// ============================================

bot.command("stats", async (ctx) => {
  const memory =
    process.memoryUsage();

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
┃ ${Math.floor(
      process.uptime()
    )}s
┃
╰━━━━━━━━━━━━━━━━━━╯`
  );
});

// ============================================
// /OWNER
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
// START TELEGRAM
// ============================================

async function startTelegramBot() {
  try {
    console.log(
      "🚀 Starting Queen MD Telegram pairing bot..."
    );

    if (
      typeof sendStartup ===
      "function"
    ) {
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
    `❌ Telegram error for ${
      ctx?.from?.id || "unknown user"
    }:`,
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
