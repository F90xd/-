"use strict";

/* ==========================================================================
   مجلس القمة للشحن — script.js
   Developer: F90
   ========================================================================== */

/* ============================== 1. البيانات الثابتة ============================== */

const VIP_TABLE = [
  { level: 1, total: 50000, upgrade: 50000, maintain: 30000 },
  { level: 2, total: 100000, upgrade: 50000, maintain: 30000 },
  { level: 3, total: 300000, upgrade: 100000, maintain: 90000 },
  { level: 4, total: 1000000, upgrade: 800000, maintain: 500000 },
  { level: 5, total: 3000000, upgrade: 2000000, maintain: 1300000 },
  { level: 6, total: 7000000, upgrade: 4000000, maintain: 2600000 },
  { level: 7, total: 14000000, upgrade: 7000000, maintain: 4500000 },
  { level: 8, total: 26000000, upgrade: 12000000, maintain: 7800000 },
  { level: 9, total: 42000000, upgrade: 16000000, maintain: 11000000 },
  { level: 10, total: 62000000, upgrade: 20000000, maintain: 14000000 },
  { level: 11, total: 102000000, upgrade: 40000000, maintain: 28000000 },
  { level: 12, total: 220000000, upgrade: 118000000, maintain: 83000000 },
  { level: 13, total: 430000000, upgrade: 210000000, maintain: 150000000 },
  { level: 14, total: 820000000, upgrade: 390000000, maintain: 310000000 },
  { level: 15, total: 1820000000, upgrade: 1000000000, maintain: 700000000 },
  { level: 16, total: 3820000000, upgrade: 2000000000, maintain: 1400000000 },
  { level: 17, total: 7382000000, upgrade: 3500000000, maintain: 3000000000 },
  { level: 18, total: 11882000000, upgrade: 4500000000, maintain: 4000000000 },
  { level: 19, total: 17382000000, upgrade: 5500000000, maintain: 5000000000 },
  { level: 20, total: 27382000000, upgrade: 10000000000, maintain: 9000000000 }
];

const STORAGE_KEY = "majlis_alqimma_vip_records_v5";
const THEME_KEY = "majlis_alqimma_theme";

const TARGET_JOD_RATE = 7;
const TARGET_USD_RATE = 10;
const GAMES_JOD_RATE = 6;
const GAMES_USD_RATE = 8;

const DEFAULTS = {
  currentVip: 10,
  targetVip: 11,
  multiplier: 5,
  supportRate: 130000,
  jodRate: 11,
  usdRate: 15
};

/* ============================== 2. أدوات مساعدة ============================== */

function $(id) {
  return document.getElementById(id);
}

function on(el, evt, handler) {
  if (el) el.addEventListener(evt, handler);
}

function getVipByLevel(level) {
  return VIP_TABLE.find(function (v) { return v.level === level; }) || null;
}

function sanitizeNumeric(value) {
  let v = String(value).replace(/[^0-9.,\-]/g, "");
  const negative = v.charAt(0) === "-";
  v = v.replace(/-/g, "");
  const dotIndex = v.indexOf(".");
  if (dotIndex !== -1) {
    v = v.slice(0, dotIndex + 1) + v.slice(dotIndex + 1).replace(/\./g, "");
  }
  if (negative) v = "-" + v;
  return v;
}

function parseNumber(value) {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}

function formatNumber(n) {
  if (!isFinite(n)) n = 0;
  return Math.round(n).toLocaleString("en-US");
}

function formatCurrency(n) {
  if (!isFinite(n)) n = 0;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function attachNumericSanitizer(el) {
  if (!el) return;
  el.addEventListener("input", function () {
    const cursor = el.selectionStart;
    const before = el.value;
    const cleaned = sanitizeNumeric(before);
    if (cleaned !== before) {
      el.value = cleaned;
      const diff = before.length - cleaned.length;
      const pos = Math.max(0, (cursor || cleaned.length) - diff);
      try { el.setSelectionRange(pos, pos); } catch (e) { /* ignore */ }
    }
  });
}

/* ============================== 3. الوضع الليلي / النهاري ============================== */

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const isLight = saved === "light";
  document.body.classList.toggle("light", isLight);
  updateThemeButton(isLight);
}

function updateThemeButton(isLight) {
  const icon = document.querySelector("#themeToggle .theme-icon");
  const text = document.querySelector("#themeToggle .theme-text");
  if (icon) icon.textContent = isLight ? "☀️" : "🌙";
  if (text) text.textContent = isLight ? "الوضع النهاري" : "الوضع الليلي";
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
  updateThemeButton(isLight);
}

/* ============================== 4. الأقسام القابلة للطي ============================== */

function initCollapsibles() {
  const headers = document.querySelectorAll(".collapsible-header");
  headers.forEach(function (header) {
    on(header, "click", function () {
      const targetId = header.getAttribute("data-target");
      const body = $(targetId);
      const arrow = document.querySelector('.toggle-arrow[data-arrow="' + targetId + '"]');
      if (!body) return;
      const isOpen = !body.classList.contains("hidden-body");
      if (isOpen) {
        body.classList.add("hidden-body");
        header.setAttribute("aria-expanded", "false");
        if (arrow) arrow.textContent = "⌄";
      } else {
        body.classList.remove("hidden-body");
        header.setAttribute("aria-expanded", "true");
        if (arrow) arrow.textContent = "⌃";
      }
    });
  });
}

function openCollapsible(targetId) {
  const body = $(targetId);
  const header = document.querySelector('.collapsible-header[data-target="' + targetId + '"]');
  const arrow = document.querySelector('.toggle-arrow[data-arrow="' + targetId + '"]');
  if (body) body.classList.remove("hidden-body");
  if (header) header.setAttribute("aria-expanded", "true");
  if (arrow) arrow.textContent = "⌃";
}

/* ============================== 5. بناء عناصر الواجهة الديناميكية ============================== */

function buildVipSelects() {
  const currentSel = $("currentVip");
  const targetSel = $("targetVip");
  if (currentSel) {
    currentSel.innerHTML = VIP_TABLE.map(function (v) {
      return '<option value="' + v.level + '">VIP ' + v.level + "</option>";
    }).join("");
    currentSel.value = String(DEFAULTS.currentVip);
  }
  if (targetSel) {
    targetSel.innerHTML = VIP_TABLE.map(function (v) {
      return '<option value="' + v.level + '">VIP ' + v.level + "</option>";
    }).join("");
    targetSel.value = String(DEFAULTS.targetVip);
  }
}

function buildVipTable() {
  const body = $("vipTableBody");
  if (!body) return;
  body.innerHTML = VIP_TABLE.map(function (v) {
    return "<tr>" +
      "<td>VIP " + v.level + "</td>" +
      "<td>" + formatNumber(v.total) + "</td>" +
      "<td>" + formatNumber(v.upgrade) + "</td>" +
      "<td>" + formatNumber(v.maintain) + "</td>" +
      "</tr>";
  }).join("");
}

/* ============================== 6. حسبة VIP الأساسية ============================== */

function currentMode() {
  const modeEl = $("vipMode");
  return modeEl ? modeEl.value : "reach";
}

function updateModeVisibility() {
  const mode = currentMode();
  const reachBox = $("reachModeBox");
  if (reachBox) reachBox.hidden = mode !== "reach";
}

function updateTargetLockVisibility() {
  const enabled = $("enableTargetLock");
  const box = $("targetLockBox");
  if (box) box.hidden = !(enabled && enabled.checked);
}

function calculateAll() {
  const currentVip = parseInt(($("currentVip") && $("currentVip").value) || DEFAULTS.currentVip, 10);
  const targetVip = parseInt(($("targetVip") && $("targetVip").value) || DEFAULTS.targetVip, 10);
  const multiplier = parseInt(($("multiplier") && $("multiplier").value) || DEFAULTS.multiplier, 10) || 1;
  const mode = currentMode();

  const currentData = getVipByLevel(currentVip);
  const targetData = getVipByLevel(targetVip);

  const transitionLine = $("transitionLine");
  if (transitionLine) {
    transitionLine.textContent = "VIP " + currentVip + " → VIP " + Math.min(currentVip + 1, 20);
  }

  updateModeVisibility();
  updateTargetLockVisibility();

  let reachPoints = 0;
  let lockPoints = 0;

  if (mode === "reach") {
    if (targetVip > currentVip) {
      const firstInput = $("firstTransitionInput");
      const firstValue = parseNumber(firstInput ? firstInput.value : 0);
      reachPoints = firstValue;
      for (let lvl = currentVip + 2; lvl <= targetVip; lvl++) {
        const data = getVipByLevel(lvl);
        if (data) reachPoints += data.upgrade;
      }
    }
    const enableTargetLock = $("enableTargetLock");
    if (enableTargetLock && enableTargetLock.checked && targetData) {
      lockPoints = targetData.maintain;
    }
    const lockLabel = $("targetLockLabel");
    const lockValue = $("targetLockValue");
    if (lockLabel) lockLabel.textContent = "VIP " + targetVip;
    if (lockValue) lockValue.textContent = targetData ? formatNumber(targetData.maintain) : "0";
  } else if (mode === "currentLock") {
    lockPoints = currentData ? currentData.maintain : 0;
  }

  const totalVipPoints = reachPoints + lockPoints;
  const actualCharge = multiplier > 0 ? totalVipPoints / multiplier : 0;

  const supportRate = parseNumber($("supportRate") ? $("supportRate").value : DEFAULTS.supportRate);
  const jodRate = parseNumber($("jodRate") ? $("jodRate").value : DEFAULTS.jodRate);
  const usdRate = parseNumber($("usdRate") ? $("usdRate").value : DEFAULTS.usdRate);

  const supportNeeded = (actualCharge / 1000000) * supportRate;
  const jodTotal = supportRate > 0 ? (supportNeeded / supportRate) * jodRate : 0;
  const usdTotal = supportRate > 0 ? (supportNeeded / supportRate) * usdRate : 0;

  setText("reachPoints", formatNumber(reachPoints));
  setText("lockPoints", formatNumber(lockPoints));
  setText("totalVipPoints", formatNumber(totalVipPoints));
  setText("supportNeeded", formatNumber(supportNeeded));
  setText("jodTotal", formatCurrency(jodTotal));
  setText("usdTotal", formatCurrency(usdTotal));

  setText("resultTransitionText", "VIP " + currentVip + " → VIP " + targetVip);
  setText("resultMultiplierBadge", "×" + multiplier);
  setText("resultActualCharge", formatNumber(actualCharge));

  setText("equationVip",
    formatNumber(reachPoints) + " + " + formatNumber(lockPoints) + " = " +
    formatNumber(totalVipPoints) + " ÷ " + multiplier + " = " + formatNumber(actualCharge)
  );
  setText("equationSupport",
    formatNumber(actualCharge) + " ÷ 1,000,000 × " + formatNumber(supportRate) + " = " + formatNumber(supportNeeded)
  );

  return {
    currentVip: currentVip,
    targetVip: targetVip,
    multiplier: multiplier,
    reachPoints: reachPoints,
    lockPoints: lockPoints,
    totalVipPoints: totalVipPoints,
    actualCharge: actualCharge,
    supportNeeded: supportNeeded,
    jodTotal: jodTotal,
    usdTotal: usdTotal
  };
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

/* ============================== 7. حاسبة التارجت وحاسبة الألعاب ============================== */

function calcTargetBox() {
  const input = $("targetInput");
  const value = parseNumber(input ? input.value : 0);
  const jod = (value / 100000) * TARGET_JOD_RATE;
  const usd = (value / 100000) * TARGET_USD_RATE;
  setText("targetJod", formatCurrency(jod));
  setText("targetUsd", formatCurrency(usd));
}

function calcGamesBox() {
  const input = $("gamesInput");
  const value = parseNumber(input ? input.value : 0);
  const jod = (value / 100000) * GAMES_JOD_RATE;
  const usd = (value / 100000) * GAMES_USD_RATE;
  setText("gamesJod", formatCurrency(jod));
  setText("gamesUsd", formatCurrency(usd));
}

/* ============================== 8. التخزين المحلي ============================== */

function getRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    /* ignore storage errors */
  }
}

function showClientStatus(message) {
  const el = $("clientStatus");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function saveCurrentOperation() {
  const clientNameEl = $("clientName");
  const clientIdEl = $("clientId");
  const clientName = clientNameEl ? clientNameEl.value.trim() : "";
  const clientId = clientIdEl ? clientIdEl.value.trim() : "";

  if (!clientName && !clientId) {
    showClientStatus("أدخل اسم العميل أو ID أولاً");
    return;
  }

  const result = calculateAll();
  const record = {
    id: "rec_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
    createdAt: new Date().toISOString(),
    clientName: clientName,
    clientId: clientId,
    currentVip: result.currentVip,
    targetVip: result.targetVip,
    multiplier: result.multiplier,
    reachPoints: result.reachPoints,
    lockPoints: result.lockPoints,
    totalVipPoints: result.totalVipPoints,
    actualCharge: result.actualCharge,
    supportNeeded: result.supportNeeded,
    jodTotal: result.jodTotal,
    usdTotal: result.usdTotal
  };

  const records = getRecords();
  records.push(record);
  saveRecords(records);

  showClientStatus("تم حفظ العملية بنجاح");
  renderHistory();
  renderStats();
}

/* ============================== 9. عرض السجل ============================== */

function formatDate(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

function renderHistory(filter) {
  const container = $("history");
  if (!container) return;
  const search = (filter || ($("historySearch") ? $("historySearch").value : "") || "").trim().toLowerCase();
  const records = getRecords().slice().reverse();

  const filtered = records.filter(function (r) {
    if (!search) return true;
    const name = (r.clientName || "").toLowerCase();
    const id = (r.clientId || "").toLowerCase();
    return name.indexOf(search) !== -1 || id.indexOf(search) !== -1;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p class="history-empty">لا توجد عمليات محفوظة حتى الآن</p>';
    return;
  }

  container.innerHTML = filtered.map(function (r) {
    const name = escapeHtml(r.clientName || "بدون اسم");
    const id = escapeHtml(r.clientId || "—");
    return '<div class="history-item">' +
      '<div class="history-item-top">' +
        '<span class="history-name">' + name + '</span>' +
        '<span class="history-date">' + escapeHtml(formatDate(r.createdAt)) + '</span>' +
      '</div>' +
      '<div class="history-meta">' +
        '<span>ID: ' + id + '</span>' +
        '<span>VIP ' + escapeHtml(r.currentVip) + ' → VIP ' + escapeHtml(r.targetVip) + '</span>' +
        '<span>×' + escapeHtml(r.multiplier) + '</span>' +
        '<span>الشحن: ' + formatNumber(r.actualCharge) + '</span>' +
      '</div>' +
      '<div class="history-actions">' +
        '<button type="button" class="restore-btn" data-action="restore" data-id="' + escapeHtml(r.id) + '">استرجاع</button>' +
        '<button type="button" class="delete-btn" data-action="delete" data-id="' + escapeHtml(r.id) + '">حذف</button>' +
      '</div>' +
    '</div>';
  }).join("");
}

function restoreRecord(id) {
  const records = getRecords();
  const record = records.find(function (r) { return r.id === id; });
  if (!record) return;

  if ($("clientName")) $("clientName").value = record.clientName || "";
  if ($("clientId")) $("clientId").value = record.clientId || "";
  if ($("currentVip")) $("currentVip").value = String(record.currentVip);
  if ($("targetVip")) $("targetVip").value = String(record.targetVip);
  if ($("multiplier")) $("multiplier").value = String(record.multiplier);

  const isCurrentLock = record.lockPoints > 0 && record.reachPoints === 0 &&
    getVipByLevel(record.currentVip) && getVipByLevel(record.currentVip).maintain === record.lockPoints;

  const modeEl = $("vipMode");
  if (modeEl) modeEl.value = isCurrentLock ? "currentLock" : "reach";

  if (!isCurrentLock) {
    let automaticSum = 0;
    for (let lvl = record.currentVip + 2; lvl <= record.targetVip; lvl++) {
      const data = getVipByLevel(lvl);
      if (data) automaticSum += data.upgrade;
    }
    const firstTransitionValue = Math.max(0, record.reachPoints - automaticSum);
    if ($("firstTransitionInput")) $("firstTransitionInput").value = firstTransitionValue ? String(firstTransitionValue) : "";

    const targetData = getVipByLevel(record.targetVip);
    const targetLockActive = targetData && record.lockPoints === targetData.maintain && record.lockPoints > 0;
    if ($("enableTargetLock")) $("enableTargetLock").checked = !!targetLockActive;
  } else {
    if ($("firstTransitionInput")) $("firstTransitionInput").value = "";
    if ($("enableTargetLock")) $("enableTargetLock").checked = false;
  }

  openCollapsible("clientBody");
  calculateAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteRecord(id) {
  const records = getRecords().filter(function (r) { return r.id !== id; });
  saveRecords(records);
  renderHistory();
  renderStats();
}

function clearAllHistory() {
  if (window.confirm("هل تريد حذف جميع العمليات؟")) {
    saveRecords([]);
    renderHistory();
    renderStats();
  }
}

/* ============================== 10. لوحة الإحصائيات ============================== */

function renderStats() {
  const records = getRecords();

  const totalOperations = records.length;
  const customerSet = new Set();
  let totalCharge = 0;
  let totalSupport = 0;
  let totalVipPoints = 0;
  let totalJod = 0;
  let totalUsd = 0;
  let highestVip = 0;

  records.forEach(function (r) {
    const key = ((r.clientId || "") + "|" + (r.clientName || "")).trim().toLowerCase();
    if (key !== "|") customerSet.add(key);
    totalCharge += Number(r.actualCharge) || 0;
    totalSupport += Number(r.supportNeeded) || 0;
    totalVipPoints += Number(r.totalVipPoints) || 0;
    totalJod += Number(r.jodTotal) || 0;
    totalUsd += Number(r.usdTotal) || 0;
    if (Number(r.targetVip) > highestVip) highestVip = Number(r.targetVip);
  });

  setText("statOperations", formatNumber(totalOperations));
  setText("statCustomers", formatNumber(customerSet.size));
  setText("statCharge", formatNumber(totalCharge));
  setText("statSupport", formatNumber(totalSupport));
  setText("statVipPoints", formatNumber(totalVipPoints));
  setText("statJod", formatCurrency(totalJod));
  setText("statUsd", formatCurrency(totalUsd));
  setText("statHighestVip", highestVip > 0 ? "VIP " + highestVip : "—");
}

/* ============================== 11. زر عملية جديدة ============================== */

function resetToDefaults() {
  if ($("clientName")) $("clientName").value = "";
  if ($("clientId")) $("clientId").value = "";
  if ($("currentVip")) $("currentVip").value = String(DEFAULTS.currentVip);
  if ($("targetVip")) $("targetVip").value = String(DEFAULTS.targetVip);
  if ($("multiplier")) $("multiplier").value = String(DEFAULTS.multiplier);
  if ($("vipMode")) $("vipMode").value = "reach";
  if ($("firstTransitionInput")) $("firstTransitionInput").value = "";
  if ($("enableTargetLock")) $("enableTargetLock").checked = false;
  if ($("supportRate")) $("supportRate").value = String(DEFAULTS.supportRate);
  if ($("jodRate")) $("jodRate").value = String(DEFAULTS.jodRate);
  if ($("usdRate")) $("usdRate").value = String(DEFAULTS.usdRate);
  if ($("targetInput")) $("targetInput").value = "";
  if ($("gamesInput")) $("gamesInput").value = "";

  const statusEl = $("clientStatus");
  if (statusEl) { statusEl.hidden = true; statusEl.textContent = ""; }

  calculateAll();
  calcTargetBox();
  calcGamesBox();
}

/* ============================== 12. النسخ إلى الحافظة ============================== */

function copyToClipboard(text, btn) {
  function onSuccess() {
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = "تم النسخ";
    btn.classList.add("copied");
    setTimeout(function () {
      btn.textContent = original === "تم النسخ" ? "نسخ" : original;
      btn.classList.remove("copied");
    }, 1500);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(function () {
      fallbackCopy(text, onSuccess);
    });
  } else {
    fallbackCopy(text, onSuccess);
  }
}

function fallbackCopy(text, callback) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    if (callback) callback();
  } catch (e) {
    /* ignore */
  }
}

function initCopyButtons() {
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    on(btn, "click", function () {
      const text = btn.getAttribute("data-copy") || "";
      copyToClipboard(text, btn);
    });
  });
}

/* ============================== 13. الأحداث الرئيسية ============================== */

function initCalculationEvents() {
  const changeInputs = ["currentVip", "targetVip", "multiplier", "vipMode", "enableTargetLock", "supportRate", "jodRate", "usdRate"];
  changeInputs.forEach(function (id) {
    const el = $(id);
    if (!el) return;
    const evt = (el.tagName === "SELECT" || el.type === "checkbox") ? "change" : "input";
    on(el, evt, calculateAll);
  });

  on($("firstTransitionInput"), "input", calculateAll);

  on($("calculateBtn"), "click", calculateAll);
  on($("saveBtn"), "click", saveCurrentOperation);
  on($("newBtn"), "click", resetToDefaults);

  on($("targetInput"), "input", calcTargetBox);
  on($("gamesInput"), "input", calcGamesBox);

  attachNumericSanitizer($("firstTransitionInput"));
  attachNumericSanitizer($("supportRate"));
  attachNumericSanitizer($("jodRate"));
  attachNumericSanitizer($("usdRate"));
  attachNumericSanitizer($("targetInput"));
  attachNumericSanitizer($("gamesInput"));
}

function initHistoryEvents() {
  on($("historySearch"), "input", function () {
    renderHistory($("historySearch").value);
  });
  on($("clearHistory"), "click", clearAllHistory);

  const historyContainer = $("history");
  if (historyContainer) {
    historyContainer.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      if (action === "restore") restoreRecord(id);
      if (action === "delete") deleteRecord(id);
    });
  }
}

function initThemeEvents() {
  on($("themeToggle"), "click", toggleTheme);
}

/* ============================== 14. التهيئة العامة ============================== */

function init() {
  initTheme();
  buildVipSelects();
  buildVipTable();
  initCollapsibles();
  initCalculationEvents();
  initHistoryEvents();
  initThemeEvents();
  initCopyButtons();

  if ($("currentVip")) $("currentVip").value = String(DEFAULTS.currentVip);
  if ($("targetVip")) $("targetVip").value = String(DEFAULTS.targetVip);
  if ($("multiplier")) $("multiplier").value = String(DEFAULTS.multiplier);

  calculateAll();
  calcTargetBox();
  calcGamesBox();
  renderHistory();
  renderStats();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
