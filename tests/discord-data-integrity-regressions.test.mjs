import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../cloudflare/discord-search-interactions-worker.js", import.meta.url), "utf8")
  .replace("export default {", "globalThis.__worker = {");
const discord = vm.createContext({
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
  DecompressionStream,
  CompressionStream,
  AbortController,
  crypto,
  btoa,
  atob,
  setTimeout,
  clearTimeout,
  fetch: async () => Response.json({ ok: true })
});
new vm.Script(source, { filename: "discord-search-interactions-worker.js" }).runInContext(discord);

const htgReportCommand = discord.htgCommandPayload().options.find(option => option.name === "report");
assert.ok(htgReportCommand, "/htg must register the report subcommand");
assert.deepEqual(
  Array.from(htgReportCommand.options[0].choices, choice => choice.value),
  ["day", "week", "month"],
  "/htg report must offer the three bounded rolling timeframe choices"
);
assert.deepEqual(
  Array.from(htgReportCommand.options[0].choices, choice => choice.name),
  ["Last 24 hours", "Last 7 Days", "Last 30 Days"],
  "/htg report must use the concise timeframe labels"
);
const reportItems = Array.from({ length: 40 }, (_, index) => ({
  tier: "huge",
  display_name: `Huge Test ${index + 1}`,
  roblox_username: "Tester",
  quantity: 1,
  estimated_rap: 1_000_000,
  latest_at: "2026-08-20T10:00:00.000Z"
}));
const htgReportMessage = discord.buildHatchReportMessage({
  timeframe: "week",
  window_label: "Last 7 Days",
  period_start: "2026-08-13T12:00:00.000Z",
  period_end: "2026-08-20T12:00:00.000Z",
  total_quantity: 2,
  total_estimated_rap: 2_000_000,
  tier_totals: { huge: 2, titanic: 0, gargantuan: 0 },
  accounts: [{ roblox_username: "Tester" }],
  items: reportItems
}, { ownerId: "123456789012345678", page: 0 });
const htgReportText = htgReportMessage.components[0].components.map(component => component.content || "").join("\n");
assert.match(htgReportText, /HTG Weekly Report/);
assert.match(htgReportText, /Huge Test 10/);
assert.doesNotMatch(htgReportText, /Huge Test 11\b/, "HTG report pages must contain only their bounded item slice");
assert.doesNotMatch(htgReportText, /Total acquired|Grouped items|Reports do not change or resend alerts/);
assert.ok(htgReportText.length < 4000, "all displayable HTG report text on one page must stay below Discord's 4,000-character limit");
const htgReportButtons = htgReportMessage.components[0].components.find(component => component.type === 1).components;
assert.equal(htgReportButtons[0].disabled, true, "the first HTG report page must disable Previous");
assert.equal(htgReportButtons[2].disabled, false, "a multi-page HTG report must enable Next");
assert.deepEqual(JSON.parse(JSON.stringify(discord.parseHtgReportCustomId(htgReportButtons[2].custom_id))), {
  ownerId: "123456789012345678",
  timeframe: "week",
  page: 1,
  action: "next"
});
const hostileReportMessage = discord.buildHatchReportMessage({
  timeframe: "month",
  period_start: "2026-07-21T12:00:00.000Z",
  period_end: "2026-08-20T12:00:00.000Z",
  total_quantity: 40,
  tier_totals: { huge: 40 },
  accounts: Array.from({ length: 20 }, (_, index) => ({ roblox_username: `${"*_~|>".repeat(12)}${index}` })),
  items: Array.from({ length: 40 }, (_, index) => ({
    tier: "huge",
    display_name: `${"*_~|>".repeat(30)}${index}`,
    roblox_username: `${"*_~|>".repeat(15)}${index}`,
    quantity: 1,
    estimated_rap: 1,
    latest_at: "2026-08-20T10:00:00.000Z"
  }))
}, { ownerId: "123456789012345678", page: 0 });
const hostileReportText = hostileReportMessage.components[0].components.map(component => component.content || "").join("\n");
assert.ok(hostileReportText.length < 4000, "Markdown escaping and long names must not push a complete HTG report page over Discord's text limit");

assert.equal(discord.finiteNumber(null), null, "missing league gains must remain unavailable instead of becoming zero");
assert.equal(discord.finiteNumber(""), null, "blank numeric API fields must remain unavailable");
assert.equal(
  discord.leagueEventDisplayLabel("Plants VS Coins Part 2"),
  "Fiesta Part 2",
  "Discord must correct the superseded League event label while deployments converge"
);

const leagueSource = readFileSync(new URL("../cloudflare/yamo-league-api-worker.js", import.meta.url), "utf8")
  .replace("export default {", "globalThis.__worker = {");
const leagueApi = vm.createContext({
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
  fetch: async () => Response.json({ ok: true })
});
new vm.Script(leagueSource, { filename: "yamo-league-api-worker.js" }).runInContext(leagueApi);
assert.equal(
  leagueApi.leagueRunLabel({ LEAGUE_RUN_LABEL: "Plants VS Coins Part 2" }, "plants-vs-coins-part-2"),
  "Fiesta Part 2",
  "the League API must correct a stale deployed run-label variable"
);

const sparseLeagueSeries = discord.leagueMemberGrowthSeries({
  snapshot_at: "2026-08-10T12:00:00.000Z"
}, [
  { user_id: 1, fetched_at: "2026-08-10T11:50:00.000Z", points: 900 },
  { user_id: 1, fetched_at: "2026-08-10T11:55:00.000Z", points: 950 }
], [{
  id: "1",
  name: "Player",
  points: 1_000,
  gain1h: 200,
  gain6h: 500,
  gain12h: null,
  gain24h: null
}], { hours: 24 });
assert.ok(
  sparseLeagueSeries[0].points.some(point => point.t === Date.parse("2026-08-10T06:00:00.000Z") && point.value === 500),
  "a sparse current-hour history must retain the available six-hour rolling baseline"
);
const sparseBridge = sparseLeagueSeries[0].points.find(point => point.observedGap === true);
assert.ok(sparseBridge, "a sparse interval must be marked for a visually distinct dashed bridge");
assert.equal(sparseBridge.breakBefore, false, "valid sparse League observations must remain connected");

const leagueWatchMigration = readFileSync(new URL("../supabase/migrations/20260820213000_add_league_refresh_watchlist.sql", import.meta.url), "utf8");
assert.match(leagueWatchMigration, /primary key \(league_run_key, league_key\)/);
assert.match(leagueSource, /markGeneralLeagueRefreshAttempts\(env, watches, scheduledAt\)/,
  "general League attempts must advance before network pulls so failures cannot poison the queue");
assert.match(leagueSource, /last_attempt_at\.asc\.nullsfirst,requested_at\.desc/,
  "general League watches must be scheduled fairly by their oldest attempt");

const trackerRows = discord.clanTrackerRows({ rows: [
  { rank: 64, username: "Mertiliano3", total_points: 3_950_000, gain_20m: 8_910 },
  { rank: 48, user_id: 123, username: "Mertiliano3", total_points: 7_440_000, gain_20m: 37_150, gain_1h: 105_240 }
] });
assert.equal(trackerRows.length, 1, "the clan tracker must emit each Roblox member once");
assert.equal(trackerRows[0].tracker_rank, 48, "the more complete duplicate tracker row must win");

const trackerFields = discord.clanTrackerEmbedFields([{
  tracker_rank: 16,
  tracker_username: "BHD431",
  tracker_points: 16_140_000,
  tracker_gain_20m: 0,
  tracker_gain_1h: 0
}]);
assert.equal(trackerFields.length, 1, "an incomplete final page must not add empty spacer columns");
assert.equal(trackerFields[0].name, "`16` · **BHD431**");
assert.equal(trackerFields[0].value, ":star: 16.14M\n-# · 20m 0\n-# · 1h 0");
assert.doesNotMatch(`${trackerFields[0].name}${trackerFields[0].value}`, /\u200b/,
  "tracker fields must not contain top or bottom zero-width spacer lines");

const trackerMessages = discord.buildClanTrackerMessages({
  clan_name: "COLD",
  icon_url: "https://example.test/clan.png",
  rows: Array.from({ length: 22 }, (_, index) => ({
    rank: index + 1,
    user_id: index + 1,
    username: `Member${index + 1}`,
    total_points: 20_000_000 - index,
    gain_20m: 0,
    gain_1h: 0
  }))
}, "COLD", {});
assert.equal(trackerMessages.length, 2);
assert.equal(trackerMessages[0].embeds[0].fields.length, 3,
  "the preceding tracker page must retain three populated member columns after balancing");
assert.equal(trackerMessages[1].embeds[0].fields.length, 3,
  "a short final tracker page must borrow real rows instead of shrinking to fewer columns");
assert.equal(trackerMessages[0].embeds[0].footer, undefined,
  "clan tracker posts must not add a selectable footer spacer row");
assert.equal(trackerMessages[1].embeds[0].footer, undefined,
  "split clan tracker posts must not add a selectable footer spacer row");
assert.equal(trackerMessages[0].embeds[0].thumbnail, undefined,
  "the first tracker page must not reserve thumbnail width that shifts its member columns");

const fullClanTrackerMessages = discord.buildClanTrackerMessages({
  clan_name: "COLD",
  rows: Array.from({ length: 75 }, (_, index) => ({
    rank: index + 1,
    user_id: index + 1,
    username: `Member${index + 1}`,
    total_points: 20_000_000 - index,
    gain_20m: 0,
    gain_1h: 0
  }))
}, "COLD", {});
assert.equal(fullClanTrackerMessages.length, 4,
  "a full 75-member clan roster must fit into exactly four tracker posts");

const clanMap = new Map();
discord.mergeClanHistoryRecord(clanMap, {
  key: "battleblockpartybattle",
  battle_key: "?? Battle: **Block Party Battle**",
  name: "?? Battle: **Block Party Battle**",
  source: "cw_bot",
  rank: 1123
});
discord.mergeClanHistoryRecord(clanMap, {
  key: "blockpartybattle",
  battle_key: "Block Party Battle",
  name: "Block Party Battle",
  source: "big_bot",
  points: 425_830
});
assert.equal(clanMap.size, 1, "Markdown-corrupted battle labels must merge with their clean history record");
const historyRow = [...clanMap.values()][0];
assert.equal(historyRow.name, "Block Party Battle");
assert.equal(historyRow.points, 425_830);
assert.equal(historyRow.rank, 1123, "the selected history row should retain complementary complete fields");

const clanApiSource = readFileSync(new URL("../cloudflare/c0ld-clan-api-worker.js", import.meta.url), "utf8");
const battleCoverageSource = clanApiSource.slice(
  clanApiSource.indexOf("async function handleBattleMemberCoverage"),
  clanApiSource.indexOf("async function handleClansIngest")
);
assert.match(battleCoverageSource, /C0LD_MEMBER_FINAL_RAW_TABLE/, "battle coverage must read the preserved c0ld final-roster archive");
assert.doesNotMatch(
  battleCoverageSource,
  /BATTLE_PLAYER_FINALS_TABLE|EXTERNAL_PLAYER_HISTORY_TABLE|CW_BOT_HISTORY_TABLE|partial_player_history/,
  "battle coverage must never union joins, leaves, or individual-history imports into the final roster"
);
const finalCoverage = discord.historyBattleCoverageMap([{
  battle_key: "Spring2026",
  battle_display_name: "Abstract Battle",
  identified_members: 62,
  member_capacity: 75,
  coverage_source: "legacy_final_snapshot",
  is_final_roster: true
}]);
assert.equal(finalCoverage.get(discord.canonicalClanHistoryKey("Abstract Battle")).identified_members, 62);
assert.equal(
  discord.historyClanMemberCoverageLabel({ identified_members: 81, member_capacity: 75, is_final_roster: true }),
  "81/75",
  "an authoritative final roster must not be clamped to the nominal clan capacity"
);
assert.equal(
  discord.historyModernRecordParts({
    name: "Abstract Battle",
    clan_name: "c0ld",
    identified_members: 62,
    member_capacity: 75,
    is_final_roster: true
  }, "clan").tag,
  "C0LD | 62/75",
  "Clan Battle history cards must show final-roster coverage beside the clan"
);
const leaguePoolBranch = clanApiSource.slice(
  clanApiSource.indexOf('if (sourceMode === "leagues") {', clanApiSource.indexOf("async function handleGlobalLeaderboardPoolSearch")),
  clanApiSource.indexOf("const historyHoursValue", clanApiSource.indexOf("async function handleGlobalLeaderboardPoolSearch"))
);
assert.match(
  leaguePoolBranch,
  /attachRetainedGlobalBattleHistory\([\s\S]*includeBattleHistory/,
  "League-mode global searches must still attach the permanent Clan Battle final-snapshot history"
);

const archivedLeagueRows = [{
  league_run_key: "old-run",
  league_name: "COLD",
  snapshot_id: "final",
  user_id: 109818,
  points: 500
}];
const liveLeagueRows = [{
  league_run_key: "new-run",
  league_name: "MOVO",
  snapshot_id: "current",
  user_id: 109818,
  points: 100
}];
const mergedLeagueRows = leagueApi.mergeLeagueProfileSourceRows(liveLeagueRows, archivedLeagueRows);
assert.equal(mergedLeagueRows.length, 2, "League profiles must retain final_raw rows after interval cleanup");
assert.ok(mergedLeagueRows.some(row => row.league_run_key === "old-run" && row.points === 500));

const cachedHistory = {
  user_id: 109818,
  username: "Cinnamonwopal",
  clan: [{ name: "Ninja Battle 2026", points: 16_420_000 }],
  league: [{ name: "Fiesta Part 2", league_name: "MOVO", points: 14_550_000 }]
};
await discord.historyPutCachedJson({}, "data", "league-button-test", cachedHistory);
const cachedHistoryRoundTrip = await discord.historyGetCachedJson({}, "data", "league-button-test");
assert.equal(cachedHistoryRoundTrip.league[0].name, "Fiesta Part 2", "history view switches must retain League data without another API lookup");
const historyInteractionSource = source.slice(
  source.indexOf("async function completeHistoryInteraction"),
  source.indexOf("async function completeChartInteraction")
);
assert.match(
  historyInteractionSource,
  /warmView[\s\S]*prepareHistoryRenderCache/,
  "the initial history response must warm the alternate League/Clan image"
);
const cachedMessageSource = source.slice(
  source.indexOf("async function buildCachedHistoryMessage"),
  source.indexOf("function historyImageMessage")
);
assert.match(
  cachedMessageSource,
  /historyGetCachedJson\(env, "data"[\s\S]*renderHistoryCardPng/,
  "an early history-button click must render from cached data instead of reloading history"
);

const unnamedLeagueRows = discord.normalizeLeagueHistoryRows([{
  league_run_key: "plants-vs-coins-part-2",
  league_period_key: "plants-vs-coins-part-2:yamo:2026-08-15",
  run_label: "plants-vs-coins-part-2:yamo:2026-08-15",
  league_name: "YAMO",
  final_snapshot_at: "2026-08-15T10:46:57.246-06:00",
  final_points: 10,
  league_rank: 3
}]);
assert.equal(unnamedLeagueRows[0].name, "Aug 15, 2026", "unnamed League periods must use their final-recording date as the display name");

const leaguePeriodsWithGlobalRanks = discord.attachLeagueGlobalHistoryRows([
  { league_run_key: "fiesta", league_name: "MOVO", name: "Fiesta Part 2", global_rank: null },
  { league_run_key: "fiesta", league_name: "YAMO", name: "Aug 15, 2026", global_rank: null }
], [{
  league_run_key: "fiesta",
  league_name: "movo",
  global_rank: 1791,
  total_global_players: 28910,
  final_snapshot_at: "2026-08-20T12:00:50.610-06:00"
}]);
assert.equal(leaguePeriodsWithGlobalRanks[0].global_rank, 1791, "the final global player rank must attach to the matching League period");
assert.equal(leaguePeriodsWithGlobalRanks[1].global_rank, null, "a global rank from one League must not leak into another League in the same run");

const historicalPoolSummaries = leagueApi.summarizeLeaguePlayerPoolProfileRows([{
  league_run_key: "plants-vs-coins-part-2",
  fetched_at: "2026-08-15T15:48:11.801Z",
  rank: 13809,
  points: 31562,
  user_id: 109818,
  raw_member: { source_league_id: "oapl-id", source_league_name: "OAPL", source_league_rank: 1735 },
  raw_league: { pool_total_players: 31033 }
}, {
  league_run_key: "plants-vs-coins-part-2",
  fetched_at: "2026-08-15T18:03:11.857Z",
  rank: 588,
  points: 21765568,
  user_id: 109818,
  raw_member: { source_league_id: "yamo-id", source_league_name: "YAMO", source_league_rank: 33 },
  raw_league: { pool_total_players: 27886 }
}], {});
assert.equal(historicalPoolSummaries.length, 2, "player-pool history must retain separate Leagues from the same run");
const enrichedLeaguePeriods = leagueApi.attachLeaguePoolPlacementsToProfileSummaries([{
  league_run_key: "plants-vs-coins-part-2",
  league_id: "yamo-id",
  league_name: "YAMO",
  final_snapshot_at: "2026-08-15T16:46:57.246Z",
  league_rank: null
}], historicalPoolSummaries);
assert.equal(enrichedLeaguePeriods[0].league_rank, 33);
assert.equal(enrichedLeaguePeriods[0].global_rank, 588);
assert.equal(enrichedLeaguePeriods[0].total_global_players, 27886);

const officialEventMemberships = leagueApi.summarizeLeagueProfileRows([{
  league_run_key: "plants-vs-coins-part-2",
  league_id: "oapl-id",
  league_name: "OAPL",
  fetched_at: "2026-08-15T15:48:00.000Z",
  user_id: 109818,
  rank: 1,
  points: 31_562
}, {
  league_run_key: "plants-vs-coins-part-2",
  league_id: "yamo-id",
  league_name: "YAMO",
  fetched_at: "2026-08-15T18:03:00.000Z",
  user_id: 109818,
  rank: 1,
  points: 21_765_568
}, {
  league_run_key: "plants-vs-coins-part-2",
  league_id: "movo-id",
  league_name: "MOVO",
  fetched_at: "2026-08-20T17:36:59.985Z",
  user_id: 109818,
  rank: 1,
  points: 14_548_812
}], {});
assert.equal(officialEventMemberships.length, 2, "history must contain one final membership per official event");
assert.equal(officialEventMemberships[0].league_period_key, "garden-2026");
assert.equal(officialEventMemberships[0].league_name, "OAPL", "the last pre-Fiesta membership is the Garden final");
assert.equal(officialEventMemberships[1].league_period_key, "fiesta-part-2-2026");
assert.equal(officialEventMemberships[1].league_name, "MOVO", "mid-event YAMO must collapse into the later MOVO Fiesta membership");

const finalEventPoolRows = leagueApi.finalLeaguePoolSummariesForProfile(officialEventMemberships, leagueApi.summarizeLeaguePlayerPoolProfileRows([{
  league_run_key: "plants-vs-coins-part-2",
  fetched_at: "2026-08-15T15:48:11.801Z",
  rank: 13809,
  user_id: 109818,
  points: 31_562,
  raw_member: { source_league_id: "oapl-id", source_league_name: "OAPL", source_league_rank: 1735 },
  raw_league: { pool_total_players: 31033 }
}, {
  league_run_key: "plants-vs-coins-part-2",
  fetched_at: "2026-08-15T18:03:11.857Z",
  rank: 588,
  user_id: 109818,
  points: 21_765_568,
  raw_member: { source_league_id: "yamo-id", source_league_name: "YAMO", source_league_rank: 33 },
  raw_league: { pool_total_players: 27886 }
}, {
  league_run_key: "plants-vs-coins-part-2",
  fetched_at: "2026-08-20T18:00:50.610Z",
  rank: 1791,
  user_id: 109818,
  points: 14_548_812,
  raw_member: { source_league_id: "movo-id", source_league_name: "MOVO", source_league_rank: 444 },
  raw_league: { pool_total_players: 28910 }
}], {}));
assert.deepEqual(Array.from(finalEventPoolRows, row => row.source_league_name), ["OAPL", "MOVO"], "only the final League's global row should survive for each event");
const poolOnlyHistory = leagueApi.mergeLeagueProfileSummariesWithPoolFallbacks([], finalEventPoolRows);
assert.equal(poolOnlyHistory.length, 2, "final_raw player-pool rows must remain displayable after interval cleanup");
assert.equal(poolOnlyHistory[0].league_name, "OAPL");
assert.equal(poolOnlyHistory[0].league_rank, 1735);
assert.equal(poolOnlyHistory[0].global_rank, 13809);

const leagueRecord = discord.historyModernRecordParts({
  name: "Fiesta Part 2",
  league_name: "movo",
  league_rank: 444,
  player_rank: 1,
  global_rank: 1791,
  points: 14_548_812
}, "league");
assert.equal(leagueRecord.title, "Fiesta Part 2");
assert.equal(leagueRecord.tag, "MOVO");
assert.equal(leagueRecord.rank, "League #444");
assert.equal(leagueRecord.globalRank, "Global #1,791");
assert.ok(!JSON.stringify(leagueRecord).includes("Player"), "League cards must not retain the Player # field");

const testColors = discord.searchChartBoardColors();
assert.deepEqual(
  discord.historyLeagueAccent("movo", testColors),
  discord.historyLeagueAccent("MOVO", testColors),
  "the same League name must always use the same left accent color"
);
assert.notDeepEqual(
  discord.historyLeagueBarColors(testColors),
  testColors,
  "League percentile bars must use a distinct gradient"
);
const leagueMetrics = discord.historyModernMetricRows({}, [{ league_rank: 444, global_rank: 1791, total_global_players: 28910 }], "league", {}, testColors);
assert.deepEqual(
  Array.from(leagueMetrics, metric => String(metric.label)),
  ["Player ID", "Records", "Best League Rank", "Best Global Rank"]
);
const clanMetrics = discord.historyModernMetricRows({ current_clan: "MOVO" }, [{ global_rank: 111, total_global_players: 38_000 }], "clan", { value: "TOP 1%", tone: "gold" }, testColors);
assert.ok(!Array.from(clanMetrics, metric => String(metric.label)).includes("Current Clan"), "history cards must not display a potentially cross-contaminated current clan metric");
assert.ok(!source.includes("current_clan: globalPayload?.row?.source_clan"), "League search data must not be copied into a current-clan history field");
const leagueHistoryPng = await discord.renderHistoryCardPng({
  user_id: 109818,
  username: "Cinnamowopal",
  league: [{
    name: "Fiesta Part 2",
    league_name: "MOVO",
    league_rank: 444,
    global_rank: 1791,
    total_global_players: 28910,
    points: 14_548_812,
    final_snapshot_at: "2026-08-20T12:00:50.610-06:00"
  }, {
    name: "Aug 15, 2026",
    league_name: "YAMO",
    league_rank: null,
    global_rank: null,
    points: 12_000_000,
    final_snapshot_at: "2026-08-15T10:46:57.246-06:00"
  }]
}, "league", {});
assert.ok(leagueHistoryPng.byteLength > 10_000, "the updated League history card must render as a non-empty PNG");

console.log("Discord data-integrity regression tests passed");
