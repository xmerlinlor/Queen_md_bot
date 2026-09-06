// whatsapp/connection.js

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const P = require("pino");
const fs = require("fs");
const path = require("path");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AUTH_DIR = path.join(
  process.cwd(),
  "auth_info_baileys"
);

let sock = null;
let pairingNumber = null;
let connectionStatus = "closed";
let starting = false;
let pairingPromise = null;
let reconnectTimer = null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 CLEAN NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanNumber(number) {
  if (!number) return null;

  const cleaned = String(number)
    .replace(/\D/g, "")
    .replace(/^0+/, "");

  if (!cleaned || cleaned.length < 8) {
    return null;
  }

  return cleaned;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏳ SLEEP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 START WHATSAPP SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startWhatsApp() {
  if (sock) {
    return sock;
  }

  if (starting) {
    let tries = 0;

    while (!sock && tries < 30) {
      await sleep(500);
      tries++;
    }

    if (sock) {
      return sock;
    }
  }

  starting = true;

  try {
    fs.mkdirSync(AUTH_DIR, {
      recursive: true,
    });

    const {
      state,
      saveCreds,
    } = await useMultiFileAuthState(AUTH_DIR);

    const socketConfig = {
      auth: state,

      printQRInTerminal: false,

      logger: P({
        level: "silent",
      }),

      browser: [
        "Queen MD",
        "Chrome",
        "1.0.0",
      ],

      markOnlineOnConnect: false,

      generateHighQualityLinkPreview: false,

      syncFullHistory: false,

      connectTimeoutMs: 60000,

      defaultQueryTimeoutMs: 60000,

      keepAliveIntervalMs: 20000,

      retryRequestDelayMs: 2000,
    };

    sock = makeWASocket(socketConfig);

    connectionStatus = "connecting";

    console.log(
      "📡 WhatsApp socket initialized."
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💾 SAVE CREDENTIALS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on(
      "creds.update",
      saveCreds
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔌 CONNECTION UPDATE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    sock.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect,
        } = update;

        // ──────────────────────────────
        // 📡 CONNECTING
        // ──────────────────────────────

        if (connection === "connecting") {
          connectionStatus = "connecting";

          console.log(
            "📡 Connecting to WhatsApp..."
          );
        }

        // ──────────────────────────────
        // 🟢 OPEN
        // ──────────────────────────────

        if (connection === "open") {
          connectionStatus = "open";
          starting = false;

          console.log(
            "╔════════════════════════════════╗"
          );
          console.log(
            "║   👑 QUEEN MD WHATSAPP ONLINE  ║"
          );
          console.log(
            "╚════════════════════════════════╝"
          );

          if (sock?.user) {
            console.log(
              `📱 Logged in as: ${sock.user.id}`
            );
          }
        }

        // ──────────────────────────────
        // 🔴 CLOSED
        // ──────────────────────────────

        if (connection === "close") {
          connectionStatus = "closed";
          starting = false;

          let statusCode = null;

          try {
            statusCode =
              lastDisconnect?.error
                ?.output?.statusCode ||
              lastDisconnect?.error
                ?.data?.statusCode;
          } catch (_) {}

          console.log(
            `❌ WhatsApp connection closed${
              statusCode
                ? ` (${statusCode})`
                : ""
            }`
          );

          // ────────────────────────────
          // 🚪 LOGGED OUT
          // ────────────────────────────

          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {
            console.log(
              "🚪 WhatsApp logged out."
            );

            sock = null;
            pairingNumber = null;

            return;
          }

          // ────────────────────────────
          // 🔄 RECONNECT
          // ────────────────────────────

          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
          }

          reconnectTimer = setTimeout(
            async () => {
              reconnectTimer = null;

              if (sock) {
                return;
              }

              try {
                console.log(
                  "🔄 Reconnecting WhatsApp..."
                );

                await startWhatsApp();
              } catch (error) {
                console.error(
                  "❌ Reconnection failed:",
                  error.message
                );
              }
            },
            5000
          );
        }
      }
    );

    starting = false;

    return sock;
  } catch (error) {
    starting = false;
    connectionStatus = "closed";
    sock = null;

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
    throw new Error(
      "A pairing request is already in progress."
    );
  }

  pairingPromise = (async () => {
    try {
      console.log(
        `📱 Preparing pairing for ${phoneNumber}...`
      );

      // Create the socket.
      // IMPORTANT: Do NOT wait for "open".
      await startWhatsApp();

      if (!sock) {
        throw new Error(
          "WhatsApp socket could not be created."
        );
      }

      /*
       * Give the Baileys WebSocket a short moment
       * to initialize its connection.
       *
       * We deliberately DO NOT wait for
       * connectionStatus === "open".
       *
       * A new account becomes "open" only AFTER
       * the pairing process succeeds.
       */
      await sleep(2000);

      if (!sock) {
        throw new Error(
          "WhatsApp socket is unavailable."
        );
      }

      console.log(
        `🔐 Requesting pairing code for ${phoneNumber}...`
      );

      const code =
        await sock.requestPairingCode(
          phoneNumber
        );

      if (!code) {
        throw new Error(
          "WhatsApp did not return a pairing code."
        );
      }

      pairingNumber = phoneNumber;

      console.log(
        "╔════════════════════════════════╗"
      );
      console.log(
        "║   🔐 PAIRING CODE GENERATED    ║"
      );
      console.log(
        "╚════════════════════════════════╝"
      );

      console.log(
        `📱 Number: ${phoneNumber}`
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

async function sendMessage(
  jid,
  message
) {
  if (!sock) {
    throw new Error(
      "WhatsApp socket is not initialized."
    );
  }

  if (
    connectionStatus !== "open"
  ) {
    throw new Error(
      "WhatsApp is not connected."
    );
  }

  return sock.sendMessage(
    jid,
    message
  );
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
