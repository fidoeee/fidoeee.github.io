/* ==========================================================================
   TOWER POOLS & TIER UNLOCK DEFINITIONS
   ========================================================================== */

// --- MAIN TOWERS POOLS ---
const pool = [
  "basic",
  "rapid",
  "cannon",
  "flak",
  "mortar",
  "guard_turret",
  "twin_turret",
  "slugger",
  "shrapnel",
];

const poolUpgrade1 = [
  "sniper",
  "laser",
  "plasma",
  "minigun",
  "autocannon",
  "burst_turret",
  "howitzer",
  "repeater",
  "heavy_cannon",
  "pulse_laser",
  "field_howitzer",
  "marksman",
];

const poolUpgrade2 = [
  "sentry",
  "tesla",
  "railgun",
  "incendiary_rig",
  "point_defense",
  "rotary_cannon",
  "plasma_repeater",
  "heavy_mortar",
  "blast_turret",
];

const poolUpgrade3 = [
  "rocket_array",
  "gatling_turret",
  "kinetic_driver",
  "heavy_flak",
  "missile_array",
  "auto_railgun",
];

const poolUpgrade4 = [
  "orbital_laser",
  "thermal_lance",
  "siege_cannon",
  "ciws_array",
  "siege_array",
  "beam_turret",
];

const poolUpgrade5 = [
  "chrono_accelerator",
  "singularity_cannon",
  "dissonance_array",
  "vortex_projector", // Epic
  "hyper_beam", // Legendary
  "tachyon_lance", // Legendary
];

// --- REAR TOWERS POOLS ---
const rearPool = ["base_battery", "base_mortar", "base_field_gun"];

const rearPoolUpgrade1 = ["base_howitzer", "base_cannon"];
const rearPoolUpgrade2 = ["base_heavy_battery", "base_missile"];
const rearPoolUpgrade3 = ["base_storm_battery", "base_artillery"];
const rearPoolUpgrade4 = ["base_sentry_array", "base_titan_cannon"];
const rearPoolUpgrade5 = [
  "base_doomsday_silo",
  "base_aegis_generator",
  "base_apocalypse_array",
];

/* ==========================================================================
   RARITY SETTINGS
   ========================================================================== */

const rarityOrder = [
  "Mythic",
  "Legendary",
  "Epic",
  "Rare",
  "Uncommon",
  "Common",
];

const rarityRank = {
  Mythic: 6,
  Legendary: 5,
  Epic: 4,
  Rare: 3,
  Uncommon: 2,
  Common: 1,
};

const rarityMultipliers = {
  Common: 2.0,  
  Uncommon: 1.7,   
  Rare: 1.4,   
  Epic: 1.1,  
  Legendary: 0.85, 
  Mythic: 0.6, 
};

const MAIN_RARITY_WEIGHTS = {
  Common: 50,
  Uncommon: 30,
  Rare: 12,
  Epic: 6,
  Legendary: 2,
  Mythic: 0.8,
};

const REAR_RARITY_WEIGHTS = {
  Common: 0,
  Uncommon: 41,
  Rare: 39, 
  Epic: 12, 
  Legendary: 6,
  Mythic: 2,
};

const RARITY_WEIGHTS = MAIN_RARITY_WEIGHTS;

const rarityXpMap = {
  Common: 75,
  Uncommon: 150,
  Rare: 400,
  Epic: 750,
  Legendary: 3000,
  Mythic: 7500,
};

const BASE_UPGRADE_COSTS = {
  common: 30,
  uncommon: 50,
  rare_main: 80,
  rare_rear: 200,
  epic: 300,
  legendary: 1000,
  mythic: 3500,
};
/**
 * Returns the currently available unit pool based on Tech Tree progression.
 * @param {"Main" | "Rear"} category
 * @returns {string[]} Array of available unit keys
 */
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
