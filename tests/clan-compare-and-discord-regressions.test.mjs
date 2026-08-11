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

const compareCommand = discord.clanCommandPayload().options.find(option => option.name === "compare");
assert.equal(compareCommand.type, 2, "/clan compare should register as a subcommand group");
assert.deepEqual(
  Array.from(compareCommand.options, option => option.name),
  ["view", "assign", "remove"],
  "/clan compare should expose preview and persistent-post controls"
);

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
  discord.shouldRunHourlyScheduledPosts({}, Date.parse("2026-08-10T12:07:00.000Z")),
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
const topBody = topMessage.components[0].components[2].content;
assert.doesNotMatch(topBody, /stars\n\n\*\*#2/, "/top rows should not contain the old blank-line spacing");

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

console.log("Clan comparison and Discord regression tests passed");
