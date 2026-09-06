// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👑 QUEEN MD — MAIN MENU + HOW TO USE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 📖 HOW TO USE
function getHowToUseMessage() {
  return `╭━━〔 📖 𝙷𝙾𝚆 𝚃𝙾 𝚄𝚂𝙴 〕━━╮
┃
┃ 👑 𝚀𝚄𝙴𝙴𝙽 𝙼𝙳
┃ Telegram Pairing System
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🔗 𝙿𝙰𝙸𝚁 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 〕━━╮
┃
┃ 1️⃣ Click 🔗 Pair WhatsApp
┃
┃ 2️⃣ Send your WhatsApp number
┃
┃ 🇳🇬 Example:
┃ 2348012345678
┃
┃ 3️⃣ Wait for your pairing code
┃
┃ 4️⃣ Open WhatsApp
┃
┃ ⚙️ Settings
┃ → Linked Devices
┃ → Link a Device
┃ → Link with phone number instead
┃
┃ 5️⃣ Enter the Queen MD code
┃
┃ ✅ Your WhatsApp will connect.
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🎯 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂 〕━━╮
┃
┃ /start
┃ └─ Open main menu
┃
┃ /pair
┃ └─ Pair WhatsApp
┃
┃ /status
┃ └─ Check connection
┃
┃ /ping
┃ └─ Check Telegram speed
┃
┃ /runtime
┃ └─ Check uptime
┃
┃ /stats
┃ └─ View statistics
┃
┃ /help
┃ └─ Open help
┃
┃ /unpair
┃ └─ Cancel pairing request
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

⚡ 𝚀𝚄𝙴𝙴𝙽 𝙼𝙳
🛡️ Secure • Fast • Reliable`;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ MAIN MENU BUTTONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getMainMenuButtons(isUserOwner = false) {
  const keyboard = [
    [
      {
        text: "🔗 𝙿𝙰𝙸𝚁 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿",
        callback_data: "start_pair",
      },
    ],
    [
      {
        text: "🟢 𝚂𝚃𝙰𝚃𝚄𝚂",
        callback_data: "start_status",
      },
      {
        text: "⚡ 𝙿𝙸𝙽𝙶",
        callback_data: "start_ping",
      },
    ],
    [
      {
        text: "📊 𝚂𝚃𝙰𝚃𝚂",
        callback_data: "start_stats",
      },
      {
        text: "📖 𝙷𝙾𝚆 𝚃𝙾 𝚄𝚂𝙴",
        callback_data: "start_howto",
      },
    ],
    [
      {
        text: "❓ 𝙷𝙴𝙻𝙿",
        callback_data: "start_help",
      },
    ],
  ];

  // 👑 OWNER ONLY
  if (isUserOwner) {
    keyboard.push([
      {
        text: "👑 𝙾𝚆𝙽𝙴𝚁 𝙼𝙴𝙽𝚄",
        callback_data: "owner_menu",
      },
    ]);
  }

  return {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👑 OWNER MENU BUTTONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getOwnerMenuButtons() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "👑 𝙳𝚈𝙽𝙰𝚂𝚃𝚈",
            callback_data: "owner_dynasty",
          },
          {
            text: "🪄 𝙼𝙴𝚁𝙻𝙸𝙽",
            callback_data: "owner_merlin",
          },
        ],
        [
          {
            text: "👑 𝚃𝚈𝙻𝙰",
            callback_data: "owner_tyla",
          },
        ],
        [
          {
            text: "👥 𝚄𝚂𝙴𝚁𝚂",
            callback_data: "owner_users",
          },
          {
            text: "📊 𝚂𝚃𝙰𝚃𝚂",
            callback_data: "owner_stats",
          },
        ],
        [
          {
            text: "🟢 𝚂𝚃𝙰𝚃𝚄𝚂",
            callback_data: "owner_status",
          },
        ],
        [
          {
            text: "🔙 𝙱𝙰𝙲𝙺",
            callback_data: "owner_back",
          },
        ],
      ],
    },
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔙 BACK TO MAIN MENU BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getBackToMainMenuButtons() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🔙 𝙱𝙰𝙲𝙺 𝚃𝙾 𝙼𝙴𝙽𝚄",
            callback_data: "main_menu",
          },
        ],
      ],
    },
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 HOW TO USE BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

telegramBot.action("start_howto", async (ctx) => {
  try {
    await ctx.answerCbQuery();

    await replyPremium(
      ctx,
      getHowToUseMessage(),
      getBackToMainMenuButtons()
    );

  } catch (error) {
    console.error(
      "❌ How-To button error:",
      error.message
    );
  }
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔙 MAIN MENU BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

telegramBot.action("main_menu", async (ctx) => {
  try {
    await ctx.answerCbQuery();

    await sendStartup(ctx);

  } catch (error) {
    console.error(
      "❌ Main menu error:",
      error.message
    );
  }
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👑 OWNER MENU BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

telegramBot.action("owner_menu", async (ctx) => {
  try {
    await ctx.answerCbQuery();

    if (!(await requireOwner(ctx))) return;

    await replyPremium(
      ctx,
      getOwnerPanel(ctx),
      getOwnerMenuButtons()
    );

  } catch (error) {
    console.error(
      "❌ Owner menu error:",
      error.message
    );
  }
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👑 OWNER BACK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

telegramBot.action("owner_back", async (ctx) => {
  try {
    await ctx.answerCbQuery();

    if (!(await requireOwner(ctx))) return;

    await sendStartup(ctx);

  } catch (error) {
    console.error(
      "❌ Owner back error:",
      error.message
    );
  }
});
