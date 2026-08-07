import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../cloudflare/inventory-detector-worker.js", import.meta.url), "utf8")
  .replace("export default {", "globalThis.__worker = {");
const context = vm.createContext({
  console,
  URL,
  URLSearchParams,
  Request,
  Response,
  Headers,
  TextEncoder,
  TextDecoder,
  crypto,
  btoa,
  atob,
  setTimeout,
  clearTimeout
});
new vm.Script(source, { filename: "inventory-detector-worker.js" }).runInContext(context);

const {
  htgV2State,
  htgV2FreshnessDecision,
  htgV2PendingFromCandidates,
  htgV2ScheduleDecision,
  htgProviderRefreshUnits,
  hatchTier,
  hatchTrackerMetadataWithGuildSubscription,
  hatchTrackerEnabledTiersForGuild,
  hatchTrackerGuildIdsForTier,
  hatchTrackerHasEnabledGuildSubscription
} = context;

const coldGuild = "1457088639006670979";
const lunaGuild = "1457088639006670980";
const scopedMetadata = hatchTrackerMetadataWithGuildSubscription({}, coldGuild, ["huge"], true);
const bothGuildsMetadata = hatchTrackerMetadataWithGuildSubscription(scopedMetadata, lunaGuild, ["titanic"], true);
const scopedTracker = { enabled: true, metadata: bothGuildsMetadata };
assert.equal(hatchTrackerHasEnabledGuildSubscription(scopedTracker, coldGuild), true, "a tracker enabled in c0ld must remain enabled in c0ld");
assert.equal(hatchTrackerHasEnabledGuildSubscription(scopedTracker, lunaGuild), true, "a separately enabled Luna-server subscription must be retained");
assert.deepEqual(
  Array.from(hatchTrackerEnabledTiersForGuild(scopedTracker, coldGuild)),
  ["huge"],
  "each server must retain only its own selected HTG tiers"
);
assert.deepEqual(
  Array.from(hatchTrackerGuildIdsForTier(scopedTracker, "huge")),
  [coldGuild],
  "a Huge alert must route only to the guild that enabled Huge"
);
assert.equal(
  hatchTier({ display_name: "Huge Druid Owl", item_class: "Pet", raw: { tradeable: false } }),
  "huge",
  "an untradable Huge reward must still be classified as a Huge"
);

const baseline = {
  captured_at: "2026-08-06T00:00:00.000Z",
  source_fetched_at: "2026-08-06T00:00:00.000Z",
  items: [{ item_match_key: "Huge|serial:1", count: 1 }]
};

assert.equal(htgV2State({ metadata: {} }).baseline, null, "new trackers must begin without a baseline");
assert.deepEqual(
  htgV2State({ metadata: { htg_v2: { baseline: { captured_at: "2026-08-06T00:00:00.000Z", items: [] } } } }).baseline?.items,
  [],
  "an empty HTG baseline must remain armed so a first Huge is not silently absorbed"
);
assert.equal(
  htgV2FreshnessDecision(baseline, { fetched_at: "2026-08-06T00:00:00.000Z" }).fresh,
  false,
  "an unchanged provider revision must never be compared again"
);
assert.equal(
  htgV2FreshnessDecision(baseline, { fetched_at: "2026-08-06T00:16:00.000Z" }).fresh,
  true,
  "a later provider revision must be eligible for comparison"
);
assert.equal(
  htgV2FreshnessDecision(baseline, { fetched_at: "2026-08-06T00:16:00.000Z", refresh_fallback: { used: true } }).fresh,
  false,
  "a quota fallback must preserve the baseline"
);
assert.equal(
  htgV2FreshnessDecision(baseline, {}).fresh,
  false,
  "an inventory without a source revision must never be treated as a new observation"
);

const firstCandidates = [{
  item_match_key: "Huge|serial:1",
  match_key: "serial:1",
  tier: "huge",
  item_key: "pet:Huge Test",
  item_class: "Pet",
  item_id: "Huge Test",
  display_name: "Huge Test",
  variant: "Normal",
  before: 1,
  after: 2,
  delta: 1,
  count: 2,
  raw: { _uq: { uid: "serial:1" } }
}];
const firstPending = htgV2PendingFromCandidates(null, firstCandidates, "2026-08-06T00:16:00.000Z", { available: true, rows: firstCandidates });
assert.equal(firstPending.observations, 1, "the first fresh gain must wait for confirmation");
const confirmedPending = htgV2PendingFromCandidates(firstPending, firstCandidates, "2026-08-06T00:32:00.000Z", { available: true, rows: firstCandidates });
assert.equal(confirmedPending.observations, 2, "the same retained gain must confirm on the next fresh scan");

const env = { HTG_SCAN_INTERVAL_MINUTES: "15", HATCH_FORCE_REFRESH_ON_SCHEDULE: "false", HTG_REFRESH_QUOTA_LIMIT: "96" };
const tracker = { metadata: { htg_v2: { last_attempt_at: "2026-08-06T00:00:00.000Z" } } };
const unscannedTracker = { metadata: { htg_v2: {} } };
assert.equal(
  htgV2ScheduleDecision(env, unscannedTracker, "109818", new Date("2026-08-06T00:07:00.000Z"), { ignoreShard: true }).due,
  false,
  "an initial HTG baseline must wait for a quarter-hour slot"
);
assert.equal(
  htgV2ScheduleDecision(env, unscannedTracker, "109818", new Date("2026-08-06T00:15:00.000Z"), { ignoreShard: true }).due,
  true,
  "an initial HTG baseline must start at :00/:15/:30/:45"
);
const schedule = htgV2ScheduleDecision(env, tracker, "109818", new Date("2026-08-06T00:15:00.000Z"), { ignoreShard: true });
assert.equal(schedule.due, false, "an account with no reported limit must begin at standard-account pace");
assert.equal(schedule.interval_minutes, 35, "an unknown account must reserve six of the 48 standard daily refreshes");
assert.equal(
  htgV2ScheduleDecision(env, tracker, "109818", new Date("2026-08-06T00:35:00.000Z"), { ignoreShard: true }).due,
  false,
  "a due account must wait for a quarter-hour slot instead of drifting to an arbitrary minute"
);
assert.equal(
  htgV2ScheduleDecision(env, tracker, "109818", new Date("2026-08-06T00:45:00.000Z"), { ignoreShard: true }).due,
  true,
  "the next standard-account attempt must run at the next quarter-hour slot"
);

const vipTracker = { metadata: { htg_v2: { last_attempt_at: "2026-08-06T00:00:00.000Z", refresh_quota: { limit: 96, used: 0, resets_at: "2026-08-07T00:00:00.000Z" } } } };
assert.equal(
  htgV2ScheduleDecision(env, vipTracker, "109818", new Date("2026-08-06T00:16:00.000Z"), { ignoreShard: true }).due,
  false,
  "a VIP account with a safety reserve must wait for a clock-aligned scan slot"
);
assert.equal(
  htgV2ScheduleDecision(env, vipTracker, "109818", new Date("2026-08-06T00:30:00.000Z"), { ignoreShard: true }).due,
  true,
  "an API-confirmed VIP account must run on the next quarter-hour scan slot"
);
const vipFastEnv = { ...env, HTG_REFRESH_QUOTA_RESERVE: "0" };
assert.equal(
  htgV2ScheduleDecision(vipFastEnv, vipTracker, "109818", new Date("2026-08-06T00:15:00.000Z"), { ignoreShard: true }).due,
  true,
  "a confirmed VIP account with no reserve can use every :00/:15/:30/:45 slot"
);
assert.equal(htgProviderRefreshUnits({ consumedThisCall: true }), 1, "the provider's explicit debit must be counted");
assert.equal(htgProviderRefreshUnits({ consumedThisCall: false }), 0, "a cached response must not be recorded as a quota debit");

console.log("HTG v2 state-machine tests passed");
