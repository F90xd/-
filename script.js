/* script.js */

"use strict";

/* =========================================================
   F90 VIP CONTROL
   NEW SYSTEM
   ========================================================= */

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

const STORAGE_KEY = "f90_vip_control_records_v1";
const THEME_KEY = "f90_vip_control_theme";

let historyRecords = loadHistory();

const TARGET_JOD_RATE = 7;
const TARGET_USD_RATE = 10;

const GAMES_JOD_RATE = 6;
const GAMES_USD_RATE = 8;


/* =========================================================
   HELPERS
   ========================================================= */

function byId(id) {
    return document.getElementById(id);
}

function numberValue(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    const cleaned = String(value)
        .replace(/,/g, "")
        .replace(/[^\d.-]/g, "")
        .trim();

    if (!cleaned) {
        return 0;
    }

    const result = Number(cleaned);

    return Number.isFinite(result) ? result : 0;
}

function formatNumber(value, decimals = 0) {
    const safe = Number.isFinite(Number(value))
        ? Number(value)
        : 0;

    return safe.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatCoins(value) {
    return formatNumber(value, 0);
}

function formatMoney(value) {
    return formatNumber(value, 2);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getVip(level) {
    return VIP_TABLE.find(item => item.level === Number(level));
}


/* =========================================================
   INPUT CLEANING
   ========================================================= */

function cleanNumericInput(input) {
    if (!input) return;

    input.addEventListener("input", () => {
        const original = input.value;
        const cleaned = original.replace(/[^\d.,-]/g, "");

        if (original !== cleaned) {
            input.value = cleaned;
        }
    });
}

[
    "firstTransitionInput",
    "supportRate",
    "jodRate",
    "usdRate",
    "targetInput",
    "gamesInput"
].forEach(id => {
    cleanNumericInput(byId(id));
});


/* =========================================================
   VIP SELECTS
   ========================================================= */

function buildVipSelects() {
    const current = byId("currentVip");
    const target = byId("targetVip");

    if (!current || !target) return;

    current.innerHTML = "";
    target.innerHTML = "";

    VIP_TABLE.forEach(item => {

        const currentOption = document.createElement("option");
        currentOption.value = item.level;
        currentOption.textContent = `VIP ${item.level}`;

        const targetOption = document.createElement("option");
        targetOption.value = item.level;
        targetOption.textContent = `VIP ${item.level}`;

        current.appendChild(currentOption);
        target.appendChild(targetOption);
    });

    current.value = "10";
    target.value = "11";
}

buildVipSelects();


/* =========================================================
   VIP TABLE
   ========================================================= */

function renderVipTable() {
    const tbody = byId("vipTable");

    if (!tbody) return;

    tbody.innerHTML = "";

    VIP_TABLE.forEach(item => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>VIP ${item.level}</td>
            <td>${formatCoins(item.total)}</td>
            <td>${formatCoins(item.upgrade)}</td>
            <td>${formatCoins(item.maintain)}</td>
        `;

        tbody.appendChild(tr);
    });
}

renderVipTable();


/* =========================================================
   TRANSITIONS
   ========================================================= */

function renderTransitions() {

    const area = byId("transitionList");
    const current = Number(byId("currentVip").value);
    const target = Number(byId("targetVip").value);
    const counter = byId("transitionCount");

    if (!area) return;

    area.innerHTML = "";

    if (target <= current) {

        area.innerHTML = `
            <div class="empty-state">
                يجب اختيار مستوى أعلى من المستوى الحالي.
            </div>
        `;

        if (counter) counter.textContent = "0 انتقال";

        return;
    }

    const transitionCount = target - current;

    if (counter) {
        counter.textContent =
            `${transitionCount} ${transitionCount === 1 ? "انتقال" : "انتقالات"}`;
    }

    for (
        let level = current;
        level < target;
        level++
    ) {

        const nextLevel = level + 1;
        const isFirst = level === current;
        const item = document.createElement("div");

        item.className =
            `transition-item ${isFirst ? "manual" : "auto"}`;

        if (isFirst) {

            item.innerHTML = `
                <div class="transition-meta">
                    <small>MANUAL • الانتقال الأول</small>
                    <strong>VIP ${level} → VIP ${nextLevel}</strong>
                </div>

                <div class="transition-value">
                    <small>القيمة</small>
                    <strong id="firstTransitionPreview">0</strong>
                </div>
            `;

        } else {

            const next = getVip(nextLevel);

            item.innerHTML = `
                <div class="transition-meta">
                    <small>AUTO • محسوب من الجدول</small>
                    <strong>VIP ${level} → VIP ${nextLevel}</strong>
                </div>

                <div class="transition-value">
                    <small>XP الترقية</small>
                    <strong>${formatCoins(next ? next.upgrade : 0)}</strong>
                </div>
            `;
        }

        area.appendChild(item);
    }

    updateFirstTransitionPreview();
}

function updateFirstTransitionPreview() {
    const preview = byId("firstTransitionPreview");

    if (preview) {
        preview.textContent =
            formatCoins(numberValue(byId("firstTransitionInput").value));
    }
}


/* =========================================================
   CALCULATION
   ========================================================= */

function getFirstTransitionValue() {
    return numberValue(
        byId("firstTransitionInput").value
    );
}

function calculateVip() {

    const current =
        Number(byId("currentVip").value);

    const target =
        Number(byId("targetVip").value);

    const multiplier =
        numberValue(byId("multiplier").value) || 1;

    const firstValue =
        getFirstTransitionValue();

    let reachPoints = 0;

    if (target > current) {

        /*
            الانتقال الأول يدخله المستخدم.
        */
        reachPoints += firstValue;

        /*
            جميع الانتقالات التالية
            تؤخذ من upgrade في جدول VIP.
        */
        for (
            let level = current + 1;
            level < target;
            level++
        ) {

            const next = getVip(level + 1);

            if (next) {
                reachPoints += next.upgrade;
            }
        }
    }

    let lockPoints = 0;

    const mode =
        document.querySelector(
            'input[name="mode"]:checked'
        );

    if (
        mode &&
        mode.value === "currentLock"
    ) {

        const currentData = getVip(current);

        if (currentData) {
            lockPoints = currentData.maintain;
        }
    }

    const lockEnabled =
        byId("enableTargetLock").checked;

    if (
        mode &&
        mode.value === "reach" &&
        lockEnabled
    ) {

        const targetData = getVip(target);

        if (targetData) {
            lockPoints = targetData.maintain;
        }
    }

    const totalVipPoints =
        reachPoints + lockPoints;

    /*
        IMPORTANT:
        VIP points are divided by the offer.
    */
    const actualCharge =
        totalVipPoints / multiplier;

    const supportRate =
        numberValue(byId("supportRate").value);

    let supportNeeded = 0;

    if (supportRate > 0) {
        supportNeeded =
            actualCharge /
            1000000 *
            supportRate;
    }

    const jodRate =
        numberValue(byId("jodRate").value);

    const usdRate =
        numberValue(byId("usdRate").value);

    let jodTotal = 0;
    let usdTotal = 0;

    if (supportRate > 0) {

        jodTotal =
            supportNeeded /
            supportRate *
            jodRate;

        usdTotal =
            supportNeeded /
            supportRate *
            usdRate;
    }

    const result = {
        current,
        target,
        multiplier,
        reachPoints,
        lockPoints,
        totalVipPoints,
        actualCharge,
        supportNeeded,
        jodTotal,
        usdTotal,
        supportRate,
        mode: mode ? mode.value : "reach",
        firstTransition: firstValue,
        targetLockEnabled: lockEnabled
    };

    updateVipResult(result);
    updateRatePreview();

    return result;
}


/* =========================================================
   RESULT
   ========================================================= */

function updateVipResult(data) {

    byId("resultTitle").textContent =
        `VIP ${data.current} → VIP ${data.target}`;

    byId("routeText").textContent =
        `VIP ${data.current} → VIP ${data.target}`;

    byId("currentVipDisplay").textContent =
        `VIP ${data.current}`;

    byId("targetVipDisplay").textContent =
        `VIP ${data.target}`;

    byId("heroCurrentVip").textContent =
        data.current;

    byId("resultMultiplier").textContent =
        `×${data.multiplier}`;

    byId("actualCharge").textContent =
        formatCoins(data.actualCharge);

    byId("reachPoints").textContent =
        formatCoins(data.reachPoints);

    byId("lockPoints").textContent =
        formatCoins(data.lockPoints);

    byId("totalVipPoints").textContent =
        formatCoins(data.totalVipPoints);

    byId("supportNeeded").textContent =
        formatCoins(data.supportNeeded);

    byId("jodTotal").textContent =
        `${formatMoney(data.jodTotal)}`;

    byId("usdTotal").textContent =
        `${formatMoney(data.usdTotal)}`;

    byId("formulaVip").textContent =
        formatCoins(data.totalVipPoints);

    byId("formulaMultiplier").textContent =
        `×${data.multiplier}`;

    byId("formulaCharge").textContent =
        formatCoins(data.actualCharge);

    byId("formulaSupport").textContent =
        `${formatCoins(data.actualCharge)} ÷ 1,000,000 × ${formatCoins(data.supportRate)} = ${formatCoins(data.supportNeeded)}`;

    byId("summaryMode").textContent =
        data.mode === "currentLock"
            ? "تثبيت الحالي"
            : data.targetLockEnabled
                ? "وصول + تثبيت"
                : "وصول";

    const targetData =
        getVip(data.target);

    if (targetData) {
        byId("autoLockValue").textContent =
            formatCoins(targetData.maintain);
    }

    updateFirstTransitionPreview();
}


/* =========================================================
   MODE
   ========================================================= */

function updateMode() {

    const selected =
        document.querySelector(
            'input[name="mode"]:checked'
        );

    if (!selected) return;

    const reachLabel =
        byId("reachModeLabel");

    const lockLabel =
        byId("currentLockLabel");

    const lockBox =
        byId("targetLockBox");

    if (selected.value === "reach") {

        reachLabel.classList.add("active");
        lockLabel.classList.remove("active");
        lockBox.style.display = "";

    } else {

        reachLabel.classList.remove("active");
        lockLabel.classList.add("active");
        lockBox.style.display = "none";
    }

    calculateVip();
}


/* =========================================================
   LOCK
   ========================================================= */

function updateLock() {

    const checkbox =
        byId("enableTargetLock");

    const lockResult =
        byId("targetLockInput");

    if (!checkbox || !lockResult) return;

    lockResult.style.display =
        checkbox.checked ? "flex" : "none";

    calculateVip();
}


/* =========================================================
   INPUT EVENTS
   ========================================================= */

[
    "currentVip",
    "targetVip",
    "multiplier",
    "supportRate",
    "jodRate",
    "usdRate"
].forEach(id => {

    const element = byId(id);

    if (!element) return;

    element.addEventListener("input", () => {

        if (
            id === "currentVip" ||
            id === "targetVip"
        ) {
            renderTransitions();
        }

        calculateVip();
    });

    element.addEventListener("change", () => {

        if (
            id === "currentVip" ||
            id === "targetVip"
        ) {
            renderTransitions();
        }

        calculateVip();
    });
});

byId("firstTransitionInput")
    .addEventListener("input", () => {
        updateFirstTransitionPreview();
        calculateVip();
    });

document
    .querySelectorAll('input[name="mode"]')
    .forEach(radio => {
        radio.addEventListener("change", updateMode);
    });

byId("enableTargetLock")
    .addEventListener("change", updateLock);


/* =========================================================
   SUPPORT PREVIEW
   ========================================================= */

function updateRatePreview() {

    byId("liveSupportRate").textContent =
        formatCoins(numberValue(byId("supportRate").value));

    byId("liveJodRate").textContent =
        formatMoney(numberValue(byId("jodRate").value));

    byId("liveUsdRate").textContent =
        formatMoney(numberValue(byId("usdRate").value));
}


/* =========================================================
   STORAGE
   ========================================================= */

function loadHistory() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) return [];

        const parsed = JSON.parse(saved);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch {
        return [];
    }
}

function saveHistory() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(historyRecords)
    );
}


/* =========================================================
   RECORD
   ========================================================= */

function createRecord() {

    const result = calculateVip();

    return {

        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

        createdAt:
            new Date().toISOString(),

        clientName:
            byId("clientName").value.trim(),

        clientId:
            byId("clientId").value.trim(),

        currentVip:
            result.current,

        targetVip:
            result.target,

        multiplier:
            result.multiplier,

        firstTransition:
            result.firstTransition,

        targetLockEnabled:
            result.targetLockEnabled,

        mode:
            result.mode,

        reachPoints:
            result.reachPoints,

        lockPoints:
            result.lockPoints,

        totalVipPoints:
            result.totalVipPoints,

        actualCharge:
            result.actualCharge,

        supportNeeded:
            result.supportNeeded,

        supportRate:
            result.supportRate,

        jodRate:
            numberValue(byId("jodRate").value),

        usdRate:
            numberValue(byId("usdRate").value),

        jodTotal:
            result.jodTotal,

        usdTotal:
            result.usdTotal
    };
}


/* =========================================================
   SAVE
   ========================================================= */

function saveCurrentOperation() {

    const name =
        byId("clientName").value.trim();

    const id =
        byId("clientId").value.trim();

    if (!name && !id) {

        showStatus(
            "أدخل اسم العميل أو ID الحساب أولاً"
        );

        return;
    }

    const record = createRecord();

    historyRecords.unshift(record);

    saveHistory();
    renderHistory();
    renderStats();

    showStatus(
        "تم حفظ العملية بنجاح"
    );
}

byId("saveBtn")
    .addEventListener(
        "click",
        saveCurrentOperation
    );


/* =========================================================
   TRANSITION DATA FOR RECORDS
   ========================================================= */

function getTransitionDetails(record) {

    const details = [];

    if (
        record.targetVip <=
        record.currentVip
    ) {
        return details;
    }

    details.push({
        from: record.currentVip,
        to: record.currentVip + 1,
        value: record.firstTransition,
        type: "يدوي"
    });

    for (
        let level = record.currentVip + 1;
        level < record.targetVip;
        level++
    ) {

        const next = getVip(level + 1);

        if (!next) continue;

        details.push({
            from: level,
            to: level + 1,
            value: next.upgrade,
            type: "تلقائي"
        });
    }

    return details;
}


/* =========================================================
   HISTORY
   ========================================================= */

function renderHistory() {

    const container = byId("history");
    const search =
        byId("historySearch")
            .value
            .trim()
            .toLowerCase();

    let records = historyRecords;

    if (search) {

        records =
            records.filter(record => {

                const name =
                    String(record.clientName || "")
                        .toLowerCase();

                const id =
                    String(record.clientId || "")
                        .toLowerCase();

                return (
                    name.includes(search) ||
                    id.includes(search)
                );
            });
    }

    if (!records.length) {

        container.innerHTML = `
            <div class="empty-state">
                لا توجد عمليات محفوظة حتى الآن.
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    records.forEach(record => {

        const item =
            document.createElement("article");

        item.className = "history-card";

        const date =
            new Date(record.createdAt);

        const dateText =
            date.toLocaleString(
                "ar",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );

        item.innerHTML = `

            <div class="history-main">

                <b>
                    ${escapeHtml(
                        record.clientName ||
                        "بدون اسم"
                    )}
                </b>

                <span>
                    ID:
                    ${escapeHtml(
                        record.clientId || "-"
                    )}
                </span>

                <span>
                    VIP ${record.currentVip}
                    →
                    VIP ${record.targetVip}
                    •
                    ${formatCoins(record.totalVipPoints)} XP
                </span>

                <span class="history-value">
                    ${formatCoins(record.actualCharge)} كوينز
                </span>

                <span>
                    ${escapeHtml(dateText)}
                </span>

            </div>

            <div class="history-buttons">

                <button
                    type="button"
                    data-view="${escapeHtml(record.id)}"
                >
                    التفاصيل
                </button>

                <button
                    type="button"
                    class="delete-history"
                    data-delete="${escapeHtml(record.id)}"
                >
                    حذف
                </button>

            </div>
        `;

        container.appendChild(item);
    });
}

byId("historySearch")
    .addEventListener(
        "input",
        renderHistory
    );

byId("history")
    .addEventListener(
        "click",
        event => {

            const viewButton =
                event.target.closest("[data-view]");

            const deleteButton =
                event.target.closest("[data-delete]");

            if (viewButton) {
                showRecordDetails(
                    viewButton.dataset.view
                );
            }

            if (deleteButton) {
                deleteRecord(
                    deleteButton.dataset.delete
                );
            }
        }
    );


/* =========================================================
   RECORD DETAILS
   ========================================================= */

function showRecordDetails(id) {

    const record =
        historyRecords.find(
            item => item.id === id
        );

    if (!record) return;

    const modal =
        byId("detailModal");

    const content =
        byId("detailContent");

    const date =
        new Date(record.createdAt)
            .toLocaleString("ar", {
                dateStyle: "full",
                timeStyle: "short"
            });

    const transitions =
        getTransitionDetails(record);

    content.innerHTML = `

        <div class="detail-header">
            <small>FINAL CHARGE</small>
            <strong>${formatCoins(record.actualCharge)}</strong>
            <span>كوينز</span>
        </div>

        <div class="detail-grid">

            <div class="detail-box">
                <span>اسم العميل</span>
                <strong>${escapeHtml(record.clientName || "-")}</strong>
            </div>

            <div class="detail-box">
                <span>ID الحساب</span>
                <strong>${escapeHtml(record.clientId || "-")}</strong>
            </div>

            <div class="detail-box">
                <span>المستوى</span>
                <strong>VIP ${record.currentVip} → VIP ${record.targetVip}</strong>
            </div>

            <div class="detail-box">
                <span>العرض</span>
                <strong>×${record.multiplier}</strong>
            </div>

            <div class="detail-box">
                <span>نقاط الوصول</span>
                <strong>${formatCoins(record.reachPoints)}</strong>
            </div>

            <div class="detail-box">
                <span>نقاط التثبيت</span>
                <strong>${formatCoins(record.lockPoints)}</strong>
            </div>

            <div class="detail-box">
                <span>إجمالي VIP XP</span>
                <strong>${formatCoins(record.totalVipPoints)}</strong>
            </div>

            <div class="detail-box">
                <span>الدعم المطلوب</span>
                <strong>${formatCoins(record.supportNeeded)}</strong>
            </div>

            <div class="detail-box">
                <span>السعر بالدينار</span>
                <strong>${formatMoney(record.jodTotal)} د.أ</strong>
            </div>

            <div class="detail-box">
                <span>السعر بالدولار</span>
                <strong>${formatMoney(record.usdTotal)} $</strong>
            </div>

            <div class="detail-box">
                <span>قيمة الانتقال الأول</span>
                <strong>${formatCoins(record.firstTransition)}</strong>
            </div>

            <div class="detail-box">
                <span>التاريخ</span>
                <strong>${escapeHtml(date)}</strong>
            </div>

        </div>

        <div class="detail-transitions">

            <h3>تفاصيل الانتقالات</h3>

            ${transitions.map(item => `
                <div class="detail-transition-row">
                    <span>
                        VIP ${item.from} → VIP ${item.to}
                        (${item.type})
                    </span>

                    <strong>
                        ${formatCoins(item.value)}
                    </strong>
                </div>
            `).join("")}

        </div>
    `;

    modal.classList.remove("hidden");
}

function closeDetails() {
    byId("detailModal").classList.add("hidden");
}

byId("closeDetail")
    .addEventListener(
        "click",
        closeDetails
    );

byId("detailModal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target ===
                byId("detailModal")
            ) {
                closeDetails();
            }
        }
    );

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {
            closeDetails();
        }
    }
);


/* =========================================================
   DELETE
   ========================================================= */

function deleteRecord(id) {

    historyRecords =
        historyRecords.filter(
            record => record.id !== id
        );

    saveHistory();
    renderHistory();
    renderStats();

    showStatus(
        "تم حذف العملية"
    );
}

byId("clearHistory")
    .addEventListener(
        "click",
        () => {

            if (!historyRecords.length) {
                return;
            }

            const confirmed =
                window.confirm(
                    "هل تريد حذف جميع العمليات المحفوظة؟"
                );

            if (!confirmed) return;

            historyRecords = [];

            saveHistory();
            renderHistory();
            renderStats();

            showStatus(
                "تم حذف السجل بالكامل"
            );
        }
    );


/* =========================================================
   NEW OPERATION
   ========================================================= */

byId("newBtn")
    .addEventListener(
        "click",
        () => {

            byId("clientName").value = "";
            byId("clientId").value = "";

            byId("currentVip").value = "10";
            byId("targetVip").value = "11";

            byId("multiplier").value = "5";

            byId("firstTransitionInput").value = "";

            byId("supportRate").value = "130000";
            byId("jodRate").value = "11";
            byId("usdRate").value = "15";

            byId("enableTargetLock").checked = false;

            byId("targetInput").value = "";
            byId("gamesInput").value = "";

            updateMode();
            updateLock();

            renderTransitions();
            calculateVip();

            calculateTargetCalculator();
            calculateGamesCalculator();

            showStatus(
                "تم تجهيز عملية جديدة"
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    );


/* =========================================================
   STATUS
   ========================================================= */

let statusTimer = null;

function showStatus(message) {

    const status =
        byId("clientStatus");

    if (!status) return;

    status.textContent =
        message;

    status.classList.remove("hidden");

    clearTimeout(statusTimer);

    statusTimer =
        setTimeout(() => {
            status.classList.add("hidden");
        }, 2500);
}


/* =========================================================
   STATS
   ========================================================= */

function renderStats() {

    const operations =
        historyRecords.length;

    const customers =
        new Set(
            historyRecords.map(
                record =>
                    record.clientId ||
                    record.clientName ||
                    record.id
            )
        ).size;

    let charge = 0;
    let support = 0;
    let vipPoints = 0;
    let jod = 0;
    let usd = 0;
    let highest = 0;

    historyRecords.forEach(record => {

        charge +=
            numberValue(record.actualCharge);

        support +=
            numberValue(record.supportNeeded);

        vipPoints +=
            numberValue(record.totalVipPoints);

        jod +=
            numberValue(record.jodTotal);

        usd +=
            numberValue(record.usdTotal);

        highest =
            Math.max(
                highest,
                numberValue(record.targetVip)
            );
    });

    byId("statOperations").textContent =
        formatNumber(operations);

    byId("statCustomers").textContent =
        formatNumber(customers);

    byId("statCharge").textContent =
        formatCoins(charge);

    byId("statSupport").textContent =
        formatCoins(support);

    byId("statVipPoints").textContent =
        formatCoins(vipPoints);

    byId("statJod").textContent =
        formatMoney(jod);

    byId("statUsd").textContent =
        formatMoney(usd);

    byId("statHighestVip").textContent =
        `VIP ${highest}`;
}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme(theme) {

    if (theme === "light") {

        document.body.classList.add("light");

        byId("themeToggle").textContent =
            "☀";

    } else {

        document.body.classList.remove("light");

        byId("themeToggle").textContent =
            "◐";
    }
}

applyTheme(
    localStorage.getItem(THEME_KEY) || "dark"
);

byId("themeToggle")
    .addEventListener(
        "click",
        () => {

            const isLight =
                document.body.classList.contains("light");

            const theme =
                isLight ? "dark" : "light";

            localStorage.setItem(
                THEME_KEY,
                theme
            );

            applyTheme(theme);
        }
    );


/* =========================================================
   MOBILE MENU
   ========================================================= */

byId("mobileMenuBtn")
    .addEventListener(
        "click",
        () => {

            const nav =
                byId("mobileNav");

            nav.classList.toggle("mobile-nav-open");

            if (
                nav.classList.contains(
                    "mobile-nav-open"
                )
            ) {
                nav.style.display = "block";
            } else {
                nav.style.display = "";
            }
        }
    );

byId("mobileNav")
    .addEventListener(
        "click",
        event => {

            if (event.target.closest("a")) {
                byId("mobileNav").style.display = "none";
            }
        }
    );


/* =========================================================
   NAV ACTIVE STATE
   ========================================================= */

const navLinks =
    document.querySelectorAll(".nav-link");

const observedSections =
    document.querySelectorAll(
        "main > section[id]"
    );

const observer =
    new IntersectionObserver(
        entries => {

            entries.forEach(entry => {

                if (!entry.isIntersecting) {
                    return;
                }

                navLinks.forEach(link => {
                    link.classList.remove("active");
                });

                const active =
                    document.querySelector(
                        `.nav-link[href="#${entry.target.id}"]`
                    );

                if (active) {
                    active.classList.add("active");
                }
            });

        },
        {
            rootMargin: "-30% 0px -60% 0px"
        }
    );

observedSections.forEach(
    section => observer.observe(section)
);


/* =========================================================
   TARGET CALCULATOR
   ========================================================= */

function calculateTargetCalculator() {

    const value =
        numberValue(
            byId("targetInput").value
        );

    const jod =
        value / 100000 * TARGET_JOD_RATE;

    const usd =
        value / 100000 * TARGET_USD_RATE;

    byId("targetJod").textContent =
        formatMoney(jod);

    byId("targetUsd").textContent =
        formatMoney(usd);
}

byId("targetInput")
    .addEventListener(
        "input",
        calculateTargetCalculator
    );


/* =========================================================
   GAMES CALCULATOR
   ========================================================= */

function calculateGamesCalculator() {

    const value =
        numberValue(
            byId("gamesInput").value
        );

    const jod =
        value / 100000 * GAMES_JOD_RATE;

    const usd =
        value / 100000 * GAMES_USD_RATE;

    byId("gamesJod").textContent =
        formatMoney(jod);

    byId("gamesUsd").textContent =
        formatMoney(usd);
}

byId("gamesInput")
    .addEventListener(
        "input",
        calculateGamesCalculator
    );


/* =========================================================
   NORMAL CALCULATOR
   ========================================================= */

let calcExpression = "";

function updateNormalDisplay(value) {

    byId("normalDisplay").value =
        value || "0";
}

function appendCalculatorValue(value) {

    if (
        calcExpression === "0" &&
        value !== "."
    ) {
        calcExpression = "";
    }

    calcExpression += value;

    updateNormalDisplay(calcExpression);
}

function clearCalculator() {

    calcExpression = "";

    updateNormalDisplay("0");
}

function deleteCalculatorCharacter() {

    calcExpression =
        calcExpression.slice(0, -1);

    updateNormalDisplay(
        calcExpression || "0"
    );
}

function calculateExpression() {

    if (!calcExpression) return;

    let expression =
        calcExpression
            .replace(/,/g, "")
            .replace(/%/g, "/100");

    /*
        The expression is restricted to calculator-generated
        numeric/operator characters only.
    */
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
        return;
    }

    try {

        const result =
            Function(
                `"use strict"; return (${expression})`
            )();

        if (!Number.isFinite(result)) {
            throw new Error("Invalid result");
        }

        calcExpression =
            String(
                Number(result.toFixed(10))
            );

        updateNormalDisplay(
            calcExpression
        );

    } catch {

        calcExpression = "";

        updateNormalDisplay("خطأ");
    }
}

document
    .querySelectorAll("[data-calc]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.dataset.calc;

                const value =
                    button.dataset.value;

                if (action === "number") {
                    appendCalculatorValue(value);
                }

                if (action === "operator") {
                    appendCalculatorValue(value);
                }

                if (action === "clear") {
                    clearCalculator();
                }

                if (action === "delete") {
                    deleteCalculatorCharacter();
                }

                if (action === "equals") {
                    calculateExpression();
                }
            }
        );
    });


/* =========================================================
   WHATSAPP SHARE
   ========================================================= */

function createWhatsAppMessage() {

    const result =
        calculateVip();

    const name =
        byId("clientName").value.trim();

    const id =
        byId("clientId").value.trim();

    const first =
        formatCoins(result.firstTransition);

    const transitionDetails =
        getTransitionDetails({
            currentVip: result.current,
            targetVip: result.target,
            firstTransition: result.firstTransition
        });

    const transitionText =
        transitionDetails
            .map(
                item =>
                    `VIP ${item.from} → VIP ${item.to}: ${formatCoins(item.value)}`
            )
            .join("\n");

    return [
        "━━━━━━━━━━━━━━━━━━",
        "F90 VIP CONTROL",
        "ملخص عملية VIP",
        "━━━━━━━━━━━━━━━━━━",
        "",
        `العميل: ${name || "-"}`,
        `ID: ${id || "-"}`,
        "",
        `المستوى: VIP ${result.current} → VIP ${result.target}`,
        `العرض: ×${result.multiplier}`,
        "",
        "تفاصيل الانتقالات:",
        transitionText || `الانتقال الأول: ${first}`,
        "",
        `إجمالي XP: ${formatCoins(result.totalVipPoints)}`,
        `إجمالي الشحن: ${formatCoins(result.actualCharge)} كوينز`,
        `الدعم المطلوب: ${formatCoins(result.supportNeeded)}`,
        `سعر الدعم بالدينار: ${formatMoney(result.jodTotal)} د.أ`,
        `سعر الدعم بالدولار: ${formatMoney(result.usdTotal)} $`,
        "",
        "━━━━━━━━━━━━━━━━━━",
        "F90 SMART SYSTEM"
    ].join("\n");
}

byId("whatsappBtn")
    .addEventListener(
        "click",
        () => {

            const result =
                calculateVip();

            if (
                !byId("clientName").value.trim() &&
                !byId("clientId").value.trim()
            ) {

                showStatus(
                    "أدخل اسم العميل أو ID قبل المشاركة"
                );

                return;
            }

            const text =
                createWhatsAppMessage();

            const url =
                "https://wa.me/?text=" +
                encodeURIComponent(text);

            window.open(
                url,
                "_blank",
                "noopener,noreferrer"
            );
        }
    );


/* =========================================================
   CLIENT STATUS CLEAR
   ========================================================= */

[
    "clientName",
    "clientId"
].forEach(id => {

    byId(id)
        .addEventListener(
            "input",
            () => {
                byId("clientStatus")
                    .classList.add("hidden");
            }
        );
});


/* =========================================================
   LIVE CLOCK
   ========================================================= */

function updateClock() {

    const now = new Date();

    byId("liveClock").textContent =
        now.toLocaleTimeString(
            "ar",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
}

updateClock();

setInterval(
    updateClock,
    30000
);


/* =========================================================
   CALCULATE BUTTON
   ========================================================= */

byId("calculateBtn")
    .addEventListener(
        "click",
        () => {

            renderTransitions();
            calculateVip();
            calculateTargetCalculator();
            calculateGamesCalculator();

            showStatus(
                "تم تحديث النظام والنتائج"
            );
        }
    );


/* =========================================================
   KEYBOARD SUPPORT
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "enter"
        ) {

            event.preventDefault();

            calculateVip();

            showStatus(
                "تم تحديث الحسبة"
            );
        }
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeApp() {

    byId("currentVip").value = "10";
    byId("targetVip").value = "11";

    byId("multiplier").value = "5";

    byId("supportRate").value = "130000";
    byId("jodRate").value = "11";
    byId("usdRate").value = "15";

    byId("enableTargetLock").checked = false;

    updateMode();
    updateLock();

    renderTransitions();
    calculateVip();

    calculateTargetCalculator();
    calculateGamesCalculator();

    renderHistory();
    renderStats();
    updateRatePreview();
}

initializeApp();
