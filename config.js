// ╔══════════════════════════════════════╗
// ║          👑 QUEEN MD                ║
// ║            CONFIG                   ║
// ╚══════════════════════════════════════╝

require("dotenv").config();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 VALIDATION UTILITY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function validateConfig() {
  const errors = [];

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    errors.push("⚠️  TELEGRAM_BOT_TOKEN is not set");
  }

  if (!process.env.OWNER_NUMBER) {
    errors.push("⚠️  OWNER_NUMBER is not set");
  }

  if (errors.length > 0) {
    console.warn("⚠️  Configuration Warnings:");
    errors.forEach((error) => console.warn("   ", error));
  }

  return errors.length === 0;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ CONFIGURATION OBJECT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = {
  // 🤖 Bot Information
  botName: process.env.BOT_NAME || "Queen MD",
  botVersion: "1.0.0",
  prefix: process.env.PREFIX || ".",
  description: "Queen MD Mini WhatsApp Bot with Telegram pairing",

  // 👑 Owner Configuration
  ownerNumber: process.env.OWNER_NUMBER || "",
  ownerName: process.env.OWNER_NAME || "Queen MD Admin",

  // 📲 Telegram Configuration
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramWebhook: process.env.TELEGRAM_WEBHOOK || "",

  // 📱 WhatsApp Configuration
  sessionName: process.env.SESSION_NAME || "queen-md-session",
  whatsappTimeout: process.env.WHATSAPP_TIMEOUT || 60000, // 60 seconds

  // ⚙️ Bot Settings
  mode: process.env.MODE || "public", // "public" or "private"
  autoReply: process.env.AUTO_REPLY === "true",
  autoReadMessages: process.env.AUTO_READ === "true",
  autoTyping: process.env.AUTO_TYPING === "true",

  // 🗄️ Database Configuration
  mongodbUri: process.env.MONGODB_URI || "",
  databaseName: process.env.DB_NAME || "queen_md",

  // 📊 Logging Configuration
  logLevel: process.env.LOG_LEVEL || "info", // "debug", "info", "warn", "error"
  debugMode: process.env.DEBUG === "true",

  // 🌐 Environment
  nodeEnv: process.env.NODE_ENV || "production",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // ⏱️ Timeouts & Limits
  messageTimeout: process.env.MESSAGE_TIMEOUT || 30000, // 30 seconds
  maxRetries: process.env.MAX_RETRIES || 3,
  reconnectDelay: process.env.RECONNECT_DELAY || 5000, // 5 seconds

  // 🎯 Feature Flags
  enableCommands: process.env.ENABLE_COMMANDS !== "false",
  enableTelegram: process.env.ENABLE_TELEGRAM !== "false",
  enableDatabase: process.env.ENABLE_DATABASE !== "false",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ VALIDATE & LOG CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (require.main === module) {
  console.log("");
  console.log("╔══════════════════════════════════════╗");
  console.log("║     ⚙️  CONFIGURATION STATUS        ║");
  console.log("╚══════════════════════════════════════╝");
  console.log("");

  console.log("🤖 Bot Name:", config.botName);
  console.log("📍 Mode:", config.mode.toUpperCase());
  console.log("🌐 Environment:", config.nodeEnv.toUpperCase());
  console.log("📲 Telegram:", config.telegramToken ? "✅ Configured" : "❌ Not Set");
  console.log("📱 WhatsApp:", config.sessionName ? "✅ Configured" : "❌ Not Set");
  console.log("🗄️  Database:", config.mongodbUri ? "✅ Configured" : "⚠️  Not Set");
  console.log("");

  validateConfig();
  console.log("");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORT CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = config;

// Optional: Export validation function
module.exports.validateConfig = validateConfig;
