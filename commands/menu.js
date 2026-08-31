// ╔══════════════════════════════════════╗
// ║            👑 QUEEN MD              ║
// ║         COMPLETE MENU SYSTEM         ║
// ╚══════════════════════════════════════╝

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 MENU CATEGORIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const categories = {
  general: {
    emoji: "⚡",
    title: "Gᴇɴᴇʀᴀʟ",
    commands: [
      ".menu",
      ".help",
      ".allmenu",
      ".list",
      ".commands",
      ".ping",
      ".alive",
      ".status",
      ".runtime",
      ".uptime",
      ".botinfo",
      ".info",
      ".about",
      ".owner",
      ".owners",
      ".creator",
      ".speed",
      ".cpu",
      ".ram",
      ".disk",
      ".server",
      ".host",
      ".version",
      ".features",
      ".stats",
      ".health",
      ".support",
      ".rules",
      ".terms",
      ".privacy",
    ],
  },
  owner: {
    emoji: "👑",
    title: "Oᴡɴᴇʀ",
    commands: [
      ".broadcast",
      ".bc",
      ".bcgroup",
      ".bcall",
      ".eval",
      ".exec",
      ".shell",
      ".restart",
      ".shutdown",
      ".reload",
      ".update",
      ".install",
      ".uninstall",
      ".addsudo",
      ".delsudo",
      ".listsudo",
      ".addowner",
      ".delowner",
      ".listowner",
      ".block",
      ".unblock",
      ".blocklist",
      ".join",
      ".leave",
      ".leaveall",
      ".setname",
      ".setbio",
      ".setpp",
      ".delpp",
      ".setstatus",
      ".maintenance",
    ],
  },
  group: {
    emoji: "🛡️",
    title: "Gʀᴏᴜᴘ Aᴅᴍɪɴ",
    commands: [
      ".kick",
      ".add",
      ".promote",
      ".demote",
      ".ban",
      ".unban",
      ".mute",
      ".unmute",
      ".warn",
      ".unwarn",
      ".warnings",
      ".resetwarn",
      ".delete",
      ".del",
      ".purge",
      ".clear",
      ".tagall",
      ".hidetag",
      ".tagadmins",
      ".tag",
      ".mention",
      ".mentionall",
      ".groupinfo",
      ".members",
      ".admins",
      ".listadmins",
      ".getgroup",
      ".getinvite",
      ".link",
      ".revoke",
      ".approve",
      ".reject",
      ".open",
      ".close",
      ".setsubject",
      ".setdescription",
      ".setrules",
      ".setgroupicon",
      ".removeicon",
      ".resetgroup",
      ".groupstats",
      ".memberinfo",
    ],
  },
  security: {
    emoji: "🔒",
    title: "Sᴇᴄᴜʀɪᴛʏ",
    commands: [
      ".antilink",
      ".antispam",
      ".antiflood",
      ".antiraid",
      ".antibot",
      ".antidelete",
      ".antimention",
      ".antitag",
      ".antiinvite",
      ".anticall",
      ".antiswear",
      ".antinsult",
      ".antiscam",
      ".antiphishing",
      ".antinsfw",
      ".antiforward",
      ".antimedia",
      ".antigif",
      ".antisticker",
      ".security",
      ".antidomain",
      ".antichannel",
      ".antiporn",
      ".antidup",
      ".antiunknown",
      ".antivoice",
      ".antireport",
      ".securitylog",
      ".securityinfo",
      ".resetsecurity",
    ],
  },
  lock: {
    emoji: "🔐",
    title: "Lᴏᴄᴋ Sʏsᴛᴇᴍ",
    commands: [
      ".lock",
      ".unlock",
      ".locklink",
      ".unlocklink",
      ".lockmedia",
      ".unlockmedia",
      ".lockphoto",
      ".unlockphoto",
      ".lockvideo",
      ".unlockvideo",
      ".lockaudio",
      ".unlockaudio",
      ".lockdocument",
      ".unlockdocument",
      ".locksticker",
      ".unlocksticker",
      ".lockgif",
      ".unlockgif",
      ".lockcontact",
      ".unlockcontact",
      ".locklocation",
      ".unlocklocation",
      ".lockpoll",
      ".unlockpoll",
      ".lockreaction",
      ".unlockreaction",
      ".lockvoice",
      ".unlockvoice",
      ".lockall",
      ".unlockall",
    ],
  },
  welcome: {
    emoji: "👋",
    title: "Wᴇʟᴄᴏᴍᴇ",
    commands: [
      ".welcome",
      ".welcomeon",
      ".welcomeoff",
      ".setwelcome",
      ".getwelcome",
      ".resetwelcome",
      ".goodbye",
      ".goodbyeon",
      ".goodbyeoff",
      ".setgoodbye",
      ".getgoodbye",
      ".resetgoodbye",
      ".welcomeimage",
      ".goodbyeimage",
      ".welcometext",
      ".goodbyetext",
      ".welcomegif",
      ".goodbyegif",
      ".welcomevideo",
      ".goodbyevideo",
      ".welcometag",
      ".goodbyetag",
      ".welcomebutton",
      ".goodbyebutton",
      ".welcomeaudio",
      ".goodbyeaudio",
      ".welcomeadmin",
      ".goodbyeadmin",
      ".welcomechannel",
      ".resetgreet",
    ],
  },
  ai: {
    emoji: "🤖",
    title: "Aɪ",
    commands: [
      ".ai",
      ".ask",
      ".chat",
      ".chatbot",
      ".gpt",
      ".gemini",
      ".llama",
      ".deepseek",
      ".imagine",
      ".image",
      ".draw",
      ".generate",
      ".translate",
      ".detect",
      ".summarize",
      ".summary",
      ".rewrite",
      ".paraphrase",
      ".grammar",
      ".fixgrammar",
      ".explain",
      ".code",
      ".debug",
      ".review",
      ".optimize",
      ".essay",
      ".story",
      ".poem",
      ".question",
    ],
  },
  music: {
    emoji: "🎵",
    title: "Mᴜsɪᴄ",
    commands: [
      ".play",
      ".song",
      ".music",
      ".audio",
      ".mp3",
      ".ytmp3",
      ".ytaudio",
      ".ytsearch",
      ".searchsong",
      ".lyrics",
      ".lyric",
      ".album",
      ".artist",
      ".songinfo",
      ".musicinfo",
      ".spotify",
      ".spotifydl",
      ".soundcloud",
      ".soundclouddl",
      ".radio",
      ".playlist",
      ".queue",
      ".pause",
      ".resume",
      ".skip",
      ".stop",
      ".volume",
      ".next",
      ".previous",
    ],
  },
  download: {
    emoji: "🎬",
    title: "Dᴏᴡɴʟᴏᴀᴅ",
    commands: [
      ".video",
      ".ytmp4",
      ".ytvideo",
      ".youtube",
      ".youtubedl",
      ".tiktok",
      ".tiktokdl",
      ".tt",
      ".instagram",
      ".ig",
      ".igdl",
      ".facebook",
      ".fb",
      ".fbdl",
      ".twitter",
      ".x",
      ".xdl",
      ".threads",
      ".pinterest",
      ".pindl",
      ".reddit",
      ".redditdl",
      ".snapchat",
      ".snapdl",
      ".mediafire",
      ".gdrive",
      ".terabox",
      ".capcut",
      ".download",
      ".fetch",
    ],
  },
  sticker: {
    emoji: "🖼️",
    title: "Sᴛɪᴄᴋᴇʀ / Iᴍᴀɢᴇ",
    commands: [
      ".sticker",
      ".s",
      ".stick",
      ".toimg",
      ".img",
      ".photo",
      ".webp",
      ".png",
      ".jpg",
      ".jpeg",
      ".crop",
      ".resize",
      ".rotate",
      ".flip",
      ".blur",
      ".sharpen",
      ".invert",
      ".grayscale",
      ".removebg",
      ".qr",
      ".qrcode",
      ".readqr",
      ".caption",
      ".meme",
      ".take",
      ".circle",
      ".round",
      ".frame",
      ".watermark",
    ],
  },
  games: {
    emoji: "🎮",
    title: "Gᴀᴍᴇs",
    commands: [
      ".game",
      ".games",
      ".tictactoe",
      ".ttt",
      ".rps",
      ".rock",
      ".paper",
      ".scissors",
      ".hangman",
      ".guess",
      ".number",
      ".trivia",
      ".quiz",
      ".mathgame",
      ".wordgame",
      ".scramble",
      ".anagram",
      ".memory",
      ".blackjack",
      ".dice",
      ".roll",
      ".coin",
      ".coinflip",
      ".spin",
      ".slot",
      ".lottery",
      ".battle",
      ".duel",
      ".chess",
    ],
  },
  fun: {
    emoji: "😂",
    title: "Fᴜɴ",
    commands: [
      ".joke",
      ".jokes",
      ".meme",
      ".memegenerator",
      ".quote",
      ".quotes",
      ".truth",
      ".dare",
      ".truthordare",
      ".8ball",
      ".love",
      ".ship",
      ".compatibility",
      ".rizz",
      ".roast",
      ".compliment",
      ".insult",
      ".pickup",
      ".flirt",
      ".wyr",
      ".wouldyourather",
      ".emojimix",
      ".emojify",
      ".reverse",
      ".mock",
      ".fancy",
      ".howcute",
      ".howfunny",
      ".random",
    ],
  },
  economy: {
    emoji: "💰",
    title: "Eᴄᴏɴᴏᴍʏ",
    commands: [
      ".balance",
      ".bal",
      ".wallet",
      ".money",
      ".daily",
      ".weekly",
      ".monthly",
      ".work",
      ".job",
      ".crime",
      ".rob",
      ".gamble",
      ".bet",
      ".deposit",
      ".withdraw",
      ".pay",
      ".send",
      ".transfer",
      ".give",
      ".receive",
      ".claim",
      ".reward",
      ".bonus",
      ".cash",
      ".bank",
      ".transactions",
      ".history",
      ".rich",
      ".leaderboard",
    ],
  },
  level: {
    emoji: "🏆",
    title: "Lᴇᴠᴇʟ / XP",
    commands: [
      ".level",
      ".xp",
      ".rank",
      ".ranking",
      ".leaderboard",
      ".top",
      ".topusers",
      ".topchat",
      ".topxp",
      ".topmoney",
      ".profile",
      ".card",
      ".badges",
      ".badge",
      ".achievements",
      ".achievement",
      ".reputation",
      ".rep",
      ".givexp",
      ".addxp",
      ".removexp",
      ".resetxp",
      ".levelup",
      ".mylevel",
      ".rankcard",
      ".rankings",
      ".toprank",
      ".toprep",
      ".topactive",
    ],
  },
  user: {
    emoji: "👤",
    title: "U s e r",
    commands: [
      ".register",
      ".unregister",
      ".verify",
      ".unverify",
      ".profile",
      ".me",
      ".myinfo",
      ".myid",
      ".id",
      ".whois",
      ".avatar",
      ".pp",
      ".getpp",
      ".setbio",
      ".getbio",
      ".setage",
      ".getage",
      ".setgender",
      ".getgender",
      ".setlocation",
      ".getlocation",
      ".afk",
      ".unafk",
      ".afklist",
      ".mystats",
      ".activity",
      ".mygroups",
      ".groups",
      ".groupcount",
    ],
  },
  search: {
    emoji: "🔎",
    title: "Sᴇᴀʀᴄʜ",
    commands: [
      ".google",
      ".search",
      ".youtube",
      ".ytsearch",
      ".wikipedia",
      ".wiki",
      ".image",
      ".images",
      ".news",
      ".weather",
      ".forecast",
      ".time",
      ".timezone",
      ".date",
      ".calendar",
      ".translate",
      ".dictionary",
      ".define",
      ".meaning",
      ".synonym",
      ".antonym",
      ".github",
      ".stackoverflow",
      ".reddit",
      ".imdb",
      ".movies",
      ".anime",
      ".manga",
      ".lyrics",
      ".map",
    ],
  },
  tools: {
    emoji: "🛠️",
    title: "Tᴏᴏʟs",
    commands: [
      ".calculator",
      ".calc",
      ".unit",
      ".convert",
      ".currency",
      ".exchange",
      ".qr",
      ".qrcode",
      ".barcode",
      ".shorturl",
      ".urlshort",
      ".urlinfo",
      ".whois",
      ".ip",
      ".iplookup",
      ".dns",
      ".pingip",
      ".port",
      ".base64",
      ".encode",
      ".decode",
      ".md5",
      ".sha256",
      ".uuid",
      ".password",
      ".random",
      ".binary",
      ".hex",
      ".json",
      ".timestamp",
    ],
  },
  whatsapp: {
    emoji: "📱",
    title: "WʜᴀᴛsAᴘᴘ",
    commands: [
      ".vcf",
      ".contact",
      ".save",
      ".forward",
      ".copy",
      ".quote",
      ".quoted",
      ".reply",
      ".react",
      ".reaction",
      ".read",
      ".unread",
      ".viewonce",
      ".toviewonce",
      ".poll",
      ".createpoll",
      ".pollresult",
      ".status",
      ".statusdl",
      ".statussave",
      ".statusview",
      ".story",
      ".channel",
      ".channelinfo",
      ".channelpost",
      ".channelsearch",
      ".contactinfo",
      ".business",
      ".jid",
      ".jidinfo",
    ],
  },
  anime: {
    emoji: "🎭",
    title: "Aɴɪᴍᴇ",
    commands: [
      ".anime",
      ".animeinfo",
      ".animequote",
      ".animegirl",
      ".animeboy",
      ".neko",
      ".waifu",
      ".maid",
      ".husbando",
      ".kiss",
      ".hug",
      ".pat",
      ".slap",
      ".poke",
      ".bite",
      ".cuddle",
      ".wink",
      ".smile",
      ".wave",
      ".blush",
      ".cry",
      ".angry",
      ".dance",
      ".sad",
      ".happy",
      ".baka",
      ".senpai",
      ".kitsune",
      ".foxgirl",
      ".cosplay",
    ],
  },
  settings: {
    emoji: "⚙️",
    title: "Sᴇᴛᴛɪɴɢs",
    commands: [
      ".settings",
      ".config",
      ".setprefix",
      ".getprefix",
      ".setlanguage",
      ".language",
      ".settimezone",
      ".timezone",
      ".setmode",
      ".public",
      ".private",
      ".self",
      ".groupmode",
      ".autoread",
      ".autotyping",
      ".autorecording",
      ".autoreact",
      ".autoview",
      ".autoreply",
      ".autostatus",
      ".autodownload",
      ".autosticker",
      ".autoemoji",
      ".autowelcome",
      ".autogoodbye",
      ".autobot",
      ".autoforward",
      ".autotranslate",
      ".resetsettings",
    ],
  },
  premium: {
    emoji: "💎",
    title: "Pʀᴇᴍɪᴜᴍ",
    commands: [
      ".premium",
      ".premiuminfo",
      ".plans",
      ".plan",
      ".buy",
      ".subscribe",
      ".subscription",
      ".activate",
      ".deactivate",
      ".addpremium",
      ".delpremium",
      ".listpremium",
      ".premiumusers",
      ".premiumcheck",
      ".premiumfeatures",
      ".premiumprice",
      ".premiumdays",
      ".adddays",
      ".removedays",
      ".giftpremium",
      ".premiumgift",
      ".premiumcode",
      ".redeem",
      ".coupon",
      ".coupons",
      ".createcoupon",
      ".delcoupon",
      ".listcoupon",
      ".premiumstats",
    ],
  },
  stats: {
    emoji: "📊",
    title: "Sᴛᴀᴛs / Lᴏɢs",
    commands: [
      ".stats",
      ".botstats",
      ".groupstats",
      ".userstats",
      ".commandstats",
      ".cmdstats",
      ".usage",
      ".logs",
      ".log",
      ".errorlogs",
      ".activitylogs",
      ".userlogs",
      ".grouplogs",
      ".broadcaststats",
      ".database",
      ".dbstats",
      ".dbstatus",
      ".connections",
      ".sessions",
      ".session",
      ".devices",
      ".process",
      ".memory",
      ".storage",
      ".uptimestats",
      ".serverstats",
      ".traffic",
      ".requests",
    ],
  },
  automation: {
    emoji: "🔄",
    title: "Aᴜᴛᴏᴍᴀᴛɪᴏɴ",
    commands: [
      ".autoreply",
      ".autoresponder",
      ".addreply",
      ".delreply",
      ".listreply",
      ".setreply",
      ".autoreact",
      ".addreact",
      ".delreact",
      ".listreact",
      ".autogreet",
      ".autowarn",
      ".autoban",
      ".automute",
      ".autokick",
      ".autodelete",
      ".autopin",
      ".autounpin",
      ".autotag",
      ".autotranslate",
      ".autosave",
      ".autodownload",
      ".autostatus",
      ".autoforward",
      ".autofilter",
      ".autorespond",
      ".autolike",
      ".autoview",
      ".autoread",
      ".autojoin",
    ],
  },
  media: {
    emoji: "🎨",
    title: "Mᴇᴅɪᴀ",
    commands: [
      ".stickerize",
      ".toaudio",
      ".tovideo",
      ".tomp3",
      ".toogg",
      ".tomp4",
      ".gif",
      ".togif",
      ".gifmp4",
      ".videogif",
      ".compress",
      ".compressvideo",
      ".compressimage",
      ".compressaudio",
      ".mutevideo",
      ".trim",
      ".cut",
      ".merge",
      ".speedvideo",
      ".slowvideo",
      ".reversevideo",
      ".volumeup",
      ".volumedown",
      ".screenshot",
      ".thumbnail",
      ".extractaudio",
      ".extractimage",
      ".videotosticker",
      ".imagetosticker",
      ".audiosticker",
      ".textsticker",
    ],
  },
  extra: {
    emoji: "🌐",
    title: "E x t r a",
    commands: [
      ".report",
      ".reportuser",
      ".reportgroup",
      ".feedback",
      ".suggest",
      ".request",
      ".support",
      ".contact",
      ".faq",
      ".donate",
      ".sponsor",
      ".developer",
      ".source",
      ".repository",
      ".credits",
      ".thanks",
      ".invitebot",
      ".sharebot",
      ".addbot",
      ".botlink",
      ".pair",
      ".unpair",
      ".login",
      ".logout",
      ".sessioninfo",
      ".deviceinfo",
      ".checknumber",
      ".numberinfo",
      ".online",
      ".offline",
    ],
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 MAIN MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getMainMenu(prefix = ".") {
  return `╭━━━〔 👑 Qᴜᴇᴇɴ Mᴅ 〕━━━╮
┃
┃ 👋 Hᴇʟʟᴏ, ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ Qᴜᴇᴇɴ Mᴅ
┃
┃ ⚡ Fᴀsᴛ • Sᴍᴀʀᴛ • Pᴏᴡᴇʀғᴜʟ
┃
┃ ─────────────────────
┃
┃ 👑 ${prefix}owner
┃ ⚡ ${prefix}ping
┃ 🤖 ${prefix}ai
┃ 🎵 ${prefix}play
┃ 🎬 ${prefix}video
┃ 🖼️ ${prefix}sticker
┃ 🛡️ ${prefix}group
┃ 🔒 ${prefix}security
┃ 🎮 ${prefix}games
┃ 💰 ${prefix}economy
┃ 💎 ${prefix}premium
┃
┃ ─────────────────────
┃
┃ 📚 Cᴏᴍᴍᴀɴᴅ Mᴇɴᴜ
┃
┃ 01 ➜ ${prefix}general
┃ 02 ➜ ${prefix}owner
┃ 03 ➜ ${prefix}group
┃ 04 ➜ ${prefix}security
┃ 05 ➜ ${prefix}lock
┃ 06 ➜ ${prefix}welcome
┃ 07 ➜ ${prefix}ai
┃ 08 ➜ ${prefix}music
┃ 09 ➜ ${prefix}download
┃ 10 ➜ ${prefix}sticker
┃ 11 ➜ ${prefix}games
┃ 12 ➜ ${prefix}fun
┃ 13 ➜ ${prefix}economy
┃ 14 ➜ ${prefix}level
┃ 15 ➜ ${prefix}user
┃ 16 ➜ ${prefix}search
┃ 17 ➜ ${prefix}tools
┃ 18 ➜ ${prefix}whatsapp
┃ 19 ➜ ${prefix}anime
┃ 20 ➜ ${prefix}settings
┃ 21 ➜ ${prefix}premium
┃ 22 ➜ ${prefix}stats
┃ 23 ➜ ${prefix}automation
┃ 24 ➜ ${prefix}media
┃ 25 ➜ ${prefix}extra
┃
┃ ─────────────────────
┃
┃ 👑 Qᴜᴇᴇɴ Mᴅ
┃ ⚡ 500+ Cᴏᴍᴍᴀɴᴅs
┃ ❤️ Mᴀᴅᴇ Wɪᴛʜ Lᴏᴠᴇ
┃
╰━━━━━━━━━━━━━━━━━━━━╯`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 CATEGORY MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getCategoryMenu(category, prefix = ".") {
  const cat = categories[category];

  if (!cat) {
    return `❌ Category not found: ${category}`;
  }

  const categoryNumber = Object.keys(categories).indexOf(category) + 1;
  const paddedNumber = String(categoryNumber).padStart(2, "0");

  let menu = `╭━━━〔 👑 Qᴜᴇᴇɴ Mᴅ 〕━━━╮
┃
┃ ${paddedNumber} ━━〔 ${cat.emoji} ${cat.title} 〕
┃ ─────────────────────
┃`;

  cat.commands.forEach((cmd) => {
    menu += `\n┃ ${cmd}`;
  });

  menu += `\n┃
╰━━━〔 👑 Qᴜᴇᴇɴ Mᴅ • 500+ CMD 〕━━━╯`;

  return menu;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 ALL MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getAllMenu(prefix = ".") {
  let menu = `╭━━━〔 👑 Qᴜᴇᴇɴ Mᴅ 〕━━━╮
┃`;

  let categoryNumber = 1;

  for (const [key, cat] of Object.entries(categories)) {
    const paddedNumber = String(categoryNumber).padStart(2, "0");
    menu += `\n┃ ${paddedNumber} ━━〔 ${cat.emoji} ${cat.title} 〕`;
    menu += `\n┃ ─────────────────────`;

    cat.commands.forEach((cmd) => {
      menu += `\n┃ ${cmd}`;
    });

    menu += `\n┃`;
    categoryNumber++;
  }

  menu += `\n╰━━━〔 👑 Qᴜᴇᴇɴ Mᴅ • 500+ CMD 〕━━━╯`;

  return menu;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔢 GET TOTAL COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getTotalCommands() {
  let total = 0;
  for (const cat of Object.values(categories)) {
    total += cat.commands.length;
  }
  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 COMMAND EXECUTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(ctx) {
  const { sock, jid, args, prefix, config } = ctx;

  try {
    // Get category from arguments
    const categoryName = args[0]?.toLowerCase();

    // Show all menu
    if (!categoryName || categoryName === "all" || categoryName === "allmenu") {
      const menu = getAllMenu(prefix);
      await sock.sendMessage(jid, { text: menu });
      return;
    }

    // Show specific category menu
    if (categories[categoryName]) {
      const menu = getCategoryMenu(categoryName, prefix);
      await sock.sendMessage(jid, { text: menu });
      return;
    }

    // Show main menu
    const mainMenu = getMainMenu(prefix);
    await sock.sendMessage(jid, { text: mainMenu });
  } catch (error) {
    console.error("❌ Menu error:", error.message);
    await sock.sendMessage(jid, {
      text: "❌ An error occurred while loading the menu.",
    });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  execute,
  categories,
  getMainMenu,
  getCategoryMenu,
  getAllMenu,
  getTotalCommands,
};
