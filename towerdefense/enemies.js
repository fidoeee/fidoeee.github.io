/* ==========================================================================
   ENEMY & STAGE DEFINITIONS
   ========================================================================== */

const STAT_SCALERS = {
  health: (lvl) => Math.pow(1.04, Math.max(0, lvl - 1)),
  armor: (lvl) => Math.pow(1.032, Math.max(0, lvl - 1)),
};

const enemyTypes = {
  // --- BASIC & SWARM UNITS ---
  flood_drone: {
    name: "Swarm Drone",
    health: 1.1,
    speed: 3.5,
    reward: 0.05,
    damage: 5,
    armor: 0,
  },
  basic: {
    name: "Basic Enemy",
    health: 80,
    speed: 1,
    reward: 0.5,
    damage: 8,
  },
  fast: {
    name: "Fast Enemy",
    health: 60,
    speed: 2,
    reward: 0.5,
    damage: 6,
  },
  tank: {
    name: "Tank",
    health: 300,
    speed: 1,
    reward: 1,
    damage: 25,
  },
  armored: {
    name: "Armored Scout",
    health: 10,
    speed: 1,
    reward: 1,
    damage: 10,
    armor: 40,
  },
  healer: {
    name: "Combat Medic",
    health: 120,
    speed: 1.2,
    reward: 2,
    damage: 8,
    healAmount: 25,
    healInterval: 2000,
  },

  // --- SPECIALIZED MINIONS & SUPPORT ---
  shield_drone: {
    name: "Shield Drone",
    health: 200,
    speed: 1.5,
    reward: 3,
    damage: 12,
    armor: 50,
  },
  repair_unit: {
    name: "Nano Repair Unit",
    health: 250,
    speed: 0.8,
    reward: 4,
    damage: 10,
    healAmount: 60,
    healInterval: 1500,
  },

  // --- HEAVY REGENERATIVE UNITS ---
  regen_unit: {
    name: "Regenerator",
    health: 450,
    speed: 0.9,
    reward: 5,
    damage: 15,
    armor: 20,
    type: "self_healer",
    selfHealAmount: 120,
    healInterval: 1200,
  },
  siphon_unit: {
    name: "Siphon Link",
    health: 650,
    speed: 0.7,
    reward: 8,
    damage: 20,
    armor: 35,
    type: "dual_healer",
    selfHealAmount: 80,
    healAmount: 150,
    healInterval: 1800,
  },

  // --- EARLY BOSSES ---
  miniboss1: {
    name: "Miniboss",
    health: 6000,
    speed: 0.3,
    damage: 999,
    reward: 10,
    armor: 15,
  },
  miniboss: {
    name: "Miniboss",
    health: 8000,
    speed: 0.5,
    damage: 999,
    reward: 10,
    armor: 15,
  },
  boss: {
    name: "Garrison Titan",
    health: 20000,
    speed: 0.2,
    damage: 999,
    reward: 15,
    armor: 30,
  },

  // --- MID & LATE WORLD BOSSES ---
  juggernaut: {
    name: "Ironclad Juggernaut",
    health: 50000,
    speed: 0.15,
    damage: 999,
    reward: 25,
    armor: 85,
  },
  blitz_boss: {
    name: "Speed Demon Prime",
    health: 39000,
    speed: 0.7,
    damage: 999,
    reward: 30,
    armor: 10,
  },
  siphon_boss: {
    name: "Bio-Siphon Leviathan",
    health: 70000,
    speed: 0.25,
    damage: 999,
    reward: 35,
    armor: 25,
    type: "dual_healer",
    selfHealAmount: 150,
    healAmount: 250,
    healInterval: 2500,
  },
  fortress_core: {
    name: "Aegis Core Sentinel",
    health: 140000,
    speed: 0.1,
    damage: 999,
    reward: 50,
    armor: 120,
  },
  void_colossus: {
    name: "Void Colossus",
    health: 260000,
    speed: 0.15,
    damage: 999,
    reward: 75,
    armor: 160,
  },
  apex_overlord: {
    name: "Apex Vanguard Overlord",
    health: 250000,
    speed: 0.16,
    damage: 999,
    reward: 120,
    armor: 220,
  },
  dread_titan: {
    name: "Titan Dreadnought",
    health: 500000,
    speed: 0.12,
    damage: 999,
    reward: 180,
    armor: 300,
  },

  // --- WORLD 10 MULTI-BOSS COMPONENTS ---
  omega_titan_alpha: {
    name: "Omega Core Titan Alpha",
    health: 750000,
    speed: 0.08,
    damage: 999,
    reward: 150,
    armor: 3000,
  },
  omega_titan_beta: {
    name: "Omega Core Titan Beta",
    health: 600000,
    speed: 0.0801,
    damage: 999,
    reward: 150,
    armor: 10000,
  },
  omega_blitz_miniboss: {
    name: "Vanguard Blitz Stalker",
    health: 200000,
    speed: 0.45,
    damage: 999,
    reward: 100,
    armor: 1000,
  },

  /* ==========================================================================
   Challenge Bosses
   ========================================================================== */
  c_boss_1: {
    name: "Target C-010",
    level: 10,
    health: 30000,
    speed: 0.18,
    damage: 999,
    reward: 50,
    armor: 20,
  },
  c_boss_2: {
    name: "Target C-020",
    level: 20,
    health: 80000,
    speed: 0.16,
    damage: 999,
    reward: 75,
    armor: 100,
  },
  c_boss_3: {
    name: "Target C-030",
    level: 30,
    health: 68000,
    speed: 0.22,
    damage: 999,
    reward: 100,
    armor: 25,
  },
  c_boss_4: {
    name: "Target C-040",
    level: 40,
    health: 90000,
    speed: 0.14,
    damage: 999,
    reward: 130,
    armor: 150,
  },
  c_boss_5: {
    name: "Target C-050",
    level: 50,
    health: 119000,
    speed: 0.12,
    damage: 999,
    reward: 160,
    armor: 50,
    type: "self_healer",
    selfHealAmount: 400,
    healInterval: 1200,
  },
  c_boss_6: {
    name: "Target C-060",
    level: 60,
    health: 156000,
    speed: 0.14,
    damage: 999,
    reward: 200,
    armor: 100,
  },
  c_boss_7: {
    name: "Target C-070",
    level: 70,
    health: 192000,
    speed: 0.25,
    damage: 999,
    reward: 240,
    armor: 40,
  },
  c_boss_8: {
    name: "Target C-080",
    level: 80,
    health: 242000,
    speed: 0.1,
    damage: 999,
    reward: 290,
    armor: 300,
  },
  c_boss_9: {
    name: "Target C-090",
    level: 90,
    health: 297000,
    speed: 0.12,
    damage: 999,
    reward: 350,
    armor: 80,
    type: "self_healer",
    selfHealAmount: 1200,
    healInterval: 1000,
  },
  c_boss_10: {
    name: "Target C-100",
    level: 100,
    health: 368000,
    speed: 0.09,
    damage: 999,
    reward: 420,
    armor: 450,
  },
  c_boss_11: {
    name: "Target C-110",
    level: 110,
    health: 450000,
    speed: 0.18,
    damage: 999,
    reward: 500,
    armor: 120,
  },
  c_boss_12: {
    name: "Target C-120",
    level: 120,
    health: 580000,
    speed: 0.08,
    damage: 999,
    reward: 600,
    armor: 650,
  },
  c_boss_13: {
    name: "Target C-130",
    level: 130,
    health: 720000,
    speed: 0.24,
    damage: 999,
    reward: 720,
    armor: 80,
  },
  c_boss_14: {
    name: "Target C-140",
    level: 140,
    health: 900000,
    speed: 0.08,
    damage: 999,
    reward: 850,
    armor: 200,
    type: "self_healer",
    selfHealAmount: 3500,
    healInterval: 800,
  },
  c_boss_15: {
    name: "Target C-150",
    level: 150,
    health: 250000,
    speed: 0.07,
    damage: 999,
    reward: 1000,
    armor: 850,
  },
  c_boss_16: {
    name: "Target C-160",
    level: 160,
    health: 300000,
    speed: 0.12,
    damage: 999,
    reward: 1200,
    armor: 350,
  },
  c_boss_17: {
    name: "Target C-170",
    level: 170,
    health: 350000,
    speed: 0.06,
    damage: 999,
    reward: 1450,
    armor: 1200,
  },
  c_boss_18: {
    name: "Target C-180",
    level: 180,
    health: 400000,
    speed: 0.2,
    damage: 999,
    reward: 1750,
    armor: 250,
  },
  c_boss_19: {
    name: "Target C-190",
    level: 190,
    health: 450000,
    speed: 0.07,
    damage: 999,
    reward: 2100,
    armor: 500,
    type: "self_healer",
    selfHealAmount: 8000,
    healInterval: 600,
  },
  c_boss_20: {
    name: "Target C-200",
    level: 200,
    health: 500000,
    speed: 0.05,
    damage: 999,
    reward: 2500,
    armor: 1500,
  },
};

// World Themes & Descriptions
const worldThemes = {
  1: {
    name: "Grasslands",
    intro:
      "Welcome to Grasslands. Standard combat testing baseline tower placement and single-target DPS.",
  },
  2: {
    name: "Rocky Peaks",
    intro:
      "Welcome to Rocky Peaks. Armor plating and field medics dominate. Armor penetration is vital.",
  },
  3: {
    name: "Volcanic Wastes",
    intro:
      "Welcome to Volcanic Wastes. Heavy armor frontlines alongside swarm drone rushes.",
  },
  4: {
    name: "Frozen Citadel",
    intro:
      "Welcome to Frozen Citadel. Relentless low-HP swarm floods and blitzing runners charge the lane.",
  },
  5: {
    name: "Corrupted Swamps",
    intro:
      "Welcome to Corrupted Swamps. Biological regeneration and repair units continuously heal incoming targets.",
  },
  6: {
    name: "Cybernetic Fortress",
    intro:
      "Welcome to Cybernetic Fortress. Overlapping energy shields absorb incoming damage for heavy cyber tanks.",
  },
  7: {
    name: "Abyssal Rift",
    intro:
      "Welcome to Abyssal Rift. Elite combinations of speed, armor, shields, and healing force complete tactical adaptation.",
  },
  8: {
    name: "Celestial Apex",
    intro:
      "Welcome to Celestial Apex. High wave density combining every enemy archetype demands peak tech tree synergies.",
  },
  9: {
    name: "Quantum Wasteland",
    intro:
      "Welcome to Quantum Wasteland. Extreme speed runners and colossal swarm floods push high-firerate towers to their absolute limits.",
  },
  10: {
    name: "Genesis Core",
    intro:
      "Welcome to Genesis Core. The ultimate operational theater. Massive swarm floods lead into multi-boss apex encounters.",
  },
};

function getStageWaveTemplate(world, stageInWorld, isFinalWave, waveIndex) {
  switch (world) {
    case 1:
      switch (stageInWorld) {
        case 1:
          return isFinalWave ? ["basic", "fast", "basic"] : ["basic", "basic"];
        case 2:
          return ["fast", "fast", "basic"];
        case 3:
          return ["basic", "fast", "basic", "fast"];
        case 4:
          return ["armored", "basic", "armored"];
        case 6:
          return ["tank", "fast", "basic", "tank"];
        case 7:
          return ["fast", "armored", "basic"];
        case 8:
          return ["armored", "fast", "armored", "fast"];
        case 9:
          return ["basic", "fast", "armored", "tank"];
        default:
          return ["basic", "fast"];
      }
    case 2:
      switch (stageInWorld) {
        case 1:
          return ["basic", "healer", "armored"];
        case 2:
          return ["armored", "armored", "fast"];
        case 3:
          return ["basic", "healer", "armored", "healer"];
        case 4:
          return ["tank", "armored", "healer", "tank"];
        case 6:
          return ["fast", "fast", "healer"];
        case 7:
          return ["armored", "tank", "armored"];
        case 8:
          return ["armored", "healer", "tank", "healer"];
        case 9:
          return ["tank", "armored", "healer", "fast"];
        default:
          return ["armored", "healer"];
      }
    case 3:
      switch (stageInWorld) {
        case 1:
          return ["armored", "tank", "basic"];
        case 2:
          return ["armored", "armored", "tank"];
        case 3:
          return ["flood_drone", "flood_drone", "basic", "flood_drone"];
        case 4:
          return ["tank", "flood_drone", "armored", "flood_drone"];
        case 6:
          return ["flood_drone", "flood_drone", "flood_drone", "fast"];
        case 7:
          return ["shield_drone", "armored", "tank"];
        case 8:
          return ["armored", "flood_drone", "tank", "flood_drone"];
        case 9:
          return ["tank", "armored", "shield_drone", "flood_drone"];
        default:
          return ["flood_drone", "armored"];
      }
    case 4:
      switch (stageInWorld) {
        case 1:
          return ["flood_drone", "fast", "flood_drone"];
        case 2:
          return ["flood_drone", "flood_drone", "flood_drone", "fast"];
        case 3:
          return ["fast", "flood_drone", "fast", "flood_drone"];
        case 4:
          return ["flood_drone", "flood_drone", "flood_drone", "flood_drone"];
        case 6:
          return ["fast", "flood_drone", "fast", "flood_drone"];
        case 7:
          return ["flood_drone", "flood_drone", "fast", "flood_drone"];
        case 8:
          return ["fast", "flood_drone", "fast", "armored"];
        case 9:
          return ["fast", "fast", "flood_drone", "tank"];
        default:
          return ["flood_drone", "fast"];
      }
    case 5:
      switch (stageInWorld) {
        case 1:
          return ["basic", "repair_unit", "fast"];
        case 2:
          return ["repair_unit", "basic", "repair_unit"];
        case 3:
          return ["tank", "repair_unit", "tank"];
        case 4:
          return ["regen_unit", "basic", "tank"];
        case 6:
          return ["fast", "repair_unit", "fast"];
        case 7:
          return ["armored", "regen_unit", "tank"];
        case 8:
          return ["healer", "repair_unit", "regen_unit", "tank"];
        case 9:
          return ["regen_unit", "repair_unit", "tank", "armored"];
        default:
          return ["regen_unit", "repair_unit"];
      }
    case 6:
      switch (stageInWorld) {
        case 1:
          return ["basic", "shield_drone", "armored"];
        case 2:
          return ["shield_drone", "basic", "armored"];
        case 3:
          return ["siphon_unit", "armored", "tank"];
        case 4:
          return ["tank", "shield_drone", "tank"];
        case 6:
          return ["shield_drone", "fast", "shield_drone"];
        case 7:
          return ["armored", "shield_drone", "tank"];
        case 8:
          return ["shield_drone", "repair_unit", "siphon_unit"];
        case 9:
          return ["shield_drone", "siphon_unit", "tank", "armored"];
        default:
          return ["shield_drone", "siphon_unit"];
      }
    case 7:
      switch (stageInWorld) {
        case 1:
          return ["fast", "armored", "shield_drone"];
        case 2:
          return ["fast", "armored", "tank"];
        case 3:
          return ["flood_drone", "shield_drone", "flood_drone", "armored"];
        case 4:
          return ["regen_unit", "fast", "armored"];
        case 6:
          return ["shield_drone", "fast", "fast"];
        case 7:
          return ["armored", "repair_unit", "shield_drone", "tank"];
        case 8:
          return ["fast", "shield_drone", "regen_unit", "armored"];
        case 9:
          return ["siphon_unit", "shield_drone", "tank", "flood_drone"];
        default:
          return ["shield_drone", "regen_unit"];
      }
    case 8:
      switch (stageInWorld) {
        case 1:
          return ["flood_drone", "regen_unit", "healer", "shield_drone"];
        case 2:
          return ["armored", "fast", "tank"];
        case 3:
          return ["flood_drone", "armored", "flood_drone", "tank"];
        case 4:
          return ["shield_drone", "repair_unit", "healer", "tank"];
        case 6:
          return ["fast", "fast", "flood_drone", "fast"];
        case 7:
          return ["armored", "shield_drone", "tank", "armored"];
        case 8:
          return ["flood_drone", "shield_drone", "regen_unit", "siphon_unit"];
        case 9:
          return [
            "siphon_unit",
            "shield_drone",
            "repair_unit",
            "tank",
            "armored",
          ];
        default:
          return ["shield_drone", "siphon_unit", "regen_unit"];
      }
    case 9:
      switch (stageInWorld) {
        case 9:
          return [
            "flood_drone",
            "fast",
            "flood_drone",
            "fast",
            "flood_drone",
            "fast",
          ];
        default:
          return [
            "flood_drone",
            "flood_drone",
            "fast",
            "armored",
            "siphon_unit",
          ];
      }
    case 10:
    default:
      switch (stageInWorld) {
        case 9:
          return [
            "flood_drone",
            "fast",
            "flood_drone",
            "fast",
            "flood_drone",
            "fast",
            "shield_drone",
          ];
        case 10:
          return [
            "basic",
            "fast",
            "armored",
            "tank",
            "healer",
            "shield_drone",
            "repair_unit",
            "regen_unit",
            "siphon_unit",
          ];
        default:
          return [
            "flood_drone",
            "fast",
            "siphon_unit",
            "shield_drone",
            "repair_unit",
          ];
      }
  }
}

function generateWaveStructure(world, stageInWorld, waveIndex, maxWaves) {
  const isFinalWave = waveIndex === maxWaves - 1;
  let waveEnemies = [];

  // --- 1. CORE TEMPLATE SELECTION ---
  if (stageInWorld === 10 && isFinalWave) {
    switch (world) {
      case 1:
        waveEnemies = ["boss"];
        break;
      case 2:
        waveEnemies = ["miniboss", "boss"];
        break;
      case 3:
        waveEnemies = ["juggernaut"];
        break;
      case 4:
        waveEnemies = ["blitz_boss"];
        break;
      case 5:
        waveEnemies = ["siphon_boss"];
        break;
      case 6:
        waveEnemies = ["fortress_core"];
        break;
      case 7:
        waveEnemies = ["void_colossus"];
        break;
      case 8:
        waveEnemies = ["apex_overlord"];
        break;
      case 9:
        waveEnemies = ["dread_titan"];
        break;
      case 10:
        waveEnemies = [
          "omega_titan_alpha",
          "omega_titan_beta",
          "omega_blitz_miniboss",
        ];
        break;
      default:
        waveEnemies = ["boss"];
        break;
    }
  } else if (stageInWorld === 5 && isFinalWave) {
    waveEnemies = world === 1 ? ["miniboss1"] : ["miniboss"];
  } else {
    waveEnemies = getStageWaveTemplate(
      world,
      stageInWorld,
      isFinalWave,
      waveIndex,
    );
  }

  // --- 2. DYNAMIC QUANTITY & SWARM SCALING ---
  const absoluteStageIndex = (world - 1) * 10 + (stageInWorld - 1);

  if (stageInWorld === 10 && isFinalWave) {
    if (world === 10) {
      const fullMixEscorts = [
        "flood_drone",
        "fast",
        "armored",
        "tank",
        "healer",
        "shield_drone",
        "repair_unit",
        "regen_unit",
        "siphon_unit",
        "flood_drone",
        "fast",
        "flood_drone",
        "fast",
      ];
      for (let i = 0; i < 20; i++) {
        waveEnemies.push(fullMixEscorts[i % fullMixEscorts.length]);
      }
    } else {
      const bossEscortCount = 6 + Math.floor(world * 2.5);
      for (let i = 0; i < bossEscortCount; i++) {
        if (world >= 6 && i % 4 === 0) waveEnemies.push("siphon_unit");
        else if (world >= 3 && i % 2 === 0) waveEnemies.push("flood_drone");
        else if (world >= 6 && i % 4 === 1) waveEnemies.push("shield_drone");
        else if (world >= 2 && i % 4 === 3) waveEnemies.push("healer");
        else if (i % 5 === 0) waveEnemies.push("fast");
        else waveEnemies.push("armored");
      }
    }
  } else if (stageInWorld === 9) {
    // Dynamic Swarm Flood Generator: Appends 20 + (12 * world) drones/fast units per wave
    if (world >= 3) {
      const massiveFloodCount = 20 + world * 12;
      for (let i = 0; i < massiveFloodCount; i++) {
        waveEnemies.push(i % 3 === 0 ? "fast" : "flood_drone");
      }
    }
    if (world >= 6) {
      waveEnemies.push("shield_drone");
      waveEnemies.push("siphon_unit");
    }
  } else if (stageInWorld === 5 && isFinalWave) {
    const minibossEscortCount = 4 + Math.floor(world * 1.5);
    for (let i = 0; i < minibossEscortCount; i++) {
      if (world >= 5 && i % 3 === 0) waveEnemies.push("regen_unit");
      else if (world >= 3 && i % 2 === 0) waveEnemies.push("flood_drone");
      else if (world >= 2 && i % 3 === 1) waveEnemies.push("healer");
      else waveEnemies.push("tank");
    }
  } else {
    const coreTemplate = [...waveEnemies];
    const extraCount =
      Math.floor(absoluteStageIndex / 2) + (isFinalWave ? 2 : 0);

    for (let i = 0; i < extraCount; i++) {
      if (world >= 5 && i % 9 === 1) {
        waveEnemies.push("regen_unit");
      } else if (world >= 3 && i % 6 === 0) {
        waveEnemies.push("flood_drone");
      } else if (world >= 2 && i % 8 === 4) {
        waveEnemies.push("healer");
      } else {
        const templateEnemy = coreTemplate[i % coreTemplate.length];
        waveEnemies.push(templateEnemy);
      }
    }
  }

  return waveEnemies;
}

function getStageDescription(world, stageInWorld, worldInfo) {
  if (stageInWorld === 1) return worldInfo.intro;

  if (stageInWorld === 5) {
    if (world === 1)
      return "A heavy miniboss approaches! Research <b>Rear Base Defenses</b> in the <b>Tech Tree</b> and deploy <b>Base Towers</b>.";
    if (world === 4)
      return "A rapid swarm ambush precedes a high-speed mini-colossus. Maintain crowd control and fire rate!";
    return `Stage ${world}-5 Miniboss: Heavy armored threat supported by specialized support escorts. Backline firepower recommended.`;
  }

  if (stageInWorld === 10) {
    switch (world) {
      case 1:
        return `${worldInfo.name} Boss: Garrison Titan. Colossal base health escorted by support drones.`;
      case 2:
        return `${worldInfo.name} Boss: Titan Escort. Escorted by combat medics and armored scouts.`;
      case 3:
        return `${worldInfo.name} Boss: Ironclad Juggernaut. High Armor Rating surrounded by volcanic swarm drones.`;
      case 4:
        return `${worldInfo.name} Boss: Speed Demon Prime. High movement speed flanked by massive swarm floods!`;
      case 5:
        return `${worldInfo.name} Boss: Bio-Siphon Leviathan. Self-regenerating biological threat backed by repair units.`;
      case 6:
        return `${worldInfo.name} Boss: Aegis Core Sentinel. Heavy energy shielding and cyber escorts.`;
      case 7:
        return `${worldInfo.name} Boss: Void Colossus. Massive HP void entity flanked by elite vanguard champions.`;
      case 8:
        return `${worldInfo.name} Apex Boss: Overlord Vanguard. High wave density demanding max tech synergies.`;
      case 9:
        return `${worldInfo.name} Boss: Titan Dreadnought. Colossal armor and massive health pool testing peak single-target DPS.`;
      case 10:
        return `<b>APEX CORE FINAL ENCOUNTER:</b> Dual heavy slow titans (Omega Core Alpha & Beta) and a blitz stalker miniboss escorted by EVERY enemy archetype!`;
    }
  }

  switch (world) {
    case 1:
      switch (stageInWorld) {
        case 2:
          return "Fast vanguards lead the charge. Ensure your towers have sufficient range and quick targeting.";
        case 3:
          return "Pincer assault combining basic line-fillers with fast scouts.";
        case 4:
          return "Armored scouts debut! Standard physical damage will be mitigated—consider armor-piercing or high damage per hit.";
        case 6:
          return "Heavy tank vanguards backed by rapid scouts test your sustained board DPS.";
        case 7:
          return "Multi-lane pressure testing early targeting priorities.";
        case 8:
          return "Armored vanguards mixed with high-speed rushers.";
        case 9:
          return "Sustained endurance wave before the regional stronghold.";
      }
      break;
    case 2:
      switch (stageInWorld) {
        case 2:
          return "Armored scout patrols lead the mountain pass. High single-hit damage or armor pen required.";
        case 3:
          return "Combat medics join the front line, restoring health to injured allies. Target them early!";
        case 4:
          return "Heavy tank walls shielded by armored scouts. Test your sustained armor-piercing DPS.";
        case 6:
          return "Fast scout rushes supported by combat medics in the backline.";
        case 7:
          return "Armored heavy line tests your armor penetration tech tree upgrades.";
        case 8:
          return "Dual-column armored assault with medic sustain.";
        case 9:
          return "Final mountain defensive line before the peak's commander.";
      }
      break;
    case 3:
      switch (stageInWorld) {
        case 2:
          return "Heavy armor wall. Low damage-per-hit towers will deal minimal damage without Armor Pen.";
        case 3:
          return "Swarm drones descend! 1-HP flood drones test your rapid fire-rate coverage.";
        case 4:
          return "Armored tanks flanked by rapid swarm drones. Split your targeting between high single-target and high fire-rate.";
        case 6:
          return "Dense swarm flood wave. High fire-rate towers will prevent leak damage.";
        case 7:
          return "Shield drone prototypes absorb incoming fire for heavy armored line-breakers.";
        case 8:
          return "Mixed volcanic vanguard: heavy armor plates fronting fast swarmers.";
        case 9:
          return "Heavy endurance wave preceding the Ironclad Juggernaut.";
      }
      break;
    case 4:
      switch (stageInWorld) {
        case 2:
          return "Continuous swarm flood! Low damage, high fire-rate towers shine here.";
        case 3:
          return "Blitz runners push the front line while swarm drones crowd behind them.";
        case 4:
          return "Dense double-swarm waves test your board's total attacks per second.";
        case 6:
          return "Fast blitzers charging under the cover of low-HP swarm drones.";
        case 7:
          return "Massive swarm waves testing crowd control efficiency.";
        case 8:
          return "Mixed blitz-swarm ambush designed to overwhelm slow single-target turrets.";
        case 9:
          return "Final frost rush wave before the Speed Demon Prime.";
      }
      break;
    case 5:
      switch (stageInWorld) {
        case 2:
          return "Nano repair units deploy, healing large health pools every second.";
        case 3:
          return "Heavy tanks paired with repair units create near-immortal chokepoints.";
        case 4:
          return "Regenerators arrive! High self-healing ticks require high single-hit burst towers to burst them down.";
        case 6:
          return "Fast vanguards backed by backline repair support.";
        case 7:
          return "Armored tanks backed by continuous bio-regeneration.";
        case 8:
          return "Dense support line forcing prioritize-targeting micromanagement.";
        case 9:
          return "Endurance regeneration assault before the leviathan.";
      }
      break;
    case 6:
      switch (stageInWorld) {
        case 2:
          return "Shield drones lead the entry corridor, absorbing incoming direct hits.";
        case 3:
          return "Siphon Links field-test dual healing—restoring their own HP and tethering to nearby wounded allies.";
        case 4:
          return "Heavy cyber-tank division escorted by shield drones.";
        case 6:
          return "Rapid shield drone blitz designed to waste high-damage sniper shots.";
        case 7:
          return "Heavy armored fortress units advancing under shield drone cover.";
        case 8:
          return "Overlapping shield fields with repair unit sustain.";
        case 9:
          return "Full cybernetic vanguard assault before the sentinel core.";
      }
      break;
    case 7:
      switch (stageInWorld) {
        case 2:
          return "Elite fast scouts mixed with heavy armored line-breakers.";
        case 3:
          return "Swarm floods backed by shield drones testing fire-rate and armor pen simultaneously.";
        case 4:
          return "Regenerative armored tanks leading elite speed runners.";
        case 6:
          return "Shielded fast-attack units testing both targeting priorities and DPS output.";
        case 7:
          return "Heavy armored wall escorted by repair units and shield drones.";
        case 8:
          return "Complex multi-type wave requiring all target priority settings.";
        case 9:
          return "Final elite rift horde before the colossus.";
      }
      break;
    case 8:
      switch (stageInWorld) {
        case 2:
          return "Apex vanguard push testing overall damage output and target prioritization.";
        case 3:
          return "Dense swarm waves interwoven with armored elite tanks.";
        case 4:
          return "Triple-support escort waves with shield drones, repair units, and medics.";
        case 6:
          return "High-speed apex rushers forcing quick tower targeting adjustments.";
        case 7:
          return "Heavy juggernaut-tier armored push under shield cover.";
        case 8:
          return "Mastery wave testing total DPS, crowd control, and armor penetration.";
        case 9:
          return "Penultimate apex wave before the Overlord Vanguard.";
      }
      break;
    case 9:
      switch (stageInWorld) {
        case 2:
          return "High-frequency quantum scouts surge down the lane. Test your instant target lock-on speed.";
        case 3:
          return "Armored vanguards advancing behind dense swarm drone screens. Split your targeting between high single-hit and rapid fire-rate.";
        case 4:
          return "Multi-layered repair units backing up blitz runners. High burst DPS required to cut through continuous sustain.";
        case 6:
          return "Hyper-speed rushers flanked by shield drones. Rapid towers must strip energy shields before sniper units fire.";
        case 7:
          return "Juggernaut-tier armored units advancing alongside siphon link support. Armor penetration is mandatory.";
        case 8:
          return "Quantum endurance wave testing maximum fire-rate coverage and high-level armor-piercing synergies.";
      }
      break;
    case 10:
      switch (stageInWorld) {
        case 2:
          return "Apex core entry corridor. Heavy armored tanks escorted by overlapping energy shield drones.";
        case 3:
          return "Dual-siphon links tethering to high-health vanguards. Target priority micro is mandatory to prevent health regen.";
        case 4:
          return "Triple-threat support line (Medics, Repair Units, and Siphon Links) protecting heavy tank walls.";
        case 6:
          return "Blitz stalkers charging alongside high-density swarm floods. Demands 1,000+ fire-rate coverage.";
        case 7:
          return "Titan-class heavy armors advancing under full bio-regeneration and energy shield coverage.";
        case 8:
          return "Penultimate core gauntlet testing total endgame DPS, maximum armor penetration, and total board fire-rate.";
      }
      break;
  }

  return `Stage ${world}-${stageInWorld}: Adapt your tactical deployment and tech tree stats.`;
}

// Build 10 Worlds (100 Stages)
const TOTAL_WORLDS = 10;
const STAGES_PER_WORLD = 10;

const stages = Array.from(
  { length: TOTAL_WORLDS * STAGES_PER_WORLD },
  (_, index) => {
    const world = Math.floor(index / STAGES_PER_WORLD) + 1;
    const stageInWorld = (index % STAGES_PER_WORLD) + 1;
    const enemyLevel = index + 1;

    const isMinibossStage = stageInWorld === 5;
    const isBossStage = stageInWorld === 10;
    const waveCount = index < 4 ? 3 : 5;

    const stageWaves = Array.from({ length: waveCount }, (_, waveIndex) =>
      generateWaveStructure(world, stageInWorld, waveIndex, waveCount),
    );

    const worldInfo = worldThemes[world] || {
      name: `World ${world}`,
      intro: "",
    };

    let stageName = `${worldInfo.name} ${stageInWorld}`;
    if (isMinibossStage) stageName = `${worldInfo.name} Miniboss`;
    else if (isBossStage) stageName = `${worldInfo.name} Boss`;

    const description = getStageDescription(world, stageInWorld, worldInfo);

    return {
      id: `${world}-${stageInWorld}`,
      world,
      stageInWorld,
      index,
      enemyLevel,
      name: stageName,
      description,
      reward: 40 + index * 12, // Standard base reward for ALL stages
      waves: stageWaves,
    };
  },
);

/* ==========================================================================
   CHALLENGES (Targets C-010 to C-200)
   ========================================================================== */
const challengeStages = Array.from({ length: 20 }, (_, index) => {
  const level = index + 1;
  const bossKey = `c_boss_${level}`;
  const bossData = enemyTypes[bossKey];
  const enemyLevel = bossData?.level ?? level * 10;
  const speed = bossData?.speed || 0.1;

  const travelTimeSeconds = (11 / speed).toFixed(1);

  const rawBaseHp = bossData?.health || 0;
  const hpScaler =
    STAT_SCALERS.health || ((lvl) => Math.pow(1.04, Math.max(0, lvl - 1)));
  const scaledHp = Math.round(rawBaseHp * hpScaler(enemyLevel));

  const rawBaseArmor = bossData?.armor || 0;
  const armorScaler =
    STAT_SCALERS.armor || ((lvl) => Math.pow(1.032, Math.max(0, lvl - 1)));
  const scaledArmor = Math.round(rawBaseArmor * armorScaler(enemyLevel));

  const healText =
    bossData?.type === "self_healer"
      ? ` · Regen: ${bossData.selfHealAmount} HP / ${(bossData.healInterval / 1000).toFixed(1)}s`
      : "";

  const statsSummary = `Level: ${enemyLevel} · HP: ${scaledHp.toLocaleString()} · Armor: ${scaledArmor.toLocaleString()} · Speed: ${speed}${healText}`;

  return {
    id: `C-${level}`,
    index: index,
    isChallenge: true,
    level: level,
    enemyLevel: enemyLevel,
    name: bossData?.name || `Target C-${level}`,
    description: `Defeat <b>${bossData?.name || "Target C-" + level}</b>.<br><small>${statsSummary}</small><br>⚠️ <b>Time Limit:</b> You have ~<b>${travelTimeSeconds}s</b> to defeat this boss before it reaches your base!<br>First clear awards a massive Gold bounty and <b>1 Challenge Ticket</b>!`,
    reward: 2500 + index * 1250,
    waves: [[bossKey]],
    stReward: 20 + level * 3,
  };
});
