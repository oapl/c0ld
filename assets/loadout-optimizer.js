(function () {
  "use strict";

  const baseData = window.C0LD_LOADOUT_DATA;
  const math = window.C0LDLoadoutMath;
  if (!baseData || !math) return;

  const STORAGE_KEY = "c0ld.loadoutOptimizer.v1";
  const MAX_SLOTS = 9;
  const OFFICIAL_CATALOG_URL = baseData.catalogEndpoint || "https://biggamesapi.io/api/collection/Enchants";
  const EFFECT_LABELS = {
    damagePct: "damage",
    critChancePct: "critical chance",
    attackSpeedPct: "attack speed",
    areaDamagePct: "area damage",
    luckPct: "egg luck",
    shinyLuckPct: "shiny luck",
    dropPct: "item drops",
    currencyPct: "currency"
  };

  const $ = id => document.getElementById(id);
  const clone = value => JSON.parse(JSON.stringify(value));

  const defaultState = () => ({
    model: clone(baseData),
    slotCount: 9,
    loadout: Array.from({ length: 9 }, () => null),
    activeView: "combat",
    inputs: {
      baseDamage: 100,
      baseCritChancePct: 0,
      critMultiplier: 5,
      hatchesPerRoll: 144,
      rollsPerMinute: 1,
      costPerEgg: 0,
      breakablesPerMinute: 30,
      baseDropOneIn: 20,
      itemsPerDrop: 1,
      valuePerDrop: 1,
      damageLimited: true
    }
  });

  let state = defaultState();
  let toastTimer = 0;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function finite(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function compact(value, digits = 2) {
    const number = finite(value);
    const absolute = Math.abs(number);
    const units = [
      [1e12, "T"],
      [1e9, "B"],
      [1e6, "M"],
      [1e3, "K"]
    ];
    for (const [size, suffix] of units) {
      if (absolute >= size) return `${trimNumber(number / size, digits)}${suffix}`;
    }
    return trimNumber(number, digits);
  }

  function trimNumber(value, digits = 2) {
    return finite(value).toLocaleString(undefined, {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0
    });
  }

  function percent(value, digits = 1) {
    return `${trimNumber(finite(value), digits)}%`;
  }

  function oneIn(value) {
    return `1 in ${compact(Math.max(1, finite(value, 1)), 2)}`;
  }

  function showToast(message, isError = false) {
    const toast = $("toast");
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function normalizedModel(candidate) {
    if (!candidate || !Array.isArray(candidate.enchants) || !Array.isArray(candidate.copyWeights)) {
      throw new Error("Game data must contain enchants and copyWeights arrays.");
    }

    const ids = new Set();
    const enchants = candidate.enchants.map((enchant, index) => {
      const id = String(enchant?.id || "").trim();
      const name = String(enchant?.name || "").trim();
      if (!id || !name || ids.has(id)) throw new Error(`Enchant ${index + 1} needs a unique id and name.`);
      ids.add(id);
      return {
        ...enchant,
        id,
        name,
        category: String(enchant.category || "Other"),
        stackGroup: String(enchant.stackGroup || id),
        normal: enchant.normal && typeof enchant.normal === "object" ? enchant.normal : {},
        empowered: enchant.empowered && typeof enchant.empowered === "object" ? enchant.empowered : {},
        notes: String(enchant.notes || "")
      };
    });

    const copyWeights = candidate.copyWeights.map(value => Math.max(0, finite(value)));
    if (!copyWeights.length) throw new Error("At least one copy weight is required.");

    const eggTiers = Array.isArray(candidate.eggTiers)
      ? candidate.eggTiers.map((tier, index) => normalizeTier(tier, index))
      : [];

    return {
      ...candidate,
      version: String(candidate.version || "custom"),
      modelLabel: String(candidate.modelLabel || "Custom model"),
      copyWeights,
      enchants,
      eggTiers
    };
  }

  function normalizeTier(tier, index) {
    return {
      id: String(tier?.id || `tier-${index + 1}`),
      name: String(tier?.name || `Tier ${index + 1}`),
      oneIn: Math.max(1, finite(tier?.oneIn, 1)),
      strength: Math.max(0, finite(tier?.strength, 0)),
      luckAffected: tier?.luckAffected !== false
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return;
      const savedModel = normalizedModel(saved.model || baseData);
      const bundledModel = normalizedModel(baseData);
      const existingNames = new Set(savedModel.enchants.map(item => item.name.toLowerCase()));
      const model = normalizedModel({
        ...savedModel,
        copyWeights: bundledModel.copyWeights,
        enchants: savedModel.enchants.concat(bundledModel.enchants.filter(item => !existingNames.has(item.name.toLowerCase())))
      });
      const slotCount = Math.round(math.clamp(saved.slotCount, 1, MAX_SLOTS));
      const validIds = new Set(model.enchants.map(enchant => enchant.id));
      const loadout = Array.from({ length: slotCount }, (_, index) => {
        const slot = saved.loadout?.[index];
        if (!slot || !validIds.has(slot.enchantId)) return null;
        return { enchantId: slot.enchantId, empowered: Boolean(slot.empowered) };
      });
      state = {
        ...defaultState(),
        ...saved,
        model,
        slotCount,
        loadout,
        inputs: { ...defaultState().inputs, ...(saved.inputs || {}) }
      };
    } catch (error) {
      console.warn("Could not load saved optimizer state.", error);
      state = defaultState();
    }
  }

  function renderCalculatorView() {
    const activeView = state.activeView || "combat";
    document.querySelectorAll("[data-calculator-view]").forEach(button => {
      button.classList.toggle("active", button.dataset.calculatorView === activeView);
    });
    document.querySelectorAll("[data-view-section]").forEach(section => {
      section.classList.toggle("view-hidden", activeView !== "all" && section.dataset.viewSection !== activeView);
    });
  }

  function catalogRows(payload) {
    const candidates = [
      payload?.data,
      payload?.data?.data,
      payload?.data?.items,
      payload?.items,
      payload?.collection,
      payload
    ];
    return candidates.find(Array.isArray) || [];
  }

  function officialEnchant(row, index) {
    const details = row?.configData || row?.data || row?.config || {};
    const name = String(row?.configName || row?.name || row?.Name || details?.Name || details?.name || "").trim();
    if (!name) return null;
    const id = `official-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || index + 1}`;
    return {
      id,
      name,
      category: String(row?.category || row?.Category || details?.Category || "Other"),
      stackGroup: id,
      color: "#8b949e",
      initials: name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase(),
      normal: {},
      empowered: {},
      notes: "Official BIG Games catalog entry. Effect values are not modeled until verified from game data."
    };
  }

  async function hydrateOfficialCatalog() {
    const source = $("catalog-source");
    try {
      const response = await fetch(OFFICIAL_CATALOG_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = String(response.headers.get("content-type") || "").toLowerCase();
      if (!contentType.includes("application/json")) {
        throw new Error(`Expected JSON catalog, received ${contentType || "an unknown content type"}`);
      }
      const rows = catalogRows(await response.json());
      if (!rows.length) throw new Error("The live catalog did not contain any enchant rows.");
      const knownNames = new Set(state.model.enchants.map(enchant => enchant.name.toLowerCase()));
      const additions = rows
        .map(officialEnchant)
        .filter(Boolean)
        .filter(enchant => {
          const key = enchant.name.toLowerCase();
          if (knownNames.has(key)) return false;
          knownNames.add(key);
          return true;
        });
      if (additions.length) {
        state.model = normalizedModel({
          ...state.model,
          enchants: state.model.enchants.concat(additions)
        });
        rerenderModel();
      }
      if (source) source.textContent = `BIG Games catalog + modeled data · ${state.model.enchants.length} enchants`;
    } catch (error) {
      console.warn("Could not refresh the BIG Games enchant catalog.", error);
      if (source) source.textContent = `Bundled catalog · ${state.model.enchants.length} enchants · live verification unavailable`;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Could not save optimizer state.", error);
    }
  }

  function effectEntries(effects) {
    return math.EFFECT_KEYS
      .filter(key => finite(effects?.[key]) !== 0)
      .map(key => ({ key, label: EFFECT_LABELS[key] || key, value: finite(effects[key]) }));
  }

  function effectSummary(effects, weight = 1) {
    const entries = effectEntries(effects);
    if (!entries.length) return "No modeled effect";
    return entries.map(entry => `+${trimNumber(entry.value * weight, 1)}% ${entry.label}`).join(" · ");
  }

  function enchantIcon(enchant) {
    return `<span class="enchant-icon" style="--enchant-color:${escapeHtml(enchant.color || "#8b949e")}">${escapeHtml(enchant.initials || enchant.name.slice(0, 2).toUpperCase())}</span>`;
  }

  function renderCategoryOptions() {
    const select = $("category-filter");
    const selected = select.value || "all";
    const categories = [...new Set(state.model.enchants.map(enchant => enchant.category))].sort();
    select.innerHTML = `<option value="all">All categories</option>${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}`;
    select.value = categories.includes(selected) ? selected : "all";
  }

  function renderCatalog() {
    const query = $("enchant-search").value.trim().toLowerCase();
    const category = $("category-filter").value;
    const matches = state.model.enchants.filter(enchant => {
      const categoryMatch = category === "all" || enchant.category === category;
      const queryMatch = !query || `${enchant.name} ${enchant.category} ${enchant.notes}`.toLowerCase().includes(query);
      return categoryMatch && queryMatch;
    });

    $("catalog-count").textContent = `${matches.length} enchant${matches.length === 1 ? "" : "s"}`;
    $("enchant-catalog").innerHTML = matches.length
      ? matches.map(enchant => `
        <button class="catalog-item" type="button" data-add-enchant="${escapeHtml(enchant.id)}" title="${escapeHtml(enchant.notes)}">
          ${enchantIcon(enchant)}
          <span class="catalog-copy"><span class="catalog-name">${escapeHtml(enchant.name)}</span><span class="catalog-meta">${escapeHtml(enchant.category)} · ${escapeHtml(effectSummary(enchant.normal))}</span></span>
        </button>`).join("")
      : `<div class="empty-state">No enchants match this search.</div>`;
  }

  function renderSlots() {
    const catalog = new Map(state.model.enchants.map(enchant => [enchant.id, enchant]));
    $("loadout-slots").innerHTML = state.loadout.map((slot, index) => {
      const enchant = slot ? catalog.get(slot.enchantId) : null;
      if (!enchant) {
        return `<button class="loadout-slot empty" type="button" data-empty-slot="${index}"><span class="slot-number">${index + 1}</span><span>Empty slot</span></button>`;
      }
      const mode = slot.empowered ? "empowered" : "normal";
      return `<article class="loadout-slot" title="${escapeHtml(enchant.notes)}">
        <span class="slot-number">${index + 1}</span>
        <button class="slot-remove" type="button" data-remove-slot="${index}" aria-label="Remove ${escapeHtml(enchant.name)}">×</button>
        <div class="slot-content">
          ${enchantIcon(enchant)}
          <div class="slot-copy">
            <div class="slot-name">${escapeHtml(enchant.name)}</div>
            <div class="slot-effect">${escapeHtml(effectSummary(enchant[mode]))}</div>
          </div>
          <div class="mode-toggle" aria-label="Enchant mode">
            <button type="button" data-slot-mode="${index}" data-empowered="false" class="${slot.empowered ? "" : "active"}">Normal</button>
            <button type="button" data-slot-mode="${index}" data-empowered="true" class="${slot.empowered ? "active" : ""}">Empowered</button>
          </div>
        </div>
      </article>`;
    }).join("");
    $("filled-slots").textContent = `${state.loadout.filter(Boolean).length} / ${state.slotCount}`;
  }

  function addEnchant(enchantId, preferredIndex = -1) {
    let index = preferredIndex;
    if (index < 0 || index >= state.loadout.length || state.loadout[index]) index = state.loadout.findIndex(slot => !slot);
    if (index < 0) {
      showToast("All loadout slots are filled.", true);
      return;
    }
    state.loadout[index] = { enchantId, empowered: false };
    saveState();
    renderSlots();
    recalculate();
  }

  function renderCopyWeights() {
    $("copy-weights").innerHTML = state.model.copyWeights.map((weight, index) => `
      <div class="copy-weight"><label>Copy ${index + 1}<input type="number" min="0" step="0.005" value="${escapeHtml(weight)}" data-copy-weight="${index}" /></label></div>`).join("");
  }

  function renderEggEditors() {
    $("egg-tier-editors").innerHTML = state.model.eggTiers.map((tier, index) => `
      <div class="egg-tier-editor" data-tier-index="${index}">
        <label class="control-label">Tier<input type="text" value="${escapeHtml(tier.name)}" data-tier-field="name" /></label>
        <label class="control-label">Base odds: 1 in<input type="number" min="1" step="1" value="${escapeHtml(tier.oneIn)}" data-tier-field="oneIn" /></label>
        <label class="control-label">Strength<input type="number" min="0" step="0.01" value="${escapeHtml(tier.strength)}" data-tier-field="strength" /></label>
        <label class="control-label">Luck<span class="check-control"><input type="checkbox" data-tier-field="luckAffected" ${tier.luckAffected ? "checked" : ""} /> Affected</span></label>
        <button class="tier-remove" type="button" data-remove-tier="${index}" aria-label="Remove ${escapeHtml(tier.name)}">×</button>
      </div>`).join("");
  }

  function renderModelEditor() {
    $("model-badge").textContent = state.model.modelLabel || state.model.version || "Custom model";
    $("model-editor").value = JSON.stringify({
      version: state.model.version,
      modelLabel: state.model.modelLabel,
      copyWeights: state.model.copyWeights,
      enchants: state.model.enchants,
      eggTiers: state.model.eggTiers
    }, null, 2);
  }

  function inputValues() {
    return {
      baseDamage: finite($("base-damage").value, 100),
      baseCritChancePct: finite($("base-crit").value),
      critMultiplier: finite($("crit-multiplier").value, 5),
      hatchesPerRoll: finite($("hatches-per-roll").value, 144),
      rollsPerMinute: finite($("rolls-per-minute").value, 1),
      costPerEgg: finite($("cost-per-egg").value),
      breakablesPerMinute: finite($("breakables-per-minute").value, 30),
      baseDropOneIn: finite($("base-drop-one-in").value, 20),
      itemsPerDrop: finite($("items-per-drop").value, 1),
      valuePerDrop: finite($("value-per-drop").value, 1),
      damageLimited: $("damage-limited").checked
    };
  }

  function writeInputs() {
    const inputMap = {
      "base-damage": "baseDamage",
      "base-crit": "baseCritChancePct",
      "crit-multiplier": "critMultiplier",
      "hatches-per-roll": "hatchesPerRoll",
      "rolls-per-minute": "rollsPerMinute",
      "cost-per-egg": "costPerEgg",
      "breakables-per-minute": "breakablesPerMinute",
      "base-drop-one-in": "baseDropOneIn",
      "items-per-drop": "itemsPerDrop",
      "value-per-drop": "valuePerDrop"
    };
    for (const [id, key] of Object.entries(inputMap)) $(id).value = state.inputs[key];
    $("damage-limited").checked = state.inputs.damageLimited !== false;
    $("slot-count").value = state.slotCount;
  }

  function comparisonRow(label, value, note = "") {
    return `<div class="comparison-row"><span><strong>${escapeHtml(label)}</strong>${note ? `<br><span class="muted">${escapeHtml(note)}</span>` : ""}</span><span class="comparison-value">${escapeHtml(value)}</span></div>`;
  }

  function renderCombat(combat) {
    $("combat-breakdown").innerHTML = [
      comparisonRow("Damage per hit", compact(combat.damagePerHit), `${combat.directMultiplier.toFixed(2)}x direct damage`),
      comparisonRow("Effective critical chance", percent(combat.effectiveCritChance)),
      comparisonRow("Expected damage per hit", compact(combat.expectedDamagePerHit), `${combat.critExpectedMultiplier.toFixed(2)}x critical weighting`),
      comparisonRow("Attack throughput", `${combat.attackSpeedMultiplier.toFixed(2)}x`),
      comparisonRow("Area throughput", `${combat.areaMultiplier.toFixed(2)}x`),
      comparisonRow("Modeled combined output", compact(combat.throughputDamage), `${combat.throughputMultiplier.toFixed(2)}x base output`)
    ].join("");
  }

  function renderCopyComparison(combined) {
    const groups = new Map();
    for (const applied of combined.applied) {
      const group = applied.enchant.stackGroup || applied.enchant.id;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(applied);
    }
    if (!groups.size) {
      $("copy-comparison").innerHTML = `<div class="empty-state">Add enchants to compare duplicate efficiency.</div>`;
      return;
    }

    $("copy-comparison").innerHTML = [...groups.entries()].map(([group, copies]) => {
      const effectiveCopies = copies.reduce((sum, copy) => sum + copy.weight, 0);
      const last = copies[copies.length - 1];
      const details = copies.map(copy => `${copy.enchant.name} ${copy.copyIndex + 1}: ${trimNumber(copy.weight * 100, 1)}%`).join(" · ");
      return comparisonRow(
        `${copies[0].enchant.name} group`,
        `${trimNumber(effectiveCopies, 3)} effective copies`,
        `${copies.length} slot${copies.length === 1 ? "" : "s"} · last copy ${trimNumber(last.weight * 100, 1)}% · ${details}`
      );
    }).join("");
  }

  function renderEggResults(results) {
    const tiers = state.model.eggTiers;
    $("egg-results-head").innerHTML = `<tr><th>Duration</th><th>Hatches</th><th>Cost</th>${tiers.map(tier => `<th>${escapeHtml(tier.name)}</th>`).join("")}<th>Expected Strength</th></tr>`;
    $("egg-results-body").innerHTML = results.map(result => `<tr>
      <td><strong>${escapeHtml(result.label)}</strong></td>
      <td>${compact(result.hatches)}</td>
      <td>${compact(result.cost)}</td>
      ${result.tiers.map(tier => `<td title="${escapeHtml(`${percent(tier.chanceAtLeastOne * 100, 2)} chance of at least one · ${oneIn(tier.adjustedOneIn)}`)}">${compact(tier.expected, 3)}<br><span class="muted">${escapeHtml(oneIn(tier.adjustedOneIn))}</span></td>`).join("")}
      <td>${compact(result.expectedStrength)}</td>
    </tr>`).join("");
    $("egg-model-note").textContent = "Planning formula: adjusted one-in-N = base odds / (1 + modeled egg luck). Exact PS99 caps and tier eligibility can replace this formula after decompile import.";
  }

  function renderDropResults(result) {
    $("drop-results-body").innerHTML = result.durations.map(duration => `<tr>
      <td><strong>${escapeHtml(duration.label)}</strong></td>
      <td>${compact(duration.breakables)}</td>
      <td>${compact(duration.drops)}</td>
      <td>${compact(duration.value)}</td>
      <td>${compact(duration.currencyWeightedValue)}</td>
    </tr>`).join("");
    $("drop-model-note").textContent = `${compact(result.effectiveBreakablesPerMinute)} modeled breakables/min · ${result.dropMultiplier.toFixed(2)}x item-drop weight · ${result.currencyMultiplier.toFixed(2)}x currency weight${state.inputs.damageLimited ? " · damage throughput affects break speed" : " · fixed break speed"}.`;
  }

  function recalculate() {
    state.inputs = inputValues();
    const combined = math.combineLoadout(state.loadout, state.model.enchants, state.model.copyWeights);
    const combat = math.calculateCombat(combined.totals, state.inputs);
    const eggs = math.calculateEggs(combined.totals, state.inputs, state.model.eggTiers);
    const drops = math.calculateDrops(combined.totals, combat, state.inputs);

    $("damage-total").textContent = `${combat.throughputMultiplier.toFixed(2)}x`;
    $("luck-total").textContent = `+${trimNumber(combined.totals.luckPct, 1)}%`;
    $("luck-multiplier").textContent = `${(1 + combined.totals.luckPct / 100).toFixed(2)}x odds weight`;
    $("drop-total").textContent = `+${trimNumber(combined.totals.dropPct, 1)}%`;
    $("drop-multiplier").textContent = `${drops.dropMultiplier.toFixed(2)}x drop weight`;
    $("speed-total").textContent = `+${trimNumber(combined.totals.attackSpeedPct, 1)}%`;

    renderCombat(combat);
    renderCopyComparison(combined);
    renderEggResults(eggs);
    renderDropResults(drops);
    saveState();
  }

  function rerenderModel() {
    const validIds = new Set(state.model.enchants.map(enchant => enchant.id));
    state.loadout = state.loadout.map(slot => slot && validIds.has(slot.enchantId) ? slot : null);
    renderCategoryOptions();
    renderCatalog();
    renderSlots();
    renderCopyWeights();
    renderEggEditors();
    renderModelEditor();
    recalculate();
  }

  function bindEvents() {
    document.querySelectorAll("[data-calculator-view]").forEach(button => {
      button.addEventListener("click", () => {
        state.activeView = button.dataset.calculatorView;
        renderCalculatorView();
        saveState();
      });
    });

    $("enchant-search").addEventListener("input", renderCatalog);
    $("category-filter").addEventListener("change", renderCatalog);

    $("enchant-catalog").addEventListener("click", event => {
      const button = event.target.closest("[data-add-enchant]");
      if (button) addEnchant(button.dataset.addEnchant);
    });

    $("loadout-slots").addEventListener("click", event => {
      const remove = event.target.closest("[data-remove-slot]");
      if (remove) {
        state.loadout[Number(remove.dataset.removeSlot)] = null;
        saveState();
        renderSlots();
        recalculate();
        return;
      }
      const mode = event.target.closest("[data-slot-mode]");
      if (mode) {
        const slot = state.loadout[Number(mode.dataset.slotMode)];
        if (slot) slot.empowered = mode.dataset.empowered === "true";
        saveState();
        renderSlots();
        recalculate();
      }
    });

    $("slot-count").addEventListener("change", event => {
      const nextCount = Math.round(math.clamp(event.target.value, 1, MAX_SLOTS));
      state.slotCount = nextCount;
      state.loadout = Array.from({ length: nextCount }, (_, index) => state.loadout[index] || null);
      event.target.value = nextCount;
      saveState();
      renderSlots();
      recalculate();
    });

    $("clear-loadout").addEventListener("click", () => {
      state.loadout = Array.from({ length: state.slotCount }, () => null);
      saveState();
      renderSlots();
      recalculate();
    });

    document.querySelectorAll("#base-damage,#base-crit,#crit-multiplier,#hatches-per-roll,#rolls-per-minute,#cost-per-egg,#breakables-per-minute,#base-drop-one-in,#items-per-drop,#value-per-drop,#damage-limited")
      .forEach(input => input.addEventListener("input", recalculate));

    $("copy-weights").addEventListener("input", event => {
      const input = event.target.closest("[data-copy-weight]");
      if (!input) return;
      state.model.copyWeights[Number(input.dataset.copyWeight)] = Math.max(0, finite(input.value));
      renderModelEditor();
      recalculate();
    });

    $("egg-tier-editors").addEventListener("input", event => {
      const editor = event.target.closest("[data-tier-index]");
      const field = event.target.dataset.tierField;
      if (!editor || !field) return;
      const tier = state.model.eggTiers[Number(editor.dataset.tierIndex)];
      if (!tier) return;
      if (field === "luckAffected") tier[field] = event.target.checked;
      else if (field === "name") tier[field] = event.target.value;
      else tier[field] = Math.max(field === "oneIn" ? 1 : 0, finite(event.target.value));
      renderModelEditor();
      recalculate();
    });

    $("egg-tier-editors").addEventListener("click", event => {
      const remove = event.target.closest("[data-remove-tier]");
      if (!remove) return;
      state.model.eggTiers.splice(Number(remove.dataset.removeTier), 1);
      renderEggEditors();
      renderModelEditor();
      recalculate();
    });

    $("add-egg-tier").addEventListener("click", () => {
      const index = state.model.eggTiers.length;
      state.model.eggTiers.push(normalizeTier({ name: `Tier ${index + 1}`, oneIn: 1000, strength: 1 }, index));
      renderEggEditors();
      renderModelEditor();
      recalculate();
    });

    $("apply-model").addEventListener("click", () => {
      try {
        state.model = normalizedModel(JSON.parse($("model-editor").value));
        rerenderModel();
        showToast("Game data model applied.");
      } catch (error) {
        showToast(error.message || "Could not apply game data JSON.", true);
      }
    });

    $("export-model").addEventListener("click", async () => {
      const text = $("model-editor").value;
      try {
        await navigator.clipboard.writeText(text);
        showToast("Game data JSON copied.");
      } catch (_) {
        $("model-editor").select();
        document.execCommand("copy");
        showToast("Game data JSON copied.");
      }
    });

    $("reset-model").addEventListener("click", () => {
      state.model = clone(baseData);
      rerenderModel();
      showToast("Planning data restored.");
    });
  }

  function init() {
    loadState();
    writeInputs();
    renderCategoryOptions();
    renderCatalog();
    renderSlots();
    renderCopyWeights();
    renderEggEditors();
    renderModelEditor();
    bindEvents();
    renderCalculatorView();
    recalculate();
    hydrateOfficialCatalog();
  }

  init();
})();
