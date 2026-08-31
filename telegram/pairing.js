// ╔══════════════════════════════════════╗
// ║          👑 QUEEN MD                ║
// ║       TELEGRAM PAIRING              ║
// ╚══════════════════════════════════════╝

const { Telegraf } = require("telegraf");
const config = require("../config");

// WhatsApp pairing function will be connected here
const { requestPairingCode } = require("../whatsapp/connection");

let telegramBot;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 STATE MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Store users currently entering their WhatsApp number
const waitingForNumber = new Map();

// Store pairing attempts to prevent abuse
const pairingAttempts = new Map();
const MAX_ATTEMPTS = 5;
const ATTEMPT_RESET_TIME = 3600000; // 1 hour

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Check if user has exceeded pairing attempt limit
 */
function canPair(userId) {
  const attempts = pairingAttempts.get(userId);

  if (!attempts) {
    pairingAttempts.set(userId, {
      count: 1,
      firstAttempt: Date.now(),
    });
    return true;
  }

  if (Date.now() - attempts.firstAttempt > ATTEMPT_RESET_TIME) {
    pairingAttempts.set(userId, {
      count: 1,
      firstAttempt: Date.now(),
    });
    return true;
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    return false;
  }

  attempts.count++;
  return true;
}

/**
 * Validate WhatsApp number format
 */
function validateNumber(number) {
  const cleaned = number.replace(/\D/g, "").trim();

  if (!cleaned || cleaned.length < 10) {
    return null;
  }

  // Remove leading zeros or plus signs
  return cleaned.replace(/^(\+?0+)/, "");
}

/**
 * Format welcome message
 */
function getWelcomeMessage() {
  return `╭━━〔 👑 ${config.botName} 〕━━╮
┃
┃ 👋 Welcome to Queen MD
┃
┃ 📱 Telegram is used only
┃ for WhatsApp pairing.
┃
┃ 🔗 Use /pair to connect
┃ your WhatsApp account.
┃
┃ 📝 Available commands:
┃ /pair - Connect WhatsApp
┃ /status - Bot status
┃ /help - Get help
┃
╰━━━━━━━━━━━━━━━━━━━━╯`;
}

/**
 * Format help message
 */
function getHelpMessage() {
  return `╭━━〔 ❓ HELP 〕━━╮
┃
┃ /start - Welcome message
┃ /pair - Pair WhatsApp
┃ /status - Check status
┃ /help - This message
┃
┃ 📱 To pair WhatsApp:
┃ 1. Send /pair
┃ 2. Send your WhatsApp number
┃ 3. Open WhatsApp Settings
┃ 4. Go to Linked Devices
┃ 5. Click "Link a Device"
┃ 6. Enter the code
┃
╰━━━━━━━━━━━━━━━━━━━━╯`;
}

/**
 * Format status message
 */
function getStatusMessage() {
  return `╭━━〔 👑 QUEEN MD 〕━━╮
┃
┃ 📲 Telegram: ✅ Online
┃ 📱 WhatsApp: 🔧 Pairing
┃ 🤖 Mode: Mini Bot
┃ 📊 Version: ${config.botVersion}
┃
╰━━━━━━━━━━━━━━━━━━━━╯`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📲 START TELEGRAM BOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startPairingBot() {
  if (!config.telegramToken) {
    console.error("❌ TELEGRAM_BOT_TOKEN is not configured");
    return null;
  }

  try {
    telegramBot = new Telegraf(config.telegramToken);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // /start
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    telegramBot.start(async (ctx) => {
      try {
        await ctx.reply(getWelcomeMessage(), {
          parse_mode: "HTML",
        });
      } catch (error) {
        console.error("Error in /start command:", error.message);
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // /pair
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    telegramBot.command("pair", async (ctx) => {
      try {
        const userId = ctx.from.id;

        // Check attempt limit
        if (!canPair(userId)) {
          await ctx.reply(
            `❌ Too many pairing attempts.\n\n` +
            `Please try again in 1 hour.`,
            { parse_mode: "HTML" }
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
┃ Example:
┃ 2348012345678
┃
┃ ⚠️ Include your country code.
┃ No + or - signs needed.
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
          { parse_mode: "HTML" }
        );
      } catch (error) {
        console.error("Error in /pair command:", error.message);
        await ctx.reply("❌ An error occurred. Please try again.");
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // /status
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    telegramBot.command("status", async (ctx) => {
      try {
        await ctx.reply(getStatusMessage(), {
          parse_mode: "HTML",
        });
      } catch (error) {
        console.error("Error in /status command:", error.message);
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // /help
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    telegramBot.command("help", async (ctx) => {
      try {
        await ctx.reply(getHelpMessage(), {
          parse_mode: "HTML",
        });
      } catch (error) {
        console.error("Error in /help command:", error.message);
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // RECEIVE WHATSAPP NUMBER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    telegramBot.on("text", async (ctx) => {
      try {
        const userId = ctx.from.id;
        const userSession = waitingForNumber.get(userId);

        // Ignore if not waiting for number
        if (!userSession) return;

        // Check session timeout (5 minutes)
        if (Date.now() - userSession.timestamp > 300000) {
          waitingForNumber.delete(userId);
          await ctx.reply(
            "⏱️ Session expired. Please use /pair to start over."
          );
          return;
        }

        const number = validateNumber(ctx.message.text);

        if (!number) {
          userSession.attempts++;

          if (userSession.attempts >= 3) {
            waitingForNumber.delete(userId);
            await ctx.reply(
              "❌ Too many invalid attempts.\n\n" +
              "Please use /pair to try again."
            );
            return;
          }

          await ctx.reply(
            `❌ Invalid WhatsApp number.\n\n` +
            `Example: 2348012345678\n\n` +
            `Attempt ${userSession.attempts}/3`
          );
          return;
        }

        waitingForNumber.delete(userId);

        await ctx.reply("⏳ Generating your WhatsApp pairing code...");

        try {
          const code = await requestPairingCode(number);

          await ctx.reply(
            `╭━━〔 🔑 QUEEN MD 〕━━╮
┃
┃ Your pairing code:
┃
┃    <code>${code}</code>
┃
┃ Open WhatsApp:
┃ Settings → Linked Devices
┃ → Link a Device
┃
┃ Enter the code above.
┃
╰━━━━━━━━━━━━━━━━━━━━╯`,
            { parse_mode: "HTML" }
          );

          console.log(`✅ Pairing code sent to user ${userId}`);
        } catch (error) {
          console.error("Pairing error:", error.message);

          await ctx.reply(
            "❌ Failed to generate pairing code.\n\n" +
            "Error: " + error.message + "\n\n" +
            "Please try /pair again."
          );
        }
      } catch (error) {
        console.error("Error processing text message:", error.message);
        await ctx.reply("❌ An error occurred. Please try again.");
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ERROR HANDLING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    telegramBot.catch((error, ctx) => {
      console.error("❌ Telegram error:", error.message);
      try {
        ctx.reply("❌ An error occurred. Please try again.");
      } catch (e) {
        console.error("Failed to send error message:", e.message);
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LAUNCH BOT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await telegramBot.launch();

    console.log("✅ Telegram pairing bot started successfully");

    // Graceful shutdown
    process.once("SIGINT", () => telegramBot.stop("SIGINT"));
    process.once("SIGTERM", () => telegramBot.stop("SIGTERM"));

    return telegramBot;
  } catch (error) {
    console.error("❌ Failed to start Telegram bot:", error.message);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  startPairingBot,
  getTelegramBot: () => telegramBot,
};
