// ╔══════════════════════════════════════╗
// ║          👑 QUEEN MD                ║
// ║       PREMIUM CONFIGURATION         ║
// ╚══════════════════════════════════════╝

require("dotenv").config();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 VALIDATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function validateConfig() {
  const errors = [];

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    errors.push("⚠️ TELEGRAM_BOT_TOKEN is not set");
  }

  if (!process.env.OWNER_NUMBER) {
    errors.push("⚠️ OWNER_NUMBER is not set");
  }

  if (errors.length) {
    console.warn("");
    console.warn("⚠️ Configuration Warnings:");

    errors.forEach((error) => {
      console.warn("   " + error);
    });

    console.warn("");
  }

  return errors.length === 0;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👑 TELEGRAM OWNERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const telegramOwners = [
  {
    id: "8571241198",
    username: "@mrdarkdev",
    name: "Dynasty Lord",
    command: "dynasty",
  },

  {
    id: "8640766294",
    username: "@x_merlin_lord",
    name: "X Merlin Lord Himself",
    command: "merlin",
  },

  {
    id: "7572833642",
    username: "@TILATECHBOT",
    name: "Miss Tyla Tech",
    command: "tyla",
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 OWNER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isTelegramOwner(userId) {
  return telegramOwners.some(
    (owner) => String(owner.id) === String(userId)
  );
}

function getTelegramOwner(userId) {
  return telegramOwners.find(
    (owner) => String(owner.id) === String(userId)
  );
}

function isSpecificOwner(userId, command) {
  const owner = getTelegramOwner(userId);

  if (!owner) return false;

  return owner.command === command;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ MAIN CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = {
  // 🤖 BOT INFORMATION
  botName:
    process.env.BOT_NAME || "Queen MD",

  botVersion: "1.0.0",

  prefix:
    process.env.PREFIX || ".",

  description:
    "Queen MD Mini WhatsApp Bot with Telegram pairing",

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👑 WHATSAPP OWNER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ownerNumber:
    process.env.OWNER_NUMBER || "",

  ownerName:
    process.env.OWNER_NAME || "Queen MD Admin",

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📲 TELEGRAM
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  telegramToken:
    process.env.TELEGRAM_BOT_TOKEN || "",

  telegramWebhook:
    process.env.TELEGRAM_WEBHOOK || "",

  // 👑 TELEGRAM OWNERS
  telegramOwners,

  // Owner authorization
  isTelegramOwner,
  getTelegramOwner,
  isSpecificOwner,

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📱 WHATSAPP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  sessionName:
    process.env.SESSION_NAME ||
    "queen-md-session",

  whatsappTimeout:
    Number(process.env.WHATSAPP_TIMEOUT) ||
    60000,

  shouldSyncHistoryMessage: false,

  generateHighQualityLinkPreview: false,

  markOnlineOnConnect: true,

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚙️ BOT SETTINGS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  mode:
    process.env.MODE || "public",

  autoReply:
    process.env.AUTO_REPLY === "true",

  autoReadMessages:
    process.env.AUTO_READ === "true",

  autoTyping:
    process.env.AUTO_TYPING === "true",

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🗄️ DATABASE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  mongodbUri:
    process.env.MONGODB_URI || "",

  databaseName:
    process.env.DB_NAME || "queen_md",

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 LOGGING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  logLevel:
    process.env.LOG_LEVEL || "info",

  debugMode:
    process.env.DEBUG === "true",

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🌐 ENVIRONMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  nodeEnv:
    process.env.NODE_ENV || "production",

  isDevelopment:
    (process.env.NODE_ENV || "production") ===
    "development",

  isProduction:
    (process.env.NODE_ENV || "production") ===
    "production",

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⏱️ TIMEOUTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  messageTimeout:
    Number(process.env.MESSAGE_TIMEOUT) ||
    30000,

  maxRetries:
    Number(process.env.MAX_RETRIES) || 3,

  reconnectDelay:
    Number(process.env.RECONNECT_DELAY) ||
    5000,

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 FEATURES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  enableCommands:
    process.env.ENABLE_COMMANDS !== "false",

  enableTelegram:
    process.env.ENABLE_TELEGRAM !== "false",

  enableDatabase:
    process.env.ENABLE_DATABASE !== "false",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = config;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧪 CONFIG TEST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (require.main === module) {
  console.log("");

  console.log(
    "╔══════════════════════════════════════╗"
  );

  console.log(
    "║     👑 QUEEN MD CONFIGURATION       ║"
  );

  console.log(
    "╚══════════════════════════════════════╝"
  );

  console.log("");

  console.log(
    "🤖 Bot:",
    config.botName
  );

  console.log(
    "📦 Version:",
    config.botVersion
  );

  console.log(
    "📍 Mode:",
    config.mode.toUpperCase()
  );

  console.log(
    "🌐 Environment:",
    config.nodeEnv.toUpperCase()
  );

  console.log(
    "📲 Telegram:",
    config.telegramToken
      ? "✅ Configured"
      : "❌ Not Set"
  );

  console.log(
    "📱 WhatsApp:",
    config.sessionName
      ? "✅ Configured"
      : "❌ Not Set"
  );

  console.log("");

  console.log(
    "👑 TELEGRAM OWNERS:"
  );

  telegramOwners.forEach(
    (owner, index) => {
      console.log(
        `   ${index + 1}. ${owner.name} | ${owner.username} | ${owner.id} | /${owner.command}`
      );
    }
  );

  console.log("");

  validateConfig();

  console.log(
    "╚══════════════════════════════════════╝"
  );

  console.log("");
}
