// ╔══════════════════════════════════════╗
// ║            👑 QUEEN MD              ║
// ║         WHATSAPP HANDLER            ║
// ╚══════════════════════════════════════╝

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const commands = {
  menu: require("../commands/menu"),
  ping: require("../commands/ping"),
  alive: require("../commands/alive"),
  owner: require("../commands/owner"),
  runtime: require("../commands/runtime"),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 HANDLER STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let messageCount = 0;
let commandCount = 0;
let errorCount = 0;

// Rate limiting - prevent spam
const rateLimits = new Map();
const RATE_LIMIT_TIME = 2000; // 2 seconds between commands per user

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Check if user is rate limited
 */
function isRateLimited(jid) {
  const lastCommand = rateLimits.get(jid);

  if (!lastCommand) {
    rateLimits.set(jid, Date.now());
    return false;
  }

  const timeDiff = Date.now() - lastCommand;

  if (timeDiff < RATE_LIMIT_TIME) {
    return true;
  }

  rateLimits.set(jid, Date.now());
  return false;
}

/**
 * Check if user is owner
 */
function isOwner(jid) {
  const ownerNumber = config.ownerNumber;

  if (!ownerNumber) return false;

  // Extract phone number from JID
  const userNumber = jid.split("@")[0];

  return userNumber === ownerNumber;
}

/**
 * Extract message text from different message types
 */
function extractMessageText(msgContent) {
  return (
    msgContent.conversation ||
    msgContent.extendedTextMessage?.text ||
    msgContent.imageMessage?.caption ||
    msgContent.videoMessage?.caption ||
    msgContent.documentMessage?.caption ||
    msgContent.audioMessage?.caption ||
    ""
  );
}

/**
 * Format sender info
 */
function getSenderInfo(message) {
  const jid = message.key.remoteJid;
  const isGroup = jid.endsWith("@g.us");
  const sender = message.key.participant || jid;
  const senderNumber = sender.split("@")[0];

  return {
    jid,
    sender,
    senderNumber,
    isGroup,
    groupName: isGroup ? jid.split("@")[0] : null,
  };
}

/**
 * Log message activity
 */
function logMessage(senderInfo, commandName, text) {
  const { senderNumber, isGroup, groupName } = senderInfo;
  const location = isGroup ? `[GROUP: ${groupName}]` : `[PRIVATE]`;

  console.log(
    `💬 ${location} ${senderNumber} → ${commandName || "message"}: "${text.substring(0, 50)}..."`
  );
}

/**
 * Get handler statistics
 */
function getStats() {
  return {
    messagesProcessed: messageCount,
    commandsExecuted: commandCount,
    errors: errorCount,
    rateLimitedUsers: rateLimits.size,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 MESSAGE HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleMessage(sock, chatUpdate) {
  try {
    const message = chatUpdate.messages?.[0];

    if (!message) return;
    if (!message.message) return;

    messageCount++;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🚫 IGNORE BOT'S OWN MESSAGES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (message.key.fromMe) return;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 GET SENDER INFO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const senderInfo = getSenderInfo(message);
    const { jid, senderNumber, isGroup } = senderInfo;

    if (!jid) return;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 EXTRACT MESSAGE TEXT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const msgContent = message.message;
    const text = extractMessageText(msgContent).trim();

    if (!text) return;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔰 PREFIX CHECK
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const prefix = config.prefix || ".";

    if (!text.startsWith(prefix)) {
      // Handle non-command messages if needed
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⏱️ RATE LIMITING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (isRateLimited(senderNumber)) {
      await sock.sendMessage(jid, {
        text: "⏱️ Please wait a moment before using another command.",
      });
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔧 PARSE COMMAND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const commandText = text.slice(prefix.length).trim();

    if (!commandText) return;

    const parts = commandText.split(/\s+/);
    const commandName = parts.shift().toLowerCase();
    const args = parts;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔎 FIND COMMAND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const command = commands[commandName];

    logMessage(senderInfo, commandName, text);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ UNKNOWN COMMAND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!command) {
      await sock.sendMessage(jid, {
        text:
          `❌ Command not found: ${prefix}${commandName}\n\n` +
          `👑 Use ${prefix}menu for available commands`,
      });

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📦 BUILD COMMAND CONTEXT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const ctx = {
      sock,
      message,
      jid,
      body: text,
      text,
      command: commandName,
      args,
      prefix,
      config,
      senderInfo,
      isOwner: isOwner(jid),
      isGroup,
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔐 PERMISSION CHECK
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (config.mode === "private" && !ctx.isOwner) {
      await sock.sendMessage(jid, {
        text: "🔐 This bot is in private mode. Only the owner can use commands.",
      });

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🚀 EXECUTE COMMAND
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (typeof command === "function") {
      await command(ctx);
      commandCount++;
      return;
    }

    if (typeof command.execute === "function") {
      await command.execute(ctx);
      commandCount++;
      return;
    }

    throw new Error(`Invalid command module: ${commandName}`);
  } catch (error) {
    errorCount++;
    console.error("❌ WhatsApp handler error:", error.message);

    try {
      const jid = chatUpdate.messages?.[0]?.key?.remoteJid;

      if (jid) {
        await sock.sendMessage(jid, {
          text:
            "❌ An error occurred while processing your command.\n\n" +
            "Please try again or contact the owner.",
        });
      }
    } catch (sendError) {
      console.error("Failed to send error message:", sendError.message);
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 ATTACH HANDLER TO SOCKET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function attachHandler(sock) {
  if (!sock) {
    console.error("❌ Socket is null. Cannot attach handler.");
    return;
  }

  sock.ev.on("messages.upsert", (update) => {
    handleMessage(sock, update);
  });

  console.log("✅ Message handler attached to socket");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  handleMessage,
  attachHandler,
  isOwner,
  isRateLimited,
  getStats,
};
