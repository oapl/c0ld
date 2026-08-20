import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../cloudflare/inventory-detector-worker.js", import.meta.url), "utf8")
  .replace("export default {", "globalThis.__worker = {");
const reportQueries = [];
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
  clearTimeout,
  fetch: async input => {
    const url = new URL(typeof input === "string" ? input : input.url);
    if (url.hostname === "supabase.test" && url.pathname === "/rest/v1/ps99_hatch_alerts") {
      reportQueries.push(url);
      return Response.json([{
        id: "00000000-0000-0000-0000-000000000001",
        discord_user_id: "123456789012345678",
        roblox_user_id: 1,
        roblox_username: "Tester",
        period_start: "2026-08-19T11:45:00.000Z",
        period_end: "2026-08-19T12:00:00.000Z",
        tier: "huge",
        item_key: "huge-test",
        display_name: "Huge Test",
        variant: "Normal",
        delta: 1,
        rap: 1_000_000,
        created_at: "2026-08-19T12:00:01.000Z"
      }]);
    }
    return Response.json({ message: "Not found" }, { status: 404 });
  }
});
new vm.Script(source, { filename: "inventory-detector-worker.js" }).runInContext(context);

const {
  htgV2State,
  htgV2FreshnessDecision,
  htgV2PendingFromCandidates,
  htgV2CandidatesNeedConfirmation,
  htgV2ScheduleDecision,
  htgForceRefreshOnSchedule,
  htgUserShard,
  oauthGrantKey,
  htgProviderRefreshUnits,
  hatchTier,
  hatchTrackerMetadataWithGuildSubscription,
  hatchTrackerEnabledTiersForGuild,
  hatchTrackerGuildIdsForTier,
  hatchTrackerHasEnabledGuildSubscription,
  buildHatchAlertDiscordPayload,
  hatchExistsCount,
  hatchAuthorizationHasExpired,
  hatchAuthorizationExpiryNoticeGuildIdsNeeded,
  hatchTrackerMetadataWithAuthorizationExpiryNotice
} = context;

const reportPeriod = context.hatchReportPeriod("week", "2026-08-20T12:00:00.000Z");
assert.equal(reportPeriod.start_at, "2026-08-13T12:00:00.000Z", "weekly HTG reports must use a rolling seven-day window");
assert.throws(() => context.hatchReportPeriod("year"), /day, week, or month/, "yearly HTG reports must remain unavailable to bound query size");
const reportSummary = context.buildHatchReportSummary([
  {
    tier: "huge",
    item_key: "huge-test",
    display_name: "Huge Test",
    variant: "Normal",
    roblox_user_id: "1",
    roblox_username: "Tester",
    delta: 1,
    rap: 1_000_000,
    period_end: "2026-08-18T12:00:00.000Z"
  },
  {
    tier: "huge",
    item_key: "huge-test",
    display_name: "Huge Test",
    variant: "Normal",
    roblox_user_id: "1",
    roblox_username: "Tester",
    delta: 2,
    rap: 1_250_000,
    period_end: "2026-08-19T12:00:00.000Z"
  },
  {
    tier: "titanic",
    item_key: "titanic-test",
    display_name: "Titanic Test",
    variant: "Normal",
    roblox_user_id: "2",
    roblox_username: "Alt",
    delta: 1,
    rap: 5_000_000_000,
    period_end: "2026-08-20T10:00:00.000Z"
  }
], reportPeriod);
assert.equal(reportSummary.total_quantity, 4, "HTG reports must total acquired copies rather than alert rows");
assert.equal(reportSummary.acquisition_count, 3, "HTG reports must retain the number of recorded acquisition events");
assert.equal(reportSummary.items.length, 2, "repeated acquisitions of the same item and account must be grouped");
assert.equal(reportSummary.items.find(item => item.item_key === "huge-test").quantity, 3);
assert.equal(reportSummary.tier_totals.titanic, 1);
const reportResponse = await context.__worker.fetch(new Request(
  "https://inventory.test/api/hatch/report?discord_user_id=123456789012345678&timeframe=month",
  { headers: { authorization: "Bearer test-admin" } }
), {
  INGEST_ADMIN_TOKEN: "test-admin",
  SUPABASE_URL: "https://supabase.test",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role"
});
assert.equal(reportResponse.status, 200, "the authenticated HTG report endpoint must answer successfully");
const reportPayload = await reportResponse.json();
assert.equal(reportPayload.timeframe, "month");
assert.equal(reportPayload.total_quantity, 1);
assert.equal(reportQueries.length, 1, "the HTG report endpoint should require only one indexed alert-history query for a small result");
assert.equal(reportQueries[0].searchParams.get("discord_user_id"), "eq.123456789012345678");
assert.match(reportQueries[0].searchParams.get("period_end"), /^gte\./, "the report query must remain bounded by its rolling start time");

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
const legacySubscription = {
  enabled: true,
  metadata: {
    guild_subscriptions: {
      [coldGuild]: { enabled: true, tiers: ["huge"] }
    }
  }
};
assert.equal(
  hatchTrackerHasEnabledGuildSubscription(legacySubscription, coldGuild),
  false,
  "pre-consent subscriptions must not keep posting until the member explicitly re-enables in that server"
);
const reenabledMetadata = hatchTrackerMetadataWithGuildSubscription(
  legacySubscription.metadata,
  coldGuild,
  ["huge"],
  true
);
assert.equal(
  hatchTrackerHasEnabledGuildSubscription({ enabled: true, metadata: reenabledMetadata }, coldGuild),
  true,
  "an explicit re-enable must reactivate only that server subscription"
);
assert.equal(
  hatchTier({ display_name: "Huge Druid Owl", item_class: "Pet", raw: { tradeable: false } }),
  "huge",
  "an untradable Huge reward must still be classified as a Huge"
);
assert.equal(
  hatchExistsCount({ raw: { exists: 312 } }),
  312,
  "the alert must use BIG Games' enriched global exists count rather than the owner's quantity"
);
const alertPreview = buildHatchAlertDiscordPayload(
  { discord_user_id: "123456789012345678" },
  { username: "Tester", user_id: "1" },
  {
    tier: "titanic",
    display_name: "Titanic Test",
    delta: 1,
    rap: 1_500_000,
    image_url: "https://example.test/titanic.png",
    raw: { exists: 312 }
  },
  [],
  []
);
const alertPreviewText = alertPreview.components[0].components[0].components[0].content;
assert.match(alertPreviewText, /^:milky_way: \*\*Tester acquired a Titanic Test\*\* :sparkles:/, "each tier should retain its distinct alert emoji and the title sparkle");
assert.match(alertPreviewText, /\*\*Exists:\*\* 312/, "HTG alerts should include the exact global Exists count below RAP");

const expiredTracker = {
  ...scopedTracker,
  authorization_expires_at: "2026-08-06T00:00:00.000Z"
};
assert.equal(
  hatchAuthorizationHasExpired(expiredTracker, new Date("2026-08-06T00:01:00.000Z")),
  true,
  "an expired grant must be skipped before the scheduled inventory scan"
);
assert.equal(
  hatchAuthorizationHasExpired({ ...expiredTracker, authorization_expires_at: "2026-08-06T01:00:00.000Z" }, new Date("2026-08-06T00:01:00.000Z")),
  false,
  "a renewed grant must become eligible for normal HTG scans again"
);
assert.deepEqual(
  Array.from(hatchAuthorizationExpiryNoticeGuildIdsNeeded(expiredTracker, new Date("2026-08-06T00:01:00.000Z"))),
  [coldGuild, lunaGuild],
  "an expired authorization should notify each explicitly enabled server once"
);
const expiryNoticeMetadata = hatchTrackerMetadataWithAuthorizationExpiryNotice(
  expiredTracker.metadata,
  expiredTracker.authorization_expires_at,
  [coldGuild, lunaGuild],
  "2026-08-06T00:01:00.000Z"
);
assert.deepEqual(
  Array.from(hatchAuthorizationExpiryNoticeGuildIdsNeeded(
    { ...expiredTracker, metadata: expiryNoticeMetadata },
    new Date("2026-08-06T00:02:00.000Z")
  )),
  [],
  "an expiry reminder must not repost on each scheduled scan"
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
  htgV2State({ metadata: { htg_v2: { baseline: { captured_at: "2026-08-06T00:00:00.000Z", items: [] } } } }).reset_required,
  true,
  "a pre-confirmed-baseline tracker must take one silent fresh baseline after the rollout"
);
assert.equal(
  htgV2State({ metadata: { htg_v2: { baseline_schema_version: 3, baseline: { captured_at: "2026-08-06T00:00:00.000Z", items: [] } } } }).reset_required,
  false,
  "a current confirmed-baseline tracker must remain armed after restart"
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
assert.equal(
  htgV2CandidatesNeedConfirmation([{ ...firstCandidates[0], hatch_verification: "first_owner_log" }]),
  true,
  "even a unique first-owner log must survive a second fresh inventory revision before it can alert"
);
assert.equal(
  htgV2CandidatesNeedConfirmation(firstCandidates),
  true,
  "an item without a unique owner-log must still wait for the later fresh revision"
);

const env = { HTG_SCAN_INTERVAL_MINUTES: "15", HATCH_FORCE_REFRESH_ON_SCHEDULE: "false", HTG_REFRESH_QUOTA_LIMIT: "96" };
assert.equal(
  htgForceRefreshOnSchedule(env),
  true,
  "the legacy false switch must not leave HTG reading cached inventory forever"
);
assert.equal(
  htgForceRefreshOnSchedule({ HTG_DISABLE_FORCED_REFRESH: "true" }),
  false,
  "the explicit diagnostic opt-out must remain available"
);
assert.notEqual(
  oauthGrantKey("109818", "hatch_tracker"),
  oauthGrantKey("109818", "inventory"),
  "normal inventory OAuth must never overwrite a hatch-tracker authorization"
);
const tracker = { metadata: { htg_v2: { last_attempt_at: "2026-08-06T00:00:00.000Z" } } };
const unscannedTracker = { metadata: { htg_v2: {} } };
const scheduleUserId = "109818";
const scheduleOffset = htgUserShard(scheduleUserId, 15);
const atAssignedMinute = minute => new Date(Date.UTC(2026, 7, 6, 0, minute, 0));
const atNonAssignedMinute = (scheduleOffset + 1) % 15;
// A real account's prior attempt happens at its own assigned minute, not
// necessarily at :00. Model that explicitly so the quota-window assertions
// remain correct for every possible account offset.
tracker.metadata.htg_v2.last_attempt_at = atAssignedMinute(scheduleOffset).toISOString();
assert.equal(
  htgV2ScheduleDecision(env, unscannedTracker, scheduleUserId, atAssignedMinute(atNonAssignedMinute), { ignoreShard: true }).due,
  false,
  "an initial HTG baseline must wait for its assigned minute within the scan window"
);
assert.equal(
  htgV2ScheduleDecision(env, unscannedTracker, scheduleUserId, atAssignedMinute(scheduleOffset), { ignoreShard: true }).due,
  true,
  "an initial HTG baseline must start at the account's stable assigned minute"
);
const schedule = htgV2ScheduleDecision(env, tracker, scheduleUserId, atAssignedMinute(15 + scheduleOffset), { ignoreShard: true });
assert.equal(schedule.due, false, "an account with no reported limit must begin at standard-account pace");
assert.equal(schedule.interval_minutes, 35, "an unknown account must reserve six of the 48 standard daily refreshes");
assert.equal(
  htgV2ScheduleDecision(env, tracker, scheduleUserId, atAssignedMinute(30 + scheduleOffset), { ignoreShard: true }).due,
  false,
  "a due account must wait for its assigned minute instead of drifting to an arbitrary minute"
);
assert.equal(
  htgV2ScheduleDecision(env, tracker, scheduleUserId, atAssignedMinute(45 + scheduleOffset), { ignoreShard: true }).due,
  true,
  "the next standard-account attempt must run in the next assigned scan window"
);

const vipTracker = { metadata: { htg_v2: { last_attempt_at: atAssignedMinute(scheduleOffset).toISOString(), refresh_quota: { limit: 96, used: 0, resets_at: "2026-08-07T00:00:00.000Z" } } } };
assert.equal(
  htgV2ScheduleDecision(env, vipTracker, scheduleUserId, atAssignedMinute(15 + scheduleOffset), { ignoreShard: true }).due,
  false,
  "a VIP account with a safety reserve must wait for its next quota-safe assigned slot"
);
assert.equal(
  htgV2ScheduleDecision(env, vipTracker, scheduleUserId, atAssignedMinute(30 + scheduleOffset), { ignoreShard: true }).due,
  true,
  "an API-confirmed VIP account must run in its next quota-safe assigned window"
);
const vipFastEnv = { ...env, HTG_REFRESH_QUOTA_RESERVE: "0" };
assert.equal(
  htgV2ScheduleDecision(vipFastEnv, vipTracker, scheduleUserId, atAssignedMinute(15 + scheduleOffset), { ignoreShard: true }).due,
  true,
  "a confirmed VIP account with no reserve can use its assigned minute in every window"
);
assert.equal(htgProviderRefreshUnits({ consumedThisCall: true }), 1, "the provider's explicit debit must be counted");
assert.equal(htgProviderRefreshUnits({ consumedThisCall: false }), 0, "a cached response must not be recorded as a quota debit");

console.log("HTG v2 state-machine tests passed");
