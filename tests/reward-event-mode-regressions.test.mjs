import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../cloudflare/c0ld-clan-api-worker.js", import.meta.url), "utf8")
  .replace("export default {", "globalThis.__worker = {");
const api = vm.createContext({
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
new vm.Script(source, { filename: "c0ld-clan-api-worker.js" }).runInContext(api);

const now = Date.parse("2026-08-20T17:00:00.000Z");
const freshLeague = {
  league_run_key: "plants-vs-coins-part-2",
  league_run_label: "Fiesta Part 2",
  snapshot_at: "2026-08-20T16:48:00.000Z",
  rows: [{ rank: 1, points: 99_000_000, available: true }]
};
assert.equal(
  api.leagueLeaderboardSnapshotIsActive(freshLeague, {}, now),
  true,
  "fresh current-run League milestones must activate League mode even without a configured collection window"
);
assert.equal(
  api.leagueLeaderboardSnapshotIsActive({ ...freshLeague, snapshot_at: "2026-08-20T14:00:00.000Z" }, {}, now),
  false,
  "stale retained League data must not reactivate an ended League"
);
assert.equal(
  api.leagueLeaderboardSnapshotIsActive({ ...freshLeague, league_end_at: "2026-08-20T16:59:00.000Z" }, {}, now),
  false,
  "an explicit League end remains authoritative"
);

const message = api.rewardCutoffDiscordPayload({
  generated_at: "2026-08-20T16:48:00.000Z",
  event_mode: "leagues",
  players: { cutoffs: [] },
  clans: {
    battle_is_active: false,
    ranks: [1, 3],
    reward_categories: [{ rank: 1, label: "#1" }, { rank: 3, label: "#2-3" }],
    cutoffs: []
  },
  leagues: {
    league_run_key: "plants-vs-coins-part-2",
    league_run_label: "Fiesta Part 2",
    snapshot_at: "2026-08-20T16:48:00.000Z",
    ranks: [1, 3],
    cutoffs: [
      { rank: 1, points: 50_000_000, available: true },
      { rank: 3, points: 25_000_000, available: true }
    ]
  },
  league_players: {
    league_run_key: "plants-vs-coins-part-2",
    league_run_label: "Fiesta Part 2",
    snapshot_at: "2026-08-20T16:48:00.000Z",
    cutoffs: [{ rank: 1, points: 12_000_000, available: true }]
  }
});
const rendered = JSON.stringify(message);
assert.match(rendered, /Global Leaderboard \(League\)/);
assert.doesNotMatch(rendered, /Global Leaderboard \(Clan Battle\)/);
assert.match(rendered, /Clan Rewards[^]*#1:\*\* —/);
assert.match(rendered, /League Rewards[^]*50,000,000 pts/);

console.log("Reward event-mode regression tests passed");
