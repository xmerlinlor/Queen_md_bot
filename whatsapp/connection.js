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
// 📱 CLEAN PHONE NUMBER
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
// 🚀 START WHATSAPP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startWhatsApp() {
  if (starting && sock) {
    return sock;
  }

  if (
    sock &&
    connectionStatus === "open"
  ) {
    return sock;
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
        // 🟢 CONNECTED
        // ──────────────────────────────

        if (connection === "open") {
          connectionStatus = "open";
          starting = false;

          console.log(
            "╔══════════════════════════════╗"
          );
          console.log(
            "║   ✅ WHATSAPP CONNECTED      ║"
          );
          console.log(
            "╚══════════════════════════════╝"
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
              "🚪 WhatsApp session logged out."
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

              try {
                if (
                  !sock ||
                  connectionStatus ===
                    "closed"
                ) {
                  console.log(
                    "🔄 Reconnecting WhatsApp..."
                  );

                  await startWhatsApp();
                }
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
// ⏳ WAIT FOR SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function waitForSocket(timeout = 60000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (
      sock &&
      connectionStatus === "open"
    ) {
      return sock;
    }

    if (!sock) {
      await startWhatsApp();
    }

    await sleep(1000);
  }

  throw new Error(
    "WhatsApp connection timed out. Please try again."
  );
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
      console.log(
        `📱 Preparing pairing for ${phoneNumber}...`
      );

      // Start WhatsApp
      if (!sock) {
        await startWhatsApp();
      }

      /*
       * IMPORTANT:
       * Do not request the pairing code immediately.
       * Wait until the WhatsApp socket is actually ready.
       */
      await waitForSocket(60000);

      if (!sock) {
        throw new Error(
          "WhatsApp socket is unavailable."
        );
      }

      if (
        connectionStatus !== "open"
      ) {
        throw new Error(
          "WhatsApp connection is not ready."
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
        `✅ Pairing code generated successfully.`
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
