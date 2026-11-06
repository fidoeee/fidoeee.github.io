let enemies = [];
let activeUnits = [];
let tick = 0;
let fastForwardTimer = null;
let slowMode = false;

const NORMAL_TICK_DELAY = 100;
const SLOW_TICK_DELAY = 500;
const laneEnd = maxSlots + 1;
const FAST_FORWARD_BATCH_SIZE = 200;

const tickDisplay = document.getElementById("tick-count");
const skipBattleButton = document.getElementById("skip-battle");
const enemyList = document.getElementById("enemy-list");
const enemyCountDisplay = document.getElementById("enemy-count");

const battleTabButton = document.getElementById("battle-tab-button");
const enemiesTabButton = document.getElementById("enemies-tab-button");
const statsTabButton = document.getElementById("stats-tab-button");
const battleTab = document.getElementById("battle-tab");
const enemiesTab = document.getElementById("enemies-tab");
const statsTab = document.getElementById("stats-tab");
const statsList = document.getElementById("stats-list");
const speedSelect = document.getElementById("speed-select");

let currentTickDelay = NORMAL_TICK_DELAY;

let currentBattleTab = "battle";

// LEVEL SCALING
function getEnemyLevelMultiplier(level, stat = "health") {
  const scaler = STAT_SCALERS[stat] ?? STAT_SCALERS.health;
  return scaler(level);
}

function getLevelAdvantageMultiplier(attackerLevel, defenderLevel) {
  return Math.pow(1.05, attackerLevel - defenderLevel);
}

// LOAD A WAVE
function loadWave(waveNumber) {
  enemies = [];

  const stage = getSelectedStage();
  const waveEnemies = stage.waves[waveNumber - 1];

  if (!waveEnemies) {
    addLog(`Stage ${stage.id}, wave ${waveNumber} could not be loaded.`);
    return false;
  }

  const enemyLevel = stage.enemyLevel ?? 1;
  const statMultiplier = getEnemyLevelMultiplier(enemyLevel);
  const armorStatMultiplier = getEnemyLevelMultiplier(enemyLevel, "armor");

  for (const enemyType of waveEnemies) {
    const baseData = enemyTypes[enemyType];

    if (!baseData) {
      console.error(`Unknown enemy type: ${enemyType}`);
      continue;
    }

    const health = Math.round(baseData.health * statMultiplier);
    const armor = Math.round((baseData.armor ?? 0) * armorStatMultiplier);
    const healIntervalTicks = baseData.healInterval
      ? Math.round(baseData.healInterval / NORMAL_TICK_DELAY)
      : 0;

    enemies.push({
      id: enemies.length + 1,
      type: baseData.type || enemyType,
      enemyTypeKey: enemyType,
      name: baseData.name,
      level: enemyLevel,
      health,
      maxHealth: health,
      speed: baseData.speed,
      reward: baseData.reward,
      damage: Math.max(1, Math.round(baseData.damage * statMultiplier)),
      location: 0,
      armor: armor,
      healAmount: Math.round((baseData.healAmount ?? 0) * statMultiplier),
      selfHealAmount: Math.round(
        (baseData.selfHealAmount ?? 0) * statMultiplier,
      ),
      healCooldown: healIntervalTicks,
      healIntervalTicks: healIntervalTicks,
    });
  }

  return true;
}

// MOVE ENEMIES
function enemyMovement() {
  const remainingEnemies = [];

  for (const enemy of enemies) {
    enemy.location += enemy.speed / 10;

    if (enemy.location >= laneEnd) {
      baseHealth = Math.max(0, baseHealth - enemy.damage);

      addLog(
        `${enemy.name} Lv.${enemy.level} reached your base! ` +
          `-${enemy.damage} base health.`,
        true, // Marked as minor log
      );

      if (baseHealth <= 0) {
        handleGameOver();
        return;
      }

      continue;
    }

    remainingEnemies.push(enemy);
  }

  enemies = remainingEnemies;
}

// PROCESS SPECIAL ENEMY ABILITIES (HEALERS)
function processEnemyAbilities() {
  for (const enemy of enemies) {
    if (enemy.health <= 0 || enemy.healIntervalTicks <= 0) continue;

    enemy.healCooldown -= 1;
    if (enemy.healCooldown > 0) continue;

    enemy.healCooldown = enemy.healIntervalTicks;

    // Self-Healing (Regenerator / Siphon Link / Siphon Boss)
    if (enemy.selfHealAmount > 0 && enemy.health < enemy.maxHealth) {
      enemy.health = Math.min(
        enemy.maxHealth,
        enemy.health + enemy.selfHealAmount,
      );
    }

    // Dual Healer (Heals nearest damaged ally)
    if (enemy.type === "dual_healer" && enemy.healAmount > 0) {
      let nearestAlly = null;
      let minDistance = Infinity;

      for (const ally of enemies) {
        if (ally !== enemy && ally.health > 0 && ally.health < ally.maxHealth) {
          const dist = Math.abs(ally.location - enemy.location);
          if (dist < minDistance) {
            minDistance = dist;
            nearestAlly = ally;
          }
        }
      }

      if (nearestAlly) {
        nearestAlly.health = Math.min(
          nearestAlly.maxHealth,
          nearestAlly.health + enemy.healAmount,
        );
      }
    }
    // Standard AoE Area Healer (Combat Medic / Nano Repair Unit)
    else if (
      (enemy.type === "healer" ||
        enemy.enemyTypeKey === "healer" ||
        enemy.enemyTypeKey === "repair_unit") &&
      enemy.healAmount > 0
    ) {
      for (const ally of enemies) {
        if (ally !== enemy && ally.health > 0 && ally.health < ally.maxHealth) {
          ally.health = Math.min(
            ally.maxHealth,
            ally.health + enemy.healAmount,
          );
        }
      }
    }
  }
}

// TOWER ATTACKS
function towerDamage() {
  for (const tower of activeUnits) {
    tower.cooldown -= 1;

    // Use <= 0 so exact zero boundaries fire immediately
    while (tower.cooldown <= 0) {
      const inRangeEnemies = enemies.filter((enemy) => {
        if (enemy.health <= 0) return false;
        const distance = Math.abs(enemy.location - tower.location);
        return distance <= tower.range;
      });

      if (inRangeEnemies.length === 0) {
        tower.cooldown = 0;
        break;
      }

      const mode =
        tower.targeting || (tower.category === "Rear" ? "Strongest" : "First");

      const target = inRangeEnemies.reduce((chosen, enemy) => {
        if (chosen === null) return enemy;

        switch (mode) {
          case "Strongest":
            return enemy.health > chosen.health ? enemy : chosen;
          case "Weakest":
            return enemy.health < chosen.health ? enemy : chosen;
          case "Last":
            return enemy.location < chosen.location ? enemy : chosen;
          case "Highest Armor":
            return (enemy.armor || 0) > (chosen.armor || 0) ? enemy : chosen;
          case "Lowest Armor":
            return (enemy.armor || 0) < (chosen.armor || 0) ? enemy : chosen;
          case "First":
          default:
            return enemy.location > chosen.location ? enemy : chosen;
        }
      }, null);

      if (!target) {
        tower.cooldown = 0;
        break;
      }

      const advantage = getLevelAdvantageMultiplier(tower.level, target.level);
      const damage = Math.max(1, Math.round(tower.damage * advantage));

      const armorPen = getTechMainArmorPenetration(tower);

      // Reduce target armor before calculating net damage
      const effectiveArmor = Math.max(0, (target.armor || 0) - armorPen);
      const netDamage = Math.max(0, damage - effectiveArmor);

      const effectiveDamage = Math.min(target.health, netDamage);
      tower.waveDamage = (tower.waveDamage || 0) + effectiveDamage;
      tower.totalDamage = (tower.totalDamage || 0) + effectiveDamage;

      target.health -= netDamage;

      // Add exact cooldown duration
      tower.cooldown += tower.cooldownMax;

      if (target.health <= 0) {
        tower.waveKills = (tower.waveKills || 0) + 1;
        tower.totalKills = (tower.totalKills || 0) + 1;

        const rawBounty = target.reward ?? 1;
        const stageMultiplier =
          typeof getStageRewardMultiplier === "function"
            ? getStageRewardMultiplier(getSelectedStage().id)
            : 1;
        const techMultiplier =
          typeof getTechGoldMultiplier === "function"
            ? getTechGoldMultiplier()
            : 1;

        // Calculate precise fractional bounty
        const exactBounty = rawBounty * stageMultiplier * techMultiplier;
        const baseBounty = Math.floor(exactBounty);
        const remainder = exactBounty - baseBounty;

        // Probabilistic roll for decimal portion
        const bounty = baseBounty + (Math.random() < remainder ? 1 : 0);

        if (bounty > 0) {
          gold += bounty;

          // Track enemy gold for end-of-stage clear summary popup
          if (typeof addStageEnemyGold === "function") {
            addStageEnemyGold(bounty);
          }
        }

        addLog(
          `${target.name} Lv.${target.level} defeated! ` + `+${bounty} gold.`,
          true, // Marked as minor log
        );
      }
    }
  }

  enemies = enemies.filter((enemy) => enemy.health > 0);
}

// Helper to create cooldown badge
function updateBacklineCooldownDisplay() {
  if (typeof showBacklineCooldown !== "undefined" && !showBacklineCooldown)
    return;

  for (let i = 0; i < maxBaseSlots; i++) {
    const unit = deployedBaseUnits[i];
    const cdBadge = document.getElementById(`base-slot-cd-${i}`);

    if (cdBadge && unit !== null) {
      if (isBattleRunning()) {
        const currentCd = Math.max(0, Math.ceil(unit.cooldown || 0));
        cdBadge.textContent =
          currentCd > 0 ? `⏳ CD: ${currentCd} ticks` : `⚡ Ready`;
        cdBadge.classList.toggle("ready", currentCd === 0);
      } else {
        // Fall back to max cooldown ticks outside of an active wave
        const maxCd = Math.round(
          unit.cooldownMax || 100 / Math.max(0.1, unit.fireRate),
        );
        cdBadge.textContent = `⏳ CD: ${maxCd} ticks`;
        cdBadge.classList.remove("ready");
      }
    }
  }
}

// Call inside refreshBattleUI() in battle.js:
function refreshBattleUI() {
  const stage = getSelectedStage();

  tickDisplay.textContent = tick;

  enemyStatus.textContent = fastForward
    ? `Stage ${stage.id}, Wave ${wave} — Fast-forwarding — ${enemies.length} enemies remaining`
    : `Stage ${stage.id}, Wave ${wave} — ${enemies.length} enemies remaining`;

  updateUI();
  renderEnemyList();
  updateRangeEnemyInfo();
  updateBacklineCooldownDisplay(); // <--- Updates backline CD ticks each tick

  if (currentBattleTab === "stats") {
    renderStatsList();
  }
}

// SHOW ENEMIES IN THE ENEMY TAB
function renderEnemyList() {
  const enemyList = document.getElementById("enemy-list");
  const enemyCountDisplay = document.getElementById("enemy-count");

  if (!enemyList) return;

  enemyList.replaceChildren();

  if (enemyCountDisplay) {
    enemyCountDisplay.textContent = enemies.length;
  }

  if (enemies.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "No active enemies.";
    enemyList.appendChild(emptyMessage);
    return;
  }

  const rangeUnit = getRangeViewUnit();
  const sortedEnemies = getSortedEnemies(enemies);

  for (const enemy of sortedEnemies) {
    const card = document.createElement("div");
    card.className = "enemy-card";

    const inRange =
      rangeUnit !== null &&
      Math.abs(enemy.location - rangeUnit.location) <= rangeUnit.range;

    if (inRange) card.classList.add("in-range");

    const heading = document.createElement("div");
    heading.className = "enemy-heading";

    const name = document.createElement("strong");
    name.textContent = `${enemy.name} Lv.${enemy.level}`;

    const hp = document.createElement("span");
    const armorBadge = enemy.armor > 0 ? ` | 🛡️ ${enemy.armor}` : "";
    hp.textContent = `${Math.max(0, enemy.health)} / ${enemy.maxHealth} HP${armorBadge}`;

    heading.append(name, hp);

    const details = document.createElement("div");
    details.className = "enemy-details";

    const position = document.createElement("span");
    position.textContent = `Position: ${enemy.location.toFixed(1)} / ${laneEnd}`;

    const speed = document.createElement("span");
    speed.textContent = `Speed: ${enemy.speed}`;

    const armor = document.createElement("span");
    armor.textContent = `Armor: ${enemy.armor ?? 0}`;

    details.append(position, speed, armor);

    const healthTrack = document.createElement("div");
    healthTrack.className = "health-track";

    const healthFill = document.createElement("div");
    healthFill.className = "health-fill";

    const healthPercent = Math.max(
      0,
      Math.min(100, (enemy.health / enemy.maxHealth) * 100),
    );

    healthFill.style.width = `${healthPercent}%`;

    if (healthPercent <= 25) {
      healthFill.classList.add("critical");
    } else if (healthPercent <= 50) {
      healthFill.classList.add("low");
    }

    healthTrack.appendChild(healthFill);

    const positionTrack = document.createElement("div");
    positionTrack.className = "position-track";

    const positionPercent = Math.min(100, (enemy.location / laneEnd) * 100);

    const positionFill = document.createElement("div");
    positionFill.className = "position-fill";
    positionFill.style.width = `${positionPercent}%`;

    const marker = document.createElement("div");
    marker.className = "position-marker";
    marker.style.left = `${positionPercent}%`;

    positionTrack.append(positionFill, marker);
    card.append(heading, details, healthTrack, positionTrack);

    if (inRange) {
      const rangeLabel = document.createElement("p");
      rangeLabel.className = "hint";
      rangeLabel.textContent = `In range of ${getUnitName(rangeUnit)}`;
      card.appendChild(rangeLabel);
    }

    enemyList.appendChild(card);
  }
}

// UPDATE DEPLOYMENT RANGE INFORMATION
function updateRangeEnemyInfo() {
  for (const tower of deployedUnits) {
    if (tower === null) continue;

    const info = document.getElementById(`range-info-${tower.id}`);
    if (!info) continue;

    if (tower.id !== rangeViewUnitId) {
      info.textContent = "";
      continue;
    }

    const targets = enemies.filter(
      (enemy) => Math.abs(enemy.location - tower.location) <= tower.range,
    );

    info.textContent =
      targets.length === 0
        ? "Enemies in range: 0"
        : `Enemies in range: ${targets.length} — ${targets
            .map(
              (enemy) =>
                `${enemy.name} Lv.${enemy.level} (${Math.max(0, enemy.health)} HP)`,
            )
            .join(", ")}`;
  }
}

// STOP THE CURRENT BATTLE
function stopBattle() {
  // 1. Clear any pending timers
  if (typeof autoWaveTimeout !== "undefined" && autoWaveTimeout !== null) {
    clearTimeout(autoWaveTimeout);
    autoWaveTimeout = null;
  }

  if (battleLoop !== null) {
    clearInterval(battleLoop);
    battleLoop = null;
  }

  if (fastForwardTimer !== null) {
    clearTimeout(fastForwardTimer);
    fastForwardTimer = null;
  }

  fastForward = false;

  // 2. Reset active wave arrays
  enemies = [];
  activeUnits = [];

  // 3. Reset skip button state
  skipBattleButton.disabled = true;
  skipBattleButton.textContent = "Skip";

  // 4. Refresh UI displays
  updateUI();
  renderDeployment();
  renderStageSelect();
  renderEnemyList();
  renderStatsList();
  updateRangeEnemyInfo();
}

// END CONDITIONS
function checkBattleEnd() {
  if (baseHealth <= 0) {
    baseHealth = 0;
    stopBattle();
    handleStageDefeat();
    return true;
  }

  if (enemies.length === 0) {
    stopBattle();         // 1. Stop active battle loop first
    handleWaveCleared();  // 2. Clear wave & queue auto-start timer second
    return true;
  }

  return false;
}

function handleGameOver() {
  // 1. Stop active battle loop / fast-forward execution
  if (battleLoop !== null) {
    clearInterval(battleLoop);
    battleLoop = null;
  }
  fastForward = false;

  // 2. Reset active combat arrays
  activeUnits = [];
  enemies = [];

  // 3. Log event and alert player
  addLog("☠️ DEFEAT: Your base was destroyed!");
  alert("Game Over! Your base was destroyed.");

  // 4. Reset UI back to world/stage view
  refreshBattleUI();
  if (typeof renderStageList === "function") {
    renderStageList();
  }
}

// ONE BATTLE TICK
function battleTick(updateDisplay = true) {
  tick++;

  enemyMovement();
  processEnemyAbilities();

  if (baseHealth <= 0) {
    checkBattleEnd();

    if (updateDisplay) refreshBattleUI();

    return false;
  }

  towerDamage();

  if (checkBattleEnd()) {
    if (updateDisplay) refreshBattleUI();

    return false;
  }

  if (updateDisplay) refreshBattleUI();

  return true;
}

// NORMAL SPEED
function startNormalSpeed() {
  if (battleLoop !== null) return;

  fastForward = false;
  skipBattleButton.textContent = "Skip";

  // Keeps original slowMode override if triggered elsewhere, otherwise uses dropdown delay
  const delay = slowMode ? SLOW_TICK_DELAY : currentTickDelay;

  battleLoop = setInterval(() => {
    battleTick(true);
  }, delay);
}

// FAST-FORWARD BATCH
function runFastForwardBatch() {
  fastForwardTimer = null;

  if (!fastForward) return;

  for (let i = 0; i < FAST_FORWARD_BATCH_SIZE; i++) {
    if (!fastForward) return;

    if (!battleTick(false)) {
      refreshBattleUI();
      return;
    }
  }

  refreshBattleUI();

  if (fastForward) {
    fastForwardTimer = setTimeout(runFastForwardBatch, 0);
  }
}

// TOGGLE FAST-FORWARD
function toggleFastForward() {
  if (battleLoop === null && !fastForward) return;

  if (fastForward) {
    fastForward = false;

    if (fastForwardTimer !== null) {
      clearTimeout(fastForwardTimer);
      fastForwardTimer = null;
    }

    skipBattleButton.textContent = "Skip";
    startNormalSpeed();
    refreshBattleUI();

    return;
  }

  if (battleLoop !== null) {
    clearInterval(battleLoop);
    battleLoop = null;
  }

  fastForward = true;
  skipBattleButton.textContent = "Normal Speed";

  runFastForwardBatch();
}

// TAB SWITCHING
function showBattleTab(tabName) {
  currentBattleTab = tabName;

  battleTab.hidden = tabName !== "battle";
  enemiesTab.hidden = tabName !== "enemies";
  statsTab.hidden = tabName !== "stats";

  battleTabButton.classList.toggle("active", tabName === "battle");
  enemiesTabButton.classList.toggle("active", tabName === "enemies");
  statsTabButton.classList.toggle("active", tabName === "stats");

  battleTabButton.setAttribute("aria-selected", String(tabName === "battle"));
  enemiesTabButton.setAttribute("aria-selected", String(tabName === "enemies"));
  statsTabButton.setAttribute("aria-selected", String(tabName === "stats"));

  if (tabName === "enemies") renderEnemyList();
  if (tabName === "stats") renderStatsList();
  if (tabName === "battle") {
    renderAutoWaveControl();
  }
}

// SHOW STATISTICS IN THE STATS TAB
function renderStatsList() {
  if (!statsList) return;
  statsList.replaceChildren();

  const deployed = [...deployedUnits, ...deployedBaseUnits].filter(
    (unit) => unit !== null,
  );

  if (deployed.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "No towers currently deployed.";
    statsList.appendChild(emptyMessage);
    return;
  }

  const totalWaveDamage = deployed.reduce(
    (sum, unit) => sum + (unit.waveDamage || 0),
    0,
  );

  const summary = document.createElement("div");
  summary.className = "stats-summary";

  const damageText = document.createElement("span");
  damageText.innerHTML = `Total Wave Damage: <strong>${totalWaveDamage.toLocaleString()}</strong>`;

  const countText = document.createElement("span");
  countText.innerHTML = `Deployed: <strong>${deployed.length} / ${maxDeployedUnits + maxBaseSlots}</strong>`;

  summary.append(damageText, countText);
  statsList.appendChild(summary);

  for (const unit of deployed) {
    const data = getUnitData(unit);
    const card = document.createElement("div");
    card.className = "stat-tower-card";

    const heading = document.createElement("div");
    heading.className = "stat-tower-heading";

    const slotLabel =
      (unit.category || "Main") === "Rear"
        ? `Base Slot ${unit.selectedSlot + 1}`
        : `Slot ${unit.location}`;

    const name = document.createElement("strong");
    name.textContent = `${slotLabel}: ${data.name} Lv.${unit.level}`;

    const badge = document.createElement("span");
    badge.className = "stat-rarity";
    badge.textContent = data.rarity;

    heading.append(name, badge);

    const waveDmg = unit.waveDamage || 0;
    const sharePercent =
      totalWaveDamage > 0 ? Math.round((waveDmg / totalWaveDamage) * 100) : 0;

    const details = document.createElement("div");
    details.className = "stat-tower-details";

    const waveDamageSpan = document.createElement("span");
    waveDamageSpan.innerHTML = `Wave Dmg: <strong>${waveDmg.toLocaleString()}</strong> (${sharePercent}%)`;

    const killsSpan = document.createElement("span");
    killsSpan.innerHTML = `Kills: <strong>${unit.waveKills || 0}</strong>`;

    details.append(waveDamageSpan, killsSpan);

    const track = document.createElement("div");
    track.className = "damage-track";

    const fill = document.createElement("div");
    fill.className = "damage-fill";
    fill.style.width = `${sharePercent}%`;

    track.appendChild(fill);
    card.append(heading, details, track);

    statsList.appendChild(card);
  }
}

function renderAutoWaveControl() {
  if (typeof isAutoWaveUnlocked !== "function") return;

  let container = document.getElementById("auto-wave-control-container");
  const isUnlocked = isAutoWaveUnlocked();

  // If locked, clean up element if present
  if (!isUnlocked) {
    if (container) container.remove();
    return;
  }

  const targetParent = skipBattleButton ? skipBattleButton.parentNode : battleTab;
  if (!targetParent) return;

  if (!container) {
    container = document.createElement("label");
    container.id = "auto-wave-control-container";
    container.className = "auto-start-toggle-label";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = "toggle-auto-wave-checkbox";
    cb.checked = autoStartWaveEnabled;
    cb.addEventListener("change", (e) => {
      autoStartWaveEnabled = e.target.checked;
      if (typeof saveCampaignProgress === "function") saveCampaignProgress();
    });

    const textSpan = document.createElement("span");
    textSpan.textContent = "Auto-Start";

    container.append(cb, textSpan);
    targetParent.appendChild(container);
  } else {
    const cb = container.querySelector("#toggle-auto-wave-checkbox");
    if (cb) cb.checked = autoStartWaveEnabled;
  }
}

// SLOW MODE (Legacy function preserved)
function toggleSlowMode() {
  slowMode = !slowMode;

  if (battleLoop !== null) {
    clearInterval(battleLoop);
    battleLoop = null;
    startNormalSpeed();
  }
}

// START A BATTLE
function battleStart(waveNumber) {
  if (battleLoop !== null || fastForward) return;
  if (!loadWave(waveNumber)) return;

  const activeMain = deployedUnits
    .map((unit, index) => {
      if (unit === null) return null;

      unit.location = index + 1;
      unit.waveDamage = 0;
      unit.waveKills = 0;
      recalculateUnitStats(unit);

      return unit;
    })
    .filter((unit) => unit !== null);

  const activeRear = deployedBaseUnits
    .map((unit, index) => {
      if (unit === null) return null;

      unit.location = laneEnd;
      unit.selectedSlot = index;
      unit.waveDamage = 0;
      unit.waveKills = 0;
      recalculateUnitStats(unit);

      return unit;
    })
    .filter((unit) => unit !== null);

  activeUnits = [...activeMain, ...activeRear];

  for (const tower of activeUnits) {
    tower.cooldownMax = 100 / Math.max(0.1, tower.fireRate);

    if ((tower.category || "Main") === "Rear") {
      const reduction =
        typeof getTechArtilleryInitialChargeBonus === "function"
          ? getTechArtilleryInitialChargeBonus()
          : 0;
      tower.cooldown = Math.round(tower.cooldownMax * (1 - reduction));
    } else {
      tower.cooldown = 0;
    }
  }

  tick = 0;
  tickDisplay.textContent = tick;

  fastForward = false;

  startWaveButton.disabled = true;
  skipBattleButton.disabled = false;
  skipBattleButton.textContent = "Skip";

  renderDeployment();
  showBattleTab("battle");

  addLog(
    `Battle started: Stage ${getSelectedStage().id}, ` +
      `Wave ${waveNumber}, ${activeUnits.length} deployed units.`,
  );

  refreshBattleUI();
  startNormalSpeed();
  renderStageSelect();
}

// BUTTON EVENTS
skipBattleButton.addEventListener("click", () => {
  if (typeof cancelAutoRepeat === "function") {
    cancelAutoRepeat();
  }
  toggleFastForward();
});

battleTabButton.addEventListener("click", () => {
  showBattleTab("battle");
});

enemiesTabButton.addEventListener("click", () => {
  showBattleTab("enemies");
});

statsTabButton.addEventListener("click", () => {
  showBattleTab("stats");
});

// SPEED DROPDOWN LISTENER
if (speedSelect) {
  speedSelect.addEventListener("change", (e) => {
    const val = e.target.value;

    if (val === "slowest") {
      slowMode = true; // Syncs with legacy logic
      currentTickDelay = SLOW_TICK_DELAY;
    } else {
      slowMode = false;
      const multiplier = parseFloat(val);
      currentTickDelay = NORMAL_TICK_DELAY / multiplier;
    }

    // Apply the new speed immediately if a battle is actively running
    if (battleLoop !== null && !fastForward) {
      clearInterval(battleLoop);
      battleLoop = null;
      startNormalSpeed();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const enemySortSelect = document.getElementById("enemy-sort-select");
  if (enemySortSelect) {
    // Set initial value in case browser remembered previous selection
    currentEnemySortMode = enemySortSelect.value;

    enemySortSelect.addEventListener("change", (e) => {
      currentEnemySortMode = e.target.value;
      renderEnemyList();
    });
  }
});

function updateSpeedDropdownLock() {
  const speedSelect = document.getElementById("speed-select");
  if (!speedSelect) return;

  const maxSpeed =
    typeof getMaxUnlockedSpeedMultiplier === "function"
      ? getMaxUnlockedSpeedMultiplier()
      : 1;

  const speedLimits = {
    2: { speed: 2, label: "2x Speed" },
    4: { speed: 4, label: "4x Speed" },
    8: { speed: 8, label: "8x Speed" },
    16: { speed: 16, label: "16x Speed" },
  };

  for (const option of speedSelect.options) {
    const config = speedLimits[option.value];
    if (config) {
      option.disabled = config.speed > maxSpeed;
      option.textContent = config.label;
    }
  }

  // Auto-revert to max unlocked speed if active option becomes locked
  if (parseFloat(speedSelect.value) > maxSpeed) {
    speedSelect.value = String(maxSpeed);
    currentTickDelay = NORMAL_TICK_DELAY / maxSpeed;
  }
}

renderEnemyList();
renderStatsList();
renderAutoWaveControl();

if (typeof updateSpeedDropdownLock === "function") {
  updateSpeedDropdownLock();
}
