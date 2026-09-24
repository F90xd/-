Enter"use strict";

// VIP Table Configuration
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

// Constants
const STORAGE_KEY = "majlis_alqimma_vip_records_v5";
const THEME_KEY = "majlis_alqimma_theme";

const TARGET_JOD_RATE = 7;
const TARGET_USD_RATE = 10;
const GAMES_JOD_RATE = 6;
const GAMES_USD_RATE = 8;

// DOM Helpers
function getEl(id) {
    return document.getElementById(id);
}

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

function cleanNumberInput(value) {
    if (!value) return '';
    let cleaned = value.toString().replace(/[^\d.-]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
}

function parseNumber(value) {
    const cleaned = cleanNumberInput(value);
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function formatNum(num) {
    return (num || 0).toLocaleString("en-US");
}

function formatCurrency(num) {
    return (num || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Global Application State
let records = [];
let currentCalculation = {};

// Initialize App
document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    populateVipDropdowns();
    renderVipTable();
    loadRecords();
    setupEventListeners();
    resetToDefaults();
    calculateAll();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light') {
        document.body.classList.add('light');
    }
}

function toggleTheme() {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
}

// Populate VIP Select Options
function populateVipDropdowns() {
    const currentSelect = getEl("currentVip");
    const targetSelect = getEl("targetVip");

    currentSelect.innerHTML = "";
    targetSelect.innerHTML = "";

    VIP_TABLE.forEach(item => {
        const opt1 = document.createElement("option");
        opt1.value = item.level;
        opt1.textContent = `VIP ${item.level}`;
        currentSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = item.level;
        opt2.textContent = `VIP ${item.level}`;
        targetSelect.appendChild(opt2);
    });

    currentSelect.value = "10";
    targetSelect.value = "11";
}

// Render Static VIP Reference Table
function renderVipTable() {
    const tbody = getEl("vipTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    VIP_TABLE.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>VIP ${item.level}</strong></td>
            <td>${formatNum(item.total)}</td>
            <td>${formatNum(item.upgrade)}</td>
            <td>${formatNum(item.maintain)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Theme Switch
    getEl("themeToggle").addEventListener("click", toggleTheme);

    // Collapsible Sections
    document.querySelectorAll(".toggle-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            const targetId = this.getAttribute("data-target");
            const targetEl = getEl(targetId);
            if (targetEl) {
                targetEl.classList.toggle("collapsed");
                this.textContent = targetEl.classList.contains("collapsed") ? "⌄" : "⌃";
            }
        });
    });

    // Inputs for Auto-Calculation
    const calcInputs = [
        "currentVip", "targetVip", "multiplier", "vipMode", 
        "firstTransitionInput", "enableTargetLock", "supportRate", 
        "jodRate", "usdRate"
    ];

    calcInputs.forEach(id => {
        const el = getEl(id);
        if (el) {
            el.addEventListener("change", calculateAll);
            el.addEventListener("input", calculateAll);
        }
    });

    // Clean Numeric Input formatting dynamically
    ["supportRate", "jodRate", "usdRate", "firstTransitionInput"].forEach(id => {
        const el = getEl(id);
        if (el) {
            el.addEventListener("blur", function () {
                const val = parseNumber(this.value);
                if (id === "supportRate" || id === "firstTransitionInput") {
                    this.value = val > 0 ? formatNum(val) : (this.value ? this.value : '');
                }
            });
        }
    });

    // VIP Selection Logic Updates
    getEl("currentVip").addEventListener("change", function () {
        const curr = parseInt(this.value);
        const targEl = getEl("targetVip");
        if (parseInt(targEl.value) <= curr && curr < 20) {
            targEl.value = curr + 1;
        }
        calculateAll();
    });

    // Buttons
    getEl("calculateBtn").addEventListener("click", calculateAll);
    getEl("saveBtn").addEventListener("click", saveOperation);
    getEl("newBtn").addEventListener("click", resetToDefaults);

    // History Actions
    getEl("historySearch").addEventListener("input", renderHistory);
    getEl("clearHistory").addEventListener("click", clearAllHistory);

    // Sub Calculators
    getEl("targetInput").addEventListener("input", calculateTargetSub);
    getEl("gamesInput").addEventListener("input", calculateGamesSub);

    // Copy Buttons Delegation
    document.addEventListener("click", function (e) {
        if (e.target && e.target.classList.contains("copy-btn")) {
            const textToCopy = e.target.getAttribute("data-copy");
            copyToClipboard(textToCopy, e.target);
        }
    });
}

// Core VIP Calculation Logic
function calculateAll() {
    const currentVip = parseInt(getEl("currentVip").value) || 10;
    const targetVip = parseInt(getEl("targetVip").value) || 11;
    const multiplier = parseInt(getEl("multiplier").value) || 5;
    const mode = getEl("vipMode").value; // 'reach' or 'currentLock'
    const enableTargetLock = getEl("enableTargetLock").checked;

    const supportRate = parseNumber(getEl("supportRate").value) || 130000;
    const jodRate = parseNumber(getEl("jodRate").value) || 11;
    const usdRate = parseNumber(getEl("usdRate").value) || 15;

    const reachContainer = getEl("reachContainer");
    if (mode === "currentLock") {
        reachContainer.classList.add("hidden");
    } else {
        reachContainer.classList.remove("hidden");
    }

    let reachPoints = 0;
    let lockPoints = 0;

    const currentData = VIP_TABLE.find(v => v.level === currentVip) || VIP_TABLE[0];
    const targetData = VIP_TABLE.find(v => v.level === targetVip) || VIP_TABLE[VIP_TABLE.length - 1];

    if (mode === "currentLock") {
        lockPoints = currentData.maintain;
        reachPoints = 0;
        getEl("resultTransitionText").textContent = `تثبيت VIP ${currentVip}`;
    } else {
        // Mode: Reach
        const transitionLabel = getEl("transitionLabel");
        const nextLevel = Math.min(currentVip + 1, 20);
        transitionLabel.textContent = `VIP ${currentVip} → VIP ${nextLevel}`;
        getEl("resultTransitionText").textContent = `VIP ${currentVip} → VIP ${targetVip}`;

        const firstTransitionVal = parseNumber(getEl("firstTransitionInput").value);
        reachPoints += firstTransitionVal;

        // Auto calculate subsequent transitions using upgrade field
        if (targetVip > currentVip + 1) {
            for (let lvl = currentVip + 1; lvl < targetVip; lvl++) {
                const lvlData = VIP_TABLE.find(v => v.level === lvl);
                if (lvlData) {
                    reachPoints += lvlData.upgrade;
                }
            }
        }

        // Target Lock handling
        const targetLockBox = getEl("targetLockBox");
        if (enableTargetLock) {
            targetLockBox.classList.remove("hidden");
            getEl("targetLockTitle").textContent = `تثبيت VIP ${targetVip}`;
            getEl("targetLockValue").textContent = formatNum(targetData.maintain);
            lockPoints = targetData.maintain;
        } else {
            targetLockBox.classList.add("hidden");
            lockPoints = 0;
        }
    }

    const totalVipPoints = reachPoints + lockPoints;
    
    // Core Formula Rule: VIP Points / Multiplier
    const actualCharge = totalVipPoints / multiplier;

    // Support Calculations
    const supportNeeded = (actualCharge / 1000000) * supportRate;
    const jodTotal = supportRate > 0 ? (supportNeeded / supportRate) * jodRate : 0;
    const usdTotal = supportRate > 0 ? (supportNeeded / supportRate) * usdRate : 0;

    // Save calculation result state
    currentCalculation = {
        currentVip,
        targetVip,
        multiplier,
        mode,
        reachPoints,
        lockPoints,
        totalVipPoints,
        actualCharge,
        supportNeeded,
        jodTotal,
        usdTotal,
        supportRate,
        jodRate,
        usdRate
    };

    // Update UI Elements
    getEl("resultMultiplierBadge").textContent = `×${multiplier}`;
    getEl("actualChargeDisplay").textContent = formatNum(Math.round(actualCharge));
    
    getEl("reachPoints").textContent = formatNum(reachPoints);
    getEl("lockPoints").textContent = formatNum(lockPoints);
    getEl("totalVipPoints").textContent = formatNum(totalVipPoints);
    getEl("supportNeeded").textContent = formatNum(Math.round(supportNeeded));
    getEl("jodTotal").textContent = `${formatCurrency(jodTotal)} د.أ`;
    getEl("usdTotal").textContent = `$ ${formatCurrency(usdTotal)}`;

    // Display Formulas
    getEl("formulaText").textContent = 
        `نقاط الوصول (${formatNum(reachPoints)}) + التثبيت (${formatNum(lockPoints)}) = الإجمالي (${formatNum(totalVipPoints)}) ÷ العرض (×${multiplier}) = ${formatNum(Math.round(actualCharge))}`;

    getEl("supportFormulaText").textContent = 
        `حسبة الدعم: الشحن (${formatNum(Math.round(actualCharge))}) ÷ 1,000,000 × ${formatNum(supportRate)} = ${formatNum(Math.round(supportNeeded))}`;
}

// Sub Calculators
function calculateTargetSub() {
    const val = parseNumber(getEl("targetInput").value);
    const jod = (val / 100000) * TARGET_JOD_RATE;
    const usd = (val / 100000) * TARGET_USD_RATE;

    getEl("targetJod").textContent = formatCurrency(jod);
    getEl("targetUsd").textContent = formatCurrency(usd);
}

function calculateGamesSub() {
    const val = parseNumber(getEl("gamesInput").value);
    const jod = (val / 100000) * GAMES_JOD_RATE;
    const usd = (val / 100000) * GAMES_USD_RATE;

    getEl("gamesJod").textContent = formatCurrency(jod);
    getEl("gamesUsd").textContent = formatCurrency(usd);
}

// Reset to Defaults
function resetToDefaults() {
    getEl("clientName").value = "";
    getEl("clientId").value = "";
    getEl("currentVip").value = "10";
    getEl("targetVip").value = "11";
    getEl("multiplier").value = "5";
    getEl("vipMode").value = "reach";
    getEl("firstTransitionInput").value = "";
    getEl("enableTargetLock").checked = false;
    
    getEl("supportRate").value = "130,000";
    getEl("jodRate").value = "11";
    getEl("usdRate").value = "15";

    getEl("targetInput").value = "";
    getEl("gamesInput").value = "";
    calculateTargetSub();
    calculateGamesSub();

    hideClientStatus();
    calculateAll();
}

// Storage Operations
function loadRecords() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        records = stored ? JSON.parse(stored) : [];
    } catch (e) {
        records = [];
    }
    renderHistory();
    updateStats();
}

function saveOperation() {
    const clientName = getEl("clientName").value.trim();
    const clientId = getEl("clientId").value.trim();

    if (!clientName && !clientId) {
        showClientStatus("أدخل اسم العميل أو ID أولاً", "error");
        return;
    }

    const record = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        clientName: clientName || 'بدون اسم',
        clientId: clientId || 'N/A',
        currentVip: currentCalculation.currentVip,
        targetVip: currentCalculation.targetVip,
        multiplier: currentCalculation.multiplier,
        reachPoints: currentCalculation.reachPoints,
        lockPoints: currentCalculation.lockPoints,
        totalVipPoints: currentCalculation.totalVipPoints,
        actualCharge: currentCalculation.actualCharge,
        supportNeeded: currentCalculation.supportNeeded,
        jodTotal: currentCalculation.jodTotal,
        usdTotal: currentCalculation.usdTotal,
        firstTransitionInput: getEl("firstTransitionInput").value
    };

    records.unshift(record);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        showClientStatus("تم حفظ العملية بنجاح", "success");
        renderHistory();
        updateStats();
    } catch (e) {
        showClientStatus("حدث خطأ أثناء الحفظ محلياً", "error");
    }
}

function showClientStatus(msg, type) {
    const el = getEl("clientStatus");
    el.textContent = msg;
    el.className = `status-message ${type}`;
    el.classList.remove("hidden");
    setTimeout(() => {
        el.classList.add("hidden");
    }, 4000);
}

function hideClientStatus() {
    getEl("clientStatus").classList.add("hidden");
}

function renderHistory() {
    const historyContainer = getEl("history");
    const searchQuery = (getEl("historySearch").value || "").toLowerCase().trim();

    if (!historyContainer) return;
    historyContainer.innerHTML = "";

    const filtered = records.filter(r => 
        (r.clientName && r.clientName.toLowerCase().includes(searchQuery)) ||
        (r.clientId && r.clientId.toLowerCase().includes(searchQuery))
    );

    if (filtered.length === 0) {
        historyContainer.innerHTML = `<div class="section-desc" style="text-align:center; padding: 20px;">لا توجد سجلات محفوظة.</div>`;
        return;
    }

    filtered.forEach(rec => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
            <div class="history-info">
                <div class="history-name">${escapeHtml(rec.clientName)} (ID: ${escapeHtml(rec.clientId)})</div>
                <div class="history-meta">
                    VIP ${rec.currentVip} → VIP ${rec.targetVip} | العرض: ×${rec.multiplier} | الشحن: ${formatNum(Math.round(rec.actualCharge))} كوينز
                </div>
                <div class="history-meta font-gold">
                    السعر: ${formatCurrency(rec.jodTotal)} د.أ / $ ${formatCurrency(rec.usdTotal)}
                </div>
            </div>
            <div class="history-actions">
                <button class="btn btn-primary" onclick="restoreRecord('${rec.id}')">استرجاع</button>
                <button class="btn btn-danger" onclick="deleteRecord('${rec.id}')">حذف</button>
            </div>
        `;
        historyContainer.appendChild(item);
    });
}

window.restoreRecord = function (id) {
    const rec = records.find(r => r.id === id);
    if (!rec) return;

    getEl("clientName").value = rec.clientName !== 'بدون اسم' ? rec.clientName : '';
    getEl("clientId").value = rec.clientId !== 'N/A' ? rec.clientId : '';
    getEl("currentVip").value = rec.currentVip;
    getEl("targetVip").value = rec.targetVip;
    getEl("multiplier").value = rec.multiplier;
    getEl("firstTransitionInput").value = rec.firstTransitionInput || '';

    calculateAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showClientStatus("تم استرجاع العملية بنجاح", "success");
};

window.deleteRecord = function (id) {
    records = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    renderHistory();
    updateStats();
};

function clearAllHistory() {
    if (records.length === 0) return;
    if (confirm("هل تريد حذف جميع العمليات؟")) {
        records = [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        renderHistory();
        updateStats();
    }
}

// Update Dashboard Statistics
function updateStats() {
    const totalOps = records.length;
    
    const uniqueCustomers = new Set(
        records.map(r => r.clientId && r.clientId !== 'N/A' ? r.clientId : r.clientName)
    ).size;

    const totalCharge = records.reduce((sum, r) => sum + (r.actualCharge || 0), 0);
    const totalSupport = records.reduce((sum, r) => sum + (r.supportNeeded || 0), 0);
    const totalVip = records.reduce((sum, r) => sum + (r.totalVipPoints || 0), 0);
    const totalJod = records.reduce((sum, r) => sum + (r.jodTotal || 0), 0);
    const totalUsd = records.reduce((sum, r) => sum + (r.usdTotal || 0), 0);
    
    let highestVip = 0;
    records.forEach(r => {
        if (r.targetVip > highestVip) highestVip = r.targetVip;
    });

    getEl("statOperations").textContent = formatNum(totalOps);
    getEl("statCustomers").textContent = formatNum(uniqueCustomers);
    getEl("statCharge").textContent = formatNum(Math.round(totalCharge));
    getEl("statSupport").textContent = formatNum(Math.round(totalSupport));
    getEl("statVipPoints").textContent = formatNum(totalVip);
    getEl("statJod").textContent = `${formatCurrency(totalJod)} د.أ`;
    getEl("statUsd").textContent = `$ ${formatCurrency(totalUsd)}`;
    getEl("statHighestVip").textContent = highestVip > 0 ? `VIP ${highestVip}` : 'VIP -';
}

// Clipboard Fallback Helper
function copyToClipboard(text, btnElement) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            handleCopySuccess(btnElement);
        }).catch(() => {
            fallbackCopy(text, btnElement);
        });
    } else {
        fallbackCopy(text, btnElement);
    }
}

function fallbackCopy(text, btnElement) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        document.execCommand('copy');
        handleCopySuccess(btnElement);
    } catch (err) {
        console.error('Copy failed', err);
    }
    document.body.removeChild(textarea);
}

function handleCopySuccess(btnElement) {
    if (!btnElement) return;
    const originalText = btnElement.textContent;
    btnElement.textContent = "تم النسخ";
    setTimeout(() => {
        btnElement.textContent = originalText;
    }, 2000);
  }
