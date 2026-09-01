const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require("@whiskeysockets/baileys");

const P = require("pino");
const fs = require("fs");
const path = require("path");

let sock = null;
let pairingNumber = null;
let connectionStatus = "close";
let starting = false;

const AUTH_DIR = path.join(process.cwd(), "auth_info");

function log(message) {
  console.log(`[Queen MD] ${message}`);
}

function getConnectionStatus() {
  return connectionStatus;
}

function isConnected() {
  return connectionStatus === "open" && sock !== null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 START WHATSAPP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startWhatsApp() {
  if (starting) {
    return sock;
  }

  starting = true;

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    let version;

    try {
      const latest = await fetchLatestBaileysVersion();
      version = latest.version;
      log(`📦 Baileys version: ${version.join(".")}`);
    } catch {
      version = [2, 3000, 1015901307];
    }

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(
          state.keys,
          P({ level: "silent" })
        ),
      },
      logger: P({ level: "silent" }),
      printQRInTerminal: false,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      browser: ["Queen MD", "Chrome", "1.0.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "connecting") {
        connectionStatus = "connecting";
        log("🔄 WhatsApp connecting...");
      }

      if (connection === "open") {
        connectionStatus = "open";
        starting = false;
        log("✅ WhatsApp connected!");
      }

      if (connection === "close") {
        connectionStatus = "close";

        const statusCode =
          lastDisconnect?.error?.output?.statusCode;

        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut;

        log(
          `❌ WhatsApp disconnected. Reconnect: ${shouldReconnect}`
        );

        sock = null;
        starting = false;

        if (shouldReconnect) {
          setTimeout(() => {
            startWhatsApp().catch((err) => {
              console.error(
                "❌ Reconnection error:",
                err.message
              );
            });
          }, 3000);
        }
      }
    });

    starting = false;
    return sock;
  } catch (error) {
    starting = false;
    sock = null;
    connectionStatus = "close";

    console.error(
      "❌ WhatsApp startup error:",
      error.message
    );

    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 REQUEST PAIRING CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function requestPairingCode(number) {
  try {
    const cleanNumber = String(number).replace(/\D/g, "");

    if (cleanNumber.length < 10) {
      throw new Error("Invalid WhatsApp number");
    }

    pairingNumber = cleanNumber;

    // Start a fresh socket if necessary.
    if (!sock) {
      log("🚀 Starting WhatsApp pairing session...");
      await startWhatsApp();
    }

    if (!sock) {
      throw new Error("Failed to initialize WhatsApp socket");
    }

    if (typeof sock.requestPairingCode !== "function") {
      throw new Error(
        "requestPairingCode is not available in this Baileys version"
      );
    }

    /*
     * IMPORTANT:
     * Do NOT wait for connectionStatus === "open" here.
     *
     * A new account is not connected yet. The pairing code
     * is what allows the phone to authenticate the account.
     */

    log(`📱 Requesting pairing code for ${cleanNumber}...`);

    const code = await sock.requestPairingCode(cleanNumber);

    if (!code) {
      throw new Error("WhatsApp returned an empty pairing code");
    }

    log(`✅ Pairing code generated: ${code}`);

    return code;
  } catch (error) {
    console.error(
      "❌ Pairing code error:",
      error.message
    );

    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📨 SEND MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendMessage(jid, text) {
  try {
    if (!sock || !isConnected()) {
      throw new Error("WhatsApp is not connected");
    }

    await sock.sendMessage(jid, {
      text: String(text),
    });

    log(`📤 Message sent to ${jid}`);
  } catch (error) {
    console.error(
      "❌ Send message error:",
      error.message
    );

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
// 📊 EXPORTS
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
