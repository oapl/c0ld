import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../cloudflare/c0ld-clan-api-worker.js", import.meta.url), "utf8")
  .replace("export default {", "globalThis.__worker = {");
const worker = vm.createContext({
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
  fetch: async () => Response.json({ status: "ok", data: {} })
});
new vm.Script(source, { filename: "c0ld-clan-api-worker.js" }).runInContext(worker);

const arrayShape = worker.normalizeMembers({
  Members: [{ UserID: 123, PermissionLevel: 10 }],
  DiamondContributions: {
    AllTime: [{ UserID: 123, Diamonds: 5_000_000 }]
  }
}, {});
assert.equal(arrayShape.length, 1);
assert.equal(arrayShape[0].raw_member.DiamondContributions.AllTime, 5_000_000);
assert.deepEqual(
  JSON.parse(JSON.stringify(worker.clanActivityDiamondDonationObservation(arrayShape[0]))),
  { total: 5_000_000, path: "member.DiamondContributions.AllTime" }
);

const keyedShape = worker.normalizeMembers({
  Members: [{ UserID: 456 }],
  DiamondContributions: { AllTime: { "456": 9_250_000 } }
}, {});
assert.equal(keyedShape[0].raw_member.DiamondContributions.AllTime, 9_250_000);

const noDonationData = worker.normalizeMembers({
  Members: [{ UserID: 789 }],
  DepositedDiamonds: 999_999_999
}, {});
assert.equal(
  worker.clanActivityDiamondDonationObservation(noDonationData[0]).total,
  null,
  "the clan-wide deposited total must never be attributed to an individual member"
);

const previousUser = {
  user_id: "123",
  username: "Donor",
  permission_level: 10,
  raw_member: { DiamondContributions: { AllTime: 5_000_000 } },
  raw_contribution: {}
};
const currentUser = {
  ...previousUser,
  raw_member: { DiamondContributions: { AllTime: 7_250_000 } }
};
const delta = worker.clanActivityIncrements({
  clanRow: { clan_name: "C0LD", rank: 3, points: 100_000 },
  currentByUser: new Map([["123", currentUser]]),
  previousClanByUser: new Map([["123", previousUser]]),
  previousSummary: { clan_rank: 3, kick_available: true },
  fetchedAt: "2026-08-21T18:00:00.000Z",
  battleKey: "NinjaBattle2026",
  battleMeta: { displayName: "Ninja Battle 2026" },
  source: "test",
  kickAvailable: true
});
assert.equal(delta.events.length, 1);
assert.equal(delta.events[0].event_type, "diamond_donation");
assert.equal(delta.events[0].details.diamond_donation_amount, 2_250_000);
assert.equal(delta.events[0].details.diamond_donation_total, 7_250_000);

const initialBaseline = worker.clanActivityIncrements({
  clanRow: { clan_name: "C0LD", rank: 3, points: 100_000 },
  currentByUser: new Map([["123", currentUser]]),
  previousClanByUser: new Map(),
  previousSummary: null,
  fetchedAt: "2026-08-21T18:00:00.000Z",
  battleKey: "NinjaBattle2026",
  battleMeta: { displayName: "Ninja Battle 2026" },
  source: "test",
  kickAvailable: true
});
assert.equal(initialBaseline.events.length, 0, "the first observed total establishes a baseline and must not replay old donations");

console.log("clan-log diamond donation regression checks passed");
