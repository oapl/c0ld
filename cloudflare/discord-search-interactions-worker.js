const DISCORD_API_BASE = "https://discord.com/api/v10";
const INTERACTION_TYPE_PING = 1;
const INTERACTION_TYPE_APPLICATION_COMMAND = 2;
const INTERACTION_TYPE_MESSAGE_COMPONENT = 3;
const INTERACTION_RESPONSE_PONG = 1;
const INTERACTION_RESPONSE_CHANNEL_MESSAGE = 4;
const INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE = 5;
const INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE = 6;
const APPLICATION_COMMAND_CHAT_INPUT = 1;
const APPLICATION_COMMAND_OPTION_SUB_COMMAND = 1;
const APPLICATION_COMMAND_OPTION_SUB_COMMAND_GROUP = 2;
const APPLICATION_COMMAND_OPTION_STRING = 3;
const APPLICATION_COMMAND_OPTION_INTEGER = 4;
const APPLICATION_COMMAND_OPTION_BOOLEAN = 5;
const APPLICATION_COMMAND_OPTION_USER = 6;
const APPLICATION_COMMAND_OPTION_CHANNEL = 7;
const APPLICATION_COMMAND_OPTION_ROLE = 8;
const MESSAGE_FLAG_EPHEMERAL = 1 << 6;
const MESSAGE_FLAG_COMPONENTS_V2 = 1 << 15;
const COMPONENT_TYPE_ACTION_ROW = 1;
const COMPONENT_TYPE_BUTTON = 2;
const COMPONENT_TYPE_SECTION = 9;
const COMPONENT_TYPE_TEXT_DISPLAY = 10;
const COMPONENT_TYPE_THUMBNAIL = 11;
const COMPONENT_TYPE_MEDIA_GALLERY = 12;
const COMPONENT_TYPE_SEPARATOR = 14;
const COMPONENT_TYPE_CONTAINER = 17;
const BUTTON_STYLE_PRIMARY = 1;
const BUTTON_STYLE_SECONDARY = 2;
const BUTTON_STYLE_DANGER = 4;
const BUTTON_STYLE_LINK = 5;
const LUNA_REWARD_THUMBNAIL_URL = "https://i.imgur.com/rVVo99A.png";
const LEAGUE_CHART_HOURS = [1, 6, 12, 24];
const HISTORY_VIEWS = ["clan", "league"];
const HISTORY_VIEW_LABELS = {
  clan: "Clan Battle History",
  league: "League History"
};
const DEFAULT_HISTORY_PAGE_SIZE = 10;
const HISTORY_RENDER_CACHE_TTL_SECONDS = 20 * 60;
const HISTORY_RENDER_MEMORY_CACHE_MAX = 80;
const DEFAULT_PLAYER_REWARD_CUTOFF_RANKS = [3, 10, 100, 250, 500, 1000, 10000];
const DEFAULT_CLAN_REWARD_CUTOFF_RANKS = [1, 3, 10, 30, 50, 250, 500];
const DEFAULT_LEAGUE_REWARD_CUTOFF_RANKS = [1, 3, 15, 50, 100, 250, 2000];
const LEGACY_CLAN_REWARD_CUTOFF_RANKS = "3,10,50,100,500";
const LEGACY_PLAYER_REWARD_CUTOFF_RANKS = "3,100,1000,1050,1150,6150,30000";
const CLAN_REWARD_CATEGORIES = [
  { label: "#1", rank: 1 },
  { label: "#2-3", rank: 3 },
  { label: "#4-10", rank: 10 },
  { label: "#11-50", rank: 50 },
  { label: "#51-250", rank: 250 },
  { label: "Top 30", rank: 30 },
  { label: "Top 50", rank: 50 },
  { label: "Top 500", rank: 500 }
];
const CHART_LINE_RANGE = { label: "Ranks 1-4", min: 1, max: 4, cutoffRank: 3, challengerRank: 4 };
const CHART_LOOKBACK_HOURS = 1;
const CHART_PRIOR_PULL_TOLERANCE_MINUTES = 12;
const CHART_LARGE_GAP_BREAK_MINUTES = 25;
const DEFAULT_TRACKER_PLACE_ID = "8737899170";
const HOURLY_CLAN_ALLOWED_CHANNEL_TYPES = new Set([0, 5, 10, 11, 12]);
const HOURLY_CLAN_MIN_POST_INTERVAL_MINUTES = 50;
const DEFAULT_HOURLY_CLAN_POST_MINUTE = 0;
const HOURLY_USER_ASSIGNMENT_PREFIX = "user:";
const HOURLY_LEAGUE_ASSIGNMENT_PREFIX = "league:";
const HTG_BUILD_ID = "luna-auto-mode-history-rewards-2026-08-03a";
const DEFAULT_HTG_SETUP_STEP_IMAGE_URLS = ["https://i.imgur.com/AxIccNZ.png", "https://i.imgur.com/AT959cP.png"];
const SEARCH_CHART_MAX_OBSERVED_GAP_MS = 90 * 60 * 1000;
const SELF_TIMEOUT_DAYS = 7;
const DEFAULT_T_COMMAND_GUILD_ID = "1457088639006670979";
const DEFAULT_T_COMMAND_ROLE_ID = "1489032322056589413";
const RAM_LINK_URL = "https://github.com/ic3w0lf22/Roblox-Account-Manager";
const RDP_LINK_URL = "https://www.youtube.com/watch?v=uaWaIQwzO9U";
const TOP_COMMAND_LIMIT = 100;
const TOP_COMMAND_PAGE_SIZE = 20;
const CLAN_LOOKUP_PAGE_SIZE = 20;
let chartDuckImagePromise = null;
const historyRenderMemoryCache = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/") {
        return json({
          ok: true,
          service: "c0ld-discord-search",
          interactions_endpoint: "/discord/interactions"
        });
      }

      if (request.method === "POST" && url.pathname === "/admin/register-search-command") {
        requireAdmin(request, env);
        return await registerSearchCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-version-command") {
        requireAdmin(request, env);
        return await registerVersionCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-ram-command") {
        requireAdmin(request, env);
        return await registerRamCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-rdp-command") {
        requireAdmin(request, env);
        return await registerRdpCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-top-command") {
        requireAdmin(request, env);
        return await registerTopCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-rewards-command") {
        requireAdmin(request, env);
        return await registerRewardsCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-history-command") {
        requireAdmin(request, env);
        return await registerHistoryCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-clan-command") {
        requireAdmin(request, env);
        return await registerClanCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-cw-command") {
        requireAdmin(request, env);
        return await registerCwCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-league-command") {
        requireAdmin(request, env);
        return await registerLeagueCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-lb-command") {
        requireAdmin(request, env);
        return await registerLbCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-lg-command") {
        requireAdmin(request, env);
        return await registerLgCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-player-command") {
        requireAdmin(request, env);
        return await registerPlayerCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-server-command") {
        requireAdmin(request, env);
        return await registerServerCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-luna-command") {
        requireAdmin(request, env);
        return await registerLunaCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-add-command") {
        requireAdmin(request, env);
        return await registerAddCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-remove-command") {
        requireAdmin(request, env);
        return await registerRemoveCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-hourly-command") {
        requireAdmin(request, env);
        return await registerHourlyCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-htg-command") {
        requireAdmin(request, env);
        return await registerHtgCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-offline-command") {
        requireAdmin(request, env);
        return await registerOfflineCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-kms-command") {
        requireAdmin(request, env);
        return await registerKmsCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-t-command") {
        requireAdmin(request, env);
        return await registerTCommand(url, env);
      }

      if (request.method === "GET" && url.pathname === "/admin/htg/status") {
        requireAdmin(request, env);
        return json(await htgApiStatus(env));
      }

      if (request.method === "POST" && url.pathname === "/admin/hourly/run") {
        requireAdmin(request, env);
        return json(await runHourlyClanAssignments(env, {
          force: ["1", "true", "yes"].includes(String(url.searchParams.get("force") || "").toLowerCase())
        }));
      }

      if (request.method === "POST" && url.pathname === "/admin/clan-tracker/run") {
        requireAdmin(request, env);
        return json(await runClanTrackerAssignments(env, {
          scheduledTime: Date.now(),
          manual: true
        }));
      }

      if (request.method === "GET" && url.pathname === "/admin/clan-tracker/status") {
        requireAdmin(request, env);
        return json(await clanTrackerAssignmentStatus(env));
      }

      if (request.method === "POST" && url.pathname === "/admin/hourly/run-one") {
        requireAdmin(request, env);
        return json(await runOneHourlyClanAssignment(url, env, {
          force: ["1", "true", "yes"].includes(String(url.searchParams.get("force") || "").toLowerCase())
        }));
      }

      if (request.method === "POST" && url.pathname === "/admin/hourly/remove-assignment") {
        requireAdmin(request, env);
        return json(await removeHourlyClanAssignment(url, env));
      }

      if (request.method === "GET" && url.pathname === "/admin/hourly/status") {
        requireAdmin(request, env);
        return json(await hourlyClanAssignmentStatus(env));
      }

      if (request.method === "POST" && url.pathname === "/admin/register-all-commands") {
        requireAdmin(request, env);
        return await registerAllCommands(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/sync-global-commands") {
        requireAdmin(request, env);
        return await syncGlobalCommands(url, env);
      }

      if (request.method === "GET" && url.pathname === "/admin/commands") {
        requireAdmin(request, env);
        return await listCommands(url, env);
      }

      if (request.method === "GET" && url.pathname === "/admin/discord-debug") {
        requireAdmin(request, env);
        return await discordDebug(url, env);
      }

      if (request.method === "GET" && url.pathname === "/admin/search-debug") {
        requireAdmin(request, env);
        return await searchDebug(url, env);
      }

      if (request.method === "GET" && url.pathname === "/admin/lg-debug") {
        requireAdmin(request, env);
        return await lgDebug(url, env);
      }

      if ((request.method === "POST" || request.method === "DELETE") && url.pathname === "/admin/delete-command") {
        requireAdmin(request, env);
        return await deleteCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/internal/ps99/restart-review-message") {
        requireDiscordReviewInternalAuth(request, env);
        return await handleInternalPs99RestartReviewMessage(request, env);
      }

      if (request.method === "POST" && url.pathname === "/discord/interactions") {
        return await handleInteraction(request, env, ctx);
      }

      return json({ ok: false, message: "Not found" }, 404);
    } catch (err) {
      return json({
        ok: false,
        message: err?.message || String(err),
        details: err?.details || undefined
      }, err?.status || 500);
    }
  },

  async scheduled(event, env, ctx) {
    const scheduledTime = event?.scheduledTime || Date.now();
    if (shouldRunHourlyScheduledPosts(env, scheduledTime)) {
      ctx.waitUntil(runHourlyClanAssignments(env, {
        scheduledTime,
        alignToHour: true
      }).catch(err => {
        console.error("Hourly clan delivery failed", err);
      }));
    }

    if (shouldRunClanLogScheduledPosts(env, scheduledTime)) {
      ctx.waitUntil(runClanLogAssignments(env, { scheduledTime }).catch(err => {
        console.error("Clan activity log delivery failed", err);
      }));
    }

    if (shouldRunClanTrackerScheduledPosts(env, scheduledTime)) {
      ctx.waitUntil(runClanTrackerAssignments(env, { scheduledTime }).catch(err => {
        console.error("Persistent clan tracker delivery failed", err);
      }));
    }
  }
};


function requireDiscordReviewInternalAuth(request, env) {
  const expected = String(env.DISCORD_REVIEW_INTERNAL_TOKEN || "").trim();
  if (!expected) throw httpError(500, "Missing DISCORD_REVIEW_INTERNAL_TOKEN.");

  const header = String(request.headers.get("Authorization") || "");
  const token = String(header.match(/^Bearer\s+(.+)$/i)?.[1] || "").trim();
  if (!token || token !== expected) throw httpError(401, "Unauthorized.");
}

async function handleInternalPs99RestartReviewMessage(request, env) {
  const body = await request.json().catch(() => ({}));
  const channelId = String(body.channel_id || env.PS99_RESTART_REVIEW_CHANNEL_ID || "").trim();
  const requestedMessageId = String(body.message_id || "").trim();
  const candidateId = String(body.candidate_id || "").trim();
  const payload = body.payload && typeof body.payload === "object" ? body.payload : null;
  const reportText = typeof body.report_text === "string" && body.report_text
    ? body.report_text
    : null;

  if (!channelId) throw httpError(400, "Missing channel_id.");
  if (!payload || !Array.isArray(payload.components)) {
    throw httpError(400, "Missing Discord Components V2 payload.");
  }

  const botToken = requiredEnv(env, "DISCORD_BOT_TOKEN");
  let updateFailure = null;

  if (requestedMessageId) {
    const updateUrl = `${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(requestedMessageId)}`;
    const updated = await sendBotAuthoredRestartReviewRequest(
      updateUrl,
      "PATCH",
      botToken,
      payload,
      reportText,
      candidateId
    );

    if (updated.ok) {
      return json({
        ok: true,
        updated: true,
        created_new: false,
        replaced_webhook_message: false,
        message_id: updated.payload.id || requestedMessageId,
        channel_id: updated.payload.channel_id || channelId
      });
    }

    updateFailure = {
      status: updated.status,
      body: updated.payload,
      text: updated.text
    };

    // A bot cannot edit an incoming-webhook-authored message. Create a new
    // bot-authored message when the existing stored message is not editable.
    if (![403, 404].includes(updated.status)) {
      throw discordBotMessageError("update", updated);
    }
  }

  const createUrl = `${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}/messages`;
  const created = await sendBotAuthoredRestartReviewRequest(
    createUrl,
    "POST",
    botToken,
    payload,
    reportText,
    candidateId
  );

  if (!created.ok) throw discordBotMessageError("create", created);

  return json({
    ok: true,
    updated: false,
    created_new: true,
    replaced_webhook_message: Boolean(requestedMessageId),
    previous_message_id: requestedMessageId || null,
    previous_update_failure: updateFailure,
    message_id: created.payload.id || null,
    channel_id: created.payload.channel_id || channelId
  });
}

async function sendBotAuthoredRestartReviewRequest(
  url,
  method,
  botToken,
  payload,
  reportText,
  candidateId
) {
  const cleanPayload = stripUndefined({
    ...payload,
    flags: Number(payload.flags || 0) | MESSAGE_FLAG_COMPONENTS_V2,
    allowed_mentions: payload.allowed_mentions || { parse: [] }
  });

  let requestBody;
  const headers = {
    Authorization: `Bot ${botToken}`,
    Accept: "application/json"
  };

  if (reportText) {
    const filename = `${String(candidateId || "candidate")
      .replace(/[^A-Za-z0-9._-]+/g, "_")
      .slice(0, 120)}.txt`;
    cleanPayload.attachments = [{ id: 0, filename }];
    const form = new FormData();
    form.set("payload_json", JSON.stringify(cleanPayload));
    form.set(
      "files[0]",
      new Blob([reportText], { type: "text/plain;charset=utf-8" }),
      filename
    );
    requestBody = form;
  } else {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(cleanPayload);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: requestBody
  });
  const text = await response.text();
  let responsePayload = {};
  try {
    responsePayload = JSON.parse(text || "{}");
  } catch {}

  console.log("PS99 bot-authored review message", {
    method,
    url,
    status: response.status,
    ok: response.ok,
    candidate_id: candidateId || null,
    response: responsePayload,
    response_text: text
  });

  return {
    ok: response.ok,
    status: response.status,
    payload: responsePayload,
    text
  };
}

function discordBotMessageError(action, result) {
  const error = httpError(
    502,
    result.payload?.message ||
    `Discord bot message ${action} failed (${result.status}): ${result.text}`
  );
  error.details = {
    action,
    discord_status: result.status,
    discord_response_json: result.payload,
    discord_response_text: result.text
  };
  return error;
}

async function handleInteraction(request, env, ctx) {
  const body = await request.text();
  const verified = await verifyDiscordRequest(request, env, body);

  if (!verified) {
    return new Response("invalid request signature", { status: 401 });
  }

  const interaction = JSON.parse(body || "{}");

  if (interaction.type === INTERACTION_TYPE_PING) {
    return interactionJson({ type: INTERACTION_RESPONSE_PONG });
  }

  if (interaction.type === INTERACTION_TYPE_MESSAGE_COMPONENT) {
    const restartReview = parsePs99RestartReviewCustomId(interaction.data?.custom_id);
    if (restartReview) {
      return interactionJson(await handlePs99RestartReviewComponent(interaction, env, ctx, restartReview));
    }

    const restartAnalytics = parsePs99RestartAnalyticsCustomId(interaction.data?.custom_id);
    if (restartAnalytics) {
      return interactionJson(await handlePs99RestartAnalyticsComponent(interaction, env, ctx, restartAnalytics));
    }

    if (parseLeagueChartCustomId(interaction.data?.custom_id)) {
      return interactionJson(handleLeagueChartComponent(interaction, env, ctx));
    }

    if (parseTopCommandCustomId(interaction.data?.custom_id)) {
      return interactionJson(handleTopCommandComponent(interaction, env, ctx));
    }

    if (parseClanLookupCustomId(interaction.data?.custom_id)) {
      return interactionJson(handleClanLookupComponent(interaction, env, ctx));
    }

    if (parseClanLogCustomId(interaction.data?.custom_id)) {
      return interactionJson(handleClanLogComponent(interaction, env, ctx));
    }

    if (parseOfflineConfigCustomId(interaction.data?.custom_id)) {
      return interactionJson(handleOfflineConfigComponent(interaction, env, ctx));
    }

    const hatchSetup = parseHtgSetupCustomId(interaction.data?.custom_id);
    if (hatchSetup) {
      return interactionJson(handleHtgSetupComponent(interaction, env, ctx, hatchSetup));
    }

    return interactionJson(handleHistoryComponent(interaction, env, ctx));
  }

  if (interaction.type !== INTERACTION_TYPE_APPLICATION_COMMAND) {
    return interactionJson(messageResponse("Unsupported interaction type."));
  }

  const commandName = String(interaction.data?.name || "").toLowerCase();
  if (commandName === "t") {
    const guildId = tCommandGuildId(env);
    if (String(interaction.guild_id || "").trim() !== guildId) {
      return interactionJson(messageResponse("This command can only be used in the configured c0ld server.", true));
    }

    if (!memberHasTCommandRole(interaction, env)) {
      return interactionJson(messageResponse("You do not have access to use `/t`.", true));
    }

    const message = getCommandOption(interaction, "message");
    if (!message) {
      return interactionJson(messageResponse("Use `/t message:<message>`.", true));
    }

    ctx.waitUntil(completeTInteraction(interaction, env, message));
    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: { flags: MESSAGE_FLAG_EPHEMERAL }
    });
  }

  if (commandName === "version") {
    ctx.waitUntil(completeVersionInteraction(interaction, env));
    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {}
    });
  }

  if (commandName === "ram") {
    return interactionJson(messageResponse(`[Roblox Account Manager](${RAM_LINK_URL})`));
  }

  if (commandName === "rdp") {
    return interactionJson(messageResponse(`[RDP setup video](${RDP_LINK_URL})`));
  }

  if (commandName === "top") {
    const subcommand = getSubcommandName(interaction);
    if (!["leagues", "clans", "players"].includes(subcommand)) {
      return interactionJson(messageResponse("Use `/top leagues`, `/top clans`, or `/top players`.", true));
    }

    ctx.waitUntil(completeTopCommandInteraction(interaction, env, {
      kind: subcommand,
      page: 0,
      ownerId: interactionUserId(interaction)
    }));

    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
      }
    });
  }

  if (commandName === "rewards") {
    ctx.waitUntil(completeRewardsInteraction(interaction, env));
    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
      }
    });
  }

  if (commandName === "lb") {
    if (!memberHasAllowedRole(interaction, env)) {
      return interactionJson(messageResponse("You do not have access to use `/lb`.", true));
    }

    const player = getCommandOption(interaction, "player") || getCommandOption(interaction, "username");
    if (!player) {
      return interactionJson(messageResponse("Use `/lb player:<roblox username>`.", true));
    }

    ctx.waitUntil(completeSearchInteraction(interaction, env, player));
    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
      }
    });
  }

  if (commandName === "league") {
    const subcommand = getSubcommandName(interaction);
    if (subcommand === "info") {
      const leagueName = getCommandOption(interaction, "league") || getCommandOption(interaction, "name");
      if (!leagueName) {
        return interactionJson(messageResponse("Use `/league info league:<league>`.", true));
      }

      ctx.waitUntil(completeLeagueInfoInteraction(interaction, env, leagueName));
      return interactionJson({
        type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
        data: {
          flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
        }
      });
    }

    if (subcommand !== "rewards") {
      return interactionJson(messageResponse("Use `/league info league:<league>` or `/league rewards`.", true));
    }

    ctx.waitUntil(completeRewardsInteraction(interaction, env, "leagues"));
    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
      }
    });
  }

  if (commandName === "leaderboard") {
    const subcommand = getSubcommandName(interaction);
    if (subcommand !== "rewards") {
      return interactionJson(messageResponse("Use `/leaderboard rewards`.", true));
    }

    ctx.waitUntil(completeRewardsInteraction(interaction, env, "leaderboard"));
    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
      }
    });
  }

  if (commandName === "history") {
    if (!memberHasAllowedRole(interaction, env)) {
      return interactionJson(messageResponse("You do not have access to use `/history`.", true));
    }

    const username = getCommandOption(interaction, "username");
    if (!username) {
      return interactionJson(messageResponse("Use `/history username:<roblox username>`.", true));
    }

    ctx.waitUntil(completeHistoryInteraction(interaction, env, {
      query: username,
      view: "clan",
      page: 0,
      ownerId: interactionUserId(interaction)
    }));

    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
      }
    });
  }

  if (commandName === "clan") {
    const subcommand = getSubcommandName(interaction);
    if (subcommand === "log") {
      const clanName = getCommandOption(interaction, "clan") || getCommandOption(interaction, "name");
      if (!clanName) {
        return interactionJson(messageResponse("Use `/clan log clan:<name>` to view activity, or add `assign:<channel>` to send future activity there.", true));
      }

      const assignmentChannelId = getCommandOption(interaction, "assign");
      const action = assignmentChannelId ? "assign" : "view";

      if (action === "assign") {
        if (!interaction.guild_id) {
          return interactionJson(messageResponse("Clan activity log setup must be run inside the Discord server that should receive the posts.", true));
        }
        const permitted = await memberCanManageServerTracker(interaction, env, { allowDiscordManage: false });
        if (!permitted) {
          return interactionJson(messageResponse("You need the configured Luna administrator role to assign a clan activity log channel.", true));
        }
      }

      ctx.waitUntil(completeClanLogInteraction(interaction, env, action, clanName, 0, interactionUserId(interaction)));
      return interactionJson({
        type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
        data: { flags: action !== "view" || ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined }
      });
    }

    if (subcommand === "tracker") {
      const clanName = getCommandOption(interaction, "clan") || getCommandOption(interaction, "name");
      if (!clanName) {
        return interactionJson(messageResponse("Use `/clan tracker clan:<name>` to preview a tracker, or add `assign:<channel>` to keep one updated there.", true));
      }

      const assignmentChannelId = getCommandOption(interaction, "assign");
      if (assignmentChannelId) {
        if (!interaction.guild_id) {
          return interactionJson(messageResponse("Persistent clan trackers must be assigned from inside the Discord server that should receive them.", true));
        }
        const permitted = await memberCanManageServerTracker(interaction, env, { allowDiscordManage: false });
        if (!permitted) {
          return interactionJson(messageResponse("You need the configured Luna administrator role to assign a persistent clan tracker.", true));
        }
      }

      ctx.waitUntil(completeClanTrackerInteraction(interaction, env, assignmentChannelId ? "assign" : "view", clanName));
      return interactionJson({
        type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
        // The tracker is intentionally a Components V2 message so the roster can
        // use wide, readable table blocks instead of cramped embed fields.
        data: {
          flags: assignmentChannelId
            ? MESSAGE_FLAG_EPHEMERAL
            : MESSAGE_FLAG_COMPONENTS_V2 | (ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : 0)
        }
      });
    }

    if (subcommand === "info") {
      const clanName = getCommandOption(interaction, "name");
      if (!clanName) {
        return interactionJson(messageResponse("Use `/clan info name:<clan>`.", true));
      }

      ctx.waitUntil(completeClanLookupInteraction(interaction, env, {
        clanName,
        page: 0,
        ownerId: interactionUserId(interaction)
      }));

      return interactionJson({
        type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
        data: {
          flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
        }
      });
    }

    if (subcommand === "rewards") {
      ctx.waitUntil(completeRewardsInteraction(interaction, env, "clans"));
      return interactionJson({
        type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
        data: {
          flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
        }
      });
    }

    return interactionJson(messageResponse("Use `/clan info name:<clan>` or `/clan rewards`.", true));
  }

  if (commandName === "cw") {
    const clanName = getCommandOption(interaction, "clan") || getCommandOption(interaction, "name");
    if (!clanName) {
      return interactionJson(messageResponse("Use `/cw clan:<clan>`.", true));
    }

    ctx.waitUntil(completeClanLookupInteraction(interaction, env, {
      clanName,
      page: 0,
      ownerId: interactionUserId(interaction)
    }));

    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
      }
    });
  }

  if (commandName === "lg") {
    const leagueName = getCommandOption(interaction, "league") || getCommandOption(interaction, "name");
    if (!leagueName) {
      return interactionJson(messageResponse("Use `/lg league:<league>`.", true));
    }

    ctx.waitUntil(completeLeagueInfoInteraction(interaction, env, leagueName));

    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
      }
    });
  }

  if (commandName === "player") {
    const subcommand = getSubcommandName(interaction);
    if (subcommand !== "info") {
      return interactionJson(messageResponse("Use `/player info player:<roblox username>`.", true));
    }

    if (!memberHasAllowedRole(interaction, env)) {
      return interactionJson(messageResponse("You do not have access to use `/player info`.", true));
    }

    const player = getCommandOption(interaction, "player") || getCommandOption(interaction, "username");
    if (!player) {
      return interactionJson(messageResponse("Use `/player info player:<roblox username>`.", true));
    }

    ctx.waitUntil(completeSearchInteraction(interaction, env, player));
    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
      }
    });
  }

  if (commandName === "hourly") {
    const subcommand = getSubcommandName(interaction);
    if (!["clan", "user", "league", "remove", "alert"].includes(subcommand)) {
      return interactionJson(messageResponse(
        "Use `/hourly clan clan:<clan name> channel:<channel>`, `/hourly user username:<roblox username> channel:<channel>`, `/hourly league league:<league name> channel:<channel>`, `/hourly alert user:<user> channel:<channel>`, or `/hourly remove channel:<channel>`.",
        true
      ));
    }

    const permitted = await memberCanManageServerTracker(interaction, env, {
      allowDiscordManage: false
    });
    if (!permitted) {
      return interactionJson(messageResponse(
        "You need the configured Luna administrator role to manage hourly picture posts.",
        true
      ));
    }

    ctx.waitUntil(completeHourlyClanInteraction(interaction, env));
    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: { flags: MESSAGE_FLAG_EPHEMERAL }
    });
  }

  if (commandName === "offline") {
    const offlinePath = getOfflineSubcommandPath(interaction);
    const subcommand = offlinePath.group || offlinePath.subcommand;
    const validAssignTarget = offlinePath.group !== "assign" || ["clan", "league", "users"].includes(offlinePath.subcommand);
    if (!validAssignTarget || !["assign", "mode", "minutes", "clan", "league", "remove-clan", "remove-league", "user", "users", "members", "remove-user", "remove-users", "post-rate", "config"].includes(subcommand)) {
      return interactionJson(messageResponse("Use `/offline assign clan`, `/offline assign league`, `/offline assign users`, `/offline mode`, `/offline minutes`, `/offline clan`, `/offline league`, `/offline remove-clan`, `/offline remove-league`, `/offline user`, `/offline users`, `/offline members`, `/offline remove-user`, `/offline remove-users`, `/offline post-rate`, or `/offline config`.", true));
    }

    const permitted = await memberCanManageServerTracker(interaction, env, {
      allowDiscordManage: false
    });
    if (!permitted) {
      return interactionJson(messageResponse(
        "You need the configured Luna administrator role to manage offline pings.",
        true
      ));
    }

    ctx.waitUntil(completeOfflinePingInteraction(interaction, env));
    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: { flags: MESSAGE_FLAG_EPHEMERAL }
    });
  }

  if (commandName === "kms") {
    if (!interaction.guild_id) {
      return interactionJson(messageResponse("This command can only be used inside a Discord server.", true));
    }

    ctx.waitUntil(completeSelfTimeoutInteraction(interaction, env));
    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: { flags: MESSAGE_FLAG_EPHEMERAL }
    });
  }

  if (commandName === "htg") {
    const subcommand = getSubcommandName(interaction);
    const hatchSubcommand = subcommand === "setup" || subcommand === "alert" ? "tracker" : subcommand;
    if (!["tracker", "accounts", "enable", "disable", "assign"].includes(hatchSubcommand)) {
      return interactionJson(messageResponse("Use `/htg setup account:<roblox username>`, `/htg accounts`, `/htg enable tier:<choice>`, `/htg disable tier:<choice>`, or `/htg assign channel:<channel>`.", true));
    }

    // The tracker is intentionally configured per Discord server.  Do not let
    // a DM setup create an unscoped account record that could later be routed
    // to an unrelated server's HTG channel.
    if (hatchSubcommand !== "accounts" && !interaction.guild_id) {
      return interactionJson(messageResponse(
        "HTG setup and alert settings must be run inside the Discord server that should receive the alerts. Use `/htg accounts` to view your connected accounts.",
        true
      ));
    }

    if (hatchSubcommand === "assign") {
      const permitted = await memberCanManageServerTracker(interaction, env, {
        allowDiscordManage: false
      });
      if (!permitted) {
        return interactionJson(messageResponse(
          "You need the configured Luna administrator role to assign the HTG hatch-alert channel.",
          true
        ));
      }
    }

    ctx.waitUntil(completeHatchInteraction(interaction, env, hatchSubcommand));
    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: MESSAGE_FLAG_EPHEMERAL
      }
    });
  }

  if (["server", "add", "remove", "luna"].includes(commandName)) {
    const subcommand = getSubcommandName(interaction);
    const publicAction = commandName === "server" && subcommand === "who";

    if (!publicAction) {
      const permitted = commandName === "luna"
        ? await memberCanConfigureLunaAdminRole(interaction, env)
        : await memberCanManageServerTracker(interaction, env, {
          allowDiscordManage: false
        });
      if (!permitted) {
        return interactionJson(messageResponse(
          commandName === "luna"
            ? "Luna's administrator role is already set. You need Manage Server permission to change it."
            : "You need the configured Luna administrator role to use this command.",
          true
        ));
      }
    }

    ctx.waitUntil(completeServerTrackerInteraction(interaction, env, commandName, subcommand));
    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
      }
    });
  }

  if (commandName !== "search") {
    return interactionJson(messageResponse(`Unknown command: ${commandName || "none"}`));
  }

  if (!memberHasAllowedRole(interaction, env)) {
    return interactionJson(messageResponse("You do not have access to use `/search`.", true));
  }

  const username = getCommandOption(interaction, "username");
  if (!username) {
    return interactionJson(messageResponse("Use `/search username:<roblox username>`.", true));
  }

  ctx.waitUntil(completeSearchInteraction(interaction, env, username));
  return interactionJson({
    type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
    data: {
      flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
    }
  });
}

async function buildSearchResponse(query, env) {
  const { payload, status, ok, configured } = await fetchGlobalSearchPayload(query, env);
  const scanClan = configured?.scan_clan || String(env.GLOBAL_SCAN_CLAN || env.CLAN_NAME || "c0ld").trim() || "c0ld";

  if (!ok || payload.ok === false || !payload.row) {
    return messageResponse(
      payload.message || `No global-rank result found for ${query}. ${status ? `(API ${status})` : ""}`.trim(),
      true
    );
  }

  const row = payload.row;
  // The compact current row uses `points`; the latest history row carries
  // member rank and other details. Normalise both shapes for the text card.
  const newestHistoryRow = Array.isArray(payload.history) && payload.history.length
    ? payload.history[0]
    : {};
  const displayRow = {
    ...newestHistoryRow,
    ...row,
    event_name: row.event_name || row.battle_display_name || row.battle_key ||
      newestHistoryRow.event_name || newestHistoryRow.battle_display_name || newestHistoryRow.battle_key ||
      payload.run?.event_name || payload.run?.battle_display_name || payload.run?.battle_key || null,
    global_points: row.global_points ?? row.points ?? newestHistoryRow.global_points ?? newestHistoryRow.member_points ?? null,
    clan_points: row.clan_points ?? row.points ?? newestHistoryRow.clan_points ?? newestHistoryRow.member_points ?? null,
    clan_rank: row.clan_rank ?? row.member_rank ?? newestHistoryRow.clan_rank ?? newestHistoryRow.member_rank ?? null,
    total_global_players: row.total_global_players ?? newestHistoryRow.total_global_players ??
      payload.total_global_players ?? payload.run?.total_global_players ?? payload.run?.candidate_player_count ?? null
  };
  // Keep the existing renderers and chart helpers on one complete shape.
  // This avoids a compact API response causing the Discord copy to display
  // dashes while the image (which reads history) displays the real values.
  row.event_name ??= displayRow.event_name;
  row.global_points ??= displayRow.global_points;
  row.clan_points ??= displayRow.clan_points;
  row.clan_rank ??= displayRow.clan_rank;
  row.total_global_players ??= displayRow.total_global_players;
  const avatarUrl = await searchAvatarUrl(displayRow, env);
  const resultClan = String(displayRow.source_clan || displayRow.clan_name || scanClan).trim();
  const sourceMode = searchResponseSourceMode(payload, displayRow);
  const isLeagueMode = sourceMode === "leagues";
  const leaguePayload = isLeagueMode && resultClan
    ? await fetchLeagueCurrentPayload(resultClan, env).catch(() => null)
    : null;
  const leagueRankPayload = isLeagueMode && !positiveInteger(displayRow.global_rank)
    ? await fetchLeaguePlayerPoolRank(query, displayRow.user_id, env).catch(() => null)
    : null;
  const primaryClanName = String(scanClan).toLowerCase();
  const isPrimaryClanMember = String(resultClan || "").toLowerCase() === primaryClanName;
  const clanRankText = formatClanRank(displayRow, payload.run);
  const clanRankLine = isPrimaryClanMember
    ? `🔰 Rank in ${resultClan.toUpperCase()}: **${clanRankText}**`
    : displayRow.clan_rank
      ? `🔰 Clan Leaderboard Rank: **${rank(row.clan_rank)}**`
      : null;
  const eventState = isLeagueMode ? null : await hourlyClanDeliveryEventState(env).catch(() => null);
  const freshnessLines = isLeagueMode
    ? leagueSearchFreshnessLines(row, leaguePayload)
    : eventState?.reason === "event_ended"
      ? ["Clan battle has ended"]
      : [`Last Update: ${discordTime(row.fetched_at)}`, "Updates every 20 minutes"];
  const globalPlayerCountSuffix = displayRow.total_global_players
    ? ` of ${shortNumber(displayRow.total_global_players)}`
    : "";
  const embed = {
    title: "Global Search Results",
    color: 0x58a6ff,
    description: [
      `🧑 Name: **${displayName(row)}**`,
      `🏰 Clan: **${resultClan.toUpperCase()}**`,
      clanRankLine,
      "",
      `🎉 Event: **${row.event_name || row.battle_display_name || row.battle_key || "Current Event"}**`,
      `🌟 Stars: **${shortNumber(row.global_points ?? row.clan_points)}** ⭐`,
      `🏆 Global Rank: **${rank(row.global_rank)}${globalPlayerCountSuffix}**`,
      betterThanLine(row),
      "",
      ...freshnessLines
    ].filter(line => line !== null).join("\n")
  };

  if (isLeagueMode) {
    const exactGlobalRank = positiveInteger(row.global_rank) || positiveInteger(leagueRankPayload?.rank);
    const totalGlobalPlayers = positiveInteger(
      leagueRankPayload?.total_global_players ??
      row.total_global_players ??
      payload.total_global_players ??
      payload.run?.total_global_players ??
      payload.run?.candidate_player_count
    );
    const globalRankLine = exactGlobalRank
      ? [
          `\u{1F30D} Global Rank: **${rank(exactGlobalRank)}${totalGlobalPlayers ? ` of ${shortNumber(totalGlobalPlayers)}` : ""}**`,
          totalGlobalPlayers
            ? betterThanLine({ ...row, global_rank: exactGlobalRank, total_global_players: totalGlobalPlayers })
            : null
        ].filter(Boolean).join(", ")
      : "\u{1F30D} Global Rank: **Outside the tracked League-player pool**";
    const leagueEventLabel = String(
      leaguePayload?.league_run_label ||
      leaguePayload?.league_run_key ||
      payload.source_label ||
      "Current League"
    ).trim();

    embed.title = "League Global Search Results";
    embed.description = [
      `\u{1F9D1} Name: **${displayName(row)}**`,
      `\u{1F3C6} League: **${resultClan || "Unknown"}**`,
      leaguePayload?.league_rank ? `\u{1F4CA} League Rank: **${rank(leaguePayload.league_rank)}**` : null,
      "",
      `\u{1F389} Event: **${leagueEventLabel}**`,
      `\u{2B50} Player Points: **${shortNumber(row.points ?? row.global_points)}**`,
      leaguePayload?.league_points !== undefined && leaguePayload?.league_points !== null
        ? `\u{1F465} League Points: **${shortNumber(leaguePayload.league_points)}**`
        : null,
      globalRankLine,
      "",
      ...freshnessLines
    ].filter(line => line !== null).join("\n");
  }

  if (avatarUrl) {
    embed.thumbnail = { url: avatarUrl };
  }

  const data = {
    embeds: [embed],
    flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined,
    allowed_mentions: { parse: [] }
  };

  // This chart is built from Clan Battle history. Do not attach it to a
  // League result, where it produces an empty and misleading Clan card.
  if (!isLeagueMode && searchChartEnabled(env)) {
    try {
      const chart = await buildSearchChartAttachment(payload, row, env, avatarUrl);
      if (chart?.bytes?.byteLength) {
        embed.image = { url: `attachment://${chart.filename}` };
        data._file = { filename: chart.filename, contentType: "image/png", bytes: chart.bytes };
      }
    } catch {
      // Search text should still answer if chart rendering is unavailable.
    }
  }

  return {
    type: INTERACTION_RESPONSE_CHANNEL_MESSAGE,
    data
  };
}

function leagueSearchFreshnessLines(row, leaguePayload) {
  const leagueSnapshotAt = leaguePayload?.snapshot_at || null;
  const globalPoolSnapshotAt = row?.fetched_at || null;
  const lines = [
    `Last Update: ${discordTime(leagueSnapshotAt || globalPoolSnapshotAt)}`,
    "Updates every 15 minutes"
  ];

  // Exact League points/rank and the expanded global-player rank come from
  // different collections. Keep the main freshness label tied to the exact
  // League snapshot, but disclose an older pool instead of making the entire
  // card appear stale (or making a stale estimated rank look current).
  const leagueMs = new Date(leagueSnapshotAt || 0).getTime();
  const poolMs = new Date(globalPoolSnapshotAt || 0).getTime();
  if (
    Number.isFinite(leagueMs) && leagueMs > 0 &&
    Number.isFinite(poolMs) && poolMs > 0 &&
    leagueMs - poolMs > 20 * 60 * 1000
  ) {
    lines.splice(1, 0, `Global Rank Pool: ${discordTime(globalPoolSnapshotAt)}`);
  }
  return lines;
}

function searchResponseSourceMode(payload, row) {
  const explicit = String(
    payload?.source_mode ||
    row?.source_mode ||
    payload?.run?.source_mode ||
    ""
  ).trim().toLowerCase();
  if (["league", "leagues"].includes(explicit)) return "leagues";
  if (["clan", "clans", "battle", "clan-battle"].includes(explicit)) return "clans";

  const sourceLabel = String(payload?.source_label || "").trim().toLowerCase();
  const searchScope = String(payload?.search_scope || "").trim().toLowerCase();
  if (
    sourceLabel.includes("league") ||
    searchScope.includes("league") ||
    payload?.rank_is_estimated !== undefined ||
    row?.global_rank_estimated !== undefined
  ) {
    return "leagues";
  }

  return "clans";
}

async function completeSearchInteraction(interaction, env, query) {
  try {
    const response = await buildSearchResponse(query, env);
    await editOriginalInteraction(interaction, normalizeDeferredSearchData(response.data, env));
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `Search failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      attachments: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

function normalizeDeferredSearchData(data, env) {
  const normalized = { ...(data || {}) };
  normalized.flags = ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined;
  normalized.allowed_mentions = normalized.allowed_mentions || { parse: [] };
  return normalized;
}

async function searchAvatarUrl(row, env) {
  const existing = absoluteProfileAssetUrl(
    row?.avatar_url || row?.avatarUrl || row?.thumbnail_url || row?.thumbnailUrl,
    env
  );
  if (existing) return existing;

  const userId = positiveInteger(row?.user_id || row?.roblox_user_id || row?.robloxUserId || row?.id);
  if (!userId) return null;

  const url = new URL("https://thumbnails.roblox.com/v1/users/avatar-headshot");
  url.searchParams.set("userIds", String(userId));
  url.searchParams.set("size", "150x150");
  url.searchParams.set("format", "Png");
  url.searchParams.set("isCircular", "false");

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "c0ld-Discord-Search-Avatar"
      }
    });
    const payload = await res.json().catch(() => ({}));
    const item = Array.isArray(payload.data) ? payload.data.find(entry => entry?.imageUrl) : null;
    const imageUrl = String(item?.imageUrl || "").trim();
    return /^https?:\/\//i.test(imageUrl) ? imageUrl : null;
  } catch (err) {
    return null;
  }
}

async function loadRobloxProfileAvatar(row, env, extraUrls = []) {
  const candidates = [];
  const addCandidate = value => {
    const url = absoluteProfileAssetUrl(value, env);
    if (url && !candidates.includes(url)) candidates.push(url);
  };

  for (const value of Array.isArray(extraUrls) ? extraUrls : [extraUrls]) addCandidate(value);
  addCandidate(row?.avatar_url);
  addCandidate(row?.avatarUrl);
  addCandidate(row?.thumbnail_url);
  addCandidate(row?.thumbnailUrl);

  const userId = positiveInteger(row?.user_id || row?.roblox_user_id || row?.robloxUserId || row?.id);
  if (userId) {
    const freshUrl = await searchAvatarUrl({ user_id: userId }, env).catch(() => null);
    addCandidate(freshUrl);
  }

  for (const url of candidates) {
    const avatar = await loadHistoryAvatar(url).catch(() => null);
    if (avatar) return avatar;
  }
  return null;
}

function searchChartEnabled(env) {
  return String(env.SEARCH_CHART_ENABLED || "true").toLowerCase() !== "false";
}

function searchChartHistoryHours(env) {
  const configured = Number(env.SEARCH_CHART_HISTORY_HOURS || 24);
  return Math.max(1, Math.min(168, Number.isFinite(configured) ? configured : 24));
}

function searchChartHistoryLimit(env) {
  const configured = Number(env.SEARCH_CHART_HISTORY_LIMIT || 300);
  return Math.max(24, Math.min(1000, Math.round(Number.isFinite(configured) ? configured : 300)));
}

async function buildSearchChartAttachment(payload, row, env, avatarUrl = null) {
  const samples = searchChartSamples(payload, row);
  if (!samples.length) return null;

  const minT = Math.min(...samples.map(item => item.t));
  const maxT = Math.max(...samples.map(item => item.t));
  const markers = await fetchSearchChartMarkers(env, minT, maxT).catch(() => ({ updates: [], restarts: [] }));
  const bytes = await renderSearchProfileChartPng(payload, row, samples, markers, avatarUrl || row.avatar_url || row.avatarUrl || null, env);
  const filename = `global-search-${chartFilenamePart(displayName(row))}-${chartFilenamePart(row.event_name || row.battle_key || "current")}.png`;
  return { filename, bytes };
}

function searchChartSamples(payload, row) {
  const rows = [
    ...(Array.isArray(payload?.history) ? payload.history : []),
    row
  ];
  const byTime = new Map();

  for (const item of rows) {
    const timeValue = item?.fetched_at || item?.updated_at || item?.finished_at || item?.created_at;
    const t = new Date(timeValue || 0).getTime();
    if (!Number.isFinite(t) || t <= 0) continue;

    const points = finiteNumber(item.global_points ?? item.member_points ?? item.clan_points ?? item.points);
    const rankValue = finiteNumber(item.global_rank);
    if (points === null && rankValue === null) continue;

    byTime.set(String(t), {
      t,
      rawT: new Date(t).toISOString(),
      points,
      rank: rankValue
    });
  }

  return [...byTime.values()].sort((a, b) => a.t - b.t);
}

async function fetchSearchChartMarkers(env, minT, maxT) {
  const updates = await fetchSearchChartVersionMarkers(env, minT, maxT).catch(() => []);
  const restarts = await fetchSearchChartRestartMarkers(env, minT, maxT).catch(() => []);
  return { updates, restarts };
}

async function fetchSearchChartVersionMarkers(env, minT, maxT) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/ps99/versions", apiBase);
  apiUrl.searchParams.set("limit", "200");

  const res = await fetchClanApi(env, apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-Search-Chart-Worker" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.ok === false) return [];

  const rootPlaceId = String(payload.root_place_id || "").trim();
  return (Array.isArray(payload.events) ? payload.events : [])
    .filter(event => !rootPlaceId || String(event?.place_id || "").trim() === rootPlaceId)
    .map(event => {
      const t = chartMarkerTime(event.current_published_at || event.detected_at || event.created_at);
      return {
        type: "update",
        t,
        label: `Update ${plainInteger(event.current_version) || ""}`.trim(),
        version: plainInteger(event.current_version)
      };
    })
    .filter(event => Number.isFinite(event.t) && event.t >= minT && event.t <= maxT)
    .sort((a, b) => a.t - b.t);
}

async function fetchSearchChartRestartMarkers(env, minT, maxT) {
  if (String(env.SEARCH_CHART_RESTART_MARKERS || "false").toLowerCase() !== "true") return [];

  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/ps99/restarts", apiBase);
  apiUrl.searchParams.set("limit", "100");

  const res = await fetchClanApi(env, apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-Search-Chart-Worker" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.ok === false) return [];

  return (Array.isArray(payload.events) ? payload.events : [])
    .map(event => {
      const t = chartMarkerTime(event.detected_at || event.candidate_started_at || event.created_at);
      return {
        type: "restart",
        t,
        label: "Restart",
        confidence: finiteNumber(event.confidence)
      };
    })
    .filter(event => Number.isFinite(event.t) && event.t >= minT && event.t <= maxT)
    .sort((a, b) => a.t - b.t);
}

function chartMarkerTime(value) {
  const t = new Date(value || 0).getTime();
  return Number.isFinite(t) && t > 0 ? t : null;
}

async function renderSearchProfileChartPng(payload, row, samples, markers = {}, avatarUrl = null, env = {}) {
  const [loadedFonts, avatar] = await Promise.all([
    loadHistoryFonts(),
    loadRobloxProfileAvatar(row, env, [avatarUrl]).catch(() => null)
  ]);
  const fonts = { ...loadedFonts, rowBold: loadedFonts.hourlyBold || loadedFonts.bold };
  const width = 1600;
  const height = 900;
  const color = searchChartBoardColors();
  const canvas = new HistoryPixelCanvas(width, height, color.background, 1);
  const pointColor = color.red;
  const rankColor = color.yellow;
  const activeColor = color.green;
  const downtimeColor = color.red;
  const unknownColor = color.zero;
  const updateColor = color.cyan;
  const restartColor = color.orange;
  const name = row.username || row.display_name || `user_${row.user_id}`;
  const eventName = row.event_name || row.battle_display_name || row.battle_key || "Current Event";
  const clan = String(row.source_clan || row.clan_name || payload?.clan_name || "Clan").toUpperCase();
  const updatedAt = row.fetched_at || row.updated_at || payload?.run?.finished_at;
  const latest = samples[samples.length - 1] || {};

  const rawMinT = Math.min(...samples.map(item => item.t));
  const rawMaxT = Math.max(...samples.map(item => item.t));
  const singleSample = rawMaxT === rawMinT;
  const chartMaxT = singleSample ? rawMaxT + 60 * 60 * 1000 : rawMaxT;
  const chartMinT = chartMaxT - 24 * 60 * 60 * 1000;
  const visibleSamples = samples.filter(item => item.t >= chartMinT && item.t <= chartMaxT);
  const chartMetrics = searchChartMetrics(visibleSamples, chartMinT, chartMaxT);
  const pointGain1h = searchChartGain(visibleSamples, 60);
  const pointGain6h = searchChartGain(visibleSamples, 360);
  const pointGain12h = searchChartGain(visibleSamples, 720);
  const pointGain24h = searchChartGain(visibleSamples, 1440);
  const visibleUpdates = (markers.updates || []).filter(marker => marker.t >= chartMinT && marker.t <= chartMaxT);
  const visibleRestarts = (markers.restarts || []).filter(marker => marker.t >= chartMinT && marker.t <= chartMaxT);
  const currentPoints = latest.points ?? row.global_points ?? row.clan_points;
  const currentRank = latest.rank ?? row.global_rank;
  const totalPlayers = finiteNumber(row.total_global_players ?? payload?.run?.total_global_players ?? payload?.run?.candidate_player_count);
  const clanRank = row.member_rank || row.clan_rank || row.source_clan_rank || null;

  canvas.fillRect(32, 30, width - 64, height - 60, color.panel);
  hourlyDrawMysticSmoke(canvas, width, height, color);
  hourlyDrawPanelFrame(canvas, 32, 30, width - 64, height - 60, color.line);
  searchChartDrawRainbowBar(canvas, 54, 42, width - 108, 5, color);
  hourlyDrawHeaderOrnaments(canvas, width / 2, 116, color);
  searchChartDrawAvatarBadge(canvas, fonts, name, avatar, width / 2 - 47, 70, 94, color);
  searchChartDrawPlayerHeader(canvas, fonts, name, rank(currentRank), width / 2, 91, color);

  const leftPanel = { x: 54, y: 206, w: 488, h: 614 };
  const chartPanelArea = { x: 556, y: 206, w: 990, h: 614 };

  hourlyDrawPanel(canvas, leftPanel.x, leftPanel.y, leftPanel.w, leftPanel.h, color.panelDeep, color.line);
  hourlyDrawColumnAura(canvas, leftPanel.x, leftPanel.y, leftPanel.w, leftPanel.h, 0, color);
  hourlyDrawColumnHeader(canvas, fonts, leftPanel.x, leftPanel.y, leftPanel.w, 50, [eventName, hourlyBoardCompactTimestamp(updatedAt)], 0, color);

  const metricRows = [
    ["Global Rank", `${rank(currentRank)}${totalPlayers ? ` / ${shortNumber(totalPlayers)}` : ""}`, rankColor],
    ["Points", shortNumber(currentPoints), pointColor],
    ["Clan", clan, color.green],
    ["Clan Rank", clanRank ? rank(clanRank) : "-", color.yellow],
    ["1 Hour", `+${shortNumber(pointGain1h)}`, pointGain1h > 0 ? color.green : color.zeroText],
    ["6 Hours", `+${shortNumber(pointGain6h)}`, pointGain6h > 0 ? color.green : color.zeroText],
    ["12 Hours", `+${shortNumber(pointGain12h)}`, pointGain12h > 0 ? color.green : color.zeroText],
    ["24 Hours", `+${shortNumber(pointGain24h)}`, pointGain24h > 0 ? color.green : color.zeroText],
    ["Uptime", searchChartDurationLabel(chartMetrics.activeMs), activeColor],
    ["Downtime", searchChartDurationLabel(chartMetrics.downtimeMs), downtimeColor],
    ["Unknown", searchChartDurationLabel(chartMetrics.unknownMs), color.zeroText],
    ["Markers", `${fullNumber(visibleUpdates.length)} updates / ${fullNumber(visibleRestarts.length)} restarts`, color.cyan]
  ];

  const metricTop = leftPanel.y + 66;
  const metricRowHeight = 38;
  const metricMaxGain = Math.max(1, pointGain1h, pointGain6h, pointGain12h, pointGain24h);
  metricRows.forEach((metric, index) => {
    const gainValue = index >= 4 && index <= 7 ? [pointGain1h, pointGain6h, pointGain12h, pointGain24h][index - 4] : null;
    searchChartDrawMetricRow(canvas, fonts, leftPanel.x + 12, metricTop + index * metricRowHeight, leftPanel.w - 24, metricRowHeight - 4, {
      label: metric[0],
      value: metric[1],
      tone: metric[2],
      barFraction: gainValue === null ? null : Math.max(0.04, gainValue / metricMaxGain)
    }, index, color);
  });

  hourlyDrawPanel(canvas, chartPanelArea.x, chartPanelArea.y, chartPanelArea.w, chartPanelArea.h, color.panelDeep, color.line);
  hourlyDrawColumnAura(canvas, chartPanelArea.x, chartPanelArea.y, chartPanelArea.w, chartPanelArea.h, 1, color);
  hourlyDrawColumnHeader(canvas, fonts, chartPanelArea.x, chartPanelArea.y, chartPanelArea.w, 50, ["Rank / Points", "Last 24 Hours"], 1, color);

  const plot = { x: chartPanelArea.x + 56, y: chartPanelArea.y + 84, w: chartPanelArea.w - 104, h: 386 };
  hourlyBlendRoundedRect(canvas, plot.x, plot.y, plot.w, plot.h, 10, color.inset, 230);
  hourlyDrawPanelFrame(canvas, plot.x, plot.y, plot.w, plot.h, color.line);

  const pointsSamples = visibleSamples.filter(item => item.points !== null);
  const rankSamples = visibleSamples.filter(item => item.rank !== null);
  const pointValues = pointsSamples.map(item => item.points).filter(Number.isFinite);
  const rankValues = rankSamples.map(item => item.rank).filter(Number.isFinite);
  const pointsMin = pointValues.length ? Math.min(...pointValues) : 0;
  const pointsMax = pointValues.length ? Math.max(...pointValues) : 1;
  const pointPad = Math.max(1, (pointsMax - pointsMin) * 0.12);
  const yPointsMin = Math.max(0, pointsMin - pointPad);
  const yPointsMax = pointsMax + pointPad;
  const rankMin = rankValues.length ? Math.min(...rankValues) : 1;
  const rankMax = rankValues.length ? Math.max(...rankValues) : 1;
  const rankPad = Math.max(1, (rankMax - rankMin) * 0.18);
  const yRankMin = Math.max(1, rankMin - rankPad);
  const yRankMax = rankMax + rankPad;
  const xFor = item => plot.x + ((item.t - chartMinT) / Math.max(1, chartMaxT - chartMinT)) * plot.w;
  const xForTime = t => plot.x + ((t - chartMinT) / Math.max(1, chartMaxT - chartMinT)) * plot.w;
  const yForPoints = item => plot.y + (1 - ((item.points - yPointsMin) / Math.max(1, yPointsMax - yPointsMin))) * plot.h;
  const yForRank = item => plot.y + ((item.rank - yRankMin) / Math.max(1, yRankMax - yRankMin)) * plot.h;

  for (let i = 0; i <= 4; i += 1) {
    const yy = plot.y + (i / 4) * plot.h;
    const pointsValue = yPointsMax - (i / 4) * (yPointsMax - yPointsMin);
    const pointsLabel = shortNumber(pointsValue);
    canvas.fillRect(plot.x, yy, plot.w, 1, [42, 50, 70, 255]);
    const labelWidth = canvas.measureFontText(fonts.regular, pointsLabel, 12);
    canvas.drawFontText(fonts.regular, pointsLabel, Math.max(30, plot.x - labelWidth - 16), yy - 8, 12, color.muted, labelWidth + 8);
  }

  const spanHours = Math.max(1, (chartMaxT - chartMinT) / (60 * 60 * 1000));
  const xTickCount = spanHours <= 1 ? 4 : Math.min(12, Math.ceil(spanHours / 2));
  for (let i = 0; i <= xTickCount; i += 1) {
    const xx = plot.x + (i / xTickCount) * plot.w;
    const tickTime = chartMinT + (i / xTickCount) * (chartMaxT - chartMinT);
    const tickLabel = spanHours <= 1 ? chartTimeOfDayAxisLabel(tickTime) : chartHourAxisLabel(tickTime);
    const tickWidth = canvas.measureFontText(fonts.regular, tickLabel, 12);
    const tickX = i === 0
      ? plot.x
      : i === xTickCount
        ? plot.x + plot.w - tickWidth
        : Math.max(plot.x, Math.min(plot.x + plot.w - tickWidth, xx - tickWidth / 2));
    canvas.fillRect(xx, plot.y, 1, plot.h, [30, 37, 53, 255]);
    canvas.drawFontText(fonts.regular, tickLabel, tickX, plot.y + plot.h + 23, 12, color.muted, tickWidth + 6);
  }

  for (const marker of markers.updates || []) {
    if (marker.t < chartMinT || marker.t > chartMaxT) continue;
    searchChartDrawDashedVertical(canvas, xForTime(marker.t), plot.y, plot.y + plot.h, updateColor, 7, 6);
  }
  for (const marker of markers.restarts || []) {
    if (marker.t < chartMinT || marker.t > chartMaxT) continue;
    searchChartDrawDashedVertical(canvas, xForTime(marker.t), plot.y, plot.y + plot.h, restartColor, 10, 5);
  }

  searchChartDrawPolyline(canvas, pointsSamples, xFor, yForPoints, pointColor, 3);
  searchChartDrawPolyline(canvas, rankSamples, xFor, yForRank, rankColor, 3);
  searchChartDrawActivityBar(canvas, visibleSamples, plot, xForTime, activeColor, downtimeColor, unknownColor, color, {
    y: plot.y + plot.h - 12,
    height: 7,
    rangeStart: chartMinT,
    rangeEnd: chartMaxT
  });

  const legendY = chartPanelArea.y + chartPanelArea.h - 102;
  const chartLegend = [
    ["Rank", rankColor],
    ["Points", pointColor],
    ["Uptime", activeColor],
    ["Downtime", downtimeColor],
    ["Game Updates", updateColor],
    ["Restarts", restartColor]
  ];
  let chartLegendX = chartPanelArea.x + 34;
  for (const [label, tone] of chartLegend) {
    const labelWidth = canvas.measureFontText(fonts.rowBold, label, 15);
    canvas.fillRect(chartLegendX, legendY + 7, 28, 5, tone);
    hourlyDrawFittedText(canvas, fonts.rowBold, label, chartLegendX + 38, legendY, 15, color.white, labelWidth + 4);
    chartLegendX += Math.min(170, labelWidth + 78);
  }

  const recentRows = searchChartIntervalRows(visibleSamples).slice(-4);
  const recentTop = chartPanelArea.y + chartPanelArea.h - 66;
  for (let index = 0; index < 4; index += 1) {
    const recent = recentRows[index];
    const rowX = chartPanelArea.x + 34 + Math.floor(index / 2) * 452;
    const rowY = recentTop + (index % 2) * 22;
    if (!recent) continue;
    searchChartDrawTinyInterval(canvas, fonts, rowX, rowY, 418, recent, index, color);
  }

  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

function searchChartBoardColors() {
  return {
    background: [8, 9, 18, 255],
    panel: [20, 23, 36, 255],
    panelDeep: [13, 17, 27, 255],
    inset: [25, 29, 44, 255],
    row: [25, 29, 43, 255],
    rowAlt: [18, 22, 34, 255],
    line: [54, 64, 100, 255],
    white: [242, 245, 252, 255],
    muted: [160, 172, 195, 255],
    quiet: [105, 119, 148, 255],
    cyan: [52, 225, 239, 255],
    violet: [112, 106, 255, 255],
    pink: [255, 93, 178, 255],
    green: [76, 211, 132, 255],
    yellow: [247, 211, 83, 255],
    orange: [255, 145, 28, 255],
    red: [231, 79, 84, 255],
    zero: [118, 127, 146, 255],
    zeroText: [148, 159, 181, 255],
    bar: [48, 55, 72, 255],
    barZero: [45, 51, 65, 255],
    smokeCyan: [51, 230, 241, 255],
    smokeViolet: [118, 72, 255, 255],
    smokePink: [255, 92, 183, 255]
  };
}

function searchChartDrawRainbowBar(canvas, x, y, width, height, color, options = {}) {
  const segments = [color.violet, color.cyan, color.green, color.yellow, color.orange, color.red];
  const segmentWidth = width / segments.length;
  const gapCenter = Number(options.gapCenter);
  const gapWidth = Math.max(0, Number(options.gapWidth) || 0);
  const gapStart = Number.isFinite(gapCenter) && gapWidth > 0 ? gapCenter - gapWidth / 2 : null;
  const gapEnd = Number.isFinite(gapCenter) && gapWidth > 0 ? gapCenter + gapWidth / 2 : null;

  for (let index = 0; index < segments.length; index += 1) {
    const segmentX = x + index * segmentWidth;
    const segmentRight = segmentX + segmentWidth + 1;
    if (gapStart === null || gapEnd === null) {
      canvas.fillRect(segmentX, y, segmentWidth + 1, height, segments[index]);
      continue;
    }

    const leftWidth = Math.max(0, Math.min(segmentRight, gapStart) - segmentX);
    if (leftWidth > 0) canvas.fillRect(segmentX, y, leftWidth, height, segments[index]);
    const rightX = Math.max(segmentX, gapEnd);
    const rightWidth = Math.max(0, segmentRight - rightX);
    if (rightWidth > 0) canvas.fillRect(rightX, y, rightWidth, height, segments[index]);
  }
}

function searchChartDrawAvatarBadge(canvas, fonts, playerName, avatar, x, y, size, color) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  hourlyBlendCircle(canvas, cx, cy, size / 2 + 13, color.orange, 15);
  hourlyBlendCircle(canvas, cx, cy, size / 2 + 9, color.cyan, 16);
  hourlyBlendCircle(canvas, cx, cy, size / 2 + 6, color.violet, 12);
  chartFillCircle(canvas, cx, cy, size / 2 + 3, color.cyan);
  chartFillCircle(canvas, cx, cy, size / 2 + 1, color.orange);
  chartFillCircle(canvas, cx, cy, size / 2 - 2, color.panelDeep);
  if (avatar) {
    canvas.drawImageCover(avatar, x + 3, y + 3, size - 6, size - 6, true);
  } else {
    const initials = historyCardText(String(playerName || "??").replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "??", 2);
    const initialsWidth = canvas.measureFontText(fonts.bold, initials, 27);
    canvas.drawFontText(fonts.bold, initials, cx - initialsWidth / 2, y + 42, 27, color.white, size - 12);
  }
  hourlyBlendCircle(canvas, cx - size * 0.21, cy - size * 0.24, 5, color.white, 45);
}

function searchChartDrawPlayerHeader(canvas, fonts, playerName, rankText, centerX, y, color) {
  const size = 38;
  const name = String(playerName || "").trim() || "Unknown";
  const rankLabel = rankText === "Unranked" ? "Unranked" : `Rank ${String(rankText || "").trim()}`;
  const nameWidth = canvas.measureFontText(fonts.bold, name, size);
  const rankWidth = canvas.measureFontText(fonts.bold, rankLabel, size);
  const nameX = centerX - 86 - nameWidth;
  const rankX = centerX + 86;

  hourlyDrawOutlinedText(canvas, fonts.bold, name, nameX, y, size, color.green, [7, 18, 31, 235], nameWidth + 4);
  hourlyDrawOutlinedText(canvas, fonts.bold, rankLabel, rankX, y, size, color.yellow, [48, 32, 9, 235], rankWidth + 4);
}

function searchChartDrawMetricRow(canvas, fonts, x, y, width, height, metric, index, color) {
  hourlyDrawPlayerRowShell(canvas, x, y, width, height, index, metric.barFraction !== null && metric.barFraction > 0.04, color);
  const rowFont = fonts.rowBold || fonts.bold;
  const textY = hourlyFontRowY(rowFont, y, height, 16);
  hourlyDrawFittedText(canvas, rowFont, metric.label, x + 16, textY, 16, color.muted, 150);

  if (metric.barFraction !== null) {
    const barX = x + 178;
    const barY = y + Math.max(9, Math.floor(height / 2) - 4);
    const barW = 112;
    canvas.fillRect(barX, barY, barW, 8, color.bar);
    canvas.fillRect(barX, barY, Math.max(3, Math.min(barW, Math.round(barW * metric.barFraction))), 8, metric.tone);
  }

  hourlyDrawRightText(canvas, rowFont, metric.value, x + width - 14, textY, 16, metric.tone, width - 190);
}

function searchChartIntervalRows(samples) {
  const rows = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    if (previous.points === null || current.points === null) continue;
    rows.push({
      time: current.t,
      gain: Math.max(0, current.points - previous.points),
      rank: current.rank
    });
  }
  return rows;
}

function searchChartDrawTinyInterval(canvas, fonts, x, y, width, row, index, color) {
  hourlyDrawPlayerRowShell(canvas, x, y, width, 19, index, row.gain > 0, color);
  const textY = hourlyFontRowY(fonts.rowBold || fonts.bold, y, 19, 13);
  hourlyDrawFittedText(canvas, fonts.rowBold || fonts.bold, chartTimeOfDayAxisLabel(row.time), x + 10, textY, 13, color.muted, 94);
  hourlyDrawFittedText(canvas, fonts.rowBold || fonts.bold, `+${shortNumber(row.gain)}`, x + 122, textY, 13, row.gain > 0 ? color.green : color.zeroText, 108);
  hourlyDrawRightText(canvas, fonts.rowBold || fonts.bold, rank(row.rank), x + width - 10, textY, 13, color.red, 98);
}

function searchChartDrawPolyline(canvas, points, xFor, yFor, rgba, width = 2) {
  if (!Array.isArray(points) || points.length < 2) return;
  for (let index = 1; index < points.length; index += 1) {
    chartDrawLine(canvas, xFor(points[index - 1]), yFor(points[index - 1]), xFor(points[index]), yFor(points[index]), rgba, width);
  }
}

function searchChartDrawDashedVertical(canvas, x, y1, y2, rgba, dash = 8, gap = 6) {
  const left = Math.round(x);
  for (let y = y1; y < y2; y += dash + gap) {
    canvas.fillRect(left, y, 2, Math.min(dash, y2 - y), rgba);
  }
}

function searchChartDrawRightText(canvas, font, value, rightX, y, size, rgba, maxWidth, background) {
  const fitted = canvas.fitFontText(font, historyCardText(value, 10000), size, maxWidth);
  const width = canvas.measureFontText(font, fitted, size);
  chartDrawBackedText(canvas, font, fitted, rightX - width, y, size, rgba, width + 2, background);
}

function searchChartDrawActivityBar(canvas, samples, plot, xForTime, activeColor, downtimeColor, unknownColor, color, options = {}) {
  const barY = options.y ?? plot.y + plot.h + 54;
  const barHeight = options.height ?? 11;
  const rangeStart = Number.isFinite(options.rangeStart) ? options.rangeStart : samples[0]?.t;
  const rangeEnd = Number.isFinite(options.rangeEnd) ? options.rangeEnd : samples[samples.length - 1]?.t;
  const gapColor = unknownColor || color.zero;
  const maxGapMs = Number.isFinite(options.maxGapMs) ? options.maxGapMs : SEARCH_CHART_MAX_OBSERVED_GAP_MS;
  canvas.fillRect(plot.x, barY, plot.w, barHeight, gapColor);

  if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd) || rangeEnd <= rangeStart) {
    return;
  }

  const orderedSamples = samples
    .filter(sample => Number.isFinite(sample?.t))
    .sort((left, right) => left.t - right.t);

  if (orderedSamples.length < 2) {
    return;
  }

  for (let index = 1; index < orderedSamples.length; index += 1) {
    const previous = orderedSamples[index - 1];
    const current = orderedSamples[index];
    if (!Number.isFinite(previous.t) || !Number.isFinite(current.t) || current.t <= previous.t) continue;
    if (current.t - previous.t > maxGapMs) continue;

    const x1 = Math.max(plot.x, Math.min(plot.x + plot.w, xForTime(Math.max(rangeStart, previous.t))));
    const x2 = Math.max(plot.x, Math.min(plot.x + plot.w, xForTime(Math.min(rangeEnd, current.t))));
    if (x2 <= x1) continue;
    const width = Math.max(1, x2 - x1);
    const gained = current.points !== null && previous.points !== null && current.points > previous.points;
    canvas.fillRect(x1, barY, width, barHeight, gained ? activeColor : downtimeColor);
  }
}

function searchChartMetrics(samples, rangeStart = null, rangeEnd = null) {
  let activeMs = 0;
  let downtimeMs = 0;
  let unknownMs = 0;
  const start = Number.isFinite(rangeStart) ? rangeStart : samples[0]?.t;
  const end = Number.isFinite(rangeEnd) ? rangeEnd : samples[samples.length - 1]?.t;

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { activeMs: 0, downtimeMs: 0, unknownMs: 0, activePct: 0, downtimePct: 0, unknownPct: 0 };
  }

  const orderedSamples = samples
    .filter(sample => Number.isFinite(sample?.t))
    .sort((left, right) => left.t - right.t);

  if (orderedSamples.length < 2) {
    return { activeMs: 0, downtimeMs: 0, unknownMs: Math.max(0, end - start), activePct: 0, downtimePct: 0, unknownPct: 100 };
  }

  const first = orderedSamples[0];
  if (Number.isFinite(first?.t) && first.t > start) {
    unknownMs += Math.max(0, Math.min(end, first.t) - start);
  }

  for (let index = 1; index < orderedSamples.length; index += 1) {
    const previous = orderedSamples[index - 1];
    const current = orderedSamples[index];
    if (!Number.isFinite(previous.t) || !Number.isFinite(current.t) || current.t <= previous.t) continue;

    const intervalStart = Math.max(start, previous.t);
    const intervalEnd = Math.min(end, current.t);
    const duration = Math.max(0, intervalEnd - intervalStart);
    if (!duration) continue;
    if (current.t - previous.t > SEARCH_CHART_MAX_OBSERVED_GAP_MS) {
      unknownMs += duration;
      continue;
    }

    const gained = current.points !== null && previous.points !== null && current.points > previous.points;
    if (gained) activeMs += duration;
    else downtimeMs += duration;
  }

  const last = orderedSamples[orderedSamples.length - 1];
  if (Number.isFinite(last?.t) && last.t < end) {
    unknownMs += Math.max(0, end - Math.max(start, last.t));
  }

  const total = activeMs + downtimeMs + unknownMs;
  return {
    activeMs,
    downtimeMs,
    unknownMs,
    activePct: total ? (activeMs / total) * 100 : 0,
    downtimePct: total ? (downtimeMs / total) * 100 : 0,
    unknownPct: total ? (unknownMs / total) * 100 : 0
  };
}

function searchChartGain(samples, minutes) {
  if (!samples.length) return 0;
  const latest = samples[samples.length - 1];
  if (latest.points === null) return 0;

  const target = latest.t - minutes * 60 * 1000;
  let baseline = null;
  for (const sample of samples) {
    if (sample.t <= target && sample.points !== null) baseline = sample;
  }
  if (!baseline) baseline = samples.find(sample => sample.points !== null) || null;
  return Math.max(0, latest.points - (baseline?.points ?? latest.points));
}

function searchChartRankDelta(samples, minutes) {
  if (!samples.length) return null;
  const latest = [...samples].reverse().find(sample => sample.rank !== null);
  if (!latest) return null;

  const target = latest.t - minutes * 60 * 1000;
  let baseline = null;
  for (const sample of samples) {
    if (sample.t <= target && sample.rank !== null) baseline = sample;
  }
  if (!baseline) baseline = samples.find(sample => sample.rank !== null) || null;
  if (!baseline || baseline === latest) return null;
  return baseline.rank - latest.rank;
}

function searchChartSignedLabel(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) return "0";
  const prefix = number > 0 ? "+" : "";
  return `${prefix}${Math.round(number).toLocaleString("en-US")}`;
}

function searchChartDurationLabel(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "0m";
  const minutes = Math.round(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const leftover = minutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const dayHours = hours % 24;
    return dayHours ? `${days}d ${dayHours}h` : `${days}d`;
  }
  if (hours > 0) return leftover ? `${hours}h ${leftover}m` : `${hours}h`;
  return `${minutes}m`;
}

function searchChartPercentLabel(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : "-";
}

async function completeServerTrackerInteraction(interaction, env, commandName, subcommand) {
  try {
    const guildId = String(interaction.guild_id || "").trim();
    const channelId = String(interaction.channel_id || "").trim();
    const actorId = interactionUserId(interaction);
    if (!guildId) throw httpError(400, "Private-server tracking is only available inside a Discord server.");

    let payload;

    if (commandName === "add" && subcommand === "server") {
      const serverLink = getCommandOption(interaction, "link");
      if (!serverLink) throw httpError(400, "Use `/add server link:<private server link>`.");

      payload = await serverTrackerApiRequest(env, "/api/tracker/server/add", {
        method: "POST",
        body: {
          guild_id: guildId,
          actor_id: actorId,
          actor_username: interactionUsername(interaction),
          server_link: serverLink,
          place_id: getCommandOption(interaction, "place_id") || undefined
        }
      });
    } else if (commandName === "remove" && subcommand === "server") {
      const serverId = getCommandOption(interaction, "server_id");
      if (!serverId) throw httpError(400, "Use `/remove server server_id:1`.");

      payload = await serverTrackerApiRequest(env, "/api/tracker/server/remove", {
        method: "POST",
        body: {
          guild_id: guildId,
          actor_id: actorId,
          server: `#${serverId}`
        }
      });
    } else if (commandName === "server" && subcommand === "assign") {
      const configuredChannel = getCommandOption(interaction, "channel");
      if (!configuredChannel) throw httpError(400, "Use `/server assign channel:<channel>`.");

      payload = await serverTrackerApiRequest(env, "/api/tracker/tracking", {
        method: "POST",
        body: {
          guild_id: guildId,
          channel_id: configuredChannel,
          actor_id: actorId,
          enabled: true,
          assign_channel: true
        }
      });
    } else if (commandName === "server" && subcommand === "tracker") {
      const configuredChannel = getCommandOption(interaction, "channel") || "";

      payload = await serverTrackerApiRequest(env, "/api/tracker/tracking", {
        method: "POST",
        body: {
          guild_id: guildId,
          channel_id: configuredChannel,
          actor_id: actorId,
          enabled: true,
          assign_channel: Boolean(configuredChannel)
        }
      });
    } else if (commandName === "luna" && subcommand === "admin") {
      const roleId = getCommandOption(interaction, "role");
      if (!roleId) throw httpError(400, "Use `/luna admin role:<role>`.");

      payload = await serverTrackerApiRequest(env, "/api/tracker/admin-role", {
        method: "POST",
        body: {
          guild_id: guildId,
          actor_id: actorId,
          admin_role_id: roleId
        }
      });
    } else {
      throw httpError(400, `Unknown /${commandName} action.`);
    }

    await editOriginalInteraction(
      interaction,
      buildServerTrackerCommandMessage(commandName, subcommand, payload)
    );
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `Private-server tracker failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

function buildServerTrackerCommandMessage(commandName, subcommand, payload) {
  if (commandName === "add" && subcommand === "server") {
    const server = payload.server || {};
    const visibleId = server.server_number ? `#${server.server_number}` : "#?";
    const observer = payload.observer_username
      ? ` Add **${escapeDiscordMarkdown(payload.observer_username)}** to the private server's allow list.`
      : " Add the observer Roblox account to the private server's allow list.";

    return {
      content: payload.resolved
        ? `${visibleId} was ${payload.action || "added"} and matched successfully.`
        : `${visibleId} was ${payload.action || "added"} and saved as pending.${observer}`,
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    };
  }

  if (commandName === "remove" && subcommand === "server") {
    const server = payload.server || {};
    const visibleId = server.server_number ? `#${server.server_number}` : "#?";
    return {
      content: `${visibleId} was removed from active tracking. Its observation history was preserved.`,
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    };
  }

  if (commandName === "server" && subcommand === "assign") {
    const guild = payload.guild || payload.state?.guild || {};
    const channelId = String(guild.channel_id || "").trim();
    return {
      content: channelId
        ? `The private-server tracker is assigned to <#${channelId}> and will only refresh there.`
        : "The private-server tracker channel was assigned.",
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    };
  }

  if (commandName === "server" && subcommand === "tracker") {
    const guild = payload.guild || payload.state?.guild || {};
    const channelId = String(guild.channel_id || "").trim();
    return {
      content: channelId
        ? `The persistent private-server tracker was refreshed in <#${channelId}>. Use \`/server assign\` to move it.`
        : "No private-server tracker channel is assigned yet. Use `/server assign channel:<channel>`.",
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    };
  }

  if (commandName === "luna" && subcommand === "admin") {
    const roleId = String(payload.admin_role_id || payload.role_id || "").trim();
    return {
      content: roleId
        ? `Luna administrator role set to <@&${roleId}>.`
        : "Luna administrator role was updated.",
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    };
  }

  return {
    content: "Private-server tracker action completed.",
    embeds: [],
    components: [],
    allowed_mentions: { parse: [] }
  };
}

async function completeHatchInteraction(interaction, env, subcommand) {
  let discordUserId = "";
  let discordUsername = "";
  try {
    discordUserId = interactionUserId(interaction);
    discordUsername = interactionUsername(interaction);
    if (!discordUserId) throw httpError(400, "Discord user identity was not included in the interaction.");

    let payload;
    if (subcommand === "tracker") {
      const account = getCommandOption(interaction, "account");
      const guildId = String(interaction.guild_id || "").trim();
      payload = account
        ? await hatchApiRequest(env, "/api/hatch/oauth/start", {
          method: "POST",
          body: {
            discord_user_id: discordUserId,
            discord_username: discordUsername,
            guild_id: guildId || null,
            account
          }
        })
        : await hatchApiRequest(env, "/api/hatch/tracker/status", {
          query: { discord_user_id: discordUserId }
        });
      await editOriginalInteraction(interaction, buildHatchSetupMessage(payload, {
        discordUserId,
        page: 0,
        env,
        account
      }));
      return;
    }

    if (subcommand === "accounts") {
      payload = await hatchApiRequest(env, "/api/hatch/tracker/status", {
        query: { discord_user_id: discordUserId }
      });
      await editOriginalInteraction(interaction, buildHatchTrackerMessage(payload, {
        mode: subcommand,
        discordUserId
      }));
      return;
    }

    if (subcommand === "assign") {
      const guildId = String(interaction.guild_id || "").trim();
      const sourceChannelId = interactionSourceChannelId(interaction);
      const requestedChannelId = String(getCommandOption(interaction, "channel") || sourceChannelId).trim();
      if (!guildId) throw httpError(400, "HTG hatch alerts can only be assigned inside a Discord server.");
      const channel = await resolveHourlyClanChannel(interaction, env, requestedChannelId);
      if (!HOURLY_CLAN_ALLOWED_CHANNEL_TYPES.has(Number(channel.type))) {
        throw httpError(400, "Select a text channel, announcement channel, or existing Discord thread.");
      }

      payload = await hatchApiRequest(env, "/api/hatch/guild-config", {
        method: "POST",
        body: {
          guild_id: guildId,
          channel_id: requestedChannelId,
          channel_type: Number(channel.type),
          assigned_by: discordUserId,
          enabled: true
        }
      });

      await editOriginalInteraction(interaction, {
        content: payload.config
          ? `HTG hatch alerts are assigned to <#${requestedChannelId}>. Only accounts explicitly enabled in this server can post here; another server's setup will not send alerts here.`
          : `HTG hatch-alert assignment was saved for <#${requestedChannelId}>.`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] },
        flags: MESSAGE_FLAG_EPHEMERAL
      });
      return;
    }

    payload = await hatchApiRequest(env, "/api/hatch/tracker", {
      method: "POST",
      body: {
        action: subcommand,
        tier: getCommandOption(interaction, "tier") || "all",
        account: getCommandOption(interaction, "account") || "all",
        discord_user_id: discordUserId,
        discord_username: discordUsername,
        guild_id: String(interaction.guild_id || "").trim() || null
      }
    });
    await editOriginalInteraction(interaction, buildHatchTrackerMessage(payload, {
      mode: subcommand,
      discordUserId
    }));
  } catch (err) {
    if (subcommand === "tracker") {
      await editOriginalInteraction(interaction, buildHatchSetupMessage({
        ok: false,
        tracker: {},
        setup_error: err?.message || String(err)
      }, {
        discordUserId,
        page: 0,
        env
      })).catch(() => null);
      return;
    }

    await editOriginalInteraction(interaction, {
      content: `Hatch tracker failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] },
      flags: MESSAGE_FLAG_EPHEMERAL
    }).catch(() => null);
  }
}

function handleHtgSetupComponent(interaction, env, ctx, state) {
  const userId = interactionUserId(interaction);
  if (!userId || userId !== state.ownerId) {
    return messageResponse("Only the person who ran `/htg setup` can use these setup controls.", true);
  }

  ctx.waitUntil(completeHtgSetupPageInteraction(interaction, env, state));
  return { type: INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE };
}

async function completeHtgSetupPageInteraction(interaction, env, state) {
  const discordUserId = interactionUserId(interaction);
  const discordUsername = interactionUsername(interaction);
  const page = normalizedHtgSetupPage(state.page);
  let payload;

  try {
    payload = await hatchApiRequest(env, "/api/hatch/tracker/status", {
      query: { discord_user_id: discordUserId }
    });
  } catch (err) {
    payload = {
      ok: false,
      tracker: {},
      setup_error: err?.message || String(err)
    };
  }

  await editOriginalInteraction(interaction, buildHatchSetupMessage(payload, {
    discordUserId,
    page,
    env
  }));
}

function buildHatchSetupMessage(payload, context = {}) {
  const page = normalizedHtgSetupPage(context.page);
  const pages = htgSetupPages(payload, context);
  const current = pages[page];
  const fullAuthUrl = htgFullAuthorizeUrl(payload);
  const authUrl = htgDiscordButtonUrl(payload);
  const setupError = String(payload.setup_error || "").trim();
  const imageUrl = htgSetupPageImageUrl(context.env, page);
  const thumbnailUrl = String(context.env?.HTG_SETUP_THUMBNAIL_URL || LUNA_REWARD_THUMBNAIL_URL || "").trim();
  const footerLines = [];
  if (page === 0 && setupError) {
    footerLines.push(`-# Setup issue: ${escapeDiscordMarkdown(setupError)}`);
  } else if (page === 0 && !fullAuthUrl) {
    footerLines.push("-# No auth button was generated. Run `/htg setup account:<roblox username>` again.");
  }

  const titleText = {
    type: COMPONENT_TYPE_TEXT_DISPLAY,
    content: `## Step ${page + 1}/${pages.length}`
  };
  const bodyText = {
    type: COMPONENT_TYPE_TEXT_DISPLAY,
    content: current.body
  };
  const components = [
    thumbnailUrl
      ? {
          type: COMPONENT_TYPE_SECTION,
          components: [titleText],
          accessory: {
            type: COMPONENT_TYPE_THUMBNAIL,
            media: { url: thumbnailUrl },
            description: "HTG hatch tracker"
          }
        }
      : titleText,
    { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
    bodyText
  ];

  if (imageUrl) {
    components.push(
      { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
      {
        type: COMPONENT_TYPE_MEDIA_GALLERY,
        items: [
          {
            media: { url: imageUrl },
            description: `HTG setup step ${page + 1}`
          }
        ]
      }
    );
  }

  const afterImageBody = String(current.afterImageBody || "").trim();
  if (afterImageBody) {
    components.push(
      { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
      {
        type: COMPONENT_TYPE_TEXT_DISPLAY,
        content: afterImageBody
      }
    );
  }

  components.push(
    { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
    {
      type: COMPONENT_TYPE_ACTION_ROW,
      components: htgSetupButtons({
        ownerId: context.discordUserId,
        page,
        pageCount: pages.length,
        authUrl
      })
    }
  );

  if (footerLines.length) {
    components.push({
      type: COMPONENT_TYPE_TEXT_DISPLAY,
      content: footerLines.join("\n")
    });
  }

  return {
    components: [
      {
        type: COMPONENT_TYPE_CONTAINER,
        accent_color: setupError ? 0xff6b72 : 0xff9f43,
        components
      }
    ],
    embeds: [],
    allowed_mentions: { parse: [] },
    flags: MESSAGE_FLAG_COMPONENTS_V2 | MESSAGE_FLAG_EPHEMERAL
  };
}

function htgSetupPages(payload, context = {}) {
  const fullAuthUrl = htgFullAuthorizeUrl(payload);
  const buttonAuthUrl = htgDiscordButtonUrl(payload);
  const targetAccount = String(payload?.username || payload?.user_id || context.account || "").trim();
  const targetLabel = targetAccount
    ? escapeDiscordMarkdown(targetAccount)
    : "the Roblox account you put in the command";
  const connectInstructions = fullAuthUrl
    ? buttonAuthUrl
      ? `Click the Connect Big Games DB button to approve inventory access for ${targetLabel}.`
      : "I could not create a Discord-safe authorization button. Ask an admin to check `HATCH_OAUTH_PUBLIC_BASE`, then run `/htg setup` again."
    : "Run `/htg setup account:<roblox username>` to create an account-bound Big Games DB authorization link.";

  return [
    {
      title: "Connect",
      body: [
        "If you haven't already linked your ROBLOX account to the Big Games DB then you will need to for this feature to work: https://db.biggames.io/",
        "",
        connectInstructions,
        "Make sure you approve the same linked Roblox account that you put in the command.",
        "",
        "Then, click `Approve access`"
      ].join("\n"),
      afterImageBody: "Note: This will **NOT** make your inventory public."
    },
    {
      title: "Enable",
      body: [
        "That's it, basically! Just use the server commands to enable the alerts, because you can disable them later. :wink:"
      ].join("\n"),
      afterImageBody: [
        "```",
        "/htg enable [user]",
        "/htg disable [user]",
        "/htg accounts - lists all accounts associated with your Discord Account",
        "```",
        "",
        "If you're a server owner or administrator you'll need to run this to assign the channel where it posts to:",
        "",
        "`/htg assign [channel]`",
        "",
        "Then watch the titanics roll in! :light_blue_heart:"
      ].join("\n")
    }
  ];
}

function htgSetupButtons({ ownerId, page, pageCount, authUrl }) {
  const controls = [];
  if (page > 0) {
    controls.push({
      type: COMPONENT_TYPE_BUTTON,
      style: BUTTON_STYLE_SECONDARY,
      label: "Back",
      custom_id: htgSetupCustomId(ownerId, page - 1)
    });
  }

  if (authUrl) {
    controls.push({
      type: COMPONENT_TYPE_BUTTON,
      style: BUTTON_STYLE_LINK,
      label: "Connect Big Games DB",
      url: authUrl
    });
  }

  if (page < pageCount - 1) {
    controls.push({
      type: COMPONENT_TYPE_BUTTON,
      style: BUTTON_STYLE_PRIMARY,
      label: "Next",
      custom_id: htgSetupCustomId(ownerId, page + 1)
    });
  }

  if (!controls.length) {
    controls.push({
      type: COMPONENT_TYPE_BUTTON,
      style: BUTTON_STYLE_SECONDARY,
      label: "Start Over",
      custom_id: htgSetupCustomId(ownerId, 0)
    });
  }

  return controls.slice(0, 5);
}

function htgDiscordButtonUrl(payload) {
  const fullUrl = htgFullAuthorizeUrl(payload);
  if (fullUrl && fullUrl.length <= 512) return fullUrl;
  const shortUrl = htgShortAuthorizeUrl(payload);
  return shortUrl && shortUrl.length <= 512 ? shortUrl : "";
}

function htgFullAuthorizeUrl(payload) {
  return String(payload?.authorize_url || "").trim();
}

function htgShortAuthorizeUrl(payload) {
  return String(payload?.short_authorize_url || "").trim();
}

function parseHtgSetupCustomId(value) {
  const parts = String(value || "").split("|");
  if (parts[0] !== "htgsetup") return null;
  const ownerId = String(parts[1] || "").trim();
  const page = normalizedHtgSetupPage(parts[2]);
  return ownerId ? { ownerId, page } : null;
}

function htgSetupCustomId(ownerId, page) {
  return `htgsetup|${String(ownerId || "").trim()}|${normalizedHtgSetupPage(page)}`;
}

function normalizedHtgSetupPage(value) {
  const page = Math.round(Number(value));
  if (!Number.isFinite(page) || page < 0) return 0;
  return Math.min(1, page);
}

function htgSetupPageImageUrl(env, page) {
  const urls = htgSetupImageUrls(env);
  return urls[normalizedHtgSetupPage(page)] || "";
}

function htgSetupImageUrls(env) {
  const defaults = [...DEFAULT_HTG_SETUP_STEP_IMAGE_URLS];
  const jsonText = String(env?.HTG_SETUP_STEP_IMAGES_JSON || "").trim();
  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        return [0, 1].map(index => String(parsed[index] || defaults[index] || "").trim());
      }
      if (parsed && typeof parsed === "object") {
        return [0, 1].map(index => String(parsed[index + 1] || parsed[index] || defaults[index] || "").trim());
      }
    } catch {}
  }

  const configured = parseCsv(env?.HTG_SETUP_STEP_IMAGE_URLS)
    .map(value => String(value || "").trim());
  return [0, 1].map(index => configured[index] || defaults[index] || "");
}

function buildHatchTrackerMessage(payload, context = {}) {
  const tracker = payload.tracker || {};
  const authUrl = htgDiscordButtonUrl(payload);
  const accounts = Array.isArray(tracker.accounts) ? tracker.accounts : [];
  const accountLines = accounts.length
    ? accounts.slice(0, 12).map(hatchTrackerAccountLine)
    : ["No Roblox accounts are connected yet."];
  if (accounts.length > 12) {
    accountLines.push(`-# ${accounts.length - 12} more connected account${accounts.length - 12 === 1 ? "" : "s"} hidden.`);
  }
  const intro = context.mode === "tracker"
    ? "Connect your Big Games DB inventory access, then enable hatch alerts when ready."
    : context.mode === "accounts"
      ? "These are the Roblox accounts Luna has connected for your Discord account."
    : payload.message || "Hatch tracker updated.";

  const components = [
    {
      type: COMPONENT_TYPE_TEXT_DISPLAY,
      content: [
        "## Huge / Titanic / Gargantuan Tracker",
        intro,
        "",
        `**Connected accounts:** ${tracker.connected_account_count || 0}/${tracker.account_count || 0}`,
        `**Enabled accounts:** ${tracker.enabled_account_count || 0}`,
        "",
        ...accountLines,
        "",
        "`/htg enable tier:<choice>` turns alerts on for all connected alts by default.",
        "`/htg enable tier:<choice> account:<name or id>` changes only one alt.",
        "`/htg disable tier:<choice>` works the same way."
      ].join("\n")
    }
  ];

  if (authUrl) {
    components.push(
      { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
      {
        type: COMPONENT_TYPE_ACTION_ROW,
        components: [
          {
            type: COMPONENT_TYPE_BUTTON,
            style: BUTTON_STYLE_LINK,
            label: "Connect Big Games DB",
            url: authUrl
          }
        ]
      }
    );
  }

  return {
    components: [
      {
        type: COMPONENT_TYPE_CONTAINER,
        accent_color: 0xff9b96,
        components
      }
    ],
    embeds: [],
    allowed_mentions: { parse: [] },
    flags: MESSAGE_FLAG_COMPONENTS_V2 | MESSAGE_FLAG_EPHEMERAL
  };
}

function hatchTrackerAccountLine(account) {
  const name = escapeDiscordMarkdown(String(account.roblox_username || account.roblox_user_id || "Unknown"));
  const id = account.roblox_user_id ? ` (${account.roblox_user_id})` : "";
  const tiers = Array.isArray(account.enabled_tiers) && account.enabled_tiers.length
    ? account.enabled_tiers.map(hatchTierDisplayName).join(", ")
    : "None";
  const auth = account.connected
    ? account.authorization_expires_at
      ? `auth expires ${discordTime(account.authorization_expires_at)}`
      : "auth active"
    : authorizationIsExpired(account.authorization_expires_at)
      ? "auth expired"
      : account.reauthorization_required
        ? "auth needs refresh"
      : account.authorization_missing
        ? "auth missing"
        : account.authorization_message
          ? "auth unavailable"
          : "auth not connected";
  return `- **${name}${id}:** ${account.enabled ? "Enabled" : "Disabled"} | ${tiers} | ${auth}`;
}

function authorizationIsExpired(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) && time > 0 && time <= Date.now();
}

function hatchTierDisplayName(tier) {
  const normalized = String(tier || "").toLowerCase();
  if (normalized === "gargantuan") return "Gargantuan";
  if (normalized === "titanic") return "Titanic";
  if (normalized === "huge") return "Huge";
  return normalized || "Unknown";
}

async function completeHourlyClanInteraction(interaction, env) {
  try {
    const subcommand = getSubcommandName(interaction);
    const guildId = String(interaction.guild_id || "").trim();
    const sourceChannelId = interactionSourceChannelId(interaction);
    const actorId = interactionUserId(interaction);
    const clan = String(getCommandOption(interaction, "clan") || "").trim();
    const username = String(getCommandOption(interaction, "username") || getCommandOption(interaction, "user_name") || "").trim();
    const league = String(getCommandOption(interaction, "league") || getCommandOption(interaction, "name") || "").trim();
    const requestedChannelId = String(getCommandOption(interaction, "channel") || sourceChannelId).trim();

    if (!guildId) throw httpError(400, "Hourly posts can only be assigned inside a Discord server.");

    if (subcommand === "remove") {
      const assignmentPayload = await hourlyClanApiRequest(env, "/api/discord/hourly-assignments", {
        method: "DELETE",
        body: {
          guild_id: guildId,
          channel_id: requestedChannelId,
          removed_by: actorId
        }
      });
      const destination = `<#${requestedChannelId}>`;

      await editOriginalInteraction(interaction, {
        content: assignmentPayload.removed
          ? `Hourly reporting was removed from ${destination}. Luna will stop posting hourly pictures there.`
          : `No hourly reporting assignment was found for ${destination}.`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (subcommand === "alert") {
      const alertUserId = String(getCommandOption(interaction, "user") || "").trim();
      if (!/^\d{5,30}$/.test(alertUserId)) {
        throw httpError(400, "Use `/hourly alert user:<user> channel:<text channel or thread>`.");
      }

      const channel = await resolveHourlyClanChannel(interaction, env, requestedChannelId);
      if (!HOURLY_CLAN_ALLOWED_CHANNEL_TYPES.has(Number(channel.type))) {
        throw httpError(400, "Select a text channel, announcement channel, or existing Discord thread.");
      }

      const assignmentPayload = await hourlyClanApiRequest(env, "/api/discord/hourly-assignments", {
        method: "PATCH",
        body: {
          channel_id: requestedChannelId,
          alert_user_id: alertUserId,
          alert_set_by: actorId
        }
      });
      const destination = `<#${requestedChannelId}>`;

      await editOriginalInteraction(interaction, {
        content: assignmentPayload.assignment
          ? `Hourly alerts for ${destination} will mention <@${alertUserId}> when Luna posts the picture.`
          : `No hourly reporting assignment was found for ${destination}. Assign one first with \`/hourly clan\`, \`/hourly user\`, or \`/hourly league\`.`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    const targetType = subcommand === "user" ? "user" : subcommand === "league" ? "league" : "clan";
    const targetName = targetType === "user" ? username : targetType === "league" ? league : clan;
    if (!targetName) {
      throw httpError(400,
        targetType === "user"
          ? "Use `/hourly user username:<roblox username> channel:<text channel or thread>`."
          : targetType === "league"
            ? "Use `/hourly league league:<league name> channel:<text channel or thread>`."
            : "Use `/hourly clan clan:<clan name> channel:<text channel or thread>`."
      );
    }

    const channel = await resolveHourlyClanChannel(interaction, env, requestedChannelId);
    if (!HOURLY_CLAN_ALLOWED_CHANNEL_TYPES.has(Number(channel.type))) {
      throw httpError(400, "Select a text channel, announcement channel, or existing Discord thread.");
    }

    const assignmentPayload = await hourlyClanApiRequest(env, "/api/discord/hourly-assignments", {
      method: "POST",
      body: {
        guild_id: guildId,
        channel_id: requestedChannelId,
        channel_type: Number(channel.type),
        clan_name: hourlyStoredAssignmentTarget(targetType, targetName),
        assigned_by: actorId,
        enabled: true
      }
    });
    const assignment = assignmentPayload.assignment || {
      guild_id: guildId,
      channel_id: requestedChannelId,
      channel_type: Number(channel.type),
      clan_name: hourlyStoredAssignmentTarget(targetType, targetName),
      assigned_by: actorId,
      enabled: true
    };

    let preview;
    try {
      preview = await deliverHourlyClanAssignment(env, assignment, { force: true });
    } catch (err) {
      preview = { ok: false, error: err?.message || String(err) };
    }

    const destination = `<#${requestedChannelId}>`;
    const targetLabel = targetType === "user" ? "user" : targetType === "league" ? "league" : "clan";
    await editOriginalInteraction(interaction, {
      content: preview.ok && preview.skipped
        ? `Hourly ${targetLabel} picture for **${escapeDiscordMarkdown(targetName)}** is assigned to ${destination}, but posting is paused: ${escapeDiscordMarkdown(preview.message || preview.reason || "no recognized event is active")}`
        : preview.ok
          ? `Hourly ${targetLabel} picture for **${escapeDiscordMarkdown(targetName)}** is assigned to ${destination}. The first image was posted and Luna will refresh it hourly.`
          : `Hourly ${targetLabel} picture for **${escapeDiscordMarkdown(targetName)}** is assigned to ${destination}, but the first image could not be posted: ${escapeDiscordMarkdown(preview.error || "unknown error")}`,
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    });
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `Hourly assignment failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

async function completeOfflinePingInteraction(interaction, env) {
  try {
    const offlinePath = getOfflineSubcommandPath(interaction);
    const subcommand = offlinePath.group || offlinePath.subcommand;
    const assignTarget = offlinePath.group === "assign" ? offlinePath.subcommand : "";
    const guildId = String(interaction.guild_id || "").trim();
    const sourceChannelId = interactionSourceChannelId(interaction);
    const actorId = interactionUserId(interaction);

    if (!guildId) throw httpError(400, "Offline pings can only be configured inside a Discord server.");

    if (subcommand === "mode") {
      const clansOption = getCommandBooleanOption(interaction, "clans");
      const leaguesOption = getCommandBooleanOption(interaction, "leagues");
      const usersOption = getCommandBooleanOption(interaction, "users");
      const hasClansOption = clansOption !== null;
      const hasLeaguesOption = leaguesOption !== null;
      const hasUsersOption = usersOption !== null;
      if (!hasClansOption && !hasLeaguesOption && !hasUsersOption) {
        throw httpError(400, "Choose at least one setting, for example `/offline mode clans:true leagues:false users:false`.");
      }
      // `/offline mode` is the sole on/off control for each source. Keep the
      // legacy overall flag on so an older `/offline disable` cannot block a
      // newly selected source mode.
      const body = { guild_id: guildId, enabled: true, updated_by: actorId };
      if (hasClansOption) body.clan_watches_enabled = clansOption;
      if (hasLeaguesOption) body.league_watches_enabled = leaguesOption;
      if (hasUsersOption) body.user_watches_enabled = usersOption;
      const payload = await hourlyClanApiRequest(env, "/api/offline/config", {
        method: "PATCH",
        body
      });
      const config = payload.config || {};
      await editOriginalInteraction(interaction, {
        content: `Offline watch modes updated. **Clans:** ${config.clan_watches_enabled === false ? "Off" : "On"} · **Leagues:** ${config.league_watches_enabled === false ? "Off" : "On"} · **Direct users:** ${config.user_watches_enabled === false ? "Off" : "On"}.`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (subcommand === "config") {
      const query = new URLSearchParams({ guild_id: guildId });
      const payload = await hourlyClanApiRequest(env, `/api/offline/status?${query}`, {
        method: "GET"
      });
      await editOriginalInteraction(interaction, buildOfflinePingConfigMessage(payload, {
        guildId,
        ownerId: actorId,
        page: 0
      }));
      return;
    }

    if (subcommand === "assign") {
      if (!["clan", "league", "users"].includes(assignTarget)) {
        throw httpError(400, "Use `/offline assign clan channel:<channel>`, `/offline assign league channel:<channel>`, or `/offline assign users channel:<channel>`.");
      }
      const requestedChannelId = String(getCommandOption(interaction, "channel") || sourceChannelId).trim();
      const channel = await resolveHourlyClanChannel(interaction, env, requestedChannelId);
      if (!HOURLY_CLAN_ALLOWED_CHANNEL_TYPES.has(Number(channel.type))) {
        throw httpError(400, "Select a text channel, announcement channel, or existing Discord thread.");
      }

      const payload = await hourlyClanApiRequest(env, "/api/offline/config", {
        method: "POST",
        body: {
          guild_id: guildId,
          channel_id: requestedChannelId,
          channel_type: Number(channel.type),
          destination_scope: assignTarget,
          assigned_by: actorId,
          updated_by: actorId
        }
      });
      const label = assignTarget === "users"
        ? "Direct user offline pings"
        : assignTarget === "league"
          ? "League offline pings"
          : "Clan offline pings";
      await editOriginalInteraction(interaction, {
        content: `${label} are assigned to <#${requestedChannelId}>. Current threshold: **${payload.config?.minutes_threshold || 30}m** no point gain.`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (subcommand === "minutes") {
      const minutes = Number(getCommandOption(interaction, "number") || getCommandOption(interaction, "minutes"));
      if (!Number.isFinite(minutes) || minutes < 1) throw httpError(400, "Use `/offline minutes number:<minutes>`.");
      const payload = await hourlyClanApiRequest(env, "/api/offline/config", {
        method: "PATCH",
        body: {
          guild_id: guildId,
          minutes_threshold: Math.trunc(minutes),
          updated_by: actorId
        }
      });
      const resetNote = payload.alert_state_reset
        ? " Active no-gain timers were reset so only this threshold is in effect."
        : "";
      await editOriginalInteraction(interaction, {
        content: `Offline threshold is now **${payload.config?.minutes_threshold || Math.trunc(minutes)} minutes** with no point gain.${resetNote}`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (subcommand === "post-rate") {
      const minutes = Number(getCommandOption(interaction, "minutes"));
      if (!Number.isFinite(minutes) || minutes < 1) throw httpError(400, "Use `/offline post-rate minutes:<minutes>`.");
      const payload = await hourlyClanApiRequest(env, "/api/offline/config", {
        method: "PATCH",
        body: {
          guild_id: guildId,
          post_rate_minutes: Math.trunc(minutes),
          updated_by: actorId
        }
      });
      await editOriginalInteraction(interaction, {
        content: `Offline re-alert post rate is now **${payload.config?.post_rate_minutes || Math.trunc(minutes)} minutes**.`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (subcommand === "clan") {
      const clan = String(getCommandOption(interaction, "name") || "").trim();
      if (!clan) throw httpError(400, "Use `/offline clan name:<clan>`.");
      await hourlyClanApiRequest(env, "/api/offline/clans", {
        method: "POST",
        body: {
          guild_id: guildId,
          clan_name: clan,
          created_by: actorId,
          updated_by: actorId
        }
      });
      await editOriginalInteraction(interaction, {
        content: `Offline pings will watch every tracked member in **${escapeDiscordMarkdown(clan)}**. Use \`/offline config\` to confirm the clan alert channel is assigned.`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (subcommand === "league") {
      const league = String(getCommandOption(interaction, "name") || "").trim();
      if (!league) throw httpError(400, "Use `/offline league name:<league>`.");
      await hourlyClanApiRequest(env, "/api/offline/leagues", {
        method: "POST",
        body: {
          guild_id: guildId,
          league_name: league,
          created_by: actorId,
          updated_by: actorId
        }
      });
      await editOriginalInteraction(interaction, {
        content: `Offline pings will watch every tracked member in League **${escapeDiscordMarkdown(league)}**. Use \`/offline config\` to confirm the League alert channel is assigned.`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (subcommand === "remove-clan") {
      const clan = String(getCommandOption(interaction, "name") || "").trim();
      if (!clan) throw httpError(400, "Use `/offline remove-clan name:<clan>`.");
      const payload = await hourlyClanApiRequest(env, "/api/offline/clans", {
        method: "DELETE",
        body: {
          guild_id: guildId,
          clan_name: clan,
          updated_by: actorId
        }
      });
      await editOriginalInteraction(interaction, {
        content: payload.removed
          ? `Offline pings stopped watching **${escapeDiscordMarkdown(clan)}**.`
          : `No offline clan watch was found for **${escapeDiscordMarkdown(clan)}**.`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (subcommand === "remove-league") {
      const league = String(getCommandOption(interaction, "name") || "").trim();
      if (!league) throw httpError(400, "Use `/offline remove-league name:<league>`.");
      const payload = await hourlyClanApiRequest(env, "/api/offline/leagues", {
        method: "DELETE",
        body: {
          guild_id: guildId,
          league_name: league,
          updated_by: actorId
        }
      });
      await editOriginalInteraction(interaction, {
        content: payload.removed
          ? `Offline pings stopped watching League **${escapeDiscordMarkdown(league)}**.`
          : `No offline League watch was found for **${escapeDiscordMarkdown(league)}**.`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (subcommand === "user") {
      const username = String(getCommandOption(interaction, "username") || "").trim();
      const discordUserId = String(getCommandOption(interaction, "discord") || "").trim();
      const clan = String(getCommandOption(interaction, "clan") || "").trim();
      const sourceMode = normalizeOfflineSourceModeOption(getCommandOption(interaction, "source"));
      const requestedChannelId = String(getCommandOption(interaction, "channel") || "").trim();
      if (!username) {
        throw httpError(400, "Use `/offline user username:<roblox name>`. Add `discord:<Discord user>` only to override RoVer.");
      }
      let directChannel = null;
      if (requestedChannelId) {
        directChannel = await resolveHourlyClanChannel(interaction, env, requestedChannelId);
        if (!HOURLY_CLAN_ALLOWED_CHANNEL_TYPES.has(Number(directChannel.type))) {
          throw httpError(400, "Select a text channel, announcement channel, or existing Discord thread.");
        }
      }
      const label = offlineDiscordUserLabel(interaction, discordUserId);
      const payload = await hourlyClanApiRequest(env, "/api/offline/users", {
        method: "POST",
        body: {
          guild_id: guildId,
          username,
          discord_user_id: discordUserId,
          discord_label: label,
          clan_name: clan || null,
          delivery_scope: "users",
          source_mode: sourceMode,
          channel_id: requestedChannelId || null,
          channel_type: directChannel ? Number(directChannel.type) : null,
          created_by: actorId,
          updated_by: actorId
        }
      });
      const warningText = payload.warnings?.length ? `\n-# ${payload.warnings.join(" ")}` : "";
      const channelText = requestedChannelId
        ? ` Alerts for this user will post in <#${requestedChannelId}>.`
        : "";
      const sourceText = sourceMode === "auto" ? "" : ` Source: **${sourceMode === "league" ? "League" : "Clan"}**.`;
      const identityText = discordUserId
        ? `<@${discordUserId}>`
        : "RoVer lookup (when the user has consented in this server)";
      await editOriginalInteraction(interaction, {
        content: `Offline ping mapping saved: **${escapeDiscordMarkdown(username)}** -> ${identityText}.${sourceText}${channelText} Use \`/offline config\` to confirm the alert destination.${warningText}`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (subcommand === "users" || subcommand === "members") {
      const clan = String(getCommandOption(interaction, "clan") || "").trim();
      if (subcommand === "members" && !clan) {
        throw httpError(400, "Use `/offline members clan:<clan> user1:<roblox name> discord1:<Discord user>`.");
      }
      const users = [];
      const pairErrors = [];
      for (let index = 1; index <= 12; index += 1) {
        const username = String(getCommandOption(interaction, `user${index}`) || "").trim();
        const discordUserId = String(getCommandOption(interaction, `discord${index}`) || "").trim();
        if (!username && !discordUserId) continue;
        if (!username) {
          pairErrors.push(`user${index}`);
          continue;
        }
        users.push({
          username,
          discord_user_id: discordUserId,
          discord_label: offlineDiscordUserLabel(interaction, discordUserId),
          clan_name: clan || null,
          delivery_scope: subcommand === "members" ? "clan" : "users"
        });
      }
      if (pairErrors.length) {
        throw httpError(400, `Every supplied Discord override needs its matching Roblox username: ${pairErrors.join(", ")}.`);
      }
      if (!users.length) {
        throw httpError(400, "Add at least one Roblox username, starting with user1. Discord overrides are optional when RoVer is configured.");
      }
      const payload = await hourlyClanApiRequest(env, "/api/offline/users", {
        method: "POST",
        body: {
          guild_id: guildId,
          users,
          created_by: actorId,
          updated_by: actorId
        }
      });
      const warnings = [...(payload.warnings || [])];
      const warningText = warnings.length ? `\n-# ${warnings.slice(0, 5).join(" ")}` : "";
      await editOriginalInteraction(interaction, {
        content: subcommand === "members"
          ? `Saved **${payload.users?.length || users.length}** clan-member ping mapping${(payload.users?.length || users.length) === 1 ? "" : "s"} for **${escapeDiscordMarkdown(clan)}**. Luna uses any Discord overrides you supplied, then RoVer for the rest. Use \`/offline assign clan\` to set its destination.${warningText}`
          : `Saved **${payload.users?.length || users.length}** direct-user ping mapping${(payload.users?.length || users.length) === 1 ? "" : "s"}${clan ? ` with **${escapeDiscordMarkdown(clan)}** as a lookup hint` : ""}. Luna uses any Discord overrides you supplied, then RoVer or Bloxlink for the rest. Use \`/offline assign users\` to set the direct-user alert destination.${warningText}`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (subcommand === "remove-user") {
      const username = String(getCommandOption(interaction, "username") || "").trim();
      if (!username) {
        throw httpError(400, "Use `/offline remove-user username:<roblox name or user id>`.");
      }
      const payload = await hourlyClanApiRequest(env, "/api/offline/users", {
        method: "DELETE",
        body: {
          guild_id: guildId,
          username,
          updated_by: actorId
        }
      });
      const removedCount = payload.removed_count || 0;
      const warningText = payload.warnings?.length ? `\n-# ${payload.warnings.join(" ")}` : "";
      await editOriginalInteraction(interaction, {
        content: removedCount
          ? `Removed **${removedCount}** offline ping assignment${removedCount === 1 ? "" : "s"} for **${escapeDiscordMarkdown(username)}**.${warningText}`
          : `No offline ping assignment was found for **${escapeDiscordMarkdown(username)}**.${warningText}`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (subcommand === "remove-users") {
      const entriesText = String(getCommandOption(interaction, "entries") || "").trim();
      const users = parseOfflineBulkRemoveUserEntries(entriesText);
      if (!users.length) {
        throw httpError(400, "Paste Roblox names or IDs, or use entries like `username: Cinnamowopal username: BEARDED_DRAGONGUY`.");
      }
      const payload = await hourlyClanApiRequest(env, "/api/offline/users", {
        method: "DELETE",
        body: {
          guild_id: guildId,
          users,
          updated_by: actorId
        }
      });
      const removedCount = payload.removed_count || 0;
      const warningText = payload.warnings?.length ? `\n-# ${payload.warnings.slice(0, 5).join(" ")}` : "";
      await editOriginalInteraction(interaction, {
        content: `Removed **${removedCount}** offline ping assignment${removedCount === 1 ? "" : "s"}.${warningText}`,
        embeds: [],
        components: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: offlinePingSetupErrorMessage(err),
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

function offlinePingSetupErrorMessage(err) {
  const message = String(err?.message || err || "Unknown offline ping setup error");
  if (message.includes("delivery_scope") || message.includes("054_discord_offline_member_routing")) {
    return "Offline ping setup failed: apply `supabase/migrations/054_discord_offline_member_routing.sql`, then retry the command.";
  }
  if (message.includes("discord_offline_ping_leagues") || message.includes("PGRST205")) {
    return "Offline ping setup failed: the League watch table is missing in Supabase. Apply `supabase/migrations/050_discord_offline_league_pings.sql`, then retry `/offline league`.";
  }
  return `Offline ping setup failed: ${truncateText(message, 1500)}`;
}

async function completeSelfTimeoutInteraction(interaction, env) {
  const guildId = String(interaction.guild_id || "").trim();
  const userId = interactionUserId(interaction);
  if (!guildId || !userId) {
    await editOriginalInteraction(interaction, {
      content: "Self-timeout failed: missing Discord guild or user ID.",
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
    return;
  }

  const until = new Date(Date.now() + SELF_TIMEOUT_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const result = await setDiscordMemberTimeout(env, guildId, userId, until, `Self-timeout requested with /kms by ${userId}`);
  if (!result.ok) {
    await editOriginalInteraction(interaction, {
      content: `Self-timeout failed: ${result.error}`,
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
    return;
  }

  await editOriginalInteraction(interaction, {
    content: `You have been timed out until <t:${Math.floor(new Date(until).getTime() / 1000)}:F>.`,
    embeds: [],
    components: [],
    allowed_mentions: { parse: [] }
  }).catch(() => null);
}

async function setDiscordMemberTimeout(env, guildId, userId, untilIso, reason = "") {
  const url = `${DISCORD_API_BASE}/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(userId)}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: discordBotHeaders(env, {
      "Content-Type": "application/json",
      "X-Audit-Log-Reason": encodeURIComponent(reason).slice(0, 512)
    }),
    body: JSON.stringify({
      communication_disabled_until: untilIso
    })
  });
  const text = await response.text();
  const payload = parseJsonObject(text) || {};
  if (response.ok) return { ok: true, status: response.status, payload };

  const message = payload.message || text || `Discord returned HTTP ${response.status}.`;
  return {
    ok: false,
    status: response.status,
    error: discordMemberTimeoutErrorMessage(response.status, message, payload)
  };
}

function discordMemberTimeoutErrorMessage(status, message, payload = {}) {
  if (status === 403 || payload.code === 50013) {
    return "Discord rejected it. Luna needs Moderate Members permission, and Luna's role must be above your highest role.";
  }
  if (status === 404) {
    return "Discord could not find your member record in this server.";
  }
  return String(message || "Discord member timeout failed.").slice(0, 500);
}

function offlineDiscordUserLabel(interaction, userId) {
  const user = interaction?.data?.resolved?.users?.[String(userId)] || null;
  return user?.global_name || user?.username || String(userId || "");
}

function normalizeOfflineSourceModeOption(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "clan" || text === "league") return text;
  return "auto";
}

// Six full watch rows leave room for the compact configuration summary and
// avoid Discord's 2,000-character message limit without truncating data.
const OFFLINE_CONFIG_PAGE_SIZE = 6;

function offlineConfigCustomId(ownerId, guildId, page) {
  return [
    "offlineconfig",
    String(ownerId || "").trim(),
    String(guildId || "").trim(),
    Math.max(0, Math.trunc(Number(page) || 0))
  ].join("|");
}

function parseOfflineConfigCustomId(value) {
  const parts = String(value || "").split("|");
  if (parts.length !== 4 || parts[0] !== "offlineconfig") return null;
  const ownerId = String(parts[1] || "").trim();
  const guildId = String(parts[2] || "").trim();
  const page = Math.max(0, Math.trunc(Number(parts[3]) || 0));
  if (!validDiscordSnowflake(ownerId) || !validDiscordSnowflake(guildId)) return null;
  return { ownerId, guildId, page };
}

function handleOfflineConfigComponent(interaction, env, ctx) {
  const state = parseOfflineConfigCustomId(interaction.data?.custom_id);
  if (!state) return messageResponse("That offline configuration page is no longer valid. Run `/offline config` again.", true);
  if (interactionUserId(interaction) !== state.ownerId) {
    return messageResponse("Only the person who ran `/offline config` can use these page controls.", true);
  }
  if (String(interaction.guild_id || "").trim() !== state.guildId) {
    return messageResponse("This offline configuration page belongs to a different Discord server.", true);
  }
  ctx.waitUntil(completeOfflineConfigInteraction(interaction, env, state));
  return { type: INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE };
}

async function completeOfflineConfigInteraction(interaction, env, state) {
  try {
    const query = new URLSearchParams({ guild_id: state.guildId });
    const payload = await hourlyClanApiRequest(env, `/api/offline/status?${query}`, {
      method: "GET"
    });
    await editOriginalInteraction(interaction, buildOfflinePingConfigMessage(payload, state));
  } catch (err) {
    await editOriginalInteraction(interaction, commandErrorMessage("Offline configuration failed", err, env)).catch(() => null);
  }
}

function buildOfflinePingConfigMessage(payload, options = {}) {
  const guildId = String(options.guildId || "").trim();
  const guild = (payload?.guilds || [])
    .find(row => String(row?.config?.guild_id || "") === guildId)
    || null;

  if (!guild) {
    return {
      content: [
        "## Offline Ping Setup",
        "No offline ping config is saved for this server yet.",
        "",
        "Start with `/offline assign clan channel:#channel`, `/offline assign league channel:#channel`, or `/offline assign users channel:#channel`."
      ].join("\n"),
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    };
  }

  const config = guild.config || {};
  const clans = (guild.clans || []).filter(row => row?.enabled !== false);
  const leagues = (guild.leagues || []).filter(row => row?.enabled !== false);
  const users = (guild.users || []).filter(row => row?.enabled !== false);
  const clanMembers = users.filter(row => String(row?.delivery_scope || "users").toLowerCase() === "clan");
  const directUsers = users.filter(row => String(row?.delivery_scope || "users").toLowerCase() !== "clan");
  const clanChannel = formatOfflinePingChannel(config.clan_channel_id || config.channel_id);
  const leagueChannel = formatOfflinePingChannel(config.league_channel_id || config.channel_id);
  const usersChannel = formatOfflinePingChannel(config.users_channel_id || config.channel_id);
  const warnings = [];

  if (clans.length && !validDiscordSnowflake(config.clan_channel_id || config.channel_id)) {
    warnings.push("Clan watches exist, but `/offline assign clan` has not been set.");
  }
  if (leagues.length && !validDiscordSnowflake(config.league_channel_id || config.channel_id)) {
    warnings.push("League watches exist, but `/offline assign league` has not been set.");
  }
  const usersMissingDestination = directUsers.some(row => !validDiscordSnowflake(row.channel_id));
  if (directUsers.length && usersMissingDestination && !validDiscordSnowflake(config.users_channel_id || config.channel_id)) {
    warnings.push("Direct user watches exist, but `/offline assign users` has not been set.");
  }

  const entries = [
    ...clans.map(row => ({
      group: "Watched Clans",
      text: `- **${escapeDiscordMarkdown(row.clan_name || row.clan_key || "Unknown")}**`
    })),
    ...leagues.map(row => ({
      group: "Watched Leagues",
      text: `- **${escapeDiscordMarkdown(row.league_name || row.league_key || "Unknown")}**`
    })),
    ...clanMembers.map(row => ({
      group: "Clan Member Pings",
      text: formatOfflinePingUserRow(row, "clan")
    })),
    ...directUsers.map(row => ({
      group: "Direct User Watches",
      text: formatOfflinePingUserRow(row, "users")
    }))
  ];
  const totalPages = Math.max(1, Math.ceil(entries.length / OFFLINE_CONFIG_PAGE_SIZE));
  const page = clampPage(options.page, totalPages);
  const start = page * OFFLINE_CONFIG_PAGE_SIZE;
  const pageEntries = entries.slice(start, start + OFFLINE_CONFIG_PAGE_SIZE);
  const groupedEntries = [];
  for (const entry of pageEntries) {
    const previous = groupedEntries[groupedEntries.length - 1];
    if (!previous || previous.group !== entry.group) {
      groupedEntries.push({ group: entry.group, rows: [entry.text] });
    } else {
      previous.rows.push(entry.text);
    }
  }

  const lines = [
    "## Offline Ping Setup",
    `**Clan alert channel:** ${clanChannel}`,
    `**League alert channel:** ${leagueChannel}`,
    `**Direct user alert channel:** ${usersChannel}`,
    `**Threshold:** ${Math.max(1, Math.round(Number(config.minutes_threshold) || 30))}m with no point gain`,
    `**Re-alert rate:** ${Math.max(1, Math.round(Number(config.post_rate_minutes) || 30))}m`,
    `**Watch modes:** Clans ${config.clan_watches_enabled === false ? "Off" : "On"} · Leagues ${config.league_watches_enabled === false ? "Off" : "On"} · Direct users ${config.user_watches_enabled === false ? "Off" : "On"}`,
    `**Scheduled checks:** ${payload?.runtime?.ingest_offline_alerts ? "Enabled" : "Disabled"}`,
    `**Last checked:** ${config.last_checked_at ? discordTime(config.last_checked_at) : "Never"}`,
    warnings.length ? `-# ${warnings.join(" ")}` : "",
    "",
    `**Saved watches:** ${clans.length} clan${clans.length === 1 ? "" : "s"} Â· ${leagues.length} League${leagues.length === 1 ? "" : "s"} Â· ${clanMembers.length} clan-member ping${clanMembers.length === 1 ? "" : "s"} Â· ${directUsers.length} direct user${directUsers.length === 1 ? "" : "s"}`,
    entries.length ? `**Showing:** ${start + 1}-${start + pageEntries.length} of ${entries.length} saved watches Â· Page ${page + 1}/${totalPages}` : "**Saved watches:** None yet.",
    "",
    ...(groupedEntries.length
      ? groupedEntries.flatMap(group => [
        `### ${group.group}`,
        ...group.rows
      ])
      : ["Use `/offline clan`, `/offline league`, `/offline user`, or `/offline members` to add watches."])
  ].filter(line => line !== "");

  return {
    content: lines.join("\n"),
    embeds: [],
    components: offlineConfigPageButtons(options.ownerId, guildId, page, totalPages),
    allowed_mentions: { parse: [] }
  };
}

function offlineConfigPageButtons(ownerId, guildId, page, totalPages) {
  if (totalPages <= 1) return [];
  return [{
    type: COMPONENT_TYPE_ACTION_ROW,
    components: [
      historyButton("Previous", offlineConfigCustomId(ownerId, guildId, page - 1), BUTTON_STYLE_SECONDARY, page <= 0),
      historyButton(`Page ${page + 1}/${totalPages}`, offlineConfigCustomId(ownerId, guildId, page), BUTTON_STYLE_SECONDARY, true),
      historyButton("Next", offlineConfigCustomId(ownerId, guildId, page + 1), BUTTON_STYLE_SECONDARY, page >= totalPages - 1)
    ]
  }];
}

function formatOfflinePingListResponse(payload, guildId) {
  return buildOfflinePingConfigMessage(payload, { guildId }).content;
}

function formatOfflinePingCheckResponse(payload) {
  const results = payload?.results || [];
  const lines = [
    "## Offline Check Completed",
    `**Guilds checked:** ${Math.max(0, Math.round(Number(payload?.guilds_checked) || 0))}`,
    `**Offline candidates:** ${Math.max(0, Math.round(Number(payload?.offline_candidates) || 0))}`,
    `**Posts sent:** ${Math.max(0, Math.round(Number(payload?.alerts_posted) || 0))}`,
    `**Scheduled checks:** ${payload?.runtime?.ingest_offline_alerts ? "Enabled" : "Disabled"}`,
    ""
  ];

  if (!results.length) {
    lines.push("No eligible offline ping config was found for this server.");
    lines.push("-# Make sure `/offline assign clan`, `/offline assign league`, or `/offline assign users` is set.");
    return lines.join("\n");
  }

  for (const result of results.slice(0, 5)) {
    const ok = result.ok === false ? "Failed" : "OK";
    const channels = [
      result.clan_channel_id ? `clan <#${result.clan_channel_id}>` : "",
      result.league_channel_id ? `league <#${result.league_channel_id}>` : "",
      result.users_channel_id ? `users <#${result.users_channel_id}>` : "",
      !result.clan_channel_id && !result.league_channel_id && !result.users_channel_id && result.channel_id ? `fallback <#${result.channel_id}>` : ""
    ].filter(Boolean).join(" · ") || "no channel";
    const inactiveModes = [
      result.clan_watches_enabled === false ? "Clans" : "",
      result.league_watches_enabled === false ? "Leagues" : "",
      result.user_watches_enabled === false ? "Direct users" : ""
    ].filter(Boolean);
    lines.push([
      `### ${ok} · ${channels}`,
      `**Watch modes:** Clans ${result.clan_watches_enabled === false ? "Off" : "On"} | Leagues ${result.league_watches_enabled === false ? "Off" : "On"} | Direct users ${result.user_watches_enabled === false ? "Off" : "On"}`,
      `**Watched clans:** ${Math.max(0, Math.round(Number(result.clan_watches) || 0))}`,
      `**Watched Leagues:** ${Math.max(0, Math.round(Number(result.league_watches) || 0))}`,
      `**Direct users:** ${Math.max(0, Math.round(Number(result.user_watches) || 0))}`,
      `**Checked users:** ${Math.max(0, Math.round(Number(result.checked_users) || 0))}`,
      `**Skipped no channel:** ${Math.max(0, Math.round(Number(result.alerts_skipped_no_channel) || 0))}`,
      inactiveModes.length ? `-# ${inactiveModes.join(", ")} are disabled and skipped. Direct-user watches remain checked whenever Direct users is On.` : "",
      result.message ? `**Error:** ${escapeDiscordMarkdown(truncateText(result.message, 260))}` : ""
    ].filter(Boolean).join("\n"));
  }

  const content = lines.join("\n");
  return content.length <= 1950
    ? content
    : `${content.slice(0, 1900)}\n-# Output truncated.`;
}

function formatOfflinePingClanRows(clans) {
  if (!clans.length) return ["None yet. Use `/offline clan name:c0ld`."];
  const rows = clans
    .slice(0, 20)
    .map(row => `- **${escapeDiscordMarkdown(row.clan_name || row.clan_key || "Unknown")}**`);
  if (clans.length > rows.length) rows.push(`-# ...and ${clans.length - rows.length} more.`);
  return rows;
}

function formatOfflinePingLeagueRows(leagues) {
  if (!leagues.length) return ["None yet. Use `/offline league name:dezzz`."];
  const rows = leagues
    .slice(0, 20)
    .map(row => `- **${escapeDiscordMarkdown(row.league_name || row.league_key || "Unknown")}**`);
  if (leagues.length > rows.length) rows.push(`-# ...and ${leagues.length - rows.length} more.`);
  return rows;
}

function formatOfflinePingUserRows(users, deliveryScope = "users") {
  if (!users.length) return ["None yet. Use `/offline user username:<roblox>`. Add a Discord user only to override RoVer."];
  const rows = users
    .slice(0, 25)
    .map(row => {
      const name = escapeDiscordMarkdown(row.roblox_username || row.roblox_username_key || "Unknown");
      const discordUserId = validDiscordSnowflake(row.discord_user_id)
        ? String(row.discord_user_id).trim()
        : "";
      const discord = discordUserId
        ? `<@${discordUserId}>`
        : escapeDiscordMarkdown(row.discord_label || "RoVer lookup");
      const clan = row.clan_name ? ` · ${escapeDiscordMarkdown(row.clan_name)}` : "";
      const sourceMode = normalizeOfflineSourceModeOption(row.source_mode);
      const source = sourceMode === "auto" ? "" : ` · ${sourceMode === "league" ? "League" : "Clan"}`;
      const channel = validDiscordSnowflake(row.channel_id) ? ` · <#${row.channel_id}>` : "";
      const delivery = deliveryScope === "clan" ? " · clan post" : "";
      return `- **${name}** -> ${discord}${clan}${source}${channel}${delivery}`;
    });
  if (users.length > rows.length) rows.push(`-# ...and ${users.length - rows.length} more.`);
  return rows;
}

function formatOfflinePingUserRow(row, deliveryScope = "users") {
  const name = escapeDiscordMarkdown(row?.roblox_username || row?.roblox_username_key || "Unknown");
  const discordUserId = validDiscordSnowflake(row?.discord_user_id)
    ? String(row.discord_user_id).trim()
    : "";
  const discord = discordUserId
    ? `<@${discordUserId}>`
    : escapeDiscordMarkdown(row?.discord_label || "RoVer lookup");
  const clan = row?.clan_name ? ` Â· ${escapeDiscordMarkdown(row.clan_name)}` : "";
  const sourceMode = normalizeOfflineSourceModeOption(row?.source_mode);
  const source = sourceMode === "auto" ? "" : ` Â· ${sourceMode === "league" ? "League" : "Clan"}`;
  const channel = validDiscordSnowflake(row?.channel_id) ? ` Â· <#${row.channel_id}>` : "";
  const delivery = deliveryScope === "clan" ? " Â· clan post" : "";
  return `- **${name}** -> ${discord}${clan}${source}${channel}${delivery}`;
}

function formatOfflinePingChannel(channelId) {
  const id = String(channelId || "").trim();
  return validDiscordSnowflake(id) ? `<#${id}>` : "Not assigned";
}

function validDiscordSnowflake(value) {
  return /^\d{5,30}$/.test(String(value || "").trim());
}

function parseOfflineBulkRemoveUserEntries(value) {
  const text = String(value || "").trim();
  if (!text) return [];

  const entries = [];
  const pattern = /username\s*:\s*([^\s,]+)/gi;
  let match;
  while ((match = pattern.exec(text))) {
    const username = String(match[1] || "").trim();
    if (username) entries.push({ username });
  }

  if (entries.length) return dedupeOfflineRemoveEntries(entries);

  return dedupeOfflineRemoveEntries(
    text
      .split(/[\s,;\r\n]+/)
      .map(username => username.trim())
      .filter(Boolean)
      .map(username => ({ username }))
  );
}

function dedupeOfflineRemoveEntries(entries) {
  const seen = new Set();
  const output = [];
  for (const entry of entries || []) {
    const username = String(entry?.username || "").trim();
    const key = normalizeSearchKey(username);
    if (!username || !key || seen.has(key)) continue;
    seen.add(key);
    output.push({ username });
  }
  return output;
}

async function searchDiscordGuildMemberByName(env, guildId, value) {
  const query = String(value || "").trim();
  if (!query) return null;

  const url = new URL(`${DISCORD_API_BASE}/guilds/${encodeURIComponent(guildId)}/members/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "10");
  const response = await fetch(url.toString(), {
    headers: discordBotHeaders(env)
  });
  const payload = await response.json().catch(() => []);
  if (!response.ok) {
    const message = payload?.message || `Discord member lookup failed (${response.status}).`;
    throw httpError(response.status, message);
  }

  const normalized = normalizeDiscordLookupName(query);
  const members = Array.isArray(payload) ? payload : [];
  return members.find(member => {
    const user = member?.user || {};
    return [
      member.nick,
      user.global_name,
      user.username,
      user.id
    ].some(name => normalizeDiscordLookupName(name) === normalized);
  }) || members[0] || null;
}

function normalizeDiscordLookupName(value) {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

async function resolveHourlyClanChannel(interaction, env, channelId) {
  const resolved = interaction?.data?.resolved?.channels?.[channelId];
  if (resolved) return resolved;

  const response = await fetch(`${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}`, {
    headers: discordBotHeaders(env)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw httpError(
      response.status === 403 ? 403 : 502,
      payload.message || `Luna could not inspect the selected Discord channel (${response.status}).`
    );
  }
  return payload;
}

function interactionSourceChannelId(interaction) {
  return String(interaction?.channel_id || interaction?.channel?.id || "").trim();
}

async function runHourlyClanAssignments(env, options = {}) {
  const force = options.force === true;
  const alignToHour = options.alignToHour === true;
  const postMinute = hourlyScheduledPostMinute(env);
  const response = await hourlyClanApiRequest(env, "/api/discord/hourly-assignments", {
    query: { enabled: "true", limit: 1000 }
  });
  const assignments = Array.isArray(response.assignments) ? response.assignments : [];
  const now = Number(options.scheduledTime || Date.now());
  const eligible = assignments.filter(assignment => (
    force || hourlyAssignmentDue(assignment, now, { alignToHour, postMinute })
  ));
  const reportPromises = new Map();
  const eventStatePromises = new Map();
  const results = [];

  for (const assignment of eligible) {
    const targetType = hourlyAssignmentTargetType(assignment);
    const targetName = hourlyAssignmentTargetName(assignment);
    let claimAcquired = force;

    try {
      const eventKind = targetType === "league" ? "league" : "clan_battle";
      if (!eventStatePromises.has(eventKind)) {
        eventStatePromises.set(eventKind, hourlyDeliveryEventState(env, targetType, now));
      }
      const eventState = await eventStatePromises.get(eventKind);
      if (!eventState.active) {
        results.push(hourlyInactiveEventResult(assignment, eventState));
        continue;
      }

      if (!force) {
        const claim = await claimHourlyClanAssignmentDelivery(env, assignment, now);
        if (!claim.claimed) {
          results.push({
            ok: true,
            skipped: true,
            reason: claim.reason || "already_claimed",
            target_type: targetType,
            target_name: targetName,
            clan_name: targetType === "clan" ? targetName : null,
            username: targetType === "user" ? targetName : null,
            league_name: targetType === "league" ? targetName : null,
            channel_id: assignment.channel_id,
            assignment_key: String(assignment.assignment_key || "")
          });
          continue;
        }
        claimAcquired = true;
      }

      const reportKey = `${targetType}:${normalizeSearchKey(targetName)}`;
      if (!reportPromises.has(reportKey)) {
        reportPromises.set(reportKey, buildHourlyAssignmentReport(env, assignment, { eventState }));
      }
      const report = await reportPromises.get(reportKey);
      const posted = await postHourlyClanReport(env, assignment.channel_id, report, assignment);
      await updateHourlyClanAssignmentDelivery(env, assignment, {
        last_posted_at: new Date(now).toISOString(),
        last_message_id: posted.id || null,
        last_snapshot_at: hourlyReportSnapshotAt(report),
        last_error: null
      });
      results.push({
        ok: true,
        target_type: targetType,
        target_name: targetName,
        clan_name: targetType === "clan" ? targetName : null,
        username: targetType === "user" ? targetName : null,
        league_name: targetType === "league" ? targetName : null,
        channel_id: assignment.channel_id,
        message_id: posted.id || null
      });
    } catch (err) {
      const message = String(err?.message || err || "Unknown hourly clan delivery error").slice(0, 1000);
      if (claimAcquired) {
        await updateHourlyClanAssignmentDelivery(env, assignment, {
          last_error: message
        }).catch(() => null);
      }
      results.push({
        ok: false,
        target_type: targetType,
        target_name: targetName,
        clan_name: targetType === "clan" ? targetName : null,
        username: targetType === "user" ? targetName : null,
        league_name: targetType === "league" ? targetName : null,
        channel_id: assignment.channel_id,
        error: message
      });
    }
  }

  return {
    ok: results.every(result => result.ok),
    scheduled_at: new Date(now).toISOString(),
    schedule_aligned: alignToHour,
    post_minute: alignToHour ? postMinute : null,
    configured: assignments.length,
    due: eligible.length,
    results
  };
}

async function runOneHourlyClanAssignment(url, env, options = {}) {
  const channelId = String(url.searchParams.get("channel_id") || "").trim();
  if (!/^\d{5,30}$/.test(channelId)) {
    throw httpError(400, "A valid channel_id is required.");
  }

  const response = await hourlyClanApiRequest(env, "/api/discord/hourly-assignments", {
    query: { channel_id: channelId, limit: 100 }
  });
  const assignments = Array.isArray(response.assignments) ? response.assignments : [];
  if (!assignments.length) {
    return {
      ok: false,
      channel_id: channelId,
      message: "No hourly assignment was found for that channel_id."
    };
  }

  const results = [];
  for (const assignment of assignments) {
    results.push(await deliverHourlyClanAssignment(env, assignment, options));
  }

  return {
    ok: results.every(result => result.ok),
    channel_id: channelId,
    assignment_count: assignments.length,
    assignments,
    results
  };
}

async function removeHourlyClanAssignment(url, env) {
  const channelId = String(url.searchParams.get("channel_id") || "").trim();
  if (!/^\d{5,30}$/.test(channelId)) {
    throw httpError(400, "A valid channel_id is required.");
  }

  return hourlyClanApiRequest(env, "/api/discord/hourly-assignments", {
    method: "DELETE",
    body: { channel_id: channelId }
  });
}

function hourlyAssignmentDue(assignment, now = Date.now(), options = {}) {
  const lastPosted = new Date(assignment?.last_posted_at || 0).getTime();
  if (!Number.isFinite(lastPosted) || lastPosted <= 0) return true;
  if (options.alignToHour) {
    return lastPosted < hourlyScheduledBucketMs(now, options.postMinute ?? DEFAULT_HOURLY_CLAN_POST_MINUTE);
  }

  return now - lastPosted >= HOURLY_CLAN_MIN_POST_INTERVAL_MINUTES * 60 * 1000;
}

function hourlyScheduledPostMinute(env) {
  const value = Number(env.HOURLY_CLAN_POST_MINUTE ?? DEFAULT_HOURLY_CLAN_POST_MINUTE);
  if (!Number.isFinite(value)) return DEFAULT_HOURLY_CLAN_POST_MINUTE;
  return Math.max(0, Math.min(59, Math.round(value)));
}

function shouldRunHourlyScheduledPosts(env, scheduledTime = Date.now()) {
  const date = new Date(scheduledTime || Date.now());
  if (Number.isNaN(date.getTime())) return false;
  return date.getUTCMinutes() === hourlyScheduledPostMinute(env);
}

function clanLogScheduledIntervalMinutes(env) {
  const value = Number(env.CLAN_LOG_POST_INTERVAL_MINUTES ?? 1);
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(60, Math.round(value)));
}

function shouldRunClanLogScheduledPosts(env, scheduledTime = Date.now()) {
  const date = new Date(scheduledTime || Date.now());
  if (Number.isNaN(date.getTime())) return false;
  return date.getUTCMinutes() % clanLogScheduledIntervalMinutes(env) === 0;
}

function clanTrackerScheduledIntervalMinutes(env) {
  const value = Number(env.CLAN_TRACKER_POST_INTERVAL_MINUTES ?? 5);
  if (!Number.isFinite(value)) return 5;
  return Math.max(1, Math.min(60, Math.round(value)));
}

function shouldRunClanTrackerScheduledPosts(env, scheduledTime = Date.now()) {
  const date = new Date(scheduledTime || Date.now());
  if (Number.isNaN(date.getTime())) return false;
  return date.getUTCMinutes() % clanTrackerScheduledIntervalMinutes(env) === 0;
}

function hourlyScheduledBucketMs(value, postMinute = DEFAULT_HOURLY_CLAN_POST_MINUTE) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return 0;
  date.setUTCMinutes(Number(postMinute) || 0, 0, 0);
  return date.getTime();
}

function hourlyNextScheduledHourMs(lastPostedMs, now, env) {
  const postMinute = hourlyScheduledPostMinute(env);
  const currentBucket = hourlyScheduledBucketMs(now, postMinute);
  if (!Number.isFinite(lastPostedMs) || lastPostedMs <= 0) return currentBucket;
  if (lastPostedMs < currentBucket) return Math.max(now, currentBucket);

  let next = currentBucket + 60 * 60 * 1000;
  while (next <= lastPostedMs) next += 60 * 60 * 1000;
  return next;
}

async function hourlyClanAssignmentStatus(env) {
  const response = await hourlyClanApiRequest(env, "/api/discord/hourly-assignments", {
    query: { enabled: "true", limit: 1000 }
  });
  const assignments = Array.isArray(response.assignments) ? response.assignments : [];
  const now = Date.now();
  return {
    ok: true,
    checked_at: new Date(now).toISOString(),
    configured: assignments.length,
    due: assignments.filter(assignment => hourlyAssignmentDue(assignment, now, {
      alignToHour: true,
      postMinute: hourlyScheduledPostMinute(env)
    })).length,
    min_post_interval_minutes: HOURLY_CLAN_MIN_POST_INTERVAL_MINUTES,
    scheduled_post_minute: hourlyScheduledPostMinute(env),
    scheduled_window_open: shouldRunHourlyScheduledPosts(env, now),
    bot_token_configured: Boolean(String(env.DISCORD_BOT_TOKEN || "").trim()),
    clan_api_token_configured: Boolean(String(env.CLAN_API_ADMIN_TOKEN || env.HOURLY_CLAN_API_TOKEN || "").trim()),
    clan_api_service_binding_enabled: hasClanApiServiceBinding(env),
    cron_expected: "*/15 * * * * with top-of-hour posting gate",
    assignments: assignments.map(assignment => {
      const lastPostedMs = new Date(assignment?.last_posted_at || 0).getTime();
      const hasLastPosted = Number.isFinite(lastPostedMs) && lastPostedMs > 0;
      const nextDueMs = hasLastPosted
        ? hourlyNextScheduledHourMs(lastPostedMs, now, env)
        : now;
      return {
        assignment_key: String(assignment.assignment_key || ""),
        guild_id: String(assignment.guild_id || ""),
        channel_id: String(assignment.channel_id || ""),
        channel_type: assignment.channel_type ?? null,
        channel_type_name: discordChannelTypeName(assignment.channel_type),
        target_type: hourlyAssignmentTargetType(assignment),
        target_name: hourlyAssignmentTargetName(assignment),
        clan_name: hourlyAssignmentTargetType(assignment) === "clan" ? hourlyAssignmentTargetName(assignment) : null,
        username: hourlyAssignmentTargetType(assignment) === "user" ? hourlyAssignmentTargetName(assignment) : null,
        league_name: hourlyAssignmentTargetType(assignment) === "league" ? hourlyAssignmentTargetName(assignment) : null,
        enabled: assignment.enabled !== false,
        due: hourlyAssignmentDue(assignment, now, {
          alignToHour: true,
          postMinute: hourlyScheduledPostMinute(env)
        }),
        last_posted_at: assignment.last_posted_at || null,
        next_due_at: new Date(Math.max(now, nextDueMs)).toISOString(),
        last_snapshot_at: assignment.last_snapshot_at || null,
        last_message_id: assignment.last_message_id || null,
        last_error: assignment.last_error || null
      };
    })
  };
}

function discordChannelTypeName(value) {
  const type = Number(value);
  if (type === 0) return "text";
  if (type === 5) return "announcement";
  if (type === 10) return "announcement_thread";
  if (type === 11) return "public_thread";
  if (type === 12) return "private_thread";
  return Number.isFinite(type) ? `type_${type}` : "unknown";
}

async function deliverHourlyClanAssignment(env, assignment, options = {}) {
  const force = options.force === true;
  const now = Date.now();
  if (!force && !hourlyAssignmentDue(assignment, now)) {
    return { ok: true, skipped: true, reason: "not_due" };
  }

  const targetType = hourlyAssignmentTargetType(assignment);
  const eventState = await hourlyDeliveryEventState(env, targetType, now);
  if (!eventState.active) {
    return hourlyInactiveEventResult(assignment, eventState);
  }

  let claimAcquired = force;
  try {
    if (!force) {
      const claim = await claimHourlyClanAssignmentDelivery(env, assignment, now);
      if (!claim.claimed) {
        return { ok: true, skipped: true, reason: claim.reason || "already_claimed" };
      }
      claimAcquired = true;
    }

    const report = await buildHourlyAssignmentReport(env, assignment, { eventState });
    const posted = await postHourlyClanReport(env, assignment.channel_id, report, assignment);
    await updateHourlyClanAssignmentDelivery(env, assignment, {
      last_posted_at: new Date(now).toISOString(),
      last_message_id: posted.id || null,
      last_snapshot_at: hourlyReportSnapshotAt(report),
      last_error: null
    });
    return { ok: true, message_id: posted.id || null };
  } catch (err) {
    if (claimAcquired) {
      await updateHourlyClanAssignmentDelivery(env, assignment, {
        last_error: String(err?.message || err || "Unknown hourly clan delivery error").slice(0, 1000)
      }).catch(() => null);
    }
    throw err;
  }
}

function hourlyAssignmentTargetType(assignment) {
  const raw = String(assignment?.clan_name || "").trim();
  const lower = raw.toLowerCase();
  if (lower.startsWith(HOURLY_USER_ASSIGNMENT_PREFIX)) return "user";
  if (lower.startsWith(HOURLY_LEAGUE_ASSIGNMENT_PREFIX)) return "league";
  return "clan";
}

function hourlyAssignmentTargetName(assignment) {
  const raw = String(assignment?.clan_name || "").trim();
  const lower = raw.toLowerCase();
  if (lower.startsWith(HOURLY_USER_ASSIGNMENT_PREFIX)) {
    return raw.slice(HOURLY_USER_ASSIGNMENT_PREFIX.length).trim();
  }
  if (lower.startsWith(HOURLY_LEAGUE_ASSIGNMENT_PREFIX)) {
    return raw.slice(HOURLY_LEAGUE_ASSIGNMENT_PREFIX.length).trim();
  }
  return raw;
}

function hourlyStoredAssignmentTarget(targetType, targetName) {
  const clean = String(targetName || "").trim();
  if (targetType === "user") return `${HOURLY_USER_ASSIGNMENT_PREFIX}${clean}`;
  if (targetType === "league") return `${HOURLY_LEAGUE_ASSIGNMENT_PREFIX}${clean}`;
  return clean;
}

function hourlyReportSnapshotAt(report) {
  return report?.snapshot_at || report?.current?.snapshot_at || null;
}

async function buildHourlyAssignmentReport(env, assignment, options = {}) {
  const targetType = hourlyAssignmentTargetType(assignment);
  const targetName = hourlyAssignmentTargetName(assignment);
  const eventState = options.eventState || await hourlyDeliveryEventState(env, targetType);
  if (!eventState.active) {
    throw httpError(409, hourlyInactiveEventMessage(eventState));
  }
  if (targetType === "user") return buildHourlyUserReport(env, targetName);
  if (targetType === "league") return buildHourlyLeagueReport(env, targetName);
  return buildHourlyClanReport(env, targetName);
}

async function hourlyDeliveryEventState(env, targetType, now = Date.now()) {
  return targetType === "league"
    ? hourlyLeagueDeliveryEventState(env, now)
    : hourlyClanDeliveryEventState(env, now);
}

async function hourlyClanDeliveryEventState(env, now = Date.now()) {
  try {
    const payload = await hourlyClanApiRequest(env, "/api/health", {
      query: { fresh: 1, _: now }
    });
    return hourlyRecognizedEventState({
      kind: "clan_battle",
      key: payload.active_battle_key,
      label: payload.active_battle_display_name,
      startAt: payload.active_battle_started_at,
      endAt: payload.active_battle_ended_at,
      now
    });
  } catch (err) {
    return {
      active: false,
      recognized: false,
      event_kind: "clan_battle",
      reason: "event_status_unavailable",
      message: `Clan Battle status could not be verified: ${err?.message || String(err)}`
    };
  }
}

async function hourlyLeagueDeliveryEventState(env, now = Date.now()) {
  const attempts = [];
  for (const target of leagueApiTargets(env)) {
    const apiUrl = new URL("/api/health", target.base);
    apiUrl.searchParams.set("fresh", "1");
    apiUrl.searchParams.set("_", String(now));
    const result = await fetchLeagueCurrentAttempt(target, apiUrl);
    attempts.push(result);
    if (result.response_ok && result.payload?.ok !== false) {
      return hourlyRecognizedEventState({
        kind: "league",
        key: result.payload?.league_run_key,
        label: result.payload?.league_run_label,
        startAt: result.payload?.scheduled_collection_start_at,
        endAt: result.payload?.league_end_at || result.payload?.scheduled_collection_end_at,
        now
      });
    }
  }

  const last = attempts[attempts.length - 1] || {};
  return {
    active: false,
    recognized: false,
    event_kind: "league",
    reason: "event_status_unavailable",
    message: last.message || "League status could not be verified."
  };
}

function hourlyRecognizedEventState({ kind, key, label, startAt, endAt, now = Date.now() }) {
  const eventKey = String(key || "").trim();
  const startMs = new Date(startAt || 0).getTime();
  const endMs = new Date(endAt || 0).getTime();
  const nowMs = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const base = {
    event_kind: kind,
    event_key: eventKey || null,
    event_label: String(label || eventKey || "").trim() || null,
    starts_at: Number.isFinite(startMs) && startMs > 0 ? new Date(startMs).toISOString() : null,
    ends_at: Number.isFinite(endMs) && endMs > 0 ? new Date(endMs).toISOString() : null
  };

  if (!eventKey) {
    return { ...base, active: false, recognized: false, reason: "no_recognized_event" };
  }
  if (!Number.isFinite(endMs) || endMs <= 0) {
    return { ...base, active: false, recognized: false, reason: "event_end_unknown" };
  }
  if (Number.isFinite(startMs) && startMs > 0 && nowMs < startMs) {
    return { ...base, active: false, recognized: true, reason: "event_not_started" };
  }
  if (nowMs >= endMs) {
    return { ...base, active: false, recognized: true, reason: "event_ended" };
  }
  return { ...base, active: true, recognized: true, reason: "event_active" };
}

function hourlyInactiveEventResult(assignment, eventState) {
  const targetType = hourlyAssignmentTargetType(assignment);
  const targetName = hourlyAssignmentTargetName(assignment);
  return {
    ok: true,
    skipped: true,
    reason: eventState?.reason || "event_inactive",
    message: hourlyInactiveEventMessage(eventState),
    event: eventState || null,
    target_type: targetType,
    target_name: targetName,
    clan_name: targetType === "clan" ? targetName : null,
    username: targetType === "user" ? targetName : null,
    league_name: targetType === "league" ? targetName : null,
    channel_id: assignment?.channel_id || null,
    assignment_key: String(assignment?.assignment_key || "")
  };
}

function hourlyInactiveEventMessage(eventState) {
  const name = eventState?.event_kind === "league" ? "League" : "Clan Battle";
  if (eventState?.reason === "event_ended") {
    return `${name} ${eventState.event_label || eventState.event_key || ""} has ended; hourly Discord posting is paused.`.replace(/\s+/g, " ").trim();
  }
  if (eventState?.reason === "event_not_started") {
    return `${name} ${eventState.event_label || eventState.event_key || ""} has not started; hourly Discord posting is paused.`.replace(/\s+/g, " ").trim();
  }
  if (eventState?.reason === "event_end_unknown") {
    return `${name} has no recognized end time; hourly Discord posting is paused.`;
  }
  return eventState?.message || `No active, recognized ${name} period is available; hourly Discord posting is paused.`;
}

async function buildHourlyClanReport(env, clanNameValue) {
  const clan = String(clanNameValue || "").trim();
  if (!clan) throw httpError(400, "The hourly clan assignment has no clan name.");

  const ingest = await hourlyClanApiRequest(env, "/api/ingest", {
    method: "POST",
    query: { clan }
  });
  if (ingest.skipped && !ingest.battle_key && !ingest.resolved_battle_key) {
    throw httpError(409, ingest.message || "No active clan battle is available for this hourly report.");
  }

  const current = await fetchHourlyClanCurrentForReport(env, clan);
  if (!Array.isArray(current.rows) || !current.rows.length) {
    throw httpError(409, `No current battle rows were returned for clan ${clan}.`);
  }
  await enrichHourlyClanCurrent(env, current, clan).catch(() => null);
  if (!hourlyClanReportHasReliableGains(current)) {
    throw httpError(
      409,
      `Hourly baseline is warming up for ${clan}. Luna stored the current snapshot, but will not post an hourly board until a comparison snapshot is available.`
    );
  }

  return {
    current,
    snapshot_at: current.snapshot_at || null,
    filename: `luna-hourly-${hourlyFilenamePart(clan)}-${Date.now()}.png`,
    bytes: await renderHourlyClanBoardPng(current)
  };
}

async function fetchHourlyClanCurrentForReport(env, clan) {
  const attempts = 3;
  let lastCurrent = null;
  let lastMissing = 0;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const current = await hourlyClanApiRequest(env, "/api/current", {
      query: {
        clan,
        avatars: 0,
        downtime: 1,
        fresh: 1
      }
    });
    const missing = hourlyMissingDowntimeCount(current);
    if (!missing) return current;

    lastCurrent = current;
    lastMissing = missing;
    if (attempt < attempts) await sleep(1000 * attempt);
  }

  const sample = (lastCurrent?.rows || [])
    .filter(row => hourlyInactiveRowMissingDowntime(row))
    .slice(0, 5)
    .map(row => row.username || row.user_id)
    .filter(Boolean)
    .join(", ");
  const apiHint = lastCurrent?.downtime_error ? ` Clan API downtime error: ${lastCurrent.downtime_error}` : "";
  throw httpError(
    502,
    `Clan API returned ${lastMissing} inactive ${clan} row(s) without downtime_minutes${sample ? ` (${sample})` : ""}; refusing to post a stale offline board.${apiHint}`
  );
}

function hourlyClanReportHasReliableGains(current) {
  return Array.isArray(current?.rows)
    && current.rows.some(row => hourlyOptionalNumber(
      hourlyFirstDefined(row.gain_1h, row.hourly_gain, row.hourly_points, row.one_hour_gain)
    ) !== null);
}

function hourlyMissingDowntimeCount(current) {
  if (!Array.isArray(current?.rows) || !current.rows.length) return 0;
  return current.rows.filter(row => hourlyInactiveRowMissingDowntime(row)).length;
}

function hourlyInactiveRowMissingDowntime(row) {
  const gain = hourlyOptionalNumber(
    hourlyFirstDefined(row?.gain_1h, row?.hourly_gain, row?.hourly_points, row?.one_hour_gain)
  );
  if (gain === null || gain > 0) return false;
  return hourlyDowntimeMinutes(row) === null;
}

async function buildHourlyUserReport(env, usernameValue) {
  const query = String(usernameValue || "").trim();
  if (!query) throw httpError(400, "The hourly user assignment has no Roblox username.");

  const { payload, status, ok } = await fetchGlobalSearchPayload(query, env);
  if (!ok || payload.ok === false || !payload.row) {
    throw httpError(404, payload.message || `No global-rank result found for ${query}. ${status ? `(API ${status})` : ""}`.trim());
  }

  const row = payload.row;
  const avatarUrl = await searchAvatarUrl(row, env);
  const chart = await buildSearchChartAttachment(payload, row, env, avatarUrl);
  if (!chart?.bytes?.byteLength) {
    throw httpError(502, `No hourly user picture could be rendered for ${query}.`);
  }

  const username = displayName(row) || query;
  return {
    snapshot_at: row.fetched_at || row.updated_at || payload?.run?.finished_at || payload?.generated_at || null,
    filename: `luna-hourly-user-${hourlyFilenamePart(username)}-${Date.now()}.png`,
    bytes: chart.bytes
  };
}

async function buildHourlyLeagueReport(env, leagueNameValue) {
  const leagueName = String(leagueNameValue || "").trim();
  if (!leagueName) throw httpError(400, "The hourly league assignment has no league name.");

  const payload = await fetchLeagueCurrentPayload(leagueName, env);
  if (!Array.isArray(payload.rows) || !payload.rows.length) {
    throw httpError(409, `No current league member rows were returned for ${leagueName}.`);
  }

  const displayLeagueName = String(payload.league_name || leagueName).trim() || leagueName;
  let historyRows = [];
  try {
    const historyPayload = await fetchLeagueHistoryPayload(displayLeagueName, env, 24, payload.league_run_key);
    historyRows = Array.isArray(historyPayload.rows) ? historyPayload.rows : [];
  } catch {
    historyRows = [];
  }

  return {
    current: payload,
    snapshot_at: hourlyLeagueSnapshotAt(payload),
    filename: `luna-hourly-league-${hourlyFilenamePart(displayLeagueName)}-${Date.now()}.png`,
    bytes: await renderHourlyLeagueBoardPng(payload, historyRows)
  };
}

async function renderHourlyLeagueBoardPng(payload, historyRows, options = {}) {
  const [fonts, leagueIcon] = await Promise.all([
    loadHistoryFonts(),
    hourlyLoadLeagueIcon(payload).catch(() => null)
  ]);
  const chartHours = leagueChartHours(options.hours || 24);
  const width = 1600;
  const height = 900;
  const color = {
    ...searchChartBoardColors(),
    grid: [42, 50, 70, 255],
    blue: [88, 166, 255, 255]
  };
  const canvas = new HistoryPixelCanvas(width, height, color.background, 1);
  const rows = hourlyLeagueCurrentRows(payload);
  const displayLeagueName = String(payload?.league_name || "League").trim() || "League";
  const runLabel = String(payload?.league_run_label || payload?.league_run_key || "Current league").trim();
  const snapshotAt = hourlyLeagueSnapshotAt(payload);
  const leaguePoints = hourlyLeaguePoints(payload, rows);
  const hourlyGain = rows.reduce((sum, row) => sum + Math.max(0, hourlyLeagueMemberGain(row, "gain_1h") || 0), 0);
  const capacity = positiveInteger(payload?.member_capacity);
  const memberText = capacity ? `${fullNumber(rows.length)}/${fullNumber(capacity)}` : fullNumber(rows.length);

  canvas.fillRect(32, 30, width - 64, height - 60, color.panel);
  hourlyDrawMysticSmoke(canvas, width, height, color);
  hourlyDrawPanelFrame(canvas, 32, 30, width - 64, height - 60, color.line);
  searchChartDrawRainbowBar(canvas, 54, 42, width - 108, 5, color);
  hourlyDrawHeaderOrnaments(canvas, width / 2, 109, color);

  const header = { x: 54, y: 58, w: 1492, h: 116 };
  hourlyDrawPanel(canvas, header.x, header.y, header.w, header.h, color.panelDeep, color.line);
  hourlyDrawColumnAura(canvas, header.x, header.y, header.w, header.h, 2, color);
  hourlyDrawLeagueIcon(canvas, fonts, displayLeagueName, leagueIcon, header.x + 22, header.y + 18, 80, color);
  canvas.drawFontText(fonts.bold, `${historyCardText(displayLeagueName, 28)} Member Progress`, header.x + 124, header.y + 20, 34, color.white, 520);
  canvas.drawFontText(fonts.regular, historyCardText(runLabel, 48), header.x + 126, header.y + 66, 17, color.cyan, 560);
  canvas.drawFontText(fonts.regular, `Updated ${chartDate(snapshotAt)} - 15-minute snapshots`, header.x + 126, header.y + 90, 14, color.quiet, 620);

  const cardY = header.y + 16;
  const cardW = 184;
  const cardGap = 12;
  const cardStart = header.x + header.w - (cardW * 4 + cardGap * 3) - 24;
  hourlyDrawLeagueStatCard(canvas, fonts, "League Points", shortNumber(leaguePoints), cardStart, cardY, cardW, 82, color, color.yellow);
  hourlyDrawLeagueStatCard(canvas, fonts, "Current Rank", rank(payload?.league_rank), cardStart + (cardW + cardGap), cardY, cardW, 82, color, color.violet);
  hourlyDrawLeagueStatCard(canvas, fonts, "1 Hour", `+${shortNumber(hourlyGain)}`, cardStart + (cardW + cardGap) * 2, cardY, cardW, 82, color, color.green);
  hourlyDrawLeagueStatCard(canvas, fonts, "Members", memberText, cardStart + (cardW + cardGap) * 3, cardY, cardW, 82, color, color.cyan);

  hourlyDrawLeagueGrowthPanel(canvas, fonts, payload, historyRows, {
    x: 54,
    y: 190,
    w: 1492,
    h: 350,
    hours: chartHours
  }, color);

  hourlyDrawLeagueRosterTable(canvas, fonts, rows, {
    x: 54,
    y: 554,
    w: 1492,
    h: 282
  }, color);

  canvas.drawFontText(fonts.regular, "Luna League report", 58, 858, 14, color.quiet, 420);
  const site = "c0ld-clan.com/leagues";
  const siteWidth = canvas.measureFontText(fonts.regular, site, 14);
  canvas.drawFontText(fonts.regular, site, width - 58 - siteWidth, 858, 14, color.quiet, siteWidth + 4);

  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

async function hourlyLoadLeagueIcon(payload) {
  const url = leagueIconUrl(payload?.league_icon);
  return url ? loadHistoryAvatar(url) : null;
}

function hourlyDrawLeagueIcon(canvas, fonts, leagueName, icon, x, y, size, color) {
  hourlyBlendCircle(canvas, x + size / 2, y + size / 2, size / 2 + 13, color.yellow, 28);
  hourlyBlendCircle(canvas, x + size / 2, y + size / 2, size / 2 + 8, color.pink, 18);
  hourlyFillRoundedRect(canvas, x, y, size, size, 16, color.line);
  hourlyFillRoundedRect(canvas, x + 2, y + 2, size - 4, size - 4, 14, color.inset);
  if (icon) {
    canvas.drawImageCover(icon, x + 7, y + 7, size - 14, size - 14, true);
    return;
  }

  const mark = historyCardText(String(leagueName || "LG").slice(0, 2).toUpperCase(), 2);
  const markWidth = canvas.measureFontText(fonts.bold, mark, 28);
  canvas.drawFontText(fonts.bold, mark, x + size / 2 - markWidth / 2, y + 28, 28, color.white, size - 16);
}

function hourlyDrawLeagueStatCard(canvas, fonts, label, value, x, y, width, height, color, accent) {
  hourlyBlendRoundedRect(canvas, x, y, width, height, 9, color.inset, 230);
  canvas.fillRect(x, y, width, 2, accent);
  canvas.drawFontText(fonts.regular, label, x + 14, y + 14, 13, color.muted, width - 28);
  hourlyDrawFittedText(canvas, fonts.bold, value, x + 14, y + 39, 24, accent, width - 28);
}

function hourlyDrawLeagueGrowthPanel(canvas, fonts, payload, historyRows, area, color) {
  hourlyDrawPanel(canvas, area.x, area.y, area.w, area.h, color.panelDeep, color.line);
  hourlyDrawColumnAura(canvas, area.x, area.y, area.w, area.h, 1, color);
  const hours = leagueChartHours(area.hours || 24);
  canvas.drawFontText(fonts.bold, `${hours}-Hour Member Growth`, area.x + 22, area.y + 18, 23, color.white, 420);
  canvas.drawFontText(fonts.regular, "Points at 15-minute intervals", area.x + 22, area.y + 52, 14, color.muted, 520);

  const members = leagueChartMembers(payload).slice(0, 4);
  const series = leagueMemberGrowthSeries(payload, historyRows, members, { hours });
  const legendY = area.y + 28;
  const legendW = Math.floor((area.w - 540) / 4);
  series.slice(0, 4).forEach((item, index) => {
    const x = area.x + 510 + index * legendW;
    canvas.fillRect(x, legendY + 13, 22, 4, item.color);
    const gain = Number.isFinite(item.totalGain) ? item.totalGain : item.gain || 0;
    const label = canvas.fitFontText(fonts.bold, `${historyCardText(item.name, 20)} +${shortNumber(gain)}`, 14, legendW - 32);
    canvas.drawFontText(fonts.bold, label, x + 30, legendY + 3, 14, color.white, legendW - 32);
  });

  const plot = { x: area.x + 58, y: area.y + 84, w: area.w - 92, h: area.h - 126 };
  hourlyBlendRoundedRect(canvas, plot.x, plot.y, plot.w, plot.h, 8, color.inset, 238);
  hourlyDrawPanelFrame(canvas, plot.x, plot.y, plot.w, plot.h, color.line);

  const allPoints = series.flatMap(item => item.points || []);
  if (!allPoints.length) {
    canvas.drawFontText(fonts.regular, "Not enough stored history to chart this league yet.", plot.x + 28, plot.y + 48, 19, color.muted, plot.w - 56);
    return;
  }

  const maxT = Math.max(...allPoints.map(point => point.t));
  const minT = maxT - hours * 60 * 60 * 1000;
  const pointValues = allPoints.map(point => Math.max(0, Number(point.value) || 0));
  const minYValue = Math.min(...pointValues);
  const maxYValue = Math.max(...pointValues);
  const yRange = Math.max(1, maxYValue - minYValue);
  const yPad = Math.max(1, yRange * 0.08);
  const yMin = Math.max(0, minYValue - yPad);
  const yMax = maxYValue + yPad;
  const xForTime = time => plot.x + ((time - minT) / Math.max(1, maxT - minT)) * plot.w;
  const yForValue = value => plot.y + (1 - Math.max(0, Math.min(1, ((Number(value) || 0) - yMin) / Math.max(1, yMax - yMin)))) * plot.h;

  for (let index = 0; index <= 4; index += 1) {
    const y = plot.y + (index / 4) * plot.h;
    const value = yMax - (index / 4) * (yMax - yMin);
    const label = shortNumber(value);
    const labelWidth = canvas.measureFontText(fonts.rowBold || fonts.bold, label, 15);
    canvas.fillRect(plot.x, y, plot.w, 1, color.grid);
    canvas.drawFontText(fonts.regular, label, Math.max(10, plot.x - labelWidth - 12), y - 8, 12, color.muted, labelWidth + 4);
  }

  for (let index = 0; index <= 6; index += 1) {
    const time = minT + (index / 6) * (maxT - minT);
    const x = plot.x + (index / 6) * plot.w;
    const label = chartHourAxisLabel(time);
    const labelWidth = canvas.measureFontText(fonts.regular, label, 12);
    canvas.fillRect(x, plot.y, 1, plot.h, [25, 34, 45, 255]);
    canvas.drawFontText(fonts.regular, label, Math.max(plot.x, Math.min(plot.x + plot.w - labelWidth, x - labelWidth / 2)), plot.y + plot.h + 24, 12, color.muted, labelWidth + 6);
  }

  for (const item of series) {
    const points = (item.points || [])
      .filter(point => Number.isFinite(point.t) && point.t >= minT && point.t <= maxT)
      .sort((a, b) => a.t - b.t);
    let previous = null;
    for (const point of points) {
      const x = Math.max(plot.x + 2, Math.min(plot.x + plot.w - 2, xForTime(point.t)));
      const y = Math.max(plot.y + 2, Math.min(plot.y + plot.h - 2, yForValue(point.value)));
      if (previous && !point.breakBefore) {
        chartDrawLine(canvas, previous.x, previous.y, x, previous.y, item.color, 3);
        if (Math.abs(y - previous.y) > 0.5) chartDrawLine(canvas, x, previous.y, x, y, item.color, 3);
      }
      previous = { x, y };
    }
    if (previous) chartFillCircle(canvas, previous.x, previous.y, 4, item.color);
  }
}

function hourlyDrawLeagueRosterTable(canvas, fonts, rows, area, color) {
  hourlyDrawPanel(canvas, area.x, area.y, area.w, area.h, color.panelDeep, color.line);
  hourlyDrawColumnAura(canvas, area.x, area.y, area.w, area.h, 0, color);
  canvas.drawFontText(fonts.bold, "Member Progress", area.x + 22, area.y + 18, 22, color.white, 360);
  canvas.drawFontText(fonts.regular, `Showing ${Math.min(6, rows.length)} of ${rows.length}`, area.x + 220, area.y + 24, 13, color.muted, 240);

  const headerY = area.y + 58;
  const rowStartY = area.y + 86;
  const rowHeight = 30;
  const cols = {
    rank: area.x + 25,
    player: area.x + 116,
    points: area.x + 840,
    gain5m: area.x + 980,
    gain1h: area.x + 1110,
    gain6h: area.x + 1240,
    gain12h: area.x + 1370,
    gain24h: area.x + area.w - 28
  };
  hourlyDrawLeagueTableHeader(canvas, fonts, cols, headerY, color);

  rows.slice(0, 6).forEach((row, index) => {
    const y = rowStartY + index * rowHeight;
    hourlyFillRoundedRect(canvas, area.x + 14, y, area.w - 28, rowHeight - 3, 5, index % 2 ? color.rowAlt : color.row);
    const rankText = row._rank ? `#${fullNumber(row._rank)}` : `#${index + 1}`;
    canvas.drawFontText(fonts.bold, rankText, cols.rank, y + 6, 16, color.white, 70);
    hourlyDrawLeagueMemberAvatar(canvas, fonts, row._name, cols.player, y + 3, 24, color);
    canvas.drawFontText(fonts.bold, historyCardText(row._name, 34), cols.player + 34, y + 5, 17, color.white, 360);
    hourlyDrawRightText(canvas, fonts.bold, row.points_redacted === true ? "Hidden" : shortNumber(row._points), cols.points, y + 6, 16, color.white, 120);
    hourlyDrawLeagueGain(canvas, fonts, row, "gain_5m", cols.gain5m, y + 6, color);
    hourlyDrawLeagueGain(canvas, fonts, row, "gain_1h", cols.gain1h, y + 6, color);
    hourlyDrawLeagueGain(canvas, fonts, row, "gain_6h", cols.gain6h, y + 6, color);
    hourlyDrawLeagueGain(canvas, fonts, row, "gain_12h", cols.gain12h, y + 6, color);
    hourlyDrawLeagueGain(canvas, fonts, row, "gain_24h", cols.gain24h, y + 6, color);
  });

  if (!rows.length) {
    canvas.drawFontText(fonts.regular, "No current member rows were available.", area.x + 26, rowStartY + 10, 18, color.muted, area.w - 52);
  }
}

function hourlyDrawLeagueTableHeader(canvas, fonts, cols, y, color) {
  canvas.drawFontText(fonts.regular, "Rank", cols.rank, y, 13, color.muted, 70);
  canvas.drawFontText(fonts.regular, "Player", cols.player, y, 13, color.muted, 220);
  hourlyDrawRightText(canvas, fonts.regular, "Points", cols.points, y, 13, color.muted, 80);
  hourlyDrawRightText(canvas, fonts.regular, "5m", cols.gain5m, y, 13, color.muted, 60);
  hourlyDrawRightText(canvas, fonts.regular, "1h", cols.gain1h, y, 13, color.muted, 60);
  hourlyDrawRightText(canvas, fonts.regular, "6h", cols.gain6h, y, 13, color.muted, 60);
  hourlyDrawRightText(canvas, fonts.regular, "12h", cols.gain12h, y, 13, color.muted, 60);
  hourlyDrawRightText(canvas, fonts.regular, "24h", cols.gain24h, y, 13, color.muted, 60);
}

function hourlyDrawLeagueMemberAvatar(canvas, fonts, name, x, y, size, color) {
  hourlyFillRoundedRect(canvas, x, y, size, size, 6, [33, 39, 52, 255]);
  const initials = historyCardText(String(name || "?").trim().slice(0, 2).toUpperCase(), 2);
  const width = canvas.measureFontText(fonts.bold, initials, 10);
  canvas.drawFontText(fonts.bold, initials, x + size / 2 - width / 2, y + 7, 10, color.muted, size - 4);
}

function hourlyDrawLeagueGain(canvas, fonts, row, key, rightX, y, color) {
  const value = hourlyLeagueMemberGain(row, key);
  const text = hourlyLeagueDeltaText(value);
  hourlyDrawRightText(canvas, fonts.bold, text, rightX, y, 15, hourlyLeagueDeltaColor(value, color), 78);
}

function hourlyLeagueCurrentRows(payload) {
  return (Array.isArray(payload?.rows) ? payload.rows : [])
    .filter(row => !isLeagueAggregateMemberRow(row))
    .map((row, index) => ({
      ...row,
      _index: index,
      _rank: positiveInteger(row.rank) || index + 1,
      _name: leagueMemberName(row, index + 1),
      _points: finiteNumber(row.total_points ?? row.points) || 0
    }))
    .sort((a, b) => (a._rank || 999999) - (b._rank || 999999) || b._points - a._points || String(a._name).localeCompare(String(b._name)));
}

function hourlyLeaguePoints(payload, rows) {
  const direct = finiteNumber(payload?.league_points);
  if (direct !== null) return direct;
  return (rows || []).reduce((sum, row) => sum + Math.max(0, Number(row._points) || 0), 0);
}

function hourlyLeagueMemberGain(row, key) {
  return finiteNumber(row?.[key]);
}

function hourlyLeagueDeltaText(value) {
  if (value === null || value === undefined) return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  if (number > 0) return `+${shortNumber(number)}`;
  if (number < 0) return shortNumber(number);
  return "0";
}

function hourlyLeagueDeltaColor(value, color) {
  if (value === null || value === undefined) return color.muted;
  const number = Number(value);
  if (!Number.isFinite(number)) return color.muted;
  if (number > 0) return color.green;
  if (number < 0) return color.red;
  return color.zero;
}

function hourlyLeagueSnapshotAt(payload) {
  return payload?.snapshot_at || payload?.fetched_at || payload?.updated_at || payload?.generated_at || null;
}

async function postHourlyClanReport(env, channelId, report, assignment = {}) {
  const filename = report.filename;
  const alertUserId = hourlyAlertUserId(assignment);
  const payload = {
    content: alertUserId ? `<@${alertUserId}>` : "",
    embeds: [],
    attachments: [{ id: 0, filename }],
    allowed_mentions: alertUserId
      ? { parse: [], users: [alertUserId] }
      : { parse: [] }
  };
  const form = new FormData();
  form.append("payload_json", JSON.stringify(payload));
  form.append("files[0]", new Blob([report.bytes], { type: "image/png" }), filename);

  const response = await fetch(
    `${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${requiredEnv(env, "DISCORD_BOT_TOKEN")}`,
        Accept: "application/json"
      },
      body: form
    }
  );
  const responsePayload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw httpError(
      response.status === 403 ? 403 : 502,
      responsePayload.message || `Discord hourly clan post failed (${response.status}).`
    );
  }
  return responsePayload;
}

async function completeTInteraction(interaction, env, message) {
  try {
    await postTCommandMessage(interaction, env, message);
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `Could not send that message: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      attachments: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
    return;
  }

  await deleteOriginalInteraction(interaction).catch(() => editOriginalInteraction(interaction, {
    content: "Sent.",
    embeds: [],
    components: [],
    attachments: [],
    allowed_mentions: { parse: [] }
  }).catch(() => null));
}

async function postTCommandMessage(interaction, env, message) {
  const channelId = String(interaction?.channel_id || "").trim();
  const content = String(message || "").trim();
  if (!channelId) throw httpError(400, "Discord interaction channel is missing.");
  if (!content) throw httpError(400, "Message cannot be blank.");

  const response = await fetch(
    `${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}/messages`,
    {
      method: "POST",
      headers: discordBotHeaders(env, {
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({ content })
    }
  );
  const responsePayload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw httpError(
      response.status === 403 ? 403 : 502,
      responsePayload.message || `Discord /t message post failed (${response.status}).`
    );
  }
  return responsePayload;
}

async function updateHourlyClanAssignmentDelivery(env, assignment, patch) {
  const channelId = typeof assignment === "object"
    ? String(assignment?.channel_id || "").trim()
    : String(assignment || "").trim();
  const assignmentKey = typeof assignment === "object"
    ? String(assignment?.assignment_key || "").trim()
    : "";

  return hourlyClanApiRequest(env, "/api/discord/hourly-assignments", {
    method: "PATCH",
    body: {
      channel_id: channelId,
      ...(assignmentKey ? { assignment_key: assignmentKey } : {}),
      ...patch
    }
  });
}

async function claimHourlyClanAssignmentDelivery(env, assignment, now = Date.now()) {
  const assignmentKey = String(assignment?.assignment_key || "").trim();
  if (!assignmentKey) {
    throw httpError(500, "Hourly assignment is missing assignment_key; run the hourly assignment migration before enabling duplicate-post protection.");
  }

  const token = hourlyDeliveryClaimToken(assignment);
  const claimAt = new Date(now).toISOString();
  const response = await updateHourlyClanAssignmentDelivery(env, assignment, {
    last_posted_at: claimAt,
    last_error: `posting:${token}`,
    claim_due_before: claimAt,
    claim_token: token
  });

  return {
    claimed: response?.claim_acquired === true,
    reason: response?.claim_acquired === false ? "already_claimed" : null,
    token,
    response
  };
}

function hourlyDeliveryClaimToken(assignment) {
  const prefix = String(assignment?.assignment_key || assignment?.channel_id || "hourly")
    .replace(/[^a-z0-9:_-]/gi, "")
    .slice(0, 80);
  const random = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}:${random}`.slice(0, 180);
}

function hourlyAlertUserId(assignment) {
  const value = String(assignment?.alert_user_id || "").trim();
  return /^\d{5,30}$/.test(value) ? value : "";
}

async function hourlyClanApiRequest(env, path, options = {}) {
  const token = String(env.CLAN_API_ADMIN_TOKEN || env.HOURLY_CLAN_API_TOKEN || "").trim();
  if (!token) {
    throw httpError(500, "Missing CLAN_API_ADMIN_TOKEN on the Luna Discord Worker.");
  }

  const apiBase = String(
    env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev"
  ).replace(/\/$/, "");
  const url = clanApiUrl(env, path, apiBase);
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value !== undefined && value !== null && String(value).trim()) {
      url.searchParams.set(key, String(value));
    }
  }

  const init = {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "Luna-Hourly-Clan-Board"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  };
  if (options.body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const response = await fetchClanApi(env, url, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || (payload.ok === false && options.allowPayloadError !== true)) {
    throw httpError(
      response.status || 502,
      payload.message || `Clan API request failed (${response.status}).`
    );
  }
  return payload;
}

async function offlinePingCheckApiRequest(env, path) {
  const token = String(env.CLAN_API_ADMIN_TOKEN || env.HOURLY_CLAN_API_TOKEN || "").trim();
  if (!token) {
    throw httpError(500, "Missing CLAN_API_ADMIN_TOKEN on the Luna Discord Worker.");
  }

  const apiBase = String(
    env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev"
  ).replace(/\/$/, "");
  const url = clanApiUrl(env, path, apiBase);
  const timeout = new AbortController();
  const timeoutId = setTimeout(() => timeout.abort(), 12_000);
  let response;
  try {
    response = await fetchClanApi(env, url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": "Luna-Offline-Ping-Check"
      },
      signal: timeout.signal,
      cf: { cacheTtl: 0, cacheEverything: false }
    });
  } catch (err) {
    if (timeout.signal.aborted) {
      throw httpError(504, "Offline check could not be queued within 12 seconds. Try again shortly.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw httpError(
      response.status || 502,
      payload.message || `Clan API request failed (${response.status}).`
    );
  }

  return {
    ...payload,
    http_status: response.status
  };
}

async function enrichHourlyClanCurrent(env, current, requestedClan) {
  const existingRank = positiveInteger(current?.clan_rank ?? current?.rank ?? current?.leaderboard_rank);
  const existingPoints = finiteNumber(current?.clan_points ?? current?.battle_points ?? current?.points);
  const rowTotal = hourlyRowsTotal(current?.rows);
  const existingPointsUseful = existingPoints !== null && (existingPoints > 0 || rowTotal <= 0);
  const existingIcon = hourlyClanIconUrl(current);
  if (existingRank && existingPointsUseful && existingIcon) return current;

  const details = await fetchHourlyClanBigGamesDetails(env, requestedClan, current, {
    needsRank: !existingRank
  });
  if (!details) return current;

  if (!current.clan_name && details.clan_name) current.clan_name = details.clan_name;
  if (!existingIcon && details.icon_url) {
    current.icon_id = details.icon_id || null;
    current.icon_url = details.icon_url;
  }
  if (!existingRank && details.rank) current.clan_rank = details.rank;
  if (!existingPointsUseful && Number.isFinite(details.clan_points)) {
    current.clan_points = details.clan_points;
  }

  return current;
}

async function fetchHourlyClanBigGamesDetails(env, requestedClan, current, options = {}) {
  const clan = String(requestedClan || current?.clan_name || "").trim();
  if (!clan) return null;

  const detail = await fetchHourlyClanDetail(clan).catch(() => null);
  const detailData = detail?.data || detail?.clan || detail?.Clan || detail;
  const detailName = String(hourlyFirstDefined(
    detailData?.Name,
    detailData?.name,
    detailData?.ClanName,
    detailData?.clanName,
    detailData?.Tag,
    detailData?.tag
  ) || "").trim();
  const detailIconId = hourlyExtractClanImageId(hourlyFirstDefined(
    detailData?.Icon,
    detailData?.icon,
    detailData?.IconId,
    detailData?.iconId,
    detailData?.icon_id
  ));
  const detailPoints = hourlyBattlePointsFromClanDetail(detailData, current);
  const rankRow = options.needsRank
    ? await fetchHourlyClanRankRow(env, detailName || clan, detailIconId).catch(() => null)
    : null;
  const iconId = detailIconId || rankRow?.icon_id || null;

  return {
    clan_name: detailName || rankRow?.clan_name || clan,
    rank: positiveInteger(rankRow?.rank),
    clan_points: finiteNumber(detailPoints ?? rankRow?.points),
    icon_id: iconId,
    icon_url: iconId ? `https://ps99.biggamesapi.io/image/${encodeURIComponent(iconId)}` : (rankRow?.icon_url || null)
  };
}

async function fetchHourlyClanDetail(clan) {
  const urls = [
    `https://ps99.biggamesapi.io/api/clan/${encodeURIComponent(clan)}`,
    `https://biggamesapi.io/api/clan/${encodeURIComponent(clan)}`
  ];
  let lastError = null;

  for (const url of urls) {
    try {
      return await fetchHourlyBigGamesJson(url);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Big Games clan detail failed for ${clan}.`);
}

async function fetchHourlyClanRankRow(env, clan, iconId) {
  const targetName = hourlyNormalizeClanName(clan);
  const targetIconId = hourlyExtractClanImageId(iconId);
  if (!targetName && !targetIconId) return null;

  const pageSize = hourlyBoundedInteger(
    env.HOURLY_CLAN_RANK_PAGE_SIZE || env.GLOBAL_RANK_CLAN_PAGE_SIZE,
    100,
    1,
    500
  );
  const scanLimit = hourlyBoundedInteger(
    env.HOURLY_CLAN_RANK_SCAN_LIMIT || env.GLOBAL_RANK_CLAN_SCAN_LIMIT,
    500,
    1,
    5000
  );
  const maxPages = Math.ceil(scanLimit / pageSize);
  const hosts = [
    "https://ps99.biggamesapi.io/api/clans",
    "https://biggamesapi.io/api/clans"
  ];
  let lastError = null;

  for (const host of hosts) {
    try {
      for (let page = 1; page <= maxPages; page += 1) {
        const url = new URL(host);
        url.searchParams.set("page", String(page));
        url.searchParams.set("pageSize", String(pageSize));
        url.searchParams.set("sort", "Points");
        url.searchParams.set("sortOrder", "desc");

        const payload = await fetchHourlyBigGamesJson(url.toString());
        const rows = (hourlyExtractClanArrays(payload)[0] || [])
          .map((row, index) => hourlyNormalizeClanRankRow(row, (page - 1) * pageSize + index + 1))
          .filter(row => row.clan_name && Number.isFinite(row.points));
        const match = rows.find(row =>
          (targetName && hourlyNormalizeClanName(row.clan_name) === targetName) ||
          (targetIconId && row.icon_id && row.icon_id === targetIconId)
        );
        if (match) return match;
        if (rows.length < pageSize) break;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) throw lastError;
  return null;
}

async function fetchHourlyBigGamesJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Luna-Hourly-Clan-Board"
    },
    cf: { cacheTtl: 60, cacheEverything: false }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Big Games API failed (${response.status}): ${text.slice(0, 300)}`);
  }
  const payload = JSON.parse(text);
  if (payload?.status && payload.status !== "ok") {
    throw new Error(`Big Games API status ${payload.status}`);
  }
  return payload;
}

function hourlyBattlePointsFromClanDetail(clanData, current) {
  const battles = clanData?.Battles || clanData?.battles;
  if (!battles || typeof battles !== "object") return null;
  const targets = [
    current?.battle,
    current?.battle_key,
    current?.display_name
  ].map(hourlyNormalizeBattleKey).filter(Boolean);
  if (!targets.length) return null;

  for (const [key, battle] of Object.entries(battles)) {
    const labels = [
      key,
      battle?.BattleID,
      battle?.battleId,
      battle?.battle_id,
      battle?.Name,
      battle?.name,
      battle?.DisplayName,
      battle?.displayName
    ].map(hourlyNormalizeBattleKey).filter(Boolean);
    if (!labels.some(label => targets.includes(label))) continue;

    return finiteNumber(hourlyFirstDefined(
      battle?.Points,
      battle?.points,
      battle?.Score,
      battle?.score,
      battle?.Total,
      battle?.total
    ));
  }

  return null;
}

function hourlyNormalizeClanRankRow(clan, fallbackRank) {
  const clanName = String(hourlyFirstDefined(
    clan?.Name,
    clan?.name,
    clan?.ClanName,
    clan?.clanName,
    clan?.Tag,
    clan?.tag
  ) || "").trim();
  const points = finiteNumber(hourlyFirstDefined(
    clan?.Points,
    clan?.points,
    clan?.Score,
    clan?.score,
    clan?.Total,
    clan?.total,
    clan?.Value,
    clan?.value
  ));
  const rankValue = positiveInteger(hourlyFirstDefined(
    clan?.Rank,
    clan?.rank,
    clan?.Place,
    clan?.place,
    clan?.Position,
    clan?.position
  )) || fallbackRank;
  const iconId = hourlyExtractClanImageId(hourlyFirstDefined(
    clan?.Icon,
    clan?.icon,
    clan?.IconId,
    clan?.iconId,
    clan?.icon_id
  ));

  return {
    rank: rankValue,
    clan_name: clanName,
    points: points ?? 0,
    icon_id: iconId || null,
    icon_url: iconId ? `https://ps99.biggamesapi.io/image/${encodeURIComponent(iconId)}` : null
  };
}

function hourlyExtractClanArrays(value) {
  const arrays = [];

  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      if (node.some(hourlyLooksLikeClanObject)) arrays.push(node);
      for (const item of node) walk(item);
      return;
    }
    for (const child of Object.values(node)) walk(child);
  }

  walk(value);
  return arrays;
}

function hourlyLooksLikeClanObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const hasName =
    value.Name !== undefined ||
    value.name !== undefined ||
    value.ClanName !== undefined ||
    value.clanName !== undefined ||
    value.Tag !== undefined ||
    value.tag !== undefined;
  const hasPoints =
    value.Points !== undefined ||
    value.points !== undefined ||
    value.Score !== undefined ||
    value.score !== undefined ||
    value.Total !== undefined ||
    value.total !== undefined ||
    value.Value !== undefined ||
    value.value !== undefined;
  return hasName && hasPoints;
}

function hourlyFirstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && value !== "");
}

function hourlyClanIconUrl(current) {
  const url = String(hourlyFirstDefined(
    current?.icon_url,
    current?.logo_url,
    current?.image_url,
    current?.clan_icon_url
  ) || "").trim();
  if (/^https?:\/\//i.test(url)) return url;

  const iconId = hourlyExtractClanImageId(hourlyFirstDefined(
    current?.icon_id,
    current?.iconId,
    current?.icon,
    current?.clan_icon_id
  ));
  return iconId ? `https://ps99.biggamesapi.io/image/${encodeURIComponent(iconId)}` : "";
}

async function hourlyLoadClanIcon(current) {
  const url = hourlyClanIconUrl(current);
  return url ? loadHistoryAvatar(url) : null;
}

function hourlyExtractClanImageId(iconValue) {
  const text = String(iconValue || "")
    .trim()
    .replace(/^rbxassetid:\/\//i, "")
    .replace(/^rbxasset:\/\//i, "")
    .trim();
  if (!text || /^https?:\/\//i.test(text)) return "";
  const match = text.match(/\d{4,}/);
  return match ? match[0] : text;
}

function hourlyNormalizeClanName(value) {
  return String(value || "").trim().toLowerCase();
}

function hourlyNormalizeBattleKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hourlyBoundedInteger(value, fallback, min, max) {
  const parsed = Number(value);
  const number = Number.isFinite(parsed) ? parsed : fallback;
  return Math.round(hourlyClamp(number, min, max));
}

async function renderHourlyClanBoardPng(current) {
  const [loadedFonts, clanIcon] = await Promise.all([
    loadHistoryFonts(),
    hourlyLoadClanIcon(current).catch(() => null)
  ]);
  const fonts = { ...loadedFonts, rowBold: loadedFonts.hourlyBold || loadedFonts.bold };
  const width = 1600;
  const height = 900;
  const color = {
    background: [8, 9, 18, 255],
    panel: [20, 23, 36, 255],
    panelDeep: [13, 17, 27, 255],
    inset: [25, 29, 44, 255],
    row: [25, 29, 43, 255],
    rowAlt: [18, 22, 34, 255],
    line: [54, 64, 100, 255],
    white: [242, 245, 252, 255],
    muted: [160, 172, 195, 255],
    quiet: [105, 119, 148, 255],
    cyan: [52, 225, 239, 255],
    violet: [112, 106, 255, 255],
    pink: [255, 93, 178, 255],
    green: [76, 211, 132, 255],
    yellow: [247, 211, 83, 255],
    orange: [238, 139, 53, 255],
    red: [231, 79, 84, 255],
    zero: [118, 127, 146, 255],
    zeroText: [148, 159, 181, 255],
    bar: [48, 55, 72, 255],
    barZero: [45, 51, 65, 255],
    smokeCyan: [51, 230, 241, 255],
    smokeViolet: [118, 72, 255, 255],
    smokePink: [255, 92, 183, 255]
  };
  const canvas = new HistoryPixelCanvas(width, height, color.background, 1);
  const clan = String(current.clan_name || "Clan").trim() || "Clan";
  const preparedRows = [...(current.rows || [])]
    .map(row => {
      const gainValue = hourlyOptionalNumber(
        hourlyFirstDefined(row.gain_1h, row.hourly_gain, row.hourly_points, row.one_hour_gain)
      );
      return {
        ...row,
        gainAvailable: gainValue !== null,
        gain: Math.max(0, gainValue || 0),
        total: Math.max(0, Number(row.total_points) || 0),
        downtime: hourlyDowntimeMinutes(row)
      };
    });
  const hourlyGainReady = preparedRows.some(row => row.gainAvailable);
  const activeRows = hourlyGainReady
    ? preparedRows
      .filter(row => row.gain > 0)
      .sort((a, b) => b.gain - a.gain || b.total - a.total || String(a.username).localeCompare(String(b.username)))
    : [];
  const inactiveRows = hourlyGainReady
    ? preparedRows
      .filter(row => row.gain <= 0)
      .sort((a, b) => {
        const left = Number.isFinite(a.downtime) ? a.downtime : -1;
        const right = Number.isFinite(b.downtime) ? b.downtime : -1;
        return right - left || b.total - a.total || String(a.username).localeCompare(String(b.username));
      })
      .map((row, index, list) => ({
        ...row,
        inactiveIndex: index,
        inactiveCount: list.length
      }))
    : preparedRows
      .sort((a, b) => b.total - a.total || String(a.username).localeCompare(String(b.username)))
      .map((row, index, list) => ({
        ...row,
        inactiveIndex: index,
        inactiveCount: list.length
      }));
  const rows = [...activeRows, ...inactiveRows]
    .slice(0, 75);
  const hourlyPoints = rows.reduce((sum, row) => sum + Math.max(0, Number(row.gain) || 0), 0);
  const active = rows.filter(row => row.gain > 0).length;
  const zero = rows.length - active;
  const maximum = Math.max(1, ...rows.map(row => Math.max(0, Number(row.gain) || 0)).filter(value => value > 0));
  const gainScale = hourlyGainScale(rows, true);

  canvas.fillRect(32, 30, width - 64, height - 60, color.panel);
  hourlyDrawMysticSmoke(canvas, width, height, color);
  hourlyDrawPanelFrame(canvas, 32, 30, width - 64, height - 60, color.line);

  hourlyDrawHeaderOrnaments(canvas, width / 2, 116, color);
  hourlyDrawSigil(canvas, fonts, clan, clanIcon, width / 2 - 47, 70, 94, color);
  hourlyDrawSideClanHeader(canvas, fonts, clan, rank(current.clan_rank ?? current.rank ?? current.leaderboard_rank), width / 2, 91, color);

  const clanPoints = hourlyClanPoints(current, preparedRows);
  const columnXs = [54, 556, 1058];
  const columnWidth = 488;
  const battleName = historyCardText(current.display_name || current.battle || "Current Clan Battle", 52);
  const updated = hourlyBoardCompactTimestamp(current.snapshot_at || current.generated_at);
  const columnHeaderLabels = [
    [`Points: ${Number.isFinite(clanPoints) ? shortNumber(clanPoints) : "-"}`, `Hourly: ${shortNumber(hourlyPoints)}`],
    [battleName, updated],
    [`Active: ${fullNumber(active)}`, `Inactive: ${fullNumber(zero)}`]
  ];

  const columnTop = 206;
  const rowHeight = 22;
  const rowsPerColumn = 25;
  const columnHeaderHeight = 50;
  const rowStartOffset = 57;

  for (let column = 0; column < 3; column += 1) {
    const x = columnXs[column];
    const columnHeight = rowStartOffset + rowHeight * rowsPerColumn + 12;
    hourlyDrawPanel(canvas, x, columnTop, columnWidth, columnHeight, color.panelDeep, color.line);
    hourlyDrawColumnAura(canvas, x, columnTop, columnWidth, columnHeight, column, color);
    hourlyDrawColumnHeader(canvas, fonts, x, columnTop, columnWidth, columnHeaderHeight, columnHeaderLabels[column], column, color);

    for (let rowIndex = 0; rowIndex < rowsPerColumn; rowIndex += 1) {
      const absoluteIndex = column * rowsPerColumn + rowIndex;
      const row = rows[absoluteIndex];
      const y = columnTop + rowStartOffset + rowIndex * rowHeight;
      hourlyDrawPlayerRowShell(canvas, x + 10, y, columnWidth - 20, rowHeight - 2, absoluteIndex, row?.gain > 0, color);
      if (!row) continue;

      const isActive = row.gain > 0;
      const metric = Math.max(0, Number(row.gain) || 0);
      const tone = isActive ? hourlyGainColor(metric, gainScale, color) : color.zero;
      const nameTone = isActive ? color.white : color.red;
      const rankText = String(absoluteIndex + 1).padStart(2, "0");
      const name = historyCardText(row.username || `User ${row.user_id || ""}`, 22);
      const firstInactive = !isActive && active > 0 && (absoluteIndex === 0 || rows[absoluteIndex - 1]?.gain > 0);
      if (firstInactive) hourlyDrawMistDivider(canvas, x + 54, Math.max(columnTop + 32, y - 3), columnWidth - 108, color);
      const rowFont = fonts.rowBold || fonts.bold;
      const rowFontSize = 16;
      const rowTextY = hourlyFontRowY(rowFont, y, rowHeight - 2, rowFontSize);
      const rankCenterX = x + 31;
      const nameX = x + 76;
      const nameWidth = 218;
      const barX = x + 308;
      const barY = y + 8;
      const valueRightX = x + columnWidth - 18;
      // The points label owns the right edge. Let only the progress bar shrink
      // when needed, so it can never draw beneath a member's points value.
      const barTrackWidth = Math.max(42, valueRightX - 72 - 12 - barX);

      hourlyDrawCenteredText(canvas, rowFont, rankText, rankCenterX, rowTextY, rowFontSize, tone, 36);
      hourlyDrawFittedText(canvas, rowFont, name, nameX, rowTextY, rowFontSize, nameTone, nameWidth);
      if (isActive) {
        const barWidth = Math.max(3, Math.round((metric / maximum) * barTrackWidth));
        canvas.fillRect(barX, barY, barTrackWidth, 8, color.bar);
        canvas.fillRect(barX, barY, barWidth, 8, tone);
        hourlyDrawRightText(canvas, rowFont, shortNumber(metric), valueRightX, rowTextY, rowFontSize, tone, 72);
      } else {
        hourlyDrawCenteredText(canvas, rowFont, hourlyDowntimeLabel(row.downtime), barX + barTrackWidth / 2, rowTextY, rowFontSize, color.red, 112);
        hourlyDrawRightText(canvas, rowFont, shortNumber(row.total), valueRightX, rowTextY, rowFontSize, color.zeroText, 72);
      }
    }
  }

  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

function hourlyDrawPanel(canvas, x, y, width, height, fill, stroke) {
  hourlyFillRoundedRect(canvas, x, y, width, height, 10, stroke);
  hourlyFillRoundedRect(canvas, x + 1, y + 1, width - 2, height - 2, 9, fill);
}

function hourlyDrawPanelFrame(canvas, x, y, width, height, stroke) {
  canvas.fillRect(x, y, width, 1, stroke);
  canvas.fillRect(x, y + height - 1, width, 1, stroke);
  canvas.fillRect(x, y, 1, height, stroke);
  canvas.fillRect(x + width - 1, y, 1, height, stroke);
}

function hourlyFillRoundedRect(canvas, x, y, width, height, radius, rgba) {
  const r = Math.max(0, Math.min(Math.round(radius), Math.floor(Math.min(width, height) / 2)));
  if (r <= 0) {
    canvas.fillRect(x, y, width, height, rgba);
    return;
  }
  canvas.fillRect(x + r, y, width - r * 2, height, rgba);
  canvas.fillRect(x, y + r, r, height - r * 2, rgba);
  canvas.fillRect(x + width - r, y + r, r, height - r * 2, rgba);
  chartFillCircle(canvas, x + r, y + r, r, rgba);
  chartFillCircle(canvas, x + width - r - 1, y + r, r, rgba);
  chartFillCircle(canvas, x + r, y + height - r - 1, r, rgba);
  chartFillCircle(canvas, x + width - r - 1, y + height - r - 1, r, rgba);
}

function hourlyBlendRoundedRect(canvas, x, y, width, height, radius, rgba, coverage) {
  const r = Math.max(0, Math.min(Math.round(radius), Math.floor(Math.min(width, height) / 2)));
  if (r <= 0) {
    hourlyBlendRect(canvas, x, y, width, height, rgba, coverage);
    return;
  }
  hourlyBlendRect(canvas, x + r, y, width - r * 2, height, rgba, coverage);
  hourlyBlendRect(canvas, x, y + r, r, height - r * 2, rgba, coverage);
  hourlyBlendRect(canvas, x + width - r, y + r, r, height - r * 2, rgba, coverage);
  hourlyBlendCircle(canvas, x + r, y + r, r, rgba, coverage);
  hourlyBlendCircle(canvas, x + width - r - 1, y + r, r, rgba, coverage);
  hourlyBlendCircle(canvas, x + r, y + height - r - 1, r, rgba, coverage);
  hourlyBlendCircle(canvas, x + width - r - 1, y + height - r - 1, r, rgba, coverage);
}

function hourlyBlendRect(canvas, x, y, width, height, rgba, coverage) {
  const left = Math.max(0, Math.round(x));
  const top = Math.max(0, Math.round(y));
  const right = Math.min(canvas.width, Math.round(x + width));
  const bottom = Math.min(canvas.height, Math.round(y + height));
  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      canvas.blendPixel(px, py, rgba, coverage);
    }
  }
}

function hourlyBlendCircle(canvas, cx, cy, radius, rgba, coverage) {
  const r = Math.max(0, Math.round(radius));
  for (let y = -r; y <= r; y += 1) {
    for (let x = -r; x <= r; x += 1) {
      if (x * x + y * y <= r * r) canvas.blendPixel(Math.round(cx + x), Math.round(cy + y), rgba, coverage);
    }
  }
}

function hourlyDrawMysticSmoke(canvas, width, height, color) {
  hourlyDrawSmokeEllipse(canvas, width / 2, 128, 390, 74, color.smokeCyan, 30);
  hourlyDrawSmokeEllipse(canvas, width / 2 - 295, 134, 255, 58, color.smokeViolet, 20);
  hourlyDrawSmokeEllipse(canvas, width / 2 + 295, 134, 255, 58, color.smokePink, 18);
  hourlyDrawSmokeEllipse(canvas, width / 2 - 510, 116, 190, 38, color.smokeCyan, 10);
  hourlyDrawSmokeEllipse(canvas, width / 2 + 510, 116, 190, 38, color.smokeViolet, 10);
  hourlyDrawSmokeEllipse(canvas, 215, 676, 230, 70, color.smokeViolet, 13);
  hourlyDrawSmokeEllipse(canvas, width - 220, 642, 250, 76, color.smokeCyan, 12);
}

function hourlyDrawHeaderOrnaments(canvas, centerX, y, color) {
  const stars = [
    { offset: 300, dy: 8, radius: 4, tone: color.yellow },
    { offset: 365, dy: -8, radius: 3, tone: color.cyan },
    { offset: 430, dy: 8, radius: 4, tone: color.yellow }
  ];
  for (const direction of [-1, 1]) {
    hourlyDrawSmokeEllipse(canvas, centerX + direction * 365, y + 2, 150, 24, direction < 0 ? color.smokeViolet : color.smokeCyan, 9);
    for (const star of stars) {
      chartFillCircle(canvas, centerX + direction * star.offset, y + star.dy, star.radius, star.tone);
    }
  }
}

function hourlyDrawSigil(canvas, fonts, clan, clanIcon, x, y, size, color) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  hourlyBlendCircle(canvas, cx, cy, size / 2 + 17, color.cyan, 34);
  hourlyBlendCircle(canvas, cx, cy, size / 2 + 12, color.violet, 44);
  chartFillCircle(canvas, cx, cy, size / 2 + 6, color.cyan);
  chartFillCircle(canvas, cx, cy, size / 2 + 3, color.violet);
  chartFillCircle(canvas, cx, cy, size / 2, color.inset);
  chartFillCircle(canvas, cx, cy, size / 2 - 8, color.panelDeep);
  if (clanIcon) {
    canvas.drawImageCover(clanIcon, x + 8, y + 8, size - 16, size - 16, true);
    return;
  }
  canvas.fillRect(cx - 4, y + 23, 8, 23, color.yellow);
  canvas.fillRect(cx - 18, y + 36, 36, 8, color.yellow);
  canvas.fillRect(x + 18, y + 57, size - 36, 5, color.cyan);
  canvas.fillRect(x + 25, y + 67, size - 50, 5, color.violet);
  const mark = historyCardText(clan.slice(0, 2).toUpperCase(), 2);
  const markWidth = canvas.measureFontText(fonts.bold, mark, 23);
  canvas.drawFontText(fonts.bold, mark, cx - markWidth / 2, y + 44, 23, color.white, size - 18);
}

function hourlyClanPoints(current, rows) {
  const direct = finiteNumber(current?.clan_points ?? current?.battle_points ?? current?.points);
  const summed = hourlyRowsTotal(rows);
  if (direct !== null && (direct > 0 || summed <= 0)) return direct;

  return summed > 0 ? summed : direct;
}

function hourlyRowsTotal(rows) {
  return (rows || []).reduce((sum, row) => sum + (finiteNumber(row?.total_points ?? row?.total) || 0), 0);
}

function hourlyDrawSideClanHeader(canvas, fonts, clan, rankText, centerX, y, color) {
  const size = 38;
  const name = historyCardText(clan, 18);
  const rankLabel = rankText === "Unranked" ? "Unranked" : `Rank ${historyCardText(rankText, 14)}`;
  const fittedName = canvas.fitFontText(fonts.bold, name, size, 260);
  const fittedRank = canvas.fitFontText(fonts.bold, rankLabel, size, 280);
  const nameWidth = canvas.measureFontText(fonts.bold, fittedName, size);
  const rankWidth = canvas.measureFontText(fonts.bold, fittedRank, size);
  const nameX = centerX - 86 - nameWidth;
  const rankX = centerX + 86;

  hourlyDrawOutlinedText(canvas, fonts.bold, fittedName, nameX, y, size, color.green, [7, 18, 31, 235], nameWidth + 4);
  hourlyDrawOutlinedText(canvas, fonts.bold, fittedRank, rankX, y, size, color.yellow, [48, 32, 9, 235], rankWidth + 4);
}

function hourlyDrawCenteredText(canvas, font, value, centerX, y, size, rgba, maxWidth = Infinity, shadow = true) {
  const fitted = canvas.fitFontText(font, historyCardText(value, 10000), size, maxWidth);
  const width = canvas.measureFontText(font, fitted, size);
  if (shadow) canvas.drawFontText(font, fitted, centerX - width / 2 + 1, y + 1, size, [3, 5, 13, 190], width + 4);
  canvas.drawFontText(font, fitted, centerX - width / 2, y, size, rgba, width + 4);
}

function hourlyDrawFittedText(canvas, font, value, x, y, size, rgba, maxWidth = Infinity) {
  const fitted = canvas.fitFontText(font, historyCardText(value, 10000), size, maxWidth);
  canvas.drawFontText(font, fitted, x + 1, y + 1, size, [3, 5, 13, 210], maxWidth);
  canvas.drawFontText(font, fitted, x, y, size, rgba, maxWidth);
}

function hourlyDrawRightText(canvas, font, value, rightX, y, size, rgba, maxWidth = Infinity) {
  const fitted = canvas.fitFontText(font, historyCardText(value, 10000), size, maxWidth);
  const width = canvas.measureFontText(font, fitted, size);
  canvas.drawFontText(font, fitted, rightX - width + 1, y + 1, size, [3, 5, 13, 210], width + 4);
  canvas.drawFontText(font, fitted, rightX - width, y, size, rgba, width + 4);
}

function hourlyFontRowY(font, y, height, size) {
  const bounds = font?.bounds || { top: 0, bottom: HISTORY_FONT_CELL_HEIGHT - 1 };
  const scale = size / HISTORY_FONT_BASE_SIZE;
  const visibleHeight = (bounds.bottom - bounds.top + 1) * scale;
  return y + (height - visibleHeight) / 2 - bounds.top * scale;
}

function hourlyDrawOutlinedText(canvas, font, value, x, y, size, fill, outline, maxWidth = Infinity) {
  const text = canvas.fitFontText(font, historyCardText(value, 10000), size, maxWidth);
  const width = canvas.measureFontText(font, text, size);
  const drawWidth = Math.min(maxWidth, width + 4);
  const offsets = [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const [dx, dy] of offsets) {
    canvas.drawFontText(font, text, x + dx, y + dy, size, outline, drawWidth);
  }
  canvas.drawFontText(font, text, x, y, size, fill, drawWidth);
}

function hourlyDrawColumnAura(canvas, x, y, width, height, column, color) {
  const accents = [
    [color.cyan, color.violet],
    [color.yellow, color.cyan],
    [color.green, color.pink]
  ][column % 3];
  hourlyDrawSmokeEllipse(canvas, x + width / 2, y + height - 10, width / 2 - 32, 14, accents[0], 8);
}

function hourlyDrawColumnHeader(canvas, fonts, x, y, width, height, labels, column, color) {
  const stripX = x + 10;
  const stripY = y + 9;
  const stripWidth = width - 20;
  const stripHeight = height - 12;
  const gap = 8;
  const cellWidth = Math.floor((stripWidth - gap) / 2);
  const leftCellX = stripX;
  const rightCellX = stripX + cellWidth + gap;
  const accents = [
    [color.cyan, color.violet],
    [color.yellow, color.cyan],
    [color.green, color.pink]
  ][column % 3];

  hourlyBlendRoundedRect(canvas, leftCellX, stripY, cellWidth, stripHeight, 7, color.inset, 210);
  hourlyBlendRoundedRect(canvas, rightCellX, stripY, cellWidth, stripHeight, 7, color.inset, 210);
  hourlyDrawTinyGem(canvas, leftCellX + 15, stripY + stripHeight / 2, accents[0]);
  hourlyDrawTinyGem(canvas, rightCellX + cellWidth - 16, stripY + stripHeight / 2, accents[1]);
  const titleFont = fonts.rowBold || fonts.bold;
  const titleSize = 18;
  const titleY = hourlyFontRowY(titleFont, stripY, stripHeight, titleSize);
  hourlyDrawCenteredText(canvas, titleFont, labels?.[0] || "", leftCellX + cellWidth / 2 + 5, titleY, titleSize, color.white, cellWidth - 24, false);
  hourlyDrawCenteredText(canvas, titleFont, labels?.[1] || "", rightCellX + cellWidth / 2 - 5, titleY, titleSize, color.white, cellWidth - 24, false);
}

function hourlyDrawTinyGem(canvas, x, y, accent) {
  hourlyBlendCircle(canvas, x, y, 4, accent, 160);
  hourlyBlendCircle(canvas, x + 6, y - 5, 1, accent, 110);
}

function hourlyDrawPlayerRowShell(canvas, x, y, width, height, index, active, color) {
  hourlyFillRoundedRect(canvas, x, y, width, height, 4, index % 2 ? color.rowAlt : color.row);
  if (active && index % 5 === 0) hourlyBlendRoundedRect(canvas, x, y, width, height, 4, color.green, 10);
}

function hourlyDrawMistDivider(canvas, x, y, width, color) {
  const left = Math.round(x);
  const top = Math.round(y);
  const right = Math.round(x + width);
  for (let px = left; px <= right; px += 1) {
    const fraction = (px - left) / Math.max(1, right - left);
    const fade = Math.sin(Math.PI * fraction);
    const coverage = Math.round(42 * fade);
    if (coverage <= 0) continue;
    canvas.blendPixel(px, top, color.smokeCyan, coverage);
    canvas.blendPixel(px, top + 1, color.smokeViolet, Math.round(coverage * 0.55));
  }
}

function hourlyDrawSmokeEllipse(canvas, cx, cy, rx, ry, rgba, alpha) {
  const left = Math.max(0, Math.floor(cx - rx));
  const right = Math.min(canvas.width - 1, Math.ceil(cx + rx));
  const top = Math.max(0, Math.floor(cy - ry));
  const bottom = Math.min(canvas.height - 1, Math.ceil(cy + ry));
  for (let y = top; y <= bottom; y += 2) {
    const dy = (y - cy) / ry;
    for (let x = left; x <= right; x += 2) {
      const dx = (x - cx) / rx;
      const distance = dx * dx + dy * dy;
      if (distance > 1) continue;
      const ripple = 0.72 + 0.28 * Math.sin(x * 0.035 + y * 0.055);
      const coverage = Math.round(alpha * Math.pow(1 - distance, 1.7) * ripple);
      if (coverage <= 0) continue;
      canvas.blendPixel(x, y, rgba, coverage);
      canvas.blendPixel(x + 1, y, rgba, Math.round(coverage * 0.75));
      canvas.blendPixel(x, y + 1, rgba, Math.round(coverage * 0.75));
      canvas.blendPixel(x + 1, y + 1, rgba, Math.round(coverage * 0.5));
    }
  }
}

function hourlyRowMetric(row, hourlyGainReady) {
  return hourlyGainReady
    ? Math.max(0, Number(row?.gain) || 0)
    : Math.max(0, Number(row?.total) || 0);
}

function hourlyOptionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hourlyGainScale(rows, hourlyGainReady = true) {
  const values = rows
    .map(row => hourlyRowMetric(row, hourlyGainReady))
    .filter(value => value > 0);
  if (!values.length) return { min: 0, max: 0 };
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function hourlyGainColor(gain, scale, color) {
  const value = Number(gain) || 0;
  if (value <= 0) return color.zero;
  if (!scale || scale.max <= scale.min) return color.green;
  const fraction = hourlyClamp((value - scale.min) / Math.max(1, scale.max - scale.min), 0, 1);
  return hourlyGradientColor(fraction, [color.red, color.orange, color.yellow, color.green]);
}

function hourlyDowntimeMinutes(row) {
  const value = Number(row?.downtime_minutes ?? row?.downtime ?? row?.minutes_without_points);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

function hourlyDowntimeLabel(minutes) {
  if (!Number.isFinite(minutes)) return "--";
  const value = Math.max(0, Math.round(minutes));
  if (value < 60) return `${value}m`;
  const hours = Math.floor(value / 60);
  const remainingMinutes = value % 60;
  if (hours < 24) return remainingMinutes ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours ? `${days}d${remainingHours}h` : `${days}d`;
}

function hourlyGradientColor(fraction, stops) {
  const t = hourlyClamp(Number(fraction) || 0, 0, 1);
  if (!Array.isArray(stops) || stops.length < 2) return stops?.[0] || [255, 255, 255, 255];
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  return hourlyMixColor(stops[index], stops[index + 1], scaled - index);
}

function hourlyMixColor(left, right, fraction) {
  const t = hourlyClamp(Number(fraction) || 0, 0, 1);
  return [
    Math.round(left[0] + (right[0] - left[0]) * t),
    Math.round(left[1] + (right[1] - left[1]) * t),
    Math.round(left[2] + (right[2] - left[2]) * t),
    Math.round((left[3] ?? 255) + ((right[3] ?? 255) - (left[3] ?? 255)) * t)
  ];
}

function hourlyClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hourlyFilenamePart(value) {
  return String(value || "clan")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "clan";
}

function hourlyBoardTimestamp(value) {
  const date = new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) return "now";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Guatemala",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function hourlyBoardCompactTimestamp(value) {
  const date = new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) return "now";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Guatemala",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function trackerPopulation(server) {
  if (server?.status === "pending") return "awaiting observer access";
  if (server?.playing === null || server?.playing === undefined || server?.playing === "") {
    return "unknown population";
  }
  const playing = Number(server?.playing);
  const maxPlayers = Number(server?.max_players);
  if (!Number.isFinite(playing)) return "unknown population";
  return `${playing}/${Number.isFinite(maxPlayers) && maxPlayers > 0 ? maxPlayers : "?"}`;
}

function trackerStatusIcon(status) {
  if (status === "pending") return "🟡";
  if (status === "online") return "🟢";
  if (status === "full") return "🟣";
  if (status === "offline") return "🔴";
  return "🟠";
}

async function completeLeagueInfoInteraction(interaction, env, leagueName, options = {}) {
  try {
    await editOriginalInteraction(interaction, await buildLeagueInfoMessage(leagueName, env, options));
  } catch (err) {
    await editOriginalInteraction(interaction, leagueInfoErrorMessage(err, env)).catch(() => null);
  }
}

async function buildLeagueInfoMessage(leagueName, env, options = {}) {
  const chartHours = leagueChartHours(options.chartHours);
  const payload = await fetchLeagueCurrentPayload(leagueName, env);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const members = rows
    .filter(row => !isLeagueAggregateMemberRow(row))
    .map((row, index) => ({
      row,
      id: String(row.user_id || row.UserID || "").trim(),
      name: leagueMemberName(row, index + 1),
      points: finiteNumber(row.total_points ?? row.points),
      gain1h: finiteNumber(row.gain_1h ?? row.hourly_points ?? row.one_hour_gain)
    }))
    .filter(item => item.points !== null)
    .sort((a, b) => b.points - a.points || String(a.name).localeCompare(String(b.name)))
    .slice(0, 4);

  await Promise.all(members.map(async item => {
    const result = await fetchLeaguePlayerPoolRank(item.name, item.id, env).catch(() => null);
    item.globalRank = positiveInteger(result?.rank);
  }));

  const leaguePoints = finiteNumber(payload.league_points)
    ?? members.reduce((sum, item) => sum + Math.max(0, item.points || 0), 0);
  const displayLeagueName = String(payload.league_name || leagueName || "Unknown").trim() || "Unknown";
  const snapshotAt = payload.snapshot_at || payload.fetched_at || payload.updated_at;
  const memberHearts = ["❤️", "💙", "💚", "💛"];
  const memberLines = members.map((item, index) => {
    const globalRank = positiveInteger(item.globalRank) ? fullNumber(item.globalRank) : "-";
    return `-# ${memberHearts[index] || "🤍"} ** 𓊈 ${escapeDiscordMarkdown(item.name || "Unknown")} 𓊉** · **Rank:** ${globalRank} · **${shortNumber(item.points).toLowerCase()}** ᴘᴛs · ${shortNumber(item.gain1h ?? 0).toLowerCase()}/*ʜʀ*`;
  });
  const leagueDetails = {
    type: COMPONENT_TYPE_TEXT_DISPLAY,
    content: [
      `# ${escapeDiscordMarkdown(displayLeagueName)}`,
      `**Rank**: \`${positiveInteger(payload.league_rank) ? fullNumber(payload.league_rank) : "-"}\``,
      `**Points**: \`${shortNumber(leaguePoints).toLowerCase()}\``,
      `-# Updated: *${snapshotAt ? discordTime(snapshotAt) : "Unknown"}* ᓚᘏᗢ`,
      "",
      ...(memberLines.length ? memberLines : ["-# No League members found."]),
      "",
      "-# *Updates every 15 minutes.*"
    ].join("\n")
  };

  const leagueIcon = leagueIconUrl(payload.league_icon);
  const leagueHeader = leagueIcon
    ? {
        type: COMPONENT_TYPE_SECTION,
        components: [leagueDetails],
        accessory: {
          type: COMPONENT_TYPE_THUMBNAIL,
          media: { url: leagueIcon },
          description: `${displayLeagueName} League icon`
        }
      }
    : leagueDetails;

  const containerComponents = [
    leagueHeader
  ];

  const message = {
    components: [
      {
        type: COMPONENT_TYPE_CONTAINER,
        accent_color: 0x58a6ff,
        components: containerComponents
      }
    ],
    allowed_mentions: { parse: [] },
    flags: MESSAGE_FLAG_COMPONENTS_V2 | (ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : 0)
  };

  try {
    const historyPayload = await fetchLeagueHistoryPayload(displayLeagueName, env, chartHours, payload.league_run_key);
    const chartBytes = await renderLeagueMemberGrowthChartPng(payload, historyPayload.rows || [], { hours: chartHours, env });
    if (chartBytes?.byteLength) {
      const filename = `league-${chartFilenamePart(displayLeagueName)}-${chartHours}h.png`;
      containerComponents.push(
        { type: COMPONENT_TYPE_SEPARATOR },
        {
          type: COMPONENT_TYPE_MEDIA_GALLERY,
          items: [
            {
              media: { url: `attachment://${filename}` },
              description: `${chartHours}-hour member points chart for League ${displayLeagueName}`
            }
          ]
        }
      );
      message._file = { filename, contentType: "image/png", bytes: chartBytes };
    }
  } catch {
    // The command should still answer if the history chart cannot be rendered.
  }

  return message;
}

function leagueMemberComponents(members, env) {
  if (!members.length) {
    return [{
      type: COMPONENT_TYPE_TEXT_DISPLAY,
      content: "No League members found."
    }];
  }

  const components = [];
  members.forEach((item, index) => {
    if (index > 0) components.push({ type: COMPONENT_TYPE_SEPARATOR });

    const globalRank = positiveInteger(item.globalRank) ? rank(item.globalRank) : "-";
    const content = [
      `### #${index + 1}  ${escapeDiscordMarkdown(item.name || "Unknown")}`,
      `**${shortNumber(item.points)} points**  ·  **${shortNumber(item.gain1h ?? 0)}/h**  ·  🌍 Global **${globalRank}**`
    ].join("\n");
    const avatarUrl = absoluteProfileAssetUrl(
      item.row?.avatar_url || item.row?.avatarUrl || item.row?.thumbnail_url || item.row?.thumbnailUrl,
      env
    );

    if (avatarUrl) {
      components.push({
        type: COMPONENT_TYPE_SECTION,
        components: [{ type: COMPONENT_TYPE_TEXT_DISPLAY, content }],
        accessory: {
          type: COMPONENT_TYPE_THUMBNAIL,
          media: { url: avatarUrl },
          description: `${item.name || "League member"} avatar`
        }
      });
    } else {
      components.push({ type: COMPONENT_TYPE_TEXT_DISPLAY, content });
    }
  });

  return components;
}

function leagueInfoErrorMessage(err, env) {
  const message = truncateHistoryText(err?.message || String(err), 1500);
  return {
    components: [
      {
        type: COMPONENT_TYPE_CONTAINER,
        accent_color: 0xff6b6b,
        components: [
          {
            type: COMPONENT_TYPE_TEXT_DISPLAY,
            content: `## League lookup failed\n${escapeDiscordMarkdown(message)}`
          }
        ]
      }
    ],
    attachments: [],
    allowed_mentions: { parse: [] },
    flags: MESSAGE_FLAG_COMPONENTS_V2 | (ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : 0)
  };
}

function parseTopCommandCustomId(value) {
  const parts = String(value || "").split("|");
  if (parts.length !== 5 || parts[0] !== "topcmd") return null;
  const ownerId = String(parts[1] || "").trim();
  const kind = String(parts[2] || "").trim().toLowerCase();
  const page = Math.max(0, Math.floor(Number(parts[3]) || 0));
  const action = String(parts[4] || "page").trim().toLowerCase();
  if (!["leagues", "clans", "players"].includes(kind)) return null;
  if (!["page", "previous", "indicator", "next", "close"].includes(action)) return null;
  return { ownerId, kind, page, action };
}

function topCommandCustomId(ownerId, kind, page, action = "page") {
  return `topcmd|${String(ownerId || "").trim()}|${kind}|${Math.max(0, Math.floor(Number(page) || 0))}|${action}`;
}

function handleTopCommandComponent(interaction, env, ctx) {
  const state = parseTopCommandCustomId(interaction.data?.custom_id);
  if (!state) return messageResponse("That top leaderboard control is no longer valid. Run `/top` again.", true);
  const userId = interactionUserId(interaction);
  if (state.ownerId && userId && userId !== state.ownerId) {
    return messageResponse("Only the person who ran `/top` can use these controls.", true);
  }
  if (state.action === "close") {
    ctx.waitUntil(deleteOriginalInteraction(interaction).catch(() => null));
    return { type: INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE };
  }
  ctx.waitUntil(completeTopCommandInteraction(interaction, env, state));
  return { type: INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE };
}

async function completeTopCommandInteraction(interaction, env, state) {
  try {
    const data = await fetchTopCommandData(state.kind, env);
    await editOriginalInteraction(interaction, buildTopCommandMessage(data, {
      kind: state.kind,
      page: state.page,
      ownerId: state.ownerId,
      env
    }));
  } catch (err) {
    await editOriginalInteraction(interaction, commandErrorMessage("Top lookup failed", err, env)).catch(() => null);
  }
}

async function fetchTopCommandData(kind, env) {
  if (kind === "leagues") return fetchTopLeaguesCommandData(env);
  if (kind === "clans") return fetchTopClansCommandData(env);
  return fetchTopPlayersCommandData(env);
}

async function fetchTopLeaguesCommandData(env) {
  const apiBase = String(env.LEAGUE_API_BASE || "https://yamo-league-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = leagueApiUrl(env, "/api/leagues/top-leagues", apiBase);
  apiUrl.searchParams.set("limit", String(TOP_COMMAND_LIMIT));
  const response = await fetchLeagueApi(env, apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "Luna-Top-Leagues-Command" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `League API failed (${response.status}).`);
  }
  return {
    title: "Top 100 Leagues",
    kind: "leagues",
    updatedAt: payload.snapshot_at || payload.generated_at,
    subtitle: payload.league_run_label || payload.league_run_key || "Current League",
    rows: (Array.isArray(payload.rows) ? payload.rows : []).slice(0, TOP_COMMAND_LIMIT)
  };
}

async function fetchTopClansCommandData(env) {
  let payload = await fetchTopClansPayloadForCommand(env);
  if (!Array.isArray(payload.rows) || !payload.rows.length || payload.waiting_for_first_snapshot) {
    const latestBattle = await fetchLatestClanBattleForCommand(env);
    if (latestBattle?.battle) {
      payload = await fetchTopClansPayloadForCommand(env, latestBattle.battle);
    }
  }
  const rows = (Array.isArray(payload.rows) ? payload.rows : [])
    .slice(0, TOP_COMMAND_LIMIT)
    .map(row => ({
      ...row,
      battle_key: row.battle_key || payload.battle || null,
      battle_display_name: row.battle_display_name || payload.display_name || payload.battle || null
    }));
  return {
    title: "Top 100 Clans",
    kind: "clans",
    updatedAt: payload.snapshot_at || payload.generated_at,
    subtitle: payload.display_name || payload.battle || "Current Event",
    battle: payload.battle || null,
    displayName: payload.display_name || null,
    rows
  };
}

async function fetchTopClansPayloadForCommand(env, battle = "") {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/clans/current", apiBase);
  apiUrl.searchParams.set("limit", String(TOP_COMMAND_LIMIT));
  if (battle) apiUrl.searchParams.set("battle", battle);
  const response = await fetchClanApi(env, apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "Luna-Top-Clans-Command" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `Clan API failed (${response.status}).`);
  }
  return payload;
}

async function fetchLatestClanBattleForCommand(env) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/clans/battles", apiBase);
  apiUrl.searchParams.set("limit", "10");
  const response = await fetchClanApi(env, apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "Luna-Top-Clans-Battle-Fallback" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) return null;
  return (Array.isArray(payload.rows) ? payload.rows : []).find(row => row?.has_rows && row?.battle) || null;
}

async function fetchTopPlayersCommandData(env) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/global/leaderboard", apiBase);
  apiUrl.searchParams.set("limit", String(TOP_COMMAND_LIMIT));
  apiUrl.searchParams.set("source", "auto");
  apiUrl.searchParams.set("avatars", "0");
  apiUrl.searchParams.set("gains", "0");
  const response = await fetchClanApi(env, apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "Luna-Top-Players-Command" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `Global leaderboard API failed (${response.status}).`);
  }
  const label = payload.source_label || payload.run?.event_name || payload.run?.battle_display_name || "Current Leaderboard";
  return {
    title: "Top 100 Players",
    kind: "players",
    updatedAt: payload.snapshot_at || payload.generated_at,
    subtitle: label,
    rows: (Array.isArray(payload.rows) ? payload.rows : []).slice(0, TOP_COMMAND_LIMIT)
  };
}

function buildTopCommandMessage(data, options = {}) {
  const pageSize = TOP_COMMAND_PAGE_SIZE;
  const totalRows = Math.min(TOP_COMMAND_LIMIT, data.rows.length);
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const page = clampPage(options.page, totalPages);
  const start = page * pageSize;
  const rows = data.rows.slice(start, start + pageSize);
  const rangeStart = totalRows ? start + 1 : 0;
  const rangeEnd = totalRows ? start + rows.length : 0;
  const lines = rows.length
    ? rows.map((row, index) => topCommandRowLine(data.kind, row, start + index + 1))
    : ["No rows are available yet."];
  const updated = data.updatedAt ? discordTime(data.updatedAt) : "Unknown";
  const theme = topCommandTheme(data.kind);
  const subtitle = String(data.subtitle || "").trim();
  const headerText = [
    `## ${escapeDiscordMarkdown(data.title)}`,
    subtitle ? `**${theme.contextLabel}:** ${escapeDiscordMarkdown(subtitle)}` : "",
    `**Showing:** ${fullNumber(rangeStart)}-${fullNumber(rangeEnd)} of ${fullNumber(totalRows)}`,
    `**Page:** ${page + 1}/${totalPages}`,
    `**Updated:** ${updated}`
  ].filter(Boolean).join("\n");

  return {
    flags: MESSAGE_FLAG_COMPONENTS_V2 | (ephemeralResponses(options.env) ? MESSAGE_FLAG_EPHEMERAL : 0),
    allowed_mentions: { parse: [] },
    components: [
      {
        type: COMPONENT_TYPE_CONTAINER,
        accent_color: theme.accent,
        components: [
          {
            type: COMPONENT_TYPE_TEXT_DISPLAY,
            content: headerText
          },
          { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
          {
            type: COMPONENT_TYPE_TEXT_DISPLAY,
            content: lines.join("\n\n").slice(0, 3900)
          }
        ]
      },
      ...topCommandButtons(options.ownerId, data.kind, page, totalPages)
    ]
  };
}

function topCommandTheme(kind) {
  if (kind === "leagues") {
    return { accent: 0x58a6ff, contextLabel: "League Run" };
  }
  if (kind === "clans") {
    return { accent: 0xf2cc60, contextLabel: "Event" };
  }
  return { accent: 0x34e1ef, contextLabel: "Snapshot" };
}

function topCommandRowLine(kind, row, number) {
  if (kind === "leagues") {
    const rankValue = positiveInteger(row.rank) || number;
    const name = escapeDiscordMarkdown(row.league_name || row.display_name || "Unknown");
    const points = shortNumber(row.total_points ?? row.points ?? row.league_points);
    const gain = topGainText(row);
    return `**#${fullNumber(rankValue)} ${name}**\n-# ${points} points${gain}`;
  }
  if (kind === "clans") {
    const rankValue = positiveInteger(row.rank) || number;
    const name = escapeDiscordMarkdown(row.clan_name || "Unknown");
    const points = shortNumber(row.points);
    const gain = topGainText(row);
    return `**#${fullNumber(rankValue)} ${name}**\n-# ${points} stars${gain}`;
  }
  const rankValue = positiveInteger(row.global_rank ?? row.rank) || number;
  const name = escapeDiscordMarkdown(row.username || row.display_name || `user_${row.user_id || number}`);
  const group = escapeDiscordMarkdown(row.clan || row.source_clan || row.league_name || row.clan_name || "");
  const points = shortNumber(row.points ?? row.total_points ?? row.global_points);
  return `**#${fullNumber(rankValue)} ${name}**\n-# ${group ? `${group} · ` : ""}${points} points`;
}

function topGainText(row) {
  const gain = finiteNumber(row.gain_1h ?? row.projected_gain_1h);
  return gain && gain > 0 ? ` · +${shortNumber(gain)}/h` : "";
}

function topCommandButtons(ownerId, kind, page, totalPages) {
  if (totalPages <= 1) {
    return [{
      type: COMPONENT_TYPE_ACTION_ROW,
      components: [
        historyButton("Close", topCommandCustomId(ownerId, kind, page, "close"), BUTTON_STYLE_DANGER, false)
      ]
    }];
  }
  return [{
    type: COMPONENT_TYPE_ACTION_ROW,
    components: [
      historyButton("Previous", topCommandCustomId(ownerId, kind, page - 1, "previous"), BUTTON_STYLE_SECONDARY, page <= 0),
      historyButton(`Page ${page + 1}/${totalPages}`, topCommandCustomId(ownerId, kind, page, "indicator"), BUTTON_STYLE_SECONDARY, true),
      historyButton("Next", topCommandCustomId(ownerId, kind, page + 1, "next"), BUTTON_STYLE_SECONDARY, page >= totalPages - 1),
      historyButton("Close", topCommandCustomId(ownerId, kind, page, "close"), BUTTON_STYLE_DANGER, false)
    ]
  }];
}

function parseClanLookupCustomId(value) {
  const parts = String(value || "").split("|");
  if (parts.length !== 5 || parts[0] !== "clanlookup") return null;
  const ownerId = String(parts[1] || "").trim();
  const page = Math.max(0, Math.floor(Number(parts[2]) || 0));
  const action = String(parts[3] || "page").trim().toLowerCase();
  if (!["page", "previous", "indicator", "next", "close"].includes(action)) return null;
  return {
    ownerId,
    page,
    action,
    clanName: decodeURIComponent(parts[4] || "").trim()
  };
}

function clanLookupCustomId(ownerId, clanName, page, action = "page") {
  const safeName = encodeURIComponent(String(clanName || "").trim()).slice(0, 56);
  return `clanlookup|${String(ownerId || "").trim()}|${Math.max(0, Math.floor(Number(page) || 0))}|${action}|${safeName}`;
}

function handleClanLookupComponent(interaction, env, ctx) {
  const state = parseClanLookupCustomId(interaction.data?.custom_id);
  if (!state) return messageResponse("That clan lookup control is no longer valid. Run `/clan info` again.", true);
  const userId = interactionUserId(interaction);
  if (state.ownerId && userId && userId !== state.ownerId) {
    return messageResponse("Only the person who ran `/clan info` can use these controls.", true);
  }
  if (state.action === "close") {
    ctx.waitUntil(deleteOriginalInteraction(interaction).catch(() => null));
    return { type: INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE };
  }
  ctx.waitUntil(completeClanLookupInteraction(interaction, env, state));
  return { type: INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE };
}

function clanLogCustomId(ownerId, clanName, page, action = "open") {
  const safeClan = encodeURIComponent(String(clanName || "").trim()).slice(0, 56);
  return ["clanlog", String(ownerId || "").trim(), Math.max(0, Math.trunc(Number(page) || 0)), String(action || "open").trim().toLowerCase(), safeClan].join("|");
}

function parseClanLogCustomId(value) {
  const parts = String(value || "").split("|");
  if (parts.length !== 5 || parts[0] !== "clanlog") return null;
  const ownerId = String(parts[1] || "").trim();
  const page = Math.max(0, Math.trunc(Number(parts[2]) || 0));
  const action = String(parts[3] || "").trim().toLowerCase();
  let clanName = "";
  try {
    clanName = decodeURIComponent(String(parts[4] || "")).trim();
  } catch {
    return null;
  }
  if (!/^\d+$/.test(ownerId) || !/^[a-z_]+$/.test(action) || !clanName || clanName.length > 64) return null;
  return { ownerId, page, action, clanName };
}

function handleClanLogComponent(interaction, env, ctx) {
  const state = parseClanLogCustomId(interaction.data?.custom_id);
  if (!state) {
    return messageResponse("That clan activity page is no longer valid. Run `/clan log` again.", true);
  }
  if (interactionUserId(interaction) !== state.ownerId) {
    return messageResponse("Only the person who ran `/clan log` can use these page controls.", true);
  }
  ctx.waitUntil(completeClanLogInteraction(interaction, env, "view", state.clanName, state.page, state.ownerId));
  return { type: INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE };
}

async function completeClanLogInteraction(interaction, env, action, clanName, page = 0, ownerId = "") {
  try {
    if (action === "assign") {
      const channelId = getCommandOption(interaction, "assign");
      if (!channelId) throw httpError(400, "Choose the text channel or thread that should receive the activity posts.");
      const channel = await resolveHourlyClanChannel(interaction, env, channelId);
      if (!HOURLY_CLAN_ALLOWED_CHANNEL_TYPES.has(Number(channel?.type))) {
        throw httpError(400, "Choose a text channel or thread that Luna can post in.");
      }

      const activity = await fetchClanActivityDetailPayloadForCommand(clanName, env);
      const newest = newestClanActivityEvent(activity);
      const assignment = await hourlyClanApiRequest(env, "/api/discord/clan-log-assignments", {
        method: "POST",
        body: {
          guild_id: interaction.guild_id,
          channel_id: channelId,
          channel_type: Number(channel?.type),
          clan_name: activity.clan_name || clanName,
          assigned_by: interactionUserId(interaction),
          // Assignment deliberately starts from the latest stored event. It does
          // not flood the channel with historic activity that happened before setup.
          last_event_id: clanActivityEventFingerprint(newest),
          last_event_at: newest?.event_at || newest?.detected_at || null
        }
      });
      await editOriginalInteraction(interaction, {
        content: `Clan activity logging is now enabled for **${escapeDiscordMarkdown(activity.clan_name || clanName)}** in <#${channelId}>. Future joins, leaves, inferred kicks, promotions, and demotions will post there. Existing history was used only as the baseline.`,
        allowed_mentions: { parse: [] },
        embeds: [],
        components: [],
        attachments: []
      });
      return assignment;
    }

    const activity = await fetchClanActivityDetailPayloadForCommand(clanName, env);
    await editOriginalInteraction(interaction, buildClanActivityLogViewMessage(activity, clanName, { page, ownerId }));
  } catch (err) {
    await editOriginalInteraction(interaction, commandErrorMessage("Clan activity log failed", err, env)).catch(() => null);
  }
}

function newestClanActivityEvent(payload) {
  return clanActivityEvents(payload)
    .slice()
    .sort((a, b) => clanActivityEventTime(b) - clanActivityEventTime(a))[0] || null;
}

function clanActivityEvents(payload) {
  const events = [
    ...(Array.isArray(payload?.clan_events) ? payload.clan_events : []),
    ...(Array.isArray(payload?.rank_events) ? payload.rank_events : [])
  ];
  const seen = new Set();
  return events.filter(event => {
    const key = clanActivityEventFingerprint(event);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// API event IDs have proven to be regenerated in some activity responses.  A
// fingerprint from the immutable event details is stable across refreshes, so
// an assignment never replays an old event merely because its API ID changed.
function clanActivityEventFingerprint(event) {
  const type = String(event?.event_type || "").trim().toLowerCase();
  const timestamp = String(event?.event_at || event?.detected_at || "").trim();
  const clan = String(event?.clan_name || "").trim().toLowerCase();
  const member = String(event?.user_id || event?.username || event?.display_name || "").trim().toLowerCase();
  const before = String(event?.previous_rank ?? event?.previous_value ?? event?.previous_member_role ?? "").trim().toLowerCase();
  const after = String(event?.current_rank ?? event?.current_value ?? event?.current_member_role ?? "").trim().toLowerCase();
  return [type, timestamp, clan, member, before, after].join("|");
}

function isDiscordClanLogEvent(event) {
  return [
    "member_joined",
    "member_left",
    "member_kicked",
    "member_promoted",
    "member_demoted",
    "rank_up",
    "rank_down"
  ].includes(String(event?.event_type || ""));
}

function clanActivityEventTime(event) {
  const value = new Date(event?.event_at || event?.detected_at || 0).getTime();
  return Number.isFinite(value) ? value : 0;
}

function clanActivityLogEventLabel(event) {
  const type = String(event?.event_type || "").toLowerCase();
  if (type === "member_joined") return "joined";
  if (type === "member_kicked") return "was kicked";
  if (type === "member_left") return "left";
  if (type === "member_promoted") return `was promoted to ${event.current_member_role || event.current_value || "a new role"}`;
  if (type === "member_demoted") return `was demoted to ${event.current_member_role || event.current_value || "a new role"}`;
  if (type === "rank_up") return `climbed from rank **#${fullNumber(event.previous_rank)}** to rank **#${fullNumber(event.current_rank)}**`;
  if (type === "rank_down") return `dropped from rank **#${fullNumber(event.previous_rank)}** to rank **#${fullNumber(event.current_rank)}**`;
  if (type === "kick_used") return "used a clan kick";
  if (type === "kick_available") return "has a clan kick available";
  return String(event?.event_type || "activity changed").replace(/_/g, " ");
}

function clanActivityLogAccent(event) {
  const type = String(event?.event_type || "").toLowerCase();
  if (type === "member_joined") return 0x57f287;
  if (type === "member_promoted") return 0x5865f2;
  if (type === "member_demoted") return 0xfee75c;
  if (type === "member_left" || type === "member_kicked") return 0xed4245;
  if (type === "rank_up") return 0x57f287;
  if (type === "rank_down") return 0xed4245;
  return 0x58a6ff;
}

function clanActivityLogTitle(event) {
  const type = String(event?.event_type || "").toLowerCase();
  if (type === "rank_up") return "Clan Rank Up";
  if (type === "rank_down") return "Clan Rank Down";
  if (type === "member_joined") return "🟢 Player Joined";
  if (type === "member_kicked") return "🔴 Player Kicked";
  if (type === "member_left") return "🔴 Player Left";
  if (type === "member_promoted") return "⬆️ Player Promoted";
  if (type === "member_demoted") return "⬇️ Player Demoted";
  return "📋 Clan Activity";
}

function clanActivityAvatarUrl(event) {
  const userId = String(event?.user_id || "").trim();
  return /^\d+$/.test(userId)
    ? `https://www.roblox.com/headshot-thumbnail/image?userId=${encodeURIComponent(userId)}&width=420&height=420&format=png`
    : null;
}

function clanActivityDurationText(startAt, endAt) {
  const start = new Date(startAt || "").getTime();
  const end = new Date(endAt || Date.now()).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "";
  const totalMinutes = Math.floor((end - start) / 60000);
  if (totalMinutes < 1) return "less than a minute";
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (!days && minutes) parts.push(`${minutes}m`);
  return parts.slice(0, 2).join(" ");
}

function clanActivityJoinGlobalRankLine(event, details) {
  if (String(event?.event_type || "").toLowerCase() !== "member_joined") return "";
  const rank = Math.trunc(Number(details?.global_rank));
  const total = Math.trunc(Number(details?.global_rank_total));
  if (!(rank > 0)) return "";
  return `🌍 Global Rank: **#${fullNumber(rank)}${total > 0 ? ` of ${fullNumber(total)}` : ""}**`;
}

function clanActivityLeaveTenureLine(event, details) {
  const type = String(event?.event_type || "").toLowerCase();
  if (type !== "member_left" && type !== "member_kicked") return "";
  const duration = clanActivityDurationText(details?.join_time, event?.detected_at || event?.event_at);
  return duration ? `⏱️ Time in clan: **${duration}**` : "";
}

function buildClanActivityEventEmbed(event, fallbackClan = "", options = {}) {
  const type = String(event?.event_type || "").toLowerCase();
  const isRankEvent = type === "rank_up" || type === "rank_down";
  const username = String(event?.display_name || event?.username || event?.user_id || "A member").trim();
  const clanName = String(event?.clan_name || fallbackClan || "Clan").trim();
  const details = event?.details && typeof event.details === "object" ? event.details : {};
  const memberCount = Number(details.member_count ?? details.current_members);
  const capacity = Number(details.member_capacity);
  const description = [
    isRankEvent
      ? `${escapeDiscordMarkdown(clanName)} ${clanActivityLogEventLabel(event)}.`
      : `**${escapeDiscordMarkdown(username)}** ${clanActivityLogEventLabel(event)} **[${escapeDiscordMarkdown(clanName)}]**.`,
    Number.isFinite(memberCount) ? `${fullNumber(memberCount)}${Number.isFinite(capacity) && capacity > 0 ? `/${fullNumber(capacity)}` : ""} Members` : "",
    clanActivityJoinGlobalRankLine(event, details),
    clanActivityLeaveTenureLine(event, details),
    `Detected ${discordTime(event?.detected_at || event?.event_at)}`
  ].filter(Boolean).join("\n");
  // Feed alerts use compact left-side thumbnails.  Membership events use the
  // player portrait; clan-rank events represent the clan itself.
  const imageUrl = isRankEvent
    ? String(options?.clanIconUrl || "").trim()
    : clanActivityAvatarUrl(event);
  return {
    title: clanActivityLogTitle(event),
    color: clanActivityLogAccent(event),
    description,
    ...(imageUrl ? { thumbnail: { url: imageUrl } } : {}),
    footer: { text: "Luna clan activity tracker" }
  };
}

function buildClanActivityLogViewMessage(payload, fallbackClan, options = {}) {
  const pageSize = 10;
  const allEvents = clanActivityEvents(payload)
    .filter(isDiscordClanLogEvent)
    .slice()
    .sort((a, b) => clanActivityEventTime(b) - clanActivityEventTime(a));
  const totalPages = Math.max(1, Math.ceil(allEvents.length / pageSize));
  const page = clampPage(options.page, totalPages);
  const events = allEvents.slice(page * pageSize, (page + 1) * pageSize);
  const summary = payload?.summary && typeof payload.summary === "object" ? payload.summary : {};
  const clanName = String(payload?.clan_name || fallbackClan || "Clan").trim();
  const lines = events.length
    ? events.map(event => {
        const eventType = String(event?.event_type || "").toLowerCase();
        const isRankEvent = eventType === "rank_up" || eventType === "rank_down";
        const subject = isRankEvent
          ? `**${escapeDiscordMarkdown(clanName)}**`
          : `**${escapeDiscordMarkdown(event.display_name || event.username || event.user_id || "member")}**`;
        return `• ${discordTime(event.event_at || event.detected_at)} — ${subject} ${clanActivityLogEventLabel(event)}`;
      })
    : ["No roster changes have been recorded yet."];
  const components = totalPages > 1 && options.ownerId
    ? [{
      type: COMPONENT_TYPE_ACTION_ROW,
      components: [
        historyButton("Previous", clanLogCustomId(options.ownerId, clanName, page - 1, "previous"), BUTTON_STYLE_SECONDARY, page <= 0),
        historyButton(`Page ${page + 1}/${totalPages}`, clanLogCustomId(options.ownerId, clanName, page, "indicator"), BUTTON_STYLE_SECONDARY, true),
        historyButton("Next", clanLogCustomId(options.ownerId, clanName, page + 1, "next"), BUTTON_STYLE_SECONDARY, page >= totalPages - 1)
      ]
    }]
    : [];
  return {
    embeds: [{
      title: `Clan Activity • ${String(payload?.clan_name || fallbackClan || "Clan").toUpperCase()}`,
      color: 0x58a6ff,
      description: [
        `**Battle:** ${escapeDiscordMarkdown(payload?.display_name || payload?.battle || "Current battle")}`,
        summary.current_members ? `**Members:** ${fullNumber(summary.current_members)}` : "",
        "",
        "**Recent Activity**",
        ...lines,
        totalPages > 1 ? `\nPage ${page + 1}/${totalPages} · ${fullNumber(allEvents.length)} recorded events` : ""
      ].filter(Boolean).join("\n"),
      ...(summary.icon_url ? { thumbnail: { url: summary.icon_url } } : {}),
      footer: { text: "Use /clan log clan:<name> assign:<channel> to post future activity." }
    }],
    allowed_mentions: { parse: [] },
    components,
    attachments: []
  };
}

function clanLogEventsSince(payload, assignment) {
  const all = clanActivityEvents(payload)
    .slice()
    .sort((a, b) => clanActivityEventTime(a) - clanActivityEventTime(b));
  if (!all.length) return { all, events: [], newest: null };
  const lastId = String(assignment?.last_event_id || "").trim();
  const lastIndex = lastId ? all.findIndex(event => clanActivityEventFingerprint(event) === lastId) : -1;
  const after = lastIndex >= 0
    ? all.slice(lastIndex + 1)
    : assignment?.last_event_at
      ? all.filter(event => clanActivityEventTime(event) > new Date(assignment.last_event_at).getTime())
      : [];
  return {
    all,
    newest: all[all.length - 1],
    events: after.filter(isDiscordClanLogEvent)
  };
}

async function postClanActivityLogEvent(env, channelId, event, fallbackClan, options = {}) {
  const response = await fetch(`${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}/messages`, {
    method: "POST",
    headers: discordBotHeaders(env, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      embeds: [buildClanActivityEventEmbed(event, fallbackClan, options)],
      allowed_mentions: { parse: [] }
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw httpError(response.status === 403 ? 403 : 502, payload.message || `Discord clan activity post failed (${response.status}).`);
  }
  return payload;
}

async function updateClanLogAssignment(env, assignment, patch) {
  return hourlyClanApiRequest(env, "/api/discord/clan-log-assignments", {
    method: "PATCH",
    body: { assignment_key: String(assignment?.assignment_key || ""), ...patch }
  });
}

async function runClanLogAssignments(env, options = {}) {
  const response = await hourlyClanApiRequest(env, "/api/discord/clan-log-assignments", {
    query: { enabled: "true", limit: 1000 }
  });
  const assignments = Array.isArray(response?.assignments) ? response.assignments : [];
  const results = [];
  for (const assignment of assignments) {
    try {
      const payload = await fetchClanActivityDetailPayloadForCommand(assignment.clan_name, env);
      const delta = clanLogEventsSince(payload, assignment);
      if (!delta.newest) {
        results.push({ assignment_key: assignment.assignment_key, skipped: true, reason: "no_activity" });
        continue;
      }
      for (const event of delta.events.slice(0, 25)) {
        await postClanActivityLogEvent(env, assignment.channel_id, event, payload.clan_name || assignment.clan_name, {
          clanIconUrl: payload?.summary?.icon_url || payload?.icon_url || null
        });
      }
      await updateClanLogAssignment(env, assignment, {
        last_event_id: clanActivityEventFingerprint(delta.newest),
        last_event_at: delta.newest.event_at || delta.newest.detected_at || new Date(options.scheduledTime || Date.now()).toISOString(),
        last_error: null
      });
      results.push({ assignment_key: assignment.assignment_key, posted: delta.events.length });
    } catch (err) {
      await updateClanLogAssignment(env, assignment, { last_error: String(err?.message || err).slice(0, 500) }).catch(() => null);
      results.push({ assignment_key: assignment.assignment_key, posted: false, error: err?.message || String(err) });
    }
  }
  return { ok: true, assignments: assignments.length, results };
}

async function completeClanTrackerInteraction(interaction, env, action, clanName) {
  try {
    const current = await fetchClanTrackerCurrent(env, clanName);
    const message = buildClanTrackerComponentsMessage(current, clanName, env);

    if (action !== "assign") {
      await editOriginalInteraction(interaction, message);
      return;
    }

    const channelId = getCommandOption(interaction, "assign");
    if (!channelId) throw httpError(400, "Choose a text channel or thread for the persistent tracker.");
    const channel = await resolveHourlyClanChannel(interaction, env, channelId);
    if (!HOURLY_CLAN_ALLOWED_CHANNEL_TYPES.has(Number(channel?.type))) {
      throw httpError(400, "Choose a text channel or thread that Luna can post in.");
    }

    const assignment = await hourlyClanApiRequest(env, "/api/discord/clan-tracker-assignments", {
      method: "POST",
      body: {
        guild_id: interaction.guild_id,
        channel_id: channelId,
        channel_type: Number(channel?.type),
        clan_name: current.clan_name || clanName,
        assigned_by: interactionUserId(interaction),
        message_id: null,
        last_updated_at: null,
        last_error: null
      }
    });
    const savedAssignment = assignment?.assignment || assignment;
    const delivery = await postOrUpdateClanTrackerMessage(env, savedAssignment, message);
    await updateClanTrackerAssignment(env, savedAssignment, {
      message_id: delivery?.id || savedAssignment?.message_id || null,
      last_updated_at: current.snapshot_at || new Date().toISOString(),
      last_error: null
    });

    await editOriginalInteraction(interaction, {
      content: `Persistent tracking is now enabled for **${escapeDiscordMarkdown(current.clan_name || clanName)}** in <#${channelId}>. Luna will edit one tracker post there every ${clanTrackerScheduledIntervalMinutes(env)} minutes.`,
      allowed_mentions: { parse: [] },
      embeds: [],
      components: [],
      attachments: []
    });
  } catch (err) {
    await editOriginalInteraction(interaction, commandErrorMessage("Clan tracker failed", err, env)).catch(() => null);
  }
}

async function fetchClanTrackerCurrent(env, clanNameValue) {
  const clan = String(clanNameValue || "").trim();
  if (!clan) throw httpError(400, "A clan name is required.");

  // This is deliberately a light live read. It uses the same current clan
  // snapshot as the website instead of creating a separate, competing dataset.
  await hourlyClanApiRequest(env, "/api/ingest", {
    method: "POST",
    query: { clan }
  }).catch(err => {
    // /api/current can still return a good stored snapshot if an ingest is
    // temporarily unavailable, so do not take the tracker offline for that.
    console.warn("Clan tracker ingest skipped", clan, err?.message || String(err));
  });

  const current = await hourlyClanApiRequest(env, "/api/current", {
    query: { clan, avatars: 0, downtime: 1, fresh: 1 }
  });
  const rows = Array.isArray(current?.rows) ? current.rows : [];
  if (!rows.length) throw httpError(409, `No current clan rows were returned for ${clan}.`);
  return {
    ...current,
    clan_name: current.clan_name || current.clan || clan,
    rows
  };
}

function clanTrackerRows(current) {
  return (Array.isArray(current?.rows) ? current.rows : [])
    .map((row, index) => ({
      ...row,
      tracker_rank: positiveInteger(row?.rank ?? row?.member_rank ?? row?.clan_rank) || index + 1,
      tracker_username: String(row?.username || row?.display_name || row?.user_id || "Unknown").trim(),
      tracker_points: finiteNumber(row?.total_points ?? row?.member_points ?? row?.points ?? row?.total) || 0,
      tracker_gain_5m: finiteNumber(row?.gain_5m ?? row?.last_5m ?? row?.five_minute_gain),
      tracker_gain_1h: finiteNumber(row?.gain_1h ?? row?.one_hour_gain ?? row?.hourly_points ?? row?.projected_gain_1h),
      tracker_downtime: hourlyDowntimeMinutes(row)
    }))
    .sort((a, b) => a.tracker_rank - b.tracker_rank || b.tracker_points - a.tracker_points);
}

function clanTrackerDelta(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  const number = Number(value);
  return number > 0 ? `+${shortNumber(number)}` : shortNumber(number);
}

function chunkClanTrackerRows(rows, chunkSize = 8) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }
  return chunks;
}

function buildClanTrackerMessage(current, fallbackClan = "", env = {}) {
  const rows = clanTrackerRows(current).slice(0, 75);
  const totalPoints = hourlyClanPoints(current, rows);
  const currentRank = positiveInteger(current?.clan_rank ?? current?.rank ?? current?.source_clan_rank);
  const memberCount = positiveInteger(current?.member_count ?? current?.current_members) || rows.length;
  const capacity = positiveInteger(current?.member_capacity ?? current?.max_members);
  const snapshotAt = current?.snapshot_at || current?.fetched_at || current?.updated_at || null;
  const iconUrl = String(current?.icon_url || current?.clan_icon_url || current?.clan?.icon_url || "").trim();
  const displayClan = String(current?.clan_name || fallbackClan || "Clan").trim();
  const fields = chunkClanTrackerRows(rows).map(chunk => ({
    name: `Ranks #${chunk[0]?.tracker_rank || "?"}–#${chunk[chunk.length - 1]?.tracker_rank || "?"}`,
    value: chunk.map(row => {
      const downtime = row.tracker_downtime === null ? "" : ` · ⏱ ${hourlyDowntimeLabel(row.tracker_downtime)}`;
      return `**#${fullNumber(row.tracker_rank)} · ${escapeDiscordMarkdown(row.tracker_username)}**\n⭐ **${shortNumber(row.tracker_points)}** · 5m **${clanTrackerDelta(row.tracker_gain_5m)}** · 1h **${clanTrackerDelta(row.tracker_gain_1h)}**${downtime}`;
    }).join("\n\n"),
    inline: true
  }));

  if (!fields.length) {
    fields.push({ name: "Members", value: "No current members were returned yet.", inline: false });
  }

  return {
    embeds: [{
      title: `${displayClan.toUpperCase()} Members`,
      color: 0x9b59f6,
      description: [
        currentRank ? `🏆 Rank: **#${fullNumber(currentRank)}** — Total: **${shortNumber(totalPoints)}** ⭐` : `Total: **${shortNumber(totalPoints)}** ⭐`,
        `👥 Members: **${fullNumber(memberCount)}${capacity ? `/${fullNumber(capacity)}` : ""}**`,
        `🕒 Last Updated: ${discordTime(snapshotAt)} · Refreshes every ${clanTrackerScheduledIntervalMinutes(env)} minutes`
      ].join("\n"),
      fields,
      ...(iconUrl ? { thumbnail: { url: iconUrl } } : {}),
      footer: { text: "Luna persistent clan tracker" }
    }],
    allowed_mentions: { parse: [] },
    components: [],
    attachments: []
  };
}

function clanTrackerTableCell(value, width, alignment = "left") {
  const normalized = String(value ?? "-").replace(/\s+/g, " ").trim() || "-";
  const visible = normalized.length > width
    ? `${normalized.slice(0, Math.max(1, width - 1))}.`
    : normalized;
  const padding = " ".repeat(Math.max(0, width - visible.length));
  return alignment === "right" ? `${padding}${visible}` : `${visible}${padding}`;
}

// Discord Components V2 does not offer a true table layout. A fixed-width,
// monospaced three-card grid is the closest reliable equivalent: every member
// gets the same sized space and ranks always run across the row (1, 2, 3 / 4,
// 5, 6), rather than filling one tall column at a time.
const CLAN_TRACKER_GRID_COLUMNS = 3;
const CLAN_TRACKER_GRID_CELL_WIDTH = 21;

function clanTrackerGridCell(value, width = CLAN_TRACKER_GRID_CELL_WIDTH) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  const visible = normalized.length > width
    ? `${normalized.slice(0, Math.max(1, width - 1))}.`
    : normalized;
  return `${visible}${" ".repeat(Math.max(0, width - visible.length))}`;
}

function clanTrackerMemberGridLines(row) {
  if (!row) return ["", "", "", ""];
  const downtime = row.tracker_downtime === null
    ? "-"
    : hourlyDowntimeLabel(row.tracker_downtime);
  return [
    `#${fullNumber(row.tracker_rank)} ${row.tracker_username}`,
    `Pts ${shortNumber(row.tracker_points)}`,
    `5m ${clanTrackerDelta(row.tracker_gain_5m)} | 1h ${clanTrackerDelta(row.tracker_gain_1h)}`,
    `Down ${downtime}`
  ];
}

function clanTrackerTableBlock(rows) {
  const lines = [];
  const separator = "-".repeat((CLAN_TRACKER_GRID_CELL_WIDTH * CLAN_TRACKER_GRID_COLUMNS) + ((CLAN_TRACKER_GRID_COLUMNS - 1) * 3));
  for (let index = 0; index < rows.length; index += CLAN_TRACKER_GRID_COLUMNS) {
    const memberLines = Array.from(
      { length: CLAN_TRACKER_GRID_COLUMNS },
      (_, column) => clanTrackerMemberGridLines(rows[index + column])
    );
    for (let line = 0; line < 4; line += 1) {
      lines.push(memberLines.map(member => clanTrackerGridCell(member[line])).join(" | "));
    }
    if (index + CLAN_TRACKER_GRID_COLUMNS < rows.length) lines.push(separator);
  }
  return `**Ranks #${rows[0]?.tracker_rank || "?"}-#${rows[rows.length - 1]?.tracker_rank || "?"}**\n\`\`\`text\n${lines.join("\n")}\n\`\`\``;
}

function buildClanTrackerComponentsMessage(current, fallbackClan = "", env = {}) {
  const rows = clanTrackerRows(current).slice(0, 75);
  const totalPoints = hourlyClanPoints(current, rows);
  const currentRank = positiveInteger(current?.clan_rank ?? current?.rank ?? current?.source_clan_rank);
  const memberCount = positiveInteger(current?.member_count ?? current?.current_members) || rows.length;
  const capacity = positiveInteger(current?.member_capacity ?? current?.max_members);
  const snapshotAt = current?.snapshot_at || current?.fetched_at || current?.updated_at || null;
  const displayClan = String(current?.clan_name || fallbackClan || "Clan").trim();
  const summary = [
    `## ${escapeDiscordMarkdown(displayClan.toUpperCase())} Members`,
    currentRank ? `**Clan Rank:** #${fullNumber(currentRank)} | **Total Points:** ${shortNumber(totalPoints)}` : `**Total Points:** ${shortNumber(totalPoints)}`,
    `**Members:** ${fullNumber(memberCount)}${capacity ? `/${fullNumber(capacity)}` : ""}`,
    `-# Last Updated: ${snapshotAt ? discordTime(snapshotAt) : "Unknown"} | Refreshes every ${clanTrackerScheduledIntervalMinutes(env)} minutes`
  ].join("\n");
  // Keep the tracker header full-width. The clan icon previously consumed the
  // right side of the container and made the three-column member presentation
  // feel cramped on Discord.
  const header = { type: COMPONENT_TYPE_TEXT_DISPLAY, content: summary };
  const components = [header, { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 }];
  // Twenty-four members make eight symmetrical rows of three while remaining
  // comfortably inside Discord's component text limit.
  const blocks = chunkClanTrackerRows(rows, 24);
  if (blocks.length) {
    blocks.forEach((block, index) => {
      if (index > 0) components.push({ type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 });
      components.push({
        type: COMPONENT_TYPE_TEXT_DISPLAY,
        content: clanTrackerTableBlock(block)
      });
    });
  } else {
    components.push({ type: COMPONENT_TYPE_TEXT_DISPLAY, content: "No current members were returned yet." });
  }
  components.push({ type: COMPONENT_TYPE_TEXT_DISPLAY, content: "-# Luna persistent clan tracker" });
  return {
    components: [{
      type: COMPONENT_TYPE_CONTAINER,
      accent_color: 0x9b59f6,
      components
    }],
    embeds: [],
    allowed_mentions: { parse: [] },
    attachments: [],
    flags: MESSAGE_FLAG_COMPONENTS_V2
  };
}

async function postOrUpdateClanTrackerMessage(env, assignment, message) {
  const channelId = String(assignment?.channel_id || "").trim();
  const messageId = String(assignment?.message_id || "").trim();
  if (!channelId) throw httpError(400, "The clan tracker assignment is missing its channel.");

  // A persistent tracker is a Components V2 message. Do not send legacy
  // content with it: Discord disables content/embeds for V2 messages.
  const body = JSON.stringify({ ...message, embeds: [] });
  let legacyMessageId = "";
  if (messageId) {
    const edit = await fetch(`${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, {
      method: "PATCH",
      headers: discordBotHeaders(env, { "Content-Type": "application/json" }),
      body
    });
    const payload = await edit.json().catch(() => ({}));
    if (edit.ok) return payload;
    // Discord cannot always convert an existing legacy embed into a Components
    // V2 message. Post the upgraded tracker once, then remove that old legacy
    // post so an assignment remains a single persistent tracker.
    const detail = String(payload?.message || "").toLowerCase();
    const needsV2Replacement = edit.status === 400 && (detail.includes("component") || detail.includes("flag"));
    if (needsV2Replacement) {
      legacyMessageId = messageId;
    } else if (edit.status !== 404) {
      throw httpError(edit.status === 403 ? 403 : 502, payload.message || `Discord clan tracker update failed (${edit.status}).`);
    }
  }

  const create = await fetch(`${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}/messages`, {
    method: "POST",
    headers: discordBotHeaders(env, { "Content-Type": "application/json" }),
    body
  });
  const payload = await create.json().catch(() => ({}));
  if (!create.ok) {
    throw httpError(create.status === 403 ? 403 : 502, payload.message || `Discord clan tracker post failed (${create.status}).`);
  }
  if (legacyMessageId) {
    await fetch(`${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(legacyMessageId)}`, {
      method: "DELETE",
      headers: discordBotHeaders(env)
    }).catch(() => null);
  }
  return payload;
}

async function updateClanTrackerAssignment(env, assignment, patch) {
  return hourlyClanApiRequest(env, "/api/discord/clan-tracker-assignments", {
    method: "PATCH",
    body: { assignment_key: String(assignment?.assignment_key || ""), ...patch }
  });
}

async function runClanTrackerAssignments(env, options = {}) {
  const response = await hourlyClanApiRequest(env, "/api/discord/clan-tracker-assignments", {
    query: { enabled: "true", limit: 1000 }
  });
  const assignments = Array.isArray(response?.assignments) ? response.assignments : [];
  const reports = new Map();
  const results = [];

  for (const assignment of assignments) {
    const clanKey = String(assignment?.clan_name || "").trim().toLowerCase();
    try {
      let current = reports.get(clanKey);
      if (!current) {
        current = await fetchClanTrackerCurrent(env, assignment.clan_name);
        reports.set(clanKey, current);
      }
      const message = buildClanTrackerComponentsMessage(current, assignment.clan_name, env);
      const delivery = await postOrUpdateClanTrackerMessage(env, assignment, message);
      await updateClanTrackerAssignment(env, assignment, {
        message_id: delivery?.id || assignment?.message_id || null,
        last_updated_at: current.snapshot_at || new Date(options.scheduledTime || Date.now()).toISOString(),
        last_error: null
      });
      results.push({ assignment_key: assignment.assignment_key, updated: true, message_id: delivery?.id || assignment?.message_id || null });
    } catch (err) {
      await updateClanTrackerAssignment(env, assignment, {
        last_error: String(err?.message || err).slice(0, 500)
      }).catch(() => null);
      results.push({ assignment_key: assignment.assignment_key, updated: false, error: err?.message || String(err) });
    }
  }

  return { ok: results.every(result => result.updated), assignments: assignments.length, results };
}

async function completeClanLookupInteraction(interaction, env, state) {
  try {
    const data = await fetchClanLookupData(state.clanName, env);
    await editOriginalInteraction(interaction, buildClanLookupMessage(data, {
      page: state.page,
      ownerId: state.ownerId,
      env
    }));
  } catch (err) {
    await editOriginalInteraction(interaction, commandErrorMessage("Clan lookup failed", err, env)).catch(() => null);
  }
}

async function fetchClanLookupData(clanName, env) {
  const requested = String(clanName || "").trim();
  if (!requested) throw httpError(400, "Missing clan name.");
  const top = await fetchTopClansCommandData(env).catch(() => ({ rows: [] }));
  const canonical = top.rows.find(row => normalizeCommandText(row.clan_name) === normalizeCommandText(requested))
    || top.rows.find(row => normalizeCommandTextLoose(row.clan_name) === normalizeCommandTextLoose(requested));
  const canonicalBattle = canonical?.battle_key || top.battle || "";
  const candidates = clanLookupNameCandidates(requested, canonical);
  let bestPayload = null;
  let bestRows = [];
  let bestScore = -1;
  let lastError = null;
  const rememberPayload = payload => {
    const normalized = normalizeClanLookupPayloadForCommand(payload, requested);
    const rows = Array.isArray(normalized.rows) ? normalized.rows : [];
    const score = clanLookupPayloadScore(normalized, rows);
    if (score > bestScore) {
      bestPayload = normalized;
      bestRows = rows;
      bestScore = score;
    }
  };

  for (const candidate of candidates) {
    try {
      rememberPayload(await fetchClanCurrentPayloadForCommand(candidate, env));
      if (bestRows.length) break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!bestRows.length) {
    for (const candidate of candidates) {
      try {
        rememberPayload(await fetchClanActivityDetailPayloadForCommand(candidate, env));
        if (bestRows.length) break;
      } catch (err) {
        lastError = err;
      }
    }
  }

  if (!bestRows.length) {
    for (const candidate of candidates) {
      try {
        rememberPayload(await fetchClanLiveLookupPayloadForCommand(candidate, env));
        if (bestRows.length) break;
      } catch (err) {
        lastError = err;
      }
    }
  }

  if (!bestRows.length && canonicalBattle) {
    for (const candidate of candidates) {
      try {
        rememberPayload(await fetchClanCurrentPayloadForCommand(candidate, env, {
          battle: canonicalBattle
        }));
        if (bestRows.length) break;
      } catch (err) {
        lastError = err;
      }
    }
  }

  if (!bestRows.length && canonicalBattle) {
    for (const candidate of candidates) {
      try {
        rememberPayload(await fetchClanActivityDetailPayloadForCommand(candidate, env, {
          battle: canonicalBattle
        }));
        if (bestRows.length) break;
      } catch (err) {
        lastError = err;
      }
    }
  }

  if (!bestRows.length) {
    for (const candidate of candidates) {
      try {
        rememberPayload(await fetchClanGlobalCurrentPayloadForCommand(candidate, env));
        if (bestRows.length) break;
      } catch (err) {
        lastError = err;
      }
    }
  }

  if (!bestPayload && lastError) throw lastError;
  return { payload: bestPayload || {}, topRow: canonical || null, top, rows: bestRows };
}

function clanLookupNameCandidates(requested, canonical) {
  const candidates = [];
  const add = value => {
    const text = String(value || "").trim();
    if (!text) return;
    if (!candidates.some(item => item.toLowerCase() === text.toLowerCase())) candidates.push(text);
  };

  add(canonical?.clan_name);
  add(requested);

  for (const value of [...candidates]) {
    if (/[oO]/.test(value)) add(value.replace(/[oO]/g, "0"));
    if (/0/.test(value)) add(value.replace(/0/g, "o"));
    add(value.toLowerCase());
    add(value.toUpperCase());
  }

  return candidates;
}

async function fetchClanCurrentPayloadForCommand(clanName, env, options = {}) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/current", apiBase);
  apiUrl.searchParams.set("clan", clanName);
  if (options.battle) apiUrl.searchParams.set("battle", options.battle);
  apiUrl.searchParams.set("avatars", "0");
  apiUrl.searchParams.set("downtime", "0");
  const response = await fetchClanApi(env, apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "Luna-Clan-Lookup-Command" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `Clan API failed (${response.status}).`);
  }
  return payload;
}

async function fetchClanGlobalCurrentPayloadForCommand(clanName, env) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/global/current", apiBase);
  apiUrl.searchParams.set("clan", clanName);
  apiUrl.searchParams.set("limit", "1000");
  const response = await fetchClanApi(env, apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "Luna-Clan-Lookup-Global-Fallback" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `Clan global API failed (${response.status}).`);
  }

  const rows = (Array.isArray(payload.rows) ? payload.rows : []).map(row => ({
    ...row,
    rank: positiveInteger(row.member_rank ?? row.clan_rank ?? row.rank),
    username: row.display_name || row.username || `user_${row.user_id}`,
    total_points: finiteNumber(row.member_points ?? row.clan_points ?? row.total_points ?? row.points) || 0
  }));
  const first = rows[0] || {};
  return {
    ...payload,
    clan_name: payload.clan_name || first.source_clan || first.clan_name || clanName,
    battle: first.battle_key || payload.battle || null,
    display_name: first.event_name || first.battle_display_name || payload.display_name || payload.battle || null,
    clan_rank: positiveInteger(first.source_clan_rank ?? first.source_clan_leaderboard_rank ?? payload.clan_rank),
    clan_points: finiteNumber(first.source_clan_points ?? first.source_clan_leaderboard_points ?? payload.clan_points),
    snapshot_at: payload.snapshot_at || first.fetched_at || first.updated_at || null,
    rows
  };
}

async function fetchClanActivityDetailPayloadForCommand(clanName, env, options = {}) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/clans/activity/detail", apiBase);
  apiUrl.searchParams.set("clan", clanName);
  apiUrl.searchParams.set("limit", "120");
  if (options.battle) apiUrl.searchParams.set("battle", options.battle);
  const response = await fetchClanApi(env, apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "Luna-Clan-Lookup-Activity-Fallback" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `Clan activity API failed (${response.status}).`);
  }
  return payload;
}

async function fetchClanLiveLookupPayloadForCommand(clanName, env) {
  const apiBase = String(env.LIVE_CLAN_LOOKUP_BASE || env.CLAN_LOOKUP_BASE || "https://clan-lookup.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = new URL("/", `${apiBase}/`);
  apiUrl.searchParams.set("clan", clanName);
  const response = await fetch(apiUrl.toString(), {
    headers: { Accept: "application/json", "User-Agent": "Luna-Clan-Lookup-Live-Fallback" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.error || payload.message || `Live clan lookup failed (${response.status}).`);
  }
  return payload;
}

function normalizeClanLookupPayloadForCommand(payload, fallbackClan) {
  const value = payload && typeof payload === "object" ? payload : {};
  if (Array.isArray(value.members) || value.clan || value.activeBattle) {
    return normalizeLiveClanLookupPayloadForCommand(value, fallbackClan);
  }
  if (Array.isArray(value.roster) || value.summary) {
    return normalizeClanActivityLookupPayloadForCommand(value, fallbackClan);
  }
  return {
    ...value,
    rows: (Array.isArray(value.rows) ? value.rows : []).map(normalizeClanLookupMemberRow)
  };
}

function normalizeClanActivityLookupPayloadForCommand(payload, fallbackClan) {
  const summary = payload.summary && typeof payload.summary === "object" ? payload.summary : {};
  const roster = Array.isArray(payload.roster) ? payload.roster : [];
  return {
    ...payload,
    clan_name: payload.clan_name || summary.clan_name || fallbackClan,
    battle: payload.battle || summary.battle_key || null,
    display_name: payload.display_name || summary.battle_display_name || payload.battle || null,
    battle_start_iso: payload.battle_start_iso || summary.battle_started_at || null,
    battle_end_iso: payload.battle_end_iso || summary.battle_ended_at || null,
    clan_rank: positiveInteger(summary.rank ?? payload.clan_rank),
    clan_points: finiteNumber(summary.points ?? payload.clan_points),
    icon_id: summary.icon_id || payload.icon_id || null,
    icon_url: summary.icon_url || payload.icon_url || null,
    kick_available: summary.kick_available ?? payload.kick_available,
    member_count: positiveInteger(summary.current_members ?? payload.member_count) || roster.length,
    starting_members: positiveInteger(summary.starting_members ?? payload.starting_members),
    new_members: positiveInteger(summary.new_members ?? payload.new_members),
    lost_members: positiveInteger(summary.lost_members ?? payload.lost_members),
    snapshot_at: summary.last_seen_at || payload.snapshot_at || payload.generated_at || null,
    rows: roster.map(normalizeClanLookupMemberRow)
  };
}

function normalizeLiveClanLookupPayloadForCommand(payload, fallbackClan) {
  const clan = payload.clan && typeof payload.clan === "object" ? payload.clan : {};
  const battle = payload.battle && typeof payload.battle === "object" ? payload.battle : {};
  const activeBattle = payload.activeBattle && typeof payload.activeBattle === "object" ? payload.activeBattle : {};
  const rankPayload = payload.rank && typeof payload.rank === "object" ? payload.rank : {};
  const members = Array.isArray(payload.members) ? payload.members : [];
  return {
    ...payload,
    clan_name: clan.name || payload.clan_name || fallbackClan,
    battle: battle.battleId || activeBattle.configName || payload.battle || null,
    display_name: activeBattle.configName || battle.battleId || payload.display_name || null,
    clan_rank: positiveInteger(rankPayload.rank ?? payload.rank ?? payload.clan_rank),
    clan_points: finiteNumber(battle.totalPoints ?? rankPayload.points ?? payload.clan_points),
    icon_id: clan.icon || payload.icon_id || null,
    icon_url: clan.icon_url || payload.icon_url || null,
    owner_user_id: positiveInteger(clan.owner ?? payload.owner_user_id),
    guild_level: positiveInteger(clan.guildLevel ?? payload.guild_level),
    country_code: clan.countryCode || payload.country_code || null,
    member_count: positiveInteger(clan.memberCount ?? payload.member_count) || members.length,
    snapshot_at: payload.pulledAt || payload.snapshot_at || payload.generated_at || null,
    rows: members.map(normalizeClanLookupMemberRow)
  };
}

function normalizeClanLookupMemberRow(row, index = 0) {
  const value = row && typeof row === "object" ? row : {};
  const userId = positiveInteger(value.user_id ?? value.userId ?? value.roblox_user_id);
  const username = String(
    value.username ||
    value.display_name ||
    value.displayName ||
    (userId ? `user_${userId}` : "Unknown")
  ).trim();
  return {
    ...value,
    rank: positiveInteger(value.rank ?? value.member_rank) || index + 1,
    username,
    user_id: userId,
    avatar_url: value.avatar_url || value.avatarUrl || null,
    join_time: value.join_time || value.joinDate || null,
    permission_level: positiveInteger(value.permission_level ?? value.permissionLevel),
    role: value.role || null,
    total_points: finiteNumber(value.total_points ?? value.points ?? value.member_points ?? value.clan_points) || 0,
    gain_5m: finiteNumber(value.gain_5m),
    gain_1h: finiteNumber(value.gain_1h ?? value.projected_gain_1h),
    gain_12h: finiteNumber(value.gain_12h),
    gain_24h: finiteNumber(value.gain_24h)
  };
}

function clanLookupPayloadScore(payload, rows) {
  const members = Array.isArray(rows) ? rows : [];
  return members.length * 100
    + (payload?.clan_rank ? 20 : 0)
    + (payload?.clan_points ? 20 : 0)
    + (payload?.icon_url ? 10 : 0)
    + (payload?.member_count ? 5 : 0)
    + (payload?.owner_user_id ? 3 : 0)
    + (payload?.guild_level ? 3 : 0);
}

function buildClanLookupMessage(data, options = {}) {
  const payload = data.payload || {};
  const members = (data.rows || [])
    .slice()
    .sort((a, b) => {
      const rankA = positiveInteger(a.rank);
      const rankB = positiveInteger(b.rank);
      if (rankA && rankB && rankA !== rankB) return rankA - rankB;
      if (rankA && !rankB) return -1;
      if (!rankA && rankB) return 1;
      return (finiteNumber(b.total_points) || 0) - (finiteNumber(a.total_points) || 0)
        || String(a.username || "").localeCompare(String(b.username || ""));
    });
  const pageSize = CLAN_LOOKUP_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(members.length / pageSize));
  const page = clampPage(options.page, totalPages);
  const start = page * pageSize;
  const rows = members.slice(start, start + pageSize);
  const displayClan = payload.clan_name || data.topRow?.clan_name || "Unknown";
  const points = finiteNumber(payload.clan_points ?? data.topRow?.points);
  const iconUrl = payload.icon_url || data.topRow?.icon_url || null;
  const eventName = payload.display_name || data.topRow?.battle_display_name || data.top?.displayName || data.top?.battle || "Unknown";
  const memberCount = positiveInteger(payload.member_count) || members.length;
  const memberText = memberCount && memberCount !== members.length && members.length
    ? `${fullNumber(members.length)} loaded / ${fullNumber(memberCount)} listed`
    : fullNumber(memberCount || members.length);
  const memberLines = rows.length
    ? rows.map((row, index) => clanLookupMemberLine(row, start + index + 1))
    : ["No current member rows were found for this clan."];
  const endLine = payload.battle_end_iso ? `**Ends:** ${discordTime(payload.battle_end_iso)}` : "";
  const levelLine = payload.guild_level ? `**Level:** ${fullNumber(payload.guild_level)}` : "";
  const ownerLine = payload.owner_user_id ? `**Owner ID:** ${fullNumber(payload.owner_user_id)}` : "";
  const kickLine = payload.kick_available ? `**Kick Cooldown:** ${escapeDiscordMarkdown(String(payload.kick_available))}` : "";
  const movementLine = payload.new_members || payload.lost_members
    ? `**Movement:** +${fullNumber(payload.new_members || 0)} / -${fullNumber(payload.lost_members || 0)}`
    : "";
  const updated = payload.snapshot_at || data.topRow?.fetched_at ? discordTime(payload.snapshot_at || data.topRow?.fetched_at) : "Unknown";
  const headerText = [
    `## ${escapeDiscordMarkdown(String(displayClan).toUpperCase())}`,
    `**Current Event:** ${escapeDiscordMarkdown(eventName)}`,
    `**Current Rank:** ${rank(payload.clan_rank ?? data.topRow?.rank)}`,
    `**Total Stars:** ${points === null ? "-" : shortNumber(points)}`,
    `**Members:** ${memberText}`,
    levelLine,
    ownerLine,
    kickLine,
    movementLine,
    endLine,
    `**Updated:** ${updated}`
  ].filter(Boolean).join("\n");
  const header = iconUrl
    ? {
        type: COMPONENT_TYPE_SECTION,
        components: [{ type: COMPONENT_TYPE_TEXT_DISPLAY, content: headerText }],
        accessory: {
          type: COMPONENT_TYPE_THUMBNAIL,
          media: { url: iconUrl },
          description: `${displayClan} clan icon`
        }
      }
    : { type: COMPONENT_TYPE_TEXT_DISPLAY, content: headerText };

  return {
    flags: MESSAGE_FLAG_COMPONENTS_V2 | (ephemeralResponses(options.env) ? MESSAGE_FLAG_EPHEMERAL : 0),
    allowed_mentions: { parse: [] },
    components: [
      {
        type: COMPONENT_TYPE_CONTAINER,
        accent_color: 0x5865f2,
        components: [
          header,
          { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
          {
            type: COMPONENT_TYPE_TEXT_DISPLAY,
            content: memberLines.join("\n").slice(0, 3900)
          }
        ]
      },
      ...clanLookupButtons(options.ownerId, displayClan, page, totalPages)
    ]
  };
}

function clanLookupMemberLine(row, number) {
  const rankValue = positiveInteger(row.rank) || number;
  const name = escapeDiscordMarkdown(row.username || `user_${row.user_id || number}`);
  const points = shortNumber(row.total_points);
  const gain = topGainText(row);
  return `#${String(rankValue).padStart(2, "0")} **${name}** · ${points} stars${gain}`;
}

function clanLookupButtons(ownerId, clanName, page, totalPages) {
  if (totalPages <= 1) {
    return [{
      type: COMPONENT_TYPE_ACTION_ROW,
      components: [
        historyButton("Close", clanLookupCustomId(ownerId, clanName, page, "close"), BUTTON_STYLE_DANGER, false)
      ]
    }];
  }
  return [{
    type: COMPONENT_TYPE_ACTION_ROW,
    components: [
      historyButton("Previous", clanLookupCustomId(ownerId, clanName, page - 1, "previous"), BUTTON_STYLE_SECONDARY, page <= 0),
      historyButton(`Page ${page + 1}/${totalPages}`, clanLookupCustomId(ownerId, clanName, page, "indicator"), BUTTON_STYLE_SECONDARY, true),
      historyButton("Next", clanLookupCustomId(ownerId, clanName, page + 1, "next"), BUTTON_STYLE_SECONDARY, page >= totalPages - 1),
      historyButton("Close", clanLookupCustomId(ownerId, clanName, page, "close"), BUTTON_STYLE_DANGER, false)
    ]
  }];
}

function clampPage(page, totalPages) {
  return Math.max(0, Math.min(Math.max(1, totalPages) - 1, Math.floor(Number(page) || 0)));
}

function normalizeCommandText(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeCommandTextLoose(value) {
  return normalizeCommandText(value).replace(/[o0]/g, "o");
}

function commandErrorMessage(title, err, env) {
  const message = truncateHistoryText(err?.message || String(err), 1500);
  return {
    flags: MESSAGE_FLAG_COMPONENTS_V2 | (ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : 0),
    allowed_mentions: { parse: [] },
    attachments: [],
    components: [
      {
        type: COMPONENT_TYPE_CONTAINER,
        accent_color: 0xff6b6b,
        components: [
          {
            type: COMPONENT_TYPE_TEXT_DISPLAY,
            content: `## ${escapeDiscordMarkdown(title)}\n${escapeDiscordMarkdown(message)}`
          }
        ]
      }
    ]
  };
}



function parsePs99RestartAnalyticsCustomId(value) {
  const parts = String(value || "").split("|");
  if (parts.length !== 3 || parts[0] !== "ps99a") return null;
  const action = String(parts[1] || "").trim().toLowerCase();
  const stage = String(parts[2] || "").trim().toLowerCase();
  if (!["archive_low_turnover", "archive_duplicates", "post_review_cards", "refresh"].includes(action)) return null;
  if (!["prompt", "confirm", "cancel", "run"].includes(stage)) return null;
  return { action, stage };
}

async function handlePs99RestartAnalyticsComponent(interaction, env, ctx, state) {
  const permitted = await memberCanManageServerTracker(interaction, env, {
    allowDiscordManage: false
  });

  if (!permitted) {
    return messageResponse(
      "You need the configured Luna administrator role to manage restart analytics.",
      true
    );
  }

  if (state.action === "archive_low_turnover" && state.stage === "prompt") {
    return {
      type: INTERACTION_RESPONSE_CHANNEL_MESSAGE,
      data: {
        content: [
          "**Archive recommended maintenance candidates?**",
          "",
          "This archives every pending **Ready for Review** candidate recommended by the dashboard policy:",
          "- has confidence of 19% or less;",
          "- was triggered only by Public Turnover;",
          "- has not already been reviewed.",
          "",
          "Archived candidates are removed from the pending queue and excluded from detector calibration."
        ].join("\n"),
        components: [{
          type: COMPONENT_TYPE_ACTION_ROW,
          components: [
            {
              type: COMPONENT_TYPE_BUTTON,
              style: BUTTON_STYLE_DANGER,
              label: "Archive Recommended",
              custom_id: "ps99a|archive_low_turnover|confirm"
            },
            {
              type: COMPONENT_TYPE_BUTTON,
              style: BUTTON_STYLE_SECONDARY,
              label: "Cancel",
              custom_id: "ps99a|archive_low_turnover|cancel"
            }
          ]
        }],
        allowed_mentions: { parse: [] },
        flags: MESSAGE_FLAG_EPHEMERAL
      }
    };
  }

  if (state.action === "archive_duplicates" && state.stage === "prompt") {
    return {
      type: INTERACTION_RESPONSE_CHANNEL_MESSAGE,
      data: {
        content: [
          "**Archive equivalent legacy duplicates?**",
          "",
          "For each duplicate group, the earliest candidate is preserved and only later equivalent candidates are archived.",
          "",
          "Equivalence requires:",
          "- opening within five seconds;",
          "- identical trigger types;",
          "- identical confidence.",
          "",
          "This action is auditable and does not delete records."
        ].join("\n"),
        components: [{
          type: COMPONENT_TYPE_ACTION_ROW,
          components: [
            {
              type: COMPONENT_TYPE_BUTTON,
              style: BUTTON_STYLE_DANGER,
              label: "Archive Duplicates",
              custom_id: "ps99a|archive_duplicates|confirm"
            },
            {
              type: COMPONENT_TYPE_BUTTON,
              style: BUTTON_STYLE_SECONDARY,
              label: "Cancel",
              custom_id: "ps99a|archive_duplicates|cancel"
            }
          ]
        }],
        allowed_mentions: { parse: [] },
        flags: MESSAGE_FLAG_EPHEMERAL
      }
    };
  }

  if (state.stage === "cancel") {
    return messageResponse("Pending resolution cancelled.", true);
  }

  ctx.waitUntil(completePs99RestartAnalyticsAction(interaction, env, state));
  return {
    type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
    data: { flags: MESSAGE_FLAG_EPHEMERAL }
  };
}

async function completePs99RestartAnalyticsAction(interaction, env, state) {
  try {
    let result;
    if (state.action === "refresh") {
      result = await ps99RestartIntelligenceApiRequest(
        env,
        "/api/ps99/restart-intelligence/analytics/refresh",
        {
          method: "POST",
          body: {
            reason: `discord_refresh:${interactionUserId(interaction)}`
          }
        }
      );
      await editOriginalInteraction(interaction, {
        content: `Dashboard refreshed. Pending reviews: **${result?.analytics?.lifetime?.pending_review ?? "—"}**.`,
        embeds: [],
        components: [],
        attachments: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (state.action === "archive_duplicates") {
      result = await ps99RestartIntelligenceApiRequest(
        env,
        "/api/ps99/restart-intelligence/resolve-duplicates",
        {
          method: "POST",
          body: {
            dry_run: false,
            reviewed_by: `${interactionUsername(interaction)} (${interactionUserId(interaction)})`
          }
        }
      );
      await editOriginalInteraction(interaction, {
        content: `Archived **${result?.archived_count ?? 0}** equivalent legacy duplicate candidate(s) across **${result?.duplicate_group_count ?? 0}** group(s).`,
        embeds: [],
        components: [],
        attachments: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    if (state.action === "post_review_cards") {
      result = await ps99RestartIntelligenceApiRequest(
        env,
        "/api/ps99/restart-intelligence/refresh-all",
        {
          method: "POST",
          body: {
            limit: 5,
            channel_id: "1530459886654197790",
            status: "ready_for_review",
            pending_only: true,
            include_without_message: true,
            attach_report: false,
            allow_partial_success: true,
            refresh_summary: true
          }
        }
      );
      await editOriginalInteraction(interaction, {
        content: [
          `Posted or refreshed **${result?.succeeded ?? 0}** ready-for-review candidate card(s).`,
          result?.failed
            ? `**${result.failed}** failed. Check the Worker response/logs for details.`
            : "The review cards should now show the Confirm Restart / Not a Restart / Unsure / Version Migration buttons."
        ].join("\n"),
        embeds: [],
        components: [],
        attachments: [],
        allowed_mentions: { parse: [] }
      });
      return;
    }

    result = await ps99RestartIntelligenceApiRequest(
      env,
      "/api/ps99/restart-intelligence/resolve-pending",
      {
        method: "POST",
        body: {
          mode: "archive_low_turnover",
          resolution: "archived",
          confidence_max: 19,
          dry_run: false,
          reviewed_by: `${interactionUsername(interaction)} (${interactionUserId(interaction)})`,
          notes: "Archived from the PS99 Restart Intelligence operator dashboard."
        }
      }
    );

    await editOriginalInteraction(interaction, {
      content: `Resolved **${result?.resolved_count ?? 0}** low-confidence turnover-only pending candidate(s).`,
      embeds: [],
      components: [],
      attachments: [],
      allowed_mentions: { parse: [] }
    });
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `Restart analytics action failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      attachments: [],
      allowed_mentions: { parse: [] }
    });
  }
}

function parsePs99RestartReviewCustomId(value) {
  const parts = String(value || "").split("|");
  if (parts.length !== 3 || parts[0] !== "ps99r") return null;
  const action = String(parts[1] || "").trim().toLowerCase();
  const candidateId = String(parts[2] || "").trim();
  const allowed = new Set([
    "confirmed_restart",
    "not_a_restart",
    "unsure",
    "version_migration",
    "needs_more_evidence",
    "report"
  ]);
  if (!allowed.has(action) || !candidateId.startsWith("ps99-candidate:")) return null;
  return { action, candidateId };
}

async function handlePs99RestartReviewComponent(interaction, env, ctx, state) {
  const permitted = await memberCanManageServerTracker(interaction, env, {
    allowDiscordManage: false
  });

  if (!permitted) {
    return messageResponse(
      "You need the configured Luna administrator role to review restart candidates.",
      true
    );
  }

  if (state.action === "report") {
    ctx.waitUntil(completePs99RestartEvidenceDownload(interaction, env, state));
    return {
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: { flags: MESSAGE_FLAG_EPHEMERAL }
    };
  }

  ctx.waitUntil(completePs99RestartReview(interaction, env, state));
  return { type: INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE };
}

async function completePs99RestartReview(interaction, env, state) {
  try {
    await ps99RestartIntelligenceApiRequest(env, "/api/ps99/restart-intelligence/review", {
      method: "POST",
      body: {
        candidate_id: state.candidateId,
        status: state.action,
        reviewed_by: `${interactionUsername(interaction)} (${interactionUserId(interaction)})`,
        notes: ""
      }
    });
  } catch (err) {
    console.error(
      "PS99 restart review interaction failed",
      state.candidateId,
      state.action,
      err?.message || String(err)
    );
  }
}

async function completePs99RestartEvidenceDownload(interaction, env, state) {
  try {
    const report = await ps99RestartIntelligenceReportRequest(env, state.candidateId);
    const filename = `${state.candidateId.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120)}.txt`;
    await editOriginalInteraction(interaction, {
      content: `Evidence report for \`${state.candidateId}\``,
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] },
      _file: {
        filename,
        contentType: "text/plain;charset=utf-8",
        bytes: new TextEncoder().encode(report)
      }
    });
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `Evidence download failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      attachments: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

async function ps99RestartIntelligenceApiRequest(env, path, options = {}) {
  const token = String(
    env.RESTART_INTELLIGENCE_API_TOKEN ||
    env.INGEST_ADMIN_TOKEN ||
    env.REGISTER_ADMIN_TOKEN ||
    ""
  ).trim();
  if (!token) {
    throw httpError(500, "Missing RESTART_INTELLIGENCE_API_TOKEN on the Discord interactions Worker.");
  }

  const base = hasClanApiServiceBinding(env)
    ? "https://c0ld-clan-api-worker.service"
    : String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const url = new URL(path, base);
  const init = {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Restart-Review"
    }
  };
  if (options.body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const request = new Request(url.toString(), init);
  const response = hasClanApiServiceBinding(env)
    ? await env.CLAN_API_WORKER.fetch(request)
    : await fetch(request);
  const text = await response.text();
  let payload = {};
  try {
    payload = JSON.parse(text || "{}");
  } catch {}

  if (!response.ok || payload.ok === false) {
    throw httpError(
      response.status || 502,
      payload.message || `Restart Intelligence API failed (${response.status}): ${text.slice(0, 300)}`
    );
  }
  return payload;
}

async function ps99RestartIntelligenceReportRequest(env, candidateId) {
  const token = String(
    env.RESTART_INTELLIGENCE_API_TOKEN ||
    env.INGEST_ADMIN_TOKEN ||
    env.REGISTER_ADMIN_TOKEN ||
    ""
  ).trim();
  if (!token) {
    throw httpError(500, "Missing RESTART_INTELLIGENCE_API_TOKEN on the Discord interactions Worker.");
  }

  const base = hasClanApiServiceBinding(env)
    ? "https://c0ld-clan-api-worker.service"
    : String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const url = new URL("/api/ps99/restart-intelligence/report", base);
  url.searchParams.set("candidate_id", candidateId);

  const request = new Request(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/plain",
      "User-Agent": "c0ld-Discord-Restart-Review"
    }
  });
  const response = hasClanApiServiceBinding(env)
    ? await env.CLAN_API_WORKER.fetch(request)
    : await fetch(request);
  const text = await response.text();
  if (!response.ok) {
    throw httpError(
      response.status || 502,
      `Restart evidence report failed (${response.status}): ${text.slice(0, 300)}`
    );
  }
  return text;
}

function handleLeagueChartComponent(interaction, env, ctx) {
  const state = parseLeagueChartCustomId(interaction.data?.custom_id);
  if (!state) {
    return messageResponse("That league chart control is no longer valid. Run `/league info` again.", true);
  }

  ctx.waitUntil(completeLeagueInfoInteraction(interaction, env, state.leagueName, {
    chartHours: state.hours
  }));

  return { type: INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE };
}

const leagueRefreshesInFlight = new Map();

async function fetchLeagueCurrentPayload(leagueName, env, options = {}) {
  const initial = await readStoredLeaguePayload(leagueName, env);
  const cached = initial.payload;
  const needsRefresh = !cached || leaguePayloadAgeSeconds(cached) > leagueOnDemandMaxAgeSeconds(env);

  if (!needsRefresh) {
    return options.debug
      ? { payload: cached, attempts: initial.attempts, refresh: null, cache_status: "fresh" }
      : cached;
  }

  const refresh = await refreshLeagueOnDemand(leagueName, env).catch(err => ({
    ok: false,
    status: err?.status || 502,
    message: err?.message || String(err)
  }));

  if (refresh.ok) {
    const refreshed = await readStoredLeaguePayload(leagueName, env);
    if (refreshed.payload) {
      return options.debug
        ? {
            payload: refreshed.payload,
            attempts: [...initial.attempts, ...refreshed.attempts],
            refresh,
            cache_status: cached ? "refreshed_stale" : "hydrated"
          }
        : refreshed.payload;
    }
    initial.attempts.push(...refreshed.attempts);
  }

  // A temporary upstream failure should not make previously stored league data unusable.
  if (cached) {
    return options.debug
      ? { payload: cached, attempts: initial.attempts, refresh, cache_status: "stale_fallback" }
      : cached;
  }

  const last = initial.attempts[initial.attempts.length - 1] || {};
  const refreshMessage = String(refresh.message || "");
  const leagueMissing = /(?:HTTP\s+404|not\s+found)/i.test(refreshMessage);
  const message = leagueMissing
    ? `League ${leagueName} is not present in the current League event.`
    : refreshMessage
      ? `Could not refresh League ${leagueName}: ${refreshMessage}`
      : last.message || `No stored league data found for ${leagueName}.`;
  const err = httpError(refresh.status || last.status || 502, message);
  err.attempts = initial.attempts.map(attempt => leagueAttemptSummary(attempt));
  if (options.debug) {
    return { payload: null, attempts: initial.attempts, refresh, cache_status: "miss", error: err };
  }
  throw err;
}

async function readStoredLeaguePayload(leagueName, env) {
  const attempts = [];

  for (const target of leagueApiTargets(env)) {
    const apiUrl = new URL("/api/leagues/current", target.base);
    apiUrl.searchParams.set("league", leagueName);
    apiUrl.searchParams.set("rank_lookup", "false");
    apiUrl.searchParams.set("fresh", "1");

    const result = await fetchLeagueCurrentAttempt(target, apiUrl);
    attempts.push(result);
    if (result.response_ok && result.payload?.ok !== false && Array.isArray(result.payload?.rows) && result.payload.rows.length > 0) {
      return { payload: result.payload, attempts };
    }
  }

  return { payload: null, attempts };
}

function leagueOnDemandMaxAgeSeconds(env) {
  const value = Number(env.LEAGUE_ON_DEMAND_MAX_AGE_SECONDS || 1800);
  return Math.min(86400, Math.max(60, Number.isFinite(value) ? value : 1800));
}

function leaguePayloadAgeSeconds(payload) {
  const timestamp = new Date(payload?.snapshot_at || payload?.fetched_at || payload?.updated_at || 0).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, (Date.now() - timestamp) / 1000);
}

function refreshLeagueOnDemand(leagueName, env) {
  const key = String(leagueName || "").trim().toLowerCase();
  const existing = leagueRefreshesInFlight.get(key);
  if (existing) return existing;

  const refresh = performLeagueOnDemandRefresh(leagueName, env)
    .finally(() => leagueRefreshesInFlight.delete(key));
  leagueRefreshesInFlight.set(key, refresh);
  return refresh;
}

async function performLeagueOnDemandRefresh(leagueName, env) {
  const token = String(env.LEAGUE_INGEST_ADMIN_TOKEN || "").trim();
  if (!token) {
    throw httpError(500, "LEAGUE_INGEST_ADMIN_TOKEN is not configured on the Discord Worker.");
  }

  const attempts = [];
  for (const target of leagueApiTargets(env)) {
    const apiUrl = new URL("/api/leagues/ingest", target.base);
    apiUrl.searchParams.set("league", leagueName);
    const result = await fetchLeagueCurrentAttempt(target, apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    attempts.push(result);
    if (result.response_ok && result.payload?.ok !== false) {
      return {
        ok: true,
        source: result.source,
        status: result.status,
        league_name: result.payload?.league_name || leagueName,
        rows_inserted: result.payload?.rows_inserted ?? null,
        attempts: attempts.map(attempt => leagueAttemptSummary(attempt))
      };
    }
  }

  const last = attempts[attempts.length - 1] || {};
  const err = httpError(last.status || 502, last.message || `League refresh failed for ${leagueName}.`);
  err.attempts = attempts.map(attempt => leagueAttemptSummary(attempt));
  throw err;
}

function leagueChartHours(value) {
  const number = Number(value);
  return LEAGUE_CHART_HOURS.includes(number) ? number : 24;
}

function leagueChartComponents(leagueName, selectedHours) {
  const safeLeague = encodeURIComponent(String(leagueName || "").trim()).slice(0, 72);
  return [
    {
      type: COMPONENT_TYPE_ACTION_ROW,
      components: LEAGUE_CHART_HOURS.map(hours => ({
        type: COMPONENT_TYPE_BUTTON,
        style: hours === selectedHours ? BUTTON_STYLE_PRIMARY : BUTTON_STYLE_SECONDARY,
        label: `${hours}h`,
        custom_id: `lgchart:${hours}:${safeLeague}`
      }))
    }
  ];
}

function parseLeagueChartCustomId(value) {
  const text = String(value || "");
  const match = text.match(/^lgchart:(1|6|12|24):(.+)$/);
  if (!match) return null;

  return {
    hours: leagueChartHours(match[1]),
    leagueName: decodeURIComponent(match[2] || "").trim()
  };
}

async function fetchLeagueHistoryPayload(leagueName, env, hours = 24, leagueRunKey = "") {
  const historyHours = leagueChartHours(hours);
  let emptyPayload = null;
  for (const target of leagueApiTargets(env)) {
    const apiUrl = new URL("/api/leagues/history", target.base);
    apiUrl.searchParams.set("league", leagueName);
    apiUrl.searchParams.set("hours", String(Math.max(3, historyHours + 2)));
    apiUrl.searchParams.set("limit", "50000");
    if (String(leagueRunKey || "").trim()) {
      apiUrl.searchParams.set("run", String(leagueRunKey).trim());
    }

    const result = await fetchLeagueCurrentAttempt(target, apiUrl);
    if (result.response_ok && result.payload?.ok !== false && Array.isArray(result.payload?.rows)) {
      if (result.payload.rows.length) return result.payload;
      emptyPayload ||= result.payload;
    }
  }

  return emptyPayload || { rows: [] };
}

async function renderLeagueMemberGrowthChartPng(payload, historyRows, options = {}) {
  const hours = leagueChartHours(options.hours);
  const [loadedFonts, leagueIcon] = await Promise.all([
    loadHistoryFonts(),
    hourlyLoadLeagueIcon(payload).catch(() => null)
  ]);
  const fonts = { ...loadedFonts, rowBold: loadedFonts.hourlyBold || loadedFonts.bold };
  const width = 1600;
  const height = 1040;
  const color = searchChartBoardColors();
  const canvas = new HistoryPixelCanvas(width, height, color.background, 1);
  const members = leagueChartMembers(payload).slice(0, 4);
  const series = leagueMemberGrowthSeries(payload, historyRows, members, { hours });
  const displayLeagueName = String(payload?.league_name || "League").trim() || "League";

  const panel = { x: 32, y: 30, w: width - 64, h: height - 60 };
  canvas.fillRect(panel.x, panel.y, panel.w, panel.h, color.panel);
  hourlyDrawMysticSmoke(canvas, width, height, color);
  hourlyDrawPanelFrame(canvas, panel.x, panel.y, panel.w, panel.h, color.line);
  searchChartDrawRainbowBar(canvas, panel.x + 22, panel.y + 12, panel.w - 44, 5, color);
  hourlyDrawHeaderOrnaments(canvas, width / 2, 116, color);
  searchChartDrawAvatarBadge(canvas, fonts, displayLeagueName, leagueIcon, width / 2 - 47, 70, 94, color);
  searchChartDrawPlayerHeader(canvas, fonts, displayLeagueName, rank(payload?.league_rank), width / 2, 91, color);

  const chartPanel = { x: 54, y: 206, w: 1492, h: 760 };
  hourlyDrawPanel(canvas, chartPanel.x, chartPanel.y, chartPanel.w, chartPanel.h, color.panelDeep, color.line);
  hourlyDrawColumnAura(canvas, chartPanel.x, chartPanel.y, chartPanel.w, chartPanel.h, 1, color);
  hourlyDrawColumnHeader(canvas, fonts, chartPanel.x, chartPanel.y, chartPanel.w, 50, ["Member Growth", `Last ${hours} Hour${hours === 1 ? "" : "s"}`], 1, color);

  if (!series.some(item => item.points.length >= 1)) {
    const emptyPlot = { x: chartPanel.x + 56, y: chartPanel.y + 84, w: chartPanel.w - 104, h: 430 };
    hourlyBlendRoundedRect(canvas, emptyPlot.x, emptyPlot.y, emptyPlot.w, emptyPlot.h, 10, color.inset, 235);
    hourlyDrawPanelFrame(canvas, emptyPlot.x, emptyPlot.y, emptyPlot.w, emptyPlot.h, color.line);
    canvas.drawFontText(fonts.regular, "Not enough stored league history to chart this league yet.", emptyPlot.x + 28, emptyPlot.y + 48, 20, color.muted, emptyPlot.w - 56);
    return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
  }

  const allPoints = series.flatMap(item => item.points);
  const maxT = Math.max(...allPoints.map(point => point.t));
  const chartMinT = maxT - hours * 60 * 60 * 1000;
  const chartMaxT = maxT;
  const visibleSeries = series
    .map(item => ({
      ...item,
      points: item.points.filter(point => point.t >= chartMinT && point.t <= chartMaxT)
    }))
    .filter(item => item.points.length);
  const chartSeries = visibleSeries;
  const visiblePoints = chartSeries.flatMap(item => item.points);
  const markers = await fetchSearchChartMarkers(options.env || {}, chartMinT, chartMaxT).catch(() => ({ updates: [], restarts: [] }));
  const visibleUpdates = (markers.updates || []).filter(marker => marker.t >= chartMinT && marker.t <= chartMaxT);
  const visibleRestarts = (markers.restarts || []).filter(marker => marker.t >= chartMinT && marker.t <= chartMaxT);

  const plot = { x: chartPanel.x + 56, y: chartPanel.y + 84, w: chartPanel.w - 104, h: 380 };
  hourlyBlendRoundedRect(canvas, plot.x, plot.y, plot.w, plot.h, 10, color.inset, 235);
  hourlyDrawPanelFrame(canvas, plot.x, plot.y, plot.w, plot.h, color.line);

  const pointValues = visiblePoints.map(point => point.value).filter(Number.isFinite);
  const pointsMin = pointValues.length ? Math.min(...pointValues) : 0;
  const pointsMax = pointValues.length ? Math.max(...pointValues) : 1;
  const pointRange = pointsMax - pointsMin;
  const pointPad = Math.max(1, pointRange > 0 ? pointRange * 0.14 : pointsMax * 0.08);
  const yMin = Math.max(0, pointsMin - pointPad);
  const yMax = pointsMax + pointPad;
  const xForTime = time => chartMaxT === chartMinT ? plot.x : plot.x + ((time - chartMinT) / Math.max(1, chartMaxT - chartMinT)) * plot.w;
  const yFor = point => yMax === yMin ? plot.y + plot.h / 2 : plot.y + (1 - ((point.value - yMin) / Math.max(1, yMax - yMin))) * plot.h;

  for (let i = 0; i <= 4; i += 1) {
    const yy = plot.y + (i / 4) * plot.h;
    const value = yMax - (i / 4) * (yMax - yMin);
    const label = shortNumber(value);
    const labelFont = fonts.rowBold || fonts.bold;
    const labelSize = 15;
    const labelWidth = canvas.measureFontText(labelFont, label, labelSize);
    canvas.fillRect(plot.x, yy, plot.w, 1, [39, 49, 68, 255]);
    canvas.drawFontText(labelFont, label, Math.max(24, plot.x - labelWidth - 16), yy - 9, labelSize, color.muted, labelWidth + 12);
  }

  const xTickCount = hours <= 1 ? 2 : Math.min(12, hours);
  for (let i = 0; i <= xTickCount; i += 1) {
    const xx = plot.x + (i / xTickCount) * plot.w;
    const tickTime = chartMinT + (i / xTickCount) * (chartMaxT - chartMinT);
    const tickLabel = hours <= 1 ? chartTimeOfDayAxisLabel(tickTime) : chartHourAxisLabel(tickTime);
    const tickLabelWidth = canvas.measureFontText(fonts.rowBold || fonts.bold, tickLabel, 15);
    const tickLabelX = i === 0
      ? plot.x
      : i === xTickCount
        ? plot.x + plot.w - tickLabelWidth
        : Math.max(plot.x, Math.min(plot.x + plot.w - tickLabelWidth, xx - tickLabelWidth / 2));
    canvas.fillRect(xx, plot.y, 1, plot.h, [25, 34, 45, 255]);
    canvas.drawFontText(fonts.rowBold || fonts.bold, tickLabel, tickLabelX, plot.y + plot.h + 22, 15, color.muted, tickLabelWidth + 8);
  }

  visibleUpdates.forEach(marker => {
    const x = xForTime(marker.t);
    searchChartDrawDashedVertical(canvas, x, plot.y, plot.y + plot.h, color.cyan, 7, 6);
  });
  visibleRestarts.forEach(marker => {
    const x = xForTime(marker.t);
    searchChartDrawDashedVertical(canvas, x, plot.y, plot.y + plot.h, color.orange, 10, 5);
  });

  chartSeries.forEach((item, index) => {
    const lineOffset = (index - (chartSeries.length - 1) / 2) * 2;
    const lineY = point => yFor(point) + lineOffset;
    leagueDrawSharpPolyline(canvas, item.points, point => xForTime(point.t), lineY, item.color, 3);
    const last = item.points[item.points.length - 1];
    if (last) chartFillCircle(canvas, xForTime(last.t), lineY(last), 4, item.color);
  });

  leagueDrawMemberPerformanceTable(
    canvas,
    fonts,
    chartSeries,
    chartPanel.x + 34,
    chartPanel.y + 514,
    chartPanel.w - 68,
    color
  );

  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

async function fetchLeaguePlayerPoolRank(query, userId, env) {
  const candidates = [...new Set(
    [String(userId || "").trim(), String(query || "").trim()].filter(Boolean)
  )];

  for (const candidate of candidates) {
    for (const target of leagueApiTargets(env)) {
      const apiUrl = new URL("/api/leagues/solo-leaderboard", target.base);
      apiUrl.searchParams.set("limit", "500");
      apiUrl.searchParams.set("q", candidate);
      const result = await fetchLeagueCurrentAttempt(target, apiUrl);
      if (!result.response_ok || result.payload?.ok === false) continue;

      const rows = Array.isArray(result.payload?.rows) ? result.payload.rows : [];
      const matched = rows.find(item => {
        const itemId = String(item?.user_id || "").trim();
        const wantedId = String(userId || "").trim();
        if (wantedId && itemId === wantedId) return true;
        const wantedName = String(query || "").trim().toLowerCase();
        return wantedName && [item?.username, item?.display_name]
          .some(value => String(value || "").trim().toLowerCase() === wantedName);
      });
      if (!matched) continue;

      return {
        rank: positiveInteger(matched.rank),
        total_global_players: positiveInteger(
          result.payload?.pool_total_players ??
          result.payload?.top_available ??
          result.payload?.total_players
        ),
        fetched_at: matched.fetched_at || result.payload?.snapshot_at || null
      };
    }
  }

  return null;
}

function leagueDrawMemberPerformanceTable(canvas, fonts, series, x, y, width, color) {
  const visible = (series || []).slice(0, 4);
  const headerHeight = 30;
  const rowHeight = 43;
  const columns = [
    { label: "Rank", x: 18, width: 72, align: "left" },
    { label: "Player", x: 92, width: 340, align: "left" },
    { label: "Points", x: 500, width: 130, align: "right" },
    { label: "1h", x: 650, width: 100, align: "right" },
    { label: "6h", x: 770, width: 100, align: "right" },
    { label: "12h", x: 890, width: 100, align: "right" },
    { label: "24h", x: 1010, width: 100, align: "right" },
    { label: "Up", x: 1150, width: 120, align: "right" },
    { label: "Down", x: 1290, width: 120, align: "right" }
  ];
  const totalHeight = headerHeight + rowHeight * Math.max(4, visible.length);
  const activityDividerX = x + 1130;

  hourlyBlendRoundedRect(canvas, x, y, width, totalHeight, 8, color.inset, 225);
  hourlyDrawPanelFrame(canvas, x, y, width, totalHeight, color.line);
  canvas.fillRect(x, y + headerHeight, width, 1, color.line);
  canvas.fillRect(activityDividerX, y + 5, 1, totalHeight - 10, color.line);

  for (const column of columns) {
    if (column.align === "right") {
      leagueDrawRightTextClean(canvas, fonts.rowBold || fonts.bold, column.label, x + column.x + column.width, y + 6, 16, color.white, column.width);
    } else {
      canvas.drawFontText(fonts.rowBold || fonts.bold, column.label, x + column.x, y + 6, 16, color.white, column.width);
    }
  }

  for (let index = 0; index < 4; index += 1) {
    const item = visible[index] || null;
    const rowY = y + headerHeight + index * rowHeight;
    if (index % 2 === 0) canvas.fillRect(x + 1, rowY + 1, width - 2, rowHeight - 1, [18, 25, 37, 190]);
    if (index > 0) canvas.fillRect(x + 1, rowY, width - 2, 1, color.line);
    if (!item) continue;

    canvas.fillRect(x + 1, rowY, 4, rowHeight, item.color);
    canvas.drawFontText(fonts.rowBold || fonts.bold, `#${index + 1}`, x + 18, rowY + 9, 20, color.white, 58);
    chartFillCircle(canvas, x + 103, rowY + 21, 5, item.color);
    leagueDrawFittedTextClean(canvas, fonts.rowBold || fonts.bold, item.name, x + 119, rowY + 8, 20, item.color, 310);
    leagueDrawPerformanceValue(canvas, fonts, item.latestPoints, x + 630, rowY + 9, 20, color, false, 120);
    leagueDrawPerformanceValue(canvas, fonts, item.latestGain, x + 750, rowY + 9, 20, color, true, 112);
    leagueDrawPerformanceValue(canvas, fonts, item.gain6h, x + 870, rowY + 9, 20, color, true, 112);
    leagueDrawPerformanceValue(canvas, fonts, item.gain12h, x + 990, rowY + 9, 20, color, true, 112);
    leagueDrawPerformanceValue(canvas, fonts, item.gain24h, x + 1110, rowY + 9, 20, color, true, 112);
    leagueDrawDurationValue(canvas, fonts, item.activeMs, x + 1270, rowY + 9, 20, color, 130);
    leagueDrawDurationValue(canvas, fonts, item.downtimeMs, x + 1410, rowY + 9, 20, color, 130);
  }
}

function leagueDrawPerformanceValue(canvas, fonts, value, rightX, y, size, color, signed, maxWidth) {
  const number = finiteNumber(value);
  const text = number === null
    ? "—"
    : signed && number > 0
      ? `+${shortNumber(number)}`
      : shortNumber(number);
  const textColor = number === null
    ? color.muted
    : signed && number > 0
      ? color.green
      : number < 0
        ? color.red
        : color.white;
  leagueDrawRightTextClean(canvas, fonts.rowBold || fonts.bold, text, rightX, y, size, textColor, maxWidth);
}

function leagueDrawDurationValue(canvas, fonts, value, rightX, y, size, color, maxWidth) {
  const milliseconds = finiteNumber(value);
  const text = milliseconds === null ? "—" : searchChartDurationLabel(milliseconds);
  leagueDrawRightTextClean(canvas, fonts.rowBold || fonts.bold, text, rightX, y, size, color.white, maxWidth);
}

function leagueDrawFittedTextClean(canvas, font, value, x, y, size, rgba, maxWidth = Infinity) {
  const text = historyCardText(value, 10000);
  const fittedSize = leagueFitFontSize(canvas, font, text, size, maxWidth, 14);
  const width = canvas.measureFontText(font, text, fittedSize);
  canvas.drawFontText(font, text, x, y + Math.max(0, (size - fittedSize) / 2), fittedSize, rgba, width + 4);
}

function leagueDrawRightTextClean(canvas, font, value, rightX, y, size, rgba, maxWidth = Infinity) {
  const text = historyCardText(value, 10000);
  const fittedSize = leagueFitFontSize(canvas, font, text, size, maxWidth, 15);
  const width = canvas.measureFontText(font, text, fittedSize);
  canvas.drawFontText(font, text, rightX - width, y + Math.max(0, (size - fittedSize) / 2), fittedSize, rgba, width + 4);
}

function leagueFitFontSize(canvas, font, text, preferredSize, maxWidth, minimumSize) {
  if (!Number.isFinite(maxWidth)) return preferredSize;
  let size = preferredSize;
  while (size > minimumSize && canvas.measureFontText(font, text, size) > maxWidth) size -= 1;
  return size;
}

function leagueDrawSharpPolyline(canvas, points, xFor, yFor, rgba, width = 2) {
  if (!Array.isArray(points) || points.length < 2) return;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (current.breakBefore) continue;

    const x1 = xFor(previous);
    const y1 = yFor(previous);
    const x2 = xFor(current);
    const y2 = yFor(current);
    if (Math.abs(y2 - y1) < 0.5 || x2 <= x1) {
      chartDrawLine(canvas, x1, y1, x2, y2, rgba, width);
      continue;
    }

    // Hold the recorded value across the interval, then use a short, crisp
    // ramp at the new observation instead of implying gradual point growth.
    const intervalWidth = x2 - x1;
    const rampWidth = Math.min(14, Math.max(5, intervalWidth * 0.16));
    const rampStartX = Math.max(x1, x2 - rampWidth);
    chartDrawLine(canvas, x1, y1, rampStartX, y1, rgba, width);
    chartDrawLine(canvas, rampStartX, y1, x2, y2, rgba, width);
  }
}

function leagueChartMembers(payload) {
  return (Array.isArray(payload?.rows) ? payload.rows : [])
    .filter(row => !isLeagueAggregateMemberRow(row))
    .map((row, index) => ({
      row,
      id: String(row.user_id || row.UserID || "").trim(),
      name: leagueMemberName(row, index + 1),
      points: finiteNumber(row.total_points ?? row.points),
      gain1h: finiteNumber(row.gain_1h ?? row.hourly_points ?? row.one_hour_gain),
      gain6h: finiteNumber(row.gain_6h ?? row.six_hour_gain),
      gain12h: finiteNumber(row.gain_12h ?? row.twelve_hour_gain),
      gain24h: finiteNumber(row.gain_24h ?? row.daily_gain ?? row.twenty_four_hour_gain)
    }))
    .filter(item => item.id && item.points !== null)
    .sort((a, b) => b.points - a.points || String(a.name).localeCompare(String(b.name)));
}

function leagueMemberGrowthSeries(payload, historyRows, members, options = {}) {
  const hours = leagueChartHours(options.hours);
  const windowMs = hours * 60 * 60 * 1000;
  const history = Array.isArray(historyRows) ? historyRows : [];
  const currentAt = leagueChartTime(payload?.snapshot_at || payload?.fetched_at || payload?.updated_at) || Date.now();
  const historyTimes = history.map(row => leagueChartTime(row.fetched_at || row.snapshot_at || row.created_at)).filter(Number.isFinite);
  const latest = Math.max(currentAt, ...historyTimes);
  const end = latest;
  const start = end - windowMs;
  const byUser = new Map();

  for (const row of history) {
    const id = String(row.user_id || row.UserID || "").trim();
    const time = leagueChartTime(row.fetched_at || row.snapshot_at || row.created_at);
    const points = finiteNumber(row.total_points ?? row.points);
    if (!id || !Number.isFinite(time) || points === null) continue;
    if (!byUser.has(id)) byUser.set(id, []);
    byUser.get(id).push({ time, points });
  }

  const colors = leagueChartPalette();

  return members.map((member, index) => {
    const storedSamples = leagueQuarterHourPointSamples(
      leagueDedupPointSamples([...(byUser.get(member.id) || []), { time: currentAt, points: member.points }])
    )
      .filter(sample => Number.isFinite(sample.time) && sample.points !== null)
      .sort((a, b) => a.time - b.time);
    const samples = storedSamples.length >= 2
      ? storedSamples
      : leagueDerivedGrowthSamples(member, currentAt, storedSamples);
    const baseline = [...samples].reverse().find(sample => sample.time < start) || null;
    const visibleSamples = samples.filter(sample => sample.time >= start && sample.time <= end);
    if (baseline) visibleSamples.unshift({ time: start, points: baseline.points, synthetic: true });
    const points = [];

    for (let sampleIndex = 0; sampleIndex < visibleSamples.length; sampleIndex += 1) {
      const sample = visibleSamples[sampleIndex];
      const previous = visibleSamples[sampleIndex - 1] || null;
      const intervalGain = previous
        ? Math.max(0, sample.points - previous.points)
        : 0;
      points.push({
        t: sample.time,
        value: sample.points,
        intervalGain,
        breakBefore: Boolean(previous && sample.time - previous.time > SEARCH_CHART_MAX_OBSERVED_GAP_MS)
      });
    }

    const latestGain = member.gain1h !== null
      ? Math.max(0, member.gain1h || 0)
      : leagueGainWithinWindow(samples, end - 60 * 60 * 1000, end);
    const totalGain = leagueGainWithinWindow(samples, start, end);
    const peakGain = points.reduce((max, point) => Math.max(max, Math.max(0, point.intervalGain || 0)), 0);
    const activity = searchChartMetrics(
      points.map(point => ({ t: point.t, points: point.value })),
      start,
      end
    );
    const hasTrackedActivity = activity.activeMs + activity.downtimeMs > 0;

    return {
      id: member.id,
      name: member.name,
      color: colors[index % colors.length],
      points,
      latestPoints: member.points,
      latestGain,
      gain6h: member.gain6h,
      gain12h: member.gain12h,
      gain24h: member.gain24h,
      gain: totalGain,
      totalGain,
      avgGain: totalGain / Math.max(1, hours),
      peakGain,
      activeMs: hasTrackedActivity ? activity.activeMs : null,
      downtimeMs: hasTrackedActivity ? activity.downtimeMs : null
    };
  });
}

function leagueDerivedGrowthSamples(member, currentAt, storedSamples = []) {
  const derived = [...storedSamples];
  const windows = [
    { hours: 24, gain: member.gain24h },
    { hours: 12, gain: member.gain12h },
    { hours: 6, gain: member.gain6h },
    { hours: 1, gain: member.gain1h }
  ];

  for (const window of windows) {
    const gain = finiteNumber(window.gain);
    if (gain === null) continue;
    derived.push({
      time: currentAt - window.hours * 60 * 60 * 1000,
      points: Math.max(0, member.points - Math.max(0, gain)),
      synthetic: true
    });
  }

  derived.push({ time: currentAt, points: member.points });
  return leagueQuarterHourPointSamples(leagueDedupPointSamples(derived))
    .filter(sample => Number.isFinite(sample.time) && sample.points !== null)
    .sort((a, b) => a.time - b.time);
}

function leagueDedupPointSamples(samples) {
  const byTime = new Map();
  for (const sample of samples) {
    if (!Number.isFinite(sample?.time) || sample.points === null) continue;
    byTime.set(String(sample.time), sample);
  }
  return [...byTime.values()];
}

function leagueGainWithinWindow(samples, start, end) {
  const ordered = (samples || [])
    .filter(sample => Number.isFinite(sample?.time) && sample.points !== null && sample.time <= end)
    .sort((a, b) => a.time - b.time);
  if (!ordered.length) return 0;
  const latest = ordered[ordered.length - 1];
  let baseline = null;
  for (const sample of ordered) {
    if (sample.time <= start) baseline = sample;
  }
  if (!baseline) baseline = ordered[0];
  return Math.max(0, latest.points - baseline.points);
}

function leagueChartPalette() {
  return [
    [255, 123, 114, 255],
    [88, 166, 255, 255],
    [126, 231, 135, 255],
    [242, 204, 96, 255],
    [210, 168, 255, 255],
    [86, 212, 221, 255],
    [255, 166, 87, 255],
    [219, 97, 162, 255]
  ];
}

function leagueQuarterHourPointSamples(samples) {
  const intervalMs = 15 * 60 * 1000;
  const buckets = new Map();

  for (const sample of samples || []) {
    if (!Number.isFinite(sample?.time) || sample.points === null) continue;
    const bucketTime = Math.floor(sample.time / intervalMs) * intervalMs;
    const existing = buckets.get(bucketTime);
    if (!existing || sample.time >= existing.sourceTime) {
      buckets.set(bucketTime, {
        ...sample,
        time: bucketTime,
        sourceTime: sample.time
      });
    }
  }

  return [...buckets.values()]
    .sort((a, b) => a.time - b.time)
    .map(({ sourceTime, ...sample }) => sample);
}

function leagueChartTime(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

function leagueApiTargets(env) {
  const defaultBase = "https://yamo-league-api-worker.opal-dde.workers.dev";
  const bases = [...new Set([String(env.LEAGUE_API_BASE || "").trim(), defaultBase].filter(Boolean))]
    .map(base => base.replace(/\/$/, ""));
  const targets = [];

  if (hasLeagueApiServiceBinding(env)) {
    targets.push({
      source: "service_binding",
      base: "https://yamo-league-api-worker.service",
      binding: env.LEAGUE_API_WORKER
    });
  }

  for (const base of bases) {
    targets.push({
      source: base === defaultBase ? "default_public_url" : "configured_public_url",
      base,
      binding: null
    });
  }

  return targets;
}

async function fetchLeagueCurrentAttempt(target, apiUrl, options = {}) {
  const init = {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-League-Worker",
      ...(options.headers || {})
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  };
  const request = new Request(apiUrl.toString(), init);
  try {
    const response = target.binding
      ? await target.binding.fetch(request)
      : await fetch(request);
    const text = await response.text();
    const payload = parseJsonObject(text);

    return {
      source: target.source,
      api_url: apiUrl.toString(),
      status: response.status,
      response_ok: response.ok,
      payload,
      payload_ok: payload?.ok ?? null,
      message: payload?.message || (!response.ok ? truncateText(text, 180) : null),
      row_count: Array.isArray(payload?.rows) ? payload.rows.length : null,
      league_name: payload?.league_name || null,
      league_rank: payload?.league_rank ?? null
    };
  } catch (err) {
    // A misconfigured/self-referencing public Worker URL can raise Cloudflare
    // error 1042 before a Response exists. Return a failed attempt so callers
    // can continue to the service binding/default League Worker target.
    return {
      source: target.source,
      api_url: apiUrl.toString(),
      status: Number(err?.status) || 502,
      response_ok: false,
      payload: {},
      payload_ok: false,
      message: err?.message || String(err),
      row_count: null,
      league_name: null,
      league_rank: null
    };
  }
}

function parseJsonObject(text) {
  try {
    const parsed = JSON.parse(text || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function truncateText(value, length) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, Math.max(0, length - 1))}…` : text;
}

function leagueAttemptSummary(attempt) {
  return {
    source: attempt.source,
    api_url: attempt.api_url,
    status: attempt.status,
    response_ok: attempt.response_ok,
    payload_ok: attempt.payload_ok,
    message: attempt.message,
    row_count: attempt.row_count,
    league_name: attempt.league_name,
    league_rank: attempt.league_rank
  };
}

function leagueMemberName(row, fallbackIndex = null) {
  const userId = String(row?.user_id || row?.UserID || "").trim();
  const candidates = [row?.display_name, row?.username, row?.name]
    .map(value => String(value || "").trim())
    .filter(Boolean);
  const resolved = candidates.find(value => !isLeagueFallbackMemberName(value, userId));
  if (resolved) return resolved;

  const fallbackRank = positiveInteger(row?.rank) || positiveInteger(row?._rank) || positiveInteger(fallbackIndex);
  return fallbackRank ? `Member #${String(fallbackRank).padStart(2, "0")}` : "League Member";
}

function isLeagueFallbackMemberName(value, userId) {
  const text = String(value || "").trim();
  const id = String(userId || "").trim();
  if (!text) return true;
  if (id && text === id) return true;
  if (id && text.toLowerCase() === `user_${id}`.toLowerCase()) return true;
  return /^user[\s_-]?\d+$/i.test(text);
}

function isLeagueAggregateMemberRow(row) {
  const role = String(row?.role || "").trim().toLowerCase();
  const rawMember = row?.raw_member && typeof row.raw_member === "object" ? row.raw_member : {};
  return role === "top league" ||
    role === "discovered c0ld/wmsy league" ||
    Boolean(rawMember.synthetic_user_id);
}

function leagueIconUrl(icon) {
  const text = String(icon || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text) || text.startsWith("data:")) return text;

  const assetMatch = text.match(/rbxassetid:\/\/(\d+)/i);
  const assetId = assetMatch ? assetMatch[1] : /^\d+$/.test(text) ? text : "";
  return assetId ? `https://ps99.biggamesapi.io/image/${encodeURIComponent(assetId)}` : "";
}

function handleHistoryComponent(interaction, env, ctx) {
  const state = parseHistoryCustomId(interaction.data?.custom_id);
  if (!state) {
    return messageResponse("That history control is no longer valid. Run `/history` again.", true);
  }

  const userId = interactionUserId(interaction);
  if (!userId || userId !== state.ownerId) {
    return messageResponse("Only the person who ran `/history` can use these controls.", true);
  }

  if (!memberHasAllowedRole(interaction, env)) {
    return messageResponse("You do not have access to use `/history`.", true);
  }

  ctx.waitUntil(completeHistoryInteraction(interaction, env, {
    query: state.targetId,
    targetId: state.targetId,
    ownerId: state.ownerId,
    view: state.view,
    page: state.page,
    cacheId: state.cacheId
  }));

  return { type: INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE };
}

async function completeHistoryInteraction(interaction, env, state) {
  try {
    // /history is an image-card command. Keeping an environment switch here
    // allowed an old production variable to silently restore the retired text
    // response after otherwise-correct deployments.
    const imageEnabled = true;
    if (imageEnabled && state.cacheId) {
      const cached = await buildCachedHistoryMessage(state, env);
      if (cached) {
        await editOriginalInteraction(interaction, cached);
        return;
      }
    }

    const history = await loadHistoryCommandData(state.query, env);
    await editOriginalInteraction(interaction, await renderHistoryMessage(history, {
      ownerId: state.ownerId,
      view: state.view,
      page: state.page,
      pageSize: historyPageSize(env),
      imageEnabled,
      cacheId: state.cacheId,
      env
    }));
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `History lookup failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      attachments: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

async function completeChartInteraction(interaction, env, chartType) {
  try {
    const message = chartType === "duck"
      ? await buildDuckChartMessage(env)
      : await buildClanChartMessage(env);
    await editOriginalInteraction(interaction, message);
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `Chart render failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      attachments: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

async function editOriginalInteraction(interaction, data) {
  const applicationId = String(interaction.application_id || "").trim();
  const token = String(interaction.token || "").trim();
  if (!applicationId || !token) throw httpError(500, "Discord interaction token is missing.");

  const { _file, ...messageData } = data || {};
  const payload = stripUndefined(messageData);
  const usesComponentsV2 = Boolean(Number(payload.flags || 0) & MESSAGE_FLAG_COMPONENTS_V2);
  const endpoint = `${DISCORD_API_BASE}/webhooks/${encodeURIComponent(applicationId)}/${encodeURIComponent(token)}/messages/@original${usesComponentsV2 ? "?with_components=true" : ""}`;
  let body;
  let headers;

  if (_file?.bytes?.byteLength) {
    payload.attachments = [{ id: 0, filename: _file.filename }];
    const form = new FormData();
    form.append("payload_json", JSON.stringify(payload));
    form.append("files[0]", new Blob([_file.bytes], { type: _file.contentType || "image/png" }), _file.filename);
    body = form;
    headers = { Accept: "application/json" };
  } else {
    body = JSON.stringify(payload);
    headers = { "Content-Type": "application/json", Accept: "application/json" };
  }

  const res = await fetch(endpoint, { method: "PATCH", headers, body });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const err = httpError(
      502,
      discordApiErrorMessage(
        res.status,
        discordFormErrorMessage(payload) || payload.message || `Discord interaction response update failed (${res.status}).`
      )
    );
    err.details = {
      discord_status: res.status,
      discord_response: payload
    };
    throw err;
  }
}

async function deleteOriginalInteraction(interaction) {
  const applicationId = String(interaction.application_id || "").trim();
  const token = String(interaction.token || "").trim();
  if (!applicationId || !token) throw httpError(500, "Discord interaction token is missing.");

  const endpoint = `${DISCORD_API_BASE}/webhooks/${encodeURIComponent(applicationId)}/${encodeURIComponent(token)}/messages/@original`;
  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });

  if (!res.ok && res.status !== 404) {
    const payload = await res.json().catch(() => ({}));
    throw httpError(502, payload.message || `Discord interaction response delete failed (${res.status}).`);
  }
}

function interactionUserId(interaction) {
  return String(interaction?.member?.user?.id || interaction?.user?.id || "").trim();
}

function interactionUsername(interaction) {
  return String(
    interaction?.member?.user?.global_name ||
    interaction?.member?.user?.username ||
    interaction?.user?.global_name ||
    interaction?.user?.username ||
    "user"
  ).trim() || "user";
}

function historyCustomId(ownerId, targetId, view, page, action = "open", cacheId = "") {
  return ["history", ownerId, targetId, view, Math.max(0, Math.trunc(Number(page) || 0)), action, historyCacheIdPart(cacheId)].filter((part, index) => index < 6 || part).join("|");
}

function parseHistoryCustomId(value) {
  const parts = String(value || "").split("|");
  if (![5, 6, 7].includes(parts.length) || parts[0] !== "history") return null;
  const ownerId = String(parts[1] || "");
  const targetId = String(parts[2] || "");
  const view = String(parts[3] || "").toLowerCase();
  const page = Math.max(0, Math.trunc(Number(parts[4]) || 0));
  const action = String(parts[5] || "open");
  const cacheId = historyCacheIdPart(parts[6] || "");
  if (!/^\d+$/.test(ownerId) || !/^\d+$/.test(targetId) || !HISTORY_VIEWS.includes(view) || !/^[a-z_]+$/.test(action)) return null;
  return { ownerId, targetId, view, page, cacheId };
}

async function loadHistoryCommandData(query, env) {
  let search = await fetchGlobalSearchPayload(query, env);
  let globalPayload = search.payload?.row ? search.payload : null;
  let subject = globalPayload?.row ? {
    userId: positiveInteger(globalPayload.row.user_id),
    username: displayName(globalPayload.row),
    avatarUrl: globalPayload.row.avatar_url || null
  } : null;
  const resolvedUser = search.payload?.resolved_user || search.payload?.resolvedUser || null;

  if (!subject?.userId && resolvedUser?.user_id) {
    subject = {
      userId: positiveInteger(resolvedUser.user_id),
      username: resolvedUser.username || resolvedUser.display_name || `user_${resolvedUser.user_id}`,
      avatarUrl: resolvedUser.avatar_url || null
    };
  }

  if (!subject?.userId) {
    subject = await resolveRobloxHistorySubject(query);
  }

  if (!subject?.userId) {
    throw httpError(404, `No Roblox user found for ${query}.`);
  }

  if (!globalPayload?.row || Number(globalPayload.row.user_id) !== Number(subject.userId)) {
    search = await fetchGlobalSearchPayload(String(subject.userId), env);
    globalPayload = search.payload?.row ? search.payload : null;
  }

  const scanClan = String(env.GLOBAL_SCAN_CLAN || env.CLAN_NAME || "c0ld").trim() || "c0ld";
  const [battleList, trackedHistory, cwHistory, bigHistory, leagueHistory, staticProfile] = await Promise.all([
    fetchClanHistoryJson(env, "/api/battles", { clan: scanClan, limit: 60 }),
    fetchClanHistoryJson(env, "/api/history", {
      user_id: subject.userId,
      all_battles: true,
      all_clans: true,
      hours: 100000,
      limit: 50000,
      order: "asc"
    }),
    fetchClanHistoryJson(env, "/api/external-history", { user_id: subject.userId, source: "cw_bot", limit: 300 }),
    fetchClanHistoryJson(env, "/api/external-history", { user_id: subject.userId, source: "big_bot", limit: 300 }),
    fetchLeagueHistoryJson(subject.userId, env),
    fetchStaticHistoryProfile(subject.userId, env)
  ]);

  const battleRows = (Array.isArray(battleList?.rows) ? battleList.rows : [])
    .filter(row => !isLegacyHistoryBattle(row, false));
  const liveClanRows = trackedHistory?.all_battles === true
    ? summarizeTrackedClanHistory(trackedHistory.rows, battleRows)
    : (await historyMapLimit(battleRows, 5, async battle => {
    const battleKey = String(battle.battle || battle.battle_key || "").trim();
    if (!battleKey) return null;
    const payload = await fetchClanHistoryJson(env, "/api/history", {
      clan: scanClan,
      user_id: subject.userId,
      battle: battleKey,
      hours: 100000,
      limit: 50000,
      order: "asc"
    });
    const rows = Array.isArray(payload?.rows) ? payload.rows.slice() : [];
    if (!rows.length) return null;
    rows.sort((a, b) => Date.parse(a.fetched_at || 0) - Date.parse(b.fetched_at || 0));
    const latest = rows[rows.length - 1] || {};
    return {
      key: historyRecordKey(battleKey),
      name: historyRecordName(battle.display_name || battle.battle_display_name || battleKey),
      source: "site",
      clan_name: latest.clan_name || scanClan,
      rank: finiteHistoryNumber(latest.rank),
      points: finiteHistoryNumber(latest.total_points ?? latest.points),
      battle_end_iso: battle.battle_end_iso || null,
      is_active: battle.is_active === true,
      first_snapshot: battle.first_snapshot || battle.first_row_at || battle.first_seen_at || null,
      last_snapshot: battle.last_snapshot || battle.last_row_at || battle.latest_snapshot_at || battle.last_seen_at || latest.fetched_at || null,
      update_number: finiteHistoryNumber(battle.update_number)
    };
    })).filter(Boolean);

  const leaderboardRows = summarizeGlobalHistory(globalPayload);
  const clanMap = new Map();
  for (const row of liveClanRows) mergeClanHistoryRecord(clanMap, row);
  for (const row of staticClanHistoryRows(staticProfile, scanClan)) mergeClanHistoryRecord(clanMap, row);
  for (const row of externalClanHistoryRows(bigHistory?.rows, "big_bot")) mergeClanHistoryRecord(clanMap, row);
  for (const row of externalClanHistoryRows(cwHistory?.rows, "cw_bot")) mergeClanHistoryRecord(clanMap, row);
  for (const row of leaderboardRows) {
    const key = canonicalClanHistoryKey(row?.key || row?.battle_key || row?.name);
    // A leaderboard observation may add the global placement/field size to a
    // real clan-battle record, but it is not itself a Clan Battle History row.
    // This keeps the removed Leaderboard History view from leaking back into
    // the clan card as a standalone "Global Leaderboard" entry.
    if (!key || !clanMap.has(key)) continue;
    mergeClanHistoryRecord(clanMap, {
      ...row,
      key,
      source: "site",
      rank: null,
      points: null
    });
  }

  const leagueRows = mergeHistorySummaryRows(
    normalizeLeagueHistoryRows(leagueHistory?.rows),
    normalizeLeagueHistoryRows(staticProfile?.league_summaries)
  );
  const avatarUrl = absoluteProfileAssetUrl(subject.avatarUrl, env)
    || absoluteProfileAssetUrl(staticProfile?.avatar_url, env)
    || await searchAvatarUrl({
      user_id: subject.userId,
      avatar_url: subject.avatarUrl || staticProfile?.avatar_url || null,
      username: subject.username || staticProfile?.username || null
    }, env);

  return {
    user_id: subject.userId,
    username: globalPayload?.row ? displayName(globalPayload.row) : staticProfile?.username || subject.username || `user_${subject.userId}`,
    avatar_url: avatarUrl || null,
    current_clan: globalPayload?.row?.source_clan || globalPayload?.row?.clan_name || null,
    clan_join_time: globalPayload?.row?.join_time || null,
    clan: sortClanHistoryRecords([...clanMap.values()]),
    league: leagueRows,
    league_unavailable: leagueHistory === null && leagueRows.length === 0
  };
}

function summarizeTrackedClanHistory(rows, battleRows) {
  const battles = new Map((Array.isArray(battleRows) ? battleRows : []).map(row => [
    historyRecordKey(row.battle || row.battle_key),
    {
      name: row.display_name || row.battle_display_name || row.battle || row.battle_key,
      battle_end_iso: row.battle_end_iso || null,
      is_active: row.is_active === true,
      first_snapshot: row.first_snapshot || row.first_row_at || row.first_seen_at || null,
      last_snapshot: row.last_snapshot || row.last_row_at || row.latest_snapshot_at || row.last_seen_at || null,
      update_number: finiteHistoryNumber(row.update_number)
    }
  ]));
  const latestByBattle = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const key = historyRecordKey(row.battle_key);
    if (!key) continue;
    const existing = latestByBattle.get(key);
    if (!existing || Date.parse(row.fetched_at || 0) >= Date.parse(existing.fetched_at || 0)) {
      latestByBattle.set(key, row);
    }
  }

  const orderedKeys = [
    ...battles.keys(),
    ...[...latestByBattle.keys()].filter(key => !battles.has(key))
  ];
  return orderedKeys.flatMap(key => {
    const row = latestByBattle.get(key);
    const battle = battles.get(key) || {};
    return row ? [{
      key,
      name: historyRecordName(battle.name || row.battle_key),
      source: "site",
      clan_name: row.clan_name || null,
      rank: finiteHistoryNumber(row.rank),
      points: finiteHistoryNumber(row.total_points ?? row.points),
      battle_end_iso: battle.battle_end_iso || null,
      is_active: battle.is_active === true,
      first_snapshot: battle.first_snapshot || battle.first_row_at || battle.first_seen_at || null,
      last_snapshot: battle.last_snapshot || battle.last_row_at || battle.latest_snapshot_at || battle.last_seen_at || row.fetched_at || null,
      update_number: finiteHistoryNumber(battle.update_number)
    }] : [];
  });
}

async function resolveRobloxHistorySubject(query) {
  const raw = String(query || "").trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const res = await fetch(`https://users.roblox.com/v1/users/${encodeURIComponent(raw)}`, {
      headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-History-Worker" }
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.id) return { userId: positiveInteger(raw), username: `user_${raw}`, avatarUrl: null };
    return { userId: positiveInteger(payload.id), username: payload.name || `user_${payload.id}`, avatarUrl: null };
  }

  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-History-Worker"
    },
    body: JSON.stringify({ usernames: [raw], excludeBannedUsers: false })
  });
  const payload = await res.json().catch(() => ({}));
  const row = Array.isArray(payload.data) ? payload.data[0] : null;
  return row?.id ? { userId: positiveInteger(row.id), username: row.name || raw, avatarUrl: null } : null;
}

async function fetchClanHistoryJson(env, path, params = {}) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const url = clanApiUrl(env, path, apiBase);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const res = await fetchClanApi(env, url, {
    headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-History-Worker" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await res.json().catch(() => ({}));
  return res.ok && payload.ok !== false ? payload : null;
}

async function fetchLeagueHistoryJson(userId, env) {
  const defaultBase = "https://yamo-league-api-worker.opal-dde.workers.dev";
  const bases = [...new Set([String(env.LEAGUE_API_BASE || "").trim(), defaultBase].filter(Boolean))];
  const limits = [2000, 500];
  const binding = env.LEAGUE_API_WORKER;
  const targets = [];
  if (binding && typeof binding.fetch === "function") {
    targets.push({ type: "binding", base: defaultBase });
  }
  targets.push(...bases.map(base => ({ type: "public", base })));
  let emptyPayload = null;

  for (const target of targets) {
    for (const limit of limits) {
      let url;
      try {
        url = new URL("/api/leagues/profile", String(target.base || "").replace(/\/$/, ""));
      } catch {
        continue;
      }
      url.searchParams.set("user_id", String(userId));
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("summary_limit", "100");
      const headers = { Accept: "application/json", "User-Agent": "c0ld-Discord-History-Worker" };
      const res = await (target.type === "binding"
        ? binding.fetch(new Request(url.toString(), { headers }))
        : fetch(url, {
            headers,
            cf: { cacheTtl: 0, cacheEverything: false }
          })
      ).catch(() => null);
      if (!res) continue;
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.ok === false) continue;
      const normalized = {
        ...payload,
        rows: leagueHistoryPayloadRows(payload)
      };
      if (normalized.rows.length) return normalized;
      emptyPayload ||= normalized;
    }
  }
  return emptyPayload;
}

function leagueHistoryPayloadRows(payload) {
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.league_summaries)) return payload.league_summaries;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function fetchStaticHistoryProfile(userId, env) {
  const base = String(env.PROFILE_DATA_BASE || "https://c0ld-clan.com/Data/players").replace(/\/$/, "");
  const res = await fetch(`${base}/${encodeURIComponent(userId)}.json`, {
    headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-History-Worker" }
  });
  return res.ok ? res.json().catch(() => null) : null;
}

function staticClanHistoryRows(profile, defaultClan = null) {
  return (Array.isArray(profile?.battles) ? profile.battles : [])
    .filter(row => !isLegacyHistoryBattle(row, true))
    .map(row => {
      const series = Array.isArray(row.series) ? row.series : [];
      const latest = series[series.length - 1] || {};
      const name = row.display_name || row.battle_display_name || row.battle || row.battle_key;
      return {
        key: historyRecordKey(row.battle || row.battle_key || name),
        name: historyRecordName(name),
        battle_key: row.battle_key || row.battle || null,
        battle_display_name: row.display_name || row.battle_display_name || null,
        source: "site",
        clan_name: row.clan_name || latest.clan_name || defaultClan,
        rank: finiteHistoryNumber(row.ending_rank ?? row.end_rank ?? row.last_rank ?? latest.rank),
        points: finiteHistoryNumber(row.ending_points ?? latest.points ?? latest.total_points),
        first_snapshot: row.first_snapshot || row.battle_first_snapshot || row.first_seen_at || row.first_seen || series[0]?.fetched_at || series[0]?.t || null,
        last_snapshot: row.last_snapshot || row.battle_last_snapshot || row.last_seen_at || row.last_seen || latest.fetched_at || latest.t || null,
        update_number: finiteHistoryNumber(row.update_number)
      };
    })
    .filter(row => row.key && (row.rank !== null || row.points !== null));
}

function externalClanHistoryRows(rows, source) {
  return (Array.isArray(rows) ? rows : []).map(row => {
    const isCwBot = source === "cw_bot";
    const clanRank = finiteHistoryNumber(row.clan_rank ?? (!isCwBot ? row.final_rank : null));
    const totalClanMembers = finiteHistoryNumber(row.total_clan_members ?? (!isCwBot ? row.total_ranked : null));
    const globalRank = finiteHistoryNumber(row.global_rank ?? (isCwBot ? row.final_rank : null));
    const totalGlobalPlayers = finiteHistoryNumber(row.total_global_players ?? (isCwBot ? row.total_ranked : null));
    return {
      key: historyRecordKey(row.battle_key || row.battle_name),
      name: historyRecordName(row.battle_name || row.battle_key),
      source,
      clan_name: row.clan_name || null,
      rank: clanRank,
      total_ranked: totalClanMembers,
      global_rank: globalRank,
      total_global_players: totalGlobalPlayers,
      points: finiteHistoryNumber(row.final_points),
      first_snapshot: row.first_snapshot || row.first_seen_at || row.period_start_at || null,
      // External-history timestamps describe the import, not when the battle ran.
      last_snapshot: row.last_snapshot || row.last_seen_at || row.period_end_at || null,
      update_number: finiteHistoryNumber(row.update_number)
    };
  }).filter(row => row.key && (row.rank !== null || row.global_rank !== null || row.points !== null));
}

function summarizeGlobalHistory(payload) {
  if (!payload?.row) return [];
  const current = payload.row;
  const rows = [...(Array.isArray(payload.history) ? payload.history : []), current];
  const groups = new Map();

  for (const row of rows) {
    const name = historyRecordName(
      row.leaderboard_name || row.event_name || row.battle_display_name || row.battle_key || "Global Leaderboard"
    );
    const key = historyRecordKey(row.battle_key || name);
    if (!key) continue;
    const candidate = {
      key,
      name,
      clan_name: row.source_clan || row.clan_name || null,
      global_rank: finiteHistoryNumber(row.global_rank),
      total_global_players: finiteHistoryNumber(row.total_global_players),
      points: finiteHistoryNumber(row.global_points ?? row.points ?? row.clan_points),
      fetched_at: row.fetched_at || row.updated_at || null
    };
    const existing = groups.get(key);
    if (!existing || Date.parse(candidate.fetched_at || 0) >= Date.parse(existing.fetched_at || 0)) {
      groups.set(key, candidate);
    }
  }

  return [...groups.values()].filter(row => row.global_rank !== null || row.points !== null);
}

function normalizeLeagueHistoryRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(row => {
    const fallbackPeriod = [
      row.league_run_key,
      row.league_name,
      row.period_start_at || row.first_snapshot_at
    ].filter(Boolean).join(":");
    return {
      key: historyRecordKey(row.league_period_key || row.label_key || row.run_label || row.event_name || fallbackPeriod),
      name: historyRecordName(row.run_label || row.event_name || row.label || row.league_period_key || row.league_name || "League"),
      league_name: row.league_name || null,
      league_rank: finiteHistoryNumber(row.league_rank ?? row.final_league_rank ?? row.rank),
      player_rank: finiteHistoryNumber(row.player_league_rank ?? row.member_rank ?? row.final_rank ?? row.best_rank),
      points: finiteHistoryNumber(row.final_points ?? row.points ?? row.highest_points)
    };
  }).filter(row => row.key && !isSyntheticLeagueHistoryRow(row) && (row.league_rank !== null || row.player_rank !== null || row.points !== null));
}

function normalizeLeaderboardHistoryRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(row => ({
    key: historyRecordKey(row.battle_key || row.leaderboard_name || row.event_name || row.label),
    name: historyRecordName(row.leaderboard_name || row.event_name || row.label || row.battle_key || "Global Leaderboard"),
    global_rank: finiteHistoryNumber(row.global_rank ?? row.final_rank),
    total_global_players: finiteHistoryNumber(row.total_global_players ?? row.total_ranked),
    points: finiteHistoryNumber(row.global_points ?? row.final_points)
  })).filter(row => row.key && (row.global_rank !== null || row.points !== null));
}

function mergeHistorySummaryRows(...rowGroups) {
  const map = new Map();
  for (const row of rowGroups.flatMap(rows => rows || [])) {
    const key = row.key || historyRecordKey(row.name);
    if (!key) continue;
    const existing = map.get(key);
    map.set(key, existing ? fillHistoryRecord(existing, row) : row);
  }
  return [...map.values()];
}

function mergeClanHistoryRecord(map, row) {
  const key = canonicalClanHistoryKey(row?.key || row?.battle_key || row?.name);
  if (!key) return;
  const normalizedRow = row.key === key ? row : { ...row, key };
  const existing = map.get(key);
  if (!existing) {
    map.set(key, normalizedRow);
    return;
  }

  const rowWins = historySourcePriority(normalizedRow.source) > historySourcePriority(existing.source);
  const primary = rowWins ? normalizedRow : existing;
  const secondary = rowWins ? existing : normalizedRow;
  // Native history stays authoritative. A lower-priority import can only fill
  // a field that is missing from the native record; it cannot replace it.
  map.set(key, fillHistoryRecord(primary, secondary));
}

function fillHistoryRecord(primary, secondary) {
  return {
    ...secondary,
    ...primary,
    rank: finiteHistoryNumber(primary.rank) ?? finiteHistoryNumber(secondary.rank),
    total_ranked: finiteHistoryNumber(primary.total_ranked) ?? finiteHistoryNumber(secondary.total_ranked),
    global_rank: finiteHistoryNumber(primary.global_rank) ?? finiteHistoryNumber(secondary.global_rank),
    total_global_players: finiteHistoryNumber(primary.total_global_players) ?? finiteHistoryNumber(secondary.total_global_players),
    league_rank: finiteHistoryNumber(primary.league_rank) ?? finiteHistoryNumber(secondary.league_rank),
    player_rank: finiteHistoryNumber(primary.player_rank) ?? finiteHistoryNumber(secondary.player_rank),
    clan_name: primary.clan_name || secondary.clan_name || null,
    points: finiteHistoryNumber(primary.points) ?? finiteHistoryNumber(secondary.points)
  };
}

function historySourcePriority(source) {
  if (source === "site") return 3;
  if (source === "big_bot") return 2;
  return 1;
}

function historyRecordKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function historyRecordName(value) {
  const text = String(value || "").trim();
  if (!text) return "Unknown";
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/(\D)(20\d{2})$/i, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

const CLAN_BATTLE_HISTORY_TIMELINE = [
  { keys: ["GummyBattle2026", "Gummy Battle 2026"], first: "2026-07-18T00:00:00.000Z", last: "2026-07-31T23:59:59.000Z", update: null },
  { keys: ["LunarBattle2026", "Lunar Battle 2026"], first: "2026-07-04T00:00:00.000Z", last: "2026-07-17T23:59:59.000Z", update: null },
  { keys: ["SoccerBattle2026", "Soccer Battle 2026"], first: "2026-06-20T00:00:00.000Z", last: "2026-07-03T23:59:59.000Z", update: null },
  { keys: ["Backrooms2026", "Backrooms 2026"], first: "2026-06-06T00:00:00.000Z", last: "2026-06-19T23:59:59.000Z", update: null },
  { keys: ["AngelBattle2026", "Angel Battle 2026"], first: "2026-05-09T00:00:00.000Z", last: "2026-05-15T23:59:59.000Z", update: 78 },
  { keys: ["StarryBattle", "Starry Battle", "Starry"], first: "2026-04-25T00:00:00.000Z", last: "2026-05-02T23:59:59.000Z", update: 76 },
  { keys: ["Spring2026", "Spring 2026", "Abstract Battle"], first: "2026-04-18T00:00:00.000Z", last: "2026-04-24T23:59:59.000Z", update: 75 },
  { keys: ["Lucky Chest Battle", "Lucky Chest", "Clover Clan Battle", "Clover Battle"], first: "2026-03-14T00:00:00.000Z", last: "2026-03-28T23:59:59.000Z", update: 73 },
  { keys: ["Gingerbread Battle 2025", "GingerbreadBattle2025", "Christmas2025", "Christmas 2025", "Silver Clan Battle", "Silver Battle"], first: "2025-12-20T00:00:00.000Z", last: "2025-12-26T23:59:59.000Z", update: 72 },
  { keys: ["Thanksgiving 2025 Battle", "Thanksgiving 2025", "Thanksgiving2025Battle", "Turkey2025", "Turkey 2025", "Forged Battle"], first: "2025-11-29T00:00:00.000Z", last: "2025-12-05T23:59:59.000Z", update: 71 },
  { keys: ["Block Party", "Sun Angelus Battle"], first: "2025-07-12T00:00:00.000Z", last: "2025-07-18T23:59:59.000Z", update: 68 },
  { keys: ["Strength", "Scuba Dog Battle"], first: "2025-06-28T00:00:00.000Z", last: "2025-07-04T23:59:59.000Z", update: 66 },
  { keys: ["Tower Defense", "Nightmare Cyclops Battle"], first: "2025-06-14T00:00:00.000Z", last: "2025-06-20T23:59:59.000Z", update: 64 },
  { keys: ["Basketball Battle", "Basketball", "BasketballBattle", "Junkyard Hound Battle"], first: "2025-05-31T00:00:00.000Z", last: "2025-06-06T23:59:59.000Z", update: 62 },
  { keys: ["Balloon Corgi Battle", "Balloon Corgi"], first: "2025-05-17T00:00:00.000Z", last: "2025-05-23T23:59:59.000Z", update: 60 },
  { keys: ["Poison Turtle Battle"], first: "2025-05-03T12:00:00.524Z", last: "2025-05-09T12:00:00.524Z", update: 58 },
  { keys: ["Pixel Chick Battle"], first: "2025-04-19T12:00:00.524Z", last: "2025-04-25T12:00:00.524Z", update: 56 },
  { keys: ["Athena Battle"], first: "2025-03-29T12:00:00.524Z", last: "2025-04-04T12:00:00.524Z", update: 53 },
  { keys: ["Tie Dye Battle", "Tie Dye"], first: "2025-03-15T00:00:00.000Z", last: "2025-03-21T23:59:59.000Z", update: 51 },
  { keys: ["Lucky Battle", "Lucky", "LuckyBattle", "Egyptian Battle"], first: "2025-03-08T00:00:00.000Z", last: "2025-03-14T23:59:59.000Z", update: 50 },
  { keys: ["Evil Battle"], first: "2025-02-22T12:00:00.524Z", last: "2025-02-28T12:00:00.524Z", update: 46 },
  { keys: ["Holographic Battle"], first: "2025-02-08T12:00:00.524Z", last: "2025-02-14T12:00:00.524Z", update: 46 },
  { keys: ["Mushroom Battle"], first: "2025-01-25T12:00:00.524Z", last: "2025-01-31T12:00:00.524Z", update: 44 },
  { keys: ["Wyvern Battle"], first: "2025-01-11T12:00:00.524Z", last: "2025-01-24T12:00:00.524Z", update: 42 },
  { keys: ["Blurred Battle"], first: "2024-12-28T12:00:00.524Z", last: "2025-01-03T12:00:00.524Z", update: 40 },
  { keys: ["Diamond Clan Battle", "Diamond Battle"], first: "2024-12-21T12:00:00.524Z", last: "2024-12-27T12:00:00.524Z", update: 39 },
  { keys: ["Gingerbread Clan Battle", "Gingerbread Battle"], first: "2024-12-14T12:00:00.524Z", last: "2024-12-20T12:00:00.524Z", update: 38 },
  { keys: ["Bee Clan Battle", "Bee Battle"], first: "2024-12-07T12:00:00.524Z", last: "2024-12-13T12:00:00.524Z", update: 37 },
  { keys: ["Blimp Dragon Clan Battle", "Blimp Dragon Battle"], first: "2024-11-09T12:00:00.524Z", last: "2024-11-23T12:00:00.524Z", update: 33 },
  { keys: ["Ghost Clan Battle", "Ghost Battle"], first: "2024-10-19T12:00:00.524Z", last: "2024-11-01T12:00:00.524Z", update: 30 },
  { keys: ["Reversed Clan Battle", "Reversed Battle"], first: "2024-09-21T12:00:00.524Z", last: "2024-10-04T12:00:00.524Z", update: 29 },
  { keys: ["Rave Crab Clan Battle", "Rave Crab Battle"], first: "2024-08-31T12:00:00.524Z", last: "2024-09-13T12:00:00.524Z", update: 27 },
  { keys: ["Ice Cream Clan Battle", "Ice Cream Battle"], first: "2024-08-10T12:00:00.524Z", last: "2024-08-23T12:00:00.524Z", update: 24 },
  { keys: ["Clown Clan Battle", "Clown Battle"], first: "2024-07-20T12:00:00.524Z", last: "2024-08-02T12:00:00.524Z", update: 21 },
  { keys: ["Safety Battle"], first: "2024-07-20T12:00:00.524Z", last: "2024-08-02T12:00:00.524Z", update: 17 },
  { keys: ["Wicked Clan Battle", "Wicked Battle"], first: "2024-06-08T12:00:00.524Z", last: "2024-06-21T12:00:00.524Z", update: 15 },
  { keys: ["Fragmented Clan Battle", "Fragmented Battle"], first: "2024-06-08T12:00:00.524Z", last: "2024-06-21T12:00:00.524Z", update: 12 },
  { keys: ["Bubble Clan Battle", "Bubble Battle"], first: "2024-04-06T12:00:00.524Z", last: "2024-04-19T12:00:00.524Z", update: 9 },
  { keys: ["Pixel Clan Battle", "Pixel Battle"], first: "2024-04-06T12:00:00.524Z", last: "2024-04-19T12:00:00.524Z", update: 8 },
  { keys: ["Quest Clan Battle", "Quest Battle"], first: "2024-03-16T12:00:00.524Z", last: "2024-03-29T12:00:00.524Z", update: 7 },
  { keys: ["Raid Clan Battle", "Raid Battle"], first: "2024-02-24T12:00:00.524Z", last: "2024-03-15T12:00:00.524Z", update: 6 },
  { keys: ["Achievements Battle"], first: "2024-02-10T12:00:00.524Z", last: "2024-02-21T12:00:00.524Z", update: 5 },
  { keys: ["Pet Collecting Battle"], first: "2024-01-20T12:00:00.524Z", last: "2024-02-09T12:00:00.524Z", update: 5 },
  { keys: ["New Years Clan Battle", "New Years Battle"], first: "2023-12-30T12:00:00.524Z", last: "2024-01-19T12:00:00.524Z", update: 4 },
  { keys: ["Festive Clan Battle", "Festive Battle"], first: "2023-12-16T12:00:00.524Z", last: "2023-12-29T12:00:00.524Z", update: 2 }
];

const CLAN_BATTLE_HISTORY_TIME_BY_KEY = buildClanBattleHistoryTimeMap();
const CLAN_BATTLE_HISTORY_CANONICAL_KEY_BY_ALIAS = buildClanBattleHistoryAliasMap();

function buildClanBattleHistoryTimeMap() {
  const map = new Map();
  for (const row of CLAN_BATTLE_HISTORY_TIMELINE) {
    const sortTime = Math.max(historyDateMs(row.first), historyDateMs(row.last));
    const sortUpdate = finiteHistoryNumber(row.update) ?? 0;
    for (const key of row.keys || []) {
      for (const alias of [key, historyRecordName(key)]) {
        const normalized = historyRecordKey(alias);
        if (!normalized) continue;
        map.set(normalized, { sortTime, sortUpdate });
      }
    }
  }
  return map;
}

function buildClanBattleHistoryAliasMap() {
  const map = new Map();
  for (const row of CLAN_BATTLE_HISTORY_TIMELINE) {
    const canonicalKey = historyRecordKey(row.keys?.[0]);
    if (!canonicalKey) continue;
    for (const key of row.keys || []) {
      for (const alias of [key, historyRecordName(key)]) {
        const normalized = historyRecordKey(alias);
        if (normalized) map.set(normalized, canonicalKey);
      }
    }
  }
  return map;
}

function canonicalClanHistoryKey(value) {
  const key = historyRecordKey(value);
  return CLAN_BATTLE_HISTORY_CANONICAL_KEY_BY_ALIAS.get(key) || key;
}

function sortClanHistoryRecords(rows) {
  return [...(Array.isArray(rows) ? rows : [])].sort((a, b) => {
    const timeDelta = historyBattleSortTime(b) - historyBattleSortTime(a);
    if (timeDelta !== 0) return timeDelta;
    const updateDelta = historyBattleSortUpdate(b) - historyBattleSortUpdate(a);
    if (updateDelta !== 0) return updateDelta;
    return String(a.name || a.battle_display_name || a.battle_key || "").localeCompare(String(b.name || b.battle_display_name || b.battle_key || ""));
  });
}

function historyBattleSortTime(row) {
  const timeline = historyTimelineForRow(row);
  if (timeline?.sortTime) return timeline.sortTime;
  return Math.max(
    historyDateMs(row?.last_snapshot),
    historyDateMs(row?.latest_snapshot_at),
    historyDateMs(row?.latest_fetched_at),
    historyDateMs(row?.last_seen_at),
    historyDateMs(row?.battle_end_iso),
    historyDateMs(row?.fetched_at),
    historyDateMs(row?.updated_at),
    historyDateMs(row?.created_at),
    historyDateMs(row?.first_snapshot),
    historyDateMs(row?.first_seen_at),
    historyDateMs(row?.battle_start_iso)
  );
}

function historyBattleSortUpdate(row) {
  const timeline = historyTimelineForRow(row);
  return finiteHistoryNumber(row?.update_number) ?? finiteHistoryNumber(timeline?.sortUpdate) ?? 0;
}

function historyTimelineForRow(row) {
  for (const value of [
    row?.key,
    row?.battle_key,
    row?.battle,
    row?.battle_display_name,
    row?.display_name,
    row?.event_name,
    row?.name
  ]) {
    const key = historyRecordKey(value);
    if (key && CLAN_BATTLE_HISTORY_TIME_BY_KEY.has(key)) return CLAN_BATTLE_HISTORY_TIME_BY_KEY.get(key);
  }
  return null;
}

function historyDateMs(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : 0;
}

function isLegacyHistoryBattle(row, staticOnly) {
  const keys = [row?.battle, row?.battle_key, row?.display_name, row?.battle_display_name]
    .map(historyRecordKey);
  const alwaysLegacy = new Set(["safetybattle", "poisonturtlebattle", "abstractbattle", "abstractc0ld", "spring2026"]);
  const staticLegacy = new Set(["angelbattle2026", "angelbattle2026c0ld", "angelbattle2026clans", "starrybattle", "starryc0ld", "starryclans"]);
  return keys.some(key => alwaysLegacy.has(key) || (staticOnly && staticLegacy.has(key)));
}

async function historyMapLimit(items, limit, mapper) {
  const list = Array.from(items || []);
  const results = new Array(list.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, limit), list.length) }, async () => {
    while (next < list.length) {
      const index = next++;
      results[index] = await mapper(list[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function buildClanChartMessage(env) {
  const data = await loadClanChartData(env);
  const filename = `c0ld-clan-chart-${chartFilenamePart(data.current?.battle || "current")}.png`;
  const bytes = await renderClanLineChartPng(data);
  return {
    content: null,
    embeds: [{
      color: 0x58a6ff,
      image: { url: `attachment://${filename}` }
    }],
    allowed_mentions: { parse: [] },
    _file: { filename, contentType: "image/png", bytes }
  };
}

async function buildDuckChartMessage(env) {
  const data = await loadClanChartData(env, { history: false });
  const filename = `c0ld-duck-chart-${chartFilenamePart(data.current?.battle || "current")}.png`;
  const bytes = await renderDuckChartPng(data.current, env);
  return {
    content: null,
    embeds: [{
      color: 0xf2cc60,
      image: { url: `attachment://${filename}` }
    }],
    allowed_mentions: { parse: [] },
    _file: { filename, contentType: "image/png", bytes }
  };
}

async function loadClanChartData(env, options = {}) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const currentUrl = clanApiUrl(env, "/api/clans/current", apiBase);
  currentUrl.searchParams.set("fresh", "1");
  const currentResponse = await fetchClanApi(env, currentUrl, {
    headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-Chart-Worker" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const current = await currentResponse.json().catch(() => ({}));
  if (!currentResponse.ok || current.ok === false) {
    throw httpError(currentResponse.status || 502, current.message || `Clan current API failed (${currentResponse.status}).`);
  }

  if (options.history === false) return { current, history: { rows: [] } };

  const historyUrl = clanApiUrl(env, "/api/clans/history", apiBase);
  historyUrl.searchParams.set("battle", current.battle || "current");
  historyUrl.searchParams.set("hours", String(chartHistoryHoursForBattle(current)));
  historyUrl.searchParams.set("rank_min", String(CHART_LINE_RANGE.min));
  historyUrl.searchParams.set("rank_max", String(CHART_LINE_RANGE.max));
  historyUrl.searchParams.set("bucket_minutes", "5");
  historyUrl.searchParams.set("include_baseline", "1");
  historyUrl.searchParams.set("limit", "50000");
  historyUrl.searchParams.set("order", "asc");
  const historyResponse = await fetchClanApi(env, historyUrl, {
    headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-Chart-Worker" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const history = await historyResponse.json().catch(() => ({ rows: [] }));

  return {
    current,
    history: historyResponse.ok && history.ok !== false ? history : { rows: [] }
  };
}

async function renderClanLineChartPng(data) {
  const fonts = await loadHistoryFonts();
  const width = 1200;
  const height = 675;
  const canvas = new HistoryPixelCanvas(width, height, [10, 15, 22, 255], 1);
  const color = chartColors();
  const rows = chartCurrentRows(data.current)
    .filter(row => row.rank >= CHART_LINE_RANGE.min && row.rank <= CHART_LINE_RANGE.max)
    .slice(0, CHART_LINE_RANGE.max - CHART_LINE_RANGE.min + 1);
  const series = rows
    .map((row, index) => chartBuildHourlyGainSeries(row, data.history, index, data.current))
    .filter(item => item.points.length >= 1);
  const title = `${data.current?.display_name || data.current?.battle || "Current Battle"} - Clan Line Chart`;
  const subtitle = `${CHART_LINE_RANGE.label} actual hourly gains`;

  chartPanel(canvas, 24, 24, width - 48, height - 48, color);
  canvas.drawFontText(fonts.bold, title, 52, 48, 28, color.white, 760);
  canvas.drawFontText(fonts.regular, subtitle, 54, 86, 15, color.muted, 760);
  canvas.drawFontText(fonts.regular, `Snapshot ${chartDate(data.current?.snapshot_at || data.current?.generated_at)}`, 930, 60, 13, color.muted, 220);

  const plot = { x: 76, y: 116, w: 968, h: 450 };
  canvas.fillRect(plot.x, plot.y, plot.w, plot.h, color.inset);
  canvas.fillRect(plot.x, plot.y + plot.h, plot.w, 1, color.line);
  canvas.fillRect(plot.x, plot.y, 1, plot.h, color.line);

  if (!series.length) {
    canvas.drawFontText(fonts.regular, "Not enough actual hourly gain data is available for Ranks 1-4 yet.", plot.x + 28, plot.y + 38, 18, color.muted, plot.w - 56);
    return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
  }

  const allPoints = series.flatMap(item => item.points);
  const minT = Math.min(...allPoints.map(point => point.t));
  const maxT = Math.max(...allPoints.map(point => point.t));
  const minY = Math.min(...allPoints.map(point => point.pointsGained));
  const maxY = Math.max(...allPoints.map(point => point.pointsGained));
  const yPad = Math.max((maxY - minY) * 0.1, 1000);
  const yMin = Math.max(0, minY - yPad);
  const yMax = maxY + yPad;
  const xFor = point => maxT === minT ? plot.x : plot.x + ((point.t - minT) / (maxT - minT)) * plot.w;
  const yFor = point => yMax === yMin ? plot.y + plot.h / 2 : plot.y + (1 - ((point.pointsGained - yMin) / (yMax - yMin))) * plot.h;

  for (let i = 0; i <= 4; i += 1) {
    const yy = plot.y + (i / 4) * plot.h;
    const value = yMax - (i / 4) * (yMax - yMin);
    const label = shortNumber(value);
    const labelWidth = canvas.measureFontText(fonts.regular, label, 12);
    const labelX = Math.max(34, plot.x - 14 - labelWidth);
    canvas.fillRect(plot.x, yy, plot.w, 1, color.grid);
    chartDrawBackedText(canvas, fonts.regular, label, labelX, yy - 8, 12, color.muted, labelWidth + 2, color.panel);
  }

  [...series]
    .sort((a, b) => Number(a.isCutoffPair) - Number(b.isCutoffPair))
    .forEach(item => {
    for (let index = 1; index < item.points.length; index += 1) {
      if (item.points[index].breakBefore) continue;
      chartDrawLine(canvas, xFor(item.points[index - 1]), yFor(item.points[index - 1]), xFor(item.points[index]), yFor(item.points[index]), item.color, item.isCutoffPair ? 3 : 2);
    }
    const last = item.points[item.points.length - 1];
    chartFillCircle(canvas, xFor(last), yFor(last), item.isCutoffPair ? 5 : 4, item.color);
    chartDrawBackedText(
      canvas,
      fonts.bold,
      `#${item.rank} ${item.clan_name}`,
      Math.min(plot.x + plot.w - 130, xFor(last) + 8),
      Math.max(plot.y + 8, Math.min(plot.y + plot.h - 18, yFor(last) - 8)),
      12,
      item.color,
      122,
      [13, 19, 27, 255]
    );
  });

  chartDrawBackedText(canvas, fonts.regular, chartTimeLabel(minT), plot.x, plot.y + plot.h + 18, 12, color.muted, 160, color.panel);
  const lastLabel = chartTimeLabel(maxT);
  const lastLabelWidth = canvas.measureFontText(fonts.regular, lastLabel, 12);
  chartDrawBackedText(canvas, fonts.regular, lastLabel, plot.x + plot.w - lastLabelWidth, plot.y + plot.h + 18, 12, color.muted, 180, color.panel);

  const legendX = 1062;
  canvas.drawFontText(fonts.bold, CHART_LINE_RANGE.label, legendX, 126, 18, color.white, 110);
  series.forEach((item, index) => {
    const y = 158 + index * 58;
    const latest = item.points[item.points.length - 1];
    canvas.fillRect(legendX, y + 7, 20, 4, item.color);
    canvas.drawFontText(fonts.bold, `#${item.rank}`, legendX + 28, y, 12, item.color, 36);
    canvas.drawFontText(fonts.regular, item.clan_name, legendX + 64, y, 12, color.white, 88);
    canvas.drawFontText(fonts.regular, `${shortNumber(latest.pointsGained)}/hr`, legendX + 64, y + 15, 10, color.muted, 88);
    canvas.drawFontText(fonts.regular, shortNumber(item.current.points), legendX + 64, y + 30, 10, color.muted, 88);
  });

  canvas.drawFontText(fonts.regular, "Bot by Cinnamowopal", 52, height - 42, 13, color.muted, 300);
  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

async function renderDuckChartPng(current, env) {
  const fonts = await loadHistoryFonts();
  const duckImage = await loadChartDuckImage(env).catch(() => null);
  const width = 1200;
  const height = 675;
  const canvas = new HistoryPixelCanvas(width, height, [10, 15, 22, 255], 1);
  const color = chartColors();
  const rows = chartCurrentRows(current).filter(row => row.rank >= 1 && row.rank <= 10).slice(0, 10);
  const title = `${current?.display_name || current?.battle || "Current Battle"} - Duck Chart`;

  chartPanel(canvas, 24, 24, width - 48, height - 48, color);
  canvas.drawFontText(fonts.bold, title, 52, 48, 30, color.white, 720);
  canvas.drawFontText(fonts.regular, `Snapshot ${chartDate(current?.snapshot_at || current?.generated_at)}`, 54, 88, 15, color.muted, 420);

  const track = { x: 52, y: 126, w: 1096, h: 480 };
  canvas.fillRect(track.x, track.y, track.w, track.h, [10, 49, 74, 255]);
  for (let stripe = 0; stripe < track.w; stripe += 36) {
    canvas.fillRect(track.x + stripe, track.y + 58, 18, track.h - 58, stripe % 72 === 0 ? [25, 82, 113, 255] : [14, 61, 91, 255]);
  }
  canvas.fillRect(track.x, track.y, track.w, 58, [61, 127, 51, 255]);
  canvas.fillRect(track.x, track.y + 56, track.w, 4, [123, 79, 38, 255]);
  [132, 195, 262].forEach((x, index) => chartFillCircle(canvas, track.x + x, track.y + 28 + (index % 2) * 7, 22 + index * 2, [95, 189, 78, 255]));
  const finishX = track.x + track.w - 58;
  for (let y = track.y + 58; y < track.y + track.h; y += 20) {
    const odd = Math.floor((y - track.y) / 20) % 2;
    canvas.fillRect(finishX, y, 20, 20, odd ? color.black : color.white);
    canvas.fillRect(finishX + 20, y, 20, 20, odd ? color.white : color.black);
  }

  if (!rows.length) {
    canvas.drawFontText(fonts.regular, "No top 10 clan rows are available yet.", track.x + 28, track.y + 94, 18, color.muted, track.w - 56);
    return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
  }

  const points = rows.map(row => Number(row.points || 0));
  const minPoints = Math.min(...points);
  const maxPoints = Math.max(...points);
  const range = maxPoints - minPoints;
  const logos = await chartLoadClanLogos(rows, env);
  const scale = 1;
  const duckWidth = 148 * scale;
  const duckHeight = 134 * scale;
  const racers = rows.map((row, index) => {
    const progress = range > 0 ? (Number(row.points || 0) - minPoints) / range : 1 - index * 0.08;
    const laneLeft = 5 + Math.max(0, Math.min(1, progress)) * 88;
    const left = Math.min(track.x + laneLeft / 100 * track.w, track.x + track.w - duckWidth - 10);
    const x = left + duckWidth / 2;
    const y = track.y + track.h - 46 - duckHeight / 2;
    const next = rows[index + 1];
    const lead = next ? Number(row.points || 0) - Number(next.points || 0) : null;
    return {
      row,
      index,
      x,
      y,
      lead,
      labelLift: (index % 4) * 18,
      logo: logos.get(chartNormalize(row.clan_name)) || null
    };
  });

  racers.slice().reverse().forEach(racer => {
    chartDrawDuck(canvas, fonts, racer.row, racer.index, racer.x, racer.y, scale, color, {
      duckImage,
      logo: racer.logo,
      lead: racer.lead,
      labelLift: racer.labelLift
    });
  });

  canvas.drawFontText(fonts.regular, "Bot by Cinnamowopal", 52, height - 42, 13, color.muted, 300);
  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

function chartBuildHourlyGainSeries(currentRow, history, index, context) {
  const key = chartNormalize(currentRow.clan_name);
  const rows = (history?.rows || [])
    .map(row => chartNormalizeClanRow(row, context))
    .filter(row => chartNormalize(row.clan_name) === key && row.points !== null && row.t)
    .sort((a, b) => a.t - b.t);
  const currentPoint = chartNormalizeClanRow(currentRow, context);
  if (currentPoint.t && currentPoint.points !== null && !rows.some(point => point.t === currentPoint.t)) rows.push(currentPoint);
  const points = chartBuildHourlyPoints(chartDedupePullRows(rows), currentRow);
  return {
    clan_name: currentRow.clan_name,
    rank: currentRow.rank,
    current: currentRow,
    color: chartClanColor(currentRow.clan_name, index),
    isCutoffPair: currentRow.rank === CHART_LINE_RANGE.cutoffRank || currentRow.rank === CHART_LINE_RANGE.challengerRank,
    points
  };
}

function chartDedupePullRows(rows) {
  const byTime = new Map();
  for (const row of rows || []) {
    if (!row?.t || row.points === null) continue;
    const existing = byTime.get(row.t);
    if (!existing || row.points >= existing.points) byTime.set(row.t, row);
  }
  return [...byTime.values()].sort((a, b) => a.t - b.t);
}

function chartFindPriorHourPoint(rows, targetT) {
  const targetPrior = targetT - CHART_LOOKBACK_HOURS * 60 * 60 * 1000;
  const tolerance = CHART_PRIOR_PULL_TOLERANCE_MINUTES * 60 * 1000;
  let best = null;

  for (const row of rows || []) {
    const diff = Math.abs(row.t - targetPrior);
    if (diff > tolerance) continue;
    if (!best || diff < best.diff) best = { row, diff };
  }

  return best?.row || null;
}

function chartBuildHourlyPoints(rows, clanRow) {
  const points = [];
  for (const current of rows || []) {
    const prior = chartFindPriorHourPoint(rows, current.t);
    if (!prior) continue;

    const gain = current.points - prior.points;
    if (!Number.isFinite(gain) || gain < 0) continue;

    const previous = points[points.length - 1];
    const gapMinutes = previous ? (current.t - previous.t) / 60000 : 5;
    points.push({
      t: current.t,
      priorT: prior.t,
      pointsGained: gain,
      totalPoints: current.points,
      rank: current.rank ?? clanRow.rank,
      breakBefore: gapMinutes > CHART_LARGE_GAP_BREAK_MINUTES
    });
  }
  return points;
}

function chartHistoryHoursForBattle(current) {
  const start = Date.parse(String(current?.battle_start_iso || ""));
  const end =
    Date.parse(String(current?.snapshot_at || "")) ||
    Date.parse(String(current?.generated_at || "")) ||
    Date.now();

  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    const hours = Math.ceil((end - start) / (60 * 60 * 1000)) + 6;
    return Math.max(24, Math.min(336, hours));
  }

  return 168;
}

function chartBattleEndMs(context) {
  const ms = Date.parse(String(context?.battle_end_iso || context?.battle_ended_at || ""));
  return Number.isFinite(ms) ? ms : null;
}

function chartCurrentRows(payload) {
  return (payload?.rows || [])
    .map(row => chartNormalizeClanRow(row, payload))
    .filter(row => row.clan_name && row.rank !== null && row.points !== null)
    .sort((a, b) => a.rank - b.rank);
}

function chartNormalizeClanRow(row, context) {
  const explicitT = chartFinite(row.t);
  let t = explicitT === null
    ? Date.parse(String(row.fetched_at || row.snapshot_at || row.generated_at || "")) || Date.parse(String(row.last_updated || "")) || 0
    : explicitT;
  const endMs = chartBattleEndMs(context);
  if (endMs !== null && t > endMs) t = endMs;

  return {
    t,
    rank: chartFinite(row.rank) === null ? null : Math.round(Number(row.rank)),
    clan_name: String(row.clan_name || row.clan || row.name || row.tag || "").replace(/★/g, "").trim(),
    points: chartFinite(row.points ?? row.total_points),
    icon_url: row.icon_url || row.logo_url || row.image_url || null,
    icon_id: row.icon_id || row.logo_id || null
  };
}

async function loadChartDuckImage(env) {
  if (!chartDuckImagePromise) {
    const siteBase = String(env.SITE_BASE_URL || "https://c0ld-clan.com").replace(/\/$/, "");
    const duckUrl = `${siteBase}/assets/duck-race-duck.png`;
    chartDuckImagePromise = fetch(duckUrl, {
      headers: { Accept: "image/png,image/*;q=0.8", "User-Agent": "c0ld-Discord-Chart-Worker" },
      cf: { cacheTtl: 3600, cacheEverything: true }
    })
      .then(async response => response.ok ? decodeHistoryPng(new Uint8Array(await response.arrayBuffer())) : null)
      .catch(() => null);
  }
  return chartDuckImagePromise;
}

async function chartLoadClanLogos(rows, env) {
  const entries = await Promise.all((rows || []).map(async row => {
    const url = chartClanIconUrl(row, env);
    if (!url) return null;
    const image = await loadHistoryAvatar(url).catch(() => null);
    return image ? [chartNormalize(row.clan_name), image] : null;
  }));
  return new Map(entries.filter(Boolean));
}

function chartClanIconUrl(row, env) {
  const url = row?.icon_url || row?.logo_url || row?.image_url;
  if (url) return absoluteProfileAssetUrl(url, env);
  const iconId = String(row?.icon_id || row?.logo_id || "").trim();
  return iconId ? `https://ps99.biggamesapi.io/image/${encodeURIComponent(iconId)}` : null;
}

function chartFinite(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function chartNormalize(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function chartClanColor(name, index = 0) {
  const specials = { c0ld: [255, 155, 150, 255], wmsy: [116, 217, 159, 255], nong: [246, 173, 85, 255] };
  const palette = [
    [88, 166, 255, 255], [210, 168, 255, 255], [121, 192, 255, 255], [255, 166, 87, 255], [165, 214, 255, 255],
    [255, 123, 114, 255], [63, 185, 80, 255], [242, 204, 96, 255], [219, 97, 162, 255], [86, 212, 221, 255]
  ];
  return specials[chartNormalize(name)] || palette[index % palette.length];
}

function chartColors() {
  return {
    panel: [22, 29, 39, 255],
    header: [25, 33, 44, 255],
    inset: [13, 19, 27, 255],
    line: [48, 60, 75, 255],
    grid: [35, 45, 58, 255],
    white: [239, 245, 252, 255],
    muted: [176, 188, 204, 255],
    red: [255, 100, 105, 255],
    blue: [88, 166, 255, 255],
    gold: [242, 204, 96, 255],
    black: [10, 12, 16, 255]
  };
}

function chartPanel(canvas, x, y, width, height, color) {
  canvas.fillRect(x, y, width, height, color.panel);
  canvas.fillRect(x, y, width, 1, color.line);
  canvas.fillRect(x, y + height - 1, width, 1, color.line);
  canvas.fillRect(x, y, 1, height, color.line);
  canvas.fillRect(x + width - 1, y, 1, height, color.line);
  canvas.fillRect(x, y, 6, height, color.red);
}

function chartDrawBackedText(canvas, font, value, x, y, size, rgba, maxWidth, background) {
  const fitted = canvas.fitFontText(font, historyCardText(value, 10000), size, maxWidth);
  const textWidth = canvas.measureFontText(font, fitted, size);
  canvas.fillRect(x - 4, y - 3, textWidth + 8, Math.ceil(size * 1.7), background);
  canvas.drawFontText(font, fitted, x, y, size, rgba, maxWidth);
}

function chartDrawLine(canvas, x1, y1, x2, y2, rgba, width = 2) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1)));
  for (let i = 0; i <= steps; i += 1) {
    const pct = i / steps;
    const x = x1 + (x2 - x1) * pct;
    const y = y1 + (y2 - y1) * pct;
    canvas.fillRect(x - width / 2, y - width / 2, width, width, rgba);
  }
}

function chartFillCircle(canvas, cx, cy, radius, rgba) {
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (x * x + y * y <= radius * radius) canvas.fillRect(cx + x, cy + y, 1, 1, rgba);
    }
  }
}

function chartFillEllipse(canvas, cx, cy, rx, ry, rgba) {
  for (let y = -ry; y <= ry; y += 1) {
    for (let x = -rx; x <= rx; x += 1) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) canvas.fillRect(cx + x, cy + y, 1, 1, rgba);
    }
  }
}

function chartDrawDuck(canvas, fonts, row, index, x, y, scale, color, options = {}) {
  const duck = [255, 242, 0, 255];
  const outline = color.black;
  const red = [255, 45, 32, 255];
  const accent = chartClanColor(row.clan_name, index);
  const duckWidth = 148 * scale;
  const duckHeight = 134 * scale;
  const duckLeft = x - duckWidth / 2;
  const duckTop = y - duckHeight / 2;

  if (options.duckImage) {
    canvas.drawImageStretch(options.duckImage, duckLeft, duckTop, duckWidth, duckHeight);
  } else {
    const sx = value => x + value * scale;
    const sy = value => duckTop + 74 * scale + value * scale;
    chartFillEllipse(canvas, sx(0), sy(28), 54 * scale, 34 * scale, outline);
    chartFillEllipse(canvas, sx(0), sy(25), 48 * scale, 29 * scale, duck);
    chartFillCircle(canvas, sx(33), sy(-4), 31 * scale, outline);
    chartFillCircle(canvas, sx(33), sy(-4), 25 * scale, duck);
    chartFillEllipse(canvas, sx(70), sy(8), 24 * scale, 12 * scale, outline);
    chartFillEllipse(canvas, sx(72), sy(8), 18 * scale, 8 * scale, red);
    chartFillCircle(canvas, sx(43), sy(-13), 5 * scale, outline);
    canvas.fillRect(sx(-25), sy(16), 26 * scale, 26 * scale, outline);
    canvas.fillRect(sx(-22), sy(19), 20 * scale, 20 * scale, accent);
  }

  if (options.logo) {
    const logoSize = 34 * scale;
    const logoLeft = duckLeft + 44 * scale;
    const logoTop = duckTop + 74 * scale;
    canvas.fillRect(logoLeft - 1, logoTop - 1, logoSize + 2, logoSize + 2, [13, 17, 23, 255]);
    canvas.drawImageCover(options.logo, logoLeft, logoTop, logoSize, logoSize, false);
  }

  const labelText = `#${row.rank} ${row.clan_name}`;
  const labelWidth = Math.min(150, Math.max(126, canvas.measureFontText(fonts.bold, labelText, 13) + 14));
  const labelTop = duckTop - 50 * scale - (options.labelLift || 0);
  canvas.fillRect(x - labelWidth / 2, labelTop, labelWidth, 42, [13, 17, 23, 225]);
  canvas.fillRect(x - labelWidth / 2, labelTop, labelWidth, 1, color.line);
  const fittedLabel = canvas.fitFontText(fonts.bold, historyCardText(labelText, 10000), 13, labelWidth - 14);
  const labelTextWidth = canvas.measureFontText(fonts.bold, fittedLabel, 13);
  canvas.drawFontText(fonts.bold, fittedLabel, x - labelTextWidth / 2, labelTop + 7, 13, color.white, labelWidth - 14);
  const lead = options.lead;
  const stats = `${shortNumber(row.points)}${lead !== null && lead !== undefined ? ` - +${shortNumber(lead)}` : ""}`;
  const fittedStats = canvas.fitFontText(fonts.regular, historyCardText(stats, 10000), 11, labelWidth - 14);
  const statsWidth = canvas.measureFontText(fonts.regular, fittedStats, 11);
  canvas.drawFontText(fonts.regular, fittedStats, x - statsWidth / 2, labelTop + 25, 11, color.muted, labelWidth - 14);
}

function chartDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("en-US", { timeZone: "America/Guatemala", month: "numeric", day: "numeric", year: "2-digit", hour: "numeric", minute: "2-digit" });
}

function chartShortDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { timeZone: "America/Guatemala", month: "short", day: "numeric" });
}

function chartTimeLabel(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("en-US", { timeZone: "America/Guatemala", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function chartHourAxisLabel(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("en-US", { timeZone: "America/Guatemala", hour: "numeric" });
}

function chartTimeOfDayAxisLabel(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("en-US", { timeZone: "America/Guatemala", hour: "numeric", minute: "2-digit" });
}

function chartFilenamePart(value) {
  return String(value || "current").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "current";
}

function finiteHistoryNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function absoluteProfileAssetUrl(value, env) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const siteBase = String(env.SITE_BASE_URL || "https://c0ld-clan.com").replace(/\/$/, "");
  return `${siteBase}/${raw.replace(/^\/+/, "")}`;
}

async function renderHistoryMessage(history, options) {
  const view = HISTORY_VIEWS.includes(options.view) ? options.view : "clan";
  const rows = Array.isArray(history[view]) ? history[view] : [];
  const description = rows.length
    ? rows.map((row, index) => formatHistoryLine(row, view, index + 1)).join("\n")
    : view === "league" && history.league_unavailable
      ? "League history is temporarily unavailable. Try this section again shortly."
      : `No ${HISTORY_VIEW_LABELS[view].toLowerCase()} has been recorded for this player.`;
  const fallbackEmbed = {
    title: `${truncateHistoryText(history.username, 80)} — ${HISTORY_VIEW_LABELS[view]}`,
    color: view === "league" ? 0xf2cc60 : 0xff6b6b,
    description: truncateHistoryText(description, 4000)
  };
  if (history.avatar_url) fallbackEmbed.thumbnail = { url: history.avatar_url };
  const components = historyComponents({
    ownerId: options.ownerId,
    targetId: String(history.user_id),
    view,
    page: 0,
    totalPages: 1,
    cacheId: options.cacheId
  });

  if (options.imageEnabled !== false) {
    try {
      const filename = `c0ld-history-${history.user_id}-${view}.png`;
      const cacheId = options.cacheId || historyCreateCacheId(history.user_id);
      let bytes = null;
      try {
        const prepared = await prepareHistoryRenderCache(history, {
          env: options.env,
          ownerId: options.ownerId,
          cacheId,
          view
        });
        bytes = prepared.get(view) || null;
      } catch (cacheErr) {
        console.warn("history image cache preparation failed", cacheErr?.message || String(cacheErr));
      }
      // A cache/storage failure must not turn the command into the legacy text
      // response. Render the requested card directly as the final image path.
      bytes ||= await renderHistoryCardPng(history, view, options.env);
      return historyImageMessage({
        filename,
        bytes,
        components: historyComponents({
          ownerId: options.ownerId,
          targetId: String(history.user_id),
          view,
          page: 0,
          totalPages: 1,
          cacheId
        })
      });
    } catch (err) {
      console.warn("history image rendering failed", err?.message || String(err));
    }
  }

  return {
    content: null,
    embeds: [fallbackEmbed],
    attachments: [],
    components,
    allowed_mentions: { parse: [] }
  };
}

async function buildCachedHistoryMessage(state, env) {
  const view = HISTORY_VIEWS.includes(state.view) ? state.view : "clan";
  const cacheId = historyCacheIdPart(state.cacheId);
  if (!cacheId) return null;

  const [meta, bytes] = await Promise.all([
    historyGetCachedJson(env, "meta", cacheId),
    historyGetCachedBytes(env, "image", cacheId, view)
  ]);
  if (!meta || !bytes?.byteLength) return null;

  const ownerId = String(meta.owner_id || state.ownerId || "");
  const targetId = String(meta.user_id || state.targetId || "");
  if (ownerId && ownerId !== state.ownerId) return null;
  if (!targetId) return null;

  return historyImageMessage({
    filename: `c0ld-history-${targetId}-${view}.png`,
    bytes,
    components: historyComponents({
      ownerId: state.ownerId,
      targetId,
      view,
      page: state.page || 0,
      totalPages: 1,
      cacheId
    })
  });
}

function historyImageMessage({ filename, bytes, components }) {
  return {
    content: null,
    embeds: [{
      color: 0xff6469,
      image: { url: `attachment://${filename}` }
    }],
    components,
    allowed_mentions: { parse: [] },
    _file: { filename, contentType: "image/png", bytes }
  };
}

async function prepareHistoryRenderCache(history, options = {}) {
  const cacheId = historyCacheIdPart(options.cacheId) || historyCreateCacheId(history.user_id);
  const env = options.env || {};
  const ownerId = String(options.ownerId || "");
  const rendered = new Map();
  const meta = {
    cache_id: cacheId,
    owner_id: ownerId,
    user_id: String(history.user_id || ""),
    username: history.username || null,
    avatar_url: history.avatar_url || null,
    created_at: new Date().toISOString()
  };

  await historyPutCachedJson(env, "meta", cacheId, meta);

  // Render only the selected view. Rendering every full-history card in
  // parallel made an unrelated view failure collapse /history to plain text.
  const candidate = HISTORY_VIEWS.includes(options.view) ? options.view : "clan";
  {
    const existing = await historyGetCachedBytes(env, "image", cacheId, candidate);
    if (existing?.byteLength) {
      rendered.set(candidate, existing);
      return rendered;
    }

    const bytes = await renderHistoryCardPng(history, candidate, env);
    rendered.set(candidate, bytes);
    await historyPutCachedBytes(env, "image", cacheId, candidate, bytes, "image/png");
  }

  return rendered;
}

function historyCreateCacheId(userId) {
  let randomPart = Math.random().toString(36).slice(2, 10);
  try {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    randomPart = [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    // Math.random fallback is fine for a short-lived render cache key.
  }
  return historyCacheIdPart(`${userId || "player"}-${Date.now().toString(36)}-${randomPart}`);
}

function historyCacheIdPart(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 48);
}

function historyRenderCacheTtlSeconds(env) {
  const value = Math.round(Number(env?.HISTORY_RENDER_CACHE_TTL_SECONDS || HISTORY_RENDER_CACHE_TTL_SECONDS));
  return Number.isFinite(value) ? Math.min(3600, Math.max(60, value)) : HISTORY_RENDER_CACHE_TTL_SECONDS;
}

function historyRenderCacheKey(kind, cacheId, view = "meta") {
  return ["history-render", kind, historyCacheIdPart(cacheId), String(view || "meta").toLowerCase()].join(":");
}

function historyRenderCacheRequest(kind, cacheId, view = "meta") {
  return new Request(`https://c0ld-history-cache.local/${encodeURIComponent(kind)}/${encodeURIComponent(historyCacheIdPart(cacheId))}/${encodeURIComponent(String(view || "meta").toLowerCase())}`, {
    method: "GET"
  });
}

function historySetMemoryCache(key, value, env) {
  const ttlMs = historyRenderCacheTtlSeconds(env) * 1000;
  historyRenderMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
  historySweepMemoryCache();
}

function historyGetMemoryCache(key) {
  const entry = historyRenderMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    historyRenderMemoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function historySweepMemoryCache() {
  const now = Date.now();
  for (const [key, entry] of historyRenderMemoryCache) {
    if (now > entry.expiresAt) historyRenderMemoryCache.delete(key);
  }
  while (historyRenderMemoryCache.size > HISTORY_RENDER_MEMORY_CACHE_MAX) {
    const oldestKey = historyRenderMemoryCache.keys().next().value;
    if (!oldestKey) break;
    historyRenderMemoryCache.delete(oldestKey);
  }
}

async function historyPutCachedBytes(env, kind, cacheId, view, bytes, contentType = "application/octet-stream") {
  const key = historyRenderCacheKey(kind, cacheId, view);
  const storedBytes = bytes instanceof Uint8Array ? new Uint8Array(bytes) : new Uint8Array(bytes || []);
  historySetMemoryCache(key, storedBytes, env);

  if (typeof caches === "undefined" || !caches.default) return;
  try {
    await caches.default.put(
      historyRenderCacheRequest(kind, cacheId, view),
      new Response(storedBytes, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": `public, max-age=${historyRenderCacheTtlSeconds(env)}`
        }
      })
    );
  } catch {
    // Memory cache still keeps button swaps fast on the current worker isolate.
  }
}

async function historyGetCachedBytes(env, kind, cacheId, view) {
  const key = historyRenderCacheKey(kind, cacheId, view);
  const memory = historyGetMemoryCache(key);
  if (memory instanceof Uint8Array && memory.byteLength) return new Uint8Array(memory);

  if (typeof caches === "undefined" || !caches.default) return null;
  try {
    const response = await caches.default.match(historyRenderCacheRequest(kind, cacheId, view));
    if (!response?.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength) historySetMemoryCache(key, bytes, env);
    return bytes.byteLength ? bytes : null;
  } catch {
    return null;
  }
}

async function historyPutCachedJson(env, kind, cacheId, value) {
  const key = historyRenderCacheKey(kind, cacheId);
  const storedValue = JSON.parse(JSON.stringify(value || {}));
  historySetMemoryCache(key, storedValue, env);

  if (typeof caches === "undefined" || !caches.default) return;
  try {
    await caches.default.put(
      historyRenderCacheRequest(kind, cacheId),
      new Response(JSON.stringify(storedValue), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": `public, max-age=${historyRenderCacheTtlSeconds(env)}`
        }
      })
    );
  } catch {
    // Cache API misses only mean the next click may fall back to a full render.
  }
}

async function historyGetCachedJson(env, kind, cacheId) {
  const key = historyRenderCacheKey(kind, cacheId);
  const memory = historyGetMemoryCache(key);
  if (memory && typeof memory === "object" && !(memory instanceof Uint8Array)) {
    return JSON.parse(JSON.stringify(memory));
  }

  if (typeof caches === "undefined" || !caches.default) return null;
  try {
    const response = await caches.default.match(historyRenderCacheRequest(kind, cacheId));
    if (!response?.ok) return null;
    const value = await response.json().catch(() => null);
    if (value) historySetMemoryCache(key, value, env);
    return value;
  } catch {
    return null;
  }
}

function formatHistoryLine(row, view, number) {
  const name = escapeDiscordMarkdown(truncateHistoryText(row.name, 72));
  if (view === "league") {
    const league = escapeDiscordMarkdown(truncateHistoryText(row.league_name || "Unknown", 32));
    return `${number}. **${name}** — ${league} — League ${historyRank(row.league_rank)} — Player ${historyRank(row.player_rank)} — ${historyPoints(row.points)} pts`;
  }
  if (view === "clan") {
    const clan = escapeDiscordMarkdown(truncateHistoryText(row.clan_name || "Unknown", 16)).toUpperCase();
    return `${number}. **${name}** — ${clan} — Global ${historyRank(row.global_rank, row.total_global_players)} — ${historyPoints(row.points)} pts`;
  }
  return `${number}. **${name}** — Global ${historyRank(row.global_rank, row.total_global_players)} — ${historyPoints(row.points)} pts`;
}

function historyRank(value, total) {
  const rankValue = positiveInteger(value);
  if (!rankValue) return "—";
  const totalValue = positiveInteger(total);
  return `#${fullNumber(rankValue)}${totalValue ? `/${shortNumber(totalValue)}` : ""}`;
}

function historyPoints(value) {
  return finiteHistoryNumber(value) === null ? "—" : shortNumber(value);
}

function historyComponents({ ownerId, targetId, view, page, totalPages, cacheId = "" }) {
  const rows = [];
  if (totalPages > 1) {
    rows.push({
      type: COMPONENT_TYPE_ACTION_ROW,
      components: [
        historyButton("Previous", historyCustomId(ownerId, targetId, view, page - 1, "previous", cacheId), BUTTON_STYLE_SECONDARY, page <= 0),
        historyButton(`Page ${page + 1}/${totalPages}`, historyCustomId(ownerId, targetId, view, page, "indicator", cacheId), BUTTON_STYLE_SECONDARY, true),
        historyButton("Next", historyCustomId(ownerId, targetId, view, page + 1, "next", cacheId), BUTTON_STYLE_SECONDARY, page >= totalPages - 1)
      ]
    });
  }

  rows.push({
    type: COMPONENT_TYPE_ACTION_ROW,
    components: HISTORY_VIEWS.map(candidate => historyButton(
      HISTORY_VIEW_LABELS[candidate],
      historyCustomId(ownerId, targetId, candidate, 0, `view_${candidate}`, cacheId),
      candidate === view ? BUTTON_STYLE_PRIMARY : BUTTON_STYLE_SECONDARY,
      false
    ))
  });
  return rows;
}

function historyButton(label, customId, style, disabled) {
  return {
    type: COMPONENT_TYPE_BUTTON,
    style,
    label,
    custom_id: customId,
    disabled: Boolean(disabled)
  };
}

function historyPageSize(env) {
  const value = Math.round(Number(env.HISTORY_PAGE_SIZE || DEFAULT_HISTORY_PAGE_SIZE));
  return Number.isFinite(value) ? Math.min(15, Math.max(5, value)) : DEFAULT_HISTORY_PAGE_SIZE;
}

const HISTORY_FONT_5X7 = {
  " ": [0, 0, 0, 0, 0, 0, 0],
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [31, 4, 4, 4, 4, 4, 31], J: [7, 2, 2, 2, 18, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  "0": [14, 17, 19, 21, 25, 17, 14], "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 2, 4, 8, 31], "3": [30, 1, 1, 14, 1, 1, 30],
  "4": [2, 6, 10, 18, 31, 2, 2], "5": [31, 16, 16, 30, 1, 1, 30],
  "6": [14, 16, 16, 30, 17, 17, 14], "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14], "9": [14, 17, 17, 15, 1, 1, 14],
  "-": [0, 0, 0, 31, 0, 0, 0], "_": [0, 0, 0, 0, 0, 0, 31],
  ".": [0, 0, 0, 0, 0, 12, 12], ",": [0, 0, 0, 0, 4, 4, 8],
  ":": [0, 4, 4, 0, 4, 4, 0], "/": [1, 2, 2, 4, 8, 8, 16],
  "#": [10, 31, 10, 10, 31, 10, 0], "(": [2, 4, 8, 8, 8, 4, 2],
  ")": [8, 4, 2, 2, 2, 4, 8], "'": [4, 4, 8, 0, 0, 0, 0],
  "?": [14, 17, 1, 2, 4, 0, 4], "!": [4, 4, 4, 4, 4, 0, 4],
  "&": [12, 18, 20, 8, 21, 18, 13], "+": [0, 4, 4, 31, 4, 4, 0],
  "|": [4, 4, 4, 4, 4, 4, 4], "=": [0, 31, 0, 31, 0, 0, 0],
  "@": [14, 17, 23, 21, 23, 16, 14], "%": [17, 2, 4, 8, 16, 17, 0],
  "*": [0, 21, 14, 31, 14, 21, 0]
};

const HISTORY_FONT_BASE_SIZE = 32;
const HISTORY_FONT_CELL_WIDTH = 42;
const HISTORY_FONT_CELL_HEIGHT = 46;
const HISTORY_FONT_GLYPH_COUNT = 95;
const HISTORY_FONT_ATLASES = {"regular":{"data":"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","advances":[9,9,13,19,17,26,26,7,10,10,13,22,7,13,7,12,17,17,17,17,17,17,17,17,17,17,7,7,22,22,22,14,31,21,18,20,22,16,16,22,23,9,11,19,15,29,24,24,18,24,19,17,17,22,20,30,19,18,18,10,12,10,22,13,9,16,19,15,19,17,10,19,18,8,8,16,8,28,18,19,19,19,11,14,11,18,15,23,15,15,14,10,8,10,22]},"bold":{"data":"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","advances":[9,10,16,19,18,28,27,9,12,12,15,23,9,13,9,14,18,18,18,18,18,18,18,18,18,18,9,9,23,23,23,14,31,23,21,20,24,17,17,23,25,10,14,21,16,31,25,24,20,24,21,18,19,23,21,32,21,19,19,12,14,12,23,13,10,17,20,15,20,17,12,20,19,9,9,18,9,29,19,20,20,20,13,14,12,19,17,26,18,17,15,12,10,12,23]}};
const HOURLY_FONT_ATLASES = {"hourlyBold":{"data":"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","advances":[8,13,18,29,23,40,28,11,17,17,23,29,12,16,12,21,23,23,23,23,23,23,23,23,23,23,14,14,29,29,29,21,33,25,25,24,27,22,21,27,27,18,19,25,21,32,28,28,24,28,26,23,22,27,24,36,25,24,23,17,21,17,29,23,20,22,23,19,23,22,14,23,23,12,14,22,12,34,23,22,23,23,16,19,16,23,21,32,22,21,19,23,23,23,29]}};
let historyFontPromise = null;

async function renderHistoryCardPng(history, view, env = {}) {
  const [fonts, avatar] = await Promise.all([
    loadHistoryFonts(),
    loadRobloxProfileAvatar(history, env, [history.avatar_url]).catch(() => null)
  ]);
  const selectedView = HISTORY_VIEWS.includes(view) ? view : "clan";
  const rows = Array.isArray(history[selectedView]) ? history[selectedView] : [];
  const width = 1200;
  const margin = 32;
  const headerHeight = 176;
  const summaryHeight = 104;
  const panelGap = 14;
  const rowHeight = 56;
  const visibleRows = rows.length ? rows : [null];
  const rowAreaHeight = Math.max(382, 66 + visibleRows.length * rowHeight + 18);
  const height = Math.max(780, headerHeight + summaryHeight + panelGap + rowAreaHeight + 64);
  const color = searchChartBoardColors();
  const canvas = new HistoryPixelCanvas(width, height, color.background, 1);
  const accent = historyModernAccent(selectedView, color);
  const fontsWithRows = { ...fonts, rowBold: fonts.hourlyBold || fonts.bold };
  const name = historyCardText(history.username || `user_${history.user_id}`, 42);
  const title = HISTORY_VIEW_LABELS[selectedView];
  const highlight = historyViewHighlight(rows, selectedView);

  canvas.fillRect(margin, 24, width - margin * 2, height - 48, color.panel);
  hourlyDrawMysticSmoke(canvas, width, height, color);
  hourlyDrawPanelFrame(canvas, margin, 24, width - margin * 2, height - 48, color.line);
  searchChartDrawRainbowBar(canvas, margin + 16, 40, width - margin * 2 - 32, 5, color);
  hourlyDrawHeaderOrnaments(canvas, width / 2, 105, color);
  searchChartDrawAvatarBadge(canvas, fontsWithRows, name, avatar, width / 2 - 42, 62, 84, color);
  historyModernDrawHeader(canvas, fontsWithRows, name, title, width / 2, 94, color);

  const summaryPanel = { x: margin + 22, y: headerHeight, w: width - margin * 2 - 44, h: summaryHeight };
  const rightPanel = { x: summaryPanel.x, y: summaryPanel.y + summaryPanel.h + panelGap, w: summaryPanel.w, h: rowAreaHeight };
  historyModernDrawSummaryStrip(canvas, fontsWithRows, historyModernMetricRows(history, rows, selectedView, highlight, color), summaryPanel, color);

  hourlyDrawPanel(canvas, rightPanel.x, rightPanel.y, rightPanel.w, rightPanel.h, color.panelDeep, color.line);
  hourlyDrawColumnAura(canvas, rightPanel.x, rightPanel.y, rightPanel.w, rightPanel.h, 1, color);
  hourlyDrawColumnHeader(canvas, fontsWithRows, rightPanel.x, rightPanel.y, rightPanel.w, 50, [title, `${fullNumber(rows.length)} record${rows.length === 1 ? "" : "s"}`], 1, color);

  const listTop = rightPanel.y + 66;
  visibleRows.forEach((row, index) => {
    const y = listTop + index * rowHeight;
    if (row) {
      const rowAccent = selectedView === "clan" ? historyClanAccent(row.clan_name, color) : accent;
      historyModernDrawRecordRow(canvas, fontsWithRows, row, selectedView, rightPanel.x + 12, y, rightPanel.w - 24, rowHeight - 5, index, color, rowAccent);
    } else {
      historyModernDrawEmptyRow(canvas, fontsWithRows, history, selectedView, rightPanel.x + 12, y, rightPanel.w - 24, rowHeight + 20, color);
    }
  });

  hourlyDrawMistDivider(canvas, margin + 24, height - 58, width - margin * 2 - 48, color);
  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

function historyModernAccent(view, color) {
  if (view === "league") return color.yellow;
  if (view === "leaderboard") return color.blue;
  return color.red;
}

function historyClanAccent(clanName, color) {
  const normalized = String(clanName || "").trim().toUpperCase();
  if (normalized === "COLD" || normalized === "C0LD") return color.green;
  if (normalized === "NONG") return [88, 166, 255, 255];
  if (normalized === "NXNG") return [255, 154, 74, 255];
  const palette = [
    color.red,
    color.yellow,
    color.cyan,
    color.violet,
    color.pink,
    color.orange,
    [88, 166, 255, 255],
    [104, 218, 159, 255],
    [255, 126, 174, 255]
  ];
  const key = normalized || "UNKNOWN";
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return palette[hash % palette.length];
}

function isSyntheticLeagueHistoryRow(row) {
  const values = [
    row?.key,
    row?.name,
    row?.league_name
  ].map(value => String(value || "").trim().toLowerCase());
  return values.some(value => {
    const compact = value.replace(/[^a-z0-9]+/g, "");
    const underscored = value.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return compact.startsWith("globalleagueplayer")
      || compact.startsWith("globalleagueplayers")
      || underscored.startsWith("global_league_player")
      || underscored.startsWith("global_league_players");
  });
}

function historyModernDrawHeader(canvas, fonts, playerName, title, centerX, y, color) {
  const nameSize = 33;
  const titleSize = 28;
  const fittedName = canvas.fitFontText(fonts.bold, playerName, nameSize, 410);
  const fittedTitle = canvas.fitFontText(fonts.bold, title, titleSize, 320);
  const nameWidth = canvas.measureFontText(fonts.bold, fittedName, nameSize);
  const titleWidth = canvas.measureFontText(fonts.bold, fittedTitle, titleSize);
  const nameX = centerX - 78 - nameWidth;
  const titleX = centerX + 78;
  hourlyDrawOutlinedText(canvas, fonts.bold, fittedName, nameX, y, nameSize, color.green, [7, 18, 31, 235], nameWidth + 8);
  hourlyDrawOutlinedText(canvas, fonts.bold, fittedTitle, titleX, y + 3, titleSize, color.yellow, [48, 32, 9, 235], titleWidth + 8);
}

function historyModernMetricRows(history, rows, view, highlight, color) {
  const globalBest = bestGlobalPerformanceRows(rows);
  const leagueBest = view === "league"
    ? rows.reduce((best, row) => {
        const rankValue = positiveInteger(row.league_rank);
        return rankValue && (!best || rankValue < best) ? rankValue : best;
      }, null)
    : null;
  if (view === "league") {
    return [
      { label: "Player ID", value: historyCardText(history.user_id || "-", 18), tone: color.muted },
      { label: "Records", value: fullNumber(rows.length), tone: rows.length ? color.green : color.zeroText },
      { label: "Best League Rank", value: leagueBest ? rank(leagueBest) : "-", tone: color.yellow }
    ];
  }
  const currentClan = historyCardText(String(history.current_clan || "-").toUpperCase(), 16);
  return [
    { label: "Player ID", value: historyCardText(history.user_id || "-", 18), tone: color.muted },
    { label: "View", value: HISTORY_VIEW_LABELS[view], tone: historyModernAccent(view, color) },
    { label: "Records", value: fullNumber(rows.length), tone: rows.length ? color.green : color.zeroText },
    { label: "Best Global Rank", value: globalBest ? rank(globalBest.rank) : "-", tone: color.yellow },
    {
      label: "Top Performance",
      value: globalBest ? historyTopLabel(globalBest.percent) : historyCardText(highlight.value, 20),
      tone: highlight.tone === "gold" ? color.yellow : color.green
    },
    { label: "Current Clan", value: currentClan || "-", tone: color.green }
  ];
}

function historyModernDrawSummaryStrip(canvas, fonts, metrics, panel, color) {
  hourlyDrawPanel(canvas, panel.x, panel.y, panel.w, panel.h, color.panelDeep, color.line);
  hourlyDrawColumnAura(canvas, panel.x, panel.y, panel.w, panel.h, 2, color);

  const visibleMetrics = (metrics || [])
    .filter(metric => !["View"].includes(metric.label))
    .slice(0, 6);
  const gap = 8;
  const inset = 12;
  const cellWidth = Math.floor((panel.w - inset * 2 - gap * (visibleMetrics.length - 1)) / Math.max(1, visibleMetrics.length));
  const cellY = panel.y + 18;
  const cellHeight = panel.h - 36;
  visibleMetrics.forEach((metric, index) => {
    const x = panel.x + inset + index * (cellWidth + gap);
    hourlyDrawPlayerRowShell(canvas, x, cellY, cellWidth, cellHeight, index, metric.barFraction !== null && metric.barFraction !== undefined, color);
    historyDrawCleanCenteredText(canvas, fonts.rowBold || fonts.bold, metric.label, x + cellWidth / 2, cellY + 10, 12, color.muted, cellWidth - 24);
    historyDrawCleanCenteredText(canvas, fonts.rowBold || fonts.bold, metric.value, x + cellWidth / 2, cellY + 31, 18, metric.tone, cellWidth - 24);
    if (metric.barFraction !== null && metric.barFraction !== undefined) {
      historyDrawBetterThanBar(canvas, x + 12, cellY + cellHeight - 14, cellWidth - 24, 6, metric.barFraction, color);
    }
  });
}

function historyModernDrawRecordRow(canvas, fonts, row, view, x, y, width, height, index, color, accent) {
  const record = historyModernRecordParts(row, view);
  const tagTone = view === "clan" ? accent : record.tagTone;
  hourlyDrawPlayerRowShell(canvas, x, y, width, height, index, true, color);
  canvas.fillRect(x + 12, y + 8, 5, height - 16, accent);
  const titleX = x + 28;
  const pointsX = x + Math.floor(width * 0.29);
  const rankX = x + Math.floor(width * 0.46);
  const barX = x + Math.floor(width * 0.63);
  const pctX = x + width - 18;
  const barW = Math.max(80, pctX - barX - 72);
  const betterThan = historyBetterThanPercent(row);
  const betterFraction = betterThan === null ? null : betterThan / 100;

  historyDrawCleanFittedText(canvas, fonts.rowBold || fonts.bold, historyCardText(record.title, 38), titleX, y + 6, 16, color.white, Math.max(150, pointsX - titleX - 18));
  historyDrawCleanFittedText(canvas, fonts.rowBold || fonts.bold, record.tag, titleX, y + 28, 12, tagTone, Math.max(150, pointsX - titleX - 18));
  historyDrawCleanFittedText(canvas, fonts.rowBold || fonts.bold, record.points, pointsX, y + 15, 15, color.red, Math.max(110, rankX - pointsX - 18));
  historyDrawCleanFittedText(canvas, fonts.rowBold || fonts.bold, record.rank, rankX, y + 15, 15, color.yellow, Math.max(120, barX - rankX - 18));
  if (betterFraction !== null) {
    historyDrawBetterThanBar(canvas, barX, y + 22, barW, 8, betterFraction, color);
    historyDrawCleanRightText(canvas, fonts.rowBold || fonts.bold, `${historyPercentLabel(betterThan)}%`, pctX, y + 18, 13, color.green, 66);
  }
}

function historyModernDrawEmptyRow(canvas, fonts, history, view, x, y, width, height, color) {
  hourlyDrawPlayerRowShell(canvas, x, y, width, height, 0, false, color);
  const message = view === "league" && history.league_unavailable
    ? "League history is temporarily unavailable. Try this section again shortly."
    : `No ${HISTORY_VIEW_LABELS[view].toLowerCase()} has been recorded for this player.`;
  hourlyDrawCenteredText(canvas, fonts.rowBold || fonts.bold, message, x + width / 2, y + 18, 15, color.muted, width - 44, false);
}

function historyModernRecordParts(row, view) {
  if (view === "league") {
    return {
      title: row.league_name || row.name || "Unknown League",
      tag: `Player ${historyCardRank(row.player_rank)}`,
      tagTone: [247, 211, 83, 255],
      rank: `League ${historyCardRank(row.league_rank)}`,
      points: historyCardPointLabel(row.points)
    };
  }
  if (view === "clan") {
    return {
      title: row.name || "Unknown Battle",
      tag: historyCardText(String(row.clan_name || "Unknown").toUpperCase(), 10),
      tagTone: [76, 211, 132, 255],
      rank: historyCardRank(row.global_rank, row.total_global_players),
      points: historyCardPointLabel(row.points)
    };
  }
  return {
    title: row.name || "Unknown Event",
    tag: "Global",
    tagTone: [52, 225, 239, 255],
    rank: historyCardRank(row.global_rank, row.total_global_players),
    points: historyCardPointLabel(row.points)
  };
}

async function renderClanBattleLedgerPng(history, rows, fonts, avatar) {
  const width = 800;
  const margin = 24;
  const gap = 16;
  const contentWidth = width - margin * 2;
  const columns = rows.length > 10 ? 2 : 1;
  const columnWidth = columns === 2 ? Math.floor((contentWidth - gap) / 2) : contentWidth;
  const firstColumnCount = columns === 2 ? Math.ceil(rows.length / 2) : rows.length;
  const gridRows = Math.max(1, firstColumnCount);
  const rowHeight = 68;
  const headerTop = 24;
  const headerHeight = 96;
  const careerTop = 132;
  const careerHeight = 58;
  const rangeTop = 208;
  const rangeHeight = 30;
  const rowTop = rangeTop + rangeHeight;
  const footerHeight = 58;
  const height = Math.max(500, rowTop + gridRows * rowHeight + footerHeight);
  const canvas = new HistoryPixelCanvas(width, height, [10, 15, 22, 255], 2);
  const color = {
    panel: [22, 29, 39, 255],
    panelAlt: [17, 24, 33, 255],
    header: [25, 33, 44, 255],
    inset: [13, 19, 27, 255],
    line: [48, 60, 75, 255],
    white: [239, 245, 252, 255],
    muted: [176, 188, 204, 255],
    quiet: [113, 127, 145, 255],
    track: [35, 43, 54, 255],
    red: [255, 100, 105, 255],
    blue: [88, 166, 255, 255],
    gold: [242, 204, 96, 255],
    green: [104, 218, 159, 255]
  };
  const metrics = historyCareerMetrics(rows, history);

  canvas.fillRect(0, 0, width, 6, color.red);
  canvas.fillRect(margin, headerTop, contentWidth, headerHeight, color.header);
  canvas.fillRect(margin, headerTop, 5, headerHeight, color.red);
  canvas.fillRect(42, 41, 68, 68, color.red);
  if (avatar) canvas.drawImageCover(avatar, 46, 45, 60, 60, true);
  else canvas.drawFontText(fonts.bold, "C", 62, 51, 31, color.inset, 35);

  canvas.drawFontText(fonts.bold, historyCardText(history.username, 27), 128, 42, 29, color.white, 410);
  canvas.drawFontText(
    fonts.regular,
    `PLAYER ID ${historyCardText(history.user_id || "-", 20)}`,
    129,
    84,
    12,
    color.muted,
    270
  );
  canvas.fillRect(600, 40, 1, 64, color.line);
  canvas.drawFontText(fonts.bold, fullNumber(rows.length), 625, 42, 30, color.white, 70);
  canvas.drawFontText(fonts.bold, "RECORDED", 691, 48, 11, color.muted, 72);
  canvas.drawFontText(fonts.bold, "RESULTS", 691, 66, 11, color.muted, 72);
  canvas.drawFontText(fonts.regular, `${metrics.ranked.length} WITH GLOBAL RANK`, 625, 89, 10, color.quiet, 138);

  canvas.fillRect(margin, careerTop, contentWidth, careerHeight, color.panelAlt);
  drawHistoryMetric(canvas, fonts, "TOP PERFORMANCE", historyBestMetric(metrics.best), margin + 16, careerTop + 8, 180, historyPerformanceTone(metrics.best?.percent, color), color);
  canvas.fillRect(margin + 198, careerTop + 10, 1, careerHeight - 20, color.line);
  drawHistoryMetric(canvas, fonts, "RECENT CB AVG", metrics.recentAverage === null ? "-" : historyTopLabel(metrics.recentAverage), margin + 216, careerTop + 8, 136, color.white, color);
  canvas.fillRect(margin + 366, careerTop + 10, 1, careerHeight - 20, color.line);
  drawHistoryMetric(canvas, fonts, "TOTAL CLANS", fullNumber(metrics.clans.length), margin + 384, careerTop + 8, 112, color.white, color);
  canvas.fillRect(margin + 510, careerTop + 10, 1, careerHeight - 20, color.line);
  drawHistoryMetric(canvas, fonts, "CURRENT CLAN TENURE", historyCurrentClanTenure(metrics), margin + 528, careerTop + 8, 208, color.white, color);

  const columnRows = columns === 2
    ? [rows.slice(0, firstColumnCount), rows.slice(firstColumnCount)]
    : [rows];
  columnRows.forEach((entries, column) => {
    const x = margin + column * (columnWidth + gap);
    const start = column === 0 ? 1 : firstColumnCount + 1;
    const end = start + entries.length - 1;
    const rangeLabel = entries.length ? `RECORDS ${historyTwoDigit(start)}-${historyTwoDigit(end)}` : "RECORDS";
    canvas.drawFontText(fonts.bold, rangeLabel, x + 12, rangeTop + 5, 11, color.quiet, 150);
    canvas.drawFontText(fonts.regular, "FIELD OUTRANKED", x + columnWidth - 116, rangeTop + 7, 9, color.quiet, 104);
    canvas.fillRect(x, rangeTop + rangeHeight - 1, columnWidth, 1, color.line);

    if (!entries.length) {
      canvas.drawFontText(fonts.regular, "No clan battle records.", x + 18, rowTop + 18, 15, color.muted, columnWidth - 36);
      return;
    }

    entries.forEach((row, localIndex) => {
      const globalIndex = column === 0 ? localIndex : firstColumnCount + localIndex;
      const previous = globalIndex > 0 ? rows[globalIndex - 1] : null;
      const next = globalIndex + 1 < rows.length ? rows[globalIndex + 1] : null;
      drawClanLedgerRow(
        canvas,
        fonts,
        row,
        globalIndex,
        x,
        rowTop + localIndex * rowHeight,
        columnWidth,
        rowHeight,
        historySameClan(previous, row),
        historySameClan(row, next),
        color
      );
    });
  });

  if (columns === 2) {
    const separatorX = margin + columnWidth + Math.floor(gap / 2);
    canvas.fillRect(separatorX, rangeTop + 4, 1, gridRows * rowHeight + rangeHeight - 8, color.line);
  }
  canvas.fillRect(margin, height - footerHeight + 8, contentWidth, 1, color.line);
  canvas.drawFontText(fonts.regular, "Bot by Cinnamowopal", margin + 16, height - 35, 13, color.muted, 300);
  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

function drawHistoryMetric(canvas, fonts, label, value, x, y, width, valueColor, color) {
  canvas.drawFontText(fonts.bold, label, x, y, 10, color.quiet, width);
  canvas.drawFontText(fonts.bold, historyCardText(value, 40), x, y + 20, 14, valueColor, width);
}

function drawClanLedgerRow(canvas, fonts, row, index, x, y, width, height, joinsPrevious, joinsNext, color) {
  canvas.fillRect(x, y, width, height, index % 2 ? color.panel : color.panelAlt);
  canvas.fillRect(x + 16, y + height - 1, width - 32, 1, color.line);

  const centerY = y + Math.floor(height / 2);
  const railX = x + 8;
  canvas.fillRect(railX, joinsPrevious ? y : y + 10, 2, centerY - (joinsPrevious ? y : y + 10), color.line);
  canvas.fillRect(railX, centerY, 2, (joinsNext ? y + height : y + height - 10) - centerY, color.line);
  const startsStint = !joinsPrevious;
  canvas.fillRect(railX - (startsStint ? 2 : 1), centerY - (startsStint ? 2 : 1), startsStint ? 6 : 4, startsStint ? 6 : 4, startsStint ? color.red : color.quiet);

  canvas.drawFontText(fonts.regular, historyTwoDigit(index + 1), x + 19, y + 7, 9, color.quiet, 20);
  const clan = historyCardText(String(row.clan_name || "-").toUpperCase(), 8);
  canvas.drawFontText(fonts.bold, clan, x + 42, y + 22, 11, color.white, 43);
  canvas.fillRect(x + 93, y + 9, 1, height - 18, color.line);
  canvas.drawFontText(fonts.bold, historyCardText(row.name, 46), x + 106, y + 5, 15, color.white, width - 120);

  const percent = historyRowPercent(row);
  const performanceLabel = percent === null ? null : historyTopLabel(percent);
  const performanceWidth = 76;
  const rankDetail = historyLedgerRank(row.global_rank, row.total_global_players);
  const pointsDetail = historyLedgerPoints(row.points);
  const details = [];
  if (pointsDetail !== "-") details.push(`${pointsDetail} PTS`);
  if (rankDetail !== "-") details.push(rankDetail);
  const detail = details.length ? details.join("  |  ") : "NO RESULT RECORDED";
  canvas.drawFontText(fonts.regular, historyCardText(detail, 80), x + 106, y + 32, 11, color.muted, width - 106 - performanceWidth - 8);
  if (performanceLabel) {
    const tone = historyPerformanceTone(percent, color);
    canvas.drawFontText(fonts.bold, performanceLabel, x + width - performanceWidth, y + 32, 11, tone, performanceWidth - 10);
    drawHistoryFieldTape(canvas, x + 106, y + 56, width - 120, percent, tone, color);
  }
}

function drawHistoryFieldTape(canvas, x, y, width, percent, tone, color) {
  const segmentCount = 20;
  const gap = 2;
  const segmentWidth = (width - gap * (segmentCount - 1)) / segmentCount;
  const outranked = Math.max(0, Math.min(100, 100 - percent));
  const illuminated = outranked / 100 * segmentCount;
  for (let segment = 0; segment < segmentCount; segment++) {
    const segmentX = x + segment * (segmentWidth + gap);
    canvas.fillRect(segmentX, y, segmentWidth, 3, color.track);
    const fraction = Math.max(0, Math.min(1, illuminated - segment));
    if (fraction > 0) canvas.fillRect(segmentX, y, segmentWidth * fraction, 3, tone);
  }
}

function historyCareerMetrics(rows, history = {}) {
  const ranked = (rows || []).map(row => {
    const rank = positiveInteger(row.global_rank);
    const total = positiveInteger(row.total_global_players);
    return rank && total ? { row, rank, total, percent: rank / total * 100 } : null;
  }).filter(Boolean);
  const recentRanked = ranked.filter(entry => !historyBattleIsActive(entry.row)).slice(0, 5);
  const recentAverage = recentRanked.length
    ? recentRanked.reduce((sum, entry) => sum + entry.percent, 0) / recentRanked.length
    : null;
  const best = ranked.reduce((current, entry) => {
    if (!current) return entry;
    if (entry.rank !== current.rank) return entry.rank < current.rank ? entry : current;
    return entry.percent < current.percent ? entry : current;
  }, null);
  const clans = [];
  const seen = new Set();
  const currentClanValue = history.current_clan || history.currentClan || null;
  const currentClan = historyCardText(String(currentClanValue || "").toUpperCase(), 12);
  if (currentClan && currentClan !== "UNKNOWN") {
    seen.add(currentClan);
    clans.push(currentClan);
  }
  for (const row of rows || []) {
    const clan = historyCardText(String(row.clan_name || "").toUpperCase(), 12);
    if (!clan || clan === "UNKNOWN" || seen.has(clan)) continue;
    seen.add(clan);
    clans.push(clan);
  }
  return {
    ranked,
    recentRanked,
    recentAverage,
    best,
    clans,
    currentClan: currentClan && currentClan !== "UNKNOWN" ? currentClan : null,
    clanJoinTime: history.clan_join_time || history.clanJoinTime || null
  };
}

function historyBestMetric(best) {
  return best ? `#${fullNumber(best.rank)} / ${historyTopLabel(best.percent)}` : "-";
}

function historyCurrentClanTenure(metrics, nowMs = Date.now()) {
  if (!metrics.currentClan) return "-";
  const joinMs = Date.parse(String(metrics.clanJoinTime || ""));
  if (!Number.isFinite(joinMs) || joinMs > nowMs) return `${metrics.currentClan} / UNKNOWN`;
  const days = Math.floor((nowMs - joinMs) / 86400000);
  if (days < 1) return `${metrics.currentClan} / <1 DAY`;
  return `${metrics.currentClan} / ${fullNumber(days)} DAY${days === 1 ? "" : "S"}`;
}

function historyBattleIsActive(row, nowMs = Date.now()) {
  if (row?.is_active === true || String(row?.is_active || "").toLowerCase() === "true") return true;
  const endMs = Date.parse(String(row?.battle_end_iso || row?.battle_ended_at || ""));
  return Number.isFinite(endMs) && endMs > nowMs;
}

function historyTwoDigit(value) {
  return String(Math.max(0, Number(value) || 0)).padStart(2, "0");
}

function historySameClan(left, right) {
  if (!left || !right) return false;
  return String(left.clan_name || "").trim().toUpperCase() === String(right.clan_name || "").trim().toUpperCase();
}

function historyRowPercent(row) {
  const rank = positiveInteger(row?.global_rank);
  const total = positiveInteger(row?.total_global_players);
  return rank && total ? rank / total * 100 : null;
}

function historyDrawCleanFittedText(canvas, font, value, x, y, size, rgba, maxWidth = Infinity) {
  const fitted = canvas.fitFontText(font, historyCardText(value, 10000), size, maxWidth);
  canvas.drawFontText(font, fitted, Math.round(x), Math.round(y), size, rgba, maxWidth);
}

function historyDrawCleanRightText(canvas, font, value, rightX, y, size, rgba, maxWidth = Infinity) {
  const fitted = canvas.fitFontText(font, historyCardText(value, 10000), size, maxWidth);
  const width = canvas.measureFontText(font, fitted, size);
  canvas.drawFontText(font, fitted, Math.round(rightX - width), Math.round(y), size, rgba, width + 4);
}

function historyDrawCleanCenteredText(canvas, font, value, centerX, y, size, rgba, maxWidth = Infinity) {
  const fitted = canvas.fitFontText(font, historyCardText(value, 10000), size, maxWidth);
  const width = canvas.measureFontText(font, fitted, size);
  canvas.drawFontText(font, fitted, Math.round(centerX - width / 2), Math.round(y), size, rgba, width + 4);
}

function historyBetterThanPercent(row) {
  const rank = positiveInteger(row?.global_rank);
  const total = positiveInteger(row?.total_global_players);
  if (!rank || !total) return null;
  return Math.max(0, Math.min(100, (total - rank) / total * 100));
}

function historyBetterThanPercentFromTopPercent(topPercent) {
  if (!Number.isFinite(topPercent)) return null;
  return Math.max(0, Math.min(100, 100 - topPercent));
}

function historyPercentLabel(value) {
  if (!Number.isFinite(value)) return "N/A";
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function historyDrawBetterThanBar(canvas, x, y, width, height, fraction, color) {
  const barX = Math.round(x);
  const barY = Math.round(y);
  const barW = Math.max(1, Math.round(width));
  const barH = Math.max(1, Math.round(height));
  const pct = Math.max(0, Math.min(1, Number(fraction) || 0));
  hourlyFillRoundedRect(canvas, barX, barY, barW, barH, Math.min(4, Math.floor(barH / 2)), color.bar || color.track || [48, 55, 72, 255]);
  const fillW = Math.max(0, Math.min(barW, Math.round(barW * pct)));
  for (let dx = 0; dx < fillW; dx += 1) {
    const t = fillW <= 1 ? 1 : dx / (fillW - 1);
    const blend = t < 0.58 ? t / 0.58 : (t - 0.58) / 0.42;
    const start = t < 0.58 ? color.violet : color.cyan;
    const end = t < 0.58 ? color.cyan : color.green;
    const rgba = historyMixColor(start, end, blend);
    canvas.fillRect(barX + dx, barY, 1, barH, rgba);
  }
}

function historyMixColor(start, end, amount) {
  const t = Math.max(0, Math.min(1, Number(amount) || 0));
  return [
    Math.round((start?.[0] ?? 0) + ((end?.[0] ?? 0) - (start?.[0] ?? 0)) * t),
    Math.round((start?.[1] ?? 0) + ((end?.[1] ?? 0) - (start?.[1] ?? 0)) * t),
    Math.round((start?.[2] ?? 0) + ((end?.[2] ?? 0) - (start?.[2] ?? 0)) * t),
    Math.round((start?.[3] ?? 255) + ((end?.[3] ?? 255) - (start?.[3] ?? 255)) * t)
  ];
}

function historyPerformanceTone(percent, color) {
  if (!Number.isFinite(percent)) return color.quiet || color.muted;
  if (percent <= 1) return color.gold;
  if (percent <= 5) return color.green;
  return color.blue;
}

function historyLedgerRank(value, total) {
  const rankValue = positiveInteger(value);
  if (!rankValue) return "-";
  const totalValue = positiveInteger(total);
  return `#${fullNumber(rankValue)}${totalValue ? ` / ${fullNumber(totalValue)}` : ""}`;
}

function historyLedgerPoints(value) {
  return finiteHistoryNumber(value) === null ? "-" : shortNumber(value);
}

function drawHistorySectionHeader(canvas, fonts, label, count, x, y, width, accent, color) {
  canvas.fillRect(x, y, width, 48, color.header);
  canvas.fillRect(x, y, 5, 48, accent);
  canvas.drawFontText(fonts.bold, label, x + 18, y + 8, 20, color.white, width - 125);
  canvas.drawFontText(fonts.regular, `${count} record${count === 1 ? "" : "s"}`, x + width - 94, y + 12, 12, color.muted, 84);
}

function drawCombinedHistoryRow(canvas, fonts, row, view, x, y, width, color, accent) {
  const performance = historyPerformanceBadge(row, view, color);
  const badgeWidth = performance ? 94 : 0;
  canvas.drawFontText(fonts.bold, historyCardText(row.name, 44), x + 17, y + 3, 18, color.white, width - 34 - badgeWidth);
  if (performance) {
    canvas.fillRect(x + width - 104, y + 7, 92, 22, performance.background);
    canvas.drawFontText(fonts.bold, performance.label, x + width - 97, y + 10, 11, performance.foreground, 80);
  }
  let details;
  if (view === "league") {
    details = `${row.league_name || "Unknown"}  |  League ${historyCardRank(row.league_rank)}  |  Player ${historyCardRank(row.player_rank)}  |  ${historyCardPointLabel(row.points)}`;
  } else if (view === "clan") {
    const clanName = historyCardText(String(row.clan_name || "Unknown").toUpperCase(), 8);
    canvas.fillRect(x + 17, y + 35, 3, 17, accent);
    canvas.drawFontText(fonts.bold, clanName, x + 29, y + 33, 12, color.white, 54);
    canvas.fillRect(x + 91, y + 35, 1, 17, color.line);
    details = `Global ${historyCardRank(row.global_rank, row.total_global_players)}  |  ${historyCardPointLabel(row.points)}`;
    canvas.drawFontText(fonts.regular, historyCardText(details, 100), x + 103, y + 33, 13, color.muted, width - 116);
    return;
  } else {
    details = `Global ${historyCardRank(row.global_rank, row.total_global_players)}  |  ${historyCardPointLabel(row.points)}`;
  }
  canvas.fillRect(x + 17, y + 42, 5, 5, accent);
  canvas.drawFontText(fonts.regular, historyCardText(details, 100), x + 30, y + 33, 13, color.muted, width - 43);
}

function historyPerformanceBadge(row, view, color) {
  if (view === "league") {
    const playerRank = positiveInteger(row.player_rank);
    return playerRank ? { label: `PLAYER #${fullNumber(playerRank)}`, foreground: color.gold, background: color.goldDark } : null;
  }
  const rankValue = positiveInteger(row.global_rank);
  const totalValue = positiveInteger(row.total_global_players);
  if (!rankValue || !totalValue) return null;
  const percent = rankValue / totalValue * 100;
  if (percent <= 1) return { label: historyTopLabel(percent), foreground: color.gold, background: color.goldDark };
  if (percent <= 5) return { label: historyTopLabel(percent), foreground: color.green, background: color.greenDark };
  return { label: historyTopLabel(percent), foreground: color.blue, background: color.blueDark };
}

function historyTopLabel(percent) {
  if (!Number.isFinite(percent)) return "N/A";
  const value = percent.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  return `TOP ${value}%`;
}

function historyViewHighlight(rows, view) {
  if (view === "league") {
    const best = (rows || []).reduce((current, row) => {
      const playerRank = positiveInteger(row.player_rank);
      if (!playerRank || (current && current.playerRank <= playerRank)) return current;
      return { playerRank, leagueRank: positiveInteger(row.league_rank) };
    }, null);
    return best
      ? { label: "BEST LEAGUE FINISH", value: `Player #${fullNumber(best.playerRank)}${best.leagueRank ? `  |  League #${fullNumber(best.leagueRank)}` : ""}`, tone: "gold" }
      : { label: "LEAGUE PERFORMANCE", value: "No ranked result", tone: "gold" };
  }
  const best = bestGlobalPerformanceRows(rows);
  return best
    ? { label: "BEST GLOBAL FINISH", value: `${historyCardRank(best.rank)}  |  ${historyTopLabel(best.percent)}`, tone: best.percent <= 1 ? "gold" : "green" }
    : { label: "GLOBAL PERFORMANCE", value: "No global rank", tone: "blue" };
}

function bestGlobalPerformanceRows(rows) {
  return (rows || []).reduce((best, row) => {
    const rank = positiveInteger(row.global_rank);
    const total = positiveInteger(row.total_global_players);
    if (!rank || !total) return best;
    const percent = rank / total * 100;
    return best && best.percent <= percent ? best : { rank, total, percent };
  }, null);
}

function bestHistoryGlobalPerformance(history) {
  const rows = [...(history.clan || [])];
  return rows.reduce((best, row) => {
    const rank = positiveInteger(row.global_rank);
    const total = positiveInteger(row.total_global_players);
    if (!rank || !total) return best;
    const percent = rank / total * 100;
    if (best && best.percent <= percent) return best;
    return { rank, total, percent, tone: percent <= 1 ? "gold" : "green" };
  }, null);
}

function historyCardRank(value, total) {
  return positiveInteger(value) ? historyRank(value, total) : "N/A";
}

function historyCardPoints(value) {
  return finiteHistoryNumber(value) === null ? "N/A" : historyPoints(value);
}

function historyCardPointLabel(value) {
  return finiteHistoryNumber(value) === null ? "N/A" : historyPoints(value);
}

function historyCardText(value, maxLength = 40) {
  const ascii = String(value ?? "-")
    .normalize("NFKD")
    .replace(/[\u2012-\u2015]/g, "-")
    .replace(/[^\x20-\x7e]/g, "?");
  return ascii.length > maxLength ? `${ascii.slice(0, Math.max(1, maxLength - 3))}...` : ascii;
}

async function loadHistoryFonts() {
  if (!historyFontPromise) {
    historyFontPromise = Promise.all(Object.entries({ ...HISTORY_FONT_ATLASES, ...HOURLY_FONT_ATLASES }).map(async ([name, face]) => {
      const packed = historyBase64Bytes(face.data);
      const alpha = new Uint8Array(await new Response(
        new Blob([packed]).stream().pipeThrough(new DecompressionStream("deflate"))
      ).arrayBuffer());
      const expected = HISTORY_FONT_CELL_WIDTH * HISTORY_FONT_CELL_HEIGHT * HISTORY_FONT_GLYPH_COUNT;
      if (alpha.length !== expected) throw new Error(`History font ${name} decoded to an unexpected size.`);
      return [name, { alpha, advances: face.advances, bounds: historyFontAlphaBounds(alpha) }];
    })).then(entries => Object.fromEntries(entries));
  }
  return historyFontPromise;
}

function historyFontAlphaBounds(alpha) {
  let top = HISTORY_FONT_CELL_HEIGHT;
  let bottom = -1;
  const atlasWidth = HISTORY_FONT_CELL_WIDTH * HISTORY_FONT_GLYPH_COUNT;
  for (let glyph = 1; glyph < HISTORY_FONT_GLYPH_COUNT; glyph += 1) {
    const left = glyph * HISTORY_FONT_CELL_WIDTH;
    for (let y = 0; y < HISTORY_FONT_CELL_HEIGHT; y += 1) {
      for (let x = 0; x < HISTORY_FONT_CELL_WIDTH; x += 1) {
        if (alpha[y * atlasWidth + left + x] <= 8) continue;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  return bottom >= top ? { top, bottom } : { top: 0, bottom: HISTORY_FONT_CELL_HEIGHT - 1 };
}

function historyBase64Bytes(encoded) {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function loadHistoryAvatar(url) {
  const value = String(url || "").trim();
  if (!/^https?:\/\//i.test(value)) return null;
  const response = await fetch(value, {
    headers: { Accept: "image/png,image/*;q=0.8", "User-Agent": "c0ld-Discord-History-Worker" },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  if (!response.ok) return null;
  return decodeHistoryPng(new Uint8Array(await response.arrayBuffer()));
}

async function decodeHistoryPng(bytes) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 33 || signature.some((byte, index) => bytes[index] !== byte)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette = null;
  let transparency = null;
  const idat = [];

  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.length) return null;
    const data = bytes.subarray(dataStart, dataEnd);
    if (type === "IHDR") {
      width = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(0);
      height = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "PLTE") palette = data.slice();
    else if (type === "tRNS") transparency = data.slice();
    else if (type === "IDAT") idat.push(data.slice());
    else if (type === "IEND") break;
    offset = dataEnd + 4;
  }

  if (!width || !height || bitDepth !== 8 || interlace !== 0 || !idat.length) return null;
  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 })[colorType];
  if (!channels || (colorType === 3 && !palette)) return null;
  const compressed = concatHistoryBytes(...idat);
  const inflated = new Uint8Array(await new Response(
    new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate"))
  ).arrayBuffer());
  const stride = width * channels;
  if (inflated.length < (stride + 1) * height) return null;
  const decoded = new Uint8Array(stride * height);
  let sourceOffset = 0;

  for (let y = 0; y < height; y++) {
    const filter = inflated[sourceOffset++];
    const rowOffset = y * stride;
    const previousOffset = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const raw = inflated[sourceOffset++];
      const left = x >= channels ? decoded[rowOffset + x - channels] : 0;
      const up = y > 0 ? decoded[previousOffset + x] : 0;
      const upLeft = y > 0 && x >= channels ? decoded[previousOffset + x - channels] : 0;
      let value = raw;
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += Math.floor((left + up) / 2);
      else if (filter === 4) value += historyPaeth(left, up, upLeft);
      else if (filter !== 0) return null;
      decoded[rowOffset + x] = value & 255;
    }
  }

  const rgba = new Uint8Array(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel++) {
    const source = pixel * channels;
    const target = pixel * 4;
    if (colorType === 6) {
      rgba.set(decoded.subarray(source, source + 4), target);
    } else if (colorType === 2) {
      rgba[target] = decoded[source];
      rgba[target + 1] = decoded[source + 1];
      rgba[target + 2] = decoded[source + 2];
      rgba[target + 3] = 255;
    } else if (colorType === 3) {
      const index = decoded[source];
      rgba[target] = palette[index * 3] || 0;
      rgba[target + 1] = palette[index * 3 + 1] || 0;
      rgba[target + 2] = palette[index * 3 + 2] || 0;
      rgba[target + 3] = transparency?.[index] ?? 255;
    } else {
      const gray = decoded[source];
      rgba[target] = gray;
      rgba[target + 1] = gray;
      rgba[target + 2] = gray;
      rgba[target + 3] = colorType === 4 ? decoded[source + 1] : 255;
    }
  }
  return { width, height, pixels: rgba };
}

function historyPaeth(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const diagonalDistance = Math.abs(estimate - upLeft);
  return leftDistance <= upDistance && leftDistance <= diagonalDistance ? left : upDistance <= diagonalDistance ? up : upLeft;
}

function historyBilinearAlpha(data, width, height, x, y, minX = 0, maxX = width - 1) {
  const clampedX = Math.max(minX, Math.min(maxX, x));
  const clampedY = Math.max(0, Math.min(height - 1, y));
  const x0 = Math.floor(clampedX);
  const y0 = Math.floor(clampedY);
  const x1 = Math.min(maxX, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = clampedX - x0;
  const ty = clampedY - y0;
  const top = data[y0 * width + x0] * (1 - tx) + data[y0 * width + x1] * tx;
  const bottom = data[y1 * width + x0] * (1 - tx) + data[y1 * width + x1] * tx;
  return Math.round(top * (1 - ty) + bottom * ty);
}

function historyBilinearRgba(image, x, y) {
  const clampedX = Math.max(0, Math.min(image.width - 1, x));
  const clampedY = Math.max(0, Math.min(image.height - 1, y));
  const x0 = Math.floor(clampedX);
  const y0 = Math.floor(clampedY);
  const x1 = Math.min(image.width - 1, x0 + 1);
  const y1 = Math.min(image.height - 1, y0 + 1);
  const tx = clampedX - x0;
  const ty = clampedY - y0;
  const result = [0, 0, 0, 0];
  for (let channel = 0; channel < 4; channel++) {
    const top = image.pixels[(y0 * image.width + x0) * 4 + channel] * (1 - tx)
      + image.pixels[(y0 * image.width + x1) * 4 + channel] * tx;
    const bottom = image.pixels[(y1 * image.width + x0) * 4 + channel] * (1 - tx)
      + image.pixels[(y1 * image.width + x1) * 4 + channel] * tx;
    result[channel] = Math.round(top * (1 - ty) + bottom * ty);
  }
  return result;
}

class HistoryPixelCanvas {
  constructor(width, height, background, pixelRatio = 1) {
    this.pixelRatio = Math.max(1, Math.trunc(pixelRatio) || 1);
    this.width = width * this.pixelRatio;
    this.height = height * this.pixelRatio;
    this.pixels = new Uint8Array(this.width * this.height * 4);
    this.fillRect(0, 0, width, height, background);
  }

  fillRect(x, y, width, height, rgba) {
    const ratio = this.pixelRatio;
    const left = Math.max(0, Math.trunc(x * ratio));
    const top = Math.max(0, Math.trunc(y * ratio));
    const right = Math.min(this.width, Math.trunc((x + width) * ratio));
    const bottom = Math.min(this.height, Math.trunc((y + height) * ratio));
    for (let py = top; py < bottom; py++) {
      let offset = (py * this.width + left) * 4;
      for (let px = left; px < right; px++) {
        this.pixels[offset++] = rgba[0];
        this.pixels[offset++] = rgba[1];
        this.pixels[offset++] = rgba[2];
        this.pixels[offset++] = rgba[3] ?? 255;
      }
    }
  }

  drawImageStretch(image, x, y, width, height) {
    if (!image?.width || !image?.height || !image?.pixels) return;
    const ratio = this.pixelRatio;
    x *= ratio;
    y *= ratio;
    width *= ratio;
    height *= ratio;

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const sourceX = (px + 0.5) / width * image.width - 0.5;
        const sourceY = (py + 0.5) / height * image.height - 0.5;
        const sample = historyBilinearRgba(image, sourceX, sourceY);
        this.blendPixel(
          Math.trunc(x + px),
          Math.trunc(y + py),
          sample,
          255
        );
      }
    }
  }

  drawImageCover(image, x, y, width, height, circular = false) {
    if (!image?.width || !image?.height || !image?.pixels) return;
    const ratio = this.pixelRatio;
    x *= ratio;
    y *= ratio;
    width *= ratio;
    height *= ratio;
    const targetRatio = width / height;
    const sourceRatio = image.width / image.height;
    const cropWidth = sourceRatio > targetRatio ? image.height * targetRatio : image.width;
    const cropHeight = sourceRatio > targetRatio ? image.height : image.width / targetRatio;
    const cropX = (image.width - cropWidth) / 2;
    const cropY = (image.height - cropHeight) / 2;
    const radius = Math.min(width, height) / 2;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        if (circular) {
          const dx = px + 0.5 - centerX;
          const dy = py + 0.5 - centerY;
          if (dx * dx + dy * dy > radius * radius) continue;
        }
        const sourceX = cropX + (px + 0.5) / width * cropWidth - 0.5;
        const sourceY = cropY + (py + 0.5) / height * cropHeight - 0.5;
        const sample = historyBilinearRgba(image, sourceX, sourceY);
        this.blendPixel(
          Math.trunc(x + px),
          Math.trunc(y + py),
          sample,
          255
        );
      }
    }
  }

  drawFontText(font, value, x, y, size, rgba, maxWidth = Infinity) {
    const ratio = this.pixelRatio;
    x *= ratio;
    y *= ratio;
    size *= ratio;
    maxWidth = Number.isFinite(maxWidth) ? maxWidth * ratio : maxWidth;
    const text = this.fitFontText(font, historyCardText(value, 10000), size, maxWidth);
    const scale = size / HISTORY_FONT_BASE_SIZE;
    let cursor = Number(x);
    for (const character of text) {
      const code = character.charCodeAt(0);
      const glyphIndex = code >= 32 && code <= 126 ? code - 32 : 31;
      this.drawFontGlyph(font, glyphIndex, cursor, y, scale, rgba);
      cursor += (font.advances[glyphIndex] || HISTORY_FONT_BASE_SIZE / 2) * scale;
    }
    return cursor;
  }

  fitFontText(font, value, size, maxWidth) {
    if (!Number.isFinite(maxWidth) || this.measureFontText(font, value, size) <= maxWidth) return value;
    const suffix = "...";
    const available = Math.max(0, maxWidth - this.measureFontText(font, suffix, size));
    let output = "";
    let width = 0;
    const scale = size / HISTORY_FONT_BASE_SIZE;
    for (const character of value) {
      const code = character.charCodeAt(0);
      const glyphIndex = code >= 32 && code <= 126 ? code - 32 : 31;
      const advance = (font.advances[glyphIndex] || HISTORY_FONT_BASE_SIZE / 2) * scale;
      if (width + advance > available) break;
      output += character;
      width += advance;
    }
    return output + suffix;
  }

  measureFontText(font, value, size) {
    const scale = size / HISTORY_FONT_BASE_SIZE;
    let width = 0;
    for (const character of String(value || "")) {
      const code = character.charCodeAt(0);
      const glyphIndex = code >= 32 && code <= 126 ? code - 32 : 31;
      width += (font.advances[glyphIndex] || HISTORY_FONT_BASE_SIZE / 2) * scale;
    }
    return width;
  }

  drawFontGlyph(font, glyphIndex, x, y, scale, rgba) {
    const outputWidth = Math.ceil(HISTORY_FONT_CELL_WIDTH * scale);
    const outputHeight = Math.ceil(HISTORY_FONT_CELL_HEIGHT * scale);
    const atlasWidth = HISTORY_FONT_CELL_WIDTH * HISTORY_FONT_GLYPH_COUNT;
    const sourceLeft = glyphIndex * HISTORY_FONT_CELL_WIDTH;
    for (let py = 0; py < outputHeight; py++) {
      const sourceY = (py + 0.5) / scale - 0.5;
      for (let px = 0; px < outputWidth; px++) {
        const sourceX = (px + 0.5) / scale - 0.5;
        const coverage = historyBilinearAlpha(font.alpha, atlasWidth, HISTORY_FONT_CELL_HEIGHT, sourceLeft + sourceX, sourceY, sourceLeft, sourceLeft + HISTORY_FONT_CELL_WIDTH - 1);
        if (coverage) this.blendPixel(Math.round(x + px), Math.round(y + py), rgba, coverage);
      }
    }
  }

  blendPixel(x, y, rgba, coverage) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const offset = (y * this.width + x) * 4;
    const alpha = (coverage / 255) * ((rgba[3] ?? 255) / 255);
    const inverse = 1 - alpha;
    this.pixels[offset] = Math.round(rgba[0] * alpha + this.pixels[offset] * inverse);
    this.pixels[offset + 1] = Math.round(rgba[1] * alpha + this.pixels[offset + 1] * inverse);
    this.pixels[offset + 2] = Math.round(rgba[2] * alpha + this.pixels[offset + 2] * inverse);
    this.pixels[offset + 3] = 255;
  }
}

async function encodeHistoryPng(width, height, rgbaPixels) {
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const destination = y * (stride + 1);
    raw[destination] = 0;
    raw.set(rgbaPixels.subarray(y * stride, (y + 1) * stride), destination + 1);
  }

  const compressed = new Uint8Array(await new Response(
    new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate"))
  ).arrayBuffer());
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = 8;
  header[9] = 6;
  return concatHistoryBytes(
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    historyPngChunk("IHDR", header),
    historyPngChunk("IDAT", compressed),
    historyPngChunk("IEND", new Uint8Array())
  );
}

function historyPngChunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const output = new Uint8Array(12 + data.length);
  const view = new DataView(output.buffer);
  view.setUint32(0, data.length);
  output.set(typeBytes, 4);
  output.set(data, 8);
  view.setUint32(8 + data.length, historyCrc32(concatHistoryBytes(typeBytes, data)));
  return output;
}

let historyCrcTable = null;
function historyCrc32(bytes) {
  if (!historyCrcTable) {
    historyCrcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let value = n;
      for (let bit = 0; bit < 8; bit++) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      historyCrcTable[n] = value >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of bytes) crc = historyCrcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function concatHistoryBytes(...parts) {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function escapeDiscordMarkdown(value) {
  return String(value || "").replace(/([\\`*_{}\[\]()<>#+\-.!|~>])/g, "\\$1");
}

function truncateHistoryText(value, length) {
  const text = String(value || "Unknown").trim() || "Unknown";
  return text.length > length ? `${text.slice(0, Math.max(1, length - 1))}…` : text;
}

async function registerSearchCommand(url, env) {
  return registerCommand(url, env, searchCommandPayload());
}

async function registerVersionCommand(url, env) {
  return registerCommand(url, env, versionCommandPayload());
}

async function registerRamCommand(url, env) {
  return registerCommand(url, env, ramCommandPayload());
}

async function registerRdpCommand(url, env) {
  return registerCommand(url, env, rdpCommandPayload());
}

async function registerTopCommand(url, env) {
  return registerCommand(url, env, topCommandPayload());
}

async function registerRewardsCommand(url, env) {
  return registerRewardCommandSet(url, env);
}

async function registerHistoryCommand(url, env) {
  return registerCommand(url, env, historyCommandPayload());
}

async function registerClanCommand(url, env) {
  return registerCommand(url, env, clanCommandPayload());
}

async function registerCwCommand(url, env) {
  return registerCommand(url, env, cwCommandPayload());
}

async function registerLeagueCommand(url, env) {
  return registerCommand(url, env, leagueCommandPayload());
}

async function registerLbCommand(url, env) {
  return registerCommand(url, env, lbCommandPayload());
}

async function registerLgCommand(url, env) {
  return registerCommand(url, env, lgCommandPayload());
}

async function registerPlayerCommand(url, env) {
  return registerCommand(url, env, playerCommandPayload());
}

async function registerServerCommand(url, env) {
  return registerCommand(url, env, serverCommandPayload());
}

async function registerLunaCommand(url, env) {
  return registerCommand(url, env, lunaCommandPayload());
}

async function registerAddCommand(url, env) {
  return registerCommand(url, env, addCommandPayload());
}

async function registerRemoveCommand(url, env) {
  return registerCommand(url, env, removeCommandPayload());
}

async function registerHourlyCommand(url, env) {
  return registerCommand(url, env, hourlyCommandPayload());
}

async function registerHtgCommand(url, env) {
  return registerCommand(url, env, htgCommandPayload());
}

async function registerOfflineCommand(url, env) {
  return registerCommand(url, env, offlineCommandPayload());
}

async function registerKmsCommand(url, env) {
  return registerCommand(url, env, kmsCommandPayload());
}

async function registerTCommand(url, env) {
  const requestedGuildId = String(url.searchParams.get("guild_id") || tCommandGuildId(env)).trim();
  const requiredGuildId = tCommandGuildId(env);
  if (requestedGuildId !== requiredGuildId) {
    throw httpError(400, `/t can only be registered in guild ${requiredGuildId}.`);
  }

  const scopedUrl = new URL(url.toString());
  scopedUrl.searchParams.set("scope", "guild");
  scopedUrl.searchParams.set("guild_id", requiredGuildId);
  return registerCommand(scopedUrl, env, tCommandPayload());
}

async function registerRewardCommandSet(url, env) {
  const scopedUrl = new URL(url.toString());
  const requestedScope = String(scopedUrl.searchParams.get("scope") || "").trim().toLowerCase();
  const requestedGuildId = String(scopedUrl.searchParams.get("guild_id") || "").trim();
  // Reward commands are intended to be global. Previously, an empty query
  // silently fell back to DISCORD_GUILD_ID, leaving a stale global command (or
  // a stale guild command shadowing the global one) visible in Discord.
  if (!requestedScope && !requestedGuildId) scopedUrl.searchParams.set("scope", "global");

  const payloads = rewardCommandPayloads();
  const results = [];
  for (const payload of payloads) {
    const response = await registerCommand(scopedUrl, env, payload, {
      retryRateLimits: true,
      maxAttempts: 5
    });
    const body = await response.json().catch(() => ({}));
    const usernameOptionRegistered = rewardCommandHasUsernameOption(body?.command);
    results.push({
      name: payload.name,
      ok: response.ok && body.ok !== false && usernameOptionRegistered,
      status: response.status,
      username_option_registered: usernameOptionRegistered,
      result: body
    });
    await sleep(450);
  }

  const effectiveScope = String(scopedUrl.searchParams.get("scope") || "").trim().toLowerCase();
  const isGlobal = effectiveScope === "global" || (!effectiveScope && !requestedGuildId);
  const keepGuild = ["1", "true", "yes", "on"].includes(
    String(scopedUrl.searchParams.get("keep_guild") || "").trim().toLowerCase()
  );
  const removedGuildDuplicates = [];
  const cleanupGuildId = isGlobal && !keepGuild
    ? String(scopedUrl.searchParams.get("cleanup_guild_id") || env.DISCORD_GUILD_ID || "").trim()
    : "";

  if (results.every(result => result.ok) && cleanupGuildId) {
    const guildCommands = await fetchCommands(env, cleanupGuildId);
    for (const command of guildCommands) {
      if (!["clan", "league", "leaderboard"].includes(String(command?.name || "").trim().toLowerCase())) continue;
      await deleteCommandById(env, cleanupGuildId, command.id);
      removedGuildDuplicates.push({ id: command.id, name: command.name });
    }
  }

  const ok = results.every(result => result.ok);
  return json({
    ok,
    scope: isGlobal ? "global" : "guild",
    guild_id: isGlobal ? null : (requestedGuildId || env.DISCORD_GUILD_ID || null),
    username_option_registered: results.every(result => result.username_option_registered),
    removed_guild_duplicates: removedGuildDuplicates,
    results
  }, ok ? 200 : 502);
}

function rewardCommandHasUsernameOption(command) {
  const rewards = (command?.options || []).find(option =>
    String(option?.name || "").trim().toLowerCase() === "rewards"
    && Number(option?.type) === APPLICATION_COMMAND_OPTION_SUB_COMMAND
  );
  return Boolean((rewards?.options || []).some(option =>
    String(option?.name || "").trim().toLowerCase() === "username"
    && Number(option?.type) === APPLICATION_COMMAND_OPTION_STRING
    && option?.required !== true
  ));
}

async function registerAllCommands(url, env) {
  const requestedScope = String(url.searchParams.get("scope") || "global").trim().toLowerCase();
  const guildId = requestedScope === "guild"
    ? String(url.searchParams.get("guild_id") || env.DISCORD_GUILD_ID || "").trim()
    : "";

  if (requestedScope === "guild" && !guildId) {
    throw httpError(400, "A guild_id is required when scope=guild.");
  }

  const payloads = [
    searchCommandPayload(),
    versionCommandPayload(),
    ramCommandPayload(),
    rdpCommandPayload(),
    topCommandPayload(),
    cwCommandPayload(),
    ...rewardCommandPayloads(),
    lbCommandPayload(),
    historyCommandPayload(),
    lgCommandPayload(),
    playerCommandPayload(),
    lunaCommandPayload(),
    serverCommandPayload(),
    addCommandPayload(),
    removeCommandPayload(),
    hourlyCommandPayload(),
    htgCommandPayload(),
    offlineCommandPayload(),
    kmsCommandPayload()
  ];
  if (requestedScope === "guild" && guildId === tCommandGuildId(env)) {
    payloads.push(tCommandPayload());
  }

  const scopedUrl = new URL(url.toString());
  scopedUrl.searchParams.set("scope", requestedScope === "guild" ? "guild" : "global");
  if (guildId) scopedUrl.searchParams.set("guild_id", guildId);
  else scopedUrl.searchParams.delete("guild_id");

  const results = [];
  for (const payload of payloads) {
    const response = await registerCommand(scopedUrl, env, payload, {
      retryRateLimits: true,
      maxAttempts: 5
    });
    const body = await response.json().catch(() => ({}));
    results.push({
      name: payload.name,
      ok: response.ok && body.ok !== false,
      status: response.status,
      result: body
    });

    // Avoid immediately hitting Discord's per-route application-command limit.
    await sleep(450);
  }

  const ok = results.every(result => result.ok);
  return json({
    ok,
    scope: requestedScope === "guild" ? "guild" : "global",
    guild_id: guildId || null,
    results
  }, ok ? 200 : 502);
}

async function syncGlobalCommands(url, env) {
  const applicationId = requiredEnv(env, "DISCORD_APPLICATION_ID");
  const botToken = requiredEnv(env, "DISCORD_BOT_TOKEN");
  const guildId = String(url.searchParams.get("guild_id") || "").trim();

  const commandPayloads = [
    searchCommandPayload(),
    versionCommandPayload(),
    ramCommandPayload(),
    rdpCommandPayload(),
    topCommandPayload(),
    cwCommandPayload(),
    ...rewardCommandPayloads(),
    lbCommandPayload(),
    historyCommandPayload(),
    lgCommandPayload(),
    playerCommandPayload(),
    lunaCommandPayload(),
    serverCommandPayload(),
    addCommandPayload(),
    removeCommandPayload(),
    hourlyCommandPayload(),
    htgCommandPayload(),
    offlineCommandPayload(),
    kmsCommandPayload()
  ];

  const deletedGuildCommands = [];
  const guildCommandsToDelete = [];
  const preservedGuildCommands = [];
  const preservedGuildCommandNames = guildId === tCommandGuildId(env)
    ? new Set(["t"])
    : new Set();
  let guildEndpoint = "";

  if (guildId) {
    guildEndpoint = discordCommandsEndpoint(applicationId, guildId);
    const guildResponse = await fetch(guildEndpoint, {
      headers: {
        Authorization: `Bot ${botToken}`,
        Accept: "application/json"
      }
    });
    const guildCommands = await guildResponse.json().catch(() => []);

    if (!guildResponse.ok) {
      throw httpError(
        502,
        discordApiErrorMessage(
          guildResponse.status,
          guildCommands?.message || `Discord guild command list failed (${guildResponse.status}).`
        )
      );
    }

    for (const command of Array.isArray(guildCommands) ? guildCommands : []) {
      const commandId = String(command?.id || "").trim();
      if (!commandId) continue;
      const commandName = String(command?.name || "").trim().toLowerCase();
      if (preservedGuildCommandNames.has(commandName)) {
        preservedGuildCommands.push({
          id: commandId,
          name: command.name || null
        });
        continue;
      }

      guildCommandsToDelete.push({
        id: commandId,
        name: command.name || null
      });
    }
  }

  // Discord bulk overwrite replaces the complete global command set atomically.
  // This prevents stale or duplicate registrations from accumulating.
  const globalEndpoint = discordCommandsEndpoint(applicationId, null);
  let attempts = 0;
  let globalResponse;
  let globalPayload;
  let lastRetryAfterSeconds = null;

  while (attempts < 6) {
    attempts += 1;
    globalResponse = await fetch(globalEndpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(commandPayloads)
    });
    globalPayload = await globalResponse.json().catch(() => ({}));

    if (globalResponse.status !== 429) break;

    const retryAfterSeconds = Number(
        globalPayload?.retry_after ??
        globalResponse.headers.get("retry-after") ??
        1
    );
    lastRetryAfterSeconds = Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : 1;
    const waitMs = Math.max(
      1000,
      Math.ceil(lastRetryAfterSeconds * 1000) + 500
    );
    if (attempts >= 6 || waitMs > 25000) break;

    await sleep(waitMs);
  }

  if (!globalResponse?.ok) {
    const message = globalResponse?.status === 429 && lastRetryAfterSeconds !== null
      ? `Discord is rate limiting global command sync. Retry after about ${Math.ceil(lastRetryAfterSeconds)} seconds.`
      : discordApiErrorMessage(
        globalResponse?.status || 502,
        globalPayload?.message || `Discord global command synchronization failed (${globalResponse?.status || "unknown"}).`
      );
    const err = httpError(globalResponse?.status === 429 ? 429 : 502, message);
    err.details = {
      discord_status: globalResponse?.status || null,
      retry_after_seconds: lastRetryAfterSeconds,
      attempts,
      discord_response: globalPayload || null
    };
    throw err;
  }

  for (const command of guildCommandsToDelete) {
    const deleteResponse = await fetch(
      `${guildEndpoint}/${encodeURIComponent(command.id)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${botToken}`,
          Accept: "application/json"
        }
      }
    );

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const payload = await deleteResponse.json().catch(() => ({}));
      throw httpError(
        502,
        discordApiErrorMessage(
          deleteResponse.status,
          payload.message || `Discord guild command delete failed (${deleteResponse.status}).`
        )
      );
    }

    deletedGuildCommands.push(command);
  }

  return json({
    ok: true,
    guild_id: guildId || null,
    deleted_guild_commands: deletedGuildCommands,
    preserved_guild_commands: preservedGuildCommands,
    global_commands: Array.isArray(globalPayload)
      ? globalPayload.map(command => ({
          id: command.id,
          name: command.name,
          type: command.type
        }))
      : [],
    global_command_count: Array.isArray(globalPayload) ? globalPayload.length : 0,
    attempts
  });
}

async function registerCommand(url, env, commandPayload, options = {}) {
  const applicationId = requiredEnv(env, "DISCORD_APPLICATION_ID");
  const botToken = requiredEnv(env, "DISCORD_BOT_TOKEN");
  const requestedScope = String(url.searchParams.get("scope") || "").trim().toLowerCase();

  // Explicit scope=global must never fall back to DISCORD_GUILD_ID.
  const guildId = requestedScope === "global"
    ? ""
    : String(url.searchParams.get("guild_id") || env.DISCORD_GUILD_ID || "").trim();

  const endpoint = guildId
    ? `${DISCORD_API_BASE}/applications/${encodeURIComponent(applicationId)}/guilds/${encodeURIComponent(guildId)}/commands`
    : `${DISCORD_API_BASE}/applications/${encodeURIComponent(applicationId)}/commands`;

  const maxAttempts = Math.max(1, Math.min(8, Number(options.maxAttempts || 1)));
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(commandPayload)
    });
    const payload = await res.json().catch(() => ({}));

    if (res.status === 429 && options.retryRateLimits && attempt < maxAttempts) {
      const retryAfterSeconds = Number(
        payload.retry_after ??
        res.headers.get("retry-after") ??
        1
      );
      const waitMs = Math.max(1000, Math.ceil((Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : 1) * 1000) + 500);
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) {
      return json({
        ok: false,
        status: res.status,
        message: discordApiErrorMessage(res.status, payload.message || `Discord /${commandPayload.name} registration failed.`),
        details: payload,
        attempts: attempt
      }, 502);
    }

    return json({
      ok: true,
      scope: guildId ? "guild" : "global",
      guild_id: guildId || null,
      command: payload,
      attempts: attempt
    });
  }

  return json({
    ok: false,
    status: 429,
    message: `Discord /${commandPayload.name} registration remained rate limited after ${maxAttempts} attempts.`
  }, 502);
}

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(milliseconds) || 0)));
}

async function buildVersionResponse(env) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/ps99/versions", apiBase);
  apiUrl.searchParams.set("limit", "1");
  apiUrl.searchParams.set("fresh", "1");

  const response = await fetchClanApi(env, apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Version-Worker"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `PS99 version API failed (${response.status}).`);
  }

  const places = Array.isArray(payload.places) ? payload.places : [];
  const rootPlaceId = String(payload.root_place_id || "");
  const rootPlace = places.find(place => Boolean(place.root_place))
    || places.find(place => String(place.place_id || "") === rootPlaceId)
    || places[0]
    || null;
  const lastScannedAt = places.reduce((latest, place) => {
    const value = String(place?.latest_checked_at || "");
    const time = Date.parse(value);
    return Number.isFinite(time) && time > latest.time ? { time, value } : latest;
  }, { time: 0, value: "" }).value;
  const version = plainInteger(rootPlace?.latest_version ?? payload.newest_version);
  const releaseAt = rootPlace?.latest_published_at || payload.newest_published_at || null;
  const lastScannedIso = lastScannedAt || rootPlace?.latest_checked_at || payload.generated_at || new Date().toISOString();
  const roblox = await fetchRobloxReleasedVersionForCommand(env).catch(err => ({
    version: "-",
    upload: "-",
    uploadLabel: "-",
    scanned: "-",
    error: err?.message || String(err)
  }));

  return {
    type: INTERACTION_RESPONSE_CHANNEL_MESSAGE,
    data: versionStatusMessageData({
      placeName: rootPlace?.place_name || rootPlace?.name || "Pet Simulator 99",
      version,
      releaseAt,
      releaseLabel: formatPs99CommandDate(releaseAt),
      lastScannedAt: lastScannedIso,
      lastScannedLabel: formatPs99CommandDate(lastScannedIso),
      roblox
    })
  };
}

async function completeVersionInteraction(interaction, env) {
  try {
    const response = await buildVersionResponse(env);
    await editOriginalInteraction(interaction, response.data);
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `Version lookup failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      attachments: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

function versionStatusMessageData(status) {
  const roblox = status.roblox || {};
  const robloxLines = roblox.error
    ? [`**Roblox:** -`, `**Released:** unavailable`, `-# Roblox lookup failed: ${escapeDiscordMarkdown(truncateHistoryText(roblox.error, 180))}`]
    : [
        `**Roblox:** ${escapeDiscordMarkdown(roblox.version || "-")}`,
        `**Released:** ${versionTimeLabel(roblox.releaseAt, roblox.releaseLabel)}`
      ];

  return {
    flags: MESSAGE_FLAG_COMPONENTS_V2,
    allowed_mentions: { parse: [] },
    components: [
      {
        type: COMPONENT_TYPE_CONTAINER,
        accent_color: 0x34e1ef,
        components: [
          {
            type: COMPONENT_TYPE_SECTION,
            components: [
              {
                type: COMPONENT_TYPE_TEXT_DISPLAY,
                content: [
                  "## PS99 Version Monitor",
                  `-# updated ${versionTimeLabel(status.lastScannedAt, status.lastScannedLabel)}`
                ].join("\n")
              }
            ],
            accessory: {
              type: COMPONENT_TYPE_THUMBNAIL,
              media: { url: LUNA_REWARD_THUMBNAIL_URL },
              description: "Luna reward icon"
            }
          },
          { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
          {
            type: COMPONENT_TYPE_TEXT_DISPLAY,
            content: [
              "### Current",
              `**PS99:** ${escapeDiscordMarkdown(status.version || "-")}`,
              `**Released:** ${versionTimeLabel(status.releaseAt, status.releaseLabel)}`,
              "",
              ...robloxLines
            ].join("\n")
          },
          { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
          {
            type: COMPONENT_TYPE_TEXT_DISPLAY,
            content: lunaCreditLine()
          }
        ]
      }
    ]
  };
}

function versionTimeLabel(value, fallback = "-") {
  const time = new Date(value || 0).getTime();
  if (Number.isFinite(time) && time > 0) return discordTime(value);
  return escapeDiscordMarkdown(fallback || "-");
}

async function fetchRobloxReleasedVersionForCommand(env) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/roblox/versions", apiBase);
  apiUrl.searchParams.set("limit", "1");
  apiUrl.searchParams.set("fresh", "1");

  const response = await fetchClanApi(env, apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Version-Worker"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `Roblox version API failed (${response.status}).`);
  }

  const state = Array.isArray(payload.states) ? payload.states[0] : null;
  const events = Array.isArray(payload.events) ? payload.events : [];
  const version = state?.current_version || payload.current_version || "-";
  const matchingEvent = events.find(event => String(event?.current_version || "") === String(version || "")) || events[0] || null;
  const upload = state?.client_version_upload || payload.client_version_upload || matchingEvent?.current_client_version_upload || "-";
  const releaseAt = firstValidDateValue(
    state?.client_version_upload,
    payload.client_version_upload,
    matchingEvent?.current_client_version_upload,
    matchingEvent?.detected_at,
    payload.newest_detected_at,
    state?.last_checked_at
  );
  return {
    version,
    upload,
    releaseAt,
    releaseLabel: formatPs99CommandDate(releaseAt),
    scanned: formatPs99CommandDate(state?.last_checked_at || payload.newest_detected_at)
  };
}

function firstValidDateValue(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (!text) continue;
    const time = new Date(text).getTime();
    if (Number.isFinite(time) && time > 0) return text;
  }
  return "";
}

async function buildRewardsResponse(interaction, env, forcedType = null) {
  const type = rewardCommandType(interaction, forcedType);
  const activeMode = await fetchGlobalLeaderboardRewardMode(env).catch(() => null);
  if (type === "clans" && activeMode === "leagues") {
    return messageResponse("No Clan Battle is active. The current global ranking source is **Leagues**.", true);
  }
  if (type === "leagues" && activeMode === "clans") {
    return messageResponse("No League is active. The current global ranking source is the **Clan Battle**.", true);
  }

  const payload = await fetchRewardCutoffsPayload(type, env);

  if (!payload.ok) {
    return messageResponse(payload.message || "No reward cutoff data is available yet.", true);
  }

  const projectionType = type === "leaderboard"
    ? (activeMode === "leagues" ? "leagues" : "clans")
    : type;
  const projection = await fetchRewardProjection(interaction, projectionType, env).catch(err => ({
    requested: true,
    error: err?.message || String(err)
  }));

  return {
    type: INTERACTION_RESPONSE_CHANNEL_MESSAGE,
    data: rewardCutoffMessageData(payload, type, env, projection)
  };
}

async function fetchRewardProjection(interaction, type, env) {
  const query = String(getCommandOption(interaction, "username") || "").trim();
  if (!query) return null;

  const search = await fetchGlobalSearchPayload(query, env);
  const payload = search?.payload || {};
  const row = payload.row;
  if (!search?.ok || payload.ok === false || !row) {
    throw httpError(search?.status || 404, payload.message || `No current result found for ${query}.`);
  }

  const sourceMode = String(payload.source_mode || "clans").trim().toLowerCase();
  const expectedMode = type === "leagues" ? "leagues" : "clans";
  if (sourceMode !== expectedMode) {
    throw httpError(409, type === "leagues"
      ? `${displayName(row)} is not in a current League result.`
      : `${displayName(row)} is not in a current Clan Battle result.`);
  }

  const groupName = String(row.source_clan || row.clan_name || row.clan || "").trim();
  if (!groupName) throw httpError(404, `No current ${type === "leagues" ? "League" : "clan"} was found for ${displayName(row)}.`);

  const current = type === "leagues"
    ? await fetchLeagueCurrentPayload(groupName, env)
    : await fetchClanCurrentRewardPayload(groupName, env);
  const members = Array.isArray(current?.rows) ? current.rows : [];
  const points = finiteNumber(type === "leagues" ? current?.league_points : current?.clan_points) || 0;
  const currentRank = positiveInteger(type === "leagues" ? current?.league_rank : current?.clan_rank);
  const memberPace1h = members.reduce((sum, member) => sum + Math.max(0, finiteNumber(member?.gain_1h) || 0), 0);
  const leagueProjection = type === "leagues"
    ? await fetchLeagueRewardRankProjection(groupName, current?.league_id, points, memberPace1h, env).catch(() => null)
    : null;
  const aggregatePace1h = Math.max(0, finiteNumber(leagueProjection?.projected_gain_1h) || 0);
  // The full-roster row can legitimately omit its pace while the fresher member
  // snapshot already contains the four individual gains. Never let that zero
  // erase a usable member-derived pace and all of the cutoff ETAs with it.
  const pace1h = memberPace1h > 0 ? memberPace1h : aggregatePace1h;
  const projectedPoints1h = points + pace1h;

  return {
    requested: true,
    query,
    player_name: displayName(row),
    group_name: groupName,
    group_kind: type === "leagues" ? "League" : "Clan",
    current_rank: currentRank,
    current_points: points,
    pace_1h: pace1h,
    projected_points_1h: projectedPoints1h,
    projected_rank_1h: positiveInteger(leagueProjection?.projected_rank_1h)
  };
}

async function fetchLeagueRewardRankProjection(leagueName, leagueId, currentPoints, memberPace1h, env) {
  const wantedName = String(leagueName || "").trim().toLowerCase();
  const wantedId = String(leagueId || "").trim().toLowerCase();

  for (const target of leagueApiTargets(env)) {
    const apiUrl = new URL("/api/leagues/top-leagues", target.base);
    apiUrl.searchParams.set("limit", "10000");
    const result = await fetchLeagueCurrentAttempt(target, apiUrl);
    if (!result.response_ok || result.payload?.ok === false) continue;

    const rows = Array.isArray(result.payload?.rows) ? result.payload.rows : [];
    const matched = rows.find(row => {
      const rowName = String(row?.league_name || row?.display_name || row?.name || "").trim().toLowerCase();
      const rowId = String(row?.league_id || row?.id || "").trim().toLowerCase();
      return (wantedId && rowId === wantedId) || (wantedName && rowName === wantedName);
    });
    if (!matched) continue;

    const aggregatePace1h = Math.max(0, finiteNumber(matched.projected_gain_1h ?? matched.gain_1h) || 0);
    const selectedPace1h = memberPace1h > 0 ? memberPace1h : aggregatePace1h;
    const selectedPoints = Math.max(0, finiteNumber(currentPoints) ?? finiteNumber(matched.total_points ?? matched.points) ?? 0);
    const projectedPoints1h = selectedPoints + selectedPace1h;
    const projectedRank1h = selectedPace1h > 0
      ? 1 + rows.reduce((count, row) => {
          if (row === matched) return count;
          const rowPoints = Math.max(0, finiteNumber(row?.total_points ?? row?.points) || 0);
          const rowPace = Math.max(0, finiteNumber(row?.projected_gain_1h ?? row?.gain_1h) || 0);
          const rowProjected = finiteNumber(row?.projected_points_1h) ?? (rowPoints + rowPace);
          return count + (rowProjected > projectedPoints1h ? 1 : 0);
        }, 0)
      : positiveInteger(matched.projected_rank_1h);

    return {
      projected_gain_1h: selectedPace1h,
      projected_points_1h: projectedPoints1h,
      projected_rank_1h: projectedRank1h
    };
  }

  return null;
}

async function fetchClanCurrentRewardPayload(clanName, env) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/clans/current", apiBase);
  apiUrl.searchParams.set("clan", clanName);
  const response = await fetchClanApi(env, apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Rewards-Projection"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `Clan lookup failed (${response.status}).`);
  }
  return payload;
}

async function completeRewardsInteraction(interaction, env, forcedType = null) {
  try {
    const response = await buildRewardsResponse(interaction, env, forcedType);
    await editOriginalInteraction(interaction, response.data);
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `Rewards lookup failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      attachments: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

async function fetchRewardCutoffsPayload(type, env) {
  if (type === "leagues") return fetchLeagueRewardCutoffsPayload(env);
  if (type === "leaderboard") return fetchGlobalLeaderboardRewardCutoffsPayload(env);
  return fetchClanApiRewardCutoffsPayload(type, env);
}

async function fetchClanApiRewardCutoffsPayload(type, env) {
  const scanClan = String(env.GLOBAL_SCAN_CLAN || env.CLAN_NAME || "c0ld").trim() || "c0ld";
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/reward-cutoffs", apiBase);
  apiUrl.searchParams.set("type", type === "clans" ? "clans" : "players");

  if (type !== "clans") {
    apiUrl.searchParams.set("clan", scanClan);
  }

  const ranks = configuredRewardRanks(type, env);
  if (ranks.length) {
    apiUrl.searchParams.set("ranks", ranks.join(","));
  }

  const response = await fetchClanApi(env, apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Rewards-Worker"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `Reward cutoff API failed (${response.status}).`);
  }

  return payload;
}

async function fetchGlobalLeaderboardRewardCutoffsPayload(env) {
  const mode = await fetchGlobalLeaderboardRewardMode(env).catch(() => null);
  if (mode === "leagues") return fetchLeaguePlayerRewardCutoffsPayload(env);

  const payload = await fetchClanApiRewardCutoffsPayload("players", env);
  return {
    ...payload,
    reward_kind: "leaderboard",
    pool_source: payload.pool_source || "clans"
  };
}

async function fetchGlobalLeaderboardRewardMode(env) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/global/leaderboard", apiBase);
  apiUrl.searchParams.set("limit", "1");
  apiUrl.searchParams.set("gains", "false");
  apiUrl.searchParams.set("source", "auto");

  const response = await fetchClanApi(env, apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Rewards-Worker"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) return null;
  return payload.source_mode === "leagues" ? "leagues" : "clans";
}

async function fetchLeagueRewardCutoffsPayload(env) {
  const ranks = configuredRewardRanks("leagues", env);
  const payload = await fetchLeagueMilestoneEndpoint(env, "/api/leagues/milestones", ranks);
  return normalizeLeagueRewardPayload(payload, ranks, "leagues");
}

async function fetchLeaguePlayerRewardCutoffsPayload(env) {
  const ranks = configuredRewardRanks("leagues", env);
  const payload = await fetchLeagueMilestoneEndpoint(env, "/api/leagues/player-milestones", ranks);
  return normalizeLeagueRewardPayload(payload, ranks, "leaderboard");
}

async function fetchLeagueMilestoneEndpoint(env, path, ranks) {
  const apiBase = String(env.LEAGUE_API_BASE || "https://yamo-league-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = leagueApiUrl(env, path, apiBase);
  apiUrl.searchParams.set("ranks", ranks.join(","));

  const response = await fetchLeagueApi(env, apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Rewards-Worker"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `League reward cutoff API failed (${response.status}).`);
  }

  return payload;
}

function normalizeLeagueRewardPayload(payload, ranks, type) {
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const byRank = new Map(rows.map(row => [Number(row.rank), row]));
  const cutoffs = ranks.map(rankValue => {
    const row = byRank.get(Number(rankValue));
    const available = Boolean(row && row.available !== false);
    return {
      rank: rankValue,
      label: type === "leagues" ? leagueRewardLabel(rankValue) : rewardDefaultCutoffLabel(rankValue),
      points: available ? finiteNumber(row.points ?? row.total_points) : null,
      pace_1h: available ? finiteNumber(row.pace_1h ?? row.gain_1h) : null,
      pace_snapshot_at: row?.pace_snapshot_at || null,
      pace_elapsed_hours: finiteNumber(row?.pace_elapsed_hours),
      available,
      holder: row?.username || row?.display_name
        ? {
            user_id: finiteNumber(row.user_id),
            username: String(row.username || row.display_name || "").trim() || null,
            league_name: String(row.league_name || "").trim() || null
          }
        : null
    };
  });

  return {
    ok: true,
    type: type === "leagues" ? "leagues" : "players",
    reward_kind: type,
    pool_source: type === "leagues" ? "leagues" : "league_players",
    pool_is_partial: payload.pool_is_partial === true,
    generated_at: payload.generated_at || new Date().toISOString(),
    snapshot_at: payload.snapshot_at || null,
    league_run_key: payload.league_run_key || null,
    league_run_label: payload.league_run_label || payload.league_run_key || null,
    league_end_at: payload.league_end_at || payload.league_run_end_at || null,
    source: payload.source || null,
    direct_authoritative_limit: finiteNumber(payload.direct_authoritative_limit),
    pool_completed: payload.pool_completed === true,
    top_leagues_scanned: finiteNumber(payload.top_leagues_scanned),
    tracked_top_league_rank_max: finiteNumber(payload.tracked_top_league_rank_max),
    top_available: finiteNumber(payload.top_available),
    total_ranked: finiteNumber(payload.total_players ?? payload.top_available),
    available_rank_max: finiteNumber(payload.top_available) || rows.reduce((max, row) => Math.max(max, Number(row.rank) || 0), 0),
    ranks,
    cutoffs
  };
}

function rewardCutoffLines(payload, type) {
  const kind = payload?.reward_kind || type;
  if (kind !== "clans") {
    return (payload.cutoffs || []).map(cutoff => rewardCutoffLine(cutoff, { payload, kind }));
  }

  const byRank = new Map((payload.cutoffs || []).map(cutoff => [Number(cutoff.rank), cutoff]));
  const categories = Array.isArray(payload.reward_categories) && payload.reward_categories.length
    ? payload.reward_categories
    : CLAN_REWARD_CATEGORIES;
  return categories.map(category => rewardCutoffLine({
    ...(byRank.get(category.rank) || {}),
    rank: Number(category.rank ?? category.worst),
    label: category.label,
    rewards: category.rewards || byRank.get(category.rank)?.rewards || []
  }, { payload, kind }));
}

function rewardCutoffLine(cutoff, context = {}) {
  const label = cutoff.label || rewardDefaultCutoffLabel(cutoff.rank);
  const detail = rewardCutoffDetailText(cutoff, context);
  const detailLine = detail ? `\n-# ${detail}` : "";
  if (cutoff.points === null || cutoff.points === undefined) {
    return `- ${discordInlineCode(label)} ${rewardUnavailableText(cutoff, context)}${detailLine}`;
  }

  return `- ${discordInlineCode(label)} **${fullNumber(cutoff.points)}** pts${detailLine}`;
}

function rewardUnavailableText(cutoff, context = {}) {
  const maxRank = positiveInteger(context.payload?.available_rank_max ?? context.payload?.top_available);
  const rankValue = positiveInteger(cutoff.rank);
  if (maxRank && rankValue && rankValue > maxRank) {
    return `not recorded yet (stored top ${fullNumber(maxRank)} only)`;
  }
  return "not recorded yet";
}

function rewardCutoffDetailText(cutoff, context = {}) {
  const parts = [];
  const holder = rewardHolderText(cutoff.holder, context.kind);
  const rewards = rewardItemsSummary(cutoff.rewards);
  if (holder) parts.push(holder);
  if (rewards) parts.push(`Reward: ${rewards}`);
  return parts.join(" | ");
}

function rewardHolderText(holder, kind) {
  if (!holder || typeof holder !== "object") return "";
  if (holder.clan_name) return `Held by **${escapeDiscordMarkdown(holder.clan_name)}**`;
  const name = holder.username || holder.display_name || "";
  if (!name) return "";
  const league = holder.league_name ? ` (${escapeDiscordMarkdown(holder.league_name)})` : "";
  return `Held by **${escapeDiscordMarkdown(name)}**${league}`;
}

function rewardItemsSummary(rewards) {
  const labels = (Array.isArray(rewards) ? rewards : [])
    .map(rewardItemLabel)
    .filter(Boolean);
  return labels.length ? labels.map(escapeDiscordMarkdown).join(", ") : "";
}

function rewardItemLabel(item) {
  const value = item && typeof item === "object" ? item : {};
  const data = value._data && typeof value._data === "object"
    ? value._data
    : value.data && typeof value.data === "object"
      ? value.data
      : value.Data && typeof value.Data === "object"
        ? value.Data
        : value;
  const id = rewardFirstString(
    data.id,
    data.Id,
    data.name,
    data.Name,
    data.display_name,
    data.displayName,
    value.id,
    value.name
  );
  if (!id) return "";
  const amount = finiteNumber(data.amount ?? data.Amount ?? data._am ?? data.quantity ?? value.amount ?? value.quantity);
  const variant = rewardVariantLabel(data.pt ?? data.PetType ?? data.petType ?? value.pt, data.sh ?? data.Shiny ?? data.shiny ?? value.sh);
  const startsWithVariant = variant && id.toLowerCase().startsWith(`${variant.toLowerCase()} `);
  const name = variant && !startsWithVariant ? `${variant} ${id}` : id;
  return amount && amount > 1 ? `${fullNumber(amount)}x ${name}` : name;
}

function rewardFirstString(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function rewardVariantLabel(pt, shinyValue) {
  const petType = Number(pt);
  const shiny = [true, 1, "1", "true", "yes", "y"].includes(shinyValue);
  const base = petType === 2 ? "Rainbow" : petType === 1 ? "Golden" : "";
  if (shiny && base) return `Shiny ${base}`;
  if (shiny) return "Shiny";
  return base;
}

function rewardCutoffMessageData(payload, type, env, projection = null) {
  const theme = rewardMessageTheme(payload, type);
  const leaderboardTitle = rewardLeaderboardTitle(payload, type, env);
  const metaLine = rewardMetaLine(payload, type);
  const cutoffLines = rewardCutoffLines(payload, payload.reward_kind || type);
  const note = rewardCutoffNote(payload);
  const title = [
    `## ${theme.title}`,
    leaderboardTitle ? `**${escapeDiscordMarkdown(leaderboardTitle)}**` : "",
    metaLine ? `-# ${metaLine}` : ""
  ].filter(Boolean).join("\n");
  const header = {
    type: COMPONENT_TYPE_SECTION,
    components: [
      {
        type: COMPONENT_TYPE_TEXT_DISPLAY,
        content: title
      }
    ],
    accessory: {
      type: COMPONENT_TYPE_THUMBNAIL,
      media: { url: LUNA_REWARD_THUMBNAIL_URL },
      description: "Luna reward monitor"
    }
  };

  const bodyLines = cutoffLines.length ? cutoffLines : ["- No reward cutoffs are available yet."];
  const components = [
    header,
    { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
    {
      type: COMPONENT_TYPE_TEXT_DISPLAY,
      content: `### Cutoffs\n${bodyLines.join("\n")}`
    }
  ];

  if (projection?.requested) {
    components.push(
      { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
      {
        type: COMPONENT_TYPE_TEXT_DISPLAY,
        content: rewardProjectionText(projection, payload)
      }
    );
  }

  if (note) {
    components.push(
      { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
      {
        type: COMPONENT_TYPE_TEXT_DISPLAY,
        content: `-# ${note}`
      }
    );
  }

  components.push(
    { type: COMPONENT_TYPE_SEPARATOR, divider: true, spacing: 1 },
    {
      type: COMPONENT_TYPE_TEXT_DISPLAY,
      content: lunaCreditLine()
    }
  );

  return {
    flags: MESSAGE_FLAG_COMPONENTS_V2,
    allowed_mentions: { parse: [] },
    components: [
      {
        type: COMPONENT_TYPE_CONTAINER,
        accent_color: theme.accent,
        components
      }
    ]
  };
}

function rewardProjectionText(projection, payload) {
  if (projection.error) {
    return `### Player Projection\n-# ${escapeDiscordMarkdown(projection.error)}`;
  }

  const rankText = projection.current_rank ? rank(projection.current_rank) : "Unranked";
  const paceText = projection.pace_1h > 0 ? `+${fullNumber(projection.pace_1h)}/hr` : "no gain in the last hour";
  const projectedRankText = projection.projected_rank_1h
    ? rank(projection.projected_rank_1h)
    : "estimate unavailable";
  const cutoffLines = (payload.cutoffs || []).map(cutoff => {
    const cutoffPoints = finiteNumber(cutoff.points);
    if (cutoffPoints === null) return null;
    const label = cutoff.label || rewardDefaultCutoffLabel(cutoff.rank);
    const needed = Math.max(0, cutoffPoints - projection.current_points);
    const boundaryPace1h = cutoff.pace_1h === null || cutoff.pace_1h === undefined
      ? null
      : finiteNumber(cutoff.pace_1h);
    const hasMovingBoundary = boundaryPace1h !== null;
    const netPace1h = hasMovingBoundary ? projection.pace_1h - boundaryPace1h : null;
    const boundaryText = hasMovingBoundary
      ? `cutoff +${fullNumber(Math.max(0, boundaryPace1h))}/hr`
      : "cutoff pace unavailable";

    if (needed <= 0) {
      const margin = Math.abs(cutoffPoints - projection.current_points);
      if (!hasMovingBoundary) return `- ${discordInlineCode(label)} qualified by **${fullNumber(margin)}** pts · ${boundaryText}`;
      if (netPace1h < 0) {
        return `- ${discordInlineCode(label)} qualified by **${fullNumber(margin)}** pts · margin shrinking **${fullNumber(Math.abs(netPace1h))}/hr** · at risk ${formatRewardProjectionDuration(margin / Math.abs(netPace1h))}`;
      }
      const holdingText = netPace1h > 0 ? `holding +${fullNumber(netPace1h)}/hr` : "holding pace";
      return `- ${discordInlineCode(label)} qualified by **${fullNumber(margin)}** pts · ${holdingText}`;
    }

    if (!hasMovingBoundary) return `- ${discordInlineCode(label)} needs **${fullNumber(needed)}** pts · ${boundaryText}`;
    if (netPace1h <= 0) {
      const trend = netPace1h < 0
        ? `falling behind **${fullNumber(Math.abs(netPace1h))}/hr**`
        : "not closing";
      return `- ${discordInlineCode(label)} needs **${fullNumber(needed)}** pts · ${boundaryText} · ${trend}`;
    }
    return `- ${discordInlineCode(label)} needs **${fullNumber(needed)}** pts · ${boundaryText} · net +${fullNumber(netPace1h)}/hr · ${formatRewardProjectionDuration(needed / netPace1h)}`;
  }).filter(Boolean);

  return [
    `### Projection for ${escapeDiscordMarkdown(projection.player_name)}`,
    `**${escapeDiscordMarkdown(projection.group_kind)}:** ${escapeDiscordMarkdown(projection.group_name)} · **${rankText}** · **${fullNumber(projection.current_points)}** pts`,
    `**${projection.group_kind} pace:** ${paceText} · **Projected +1h:** ${projectedRankText}`,
    ...cutoffLines
  ].join("\n");
}

function formatRewardProjectionDuration(hours) {
  if (!Number.isFinite(hours) || hours < 0) return "no ETA at the current pace";
  if (hours < 1) return `about **${Math.max(1, Math.ceil(hours * 60))}m**`;
  if (hours < 48) return `about **${hours < 10 ? hours.toFixed(1) : Math.ceil(hours)}h**`;
  return `about **${Math.ceil(hours / 24)}d**`;
}

function rewardMessageTheme(payload, type) {
  const kind = payload?.reward_kind || type;
  if (kind === "clans") return { title: "Clan Reward Cutoffs", accent: 0xffd44d };
  if (kind === "leagues") return { title: "League Reward Cutoffs", accent: 0x34e1ef };
  if (payload?.pool_source === "league_players") return { title: "Global Leaderboard Rewards", accent: 0xff5db8 };
  return { title: "Global Leaderboard Rewards", accent: 0x58a6ff };
}

function rewardMetaLine(payload, type) {
  const parts = [];
  if (payload.snapshot_at) parts.push(`updated ${discordTime(payload.snapshot_at)}`);
  else if (payload.generated_at) parts.push(`generated ${discordTime(payload.generated_at)}`);

  const kind = payload?.reward_kind || type;
  const poolSource = rewardPoolSourceLabel(payload, type);
  if (poolSource) parts.push(poolSource);
  const availableRankMax = positiveInteger(payload.available_rank_max ?? payload.top_available);
  if (kind === "clans" && availableRankMax) parts.push(`top ${fullNumber(availableRankMax)} stored`);

  const endsAtMs = new Date(payload.league_end_at || 0).getTime();
  if (Number.isFinite(endsAtMs) && endsAtMs > 0) parts.push(`ends <t:${Math.floor(endsAtMs / 1000)}:R>`);
  return parts.join(" | ");
}

function rewardPoolSourceLabel(payload, type) {
  const kind = payload?.reward_kind || type;
  if (kind === "clans") return "Clan leaderboard";
  if (kind === "leagues") return "League leaderboard";
  if (payload?.pool_source === "league_players") return "League player leaderboard";
  return "Global leaderboard";
}

function rewardCutoffNote(payload) {
  const unavailable = (payload.cutoffs || []).some(cutoff => cutoff.points === null || cutoff.points === undefined);
  if (payload.pool_is_partial) {
    const directLimit = positiveInteger(payload.direct_authoritative_limit);
    const trackedLeagueRank = positiveInteger(payload.tracked_top_league_rank_max);
    if (directLimit) {
      const trackedText = trackedLeagueRank
        ? `The Top ${fullNumber(trackedLeagueRank)} League standings are tracked separately`
        : "League standings are tracked separately";
      return "Global ranks are estimations by pulling the top 10k leagues/clans. Not 100% accurate, but close.";
    }
    return "The League player leaderboard source is partial; deeper reward ranks may not be available yet.";
  }
  if ((payload.reward_kind || payload.type) === "clans" && unavailable) {
    const maxRank = positiveInteger(payload.available_rank_max ?? payload.top_available);
    return maxRank
      ? `Point cutoffs deeper than #${fullNumber(maxRank)} are not in the stored clan snapshot yet.`
      : "Some clan point cutoffs are not in the stored snapshot yet.";
  }
  return "";
}

function rewardDefaultCutoffLabel(rankValue) {
  const rankNumber = Number(rankValue);
  return Number.isFinite(rankNumber) && rankNumber > 0
    ? `Top ${fullNumber(rankNumber)}`
    : "Reward tier";
}

function leagueRewardLabel(rankValue) {
  const rankNumber = Number(rankValue);
  if (rankNumber === 1) return "#1";
  return rewardDefaultCutoffLabel(rankNumber);
}

function discordInlineCode(value) {
  return `\`${String(value || "").replace(/`/g, "'")}\``;
}

function lunaCreditLine() {
  return "-# :woman_genie: Luna, A Pet Sim 99 Bot :rainbow_flag: ∙ by [Cinnamowopal](https://x.com/oapl_the_opal)";
}

function rewardLeaderboardTitle(payload, type, env) {
  const kind = payload?.reward_kind || type;
  if (kind === "leagues") {
    return payload.league_run_label || payload.league_run_key || "Current League";
  }

  if (kind === "leaderboard" || kind === "players") {
    if (payload.pool_source === "league_players") {
      return payload.league_run_label || payload.league_run_key || "League Player Leaderboard";
    }

    const activeEventLabel = String(
      payload.event_name ||
      payload.display_name ||
      payload.battle ||
      ""
    ).trim();
    if (activeEventLabel) return activeEventLabel;

    const customLabel = String(env.PLAYER_REWARD_LEADERBOARD_LABEL || "").trim();
    if (customLabel) return customLabel;

    const updateLabel = String(env.PS99_UPDATE_LABEL || "").trim();
    if (updateLabel) {
      return /leaderboard/i.test(updateLabel) ? updateLabel : `${updateLabel} Leaderboard`;
    }

    const updateNumber = String(env.PS99_UPDATE_NUMBER || "").trim();
    if (updateNumber) return `Update ${updateNumber} Leaderboard`;

    return "Player Leaderboard";
  }

  return payload.event_name || payload.display_name || payload.battle || "Clan Leaderboard";
}

function rewardCommandType(interaction, forcedType = null) {
  if (forcedType) return forcedType;
  const commandName = String(interaction?.data?.name || "").toLowerCase();
  if (commandName === "lb") return "leaderboard";
  if (commandName === "leaderboard") return "leaderboard";
  if (commandName === "clan") return "clans";
  if (commandName === "league") return "leagues";

  const option = (interaction.data?.options || [])[0] || null;
  const name = String(option?.name || "").toLowerCase();
  return name === "clans" ? "clans" : "leaderboard";
}

function configuredRewardRanks(type, env) {
  const raw = String(
    type === "clans"
      ? env.CLAN_REWARD_CUTOFF_RANKS || ""
      : type === "leagues"
        ? env.LEAGUE_REWARD_CUTOFF_RANKS || ""
        : env.PLAYER_REWARD_CUTOFF_RANKS || ""
  );
  const maxRank = type === "clans" ? 10000 : 100000;
  const parsed = raw
    .split(/[,\s]+/)
    .map(value => Math.round(Number(value)))
    .filter(value => Number.isFinite(value) && value >= 1 && value <= maxRank);

  const normalizedRaw = [...new Set(parsed)].sort((a, b) => a - b).join(",");
  if (type === "clans") {
    if (!raw.trim() || normalizedRaw === LEGACY_CLAN_REWARD_CUTOFF_RANKS) {
      return DEFAULT_CLAN_REWARD_CUTOFF_RANKS;
    }
  } else if (type === "leagues") {
    if (!raw.trim()) return DEFAULT_LEAGUE_REWARD_CUTOFF_RANKS;
  } else if (!raw.trim() || normalizedRaw === LEGACY_PLAYER_REWARD_CUTOFF_RANKS) {
    return DEFAULT_PLAYER_REWARD_CUTOFF_RANKS;
  }

  return [...new Set(parsed)]
    .sort((a, b) => a - b)
    .slice(0, 20);
}

async function listCommands(url, env) {
  const scope = String(url.searchParams.get("scope") || "both").toLowerCase();
  const results = [];

  if (scope === "both" || scope === "guild") {
    const guildId = String(url.searchParams.get("guild_id") || env.DISCORD_GUILD_ID || "").trim();
    if (guildId) {
      results.push({
        scope: "guild",
        guild_id: guildId,
        commands: await fetchCommands(env, guildId)
      });
    }
  }

  if (scope === "both" || scope === "global") {
    results.push({
      scope: "global",
      guild_id: null,
      commands: await fetchCommands(env, null)
    });
  }

  return json({ ok: true, results });
}

async function deleteCommand(url, env) {
  const id = String(url.searchParams.get("id") || "").trim();
  const name = String(url.searchParams.get("name") || "").trim().toLowerCase();
  const scope = String(url.searchParams.get("scope") || "both").toLowerCase();
  const targets = [];

  if (!id && !name) {
    throw httpError(400, "Provide ?id=COMMAND_ID or ?name=COMMAND_NAME.");
  }

  if (scope === "both" || scope === "guild") {
    const guildId = String(url.searchParams.get("guild_id") || env.DISCORD_GUILD_ID || "").trim();
    if (guildId) targets.push({ scope: "guild", guildId });
  }

  if (scope === "both" || scope === "global") {
    targets.push({ scope: "global", guildId: null });
  }

  const deleted = [];
  for (const target of targets) {
    const commands = id
      ? [{ id, name: name || null }]
      : (await fetchCommands(env, target.guildId)).filter(command => String(command.name || "").toLowerCase() === name);

    for (const command of commands) {
      await deleteCommandById(env, target.guildId, command.id);
      deleted.push({
        scope: target.scope,
        guild_id: target.guildId,
        id: command.id,
        name: command.name
      });
    }
  }

  return json({ ok: true, deleted });
}

async function discordDebug(url, env) {
  const configuredApplicationId = requiredEnv(env, "DISCORD_APPLICATION_ID");
  const guildId = String(url.searchParams.get("guild_id") || env.DISCORD_GUILD_ID || "").trim();
  const [botUser, botApplication, guildCheck] = await Promise.all([
    fetchDiscordDebugEndpoint(env, "/users/@me"),
    fetchDiscordDebugEndpoint(env, "/oauth2/applications/@me"),
    guildId ? fetchDiscordDebugEndpoint(env, `/guilds/${encodeURIComponent(guildId)}`) : Promise.resolve(null)
  ]);

  const tokenApplicationId = String(botApplication?.payload?.id || "");
  return json({
    ok: true,
    configured_application_id: configuredApplicationId,
    token_application_id: tokenApplicationId || null,
    application_id_matches_token: Boolean(tokenApplicationId) && tokenApplicationId === configuredApplicationId,
    guild_id: guildId || null,
    guild_access_ok: guildCheck ? guildCheck.ok : null,
    bot_user: botUser.ok ? {
      id: botUser.payload.id,
      username: botUser.payload.username,
      global_name: botUser.payload.global_name || null
    } : null,
    application: botApplication.ok ? {
      id: botApplication.payload.id,
      name: botApplication.payload.name,
      bot_public: botApplication.payload.bot_public ?? null,
      bot_require_code_grant: botApplication.payload.bot_require_code_grant ?? null
    } : null,
    checks: {
      bot_token: summarizeDiscordDebugResult(botUser),
      application: summarizeDiscordDebugResult(botApplication),
      guild: guildCheck ? summarizeDiscordDebugResult(guildCheck) : null
    }
  });
}

async function searchDebug(url, env) {
  const query = String(url.searchParams.get("q") || url.searchParams.get("username") || "").trim();
  if (!query) {
    throw httpError(400, "Missing ?q=username.");
  }

  const result = await fetchGlobalSearchPayload(query, env);
  return json({
    ok: result.ok && result.payload.ok !== false && Boolean(result.payload.row),
    configured: result.configured,
    api_status: result.status,
    api_ok: result.apiOk,
    payload_ok: result.payload.ok ?? null,
    payload_message: result.payload.message || null,
    fallback_used: result.fallbackUsed,
    fallback_status: result.fallbackStatus,
    row_found: Boolean(result.payload.row),
    row: result.payload.row || null
  });
}

async function lgDebug(url, env) {
  const leagueName = String(url.searchParams.get("league") || url.searchParams.get("name") || url.searchParams.get("q") || "").trim();
  if (!leagueName) {
    throw httpError(400, "Missing ?league=name.");
  }

  const result = await fetchLeagueCurrentPayload(leagueName, env, { debug: true });
  return json({
    ok: Boolean(result.payload),
    configured: {
      league_api_base: String(env.LEAGUE_API_BASE || "").trim() || "https://yamo-league-api-worker.opal-dde.workers.dev",
      service_binding_enabled: hasLeagueApiServiceBinding(env),
      target_count: leagueApiTargets(env).length
    },
    requested_league: leagueName,
    error: result.error?.message || null,
    attempts: result.attempts.map(attempt => leagueAttemptSummary(attempt)),
    league: result.payload ? {
      league_name: result.payload.league_name || null,
      league_points: result.payload.league_points ?? null,
      league_rank: result.payload.league_rank ?? null,
      league_icon: result.payload.league_icon || null,
      row_count: Array.isArray(result.payload.rows) ? result.payload.rows.length : 0,
      top_contributions: (result.payload.rows || []).slice(0, 4).map(row => ({
        rank: row.rank ?? null,
        username: row.username || row.display_name || null,
        user_id: row.user_id ?? null,
        points: row.total_points ?? row.points ?? null,
        gain_1h: row.gain_1h ?? null
      }))
    } : null
  });
}

async function fetchGlobalSearchPayload(query, env) {
  const scanClan = String(env.GLOBAL_SCAN_CLAN || env.CLAN_NAME || "c0ld").trim() || "c0ld";
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/global/search", apiBase);
  apiUrl.searchParams.set("clan", scanClan);
  apiUrl.searchParams.set("q", query);
  apiUrl.searchParams.set("scope", "pool");
  apiUrl.searchParams.set("source", "auto");
  apiUrl.searchParams.set("avatars", "1");
  apiUrl.searchParams.set("history_hours", String(searchChartHistoryHours(env)));
  apiUrl.searchParams.set("history_limit", String(searchChartHistoryLimit(env)));

  const res = await fetchClanApi(env, apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Search-Worker-Debug"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await res.json().catch(() => ({}));

  if (res.ok && payload.ok !== false && payload.row) {
    return {
      ok: true,
      apiOk: true,
      status: res.status,
      payload,
      fallbackUsed: false,
      fallbackStatus: null,
      configured: {
        scan_clan: scanClan,
        clan_api_base: apiBase,
        service_binding_enabled: hasClanApiServiceBinding(env),
        api_url: apiUrl.toString()
      }
    };
  }

  const fallback = await fetchGlobalCurrentFallback(env, apiBase, scanClan, query);
  if (fallback.payload.row) {
    return {
      ok: true,
      apiOk: res.ok,
      status: res.status,
      payload: fallback.payload,
      fallbackUsed: true,
      fallbackStatus: fallback.status,
      configured: {
        scan_clan: scanClan,
        clan_api_base: apiBase,
        service_binding_enabled: hasClanApiServiceBinding(env),
        api_url: apiUrl.toString()
      }
    };
  }

  return {
    ok: false,
    apiOk: res.ok,
    status: res.status,
    payload: payload.ok === false || payload.message ? payload : fallback.payload,
    fallbackUsed: fallback.used,
    fallbackStatus: fallback.status,
    configured: {
      scan_clan: scanClan,
      clan_api_base: apiBase,
      service_binding_enabled: hasClanApiServiceBinding(env),
      api_url: apiUrl.toString()
    }
  };
}

async function fetchGlobalCurrentFallback(env, apiBase, scanClan, query) {
  const currentUrl = clanApiUrl(env, "/api/global/leaderboard", apiBase);
  currentUrl.searchParams.set("limit", "1000");
  currentUrl.searchParams.set("avatars", "1");
  currentUrl.searchParams.set("source", "auto");
  currentUrl.searchParams.set("gains", "false");

  const res = await fetchClanApi(env, currentUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Search-Worker-Fallback"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await res.json().catch(() => ({}));

  if (!res.ok || !Array.isArray(payload.rows)) {
    return {
      used: true,
      status: res.status,
      payload: {
        ok: false,
        message: `Global search endpoint failed and automatic leaderboard fallback failed (${res.status}).`
      }
    };
  }

  const searchKey = normalizeSearchKey(query);
  const row = payload.rows.find(item => {
    const userId = String(item.user_id || "").trim();
    return (
      userId === String(query).trim() ||
      normalizeSearchKey(item.username) === searchKey ||
      normalizeSearchKey(item.display_name) === searchKey
    );
  }) || null;

  return {
    used: true,
    status: res.status,
    payload: row ? {
      ok: true,
      query,
      clan_name: scanClan,
      source_mode: payload.source_mode || null,
      source_label: payload.source_label || null,
      row,
      history: []
    } : {
      ok: false,
      query,
      clan_name: scanClan,
      message: `No current automatic leaderboard row matched "${query}".`
    }
  };
}

function normalizeSearchKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function clanApiUrl(env, path, fallbackBase) {
  const base = hasClanApiServiceBinding(env)
    ? "https://c0ld-clan-api-worker.service"
    : fallbackBase;
  return new URL(path, base);
}

function hasClanApiServiceBinding(env) {
  return Boolean(env?.CLAN_API_WORKER && typeof env.CLAN_API_WORKER.fetch === "function");
}

async function fetchClanApi(env, url, init) {
  const request = new Request(url.toString(), init);
  if (hasClanApiServiceBinding(env)) {
    return env.CLAN_API_WORKER.fetch(request);
  }
  return fetch(request);
}

function leagueApiUrl(env, path, fallbackBase) {
  const base = hasLeagueApiServiceBinding(env)
    ? "https://yamo-league-api-worker.service"
    : fallbackBase;
  return new URL(path, base);
}

function hasLeagueApiServiceBinding(env) {
  return Boolean(env?.LEAGUE_API_WORKER && typeof env.LEAGUE_API_WORKER.fetch === "function");
}

async function fetchLeagueApi(env, url, init) {
  const request = new Request(url.toString(), init);
  if (hasLeagueApiServiceBinding(env)) {
    return env.LEAGUE_API_WORKER.fetch(request);
  }
  return fetch(request);
}

async function serverTrackerApiRequest(env, path, options = {}) {
  const token = String(env.SERVER_TRACKER_API_TOKEN || env.SERVERS_API_TOKEN || "").trim();
  if (!token) throw httpError(500, "Missing SERVER_TRACKER_API_TOKEN on the Discord interactions Worker.");

  const base = hasServersApiServiceBinding(env)
    ? "https://c0ld-servers-worker.service"
    : String(env.SERVERS_API_BASE || "https://c0ld-servers.opal-dde.workers.dev").replace(/\/$/, "");
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value !== undefined && value !== null && String(value).trim()) {
      url.searchParams.set(key, String(value));
    }
  }

  const init = {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Private-Server-Tracker"
    }
  };
  if (options.body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const request = new Request(url.toString(), init);
  const response = hasServersApiServiceBinding(env)
    ? await env.SERVERS_API_WORKER.fetch(request)
    : await fetch(request);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `Private-server API failed (${response.status}).`);
  }
  return payload;
}

function hasServersApiServiceBinding(env) {
  return Boolean(env?.SERVERS_API_WORKER && typeof env.SERVERS_API_WORKER.fetch === "function");
}

async function htgApiStatus(env) {
  const token = String(env.INVENTORY_API_TOKEN || env.HATCH_TRACKER_API_TOKEN || "").trim();
  const configuredBase = String(env.INVENTORY_API_BASE || "").trim().replace(/\/$/, "");
  const explicitServiceBinding = String(env.INVENTORY_API_USE_SERVICE_BINDING || "").trim().toLowerCase();
  const hasServiceBinding = hasInventoryApiServiceBinding(env);
  const useServiceBinding = hasServiceBinding;
  const base = useServiceBinding
    ? "https://inventory-detector-worker.service"
    : configuredBase || "https://inventory-detector-worker.opal-dde.workers.dev";
  const result = {
    ok: false,
    build_id: HTG_BUILD_ID,
    configured: {
      inventory_api_base: configuredBase || null,
      inventory_api_token_configured: Boolean(token),
      inventory_api_worker_binding_present: hasServiceBinding,
      inventory_api_use_service_binding_value: explicitServiceBinding || null,
      inventory_api_use_service_binding: useServiceBinding,
      requested_url: useServiceBinding
        ? "https://inventory-detector-worker.service"
        : base
    }
  };

  if (!token) {
    return {
      ...result,
      message: "Missing INVENTORY_API_TOKEN on the Discord interactions Worker."
    };
  }

  try {
    const health = await htgApiProbe(env, useServiceBinding, base, "/api/inventory/health", {
      method: "GET"
    });
    const trackerStatus = await htgApiProbe(env, useServiceBinding, base, "/api/hatch/tracker/status", {
      method: "GET",
      query: { discord_user_id: "123456789012345678" },
      token
    });
    const oauthStart = await htgApiProbe(env, useServiceBinding, base, "/api/hatch/oauth/start", {
      method: "POST",
      token,
      body: {
        discord_user_id: "123456789012345678",
        discord_username: "debug"
      }
    });
    return {
      ...result,
      ok: health.ok && trackerStatus.ok && oauthStart.ok,
      probes: {
        health,
        tracker_status: trackerStatus,
        oauth_start: oauthStart
      }
    };
  } catch (err) {
    return {
      ...result,
      message: err?.message || String(err)
    };
  }
}

async function htgApiProbe(env, useServiceBinding, base, path, options = {}) {
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value !== undefined && value !== null && String(value).trim()) {
      url.searchParams.set(key, String(value));
    }
  }

  const headers = {
    Accept: "application/json",
    "User-Agent": "c0ld-Discord-HTG-Debug"
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const request = new Request(url.toString(), {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const response = await withHatchApiTimeout(
    useServiceBinding
      ? env.INVENTORY_API_WORKER.fetch(request)
      : fetch(request),
    env,
    url
  );
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (err) {
    payload = { parse_error: err?.message || String(err), body_preview: text.slice(0, 500) };
  }

  return {
    ok: response.ok && payload?.ok !== false,
    status: response.status,
    response_ok: response.ok,
    path,
    payload
  };
}

async function hatchApiRequest(env, path, options = {}) {
  const token = String(env.INVENTORY_API_TOKEN || env.HATCH_TRACKER_API_TOKEN || "").trim();
  if (!token) throw httpError(500, "Missing INVENTORY_API_TOKEN on the Discord interactions Worker.");

  const configuredBase = String(env.INVENTORY_API_BASE || "").trim().replace(/\/$/, "");
  const useServiceBinding = hasInventoryApiServiceBinding(env);
  const base = useServiceBinding
    ? "https://inventory-detector-worker.service"
    : configuredBase || "https://inventory-detector-worker.opal-dde.workers.dev";
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value !== undefined && value !== null && String(value).trim()) {
      url.searchParams.set(key, String(value));
    }
  }

  const init = {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-HTG-Tracker"
    }
  };
  if (options.body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const request = new Request(url.toString(), init);
  const response = await withHatchApiTimeout(
    useServiceBinding
      ? env.INVENTORY_API_WORKER.fetch(request)
      : fetch(request),
    env,
    url
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const source = useServiceBinding
      ? "INVENTORY_API_WORKER service binding"
      : url.origin;
    throw httpError(
      response.status || 502,
      `${payload.message || `HTG tracker API failed (${response.status}).`} Source: ${source}${url.pathname}`
    );
  }
  return payload;
}

function withHatchApiTimeout(promise, env, url) {
  const timeoutMs = Math.max(2000, Math.min(25000, Number(env.HTG_API_TIMEOUT_MS || env.INVENTORY_API_TIMEOUT_MS || 8000) || 8000));
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(httpError(
      504,
      `HTG tracker API timed out after ${Math.round(timeoutMs / 1000)}s while calling ${url.pathname}. Check inventory-detector-worker logs and HATCH_BIG_GAMES_* variables.`
    )), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function hasInventoryApiServiceBinding(env) {
  return Boolean(env?.INVENTORY_API_WORKER && typeof env.INVENTORY_API_WORKER.fetch === "function");
}

async function fetchDiscordDebugEndpoint(env, path) {
  const res = await fetch(`${DISCORD_API_BASE}${path}`, {
    headers: discordBotHeaders(env)
  });
  const payload = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    payload
  };
}

function summarizeDiscordDebugResult(result) {
  if (!result) return null;
  if (result.ok) return { ok: true, status: result.status };
  return {
    ok: false,
    status: result.status,
    code: result.payload?.code ?? null,
    message: result.payload?.message || "Discord API request failed."
  };
}

async function fetchCommands(env, guildId) {
  const applicationId = requiredEnv(env, "DISCORD_APPLICATION_ID");
  const endpoint = discordCommandsEndpoint(applicationId, guildId);
  const res = await fetch(endpoint, {
    headers: discordBotHeaders(env)
  });
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw httpError(502, discordApiErrorMessage(res.status, payload.message || `Discord command list failed (${res.status}).`));
  }

  return payload;
}

async function deleteCommandById(env, guildId, commandId) {
  const applicationId = requiredEnv(env, "DISCORD_APPLICATION_ID");
  const endpoint = `${discordCommandsEndpoint(applicationId, guildId)}/${encodeURIComponent(commandId)}`;
  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: discordBotHeaders(env)
  });

  if (!res.ok && res.status !== 404) {
    const payload = await res.json().catch(() => ({}));
    throw httpError(502, discordApiErrorMessage(res.status, payload.message || `Discord command delete failed (${res.status}).`));
  }
}

function discordApiErrorMessage(status, message) {
  if (status === 401) {
    return "Discord API rejected DISCORD_BOT_TOKEN. Set the raw Bot token from Discord Developer Portal > Bot on this Worker; do not include the word Bot.";
  }

  if (status === 403) {
    return "Discord API rejected access. Confirm DISCORD_APPLICATION_ID belongs to the same app as DISCORD_BOT_TOKEN and the bot is installed in the guild.";
  }

  return message;
}

function discordFormErrorMessage(payload) {
  const message = String(payload?.message || "").trim();
  const detailLines = [];
  collectDiscordFormErrors(payload?.errors, [], detailLines);
  if (!detailLines.length) return message;
  return `${message || "Discord request failed"}: ${detailLines.slice(0, 6).join("; ")}`.slice(0, 1200);
}

function collectDiscordFormErrors(value, path, out) {
  if (!value || typeof value !== "object" || out.length >= 12) return;
  const errors = Array.isArray(value._errors) ? value._errors : [];
  for (const error of errors) {
    const code = String(error?.code || "").trim();
    const message = String(error?.message || "").trim();
    if (message) out.push(`${path.join(".") || "body"}${code ? ` ${code}` : ""}: ${message}`);
    if (out.length >= 12) return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === "_errors") continue;
    collectDiscordFormErrors(child, [...path, key], out);
    if (out.length >= 12) return;
  }
}

function discordCommandsEndpoint(applicationId, guildId) {
  return guildId
    ? `${DISCORD_API_BASE}/applications/${encodeURIComponent(applicationId)}/guilds/${encodeURIComponent(guildId)}/commands`
    : `${DISCORD_API_BASE}/applications/${encodeURIComponent(applicationId)}/commands`;
}

function discordBotHeaders(env, extra = {}) {
  return {
    Authorization: `Bot ${requiredEnv(env, "DISCORD_BOT_TOKEN")}`,
    Accept: "application/json",
    ...extra
  };
}

function searchCommandPayload() {
  return {
    name: "search",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Search stored global rank data by Roblox username.",
    dm_permission: false,
    options: [
      {
        name: "username",
        description: "Roblox username or user ID",
        type: APPLICATION_COMMAND_OPTION_STRING,
        required: true
      }
    ]
  };
}

function versionCommandPayload() {
  return {
    name: "version",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Show the newest PS99 version and last scan time.",
    dm_permission: false
  };
}

function ramCommandPayload() {
  return {
    name: "ram",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Post the Roblox Account Manager download link.",
    dm_permission: false
  };
}

function rdpCommandPayload() {
  return {
    name: "rdp",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Post the RDP setup video link.",
    dm_permission: false
  };
}

function topCommandPayload() {
  return {
    name: "top",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Show top PS99 leaderboards.",
    dm_permission: false,
    options: [
      {
        name: "leagues",
        description: "Show the top 100 Leagues.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND
      },
      {
        name: "clans",
        description: "Show the top 100 clans.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND
      },
      {
        name: "players",
        description: "Show the top 100 players.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND
      }
    ]
  };
}

function rewardCommandPayloads() {
  return [
    clanCommandPayload(),
    leagueCommandPayload(),
    leaderboardCommandPayload()
  ];
}

function leaderboardCommandPayload() {
  return {
    name: "leaderboard",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Global player leaderboard tools.",
    dm_permission: false,
    options: [
      {
        name: "rewards",
        description: "Show global player leaderboard reward cutoff points.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "username",
            description: "Optional Roblox username for rank, pace, and cutoff projections",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: false,
            min_length: 1,
            max_length: 64
          }
        ]
      }
    ]
  };
}

function historyCommandPayload() {
  return {
    name: "history",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Show a Roblox player's recorded battle history.",
    dm_permission: false,
    options: [
      {
        name: "username",
        description: "Roblox username or user ID",
        type: APPLICATION_COMMAND_OPTION_STRING,
        required: true
      }
    ]
  };
}

function clanCommandPayload() {
  return {
    name: "clan",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Clan leaderboard tools.",
    dm_permission: false,
    options: [
      {
        name: "info",
        description: "Look up current clan points, rank, members, and gains.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "name",
            description: "Clan name, for example COLD or c0ld",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 32
          }
        ]
      },
      {
        name: "rewards",
        description: "Show clan reward cutoff points from the clan leaderboard.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "username",
            description: "Optional Roblox username for clan rank, pace, and cutoff projections",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: false,
            min_length: 1,
            max_length: 64
          }
        ]
      },
      {
        name: "log",
        description: "View clan activity or assign its log channel.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "clan",
            description: "Clan name, for example COLD or c0ld",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 32
          },
          {
            name: "assign",
            description: "Optional text channel or thread for future activity posts",
            type: APPLICATION_COMMAND_OPTION_CHANNEL,
            required: false,
            channel_types: [...HOURLY_CLAN_ALLOWED_CHANNEL_TYPES]
          }
        ]
      },
      {
        name: "tracker",
        description: "Preview or assign one persistent, live clan tracker post.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "clan",
            description: "Clan name, for example COLD or c0ld",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 32
          },
          {
            name: "assign",
            description: "Optional text channel or thread for the persistent tracker",
            type: APPLICATION_COMMAND_OPTION_CHANNEL,
            required: false,
            channel_types: [...HOURLY_CLAN_ALLOWED_CHANNEL_TYPES]
          }
        ]
      }
    ]
  };
}

function cwCommandPayload() {
  return {
    name: "cw",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Quick clan lookup.",
    dm_permission: false,
    options: [
      {
        name: "clan",
        description: "Clan name, for example COLD or c0ld",
        type: APPLICATION_COMMAND_OPTION_STRING,
        required: true,
        min_length: 1,
        max_length: 32
      }
    ]
  };
}

function leagueCommandPayload() {
  return {
    name: "league",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "League tools.",
    dm_permission: false,
    options: [
      {
        name: "info",
        description: "Show current league points, rank, and top contributions.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "league",
            description: "League name, for example dezzz",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 64
          }
        ]
      },
      {
        name: "rewards",
        description: "Show league reward cutoff points from the league leaderboard.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "username",
            description: "Optional Roblox username for League rank, pace, and cutoff projections",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: false,
            min_length: 1,
            max_length: 64
          }
        ]
      }
    ]
  };
}

function lbCommandPayload() {
  return {
    name: "lb",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Quick player lookup.",
    dm_permission: false,
    options: [
      {
        name: "player",
        description: "Roblox username or user ID",
        type: APPLICATION_COMMAND_OPTION_STRING,
        required: true,
        min_length: 1,
        max_length: 64
      }
    ]
  };
}

function lgCommandPayload() {
  return {
    name: "lg",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Quick league lookup.",
    dm_permission: false,
    options: [
      {
        name: "league",
        description: "League name, for example dezzz",
        type: APPLICATION_COMMAND_OPTION_STRING,
        required: true,
        min_length: 1,
        max_length: 64
      }
    ]
  };
}

function playerCommandPayload() {
  return {
    name: "player",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Player lookup tools.",
    dm_permission: false,
    options: [
      {
        name: "info",
        description: "Search stored global rank data by Roblox username.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "player",
            description: "Roblox username or user ID",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 64
          }
        ]
      }
    ]
  };
}

function lunaCommandPayload() {
  return {
    name: "luna",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Configure Luna for this Discord server.",
    dm_permission: false,
    options: [
      {
        name: "admin",
        description: "Set the role allowed to use Luna administrator commands.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "role",
            description: "Role allowed to use Luna administrator commands",
            type: APPLICATION_COMMAND_OPTION_ROLE,
            required: true
          }
        ]
      }
    ]
  };
}

function serverCommandPayload() {
  return {
    name: "server",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Private-server tracker tools.",
    dm_permission: false,
    options: [
      {
        name: "assign",
        description: "Assign the persistent private-server tracker post channel.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "channel",
            description: "Text channel where the tracker should post",
            type: APPLICATION_COMMAND_OPTION_CHANNEL,
            required: true
          }
        ]
      },
      {
        name: "tracker",
        description: "Refresh the persistent private-server tracker post.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "channel",
            description: "Legacy move target; prefer /server assign",
            type: APPLICATION_COMMAND_OPTION_CHANNEL,
            required: false
          }
        ]
      }
    ]
  };
}

function addCommandPayload() {
  return {
    name: "add",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Add tracked resources.",
    dm_permission: false,
    options: [
      {
        name: "server",
        description: "Add a Roblox private server.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "link",
            description: "Roblox private-server share link",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true
          },
          {
            name: "place_id",
            description: `Roblox place ID; defaults to ${DEFAULT_TRACKER_PLACE_ID}`,
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: false
          }
        ]
      }
    ]
  };
}

function removeCommandPayload() {
  return {
    name: "remove",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Remove tracked resources.",
    dm_permission: false,
    options: [
      {
        name: "server",
        description: "Remove a Roblox private server from active tracking.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "server_id",
            description: "Server number shown in the tracker, such as 1",
            type: APPLICATION_COMMAND_OPTION_INTEGER,
            required: true,
            min_value: 1
          }
        ]
      }
    ]
  };
}

function hourlyCommandPayload() {
  return {
    name: "hourly",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Assign Luna's hourly picture posts.",
    dm_permission: false,
    options: [
      {
        name: "clan",
        description: "Post a clan's hourly board picture in a text channel or thread.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "clan",
            description: "PS99 clan name, for example WMSY or c0ld",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 100
          },
          {
            name: "channel",
            description: "Text channel or thread; defaults to the current destination",
            type: APPLICATION_COMMAND_OPTION_CHANNEL,
            required: false,
            channel_types: [...HOURLY_CLAN_ALLOWED_CHANNEL_TYPES]
          }
        ]
      },
      {
        name: "user",
        description: "Post a user's hourly search chart picture in a text channel or thread.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "username",
            description: "Roblox username or user ID to monitor",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 100
          },
          {
            name: "channel",
            description: "Text channel or thread; defaults to the current destination",
            type: APPLICATION_COMMAND_OPTION_CHANNEL,
            required: false,
            channel_types: [...HOURLY_CLAN_ALLOWED_CHANNEL_TYPES]
          }
        ]
      },
      {
        name: "league",
        description: "Post a league's hourly member-progress picture in a text channel or thread.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "league",
            description: "PS99 league name, for example dezzz",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 100
          },
          {
            name: "channel",
            description: "Text channel or thread; defaults to the current destination",
            type: APPLICATION_COMMAND_OPTION_CHANNEL,
            required: false,
            channel_types: [...HOURLY_CLAN_ALLOWED_CHANNEL_TYPES]
          }
        ]
      },
      {
        name: "remove",
        description: "Remove the hourly picture assignment from a text channel or thread.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "channel",
            description: "Text channel or thread; defaults to the current destination",
            type: APPLICATION_COMMAND_OPTION_CHANNEL,
            required: false,
            channel_types: [...HOURLY_CLAN_ALLOWED_CHANNEL_TYPES]
          }
        ]
      },
      {
        name: "alert",
        description: "Mention one user when a channel's hourly picture posts.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "user",
            description: "User to mention on each hourly picture post",
            type: APPLICATION_COMMAND_OPTION_USER,
            required: true
          },
          {
            name: "channel",
            description: "Text channel or thread; defaults to the current destination",
            type: APPLICATION_COMMAND_OPTION_CHANNEL,
            required: false,
            channel_types: [...HOURLY_CLAN_ALLOWED_CHANNEL_TYPES]
          }
        ]
      }
    ]
  };
}

function htgCommandPayload() {
  const tierOption = {
    name: "tier",
    description: "Alert tier to change",
    type: APPLICATION_COMMAND_OPTION_STRING,
    required: true,
    choices: [
      { name: "Huge", value: "huge" },
      { name: "Titanic", value: "titanic" },
      { name: "Gargantuan", value: "gargantuan" },
      { name: "All", value: "all" }
    ]
  };
  const accountOption = {
    name: "account",
    description: "Roblox username to change; use id:<number> only to force a Roblox user ID",
    type: APPLICATION_COMMAND_OPTION_STRING,
    required: false
  };
  const setupAccountOption = {
    name: "account",
    description: "Roblox username to connect; use id:<number> only to force a Roblox user ID",
    type: APPLICATION_COMMAND_OPTION_STRING,
    required: true
  };

  return {
    name: "htg",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Huge, Titanic, and Gargantuan hatch alert tracker.",
    dm_permission: false,
    options: [
      {
        name: "setup",
        description: "Connect one Roblox account to your private HTG tracker.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [setupAccountOption]
      },
      {
        name: "accounts",
        description: "List the Roblox accounts connected to your HTG tracker.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND
      },
      {
        name: "enable",
        description: "Enable hatch alerts for your own connected Big Games inventory.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [tierOption, accountOption]
      },
      {
        name: "disable",
        description: "Disable hatch alerts for your own connected Big Games inventory.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [tierOption, accountOption]
      },
      {
        name: "assign",
        description: "Assign the only channel where HTG hatch alerts can post.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "channel",
            description: "Text channel or thread; defaults to the current channel",
            type: APPLICATION_COMMAND_OPTION_CHANNEL,
            required: false,
            channel_types: [...HOURLY_CLAN_ALLOWED_CHANNEL_TYPES]
          }
        ]
      }
    ]
  };
}

function offlineUsersBulkOptions() {
  const options = [];
  for (let index = 1; index <= 12; index += 1) {
    const required = index === 1;
    options.push(
      {
        name: `user${index}`,
        description: `Roblox username #${index}`,
        type: APPLICATION_COMMAND_OPTION_STRING,
        required,
        min_length: 1,
        max_length: 100
      },
      {
        name: `discord${index}`,
        description: `Optional Discord-user override for Roblox user #${index}`,
        type: APPLICATION_COMMAND_OPTION_USER,
        required: false
      }
    );
  }
  return options;
}

function offlineDirectUsersBulkOptions() {
  const options = offlineUsersBulkOptions();
  const firstRequiredUser = options.shift();
  return [
    firstRequiredUser,
    {
      name: "clan",
      description: "Optional Clan or League lookup hint; leave blank for automatic lookup",
      type: APPLICATION_COMMAND_OPTION_STRING,
      required: false,
      min_length: 1,
      max_length: 100
    },
    ...options
  ];
}

function offlineCommandPayload() {
  return {
    name: "offline",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Configure Luna offline/no-gain pings.",
    dm_permission: false,
    options: [
      {
        name: "assign",
        description: "Assign separate channels for clan, league, or direct user offline pings.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND_GROUP,
        options: [
          {
            name: "clan",
            description: "Assign where clan-wide offline pings are posted.",
            type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
            options: [
              {
                name: "channel",
                description: "Text channel or thread; defaults to the current channel",
                type: APPLICATION_COMMAND_OPTION_CHANNEL,
                required: false,
                channel_types: [...HOURLY_CLAN_ALLOWED_CHANNEL_TYPES]
              }
            ]
          },
          {
            name: "league",
            description: "Assign where league-wide offline pings are posted.",
            type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
            options: [
              {
                name: "channel",
                description: "Text channel or thread; defaults to the current channel",
                type: APPLICATION_COMMAND_OPTION_CHANNEL,
                required: false,
                channel_types: [...HOURLY_CLAN_ALLOWED_CHANNEL_TYPES]
              }
            ]
          },
          {
            name: "users",
            description: "Assign where direct user offline pings are posted.",
            type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
            options: [
              {
                name: "channel",
                description: "Text channel or thread; defaults to the current channel",
                type: APPLICATION_COMMAND_OPTION_CHANNEL,
                required: false,
                channel_types: [...HOURLY_CLAN_ALLOWED_CHANNEL_TYPES]
              }
            ]
          }
        ]
      },
      {
        name: "mode",
        description: "Set which offline alert sources are active in this server.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "clans",
            description: "Enable or disable all Clan watches for this server",
            type: APPLICATION_COMMAND_OPTION_BOOLEAN,
            required: false
          },
          {
            name: "leagues",
            description: "Enable or disable all League watches for this server",
            type: APPLICATION_COMMAND_OPTION_BOOLEAN,
            required: false
          },
          {
            name: "users",
            description: "Enable or disable direct-user watches for this server",
            type: APPLICATION_COMMAND_OPTION_BOOLEAN,
            required: false
          }
        ]
      },
      {
        name: "minutes",
        description: "Set how many minutes with no point gain should trigger an alert.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "number",
            description: "Minutes with no point gain before Luna alerts",
            type: APPLICATION_COMMAND_OPTION_INTEGER,
            required: true,
            min_value: 1,
            max_value: 1440
          }
        ]
      },
      {
        name: "clan",
        description: "Watch an entire clan for no-gain offline alerts.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "name",
            description: "PS99 clan name, for example c0ld or WMSY",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 100
          }
        ]
      },
      {
        name: "league",
        description: "Watch an entire League for no-gain offline alerts.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "name",
            description: "PS99 League name, for example dezzz or YAMO",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 100
          }
        ]
      },
      {
        name: "remove-clan",
        description: "Remove one clan from clan-wide offline alerts.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "name",
            description: "PS99 clan name to remove",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 100
          }
        ]
      },
      {
        name: "remove-league",
        description: "Remove one League from league-wide offline alerts.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "name",
            description: "PS99 League name to remove",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 100
          }
        ]
      },
      {
        name: "user",
        description: "Add one Roblox username to direct pings; RoVer resolves the Discord user.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "username",
            description: "Roblox username to watch",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 100
          },
          {
            name: "discord",
            description: "Optional Discord-user override; otherwise Luna uses RoVer",
            type: APPLICATION_COMMAND_OPTION_USER,
            required: false
          },
          {
            name: "clan",
            description: "Optional clan or League hint if this player is not in a watched group",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: false,
            min_length: 1,
            max_length: 100
          },
          {
            name: "source",
            description: "Use automatic lookup, clan data only, or League data only",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: false,
            choices: [
              { name: "Auto", value: "auto" },
              { name: "Clan", value: "clan" },
              { name: "League", value: "league" }
            ]
          },
          {
            name: "channel",
            description: "Optional private channel or ticket for this user's alerts",
            type: APPLICATION_COMMAND_OPTION_CHANNEL,
            required: false,
            channel_types: [...HOURLY_CLAN_ALLOWED_CHANNEL_TYPES]
          }
        ]
      },
      {
        name: "users",
        description: "Add up to 12 Roblox users to direct offline pings.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: offlineDirectUsersBulkOptions()
      },
      {
        name: "members",
        description: "Add up to 12 members to be tagged inside their Clan's offline post.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "clan",
            description: "Clan these members belong to, for example c0ld or WMSY",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 100
          },
          ...offlineUsersBulkOptions()
        ]
      },
      {
        name: "remove-user",
        description: "Remove one Roblox user from direct offline pings.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "username",
            description: "Roblox username or numeric user ID to remove",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 100
          }
        ]
      },
      {
        name: "remove-users",
        description: "Bulk-remove direct offline ping assignments.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "entries",
            description: "Roblox names/IDs, or: username: Cinnamowopal username: Foo",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true,
            min_length: 1,
            max_length: 4000
          }
        ]
      },
      {
        name: "post-rate",
        description: "Set how often repeated offline alerts may repost.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "minutes",
            description: "Minimum minutes between repeat alerts for the same player",
            type: APPLICATION_COMMAND_OPTION_INTEGER,
            required: true,
            min_value: 1,
            max_value: 1440
          }
        ]
      },
      {
        name: "config",
        description: "Show configured offline alert channels, watch modes, and tracked users.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND
      }
    ]
  };
}

function kmsCommandPayload() {
  return {
    name: "kms",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Remove Pride Theme.",
    dm_permission: false
  };
}

function tCommandPayload() {
  return {
    name: "t",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Send a message as the bot.",
    dm_permission: false,
    options: [
      {
        name: "message",
        description: "Message to send",
        type: APPLICATION_COMMAND_OPTION_STRING,
        required: true,
        min_length: 1,
        max_length: 2000
      }
    ]
  };
}

function plainInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.trunc(number)) : "-";
}

function formatPs99CommandDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Guatemala",
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.month}/${values.day}/${values.year} ${values.hour}:${values.minute}${String(values.dayPeriod || "").toUpperCase()}`;
}

function memberHasAllowedRole(interaction, env) {
  const allowedRoleIds = parseCsv(env.DISCORD_ALLOWED_ROLE_IDS);
  if (!allowedRoleIds.length) return true;

  const memberRoles = Array.isArray(interaction?.member?.roles)
    ? interaction.member.roles.map(role => String(role))
    : [];

  return memberRoles.some(roleId => allowedRoleIds.includes(roleId));
}

function memberHasTCommandRole(interaction, env) {
  const roleId = tCommandRoleId(env);
  if (!roleId) return false;

  const memberRoles = Array.isArray(interaction?.member?.roles)
    ? interaction.member.roles.map(role => String(role))
    : [];

  return memberRoles.includes(roleId);
}

function tCommandGuildId(env) {
  return String(env.T_COMMAND_GUILD_ID || DEFAULT_T_COMMAND_GUILD_ID).trim();
}

function tCommandRoleId(env) {
  return String(env.T_COMMAND_ROLE_ID || DEFAULT_T_COMMAND_ROLE_ID).trim();
}

async function memberCanManageServerTracker(interaction, env, options = {}) {
  if (options.allowDiscordManage !== false && memberHasDiscordManagerPermission(interaction)) {
    return true;
  }

  if (options.allowConfiguredRole === false) return false;

  return memberHasConfiguredServerTrackerRole(interaction, env);
}

async function memberCanConfigureLunaAdminRole(interaction, env) {
  if (memberHasDiscordManagerPermission(interaction)) return true;
  return !(await lunaAdminRoleIsConfigured(interaction, env));
}

function memberHasDiscordManagerPermission(interaction) {
  let permissions = 0n;
  try {
    permissions = BigInt(String(interaction?.member?.permissions || "0"));
  } catch {}

  const administrator = 1n << 3n;
  const manageGuild = 1n << 5n;
  return (permissions & administrator) === administrator || (permissions & manageGuild) === manageGuild;
}

async function memberHasConfiguredServerTrackerRole(interaction, env) {
  const guildId = String(interaction?.guild_id || "").trim();
  const memberRoles = Array.isArray(interaction?.member?.roles)
    ? interaction.member.roles.map(role => String(role))
    : [];

  const environmentRoles = parseCsv(env.SERVER_TRACKER_ADMIN_ROLE_IDS);
  if (memberRoles.some(roleId => environmentRoles.includes(roleId))) {
    return true;
  }

  if (!guildId || !memberRoles.length) return false;

  try {
    const payload = await serverTrackerApiRequest(env, "/api/tracker/admin-role", {
      query: { guild_id: guildId }
    });
    const configuredRoleId = String(payload.admin_role_id || payload.role_id || "").trim();
    return Boolean(configuredRoleId) && memberRoles.includes(configuredRoleId);
  } catch {
    return false;
  }
}

async function lunaAdminRoleIsConfigured(interaction, env) {
  if (parseCsv(env.SERVER_TRACKER_ADMIN_ROLE_IDS).length) return true;

  const guildId = String(interaction?.guild_id || "").trim();
  if (!guildId) return true;

  try {
    const payload = await serverTrackerApiRequest(env, "/api/tracker/admin-role", {
      query: { guild_id: guildId }
    });
    return Boolean(String(payload.admin_role_id || payload.role_id || "").trim());
  } catch {
    return true;
  }
}

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

async function verifyDiscordRequest(request, env, body) {
  const publicKey = String(env.DISCORD_PUBLIC_KEY || "").trim();
  const signature = String(request.headers.get("X-Signature-Ed25519") || "").trim();
  const timestamp = String(request.headers.get("X-Signature-Timestamp") || "").trim();

  if (!publicKey || !signature || !timestamp) return false;

  const signatureBytes = hexToBytes(signature);
  const publicKeyBytes = hexToBytes(publicKey);
  const message = new TextEncoder().encode(timestamp + body);
  const algorithms = [
    { name: "Ed25519" },
    { name: "NODE-ED25519", namedCurve: "NODE-ED25519" }
  ];

  for (const algorithm of algorithms) {
    try {
      const key = await crypto.subtle.importKey(
        "raw",
        publicKeyBytes,
        algorithm,
        false,
        ["verify"]
      );
      const valid = await crypto.subtle.verify(algorithm, key, signatureBytes, message);
      if (valid) return true;
    } catch {
      // Try the next supported Ed25519 flavor.
    }
  }

  return false;
}

function getCommandBooleanOption(interaction, name) {
  const targetName = String(name || "").toLowerCase();
  const stack = [...(interaction.data?.options || [])];

  while (stack.length) {
    const option = stack.shift();
    if (String(option?.name || "").toLowerCase() === targetName && option?.value !== undefined) {
      const value = option.value;
      return value === true || ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
    }
    if (Array.isArray(option?.options)) stack.push(...option.options);
  }

  return null;
}

function getCommandOption(interaction, name) {
  const targetName = String(name || "").toLowerCase();
  const stack = [...(interaction.data?.options || [])];

  while (stack.length) {
    const option = stack.shift();
    if (String(option?.name || "").toLowerCase() === targetName && option?.value !== undefined) {
      return String(option.value || "").trim();
    }

    if (Array.isArray(option?.options)) {
      stack.push(...option.options);
    }
  }

  return "";
}

function getSubcommandName(interaction) {
  const option = (interaction.data?.options || [])
    .find(item => Number(item?.type) === APPLICATION_COMMAND_OPTION_SUB_COMMAND);
  return String(option?.name || "").trim().toLowerCase();
}

function getOfflineSubcommandPath(interaction) {
  const topOption = (interaction.data?.options || [])[0] || null;
  if (Number(topOption?.type) === APPLICATION_COMMAND_OPTION_SUB_COMMAND_GROUP) {
    const nested = (topOption.options || [])
      .find(item => Number(item?.type) === APPLICATION_COMMAND_OPTION_SUB_COMMAND);
    return {
      group: String(topOption.name || "").trim().toLowerCase(),
      subcommand: String(nested?.name || "").trim().toLowerCase()
    };
  }

  return {
    group: "",
    subcommand: getSubcommandName(interaction)
  };
}

function messageResponse(content, forceEphemeral = false) {
  return {
    type: INTERACTION_RESPONSE_CHANNEL_MESSAGE,
    data: {
      content,
      flags: forceEphemeral ? MESSAGE_FLAG_EPHEMERAL : undefined
    }
  };
}

function displayName(row) {
  return row.display_name || row.username || `user_${row.user_id}`;
}

function rank(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `#${n.toLocaleString("en-US")}` : "Unranked";
}

function formatClanRank(row, run) {
  const rankValue = positiveInteger(row.clan_rank);
  if (!rankValue) return "Unranked";

  const memberCount = positiveInteger(
    row.clan_member_count ||
    row.total_clan_members ||
    run?.clan_member_count
  );

  return memberCount
    ? `${rankValue.toLocaleString("en-US")}/${memberCount.toLocaleString("en-US")}`
    : rank(rankValue);
}

function positiveInteger(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function finiteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

function fullNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "-";
}

function betterThanLine(row) {
  const rankValue = Number(row.global_rank);
  const total = Number(row.total_global_players);

  if (!Number.isFinite(rankValue) || rankValue <= 0 || !Number.isFinite(total) || total <= 0) {
    return null;
  }

  const betterThan = Math.max(0, total - rankValue) / total * 100;
  const better = Math.max(0, rankValue - 1) / total * 100;
  return `💠 Better than **${betterThan.toFixed(2)}%** of players; **${better.toFixed(2)}%** are better`;
}

function discordTime(value) {
  const ms = new Date(value || 0).getTime();
  if (!Number.isFinite(ms)) return "Unknown";
  return `<t:${Math.floor(ms / 1000)}:R>`;
}

function ephemeralResponses(env) {
  return String(env.DISCORD_EPHEMERAL_RESPONSES || "false").toLowerCase() === "true";
}

function requireAdmin(request, env) {
  const expectedTokens = [
    env.REGISTER_ADMIN_TOKEN,
    env.INGEST_ADMIN_TOKEN
  ]
    .map(value => String(value || "").trim())
    .filter(Boolean);

  if (!expectedTokens.length) {
    throw httpError(500, "Missing REGISTER_ADMIN_TOKEN.");
  }

  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = String(match?.[1] || request.headers.get("X-C0LD-Admin-Token") || "").trim();

  if (!expectedTokens.includes(token)) {
    throw httpError(401, "Unauthorized.");
  }
}

function requiredEnv(env, name) {
  const value = String(env[name] || "").trim();
  if (!value) {
    throw httpError(500, `Missing ${name}.`);
  }
  return value;
}

function hexToBytes(hex) {
  const clean = String(hex || "").trim();
  if (!/^[0-9a-f]+$/i.test(clean) || clean.length % 2 !== 0) {
    throw httpError(400, "Invalid hex value.");
  }

  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

function interactionJson(data) {
  return json(data, 200);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(stripUndefined(data)), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefined(item)])
    );
  }

  return value;
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
