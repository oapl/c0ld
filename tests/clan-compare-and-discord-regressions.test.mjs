import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

assert.deepEqual(
  JSON.parse(JSON.stringify(discord.apiCommandPayload())),
  {
    name: "api",
    type: 1,
    description: "Run a live status check against the BIG Games API.",
    dm_permission: false
  }
);
const apiStatusMessage = discord.buildBigGamesApiStatusMessage({
  status: "degraded",
  checked_at: "2026-08-21T18:00:00.000Z",
  healthy_origins: 1,
  total_origins: 2,
  origins: [
    { origin: "https://biggamesapi.io", ok: true, http_status: 200, latency_ms: 123 },
    { origin: "https://ps99.biggamesapi.io", ok: false, http_status: 503, latency_ms: 456, error: "HTTP 503" }
  ]
});
assert.match(apiStatusMessage.embeds[0].title, /Degraded/);
assert.equal(apiStatusMessage.embeds[0].description, undefined);
assert.equal(apiStatusMessage.embeds[0].fields.length, 3);
assert.match(apiStatusMessage.embeds[0].fields[0].value, /123 ms/);
assert.match(apiStatusMessage.embeds[0].fields[1].value, /HTTP 503/);
assert.equal(apiStatusMessage.embeds[0].fields[2].name, "Checked");

const discordSource = readFileSync(new URL("../cloudflare/discord-search-interactions-worker.js", import.meta.url), "utf8");
const clanApiSource = readFileSync(new URL("../cloudflare/c0ld-clan-api-worker.js", import.meta.url), "utf8");
const leagueApiSource = readFileSync(new URL("../cloudflare/yamo-league-api-worker.js", import.meta.url), "utf8");
const clanLogDeliveryMigration = readFileSync(new URL("../supabase/migrations/20260820210000_add_clan_log_delivery_receipts.sql", import.meta.url), "utf8");
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
const chartComparisonEmbed = chartComparison.embeds[0];
const chartComparisonText = [
  chartComparisonEmbed.title,
  chartComparisonEmbed.description,
  ...chartComparisonEmbed.fields.flatMap(field => [field.name, field.value])
].join("\n");
assert.doesNotMatch(chartComparisonText, /⏱️ Projection:/, "the image chart should replace the text projection block");
assert.doesNotMatch(chartComparisonText, /Player Comparison|Leagues|Updated|1 Hr:|12 Hr:|24 Hr:/, "the text area should omit metadata and point-rate lines");
assert.equal(chartComparison._file.filename, "player-compare.png");
assert.equal(chartComparisonEmbed.image.url, "attachment://player-compare.png", "the comparison chart should remain one full-width embed image");
assert.equal(chartComparisonEmbed.fields.length, 3, "the text card should contain two player columns and one VS column");
assert.equal(chartComparisonEmbed.fields.every(field => field.inline === true), true, "all three comparison fields should render inline");
assert.equal(chartComparisonEmbed.fields[0].name, "ALPHA", "the first player name should use the clean native field label");
assert.equal(chartComparisonEmbed.fields[1].name, "🚶‍♀️‍➡️ VS 🚶‍♂️", "the middle column should place the walking emotes directly around VS");
assert.equal(chartComparisonEmbed.fields[1].value, "\u200b", "the middle VS column must not include any other visible text");
assert.equal(chartComparisonEmbed.fields[2].name, "BETA", "the second player name should use the clean native field label");
assert.doesNotMatch(chartComparisonText, /###/, "embed fields must not expose unsupported heading markup");
assert.doesNotMatch(chartComparisonText, /:xone:/, "player comparison text must not contain the xone placeholder");
assert.equal(chartComparisonEmbed.thumbnail.url, "https://example.com/beta.png", "the projected 24-hour winner should appear as the embed thumbnail");
assert.deepEqual(Array.from(chartComparison.components), [], "the two-column player embed must not retain thumbnail sections");
assert.match(chartComparisonEmbed.description, /BETA.*take the lead.*24 hours/, "the embed should state the projected outcome without repeating projection figures");
assert.equal("title" in chartComparisonEmbed, false, "the player columns must not be preceded by a duplicate title line");
assert.match(chartComparisonEmbed.footer.text, /^Updated ·/, "the update label should sit in the footer below the graph");
assert.equal(chartComparisonEmbed.timestamp, "2026-08-20T12:00:00.000Z", "the footer should carry Discord's localized update timestamp");
assert.match(discordSource, /projectionHours:\s*24/, "player comparison charts should show the full 24-hour outlook");
assert.match(discordSource, /searchChartDrawComparisonHeader/, "player comparison charts should use the two-avatar VS header");
assert.match(discordSource, /if \(searchChartEnabled\(env\)\)/, "search charts should be eligible in both Clan Battle and League modes");
assert.doesNotMatch(discordSource, /if \(!isLeagueMode && searchChartEnabled\(env\)\)/, "League search results must not suppress the chart");
assert.match(discordSource, /groupLabel = isLeagueMode \? "League" : "Clan"/, "the search chart should switch its group labels with the active event mode");
assert.match(discordSource, /eventName: chartEventName/, "the search chart should receive the active League event label");
assert.match(discordSource, /requestedName\.toLowerCase\(\)/, "League chart history should tolerate stored League-name casing differences");
assert.match(discordSource, /comparisonDrawRaceInsights/, "player comparisons should use race-specific insight cards instead of the League table");
assert.match(discordSource, /\[1, 6, 12, 24\]/, "the comparison image should summarize 1, 6, 12, and 24-hour horizons");
assert.match(discordSource, /MAX CHASE/, "each horizon should include the trailer's observed maximum pace");
assert.match(discordSource, /PRESSURED[\s\S]{0,300}LEAD HOLDS/, "multi-horizon cards should distinguish a vulnerable lead from a secure one");
assert.match(discordSource, /const endLabel = `\$\{projectionHours\} Hrs`/, "the forecast boundary should carry its golden hour label");
assert.match(discordSource, /yAxisGutter\.x \+ Math\.max\(8, \(yAxisGutter\.w - labelWidth\) \/ 2\)/, "point-axis labels should be centered in their gutter");
const comparisonMembers = discord.leagueChartMembers({
  rows: [{ user_id: 123, display_name: "Tester", global_rank: 47, points: 1_000 }]
}, { preserveOrder: true });
assert.equal(comparisonMembers[0].rank, 47, "comparison chart normalization must preserve the displayed global rank");

assert.equal(
  discord.searchChartDirectGain({ history: [{ gain_1h: 77 }] }, { gain_1h: null }, "gain_1h"),
  77,
  "a null direct gain must fall through to a usable history gain"
);
const leagueSearchSamples = discord.searchChartLeagueSamples(
  {
    rows: [
      { fetched_at: "2026-08-21T10:00:00.000Z", points: 14_000_000 },
      { fetched_at: "2026-08-21T10:20:00.000Z", points: 14_200_000 }
    ]
  },
  {
    rows: [
      { fetched_at: "2026-08-21T10:00:00.000Z", rank: 3_000, points: 14_000_000 },
      { fetched_at: "2026-08-21T10:20:00.000Z", rank: 2_900, points: 14_200_000 }
    ]
  },
  { history: [] },
  { fetched_at: "2026-08-21T10:40:00.000Z", points: 14_300_000, global_rank: 2_850 },
  { SEARCH_CHART_INTERVAL_MINUTES: "20" }
);
assert.equal(leagueSearchSamples.length, 3, "League search charts should merge stored history with the current row");
assert.deepEqual(
  Array.from(leagueSearchSamples, sample => [sample.points, sample.rank]),
  [[14_000_000, 3_000], [14_200_000, 2_900], [14_300_000, 2_850]],
  "League chart points and global ranks should share the same historical timeline"
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
