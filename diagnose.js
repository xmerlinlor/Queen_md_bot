#!/usr/bin/env node

// ╔══════════════════════════════════════╗
// ║           👑 QUEEN MD               ║
// ║        DIAGNOSTICS SCRIPT            ║
// ╚══════════════════════════════════════╝

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("");
console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║           👑 QUEEN MD DIAGNOSTICS                          ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log("");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. CHECK NODE & NPM VERSIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log("📋 ENVIRONMENT INFORMATION");
console.log("─────────────────────────────────────────────────────────────");

try {
  const nodeVersion = execSync("node -v", { encoding: "utf-8" }).trim();
  const npmVersion = execSync("npm -v", { encoding: "utf-8" }).trim();
  
  console.log(`✅ Node.js Version: ${nodeVersion}`);
  console.log(`✅ NPM Version: ${npmVersion}`);
} catch (error) {
  console.log(`❌ Error getting versions: ${error.message}`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. CHECK REQUIRED FILES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log("");
console.log("📁 REQUIRED FILES CHECK");
console.log("─────────────────────────────────────────────────────────────");

const requiredFiles = [\n  "index.js",\n  "config.js",\n  "package.json",\n  ".env",\n  "whatsapp/connection.js",\n  "whatsapp/handler.js",\n  "telegram/pairing.js",\n  "commands/menu.js",\n  "commands/ping.js",\n  "commands/alive.js",\n  "commands/owner.js",\n  "commands/runtime.js",\n];\n\nlet allFilesPresent = true;\n\nfor (const file of requiredFiles) {\n  const filePath = path.join(process.cwd(), file);\n  const exists = fs.existsSync(filePath);\n  const status = exists ? "✅" : "❌";\n  const message = exists ? "Found" : "MISSING\";\n  console.log(`${status} ${file.padEnd(30)} - ${message}`);\n  \n  if (!exists) {\n    allFilesPresent = false;\n  }\n}\n\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n// 3. CHECK DEPENDENCIES\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nconsole.log("");\nconsole.log("📦 DEPENDENCIES CHECK");\nconsole.log(\"─────────────────────────────────────────────────────────────\");\n\nconst requiredDeps = [\n  \"@whiskeysockets/baileys\",\n  \"dotenv\",\n  \"pino\",\n  \"telegraf\",\n];\n\ntry {\n  const nodeModulesPath = path.join(process.cwd(), \"node_modules\");\n  \n  for (const dep of requiredDeps) {\n    const depPath = path.join(nodeModulesPath, dep);\n    const exists = fs.existsSync(depPath);\n    const status = exists ? \"✅\" : \"❌\";\n    const message = exists ? \"Installed\" : \"NOT INSTALLED\";\n    console.log(`${status} ${dep.padEnd(35)} - ${message}`);\n  }\n} catch (error) {\n  console.log(`❌ Error checking dependencies: ${error.message}`);\n}\n\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n// 4. CHECK ENVIRONMENT VARIABLES\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nconsole.log(\"\");\nconsole.log(\"🔐 ENVIRONMENT VARIABLES\");\nconsole.log(\"─────────────────────────────────────────────────────────────\");\n\nconst requiredEnvVars = [\n  \"WHATSAPP_SESSION_NAME\",\n  \"BOT_NAME\",\n  \"PREFIX\",\n  \"OWNER_NUMBER\",\n  \"BOT_MODE\",\n  \"TELEGRAM_BOT_TOKEN\",\n];\n\nfor (const envVar of requiredEnvVars) {\n  const value = process.env[envVar];\n  const status = value ? \"✅\" : \"⚠️ \";\n  const message = value ? \"Configured\" : \"NOT SET\";\n  console.log(`${status} ${envVar.padEnd(30)} - ${message}`);\n}\n\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n// 5. CHECK DIRECTORIES\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nconsole.log(\"\");\nconsole.log(\"📂 DIRECTORIES CHECK\");\nconsole.log(\"─────────────────────────────────────────────────────────────\");\n\nconst requiredDirs = [\n  \"commands\",\n  \"whatsapp\",\n  \"telegram\",\n];\n\nfor (const dir of requiredDirs) {\n  const dirPath = path.join(process.cwd(), dir);\n  const exists = fs.existsSync(dirPath);\n  const status = exists ? \"✅\" : \"❌\";\n  const message = exists ? \"Exists\" : \"MISSING\";\n  console.log(`${status} /${dir.padEnd(20)} - ${message}`);\n}\n\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n// 6. SUMMARY\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nconsole.log(\"\");\nconsole.log(\"📊 DIAGNOSTIC SUMMARY\");\nconsole.log(\"─────────────────────────────────────────────────────────────\");\n\nif (allFilesPresent) {\n  console.log(\"✅ All required files are present\");\n  console.log(\"✅ Bot should be ready to start\");\n  console.log(\"\");\n  console.log(\"Next steps:\");\n  console.log(\"1. Verify all environment variables are set\");\n  console.log(\"2. Check .env file for correct values\");\n  console.log(\"3. Run 'npm start' to launch the bot\");\n} else {\n  console.log(\"❌ Some required files are missing!\");\n  console.log(\"\");\n  console.log(\"Action required:\");\n  console.log(\"1. Create missing files\");\n  console.log(\"2. Ensure package.json dependencies are installed\");\n  console.log(\"3. Run 'npm install' to install missing packages\");\n}\n\nconsole.log(\"\");\nconsole.log(\"╚════════════════════════════════════════════════════════════╝\");\nconsole.log(\"\");\n