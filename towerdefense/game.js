/* ==========================================================================
   1. CONSTANTS, CONFIGURATION & GAME STATE
   ========================================================================== */

// --- Save Slot Settings & Storage Keys ---
let currentSaveSlot = 1;
const ACTIVE_SLOT_KEY = "turretDefenseActiveSlotV1";
const PRESETS_SAVE_KEY = "turretDefensePresetsV1";

// --- Economy & Core Resources ---
let gold = 100;
let baseHealth = 100;
let st = 10;
let energyRegen = 0.2;

const unitCost = 50;
const stPullCost = 5;
const rearUnitCost = 100;
const rearStPullCost = 10;
const startStDropChance = 0.5;
const endStDropChance = 0.2;
const maxBaseHealth = 100;
const baseCost = 200; //Base upgrade cost
const perLevelSacMultiplier = 0.25;
const MAX_CLEARS_FOR_REWARDS = 5;

// --- Wave & Slot Configurations ---
let wave = 0;
const maxSlots = 10;
const maxDeployedUnits = 3;
const maxBaseSlots = 2;

// --- System & UI State Tracking ---
const MAX_LOG_ENTRIES = 50;
let nextUnitId = 1;
let rangeViewUnitId = null;
let selectedUpgradeTargetId = null;
let unitPopupEscapeHandler = null;
let isLoading = false;
let currentTechPanelTab = "techTree";
let isTowerStatsExpanded = false;
let savedTowerStatsScrollTop = 0;

// --- Build Pool & Shop State ---
const FOCUS_TOWER_MULTIPLIER = 10;
let shopPoolExpanded = false;
let focusedMainTowerKey = null;
let focusedRearTowerKey = null;

// --- Stage & Campaign Progression ---
let currentCampaignTabMode = "campaign"; // "campaign" | "challenge"
let selectedStageId = "1-1";
let selectedChallengeStageId = "C-1";
let unlockedStageIndex = 0;
let unlockedChallengeIndex = 0;
let stageClearCounts = {}; // Fixed: Declaration added
const clearedStageIds = new Set();
const clearedChallengeStageIds = new Set();

// --- Combat Flow State ---
let battleLoop = null;
let fastForward = false;
let stageEntered = false;
let startWaveAvailable = false;
let gameSpeedMultiplier = 1;
let currentEnemySortMode = "default";
let autoWaveTimeout = null;
let isStoppingBattle = false;

// --- Auto Battle State ---
let autoStartWaveEnabled = false;
let autoRepeatEnabled = false;
let autoRepeatCount = 0; // 0 = Unlimited
let autoRepeatRemaining = 0;
const autoStageDelay = 100;
const autoWorldDelay = 300;

// --- Auto-Repeat Session Accumulator ---
let autoRepeatSessionStats = {
  runsCompleted: 0,
  totalGold: 0,
  totalSt: 0,
  ticketsEarned: 0,
  towerStatsMap: {}, // Stores accumulated XP, Damage, and Kills across runs
};

// --- Stage Accumulators (End-of-Stage Summary) ---
let stageEnemyGoldEarned = 0;
let stageWaveGoldEarned = 0;
let stageWaveStEarned = 0;

// --- Options & User Settings ---
let showClearPopup = false;
let showBacklineCooldown = false;
let showFrontlineCooldown = false;
let swapDeploymentLayout = false;
let simplifyBattleLog = false;
let hideMaxedTech = false;
let unpinTopBar = false;
let showMoreStats = false;
let showTechBonus = false;
let showEffectiveDamage = false;
let buildAnimationMode = "full"; // "full" | "short" | "off"

// --- Inventory & UI Display Filters ---
let inventoryFilter = "all"; // "all", "Main", "Rear"
let inventorySort = "level"; // "level", "rarity", "upgrades"
let inventorySortAsc = false; // false = Descending, true = Ascending
let currentInventoryTab = "inventory"; // "inventory", "warehouse"
let presetsExpanded = false;
let upgradeMenuSortMode = "level";
let upgradeMenuSortOrder = "desc";
let boostMenuSortMode = "level";
let boostMenuSortOrder = "desc";
let boostMenuCategoryFilter = "all"; // "all" | "Main" | "Rear"
let energyMode = "hide";

const QUICK_SAC_RARITIES = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

const DEFAULT_QUICK_SAC_SETTINGS = {
  askConfirmation: true,
  categoryFilter: "all",
  maxLevelEnabled: false,
  maxLevel: 1,
  maxUpgradesEnabled: false,
  maxUpgrades: 0,
  Common: { enabled: true, keep: 0 },
  Uncommon: { enabled: true, keep: 0 },
  Rare: { enabled: false, keep: 1 },
  Epic: { enabled: false, keep: 1 },
  Legendary: { enabled: false, keep: 1 },
  Mythic: { enabled: false, keep: 1 },
};

let quickSacSettings = JSON.parse(JSON.stringify(DEFAULT_QUICK_SAC_SETTINGS));

let currentStagePage = 0;
let damageDecimal = 1;
const stagesPerPage = 10;

// --- Primary Data Collections ---
const inventory = [];
const warehouse = [];
const deployedUnits = Array(maxSlots).fill(null);
const deployedBaseUnits = Array(maxBaseSlots).fill(null);
let deploymentPresets = [null, null, null];

/* ==========================================================================
   2. DOM ELEMENT REFERENCES
   ========================================================================== */

// Resource & Stat Displays
const goldDisplay = document.getElementById("gold");
const baseHealthDisplay = document.getElementById("base-health");
const waveDisplay = document.getElementById("wave");
const activeSlotsDisplay = document.getElementById("active-slots");
const stDisplay = document.getElementById("st");
const damageLevelDisplay = document.getElementById("damage-level");

// Containers & Layout Grids
const inventoryList = document.getElementById("inventory-list");
const slots = document.getElementById("slots");
const baseSlotsContainer = document.getElementById("base-slots");
const log = document.getElementById("log");
const enemyStatus = document.getElementById("enemy-status");

// Main Action Buttons
const startWaveButton = document.getElementById("start-wave");
const buyUnitButton = document.getElementById("buy-unit");
const buyUnit10xButton = document.getElementById("buy-unit-10x");
const buyRearUnitButton = document.getElementById("buy-rear-unit");
const buyRearUnit10xButton = document.getElementById("buy-rear-unit-10x");

// Stage Selection Elements
const stageGrid = document.getElementById("stage-grid");
const stageDetails = document.getElementById("stage-details");
const stageWorldLabel = document.getElementById("stage-world-label");

// Navigation & Tab Panels
const resetStorageButton = document.getElementById("reset-storage-button");
const toggleInventoryButton = document.getElementById(
  "toggle-inventory-button",
);
const inventoryContent = document.getElementById("inventory-content");
const inventoryFilterButton = document.getElementById(
  "inventory-filter-button",
);
const inventorySortSelect = document.getElementById("inventory-sort-select");
const inventorySortOrderButton = document.getElementById(
  "inventory-sort-order-button",
);
const inventoryTitleBtn = document.getElementById("inventory-title-btn");

const techTreePanel = document.querySelector(".tech-tree-panel");
const toggleTechTreeBtn = document.getElementById("toggle-tech-tree-button");

// Save/Load Menu Elements
const saveMenuBtn = document.getElementById("save-menu-btn");
const loadMenuBtn = document.getElementById("load-menu-btn");
const saveMenu = document.getElementById("save-menu");
const loadMenu = document.getElementById("load-menu");

// Options Modal Elements
const optionsModalOverlay = document.getElementById("options-modal-overlay");
const optionsMenuBtn = document.getElementById("options-menu-btn");
const closeOptionsBtn = document.getElementById("close-options-btn");
const saveOptionsBtn = document.getElementById("save-options-btn");
const showStatsCb = document.getElementById("toggle-show-more-stats-checkbox");
const showTechCb = document.getElementById("toggle-show-tech-bonus-checkbox");

/* ==========================================================================
   3. SAVE / LOAD & LOCAL STORAGE MANAGEMENT
   ========================================================================== */

function getSaveKey(slot = currentSaveSlot) {
  return `turretDefenseCampaignV1_slot_${slot}`;
}

function getPresetKey(slot = currentSaveSlot) {
  return `turretDefensePresetsV1_slot_${slot}`;
}

function getStoredActiveSlot() {
  const stored = localStorage.getItem(ACTIVE_SLOT_KEY);
  return stored ? Number(stored) : 1;
}

function setActiveSaveSlot(slot) {
  currentSaveSlot = slot;
  localStorage.setItem(ACTIVE_SLOT_KEY, String(slot));
  updateSaveSlotDisplay();
}

function updateSaveSlotDisplay() {
  const display = document.getElementById("active-save-display");
  if (display) {
    display.textContent = `Save: Slot ${currentSaveSlot}`;
  }
}

function closeSaveLoadMenus() {
  saveMenu?.classList.add("hidden");
  loadMenu?.classList.add("hidden");
}

function saveCampaignProgress(slot = currentSaveSlot, showLog = false) {
  if (isLoading) return;

  try {
    const waveToSave =
      stageEntered && !startWaveAvailable && wave > 0 ? wave - 1 : wave;

    const saveData = {
      slot,
      unlockedStageIndex,
      unlockedChallengeIndex,
      clearedStageIds: [...clearedStageIds],
      clearedChallengeStageIds: [...clearedChallengeStageIds],
      stageClearCounts,
      selectedStageId,
      selectedChallengeStageId,
      currentCampaignTabMode,
      warehouse,
      wave: waveToSave,
      stageEntered,
      startWaveAvailable: stageEntered ? true : startWaveAvailable,
      gold,
      baseHealth,
      inventory,
      deployedUnits,
      deployedBaseUnits,
      deploymentPresets,
      nextUnitId,
      st,
      techUpgrades: typeof techUpgrades !== "undefined" ? techUpgrades : {},
      challengeBonusUpgrades:
        typeof challengeBonusUpgrades !== "undefined"
          ? challengeBonusUpgrades
          : {},
      showClearPopup,
      showBacklineCooldown,
      showFrontlineCooldown,
      swapDeploymentLayout,
      timestamp: Date.now(),
      simplifyBattleLog,
      hideMaxedTech,
      unpinTopBar,
      showMoreStats,
      showTechBonus,
      showEffectiveDamage,
      buildAnimationMode,
      autoStartWaveEnabled,
      autoRepeatEnabled: false,
      autoRepeatCount: 0,
      focusedMainTowerKey,
      focusedRearTowerKey,
      inventoryFilter,
      inventorySort,
      inventorySortAsc,
      currentInventoryTab,
      energyMode,
      quickSacSettings,
    };

    localStorage.setItem(getSaveKey(slot), JSON.stringify(saveData));

    if (showLog) {
      addLog(`💾 Saved progress to Slot ${slot}.`);
    }
  } catch (error) {
    console.warn("Game progress could not be saved.", error);
  }
}

function loadCampaignProgress(slot = currentSaveSlot) {
  isLoading = true;

  try {
    const key = getSaveKey(slot);
    const saved = JSON.parse(localStorage.getItem(key) || "null");

    if (!saved) {
      addLog(`Slot ${slot} is empty.`);
      return false;
    }

    currentSaveSlot = slot;

    // Restore Settings & Options
    showClearPopup = saved.showClearPopup ?? false;
    showBacklineCooldown = saved.showBacklineCooldown ?? false;
    showFrontlineCooldown = saved.showFrontlineCooldown ?? false;
    swapDeploymentLayout = saved.swapDeploymentLayout ?? false;
    simplifyBattleLog = saved.simplifyBattleLog ?? false;
    hideMaxedTech = saved.hideMaxedTech ?? false;
    unpinTopBar = saved.unpinTopBar ?? false;
    showMoreStats = saved.showMoreStats ?? false;
    showTechBonus = saved.showTechBonus ?? false;
    showEffectiveDamage = saved.showEffectiveDamage ?? false;
    buildAnimationMode = ["full", "short", "off"].includes(
      saved.buildAnimationMode,
    )
      ? saved.buildAnimationMode
      : "full";

    syncOptionCheckboxes();
    setUnpinTopBar(unpinTopBar);

    syncOptionCheckboxes();
    setUnpinTopBar(unpinTopBar);

    const clearCb = document.getElementById("toggle-clear-popup-checkbox");
    if (clearCb) clearCb.checked = showClearPopup;

    const cdCb = document.getElementById("toggle-backline-cooldown-checkbox");
    if (cdCb) cdCb.checked = showBacklineCooldown;

    const frontlineCdCb = document.getElementById(
      "toggle-frontline-cooldown-checkbox",
    );
    if (frontlineCdCb) frontlineCdCb.checked = showFrontlineCooldown;

    const swapCb = document.getElementById("toggle-swap-layout-checkbox");
    if (swapCb) swapCb.checked = swapDeploymentLayout;

    const logCb = document.getElementById("toggle-simplified-log-checkbox");
    if (logCb) logCb.checked = simplifyBattleLog;

    const hideTechCb = document.getElementById(
      "toggle-hide-maxed-tech-checkbox",
    );

    const effDmgCb = document.getElementById(
      "toggle-show-effective-damage-checkbox",
    );
    if (effDmgCb) effDmgCb.checked = showEffectiveDamage;

    if (hideTechCb) hideTechCb.checked = hideMaxedTech;

    setUnpinTopBar(unpinTopBar);

    if (saved.energyMode) energyMode = saved.energyMode;

    quickSacSettings = JSON.parse(JSON.stringify(DEFAULT_QUICK_SAC_SETTINGS));
    if (saved.quickSacSettings && typeof saved.quickSacSettings === "object") {
      if (typeof saved.quickSacSettings.askConfirmation === "boolean") {
        quickSacSettings.askConfirmation =
          saved.quickSacSettings.askConfirmation;
      }
      if (typeof saved.quickSacSettings.maxLevelEnabled === "boolean") {
        quickSacSettings.maxLevelEnabled =
          saved.quickSacSettings.maxLevelEnabled;
      }
      if (Number.isFinite(Number(saved.quickSacSettings.maxLevel))) {
        quickSacSettings.maxLevel = Math.max(
          1,
          Math.floor(Number(saved.quickSacSettings.maxLevel)),
        );
      }
      if (typeof saved.quickSacSettings.maxUpgradesEnabled === "boolean") {
        quickSacSettings.maxUpgradesEnabled =
          saved.quickSacSettings.maxUpgradesEnabled;
      }
      if (
        ["all", "Main", "Rear"].includes(saved.quickSacSettings.categoryFilter)
      ) {
        quickSacSettings.categoryFilter = saved.quickSacSettings.categoryFilter;
      }
      if (Number.isFinite(Number(saved.quickSacSettings.maxUpgrades))) {
        quickSacSettings.maxUpgrades = Math.max(
          0,
          Math.floor(Number(saved.quickSacSettings.maxUpgrades)),
        );
      }
      for (const rarity of QUICK_SAC_RARITIES) {
        if (saved.quickSacSettings[rarity]) {
          quickSacSettings[rarity] = {
            enabled: Boolean(saved.quickSacSettings[rarity].enabled),
            keep: Math.max(
              0,
              Math.floor(Number(saved.quickSacSettings[rarity].keep) || 0),
            ),
          };
        }
      }
    }

    // Restore Progression Data
    if (Number.isInteger(saved.unlockedStageIndex)) {
      unlockedStageIndex = Math.max(
        0,
        Math.min(stages.length - 1, saved.unlockedStageIndex),
      );
    }

    if (Number.isInteger(saved.unlockedChallengeIndex)) {
      unlockedChallengeIndex = Math.max(
        0,
        Math.min(challengeStages.length - 1, saved.unlockedChallengeIndex),
      );
    }

    if (Array.isArray(saved.clearedStageIds)) {
      clearedStageIds.clear();
      for (const id of saved.clearedStageIds) {
        if (stages.some((stage) => stage.id === id)) {
          clearedStageIds.add(id);
        }
      }
    }

    if (Array.isArray(saved.clearedChallengeStageIds)) {
      clearedChallengeStageIds.clear();
      for (const id of saved.clearedChallengeStageIds) {
        clearedChallengeStageIds.add(id);
      }
    }

    stageClearCounts =
      saved.stageClearCounts && typeof saved.stageClearCounts === "object"
        ? saved.stageClearCounts
        : {};

    techUpgrades =
      saved.techUpgrades && typeof saved.techUpgrades === "object"
        ? saved.techUpgrades
        : {};

    challengeBonusUpgrades =
      saved.challengeBonusUpgrades &&
      typeof saved.challengeBonusUpgrades === "object"
        ? saved.challengeBonusUpgrades
        : {};

    if (Array.isArray(saved.warehouse)) {
      warehouse.splice(0, warehouse.length, ...saved.warehouse);
    }

    if (saved.currentCampaignTabMode) {
      currentCampaignTabMode = saved.currentCampaignTabMode;
    }

    const savedStage = stages.find((s) => s.id === saved.selectedStageId);
    if (savedStage && savedStage.index <= unlockedStageIndex) {
      selectedStageId = savedStage.id;
    }

    if (saved.selectedChallengeStageId) {
      selectedChallengeStageId = saved.selectedChallengeStageId;
    }

    if (Number.isFinite(saved.gold) && saved.gold >= 0) gold = saved.gold;
    if (Number.isFinite(saved.st) && saved.st >= 0) st = saved.st;
    if (Number.isFinite(saved.baseHealth) && saved.baseHealth >= 0) {
      baseHealth = saved.baseHealth;
    }

    // Restore Units & Presets
    if (Array.isArray(saved.inventory)) {
      inventory.splice(0, inventory.length, ...saved.inventory);
      inventory.forEach(restoreUnit);
    }

    if (
      Array.isArray(saved.deployedUnits) &&
      saved.deployedUnits.length === maxSlots
    ) {
      deployedUnits.splice(0, maxSlots, ...saved.deployedUnits);
      deployedUnits.forEach((unit) => {
        if (unit !== null) restoreUnit(unit);
      });
    }

    if (
      Array.isArray(saved.deployedBaseUnits) &&
      saved.deployedBaseUnits.length === maxBaseSlots
    ) {
      deployedBaseUnits.splice(0, maxBaseSlots, ...saved.deployedBaseUnits);
      deployedBaseUnits.forEach((unit) => {
        if (unit !== null) restoreUnit(unit);
      });
    }

    if (
      Array.isArray(saved.deploymentPresets) &&
      saved.deploymentPresets.length === 3
    ) {
      deploymentPresets = saved.deploymentPresets;
    } else {
      deploymentPresets = [null, null, null];
    }

    if (Number.isInteger(saved.nextUnitId) && saved.nextUnitId >= 1) {
      nextUnitId = saved.nextUnitId;
    }

    const currentStage = getSelectedStage();
    if (
      Number.isInteger(saved.wave) &&
      saved.wave >= 0 &&
      saved.wave < currentStage.waves.length
    ) {
      wave = saved.wave;
      stageEntered = Boolean(saved.stageEntered);
      startWaveAvailable = stageEntered
        ? true
        : Boolean(saved.startWaveAvailable);
    } else {
      wave = 0;
      stageEntered = false;
      startWaveAvailable = false;
    }

    autoStartWaveEnabled = Boolean(saved.autoStartWaveEnabled);
    autoRepeatCount = 0;
    autoRepeatEnabled = false;
    autoRepeatRemaining = 0;

    if (saved.focusedMainTowerKey !== undefined) {
      focusedMainTowerKey = saved.focusedMainTowerKey;
    } else if (saved.focusedTowerKey !== undefined) {
      focusedMainTowerKey = saved.focusedTowerKey; // Legacy save migration
    } else {
      focusedMainTowerKey = null;
    }

    if (saved.focusedRearTowerKey !== undefined) {
      focusedRearTowerKey = saved.focusedRearTowerKey;
    } else {
      focusedRearTowerKey = null;
    }

    const activeStageList =
      currentCampaignTabMode === "challenge" ? challengeStages : stages;
    const activeStageId =
      currentCampaignTabMode === "challenge"
        ? selectedChallengeStageId
        : selectedStageId;
    const activeStage = activeStageList.find((s) => s.id === activeStageId);

    if (activeStage) {
      currentStagePage = Math.floor(activeStage.index / stagesPerPage);
    }

    // Restore Inventory Sort & Filter State
    if (saved.inventoryFilter) inventoryFilter = saved.inventoryFilter;
    if (saved.inventorySort) inventorySort = saved.inventorySort;
    if (typeof saved.inventorySortAsc === "boolean") {
      inventorySortAsc = saved.inventorySortAsc;
    }
    if (saved.currentInventoryTab)
      currentInventoryTab = saved.currentInventoryTab;

    // Sync Inventory Controls UI
    if (inventoryFilterButton) {
      inventoryFilterButton.textContent = `Filter: ${inventoryFilter}`;
      inventoryFilterButton.disabled = currentInventoryTab === "warehouse";
    }
    if (inventorySortSelect) {
      inventorySortSelect.value = inventorySort;
      inventorySortSelect.disabled = currentInventoryTab === "warehouse";
    }
    if (inventorySortOrderButton) {
      inventorySortOrderButton.textContent = inventorySortAsc ? "▲" : "▼";
      inventorySortOrderButton.disabled = currentInventoryTab === "warehouse";
    }
    if (inventoryTitleBtn) {
      inventoryTitleBtn.textContent =
        currentInventoryTab === "inventory" ? "Inventory ⇄" : "Warehouse ⇄";
    }

    updateUI();
    renderInventory();
    renderDeployment();
    renderStageSelect();
    if (typeof renderTechTree === "function") renderTechTree();

    addLog(`📂 Loaded save slot ${slot}.`);
    return true;
  } catch (error) {
    console.warn(`Failed to load save slot ${slot}:`, error);
    return false;
  } finally {
    isLoading = false;
  }
}

function handleSaveToSlot(slot) {
  if (stageEntered || isBattleRunning()) {
    addLog("Cannot save while inside an active battle.");
    return;
  }

  // Add confirmation prompt
  const confirmed = confirm(
    `Are you sure you want to overwrite Save Slot ${slot}?`,
  );
  if (!confirmed) return;

  saveCampaignProgress(slot, true);
  setActiveSaveSlot(slot);
  closeSaveLoadMenus();
}

function handleLoadFromSlot(slot) {
  if (stageEntered || isBattleRunning()) {
    addLog("Cannot switch save slots while inside a world.");
    return;
  }

  const key = getSaveKey(slot);
  const hasData = localStorage.getItem(key) !== null;

  if (!hasData) {
    const createNew = confirm(
      `Slot ${slot} is empty. Start a new game save in Slot ${slot}?`,
    );
    if (createNew) {
      setActiveSaveSlot(slot);
      gold = 100;
      st = 10;
      baseHealth = maxBaseHealth;
      unlockedStageIndex = 0;
      unlockedChallengeIndex = 0;
      clearedStageIds.clear();
      clearedChallengeStageIds.clear();
      stageClearCounts = {};
      techUpgrades = {};
      inventory.length = 0;
      warehouse.length = 0;
      deployedUnits.fill(null);
      deployedBaseUnits.fill(null);
      deploymentPresets = [null, null, null];
      quickSacSettings = JSON.parse(JSON.stringify(DEFAULT_QUICK_SAC_SETTINGS));

      saveCampaignProgress(slot);
      updateUI();
      renderInventory();
      renderDeployment();
      renderStageSelect();
      addLog(`Created new game save in Slot ${slot}.`);
    }
    closeSaveLoadMenus();
    return;
  }

  const confirmed = confirm(
    `Load Save Slot ${slot}? Unsaved changes in current session will be lost.`,
  );
  if (!confirmed) return;

  const success = loadCampaignProgress(slot);
  if (success) {
    setActiveSaveSlot(slot);
  }
  closeSaveLoadMenus();
}

function loadPresetsFromStorage(slot = currentSaveSlot) {
  try {
    const key = getPresetKey(slot);
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (Array.isArray(saved) && saved.length === 3) {
      deploymentPresets = saved;
    }
  } catch (err) {
    console.warn("Could not load presets from localStorage:", err);
  }
}

function savePreset(index) {
  const mainIds = deployedUnits.map((u) => (u ? u.id : null));
  const baseIds = deployedBaseUnits.map((u) => (u ? u.id : null));

  deploymentPresets[index] = { main: mainIds, base: baseIds };

  try {
    localStorage.setItem(
      getPresetKey(currentSaveSlot),
      JSON.stringify(deploymentPresets),
    );
  } catch (err) {
    console.warn("Could not save preset to localStorage:", err);
  }

  saveCampaignProgress(currentSaveSlot);
  addLog(`💾 Saved Deployment Preset ${index + 1}!`);

  renderDeployment();
}

/* ==========================================================================
   4. HELPER & UTILITY FUNCTIONS
   ========================================================================== */

function syncOptionCheckboxes() {
  const optionMap = [
    { id: "toggle-clear-popup-checkbox", val: showClearPopup },
    { id: "toggle-backline-cooldown-checkbox", val: showBacklineCooldown },
    { id: "toggle-frontline-cooldown-checkbox", val: showFrontlineCooldown },
    { id: "toggle-swap-layout-checkbox", val: swapDeploymentLayout },
    { id: "toggle-simplified-log-checkbox", val: simplifyBattleLog },
    { id: "toggle-hide-maxed-tech-checkbox", val: hideMaxedTech },
    { id: "toggle-unpin-topbar-checkbox", val: unpinTopBar },
    { id: "toggle-show-more-stats-checkbox", val: showMoreStats },
    { id: "toggle-show-tech-bonus-checkbox", val: showTechBonus },
    { id: "toggle-show-effective-damage-checkbox", val: showEffectiveDamage },
  ];

  for (const { id, val } of optionMap) {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.checked = Boolean(val);
    }
  }

  document
    .querySelectorAll("#build-anim-segmented .segmented-btn")
    .forEach((btn) => {
      btn.classList.toggle(
        "active",
        btn.dataset.buildAnim === buildAnimationMode,
      );
    });
}

function getStageEnergyRegenMultiplier(
  currentStageId,
  targetMaxStageNumber = 60,
) {
  const currentStage = stages.find((s) => s.id === currentStageId);
  if (!currentStage) return 1.0;

  const stageNumber = currentStage.index + 1; // Stage 1-1 = 1, Stage 6-10 = 60
  const ratio = Math.min(1.0, stageNumber / targetMaxStageNumber);

  return Number(ratio.toFixed(2));
}

function processInventoryStaminaRegenOnStageClear(stageId) {
  const regenMultiplier = getStageEnergyRegenMultiplier(stageId);
  const totalDeployed = getDeployedCount() + getDeployedBaseCount();
  const baseCapacity = 5;
  const deploymentMultiplier = Math.min(1.0, totalDeployed / baseCapacity);

  const regenAmount = Number(
    (energyRegen * regenMultiplier * deploymentMultiplier).toFixed(2),
  );

  for (const unit of inventory) {
    if (unit.energy < (unit.maxEnergy || 100)) {
      unit.energy = Math.min(
        unit.maxEnergy || 100,
        Number((unit.energy + regenAmount).toFixed(2)),
      );
    }
  }
}

function processTowerStaminaOnWaveClear() {
  const deployed = [...deployedUnits, ...deployedBaseUnits].filter(
    (u) => u !== null,
  );

  for (const unit of deployed) {
    unit.energy = Math.max(0, Number((unit.energy - 0.1).toFixed(2)));
    if (unit.energy <= 0) {
      addLog(
        `⚠️ ${getUnitName(unit)} is FATIGUED! (70% Damage & 90% Reward Penalty).`,
      );
    }
  }
}

function formatGameNumber(num) {
  if (!Number.isFinite(num)) return "0";
  const rounded = Math.round(num);
  if (Math.abs(rounded) >= 1e9) {
    return (rounded / 1e9).toFixed(2) + "B";
  }
  if (Math.abs(rounded) >= 1e6) {
    return (rounded / 1e6).toFixed(2) + "M";
  }
  if (Math.abs(rounded) >= 1e3) {
    return (rounded / 1e3).toFixed(1) + "K";
  }
  return rounded.toLocaleString();
}

function accumulateSessionTowerStats(towerStatsList) {
  if (!autoRepeatSessionStats.towerStatsMap) {
    autoRepeatSessionStats.towerStatsMap = {};
  }
  for (const t of towerStatsList) {
    const key = `${t.name}_${t.category}`;
    if (!autoRepeatSessionStats.towerStatsMap[key]) {
      autoRepeatSessionStats.towerStatsMap[key] = {
        name: t.name,
        category: t.category,
        level: t.level,
        xpGained: 0,
        damageDealt: 0,
        kills: 0,
      };
    }
    autoRepeatSessionStats.towerStatsMap[key].level = t.level; // Keep highest level reached
    autoRepeatSessionStats.towerStatsMap[key].xpGained += t.xpGained || 0;
    autoRepeatSessionStats.towerStatsMap[key].damageDealt += t.damageDealt || 0;
    autoRepeatSessionStats.towerStatsMap[key].kills += t.kills || 0;
  }
}

function getSelectedStage() {
  if (currentCampaignTabMode === "challenge") {
    return (
      challengeStages.find((s) => s.id === selectedChallengeStageId) ??
      challengeStages[0]
    );
  }
  return stages.find((s) => s.id === selectedStageId) ?? stages[0];
}

function cancelAutoRepeat() {
  if (autoRepeatEnabled) {
    autoRepeatEnabled = false;
    autoStartWaveEnabled = false; // Disable Auto-Start Wave on cancel
    autoRepeatRemaining = 0;
    addLog("🛑 Auto-Repeat canceled by manual action.");

    if (typeof renderStageSelect === "function") renderStageSelect();
    if (typeof renderAutoWaveControl === "function") renderAutoWaveControl();
  }
}

function getStageRewardMultiplier(stageId) {
  const stage = stages.find((s) => s.id === stageId) || getSelectedStage();
  const clears = stageClearCounts[stageId] || 0;

  // Base decay steps across 4 clears down to a 15% floor (0.15)
  const decayPerClear = (1.0 - 0.15) / MAX_CLEARS_FOR_REWARDS;
  const baseDecay = Math.max(
    0.15,
    Number((1 - clears * decayPerClear).toFixed(3)),
  );

  // Clears 1 to 4 (clears 0-3): Apply +50% for Bosses, +25% for Minibosses
  if (clears < MAX_CLEARS_FOR_REWARDS && stage) {
    const isBoss = stage.isBoss || stage.stageInWorld === 10;
    const isMiniboss = stage.stageInWorld === 5;
    const bossBonus = isBoss ? 1.5 : isMiniboss ? 1.25 : 1.0;

    return Number((baseDecay * bossBonus).toFixed(3));
  }

  // 4+ Clears (Overfarm Floor): Bonus expires, leaving all stages at the 0.15x base floor
  return baseDecay;
}

function isBattleRunning() {
  return battleLoop !== null || fastForward;
}

function getDeployedCount() {
  return deployedUnits.filter((unit) => unit !== null).length;
}

function getDeployedBaseCount() {
  return deployedBaseUnits.filter((unit) => unit !== null).length;
}

function getMaxDeployedUnits() {
  const extra =
    typeof getTechExtraMainSlots === "function"
      ? getTechExtraMainSlots()
      : typeof getTechExtraSlots === "function"
        ? getTechExtraSlots()
        : 0;
  return maxDeployedUnits + extra;
}

function getLegendaryTowerCount() {
  const allUnits = [
    ...inventory,
    ...deployedUnits.filter((u) => u !== null),
    ...deployedBaseUnits.filter((u) => u !== null),
  ];

  return allUnits.filter((unit) => getUnitData(unit).rarity === "Legendary")
    .length;
}

function getUnitData(unit) {
  if (!unit || !unit.type || !unitTypes[unit.type]) {
    return {
      name: "Unknown Turret",
      category: "Main",
      rarity: "Common",
      damage: 10,
      fireRate: 5,
      range: 3,
    };
  }
  return unitTypes[unit.type];
}

function getUnitName(unit) {
  return getUnitData(unit).name ?? "Unknown Turret";
}

function addLog(message, isMinor = false) {
  if (simplifyBattleLog && isMinor) return;

  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = message;

  log.appendChild(entry);

  while (log.children.length > MAX_LOG_ENTRIES) {
    log.firstElementChild.remove();
  }

  log.scrollTop = log.scrollHeight;
}

function getSortedEnemies(list) {
  const selectEl = document.getElementById("enemy-sort-select");
  const sortMode = selectEl ? selectEl.value : currentEnemySortMode;

  const sorted = [...list];

  switch (sortMode) {
    case "first":
      return sorted.sort((a, b) => b.location - a.location);
    case "last":
      return sorted.sort((a, b) => a.location - b.location);
    case "strongest":
      return sorted.sort((a, b) => b.health - a.health);
    case "weakest":
      return sorted.sort((a, b) => a.health - b.health);
    case "highest_armor":
      return sorted.sort((a, b) => (b.armor || 0) - (a.armor || 0));
    case "lowest_armor":
      return sorted.sort((a, b) => (a.armor || 0) - (b.armor || 0));
    case "default":
    default:
      return sorted;
  }
}

function toggleUnitLock(unitId) {
  const unit = inventory.find((u) => u.id === unitId);
  if (!unit) return;

  unit.isLocked = !unit.isLocked;
  saveCampaignProgress();

  addLog(
    `${getUnitName(unit)} is now ${unit.isLocked ? "🔒 Locked" : "🔓 Unlocked"}.`,
  );

  // Refresh UI & Open Popup
  renderInventory();
  renderDeployment();
  openUnitPopup(unit.id);
}

function getEffectiveTowerWeight(typeKey, pool, rarityCounts) {
  const data = unitTypes[typeKey];
  const rarity = data?.rarity || "Common";
  const category = data?.category || "Main";

  // Use category-specific weight table
  const weightTable =
    category === "Rear" ? REAR_RARITY_WEIGHTS : MAIN_RARITY_WEIGHTS;
  const baseWeight = weightTable[rarity] ?? 10;
  const count = rarityCounts[rarity] || 1;

  const isFocusUnlocked =
    typeof getTechNodeLevel === "function" &&
    getTechNodeLevel("eco_focus_pool") >= 1;

  const focusedKey =
    category === "Rear" ? focusedRearTowerKey : focusedMainTowerKey;

  const isFocused = isFocusUnlocked && typeKey === focusedKey;
  const focusedRarity = focusedKey
    ? unitTypes[focusedKey]?.rarity || "Common"
    : null;
  const focusedInPool =
    isFocusUnlocked && focusedKey && pool.includes(focusedKey);

  if (!focusedInPool || focusedRarity !== rarity || count <= 1) {
    return baseWeight;
  }

  const M =
    typeof FOCUS_TOWER_MULTIPLIER !== "undefined" ? FOCUS_TOWER_MULTIPLIER : 3;
  const wUnfocused = (count * baseWeight) / (M + count - 1);

  return isFocused ? M * wUnfocused : wUnfocused;
}

function getRearMaxCooldownTicks(unit) {
  // If unit has an existing cooldownMax computed at battle setup, prefer it
  if (unit.cooldownMax && !isBattleRunning()) {
    return Math.round(unit.cooldownMax);
  }

  const baseFireRate = unit.fireRate || unitTypes[unit.type]?.fireRate || 1.0;

  // 1. Tech Tree Bonus Multiplier
  const techBonus =
    typeof getTechMultiplier === "function"
      ? getTechMultiplier("rear_cooldown")
      : typeof getTechNodeLevel === "function"
        ? 1 - getTechNodeLevel("rear_cooldown_speed") * 0.05
        : 1.0;

  // 2. Challenge / Relic Multipliers
  const challengeBonus =
    typeof getChallengeCooldownMultiplier === "function"
      ? getChallengeCooldownMultiplier(unit.category || "Rear")
      : 1.0;

  // Compute total recurring max CD in ticks (excludes temporary -45% first-shot reduction)
  const baseTicks = 100 / Math.max(0.1, baseFireRate);
  const effectiveTicks = baseTicks * techBonus * challengeBonus;

  return Math.max(1, Math.round(effectiveTicks));
}

function getStageEnergyRegenMultiplier(currentStageId) {
  const currentStage = stages.find((s) => s.id === currentStageId);
  if (!currentStage) return 1.0;

  // Highest unlocked stage index (e.g. 49 for 5-10 in 0-indexed array)
  const maxUnlockedIndex = Math.max(1, unlockedStageIndex);
  const currentStageIndex = currentStage.index;

  // Ratio scales from (1 / maxUnlockedIndex) up to 1.0 (100%)
  const ratio = (currentStageIndex + 1) / (maxUnlockedIndex + 1);
  return Math.max(0.1, Number(ratio.toFixed(2))); // 10% floor safety valve
}

function getFatigueRewardMultiplier() {
  const deployed = [...deployedUnits, ...deployedBaseUnits].filter(
    (u) => u !== null,
  );
  const hasFatiguedUnit = deployed.some((u) => u.energy <= 0);

  // If any unit is fatigued, apply 90% reward hit (0.1x gold/XP payout)
  return hasFatiguedUnit ? 0.1 : 1.0;
}

function setShowEffectiveDamage(enabled) {
  showEffectiveDamage = Boolean(enabled);
  const cb = document.getElementById("toggle-show-effective-damage-checkbox");
  if (cb && cb.checked !== showEffectiveDamage)
    cb.checked = showEffectiveDamage;
  saveCampaignProgress();
}

function setShowFrontlineCooldown(enabled) {
  showFrontlineCooldown = Boolean(enabled);
  const checkbox = document.getElementById(
    "toggle-frontline-cooldown-checkbox",
  );
  if (checkbox && checkbox.checked !== showFrontlineCooldown) {
    checkbox.checked = showFrontlineCooldown;
  }
  renderDeployment();
  saveCampaignProgress();
}

function getCooldownDisplayText(unit, isRunning) {
  const fr = unit.fireRate || 1;
  const shotsPerTick = fr / 100;

  // 1. Multi-shot per tick (FR > 100)
  if (shotsPerTick > 1) {
    const formattedShots = Number(shotsPerTick.toFixed(1));
    return {
      text: `CD: ${formattedShots} shots/tick`,
      isReady: true,
    };
  }

  // 2. Single-shot towers (FR <= 100)
  const maxCd = unit.cooldownMax ?? 100 / Math.max(0.1, fr);

  if (!isRunning) {
    const ticks = Math.ceil(maxCd);
    return {
      text: `CD: ${ticks} tick${ticks > 1 ? "s" : ""}`,
      isReady: false,
    };
  }

  // Live battle: Math.max(1, ...) ensures 1 tick is the minimum display floor
  const cdVal = Math.max(0, unit.cooldown ?? 0);
  const ticksRemaining = Math.max(1, Math.ceil(cdVal));

  return {
    text: `CD: ${ticksRemaining} tick${ticksRemaining > 1 ? "s" : ""}`,
    isReady: ticksRemaining === 1,
  };
}

// Global helper for background-proof delays
function startWorkerIntermission(durationMs, callback, tag = null) {
  cancelWorkerIntermission();
  activeIntermissionCallback = callback;
  gameTicker.postMessage({
    action: "startIntermission",
    duration: durationMs,
    tag,
  });
}

function cancelWorkerIntermission() {
  activeIntermissionCallback = null;
  gameTicker.postMessage({ action: "stop" });
}

/* ==========================================================================
   5. TOWER STATS, EXPERIENCE, MERGING and BUILD
   ========================================================================== */

function consumeUnitForXp(targetId, consumedId) {
  if (stageEntered || isBattleRunning()) {
    addLog("You cannot consume units while inside a world.");
    return null;
  }

  const targetIndex = inventory.findIndex((u) => u.id === targetId);
  const consumedIndex = inventory.findIndex((u) => u.id === consumedId);

  if (targetIndex === -1 || consumedIndex === -1 || targetId === consumedId) {
    addLog("Invalid boost selection.");
    return null;
  }

  const target = inventory[targetIndex];
  const consumed = inventory[consumedIndex];

  const startLevel = target.level;
  const startXp = target.xp || 0;
  const startReqXp = getRequiredXp(target);

  const earnedXp = getConsumeXpBonus(consumed, target);
  inventory.splice(consumedIndex, 1);

  target.xp = (target.xp || 0) + earnedXp;

  let levelUps = 0;
  while (target.xp >= getRequiredXp(target)) {
    target.xp -= getRequiredXp(target);
    target.level++;
    levelUps++;
  }

  recalculateUnitStats(target);

  if (levelUps > 0) {
    addLog(
      `⭐ ${getUnitName(target)} consumed ${getUnitName(consumed)} (+${earnedXp} XP) and reached Level ${target.level}!`,
    );
  } else {
    addLog(
      `🚀 ${getUnitName(target)} consumed ${getUnitName(consumed)} (+${earnedXp} XP). Progress: ${target.xp}/${getRequiredXp(target)} XP.`,
    );
  }

  saveCampaignProgress();
  updateUI();
  renderInventory();
  renderDeployment();

  return {
    startLevel,
    startXp,
    startReqXp,
    endLevel: target.level,
    endXp: target.xp,
    endReqXp: getRequiredXp(target),
  };
}

function getLevelMultiplier(unit) {
  const lvl = unit.level;
  // Linear scaling up to Lvl 25, then smooth compounding growth
  if (lvl <= 25) {
    return 1 + 0.1 * (lvl - 1); // Lvl 25 = 3.4x
  }
  return 3.4 * Math.pow(1.03, lvl - 25); // Lvl 150 = ~114x
}

function getGrowthFactor(level, unitCategory) {
  const isRear = unitCategory === "Rear";
  const lvl = Math.min(150, Math.max(1, level));

  // Define growth factor targets at key milestone levels:
  // Lvl 1–9:   High starting factor
  // Lvl 10–29: First sharp drop
  // Lvl 30–49: Second sharp drop
  // Lvl 50+:   Final floor
  const milestones = isRear
    ? [
        { lvl: 1, factor: 1.75 },
        { lvl: 10, factor: 1.55 }, // Drop 1
        { lvl: 30, factor: 1.27 }, // Drop 2
        { lvl: 50, factor: 1.2 }, // Drop 3
        { lvl: 150, factor: 1.19 },
      ]
    : [
        { lvl: 1, factor: 1.65 },
        { lvl: 10, factor: 1.48 }, // Drop 1
        { lvl: 30, factor: 1.3 }, // Drop 2
        { lvl: 50, factor: 1.2 }, // Drop 3
        { lvl: 150, factor: 1.19 },
      ];

  // Find the current milestone segment
  for (let i = 0; i < milestones.length - 1; i++) {
    const start = milestones[i];
    const end = milestones[i + 1];

    if (lvl >= start.lvl && lvl <= end.lvl) {
      if (start.factor === end.factor) return start.factor;

      // Normalize progress within this exact segment (0.0 to 1.0)
      const progress = (lvl - start.lvl) / (end.lvl - start.lvl);

      // Sharp transition curve (x^3 makes the drop happen rapidly near the boundary)
      const sharpProgress = Math.pow(progress, 3);

      const factor = start.factor - (start.factor - end.factor) * sharpProgress;
      return Number(factor.toFixed(3));
    }
  }

  return isRear ? 1.25 : 1.2;
}

function getRequiredXp(unitOrLevel, category = "Main", xpDiscountMult = 1.0) {
  let level = 1;
  let unitCategory = category;

  if (typeof unitOrLevel === "object" && unitOrLevel !== null) {
    level = unitOrLevel.level ?? 1;
    unitCategory = unitOrLevel.category || "Main";
  } else {
    level = unitOrLevel ?? 1;
  }

  const baseAmount = unitCategory === "Rear" ? 75 : 50;
  const growthFactor = getGrowthFactor(level, unitCategory);

  const rawXp = Math.round(
    baseAmount * Math.pow(growthFactor, Math.max(0, level - 1)),
  );

  // Apply tech tree / rarity discount (e.g., 0.90 for 10% discount)
  return Math.round(rawXp * xpDiscountMult);
}

function calculateWaveXp(enemyLevel, towerLevel) {
  const baseWaveXp = 25 + enemyLevel * 5;
  const levelDiff = enemyLevel - towerLevel;

  if (levelDiff <= 0) {
    const penaltyMult = Math.max(0.3, 1 + levelDiff * 0.02);
    return Math.max(1, Math.round(baseWaveXp * penaltyMult));
  }

  let effectiveDiff;
  if (levelDiff <= 30) {
    // Normal logarithmic scaling up to +30 gap
    effectiveDiff = 26 * Math.log(1 + levelDiff / 26);
  } else {
    // Hard logarithmic taper past +30 (smoothly anchored at gap 30)
    const baseAt30 = 26 * Math.log(1 + 30 / 26); // ~19.95
    const slopeAt30 = 26 / 56; // ~0.464
    const taperStrength = 3.0;

    effectiveDiff =
      baseAt30 +
      taperStrength *
        Math.log(1 + (slopeAt30 / taperStrength) * (levelDiff - 30));
  }

  const multiplier = Math.pow(1.21, effectiveDiff);

  return Math.max(1, Math.round(baseWaveXp * multiplier));
}

function awardWaveXpToDeployedUnits(enemyLevel) {
  const deployed = [...deployedUnits, ...deployedBaseUnits].filter(
    (unit) => unit !== null,
  );
  if (deployed.length === 0) return;

  const totalWaveDamage = deployed.reduce(
    (sum, unit) => sum + (unit.waveDamage || 0),
    0,
  );

  const techMult =
    typeof getTechWaveExpMultiplier === "function"
      ? getTechWaveExpMultiplier()
      : 1;

  // Base XP pool assumes a full 6-slot deployment
  const TOTAL_SLOTS = 6;
  const singleBaseWaveXp = 15 + enemyLevel * 5;
  const unitBaseShare = (singleBaseWaveXp * TOTAL_SLOTS) / deployed.length;

  // Target share with 90% forgiveness buffer
  const targetShare = (1 / deployed.length) * 0.9;
  const CLIFF_THRESHOLD = 0.25; // 25% of target share cutoff

  for (const unit of deployed) {
    const levelDiff = enemyLevel - unit.level;

    // Calculate level difference multiplier
    let mult = 1.0;
    if (levelDiff <= 0) {
      mult = Math.max(0.1, 1 + levelDiff * 0.05);
    } else {
      let effectiveDiff;
      if (levelDiff <= 30) {
        effectiveDiff = 26 * Math.log(1 + levelDiff / 26);
      } else {
        const baseAt30 = 26 * Math.log(1 + 30 / 26);
        const slopeAt30 = 26 / 56;
        effectiveDiff =
          baseAt30 + 3.0 * Math.log(1 + (slopeAt30 / 3.0) * (levelDiff - 30));
      }
      mult = Math.pow(1.21, effectiveDiff);
    }

    const rawBaseXp = Math.max(1, Math.round(unitBaseShare * mult));

    const damageShare =
      totalWaveDamage > 0 ? (unit.waveDamage || 0) / totalWaveDamage : 0;

    // Piecewise Contribution Scaling (Plateau & Cliff)
    const rawRatio = Math.min(1.0, damageShare / targetShare);
    let contributionRatio = 0;

    if (rawRatio >= CLIFF_THRESHOLD) {
      // Plateau (25% to 100% target share): Scales from 50% to 100% base XP
      const progress = (rawRatio - CLIFF_THRESHOLD) / (1 - CLIFF_THRESHOLD);
      contributionRatio = 0.5 + 0.5 * progress;
    } else {
      // Cliff (0% to 25% target share): Drops quadratically from 50% down to 0%
      const cliffProgress = rawRatio / CLIFF_THRESHOLD;
      contributionRatio = 0.5 * Math.pow(cliffProgress, 2);
    }

    const baseEarnedXp = Math.round(rawBaseXp * contributionRatio);

    // Bonus XP for carrying damage
    let damageBonusXp = 0;
    if (totalWaveDamage > 0 && (unit.waveDamage || 0) > 0) {
      damageBonusXp = Math.round(
        rawBaseXp * damageShare * deployed.length * 0.5,
      );
    }

    const earnedXp = Math.round((baseEarnedXp + damageBonusXp) * techMult);
    unit.xp = (unit.xp ?? 0) + earnedXp;

    unit.stageXpGained = (unit.stageXpGained || 0) + earnedXp;
    unit.stageDamage = (unit.stageDamage || 0) + (unit.waveDamage || 0);
    unit.stageKills = (unit.stageKills || 0) + (unit.waveKills || 0);

    let levelUps = 0;
    while (unit.xp >= getRequiredXp(unit)) {
      unit.xp -= getRequiredXp(unit);
      unit.level++;
      levelUps++;
    }

    if (levelUps > 0) {
      recalculateUnitStats(unit);
      addLog(
        `⭐ ${getUnitName(unit)} leveled up to Level ${unit.level}! (+${earnedXp} XP)`,
      );
    } else {
      const bonusText =
        damageBonusXp > 0 ? ` (+${damageBonusXp} dmg bonus)` : "";
      addLog(
        `${getUnitName(unit)} earned ${earnedXp} XP${bonusText} (${unit.xp}/${getRequiredXp(unit)} XP).`,
        true,
      );
    }
  }

  renderDeployment();
  renderInventory();
}

function recalculateUnitStats(unit) {
  const data = unitTypes[unit.type];
  if (!data) return;

  // Ensure core progression stats exist
  unit.level = Number.isInteger(unit.level) && unit.level >= 1 ? unit.level : 1;
  unit.xp = Number.isInteger(unit.xp) && unit.xp >= 0 ? unit.xp : 0;
  unit.category = data.category || "Main";
  unit.upgradeCount =
    Number.isInteger(unit.upgradeCount) && unit.upgradeCount >= 0
      ? unit.upgradeCount
      : 0;

  // Retrieve Challenge Bonuses
  const cbDamage =
    typeof getChallengeBonusLevel === "function"
      ? getChallengeBonusLevel("cb_base_damage") * 0.5
      : 0;
  const cbFireRate =
    typeof getChallengeBonusLevel === "function"
      ? getChallengeBonusLevel("cb_reload_speed") * 0.1
      : 0;

  // 1. Set Base Tower Stats (Template Base + Flat Challenge Bonuses)
  unit.baseDamage = data.damage + cbDamage;
  unit.baseFireRate = data.fireRate + cbFireRate;
  unit.baseRange = data.range;
  unit.baseArmorPen = data.armorPen || 0;

  // Ensure upgrade bonuses container exists
  if (!unit.upgradeBonuses || typeof unit.upgradeBonuses !== "object") {
    unit.upgradeBonuses = { damage: 0, fireRate: 0, range: 0, armorPen: 0 };
  }

  for (const stat of ["damage", "fireRate", "range", "armorPen"]) {
    const bonus = unit.upgradeBonuses[stat];
    unit.upgradeBonuses[stat] =
      Number.isFinite(bonus) && bonus >= 0 ? bonus : 0;
  }

  // Level multipliers
  const damageMultiplier = 1 + 0.1 * (unit.level - 1);
  const fireRateMultiplier = 1 + 0.01 * (unit.level - 1);

  // Retrieve Tech Multipliers
  const techDmgMult =
    unit.category === "Rear"
      ? typeof getTechArtilleryDamageMultiplier === "function"
        ? getTechArtilleryDamageMultiplier()
        : 1
      : typeof getTechMainDamageMultiplier === "function"
        ? getTechMainDamageMultiplier()
        : 1;

  const techFrMult =
    unit.category === "Main"
      ? typeof getTechMainFireRateMultiplier === "function"
        ? getTechMainFireRateMultiplier()
        : typeof getTechFireRateMultiplier === "function"
          ? getTechFireRateMultiplier()
          : 1
      : 1;

  const techRangeBonus =
    unit.category === "Main"
      ? typeof getTechMainRangeBonus === "function"
        ? getTechMainRangeBonus()
        : 0
      : 0;

  const techArmorPenBonus =
    typeof getTechMainArmorPenetration === "function"
      ? getTechMainArmorPenetration(unit)
      : 0;

  // 2. Non-Tech Raw Stats (Base + Upgrades * Level Multiplier)
  unit.rawDamage = Math.round(
    (unit.baseDamage + unit.upgradeBonuses.damage) * damageMultiplier,
  );
  unit.rawFireRate = Number(
    (
      (unit.baseFireRate + unit.upgradeBonuses.fireRate) *
      fireRateMultiplier
    ).toFixed(4),
  );
  unit.rawRange = unit.baseRange + unit.upgradeBonuses.range;
  unit.rawArmorPen = unit.baseArmorPen + unit.upgradeBonuses.armorPen;

  // 3. Final Stats (Including Tech Tree & Challenge Bonuses)
  unit.damage = Math.round(unit.rawDamage * techDmgMult);
  unit.fireRate = Number((unit.rawFireRate * techFrMult).toFixed(4));
  unit.range = unit.rawRange + techRangeBonus;
  unit.armorPen = unit.rawArmorPen + techArmorPenBonus;

  // 4. Derive Cooldown Ticks cleanly from final fireRate
  unit.cooldownMax = 100 / Math.max(0.1, unit.fireRate);
  if (!Number.isFinite(unit.cooldown)) unit.cooldown = 0;
}

function calculateTowerPower(unit) {
  if (!unit) return 0;
  const dps = unit.damage * (unit.fireRate / 10);
  const maxLaneLength = maxSlots + 1;
  const effectiveRange = Math.min(unit.range, Math.ceil(maxLaneLength / 2));
  return Math.round(dps * effectiveRange);
}

function restoreUnit(unit) {
  if (!unit || !unit.type || !unitTypes[unit.type]) {
    unit.type = "cannon";
  }

  const baseData = getUnitData(unit);

  if (!Number.isInteger(unit.level) || unit.level < 1) unit.level = 1;
  if (!Number.isInteger(unit.xp) || unit.xp < 0) unit.xp = 0;
  if (!Number.isInteger(unit.upgradeCount) || unit.upgradeCount < 0)
    unit.upgradeCount = 0;

  unit.category = baseData.category || "Main";
  unit.targeting ??= unit.category === "Rear" ? "Strongest" : "First";

  unit.waveDamage =
    Number.isFinite(unit.waveDamage) && unit.waveDamage >= 0
      ? unit.waveDamage
      : 0;
  unit.totalDamage =
    Number.isFinite(unit.totalDamage) && unit.totalDamage >= 0
      ? unit.totalDamage
      : 0;
  unit.waveKills =
    Number.isFinite(unit.waveKills) && unit.waveKills >= 0 ? unit.waveKills : 0;
  unit.totalKills =
    Number.isFinite(unit.totalKills) && unit.totalKills >= 0
      ? unit.totalKills
      : 0;

  // Set max energy to 100 and update legacy 10/10 values
  if (!unit.maxEnergy || unit.maxEnergy === 10) {
    unit.maxEnergy = 100;
  }
  if (!Number.isFinite(unit.energy) || unit.energy > unit.maxEnergy) {
    unit.energy = unit.maxEnergy;
  }

  if (!unit.upgradeBonuses || typeof unit.upgradeBonuses !== "object") {
    unit.upgradeBonuses = {
      damage: Math.max(0, (unit.damage ?? baseData.damage) - baseData.damage),
      fireRate: Math.max(
        0,
        (unit.fireRate ?? baseData.fireRate) - baseData.fireRate,
      ),
      range: Math.max(0, (unit.range ?? baseData.range) - baseData.range),
    };
  }

  unit.selectedSlot ??= null;
  unit.location ??= 0;
  unit.cooldown ??= 0;

  recalculateUnitStats(unit);
}

function getAvailableUnitPool(category = "Main") {
  const techLevel =
    typeof getTechNodeLevel === "function" ? getTechNodeLevel("eco_pool") : 0;

  if (category === "Rear") {
    const currentRearPool = [...rearPool];
    if (techLevel >= 1) currentRearPool.push(...rearPoolUpgrade1);
    if (techLevel >= 2) currentRearPool.push(...rearPoolUpgrade2);
    if (techLevel >= 3) currentRearPool.push(...rearPoolUpgrade3);
    if (techLevel >= 4) currentRearPool.push(...rearPoolUpgrade4);
    if (techLevel >= 5) currentRearPool.push(...rearPoolUpgrade5);
    return currentRearPool;
  }

  const currentPool = [...pool];
  if (techLevel >= 1) currentPool.push(...poolUpgrade1);
  if (techLevel >= 2) currentPool.push(...poolUpgrade2);
  if (techLevel >= 3) currentPool.push(...poolUpgrade3);
  if (techLevel >= 4) currentPool.push(...poolUpgrade4);
  if (techLevel >= 5) currentPool.push(...poolUpgrade5);
  return currentPool;
}

function getRandomUnitTypeByCategory(category = "Main") {
  const availableKeys = getAvailableUnitPool(category);
  const weightTable =
    category === "Rear" ? REAR_RARITY_WEIGHTS : MAIN_RARITY_WEIGHTS;

  // 1. Find which rarities exist in the current unlocked pool
  const presentRarities = [
    ...new Set(availableKeys.map((k) => unitTypes[k]?.rarity || "Common")),
  ];

  // 2. Roll for Rarity Tier first
  let totalRarityWeight = 0;
  presentRarities.forEach((r) => (totalRarityWeight += weightTable[r] || 10));

  let rarityRoll = Math.random() * totalRarityWeight;
  let selectedRarity = presentRarities[0];

  for (const r of presentRarities) {
    const w = weightTable[r] || 10;
    if (rarityRoll < w) {
      selectedRarity = r;
      break;
    }
    rarityRoll -= w;
  }

  // 3. Pick a unit uniformly from the chosen rarity tier
  const matchingUnits = availableKeys.filter(
    (k) => (unitTypes[k]?.rarity || "Common") === selectedRarity,
  );
  return matchingUnits[Math.floor(Math.random() * matchingUnits.length)];
}

function buyRandomUnit(category = "Main", count = 1) {
  if (isBattleRunning()) return;

  if (category === "Rear") {
    const rearUnlocked =
      typeof isRearBuildUnlocked === "function"
        ? isRearBuildUnlocked()
        : typeof getTechNodeLevel === "function"
          ? getTechNodeLevel("eco_base_build") >= 1
          : true;

    if (!rearUnlocked) {
      addLog(
        "Rear towers are locked! Research Base Defense Protocol in the Tech Tree.",
      );
      return;
    }
  }

  const singleGoldCost = category === "Rear" ? rearUnitCost : unitCost;
  const singleStCost = category === "Rear" ? rearStPullCost : stPullCost;
  const totalCost = singleGoldCost * count;
  const totalStCost = singleStCost * count;

  if (gold < totalCost) {
    addLog(
      `Not enough gold to buy ${count > 1 ? `${count}x ` : "a "}${category} tower${count > 1 ? "s" : ""}.`,
    );
    return;
  }

  if (st < totalStCost) {
    addLog(
      `Not enough ST to buy ${count > 1 ? `${count}x ` : "a "}${category} tower${count > 1 ? "s" : ""}.`,
    );
    return;
  }

  gold -= totalCost;
  st -= totalStCost;

  const obtainedCounts = {};
  const pulledItems = [];

  for (let i = 0; i < count; i++) {
    const unitType = getRandomUnitTypeByCategory(category);
    const alreadyInInventory = inventory.some((u) => u.type === unitType);
    const alreadyDeployedMain = deployedUnits.some(
      (u) => u !== null && u.type === unitType,
    );
    const alreadyDeployedBase = deployedBaseUnits.some(
      (u) => u !== null && u.type === unitType,
    );

    const alreadyOwns =
      alreadyInInventory || alreadyDeployedMain || alreadyDeployedBase;

    const unit = createUnit(unitType);
    unit.isLocked = !alreadyOwns;

    inventory.push(unit);

    const data = getUnitData(unit);
    const name = data.name ?? "Unknown Turret";
    obtainedCounts[name] = (obtainedCounts[name] || 0) + 1;
    pulledItems.push({ unit, data, isNew: !alreadyOwns });
  }

  saveCampaignProgress();

  if (count === 1) {
    const singleName = Object.keys(obtainedCounts)[0];
    addLog(
      `Obtained ${singleName} (${category})! (-${totalCost} Gold, -${totalStCost} ST)`,
    );
  } else {
    const summary = Object.entries(obtainedCounts)
      .map(([name, qty]) => (qty > 1 ? `${name} x${qty}` : name))
      .join(", ");
    addLog(
      `Obtained ${count}x ${category} Towers: ${summary}! (-${totalCost} Gold, -${totalStCost} ST)`,
    );
  }

  updateUI();
  renderInventory();

  if (typeof playBuildAnimation === "function") {
    playBuildAnimation(pulledItems, category);
  }
}

function createUnit(type) {
  const baseData = unitTypes[type];

  const unit = {
    ...baseData,
    id: nextUnitId++,
    type,
    category: baseData.category || "Main",
    level: 1,
    xp: 0,
    energy: 100,
    maxEnergy: 100,
    upgradeCount: 0,
    waveDamage: 0,
    totalDamage: 0,
    waveKills: 0,
    totalKills: 0,
    baseDamage: baseData.damage,
    baseFireRate: baseData.fireRate,
    baseRange: baseData.range,
    upgradeBonuses: { damage: 0, fireRate: 0, range: 0 },
    location: 0,
    cooldownMax: 100 / Math.max(0.1, baseData.fireRate),
    cooldown: 0,
    selectedSlot: null,
  };

  recalculateUnitStats(unit);
  return unit;
}

function getUpgradeCost(unit) {
  if (!unit) return 0;

  const rarity = (unit.rarity || "common").toLowerCase();
  const category = (
    unit.category ||
    unitTypes[unit.type]?.category ||
    "Main"
  ).toLowerCase();

  const lookupKey = `${rarity}_${category}`;

  const baseCost =
    unit.baseUpgradeCost ??
    BASE_UPGRADE_COSTS[lookupKey] ??
    BASE_UPGRADE_COSTS[rarity] ??
    30;

  const growthFactor =
    typeof techNodes !== "undefined" && techNodes.eco_discount
      ? techNodes.eco_discount.getBonus(getTechNodeLevel("eco_discount"))
      : 3.5;

  return Math.round(baseCost * Math.pow(growthFactor, unit.upgradeCount ?? 0));
}

function upgradeUnit(targetId, duplicateId) {
  if (stageEntered || isBattleRunning()) {
    addLog("You cannot upgrade units while inside a world.");
    return;
  }

  const targetIndex = inventory.findIndex((unit) => unit.id === targetId);
  const duplicateIndex = inventory.findIndex((unit) => unit.id === duplicateId);

  if (targetIndex === -1 || duplicateIndex === -1 || targetId === duplicateId) {
    addLog("Invalid upgrade selection.");
    return;
  }

  const target = inventory[targetIndex];
  const duplicate = inventory[duplicateIndex];

  if (target.type !== duplicate.type) {
    addLog("You can only merge towers of the same type.");
    return;
  }

  const cost = getUpgradeCost(target);

  if (gold < cost) {
    addLog(`Not enough gold. This upgrade costs ${cost} gold.`);
    return;
  }

  gold -= cost;
  inventory.splice(duplicateIndex, 1);

  const roll = Math.random();
  let stat;

  if (roll < 0.6) {
    stat = "damage";
  } else {
    stat = "fireRate";
  }

  const rarityMult = rarityMultipliers[getUnitData(target).rarity] || 1.0;

  const increases = {
    damage: Math.max(0, Math.round(target.baseDamage * 0.5 * rarityMult)),

    fireRate: Math.max(
      0,
      Number((target.baseFireRate * 0.35 * rarityMult).toFixed(4)),
    ),
  };

  const oldValue = target[stat];

  target.upgradeBonuses[stat] += increases[stat];
  target.upgradeCount++;

  recalculateUnitStats(target);
  selectedUpgradeTargetId = null;

  addLog(
    `${getUnitName(target)} upgraded! ${stat}: ${oldValue} → ${target[stat]}. ${getUnitName(duplicate)} was consumed.`,
  );

  saveCampaignProgress();
  updateUI();
  renderInventory();
  renderDeployment();
}

/* ==========================================================================
   6. DEPLOYMENT, PRESETS & RANGE VIEWER
   ========================================================================== */

function deployUnit(unitId, slotIndex) {
  if (stageEntered || isBattleRunning()) {
    addLog("You cannot change deployment while inside a world.");
    return;
  }

  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= maxSlots)
    return;

  if (deployedUnits[slotIndex] !== null) {
    addLog(`Slot ${slotIndex + 1} is already occupied.`);
    return;
  }

  const maxAllowed = getMaxDeployedUnits();
  if (getDeployedCount() >= maxAllowed) {
    addLog(`Deployment limit reached. Maximum: ${maxAllowed} units.`);
    return;
  }

  const inventoryIndex = inventory.findIndex((unit) => unit.id === unitId);
  if (inventoryIndex === -1) return;

  const unit = inventory[inventoryIndex];
  if ((unit.category || "Main") !== "Main") {
    addLog("Only Main towers can be deployed in lane slots.");
    return;
  }

  // Check for duplicate tower type in field deployment
  const isAlreadyDeployed = deployedUnits.some(
    (u) => u !== null && u.type === unit.type,
  );
  if (isAlreadyDeployed) {
    addLog(`You can only deploy one ${getUnitName(unit)} at a time!`);
    return;
  }

  inventory.splice(inventoryIndex, 1);
  unit.location = slotIndex + 1;
  unit.selectedSlot = slotIndex;
  deployedUnits[slotIndex] = unit;

  if (selectedUpgradeTargetId === unit.id) selectedUpgradeTargetId = null;

  saveCampaignProgress();
  addLog(`${getUnitName(unit)} deployed to slot ${slotIndex + 1}.`);

  updateUI();
  renderInventory();
  renderDeployment();
}

function deployBaseUnit(unitId, baseSlotIndex) {
  if (stageEntered || isBattleRunning()) {
    addLog("You cannot change deployment while inside a world.");
    return;
  }

  if (
    !Number.isInteger(baseSlotIndex) ||
    baseSlotIndex < 0 ||
    baseSlotIndex >= maxBaseSlots
  )
    return;

  if (deployedBaseUnits[baseSlotIndex] !== null) {
    addLog(`Base Slot ${baseSlotIndex + 1} is already occupied.`);
    return;
  }

  const inventoryIndex = inventory.findIndex((unit) => unit.id === unitId);
  if (inventoryIndex === -1) return;

  const unit = inventory[inventoryIndex];
  if (unit.category !== "Rear") {
    addLog("Only Rear towers can be deployed in Base slots.");
    return;
  }

  // Check for duplicate tower type in backline deployment
  const isAlreadyDeployed = deployedBaseUnits.some(
    (u) => u !== null && u.type === unit.type,
  );
  if (isAlreadyDeployed) {
    addLog(`You can only deploy one ${getUnitName(unit)} at a time!`);
    return;
  }

  inventory.splice(inventoryIndex, 1);
  unit.location = typeof laneEnd !== "undefined" ? laneEnd : maxSlots + 1;
  unit.selectedSlot = baseSlotIndex;
  deployedBaseUnits[baseSlotIndex] = unit;

  saveCampaignProgress();
  addLog(`${getUnitName(unit)} deployed to Base Slot ${baseSlotIndex + 1}.`);

  updateUI();
  renderInventory();
  renderDeployment();
}

function undeployUnit(slotIndex) {
  if (stageEntered || isBattleRunning()) {
    addLog("You cannot recall units while inside a world.");
    return;
  }

  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= maxSlots)
    return;

  const unit = deployedUnits[slotIndex];
  if (unit === null) return;

  deployedUnits[slotIndex] = null;
  unit.location = 0;
  unit.selectedSlot = slotIndex;
  inventory.push(unit);

  if (rangeViewUnitId === unit.id) rangeViewUnitId = null;

  saveCampaignProgress();
  addLog(`${getUnitName(unit)} recalled from slot ${slotIndex + 1}.`);

  updateUI();
  renderInventory();
  renderDeployment();
}

function undeployBaseUnit(baseSlotIndex) {
  if (stageEntered || isBattleRunning()) {
    addLog("You cannot recall units while inside a world.");
    return;
  }

  if (
    !Number.isInteger(baseSlotIndex) ||
    baseSlotIndex < 0 ||
    baseSlotIndex >= maxBaseSlots
  )
    return;

  const unit = deployedBaseUnits[baseSlotIndex];
  if (unit === null) return;

  deployedBaseUnits[baseSlotIndex] = null;
  unit.location = 0;
  unit.selectedSlot = baseSlotIndex;
  inventory.push(unit);

  saveCampaignProgress();
  addLog(`${getUnitName(unit)} recalled from Base Slot ${baseSlotIndex + 1}.`);

  updateUI();
  renderInventory();
  renderDeployment();
}

function undeployAll() {
  if (stageEntered || isBattleRunning()) return false;

  for (let i = 0; i < maxSlots; i++) {
    if (deployedUnits[i] !== null) {
      const unit = deployedUnits[i];
      deployedUnits[i] = null;
      unit.location = 0;
      inventory.push(unit);
    }
  }

  for (let i = 0; i < maxBaseSlots; i++) {
    if (deployedBaseUnits[i] !== null) {
      const unit = deployedBaseUnits[i];
      deployedBaseUnits[i] = null;
      unit.location = 0;
      inventory.push(unit);
    }
  }

  return true;
}

function toggleRangeView(unitId) {
  rangeViewUnitId = rangeViewUnitId === unitId ? null : unitId;
  renderDeployment();
}

function getRangeViewUnit() {
  return (
    deployedUnits.find(
      (unit) => unit !== null && unit.id === rangeViewUnitId,
    ) ?? null
  );
}

function togglePresets() {
  presetsExpanded = !presetsExpanded;
  const panel = document.getElementById("preset-panel");
  const toggleBtn = document.getElementById("toggle-presets-btn");

  if (panel) panel.classList.toggle("hidden", !presetsExpanded);
  if (toggleBtn) {
    toggleBtn.textContent = presetsExpanded ? "Presets ▲" : "Presets ▼";
    toggleBtn.classList.toggle("active", presetsExpanded);
  }
}

function renderPresetBar() {
  const panel = document.getElementById("preset-panel");
  if (!panel) return;

  panel.replaceChildren();

  const disabled = stageEntered || isBattleRunning();
  const list = document.createElement("div");
  list.className = "preset-list";

  for (let i = 0; i < 3; i++) {
    const group = document.createElement("div");
    group.className = "preset-group";

    const isSaved = deploymentPresets[i] !== null;

    const label = document.createElement("span");
    label.className = "preset-label";
    label.textContent = `P${i + 1}`;

    const actions = document.createElement("div");
    actions.className = "preset-actions";

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.textContent = "Deploy";
    loadBtn.disabled = disabled || !isSaved;
    loadBtn.className = isSaved
      ? "preset-btn load-btn"
      : "preset-btn load-btn empty";
    loadBtn.addEventListener("click", () => applyPreset(i));

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.textContent = "Save";
    saveBtn.disabled = disabled;
    saveBtn.className = "preset-btn save-btn";
    saveBtn.addEventListener("click", () => savePreset(i));

    actions.append(loadBtn, saveBtn);
    group.append(label, actions);
    list.appendChild(group);
  }

  panel.appendChild(list);

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.textContent = "Recall All";
  clearBtn.disabled = disabled;
  clearBtn.className = "preset-btn recall-btn";
  clearBtn.addEventListener("click", () => {
    if (undeployAll()) {
      saveCampaignProgress();
      updateUI();
      renderInventory();
      renderDeployment();
      addLog("Recalled all deployed units to inventory.");
    }
  });

  panel.appendChild(clearBtn);
}

function applyPreset(index) {
  if (stageEntered || isBattleRunning()) {
    addLog("You cannot change deployment while inside a world.");
    return;
  }

  const preset = deploymentPresets[index];
  if (!preset) {
    addLog(`Preset ${index + 1} is empty! Save a setup first.`);
    return;
  }

  undeployAll();

  let deployedMainCount = 0;
  const allowedMainMax = getMaxDeployedUnits();

  preset.main.forEach((unitId, slotIndex) => {
    if (!unitId || slotIndex >= maxSlots) return;
    if (deployedMainCount >= allowedMainMax) return;

    const invIdx = inventory.findIndex((u) => u.id === unitId);
    if (invIdx !== -1) {
      const unit = inventory[invIdx];
      const isAlreadyDeployed = deployedUnits.some(
        (u) => u !== null && u.type === unit.type,
      );
      if ((unit.category || "Main") === "Main" && !isAlreadyDeployed) {
        inventory.splice(invIdx, 1);
        unit.location = slotIndex + 1;
        unit.selectedSlot = slotIndex;
        deployedUnits[slotIndex] = unit;
        deployedMainCount++;
      }
    }
  });

  preset.base.forEach((unitId, baseSlotIndex) => {
    if (!unitId || baseSlotIndex >= maxBaseSlots) return;

    const invIdx = inventory.findIndex((u) => u.id === unitId);
    if (invIdx !== -1) {
      const unit = inventory[invIdx];
      if (unit.category === "Rear") {
        inventory.splice(invIdx, 1);
        unit.location = typeof laneEnd !== "undefined" ? laneEnd : maxSlots + 1;
        unit.selectedSlot = baseSlotIndex;
        deployedBaseUnits[baseSlotIndex] = unit;
      }
    }
  });

  saveCampaignProgress();
  addLog(`⚡ Loaded Deployment Preset ${index + 1}!`);

  updateUI();
  renderInventory();
  renderDeployment();
}

function updateDeploymentCount() {
  const countEl = document.getElementById("deployment-count");
  if (!countEl) return;

  const deployedMainCount = deployedUnits.filter((u) => u !== null).length;
  const maxMainSlots = getMaxDeployedUnits();

  countEl.textContent = `(${deployedMainCount}/${maxMainSlots})`;
}

function createTargetingSelect(unit) {
  const select = document.createElement("select");
  select.className = "targeting-select";
  select.setAttribute("aria-label", "Targeting mode");

  const modes = [
    { value: "First", label: "First" },
    { value: "Strongest", label: "Strong" },
    { value: "Weakest", label: "Weak" },
    { value: "Last", label: "Last" },
    { value: "Highest Armor", label: "Armor" },
    { value: "Lowest Armor", label: "Light" },
  ];

  const currentMode =
    unit.targeting || (unit.category === "Rear" ? "Strongest" : "First");

  for (const mode of modes) {
    const opt = document.createElement("option");
    opt.value = mode.value;
    opt.textContent = mode.label;
    if (currentMode === mode.value) opt.selected = true;
    select.appendChild(opt);
  }

  select.addEventListener("change", (e) => {
    unit.targeting = e.target.value;
    saveCampaignProgress();
  });

  return select;
}

function renderDeployment() {
  renderPresetBar();
  updateDeploymentCount();
  slots.replaceChildren();
  if (baseSlotsContainer) baseSlotsContainer.replaceChildren();

  const rangeUnit = getRangeViewUnit();

  // 1. Render Main Tower Slots
  for (let i = 0; i < maxSlots; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";

    if (rangeUnit && Math.abs(i + 1 - rangeUnit.location) <= rangeUnit.range) {
      slot.classList.add("range-covered");
    }

    if (deployedUnits[i] === null) {
      slot.textContent = `Slot ${i + 1} — Empty`;
    } else {
      const unit = deployedUnits[i];
      const data = getUnitData(unit);

      const name = document.createElement("strong");
      name.textContent = `Slot ${i + 1}: ${data.name}`;

      const cdBadge = document.createElement("span");
      cdBadge.className = "cooldown-badge";
      cdBadge.id = `main-slot-cd-${i}`;

      if (showFrontlineCooldown) {
        const { text, isReady } = getCooldownDisplayText(
          unit,
          isBattleRunning(),
        );
        cdBadge.textContent = text;
        cdBadge.classList.toggle("ready", isReady);
      } else {
        cdBadge.style.display = "none";
      }

      const reqXp = getRequiredXp(unit);
      const details = document.createElement("p");
      details.textContent = `Level ${unit.level} (${unit.xp}/${reqXp} XP) | Upgrades: ${unit.upgradeCount} | Range: ${unit.range}`;

      const xpTrack = document.createElement("div");
      xpTrack.className = "xp-track";

      const xpFill = document.createElement("div");
      xpFill.className = "xp-fill";
      xpFill.style.width = `${Math.min(100, (unit.xp / reqXp) * 100)}%`;

      xpTrack.appendChild(xpFill);

      const rangeButton = document.createElement("button");
      rangeButton.className = "range-toggle";
      rangeButton.textContent = rangeViewUnitId === unit.id ? "Hide" : "Range";

      if (rangeViewUnitId === unit.id) {
        rangeButton.classList.add("selected");
        slot.classList.add("range-selected");
      }

      rangeButton.addEventListener("click", () => toggleRangeView(unit.id));

      const rangeInfo = document.createElement("div");
      rangeInfo.className = "range-info";
      rangeInfo.id = `range-info-${unit.id}`;

      const recallButton = document.createElement("button");
      recallButton.textContent = "Recall";
      recallButton.disabled = stageEntered || isBattleRunning();
      recallButton.addEventListener("click", () => undeployUnit(i));

      const targetSelect = createTargetingSelect(unit);

      const buttonRow = document.createElement("div");
      buttonRow.className = "slot-buttons";
      buttonRow.append(rangeButton, targetSelect, recallButton);

      slot.append(name, cdBadge, details, xpTrack, buttonRow, rangeInfo);
    }

    slots.appendChild(slot);
  }

  // 2. Render Base / Backline Tower Slots
  if (baseSlotsContainer) {
    for (let i = 0; i < maxBaseSlots; i++) {
      const slot = document.createElement("div");
      slot.className = "slot base-slot";

      const unit = deployedBaseUnits[i];
      if (unit === null) {
        slot.textContent = `Base Slot ${i + 1} — Empty`;
      } else {
        const data = getUnitData(unit);

        const name = document.createElement("strong");
        name.textContent = `Base Slot ${i + 1}: ${data.name}`;

        const reqXp = getRequiredXp(unit);
        const details = document.createElement("p");
        details.textContent = `Level ${unit.level} (${unit.xp}/${reqXp} XP) | Upgrades: ${unit.upgradeCount} | ${data.rarity}`;

        const cdBadge = document.createElement("span");
        cdBadge.className = "cooldown-badge";
        cdBadge.id = `base-slot-cd-${i}`;

        if (showBacklineCooldown) {
          if (isBattleRunning()) {
            // Live Battle: Read remaining cooldown directly from unit state
            const currentCd = Math.max(0, Math.ceil(unit.cooldown || 0));
            cdBadge.textContent =
              currentCd > 0 ? `CD: ${currentCd} ticks` : `⚡ Ready`;
            if (currentCd === 0) cdBadge.classList.add("ready");
          } else {
            // Out of Battle: Show max recurring CD calculated with all permanent buffs
            const maxCd = getRearMaxCooldownTicks(unit);
            cdBadge.textContent = `CD: ${maxCd} ticks`;
          }
        } else {
          cdBadge.style.display = "none";
        }

        const recallButton = document.createElement("button");
        recallButton.textContent = "Recall";
        recallButton.disabled = stageEntered || isBattleRunning();
        recallButton.addEventListener("click", () => undeployBaseUnit(i));

        const targetSelect = createTargetingSelect(unit);

        const buttonRow = document.createElement("div");
        buttonRow.className = "slot-buttons";
        buttonRow.append(targetSelect, recallButton);

        slot.append(name, cdBadge, details, buttonRow);
      }

      baseSlotsContainer.appendChild(slot);
    }
  }

  // 3. Apply Dynamic Swapped Layout Order
  const mainSlotsRow = slots
    ? slots.closest(".main-deployment-row") || slots
    : null;
  const baseSlotsRow = baseSlotsContainer
    ? baseSlotsContainer.closest(".base-deployment-row") || baseSlotsContainer
    : null;

  if (baseSlotsRow && mainSlotsRow && mainSlotsRow.parentNode) {
    const parent = mainSlotsRow.parentNode;
    if (swapDeploymentLayout) {
      parent.insertBefore(baseSlotsRow, mainSlotsRow);
    } else {
      parent.insertBefore(mainSlotsRow, baseSlotsRow);
    }
  }

  updateUI();
  renderInventory();

  if (typeof updateRangeEnemyInfo === "function") updateRangeEnemyInfo();
  if (typeof renderStatsList === "function") renderStatsList();
}

/* ==========================================================================
   7. INVENTORY, WAREHOUSE & POPUPS
   ========================================================================== */

function renderWarehouseList() {
  inventoryList.replaceChildren();

  const activeResources = [];
  if (gold > 0)
    activeResources.push({ name: "Gold", count: gold.toLocaleString() });
  if (st > 0) activeResources.push({ name: "ST", count: st.toLocaleString() });

  const activeItems = warehouse.filter((item) => item.count > 0);

  if (activeResources.length === 0 && activeItems.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "No stored materials in warehouse.";
    inventoryList.appendChild(emptyMessage);
    return;
  }

  for (const res of activeResources) {
    const tile = document.createElement("div");
    tile.className = "unit-card unit-card-compact warehouse-tile";

    const name = document.createElement("strong");
    name.textContent = res.name;

    const count = document.createElement("span");
    count.className = "unit-card-level";
    count.textContent = res.count;

    tile.append(name, count);
    inventoryList.appendChild(tile);
  }

  for (const item of activeItems) {
    const tile = document.createElement("div");
    tile.className = "unit-card unit-card-compact warehouse-tile";

    const name = document.createElement("strong");
    name.textContent = item.name || item.id;

    const count = document.createElement("span");
    count.className = "unit-card-level";
    count.textContent = `x${item.count}`;

    tile.append(name, count);
    inventoryList.appendChild(tile);
  }
}

function renderInventory() {
  inventoryList.replaceChildren();

  const inventoryPanel = document.querySelector(".inventory-panel");
  const isExpanded = inventoryPanel?.classList.contains("expanded");

  // Manage Energy Select visibility (Only visible when inventory is expanded)
  let energySelect = document.getElementById("inventory-energy-mode-select");
  if (!energySelect && isExpanded) {
    const controlsContainer = document.querySelector(".inventory-controls");
    if (controlsContainer) {
      energySelect = document.createElement("select");
      energySelect.id = "inventory-energy-mode-select";

      const modes = [
        { value: "hide", label: "Energy: Off" },
        { value: "show", label: "Energy: Show" },
        { value: "sort", label: "Energy: Sort (High→Low)" },
        { value: "sort_rev", label: "Energy: Sort (Low→High)" },
      ];

      for (const m of modes) {
        const opt = document.createElement("option");
        opt.value = m.value;
        opt.textContent = m.label;
        energySelect.appendChild(opt);
      }

      energySelect.addEventListener("change", (e) => {
        energyMode = e.target.value;
        saveCampaignProgress();
        renderInventory();
      });

      controlsContainer.appendChild(energySelect);
    }
  }

  if (energySelect) {
    energySelect.value = energyMode;
    energySelect.style.display = isExpanded ? "inline-block" : "none";
  }

  if (currentInventoryTab === "warehouse") {
    renderWarehouseList();
    return;
  }

  const dir = inventorySortAsc ? -1 : 1;

  // 1. Pre-calculate peak levels
  const typeMaxLevels = {};
  const typeMaxLevelsByUpgrade = {};

  for (const unit of inventory) {
    const uType = unit.type || "unknown";
    const uLvl = Number(unit.level) || 1;
    const uUpg = Number(unit.upgradeCount) || 0;

    if (!typeMaxLevels[uType] || uLvl > typeMaxLevels[uType]) {
      typeMaxLevels[uType] = uLvl;
    }

    if (!typeMaxLevelsByUpgrade[uUpg]) {
      typeMaxLevelsByUpgrade[uUpg] = {};
    }
    if (
      !typeMaxLevelsByUpgrade[uUpg][uType] ||
      uLvl > typeMaxLevelsByUpgrade[uUpg][uType]
    ) {
      typeMaxLevelsByUpgrade[uUpg][uType] = uLvl;
    }
  }

  // 2. Filter & Sort inventory
  const filteredInventory = inventory
    .filter((unit) => {
      const cat = unit.category || "Main";
      if (inventoryFilter === "all") return true;
      return cat === inventoryFilter;
    })
    .slice()
    .sort((a, b) => {
      // --- ENERGY PRE-SORTING (Evaluated before main sort mode) ---
      if (energyMode === "sort" || energyMode === "sort_rev") {
        const energyA = a.energy ?? 100;
        const energyB = b.energy ?? 100;
        if (energyA !== energyB) {
          return energyMode === "sort" ? energyB - energyA : energyA - energyB;
        }
      }

      const dataA = getUnitData(a);
      const dataB = getUnitData(b);

      const rarityA = rarityRank[dataA.rarity] || 0;
      const rarityB = rarityRank[dataB.rarity] || 0;
      const nameA = dataA.name || "";
      const nameB = dataB.name || "";

      const lvlA = Number(a.level) || 1;
      const lvlB = Number(b.level) || 1;
      const upgA = Number(a.upgradeCount) || 0;
      const upgB = Number(b.upgradeCount) || 0;

      const lockA = a.isLocked ? 1 : 0;
      const lockB = b.isLocked ? 1 : 0;

      let primaryDiff = 0;

      switch (inventorySort) {
        case "level":
          primaryDiff = lvlB - lvlA;
          if (primaryDiff !== 0) return primaryDiff * dir;
          if (rarityB !== rarityA) return rarityB - rarityA;
          if (nameA.localeCompare(nameB) !== 0)
            return nameA.localeCompare(nameB);
          if (lockB !== lockA) return lockB - lockA;
          return a.id - b.id;

        case "rarity": {
          primaryDiff = rarityB - rarityA;
          if (primaryDiff !== 0) return primaryDiff * dir;

          const maxLvlA = typeMaxLevels[a.type] || lvlA;
          const maxLvlB = typeMaxLevels[b.type] || lvlB;

          if (maxLvlB !== maxLvlA) return maxLvlB - maxLvlA;
          if (nameA.localeCompare(nameB) !== 0)
            return nameA.localeCompare(nameB);
          if (lvlB !== lvlA) return lvlB - lvlA;
          if (lockB !== lockA) return lockB - lockA;
          return a.id - b.id;
        }

        case "upgrades": {
          primaryDiff = upgB - upgA;
          if (primaryDiff !== 0) return primaryDiff * dir;

          if (rarityB !== rarityA) return rarityB - rarityA;

          const upgBucket = typeMaxLevelsByUpgrade[upgA] || {};
          const maxLvlA = upgBucket[a.type] || lvlA;
          const maxLvlB = upgBucket[b.type] || lvlB;

          if (maxLvlB !== maxLvlA) return maxLvlB - maxLvlA;

          if (nameA.localeCompare(nameB) !== 0)
            return nameA.localeCompare(nameB);
          if (lvlB !== lvlA) return lvlB - lvlA;
          if (lockB !== lockA) return lockB - lockA;
          return a.id - b.id;
        }

        case "name":
          primaryDiff = nameA.localeCompare(nameB);
          if (primaryDiff !== 0) return primaryDiff * dir;
          if (lvlB !== lvlA) return lvlB - lvlA;
          if (lockB !== lockA) return lockB - lockA;
          return a.id - b.id;

        case "newest":
        default:
          primaryDiff = b.id - a.id;
          if (primaryDiff !== 0) return primaryDiff * dir;
          if (lvlB !== lvlA) return lvlB - lvlA;
          return nameA.localeCompare(nameB);
      }
    });

  if (filteredInventory.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "No matching towers in inventory.";
    inventoryList.appendChild(emptyMessage);
    return;
  }

  // Render cards
  for (const unit of filteredInventory) {
    const data = getUnitData(unit);
    const rarityClass = (data.rarity || "Common").toLowerCase();

    const card = document.createElement("button");
    card.type = "button";
    card.className = `unit-card unit-card-compact ${rarityClass}`;

    if (unit.id === selectedUpgradeTargetId) {
      card.classList.add("selected-target");
    }

    const name = document.createElement("strong");
    name.textContent = data.name;

    const label = document.createElement("span");
    label.className = "unit-card-level";

    const isEnergyActive = energyMode !== "hide";
    const energyText = isEnergyActive
      ? ` · E: ${Math.round(unit.energy ?? 100)}`
      : "";

    // Omit rarity text whenever Energy Mode is enabled
    if (isExpanded) {
      if (isEnergyActive) {
        label.textContent = `Lv. ${unit.level} · ${unit.upgradeCount}${energyText}`;
      } else {
        label.textContent = `Lv. ${unit.level} · ${data.rarity} · ${unit.upgradeCount}`;
      }
    } else if (inventorySort === "upgrades") {
      label.textContent = `Upgrades: ${unit.upgradeCount}`;
    } else {
      label.textContent = `Lv. ${unit.level}`;
    }

    card.append(name, label);

    // Apply Full-Card Energy Tint Overlay (shade changes based on energy level)
    if (isEnergyActive) {
      const curEnergy = unit.energy ?? 100;
      const maxEnergy = unit.maxEnergy ?? 100;
      const pct = Math.max(0, Math.min(100, (curEnergy / maxEnergy) * 100));

      const overlay = document.createElement("div");
      overlay.className = "energy-card-overlay";

      const hue = Math.round((pct / 100) * 200);

      overlay.style.background = `hsla(${hue}, 85%, 45%, 0.28)`;

      overlay.style.width = "100%";
      card.prepend(overlay);
    }

    card.addEventListener("click", () => openUnitPopup(unit.id));
    inventoryList.appendChild(card);
  }
}

function closeQuickSacSettingsPopup() {
  document.getElementById("quick-sac-settings-overlay")?.remove();
}

function closeQuickSacConfirmPopup() {
  document.getElementById("quick-sac-confirm-overlay")?.remove();
}

function closeUnitPopup() {
  closeQuickSacConfirmPopup();
  closeQuickSacSettingsPopup();
  const overlay = document.getElementById("unit-popup-overlay");
  if (overlay?._xpAnimRafId) {
    cancelAnimationFrame(overlay._xpAnimRafId);
  }
  overlay?.remove();

  if (unitPopupEscapeHandler) {
    document.removeEventListener("keydown", unitPopupEscapeHandler);
    unitPopupEscapeHandler = null;
  }
}

function openUnitPopup(unitId, xpAnimData = null) {
  closeUnitPopup();

  const unit = inventory.find((item) => item.id === unitId);
  if (!unit) return;

  const data = getUnitData(unit);
  const isRear = (unit.category || "Main") === "Rear";
  const rarityClass = (data.rarity || "Common").toLowerCase();

  const overlay = document.createElement("div");
  overlay.id = "unit-popup-overlay";
  overlay.className = "unit-popup-overlay";

  const layout = document.createElement("div");
  layout.className = "unit-popup-layout";

  const popup = document.createElement("div");
  popup.className = `unit-popup ${rarityClass}`;
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-modal", "true");

  const isFatigued = (unit.energy ?? 100) <= 0;
  if (isFatigued) {
    const banner = document.createElement("div");
    banner.className = "fatigue-banner-top";
    banner.style.cssText = `
      width: 100%;
      background: #7f1d1d;
      color: #fca5a5;
      text-align: center;
      padding: 6px 0;
      font-weight: bold;
      font-size: 0.85rem;
      border-radius: 6px 6px 0 0;
      margin-bottom: 8px;
    `;
    banner.textContent = "⚠️ FATIGUED (-70% All Stats & -90% Rewards)";
    popup.appendChild(banner);
  }

  const header = document.createElement("div");
  header.className = "unit-popup-header";

  const titleRow = document.createElement("div");
  titleRow.style.display = "flex";
  titleRow.style.alignItems = "center";
  titleRow.style.gap = "8px";

  const title = document.createElement("h2");
  title.textContent = data.name;
  title.style.margin = "0";

  const lockBtn = document.createElement("button");
  lockBtn.type = "button";
  lockBtn.className = `unit-lock-btn ${unit.isLocked ? "locked" : "unlocked"}`;
  const symbol = unit.isLocked ? "\u2612" : "\u2610";
  lockBtn.textContent = `${symbol} ${unit.isLocked ? "LOCKED" : "UNLOCKED"}`;
  lockBtn.addEventListener("click", () => toggleUnitLock(unit.id));

  titleRow.append(title, lockBtn);

  const subtitle = document.createElement("p");
  subtitle.textContent = `Level ${unit.level} · ${data.rarity} · ${unit.upgradeCount}`;
  subtitle.className = "unit-popup-subtitle";
  subtitle.style.margin = "4px 0 0 0";

  const titleContainer = document.createElement("div");
  titleContainer.append(titleRow, subtitle);

  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.className = "unit-popup-close";
  closeButton.setAttribute("aria-label", "Close popup");
  closeButton.addEventListener("click", closeUnitPopup);

  header.append(titleContainer, closeButton);
  popup.appendChild(header);

  const details = document.createElement("div");
  details.className = "unit-popup-details";

  const currentStage = getSelectedStage();
  let targetEnemyLevel = currentStage?.enemyLevel || 1;

  // --- 1. HTML Stats Table ---
  const statsTable = document.createElement("table");
  statsTable.className = "popup-stats-table";
  details.appendChild(statsTable);

  // Single delegated listener handles both locking the icon and unlocking when clicking away
  popup.addEventListener("click", (e) => {
    const clickedIcon = e.target.closest(".energy-info-icon");
    if (clickedIcon) {
      e.stopPropagation();
      clickedIcon.classList.toggle("locked");
    } else {
      popup
        .querySelector(".energy-info-icon.locked")
        ?.classList.remove("locked");
    }
  });

  const damageMultiplier = 1 + 0.1 * (unit.level - 1);
  const unbuffedBaseDamage = Math.round(
    (data.damage + unit.upgradeBonuses.damage) * damageMultiplier,
  );
  const totalBonusDmg = Math.max(0, unit.damage - unbuffedBaseDamage);

  let effBadge = null;

  function updateDynamicStats() {
    statsTable.replaceChildren();

    const levelMult = showEffectiveDamage
      ? getLevelAdvantageMultiplier(unit.level, targetEnemyLevel)
      : 1.0;

    const effPct = Math.round(levelMult * 100);
    if (effBadge) {
      effBadge.textContent = `(${effPct}% Eff.)`;
      effBadge.className = `eff-percent-badge ${effPct > 100 ? "buff" : effPct < 100 ? "debuff" : "neutral"}`;
    }

    const effectiveDamage = Number((unit.damage * levelMult).toFixed(2));
    const effectiveBonusDmg = Number((totalBonusDmg * levelMult).toFixed(2));

    const rawDps = effectiveDamage * (unit.fireRate / 10);
    const dpsVal =
      typeof formatGameNumber === "function"
        ? formatGameNumber(rawDps)
        : Number(rawDps.toFixed(2));

    const maxLaneLength = maxSlots + 1;
    const effectiveRange = Math.min(unit.range, Math.ceil(maxLaneLength / 2));
    const powerScore = Math.round(rawDps * effectiveRange);

    const formattedDmg =
      typeof formatGameNumber === "function"
        ? formatGameNumber(effectiveDamage)
        : Number(effectiveDamage.toFixed(damageDecimal));

    const formattedBonusDmg =
      typeof formatGameNumber === "function"
        ? formatGameNumber(effectiveBonusDmg)
        : Number(effectiveBonusDmg.toFixed(damageDecimal));

    const dmgStr =
      showTechBonus && effectiveBonusDmg > 0
        ? `${formattedDmg} (+${formattedBonusDmg})`
        : `${formattedDmg}`;

    const fireRateMultiplier = 1 + 0.01 * (unit.level - 1);
    const unbuffedBaseFireRate = Number(
      (
        (data.fireRate + unit.upgradeBonuses.fireRate) *
        fireRateMultiplier
      ).toFixed(2),
    );
    const totalBonusFr = Number(
      Math.max(0, unit.fireRate - unbuffedBaseFireRate).toFixed(2),
    );

    const frStr =
      showTechBonus && totalBonusFr > 0
        ? `${unit.fireRate.toFixed(2)} (+${totalBonusFr.toFixed(2)})`
        : `${unit.fireRate.toFixed(2)}`;

    const techRange = unit.range - (unit.rawRange ?? unit.range);
    const rangeStr =
      showTechBonus && techRange > 0
        ? `${unit.range} (+${techRange})`
        : `${unit.range}`;

    const rawArmorPenVal =
      typeof unit.rawArmorPen === "number"
        ? unit.rawArmorPen
        : (unit.armorPen ?? 0);
    const armorPenVal = unit.armorPen ?? 0;
    const techArmorPen = armorPenVal - rawArmorPenVal;

    const armorPenStr =
      showTechBonus && techArmorPen > 0
        ? `${armorPenVal} (+${techArmorPen})`
        : `${armorPenVal}`;

    const lifetimeDmgVal = Math.round(unit.totalDamage || 0);
    const formattedLifetimeDmg =
      typeof formatGameNumber === "function"
        ? formatGameNumber(lifetimeDmgVal)
        : lifetimeDmgVal.toLocaleString();

    const powerScoreStr = `Power Score: ${formatGameNumber(powerScore)}`;
    const lifetimeDamageStr = `Lifetime Dmg: ${formattedLifetimeDmg}`;

    // --- Dynamic Energy Formatting with Info Tooltip ---
    const energyVal = unit.energy ?? 100;
    const maxEnergyVal = unit.maxEnergy ?? 100;
    const isFatigued = energyVal <= 0;

    const energyColorClass =
      energyVal <= 0
        ? "energy-red"
        : energyVal < 10
          ? "energy-orange"
          : "energy-white";

    const tooltipContent = `
      <strong>⚡ Energy System:</strong><br>
      • Deployed towers consume <strong>0.1 energy</strong> per cleared wave.<br>
      • At <strong>0 Energy (Fatigued)</strong>: Tower deals <strong>-70% Damage</strong> and incurs a <strong>-90% Reward Penalty</strong>.<br>
      • Towers in inventory regenerate <strong>0.2 energy</strong> on stage clear.<br>
      • Use <strong>5+</strong> towers to get full energy gain.<br>
      • Clearing lower waves will result in lower energy gain.
    `.trim();

    const energyStr = `Energy: <span class="${energyColorClass}">${energyVal.toFixed(1)} / ${maxEnergyVal}</span>${
      isFatigued ? ' <span class="energy-red">⚠️</span>' : ""
    } <span class="energy-info-icon" role="button" aria-label="Energy Info" tabindex="0">ℹ<span class="energy-tooltip">${tooltipContent}</span></span>`;

    const popupStatsRows = showMoreStats
      ? [
          [`Type: ${unit.category || "Main"}`, powerScoreStr],
          [`Fire rate: ${frStr}`, `DPS: ${dpsVal}`],
          [`Damage: ${dmgStr}`, `Range: ${rangeStr}`],
          [`Armor Pen: ${armorPenStr}`, lifetimeDamageStr],
          [energyStr, ""], // Expanded: Energy on the LEFT
        ]
      : [
          [`Type: ${unit.category || "Main"}`, `Range: ${rangeStr}`],
          [`Fire rate: ${frStr}`, `Armor Pen: ${armorPenStr}`],
          [`Damage: ${dmgStr}`, energyStr], // Simplified: Energy on the RIGHT
        ];

    for (const [leftStat, rightStat] of popupStatsRows) {
      const tr = document.createElement("tr");

      const tdLeft = document.createElement("td");
      tdLeft.innerHTML = leftStat;
      tr.appendChild(tdLeft);

      const tdRight = document.createElement("td");
      tdRight.innerHTML = rightStat;
      tr.appendChild(tdRight);

      statsTable.appendChild(tr);
    }
  }

  // --- 2. Dynamic Effectiveness Controls Row ---
  if (showEffectiveDamage) {
    const effRow = document.createElement("div");
    effRow.className = "effective-damage-row";

    const labelText = document.createElement("span");
    labelText.className = "eff-label";
    labelText.textContent = "Target Lvl:";

    const baseMax = targetEnemyLevel + 10;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "eff-slider";
    slider.min = "1";
    slider.max = String(baseMax);
    slider.value = String(targetEnemyLevel);

    const numInput = document.createElement("input");
    numInput.type = "number";
    numInput.className = "eff-num-input";
    numInput.min = "1";
    numInput.value = String(targetEnemyLevel);

    effBadge = document.createElement("span");
    effBadge.className = "eff-percent-badge";

    const syncLevel = (val) => {
      let parsed = parseInt(val, 10);
      if (isNaN(parsed)) return;
      parsed = Math.max(1, parsed);

      const dynamicMax = Math.max(baseMax, parsed);
      slider.max = String(dynamicMax);

      targetEnemyLevel = parsed;
      slider.value = String(parsed);
      numInput.value = String(parsed);
      updateDynamicStats();
    };

    slider.addEventListener("input", (e) => syncLevel(e.target.value));
    numInput.addEventListener("input", (e) => syncLevel(e.target.value));

    effRow.append(labelText, slider, numInput, effBadge);
    details.appendChild(effRow);
  }

  updateDynamicStats();
  popup.appendChild(details);

  // --- 3. XP Progress Bar ---
  const reqXp = getRequiredXp(unit);
  const xpContainer = document.createElement("div");
  xpContainer.className = "unit-popup-xp";

  const xpHeader = document.createElement("div");
  xpHeader.className = "unit-popup-xp-header";

  const initialLevel = xpAnimData ? xpAnimData.startLevel : unit.level;
  const initialXp = xpAnimData ? xpAnimData.startXp : unit.xp;
  const initialReqXp = xpAnimData ? xpAnimData.startReqXp : reqXp;

  if (xpAnimData) {
    subtitle.textContent = `Level ${initialLevel} · ${data.rarity} · ${unit.upgradeCount}`;
  }

  const xpTitle = document.createElement("span");
  xpTitle.style.display = "inline-block";
  xpTitle.style.transition = "transform 0.12s ease-out";
  xpTitle.textContent = `Level: ${initialLevel}`;

  const boostBtn = document.createElement("button");
  boostBtn.type = "button";
  boostBtn.className = "xp-boost-btn";
  boostBtn.textContent = "Boost";
  boostBtn.disabled = stageEntered || isBattleRunning();
  boostBtn.addEventListener("click", () => openBoostMenu(unit.id));

  const xpValue = document.createElement("strong");
  const initialPercent = Math.min(
    100,
    Math.max(0, (initialXp / Math.max(1, initialReqXp)) * 100),
  );
  const fmtInitialXp =
    typeof formatGameNumber === "function"
      ? formatGameNumber(initialXp)
      : initialXp;
  const fmtInitialReq =
    typeof formatGameNumber === "function"
      ? formatGameNumber(initialReqXp)
      : initialReqXp;
  xpValue.textContent = `${fmtInitialXp} / ${fmtInitialReq} XP`;

  const headerRight = document.createElement("div");
  headerRight.className = "xp-header-right";

  headerRight.append(xpValue, boostBtn);
  xpHeader.append(xpTitle, headerRight);

  const xpTrack = document.createElement("div");
  xpTrack.className = "xp-track";

  const xpFill = document.createElement("div");
  xpFill.className = "xp-fill";
  xpFill.style.width = `${initialPercent}%`;

  xpTrack.appendChild(xpFill);
  xpContainer.append(xpHeader, xpTrack);
  popup.appendChild(xpContainer);

  if (xpAnimData) {
    const { startLevel, startXp, startReqXp, endLevel, endXp, endReqXp } =
      xpAnimData;
    const levelsGained = Math.max(0, endLevel - startLevel);

    // Sublinear duration scaling: ~0.67s for 1 lvl, ~1.14s for 10 lvls, ~1.6s cap for 100+ lvls
    const totalDurationMs =
      levelsGained === 0
        ? 320
        : Math.min(1600, 480 + 190 * Math.log2(levelsGained + 1));

    const startFrac = Math.min(
      1,
      Math.max(0, startXp / Math.max(1, startReqXp)),
    );
    const endFrac = Math.min(1, Math.max(0, endXp / Math.max(1, endReqXp)));
    const firstSeg = Math.max(0.05, 1 - startFrac);
    const totalDistance =
      levelsGained === 0
        ? Math.max(0.001, endFrac - startFrac)
        : firstSeg + Math.max(0, levelsGained - 1) + endFrac;

    const animStartTime = performance.now();
    let lastShownLevel = startLevel;
    xpFill.style.transition = "none";

    const stepXpBar = (now) => {
      if (!document.body.contains(overlay)) return;

      const rawT = Math.min(1, (now - animStartTime) / totalDurationMs);
      const eased =
        levelsGained === 0
          ? 1 - Math.pow(1 - rawT, 2.5)
          : 1 - Math.pow(1 - rawT, 1.55);

      let displayLevel = endLevel;
      let barFrac = endFrac;

      if (levelsGained === 0) {
        barFrac = startFrac + (endFrac - startFrac) * eased;
        displayLevel = startLevel;
      } else {
        const distCovered = totalDistance * eased;
        if (distCovered < firstSeg) {
          displayLevel = startLevel;
          const segProgress = distCovered / firstSeg;
          barFrac = startFrac + (1 - startFrac) * segProgress;
        } else {
          const remaining = distCovered - firstSeg;
          const fullBarsCompleted = Math.floor(remaining);
          if (fullBarsCompleted < levelsGained - 1) {
            displayLevel = startLevel + 1 + fullBarsCompleted;
            barFrac = remaining - fullBarsCompleted;
          } else {
            displayLevel = endLevel;
            barFrac = Math.min(
              endFrac,
              Math.max(0, remaining - (levelsGained - 1)),
            );
          }
        }
      }

      if (displayLevel !== lastShownLevel) {
        lastShownLevel = displayLevel;
        xpTitle.textContent = `Level: ${displayLevel}`;
        subtitle.textContent = `Level ${displayLevel} · ${data.rarity} · ${unit.upgradeCount}`;
        xpTitle.style.transform = "scale(1.1)";
        xpFill.style.filter = "brightness(1.45)";
        setTimeout(() => {
          if (document.body.contains(xpTitle)) {
            xpTitle.style.transform = "scale(1)";
            xpFill.style.filter = "";
          }
        }, 110);
      }

      const curReq =
        displayLevel === endLevel
          ? endReqXp
          : getRequiredXp(displayLevel, unit.category);
      const curXp =
        rawT >= 1 && displayLevel === endLevel
          ? endXp
          : Math.round(barFrac * curReq);

      const fmtCur =
        typeof formatGameNumber === "function"
          ? formatGameNumber(curXp)
          : curXp;
      const fmtReq =
        typeof formatGameNumber === "function"
          ? formatGameNumber(curReq)
          : curReq;

      xpValue.textContent = `${fmtCur} / ${fmtReq} XP`;
      xpFill.style.width = `${Math.min(100, Math.max(0, barFrac * 100)).toFixed(2)}%`;

      if (rawT < 1) {
        overlay._xpAnimRafId = requestAnimationFrame(stepXpBar);
      } else {
        xpFill.style.transition = "";
        xpFill.style.filter = "";
        xpTitle.style.transform = "";
        overlay._xpAnimRafId = null;
      }
    };

    overlay._xpAnimRafId = requestAnimationFrame(stepXpBar);
  }

  // --- 4. Actions ---
  const actions = document.createElement("div");
  actions.className = "unit-popup-actions";

  const deployContainer = document.createElement("div");
  deployContainer.className = "deploy-container";

  const deployLabel = document.createElement("label");
  deployLabel.textContent = isRear ? "Base Slot:" : "Slot:";

  const slotSelect = document.createElement("select");
  slotSelect.setAttribute("aria-label", "Deployment slot");

  if (isRear) {
    for (let i = 0; i < maxBaseSlots; i++) {
      if (deployedBaseUnits[i] !== null) continue;
      const option = document.createElement("option");
      option.value = String(i);
      option.textContent = `Base Slot ${i + 1}`;
      slotSelect.appendChild(option);
    }
  } else {
    for (let i = 0; i < maxSlots; i++) {
      if (deployedUnits[i] !== null) continue;
      const option = document.createElement("option");
      option.value = String(i);
      option.textContent = `Slot ${i + 1}`;
      slotSelect.appendChild(option);
    }
  }

  const isDuplicateDeployed = isRear
    ? deployedBaseUnits.some((u) => u !== null && u.type === unit.type)
    : deployedUnits.some((u) => u !== null && u.type === unit.type);

  if (isDuplicateDeployed) {
    slotSelect.options.length = 0;
    const fallbackOption = document.createElement("option");
    fallbackOption.value = "";
    fallbackOption.textContent = "Already Deployed (1 Max)";
    fallbackOption.disabled = true;
    fallbackOption.selected = true;
    slotSelect.appendChild(fallbackOption);
  } else if (slotSelect.options.length === 0) {
    const fallbackOption = document.createElement("option");
    fallbackOption.value = "";
    fallbackOption.textContent = isRear
      ? "No Base Slots Available"
      : "No Slots Available";
    fallbackOption.disabled = true;
    fallbackOption.selected = true;
    slotSelect.appendChild(fallbackOption);
  }

  const cannotDeploy =
    stageEntered ||
    isBattleRunning() ||
    isDuplicateDeployed ||
    slotSelect.options.length === 0 ||
    (!isRear && getDeployedCount() >= getMaxDeployedUnits());

  slotSelect.disabled = cannotDeploy;

  const deployButton = document.createElement("button");
  deployButton.textContent = "Deploy";
  deployButton.disabled = cannotDeploy;
  deployButton.addEventListener("click", () => {
    const slotIndex = Number(slotSelect.value);
    closeUnitPopup();
    if (isRear) deployBaseUnit(unit.id, slotIndex);
    else deployUnit(unit.id, slotIndex);
  });

  const deployRow = document.createElement("div");
  deployRow.className = "deploy-row";
  deployRow.append(slotSelect, deployButton);

  deployContainer.append(deployLabel, deployRow);

  const upgradeButton = document.createElement("button");
  upgradeButton.textContent = "Upgrade";
  upgradeButton.disabled = stageEntered || isBattleRunning();
  upgradeButton.addEventListener("click", () => openUpgradeMenu(unit.id));

  actions.append(deployContainer, upgradeButton);
  popup.appendChild(actions);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeUnitPopup();
  });

  unitPopupEscapeHandler = (event) => {
    if (event.key === "Escape") {
      if (document.getElementById("quick-sac-confirm-overlay")) {
        closeQuickSacConfirmPopup();
      } else if (document.getElementById("quick-sac-settings-overlay")) {
        closeQuickSacSettingsPopup();
      } else {
        closeUnitPopup();
      }
    }
  };

  document.addEventListener("keydown", unitPopupEscapeHandler);

  layout.appendChild(popup);
  overlay.appendChild(layout);
  document.body.appendChild(overlay);
}

function openUpgradeMenu(targetId) {
  const target = inventory.find((unit) => unit.id === targetId);
  if (!target) return;

  const overlay = document.getElementById("unit-popup-overlay");
  const layout = overlay?.querySelector(".unit-popup-layout");
  if (!overlay || !layout) return;

  layout.querySelector(".upgrade-side-panel")?.remove();

  const panel = document.createElement("div");
  panel.className = "unit-popup upgrade-side-panel";
  panel.setAttribute("role", "dialog");

  const header = document.createElement("div");
  header.className = "unit-popup-header";

  const title = document.createElement("h2");
  title.textContent = "Consume Tower";

  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.className = "unit-popup-close";
  closeButton.addEventListener("click", () => panel.remove());

  header.append(title, closeButton);
  panel.appendChild(header);

  const cost = getUpgradeCost(target);
  const costText = document.createElement("p");
  costText.textContent = `Cost: ${typeof formatGameNumber === "function" ? formatGameNumber(cost) : cost} Gold`;
  panel.appendChild(costText);

  // --- Sort & Direction Controls ---
  const sortContainer = document.createElement("div");
  sortContainer.className = "upgrade-sort-container";
  sortContainer.style.display = "flex";
  sortContainer.style.gap = "6px";
  sortContainer.style.margin = "8px 0 12px 0";

  const sortSelect = document.createElement("select");
  sortSelect.className = "upgrade-sort-select";
  sortSelect.style.flex = "1";

  for (const opt of [
    { value: "level", label: "Sort: Level" },
    { value: "name", label: "Sort: Name" },
    { value: "rarity", label: "Sort: Rarity" },
    { value: "upgrades", label: "Sort: Upgrades" },
  ]) {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    if (upgradeMenuSortMode === opt.value) option.selected = true;
    sortSelect.appendChild(option);
  }

  sortSelect.addEventListener("change", (e) => {
    upgradeMenuSortMode = e.target.value;
    openUpgradeMenu(target.id);
  });

  const orderBtn = document.createElement("button");
  orderBtn.type = "button";
  orderBtn.className = "upgrade-order-btn";
  orderBtn.textContent = upgradeMenuSortOrder === "asc" ? "▲" : "▼";
  orderBtn.addEventListener("click", () => {
    upgradeMenuSortOrder = upgradeMenuSortOrder === "asc" ? "desc" : "asc";
    openUpgradeMenu(target.id);
  });

  sortContainer.append(sortSelect, orderBtn);
  panel.appendChild(sortContainer);

  let duplicates = inventory.filter(
    (unit) =>
      unit.id !== target.id && unit.type === target.type && !unit.isLocked,
  );

  if (duplicates.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "No unlocked duplicates.";
    panel.appendChild(emptyMessage);
    layout.appendChild(panel);
    return;
  }

  // Pre-calculate peak levels for family tiebreakers
  const typeMaxLevels = {};
  const typeMaxLevelsByUpgrade = {};
  for (const unit of inventory) {
    const uType = unit.type || "unknown";
    const uLvl = Number(unit.level) || 1;
    const uUpg = Number(unit.upgradeCount) || 0;

    if (!typeMaxLevels[uType] || uLvl > typeMaxLevels[uType]) {
      typeMaxLevels[uType] = uLvl;
    }
    if (!typeMaxLevelsByUpgrade[uUpg]) {
      typeMaxLevelsByUpgrade[uUpg] = {};
    }
    if (
      !typeMaxLevelsByUpgrade[uUpg][uType] ||
      uLvl > typeMaxLevelsByUpgrade[uUpg][uType]
    ) {
      typeMaxLevelsByUpgrade[uUpg][uType] = uLvl;
    }
  }

  const dir = upgradeMenuSortOrder === "asc" ? -1 : 1;

  duplicates.sort((a, b) => {
    const dataA = getUnitData(a);
    const dataB = getUnitData(b);

    const rarityA =
      (typeof rarityRank !== "undefined" ? rarityRank[dataA.rarity] : 0) || 0;
    const rarityB =
      (typeof rarityRank !== "undefined" ? rarityRank[dataB.rarity] : 0) || 0;
    const nameA = dataA.name || "";
    const nameB = dataB.name || "";

    const lvlA = Number(a.level) || 1;
    const lvlB = Number(b.level) || 1;
    const upgA = Number(a.upgradeCount) || 0;
    const upgB = Number(b.upgradeCount) || 0;

    let primaryDiff = 0;

    switch (upgradeMenuSortMode) {
      case "level":
        primaryDiff = lvlB - lvlA;
        if (primaryDiff !== 0) return primaryDiff * dir;
        if (rarityB !== rarityA) return rarityB - rarityA;
        if (nameA.localeCompare(nameB) !== 0) return nameA.localeCompare(nameB);
        return b.id - a.id;

      case "rarity": {
        primaryDiff = rarityB - rarityA;
        if (primaryDiff !== 0) return primaryDiff * dir;

        const maxLvlA = typeMaxLevels[a.type] || lvlA;
        const maxLvlB = typeMaxLevels[b.type] || lvlB;

        if (maxLvlB !== maxLvlA) return maxLvlB - maxLvlA;
        if (nameA.localeCompare(nameB) !== 0) return nameA.localeCompare(nameB);
        if (lvlB !== lvlA) return lvlB - lvlA;
        return b.id - a.id;
      }

      case "upgrades": {
        primaryDiff = upgB - upgA;
        if (primaryDiff !== 0) return primaryDiff * dir;

        if (rarityB !== rarityA) return rarityB - rarityA;

        const upgBucket = typeMaxLevelsByUpgrade[upgA] || {};
        const maxLvlA = upgBucket[a.type] || lvlA;
        const maxLvlB = upgBucket[b.type] || lvlB;

        if (maxLvlB !== maxLvlA) return maxLvlB - maxLvlA;
        if (nameA.localeCompare(nameB) !== 0) return nameA.localeCompare(nameB);
        if (lvlB !== lvlA) return lvlB - lvlA;
        return b.id - a.id;
      }

      case "name":
        primaryDiff = nameA.localeCompare(nameB);
        if (primaryDiff !== 0) return primaryDiff * dir;
        if (lvlB !== lvlA) return lvlB - lvlA;
        return b.id - a.id;

      default:
        primaryDiff = b.id - a.id;
        if (primaryDiff !== 0) return primaryDiff * dir;
        if (lvlB !== lvlA) return lvlB - lvlA;
        return nameA.localeCompare(nameB);
    }
  });

  for (const duplicate of duplicates) {
    const data = getUnitData(duplicate);
    const rarityClass = (data.rarity || "Common").toLowerCase();

    const button = document.createElement("button");
    button.type = "button";
    button.className = `unit-card unit-card-compact ${rarityClass}`;
    button.disabled = stageEntered || isBattleRunning() || gold < cost;

    const cleanName = data.name.replace(/\s*\[(Main|Rear)\]\s*/gi, "");

    const name = document.createElement("strong");
    name.textContent = cleanName;

    const level = document.createElement("span");
    level.textContent = `Lv. ${duplicate.level} · Upgrades: ${duplicate.upgradeCount}`;

    button.append(name, level);

    button.addEventListener("click", () => {
      upgradeUnit(target.id, duplicate.id);
      openUnitPopup(target.id);
      openUpgradeMenu(target.id);
    });

    panel.appendChild(button);
  }

  layout.appendChild(panel);
}

function getQuickSacCandidates(targetId) {
  const target = inventory.find((u) => u.id === targetId);
  if (!target) return [];

  const enforceMaxLevel = Boolean(quickSacSettings.maxLevelEnabled);
  const maxLevelCap = Math.max(
    1,
    Math.floor(Number(quickSacSettings.maxLevel) || 1),
  );

  const enforceMaxUpgrades = Boolean(quickSacSettings.maxUpgradesEnabled);
  const maxUpgradesCap = Math.max(
    0,
    Math.floor(Number(quickSacSettings.maxUpgrades) || 0),
  );

  const categoryFilter = quickSacSettings.categoryFilter || "all";

  // Group unlocked inventory towers (excluding the target tower) by tower type
  const byType = {};
  for (const unit of inventory) {
    if (unit.id === target.id || unit.isLocked) continue;

    if (categoryFilter !== "all") {
      const cat = unit.category || getUnitData(unit).category || "Main";
      if (cat !== categoryFilter) continue;
    }

    const typeKey = unit.type || "unknown";
    if (!byType[typeKey]) byType[typeKey] = [];
    byType[typeKey].push(unit);
  }

  const toSacrifice = [];

  for (const [typeKey, units] of Object.entries(byType)) {
    const rarity = unitTypes[typeKey]?.rarity || "Common";
    const setting = quickSacSettings[rarity];
    if (!setting || !setting.enabled) continue;

    const keepCount = Math.max(0, Math.floor(Number(setting.keep) || 0));
    if (units.length <= keepCount) continue;

    // Sort weakest first so the highest-level / most-upgraded copies are kept
    const sortedWeakestFirst = units.slice().sort((a, b) => {
      if ((a.level || 1) !== (b.level || 1)) {
        return (a.level || 1) - (b.level || 1);
      }
      if ((a.upgradeCount || 0) !== (b.upgradeCount || 0)) {
        return (a.upgradeCount || 0) - (b.upgradeCount || 0);
      }
      if ((a.xp || 0) !== (b.xp || 0)) {
        return (a.xp || 0) - (b.xp || 0);
      }
      return a.id - b.id;
    });

    const sacCount = sortedWeakestFirst.length - keepCount;
    const excessUnits = sortedWeakestFirst.slice(0, sacCount);

    for (const unit of excessUnits) {
      if (enforceMaxLevel && (unit.level || 1) > maxLevelCap) continue;
      if (enforceMaxUpgrades && (unit.upgradeCount || 0) > maxUpgradesCap)
        continue;
      toSacrifice.push(unit);
    }
  }

  return toSacrifice;
}

function executeQuickSacrifice(targetId) {
  if (stageEntered || isBattleRunning()) {
    addLog("You cannot consume units while inside a world.");
    return;
  }

  const target = inventory.find((u) => u.id === targetId);
  if (!target) return;

  const toSacrifice = getQuickSacCandidates(targetId);
  if (toSacrifice.length === 0) {
    addLog("No unlocked towers match your Quick Sac settings.");
    return;
  }

  const removeIds = new Set(toSacrifice.map((u) => u.id));
  const startLevel = target.level;
  const startXp = target.xp || 0;
  const startReqXp = getRequiredXp(target);
  let totalEarnedXp = 0;

  for (const unit of toSacrifice) {
    const earnedXp =
      typeof getConsumeXpBonus === "function"
        ? getConsumeXpBonus(unit, target)
        : Math.max(10, unit.level * 15 + (unit.upgradeCount || 0) * 20);

    totalEarnedXp += earnedXp;
    target.xp = (target.xp || 0) + earnedXp;

    while (target.xp >= getRequiredXp(target)) {
      target.xp -= getRequiredXp(target);
      target.level++;
    }
  }

  for (let i = inventory.length - 1; i >= 0; i--) {
    if (removeIds.has(inventory[i].id)) {
      inventory.splice(i, 1);
    }
  }

  recalculateUnitStats(target);

  const formattedXp =
    typeof formatGameNumber === "function"
      ? formatGameNumber(totalEarnedXp)
      : totalEarnedXp;

  if (target.level > startLevel) {
    addLog(
      `⭐ Quick Sacrificed ${toSacrifice.length} tower(s) into ${getUnitName(target)} (+${formattedXp} XP) → Level ${target.level}!`,
    );
  } else {
    addLog(
      `⚡ Quick Sacrificed ${toSacrifice.length} tower(s) into ${getUnitName(target)} (+${formattedXp} XP).`,
    );
  }

  const xpAnimData = {
    startLevel,
    startXp,
    startReqXp,
    endLevel: target.level,
    endXp: target.xp,
    endReqXp: getRequiredXp(target),
  };

  saveCampaignProgress();
  updateUI();
  renderInventory();
  renderDeployment();
  openUnitPopup(target.id, xpAnimData);
  openBoostMenu(target.id);
}

function openQuickSacSettingsPopup(targetId) {
  closeQuickSacSettingsPopup();

  const overlay = document.createElement("div");
  overlay.id = "quick-sac-settings-overlay";
  overlay.className = "unit-popup-overlay quick-sac-modal-overlay";
  overlay.style.zIndex = "99999";

  const modal = document.createElement("div");
  modal.className = "unit-popup quick-sac-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  const header = document.createElement("div");
  header.className = "unit-popup-header";

  const title = document.createElement("h2");
  title.textContent = "Quick Sac Settings";
  title.style.margin = "0";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "unit-popup-close";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", closeQuickSacSettingsPopup);

  header.append(title, closeBtn);
  modal.appendChild(header);

  const autosaveAndRefresh = () => {
    saveCampaignProgress();
    if (targetId && document.getElementById("unit-popup-overlay")) {
      openBoostMenu(targetId);
    }
  };

  // --- Rarity Keep Rules ---
  const colHeader = document.createElement("div");
  colHeader.className = "quick-sac-col-header";
  colHeader.innerHTML = `<span>Rarity</span><span>Keep Left</span>`;
  modal.appendChild(colHeader);

  const list = document.createElement("div");
  list.className = "quick-sac-list";

  for (const rarity of QUICK_SAC_RARITIES) {
    if (!quickSacSettings[rarity]) {
      quickSacSettings[rarity] = { enabled: false, keep: 0 };
    }
    const setting = quickSacSettings[rarity];

    const row = document.createElement("div");
    row.className = "quick-sac-row";

    const label = document.createElement("label");
    label.className = `quick-sac-rarity-label ${rarity.toLowerCase()}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(setting.enabled);

    const text = document.createElement("span");
    text.textContent = rarity;

    label.append(checkbox, text);

    const keepInput = document.createElement("input");
    keepInput.type = "number";
    keepInput.className = "quick-sac-num-input";
    keepInput.min = "0";
    keepInput.step = "1";
    keepInput.value = String(setting.keep ?? 0);
    keepInput.title = `Keep ${setting.keep ?? 0} of each ${rarity} tower`;

    checkbox.addEventListener("change", (e) => {
      quickSacSettings[rarity].enabled = e.target.checked;
      autosaveAndRefresh();
    });

    keepInput.addEventListener("input", (e) => {
      if (e.target.value === "") return;
      const parsed = Math.max(0, Math.floor(Number(e.target.value) || 0));
      quickSacSettings[rarity].keep = parsed;
      keepInput.title = `Keep ${parsed} of each ${rarity} tower`;
      autosaveAndRefresh();
    });

    keepInput.addEventListener("blur", () => {
      const parsed = Math.max(0, Math.floor(Number(keepInput.value) || 0));
      quickSacSettings[rarity].keep = parsed;
      keepInput.value = String(parsed);
      autosaveAndRefresh();
    });

    row.append(label, keepInput);
    list.appendChild(row);
  }

  modal.appendChild(list);

  // --- Sacrifice Cap Limits (Level & Upgrades) ---
  const limitsSection = document.createElement("div");
  limitsSection.className = "quick-sac-setting-divider quick-sac-limits-list";

  const createLimitRow = ({
    labelText,
    tooltip,
    enabledKey,
    valueKey,
    minVal,
  }) => {
    const row = document.createElement("div");
    row.className = "quick-sac-row";
    row.title = tooltip;

    const label = document.createElement("label");
    label.className = "quick-sac-limit-label";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = Boolean(quickSacSettings[enabledKey]);

    const span = document.createElement("span");
    span.textContent = labelText;

    label.append(cb, span);

    const numInput = document.createElement("input");
    numInput.type = "number";
    numInput.className = "quick-sac-num-input";
    numInput.min = String(minVal);
    numInput.step = "1";
    numInput.value = String(quickSacSettings[valueKey] ?? minVal);
    numInput.title = tooltip;

    cb.addEventListener("change", (e) => {
      quickSacSettings[enabledKey] = e.target.checked;
      autosaveAndRefresh();
    });

    numInput.addEventListener("input", (e) => {
      if (e.target.value === "") return;
      const parsed = Math.max(
        minVal,
        Math.floor(Number(e.target.value) || minVal),
      );
      quickSacSettings[valueKey] = parsed;
      autosaveAndRefresh();
    });

    numInput.addEventListener("blur", () => {
      const parsed = Math.max(
        minVal,
        Math.floor(Number(numInput.value) || minVal),
      );
      quickSacSettings[valueKey] = parsed;
      numInput.value = String(parsed);
      autosaveAndRefresh();
    });

    row.append(label, numInput);
    return row;
  };

  const categoryRow = document.createElement("div");
  categoryRow.className = "quick-sac-row";
  categoryRow.title = "Choose which tower category Quick Sac can consume";

  const categoryLabel = document.createElement("span");
  categoryLabel.className = "quick-sac-limit-label";
  categoryLabel.textContent = "Category";

  const categorySelect = document.createElement("select");
  categorySelect.className = "upgrade-sort-select";
  categorySelect.style.width = "auto";
  categorySelect.style.minWidth = "96px";

  for (const opt of [
    { value: "all", label: "All" },
    { value: "Main", label: "Main" },
    { value: "Rear", label: "Rear" },
  ]) {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    if ((quickSacSettings.categoryFilter || "all") === opt.value) {
      option.selected = true;
    }
    categorySelect.appendChild(option);
  }

  categorySelect.addEventListener("change", (e) => {
    quickSacSettings.categoryFilter = e.target.value;
    autosaveAndRefresh();
  });

  categoryRow.append(categoryLabel, categorySelect);

  limitsSection.append(
    categoryRow,
    createLimitRow({
      labelText: "Max Level",
      tooltip: "Only sacrifice towers at or below this level",
      enabledKey: "maxLevelEnabled",
      valueKey: "maxLevel",
      minVal: 1,
    }),
    createLimitRow({
      labelText: "Max Upgrades",
      tooltip: "Only sacrifice towers at or below this upgrade count",
      enabledKey: "maxUpgradesEnabled",
      valueKey: "maxUpgrades",
      minVal: 0,
    }),
  );

  modal.appendChild(limitsSection);

  // --- Ask for Confirmation Toggle ---
  const confirmOptionRow = document.createElement("div");
  confirmOptionRow.className = "quick-sac-setting-divider";

  const confirmLabel = document.createElement("label");
  confirmLabel.className = "quick-sac-confirm-toggle";

  const confirmCheckbox = document.createElement("input");
  confirmCheckbox.type = "checkbox";
  confirmCheckbox.checked = quickSacSettings.askConfirmation !== false;

  const confirmText = document.createElement("span");
  confirmText.textContent = "Ask for confirmation";

  confirmCheckbox.addEventListener("change", (e) => {
    quickSacSettings.askConfirmation = e.target.checked;
    saveCampaignProgress();
  });

  confirmLabel.append(confirmCheckbox, confirmText);
  confirmOptionRow.appendChild(confirmLabel);
  modal.appendChild(confirmOptionRow);

  overlay.appendChild(modal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeQuickSacSettingsPopup();
    }
  });

  document.body.appendChild(overlay);
}

function handleQuickSacClick(targetId) {
  if (stageEntered || isBattleRunning()) {
    addLog("You cannot consume units while inside a world.");
    return;
  }

  const candidates = getQuickSacCandidates(targetId);
  if (candidates.length === 0) {
    addLog("No unlocked towers match your Quick Sac settings.");
    return;
  }

  if (quickSacSettings.askConfirmation !== false) {
    openQuickSacConfirmPopup(targetId, candidates);
  } else {
    executeQuickSacrifice(targetId);
  }
}

function openQuickSacConfirmPopup(targetId, candidates) {
  closeQuickSacConfirmPopup();

  const target = inventory.find((u) => u.id === targetId);
  if (!target) return;

  const overlay = document.createElement("div");
  overlay.id = "quick-sac-confirm-overlay";
  overlay.className = "unit-popup-overlay quick-sac-modal-overlay";
  overlay.style.zIndex = "99999";

  const modal = document.createElement("div");
  modal.className = "unit-popup quick-sac-confirm-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.style.width = "100%";
  modal.style.maxWidth = "680px";
  modal.style.boxSizing = "border-box";

  const header = document.createElement("div");
  header.className = "unit-popup-header";

  const title = document.createElement("h2");
  title.textContent = "Confirm Quick Sacrifice";
  title.style.margin = "0";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "unit-popup-close";
  closeBtn.style.width = "auto";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", closeQuickSacConfirmPopup);

  header.append(title, closeBtn);
  modal.appendChild(header);

  let totalXp = 0;
  for (const unit of candidates) {
    totalXp +=
      typeof getConsumeXpBonus === "function"
        ? getConsumeXpBonus(unit, target)
        : Math.max(10, unit.level * 15 + (unit.upgradeCount || 0) * 20);
  }

  const localRarityRank = {
    Mythic: 6,
    Legendary: 5,
    Epic: 4,
    Rare: 3,
    Uncommon: 2,
    Common: 1,
  };

  const sortedCandidates = candidates.slice().sort((a, b) => {
    const rA = localRarityRank[unitTypes[a.type]?.rarity || "Common"] || 0;
    const rB = localRarityRank[unitTypes[b.type]?.rarity || "Common"] || 0;
    if (rA !== rB) return rB - rA;
    if ((a.level || 1) !== (b.level || 1))
      return (b.level || 1) - (a.level || 1);
    return (b.upgradeCount || 0) - (a.upgradeCount || 0);
  });

  const formattedXp =
    typeof formatGameNumber === "function"
      ? formatGameNumber(totalXp)
      : totalXp;

  const summary = document.createElement("div");
  summary.className = "quick-sac-confirm-summary";
  summary.innerHTML = `Sacrificing <strong>${candidates.length}</strong> tower(s) into <strong>${getUnitName(target)}</strong> for <span class="quick-sac-xp-gain">+${formattedXp} XP</span>`;
  modal.appendChild(summary);

  const grid = document.createElement("div");
  grid.className = "quick-sac-confirm-grid";

  for (const unit of sortedCandidates) {
    const typeInfo = unitTypes[unit.type] || {};
    const rarity = typeInfo.rarity || "Common";
    const icon = unit.icon || typeInfo.icon || "";

    const card = document.createElement("div");
    card.className = `quick-sac-confirm-card rarity-border-${rarity.toLowerCase()}`;

    const topRow = document.createElement("div");
    topRow.className = "quick-sac-card-top";

    const nameEl = document.createElement("span");
    nameEl.className = `quick-sac-card-name ${rarity.toLowerCase()}`;
    nameEl.textContent = `${icon ? `${icon} ` : ""}${getUnitName(unit)}`;

    const lvlEl = document.createElement("span");
    lvlEl.className = "quick-sac-card-level";
    lvlEl.textContent = `Lv.${unit.level || 1}${unit.upgradeCount ? ` (+${unit.upgradeCount})` : ""}`;

    topRow.append(nameEl, lvlEl);

    const rarityEl = document.createElement("div");
    rarityEl.className = `quick-sac-card-rarity ${rarity.toLowerCase()}`;
    rarityEl.textContent = rarity;

    card.append(topRow, rarityEl);
    grid.appendChild(card);
  }

  modal.appendChild(grid);

  const footer = document.createElement("div");
  footer.className = "quick-sac-confirm-footer";
  footer.style.display = "flex";
  footer.style.alignItems = "center";
  footer.style.justifyContent = "space-between";
  footer.style.gap = "12px";

  const dontShowLabel = document.createElement("label");
  dontShowLabel.className = "quick-sac-dont-show";
  dontShowLabel.style.display = "inline-flex";
  dontShowLabel.style.alignItems = "center";
  dontShowLabel.style.gap = "8px";
  dontShowLabel.style.margin = "0";

  const dontShowCheckbox = document.createElement("input");
  dontShowCheckbox.type = "checkbox";
  dontShowCheckbox.checked = false;
  dontShowCheckbox.style.width = "16px";
  dontShowCheckbox.style.height = "16px";
  dontShowCheckbox.style.margin = "0";

  const dontShowText = document.createElement("span");
  dontShowText.textContent = "Don't show again";

  dontShowLabel.append(dontShowCheckbox, dontShowText);

  const actions = document.createElement("div");
  actions.className = "quick-sac-confirm-actions";
  actions.style.display = "grid";
  actions.style.gridTemplateColumns = "repeat(2, minmax(110px, 1fr))";
  actions.style.gap = "10px";
  actions.style.marginLeft = "auto";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "quick-sac-action-btn cancel";
  cancelBtn.style.height = "38px";
  cancelBtn.style.margin = "0";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", closeQuickSacConfirmPopup);

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "quick-sac-action-btn confirm";
  confirmBtn.style.height = "38px";
  confirmBtn.style.margin = "0";
  confirmBtn.textContent = "Confirm";
  confirmBtn.addEventListener("click", () => {
    if (dontShowCheckbox.checked) {
      quickSacSettings.askConfirmation = false;
      saveCampaignProgress();
    }
    closeQuickSacConfirmPopup();
    executeQuickSacrifice(target.id);
  });

  actions.append(cancelBtn, confirmBtn);
  footer.append(dontShowLabel, actions);
  modal.appendChild(footer);

  overlay.appendChild(modal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeQuickSacConfirmPopup();
    }
  });

  document.body.appendChild(overlay);
}

function openBoostMenu(targetId) {
  const target = inventory.find((unit) => unit.id === targetId);
  if (!target) return;

  const overlay = document.getElementById("unit-popup-overlay");
  const layout = overlay?.querySelector(".unit-popup-layout");
  if (!overlay || !layout) return;

  layout.querySelector(".upgrade-side-panel")?.remove();

  const panel = document.createElement("div");
  panel.className = "unit-popup upgrade-side-panel";
  panel.setAttribute("role", "dialog");

  const header = document.createElement("div");
  header.className = "unit-popup-header";

  const title = document.createElement("h2");
  title.textContent = "Sacrifice for XP";

  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.className = "unit-popup-close";
  closeButton.addEventListener("click", () => panel.remove());

  header.append(title, closeButton);
  panel.appendChild(header);

  // --- Quick Sacrifice Bar ---
  const quickSacCandidates = getQuickSacCandidates(target.id);
  const quickSacBar = document.createElement("div");
  quickSacBar.className = "quick-sac-bar";
  quickSacBar.style.display = "flex";
  quickSacBar.style.alignItems = "center";
  quickSacBar.style.gap = "6px";
  quickSacBar.style.marginBottom = "8px";

  const quickSacBtn = document.createElement("button");
  quickSacBtn.type = "button";
  quickSacBtn.className = "quick-sac-btn";
  quickSacBtn.style.flex = "1";
  quickSacBtn.style.width = "auto";
  quickSacBtn.textContent = `⚡ Quick Sac (${quickSacCandidates.length})`;
  quickSacBtn.disabled =
    stageEntered || isBattleRunning() || quickSacCandidates.length === 0;
  quickSacBtn.addEventListener("click", () => handleQuickSacClick(target.id));

  const quickSacSettingsBtn = document.createElement("button");
  quickSacSettingsBtn.type = "button";
  quickSacSettingsBtn.className = "quick-sac-settings-btn";
  quickSacSettingsBtn.style.width = "36px";
  quickSacSettingsBtn.style.minWidth = "36px";
  quickSacSettingsBtn.style.flex = "0 0 36px";
  quickSacSettingsBtn.textContent = "⚙️";
  quickSacSettingsBtn.title = "Quick Sac Settings";
  quickSacSettingsBtn.setAttribute("aria-label", "Quick Sac Settings");
  quickSacSettingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openQuickSacSettingsPopup(target.id);
  });

  quickSacBar.append(quickSacBtn, quickSacSettingsBtn);
  panel.appendChild(quickSacBar);

  // --- Filter, Sort & Direction Controls ---
  const sortContainer = document.createElement("div");
  sortContainer.className = "upgrade-sort-container";
  sortContainer.style.display = "flex";
  sortContainer.style.gap = "6px";
  sortContainer.style.margin = "8px 0 12px 0";

  const filterLabels = {
    all: "Filter: All",
    Main: "Filter: Main",
    Rear: "Filter: Rear",
  };

  const filterBtn = document.createElement("button");
  filterBtn.type = "button";
  filterBtn.className = "upgrade-order-btn";
  filterBtn.style.width = "auto";
  filterBtn.style.flexShrink = "0";
  filterBtn.style.whiteSpace = "nowrap";
  filterBtn.style.padding = "0 10px";
  filterBtn.textContent =
    filterLabels[boostMenuCategoryFilter] || "Filter: All";
  filterBtn.title = "Filter by category (All / Main / Rear)";
  filterBtn.addEventListener("click", () => {
    if (boostMenuCategoryFilter === "all") boostMenuCategoryFilter = "Main";
    else if (boostMenuCategoryFilter === "Main")
      boostMenuCategoryFilter = "Rear";
    else boostMenuCategoryFilter = "all";
    openBoostMenu(target.id);
  });

  const sortSelect = document.createElement("select");
  sortSelect.className = "upgrade-sort-select";
  sortSelect.style.flex = "1";
  sortSelect.style.minWidth = "0";

  for (const opt of [
    { value: "level", label: "Sort: Level" },
    { value: "xp", label: "Sort: XP Granted" },
    { value: "name", label: "Sort: Name" },
    { value: "rarity", label: "Sort: Rarity" },
    { value: "upgrades", label: "Sort: Upgrades" },
  ]) {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    if (boostMenuSortMode === opt.value) option.selected = true;
    sortSelect.appendChild(option);
  }

  sortSelect.addEventListener("change", (e) => {
    boostMenuSortMode = e.target.value;
    openBoostMenu(target.id);
  });

  const orderBtn = document.createElement("button");
  orderBtn.type = "button";
  orderBtn.className = "upgrade-order-btn";
  orderBtn.textContent = boostMenuSortOrder === "asc" ? "▲" : "▼";
  orderBtn.addEventListener("click", () => {
    boostMenuSortOrder = boostMenuSortOrder === "asc" ? "desc" : "asc";
    openBoostMenu(target.id);
  });

  sortContainer.append(filterBtn, sortSelect, orderBtn);
  panel.appendChild(sortContainer);

  let candidates = inventory.filter((unit) => {
    if (unit.id === target.id || unit.isLocked) return false;
    if (boostMenuCategoryFilter !== "all") {
      const cat = unit.category || getUnitData(unit).category || "Main";
      if (cat !== boostMenuCategoryFilter) return false;
    }
    return true;
  });

  if (candidates.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent =
      boostMenuCategoryFilter === "all"
        ? "No unlocked towers."
        : `No unlocked ${boostMenuCategoryFilter} towers.`;
    panel.appendChild(emptyMessage);
    layout.appendChild(panel);
    return;
  }

  function getXpYield(candidate) {
    if (typeof getConsumeXpBonus === "function") {
      return getConsumeXpBonus(candidate, target);
    }
    if (typeof calculateSacrificeXp === "function") {
      return calculateSacrificeXp(candidate);
    }
    return Math.max(
      10,
      candidate.level * 15 + (candidate.upgradeCount || 0) * 20,
    );
  }

  // Pre-calculate peak levels for family tiebreakers
  const typeMaxLevels = {};
  const typeMaxLevelsByUpgrade = {};
  for (const unit of inventory) {
    const uType = unit.type || "unknown";
    const uLvl = Number(unit.level) || 1;
    const uUpg = Number(unit.upgradeCount) || 0;

    if (!typeMaxLevels[uType] || uLvl > typeMaxLevels[uType]) {
      typeMaxLevels[uType] = uLvl;
    }
    if (!typeMaxLevelsByUpgrade[uUpg]) {
      typeMaxLevelsByUpgrade[uUpg] = {};
    }
    if (
      !typeMaxLevelsByUpgrade[uUpg][uType] ||
      uLvl > typeMaxLevelsByUpgrade[uUpg][uType]
    ) {
      typeMaxLevelsByUpgrade[uUpg][uType] = uLvl;
    }
  }

  const dir = boostMenuSortOrder === "asc" ? -1 : 1;

  candidates.sort((a, b) => {
    const dataA = getUnitData(a);
    const dataB = getUnitData(b);

    const rarityA =
      (typeof rarityRank !== "undefined" ? rarityRank[dataA.rarity] : 0) || 0;
    const rarityB =
      (typeof rarityRank !== "undefined" ? rarityRank[dataB.rarity] : 0) || 0;
    const nameA = dataA.name || "";
    const nameB = dataB.name || "";

    const lvlA = Number(a.level) || 1;
    const lvlB = Number(b.level) || 1;
    const upgA = Number(a.upgradeCount) || 0;
    const upgB = Number(b.upgradeCount) || 0;

    let primaryDiff = 0;

    switch (boostMenuSortMode) {
      case "level":
        primaryDiff = lvlB - lvlA;
        if (primaryDiff !== 0) return primaryDiff * dir;
        if (rarityB !== rarityA) return rarityB - rarityA;
        if (nameA.localeCompare(nameB) !== 0) return nameA.localeCompare(nameB);
        return b.id - a.id;

      case "rarity": {
        primaryDiff = rarityB - rarityA;
        if (primaryDiff !== 0) return primaryDiff * dir;

        const maxLvlA = typeMaxLevels[a.type] || lvlA;
        const maxLvlB = typeMaxLevels[b.type] || lvlB;

        if (maxLvlB !== maxLvlA) return maxLvlB - maxLvlA;
        if (nameA.localeCompare(nameB) !== 0) return nameA.localeCompare(nameB);
        if (lvlB !== lvlA) return lvlB - lvlA;
        return b.id - a.id;
      }

      case "upgrades": {
        primaryDiff = upgB - upgA;
        if (primaryDiff !== 0) return primaryDiff * dir;

        if (rarityB !== rarityA) return rarityB - rarityA;

        const upgBucket = typeMaxLevelsByUpgrade[upgA] || {};
        const maxLvlA = upgBucket[a.type] || lvlA;
        const maxLvlB = upgBucket[b.type] || lvlB;

        if (maxLvlB !== maxLvlA) return maxLvlB - maxLvlA;
        if (nameA.localeCompare(nameB) !== 0) return nameA.localeCompare(nameB);
        if (lvlB !== lvlA) return lvlB - lvlA;
        return b.id - a.id;
      }

      case "xp": {
        const yieldA = getXpYield(a);
        const yieldB = getXpYield(b);
        primaryDiff = yieldB - yieldA;
        if (primaryDiff !== 0) return primaryDiff * dir;
        if (rarityB !== rarityA) return rarityB - rarityA;
        if (lvlB !== lvlA) return lvlB - lvlA;
        if (nameA.localeCompare(nameB) !== 0) return nameA.localeCompare(nameB);
        return b.id - a.id;
      }

      case "name":
        primaryDiff = nameA.localeCompare(nameB);
        if (primaryDiff !== 0) return primaryDiff * dir;
        if (lvlB !== lvlA) return lvlB - lvlA;
        return b.id - a.id;

      default:
        primaryDiff = b.id - a.id;
        if (primaryDiff !== 0) return primaryDiff * dir;
        if (lvlB !== lvlA) return lvlB - lvlA;
        return nameA.localeCompare(nameB);
    }
  });

  for (const candidate of candidates) {
    const data = getUnitData(candidate);
    const rarityClass = (data.rarity || "Common").toLowerCase();
    const xpBonus = getXpYield(candidate);

    const button = document.createElement("button");
    button.type = "button";
    button.className = `unit-card unit-card-compact ${rarityClass}`;
    button.disabled = stageEntered || isBattleRunning();

    const cleanName = data.name.replace(/\s*\[(Main|Rear)\]\s*/gi, "");

    const name = document.createElement("strong");
    name.textContent = cleanName;

    const details = document.createElement("span");
    const formattedXp =
      typeof formatGameNumber === "function"
        ? formatGameNumber(xpBonus)
        : xpBonus;
    details.textContent =
      boostMenuSortMode === "upgrades"
        ? `Upgrades: ${candidate.upgradeCount} → +${formattedXp} XP`
        : `Lv. ${candidate.level} → +${formattedXp} XP`;

    button.append(name, details);

    button.addEventListener("click", () => {
      let animData = null;
      if (typeof consumeUnitForXp === "function") {
        animData = consumeUnitForXp(target.id, candidate.id);
      } else if (typeof boostUnitXp === "function") {
        boostUnitXp(target.id, candidate.id);
      }
      openUnitPopup(target.id, animData);
      openBoostMenu(target.id);
    });

    panel.appendChild(button);
  }

  layout.appendChild(panel);
}

/* ==========================================================================
   8. STAGE PROGRESSION, WAVE MANAGEMENT & REWARDS
   ========================================================================== */

function selectStage(stageId) {
  if (stageEntered || isBattleRunning()) return;

  if (currentCampaignTabMode === "challenge") {
    const stage = challengeStages.find((s) => s.id === stageId);
    if (!stage || stage.index > unlockedChallengeIndex) return;
    selectedChallengeStageId = stage.id;
  } else {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage || stage.index > unlockedStageIndex) return;
    selectedStageId = stage.id;
  }

  wave = 0;
  stageEntered = false;
  startWaveAvailable = false;
  baseHealth = maxBaseHealth;

  renderStageSelect();
  updateUI();
}

function handleWaveCleared() {
  const stage = getSelectedStage();

  awardWaveST();
  awardWaveXpToDeployedUnits(stage.enemyLevel ?? 1);
  processTowerStaminaOnWaveClear();

  // --- 1. CHALLENGE MODE PROGRESSION ---
  if (stage.isChallenge) {
    if (typeof stopBattle === "function") stopBattle();

    stageEntered = false;
    startWaveAvailable = false;
    wave = 0;

    const isFirstClear = !clearedChallengeStageIds.has(stage.id);
    let mainStageGold = 0;
    let earnedTicket = false;
    const stEarned = stage.stReward || 20;

    if (isFirstClear) {
      clearedChallengeStageIds.add(stage.id);

      mainStageGold = stage.reward;
      gold += mainStageGold;
      st += stEarned;

      let ticketItem = warehouse.find((item) => item.id === "challenge_ticket");
      if (ticketItem) {
        ticketItem.count += 1;
      } else {
        warehouse.push({
          id: "challenge_ticket",
          name: "Challenge Ticket",
          count: 1,
        });
      }
      earnedTicket = true;

      if (
        stage.index === unlockedChallengeIndex &&
        unlockedChallengeIndex < challengeStages.length - 1
      ) {
        unlockedChallengeIndex++;
      }
    }

    enemyStatus.textContent = `Challenge Stage ${stage.id} cleared!`;

    const deployed = [...deployedUnits, ...deployedBaseUnits].filter(
      (u) => u !== null,
    );
    const towerStats = deployed.map((unit) => ({
      name: getUnitName(unit),
      category: unit.category || "Main",
      level: unit.level,
      xpGained: unit.stageXpGained || 0,
      damageDealt: unit.stageDamage || 0,
      kills: unit.stageKills || 0,
    }));

    const totalGoldFromStage = stageEnemyGoldEarned + mainStageGold;
    const totalStFromStage = stEarned + stageWaveStEarned;

    // Track Session Rewards for Challenge Mode (No accumulators)
    if (autoRepeatEnabled) {
      autoRepeatSessionStats.runsCompleted++;
      autoRepeatSessionStats.totalGold += totalGoldFromStage;
      autoRepeatSessionStats.totalSt += totalStFromStage;
    } else {
      autoRepeatSessionStats = {
        runsCompleted: 1,
        totalGold: totalGoldFromStage,
        totalSt: totalStFromStage,
        ticketsEarned: 0,
        towerStatsMap: {},
      };
    }

    saveCampaignProgress();
    updateUI();
    renderStageSelect();
    renderDeployment();

    openStageClearedPopup({
      stageId: stage.id,
      stageName: stage.name || `Challenge Stage ${stage.id}`,
      enemyGold: stageEnemyGoldEarned,
      waveGold: 0,
      clearGold: mainStageGold,
      totalGold: totalGoldFromStage,
      stEarned: stEarned,
      waveStEarned: stageWaveStEarned,
      isFirstClear: isFirstClear,
      earnedTicket: earnedTicket,
      towerStats: towerStats,
      sessionStats: { ...autoRepeatSessionStats },
    });

    resetStageCounters();
    return;
  }

  // --- 2. STANDARD CAMPAIGN MODE PROGRESSION ---
  const techMult =
    typeof getTechGoldMultiplier === "function" ? getTechGoldMultiplier() : 1;
  const minorWaveGold = Math.max(
    1,
    Math.floor(
      stage.reward *
        (0.1 / stage.waves.length) *
        getStageRewardMultiplier(stage.id) *
        techMult *
        getFatigueRewardMultiplier(),
    ),
  );
  gold += minorWaveGold;
  stageWaveGoldEarned += minorWaveGold;

  stageEntered = true;
  startWaveAvailable = wave < stage.waves.length;

  // Intermediate Wave Cleared
  if (wave < stage.waves.length) {
    enemyStatus.textContent = `Stage ${stage.id} — Wave ${wave} cleared.`;
    addLog(
      `Wave ${wave}/${stage.waves.length} cleared! +${minorWaveGold} wave gold.`,
    );

    saveCampaignProgress();
    updateUI();
    renderStageSelect();

    if (
      typeof isAutoWaveUnlocked === "function" &&
      isAutoWaveUnlocked() &&
      autoStartWaveEnabled
    ) {
      // 300ms pause via worker (unthrottled in background tabs)
      startWorkerIntermission(autoStageDelay, () => {
        if (stageEntered && startWaveAvailable && !isBattleRunning()) {
          startWave();
        }
      });
    }
    return;
  }

  // Final Wave / World Cleared
  if (typeof stopBattle === "function") {
    stopBattle();
  }

  stageEntered = false;
  startWaveAvailable = false;
  wave = 0;

  const isFirstClear = !clearedStageIds.has(stage.id);
  const clearCount = stageClearCounts[stage.id] || 0;
  const multiplier = getStageRewardMultiplier(stage.id);

  const isBoss =
    stage.isBoss === true ||
    stage.boss === true ||
    stage.type === "boss" ||
    /boss/i.test(stage.name ?? "");

  const baseSt = isBoss ? 10 : 5;
  let stEarned = 0;

  if (isFirstClear) {
    stEarned = baseSt;
    clearedStageIds.add(stage.id);
  } else if (clearCount < MAX_CLEARS_FOR_REWARDS) {
    stEarned = Math.max(
      1,
      Math.floor(baseSt * (1 - clearCount * (1 / MAX_CLEARS_FOR_REWARDS))),
    );
  }

  st += stEarned;

  const mainStageGold = Math.max(
    15,
    Math.floor(
      stage.reward * 0.9 * multiplier * techMult * getFatigueRewardMultiplier(),
    ),
  );
  gold += mainStageGold;

  const totalGoldFromStage =
    stageEnemyGoldEarned + stageWaveGoldEarned + mainStageGold;
  const totalStFromStage = stEarned + stageWaveStEarned;

  stageClearCounts[stage.id] = clearCount + 1;

  let unlockedStageId = null;
  const unlockedNewStage =
    stage.index === unlockedStageIndex && stage.index < stages.length - 1;

  if (unlockedNewStage) {
    unlockedStageIndex = stage.index + 1;
    unlockedStageId = stages[unlockedStageIndex].id;
  }

  enemyStatus.textContent = `Stage ${stage.id} cleared!`;

  const deployed = [...deployedUnits, ...deployedBaseUnits].filter(
    (u) => u !== null,
  );
  const towerStats = deployed.map((unit) => ({
    name: getUnitName(unit),
    category: unit.category || "Main",
    level: unit.level,
    xpGained: unit.stageXpGained || 0,
    damageDealt: unit.stageDamage || 0,
    kills: unit.stageKills || 0,
  }));

  // Track Session Rewards & Accumulate Tower Performance for Campaign Mode
  if (autoRepeatEnabled) {
    autoRepeatSessionStats.runsCompleted++;
    autoRepeatSessionStats.totalGold += totalGoldFromStage;
    autoRepeatSessionStats.totalSt += totalStFromStage;
    accumulateSessionTowerStats(towerStats);
  } else {
    autoRepeatSessionStats = {
      runsCompleted: 1,
      totalGold: totalGoldFromStage,
      totalSt: totalStFromStage,
      ticketsEarned: 0,
      towerStatsMap: {},
    };
    accumulateSessionTowerStats(towerStats);
  }

  if (unlockedNewStage) {
    unlockedStageIndex = stage.index + 1;
    unlockedStageId = stages[unlockedStageIndex].id;
    selectedStageId = unlockedStageId;
    currentStagePage = Math.floor(unlockedStageIndex / stagesPerPage);
  }

  saveCampaignProgress();
  updateUI();
  renderStageSelect();
  renderDeployment();
  processInventoryStaminaRegenOnStageClear(stage.id);

  openStageClearedPopup({
    stageId: stage.id,
    stageName: stage.name || `Stage ${stage.id}`,
    enemyGold: stageEnemyGoldEarned,
    waveGold: stageWaveGoldEarned,
    clearGold: mainStageGold,
    totalGold: totalGoldFromStage,
    stEarned: stEarned,
    waveStEarned: stageWaveStEarned,
    isFirstClear: isFirstClear,
    unlockedStageId: unlockedStageId,
    towerStats: towerStats,
    sessionStats: { ...autoRepeatSessionStats },
  });

  resetStageCounters();

  // Auto-Repeat Execution & Counter Check
  if (
    typeof isAutoRepeatUnlocked === "function" &&
    isAutoRepeatUnlocked() &&
    autoRepeatEnabled
  ) {
    let shouldRepeat = false;

    if (autoRepeatCount === 0) {
      shouldRepeat = true; // Unlimited runs
    } else if (autoRepeatRemaining > 1) {
      autoRepeatRemaining--;
      shouldRepeat = true;
    } else {
      autoRepeatRemaining = 0;
      autoRepeatEnabled = false;
      autoStartWaveEnabled = false;
      addLog("🔁 Auto-Repeat completed all target runs!");
      if (typeof renderAutoWaveControl === "function") renderAutoWaveControl();
    }

    if (shouldRepeat) {
      startWorkerIntermission(autoWorldDelay, () => {
        enterStage();
      });
    } else {
      // Reset session stats when target runs finish
      autoRepeatSessionStats = {
        runsCompleted: 0,
        totalGold: 0,
        totalSt: 0,
        ticketsEarned: 0,
        towerStatsMap: {},
      };
    }
  }
}

function renderStageSelect() {
  const isChallenge = currentCampaignTabMode === "challenge";
  const stageList = isChallenge ? challengeStages : stages;
  const currentUnlockedIdx = isChallenge
    ? unlockedChallengeIndex
    : unlockedStageIndex;
  const activeSelectedId = isChallenge
    ? selectedChallengeStageId
    : selectedStageId;

  const modeDesc = document.getElementById("mode-description-text");
  if (modeDesc) {
    modeDesc.textContent = isChallenge
      ? "Face high-threat single-target bosses. First clears yield massive gold and 1 Challenge Ticket!"
      : "Choose an unlocked stage. Clear all its waves to unlock the next stage.";
  }

  if (stageWorldLabel) {
    if (isChallenge) {
      stageWorldLabel.textContent = "Single-Target Boss Arena";
    } else {
      const visibleStages = stageList.slice(
        currentStagePage * stagesPerPage,
        (currentStagePage + 1) * stagesPerPage,
      );
      const first = visibleStages[0] || getSelectedStage();
      stageWorldLabel.textContent = `World ${first.world} — ${worldThemes[first.world]?.name || "World " + first.world}`;
    }
  }

  stageGrid.replaceChildren();

  const totalPages = Math.ceil(stageList.length / stagesPerPage);
  currentStagePage = Math.max(0, Math.min(totalPages - 1, currentStagePage));

  const startIndex = currentStagePage * stagesPerPage;
  const visibleStages = stageList.slice(startIndex, startIndex + stagesPerPage);

  for (const stage of visibleStages) {
    const button = document.createElement("button");
    button.className = "stage-button";

    const isLocked = stage.index > currentUnlockedIdx;
    const isCleared = isChallenge
      ? clearedChallengeStageIds.has(stage.id)
      : (stageClearCounts[stage.id] || 0) > 0;

    if (stage.id === activeSelectedId) button.classList.add("selected");
    if (isCleared) button.classList.add("cleared");
    if (isLocked) button.classList.add("locked");

    button.disabled = stageEntered || isBattleRunning() || isLocked;

    const id = document.createElement("span");
    id.className = "stage-id";
    id.textContent = isChallenge ? `Lv. ${stage.enemyLevel}` : stage.id;

    const status = document.createElement("span");
    status.className = "stage-status";

    if (isLocked) {
      status.textContent = "Locked";
    } else if (isChallenge) {
      status.textContent = isCleared ? "Completed" : "Available";
    } else {
      const clears = Math.min(
        MAX_CLEARS_FOR_REWARDS,
        stageClearCounts[stage.id] || 0,
      );
      status.textContent = `${Math.round((clears / MAX_CLEARS_FOR_REWARDS) * 100)}% Cleared`;
    }

    button.append(id, status);

    if (!isChallenge) {
      const clears = Math.min(
        MAX_CLEARS_FOR_REWARDS,
        stageClearCounts[stage.id] || 0,
      );
      const track = document.createElement("div");
      track.className = "stage-progress-track";
      const fill = document.createElement("div");
      fill.className = "stage-progress-fill";
      fill.style.width = `${(clears / MAX_CLEARS_FOR_REWARDS) * 100}%`;
      track.appendChild(fill);
      button.appendChild(track);
    }

    button.addEventListener("click", () => selectStage(stage.id));
    stageGrid.appendChild(button);
  }

  let paginationContainer = document.getElementById("stage-pagination");
  if (!paginationContainer) {
    paginationContainer = document.createElement("div");
    paginationContainer.id = "stage-pagination";
    paginationContainer.className = "stage-pagination";
    stageGrid.parentNode.insertBefore(paginationContainer, stageDetails);
  }
  paginationContainer.replaceChildren();

  if (totalPages > 1) {
    const prevButton = document.createElement("button");
    prevButton.type = "button";
    prevButton.textContent = "◀ Prev";
    prevButton.disabled =
      currentStagePage === 0 || stageEntered || isBattleRunning();
    prevButton.addEventListener("click", () => {
      if (currentStagePage > 0) {
        currentStagePage--;
        renderStageSelect();
      }
    });

    const pageIndicator = document.createElement("span");
    pageIndicator.textContent = `${currentStagePage + 1} / ${totalPages}`;

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.textContent = "Next ▶";
    nextButton.disabled =
      currentStagePage >= totalPages - 1 || stageEntered || isBattleRunning();
    nextButton.addEventListener("click", () => {
      if (currentStagePage < totalPages - 1) {
        currentStagePage++;
        renderStageSelect();
      }
    });

    paginationContainer.append(prevButton, pageIndicator, nextButton);
  }

  const selected = getSelectedStage();
  const heading = document.createElement("strong");
  heading.textContent = isChallenge
    ? `Level ${selected.enemyLevel}: ${selected.name}`
    : `Stage ${selected.id}: ${selected.name}`;

  const description = document.createElement("p");
  description.innerHTML = selected.description;

  const info = document.createElement("p");
  if (isChallenge) {
    const isCleared = clearedChallengeStageIds.has(selected.id);
    info.textContent = isCleared
      ? `1 Wave (Boss) · Rewards Already Claimed · Enemy Level ${selected.enemyLevel}`
      : `1 Wave (Boss) · +${selected.reward} Gold · +1 Challenge Ticket · +${selected.stReward} ST · ${selected.enemyLevel}`;
  } else {
    const selectedClears = stageClearCounts[selected.id] || 0;
    const displayClears = Math.min(MAX_CLEARS_FOR_REWARDS, selectedClears);
    const selectedPercent = Math.round(
      (displayClears / MAX_CLEARS_FOR_REWARDS) * 100,
    );
    const techMult =
      typeof getTechGoldMultiplier === "function" ? getTechGoldMultiplier() : 1;
    const currentGold = Math.floor(
      selected.reward * getStageRewardMultiplier(selected.id) * techMult,
    );
    info.textContent = `${selected.waves.length} waves · ${currentGold} gold · Progress: ${displayClears}/${MAX_CLEARS_FOR_REWARDS} (${selectedPercent}%) · Enemy Level ${selected.enemyLevel ?? 1}`;
  }

  const detailsMain = document.createElement("div");
  detailsMain.className = "stage-details-main";
  detailsMain.append(heading, description, info);

  const buttonGroup = document.createElement("div");
  buttonGroup.className = "stage-action-buttons";

  const playButton = document.createElement("button");
  playButton.className = "stage-play-btn";
  playButton.textContent = !stageEntered
    ? isChallenge
      ? `Challenge Level ${selected.enemyLevel}`
      : `Enter World ${selected.id}`
    : isBattleRunning()
      ? `Running Wave ${wave}/${selected.waves.length}`
      : "Entered";

  playButton.disabled = stageEntered || isBattleRunning() || baseHealth <= 0;
  playButton.addEventListener("click", enterStage);
  buttonGroup.appendChild(playButton);

  if (stageEntered) {
    const exitButton = document.createElement("button");
    exitButton.type = "button";
    exitButton.className = "stage-exit-btn";
    exitButton.textContent = "Exit Stage";
    exitButton.addEventListener("click", exitStage);
    buttonGroup.appendChild(exitButton);
  }

  // --- STABLE AUTO-REPEAT COMPONENT RENDERING ---
  if (typeof isAutoRepeatUnlocked === "function" && isAutoRepeatUnlocked()) {
    let autoRepeatRow = document.getElementById("persistent-auto-repeat-row");

    if (!autoRepeatRow) {
      autoRepeatRow = document.createElement("div");
      autoRepeatRow.id = "persistent-auto-repeat-row";

      const repeatCb = document.createElement("input");
      repeatCb.type = "checkbox";
      repeatCb.id = "toggle-auto-repeat-checkbox";

      const repeatLabel = document.createElement("label");
      repeatLabel.htmlFor = "toggle-auto-repeat-checkbox";

      const countInput = document.createElement("input");
      countInput.type = "number";
      countInput.id = "auto-repeat-count-input";
      countInput.min = "0";
      countInput.title = "0 = Unlimited repeats";

      const hint = document.createElement("small");
      hint.id = "auto-repeat-hint";

      const updateDisplay = () => {
        const activeRun =
          autoRepeatEnabled && (stageEntered || isBattleRunning());

        if (activeRun) {
          autoRepeatRow.className = "auto-repeat-row running";
          repeatLabel.textContent = "Repeating:";
          countInput.style.display = "none";

          const remainingStr =
            autoRepeatCount === 0
              ? "∞"
              : `${autoRepeatRemaining > 0 ? autoRepeatRemaining : autoRepeatCount}`;
          hint.textContent = `${remainingStr} left`;
        } else {
          autoRepeatRow.className = autoRepeatEnabled
            ? "auto-repeat-row active"
            : "auto-repeat-row";
          repeatLabel.textContent = "Auto-Repeat World:";
          countInput.style.display = "inline-block";
          hint.textContent =
            autoRepeatCount === 0
              ? "(∞)"
              : autoRepeatCount === 1
                ? `(${autoRepeatCount} repeat)`
                : `(${autoRepeatCount} repeats)`;
        }
      };

      const handleToggle = (e) => {
        e.preventDefault();
        autoRepeatEnabled = !autoRepeatEnabled;
        autoStartWaveEnabled = autoRepeatEnabled;

        if (autoRepeatEnabled) {
          autoRepeatRemaining = autoRepeatCount;
          autoRepeatSessionStats = {
            runsCompleted: 0,
            totalGold: 0,
            totalSt: 0,
            ticketsEarned: 0,
            towerStatsMap: {},
          };
        } else {
          autoRepeatRemaining = 0;
        }

        updateDisplay();
        if (typeof renderAutoWaveControl === "function")
          renderAutoWaveControl();
        saveCampaignProgress();
      };

      repeatCb.addEventListener("pointerdown", handleToggle);
      repeatLabel.addEventListener("pointerdown", handleToggle);

      countInput.addEventListener("input", (e) => {
        const val = Math.max(0, parseInt(e.target.value) || 0);
        autoRepeatCount = val;
        autoRepeatRemaining = val;
        updateDisplay();
        saveCampaignProgress();
      });

      // Attach global updater to row reference so it updates cleanly
      autoRepeatRow._updateAutoRepeatUI = updateDisplay;
      autoRepeatRow.append(repeatCb, repeatLabel, countInput, hint);
    }

    // Sync input values with current global state on every render tick
    const cb = autoRepeatRow.querySelector("#toggle-auto-repeat-checkbox");
    const num = autoRepeatRow.querySelector("#auto-repeat-count-input");
    if (cb) cb.checked = autoRepeatEnabled;
    if (num) num.value = String(autoRepeatCount);
    if (typeof autoRepeatRow._updateAutoRepeatUI === "function") {
      autoRepeatRow._updateAutoRepeatUI();
    }

    detailsMain.appendChild(autoRepeatRow);
  }

  stageDetails.replaceChildren(detailsMain, buttonGroup);
}

function enterStage() {
  if (stageEntered || isBattleRunning()) return;

  const stage = getSelectedStage();
  if (wave >= stage.waves.length) return;

  baseHealth = maxBaseHealth;
  stageEntered = true;
  startWaveAvailable = true;

  resetStageCounters();

  // Ensure Auto-Start is on if Auto-Repeat is active
  if (autoRepeatEnabled) {
    autoStartWaveEnabled = true;
  }

  enemyStatus.textContent = `Stage ${stage.id} entered. Ready to start Wave ${wave + 1}.`;

  saveCampaignProgress();
  renderStageSelect();
  updateUI();

  // Automatically start Wave 1 on stage entry using the worker timer
  if (
    typeof isAutoWaveUnlocked === "function" &&
    isAutoWaveUnlocked() &&
    autoStartWaveEnabled
  ) {
    startWorkerIntermission(autoStageDelay, () => {
      if (stageEntered && startWaveAvailable && !isBattleRunning()) {
        startWave();
      }
    });
  }
}

function startWave() {
  if (isBattleRunning()) return;

  if (baseHealth <= 0) {
    addLog("Your base has been destroyed. Select a stage to retry.");
    return;
  }

  if (!stageEntered || !startWaveAvailable) return;

  const stage = getSelectedStage();

  if (wave >= stage.waves.length) {
    addLog(
      `Stage ${stage.id} is already cleared. Select another stage or replay it.`,
    );
    return;
  }

  wave++;
  startWaveAvailable = false;

  enemyStatus.textContent = `Stage ${stage.id} — Wave ${wave} in progress...`;
  addLog(`Starting Stage ${stage.id}, Wave ${wave}.`);

  saveCampaignProgress();
  updateUI();
  renderStageSelect();

  if (typeof battleStart === "function") {
    battleStart(wave);
  }
}

function exitStage() {
  if (!stageEntered && !isBattleRunning()) return;

  const confirmed = confirm(
    "Are you sure you want to exit this world? Any progress in an active wave will be reset.",
  );

  if (!confirmed) return;

  // 1. Cancel queued timers & auto-repeat loops
  if (autoWaveTimeout !== null) {
    clearTimeout(autoWaveTimeout);
    autoWaveTimeout = null;
  }

  if (typeof cancelAutoRepeat === "function") {
    cancelAutoRepeat();
  }

  // 2. Stop running battle loop & clear wave entities
  if (typeof stopBattle === "function") {
    stopBattle();
  }

  // 3. Reset stage state variables
  stageEntered = false;
  startWaveAvailable = false;
  wave = 0;
  baseHealth = maxBaseHealth;

  // 4. Reset UI & log feedback
  enemyStatus.textContent = `Exited Stage ${selectedStageId}. Ready to re-enter or choose another stage.`;
  addLog(`Exited Stage ${selectedStageId} and returned to base.`);

  saveCampaignProgress();
  updateUI();
  renderStageSelect();
  renderDeployment();
}

function awardWaveST() {
  const stage = getSelectedStage();
  const clears = Math.min(5, stageClearCounts[stage.id] || 0);

  const baseDropChance =
    startStDropChance - (clears / 5) * (startStDropChance - endStDropChance);

  // Apply fatigue penalty multiplier (0.1x / 90% reduction if any deployed tower is fatigued)
  const fatigueMultiplier = getFatigueRewardMultiplier();
  const effectiveDropChance = baseDropChance * fatigueMultiplier;

  if (Math.random() < effectiveDropChance) {
    st += 1;
    stageWaveStEarned = (stageWaveStEarned || 0) + 1;
    addLog("ST drop! You received 1 ST.");
    return true;
  }

  return false;
}

function addStageEnemyGold(amount) {
  if (stageEntered) {
    stageEnemyGoldEarned += amount;
  }
}

function resetStageCounters() {
  stageEnemyGoldEarned = 0;
  stageWaveGoldEarned = 0;
  stageWaveStEarned = 0;

  const deployed = [...deployedUnits, ...deployedBaseUnits].filter(
    (u) => u !== null,
  );
  for (const unit of deployed) {
    unit.stageDamage = 0;
    unit.stageKills = 0;
    unit.stageXpGained = 0;
  }
}

function openStageClearedPopup(summary) {
  if (!showClearPopup) return;

  // Preserve the current scroll position before destroying the existing overlay
  const existingStatsList = document.querySelector(
    "#stage-clear-overlay .tower-stats-list",
  );
  if (existingStatsList) {
    savedTowerStatsScrollTop = existingStatsList.scrollTop;
  }

  document.getElementById("stage-clear-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "stage-clear-overlay";
  overlay.className = "unit-popup-overlay";

  const popup = document.createElement("div");
  popup.className = "unit-popup stage-clear-popup";

  const isMultiRun =
    summary.sessionStats && summary.sessionStats.runsCompleted > 1;

  const title = document.createElement("h2");
  title.className = "stage-clear-title";
  title.textContent = isMultiRun
    ? `🔁 Auto-Repeat Run #${summary.sessionStats.runsCompleted} Cleared!`
    : `🎉 Stage ${summary.stageId} Cleared!`;

  const subtitle = document.createElement("p");
  subtitle.className = "unit-popup-subtitle";
  subtitle.textContent = summary.stageName;

  const singleRunSt = summary.stEarned + (summary.waveStEarned || 0);
  const displayTotalGold = isMultiRun
    ? summary.sessionStats.totalGold
    : summary.totalGold;
  const displayTotalSt = isMultiRun
    ? summary.sessionStats.totalSt
    : singleRunSt;

  const rewardsBox = document.createElement("div");
  rewardsBox.className = "stage-rewards-box";

  const rewardHeading = document.createElement("strong");
  rewardHeading.textContent = isMultiRun
    ? `Session Total (${summary.sessionStats.runsCompleted} Runs): +${displayTotalGold.toLocaleString()} Gold | +${displayTotalSt} ST`
    : `Total Rewards: +${summary.totalGold.toLocaleString()} Gold | +${singleRunSt} ST`;
  rewardsBox.appendChild(rewardHeading);

  const rewardsList = document.createElement("ul");
  rewardsList.className = "stage-rewards-list";

  function createRewardItem(text) {
    const li = document.createElement("li");
    li.textContent = text;
    return li;
  }

  rewardsList.appendChild(
    createRewardItem(
      `👾 Enemy Defeat Gold: +${summary.enemyGold.toLocaleString()}`,
    ),
  );
  rewardsList.appendChild(
    createRewardItem(
      `🌊 Wave Clear Gold: +${summary.waveGold.toLocaleString()}`,
    ),
  );
  rewardsList.appendChild(
    createRewardItem(
      `🏆 Stage Clear Bonus Gold: +${summary.clearGold.toLocaleString()}`,
    ),
  );
  rewardsList.appendChild(
    createRewardItem(`⭐ Stage Clear Bonus ST: +${summary.stEarned}`),
  );

  rewardsList.appendChild(
    createRewardItem(`🎲 Wave Drop ST: +${summary.waveStEarned || 0}`),
  );

  const displayTickets = isMultiRun
    ? summary.sessionStats.ticketsEarned
    : summary.earnedTicket
      ? 1
      : 0;
  if (displayTickets > 0) {
    const ticketText = createRewardItem(
      `🎟️ Earned ${displayTickets} Challenge Ticket${displayTickets > 1 ? "s" : ""}!`,
    );
    ticketText.className = "bonus-text";
    rewardsList.appendChild(ticketText);
  }

  if (summary.isFirstClear) {
    const bonus = createRewardItem("✨ First Clear Bonus Awarded!");
    bonus.className = "bonus-text";
    rewardsList.appendChild(bonus);
  }

  if (summary.unlockedStageId) {
    const unlock = createRewardItem(
      `🔓 Unlocked Stage ${summary.unlockedStageId}`,
    );
    unlock.className = "unlock-text";
    rewardsList.appendChild(unlock);
  }

  rewardsBox.appendChild(rewardsList);

  // Safe tower stats resolution with fallback
  const sessionStatsList =
    summary.sessionStats && summary.sessionStats.towerStatsMap
      ? Object.values(summary.sessionStats.towerStatsMap)
      : [];

  const displayTowerStats =
    (autoRepeatEnabled || isMultiRun) && sessionStatsList.length > 0
      ? sessionStatsList
      : summary.towerStats && summary.towerStats.length > 0
        ? summary.towerStats
        : [];

  if (displayTowerStats.length > 0) {
    const details = document.createElement("details");
    details.className = "tower-stats-details";

    // Restore open state if user previously expanded it
    if (isTowerStatsExpanded) {
      details.open = true;
    }

    const detailsSummary = document.createElement("summary");
    detailsSummary.textContent = isMultiRun
      ? "📊 View Session Tower Performance & XP"
      : "📊 View Tower Performance & XP";

    detailsSummary.addEventListener("click", () => {
      isTowerStatsExpanded = !details.open;
    });

    details.appendChild(detailsSummary);

    const statsList = document.createElement("div");
    statsList.className = "tower-stats-list";

    // Track user scrolling in real time
    statsList.addEventListener("scroll", () => {
      savedTowerStatsScrollTop = statsList.scrollTop;
    });

    for (const stat of displayTowerStats) {
      const card = document.createElement("div");
      card.className = "tower-stat-card";

      const header = document.createElement("div");
      header.className = "tower-stat-header";
      header.innerHTML = `<strong>${stat.name}</strong> <span>Lvl ${stat.level}</span>`;

      // Damage is formatted; XP remains exact unformatted integer
      const formattedDamage = formatGameNumber(stat.damageDealt || 0);
      const exactXp = (stat.xpGained || 0).toLocaleString();

      const metrics = document.createElement("div");
      metrics.className = "tower-stat-metrics";
      metrics.innerHTML = `
        <span>XP Gained: <strong>+${exactXp}</strong></span>
        <span>Damage: <strong>${formattedDamage}</strong></span>
        <span>Kills: <strong>${stat.kills || 0}</strong></span>
      `;

      card.append(header, metrics);
      statsList.appendChild(card);
    }

    details.appendChild(statsList);
    popup.append(title, subtitle, rewardsBox, details);

    // Re-apply previous scroll offset right after layout completion
    requestAnimationFrame(() => {
      statsList.scrollTop = savedTowerStatsScrollTop;
    });
  } else {
    popup.append(title, subtitle, rewardsBox);
  }

  const footer = document.createElement("div");
  footer.className = "stage-clear-footer";

  const dontShowLabel = document.createElement("label");
  dontShowLabel.className = "dont-show-again-label";

  const dontShowCheckbox = document.createElement("input");
  dontShowCheckbox.type = "checkbox";

  dontShowLabel.append(dontShowCheckbox, " Don't show again");

  const continueBtn = document.createElement("button");
  continueBtn.type = "button";
  continueBtn.className = "stage-clear-continue-btn";
  continueBtn.textContent = "Continue";

  const closeHandler = () => {
    if (dontShowCheckbox.checked) {
      setShowClearPopup(false);
    }
    overlay.remove();
  };

  continueBtn.addEventListener("click", closeHandler);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeHandler();
  });

  footer.append(dontShowLabel, continueBtn);
  popup.appendChild(footer);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

function handleStageDefeat() {
  const stage = getSelectedStage();
  addLog(`Defeated on Stage ${stage.id}. Stage progress was not saved.`);

  if (battleLoop !== null) {
    clearInterval(battleLoop);
    battleLoop = null;
  }
  fastForward = false;

  wave = 0;
  baseHealth = maxBaseHealth;
  stageEntered = false;
  startWaveAvailable = false;

  enemyStatus.textContent = `Defeated on Stage ${stage.id}. You can retry when ready.`;

  saveCampaignProgress();
  updateUI();
  renderStageSelect();
  renderDeployment();
}

/* ==========================================================================
   9. GAME OPTIONS & SETTINGS TOGGLES
   ========================================================================== */

function setUnpinTopBar(enabled) {
  unpinTopBar = Boolean(enabled);
  const checkbox = document.getElementById("toggle-unpin-topbar-checkbox");
  if (checkbox && checkbox.checked !== unpinTopBar) {
    checkbox.checked = unpinTopBar;
  }
  document.body.classList.toggle("topbar-unpinned", unpinTopBar);
  saveCampaignProgress();
}

function setHideMaxedTech(enabled) {
  hideMaxedTech = Boolean(enabled);
  const checkbox = document.getElementById("toggle-hide-maxed-tech-checkbox");
  if (checkbox && checkbox.checked !== hideMaxedTech) {
    checkbox.checked = hideMaxedTech;
  }
  saveCampaignProgress();
  if (typeof renderTechTree === "function") {
    renderTechTree();
  }
}

function setShowClearPopup(enabled) {
  showClearPopup = Boolean(enabled);
  const checkbox = document.getElementById("toggle-clear-popup-checkbox");
  if (checkbox && checkbox.checked !== showClearPopup) {
    checkbox.checked = showClearPopup;
  }
  saveCampaignProgress();
}

function setSimplifyBattleLog(enabled) {
  simplifyBattleLog = Boolean(enabled);
  const checkbox = document.getElementById("toggle-simplified-log-checkbox");
  if (checkbox && checkbox.checked !== simplifyBattleLog) {
    checkbox.checked = simplifyBattleLog;
  }
  saveCampaignProgress();
}

function setShowBacklineCooldown(enabled) {
  showBacklineCooldown = Boolean(enabled);
  const checkbox = document.getElementById("toggle-backline-cooldown-checkbox");
  if (checkbox && checkbox.checked !== showBacklineCooldown) {
    checkbox.checked = showBacklineCooldown;
  }
  renderDeployment();
  saveCampaignProgress();
}

function setSwapDeploymentLayout(enabled) {
  swapDeploymentLayout = Boolean(enabled);
  const checkbox = document.getElementById("toggle-swap-layout-checkbox");
  if (checkbox && checkbox.checked !== swapDeploymentLayout) {
    checkbox.checked = swapDeploymentLayout;
  }
  renderDeployment();
  saveCampaignProgress();
}

function setShowMoreStats(enabled) {
  showMoreStats = Boolean(enabled);
  const cb = document.getElementById("toggle-show-more-stats-checkbox");
  if (cb && cb.checked !== showMoreStats) cb.checked = showMoreStats;
  saveCampaignProgress();
}

function setShowTechBonus(enabled) {
  showTechBonus = Boolean(enabled);
  const cb = document.getElementById("toggle-show-tech-bonus-checkbox");
  if (cb && cb.checked !== showTechBonus) cb.checked = showTechBonus;
  saveCampaignProgress();
}

function setBuildAnimationMode(mode) {
  if (!["full", "short", "off"].includes(mode)) return;
  buildAnimationMode = mode;
  syncOptionCheckboxes();
  saveCampaignProgress();
}

function openOptionsMenu() {
  if (!optionsModalOverlay) return;
  syncOptionCheckboxes();
  optionsModalOverlay.classList.remove("hidden");
  optionsModalOverlay.style.display = "flex";
}

function closeOptionsMenu() {
  if (!optionsModalOverlay) return;
  optionsModalOverlay.classList.add("hidden");
  optionsModalOverlay.style.display = "none";
}

/* ==========================================================================
   10. MAIN UI UPDATES & EVENT LISTENERS
   ========================================================================== */

function openPoolInfoModal(category = "Main") {
  document.getElementById("pool-modal-overlay")?.remove();

  const pool = getAvailableUnitPool(category); //
  const weightTable =
    category === "Rear" ? REAR_RARITY_WEIGHTS : MAIN_RARITY_WEIGHTS;
  const isFocusUnlocked =
    typeof getTechNodeLevel === "function" &&
    getTechNodeLevel("eco_focus_pool") >= 1; //

  const activeFocusedKey =
    category === "Rear" ? focusedRearTowerKey : focusedMainTowerKey; //

  // 1. Identify present rarities and calculate total tier weight
  const presentRarities = [
    ...new Set(pool.map((k) => unitTypes[k]?.rarity || "Common")),
  ];
  let totalTierWeight = 0;
  for (const r of presentRarities) {
    totalTierWeight += weightTable[r] ?? 10;
  }

  // 2. Build grouped data with tier-first math
  const rarityGroups = {};

  for (const rarity of presentRarities) {
    const tierWeight = weightTable[rarity] ?? 10;
    const tierChance = (tierWeight / totalTierWeight) * 100;
    const matchingKeys = pool.filter(
      (k) => (unitTypes[k]?.rarity || "Common") === rarity,
    );

    // Calculate sub-weights for towers within this specific tier (handles blueprint focus)
    let totalSubWeight = 0;
    const towerWeights = matchingKeys.map((typeKey) => {
      const isFocused = isFocusUnlocked && typeKey === activeFocusedKey;
      const subWeight = isFocused ? FOCUS_TOWER_MULTIPLIER || 3 : 1;
      totalSubWeight += subWeight;
      return { typeKey, subWeight, isFocused };
    });

    const towers = towerWeights.map(({ typeKey, subWeight, isFocused }) => {
      const data = unitTypes[typeKey];
      const individualChance = (
        tierChance *
        (subWeight / totalSubWeight)
      ).toFixed(1);
      return {
        ...data,
        typeKey,
        chance: individualChance,
        isFocused,
      };
    });

    rarityGroups[rarity] = {
      groupChance: tierChance.toFixed(1),
      towers,
    };
  }

  // 3. Render Modal UI
  const overlay = document.createElement("div");
  overlay.id = "pool-modal-overlay";
  overlay.className = "pool-modal-overlay";

  const modal = document.createElement("div");
  modal.className = "pool-modal";

  const header = document.createElement("div");
  header.className = "pool-modal-header";

  const title = document.createElement("h3");
  title.textContent = `${category} Tower Build Pool`;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "pool-modal-close";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => overlay.remove());

  header.append(title, closeBtn);
  modal.appendChild(header);

  const container = document.createElement("div");
  container.className = "pool-group-container";

  for (const rarity of rarityOrder) {
    if (!rarityGroups[rarity]) continue;

    const group = rarityGroups[rarity];
    const section = document.createElement("div");
    section.className = "rarity-section";

    const sectionTitle = document.createElement("h4");
    sectionTitle.className = `rarity-title ${rarity.toLowerCase()}`;
    sectionTitle.textContent = `${rarity} — ${group.groupChance}%`;

    const list = document.createElement("ul");
    list.className = "pool-list";

    for (const tower of group.towers) {
      const item = document.createElement("li");
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.style.marginBottom = "4px";

      const textSpan = document.createElement("span");
      if (tower.isFocused) {
        textSpan.innerHTML = `<strong style="color: #f59e0b;">⭐ ${tower.name}</strong> <span style="color:#f59e0b">(${tower.chance}%)</span>`;
      } else {
        textSpan.innerHTML = `<strong>${tower.name}</strong> (${tower.chance}%)`;
      }
      item.appendChild(textSpan);

      if (isFocusUnlocked) {
        const focusBtn = document.createElement("button");
        focusBtn.textContent = tower.isFocused ? "Unfocus" : "Focus";
        focusBtn.style.padding = "2px 8px";
        focusBtn.style.fontSize = "0.75rem";
        focusBtn.style.marginLeft = "12px";
        focusBtn.style.cursor = "pointer";

        if (tower.isFocused) {
          focusBtn.style.borderColor = "#f59e0b";
          focusBtn.style.color = "#f59e0b";
          focusBtn.style.background = "#451a03";
        }

        focusBtn.addEventListener("click", () => {
          if (category === "Rear") {
            focusedRearTowerKey = tower.isFocused ? null : tower.typeKey;
          } else {
            focusedMainTowerKey = tower.isFocused ? null : tower.typeKey;
          }
          saveCampaignProgress();
          openPoolInfoModal(category);
        });

        item.appendChild(focusBtn);
      }

      list.appendChild(item);
    }

    section.append(sectionTitle, list);
    container.appendChild(section);
  }

  modal.appendChild(container);
  overlay.appendChild(modal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

function renderShopPoolInfo() {
  const container = document.getElementById("shop-pool-info");
  if (!container || !shopPoolExpanded) return;

  let html = `<div class="pool-info-wrapper">`;

  for (const cat of ["Main", "Rear"]) {
    const pool = getAvailableUnitPool(cat);
    const weightTable =
      cat === "Rear" ? REAR_RARITY_WEIGHTS : MAIN_RARITY_WEIGHTS;

    let totalWeight = 0;
    for (const typeKey of pool) {
      const rarity = unitTypes[typeKey]?.rarity || "Common";
      totalWeight += weightTable[rarity] ?? 10;
    }

    html += `<div class="pool-category-column"><strong>${cat} Tower Pool:</strong><ul class="pool-list">`;

    for (const typeKey of pool) {
      const data = unitTypes[typeKey];
      if (data) {
        const weight = weightTable[data.rarity] ?? 10;
        const dropChance = ((weight / totalWeight) * 100).toFixed(1);
        html += `<li><span class="rarity-tag ${(data.rarity || "common").toLowerCase()}">${data.name}</span> (${dropChance}% - ${data.rarity})</li>`;
      }
    }

    html += `</ul></div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

function updateUI() {
  const stage = getSelectedStage();

  if (stDisplay) stDisplay.textContent = st;
  if (goldDisplay) goldDisplay.textContent = gold;
  if (baseHealthDisplay)
    baseHealthDisplay.textContent = `${baseHealth} / ${maxBaseHealth}`;
  if (waveDisplay) waveDisplay.textContent = `${selectedStageId}`;

  const extraMainSlots =
    typeof getTechExtraMainSlots === "function" ? getTechExtraMainSlots() : 0;
  const totalMaxSlots = maxDeployedUnits + extraMainSlots + maxBaseSlots;
  const totalDeployed = getDeployedCount() + getDeployedBaseCount();
  if (activeSlotsDisplay)
    activeSlotsDisplay.textContent = `${totalDeployed} / ${totalMaxSlots}`;

  if (typeof renderTechTree === "function") {
    renderTechTree();
  }

  if (damageLevelDisplay) {
    const deployed = [...deployedUnits, ...deployedBaseUnits].filter(
      (u) => u !== null,
    );
    if (deployed.length > 0) {
      damageLevelDisplay.textContent = Math.max(
        ...deployed.map((u) => u.level),
      );
    } else {
      const all = [...inventory, ...deployedUnits, ...deployedBaseUnits].filter(
        (u) => u !== null,
      );
      damageLevelDisplay.textContent =
        all.length > 0 ? Math.max(...all.map((u) => u.level)) : 1;
    }
  }

  if (baseHealthDisplay) {
    baseHealthDisplay.classList.toggle("critical", baseHealth <= 25);
  }

  if (startWaveButton) {
    if (wave >= stage.waves.length && !isBattleRunning()) {
      startWaveButton.textContent = `Wave ${stage.waves.length}/${stage.waves.length} Completed`;
      startWaveButton.disabled = true;
    } else if (isBattleRunning()) {
      startWaveButton.textContent = `Running ${wave}/${stage.waves.length}`;
      startWaveButton.disabled = true;
    } else if (!startWaveAvailable) {
      startWaveButton.textContent = "Start Wave";
      startWaveButton.disabled = true;
    } else {
      startWaveButton.textContent = `Start Wave ${wave + 1}/${stage.waves.length}`;
      startWaveButton.disabled = false;
    }
  }

  if (buyUnitButton) {
    buyUnitButton.disabled =
      isBattleRunning() || gold < unitCost || st < stPullCost;
  }

  if (buyUnit10xButton) {
    buyUnit10xButton.disabled =
      isBattleRunning() || gold < unitCost * 10 || st < stPullCost * 10;
  }

  if (buyRearUnitButton) {
    const rearUnlocked =
      typeof isRearBuildUnlocked === "function"
        ? isRearBuildUnlocked()
        : typeof getTechNodeLevel === "function"
          ? getTechNodeLevel("eco_base_build") >= 1
          : true;

    if (!rearUnlocked) {
      buyRearUnitButton.disabled = true;
      buyRearUnitButton.textContent = "Build Rear Tower (Locked: Tech Tree)";
    } else {
      buyRearUnitButton.disabled =
        isBattleRunning() || gold < rearUnitCost || st < rearStPullCost;
      buyRearUnitButton.textContent = "Build Rear Tower (100 Gold + 10 ST)";
    }

    if (buyRearUnit10xButton) {
      buyRearUnit10xButton.disabled =
        !rearUnlocked ||
        isBattleRunning() ||
        gold < rearUnitCost * 10 ||
        st < rearStPullCost * 10;
    }
  }

  if (typeof updateSpeedDropdownLock === "function") {
    updateSpeedDropdownLock();
  }

  if (typeof renderShopPoolInfo === "function") {
    renderShopPoolInfo();
  }

  if (typeof renderStageSelect === "function" && !isBattleRunning()) {
    renderStageSelect();
  }

  if (typeof renderAutoWaveControl === "function") {
    renderAutoWaveControl();
  }
}

// Event Listeners Setup
buyUnitButton?.addEventListener("click", () => buyRandomUnit("Main"));
buyUnit10xButton?.addEventListener("click", () => buyRandomUnit("Main", 10));
buyRearUnitButton?.addEventListener("click", () => buyRandomUnit("Rear"));
buyRearUnit10xButton?.addEventListener("click", () =>
  buyRandomUnit("Rear", 10),
);
startWaveButton?.addEventListener("click", startWave);

resetStorageButton?.addEventListener("click", () => {
  const confirmed = confirm(
    `Are you sure you want to reset Save Slot ${currentSaveSlot}? All progress in this slot will be lost.`,
  );
  if (!confirmed) return;
  localStorage.removeItem(getSaveKey(currentSaveSlot));
  location.reload();
});

saveMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const isHidden = saveMenu?.classList.contains("hidden");
  closeSaveLoadMenus();
  if (isHidden) saveMenu?.classList.remove("hidden");
});

loadMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (stageEntered || isBattleRunning()) {
    addLog("Cannot switch save slots while inside a world.");
    return;
  }
  const isHidden = loadMenu?.classList.contains("hidden");
  closeSaveLoadMenus();
  if (isHidden) loadMenu?.classList.remove("hidden");
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".slot-dropdown-container")) {
    closeSaveLoadMenus();
  }
});

// Inventory Toggle Listeners
const inventoryPanel = document.querySelector(".inventory-panel");
if (toggleInventoryButton && inventoryPanel) {
  toggleInventoryButton.textContent = "→";
  toggleInventoryButton.addEventListener("click", () => {
    const isExpanded = inventoryPanel.classList.toggle("expanded");
    document.body.classList.toggle("no-scroll", isExpanded);
    toggleInventoryButton.textContent = isExpanded ? "Collapse" : "→";
    renderInventory();
  });
}

inventoryTitleBtn?.addEventListener("click", () => {
  currentInventoryTab =
    currentInventoryTab === "inventory" ? "warehouse" : "inventory";
  inventoryTitleBtn.textContent =
    currentInventoryTab === "inventory" ? "Inventory ⇄" : "Warehouse ⇄";

  if (inventoryFilterButton)
    inventoryFilterButton.disabled = currentInventoryTab === "warehouse";
  if (inventorySortSelect)
    inventorySortSelect.disabled = currentInventoryTab === "warehouse";
  if (inventorySortOrderButton)
    inventorySortOrderButton.disabled = currentInventoryTab === "warehouse";

  saveCampaignProgress();
  renderInventory();
});

inventoryFilterButton?.addEventListener("click", () => {
  if (inventoryFilter === "all") inventoryFilter = "Main";
  else if (inventoryFilter === "Main") inventoryFilter = "Rear";
  else inventoryFilter = "all";

  inventoryFilterButton.textContent = `Filter: ${inventoryFilter}`;
  saveCampaignProgress();
  renderInventory();
});

inventorySortSelect?.addEventListener("change", (e) => {
  inventorySort = e.target.value;
  saveCampaignProgress();
  renderInventory();
});

inventorySortOrderButton?.addEventListener("click", () => {
  inventorySortAsc = !inventorySortAsc;
  inventorySortOrderButton.textContent = inventorySortAsc ? "▲" : "▼";
  saveCampaignProgress();
  renderInventory();
});

document
  .getElementById("campaign-mode-tab-btn")
  ?.addEventListener("click", () => {
    if (stageEntered || isBattleRunning()) return;
    currentCampaignTabMode = "campaign";
    document.getElementById("campaign-mode-tab-btn")?.classList.add("active");
    document
      .getElementById("challenge-mode-tab-btn")
      ?.classList.remove("active");

    // Jump to the page of the selected Campaign stage
    const selected = stages.find((s) => s.id === selectedStageId);
    if (selected) {
      currentStagePage = Math.floor(selected.index / stagesPerPage);
    }

    renderStageSelect();
  });

document
  .getElementById("challenge-mode-tab-btn")
  ?.addEventListener("click", () => {
    if (stageEntered || isBattleRunning()) return;
    currentCampaignTabMode = "challenge";
    document.getElementById("challenge-mode-tab-btn")?.classList.add("active");
    document
      .getElementById("campaign-mode-tab-btn")
      ?.classList.remove("active");

    // Jump to the page of the selected Challenge stage
    const selected = challengeStages.find(
      (s) => s.id === selectedChallengeStageId,
    );
    if (selected) {
      currentStagePage = Math.floor(selected.index / stagesPerPage);
    }

    renderStageSelect();
  });

// Tech Tree Panel Listeners
if (toggleTechTreeBtn && techTreePanel) {
  toggleTechTreeBtn.textContent = "→";
  toggleTechTreeBtn.addEventListener("click", () => {
    const isExpanded = techTreePanel.classList.toggle("expanded");
    document.body.classList.toggle("no-scroll", isExpanded);
    toggleTechTreeBtn.textContent = isExpanded ? "Collapse" : "→";
    if (typeof renderTechTree === "function") renderTechTree();
  });
}

document
  .getElementById("toggle-presets-btn")
  ?.addEventListener("click", togglePresets);

// Options Modal Listeners
document
  .getElementById("toggle-clear-popup-checkbox")
  ?.addEventListener("change", (e) => {
    setShowClearPopup(e.target.checked);
  });

document
  .getElementById("toggle-backline-cooldown-checkbox")
  ?.addEventListener("change", (e) => {
    setShowBacklineCooldown(e.target.checked);
  });

document
  .getElementById("toggle-swap-layout-checkbox")
  ?.addEventListener("change", (e) => {
    setSwapDeploymentLayout(e.target.checked);
  });

document
  .getElementById("toggle-frontline-cooldown-checkbox")
  ?.addEventListener("change", (e) => {
    setShowFrontlineCooldown(e.target.checked);
  });
document
  .querySelectorAll("#build-anim-segmented .segmented-btn")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      setBuildAnimationMode(btn.dataset.buildAnim);
    });
  });

optionsMenuBtn?.addEventListener("click", openOptionsMenu);
closeOptionsBtn?.addEventListener("click", closeOptionsMenu);
saveOptionsBtn?.addEventListener("click", closeOptionsMenu);

optionsModalOverlay?.addEventListener("click", (e) => {
  if (e.target.id === "options-modal-overlay") {
    closeOptionsMenu();
  }
});

document
  .getElementById("toggle-shop-pool-btn")
  ?.addEventListener("click", toggleShopPoolInfo);

document
  .getElementById("main-pool-info-btn")
  ?.addEventListener("click", () => openPoolInfoModal("Main"));

document
  .getElementById("rear-pool-info-btn")
  ?.addEventListener("click", () => openPoolInfoModal("Rear"));

document
  .getElementById("toggle-simplified-log-checkbox")
  ?.addEventListener("change", (e) => {
    setSimplifyBattleLog(e.target.checked);
  });

document
  .getElementById("toggle-hide-maxed-tech-checkbox")
  ?.addEventListener("change", (e) => {
    setHideMaxedTech(e.target.checked);
  });

document
  .getElementById("toggle-unpin-topbar-checkbox")
  ?.addEventListener("change", (e) => {
    setUnpinTopBar(e.target.checked);
  });

document
  .getElementById("toggle-show-more-stats-checkbox")
  ?.addEventListener("change", (e) => setShowMoreStats(e.target.checked));

document
  .getElementById("toggle-show-tech-bonus-checkbox")
  ?.addEventListener("change", (e) => setShowTechBonus(e.target.checked));

document
  .getElementById("toggle-show-effective-damage-checkbox")
  ?.addEventListener("change", (e) => setShowEffectiveDamage(e.target.checked));

document.addEventListener("DOMContentLoaded", () => {
  const treeBtn = document.getElementById("tech-tree-tab-btn");
  const bonusBtn = document.getElementById("challenge-bonus-tab-btn");

  if (treeBtn && bonusBtn) {
    treeBtn.addEventListener("click", () => {
      currentTechPanelTab = "techTree";
      treeBtn.classList.add("active");
      bonusBtn.classList.remove("active");
      renderTechTree();
    });

    bonusBtn.addEventListener("click", () => {
      currentTechPanelTab = "challengeBonus";
      bonusBtn.classList.add("active");
      treeBtn.classList.remove("active");
      renderTechTree();
    });
  }
});

startWaveButton?.addEventListener("click", () => {
  cancelAutoRepeat();
  startWave();
});

/* ==========================================================================
   11. INITIALIZATION & EXPORTS
   ========================================================================== */

function initializeGame() {
  currentSaveSlot = getStoredActiveSlot();
  updateSaveSlotDisplay();

  loadCampaignProgress(currentSaveSlot);

  updateUI();
  renderInventory();
  renderDeployment();
  renderStageSelect();

  if (typeof renderTechTree === "function") {
    renderTechTree();
  }

  addLog(`Welcome back, Commander. (Active Slot: ${currentSaveSlot})`);
}

// Start Game Engine
initializeGame();

window.handleSaveToSlot = handleSaveToSlot;
window.handleLoadFromSlot = handleLoadFromSlot;
