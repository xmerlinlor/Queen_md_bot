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

// ╔══════════════════════════════════════╗
// ║          👑 QUEEN MD                ║
// ║       WHATSAPP CONNECTION           ║
// ╚══════════════════════════════════════╝

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
let reconnectTimer = null;

// Prevent multiple simultaneous starts
let startPromise = null;

// Prevent multiple pairing requests
let pairingPromise = null;

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

  if (cleaned.length > 15) {
    return null;
  }

  return cleaned;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏳ SLEEP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 GET DISCONNECT CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getDisconnectCode(lastDisconnect) {
  try {
    return (
      lastDisconnect?.error?.output?.statusCode ||
      lastDisconnect?.error?.data?.statusCode ||
      null
    );
  } catch (_) {
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 CREATE WHATSAPP SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function createSocket() {
  fs.mkdirSync(AUTH_DIR, {
    recursive: true,
  });

  const {
    state,
    saveCreds,
  } = await useMultiFileAuthState(AUTH_DIR);

  // Get the current Baileys version when possible
  let version;

  try {
    const latest =
      await fetchLatestBaileysVersion();

    if (latest?.version) {
      version = latest.version;

      console.log(
        `📦 Baileys version: ${version.join(".")}`
      );
    }
  } catch (error) {
    console.log(
      "⚠️ Could not fetch latest Baileys version. Using default version."
    );
  }

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

    connectWithFullHistory: false,

    shouldIgnoreJid: () => false,
  };

  if (version) {
    socketConfig.version = version;
  }

  const newSocket =
    makeWASocket(socketConfig);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 SAVE CREDENTIALS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  newSocket.ev.on(
    "creds.update",
    saveCreds
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔌 CONNECTION UPDATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  newSocket.ev.on(
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

        if (newSocket.user) {
          console.log(
            `📱 Logged in as: ${newSocket.user.id}`
          );
        }

        console.log(
          "✅ WhatsApp connection is ready."
        );
      }

      // ──────────────────────────────
      // 🔴 CLOSED
      // ──────────────────────────────

      if (connection === "close") {
        const statusCode =
          getDisconnectCode(
            lastDisconnect
          );

        connectionStatus = "closed";

        console.log(
          `❌ WhatsApp connection closed${
            statusCode
              ? ` (${statusCode})`
              : ""
          }`
        );

        if (lastDisconnect?.error) {
          console.error(
            "❌ Disconnect error:",
            lastDisconnect.error.message ||
              lastDisconnect.error
          );
        }

        // Make sure this socket is no longer used
        if (sock === newSocket) {
          sock = null;
        }

        starting = false;

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
              console.log(
                "🔄 Reconnecting WhatsApp..."
              );

              await startWhatsApp();
            } catch (error) {
              console.error(
                "❌ WhatsApp reconnect failed:",
                error.message
              );
            }
          },
          5000
        );
      }
    }
  );

  return newSocket;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 START WHATSAPP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startWhatsApp() {
  // Already have a socket
  if (sock) {
    return sock;
  }

  // Another start operation is already running
  if (startPromise) {
    return startPromise;
  }

  starting = true;

  startPromise = (async () => {
    try {
      console.log(
        "🚀 Starting Queen MD WhatsApp..."
      );

      const newSocket =
        await createSocket();

      sock = newSocket;

      connectionStatus = "connecting";

      console.log(
        "📡 WhatsApp socket initialized."
      );

      return newSocket;
    } catch (error) {
      sock = null;
      connectionStatus = "closed";
      starting = false;

      console.error(
        "❌ WhatsApp start error:",
        error.message
      );

      throw error;
    } finally {
      startPromise = null;
    }
  })();

  return startPromise;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📲 REQUEST PAIRING CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function requestPairingCode(number) {
  const phoneNumber =
    cleanNumber(number);

  if (!phoneNumber) {
    throw new Error(
      "Invalid WhatsApp phone number."
    );
  }

  // Prevent two users from requesting codes
  // at exactly the same time.
  if (pairingPromise) {
    throw new Error(
      "Another pairing request is already in progress. Please wait."
    );
  }

  pairingPromise = (async () => {
    try {
      console.log(
        `📱 Preparing pairing for ${phoneNumber}...`
      );

      pairingNumber = phoneNumber;

      // ──────────────────────────────
      // 🚀 START SOCKET
      // ──────────────────────────────

      let socket = sock;

      if (!socket) {
        socket = await startWhatsApp();
      }

      if (!socket) {
        throw new Error(
          "WhatsApp socket could not be created."
        );
      }

      // ──────────────────────────────
      // 🔐 CHECK SESSION
      // ──────────────────────────────

      if (
        socket.authState?.creds?.registered
      ) {
        throw new Error(
          "WhatsApp is already paired with this session."
        );
      }

      // ──────────────────────────────
      // ⏳ WAIT FOR SOCKET
      // ──────────────────────────────

      console.log(
        "⏳ Waiting for WhatsApp socket..."
      );

      const timeout = 60000;

      const startTime = Date.now();

      while (true) {
        // Socket may have been replaced
        if (sock && sock !== socket) {
          socket = sock;
        }

        // Check if registered
        if (
          socket?.authState?.creds
            ?.registered
        ) {
          throw new Error(
            "WhatsApp session became registered. Please try again."
          );
        }

        // We only need the socket to exist and
        // be in a usable connecting/open state.
        if (
          socket &&
          (
            connectionStatus ===
              "connecting" ||
            connectionStatus === "open"
          )
        ) {
          break;
        }

        // Socket died
        if (
          connectionStatus === "closed" ||
          !socket
        ) {
          console.log(
            "⚠️ WhatsApp socket closed. Starting a fresh socket..."
          );

          socket = await startWhatsApp();

          if (!socket) {
            throw new Error(
              "WhatsApp socket is unavailable."
            );
          }
        }

        // Timeout protection
        if (
          Date.now() - startTime >=
          timeout
        ) {
          throw new Error(
            "WhatsApp connection timed out. Please try /pair again."
          );
        }

        await sleep(500);
      }

      // ──────────────────────────────
      // 🔑 REQUEST CODE
      // ──────────────────────────────

      console.log(
        `🔐 Requesting pairing code for ${phoneNumber}...`
      );

      let code;

      try {
        code =
          await socket.requestPairingCode(
            phoneNumber
          );
      } catch (error) {
        console.error(
          "❌ Baileys pairing request failed:",
          error.message
        );

        // If the socket died during the request,
        // report a clean error instead of leaving
        // the Telegram request hanging.
        if (
          connectionStatus === "closed" ||
          !sock
        ) {
          throw new Error(
            "WhatsApp socket closed while generating the pairing code."
          );
        }

        throw error;
      }

      if (!code) {
        throw new Error(
          "WhatsApp did not return a pairing code."
        );
      }

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

      console.log(
        `🔑 Code: ${code}`
      );

      return code;

    } catch (error) {
      console.error(
        "❌ Pairing code error:",
        error.message
      );

      throw error;
    } finally {
      pairingNumber = null;
    }
  })();

  try {
    return await pairingPromise;
  } finally {
    pairingPromise = null;
  }
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
// 🚪 CLEAR SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function clearSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  sock = null;
  pairingNumber = null;
  connectionStatus = "closed";
  starting = false;
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
  clearSocket,
};
