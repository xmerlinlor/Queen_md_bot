// ╔══════════════════════════════════════╗
// ║          👑 QUEEN MD                ║
// ║       WHATSAPP CONNECTION            ║
// ╚══════════════════════════════════════╝

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const path = require("path");
const fs = require("fs");

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 SESSION DIRECTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sessionDir = path.join(
  __dirname,
  "..",
  "sessions",
  config.sessionName
);

if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
  console.log(`✅ Session directory created: ${sessionDir}`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 STATE MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let sock = null;
let starting = false;
let connectionStatus = "disconnected"; // disconnected, connecting, connected

// Number waiting for pairing
let pairingNumber = null;

// Connection retry counter
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Log with timestamp
 */
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Get connection status
 */
function getConnectionStatus() {
  return connectionStatus;
}

/**
 * Check if socket is connected
 */
function isConnected() {
  return sock && connectionStatus === "connected";
}

/**
 * Reset reconnection attempts
 */
function resetReconnectAttempts() {
  reconnectAttempts = 0;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 START WHATSAPP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startWhatsApp() {
  if (starting) {
    log("⏳ WhatsApp is already starting...");
    return sock;
  }

  if (isConnected()) {
    log("✅ WhatsApp is already connected");
    return sock;
  }

  starting = true;
  connectionStatus = "connecting";

  try {
    log("🔄 Starting WhatsApp connection...");

    // Get latest Baileys version
    const { version } = await fetchLatestBaileysVersion();
    log(`📦 Using Baileys version: ${version.join(".")}`);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    // Create socket with Baileys v6.6.2 compatible options
    sock = makeWASocket({
      auth: state,
      version: version,
      logger: pino({
        level: config.debugMode ? "debug" : "silent",
      }),
      browser: ["Queen MD", "Chrome", config.botVersion],
      printQRInTerminal: false,
      generateHighQualityLinkPreview: false,
      markOnlineOnConnect: true,
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💾 SAVE CREDENTIALS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on("creds.update", saveCreds);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔌 CONNECTION UPDATE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR Code for manual pairing
      if (qr) {
        log("📱 QR Code received for manual pairing");
      }

      if (connection === "open") {
        starting = false;
        connectionStatus = "connected";
        resetReconnectAttempts();

        log("");
        log("╭━━〔 👑 QUEEN MD 〕━━╮");
        log("┃ 🟢 WhatsApp Connected");
        log("┃ ⚡ Mini Bot Online");
        log("┃ 📱 Ready for commands");
        log("╰━━━━━━━━━━━━━━━━━━━━╯");
        log("");
      }

      if (connection === "close") {
        starting = false;
        connectionStatus = "disconnected";

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const errorMessage = lastDisconnect?.error?.message;

        log(`❌ WhatsApp disconnected (${statusCode}): ${errorMessage}`);

        // Handle different disconnect reasons
        if (statusCode === DisconnectReason.badSession) {
          log("⚠️ Bad session detected. Clearing session...");
          fs.rmSync(sessionDir, { recursive: true, force: true });
          await startWhatsApp();
        } else if (statusCode === DisconnectReason.loggedOut) {
          log("⚠️ Session logged out. Please pair again.");
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } else if (statusCode !== DisconnectReason.connectionLost) {
          // Try to reconnect
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            log(`🔄 Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
            setTimeout(() => startWhatsApp(), config.reconnectDelay);
          } else {
            log("❌ Max reconnection attempts reached");
          }
        }
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💬 MESSAGE HANDLER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on("messages.upsert", async (m) => {
      try {
        const message = m.messages[0];

        if (!message.message) return;

        log(`💬 Message from ${message.key.remoteJid}: ${message.message.conversation || "[media]"}`);
      } catch (error) {
        console.error("❌ Message handling error:", error.message);
      }
    });

    return sock;
  } catch (error) {
    starting = false;
    connectionStatus = "disconnected";

    console.error("❌ WhatsApp startup error:", error.message);

    // Retry after delay
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      log(`🔄 Retrying in ${config.reconnectDelay / 1000} seconds...`);
      setTimeout(() => startWhatsApp(), config.reconnectDelay);
    }

    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 REQUEST PAIRING CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function requestPairingCode(number) {
  try {
    // Start WhatsApp if it is not running
    if (!sock) {
      log("🚀 Starting WhatsApp for pairing...");
      await startWhatsApp();

      // Wait for connection
      let retries = 0;
      while (!isConnected() && retries < 30) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        retries++;
      }

      if (!isConnected()) {
        throw new Error("WhatsApp failed to connect");
      }
    }

    // Ensure we're connected before requesting code
    if (!isConnected()) {
      throw new Error("WhatsApp is not connected");
    }

    // Remove spaces, +, -, etc.
    const cleanNumber = String(number).replace(/\D/g, "");

    if (cleanNumber.length < 10) {
      throw new Error("Invalid WhatsApp number (too short)");
    }

    pairingNumber = cleanNumber;

    // Check if socket has pairing function
    if (typeof sock.requestPairingCode !== "function") {
      throw new Error("WhatsApp pairing service is not available");
    }

    log(`📱 Requesting pairing code for ${cleanNumber}...`);

    const code = await sock.requestPairingCode(cleanNumber);

    log(`✅ Pairing code generated: ${code}`);

    return code;
  } catch (error) {
    console.error("❌ Pairing code error:", error.message);
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📨 SEND MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendMessage(jid, text) {
  try {
    if (!isConnected()) {
      throw new Error("WhatsApp is not connected");
    }

    await sock.sendMessage(jid, { text });
    log(`📤 Message sent to ${jid}`);
  } catch (error) {
    console.error("❌ Send message error:", error.message);
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 GET SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSocket() {
  return sock;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 GET PAIRING NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getPairingNumber() {
  return pairingNumber;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  startWhatsApp,
  requestPairingCode,
  sendMessage,
  getSocket,
  getPairingNumber,
  getConnectionStatus,
  isConnected,
};
