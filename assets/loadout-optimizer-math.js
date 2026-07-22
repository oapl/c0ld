(function (root) {
  "use strict";

  const EFFECT_KEYS = [
    "damagePct",
    "critChancePct",
    "attackSpeedPct",
    "areaDamagePct",
    "luckPct",
    "shinyLuckPct",
    "dropPct",
    "currencyPct"
  ];

  const DURATIONS = [
    { key: "hour", label: "1 Hour", minutes: 60 },
    { key: "sixHours", label: "6 Hours", minutes: 360 },
    { key: "twelveHours", label: "12 Hours", minutes: 720 },
    { key: "day", label: "1 Day", minutes: 1440 },
    { key: "week", label: "1 Week", minutes: 10080 },
    { key: "month", label: "30 Days", minutes: 43200 }
  ];

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, number(value, min)));
  }

  function combineLoadout(loadout, catalog, copyWeights) {
    const catalogMap = new Map((catalog || []).map(item => [item.id, item]));
    const stackCounts = new Map();
    const totals = Object.fromEntries(EFFECT_KEYS.map(key => [key, 0]));
    const applied = [];

    for (const slot of loadout || []) {
      const enchant = catalogMap.get(slot?.enchantId);
      if (!enchant) continue;

      const group = enchant.stackGroup || enchant.id;
      const copyIndex = stackCounts.get(group) || 0;
      const weight = number(copyWeights?.[copyIndex], copyIndex === 0 ? 1 : 0);
      const mode = slot.empowered ? "empowered" : "normal";
      const effects = enchant[mode] || {};

      stackCounts.set(group, copyIndex + 1);
      for (const key of EFFECT_KEYS) totals[key] += number(effects[key]) * weight;
      applied.push({ enchant, mode, copyIndex, weight, effects });
    }

    return { totals, applied, stackCounts };
  }

  function calculateCombat(totals, inputs) {
    const baseDamage = Math.max(0, number(inputs?.baseDamage, 1));
    const baseCritChance = clamp(inputs?.baseCritChancePct, 0, 100);
    const critMultiplier = Math.max(1, number(inputs?.critMultiplier, 5));
    const effectiveCritChance = clamp(baseCritChance + number(totals?.critChancePct), 0, 100);
    const directMultiplier = 1 + number(totals?.damagePct) / 100;
    const critExpectedMultiplier = 1 + (effectiveCritChance / 100) * (critMultiplier - 1);
    const attackSpeedMultiplier = 1 + number(totals?.attackSpeedPct) / 100;
    const areaMultiplier = 1 + number(totals?.areaDamagePct) / 100;
    const damagePerHit = baseDamage * directMultiplier;
    const expectedDamagePerHit = damagePerHit * critExpectedMultiplier;
    const throughputDamage = expectedDamagePerHit * attackSpeedMultiplier * areaMultiplier;

    return {
      baseDamage,
      effectiveCritChance,
      directMultiplier,
      critExpectedMultiplier,
      attackSpeedMultiplier,
      areaMultiplier,
      damagePerHit,
      expectedDamagePerHit,
      throughputDamage,
      throughputMultiplier: baseDamage > 0 ? throughputDamage / baseDamage : 0
    };
  }

  function adjustedOneIn(baseOneIn, luckAffected, luckPct) {
    const odds = Math.max(1, number(baseOneIn, 1));
    if (!luckAffected) return odds;
    return Math.max(1, odds / Math.max(1, 1 + number(luckPct) / 100));
  }

  function probabilityAtLeastOne(expectedCount) {
    return 1 - Math.exp(-Math.max(0, number(expectedCount)));
  }

  function calculateEggs(totals, inputs, tiers, durations = DURATIONS) {
    const hatchesPerRoll = clamp(inputs?.hatchesPerRoll, 1, 144);
    const rollsPerMinute = Math.max(0, number(inputs?.rollsPerMinute));
    const costPerEgg = Math.max(0, number(inputs?.costPerEgg));
    const luckPct = number(totals?.luckPct);

    return durations.map(duration => {
      const rolls = rollsPerMinute * duration.minutes;
      const hatches = rolls * hatchesPerRoll;
      const tierResults = (tiers || []).map(tier => {
        const oneIn = adjustedOneIn(tier.oneIn, tier.luckAffected, luckPct);
        const expected = hatches / oneIn;
        return {
          ...tier,
          adjustedOneIn: oneIn,
          expected,
          chanceAtLeastOne: probabilityAtLeastOne(expected),
          expectedStrength: expected * Math.max(0, number(tier.strength))
        };
      });

      return {
        ...duration,
        rolls,
        hatches,
        cost: hatches * costPerEgg,
        expectedStrength: tierResults.reduce((sum, tier) => sum + tier.expectedStrength, 0),
        tiers: tierResults
      };
    });
  }

  function calculateDrops(totals, combat, inputs, durations = DURATIONS) {
    const baseBreakablesPerMinute = Math.max(0, number(inputs?.breakablesPerMinute));
    const damageLimited = Boolean(inputs?.damageLimited);
    const breakableMultiplier = damageLimited ? Math.max(0, number(combat?.throughputMultiplier, 1)) : 1;
    const effectiveBreakablesPerMinute = baseBreakablesPerMinute * breakableMultiplier;
    const oneIn = Math.max(1, number(inputs?.baseDropOneIn, 1));
    const itemsPerDrop = Math.max(0, number(inputs?.itemsPerDrop, 1));
    const valuePerDrop = Math.max(0, number(inputs?.valuePerDrop));
    const dropMultiplier = Math.max(0, 1 + number(totals?.dropPct) / 100);
    const currencyMultiplier = Math.max(0, 1 + number(totals?.currencyPct) / 100);

    return {
      effectiveBreakablesPerMinute,
      breakableMultiplier,
      dropMultiplier,
      currencyMultiplier,
      durations: durations.map(duration => {
        const breakables = effectiveBreakablesPerMinute * duration.minutes;
        const drops = (breakables / oneIn) * itemsPerDrop * dropMultiplier;
        return {
          ...duration,
          breakables,
          drops,
          value: drops * valuePerDrop,
          currencyWeightedValue: drops * valuePerDrop * currencyMultiplier
        };
      })
    };
  }

  root.C0LDLoadoutMath = {
    EFFECT_KEYS,
    DURATIONS,
    number,
    clamp,
    combineLoadout,
    calculateCombat,
    calculateEggs,
    calculateDrops,
    adjustedOneIn,
    probabilityAtLeastOne
  };
})(typeof window !== "undefined" ? window : globalThis);
