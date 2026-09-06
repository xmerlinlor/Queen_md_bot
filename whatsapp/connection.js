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

// Prevent duplicate pairing requests
let pairingRequested = false;

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
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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

    while (!sock && starting && tries < 40) {
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

          /*
           * IMPORTANT:
           * Pairing code is requested only after
           * WhatsApp reports that the socket is
           * actually connecting.
           */
          if (
            pairingNumber &&
            !pairingRequested &&
            sock &&
            !sock.authState?.creds?.registered
          ) {
            pairingRequested = true;

            try {
              console.log(
                `🔐 Requesting pairing code for ${pairingNumber}...`
              );

              const code =
                await sock.requestPairingCode(
                  pairingNumber
                );

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
                `📱 Number: ${pairingNumber}`
              );

              console.log(
                `🔑 Code: ${code}`
              );

              /*
               * Resolve the waiting /pair request.
               */
              if (
                sock._queenPairingResolve
              ) {
                sock._queenPairingResolve(code);

                sock._queenPairingResolve =
                  null;

                sock._queenPairingReject =
                  null;
              }
            } catch (error) {
              console.error(
                "❌ Pairing request failed:",
                error.message
              );

              pairingRequested = false;

              if (
                sock._queenPairingReject
              ) {
                sock._queenPairingReject(
                  error
                );

                sock._queenPairingResolve =
                  null;

                sock._queenPairingReject =
                  null;
              }
            }
          }
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

          pairingRequested = false;
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

          if (
            lastDisconnect?.error
          ) {
            console.error(
              "❌ Disconnect reason:",
              lastDisconnect.error
            );
          }

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
            pairingRequested = false;

            return;
          }

          /*
           * The old socket is dead.
           * Clear it before reconnecting.
           */
          sock = null;
          pairingRequested = false;

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

  pairingPromise = new Promise(
    async (resolve, reject) => {
      try {
        console.log(
          `📱 Preparing pairing for ${phoneNumber}...`
        );

        /*
         * Store the number BEFORE starting the socket.
         * The connection.update "connecting" event
         * will then request the pairing code.
         */
        pairingNumber = phoneNumber;
        pairingRequested = false;

        const socket =
          await startWhatsApp();

        if (!socket) {
          throw new Error(
            "WhatsApp socket could not be created."
          );
        }

        /*
         * Already connected / registered account.
         */
        if (
          socket.authState?.creds?.registered
        ) {
          pairingNumber = null;

          throw new Error(
            "WhatsApp is already paired with this session."
          );
        }

        /*
         * If the socket is already in connecting
         * state, the connection.update event may
         * have already happened before this Promise
         * was attached.
         *
         * Give it a short opportunity to fire.
         */
        let waited = 0;

        while (
          socket &&
          connectionStatus !== "connecting" &&
          connectionStatus !== "open" &&
          waited < 10000
        ) {
          await sleep(250);
          waited += 250;
        }

        /*
         * If it never reaches a usable state,
         * don't call requestPairingCode blindly.
         */
        if (
          connectionStatus === "closed" ||
          !sock
        ) {
          throw new Error(
            "WhatsApp connection closed before pairing could start."
          );
        }

        /*
         * If connection.update has not yet requested
         * the code, keep the Promise alive and let the
         * connecting event resolve it.
         */
        sock._queenPairingResolve =
          (code) => {
            pairingNumber = phoneNumber;
            resolve(code);
          };

        sock._queenPairingReject =
          (error) => {
            reject(error);
          };

        /*
         * In case the socket is already connecting and
         * the event was missed, request the code here.
         *
         * This is protected by pairingRequested so
         * duplicate requests cannot happen.
         */
        if (
          connectionStatus === "connecting" &&
          !pairingRequested &&
          !sock.authState?.creds?.registered
        ) {
          pairingRequested = true;

          try {
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

            console.log(
              `🔑 Code: ${code}`
            );

            resolve(code);
          } catch (error) {
            pairingRequested = false;
            reject(error);
          }
        }
      } catch (error) {
        console.error(
          "❌ Pairing code error:",
          error.message
        );

        reject(error);
      }
    }
  );

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
