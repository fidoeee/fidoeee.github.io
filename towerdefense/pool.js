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

// --- REAR TOWERS POOLS ---
const rearPool = ["base_battery", "base_mortar"];

const rearPoolUpgrade1 = ["base_howitzer", "base_cannon"];
const rearPoolUpgrade2 = ["base_heavy_battery", "base_missile"];
const rearPoolUpgrade3 = ["base_storm_battery", "base_artillery"];
const rearPoolUpgrade4 = ["base_sentry_array", "base_titan_cannon"];

/**
 * Returns the currently available unit pool based on Tech Tree progression.
 * @param {"Main" | "Rear"} category 
 * @returns {string[]} Array of available unit keys
 */
function getAvailableUnitPool(category = "Main") {
  const techLevel = typeof getTechNodeLevel === "function" ? getTechNodeLevel("eco_pool") : 0;

  if (category === "Rear") {
    const currentRearPool = [...rearPool];
    if (techLevel >= 1) currentRearPool.push(...rearPoolUpgrade1);
    if (techLevel >= 2) currentRearPool.push(...rearPoolUpgrade2);
    if (techLevel >= 3) currentRearPool.push(...rearPoolUpgrade3);
    if (techLevel >= 4) currentRearPool.push(...rearPoolUpgrade4);
    return currentRearPool;
  }

  const currentPool = [...pool];
  if (techLevel >= 1) currentPool.push(...poolUpgrade1);
  if (techLevel >= 2) currentPool.push(...poolUpgrade2);
  if (techLevel >= 3) currentPool.push(...poolUpgrade3);
  if (techLevel >= 4) currentPool.push(...poolUpgrade4);

  return currentPool;
}