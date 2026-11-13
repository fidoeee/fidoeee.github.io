// --- Safety Patch for Unmapped Pool Keys in createUnit / getRandomUnitTypeByCategory ---
if (typeof createUnit === "function") {
    const _rawCreateUnit = createUnit;
    createUnit = function(type) {
        if (!type || !unitTypes[type]) {
            type = Object.keys(unitTypes)[0] || "cannon";
        }
        return _rawCreateUnit(type);
    };
}

if (typeof getRandomUnitTypeByCategory === "function") {
    const _rawGetRandom = getRandomUnitTypeByCategory;
    getRandomUnitTypeByCategory = function(category = "Main") {
        const result = _rawGetRandom(category);
        if (result && unitTypes[result]) return result;
        const validKeys = Object.keys(unitTypes).filter(k => (unitTypes[k].category || "Main") === category);
        return validKeys[Math.floor(Math.random() * validKeys.length)] || "cannon";
    };
}

/**
 * Fast-forwards campaign progression to a target world and stage.
 * Uses native getStageRewardMultiplier for clear decay (hits 15% floor on reruns),
 * drains ST completely on shop pulls, and scales XP with dual placeholders.
 *
 * @param {number} targetWorld - Target world number (1 to 10).
 * @param {number} [targetStageNum=1] - Target stage number (1 to 10).
 * @param {number} [clearsPerStage=10] - Number of clears per stage.
 * @param {number} [xpMultiplier=1.0] - Manual XP multiplier.
 * @param {boolean} [clearRange=true] - If true, clears all stages leading to target. If false, clears ONLY target stage.
 */
function devSpeedrun(targetWorld, targetStageNum = 1, clearsPerStage = 10, xpMultiplier = 1.0, clearRange = true) {
    if (typeof targetWorld !== "number" || targetWorld < 1 || targetWorld > 10) {
        console.error("[DevSpeedrun] Target world must be a number between 1 and 10.");
        return;
    }
    if (typeof targetStageNum !== "number" || targetStageNum < 1 || targetStageNum > 10) {
        console.error("[DevSpeedrun] Target stage must be a number between 1 and 10.");
        return;
    }

    const currentStage = getSelectedStage();
    const currentStageIndex = currentStage ? currentStage.index : 0;
    const targetStageIndex = ((targetWorld - 1) * 10) + (targetStageNum - 1);
    const runsCount = Math.max(1, Math.floor(clearsPerStage));
    const xpMult = Math.max(0, xpMultiplier);

    let startSimulationIndex;
    if (clearRange) {
        startSimulationIndex = (targetStageIndex <= currentStageIndex) ? 0 : currentStageIndex;
    } else {
        startSimulationIndex = targetStageIndex;
    }

    currentCampaignTabMode = "campaign";

    // Track existing tower max levels before pulls
    const initialUnits = [
        ...inventory,
        ...deployedUnits.filter(Boolean),
        ...deployedBaseUnits.filter(Boolean)
    ];

    const initialUnitIds = new Set(initialUnits.map(u => u.id));

    const highestMainLevel = initialUnits
        .filter(u => u.category === "Main")
        .reduce((max, u) => Math.max(max, u.level || 1), 1);

    const highestRearLevel = initialUnits
        .filter(u => u.category === "Rear")
        .reduce((max, u) => Math.max(max, u.level || 1), 1);

    // Initialize Dual Placeholders
    let simExistingMain = { level: highestMainLevel, xp: 0, category: "Main", totalXpEarned: 0 };
    let simExistingRear = { level: highestRearLevel, xp: 0, category: "Rear", totalXpEarned: 0 };
    let simNewMain = { level: 1, xp: 0, category: "Main", totalXpEarned: 0 };
    let simNewRear = { level: 1, xp: 0, category: "Rear", totalXpEarned: 0 };

    let totalAccumulatedGold = 0;
    let totalAccumulatedST = 0;

    const autoBuyTechMilestones = () => {
        if (typeof canUpgradeNode !== "function" || typeof buyTechNode !== "function") return;
        if (canUpgradeNode("eco_base_build")) buyTechNode("eco_base_build");
        while (canUpgradeNode("eco_pool")) buyTechNode("eco_pool");
        if (canUpgradeNode("eco_focus_pool")) buyTechNode("eco_focus_pool");
    };

    const calculateSimWaveXp = (enemyLevel, towerLevel) => {
        const baseWaveXp = 15 + enemyLevel * 5;
        const levelDiff = enemyLevel - towerLevel;
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
                effectiveDiff = baseAt30 + 3.0 * Math.log(1 + (slopeAt30 / 3.0) * (levelDiff - 30));
            }
            mult = Math.pow(1.21, effectiveDiff);
        }
        return Math.max(1, Math.round(baseWaveXp * mult));
    };

    const advanceSimPlaceholder = (placeholder, enemyLevel) => {
        const xpGained = Math.round(calculateSimWaveXp(enemyLevel, placeholder.level) * xpMult);
        placeholder.xp += xpGained;
        placeholder.totalXpEarned += xpGained;
        while (placeholder.xp >= getRequiredXp(placeholder)) {
            placeholder.xp -= getRequiredXp(placeholder);
            placeholder.level++;
        }
    };

    // --- 1. SIMULATE STAGES (Resource & XP Loop) ---
    for (let i = startSimulationIndex; i <= targetStageIndex; i++) {
        const stage = stages[i];
        if (!stage) continue;

        const stageId = stage.id;
        const waveCount = stage.waves.length;
        const enemyLevel = stage.enemyLevel ?? 1;
        unlockedStageIndex = Math.max(unlockedStageIndex, i + 1);

        const techMult = typeof getTechGoldMultiplier === "function" ? getTechGoldMultiplier() : 1;

        // Raw un-decayed base stage gold
        let rawBaseGold = 0;
        for (const waveEnemies of stage.waves) {
            for (const enemyKey of waveEnemies) {
                const baseEnemy = enemyTypes[enemyKey];
                if (!baseEnemy) continue;
                rawBaseGold += Math.floor((baseEnemy.reward ?? 1) * techMult);
            }
        }
        rawBaseGold += Math.floor(stage.reward * techMult);

        const isBoss = stage.isBoss || stage.stageInWorld === 10;
        const firstClearST = isBoss ? 10 : 5;

        let existingClears = stageClearCounts[stageId] || 0;

        for (let r = 1; r <= runsCount; r++) {
            // Temporarily set clear count to calculate exact decay multiplier via getStageRewardMultiplier
            stageClearCounts[stageId] = existingClears + r - 1;
            const rewardMult = typeof getStageRewardMultiplier === "function" 
                ? getStageRewardMultiplier(stageId) 
                : 1.0;

            const goldEarned = Math.floor(rawBaseGold * rewardMult);
            totalAccumulatedGold += goldEarned;
            gold += goldEarned;

            const currentClears = existingClears + r;
            const clearsForSt = Math.min(5, currentClears - 1);
            const startSt = typeof startStDropChance !== "undefined" ? startStDropChance : 0.5;
            const endSt = typeof endStDropChance !== "undefined" ? endStDropChance : 0.2;
            const dropChancePerWave = startSt - (clearsForSt / 5) * (startSt - endSt);

            let waveStDrops = 0;
            for (let w = 0; w < waveCount; w++) {
                if (Math.random() < dropChancePerWave) waveStDrops++;

                // Advance XP Placeholders wave-by-wave
                advanceSimPlaceholder(simExistingMain, enemyLevel);
                advanceSimPlaceholder(simExistingRear, enemyLevel);
                advanceSimPlaceholder(simNewMain, enemyLevel);
                advanceSimPlaceholder(simNewRear, enemyLevel);
            }

            const baseStEarned = currentClears === 1 ? firstClearST : Math.max(1, Math.floor(firstClearST * (1 - (currentClears - 1) * 0.2)));
            totalAccumulatedST += (baseStEarned + waveStDrops);
            st += (baseStEarned + waveStDrops);

            // Finalize this run's clear count
            stageClearCounts[stageId] = currentClears;
        }

        clearedStageIds.add(stageId);
        autoBuyTechMilestones();
    }
    autoBuyTechMilestones();

    // --- 2. GACHA PULL LOOP (Drains ST completely) ---
    let goldSpent = 0;
    let successfulPulls = 0;

    if (typeof buyRandomUnit === "function") {
        while (true) {
            const rearUnlocked = typeof isRearBuildUnlocked === "function" && isRearBuildUnlocked();
            let buyRear = rearUnlocked && (successfulPulls % 3 === 2);
            let reqGold = buyRear ? rearUnitCost : unitCost;
            let reqSt = buyRear ? rearStPullCost : stPullCost;

            if (buyRear && (gold < reqGold || st < reqSt)) {
                buyRear = false;
                reqGold = unitCost;
                reqSt = stPullCost;
            }

            if (gold < reqGold || st < reqSt) break;

            const category = buyRear ? "Rear" : "Main";
            const goldBefore = gold;

            buyRandomUnit(category);

            const actualCost = goldBefore - gold;
            if (actualCost <= 0) break;

            goldSpent += actualCost;
            successfulPulls++;
        }
    }

    // --- 3. APPLY ACCURATE XP TO TOWERS ---
    const allTowers = [
        ...inventory,
        ...deployedUnits.filter(Boolean),
        ...deployedBaseUnits.filter(Boolean)
    ];

    allTowers.forEach(unit => {
        const isPreExisting = initialUnitIds.has(unit.id);
        const isRear = unit.category === "Rear";

        let earnedXp = isPreExisting 
            ? (isRear ? simExistingRear.totalXpEarned : simExistingMain.totalXpEarned)
            : (isRear ? simNewRear.totalXpEarned : simNewMain.totalXpEarned);

        unit.xp = (unit.xp || 0) + earnedXp;

        while (unit.xp >= getRequiredXp(unit)) {
            unit.xp -= getRequiredXp(unit);
            unit.level = (unit.level || 1) + 1;
        }

        unit.energy = unit.maxEnergy || 100;
        if (typeof recalculateUnitStats === "function") {
            recalculateUnitStats(unit);
        }
    });

    // --- 4. FINALIZE ENGINE STATE & UI ---
    selectedStageId = `${targetWorld}-${targetStageNum}`;
    currentStagePage = Math.floor(targetStageIndex / stagesPerPage);
    stageEntered = false;
    startWaveAvailable = false;
    wave = 0;

    if (typeof saveCampaignProgress === "function") saveCampaignProgress(currentSaveSlot);
    if (typeof updateUI === "function") updateUI();
    if (typeof renderInventory === "function") renderInventory();
    if (typeof renderDeployment === "function") renderDeployment();
    if (typeof renderStageSelect === "function") renderStageSelect();
    if (typeof renderTechTree === "function") renderTechTree();

    const rangeText = clearRange 
        ? `from Stage ${stages[startSimulationIndex]?.id || '1-1'} to Stage ${targetWorld}-${targetStageNum}`
        : `Stage ${targetWorld}-${targetStageNum} only`;

    addLog(`🚀 Speedran ${rangeText} (${runsCount} run(s)/stage).`);
    addLog(`💰 Earned: +${totalAccumulatedGold.toLocaleString()} Gold, +${totalAccumulatedST} ST.`);
    addLog(`🛒 Spent ${goldSpent.toLocaleString()} Gold on ${successfulPulls} shop pulls. Leftover ST: ${st}.`);
    addLog(`📈 Existing units gained up to Lv.${simExistingMain.level} (Main) / Lv.${simExistingRear.level} (Rear). New pulls gained up to Lv.${simNewMain.level} (Main) / Lv.${simNewRear.level} (Rear).`);
}