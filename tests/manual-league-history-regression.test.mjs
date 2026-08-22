import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../cloudflare/yamo-league-api-worker.js", import.meta.url), "utf8")
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
new vm.Script(source, { filename: "yamo-league-api-worker.js" }).runInContext(leagueApi);

const summary = leagueApi.summarizeLeagueProfileGroup([{
  league_run_key: "active",
  fetched_at: "2026-05-30T15:59:59.000Z",
  source: "manual_league_history",
  league_name: "YAMO",
  league_id: "manual:yamo:rng-2026",
  league_points: 0,
  member_capacity: 4,
  rank: 1,
  user_id: 463900811,
  display_name: "AgentP_0928",
  points: 0
}], {}, {
  key: "rng-2026",
  name: "RNG",
  start_at: "2026-05-16T16:00:00.000Z",
  end_at: "2026-05-30T16:00:00.000Z"
});

assert.equal(summary.roster_only, true);
assert.equal(summary.final_points, null, "manual roster-only rows must not expose structural zeroes as real points");
assert.equal(summary.highest_points, null);
assert.equal(summary.final_rank, null, "the supplied roster order must not become a fabricated member rank");
assert.equal(summary.best_rank, null);
assert.equal(summary.league_points, null);
assert.equal(summary.league_name, "YAMO");

console.log("manual League history regression checks passed");
