"use strict";

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

const STORAGE_KEY = "f90_vip_records_v6";
const THEME_KEY = "f90_app_theme";

const TARGET_JOD_RATE = 7;
const TARGET_USD_RATE = 10;
const GAMES_JOD_RATE = 6;
const GAMES_USD_RATE = 8;

// Utilities
function getEl(id) { return document.getElementById(id); }

function parseNum(val) {
    if (!val) return 0;
    const cleaned = val.toString().replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function formatNum(n) { return (n || 0).toLocaleString("en-US"); }
function formatCurrency(n) { return (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function escapeHtml(str) { return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

// App State
let records = [];
let currentCalcState = {};
let calcExpr = "";

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    populateSelects();
    renderVipTable();
    loadRecords();
    setupListeners();
    resetForm();
    calculateAll();
});

// Theme Management
function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'slate';
    document.body.className = `theme-${saved}`;
    updateThemeBtnText(saved);
}

function toggleTheme() {
    const isSlate = document.body.classList.contains('theme-slate');
    const newTheme = isSlate ? 'navy' : 'slate';
    document.body.className = `theme-${newTheme}`;
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeBtnText(newTheme);
}

function updateThemeBtnText(theme) {
    getEl("themeName").textContent = theme === 'slate' ? 'الثيم الكحلي' : 'الثيم الرمادي';
}

// Selects Population
function populateSelects() {
    const curr = getEl("currentVip");
    const targ = getEl("targetVip");
    curr.innerHTML = ""; targ.innerHTML = "";

    VIP_TABLE.forEach(v => {
        curr.appendChild(new Option(`VIP ${v.level}`, v.level));
        targ.appendChild(new Option(`VIP ${v.level}`, v.level));
    });

    curr.value = "10"; targ.value = "11";
}

// Event Listeners
function setupListeners() {
    getEl("themeToggleBtn").addEventListener("click", toggleTheme);

    // Developer Modal
    getEl("devModalBtn").addEventListener("click", () => getEl("devModal").classList.remove("hidden"));
    getEl("closeDevModal").addEventListener("click", () => getEl("devModal").classList.add("hidden"));

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

    getEl("currentVip").addEventListener("change", function() {
        const c = parseInt(this.value);
        const t = getEl("targetVip");
        if (parseInt(t.value) <= c && c < 20) t.value = c + 1;
        calculateAll();
    });

    getEl("calculateBtn").addEventListener("click", calculateAll);
    getEl("saveBtn").addEventListener("click", saveRecord);
    getEl("newBtn").addEventListener("click", resetForm);

    getEl("targetInput").addEventListener("input", calcTargetSub);
    getEl("gamesInput").addEventListener("input", calcGamesSub);

    getEl("historySearch").addEventListener("input", renderHistory);
    getEl("clearHistoryBtn").addEventListener("click", clearAllRecords);

    getEl("shareWhatsappBtn").addEventListener("click", shareViaWhatsapp);

    // Footer Tabs
    document.querySelectorAll(".info-tab-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".info-tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
            this.classList.add("active");
            getEl(this.getAttribute("data-tab")).classList.add("active");
        });
    });

    // Copy Buttons Delegation
    document.addEventListener("click", (e) => {
        if (e.target && e.target.classList.contains("copy-btn")) {
            copyText(e.target.getAttribute("data-copy"), e.target);
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

    let reachPoints = 0;
    let lockPoints = 0;
    let transitionSteps = [];

    const currentData = VIP_TABLE.find(v => v.level === currentVip) || VIP_TABLE[0];
    const targetData = VIP_TABLE.find(v => v.level === targetVip) || VIP_TABLE[VIP_TABLE.length - 1];

    if (mode === "currentLock") {
        lockPoints = currentData.maintain;
        transitionSteps.push({ label: `تثبيت VIP ${currentVip}`, points: lockPoints });
        getEl("summaryRouteBadge").textContent = `تثبيت VIP ${currentVip} (×${multiplier})`;
    } else {
        const nextLvl = Math.min(currentVip + 1, 20);
        getEl("transitionLabel").textContent = `VIP ${currentVip} → VIP ${nextLvl}`;
        getEl("summaryRouteBadge").textContent = `VIP ${currentVip} → VIP ${targetVip} (×${multiplier})`;

        const manualInputVal = parseNum(getEl("firstTransitionInput").value);
        reachPoints += manualInputVal;
        transitionSteps.push({ label: `VIP ${currentVip} → VIP ${nextLvl}`, points: manualInputVal });

        if (targetVip > currentVip + 1) {
            for (let lvl = currentVip + 1; lvl < targetVip; lvl++) {
                const lvlData = VIP_TABLE.find(v => v.level === lvl);
                if (lvlData) {
                    reachPoints += lvlData.upgrade;
                    transitionSteps.push({ label: `VIP ${lvl} → VIP ${lvl + 1}`, points: lvlData.upgrade });
                }
            }
        }

        const lockBadge = getEl("targetLockValueDisplay");
        if (enableTargetLock) {
            lockPoints = targetData.maintain;
            transitionSteps.push({ label: `تثبيت المستوى المطلوب (VIP ${targetVip})`, points: lockPoints });
            lockBadge.textContent = `${formatNum(lockPoints)} XP`;
            lockBadge.classList.remove("hidden");
        } else {
            lockBadge.classList.add("hidden");
        }
    }

    const totalVipPoints = reachPoints + lockPoints;
    
    // Core Formula: VIP Points / Multiplier
    const actualCharge = totalVipPoints / multiplier;

    // Support Calculations
    const supportNeeded = (actualCharge / 1000000) * supportRate;
    const jodTotal = supportRate > 0 ? (supportNeeded / supportRate) * jodRate : 0;
    const usdTotal = supportRate > 0 ? (supportNeeded / supportRate) * usdRate : 0;

    currentCalcState = {
        currentVip, targetVip, multiplier, mode, reachPoints, lockPoints,
        totalVipPoints, actualCharge, supportNeeded, jodTotal, usdTotal,
        supportRate, jodRate, usdRate
    };

    // Render Display Results
    getEl("actualChargeDisplay").textContent = formatNum(Math.round(actualCharge));
    getEl("reachPoints").textContent = formatNum(reachPoints);
    getEl("lockPoints").textContent = formatNum(lockPoints);
    getEl("totalVipPoints").textContent = `${formatNum(totalVipPoints)} XP`;
    getEl("supportNeeded").textContent = formatNum(Math.round(supportNeeded));
    getEl("jodTotal").textContent = `${formatCurrency(jodTotal)} د.أ`;
    getEl("usdTotal").textContent = `$ ${formatCurrency(usdTotal)}`;

    renderTransitionsFlow(transitionSteps);
}

// Render Single Unified Transitions Flow
function renderTransitionsFlow(steps) {
    const box = getEl("transitionsList");
    box.innerHTML = "";

    if (steps.length === 0) {
        box.innerHTML = `<div style="color:var(--text-muted); font-size:0.82rem;">لا توجد خطوات انتقال محددة.</div>`;
        return;
    }

    steps.forEach(step => {
        const row = document.createElement("div");
        row.className = "t-step-row";
        row.innerHTML = `
            <span>${escapeHtml(step.label)}</span>
            <strong class="cyan-text">${formatNum(step.points)} XP</strong>
        `;
        box.appendChild(row);
    });
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

// Embedded Standard Calculator Pad
window.calcPad = function(val) {
    const display = getEl("calcDisplay");
    if (val === 'C') {
        calcExpr = "";
        display.textContent = "0";
    } else if (val === '=') {
        try {
            calcExpr = eval(calcExpr).toString();
            display.textContent = calcExpr;
        } catch (e) {
            display.textContent = "خطأ";
            calcExpr = "";
        }
    } else {
        calcExpr += val;
        display.textContent = calcExpr;
    }
};

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
        showStatus("أدخل اسم العميل أو ID أولاً للحفظ", "error");
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
        showStatus("تم حفظ العملية بنجاح!", "success");
        renderHistory();
        updateStats();
    } catch (e) {
        showStatus("خطأ في الحفظ المحلي", "error");
    }
}

function showStatus(msg, type) {
    const banner = getEl("clientStatus");
    banner.textContent = msg;
    banner.className = `status-msg ${type}`;
    banner.classList.remove("hidden");
    setTimeout(() => banner.classList.add("hidden"), 3000);
}

function renderHistory() {
    const container = getEl("historyList");
    const q = (getEl("historySearch").value || "").toLowerCase().trim();

    if (!container) return;
    container.innerHTML = "";

    const filtered = records.filter(r => 
        (r.clientName && r.clientName.toLowerCase().includes(q)) ||
        (r.clientId && r.clientId.toLowerCase().includes(q))
    );

    if (filtered.length === 0) {
        container.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">لا توجد سجلات محفوظة.</div>`;
        return;
    }

    filtered.forEach(r => {
        const item = document.createElement("div");
        item.className = "history-card-item";
        item.innerHTML = `
            <div>
                <strong>${escapeHtml(r.clientName)}</strong> (ID: ${escapeHtml(r.clientId)})
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">
                    VIP ${r.currentVip} → VIP ${r.targetVip} | شحن الوكيل: <span class="cyan-text">${formatNum(Math.round(r.actualCharge))}</span> | السعر: <span class="cyan-text">${formatCurrency(r.jodTotal)} د.أ</span> / <span class="cyan-text">$${formatCurrency(r.usdTotal)}</span>
                </div>
            </div>
            <div style="display:flex; gap:6px;">
                <button class="copy-btn" onclick="restoreRecord('${r.id}')">استرجاع</button>
                <button class="btn-clear" onclick="deleteRecord('${r.id}')">حذف</button>
            </div>
        `;
        container.appendChild(item);
    });
}

window.restoreRecord = function(id) {
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
    showStatus("تم استرجاع العملية بنجاح!", "success");
};

window.deleteRecord = function(id) {
    records = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    renderHistory();
    updateStats();
};

function clearAllRecords() {
    if (records.length === 0) return;
    if (confirm("هل تأكدت من حذف كل السجلات؟")) {
        records = [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        renderHistory();
        updateStats();
    }
}

function updateStats() {
    getEl("statOperations").textContent = formatNum(records.length);
    getEl("statCustomers").textContent = formatNum(new Set(records.map(r => r.clientId)).size);
    getEl("statCharge").textContent = formatNum(Math.round(records.reduce((s, r) => s + (r.actualCharge || 0), 0)));
    getEl("statSupport").textContent = formatNum(Math.round(records.reduce((s, r) => s + (r.supportNeeded || 0), 0)));
    getEl("statJod").textContent = `${formatCurrency(records.reduce((s, r) => s + (r.jodTotal || 0), 0))} د.أ`;
    getEl("statUsd").textContent = `$${formatCurrency(records.reduce((s, r) => s + (r.usdTotal || 0), 0))}`;
}

// Professional WhatsApp Sharing Function
function shareViaWhatsapp() {
    const name = getEl("clientName").value.trim() || "عميلنا العزيز";
    const id = getEl("clientId").value.trim() || "N/A";

    const msg = 
`⚡ *تفاصيل عملية الشحن الرسمية — F90 CALCULATOR* ⚡

👤 *اسم العميل:* ${name}
🆔 *ID الحساب:* ${id}
🎯 *الانتقال:* VIP ${currentCalcState.currentVip} ➔ VIP ${currentCalcState.targetVip}
🔥 *العرض:* ×${currentCalcState.multiplier}

💎 *قيمة الكسب / شحن الوكيل الصافي:* 
👈 *${formatNum(Math.round(currentCalcState.actualCharge))} كوينز*

🎁 *إجمالي الدعم المطلوب:* 
👈 *${formatNum(Math.round(currentCalcState.supportNeeded))} كوينز*

💵 *سعر الدعم (دولار):* $${formatCurrency(currentCalcState.usdTotal)} USD
💰 *سعر الدعم (دينار):* ${formatCurrency(currentCalcState.jodTotal)} JOD

---------------------------------------
👨‍💻 *تطوير وخدمات F90 Digital Services*`.trim();

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

function copyText(txt, btn) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(txt).then(() => handleCopySuccess(btn));
    } else {
        const ta = document.createElement("textarea");
        ta.value = txt; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
        handleCopySuccess(btn);
    }
}

function handleCopySuccess(btn) {
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = "تم النسخ!";
    setTimeout(() => btn.textContent = old, 2000);
   }
