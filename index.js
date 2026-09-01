// ╔══════════════════════════════════════╗
// ║           👑 QUEEN MD               ║
// ║        Main Entry Point              ║
// ╚══════════════════════════════════════╝

require("dotenv").config();

const config = require("./config");
const { startPairingBot } = require("./telegram/pairing");
const { startWhatsApp } = require("./whatsapp/connection");
const { handleMessage } = require("./whatsapp/handler");
const { DisconnectReason } = require("@whiskeysockets/baileys");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 STATE MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let whatsappSocket = null;
let isRunning = false;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 START QUEEN MD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startQueenMD() {
  try {
    console.log("");
    console.log("╔══════════════════════════════════════╗");
    console.log("║          👑 QUEEN MD                 ║");
    console.log("║        MINI WHATSAPP BOT             ║");
    console.log("║        v1.0 - ENHANCED              ║");
    console.log("╚══════════════════════════════════════╝");
    console.log("");
    console.log("⏱️  Starting initialization...");
    console.log("");

    // 📲 Start Telegram pairing bot
    if (config.telegramToken) {
      try {
        await startPairingBot();
        console.log("✅ Telegram pairing system started");
      } catch (error) {
        console.error("⚠️  Telegram pairing failed:", error.message);
      }
    } else {
      console.log("⚠️  Telegram token not configured - skipping Telegram");
    }

    // 📱 Start WhatsApp
    console.log("⏳ Connecting to WhatsApp...");
    whatsappSocket = await startWhatsApp();

    // 💬 WhatsApp message handler
    if (whatsappSocket) {
      whatsappSocket.ev.on("messages.upsert", async (chatUpdate) => {
        try {
          await handleMessage(whatsappSocket, chatUpdate);
        } catch (error) {
          console.error("❌ Message handler error:", error.message);
          logError(error);
        }
      });

      // 🔌 Connection status listener
      whatsappSocket.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "close") {
          const shouldReconnect =
            lastDisconnect?.error?.output?.statusCode !==
            DisconnectReason.loggedOut;

          console.log(
            "⚠️  WhatsApp connection closed:",
            lastDisconnect?.error
          );

          if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(
              `🔄 Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
            );
            setTimeout(() => startQueenMD(), 3000);
          } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error("❌ Max reconnection attempts reached. Exiting...");
            process.exit(1);
          }
        } else if (connection === "open") {
          reconnectAttempts = 0;
          console.log("✅ WhatsApp connected successfully");
        }
      });

      console.log("✅ WhatsApp message listener attached");
    } else {
      throw new Error("Failed to initialize WhatsApp socket");
    }

    isRunning = true;
    console.log("");
    console.log("╭━━〔 👑 QUEEN MD 〕━━╮");
    console.log("┃ 🟢 Status: ONLINE");
    console.log("┃ 📱 WhatsApp: READY");
    console.log("┃ 📲 Telegram: PAIRING");
    console.log("┃ ⚡ Mode: MINI BOT");
    console.log("┃ 🔧 Version: 1.0");
    console.log("╰━━━━━━━━━━━━━━━━━━━━╯");
    console.log("");
    console.log("💡 Bot is ready to receive commands!");
    console.log("");
  } catch (error) {
    console.error("");
    console.error("╔════════════════════════════════════╗");
    console.error("║     ❌ QUEEN MD STARTUP FAILED     ║");
    console.error("╚════════════════════════════════════╝");
    console.error("");
    console.error("Error Details:", error.message);
    console.error("");
    logError(error);
    process.exit(1);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 LOGGING UTILITY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function logError(error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error Stack:`, error.stack);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 ERROR HANDLING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

process.on("uncaughtException", (error) => {
  console.error("");
  console.error("╔════════════════════════════════════╗");
  console.error("║   ❌ UNCAUGHT EXCEPTION ERROR      ║");
  console.error("╚════════════════════════════════════╝");
  logError(error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("");
  console.error("╔════════════════════════════════════╗");
  console.error("║  ❌ UNHANDLED REJECTION ERROR      ║");
  console.error("╚════════════════════════════════════╝");
  logError(error);
  // Don't exit on unhandled rejection, just log
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛑 GRACEFUL SHUTDOWN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

process.on("SIGINT", async () => {
  console.log("");
  console.log("╔════════════════════════════════════╗");
  console.log("║    🛑 SHUTTING DOWN QUEEN MD       ║");
  console.log("╚════════════════════════════════════╝");

  if (whatsappSocket) {
    try {
      await whatsappSocket.end();
      console.log("✅ WhatsApp connection closed");
    } catch (error) {
      console.error("⚠️  Error closing WhatsApp:", error.message);
    }
  }

  isRunning = false;
  console.log("✅ Queen MD shutdown complete");
  console.log("");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("⚠️  SIGTERM received - initiating shutdown...");
  process.emit("SIGINT");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ RUN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

startQueenMD();

// Export for use in other modules if needed
module.exports = {
  getWhatsAppSocket: () => whatsappSocket,
  isQueenMDRunning: () => isRunning,
};
