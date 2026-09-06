// whatsapp/connection.js

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const P = require("pino");
const fs = require("fs");
const path = require("path");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AUTH_DIR = path.join(process.cwd(), "auth_info_baileys");

let sock = null;
let pairingNumber = null;
let connectionStatus = "closed";
let starting = false;

// Prevent duplicate pairing requests
let pairingPromise = null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 CLEAN PHONE NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanNumber(number) {
  if (!number) return null;

  return String(number)
    .replace(/\D/g, "")
    .replace(/^0+/, "");
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
    fs.mkdirSync(AUTH_DIR, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    let version;

    try {
      const latest = await fetchLatestBaileysVersion();
      version = latest.version;
    } catch (err) {
      console.log("⚠️ Could not fetch latest Baileys version.");
    }

    const socketConfig = {
      auth: state,

      printQRInTerminal: false,

      logger: P({
        level: "silent",
      }),

      browser: ["Queen MD", "Chrome", "1.0.0"],

      markOnlineOnConnect: false,

      generateHighQualityLinkPreview: false,

      syncFullHistory: false,

      connectTimeoutMs: 60000,

      defaultQueryTimeoutMs: 60000,

      keepAliveIntervalMs: 30000,

      retryRequestDelayMs: 2500,
    };

    if (version) {
      socketConfig.version = version;
    }

    sock = makeWASocket(socketConfig);

    connectionStatus = "connecting";

    // Save WhatsApp credentials
    sock.ev.on("creds.update", saveCreds);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔌 CONNECTION UPDATE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on("connection.update", async (update) => {
      const {
        connection,
        lastDisconnect,
      } = update;

      if (connection === "connecting") {
        connectionStatus = "connecting";

        console.log("📡 Connecting to WhatsApp...");
      }

      if (connection === "open") {
        connectionStatus = "open";
        starting = false;

        console.log("✅ WhatsApp connected successfully!");

        if (sock?.user) {
          console.log(
            `📱 Logged in as: ${sock.user.id}`
          );
        }
      }

      if (connection === "close") {
        connectionStatus = "closed";

        starting = false;

        let statusCode = null;

        try {
          statusCode =
            lastDisconnect?.error?.output?.statusCode ||
            lastDisconnect?.error?.data?.statusCode;
        } catch (_) {}

        console.log(
          `❌ WhatsApp connection closed${
            statusCode ? ` (${statusCode})` : ""
          }`
        );

        // Do NOT immediately reconnect after logout
        if (statusCode === DisconnectReason.loggedOut) {
          console.log(
            "🚪 WhatsApp logged out. Delete the auth folder and pair again."
          );

          sock = null;
          pairingNumber = null;

          return;
        }

        // Reconnect after temporary connection loss
        setTimeout(async () => {
          try {
            if (!sock || connectionStatus === "closed") {
              await startWhatsApp();
            }
          } catch (err) {
            console.error(
              "❌ Reconnection failed:",
              err.message
            );
          }
        }, 5000);
      }
    });

    return sock;
  } catch (error) {
    starting = false;
    connectionStatus = "closed";

    console.error(
      "❌ WhatsApp start error:",
      error.message
    );

    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📲 REQUEST PAIRING CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function requestPairingCode(number) {
  const phoneNumber = cleanNumber(number);

  if (!phoneNumber) {
    throw new Error(
      "Invalid WhatsApp phone number."
    );
  }

  if (pairingPromise) {
    return pairingPromise;
  }

  pairingPromise = (async () => {
    try {
      // Start socket if it doesn't exist
      if (!sock) {
        await startWhatsApp();
      }

      // Wait until socket is available
      let attempts = 0;

      while (!sock && attempts < 20) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );

        attempts++;
      }

      if (!sock) {
        throw new Error(
          "WhatsApp socket could not be created."
        );
      }

      // Wait for connection to initialize
      await new Promise((resolve) =>
        setTimeout(resolve, 3000)
      );

      console.log(
        `📱 Requesting pairing code for ${phoneNumber}`
      );

      const code =
        await sock.requestPairingCode(phoneNumber);

      pairingNumber = phoneNumber;

      console.log(
        `🔐 Pairing code generated for ${phoneNumber}`
      );

      return code;
    } catch (error) {
      console.error(
        "❌ Pairing code error:",
        error.message
      );

      throw error;
    } finally {
      pairingPromise = null;
    }
  })();

  return pairingPromise;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 SEND MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendMessage(jid, message) {
  if (!sock) {
    throw new Error(
      "WhatsApp socket is not initialized."
    );
  }

  if (connectionStatus !== "open") {
    throw new Error(
      "WhatsApp is not connected."
    );
  }

  return await sock.sendMessage(jid, message);
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
// 📊 GET CONNECTION STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getConnectionStatus() {
  return connectionStatus;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 IS CONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isConnected() {
  return (
    sock !== null &&
    connectionStatus === "open"
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORTS
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
