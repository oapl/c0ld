import { Client, EmbedBuilder, GatewayIntentBits } from "discord.js";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLAN_API_BASE = process.env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev";
const CLAN_NAME = process.env.CLAN_NAME || "c0ld";
const PREFIX = process.env.SEARCH_PREFIX || "!";

if (!DISCORD_BOT_TOKEN) {
  throw new Error("Missing DISCORD_BOT_TOKEN.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const content = message.content.trim();
  if (!content.toLowerCase().startsWith(`${PREFIX}search `)) return;

  const query = content.slice(`${PREFIX}search `.length).trim();
  if (!query) {
    await message.reply(`Use \`${PREFIX}search username\`.`);
    return;
  }

  try {
    const url = new URL("/api/global/search", CLAN_API_BASE);
    url.searchParams.set("clan", CLAN_NAME);
    url.searchParams.set("q", query);

    const res = await fetch(url);
    const payload = await res.json().catch(() => ({}));

    if (!res.ok || payload.ok === false || !payload.row) {
      await message.reply(payload.message || `No ${CLAN_NAME} global-rank result found for ${query}.`);
      return;
    }

    const row = payload.row;
    const percentileLine = betterThanLine(row);
    const embed = new EmbedBuilder()
      .setTitle("Global Search Results")
      .setColor(0x58a6ff)
      .setDescription([
        `🙂 Name: **${displayName(row)}**`,
        `🏰 Clan: **${String(row.clan_name || CLAN_NAME).toUpperCase()}**`,
        `🛡️ Rank in ${String(row.clan_name || CLAN_NAME).toUpperCase()}: **${rank(row.clan_rank)}**`,
        "",
        `🎉 Event: **${row.event_name || row.battle_display_name || row.battle_key || "Current Event"}**`,
        `⭐ Stars: **${shortNumber(row.global_points ?? row.clan_points)}**`,
        `🏆 Global Rank: **${rank(row.global_rank)}${row.total_global_players ? ` of ${shortNumber(row.total_global_players)}` : ""}**`,
        percentileLine,
        "",
        `Last Update: ${discordTime(row.fetched_at)}`,
        "Refreshed every hour"
      ].filter(line => line !== null).join("\n"));

    if (row.avatar_url) {
      embed.setThumbnail(row.avatar_url);
    }

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    await message.reply(`Global search failed: ${error.message || String(error)}`);
  }
});

client.once("ready", () => {
  console.log(`Global search bot logged in as ${client.user.tag}.`);
});

client.login(DISCORD_BOT_TOKEN);

function displayName(row) {
  return row.display_name || row.username || `user_${row.user_id}`;
}

function rank(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `#${n.toLocaleString("en-US")}` : "Unranked";
}

function shortNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";

  const tiers = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"]
  ];

  for (const [size, suffix] of tiers) {
    if (Math.abs(n) >= size) {
      return `${(n / size).toFixed(2).replace(/\.?0+$/, "")}${suffix}`;
    }
  }

  return n.toLocaleString("en-US");
}

function betterThanLine(row) {
  const rankValue = Number(row.global_rank);
  const total = Number(row.total_global_players);

  if (!Number.isFinite(rankValue) || rankValue <= 0 || !Number.isFinite(total) || total <= 0) {
    return null;
  }

  const betterThan = Math.max(0, total - rankValue) / total * 100;
  const better = Math.max(0, rankValue - 1) / total * 100;
  return `💎 Better than **${betterThan.toFixed(2)}%** of players; **${better.toFixed(2)}%** are better`;
}

function discordTime(value) {
  const ms = new Date(value || 0).getTime();
  if (!Number.isFinite(ms)) return "Unknown";
  return `<t:${Math.floor(ms / 1000)}:R>`;
}
