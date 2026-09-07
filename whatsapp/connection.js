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

const PAIRING_TIMEOUT = 90000;
const RECONNECT_DELAY = 5000;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let sock = null;

let connectionStatus = "closed";

let starting = false;

let startPromise = null;

let pairingPromise = null;

let pairingNumber = null;

let reconnectTimer = null;

let manuallyStopped = false;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CREATE AUTH DIRECTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ensureAuthDirectory() {
  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, {
        recursive: true,
      });
    }
  } catch (error) {
    console.error(
      "❌ Failed to create WhatsApp auth directory:",
      error.message
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔢 CLEAN NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanNumber(number) {
  if (!number) {
    throw new Error(
      "WhatsApp number is required."
    );
  }

  let phone = String(number)
    .replace(/[^\d]/g, "")
    .trim();

  if (phone.startsWith("0")) {
    phone =
      "234" +
      phone.slice(1);
  }

  if (
    phone.length < 10 ||
    phone.length > 15
  ) {
    throw new Error(
      "Invalid WhatsApp phone number."
    );
  }

  return phone;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏱️ SLEEP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❌ DISCONNECT CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getDisconnectCode(error) {
  return (
    error?.output?.statusCode ||
    error?.data?.statusCode ||
    error?.statusCode ||
    null
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔌 CLOSE SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function closeSocket() {
  try {
    if (sock) {
      try {
        sock.ev.removeAllListeners();
      } catch (_) {}

      try {
        if (
          typeof sock.end ===
          "function"
        ) {
          sock.end(
            new Error(
              "Socket restarting"
            )
          );
        }
      } catch (_) {}
    }
  } catch (_) {}

  sock = null;
  connectionStatus = "closed";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 CREATE WHATSAPP SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function createSocket() {
  ensureAuthDirectory();

  const {
    state,
    saveCreds,
  } = await useMultiFileAuthState(
    AUTH_DIR
  );

  console.log(
    "📱 Creating WhatsApp socket..."
  );

  const newSocket =
    makeWASocket({
      auth: state,

      logger: P({
        level:
          process.env.BAILEYS_LOG_LEVEL ||
          "silent",
      }),

      printQRInTerminal: false,

      generateHighQualityLinkPreview: false,

      markOnlineOnConnect: false,

      syncFullHistory: false,
    });

  sock = newSocket;

  connectionStatus = "connecting";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 SAVE CREDENTIALS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  newSocket.ev.on(
    "creds.update",
    saveCreds
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📡 CONNECTION UPDATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  newSocket.ev.on(
    "connection.update",
    async (update) => {
      const {
        connection,
        lastDisconnect,
      } = update;

      if (connection === "connecting") {
        connectionStatus =
          "connecting";

        console.log(
          "📡 WhatsApp: connecting..."
        );
      }

      if (connection === "open") {
        connectionStatus = "open";

        console.log(
          "╔════════════════════════════════════╗"
        );

        console.log(
          "║     📱 WHATSAPP CONNECTED          ║"
        );

        console.log(
          "║     👑 QUEEN MD ONLINE             ║"
        );

        console.log(
          "╚════════════════════════════════════╝"
        );
      }

      if (connection === "close") {
        connectionStatus = "closed";

        const code =
          getDisconnectCode(
            lastDisconnect?.error
          );

        console.error(
          `❌ WhatsApp connection closed. Code: ${
            code || "unknown"
          }`
        );

        sock = null;

        // Logged out = do not reconnect
        if (
          code ===
          DisconnectReason.loggedOut
        ) {
          console.error(
            "🚪 WhatsApp session was logged out."
          );

          manuallyStopped = true;

          return;
        }

        // Pairing-related restart
        if (
          code ===
          DisconnectReason.restartRequired
        ) {
          console.log(
            "🔄 WhatsApp requested a restart."
          );
        }

        if (manuallyStopped) {
          return;
        }

        if (!reconnectTimer) {
          reconnectTimer =
            setTimeout(
              () => {
                reconnectTimer =
                  null;

                console.log(
                  "🔄 Reconnecting WhatsApp..."
                );

                startWhatsApp().catch(
                  (error) => {
                    console.error(
                      "❌ WhatsApp reconnect failed:",
                      error.message
                    );
                  }
                );
              },
              RECONNECT_DELAY
            );
        }
      }
    }
  );

  return {
    socket: newSocket,
    state,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 START WHATSAPP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startWhatsApp() {
  if (
    sock &&
    connectionStatus !== "closed"
  ) {
    return sock;
  }

  if (startPromise) {
    return startPromise;
  }

  manuallyStopped = false;

  startPromise = (async () => {
    try {
      starting = true;

      console.log(
        "🚀 Starting Queen MD WhatsApp..."
      );

      const result =
        await createSocket();

      const socket =
        result.socket;

      // Give Baileys time to initialise
      await sleep(1000);

      return socket;

    } catch (error) {
      console.error(
        "❌ Failed to start WhatsApp:",
        error.message
      );

      sock = null;
      connectionStatus =
        "closed";

      throw error;

    } finally {
      starting = false;
      startPromise = null;
    }
  })();

  return startPromise;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 WAIT FOR SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function waitForSocket(
  socket,
  timeout = PAIRING_TIMEOUT
) {
  if (!socket) {
    throw new Error(
      "WhatsApp socket could not be created."
    );
  }

  if (
    socket !== sock
  ) {
    throw new Error(
      "WhatsApp socket was replaced."
    );
  }

  if (
    connectionStatus ===
    "open"
  ) {
    return;
  }

  return new Promise(
    (resolve, reject) => {
      let finished = false;

      const timer =
        setTimeout(() => {
          if (finished) {
            return;
          }

          finished = true;

          try {
            socket.ev.off(
              "connection.update",
              listener
            );
          } catch (_) {}

          reject(
            new Error(
              "Timed out while connecting to WhatsApp."
            )
          );
        }, timeout);

      const listener =
        (update) => {
          if (finished) {
            return;
          }

          if (
            update.connection ===
            "connecting"
          ) {
            connectionStatus =
              "connecting";
          }

          if (
            update.connection ===
            "open"
          ) {
            finished = true;

            clearTimeout(timer);

            try {
              socket.ev.off(
                "connection.update",
                listener
              );
            } catch (_) {}

            resolve();
          }

          if (
            update.connection ===
            "close"
          ) {
            finished = true;

            clearTimeout(timer);

            try {
              socket.ev.off(
                "connection.update",
                listener
              );
            } catch (_) {}

            reject(
              new Error(
                "WhatsApp connection closed before pairing code was generated."
              )
            );
          }
        };

      socket.ev.on(
        "connection.update",
        listener
      );
    }
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 REQUEST PAIRING CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function requestPairingCode(
  number
) {
  const phoneNumber =
    cleanNumber(number);

  // Prevent two simultaneous pairing requests
  if (pairingPromise) {
    throw new Error(
      "Another WhatsApp pairing request is already running. Please wait."
    );
  }

  pairingNumber =
    phoneNumber;

  pairingPromise =
    (async () => {
      try {
        console.log(
          `🔐 Preparing WhatsApp pairing for ${phoneNumber}`
        );

        // Start socket if needed
        let socket = sock;

        if (
          !socket ||
          connectionStatus ===
            "closed"
        ) {
          socket =
            await startWhatsApp();
        }

        // Make sure we still have the active socket
        if (
          !socket ||
          socket !== sock
        ) {
          throw new Error(
            "WhatsApp socket is unavailable."
          );
        }

        // Already authenticated
        if (
          socket.authState?.creds
            ?.registered
        ) {
          throw new Error(
            "This WhatsApp session is already registered. Delete the existing session before pairing another number."
          );
        }

        console.log(
          "⏳ Waiting for WhatsApp socket..."
        );

        /*
         * Baileys needs the socket to have started
         * before requestPairingCode() is called.
         *
         * Do NOT call requestPairingCode()
         * from connection.update.
         */

        if (
          connectionStatus !==
            "open" &&
          connectionStatus !==
            "connecting"
        ) {
          throw new Error(
            "WhatsApp socket is unavailable."
          );
        }

        // Wait briefly for the socket to initialise
        await sleep(1500);

        // Socket may have changed while waiting
        if (
          !sock ||
          sock !== socket
        ) {
          throw new Error(
            "WhatsApp socket is unavailable."
          );
        }

        console.log(
          "🔑 Requesting WhatsApp pairing code..."
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

          throw new Error(
            `Baileys could not generate the pairing code: ${error.message}`
          );
        }

        if (!code) {
          throw new Error(
            "WhatsApp did not return a pairing code."
          );
        }

        console.log(
          "✅ WhatsApp pairing code generated."
        );

        return String(code);

      } finally {
        pairingNumber =
          null;
      }
    })();

  try {
    return await pairingPromise;
  } finally {
    pairingPromise =
      null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 SEND MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendMessage(
  jid,
  content,
  options = {}
) {
  if (
    !sock ||
    connectionStatus !==
      "open"
  ) {
    throw new Error(
      "WhatsApp is not connected."
    );
  }

  return sock.sendMessage(
    jid,
    content,
    options
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔌 GET SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSocket() {
  return sock;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔢 GET PAIRING NUMBER
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
    !!sock &&
    connectionStatus ===
      "open"
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛑 STOP WHATSAPP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function stopWhatsApp() {
  manuallyStopped = true;

  if (reconnectTimer) {
    clearTimeout(
      reconnectTimer
    );

    reconnectTimer = null;
  }

  closeSocket();
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
  stopWhatsApp,
};
