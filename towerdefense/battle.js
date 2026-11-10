const workerCode = `
let intervalId = null;
let intermissionTimer = null;

self.onmessage = (e) => {
  if (e.data.action === "start") {
    if (intervalId !== null) clearInterval(intervalId);

    const targetInterval = e.data.interval || 100;

    if (targetInterval < 10) {
      const ticksPerMsg = Math.round(10 / targetInterval);
      intervalId = setInterval(() => {
        self.postMessage({ type: "tick", count: ticksPerMsg });
      }, 10);
    } else {
      intervalId = setInterval(() => {
        self.postMessage({ type: "tick", count: 1 });
      }, targetInterval);
    }
  } else if (e.data.action === "startFastForward") {
    if (intervalId !== null) clearInterval(intervalId);

    const batchSize = e.data.batchSize || 40;

    // 1. Immediate burst on click to eliminate launch delay
    self.postMessage({ type: "tick", count: batchSize });

    // 2. Continuous 40-tick batches matched to 60fps frame timing (~16ms)
    intervalId = setInterval(() => {
      self.postMessage({ type: "tick", count: batchSize });
    }, 16);
  } else if (e.data.action === "startIntermission") {
    if (intermissionTimer !== null) clearTimeout(intermissionTimer);
    
    const duration = e.data.duration || 300;
    const tag = e.data.tag || null;

    intermissionTimer = setTimeout(() => {
      intermissionTimer = null;
      self.postMessage({ type: "intermissionDone", tag });
    }, duration);
  } else if (e.data.action === "stop") {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (intermissionTimer !== null) {
      clearTimeout(intermissionTimer);
      intermissionTimer = null;
    }
  }
};
`;

const blob = new Blob([workerCode], { type: "application/javascript" });
const gameTicker = new Worker(URL.createObjectURL(blob));

let pendingRender = false;

let activeIntermissionCallback = null;

gameTicker.onmessage = (e) => {
  const isTick =
    e.data === "tick" || (typeof e.data === "object" && e.data.type === "tick");
  const count = typeof e.data === "object" && e.data.count ? e.data.count : 1;

  if (isTick) {
    for (let i = 0; i < count; i++) {
      battleTick(false);
    }

    // Only queue DOM repaints when the tab is actively visible
    if (!document.hidden && !pendingRender) {
      pendingRender = true;
      requestAnimationFrame(() => {
        refreshBattleUI();
        pendingRender = false;
      });
    }
    return;
  }

  // Handle worker-driven delay completion
  if (typeof e.data === "object" && e.data.type === "intermissionDone") {
    if (typeof activeIntermissionCallback === "function") {
      const cb = activeIntermissionCallback;
      activeIntermissionCallback = null;
      cb(e.data.tag);
    }
  }
};

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

let lastBackgroundTimestamp = Date.now();
let isBackgroundCatchUpActive = false;

// LEVEL SCALING
function getEnemyLevelMultiplier(level, stat = "health") {
  const scaler = STAT_SCALERS[stat] ?? STAT_SCALERS.health;
  return scaler(level);
}

function getLevelAdvantageMultiplier(attackerLevel, defenderLevel) {
  return Math.pow(1.05, attackerLevel - defenderLevel);
}

function getEffectiveTowerDamage(unit) {
  const isFatigued = unit.energy <= 0;
  return isFatigued ? Math.round(unit.damage * 0.3) : unit.damage;
}

function getEffectiveTowerFireRate(unit) {
  const isFatigued = unit.energy <= 0;
  return isFatigued ? Number((unit.fireRate * 0.3).toFixed(4)) : unit.fireRate;
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
      const effectiveBaseDmg = getEffectiveTowerDamage(tower);
      const damage = Number((effectiveBaseDmg * advantage).toFixed(4));

      const armorPen = getTechMainArmorPenetration(tower);
      const effectiveArmor = Math.max(0, (target.armor || 0) - armorPen);
      const netDamage = Math.max(0, damage - effectiveArmor);

      const effectiveDamage = Math.min(target.health, netDamage);
      tower.waveDamage = (tower.waveDamage || 0) + effectiveDamage;
      tower.totalDamage = (tower.totalDamage || 0) + effectiveDamage;

      target.health -= netDamage;

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

        const exactBounty = rawBounty * stageMultiplier * techMultiplier;
        const baseBounty = Math.floor(exactBounty);
        const remainder = exactBounty - baseBounty;

        const bounty = baseBounty + (Math.random() < remainder ? 1 : 0);

        if (bounty > 0) {
          gold += bounty;
          if (typeof addStageEnemyGold === "function") {
            addStageEnemyGold(bounty);
          }
        }

        addLog(
          `${target.name} Lv.${target.level} defeated! +${bounty} gold.`,
          true,
        );
      }
    }
  }

  enemies = enemies.filter((enemy) => enemy.health > 0);
}

function updateBacklineCooldownDisplay() {
  const isRunning = isBattleRunning();

  // Update Backline Base Slots
  if (typeof showBacklineCooldown !== "undefined" && showBacklineCooldown) {
    for (let i = 0; i < maxBaseSlots; i++) {
      const unit = deployedBaseUnits[i];
      const cdBadge = document.getElementById(`base-slot-cd-${i}`);

      if (cdBadge && unit !== null) {
        const { text, isReady } = getCooldownDisplayText(unit, isRunning);
        cdBadge.textContent = text;
        cdBadge.classList.toggle("ready", isReady);
      }
    }
  }

  // Update Frontline Main Slots
  if (typeof showFrontlineCooldown !== "undefined" && showFrontlineCooldown) {
    for (let i = 0; i < maxSlots; i++) {
      const unit = deployedUnits[i];
      const cdBadge = document.getElementById(`main-slot-cd-${i}`);

      if (cdBadge && unit !== null) {
        const { text, isReady } = getCooldownDisplayText(unit, isRunning);
        cdBadge.textContent = text;
        cdBadge.classList.toggle("ready", isReady);
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
    hp.textContent = `${Math.max(0, enemy.health.toFixed(0))} / ${enemy.maxHealth.toFixed(0)} HP${armorBadge}`;

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
  isStoppingBattle = true;

  cancelWorkerIntermission();

  if (typeof autoWaveTimeout !== "undefined" && autoWaveTimeout !== null) {
    clearTimeout(autoWaveTimeout);
    autoWaveTimeout = null;
  }

  if (battleLoop !== null) {
    gameTicker.postMessage({ action: "stop" });
    battleLoop = null;
  }

  if (fastForwardTimer !== null) {
    clearTimeout(fastForwardTimer);
    fastForwardTimer = null;
  }

  fastForward = false;
  enemies = [];
  activeUnits = [];

  skipBattleButton.disabled = true;
  skipBattleButton.textContent = "Skip";

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
    stopBattle(); // 1. Stop active battle loop first
    handleWaveCleared(); // 2. Clear wave & queue auto-start timer second
    return true;
  }

  return false;
}

function handleGameOver() {
  if (battleLoop !== null) {
    gameTicker.postMessage({ action: "stop" });
    battleLoop = null;
  }
  fastForward = false;

  activeUnits = [];
  enemies = [];

  addLog("☠️ DEFEAT: Your base was destroyed!");
  alert("Game Over! Your base was destroyed.");

  refreshBattleUI();
  if (typeof renderStageList === "function") {
    renderStageList();
  }
}

// ONE BATTLE TICK
function battleTick(updateDisplay = true) {
  if (isStoppingBattle) return false;
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
  if (battleLoop !== null || isBackgroundCatchUpActive) return;

  fastForward = false;
  skipBattleButton.textContent = "Skip";

  const delay = slowMode ? SLOW_TICK_DELAY : currentTickDelay;

  gameTicker.postMessage({ action: "start", interval: delay });
  battleLoop = true;
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

    if (battleLoop !== null) {
      gameTicker.postMessage({ action: "stop" });
      battleLoop = null;
    }

    skipBattleButton.textContent = "Skip";
    startNormalSpeed();
    refreshBattleUI();
    return;
  }

  if (battleLoop !== null) {
    gameTicker.postMessage({ action: "stop" });
    battleLoop = null;
  }

  fastForward = true;
  skipBattleButton.textContent = "Skipping";

  gameTicker.postMessage({ action: "startFastForward", batchSize: 200 });
  battleLoop = true;
}

function skipCurrentWave() {
  if (battleLoop === null || isStoppingBattle) return;

  // 1. Stop the worker timer so it doesn't dispatch extra ticks mid-simulation
  gameTicker.postMessage({ action: "stop" });
  battleLoop = null;
  fastForward = false;

  // 2. Synchronously process all remaining ticks in a single main-thread execution
  let safetyLimit = 10000; // Safety cap to prevent infinite loops
  while (
    enemies.length > 0 &&
    baseHealth > 0 &&
    !isStoppingBattle &&
    safetyLimit > 0
  ) {
    battleTick(false);
    safetyLimit--;
  }

  // 3. Force an immediate screen render showing the end-of-wave state
  refreshBattleUI();
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

  const targetParent = skipBattleButton
    ? skipBattleButton.parentNode
    : battleTab;
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
      if (
        autoStartWaveEnabled &&
        stageEntered &&
        startWaveAvailable &&
        !isBattleRunning()
      ) {
        startWave();
      }
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
    gameTicker.postMessage({ action: "stop" });
    battleLoop = null;
    startNormalSpeed();
  }
}

// START A BATTLE
function battleStart(waveNumber) {
  if (battleLoop !== null || fastForward) return;
  if (!loadWave(waveNumber)) return;

  isStoppingBattle = false;

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
    const effectiveFireRate = getEffectiveTowerFireRate(tower);
    tower.cooldownMax = 100 / Math.max(0.1, effectiveFireRate);

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
  skipCurrentWave();
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
      slowMode = true;
      currentTickDelay = SLOW_TICK_DELAY;
    } else {
      slowMode = false;
      const multiplier = parseFloat(val);
      currentTickDelay = NORMAL_TICK_DELAY / multiplier;
    }

    if (battleLoop !== null && !fastForward) {
      gameTicker.postMessage({ action: "stop" });
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

//===========================================================================
// INITIALIZE BATTLE UI
//===========================================================================

renderEnemyList();
renderStatsList();
renderAutoWaveControl();

if (typeof updateSpeedDropdownLock === "function") {
  updateSpeedDropdownLock();
}
