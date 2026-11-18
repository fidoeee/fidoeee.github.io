function getMaxUpgrades(unit) {
  if (!unit) return Infinity;
  const rarity = unit.rarity || getUnitData(unit)?.rarity || "Common";
  const cap =
    typeof RARITY_UPGRADE_CAPS !== "undefined"
      ? RARITY_UPGRADE_CAPS[rarity]
      : undefined;
  return Number.isFinite(cap) ? cap : Infinity;
}

function isMaxUpgraded(unit) {
  if (!unit) return false;
  return (unit.upgradeCount ?? 0) >= getMaxUpgrades(unit);
}

function setUiOverhaulMode(enabled) {
  uiOverhaulMode = Boolean(enabled);
  const checkbox = document.getElementById("toggle-overhaul-checkbox");
  if (checkbox && checkbox.checked !== uiOverhaulMode) {
    checkbox.checked = uiOverhaulMode;
  }
  document.body.classList.toggle("ui-overhaul", uiOverhaulMode);
  saveCampaignProgress();
}

function isValidCustomBgDataUrl(str) {
  return (
    typeof str === "string" &&
    /^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/i.test(
      str.trim(),
    )
  );
}

function formatFrostTier(val) {
  if (val <= 30) return "Clear";
  if (val <= 70) return "Balanced";
  return "Frosted";
}

function compressCustomBg(
  file,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.82,
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image file"));
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxWidth / width, maxHeight / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // WebP is smaller & faster; falls back to JPEG automatically if unsupported
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const customBgInput = document.getElementById("glass-custom-bg-input");
const customBgClear = document.getElementById("glass-custom-bg-clear");

if (customBgInput) {
  customBgInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressCustomBg(file);
      liquidGlassSettings.customBg = compressedDataUrl;
      applyLiquidGlassMode(true, liquidGlassSettings);
      saveCampaignProgress();
    } catch (err) {
      console.error("Custom background error:", err);
    } finally {
      customBgInput.value = "";
    }
  });
}

if (customBgClear) {
  customBgClear.addEventListener("click", () => {
    liquidGlassSettings.customBg = "";
    applyLiquidGlassMode(liquidGlassMode, liquidGlassSettings);
    saveCampaignProgress();
  });
}

function applyLiquidGlassMode(enabled, settings = liquidGlassSettings) {
  liquidGlassMode = Boolean(enabled);
  liquidGlassSettings = {
    customBg: isValidCustomBgDataUrl(settings.customBg)
      ? settings.customBg.trim()
      : "",
    customBgBlur: Math.max(0, Math.min(30, Number(settings.customBgBlur) ?? 0)),
    mainOpacity: Math.max(0, Math.min(100, Number(settings.mainOpacity) ?? 25)),
    mainBlur: Math.max(0, Math.min(30, Number(settings.mainBlur) ?? 8)),
    unitBorderOpacity: Math.max(
      0,
      Math.min(100, Number(settings.unitBorderOpacity) ?? 75),
    ),
    unitBorderBlur: Math.max(
      0,
      Math.min(24, Number(settings.unitBorderBlur) ?? 8),
    ),
    popupOpacity: Math.max(
      0,
      Math.min(100, Number(settings.popupOpacity) ?? 35),
    ),
    popupBlur: Math.max(0, Math.min(30, Number(settings.popupBlur) ?? 12)),
    bgOpacity: Math.max(0, Math.min(100, Number(settings.bgOpacity) ?? 30)),
    bgBlur: Math.max(0, Math.min(30, Number(settings.bgBlur) ?? 0)),
    mainBorderOpacity: Math.max(
      0,
      Math.min(100, Number(settings.mainBorderOpacity) ?? 20),
    ),
    mainBorderBlur: Math.max(
      0,
      Math.min(24, Number(settings.mainBorderBlur) ?? 4),
    ),
    popupBorderOpacity: Math.max(
      0,
      Math.min(100, Number(settings.popupBorderOpacity) ?? 35),
    ),
    popupBorderBlur: Math.max(
      0,
      Math.min(24, Number(settings.popupBorderBlur) ?? 8),
    ),
    hue: Math.max(0, Math.min(360, Number(settings.hue) ?? 215)),
    saturation: Math.max(0, Math.min(100, Number(settings.saturation) ?? 0)),
    tint: Math.max(0, Math.min(100, Number(settings.tint) ?? 0)),
    gloss: Math.max(0, Math.min(100, Number(settings.gloss) ?? 50)),
  };

  const s = liquidGlassSettings;
  document.body.classList.toggle("liquid-glass", liquidGlassMode);
  document.body.style.setProperty(
    "--glass-main-alpha",
    (s.mainOpacity / 100).toFixed(2),
  );
  document.body.style.setProperty("--glass-main-blur", `${s.mainBlur}px`);
  document.body.style.setProperty(
    "--glass-unit-border-alpha",
    (s.unitBorderOpacity / 100).toFixed(2),
  );
  document.body.style.setProperty(
    "--glass-unit-border-blur",
    `${s.unitBorderBlur}px`,
  );
  document.body.style.setProperty(
    "--glass-popup-alpha",
    (s.popupOpacity / 100).toFixed(2),
  );
  document.body.style.setProperty("--glass-popup-blur", `${s.popupBlur}px`);
  document.body.style.setProperty(
    "--glass-bg-alpha",
    (s.bgOpacity / 100).toFixed(2),
  );
  document.body.style.setProperty("--glass-bg-blur", `${s.bgBlur}px`);
  document.body.style.setProperty(
    "--glass-main-border-alpha",
    (s.mainBorderOpacity / 100).toFixed(2),
  );
  document.body.style.setProperty(
    "--glass-main-border-blur",
    `${s.mainBorderBlur}px`,
  );
  document.body.style.setProperty(
    "--glass-popup-border-alpha",
    (s.popupBorderOpacity / 100).toFixed(2),
  );
  document.body.style.setProperty(
    "--glass-popup-border-blur",
    `${s.popupBorderBlur}px`,
  );
  document.body.style.setProperty("--glass-hue", `${s.hue}deg`);
  document.body.style.setProperty("--glass-saturation", `${s.saturation}%`);
  document.body.style.setProperty("--glass-tint", `${s.tint}%`);
  document.body.style.setProperty("--glass-gloss", (s.gloss / 100).toFixed(2));
  document.body.style.setProperty(
    "--glass-custom-bg",
    s.customBg ? `url("${s.customBg}")` : "none",
  );
  document.body.style.setProperty(
    "--glass-custom-bg-blur",
    `${s.customBgBlur}px`,
  );

  document.body.classList.toggle(
    "glass-no-main-blur",
    liquidGlassMode && s.mainBlur === 0,
  );
  document.body.classList.toggle(
    "glass-no-popup-blur",
    liquidGlassMode && s.popupBlur === 0,
  );

  if (liquidGlassCheckbox) {
    liquidGlassCheckbox.checked = liquidGlassMode;
  }

  const slidersWrap = document.getElementById("liquid-glass-sliders");
  if (slidersWrap) {
    slidersWrap.hidden = !liquidGlassMode;
  }

  const sliderBindings = [
    ["glass-main-opacity", s.mainOpacity, "%"],
    ["glass-main-blur", s.mainBlur, "px"],
    ["glass-unit-border-opacity", s.unitBorderOpacity, "%"],
    ["glass-unit-border-blur", s.unitBorderBlur, "px"],
    ["glass-popup-opacity", s.popupOpacity, "%"],
    ["glass-popup-blur", s.popupBlur, "px"],
    ["glass-bg-opacity", s.bgOpacity, "%"],
    ["glass-bg-blur", s.bgBlur, "px"],
    ["glass-main-border-opacity", s.mainBorderOpacity, "%"],
    ["glass-main-border-blur", s.mainBorderBlur, "px"],
    ["glass-popup-border-opacity", s.popupBorderOpacity, "%"],
    ["glass-popup-border-blur", s.popupBorderBlur, "px"],
    ["glass-hue", s.hue, "°"],
    ["glass-saturation", s.saturation, "%"],
    ["glass-tint", s.tint, "%"],
    ["glass-gloss", s.gloss, "%"],
    ["glass-custom-bg-blur", s.customBgBlur, "px"],
  ];

  for (const [prefix, val, unit] of sliderBindings) {
    const input = document.getElementById(`${prefix}-slider`);
    const badge = document.getElementById(`${prefix}-value`);
    if (input) input.value = String(val);
    if (badge) badge.textContent = `${val}${unit}`;
  }
}

function formatTimeAway(ms) {
  if (!Number.isFinite(ms) || ms < 60000) return "Just now";

  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);

  return `${parts.join(" ")} ago`;
}

function openWelcomeBackModal() {
  document.getElementById("welcome-back-overlay")?.remove();

  const savedRaw = JSON.parse(
    localStorage.getItem(getSaveKey(currentSaveSlot)) || "null",
  );
  const savedTime = savedRaw?.lastPlayedAt ?? savedRaw?.timestamp ?? null;

  const now = new Date();
  const formattedClock = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const timeAwayText = savedTime
    ? `Last active: ${formatTimeAway(Date.now() - savedTime)}`
    : "Fresh Command Session";

  const allTowers = [
    ...inventory,
    ...deployedUnits.filter((u) => u !== null),
    ...deployedBaseUnits.filter((u) => u !== null),
  ];
  const peakLevel =
    allTowers.length > 0 ? Math.max(...allTowers.map((u) => u.level || 1)) : 1;

  const stageLabel =
    currentCampaignTabMode === "challenge"
      ? `Challenge ${selectedChallengeStageId}`
      : `Stage ${selectedStageId}`;

  const overlay = document.createElement("div");
  overlay.id = "welcome-back-overlay";
  overlay.className = "unit-popup-overlay";
  overlay.style.zIndex = "100002";

  const modal = document.createElement("div");
  modal.className = "unit-popup";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.style.maxWidth = "440px";
  modal.style.width = "92%";
  modal.style.borderTop = "4px solid #3b82f6";

  const header = document.createElement("div");
  header.className = "unit-popup-header";
  header.style.alignItems = "flex-start";

  const titleWrap = document.createElement("div");

  const title = document.createElement("h2");
  title.textContent = savedTime
    ? "👋 Welcome Back, Commander!"
    : "🛡️ Welcome, Commander!";
  title.style.margin = "0";

  const sub = document.createElement("p");
  sub.className = "unit-popup-subtitle";
  sub.textContent = `${formattedDate} · ${formattedClock}  |  ${timeAwayText}`;
  sub.style.margin = "4px 0 0 0";

  titleWrap.append(title, sub);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "unit-popup-close";
  closeBtn.textContent = "×";

  header.append(titleWrap, closeBtn);

  const grid = document.createElement("div");
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin: 16px 0 20px 0;
  `;

  const stats = [
    { label: "Active Save", value: `Slot ${currentSaveSlot}` },
    { label: "Current Stage", value: stageLabel },
    {
      label: "Resources",
      value: `${formatGameNumber(gold)} Gold · ${formatGameNumber(st)} ST`,
    },
    {
      label: "Inventory",
      value: `${inventory.length} / ${MAX_INVENTORY_CAP} (${allTowers.length} Total)`,
    },
    { label: "Highest Tower", value: `Level ${peakLevel}` },
    { label: "Base Integrity", value: `${baseHealth} / ${maxBaseHealth} HP` },
  ];

  for (const item of stats) {
    const card = document.createElement("div");
    card.style.cssText = `
      background: rgba(15, 23, 42, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 8px;
      padding: 8px 12px;
    `;

    const lbl = document.createElement("div");
    lbl.textContent = item.label;
    lbl.style.fontSize = "0.75rem";
    lbl.style.opacity = "0.75";

    const val = document.createElement("div");
    val.textContent = item.value;
    val.style.fontWeight = "bold";
    val.style.fontSize = "0.95rem";
    val.style.marginTop = "2px";

    card.append(lbl, val);
    grid.appendChild(card);
  }

  const footer = document.createElement("div");
  footer.style.display = "flex";
  footer.style.justifyContent = "flex-end";

  const continueBtn = document.createElement("button");
  continueBtn.type = "button";
  continueBtn.textContent = "Resume Command";
  continueBtn.style.cssText = `
    padding: 9px 20px;
    font-weight: bold;
    cursor: pointer;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 6px;
  `;

  const closeModal = () => {
    document.removeEventListener("keydown", keyHandler);
    overlay.remove();
  };

  const keyHandler = (e) => {
    if (e.key === "Escape" || e.key === "Enter") {
      e.preventDefault();
      closeModal();
    }
  };

  closeBtn.addEventListener("click", closeModal);
  continueBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", keyHandler);

  footer.appendChild(continueBtn);
  modal.append(header, grid, footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  continueBtn.focus();
}

let toastTimeout = null;
let activeToastMessage = "";

function showToast(message, type = "error", duration = 2500, shouldLog = true) {
  const isSameActiveToast =
    toastTimeout !== null && activeToastMessage === message;

  if (!isSameActiveToast && shouldLog && typeof addLog === "function") {
    addLog(message);
  }

  const styles = {
    error: {
      bg: "rgba(127, 29, 29, 0.8)",
      text: "#fca5a5dd",
      border: "rgba(248, 113, 113, 0.7)",
    },
    warning: {
      bg: "rgba(120, 53, 15, 0.7)",
      text: "#fde68add",
      border: "rgba(245, 158, 11, 0.6)",
    },
    success: {
      bg: "rgba(20, 83, 45, 0.7)",
      text: "#86efacdd",
      border: "rgba(74, 222, 128, 0.6)",
    },
    info: {
      bg: "rgba(30, 41, 59, 0.7)",
      text: "#e2e8f0dd",
      border: "rgba(100, 116, 139, 0.6)",
    },
  };
  const theme = styles[type] || styles.info;

  let toast = document.getElementById("game-notice-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "game-notice-toast";
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 0.95rem;
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
      z-index: 100000;
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.12s ease;
    `;
    document.body.appendChild(toast);
  }

  if (isSameActiveToast) {
    toast.style.transform = "translateX(-50%) scale(1.04)";
    setTimeout(() => {
      toast.style.transform = "translateX(-50%) scale(1)";
    }, 120);
  } else {
    toast.style.background = theme.bg;
    toast.style.color = theme.text;
    toast.style.border = `1px solid ${theme.border}`;
    toast.textContent = message;
    activeToastMessage = message;
  }

  toast.style.opacity = "1";

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    toastTimeout = null;
    activeToastMessage = "";
  }, duration);
}

function showGameModal({
  title = "Notice",
  message = "",
  type = "info", // "danger" | "warning" | "info"
  confirmText = "OK",
  cancelText = null, // Leave null for an alert-style popup; pass "Cancel" for confirm-style
  closeOnBackdrop = true,
  inputValue = null, // Pass a string (e.g. "" or JSON) to enable text intake
  inputPlaceholder = "",
  showCopy = false,
  extraButtons = [],
} = {}) {
  return new Promise((resolve) => {
    document.getElementById("custom-game-modal-overlay")?.remove();

    const hasInput = inputValue !== null;
    const accentColors = {
      danger: "#ef4444",
      warning: "#f59e0b",
      info: "#3b82f6",
    };
    const accent = accentColors[type] || accentColors.info;

    const overlay = document.createElement("div");
    overlay.id = "custom-game-modal-overlay";
    overlay.className = "unit-popup-overlay";
    overlay.style.zIndex = "100001";

    const modal = document.createElement("div");
    modal.className = "unit-popup";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.style.maxWidth = hasInput ? "460px" : "420px";
    modal.style.width = "90%";
    modal.style.borderTop = `4px solid ${accent}`;

    const header = document.createElement("div");
    header.className = "unit-popup-header";

    const heading = document.createElement("h2");
    heading.textContent = title;
    heading.style.margin = "0";
    heading.style.color = type === "danger" ? "#fca5a5" : "";

    header.appendChild(heading);

    const body = document.createElement("p");
    body.textContent = message;
    body.style.margin = hasInput ? "14px 0 10px 0" : "14px 0 20px 0";
    body.style.lineHeight = "1.5";
    body.style.whiteSpace = "pre-line";

    let textarea = null;
    if (hasInput) {
      textarea = document.createElement("textarea");
      textarea.value = String(inputValue);
      textarea.placeholder = inputPlaceholder;
      textarea.rows = 4;
      textarea.spellcheck = false;
      textarea.style.cssText = `
        width: 100%;
        box-sizing: border-box;
        margin-bottom: 18px;
        padding: 10px;
        border-radius: 6px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(15, 23, 42, 0.65);
        color: inherit;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.8rem;
        line-height: 1.4;
        resize: vertical;
      `;
    }

    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "flex-end";
    footer.style.alignItems = "center";
    footer.style.gap = "10px";

    const cleanup = (confirmed) => {
      document.removeEventListener("keydown", keyHandler);
      const result = hasInput
        ? confirmed
          ? (textarea?.value ?? "")
          : null
        : Boolean(confirmed);
      overlay.remove();
      resolve(result);
    };

    const keyHandler = (e) => {
      if (e.key === "Escape") cleanup(false);
      if (e.key === "Enter" && (!hasInput || e.ctrlKey || e.metaKey)) {
        cleanup(true);
      }
    };
    document.addEventListener("keydown", keyHandler);

    if (hasInput && showCopy) {
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.textContent = "Copy";
      copyBtn.style.padding = "8px 14px";
      copyBtn.style.cursor = "pointer";
      copyBtn.style.marginRight = "auto";
      copyBtn.addEventListener("click", async () => {
        if (!textarea) return;
        try {
          await navigator.clipboard.writeText(textarea.value);
        } catch {
          textarea.select();
          document.execCommand("copy");
        }
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = "Copy";
        }, 1200);
      });
      footer.appendChild(copyBtn);
    }

    for (const btnCfg of extraButtons) {
      const extraBtn = document.createElement("button");
      extraBtn.type = "button";
      extraBtn.textContent = btnCfg.text;
      extraBtn.style.padding = "8px 14px";
      extraBtn.style.cursor = "pointer";
      if (!showCopy && extraBtn === footer.firstChild) {
        extraBtn.style.marginRight = "auto";
      }
      extraBtn.addEventListener("click", () =>
        btnCfg.onClick?.({ textarea, close: cleanup }),
      );
      footer.appendChild(extraBtn);
    }

    if (cancelText) {
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.textContent = cancelText;
      cancelBtn.style.padding = "8px 16px";
      cancelBtn.style.cursor = "pointer";
      cancelBtn.addEventListener("click", () => cleanup(false));
      footer.appendChild(cancelBtn);
    }

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.textContent = confirmText;
    confirmBtn.style.padding = "8px 18px";
    confirmBtn.style.fontWeight = "bold";
    confirmBtn.style.cursor = "pointer";
    confirmBtn.style.background = accent;
    confirmBtn.style.color = "#fff";
    confirmBtn.style.border = "none";
    confirmBtn.style.borderRadius = "6px";
    confirmBtn.addEventListener("click", () => cleanup(true));
    footer.appendChild(confirmBtn);

    if (closeOnBackdrop) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanup(false);
      });
    }

    if (textarea) {
      modal.append(header, body, textarea, footer);
    } else {
      modal.append(header, body, footer);
    }
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    if (textarea) {
      textarea.focus();
      if (textarea.value) textarea.select();
    } else {
      confirmBtn.focus();
    }
  });
}

function syncOptionCheckboxes() {
  const optionMap = [
    { id: "toggle-clear-popup-checkbox", val: showClearPopup },
    { id: "toggle-backline-cooldown-checkbox", val: showBacklineCooldown },
    { id: "toggle-frontline-cooldown-checkbox", val: showFrontlineCooldown },
    { id: "toggle-swap-layout-checkbox", val: swapDeploymentLayout },
    { id: "toggle-simplified-log-checkbox", val: simplifyBattleLog },
    { id: "toggle-hide-maxed-tech-checkbox", val: hideMaxedTech },
    { id: "toggle-unpin-topbar-checkbox", val: unpinTopBar },
    { id: "toggle-overhaul-checkbox", val: uiOverhaulMode },
    { id: "toggle-liquid-glass-checkbox", val: liquidGlassMode },
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
      showToast(
        `⚠️ ${getUnitName(unit)} is FATIGUED! (70% Damage & 90% Reward Penalty).`,
        "warning",
        2500,
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

function formatCombatNumber(num) {
  if (!Number.isFinite(num)) return "0";
  const rounded = Math.round(num);
  const abs = Math.abs(rounded);

  // Exact integer up to 9,999 (keeps Armor & early/mid HP 100% accurate)
  if (abs < 1e4) {
    return rounded.toLocaleString();
  }

  const tiers = [
    { value: 1e12, suffix: "T" },
    { value: 1e9, suffix: "B" },
    { value: 1e6, suffix: "M" },
    { value: 1e3, suffix: "K" },
  ];

  for (const { value, suffix } of tiers) {
    if (abs >= value) {
      const scaled = rounded / value;
      const absScaled = Math.abs(scaled);
      // Always 4 significant digits -> max 6 characters (e.g. 2.145M, 24.58M, 245.8M)
      const decimals = absScaled >= 100 ? 1 : absScaled >= 10 ? 2 : 3;
      return scaled.toFixed(decimals) + suffix;
    }
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
    showToast("🛑 Auto-Repeat canceled by manual action.", "warning", 2500);

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

/* =====================================================================
    EXPANSIONS TABS / QUICK DEPLOY
===================================================================== */

let pendingSlotTarget = null; // { lane: "main" | "base", slotIndex: number }
let selectedDeployUnitId = null;

function togglePanelExpand(panelSelector, buttonEl, onToggle = null) {
  const panel = document.querySelector(panelSelector);
  if (!panel) return;

  const isExpanding = !panel.classList.contains("expanded");

  document.querySelectorAll(".panel.expanded").forEach((p) => {
    if (p !== panel) p.classList.remove("expanded");
  });

  panel.classList.toggle("expanded", isExpanding);
  document.body.classList.toggle("no-scroll", isExpanding);

  if (buttonEl) {
    buttonEl.textContent = isExpanding ? "Collapse" : "→";
  }

  if (typeof onToggle === "function") onToggle(isExpanding);
}

function handleBattleExpandToggle(isExpanded) {
  const campaignPanel = document.querySelector(".campaign-panel");
  const deployPanel = document.querySelector(".deployment-panel");
  const campaignSlot = document.getElementById("battle-drawer-campaign-slot");
  const deploySlot = document.getElementById("battle-drawer-deploy-slot");
  const campaignDrawer = document.getElementById("battle-campaign-drawer");
  const campaignBtn = document.getElementById("toggle-battle-campaign-btn");

  const battleTab = document.getElementById("battle-tab");
  const enemiesTab = document.getElementById("enemies-tab");
  const statsTab = document.getElementById("stats-tab");
  const deploySidebar = document.getElementById("battle-deploy-sidebar");

  if (isExpanded) {
    if (battleTab) battleTab.hidden = false;
    if (enemiesTab) enemiesTab.hidden = false;
    if (statsTab) {
      statsTab.hidden = false;
      statsTab.style.zIndex = "1";
    }
    if (deploySidebar) {
      deploySidebar.style.position = "relative";
      deploySidebar.style.zIndex = "30";
    }
    if (typeof renderEnemyList === "function") renderEnemyList();
    if (typeof renderStatsList === "function") renderStatsList();

    if (campaignPanel && campaignSlot) {
      campaignSlot.appendChild(campaignPanel);
      campaignPanel.style.position = "relative";
      campaignPanel.style.zIndex = "20";
      campaignPanel.style.pointerEvents = "auto";
    }
    if (deployPanel && deploySlot) {
      deploySlot.appendChild(deployPanel);
      deploySlot.style.position = "relative";
      deploySlot.style.zIndex = "20";
      deploySlot.style.pointerEvents = "auto";
      deployPanel.style.position = "relative";
      deployPanel.style.zIndex = "20";
      deployPanel.style.pointerEvents = "auto";
    }
  } else {
    if (campaignDrawer) campaignDrawer.classList.add("hidden");
    if (campaignBtn) campaignBtn.textContent = "🗺️ Campaign ▼";

    const mainEl = document.querySelector("main");
    const leftCol = document.querySelector(".left-column");
    if (campaignPanel && mainEl) {
      campaignPanel.style.position = "";
      campaignPanel.style.zIndex = "";
      campaignPanel.style.pointerEvents = "";
      mainEl.prepend(campaignPanel);
    }
    if (deployPanel && leftCol) {
      deployPanel.style.position = "";
      deployPanel.style.zIndex = "";
      deployPanel.style.pointerEvents = "";
      leftCol.appendChild(deployPanel);
    }
    if (statsTab) statsTab.style.zIndex = "";
    if (deploySidebar) {
      deploySidebar.style.position = "";
      deploySidebar.style.zIndex = "";
    }
    if (
      typeof showBattleTab === "function" &&
      typeof currentBattleTab !== "undefined"
    ) {
      showBattleTab(currentBattleTab);
    }
  }

  syncEnterStageButtonPlacement();
  applyDeploymentLayoutOptions();
}

function initBattleFocusControls() {
  const expandBtn = document.getElementById("toggle-battle-expand-btn");
  const campaignBtn = document.getElementById("toggle-battle-campaign-btn");
  const campaignDrawer = document.getElementById("battle-campaign-drawer");
  const deployBtn = document.getElementById("toggle-battle-deploy-btn");
  const deploySidebar = document.getElementById("battle-deploy-sidebar");

  if (expandBtn) {
    expandBtn.addEventListener("click", () => {
      togglePanelExpand(".battle-panel", expandBtn, handleBattleExpandToggle);
    });
  }

  if (campaignBtn && campaignDrawer) {
    campaignBtn.addEventListener("click", () => {
      const isHidden = campaignDrawer.classList.toggle("hidden");
      campaignBtn.textContent = isHidden ? "🗺️ Campaign ▼" : "🗺️ Campaign ▲";
    });
  }

  if (deployBtn && deploySidebar) {
    deployBtn.addEventListener("click", () => {
      const isCollapsed = deploySidebar.classList.toggle("collapsed");
      deployBtn.textContent = isCollapsed ? "🛡️ Deploy ▶" : "🛡️ Deploy ◀";
    });
  }

  initSlotDeployModal();
  initSlotClickDelegation();
}

function initSlotClickDelegation() {
  // Uses your global `slots` and `baseSlotsContainer` containers
  const wireContainer = (containerEl, lane) => {
    if (!containerEl) return;
    containerEl.addEventListener("click", (e) => {
      if (e.target.closest("button, select, option")) return;

      const slotEl = e.target.closest(".slot");
      if (!slotEl || !containerEl.contains(slotEl)) return;

      const allSlots = Array.from(
        containerEl.querySelectorAll(":scope > .slot"),
      );
      const slotIndex = allSlots.indexOf(slotEl);
      if (slotIndex !== -1) {
        openSlotDeployModal(lane, slotIndex);
      }
    });
  };

  if (typeof slots !== "undefined") wireContainer(slots, "main");
  if (typeof baseSlotsContainer !== "undefined")
    wireContainer(baseSlotsContainer, "base");
}

function initSlotDeployModal() {
  const overlay = document.getElementById("slot-deploy-overlay");
  const closeBtn = document.getElementById("close-slot-deploy-btn");
  const confirmBtn = document.getElementById("confirm-slot-deploy-btn");
  const recallBtn = document.getElementById("recall-slot-deploy-btn");

  if (!overlay) return;

  const closeModal = () => {
    overlay.classList.add("hidden");
    pendingSlotTarget = null;
    selectedDeployUnitId = null;
  };

  closeBtn?.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  confirmBtn?.addEventListener("click", () => {
    if (!pendingSlotTarget || !selectedDeployUnitId) return;
    const { lane, slotIndex } = pendingSlotTarget;

    // Calls your existing deploy functions (adjust function name if yours is named slightly differently)
    if (lane === "main" && typeof deployUnit === "function") {
      deployUnit(selectedDeployUnitId, slotIndex);
    } else if (lane === "base" && typeof deployBaseUnit === "function") {
      deployBaseUnit(selectedDeployUnitId, slotIndex);
    }
    closeModal();
  });

  recallBtn?.addEventListener("click", () => {
    if (!pendingSlotTarget) return;
    const { lane, slotIndex } = pendingSlotTarget;

    if (lane === "main" && typeof undeployUnit === "function") {
      undeployUnit(slotIndex);
    } else if (lane === "base" && typeof undeployBaseUnit === "function") {
      undeployBaseUnit(slotIndex);
    }
    closeModal();
  });
}

function syncEnterStageButtonPlacement() {
  const isBattleExpanded =
    document.querySelector(".battle-panel.expanded") !== null;

  const startWaveBtn = document.getElementById("start-wave");
  const stageDetailsActions = document.querySelector(
    "#stage-details .stage-action-buttons",
  );

  // Grab the Enter and Exit buttons from #stage-details
  const stageEnterBtn = stageDetailsActions
    ? stageDetailsActions.querySelector(".stage-play-btn")
    : null;
  const stageExitBtn = stageDetailsActions
    ? stageDetailsActions.querySelector(
        ".stage-exit-btn, button:not(.stage-play-btn)",
      )
    : null;

  if (!startWaveBtn) return;

  const battleControls = startWaveBtn.parentElement;

  // Helper to sync a single button from #stage-details into battleControls
  const syncButton = (selector, sourceBtn, anchorEl) => {
    const moved = Array.from(battleControls.querySelectorAll(selector));
    while (moved.length > 1) moved.pop().remove();
    const existing = moved[0];

    if (isBattleExpanded) {
      if (existing && sourceBtn) {
        existing.textContent = sourceBtn.textContent;
        existing.disabled = sourceBtn.disabled;
        existing.className = sourceBtn.className;
        existing.style.display = sourceBtn.style.display;
        sourceBtn.remove();
      } else if (!existing && sourceBtn && anchorEl) {
        anchorEl.insertAdjacentElement("beforebegin", sourceBtn);
      }
      return battleControls.querySelector(selector);
    } else {
      moved.forEach((btn) => {
        if (
          stageDetailsActions &&
          !stageDetailsActions.querySelector(selector)
        ) {
          stageDetailsActions.appendChild(btn);
        } else {
          btn.remove();
        }
      });
      return null;
    }
  };

  // 1. Place Enter World directly to the left of Start Wave
  const activeEnterBtn = syncButton(
    ".stage-play-btn",
    stageEnterBtn,
    startWaveBtn,
  );

  // 2. Place Exit directly to the left of Enter World
  const activeExitBtn = syncButton(
    ".stage-exit-btn",
    stageExitBtn,
    activeEnterBtn || startWaveBtn,
  );

  // Hide (or disable) the Exit button when not actively in a stage
  if (activeExitBtn) {
    activeExitBtn.style.display = stageEntered ? "" : "none";
  }

  // 3. Update the Base Health pill in the battle header
  syncBattleHeaderBaseHealth(isBattleExpanded);
}

function syncBattleHeaderBaseHealth(isBattleExpanded) {
  const battleHeader = document.querySelector(
    ".battle-panel .panel-header, .battle-header",
  );
  if (!battleHeader) return;

  let hpBadge = document.getElementById("battle-header-base-hp");

  if (!isBattleExpanded) {
    if (hpBadge) hpBadge.style.display = "none";
    return;
  }

  if (!hpBadge) {
    hpBadge = document.createElement("span");
    hpBadge.id = "battle-header-base-hp";
    hpBadge.style.cssText =
      "margin-left: auto; margin-right: 10px; font-size: 0.85rem; font-weight: 600; color: #f87171; background: rgba(248, 113, 113, 0.12); border: 1px solid rgba(248, 113, 113, 0.35); padding: 2px 8px; border-radius: 6px; white-space: nowrap;";

    // Insert right before the ticks / expand controls on the right side of the header
    const headerControls =
      battleHeader.querySelector(".battle-header-controls, .panel-controls") ||
      battleHeader.lastElementChild;

    if (headerControls && headerControls !== battleHeader) {
      battleHeader.insertBefore(hpBadge, headerControls);
    } else {
      battleHeader.appendChild(hpBadge);
    }
  }

  hpBadge.style.display = "inline-flex";

  // Uses your global baseHealth / maxBaseHealth variables (falls back safely if named slightly differently)
  const curHp =
    typeof baseHealth !== "undefined" ? Math.max(0, Math.ceil(baseHealth)) : 0;
  const maxHp =
    typeof maxBaseHealth !== "undefined" ? Math.ceil(maxBaseHealth) : 100;
  hpBadge.textContent = `Base HP: ${curHp} / ${maxHp}`;
}

let quickDeployTarget = null;
let wasBattleExpandedBeforeQuickDeploy = false;
let quickDeployOriginalParent = null;
let quickDeployOriginalNextSibling = null;
let preQuickDeployFilter = null;

function openSlotDeployModal(slotType, slotIndex) {
  if (stageEntered || isBattleRunning()) return;

  quickDeployTarget = { slotType, slotIndex };

  // 1. Save previous filter, force required category, and lock the filter button
  if (preQuickDeployFilter === null) {
    preQuickDeployFilter = inventoryFilter;
  }
  const requiredCategory = slotType === "main" ? "Main" : "Rear";
  inventoryFilter = requiredCategory;
  if (inventoryFilterButton) {
    inventoryFilterButton.textContent = `Filter: ${inventoryFilter} 🔒`;
    inventoryFilterButton.disabled = true;
  }
  if (inventoryTitleBtn) {
    inventoryTitleBtn.disabled = true;
  }

  // 2. Switch to Inventory tab if currently on Warehouse
  if (currentInventoryTab === "warehouse") {
    currentInventoryTab = "inventory";
    if (inventoryTitleBtn) inventoryTitleBtn.textContent = "Inventory ⇄";
    if (inventoryFilterButton) inventoryFilterButton.disabled = false;
    if (inventorySortSelect) inventorySortSelect.disabled = false;
    if (inventorySortOrderButton) inventorySortOrderButton.disabled = false;
  }

  // 3. Remember if Battle Panel was expanded
  const battlePanel = document.querySelector(".battle-panel");
  wasBattleExpandedBeforeQuickDeploy = Boolean(
    battlePanel && battlePanel.classList.contains("expanded"),
  );

  // 4. Portal inventory-panel to document.body so it escapes <main> stacking contexts
  const inventoryPanel = document.querySelector(".inventory-panel");
  if (inventoryPanel) {
    if (inventoryPanel.parentNode !== document.body) {
      quickDeployOriginalParent = inventoryPanel.parentNode;
      quickDeployOriginalNextSibling = inventoryPanel.nextSibling;
      document.body.appendChild(inventoryPanel);
    }

    inventoryPanel.classList.add("expanded");
    inventoryPanel.style.position = "fixed";
    inventoryPanel.style.inset = "0";
    inventoryPanel.style.zIndex = "100005";
    document.body.classList.add("no-scroll");

    if (toggleInventoryButton) {
      toggleInventoryButton.textContent = "Collapse";
    }
  }

  // 5. Show banner & render full inventory
  renderQuickDeployBanner();
  renderInventory();
}

function closeQuickDeployView() {
  quickDeployTarget = null;
  const banner = document.getElementById("quick-deploy-banner");
  if (banner) banner.remove();

  // Restore previous filter & unlock filter/tab buttons
  if (preQuickDeployFilter !== null) {
    inventoryFilter = preQuickDeployFilter;
    preQuickDeployFilter = null;
  }
  if (inventoryFilterButton) {
    inventoryFilterButton.textContent = `Filter: ${inventoryFilter}`;
    inventoryFilterButton.disabled = currentInventoryTab === "warehouse";
  }
  if (inventoryTitleBtn) {
    inventoryTitleBtn.disabled = false;
  }

  const inventoryPanel = document.querySelector(".inventory-panel");
  if (inventoryPanel) {
    inventoryPanel.classList.remove("expanded");
    inventoryPanel.style.position = "";
    inventoryPanel.style.inset = "";
    inventoryPanel.style.zIndex = "";

    if (quickDeployOriginalParent) {
      quickDeployOriginalParent.insertBefore(
        inventoryPanel,
        quickDeployOriginalNextSibling,
      );
      quickDeployOriginalParent = null;
      quickDeployOriginalNextSibling = null;
    }

    if (toggleInventoryButton) {
      toggleInventoryButton.textContent = "→";
    }
  }

  if (!wasBattleExpandedBeforeQuickDeploy) {
    document.body.classList.remove("no-scroll");
  }
  wasBattleExpandedBeforeQuickDeploy = false;

  renderInventory();
}

function renderQuickDeployBanner() {
  let banner = document.getElementById("quick-deploy-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "quick-deploy-banner";
    banner.style.cssText =
      "display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;margin-bottom:8px;background:#1e293b;border:1px solid #38bdf8;border-radius:8px;color:#f8fafc;font-size:0.9rem;";
    const grid =
      document.getElementById("inventory-list") ||
      document.getElementById("inventory-grid");
    if (grid && grid.parentNode) {
      grid.parentNode.insertBefore(banner, grid);
    }
  }

  const label =
    quickDeployTarget.slotType === "main"
      ? `Main Slot ${quickDeployTarget.slotIndex + 1}`
      : `Base Slot ${quickDeployTarget.slotIndex + 1}`;

  const currentArray =
    quickDeployTarget.slotType === "main" ? deployedUnits : deployedBaseUnits;
  const equippedUnit = currentArray[quickDeployTarget.slotIndex];
  const equippedName = equippedUnit ? getUnitName(equippedUnit) : "";

  banner.innerHTML = `
    <span>
      Select a unit for <strong>${label}</strong>
      ${equippedUnit ? `<em style="color:#94a3b8;">(Equipped: ${equippedName})</em>` : ""}
    </span>
    <div style="display:flex;align-items:center;gap:8px;">
      ${
        equippedUnit
          ? `<button id="quick-deploy-recall-btn" type="button" style="padding:4px 10px;background:#7f1d1d;color:#fecaca;border:1px solid #ef4444;border-radius:6px;cursor:pointer;font-weight:600;">Recall</button>`
          : ""
      }
      <button id="quick-deploy-cancel-btn" type="button" style="padding:4px 10px;background:#334155;color:#fff;border:1px solid #475569;border-radius:6px;cursor:pointer;">Cancel</button>
    </div>
  `;

  const recallBtn = document.getElementById("quick-deploy-recall-btn");
  if (recallBtn) {
    recallBtn.onclick = () => {
      if (quickDeployTarget.slotType === "main") {
        undeployUnit(quickDeployTarget.slotIndex);
      } else {
        undeployBaseUnit(quickDeployTarget.slotIndex);
      }
      closeQuickDeployView();
    };
  }

  document.getElementById("quick-deploy-cancel-btn").onclick =
    closeQuickDeployView;
}

function executeQuickDeploy(unit) {
  if (!quickDeployTarget || !unit) return;

  const { slotType, slotIndex } = quickDeployTarget;

  // If slot is occupied, recall the existing unit first so Quick-Deploy can swap it cleanly
  if (slotType === "main") {
    if (deployedUnits[slotIndex] !== null) undeployUnit(slotIndex);
    deployUnit(unit.id, slotIndex);
  } else {
    if (deployedBaseUnits[slotIndex] !== null) undeployBaseUnit(slotIndex);
    deployBaseUnit(unit.id, slotIndex);
  }

  closeQuickDeployView();
}

function applyDeploymentLayoutOptions() {
  // Respect swapDeploymentLayout ("Show Back Above Main") in both normal & expanded views
  const mainSlotsRow = slots
    ? slots.closest(".main-deployment-row") || slots
    : null;
  const baseSlotsRow = baseSlotsContainer
    ? baseSlotsContainer.closest(".base-deployment-row") || baseSlotsContainer
    : null;

  if (
    baseSlotsRow &&
    mainSlotsRow &&
    mainSlotsRow.parentNode &&
    mainSlotsRow.parentNode === baseSlotsRow.parentNode
  ) {
    const parent = mainSlotsRow.parentNode;
    if (swapDeploymentLayout) {
      parent.insertBefore(baseSlotsRow, mainSlotsRow);
    } else {
      parent.insertBefore(mainSlotsRow, baseSlotsRow);
    }
  }
}
