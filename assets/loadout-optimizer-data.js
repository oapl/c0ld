(function (root) {
  "use strict";

  const data = {
    version: "planning-v2",
    modelLabel: "Planning model with bundled catalog and optional live enrichment",
    catalogEndpoint: "https://biggamesapi.io/api/collection/Enchants",
    copyWeights: [1, 0.68, 0.46, 0.32, 0.22, 0.15, 0.1, 0.07, 0.05],
    enchants: [
      {
        id: "strong-pets-ix",
        name: "Strong Pets IX",
        category: "Damage",
        stackGroup: "pet-damage",
        color: "#ff7b72",
        initials: "SP",
        normal: { damagePct: 100 },
        empowered: { damagePct: 130 },
        notes: "Starter planning value for direct pet damage. Replace with the exact decompile value before treating results as game-accurate."
      },
      {
        id: "criticals-ix",
        name: "Criticals IX",
        category: "Damage",
        stackGroup: "critical-chance",
        color: "#f2cc60",
        initials: "CR",
        normal: { critChancePct: 45 },
        empowered: { critChancePct: 60 },
        notes: "Adds modeled critical chance. Expected damage uses the critical multiplier configured in Combat inputs."
      },
      {
        id: "speed-v",
        name: "Speed V",
        category: "Damage",
        stackGroup: "attack-speed",
        color: "#79c0ff",
        initials: "SV",
        normal: { attackSpeedPct: 25 },
        empowered: { attackSpeedPct: 35 },
        notes: "Modeled as attack throughput. It affects damage-limited breakables when that option is enabled."
      },
      {
        id: "super-lightning",
        name: "Super Lightning",
        category: "Damage",
        stackGroup: "area-damage",
        color: "#d2a8ff",
        initials: "SL",
        normal: { areaDamagePct: 65 },
        empowered: { areaDamagePct: 90 },
        notes: "Planning proxy for area damage and extra breakable throughput. Exact targeting and proc behavior require decompile data."
      },
      {
        id: "explosive",
        name: "Explosive",
        category: "Damage",
        stackGroup: "area-damage",
        color: "#ffa657",
        initials: "EX",
        normal: { areaDamagePct: 45 },
        empowered: { areaDamagePct: 62 },
        notes: "Planning proxy for area damage. Shares a diminishing-return group with other area-damage enchants."
      },
      {
        id: "lucky-eggs-ix",
        name: "Lucky Eggs IX",
        category: "Luck",
        stackGroup: "egg-luck",
        color: "#56d364",
        initials: "LE",
        normal: { luckPct: 100 },
        empowered: { luckPct: 130 },
        notes: "Starter egg-luck value. The egg model divides affected one-in-N odds by the resulting luck multiplier."
      },
      {
        id: "shiny-hunter",
        name: "Shiny Hunter",
        category: "Luck",
        stackGroup: "shiny-luck",
        color: "#a5d6ff",
        initials: "SH",
        normal: { shinyLuckPct: 80 },
        empowered: { shinyLuckPct: 110 },
        notes: "Tracked separately from ordinary egg luck so shiny odds can be modeled independently when supplied."
      },
      {
        id: "treasure-hunter-ix",
        name: "Treasure Hunter IX",
        category: "Drops",
        stackGroup: "item-drops",
        color: "#e3b341",
        initials: "TH",
        normal: { dropPct: 80 },
        empowered: { dropPct: 110 },
        notes: "Starter item-drop modifier. Exact item pools, proc rules, and zone-specific rates require decompile data."
      },
      {
        id: "fruity",
        name: "Fruity",
        category: "Hybrid",
        stackGroup: "fruit-effect",
        color: "#db61a2",
        initials: "FR",
        normal: { damagePct: 20, luckPct: 20, dropPct: 20 },
        empowered: { damagePct: 28, luckPct: 28, dropPct: 28 },
        notes: "Planning hybrid effect for fruit-supported damage, luck, and drops. Replace all three values with exact game behavior."
      },
      {
        id: "chest-mimic",
        name: "Chest Mimic",
        category: "Drops",
        stackGroup: "spawn-proc",
        color: "#ff9b96",
        initials: "CM",
        normal: { dropPct: 140 },
        empowered: { dropPct: 180 },
        notes: "Simplified drop-throughput proxy. Spawn cadence, health, and loot tables are not represented until imported."
      },
      {
        id: "massive-comet",
        name: "Massive Comet",
        category: "Drops",
        stackGroup: "spawn-proc",
        color: "#7ee787",
        initials: "MC",
        normal: { damagePct: 35, dropPct: 95 },
        empowered: { damagePct: 48, dropPct: 130 },
        notes: "Simplified damage-and-drop proxy for a spawned event. Exact cadence and rewards require decompile data."
      },
      {
        id: "fortune",
        name: "Fortune",
        category: "Drops",
        stackGroup: "currency-drops",
        color: "#f0f6fc",
        initials: "FO",
        normal: { currencyPct: 75 },
        empowered: { currencyPct: 100 },
        notes: "Currency-only planning modifier. It is reported separately and does not inflate item drop counts."
      }
    ],
    eggTiers: [
      { id: "common", name: "Common", oneIn: 2, strength: 1, luckAffected: false },
      { id: "rare", name: "Rare", oneIn: 25, strength: 3, luckAffected: true },
      { id: "epic", name: "Epic", oneIn: 250, strength: 8, luckAffected: true },
      { id: "event", name: "Event Huge", oneIn: 1000000, strength: 2500, luckAffected: true }
    ]
  };

  const tieredFamilies = [
    ["Tap Power", "Damage"],
    ["Strong Pets", "Damage"],
    ["Criticals", "Damage"],
    ["Treasure Hunter", "Drops"],
    ["Coins", "Currency"],
    ["Diamonds", "Currency"],
    ["Lucky Eggs", "Luck"]
  ];
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
  const standalone = [
    ["Swift Tap", "Damage"], ["Tap Teamwork", "Damage"], ["Speed I", "Damage"],
    ["Speed II", "Damage"], ["Speed III", "Damage"], ["Speed IV", "Damage"],
    ["Magnet I", "Utility"], ["Magnet II", "Utility"], ["Magnet III", "Utility"],
    ["Super Magnet", "Utility"], ["Fortune", "Drops"], ["Fruity", "Hybrid"],
    ["Shiny Hunter", "Luck"], ["Chest Mimic", "Drops"], ["Boss Chest Mimic", "Drops"],
    ["Superior Chest Mimic", "Drops"], ["Mini Chest Fortune", "Drops"],
    ["Massive Comet", "Drops"], ["Lucky Block", "Drops"], ["Boss Lucky Block", "Drops"],
    ["Diamond Gift Hunter", "Drops"], ["Hidden Treasure", "Drops"],
    ["Chest Breaker", "Damage"], ["Super Lightning", "Damage"], ["Lightning Orb", "Damage"],
    ["Explosive", "Damage"], ["Fireworks", "Damage"], ["Happy Pets", "Damage"],
    ["Corruption", "Damage"], ["Pet Surge", "Damage"], ["Coins Chest Mimic", "Drops"],
    ["Diamond Chest Mimic", "Drops"], ["Party Time", "Drops"], ["Demonic", "Damage"],
    ["Angellic", "Damage"], ["Midas Touch", "Currency"], ["Royalty", "Hybrid"],
    ["Glittering", "Currency"], ["Agility", "Damage"], ["Strength", "Damage"],
    ["Companion", "Damage"], ["Cartoon Coins", "Currency"], ["Tech Coins", "Currency"],
    ["Fantasy Coins", "Currency"], ["Coins", "Currency"], ["Diamonds", "Currency"]
  ];

  function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function addCatalogStub(name, category) {
    if (data.enchants.some(enchant => enchant.name.toLowerCase() === name.toLowerCase())) return;
    const id = `catalog-${slug(name)}`;
    data.enchants.push({
      id,
      name,
      category,
      stackGroup: id,
      color: "#8b949e",
      initials: name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase(),
      normal: {},
      empowered: {},
      notes: "Catalog entry only. Add verified normal and empowered effects before using it in calculations."
    });
  }

  tieredFamilies.forEach(([family, category]) => {
    roman.forEach(tier => addCatalogStub(`${family} ${tier}`, category));
  });
  standalone.forEach(([name, category]) => addCatalogStub(name, category));

  root.C0LD_LOADOUT_DATA = data;
})(typeof window !== "undefined" ? window : globalThis);
