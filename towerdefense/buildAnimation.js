/* ==========================================================================
   TOWER BUILD / SUMMON REVEAL ANIMATION
   ========================================================================== */

const BUILD_RARITY_META = {
  Common: { rank: 1, color: "#9ca3af", glow: "rgba(156, 163, 175, 0.45)" },
  Uncommon: { rank: 2, color: "#34d399", glow: "rgba(52, 211, 153, 0.55)" },
  Rare: { rank: 3, color: "#60a5fa", glow: "rgba(96, 165, 250, 0.65)" },
  Epic: { rank: 4, color: "#a855f7", glow: "rgba(168, 85, 247, 0.75)" },
  Legendary: { rank: 5, color: "#f59e0b", glow: "rgba(245, 158, 11, 0.85)" },
  Mythic: { rank: 6, color: "#ff3b3b", glow: "rgba(255, 59, 59, 0.95)" },
};

const BUILD_RARITY_STEPS = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

function closeBuildAnimationOverlay() {
  const existing = document.getElementById("build-anim-overlay");
  if (existing) {
    if (existing._keyHandler) {
      document.removeEventListener("keydown", existing._keyHandler);
    }
    if (existing._timers) {
      existing._timers.forEach((id) => clearTimeout(id));
    }
    if (existing._intervals) {
      existing._intervals.forEach((id) => clearInterval(id));
    }
    existing.remove();
  }
}

function playBuildAnimation(
  pulledItems,
  category = "Main",
  modeOverride = null,
) {
  if (!Array.isArray(pulledItems) || pulledItems.length === 0) return;

  const mode =
    modeOverride ||
    (typeof buildAnimationMode !== "undefined" ? buildAnimationMode : "full");

  if (mode === "off") return;

  closeBuildAnimationOverlay();

  // Find highest rarity in this pull batch
  let peakRarity = "Common";
  let peakRank = 1;
  for (const item of pulledItems) {
    const r = item.data?.rarity || "Common";
    const meta = BUILD_RARITY_META[r] || BUILD_RARITY_META.Common;
    if (meta.rank > peakRank) {
      peakRank = meta.rank;
      peakRarity = r;
    }
  }

  const peakMeta = BUILD_RARITY_META[peakRarity];
  const isMulti = pulledItems.length > 1;
  const isFullLike = mode === "full" || mode === "medium";
  const useOneByOne = isFullLike && isMulti;

  const SKIP_LOCKOUT_MS = 350;
  const CARD_ADVANCE_DEBOUNCE_MS = 140;
  const startTime = performance.now();

  // Phases: "charging" -> "spotlight" (10x full/medium only) -> "revealed" (summary)
  let phase = mode === "short" ? "revealed" : "charging";
  let skipArmed = false;
  let spotlightIndex = 0;
  let lastStepTime = startTime;
  const timers = [];
  const intervals = [];

  // Overlay
  const overlay = document.createElement("div");
  overlay.id = "build-anim-overlay";
  overlay.className =
    mode === "short" ? "build-anim-overlay instant-bg" : "build-anim-overlay";
  overlay._timers = timers;
  overlay._intervals = intervals;

  // Screen Flash Layer
  const flashLayer = document.createElement("div");
  flashLayer.className = "build-anim-flash";
  flashLayer.style.setProperty("--peak-color", peakMeta.color);
  overlay.appendChild(flashLayer);

  // Full-Screen Pre-Charging Rig (Grid, Orbital Ring, Edge Rails, Corner Clamps)
  const screenRig = document.createElement("div");
  screenRig.className = "build-screen-rig assembling";

  const screenGrid = document.createElement("div");
  screenGrid.className = "build-screen-grid";

  const outerOrbital = document.createElement("div");
  outerOrbital.className = "build-outer-orbital";
  for (let i = 0; i < 4; i++) {
    const node = document.createElement("span");
    node.className = `build-orbital-node n${i}`;
    outerOrbital.appendChild(node);
  }

  const railDirs = ["top", "bottom", "left", "right"];
  const screenRails = railDirs.map((dir) => {
    const rail = document.createElement("div");
    rail.className = `build-screen-rail ${dir}`;
    return rail;
  });

  const bracketDirs = ["tl", "tr", "bl", "br"];
  const screenBrackets = bracketDirs.map((dir) => {
    const bracket = document.createElement("div");
    bracket.className = `build-screen-bracket ${dir}`;
    return bracket;
  });

  screenRig.append(
    screenGrid,
    outerOrbital,
    ...screenRails,
    ...screenBrackets,
  );
  if (isFullLike) {
    overlay.appendChild(screenRig);
  }

  // Top-right Skip Hint (during charge) & Skip Button (during 1-by-1)
  const skipHint = document.createElement("div");
  skipHint.className = "build-skip-hint";
  skipHint.textContent = "Click outside center twice to skip";
  if (isFullLike) {
    overlay.appendChild(skipHint);
  }

  const skipAllBtn = document.createElement("button");
  skipAllBtn.type = "button";
  skipAllBtn.className = "build-skip-all-btn hidden";
  skipAllBtn.textContent = "Skip All »";
  skipAllBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showSummaryResults(true);
  });
  overlay.appendChild(skipAllBtn);

  // Stage Container
  const stage = document.createElement("div");
  stage.className = "build-anim-stage";

  // 1. Charging Core (Medium / Full mode)
  const coreWrapper = document.createElement("div");
  coreWrapper.className = "build-core-wrapper";

  const coreAura = document.createElement("div");
  coreAura.className = "build-core-aura";

  const coreRays = document.createElement("div");
  coreRays.className = "build-core-rays";

  const ringOuter = document.createElement("div");
  ringOuter.className = "build-core-ring outer";

  const ringInner = document.createElement("div");
  ringInner.className = "build-core-ring inner";

  const coreOrb = document.createElement("div");
  coreOrb.className = "build-core-orb";
  coreOrb.textContent = category === "Rear" ? "🚀" : "🗼";

  const chargeLabel = document.createElement("div");
  chargeLabel.className = "build-charge-label";
  chargeLabel.textContent = "INITIALIZING FABRICATOR...";

  coreWrapper.append(
    coreAura,
    coreRays,
    ringOuter,
    ringInner,
    coreOrb,
    chargeLabel,
  );
  if (isFullLike) {
    stage.appendChild(coreWrapper);
  }

  // 2. Spotlight Container (1-by-1 reveal for 10x Medium / Full mode)
  const spotlightWrapper = document.createElement("div");
  spotlightWrapper.className = "build-spotlight-wrapper hidden";

  const spotlightCounter = document.createElement("div");
  spotlightCounter.className = "build-spotlight-counter";

  const spotlightCardSlot = document.createElement("div");
  spotlightCardSlot.className = "build-spotlight-card-slot";

  const spotlightPrompt = document.createElement("div");
  spotlightPrompt.className = "build-spotlight-prompt";
  spotlightPrompt.textContent = "Click anywhere to reveal next tower";

  spotlightWrapper.append(spotlightCounter, spotlightCardSlot, spotlightPrompt);
  stage.appendChild(spotlightWrapper);

  // 3. Summary Results Container
  const resultsWrapper = document.createElement("div");
  resultsWrapper.className =
    mode === "short"
      ? "build-results-wrapper revealed"
      : "build-results-wrapper hidden";

  const resultsHeader = document.createElement("div");
  resultsHeader.className = "build-results-header";
  resultsHeader.innerHTML = isMulti
    ? `<h2>${category} Tower Supply Drop (x${pulledItems.length})</h2>`
    : `<h2>New ${category} Tower Constructed!</h2>`;

  const cardsGrid = document.createElement("div");
  cardsGrid.className = isMulti
    ? "build-cards-grid multi"
    : "build-cards-grid single";

  function buildCardElement(item, delaySec = 0, isSpotlight = false) {
    const data = item.data || {};
    const rarity = data.rarity || "Common";
    const rarityLower = rarity.toLowerCase();
    const meta = BUILD_RARITY_META[rarity] || BUILD_RARITY_META.Common;

    const card = document.createElement("div");
    card.className = `build-reveal-card ${rarityLower} ${meta.rank >= 4 ? "high-tier" : ""} ${isSpotlight ? "spotlight" : ""}`;
    card.style.setProperty("--card-delay", `${delaySec}s`);
    card.style.setProperty("--rarity-color", meta.color);
    card.style.setProperty("--rarity-glow", meta.glow);

    if (item.isNew) {
      const newBadge = document.createElement("span");
      newBadge.className = "build-card-new-badge";
      newBadge.textContent = "NEW!";
      card.appendChild(newBadge);
    }

    const rarityTag = document.createElement("div");
    rarityTag.className = `build-card-rarity ${rarityLower}`;
    rarityTag.textContent =
      meta.rank >= 5 ? `★ ${rarity.toUpperCase()} ★` : rarity.toUpperCase();

    const nameEl = document.createElement("div");
    nameEl.className = "build-card-name";
    nameEl.textContent = data.name || "Unknown Tower";

    const statsEl = document.createElement("div");
    statsEl.className = "build-card-stats";
    statsEl.innerHTML = `
      <span>DMG: <strong>${data.damage ?? 0}</strong></span>
      <span>FR: <strong>${data.fireRate ?? 0}</strong></span>
      <span>RNG: <strong>${data.range ?? 0}</strong></span>
    `;

    card.append(rarityTag, nameEl, statsEl);
    return card;
  }

  pulledItems.forEach((item, idx) => {
    cardsGrid.appendChild(buildCardElement(item, idx * 0.09, false));
  });

  const footer = document.createElement("div");
  footer.className = "build-results-footer";

  const continuePrompt = document.createElement("div");
  continuePrompt.className = "build-continue-prompt";
  continuePrompt.textContent = "Click anywhere to continue";

  footer.appendChild(continuePrompt);
  resultsWrapper.append(resultsHeader, cardsGrid, footer);
  stage.appendChild(resultsWrapper);
  overlay.appendChild(stage);
  document.body.appendChild(overlay);

  function clearChargingLoops() {
    timers.forEach((id) => clearTimeout(id));
    timers.length = 0;
    intervals.forEach((id) => clearInterval(id));
    intervals.length = 0;
  }

  // Subtle screen-wide color pulse when escalating rarity during charge
  function triggerChargeFlash(color) {
    flashLayer.style.setProperty("--peak-color", color);
    flashLayer.classList.remove("active", "long-flash", "charge-flash");
    void flashLayer.offsetWidth;
    flashLayer.classList.add("charge-flash");
  }

  // Fire an energy streak from the outer edge of the screen down a rail into the core
  function spawnRailBolt(color, railIndex = null) {
    if (phase !== "charging") return;
    const idx =
      railIndex !== null
        ? railIndex
        : Math.floor(Math.random() * screenRails.length);
    const rail = screenRails[idx];
    if (!rail) return;

    const bolt = document.createElement("span");
    bolt.className = "build-rail-bolt";
    bolt.style.background = color;
    bolt.style.boxShadow = `0 0 12px ${color}, 0 0 22px #ffffff`;
    rail.appendChild(bolt);
    setTimeout(() => bolt.remove(), 400);
  }

  // Spawn an energy mote that gets pulled inward into the core
  function spawnChargeMote(color) {
    if (phase !== "charging") return;
    const mote = document.createElement("span");
    mote.className = "build-charge-mote";
    const angle = Math.random() * Math.PI * 2;
    const dist = 190 + Math.random() * 140;
    const sx = Math.cos(angle) * dist;
    const sy = Math.sin(angle) * dist;
    const size = 4 + Math.random() * 5;

    mote.style.setProperty("--sx", `${sx.toFixed(1)}px`);
    mote.style.setProperty("--sy", `${sy.toFixed(1)}px`);
    mote.style.width = `${size}px`;
    mote.style.height = `${size}px`;
    mote.style.background = color;
    mote.style.boxShadow = `0 0 12px ${color}, 0 0 20px #ffffff`;
    coreWrapper.appendChild(mote);
    setTimeout(() => mote.remove(), 550);
  }

  // Pulse the core, fire all 4 edge rails, and tighten clamps on rarity escalation
  function triggerTierUpRipple(meta, isUpgrade) {
    if (phase !== "charging") return;

    const ringCount = isUpgrade ? 2 : 1;
    for (let i = 0; i < ringCount; i++) {
      const ripple = document.createElement("div");
      ripple.className = "build-tier-ring";
      ripple.style.borderColor = meta.color;
      ripple.style.boxShadow = `0 0 26px ${meta.glow}, inset 0 0 16px ${meta.glow}`;
      ripple.style.animationDelay = `${i * 0.1}s`;
      coreWrapper.appendChild(ripple);
      setTimeout(() => ripple.remove(), 750);
    }

    coreWrapper.classList.remove("tier-pulse");
    void coreWrapper.offsetWidth;
    coreWrapper.classList.add("tier-pulse");

    // Fire simultaneous bolts down all 4 screen-edge rails
    for (let r = 0; r < screenRails.length; r++) {
      spawnRailBolt(meta.color, r);
    }

    if (isUpgrade) {
      triggerChargeFlash(meta.color);
    }

    const burstCount = isUpgrade ? 14 : 7;
    for (let i = 0; i < burstCount; i++) {
      spawnChargeMote(meta.color);
    }

    if (isUpgrade && meta.rank >= 3) {
      stage.classList.remove("screen-shake");
      void stage.offsetWidth;
      stage.classList.add("screen-shake");
    }
  }

  // Trigger screen flash with custom color
  function triggerFlash(color, rank = 1) {
    flashLayer.style.setProperty("--peak-color", color);
    flashLayer.classList.remove("active", "long-flash", "charge-flash");
    void flashLayer.offsetWidth;
    if (rank >= 5) {
      flashLayer.classList.add("long-flash");
    } else {
      flashLayer.classList.add("active");
    }
  }

  // Extra spectacle for Mythic pulls: double shockwave + rotating rays
  function triggerMythicEffects() {
    overlay.querySelector(".build-mythic-sunburst")?.remove();

    const sunburst = document.createElement("div");
    sunburst.className = "build-mythic-sunburst";
    overlay.appendChild(sunburst);

    for (let i = 0; i < 2; i++) {
      const wave = document.createElement("div");
      wave.className = "build-shockwave";
      wave.style.animationDelay = `${i * 0.14}s`;
      stage.appendChild(wave);
      setTimeout(() => wave.remove(), 1550);
    }
  }

  // Spawn radial burst particles
  function spawnBurstParticles(meta, countOverride = null) {
    const particleCount =
      countOverride ?? (meta.rank >= 5 ? 42 : meta.rank >= 4 ? 30 : 18);
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement("span");
      p.className = "build-particle";
      const angle =
        (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.25;
      const dist = 100 + Math.random() * (meta.rank >= 5 ? 210 : 140);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const size = 4 + Math.random() * 5;

      p.style.setProperty("--dx", `${dx.toFixed(1)}px`);
      p.style.setProperty("--dy", `${dy.toFixed(1)}px`);
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = meta.color;
      p.style.boxShadow = `0 0 10px ${meta.color}`;
      stage.appendChild(p);
      setTimeout(() => p.remove(), 1450);
    }
  }

  // Render a single card in the 1-by-1 spotlight
  function renderSpotlightCard(idx) {
    lastStepTime = performance.now();
    const item = pulledItems[idx];
    const rarity = item.data?.rarity || "Common";
    const meta = BUILD_RARITY_META[rarity] || BUILD_RARITY_META.Common;

    spotlightCounter.textContent = `${idx + 1} / ${pulledItems.length}`;
    spotlightPrompt.textContent =
      idx === pulledItems.length - 1
        ? "Click anywhere to view summary"
        : "Click anywhere for next tower";

    spotlightCardSlot.replaceChildren(buildCardElement(item, 0, true));

    triggerFlash(meta.color, meta.rank);
    const particleCount =
      meta.rank >= 6 ? 75 : meta.rank >= 5 ? 45 : meta.rank >= 3 ? 22 : 10;
    spawnBurstParticles(meta, particleCount);

    if (meta.rank >= 6) {
      triggerMythicEffects();
    } else {
      overlay.querySelector(".build-mythic-sunburst")?.remove();
    }

    if (meta.rank >= 5) {
      stage.classList.remove("screen-shake", "mythic-shake");
      void stage.offsetWidth;
      stage.classList.add(meta.rank >= 6 ? "mythic-shake" : "screen-shake");
    }
  }

  // Enter 1-by-1 Spotlight Phase (10x Medium / Full mode)
  function startSpotlightSequence() {
    if (phase !== "charging") return;
    clearChargingLoops();
    phase = "spotlight";

    skipHint.remove();
    skipAllBtn.classList.remove("hidden");

    const firstRarity = pulledItems[0]?.data?.rarity || "Common";
    const firstMeta =
      BUILD_RARITY_META[firstRarity] || BUILD_RARITY_META.Common;
    triggerFlash(firstMeta.color, firstMeta.rank);
    coreWrapper.classList.add("burst-out");
    screenRig.classList.add("rig-burst");

    timers.push(
      setTimeout(() => {
        coreWrapper.remove();
        screenRig.remove();
        spotlightWrapper.classList.remove("hidden");
        spotlightIndex = 0;
        renderSpotlightCard(spotlightIndex);
      }, 180),
    );
  }

  // Enter Final Summary Grid Phase
  function showSummaryResults(instant = false) {
    if (phase === "revealed") return;
    clearChargingLoops();
    phase = "revealed";
    lastStepTime = performance.now();

    skipHint.remove();
    skipAllBtn.classList.add("hidden");
    spotlightWrapper.classList.add("hidden");

    triggerFlash(peakMeta.color, peakRank);
    spawnBurstParticles(peakMeta, peakRank >= 6 ? 75 : null);

    if (peakRank >= 6) {
      triggerMythicEffects();
    }

    if (peakRank >= 5) {
      stage.classList.remove("screen-shake", "mythic-shake");
      void stage.offsetWidth;
      stage.classList.add(peakRank >= 6 ? "mythic-shake" : "screen-shake");
    }

    if (instant) {
      coreWrapper.remove();
      screenRig.remove();
      resultsWrapper.classList.remove("hidden");
      resultsWrapper.classList.add("revealed");
      return;
    }

    coreWrapper.classList.add("burst-out");
    screenRig.classList.add("rig-burst");
    timers.push(
      setTimeout(() => {
        coreWrapper.remove();
        screenRig.remove();
        resultsWrapper.classList.remove("hidden");
        resultsWrapper.classList.add("revealed");
      }, 180),
    );
  }

  if (mode === "short") {
    triggerFlash(peakMeta.color, peakRank);
    spawnBurstParticles(peakMeta, peakRank >= 6 ? 75 : null);
    if (peakRank >= 6) {
      triggerMythicEffects();
    }
    if (peakRank >= 5) {
      stage.classList.add(peakRank >= 6 ? "mythic-shake" : "screen-shake");
    }
  } else {
    // Phase 1A: Boot-Up / Assembly Sequence (0ms -> 850ms)
    const assemblyDuration = 850;

    // Fly corner brackets in from screen edges once grid & rails appear
    timers.push(
      setTimeout(() => {
        if (phase !== "charging") return;
        screenRig.classList.remove("assembling");
      }, 180),
    );

    // Core orb ignition pulse at 540ms when the orb pops open
    timers.push(
      setTimeout(() => {
        if (phase !== "charging") return;
        triggerChargeFlash("#ffffff");
      }, 540),
    );

    // Phase 1B: Rarity Escalation Sequence (starts once rig is assembled)
    timers.push(
      setTimeout(() => {
        if (phase !== "charging") return;

        chargeLabel.textContent = isMulti
          ? `FABRICATING ${pulledItems.length}x ${category.toUpperCase()} TOWERS...`
          : `FABRICATING ${category.toUpperCase()} TOWER...`;

        const pulledRarities = new Set(
          pulledItems.map((item) => item.data?.rarity || "Common"),
        );
        const escalationSteps = BUILD_RARITY_STEPS.filter((r) =>
          pulledRarities.has(r),
        );
        if (escalationSteps.length === 0) {
          escalationSteps.push(peakRarity);
        }

        const totalChargeTime = 1750 + peakRank * 420;
        const stepInterval = totalChargeTime / escalationSteps.length;
        let activeColor = BUILD_RARITY_META[escalationSteps[0]].color;

        // Continuously pull energy motes inward while charging
        intervals.push(
          setInterval(() => {
            spawnChargeMote(activeColor);
          }, 45),
        );

        // Continuously fire energy bolts from the 4 edges of the screen into the core
        intervals.push(
          setInterval(() => {
            spawnRailBolt(activeColor);
          }, 110),
        );

        escalationSteps.forEach((rName, idx) => {
          const meta = BUILD_RARITY_META[rName];
          const progress =
            escalationSteps.length > 1 ? idx / (escalationSteps.length - 1) : 1;

          timers.push(
            setTimeout(() => {
              if (phase !== "charging") return;
              activeColor = meta.color;
              overlay.style.setProperty("--active-color", meta.color);
              overlay.style.setProperty("--active-glow", meta.glow);
              coreWrapper.style.setProperty("--core-color", meta.color);
              coreWrapper.style.setProperty("--core-glow", meta.glow);
              coreWrapper.dataset.rank = String(meta.rank);
              screenRig.style.setProperty("--rig-progress", progress.toFixed(2));
              screenRig.dataset.rank = String(meta.rank);

              if (idx >= 2 || meta.rank >= 3) {
                coreWrapper.classList.add("charging-intense");
              }

              triggerTierUpRipple(meta, idx > 0);
            }, idx * stepInterval),
          );
        });

        // Slam corner clamps & cinch rings right before the burst
        timers.push(
          setTimeout(() => {
            if (phase !== "charging") return;
            coreWrapper.classList.add("pre-burst");
            screenRig.classList.add("pre-burst");
          }, Math.max(0, totalChargeTime - 130)),
        );

        timers.push(
          setTimeout(() => {
            if (useOneByOne) {
              startSpotlightSequence();
            } else {
              showSummaryResults(false);
            }
          }, totalChargeTime + 120),
        );
      }, assemblyDuration),
    );
  }

  // Click handling across all phases
  overlay.addEventListener("click", (e) => {
    const now = performance.now();

    if (phase === "charging") {
      if (now - startTime < SKIP_LOCKOUT_MS) return;
      if (e.target.closest(".build-core-wrapper")) return;

      if (!skipArmed) {
        skipArmed = true;
        skipHint.textContent = "Click again to skip »";
        skipHint.classList.add("armed");
      } else {
        showSummaryResults(true);
      }
    } else if (phase === "spotlight") {
      if (now - lastStepTime < CARD_ADVANCE_DEBOUNCE_MS) return;
      spotlightIndex++;
      if (spotlightIndex < pulledItems.length) {
        renderSpotlightCard(spotlightIndex);
      } else {
        showSummaryResults(true);
      }
    } else if (phase === "revealed") {
      if (now - lastStepTime < SKIP_LOCKOUT_MS) return;
      closeBuildAnimationOverlay();
    }
  });

  // Keyboard support (Space / Enter / Escape)
  const keyHandler = (e) => {
    const now = performance.now();
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (phase === "charging") {
        if (now - startTime < SKIP_LOCKOUT_MS) return;
        if (!skipArmed) {
          skipArmed = true;
          skipHint.textContent = "Press again to skip »";
          skipHint.classList.add("armed");
        } else {
          showSummaryResults(true);
        }
      } else if (phase === "spotlight") {
        if (now - lastStepTime < CARD_ADVANCE_DEBOUNCE_MS) return;
        spotlightIndex++;
        if (spotlightIndex < pulledItems.length) {
          renderSpotlightCard(spotlightIndex);
        } else {
          showSummaryResults(true);
        }
      } else if (now - lastStepTime >= SKIP_LOCKOUT_MS) {
        closeBuildAnimationOverlay();
      }
    } else if (e.key === "Escape" && now - startTime >= SKIP_LOCKOUT_MS) {
      closeBuildAnimationOverlay();
    }
  };
  overlay._keyHandler = keyHandler;
  document.addEventListener("keydown", keyHandler);
}