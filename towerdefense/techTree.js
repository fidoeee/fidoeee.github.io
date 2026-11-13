/* ==========================================================================
   TECH TREE SYSTEM
   ========================================================================== */

let techUpgrades = {};

let challengeBonusUpgrades = {};

const challengeBonusNodes = {
  cb_base_damage: {
    id: "cb_base_damage",
    name: "Flat Base Damage",
    costPerLevel: (lvl) => 1 + Math.floor(lvl / 2),
    getBonus: (lvl) => lvl * 0.5,
    getDescription: (lvl) =>
      `All towers +${(lvl * 0.5).toFixed(1)} base damage.`,
  },
  cb_reload_speed: {
    id: "cb_reload_speed",
    name: "Flat Fire Rate",
    costPerLevel: (lvl) => 1 + Math.floor(lvl / 2),
    getBonus: (lvl) => lvl * 0.1,
    getDescription: (lvl) => `All towers +${(lvl * 0.1).toFixed(2)} fire rate.`,
  },
};

const techNodes = {
  // --- CORE OFFENSE BRANCH ---
  offense_dmg: {
    id: "offense_dmg",
    name: "Caliber Refinement",
    category: "Main",
    costBase: 300,
    costMultiplier: 3,
    maxLevel: 5,
    requiresNode: null,
    getBonus: (lvl) => lvl * 0.05,
    getDescription: (lvl) => {
      if (lvl >= 5) return "Main towers +25% damage (Maxed)";
      const nextLvl = lvl + 1;
      const total = nextLvl * 5;
      return `Main towers +${total}% damage (+5%)`;
    },
  },
  offense_speed: {
    id: "offense_speed",
    name: "Rapid Cycling",
    category: "Main",
    costBase: 500,
    costMultiplier: 4.0,
    costMultiplier1: 2.5,
    costMultiplier2: 1.8,
    costMultLevel1: 2, // Switches after Upgrades 0, 1
    costMultLevel2: 3, // Switches after Upgrade 2
    maxLevel: 5,
    requiresNode: "offense_dmg",
    getBonus: (lvl) => lvl * 0.03,
    getDescription: (lvl) => {
      if (lvl >= 5) return "Main towers +15% firerate (Maxed)";
      const nextLvl = lvl + 1;
      const total = nextLvl * 3;
      return `Main towers +${total}% firerate (+3%)`;
    },
  },
  offense_range: {
    id: "offense_range",
    name: "Precision Optics",
    category: "Main",
    costBase: 5000,
    costMultiplier: 1.0,
    maxLevel: 1,
    requiresNode: "offense_speed",
    getBonus: (lvl) => lvl,
    getDescription: (lvl) => {
      if (lvl >= 1) return "Main towers +1 range (Maxed)";
      return "Main towers +1 range (+1)";
    },
  },

  // --- CORE ARTILLERY BRANCH ---
  artillery_dmg: {
    id: "artillery_dmg",
    name: "High Explosive Ordnance",
    category: "Rear",
    costBase: 500,
    costMultiplier: 3,
    maxLevel: 5,
    requiresNode: null,
    getBonus: (lvl) => lvl * 0.1,
    getDescription: (lvl) => {
      if (lvl >= 5) return "Base towers +50% damage (Maxed)";
      const nextLvl = lvl + 1;
      const total = nextLvl * 10;
      return `Base towers +${total}% damage (+10%)`;
    },
  },
  artillery_cooldown: {
    id: "artillery_cooldown",
    name: "Pre-charged Chambers",
    category: "Rear",
    costBase: 1000,
    costMultiplier: 3.5,
    costMultiplier1: 2.0,
    costMultiplier2: 1.8,
    costMultLevel1: 2,
    costMultLevel2: 3,
    maxLevel: 5,
    requiresNode: "artillery_dmg",
    getBonus: (lvl) => lvl * 0.15,
    getDescription: (lvl) => {
      if (lvl >= 5) return "Base towers -75% initial load time (Maxed)";
      const nextLvl = lvl + 1;
      const total = nextLvl * 15;
      return `Base towers -${total}% initial load time (-15%)`;
    },
  },

  // --- CORE ECONOMY BRANCH ---
  eco_gold: {
    id: "eco_gold",
    name: "Scavenger Crew",
    category: "Eco",
    costBase: 400,
    costMultiplier: 3,
    maxLevel: 5,
    requiresNode: null,
    getBonus: (lvl) => lvl * 0.1,
    getDescription: (lvl) => {
      if (lvl >= 5) return "+50% gold rewards (Maxed)";
      const nextLvl = lvl + 1;
      const total = nextLvl * 10;
      return `+${total}% gold rewards (+10%)`;
    },
  },
 eco_discount: {
    id: "eco_discount",
    name: "Modular Upgrades",
    category: "Eco",
    costBase: 800,
    costMultiplier: 3.0,
    costMultiplier1: 2.0,
    costMultLevel1: 3,
    maxLevel: 5,
    requiresNode: "eco_gold",
    getBonus: (lvl) => {
      const techLvl = Math.min(5, Math.max(0, lvl));
      const base = 3.5 - techLvl * 0.136;
      return Number(Math.max(2.82, base).toFixed(2));
    },
    getDescription: (lvl) => {
      const techLvl = Math.min(5, Math.max(0, lvl));
      const getBaseAt = (l) => Number(Math.max(2.82, 3.5 - l * 0.136).toFixed(2));
      const currentBase = getBaseAt(techLvl);
      if (techLvl >= 5)
        return `Merge cost scaling: ${currentBase.toFixed(2)}^x (Maxed)`;
      const nextBase = getBaseAt(techLvl + 1);
      return `Current: ${currentBase.toFixed(2)}^x → Next: ${nextBase.toFixed(2)}^x`;
    },
  },

  // --- QUALITY OF LIFE (QoL) ---
  eco_speed: {
    id: "eco_speed",
    name: "Tactical Overclock",
    category: "QoL",
    costBase: 300,
    costMultiplier: 1.2,
    maxLevel: 4,
    requiresStage: "1-5",
    getBonus: (lvl) => lvl,
    getDescription: (lvl) => {
      if (lvl >= 4) return "2x, 4x, 8x, 16x Unlocked (MAX)";
      if (lvl === 3) return "8x speed option";
      if (lvl === 2) return "4x speed option";
      return "2x speed option";
    },
  },
  eco_auto_wave: {
    id: "eco_auto_wave",
    name: "Auto-Start Wave",
    category: "QoL",
    costBase: 2000,
    costMultiplier: 1.0,
    maxLevel: 1,
    requiresNode: "eco_speed",
    requiresStage: "3-10",
    getBonus: (lvl) => lvl,
    getDescription: (lvl) =>
      lvl >= 1 ? "Auto-start wave unlocked (Maxed)" : "Unlocks Auto-Start Wave",
  },
  eco_auto_repeat: {
    id: "eco_auto_repeat",
    name: "World Auto-Repeat",
    category: "QoL",
    costBase: 3000,
    costMultiplier: 1.0,
    maxLevel: 1,
    requiresNode: "eco_auto_wave",
    requiresStage: "3-10",
    getBonus: (lvl) => lvl,
    getDescription: (lvl) =>
      lvl >= 1
        ? "Auto-repeats world unlocked (Maxed)"
        : "Unlocks Auto-Repeat World",
  },

  // --- BUILD POOLS ---
  eco_base_build: {
    id: "eco_base_build",
    name: "Base Defense Protocol",
    category: "Build",
    costBase: 100,
    costMultiplier: 1.0,
    maxLevel: 1,
    requiresStage: "1-4",
    getBonus: (lvl) => lvl,
    getDescription: (lvl) => {
      if (lvl >= 1) return "Unlocks Rear Base Tower purchases (MAX)";
      return "Unlocks Rear Base Tower purchases";
    },
  },
  eco_pool: {
    id: "eco_pool",
    name: "Advanced Construction",
    category: "Build",
    costBase: 1200,
    costMultiplier: 2.0,
    maxLevel: 5,
    requiresNode: "eco_base_build",
    requiresStage: ["1-10", "2-10", "3-10", "4-10", "6-10"],
    customCheck: (lvl) => {
      if (lvl === 4) {
        return getLegendaryTowerCount() >= 2;
      }
      return true;
    },
    getBonus: (lvl) => lvl,
    getDescription: (lvl) => {
      if (lvl >= 5) return "Unlocked Tier 5 Mythic arsenal pool (MAX)";
      if (lvl === 4) return "Unlocks Tier 5 Mythic arsenal pool (Stage 6-10 + 2 Legendary Towers)";
      if (lvl === 3) return "Unlocks Tier 4 high-tech arsenal (Stage 4-10)";
      if (lvl === 2) return "Unlocks Tier 3 heavy weapons (Stage 3-10)";
      if (lvl === 1) return "Unlocks Tier 2 specialized turrets (Stage 2-10)";
      return "Unlocks Tier 1 expanded build pool (Stage 1-10)";
    },
  },
  eco_focus_pool: {
    id: "eco_focus_pool",
    name: "Blueprint Focusing",
    category: "Build",
    costBase: 1500,
    costMultiplier: 1.0,
    maxLevel: 1,
    requiresNode: "eco_pool", 
    requiresStage: "3-1",
    getBonus: (lvl) => lvl,
    getDescription: (lvl) =>
      lvl >= 1 
        ? "Targeted tower focusing unlocked (Maxed)" 
        : "Unlocks tower build focus",
  },

  // --- ADVANCED UNLOCKABLE BRANCH ---
  spec_overclock: {
    id: "spec_overclock",
    name: "Cross-Fire Matrix",
    category: "Special",
    costBase: 5000,
    costMultiplier: 3,
    maxLevel: 3,
    requiresNode: null,
    getBonus: (lvl) => lvl * 0.15,
    getDescription: (lvl) => {
      if (lvl >= 3) return "All towers +45% global damage (Maxed)";
      const nextLvl = lvl + 1;
      const total = nextLvl * 15;
      return `All towers +${total}% global damage (+15%)`;
    },
  },
  spec_extra_slot: {
    id: "spec_extra_slot",
    name: "Extended Frontline",
    category: "Special",
    costBase: 15000,
    costMultiplier: 1.0,
    maxLevel: 1,
    requiresNode: "spec_overclock",
    getBonus: (lvl) => lvl,
    getDescription: (lvl) => {
      if (lvl >= 1) return "+1 main tower deployment slot (Maxed)";
      return "+1 main tower deployment slot (+1)";
    },
  },
  offense_armor_pen: {
    id: "offense_armor_pen",
    name: "Armor Piercing Rounds",
    category: "Main",
    costBase: 1200,
    costMultiplier: 3.0,
    costMultiplier1: 2.5,
    costMultiplier2: 1.5,
    costMultLevel1: 2,
    costMultLevel2: 3,
    maxLevel: 5,
    requiresNode: "offense_speed",
    getBonus: (lvl) => (lvl === 0 ? 0 : 20 * Math.pow(2, lvl - 1)),
    getDescription: (lvl) => {
      if (lvl >= 5) return "Main towers ignore 1,620 flat enemy armor (Maxed)";
      const nextLvl = lvl + 1;
      const nextVal = 20 * Math.pow(2, nextLvl - 1);
      const currVal = lvl === 0 ? 0 : 20 * Math.pow(2, lvl - 1);
      const diff = nextVal - currVal;
      return `Main towers ignore ${nextVal} flat enemy armor (+${diff} armor ignored)`;
    },
  },

  // --- EXP SECTION ---
  exp_boost_mult: {
    id: "exp_boost_mult",
    name: "Accelerated Learning",
    category: "Eco",
    costBase: 500,
    costMultiplier: 2,
    maxLevel: 5,
    requiresNode: null,
    getBonus: (lvl) => lvl * 1.0,
    getDescription: (lvl) => {
      if (lvl >= 5) return "+500% Consume EXP Bonus (Maxed)";
      const nextLvl = lvl + 1;
      const total = nextLvl * 100;
      return `+${total}% Consume EXP Bonus (+100%)`;
    },
  },
  eco_wave_xp: {
    id: "eco_wave_xp",
    name: "Combat Experience",
    category: "Eco",
    costBase: 400,
    costMultiplier: 1.6,
    maxLevel: 10,
    requiresNode: null,
    getBonus: (lvl) => lvl * 0.5,
    getDescription: (lvl) => {
      if (lvl >= 10) return "+500% Wave XP (Maxed)";
      const nextLvl = lvl + 1;
      const total = nextLvl * 50;
      return `+${total}% Wave XP (+50%)`;
    },
  },

  // --- EXTENDED TECH UNLOCK ---
  spec_extended_tech: {
    id: "spec_extended_tech",
    name: "Extended Research Matrix",
    category: "Special",
    costBase: 1,
    costMultiplier: 1.0,
    maxLevel: 1,
    requiresStage: "10-10",
    customCheck: (lvl) => {
      if (typeof techNodes === "undefined" || typeof techUpgrades === "undefined") return true;

      // Verifies that every other tech node in the tree is fully maxed out
      for (const key in techNodes) {
        if (key === "spec_extended_tech") continue;
        const node = techNodes[key];
        const currentLevel = techUpgrades[key] || 0;
        if (currentLevel < node.maxLevel) {
          return false;
        }
      }
      return true;
    },
    getBonus: (lvl) => lvl,
    getDescription: (lvl) =>
      lvl >= 1
        ? "Extended Tech Tree Unlocked (Maxed)"
        : "Unlocks Extended Tech Tree (Requires Stage 10-10 & All Tech Maxed)",
  },
};

const techTreeSections = {
  build: {
    id: "build",
    title: "Build Pools",
    requiresNodes: [],
    nodes: ["eco_base_build", "eco_pool", "eco_focus_pool"],
  },
  qol: {
    id: "qol",
    title: "Quality of Life",
    requiresNodes: [],
    nodes: ["eco_speed", "eco_auto_wave", "eco_auto_repeat"],
  },
  offense: {
    id: "offense",
    title: "Main Offense",
    requiresNodes: [],
    nodes: ["offense_dmg", "offense_speed", "offense_range"],
  },
  artillery: {
    id: "artillery",
    title: "Heavy Artillery",
    requiresNodes: [],
    nodes: ["artillery_dmg", "artillery_cooldown"],
  },
  economy: {
    id: "economy",
    title: "Logistics & Supply",
    requiresNodes: [],
    nodes: ["eco_gold", "eco_discount"],
  },
  exp_tech: {
    id: "exp_tech",
    title: "Experience & Training",
    requiresAnyNode: ["eco_speed", "eco_base_build", "eco_pool"],
    nodes: ["exp_boost_mult", "eco_wave_xp"],
  },
  armor_tech: {
    id: "armor_tech",
    title: "Armor Penetration",
    requiresNodes: ["offense_speed"],
    nodes: ["offense_armor_pen"],
  },
  special_ops: {
    id: "special_ops",
    title: "Special Operations",
    requiresNodes: ["offense_speed", "artillery_cooldown"],
    nodes: ["spec_overclock", "spec_extra_slot"],
  },
  extended_unlock: {
    id: "extended_unlock",
    title: "Extended Research Matrix",
    requiresNodes: [],
    nodes: ["spec_extended_tech"],
  },
};

/* ==========================================================================
   GETTERS & CALCULATIONS
   ========================================================================== */

function getTechNodeLevel(nodeId) {
  return techUpgrades[nodeId] || 0;
}

function getTechNodeCost(nodeId) {
  const node = techNodes[nodeId];
  if (!node) return 0;
  
  // Assumes currentLvl represents the number of upgrades already bought (Level 1 = 0)
  const currentLvl = typeof getTechNodeLevel === "function" ? getTechNodeLevel(nodeId) : 0;
  
  if (node.costMultiplier1 !== undefined || node.costMultiplier2 !== undefined) {
    const level1 = node.costMultLevel1 || 0;
    // If there is no second threshold, set it to Infinity so middleLevels handles everything else
    const level2 = node.costMultLevel2 !== undefined ? node.costMultLevel2 : Infinity;
    
    const earlyLevels = Math.min(currentLvl, level1);
    const middleLevels = Math.min(
      Math.max(currentLvl - level1, 0),
      level2 - level1
    );
    const laterLevels = level2 !== Infinity ? Math.max(currentLvl - level2, 0) : 0;
    
    const mult0 = node.costMultiplier || 1;
    const mult1 = node.costMultiplier1 || mult0;
    const mult2 = node.costMultiplier2 || mult1;
    
    return Math.round(
      node.costBase *
        Math.pow(mult0, earlyLevels) *
        Math.pow(mult1, middleLevels) *
        Math.pow(mult2, laterLevels)
    );
  }
  
  // Fallback for standard exponential nodes
  return Math.round(node.costBase * Math.pow(node.costMultiplier, currentLvl));
}

function isSectionUnlocked(sectionId) {
  const section = techTreeSections[sectionId];
  if (!section) return true;

  if (section.requiresNodes && section.requiresNodes.length > 0) {
    const allMet = section.requiresNodes.every(
      (reqId) => getTechNodeLevel(reqId) >= 1,
    );
    if (!allMet) return false;
  }

  if (section.requiresAnyNode && section.requiresAnyNode.length > 0) {
    const anyMet = section.requiresAnyNode.some(
      (reqId) => getTechNodeLevel(reqId) >= 1,
    );
    if (!anyMet) return false;
  }

  return true;
}

function canUpgradeNode(nodeId) {
  const node = techNodes[nodeId];
  if (!node) return false;

  const currentLvl = getTechNodeLevel(nodeId);
  if (currentLvl >= node.maxLevel) return false;

  if (node.requiresNode && getTechNodeLevel(node.requiresNode) < 1) {
    return false;
  }

  const requiredStage = Array.isArray(node.requiresStage)
    ? node.requiresStage[currentLvl]
    : node.requiresStage;

  if (requiredStage && !clearedStageIds.has(requiredStage)) {
    return false;
  }

  // Check custom requirement (e.g. owning 2 Legendary towers)
  if (typeof node.customCheck === "function" && !node.customCheck(currentLvl)) {
    return false;
  }

  const cost = getTechNodeCost(nodeId);
  return gold >= cost && !isBattleRunning();
}

function getTechMainDamageMultiplier() {
  const bonus = techNodes.offense_dmg
    ? techNodes.offense_dmg.getBonus(getTechNodeLevel("offense_dmg"))
    : 0;
  const specBonus = techNodes.spec_overclock
    ? techNodes.spec_overclock.getBonus(getTechNodeLevel("spec_overclock"))
    : 0;
  return 1 + bonus + specBonus;
}

function getTechWaveExpMultiplier() {
  const bonus = techNodes.eco_wave_xp
    ? techNodes.eco_wave_xp.getBonus(getTechNodeLevel("eco_wave_xp"))
    : 0;
  return 1 + bonus;
}

function getTechArtilleryDamageMultiplier() {
  const bonus = techNodes.artillery_dmg
    ? techNodes.artillery_dmg.getBonus(getTechNodeLevel("artillery_dmg"))
    : 0;
  const specBonus = techNodes.spec_overclock
    ? techNodes.spec_overclock.getBonus(getTechNodeLevel("spec_overclock"))
    : 0;
  return 1 + bonus + specBonus;
}

function getTechMainFireRateMultiplier() {
  const bonus = techNodes.offense_speed
    ? techNodes.offense_speed.getBonus(getTechNodeLevel("offense_speed"))
    : 0;
  return 1 + bonus;
}

function getTechFireRateMultiplier() {
  return getTechMainFireRateMultiplier();
}

function getTechMainRangeBonus() {
  return techNodes.offense_range
    ? techNodes.offense_range.getBonus(getTechNodeLevel("offense_range"))
    : 0;
}

function getTechGoldMultiplier() {
  const bonus = techNodes.eco_gold
    ? techNodes.eco_gold.getBonus(getTechNodeLevel("eco_gold"))
    : 0;
  return 1 + bonus;
}

function getTechMainCostDiscount() {
  return techNodes.eco_discount
    ? techNodes.eco_discount.getBonus(getTechNodeLevel("eco_discount"))
    : 0;
}

function getTechExtraMainSlots() {
  return techNodes.spec_extra_slot
    ? techNodes.spec_extra_slot.getBonus(getTechNodeLevel("spec_extra_slot"))
    : 0;
}

function getMaxUnlockedSpeedMultiplier() {
  const lvl = getTechNodeLevel("eco_speed");
  if (lvl >= 4) return 16;
  if (lvl >= 3) return 8;
  if (lvl >= 2) return 4;
  if (lvl >= 1) return 2;
  return 1;
}

function isRearBuildUnlocked() {
  return getTechNodeLevel("eco_base_build") >= 1;
}

function getTechExpBoostMultiplier() {
  const bonus = techNodes.exp_boost_mult
    ? techNodes.exp_boost_mult.getBonus(getTechNodeLevel("exp_boost_mult"))
    : 0;
  return 1 + bonus;
}

function getConsumeXpBonus(unit, targetUnit = null) {
  const data = getUnitData(unit);
  const baseXp = rarityXpMap[data.rarity] || 50;

  const levelBonus = (unit.level - 1) * 0.5 * baseXp;
  let rawXp = baseXp + levelBonus;

  if (targetUnit && targetUnit.level > 1) {
    const targetLevelMultiplier = 1 + (targetUnit.level - 1) * 0.25;
    rawXp *= targetLevelMultiplier;
  }

  const techMult =
    typeof getTechExpBoostMultiplier === "function"
      ? getTechExpBoostMultiplier()
      : 1;

  return Math.round(rawXp * techMult);
}

function getTechMainArmorPenetration(unit = null) {
  if (unit && unit.category !== "Main") return 0;

  return techNodes.offense_armor_pen
    ? techNodes.offense_armor_pen.getBonus(
        getTechNodeLevel("offense_armor_pen"),
      )
    : 0;
}

function getTechArtilleryInitialChargeBonus() {
  return techNodes.artillery_cooldown
    ? techNodes.artillery_cooldown.getBonus(
        getTechNodeLevel("artillery_cooldown"),
      )
    : 0;
}

function isAutoWaveUnlocked() {
  return getTechNodeLevel("eco_auto_wave") >= 1;
}

function isAutoRepeatUnlocked() {
  return getTechNodeLevel("eco_auto_repeat") >= 1;
}

/* ==========================================================================
   UPGRADE PURCHASING
   ========================================================================== */

function buyTechNode(nodeId) {
  if (!canUpgradeNode(nodeId)) return;

  const cost = getTechNodeCost(nodeId);
  gold -= cost;

  techUpgrades[nodeId] = (techUpgrades[nodeId] || 0) + 1;

  addLog(
    `🔬 Researched ${techNodes[nodeId].name} (Level ${techUpgrades[nodeId]})! (-${cost} Gold)`,
  );

  [
    ...inventory,
    ...deployedUnits.filter(Boolean),
    ...deployedBaseUnits.filter(Boolean),
  ].forEach(recalculateUnitStats);

  saveCampaignProgress();
  updateUI();
  renderDeployment();
  renderTechTree();

  if (typeof renderStageSelect === "function") {
    renderStageSelect();
  }
}

function getChallengeBonusLevel(nodeId) {
  return challengeBonusUpgrades[nodeId] || 0;
}

function getAvailableChallengeTickets() {
  const ticketItem = warehouse.find((item) => item.id === "challenge_ticket");
  return ticketItem ? ticketItem.count : 0;
}

function getChallengeBonusNextCost(nodeId) {
  const node = challengeBonusNodes[nodeId];
  if (!node) return 1;
  const lvl = getChallengeBonusLevel(nodeId);
  return typeof node.costPerLevel === "function"
    ? node.costPerLevel(lvl)
    : node.costPerLevel;
}

function getChallengeBonusSpent(nodeId) {
  const node = challengeBonusNodes[nodeId];
  if (!node) return 0;
  const lvl = getChallengeBonusLevel(nodeId);
  let spent = 0;
  for (let i = 0; i < lvl; i++) {
    spent +=
      typeof node.costPerLevel === "function"
        ? node.costPerLevel(i)
        : node.costPerLevel;
  }
  return spent;
}

function buyChallengeBonus(nodeId) {
  const node = challengeBonusNodes[nodeId];
  if (!node) return;

  const lvl = getChallengeBonusLevel(nodeId);
  const cost = getChallengeBonusNextCost(nodeId);

  let ticketItem = warehouse.find((item) => item.id === "challenge_ticket");
  if (!ticketItem || ticketItem.count < cost) return;

  ticketItem.count -= cost;
  challengeBonusUpgrades[nodeId] = lvl + 1;

  [
    ...inventory,
    ...deployedUnits.filter(Boolean),
    ...deployedBaseUnits.filter(Boolean),
  ].forEach(recalculateUnitStats);

  saveCampaignProgress();
  updateUI();
  renderTechTree();
  renderDeployment(); 
}

function refundChallengeBonus(nodeId) {
  const lvl = getChallengeBonusLevel(nodeId);
  if (lvl <= 0) return;

  const node = challengeBonusNodes[nodeId];

  const refundCost =
    typeof node.costPerLevel === "function"
      ? node.costPerLevel(lvl - 1)
      : node.costPerLevel;

  challengeBonusUpgrades[nodeId] = lvl - 1;

  let ticketItem = warehouse.find((item) => item.id === "challenge_ticket");
  if (ticketItem) {
    ticketItem.count += refundCost;
  } else {
    warehouse.push({
      id: "challenge_ticket",
      name: "Challenge Ticket",
      count: refundCost,
    });
  }

  [
    ...inventory,
    ...deployedUnits.filter(Boolean),
    ...deployedBaseUnits.filter(Boolean),
  ].forEach(recalculateUnitStats);

  saveCampaignProgress();
  updateUI();
  renderTechTree();
  renderDeployment();
}

function respecChallengeBonuses() {
  let totalRefund = 0;

  for (const nodeId of Object.keys(challengeBonusUpgrades)) {
    totalRefund += getChallengeBonusSpent(nodeId);
  }

  if (totalRefund === 0) return;

  let ticketItem = warehouse.find((item) => item.id === "challenge_ticket");
  if (ticketItem) {
    ticketItem.count += totalRefund;
  } else {
    warehouse.push({
      id: "challenge_ticket",
      name: "Challenge Ticket",
      count: totalRefund,
    });
  }

  challengeBonusUpgrades = {};

  [
    ...inventory,
    ...deployedUnits.filter(Boolean),
    ...deployedBaseUnits.filter(Boolean),
  ].forEach(recalculateUnitStats);

  saveCampaignProgress();
  updateUI();
  renderTechTree();
  renderDeployment();
}

/* ==========================================================================
   UI RENDERING
   ========================================================================== */

function renderTechTree() {
  const panel = document.querySelector(".tech-tree-panel");
  const container = document.getElementById("tech-tree-content");
  if (!container || !panel) return;

  if (!panel.classList.contains("expanded")) {
    container.replaceChildren();
    return;
  }

  container.replaceChildren();

  if (currentTechPanelTab === "challengeBonus") {
    renderChallengeBonusTab(container);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "tech-tree-grid";

  for (const [sectionKey, section] of Object.entries(techTreeSections)) {
    // 1. Hide the Extended Research Matrix box completely until all other tech nodes are maxed
    if (sectionKey === "extended_unlock") {
      const allOtherTechMaxed = Object.keys(techNodes).every((key) => {
        if (key === "spec_extended_tech") return true;
        return getTechNodeLevel(key) >= techNodes[key].maxLevel;
      });
      if (!allOtherTechMaxed) continue;
    }

    const unlocked = isSectionUnlocked(sectionKey);

    if (typeof hideMaxedTech !== "undefined" && hideMaxedTech) {
      const hasUnmaxedNodes = section.nodes.some((nodeId) => {
        const node = techNodes[nodeId];
        return node && getTechNodeLevel(nodeId) < node.maxLevel;
      });
      if (!hasUnmaxedNodes) continue;
    }

    const sectionCard = document.createElement("div");
    sectionCard.className = `tech-section ${unlocked ? "" : "locked"} ${section.fullWidth ? "full-width" : ""}`;

    const title = document.createElement("h3");
    title.className = "tech-section-title";
    title.textContent = section.title;

    sectionCard.appendChild(title);

    if (!unlocked) {
      const lockOverlay = document.createElement("div");
      lockOverlay.className = "tech-lock-overlay";

      let reqText = "";
      if (section.requiresNodes && section.requiresNodes.length > 0) {
        reqText =
          "Level 1 in: " +
          section.requiresNodes
            .map((id) => techNodes[id]?.name || id)
            .join(" & ");
      } else if (
        section.requiresAnyNode &&
        section.requiresAnyNode.length > 0
      ) {
        reqText =
          "Level 1 in any: " +
          section.requiresAnyNode
            .map((id) => techNodes[id]?.name || id)
            .join(" or ");
      }

      lockOverlay.innerHTML = `🔒 <strong>Locked</strong><br><small>Requires: ${reqText}</small>`;
      sectionCard.appendChild(lockOverlay);
    }

    const nodeList = document.createElement("div");
    nodeList.className = "tech-node-list";

    for (const nodeId of section.nodes) {
      const node = techNodes[nodeId];
      const level = getTechNodeLevel(nodeId);
      const isMax = level >= node.maxLevel;

      if (typeof hideMaxedTech !== "undefined" && hideMaxedTech && isMax)
        continue;

      const cost = getTechNodeCost(nodeId);
      const reqMet =
        !node.requiresNode || getTechNodeLevel(node.requiresNode) >= 1;

      const requiredStage = Array.isArray(node.requiresStage)
        ? node.requiresStage[level]
        : node.requiresStage;

      const stageMet = !requiredStage || clearedStageIds.has(requiredStage);

      const nodeCard = document.createElement("div");
      nodeCard.className = `tech-node-card ${isMax ? "maxed" : ""}`;

      const name = document.createElement("strong");
      name.textContent = node.name;

      const badge = document.createElement("span");
      badge.className = "tech-node-badge";
      badge.textContent = `${level} / ${node.maxLevel}`;

      const header = document.createElement("div");
      header.className = "tech-node-header";
      header.append(name, badge);

      const desc = document.createElement("p");
      desc.className = "tech-node-desc";
      desc.textContent =
        typeof node.getDescription === "function"
          ? node.getDescription(level)
          : node.description;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tech-upgrade-btn";

      const customMet =
        typeof node.customCheck !== "function" || node.customCheck(level);

      if (isMax) {
        btn.textContent = "MAXED";
        btn.disabled = true;
      } else if (!reqMet) {
        btn.textContent = `Req: ${techNodes[node.requiresNode]?.name}`;
        btn.disabled = true;
      } else if (!stageMet) {
        btn.textContent = `Req: Stage ${requiredStage}`;
        btn.disabled = true;
      } else if (!customMet) {
        // Displays when stage 6-10 is beaten, but player holds fewer than 2 Legendary towers
        btn.textContent = `Req: Own 2 Legendary Towers (${getLegendaryTowerCount()}/2)`;
        btn.disabled = true;
      } else {
        btn.textContent = `Upgrade (${cost} Gold)`;
        btn.disabled = !unlocked || gold < cost || isBattleRunning();
      }

      btn.addEventListener("click", () => buyTechNode(nodeId));

      nodeCard.append(header, desc, btn);
      nodeList.appendChild(nodeCard);
    }

    sectionCard.appendChild(nodeList);
    grid.appendChild(sectionCard);
  }

  container.appendChild(grid);
}

function renderChallengeBonusTab(container) {
  const availableTickets = getAvailableChallengeTickets();

  let totalSpentTickets = 0;
  for (const nodeId of Object.keys(challengeBonusNodes)) {
    totalSpentTickets += getChallengeBonusSpent(nodeId);
  }

  const totalTickets = availableTickets + totalSpentTickets;

  const headerBox = document.createElement("div");
  headerBox.className = "challenge-bonus-header-box";
  headerBox.style.display = "flex";
  headerBox.style.justifyContent = "space-between";
  headerBox.style.alignItems = "center";
  headerBox.style.margin = "8px 0 12px 0";

  const ticketInfo = document.createElement("span");
  ticketInfo.innerHTML = `Available: <strong>🎟️ ${availableTickets}</strong> / Total: <strong>${totalTickets}</strong>`;

  const respecBtn = document.createElement("button");
  respecBtn.type = "button";
  respecBtn.className = "reset-button";
  respecBtn.style.padding = "4px 10px";
  respecBtn.style.fontSize = "0.8rem";
  respecBtn.textContent = "Reset All";
  respecBtn.disabled = totalSpentTickets === 0 || isBattleRunning();
  respecBtn.addEventListener("click", respecChallengeBonuses);

  headerBox.append(ticketInfo, respecBtn);
  container.appendChild(headerBox);

  const grid = document.createElement("div");
  grid.className = "tech-tree-grid";

  for (const [nodeId, node] of Object.entries(challengeBonusNodes)) {
    const level = getChallengeBonusLevel(nodeId);
    const spentOnNode = getChallengeBonusSpent(nodeId);
    const nextCost = getChallengeBonusNextCost(nodeId);

    const barPercent =
      totalTickets > 0 ? Math.min(100, (spentOnNode / totalTickets) * 100) : 0;

    const nodeCard = document.createElement("div");
    nodeCard.className = "tech-node-card";

    const name = document.createElement("strong");
    name.textContent = node.name;

    const badge = document.createElement("span");
    badge.className = "tech-node-badge";
    badge.textContent = `Lv. ${level}`;

    const header = document.createElement("div");
    header.className = "tech-node-header";
    header.append(name, badge);

    const desc = document.createElement("p");
    desc.className = "tech-node-desc";
    desc.textContent = node.getDescription(level);

    const track = document.createElement("div");
    track.className = "xp-track";
    track.style.margin = "6px 0";

    const fill = document.createElement("div");
    fill.className = "xp-fill";
    fill.style.width = `${barPercent}%`;
    fill.style.background = "#f59e0b";
    track.appendChild(fill);

    const controlRow = document.createElement("div");
    controlRow.style.display = "flex";
    controlRow.style.gap = "6px";
    controlRow.style.marginTop = "4px";

    const minusBtn = document.createElement("button");
    minusBtn.type = "button";
    minusBtn.className = "tech-upgrade-btn";
    minusBtn.style.flex = "1";
    minusBtn.textContent = "-";
    minusBtn.disabled = level <= 0 || isBattleRunning();
    minusBtn.addEventListener("click", () => refundChallengeBonus(nodeId));

    const plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.className = "tech-upgrade-btn";
    plusBtn.style.flex = "1";
    plusBtn.textContent = `+ (${nextCost})`;
    plusBtn.disabled = availableTickets < nextCost || isBattleRunning();
    plusBtn.addEventListener("click", () => buyChallengeBonus(nodeId));

    controlRow.append(minusBtn, plusBtn);

    nodeCard.append(header, desc, track, controlRow);
    grid.appendChild(nodeCard);
  }

  container.appendChild(grid);
}
