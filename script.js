"use strict";

// Official VIP Table Data
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

// Keys & Rates
const STORAGE_KEY = "majlis_alqimma_vip_records_v5";
const THEME_KEY = "f90_theme_preference";

const TARGET_JOD_RATE = 7;
const TARGET_USD_RATE = 10;
const GAMES_JOD_RATE = 6;
const GAMES_USD_RATE = 8;

// Utilities
function getEl(id) { return document.getElementById(id); }

function cleanNumberInput(val) {
    if (!val) return '';
    let cleaned = val.toString().replace(/[^\d.-]/g, '');
    const parts = cleaned.split('.');
    return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
}

function parseNum(val) {
    const cleaned = cleanNumberInput(val);
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
}

function formatNum(n) {
    return (n || 0).toLocaleString("en-US");
}

function formatCurrency(n) {
    return (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// State
let records = [];
let currentCalcState = {};

// App Init
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    populateSelects();
    renderVipTable();
    loadRecords();
    setupListeners();
    resetForm();
    calculateAll();
});

// Theme Logic
function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light') {
        document.body.classList.add('light');
        getEl("themeToggle").querySelector('.theme-text').textContent = 'الوضع النهاري';
    }
}

function toggleTheme() {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    getEl("themeToggle").querySelector('.theme-text').textContent = isLight ? 'الوضع النهاري' : 'الوضع الليلي';
}

// Populate VIP Select Options
function populateSelects() {
    const currSel = getEl("currentVip");
    const targSel = getEl("targetVip");
    
    currSel.innerHTML = "";
    targSel.innerHTML = "";

    VIP_TABLE.forEach(v => {
        currSel.appendChild(new Option(`VIP ${v.level}`, v.level));
        targSel.appendChild(new Option(`VIP ${v.level}`, v.level));
    });

    currSel.value = "10";
    targSel.value = "11";
}

// Event Listeners
function setupListeners() {
    getEl("themeToggle").addEventListener("click", toggleTheme);

    // Collapsible Logic
    document.querySelectorAll("[data-toggle]").forEach(header => {
        header.addEventListener("click", function () {
            const targetId = this.getAttribute("data-toggle");
            const target = getEl(targetId);
            if (target) {
                target.classList.toggle("hidden");
                const icon = this.querySelector(".collapse-icon");
                if (icon) icon.textContent = target.classList.contains("hidden") ? "⌄" : "⌃";
            }
        });
    });

    // Inputs triggering live calculation
    const inputs = [
        "currentVip", "targetVip", "multiplier", "vipMode",
        "firstTransitionInput", "enableTargetLock", "supportRate",
        "jodRate", "usdRate"
    ];

    inputs.forEach(id => {
        const el = getEl(id);
        if (el) {
            el.addEventListener("change", calculateAll);
            el.addEventListener("input", calculateAll);
        }
    });

    // VIP Level Linkage Logic
    getEl("currentVip").addEventListener("change", function () {
        const c = parseInt(this.value);
        const t = getEl("targetVip");
        if (parseInt(t.value) <= c && c < 20) {
            t.value = c + 1;
        }
        calculateAll();
    });

    // Main Buttons
    getEl("calculateBtn").addEventListener("click", calculateAll);
    getEl("saveBtn").addEventListener("click", saveRecord);
    getEl("newBtn").addEventListener("click", resetForm);

    // Sub Calculators
    getEl("targetInput").addEventListener("input", calcTargetSub);
    getEl("gamesInput").addEventListener("input", calcGamesSub);

    // History Search
    getEl("historySearch").addEventListener("input", renderHistory);
    getEl("clearHistory").addEventListener("click", clearAllRecords);

    // Invoice Copy Button
    getEl("copyInvoiceBtn").addEventListener("click", copyInvoiceToClipboard);

    // Copy Delegation
    document.addEventListener("click", (e) => {
        if (e.target && e.target.classList.contains("copy-btn")) {
            const txt = e.target.getAttribute("data-copy");
            copyText(txt, e.target);
        }
    });
}

// VIP Calculation Engine
function calculateAll() {
    const currentVip = parseInt(getEl("currentVip").value) || 10;
    const targetVip = parseInt(getEl("targetVip").value) || 11;
    const multiplier = parseInt(getEl("multiplier").value) || 5;
    const mode = getEl("vipMode").value;
    const enableTargetLock = getEl("enableTargetLock").checked;

    const supportRate = parseNum(getEl("supportRate").value) || 130000;
    const jodRate = parseNum(getEl("jodRate").value) || 11;
    const usdRate = parseNum(getEl("usdRate").value) || 15;

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
        getEl("resultTransitionText").textContent = `تثبيت VIP ${currentVip}`;
    } else {
        const nextLvl = Math.min(currentVip + 1, 20);
        getEl("transitionLabel").textContent = `VIP ${currentVip} → VIP ${nextLvl}`;
        getEl("resultTransitionText").textContent = `VIP ${currentVip} → VIP ${targetVip}`;

        const manualInputVal = parseNum(getEl("firstTransitionInput").value);
        reachPoints += manualInputVal;

        // Auto calculate subsequent transitions using upgrade field
        if (targetVip > currentVip + 1) {
            for (let lvl = currentVip + 1; lvl < targetVip; lvl++) {
                const lvlData = VIP_TABLE.find(v => v.level === lvl);
                if (lvlData) reachPoints += lvlData.upgrade;
            }
        }

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
    
    // Core Formula: VIP Points ÷ Multiplier
    const actualCharge = totalVipPoints / multiplier;

    // Support Calculation
    const supportNeeded = (actualCharge / 1000000) * supportRate;
    const jodTotal = supportRate > 0 ? (supportNeeded / supportRate) * jodRate : 0;
    const usdTotal = supportRate > 0 ? (supportNeeded / supportRate) * usdRate : 0;

    // State Update
    currentCalcState = {
        currentVip, targetVip, multiplier, mode, reachPoints, lockPoints,
        totalVipPoints, actualCharge, supportNeeded, jodTotal, usdTotal,
        supportRate, jodRate, usdRate
    };

    // Render Display Results
    getEl("resultMultiplierBadge").textContent = `×${multiplier}`;
    getEl("actualChargeDisplay").textContent = formatNum(Math.round(actualCharge));

    getEl("reachPoints").textContent = formatNum(reachPoints);
    getEl("lockPoints").textContent = formatNum(lockPoints);
    getEl("totalVipPoints").textContent = formatNum(totalVipPoints);
    getEl("supportNeeded").textContent = formatNum(Math.round(supportNeeded));
    getEl("jodTotal").textContent = `${formatCurrency(jodTotal)} د.أ`;
    getEl("usdTotal").textContent = `$ ${formatCurrency(usdTotal)}`;

    // Formula Explanation
    getEl("formulaText").textContent = 
        `نقاط الوصول (${formatNum(reachPoints)}) + التثبيت (${formatNum(lockPoints)}) = الإجمالي (${formatNum(totalVipPoints)}) ÷ العرض (×${multiplier}) = ${formatNum(Math.round(actualCharge))}`;

    getEl("supportFormulaText").textContent = 
        `حسبة الدعم: الشحن (${formatNum(Math.round(actualCharge))}) ÷ 1,000,000 × ${formatNum(supportRate)} = ${formatNum(Math.round(supportNeeded))}`;
}

// Sub Calculators
function calcTargetSub() {
    const val = parseNum(getEl("targetInput").value);
    getEl("targetJod").textContent = formatCurrency((val / 100000) * TARGET_JOD_RATE);
    getEl("targetUsd").textContent = formatCurrency((val / 100000) * TARGET_USD_RATE);
}

function calcGamesSub() {
    const val = parseNum(getEl("gamesInput").value);
    getEl("gamesJod").textContent = formatCurrency((val / 100000) * GAMES_JOD_RATE);
    getEl("gamesUsd").textContent = formatCurrency((val / 100000) * GAMES_USD_RATE);
}

// Reset Form
function resetForm() {
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
    calcTargetSub();
    calcGamesSub();

    getEl("clientStatus").classList.add("hidden");
    calculateAll();
}

// Render VIP Reference Table
function renderVipTable() {
    const tbody = getEl("vipTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    VIP_TABLE.forEach(v => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>VIP ${v.level}</strong></td>
            <td>${formatNum(v.total)}</td>
            <td>${formatNum(v.upgrade)}</td>
            <td>${formatNum(v.maintain)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Storage Operations
function loadRecords() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        records = stored ? JSON.parse(stored) : [];
    } catch (e) { records = []; }
    renderHistory();
    updateStats();
}

function saveRecord() {
    const name = getEl("clientName").value.trim();
    const id = getEl("clientId").value.trim();

    if (!name && !id) {
        showStatus("يرجى إدخال اسم العميل أو ID الحساب للحفظ!", "error");
        return;
    }

    const newRec = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        clientName: name || 'بدون اسم',
        clientId: id || 'N/A',
        firstTransitionInput: getEl("firstTransitionInput").value,
        ...currentCalcState
    };

    records.unshift(newRec);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        showStatus("تم حفظ العملية بنجاح في السجل!", "success");
        renderHistory();
        updateStats();
    } catch (e) {
        showStatus("حدث خطأ أثناء الحفظ المحلي", "error");
    }
}

function showStatus(msg, type) {
    const banner = getEl("clientStatus");
    banner.textContent = msg;
    banner.className = `status-banner ${type}`;
    banner.classList.remove("hidden");
    setTimeout(() => banner.classList.add("hidden"), 4000);
}

function renderHistory() {
    const container = getEl("history");
    const q = (getEl("historySearch").value || "").toLowerCase().trim();

    if (!container) return;
    container.innerHTML = "";

    const filtered = records.filter(r => 
        (r.clientName && r.clientName.toLowerCase().includes(q)) ||
        (r.clientId && r.clientId.toLowerCase().includes(q))
    );

    if (filtered.length === 0) {
        container.innerHTML = `<div class="alert-info" style="text-align:center;">لا توجد سجلات محفوظة حالياً.</div>`;
        return;
    }

    filtered.forEach(r => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
            <div>
                <div class="history-client">${escapeHtml(r.clientName)} (ID: ${escapeHtml(r.clientId)})</div>
                <div class="history-details">
                    المسار: VIP ${r.currentVip} → VIP ${r.targetVip} | العرض: ×${r.multiplier} | الشحن: ${formatNum(Math.round(r.actualCharge))} كوينز
                </div>
                <div class="history-details" style="color:var(--gold-primary); font-weight:700;">
                    السعر: ${formatCurrency(r.jodTotal)} د.أ | $ ${formatCurrency(r.usdTotal)}
                </div>
            </div>
            <div class="history-actions-btns">
                <button class="btn btn-secondary" onclick="restoreRecord('${r.id}')">استرجاع</button>
                <button class="btn btn-danger-outline" onclick="deleteRecord('${r.id}')">حذف</button>
            </div>
        `;
        container.appendChild(item);
    });
}

window.restoreRecord = function (id) {
    const r = records.find(x => x.id === id);
    if (!r) return;

    getEl("clientName").value = r.clientName !== 'بدون اسم' ? r.clientName : '';
    getEl("clientId").value = r.clientId !== 'N/A' ? r.clientId : '';
    getEl("currentVip").value = r.currentVip;
    getEl("targetVip").value = r.targetVip;
    getEl("multiplier").value = r.multiplier;
    getEl("firstTransitionInput").value = r.firstTransitionInput || '';

    calculateAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showStatus("تم استرجاع بيانات العملية للنموذج بنجاح!", "success");
};

window.deleteRecord = function (id) {
    records = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    renderHistory();
    updateStats();
};

function clearAllRecords() {
    if (records.length === 0) return;
    if (confirm("هل أنت تأكد من مسح جميع السجلات المحفوظة؟")) {
        records = [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        renderHistory();
        updateStats();
    }
}

// Update Dashboard Statistics
function updateStats() {
    const totalOps = records.length;
    const uniqueClients = new Set(records.map(r => r.clientId !== 'N/A' ? r.clientId : r.clientName)).size;

    const totalCharge = records.reduce((s, r) => s + (r.actualCharge || 0), 0);
    const totalSupport = records.reduce((s, r) => s + (r.supportNeeded || 0), 0);
    const totalVip = records.reduce((s, r) => s + (r.totalVipPoints || 0), 0);
    const totalJod = records.reduce((s, r) => s + (r.jodTotal || 0), 0);
    const totalUsd = records.reduce((s, r) => s + (r.usdTotal || 0), 0);

    let highest = 0;
    records.forEach(r => { if (r.targetVip > highest) highest = r.targetVip; });

    getEl("statOperations").textContent = formatNum(totalOps);
    getEl("statCustomers").textContent = formatNum(uniqueClients);
    getEl("statCharge").textContent = formatNum(Math.round(totalCharge));
    getEl("statSupport").textContent = formatNum(Math.round(totalSupport));
    getEl("statVipPoints").textContent = formatNum(totalVip);
    getEl("statJod").textContent = `${formatCurrency(totalJod)} د.أ`;
    getEl("statUsd").textContent = `$ ${formatCurrency(totalUsd)}`;
    getEl("statHighestVip").textContent = highest > 0 ? `VIP ${highest}` : 'VIP -';
}

// Copy Report / Invoice Generation
function copyInvoiceToClipboard() {
    const name = getEl("clientName").value.trim() || "عميلنا العزيز";
    const id = getEl("clientId").value.trim() || "N/A";
    
    const text = `
✨ *تقرير حسبة VIP المعتمدة — F90 CALCULATOR* ✨
----------------------------------------
👤 *العميل:* ${name}
🆔 *ID الحساب:* ${id}
🎯 *الانتقال:* VIP ${currentCalcState.currentVip} ← VIP ${currentCalcState.targetVip}
🔥 *العرض المطبق:* ×${currentCalcState.multiplier}
----------------------------------------
💎 *إجمالي شحن الوكيل الصافي:* ${formatNum(Math.round(currentCalcState.actualCharge))} كوينز
🎁 *إجمالي الدعم المكتسب:* ${formatNum(Math.round(currentCalcState.supportNeeded))} كوينز
----------------------------------------
💰 *المبلغ بالدينار الأردني:* ${formatCurrency(currentCalcState.jodTotal)} JOD
💵 *المبلغ بالدولار الأمريكي:* $${formatCurrency(currentCalcState.usdTotal)} USD
----------------------------------------
👑 *وكالة مجلس القمة للشحن | تطوير F90*
📲 التواصل الرسمي: +970568181910
    `.trim();

    copyText(text, getEl("copyInvoiceBtn"));
}

function copyText(txt, btn) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(txt).then(() => handleCopySuccess(btn));
    } else {
        const ta = document.createElement("textarea");
        ta.value = txt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        handleCopySuccess(btn);
    }
}

function handleCopySuccess(btn) {
    if (!btn) return;
    const oldText = btn.textContent;
    btn.textContent = "✅ تم النسخ بنجاح!";
    setTimeout(() => btn.textContent = oldText, 2500);
}
