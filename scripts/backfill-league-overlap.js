#!/usr/bin/env node
"use strict";

const DEFAULT_WORKER = "https://yamo-league-api-worker.opal-dde.workers.dev";
const DEFAULT_RUN = "plants-vs-coins-part-2";
const DEFAULT_TOP_LIMIT = 10000;
const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_DELAY_MS = 250;

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find(value => value.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function numberArg(name, fallback) {
  const parsed = Number(arg(name, fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clanPlan() {
  const raw = String(arg("clans", "c0ld,WMSY"))
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  return raw.map(clan => ({
    clan,
    start: numberArg(`start-${clan.toLowerCase()}`, 0)
  }));
}

async function getJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  }
  return data;
}

async function scanWindow(options) {
  const url = new URL("/api/leagues/c0ld-overlap", options.worker);
  url.searchParams.set("clan", options.clan);
  url.searchParams.set("run", options.run);
  url.searchParams.set("top_limit", String(options.topLimit));
  url.searchParams.set("offset", String(options.offset));
  url.searchParams.set("limit", String(options.batchSize));
  url.searchParams.set("concurrency", String(options.concurrency));
  return getJson(url);
}

async function main() {
  const worker = arg("worker", DEFAULT_WORKER);
  const run = arg("run", DEFAULT_RUN);
  const topLimit = numberArg("top-limit", DEFAULT_TOP_LIMIT);
  const batchSize = numberArg("batch-size", DEFAULT_BATCH_SIZE);
  const concurrency = numberArg("concurrency", DEFAULT_CONCURRENCY);
  const delayMs = numberArg("delay-ms", DEFAULT_DELAY_MS);
  const summary = new Map();

  for (const plan of clanPlan()) {
    for (let offset = plan.start; offset < topLimit; offset += batchSize) {
      const key = plan.clan;
      const current = summary.get(key) || { scanned: 0, matched: 0, upserted: 0, errorBatches: 0 };
      try {
        const result = await scanWindow({
          worker,
          run,
          topLimit,
          batchSize,
          concurrency,
          clan: plan.clan,
          offset
        });
        const errors = Array.isArray(result.scan_errors) ? result.scan_errors.length : 0;
        current.scanned += Number(result.scanned_count) || 0;
        current.matched += Number(result.matched_count) || 0;
        current.upserted += Number(result.discovered_upserted) || 0;
        if (errors) current.errorBatches += 1;
        if (offset % 1000 === 0 || result.matched_count || result.discovered_upserted || errors) {
          console.log(`${plan.clan} offset ${offset}: scanned ${result.scanned_count}, matched ${result.matched_count}, upserted ${result.discovered_upserted}, errors ${errors}`);
        }
      } catch (err) {
        current.errorBatches += 1;
        console.warn(`${plan.clan} offset ${offset}: ${err.message || String(err)}`);
      }
      summary.set(key, current);
      if (delayMs > 0) await sleep(delayMs);
    }
  }

  console.log(JSON.stringify(Object.fromEntries(summary), null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
