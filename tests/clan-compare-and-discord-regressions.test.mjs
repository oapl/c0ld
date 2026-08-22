import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

function workerContext(relativePath, overrides = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8")
    .replace("export default {", "globalThis.__worker = {");
  const context = vm.createContext({
    console,
    URL,
    URLSearchParams,
    Request,
    Response,
    Headers,
    FormData,
    Blob,
    TextEncoder,
    TextDecoder,
    AbortController,
    crypto,
    btoa,
    atob,
    setTimeout,
    clearTimeout,
    CompressionStream,
    DecompressionStream,
    structuredClone,
    ...overrides
  });
  new vm.Script(source, { filename: relativePath }).runInContext(context);
  return context;
}

const api = workerContext("../cloudflare/c0ld-clan-api-worker.js", {
  fetch: async request => {
    const url = new URL(typeof request === "string" ? request : request.url);
    if (url.pathname === "/api/clans") {
      return Response.json({ status: "ok", data: [{ Name: "WMSY", Points: 123 }] });
    }
    return Response.json({ status: "error" }, { status: 404 });
  }
});

const comparison = api.buildClanComparisonPayload({
  snapshot_at: "2026-08-10T12:00:00.000Z",
  generated_at: "2026-08-10T12:00:10.000Z",
  battle: "TestBattle",
  display_name: "Test Battle",
  battle_end_iso: "2026-08-10T22:00:00.000Z",
  rows: [
    { rank: 44, clan_name: "ABOVE", points: 2_000, rate_per_hour: 100, projection_basis: "1h", projected_points: 3_000 },
    { rank: 45, clan_name: "WMSY", points: 1_500, rate_per_hour: 200, projection_basis: "1h", projected_points: 3_500 },
    { rank: 46, clan_name: "BELOW", points: 1_300, rate_per_hour: 250, projection_basis: "1h", projected_points: 3_800 }
  ]
}, "wmsy", Date.parse("2026-08-10T12:01:00.000Z"));

assert.equal(comparison.above.clan_name, "ABOVE", "comparison should select the clan immediately above");
assert.equal(comparison.clan.clan_name, "WMSY", "comparison should normalize the requested clan name");
assert.equal(comparison.below.clan_name, "BELOW", "comparison should select the clan immediately below");
assert.equal(comparison.race_to_above.gap_points, 500);
assert.equal(comparison.race_to_above.hours_to_pass, 5.01, "passing requires one point beyond a tied score");
assert.equal(comparison.race_to_above.passes_before_event_end, true);
assert.equal(comparison.threat_from_below.hours_to_pass, 4.02);
assert.equal(comparison.threat_from_below.passes_before_event_end, true);

const tieRace = api.clanComparisonRace(
  { clan_name: "WMSY", points: 1_000, rate_per_hour: 11 },
  { clan_name: "ABOVE", points: 1_000, rate_per_hour: 10 },
  "2026-08-10T12:00:00.000Z",
  "2026-08-10T13:00:00.000Z"
);
assert.equal(tieRace.points_needed_to_pass, 1);
assert.equal(tieRace.hours_to_pass, 1, "equal points still require one additional point to pass");

const searchRow = api.normalizeGlobalCandidateSearchOutput({
  user_id: 123,
  points: 2_000,
  source_clan: "WMSY",
  fetched_at: "2026-08-10T12:00:00.000Z"
}, {
  run: { battle_key: "TestBattle" },
  globalRank: 50,
  memberRank: 2,
  totalGlobalPlayers: 500,
  username: "Tester",
  displayName: "Tester",
  avatarUrl: null,
  gainMaps: { gain_1h: new Map([[123, 1_750]]) }
});
assert.equal(searchRow.gain_1h, 250, "/search should expose the same direct one-hour gain used by /hourly");

const healthResponse = await api.__worker.fetch(
  new Request("https://example.test/api/big-games/health"),
  {},
  { waitUntil() {} }
);
const health = await healthResponse.json();
assert.equal(healthResponse.status, 200);
assert.equal(health.ok, true);
assert.equal(health.status, "operational");
assert.equal(health.healthy_origins, 2);

const discord = workerContext("../cloudflare/discord-search-interactions-worker.js", {
  fetch: async () => Response.json({ ok: true })
});

const discordSource = readFileSync(new URL("../cloudflare/discord-search-interactions-worker.js", import.meta.url), "utf8");
const clanApiSource = readFileSync(new URL("../cloudflare/c0ld-clan-api-worker.js", import.meta.url), "utf8");
const leagueApiSource = readFileSync(new URL("../cloudflare/yamo-league-api-worker.js", import.meta.url), "utf8");
const leagueApi = workerContext("../cloudflare/yamo-league-api-worker.js", {
  fetch: async () => Response.json({ status: "error" }, { status: 404 })
});
const clanLogDeliveryMigration = readFileSync(new URL("../supabase/migrations/20260820210000_add_clan_log_delivery_receipts.sql", import.meta.url), "utf8");
const retainedHistoryMigration = readFileSync(new URL("../supabase/migrations/20260821053000_restore_complete_retained_global_battle_history.sql", import.meta.url), "utf8");
const reconstructedRankMigration = readFileSync(new URL("../supabase/migrations/20260821061500_reconstruct_missing_final_global_ranks.sql", import.meta.url), "utf8");
const participantRankMigration = readFileSync(new URL("../supabase/migrations/20260821064500_reconstruct_history_ranks_from_participation.sql", import.meta.url), "utf8");
assert.equal(
  (discordSource.match(/if \(clanPath\.group === "compare"\)/g) || []).length,
  1,
  "/clan compare must have one command handler and one persistence owner"
);
assert.doesNotMatch(
  discordSource,
  /hourlyClanApiRequest\(env, "\/api\/discord\/clan-compare-assignments"/,
  "the Discord worker must not read or write the retired comparison assignment table"
);
assert.match(discordSource, /enforce_nonce:\s*true/, "clan log posts must ask Discord to reject a duplicate nonce");
assert.match(discordSource, /claimClanLogDelivery/, "clan log posts must acquire a durable delivery claim before posting");
assert.match(
  clanLogDeliveryMigration,
  /primary key \(assignment_key, event_id\)/,
  "delivery receipts must uniquely identify each event for each assigned log"
);
assert.match(
  leagueApiSource,
  /responseRows = query\s*\? await enrichSoloLeaderboardSearchGains\(env, runKey, visibleRows\)/,
  "queried League players must be enriched from their stored League snapshots"
);
assert.match(
  clanApiSource,
  /source_mode: "leagues",[\s\S]{0,900}gain_1h: toNumber\(row\.gain_1h\),[\s\S]{0,150}gain_24h: toNumber\(row\.gain_24h\)/,
  "the global League search must preserve calculated player gains"
);
assert.match(clanApiSource, /url\.pathname === "\/api\/global\/battle-history"/, "history must support a direct retained-rank lookup by user ID");
assert.match(discordSource, /fetchClanHistoryJson\(env, "\/api\/global\/battle-history"/, "/history must request retained ranks independently of current leaderboard membership");
assert.match(retainedHistoryMigration, /from public\.c0ld_battle_global_final_snapshots final/, "raw finalized global snapshots must remain the first history source");
assert.match(retainedHistoryMigration, /from public\.c0ld_battle_player_finals final/, "older compact player finals must remain available as a history fallback");
assert.match(retainedHistoryMigration, /select \* from raw_archived[\s\S]*select \* from compact_archived[\s\S]*select \* from retained/, "history sources must retain raw, compact, and interval records");
assert.match(reconstructedRankMigration, /from public\.c0ld_battle_player_finals final[\s\S]*final\.global_rank is null/, "rank reconstruction must only supplement compact rows whose global rank is missing");
assert.match(reconstructedRankMigration, /candidate\.points > missing\.ranking_points[\s\S]*from public\.c0ld_global_rank_candidates candidate/, "missing ranks must be placed against the preserved final candidate distribution");
assert.match(reconstructedRankMigration, /candidate\.points = missing\.ranking_points[\s\S]*candidate\.user_id < missing\.user_id/, "rank reconstruction must preserve the leaderboard user-ID tie break");
assert.match(participantRankMigration, /from public\.c0ld_clan_snapshots snapshot[\s\S]*from public\.c0ld_clan_snapshots_archive snapshot/, "missing global ranks must be recoverable from both live and archived participation snapshots");
assert.match(participantRankMigration, /select distinct on \(final_run\.battle_identity\)[\s\S]*participation\.fetched_at desc/, "rank reconstruction must use each participant's final retained battle observation");
assert.match(participantRankMigration, /select distinct on \(candidate\.run_key, candidate\.user_id\)/, "the final candidate distribution must deduplicate players who appeared under more than one clan");
assert.match(participantRankMigration, /select \* from raw_archived[\s\S]*select \* from reconstructed_participation[\s\S]*select \* from compact_archived/, "participation reconstruction must fill gaps without overriding authoritative raw finals");
assert.match(clanApiSource, /supplementMissingRetainedGlobalRanks\(env, clan, userId/, "retained history must recover missing ranks in the worker when archive linkage is absent");
assert.match(clanApiSource, /resolveGlobalCandidateRank\(env, finalRun\.run_key/, "preserved final candidate runs must be used for exact missing-rank recovery");
assert.match(clanApiSource, /candidateCount = await supabaseCount[\s\S]*?run_key: `eq\.\$\{finalRun\.run_key\}`[\s\S]*?\}\)\.catch/, "retained candidate recovery must count the complete battle-specific run");
assert.doesNotMatch(clanApiSource, /candidateCount = await supabaseCount[\s\S]*?run_key: `eq\.\$\{finalRun\.run_key\}`,[\s\S]*?battle_key:[\s\S]*?\}\)\.catch/, "legacy retained candidates must not be excluded by a redundant row-level battle key");
assert.match(clanApiSource, /resolveGlobalCandidateRank\(env, finalRun\.run_key,[\s\S]*?battle_key: ""/, "exact retained-rank recovery must rank across the whole battle-specific run");
assert.match(clanApiSource, /resolveArchivedFinalDistributionRank\([\s\S]*?global_rank_recovered_from: "archived_final_distribution"/, "pruned raw candidates must fall back to the permanent final distribution");
assert.match(clanApiSource, /source_kind: "eq\.global_candidate"[\s\S]*?global_points: `gt\.\$\{points\}`[\s\S]*?user_id: `lt\.\$\{userId\}`/, "an unranked participant must be placed by points and the global user-ID tie break");
assert.match(clanApiSource, /status: "in\.\(ok,complete,completed\)"/, "history recovery must query completed battle runs directly instead of rejecting older valid runs");
assert.match(clanApiSource, /estimateArchivedGlobalRankFromAnchors/, "deleted historical runs must fall back to neighboring archived rank anchors");
assert.match(discordSource, /estimated \? "~" : ""/, "estimated historical ranks must be visibly marked instead of presented as exact");
assert.match(discordSource, /const limits = \[500\];/, "League history should not scan thousands of redundant active-period observations");
assert.match(leagueApiSource, /key: "tap-2026"[\s\S]*end_at: "2026-08-01T16:00:00\.000Z"/, "Tap must retain its stored event boundary");
assert.match(leagueApiSource, /key: "garden-2026"[\s\S]*start_at: "2026-08-01T16:00:00\.000Z"[\s\S]*end_at: "2026-08-15T16:00:00\.000Z"/, "Garden League must retain the period containing its OAPL final");
assert.match(discordSource, /sortLeagueHistoryRecords\(attachLeagueGlobalHistoryRows/, "League history display order must follow event dates rather than fallback insertion order");
assert.match(discordSource, /options\.view === "league"[\s\S]*fetchLeagueHistoryJson/, "the initial Clan history card must not block on unrelated League history");
assert.match(discordSource, /league_loaded: options\.view === "league"/, "history data must record whether the League API was actually loaded");
assert.match(discordSource, /view === "league" && history\?\.league_loaded !== true[\s\S]*hydrateCachedLeagueHistoryMessage/, "the League button must hydrate a Clan-only render cache");
assert.match(discordSource, /historyLeagueHydrationsInFlight\.get\(hydrationKey\)[\s\S]*historyLeagueHydrationsInFlight\.set\(hydrationKey, hydration\)/, "repeated League button presses must share one in-flight history lookup");
assert.match(discordSource, /league_unavailable: options\.view === "league" && leagueHistory === null/, "an intentionally skipped League request must not be labeled unavailable");
assert.doesNotMatch(discordSource, /history alternate-view cache warm failed/, "the initial response must not spend its Worker lifetime warming the unrequested history view");
assert.deepEqual(
  { ...api.interpolateArchivedGlobalRank([
    { rank: 163, points: 77_750_000, total: 36_974 },
    { rank: 186, points: 77_560_000, total: 36_974 }
  ], 77_613_485) },
  { rank: 180, totalGlobalPlayers: 36_974 },
  "a deleted run must use transparent interpolation between its nearest surviving rank anchors"
);
assert.match(discord.historyCardRank(180, 36_974, true), /^~#180\//, "estimated ranks must render with a visible approximation marker");
const detachedRetainedHistory = discord.summarizeGlobalHistory({
  row: null,
  battle_history: [{
    battle_key: "NinjaBattle2026",
    battle_display_name: "Ninja Battle 2026",
    global_rank: 77,
    global_points: 12345,
    total_global_players: 30000
  }]
});
assert.equal(detachedRetainedHistory[0].global_rank, 77, "retained ranks must load even when the player has no current League/global-search row");

const invalidEditCalls = [];
const invalidEditDiscord = workerContext("../cloudflare/discord-search-interactions-worker.js", {
  fetch: async (_request, init = {}) => {
    invalidEditCalls.push(init.method || "GET");
    return Response.json({ message: "Invalid Form Body" }, { status: 400 });
  }
});
await assert.rejects(
  invalidEditDiscord.postOrUpdateClanTrackerMessages(
    { DISCORD_BOT_TOKEN: "test-token" },
    { channel_id: "12345", message_id: '["67890"]' },
    [{ embeds: [{ description: "updated" }] }]
  ),
  /Invalid Form Body/,
  "an invalid edit must fail without creating a replacement post"
);
assert.deepEqual(invalidEditCalls, ["PATCH"], "Discord 400 must never fall through to POST");

const missingEditCalls = [];
const missingEditDiscord = workerContext("../cloudflare/discord-search-interactions-worker.js", {
  fetch: async (_request, init = {}) => {
    const method = init.method || "GET";
    missingEditCalls.push(method);
    return method === "PATCH"
      ? Response.json({ message: "Unknown Message" }, { status: 404 })
      : Response.json({ id: "99999" });
  }
});
const recreated = await missingEditDiscord.postOrUpdateClanTrackerMessages(
  { DISCORD_BOT_TOKEN: "test-token" },
  { channel_id: "12345", message_id: '["67890"]' },
  [{ embeds: [{ description: "updated" }] }]
);
assert.deepEqual(missingEditCalls, ["PATCH", "POST", "DELETE"], "only Discord 404 may recreate the persistent post");
assert.deepEqual(Array.from(recreated.ids), ["99999"]);

const clanCommand = discord.clanCommandPayload();
const clanOptionNames = Array.from(clanCommand.options, option => option.name);
assert.equal(
  new Set(clanOptionNames).size,
  clanOptionNames.length,
  "/clan must not register duplicate top-level option names"
);
const compareCommand = clanCommand.options.find(option => option.name === "compare");
assert.equal(compareCommand.type, 2, "/clan compare should register as a subcommand group");
assert.deepEqual(
  Array.from(compareCommand.options, option => option.name),
  ["assign", "remove"],
  "/clan compare should retain only clan-specific persistent-post controls"
);
const compareView = discord.compareCommandPayload();
assert.deepEqual(
  Array.from(compareView.options, option => option.name),
  ["type", "first", "second"],
  "/compare should accept a comparison type and two direct entries"
);
assert.deepEqual(
  Array.from(compareView.options[0].choices, choice => choice.value),
  ["clan", "league", "player"],
  "/compare should support clans, Leagues, and players"
);

const directComparison = discord.buildDirectComparisonMessage("league", {
  name: "ALPHA",
  rank: 4,
  points: 10_000_000,
  pace: 500_000,
  gain1h: 500_000,
  gain12h: 2_000_000,
  gain24h: 4_000_000,
  projectedRank: 3,
  projectedPoints: 10_500_000,
  detail: "4 members recorded",
  context: "Fiesta Part 2",
  updatedAt: "2026-08-20T12:00:00.000Z",
  imageUrl: "https://example.com/alpha.png"
}, {
  name: "BETA",
  rank: 7,
  points: 9_000_000,
  pace: 700_000,
  gain1h: 700_000,
  gain12h: 2_500_000,
  gain24h: 5_000_000,
  projectedRank: 6,
  projectedPoints: 9_700_000,
  detail: "4 members recorded",
  context: "Fiesta Part 2",
  updatedAt: "2026-08-20T12:00:00.000Z"
});
assert.ok((directComparison.flags & 32768) !== 0, "direct comparisons should use Components V2");
const directComparisonContainer = directComparison.components[0];
const directComparisonText = directComparisonContainer.components.flatMap(component => (
  component.content ? [component.content] : (component.components || []).map(child => child.content || "")
)).join("\n");
assert.match(directComparisonText, /League Comparison/);
assert.match(directComparisonText, /🚶‍♀️‍➡️ ALPHA  VS  BETA 🚶‍♂️/);
assert.match(directComparisonText, /:xone: \*\*ALPHA\*\*/);
assert.match(directComparisonText, /\*#4 · 10M points\*/);
assert.match(directComparisonText, /1 Hr: 500K/);
assert.match(directComparisonText, /12 Hr: \+2M/);
assert.match(directComparisonText, /Projection:\*\*\nAfter 1 hour, \*\*ALPHA\*\* is projected to lead by \*\*800K points\*\*/);
assert.doesNotMatch(directComparisonText, /%|████|░░░░/);
assert.equal(directComparisonContainer.components[2].accessory.media.url, "https://example.com/alpha.png");
assert.match(directComparisonContainer.components.at(-1).content, /\u2800{72}/, "all comparison types should use the same width anchor");

const chartComparison = discord.buildDirectComparisonMessage(
  "player",
  { name: "ALPHA", rank: 4, points: 10_000_000, gain1h: 500_000, gain24h: 12_000_000, detail: "League: A", imageUrl: "https://example.com/alpha.png", updatedAt: "2026-08-20T12:00:00.000Z" },
  { name: "BETA", rank: 7, points: 9_000_000, gain1h: 700_000, gain24h: 16_800_000, detail: "League: B", imageUrl: "https://example.com/beta.png", updatedAt: "2026-08-20T12:00:00.000Z" },
  {},
  { filename: "player-compare.png", bytes: new Uint8Array([1, 2, 3]) }
);

assert.deepEqual(
  Array.from(leagueApi.knownLeagueNamesFromStoredPlayerRows([
    {
      league_name: "GLOBAL_LEAGUE_PLAYER_POOL",
      raw_member: { source_league_name: "FreshLeague" },
      raw_league: { Name: "FreshLeague" }
    },
    { league_name: "OlderLeague", raw_member: {}, raw_league: {} }
  ])),
  ["FreshLeague", "OlderLeague"],
  "player recovery should extract real League names from aggregate and ordinary stored rows"
);
const recoveredLeaguePlayer = await leagueApi.recoverSoloLeaguePlayerFromKnownLocations(
  {},
  "current-run",
  33492395,
  async () => [{
    league_run_key: "previous-run",
    league_name: "GLOBAL_LEAGUE_PLAYER_POOL",
    raw_member: { source_league_name: "Competitive" },
    raw_league: { Name: "Competitive" }
  }],
  async leagueName => ({
    data: {
      Name: leagueName,
      ID: "league-id",
      Icon: "rbxassetid://123",
      Points: 25_000_000,
      Owner: { UserID: 33492395, DisplayName: "unoyea" },
      Members: [],
      PointContributions: [{ UserID: 33492395, DisplayName: "unoyea", Points: 18_000_000 }]
    }
  })
);
assert.equal(recoveredLeaguePlayer.user_id, 33492395);
assert.equal(recoveredLeaguePlayer.league_name, "Competitive");
assert.equal(recoveredLeaguePlayer.points, 18_000_000);
assert.equal(recoveredLeaguePlayer.source, "live-known-league-roster");
assert.match(
  leagueApiSource,
  /completed:\s*Boolean\(metadataRow\)/,
  "player-pool completion must not become false merely because one searched user is absent"
);
assert.equal(chartComparison._file.filename, "player-compare.png");
assert.equal(chartComparison.embeds, undefined, "a rendered player comparison should be an image-only response");
assert.equal(chartComparison.components, undefined, "the image-only response must not retain a text card");
assert.match(discordSource, /renderDirectPlayerComparisonChartPng/, "player comparisons should use the dedicated image renderer");
assert.match(discordSource, /\["PREVIOUS 24 HOURS", "PROJECTED 24 HOURS"\]/, "the chart headings should use the requested plain-language labels");
assert.match(discordSource, /const group = player\.subtitle \|\| `\$\{player\.groupKind\}: \$\{player\.groupName\}`/, "comparison headers should support player groups and combined-roster labels");
assert.match(discordSource, /buildDirectComparisonChartAttachment\(type, firstEntry, secondEntry, env\)/, "Clans, Leagues, and players should all use the shared comparison image path");
assert.match(discordSource, /\[1, 6, 12, 24\]/, "the comparison image should summarize 1, 6, 12, and 24-hour horizons");
assert.doesNotMatch(discordSource, /directComparisonDrawLegend/, "the chart should not repeat the player color index");
assert.doesNotMatch(discordSource, /directComparisonUpdatedLabel/, "the chart should not render bottom credit or update text");
assert.doesNotMatch(discordSource, /directComparisonDrawOutlookCard/, "the graph should occupy the former outlook-card area");
const entityChartComparison = discord.buildDirectComparisonMessage(
  "league",
  { name: "ALPHA", rank: 4, points: 10_000_000 },
  { name: "BETA", rank: 7, points: 9_000_000 },
  {},
  { filename: "league-compare.png", bytes: new Uint8Array([1, 2, 3]) }
);
assert.equal(entityChartComparison._file.filename, "league-compare.png");
assert.equal(entityChartComparison.components, undefined, "a rendered League comparison should use the same image-only response as players");
const combinedEntityHistory = discord.aggregateDirectComparisonEntityHistory([
  { snapshot_id: "one", fetched_at: "2026-08-20T10:00:00.000Z", user_id: 1, points: 100 },
  { snapshot_id: "one", fetched_at: "2026-08-20T10:00:00.000Z", user_id: 2, points: 250 },
  { snapshot_id: "two", fetched_at: "2026-08-20T11:00:00.000Z", user_id: 1, points: 175 },
  { snapshot_id: "two", fetched_at: "2026-08-20T11:00:00.000Z", user_id: 2, points: 325 }
], { name: "ALPHA", seriesKey: "league-1" }, "league");
assert.deepEqual(
  Array.from(combinedEntityHistory, row => [row.comparison_key, row.points]),
  [["league-1", 350], ["league-1", 500]],
  "League and Clan chart history must sum every member at each observation"
);
const redactedLeagueHistory = discord.aggregateDirectComparisonEntityHistory([
  { snapshot_id: "one", fetched_at: "2026-08-20T10:00:00.000Z", league_points: 500, user_id: 1, points: 200 },
  { snapshot_id: "one", fetched_at: "2026-08-20T10:00:00.000Z", user_id: 2, points_redacted: true },
  { snapshot_id: "one", fetched_at: "2026-08-20T10:00:00.000Z", league_points: 500, user_id: 3, points: 175 }
], { name: "APPY", seriesKey: "league-1" }, "league");
assert.equal(
  redactedLeagueHistory[0].points,
  500,
  "League comparison history may use the public aggregate total without exposing a redacted member row"
);
assert.match(
  leagueApiSource,
  /league_rank:\s*hourlySlotMs === null\s*\? \(liveLeagueRank \?\? storedLeagueRank\)/,
  "current League comparisons should prefer the live leaderboard rank over the periodic stored rank"
);
assert.deepEqual(
  Array.from(discord.directComparisonIntervalSamples([
    { t: Date.parse("2026-08-20T10:30:39.000Z"), points: 100 },
    { t: Date.parse("2026-08-20T10:31:39.000Z"), points: 100 },
    { t: Date.parse("2026-08-20T10:32:15.000Z"), points: 100 },
    { t: Date.parse("2026-08-20T10:47:15.000Z"), points: 140 }
  ], 15), row => [new Date(row.t).toISOString(), row.points]),
  [
    ["2026-08-20T10:32:15.000Z", 100],
    ["2026-08-20T10:47:15.000Z", 140]
  ],
  "duplicate on-demand pulls inside one 15-minute interval must not bias comparison metrics as extra zero-rate samples"
);
let leagueRankLookupCalls = 0;
assert.equal(
  await discord.resolveDirectComparisonPlayerRank(
    { user_id: 2, username: "AgentP_0928" },
    { source_mode: "leagues" },
    "AgentP_0928",
    {},
    async (query, userId) => {
      leagueRankLookupCalls += 1;
      assert.equal(query, "AgentP_0928");
      assert.equal(userId, 2);
      return { rank: 417 };
    }
  ),
  417,
  "a League comparison must recover a missing global rank from the League-player pool"
);
assert.equal(
  await discord.resolveDirectComparisonPlayerRank(
    { user_id: 1, global_rank: 2159 },
    { source_mode: "leagues" },
    "Cinnamowopal",
    {},
    async () => {
      leagueRankLookupCalls += 1;
      return { rank: 9999 };
    }
  ),
  2159,
  "an exact rank already supplied by global search must remain authoritative"
);
assert.equal(leagueRankLookupCalls, 1, "the fallback lookup should run only for a missing League rank");
const patternedForecast = discord.directComparisonForecastProfile([], {
  gain1h: 100,
  gain6h: 300,
  gain12h: 900,
  gain24h: 2100
}, 0);
assert.deepEqual(
  Array.from(patternedForecast.bands, band => [band.start, band.end, band.rate]),
  [[0, 1, 100], [1, 6, 40], [6, 12, 100], [12, 24, 100]],
  "each projected segment should reproduce the remaining contribution from its matching historical window"
);
assert.deepEqual(
  [1, 6, 12, 24].map(hours => discord.directComparisonProjectedGain({ forecastBands: patternedForecast.bands }, hours)),
  [100, 300, 900, 2100],
  "projection endpoints should exactly reproduce the previous 1h, 6h, 12h, and 24h cumulative gains"
);
const monotonicForecast = discord.directComparisonForecastProfile([], {
  gain1h: 500,
  gain6h: 300,
  gain12h: 700,
  gain24h: 650
}, 0);
assert.deepEqual(
  [1, 6, 12, 24].map(hours => monotonicForecast.gains[hours]),
  [500, 500, 700, 700],
  "inconsistent sparse anchors must be clamped so projected point totals never move backward"
);
const disjointPatternNow = Date.parse("2026-08-20T12:00:00.000Z");
const disjointPatternSamples = [{ t: disjointPatternNow - 24 * 3600000, points: 0 }];
let disjointPatternPoints = 0;
for (let age = 23; age >= 0; age -= 1) {
  disjointPatternPoints += age >= 12 ? 10 : age >= 6 ? 20 : age >= 1 ? 30 : 40;
  disjointPatternSamples.push({ t: disjointPatternNow - age * 3600000, points: disjointPatternPoints });
}
const observedPatternBands = discord.directComparisonObservedPatternBands(disjointPatternSamples, disjointPatternNow);
assert.deepEqual(
  Array.from(observedPatternBands, band => [band.start, band.end, band.gain, band.coverage]),
  [[0, 1, 40, 1], [1, 6, 150, 1], [6, 12, 120, 1], [12, 24, 120, 1]],
  "the forecast must measure the distinct previous 1h, hours 2-6, hours 7-12, and hours 13-24 slices"
);
const observedPatternForecast = discord.directComparisonForecastProfile(observedPatternBands, {
  gain1h: 0,
  gain6h: 0,
  gain12h: 0,
  gain24h: 0
}, 0);
assert.deepEqual(
  [1, 6, 12, 24].map(hours => observedPatternForecast.gains[hours]),
  [40, 190, 310, 430],
  "fully observed pattern slices must override stale zero-valued API anchors"
);
const comparisonFixtureNow = Date.parse("2026-08-20T12:00:00.000Z");
const comparisonHistoryRows = [];
let alphaPoints = 900_000;
let betaPoints = 980_000;
for (let hour = 24; hour >= 0; hour -= 1) {
  alphaPoints += 18_000 + (24 - hour) * 200;
  betaPoints += 13_000 + ((24 - hour) % 3) * 500;
  const fetchedAt = new Date(comparisonFixtureNow - hour * 3600000).toISOString();
  comparisonHistoryRows.push({ user_id: 1, points: alphaPoints, fetched_at: fetchedAt });
  comparisonHistoryRows.push({ user_id: 2, points: betaPoints, fetched_at: fetchedAt });
}
const comparisonPng = await discord.renderDirectPlayerComparisonChartPng({}, comparisonHistoryRows, [
  { name: "ALPHA", userId: 1, rank: 121, points: alphaPoints, group: "Moonlight", sourceMode: "leagues", updatedAt: "2026-08-20T12:00:00.000Z" },
  { name: "BETA", userId: 2, rank: 98, points: betaPoints, group: "Starlight", sourceMode: "leagues", updatedAt: "2026-08-20T12:00:00.000Z" }
], {});
const comparisonPngBytes = Buffer.from(comparisonPng);
assert.equal(comparisonPngBytes.subarray(1, 4).toString("ascii"), "PNG");
assert.equal(comparisonPngBytes.readUInt32BE(16), 1600);
assert.equal(comparisonPngBytes.readUInt32BE(20), 1040);
if (process.env.WRITE_COMPARE_PREVIEW) writeFileSync(process.env.WRITE_COMPARE_PREVIEW, comparisonPngBytes);
const entityHistoryRows = comparisonHistoryRows.map(row => ({
  ...row,
  comparison_key: row.user_id === 1 ? "league-1" : "league-2",
  user_id: null
}));
const entityComparisonPng = await discord.renderDirectPlayerComparisonChartPng({}, entityHistoryRows, [
  { name: "MOONLIGHT", seriesKey: "league-1", comparisonType: "league", memberCount: 4, rank: 12, points: alphaPoints, updatedAt: "2026-08-20T12:00:00.000Z" },
  { name: "STARLIGHT", seriesKey: "league-2", comparisonType: "league", memberCount: 4, rank: 18, points: betaPoints, updatedAt: "2026-08-20T12:00:00.000Z" }
], {});
const entityComparisonPngBytes = Buffer.from(entityComparisonPng);
assert.equal(entityComparisonPngBytes.readUInt32BE(16), 1600);
assert.equal(entityComparisonPngBytes.readUInt32BE(20), 1040);
if (process.env.WRITE_ENTITY_COMPARE_PREVIEW) writeFileSync(process.env.WRITE_ENTITY_COMPARE_PREVIEW, entityComparisonPngBytes);
const comparisonMembers = discord.leagueChartMembers({
  rows: [{ user_id: 123, display_name: "Tester", global_rank: 47, points: 1_000 }]
}, { preserveOrder: true });
assert.equal(comparisonMembers[0].rank, 47, "comparison chart normalization must preserve the displayed global rank");

assert.equal(
  discord.searchChartDirectGain({ history: [{ gain_1h: 77 }] }, { gain_1h: null }, "gain_1h"),
  77,
  "a null direct gain must fall through to a usable history gain"
);
assert.deepEqual(
  { ...discord.hourlyClaimFailurePatch({ last_posted_at: "2026-08-10T11:00:00.000Z" }, "Discord 429") },
  { last_posted_at: "2026-08-10T11:00:00.000Z", last_error: "Discord 429" },
  "a failed claimed post must restore the previous delivery timestamp"
);

assert.equal(
  discord.shouldRunHourlyScheduledPosts({}, Date.parse("2026-08-10T12:03:00.000Z")),
  true,
  "overdue hourly assignments must be allowed to drain after the exact post minute"
);
assert.equal(
  discord.hourlyScheduledBucketMs(Date.parse("2026-08-10T10:05:00.000Z"), 10),
  Date.parse("2026-08-10T09:10:00.000Z"),
  "the due bucket before the configured minute must refer to the previous hour"
);
assert.equal(
  discord.hourlyAssignmentDue(
    { last_posted_at: "2026-08-10T11:59:00.000Z" },
    Date.parse("2026-08-10T12:00:00.000Z"),
    { alignToHour: true, postMinute: 0 }
  ),
  false,
  "a queued board posted near the hour boundary must not immediately post again"
);
const fairBatch = discord.hourlySelectScheduledBatch([
  { assignment_key: "newer-same-channel", channel_id: "100", updated_at: "2026-08-10T10:00:00.000Z" },
  { assignment_key: "older-same-channel", channel_id: "100", updated_at: "2026-08-10T09:00:00.000Z" },
  { assignment_key: "other-channel", channel_id: "200", updated_at: "2026-08-10T11:00:00.000Z" }
], 4);
assert.deepEqual(
  Array.from(fairBatch, assignment => assignment.assignment_key),
  ["older-same-channel", "other-channel"],
  "a scheduled tick must select the oldest board fairly and only one board per Discord channel"
);
const activeChannels = new Set();
const laneAssignments = [
  { assignment_key: "first", channel_id: "100" },
  { assignment_key: "second", channel_id: "100" },
  { assignment_key: "third", channel_id: "200" }
];
const laneResults = await discord.runHourlyDeliveryLanes(laneAssignments, async assignment => {
  assert.equal(activeChannels.has(assignment.channel_id), false, "same-channel Discord deliveries must never overlap");
  activeChannels.add(assignment.channel_id);
  await new Promise(resolve => setTimeout(resolve, 2));
  activeChannels.delete(assignment.channel_id);
  return assignment.assignment_key;
});
assert.deepEqual(Array.from(laneResults), ["first", "second", "third"]);

const topMessage = discord.buildTopCommandMessage({
  title: "Top Clans",
  kind: "clans",
  updatedAt: "2026-08-10T12:00:00.000Z",
  subtitle: "Test Battle",
  rows: [
    { rank: 1, clan_name: "ONE", points: 100 },
    { rank: 2, clan_name: "TWO", points: 90 }
  ]
}, { kind: "clans", page: 0, ownerId: "123", env: {} });
assert.equal(topMessage.embeds[0].fields, undefined, "leaderboard columns must not use placeholder embed fields");
assert.equal(
  topMessage.embeds[0].footer.text,
  "\u2800".repeat(72),
  "three-column leaderboards must request Discord's full desktop embed width"
);
assert.match(topMessage.embeds[0].description, /```text\n#1 ONE\s+100 stars\s+—\n#2 TWO\s+90 stars\s+—\n```/);

assert.equal(
  discord.topCommandColumnLine("leagues", { rank: 1, league_name: "AG0NY", total_points: 102_690_000, gain_1h: 1_120_000 }, 1),
  "#1 AG0NY                        102.69M points     +1.12M/h",
  "Top Leagues must use all three inline columns"
);
assert.equal(
  discord.topCommandColumnLine("players", { global_rank: 1, username: "Player", source_clan: "COLD", points: 50_000, gain_1h: 2_000 }, 1),
  "#1 Player · COLD                50K points         +2K/h",
  "Top Players must use all three inline columns while retaining the source group"
);

const clanMessage = discord.buildClanLookupMessage({
  payload: {
    clan_name: "WMSY",
    clan_rank: 45,
    clan_points: 1_500,
    member_count: 2,
    snapshot_at: "2026-08-10T12:00:00.000Z"
  },
  rows: [
    { rank: 1, username: "One", total_points: 100, gain_1h: 50 },
    { rank: 2, username: "Two", total_points: 90, gain_1h: 40 }
  ]
}, { page: 0, ownerId: "123", env: {} });
const clanBody = clanMessage.components[0].components[2].content;
assert.match(clanBody, /stars\n\n\*\*#02/, "/cw and /clan info should leave a readable gap between members");
assert.doesNotMatch(clanBody, /\/h/, "/cw and /clan info should not show hourly rates");

const compareMessage = discord.buildClanCompareMessage(comparison, "WMSY", {});
const compareText = compareMessage.embeds[0].description;
assert.match(compareText, /:arrow_up: \*\*\[ABOVE\] #44\*\*/);
assert.match(compareText, /:star2: \*\*\[WMSY\] #45\*\*/);
assert.match(compareText, /:arrow_down: \*\*\[BELOW\] #46\*\*/);
assert.match(compareText, /\*\*Time-To-Pass:\*\*/);
assert.match(compareText, /\*\*Passing Pace:\*\*/);
assert.match(compareText, /\*\*Outlook:\*\*/);
assert.match(compareText, /Luna Pet Sim 99 Bot/);
assert.doesNotMatch(compareText, /basis/i);
assert.doesNotMatch(compareText, /Projections use the best available recent pace window/);
assert.equal(compareMessage.embeds[0].footer, undefined);

const leftEmbed = await discord.buildClanActivityEventEmbed({
  event_id: "left-1",
  event_type: "member_left",
  clan_name: "ORBI",
  user_id: 1,
  display_name: "RoastBeefKweeef",
  detected_at: "2026-08-14T16:35:00.000Z",
  avatar_url: "https://example.com/avatar.png",
  details: { member_count: 75, member_capacity: 75, join_time: "2026-05-19T00:00:00.000Z" }
});
const joinedEmbed = await discord.buildClanActivityEventEmbed({
  event_id: "joined-1",
  event_type: "member_joined",
  clan_name: "ORBI",
  user_id: 2,
  display_name: "NewPlayer",
  detected_at: "2026-08-14T16:35:00.000Z",
  avatar_url: "https://example.com/avatar.png",
  details: { member_count: 75, member_capacity: 75, global_rank: 123, global_rank_total: 30000 }
});
assert.equal(leftEmbed.footer.text, joinedEmbed.footer.text, "every clan activity embed must use the same width anchor");
assert.equal(
  leftEmbed.footer.text,
  `Luna clan activity tracker${"\u2800".repeat(44)}`,
  "the invisible footer anchor must keep compact clan activity embeds at one consistent width"
);
const repeatedNonce = await discord.clanLogDiscordNonce("assignment", "event");
assert.equal(repeatedNonce, await discord.clanLogDiscordNonce("assignment", "event"));
assert.equal(repeatedNonce.length, 25, "Discord nonces must stay within the documented 25-character limit");
assert.notEqual(repeatedNonce, await discord.clanLogDiscordNonce("assignment", "different-event"));

console.log("Clan comparison and Discord regression tests passed");
