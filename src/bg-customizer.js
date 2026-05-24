import { loadScheme, saveScheme, applyToDom, syncToCloud, loadFromCloud } from "./scheme-store.js";

// ─── Presets ────────────────────────────────────────────────────────────────
const PRESETS = {
  aurora: {
    label: "Aurora",
    css: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
  },
  midnight: {
    label: "Midnight",
    css: "linear-gradient(135deg,#000000,#1a1a2e,#16213e)",
  },
  ember: {
    label: "Ember",
    css: "linear-gradient(135deg,#1a0000,#3d0000,#7b1717)",
  },
  ocean: {
    label: "Ocean",
    css: "linear-gradient(135deg,#001220,#003459,#007ea7)",
  },
  forest: {
    label: "Forest",
    css: "linear-gradient(135deg,#0a1a0a,#1b3a1b,#2d5a27)",
  },
  neon: {
    label: "Neon City",
    css: "linear-gradient(135deg,#0d0221,#190b28,#3d0366)",
  },
  sunset: {
    label: "Sunset",
    css: "linear-gradient(135deg,#1a0533,#6b0f1a,#b91c4e)",
  },
  slate: {
    label: "Slate",
    css: "linear-gradient(135deg,#0f1117,#1c1f26,#2a2d36)",
  },
};

// ─── State ───────────────────────────────────────────────────────────────────
let scheme = loadScheme();
let modalOpen = false;

// ─── DOM refs (populated in init) ────────────────────────────────────────────
let bgLayer, bgImage, bgOverlay, modal, backdrop;

// ─── 1. renderBackground ─────────────────────────────────────────────────────
function renderBackground(s) {
  if (!bgImage) return;

  if (s.bgMode === "upload" && s.uploadedB64) {
    bgImage.style.backgroundImage = `url(${s.uploadedB64})`;
  } else {
    const preset = PRESETS[s.presetId] || PRESETS.aurora;
    bgImage.style.backgroundImage = preset.css;
  }

  bgImage.style.backgroundSize = s.bgFit;
  bgImage.style.backgroundPosition = "center";
  bgImage.style.opacity = s.bgOpacity / 100;
  bgImage.style.filter = [
    `brightness(${s.bgBrightness / 100})`,
    `saturate(${s.bgSaturation / 100})`,
    `blur(${s.bgBlur}px)`,
  ].join(" ");

  applyToDom(s);
}

// ─── 2. buildCustomizerUI ────────────────────────────────────────────────────
function buildCustomizerUI(s) {
  const presetButtons = Object.entries(PRESETS)
    .map(
      ([id, p]) => `
    <button
      class="ahs-preset-btn ${s.presetId === id && s.bgMode === "preset" ? "active" : ""}"
      data-preset="${id}"
      style="background:${p.css}"
      title="${p.label}"
    >
      <span class="ahs-preset-label">${p.label}</span>
    </button>`
    )
    .join("");

  return `
  <div class="ahs-studio-header">
    <h2 class="ahs-studio-title">🎨 Background Studio</h2>
    <button class="ahs-close-btn" id="ahsCloseBtn" aria-label="Close">✕</button>
  </div>

  <div class="ahs-studio-body">

    <!-- Mode tabs -->
    <div class="ahs-mode-tabs">
      <button class="ahs-tab-btn ${s.bgMode === "preset" ? "active" : ""}" data-mode="preset">Gradients</button>
      <button class="ahs-tab-btn ${s.bgMode === "upload" ? "active" : ""}" data-mode="upload">Upload Image</button>
    </div>

    <!-- Preset grid -->
    <div class="ahs-section" id="ahsPresetSection" style="display:${s.bgMode === "preset" ? "block" : "none"}">
      <div class="ahs-preset-grid">${presetButtons}</div>
    </div>

    <!-- Upload section -->
    <div class="ahs-section" id="ahsUploadSection" style="display:${s.bgMode === "upload" ? "block" : "none"}">
      <label class="ahs-upload-label" for="ahsImageInput">
        <span class="ahs-upload-icon">📁</span>
        <span>${s.uploadedB64 ? "Image loaded — click to change" : "Click to upload an image"}</span>
        <input type="file" id="ahsImageInput" accept="image/*" style="display:none">
      </label>
      ${
        s.uploadedB64
          ? `<div class="ahs-upload-preview" style="background-image:url(${s.uploadedB64})"></div>`
          : ""
      }
    </div>

    <!-- Sliders -->
    <div class="ahs-sliders">

      <div class="ahs-slider-row">
        <label class="ahs-slider-label">
          Opacity <span class="ahs-slider-val" id="valOpacity">${s.bgOpacity}</span>%
        </label>
        <input type="range" id="slOpacity" min="0" max="100" value="${s.bgOpacity}" class="ahs-range">
      </div>

      <div class="ahs-slider-row">
        <label class="ahs-slider-label">
          Brightness <span class="ahs-slider-val" id="valBrightness">${s.bgBrightness}</span>%
        </label>
        <input type="range" id="slBrightness" min="10" max="150" value="${s.bgBrightness}" class="ahs-range">
      </div>

      <div class="ahs-slider-row">
        <label class="ahs-slider-label">
          Saturation <span class="ahs-slider-val" id="valSaturation">${s.bgSaturation}</span>%
        </label>
        <input type="range" id="slSaturation" min="0" max="200" value="${s.bgSaturation}" class="ahs-range">
      </div>

      <div class="ahs-slider-row">
        <label class="ahs-slider-label">
          Blur <span class="ahs-slider-val" id="valBlur">${s.bgBlur}</span>px
        </label>
        <input type="range" id="slBlur" min="0" max="20" value="${s.bgBlur}" class="ahs-range">
      </div>

      <div class="ahs-slider-row">
        <label class="ahs-slider-label">
          Tab Tint Opacity <span class="ahs-slider-val" id="valTabOp">${s.tabOpacity}</span>%
        </label>
        <input type="range" id="slTabOp" min="0" max="100" value="${s.tabOpacity}" class="ahs-range">
      </div>

      <div class="ahs-slider-row">
        <label class="ahs-slider-label">Tab Tint Color</label>
        <input type="color" id="pkTabTint" value="${s.tabTintColor}" class="ahs-color-picker">
      </div>

    </div>

    <!-- Fit -->
    <div class="ahs-fit-row">
      <label class="ahs-slider-label">Image Fit</label>
      <div class="ahs-fit-btns">
        ${["cover", "contain", "fill"].map(
          (f) =>
            `<button class="ahs-fit-btn ${s.bgFit === f ? "active" : ""}" data-fit="${f}">${f}</button>`
        ).join("")}
      </div>
    </div>

    <!-- Actions -->
    <div class="ahs-actions">
      <button class="ahs-btn-secondary" id="ahsResetBtn">Reset to Defaults</button>
      <button class="ahs-btn-primary" id="ahsSaveBtn">Save & Apply</button>
    </div>

  </div>`;
}

// ─── 3. injectStyles ─────────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById("ahs-customizer-styles")) return;
  const style = document.createElement("style");
  style.id = "ahs-customizer-styles";
  style.textContent = `
    /* ── Floating trigger button ── */
    #ahsBgStudioBtn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9998;
      background: rgba(var(--tint-rgb,48,43,99), 0.85);
      backdrop-filter: blur(10px);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 50px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      transition: transform .2s, box-shadow .2s;
      letter-spacing: .03em;
    }
    #ahsBgStudioBtn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }

    /* ── Backdrop ── */
    #ahsBackdrop {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      opacity: 0;
      transition: opacity .25s;
      pointer-events: none;
    }
    #ahsBackdrop.open { opacity: 1; pointer-events: all; }

    /* ── Modal ── */
    #ahsModal {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -46%);
      z-index: 10000;
      width: min(480px, 95vw);
      max-height: 88vh;
      background: rgba(12,10,24,0.95);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.7);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      opacity: 0;
      pointer-events: none;
      transition: opacity .25s, transform .25s;
    }
    #ahsModal.open {
      opacity: 1;
      pointer-events: all;
      transform: translate(-50%, -50%);
    }

    /* ── Header ── */
    .ahs-studio-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 20px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }
    .ahs-studio-title {
      font-size: 18px; font-weight: 700; color: #fff; margin: 0;
    }
    .ahs-close-btn {
      background: rgba(255,255,255,0.08);
      border: none; color: #aaa; border-radius: 50%;
      width: 32px; height: 32px; cursor: pointer; font-size: 15px;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s;
    }
    .ahs-close-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }

    /* ── Body ── */
    .ahs-studio-body {
      overflow-y: auto; padding: 18px 20px 20px;
      display: flex; flex-direction: column; gap: 16px;
    }

    /* ── Mode tabs ── */
    .ahs-mode-tabs {
      display: flex; gap: 8px;
    }
    .ahs-tab-btn {
      flex: 1; padding: 8px; border-radius: 10px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #aaa; font-size: 13px; font-weight: 500; cursor: pointer;
      transition: background .15s, color .15s, border-color .15s;
    }
    .ahs-tab-btn.active, .ahs-tab-btn:hover {
      background: rgba(var(--tint-rgb,48,43,99), 0.6);
      color: #fff; border-color: rgba(255,255,255,0.2);
    }

    /* ── Preset grid ── */
    .ahs-preset-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
    }
    .ahs-preset-btn {
      height: 60px; border-radius: 10px; border: 2px solid transparent;
      cursor: pointer; position: relative; overflow: hidden;
      transition: transform .15s, border-color .15s;
    }
    .ahs-preset-btn:hover { transform: scale(1.04); }
    .ahs-preset-btn.active { border-color: #fff; }
    .ahs-preset-label {
      position: absolute; bottom: 4px; left: 0; right: 0;
      text-align: center; font-size: 10px; font-weight: 600;
      color: rgba(255,255,255,0.9); text-shadow: 0 1px 4px rgba(0,0,0,0.8);
    }

    /* ── Upload ── */
    .ahs-upload-label {
      display: flex; align-items: center; gap: 10px;
      padding: 14px; border-radius: 12px;
      border: 2px dashed rgba(255,255,255,0.2);
      color: #aaa; font-size: 13px; cursor: pointer;
      transition: border-color .15s;
    }
    .ahs-upload-label:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
    .ahs-upload-icon { font-size: 20px; }
    .ahs-upload-preview {
      height: 80px; border-radius: 10px; margin-top: 8px;
      background-size: cover; background-position: center;
    }

    /* ── Sliders ── */
    .ahs-sliders { display: flex; flex-direction: column; gap: 12px; }
    .ahs-slider-row { display: flex; flex-direction: column; gap: 5px; }
    .ahs-slider-label {
      font-size: 12px; color: #aaa; font-weight: 500;
      display: flex; justify-content: space-between;
    }
    .ahs-slider-val { color: #fff; font-weight: 700; }
    .ahs-range {
      width: 100%; accent-color: var(--tint, #302b63); cursor: pointer;
    }
    .ahs-color-picker {
      width: 48px; height: 32px; border: none; border-radius: 8px;
      cursor: pointer; padding: 0;
    }

    /* ── Fit ── */
    .ahs-fit-row { display: flex; align-items: center; gap: 12px; }
    .ahs-fit-btns { display: flex; gap: 6px; }
    .ahs-fit-btn {
      padding: 5px 12px; border-radius: 8px; font-size: 12px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #aaa; cursor: pointer;
      transition: background .15s, color .15s;
    }
    .ahs-fit-btn.active, .ahs-fit-btn:hover {
      background: rgba(var(--tint-rgb,48,43,99),0.5);
      color: #fff; border-color: rgba(255,255,255,0.2);
    }

    /* ── Actions ── */
    .ahs-actions {
      display: flex; gap: 10px; padding-top: 4px;
    }
    .ahs-btn-primary, .ahs-btn-secondary {
      flex: 1; padding: 11px; border-radius: 12px;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: opacity .15s, transform .15s;
    }
    .ahs-btn-primary:hover, .ahs-btn-secondary:hover { opacity: .85; transform: translateY(-1px); }
    .ahs-btn-primary {
      background: var(--tint, #302b63);
      border: 1px solid rgba(255,255,255,0.18); color: #fff;
    }
    .ahs-btn-secondary {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12); color: #ccc;
    }

    /* ── Section ── */
    .ahs-section { }
  `;
  document.head.appendChild(style);
}

// ─── 4. injectBgLayer ────────────────────────────────────────────────────────
function injectBgLayer() {
  if (document.getElementById("ahs-bg-layer")) {
    bgLayer  = document.getElementById("ahs-bg-layer");
    bgImage  = document.getElementById("ahs-bg-image");
    bgOverlay = document.getElementById("ahs-bg-overlay");
    return;
  }
  bgLayer = document.createElement("div");
  bgLayer.id = "ahs-bg-layer";

  bgImage = document.createElement("div");
  bgImage.id = "ahs-bg-image";

  bgOverlay = document.createElement("div");
  bgOverlay.id = "ahs-bg-overlay";

  bgLayer.appendChild(bgImage);
  bgLayer.appendChild(bgOverlay);
  document.body.prepend(bgLayer);
}

// ─── 5. openBgStudio / closeBgStudio ─────────────────────────────────────────
function openBgStudio() {
  if (modalOpen) return;
  modal.innerHTML = buildCustomizerUI(scheme);
  modal.classList.add("open");
  backdrop.classList.add("open");
  modalOpen = true;
  bindControls();
}

function closeBgStudio() {
  modal.classList.remove("open");
  backdrop.classList.remove("open");
  modalOpen = false;
}

// ─── 6. bindControls ─────────────────────────────────────────────────────────
function bindControls() {
  // Close button
  document.getElementById("ahsCloseBtn")?.addEventListener("click", closeBgStudio);

  // Mode tabs
  document.querySelectorAll(".ahs-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      scheme.bgMode = btn.dataset.mode;
      const isPreset = scheme.bgMode === "preset";
      document.getElementById("ahsPresetSection").style.display = isPreset ? "block" : "none";
      document.getElementById("ahsUploadSection").style.display = isPreset ? "none" : "block";
      document.querySelectorAll(".ahs-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderBackground(scheme);
    });
  });

  // Preset buttons
  document.querySelectorAll(".ahs-preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      scheme.presetId = btn.dataset.preset;
      scheme.bgMode = "preset";
      document.querySelectorAll(".ahs-preset-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderBackground(scheme);
    });
  });

  // Image upload
  document.getElementById("ahsImageInput")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      scheme.uploadedB64 = ev.target.result;
      scheme.bgMode = "upload";
      renderBackground(scheme);
      // Refresh upload section to show preview
      const sec = document.getElementById("ahsUploadSection");
      if (sec) {
        sec.querySelector(".ahs-upload-label span:last-child").textContent =
          "Image loaded — click to change";
        let prev = sec.querySelector(".ahs-upload-preview");
        if (!prev) {
          prev = document.createElement("div");
          prev.className = "ahs-upload-preview";
          sec.appendChild(prev);
        }
        prev.style.backgroundImage = `url(${scheme.uploadedB64})`;
      }
    };
    reader.readAsDataURL(file);
  });

  // Sliders helper
  function wireSlider(id, valId, key, suffix = "") {
    const el = document.getElementById(id);
    const valEl = document.getElementById(valId);
    if (!el) return;
    el.addEventListener("input", () => {
      scheme[key] = Number(el.value);
      if (valEl) valEl.textContent = el.value;
      renderBackground(scheme);
    });
  }

  wireSlider("slOpacity",    "valOpacity",    "bgOpacity");
  wireSlider("slBrightness", "valBrightness", "bgBrightness");
  wireSlider("slSaturation", "valSaturation", "bgSaturation");
  wireSlider("slBlur",       "valBlur",       "bgBlur");
  wireSlider("slTabOp",      "valTabOp",      "tabOpacity");

  // Color picker
  document.getElementById("pkTabTint")?.addEventListener("input", (e) => {
    scheme.tabTintColor = e.target.value;
    renderBackground(scheme);
  });

  // Fit buttons
  document.querySelectorAll(".ahs-fit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      scheme.bgFit = btn.dataset.fit;
      document.querySelectorAll(".ahs-fit-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderBackground(scheme);
    });
  });

  // Save
  document.getElementById("ahsSaveBtn")?.addEventListener("click", () => {
    saveScheme(scheme);
    const btn = document.getElementById("ahsSaveBtn");
    btn.textContent = "✓ Saved!";
    setTimeout(() => (btn.textContent = "Save & Apply"), 1500);
    // Cloud sync (pass userId from your auth system if available)
    const userId = window.__AHS_USER_ID || null;
    if (userId) syncToCloud(userId, scheme);
  });

  // Reset
  document.getElementById("ahsResetBtn")?.addEventListener("click", () => {
    const DEFAULT = {
      presetId: "aurora", bgMode: "preset", uploadedB64: null,
      bgOpacity: 100, bgBrightness: 85, bgSaturation: 100,
      bgBlur: 0, bgFit: "cover", tabTintColor: "#302b63", tabOpacity: 75,
    };
    scheme = { ...DEFAULT };
    modal.innerHTML = buildCustomizerUI(scheme);
    renderBackground(scheme);
    bindControls();
  });
}

// ─── 7. createTriggerButton ───────────────────────────────────────────────────
function createTriggerButton() {
  if (document.getElementById("ahsBgStudioBtn")) return;
  const btn = document.createElement("button");
  btn.id = "ahsBgStudioBtn";
  btn.textContent = "🎨 Background";
  btn.addEventListener("click", openBgStudio);
  document.body.appendChild(btn);
}

// ─── 8. init ─────────────────────────────────────────────────────────────────
async function init() {
  injectStyles();
  injectBgLayer();

  // Try cloud load first
  const userId = window.__AHS_USER_ID || null;
  if (userId) {
    const cloud = await loadFromCloud(userId);
    if (cloud) scheme = { ...scheme, ...cloud };
  }

  renderBackground(scheme);

  // Create backdrop
  backdrop = document.createElement("div");
  backdrop.id = "ahsBackdrop";
  backdrop.addEventListener("click", closeBgStudio);
  document.body.appendChild(backdrop);

  // Create modal
  modal = document.createElement("div");
  modal.id = "ahsModal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  document.body.appendChild(modal);

  // Floating trigger button
  createTriggerButton();

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOpen) closeBgStudio();
  });
}

document.addEventListener("DOMContentLoaded", init);
