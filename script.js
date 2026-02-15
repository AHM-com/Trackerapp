let currentDay = 1;
const totalDays = 30;

// Default Configurations for Dynamic Elements
const DEFAULT_CONFIG = {
  extraSalah: [
    { id: "es_tarawih", label: "তারাবীহ | Tarawih", startDay: 1, removedDay: null },
    { id: "es_witr", label: "বিতর | Witr", startDay: 1, removedDay: null },
    { id: "es_tahajjut", label: "তাহাজ্জুদ | Tahajjut", startDay: 1, removedDay: null },
  ],
  tasks: [
    { id: "dt_morning", label: "সকালের যিকর | Morning Dhikr", startDay: 1, removedDay: null, fixed: true },
    { id: "dt_evening", label: "সন্ধ্যার যিকর | Evening Dhikr", startDay: 1, removedDay: null, fixed: true },
    { id: "dt_sadaqah", label: "দান-সদাকা | Charity", startDay: 1, removedDay: null, fixed: true },

    { id: "dt_good_deed", label: "দিনের কাজ | Good Deed of the Day", startDay: 1, removedDay: null, fixed: false },

    { id: "dt_istighfar", label: "কমপক্ষে ৭০ বার ইস্তিগফার | At least 70x Istighfar", startDay: 1, removedDay: null, fixed: true },
    { id: "dt_quran", label: "কুরআন তিলাওয়াত ও তাদাব্বুর | Quran Recitation & Reflection", startDay: 1, removedDay: null, fixed: true },

    { id: "dt_name", label: "আল্লাহর নাম মুখস্থ | Memorize Allah's Name", startDay: 1, removedDay: null, fixed: false },

    { id: "dt_dua", label: "দিনের দু'আ মুখস্থ | Memorize Daily Dua", startDay: 1, removedDay: null, fixed: false },
    { id: "dt_ayah", label: "দিনের আয়াত | Daily Ayah", startDay: 1, removedDay: null, fixed: false },
    { id: "dt_hadith", label: "দিনের হাদীস | Daily Hadith", startDay: 1, removedDay: null, fixed: false },

    { id: "dt_miswak", label: "মিসওয়াক করা | Use Miswak", startDay: 1, removedDay: null, fixed: true },
    { id: "dt_sleep", label: "ঘুমের পূর্বের যিকর | Pre-Sleep Dhikr", startDay: 1, removedDay: null, fixed: true },
  ],
};

// Load or Initialize Config
let appConfig = JSON.parse(localStorage.getItem("trackerConfig"));
if (!appConfig) {
  appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  localStorage.setItem("trackerConfig", JSON.stringify(appConfig));
} else {
  // small migration: ensure dt_name is deletable if older config had fixed:true
  const t = appConfig?.tasks?.find((x) => x.id === "dt_name");
  if (t && t.fixed === true) {
    t.fixed = false;
    localStorage.setItem("trackerConfig", JSON.stringify(appConfig));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  generateDayButtons();
  switchToDay(1);
  updateDate();
  updateOverallStats();

  // Keep number inputs clean (only digits)
  document.querySelectorAll(".quran-input-group input").forEach((input) => {
    input.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
    });
  });
});

// ---------------- UI Rendering ----------------

function renderDynamicSections() {
  // 1) Extra Salah
  const extraContainer = document.getElementById("extra-salah-container");
  extraContainer.innerHTML = "";

  appConfig.extraSalah.forEach((salah) => {
    if (salah.startDay <= currentDay && (salah.removedDay === null || salah.removedDay > currentDay)) {
      extraContainer.insertAdjacentHTML(
        "beforeend",
        `
        <div class="salah-row single-col" data-extra-id="${escapeHtml(salah.id)}">
            <span>
                ${escapeHtml(salah.label)}
                <span class="action-icons">
                    <span class="icon-btn edit" onclick="renameExtraSalah('${escapeJs(salah.id)}')" title="Rename">✏️</span>
                    <span class="icon-btn delete" onclick="deleteExtraSalah('${escapeJs(salah.id)}')" title="Delete">🗑️</span>
                </span>
            </span>
            <label class="full-width"><input type="checkbox" data-type="complete"> সম্পন্ন | Complete</label>
        </div>
      `
      );
    }
  });

  // 2) Daily Tasks
  const taskContainer = document.getElementById("checklist-container");
  taskContainer.innerHTML = "";

  appConfig.tasks.forEach((task) => {
    if (task.startDay <= currentDay && (task.removedDay === null || task.removedDay > currentDay)) {
      const deleteIcon = !task.fixed
        ? `<span class="icon-btn delete" onclick="deleteTask('${escapeJs(task.id)}')" title="Delete">🗑️</span>`
        : "";

      taskContainer.insertAdjacentHTML(
        "beforeend",
        `
        <label class="check-item" data-task-id="${escapeHtml(task.id)}">
            <input type="checkbox" data-type="task">
            <span>${escapeHtml(task.label)}</span>
            ${deleteIcon}
        </label>
      `
      );
    }
  });

  // Reattach listeners for live progress
  document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener("change", updateDailyProgress);
  });
}

// ---------------- Add/Edit/Delete ----------------

function addExtraSalah() {
  const input = document.getElementById("newExtraSalahInput");
  const label = input.value.trim();
  if (!label) return;

  appConfig.extraSalah.push({
    id: "es_" + Date.now(),
    label,
    startDay: currentDay,
    removedDay: null,
  });

  input.value = "";
  saveConfigAndRerenderPreservingUI();
}

function deleteExtraSalah(id) {
  if (!confirm("এই সালাতটি কি মুছে ফেলতে চান? | Delete this Salah?")) return;
  const item = appConfig.extraSalah.find((s) => s.id === id);
  if (item) item.removedDay = currentDay;
  saveConfigAndRerenderPreservingUI();
}

function renameExtraSalah(id) {
  const item = appConfig.extraSalah.find((s) => s.id === id);
  if (!item) return;

  const newName = prompt("নতুন নাম লিখুন | Enter new name:", item.label);
  if (newName && newName.trim() !== "") {
    item.label = newName.trim();
    saveConfigAndRerenderPreservingUI();
  }
}

function addDailyTask() {
  const input = document.getElementById("newTaskInput");
  const label = input.value.trim();
  if (!label) return;

  appConfig.tasks.push({
    id: "dt_" + Date.now(),
    label,
    startDay: currentDay,
    removedDay: null,
    fixed: false,
  });

  input.value = "";
  saveConfigAndRerenderPreservingUI();
}

function deleteTask(id) {
  if (!confirm("এই কাজটি কি মুছে ফেলতে চান? | Delete this task?")) return;
  const item = appConfig.tasks.find((t) => t.id === id);
  if (item) item.removedDay = currentDay;
  saveConfigAndRerenderPreservingUI();
}

/**
 * ✅ Key fix: do NOT wipe current checkmarks when template changes.
 * Capture current UI state -> save config -> render -> restore UI state.
 */
function saveConfigAndRerenderPreservingUI() {
  const uiState = captureCurrentUIState();

  localStorage.setItem("trackerConfig", JSON.stringify(appConfig));

  renderDynamicSections();

  restoreUIState(uiState);

  updateDailyProgress();
}

// ---------------- Capture/Restore UI state (bug fix) ----------------

function captureCurrentUIState() {
  const state = {
    fixedSalah: {},
    extraSalah: {},
    checklist: {},
    quran: {
      ayat: document.getElementById("quran_ayat")?.value ?? "",
      page: document.getElementById("quran_page")?.value ?? "",
      para: document.getElementById("quran_para")?.value ?? "",
    },
    achievement: document.getElementById("special_achievement")?.value ?? "",
  };

  // fixed salah
  ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach((prayer) => {
    const row = document.querySelector(`[data-salah="${prayer}"]`);
    if (!row) return;
    state.fixedSalah[prayer] = {
      farz: row.querySelector('[data-type="farz"]')?.checked ?? false,
      sunnah: row.querySelector('[data-type="sunnah"]')?.checked ?? false,
    };
  });

  // extra salah visible
  document.querySelectorAll("[data-extra-id]").forEach((row) => {
    const id = row.getAttribute("data-extra-id");
    state.extraSalah[id] = row.querySelector('[data-type="complete"]')?.checked ?? false;
  });

  // checklist visible
  document.querySelectorAll("[data-task-id]").forEach((item) => {
    const id = item.getAttribute("data-task-id");
    state.checklist[id] = item.querySelector('input[type="checkbox"]')?.checked ?? false;
  });

  return state;
}

function restoreUIState(state) {
  // reset visible checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = false));

  // restore fixed salah
  Object.keys(state.fixedSalah || {}).forEach((prayer) => {
    const row = document.querySelector(`[data-salah="${prayer}"]`);
    if (!row) return;
    row.querySelector('[data-type="farz"]').checked = !!state.fixedSalah[prayer].farz;
    row.querySelector('[data-type="sunnah"]').checked = !!state.fixedSalah[prayer].sunnah;
  });

  // restore extra salah (only if still exists/visible)
  Object.keys(state.extraSalah || {}).forEach((id) => {
    const row = document.querySelector(`[data-extra-id="${cssEscape(id)}"]`);
    if (!row) return;
    row.querySelector('[data-type="complete"]').checked = !!state.extraSalah[id];
  });

  // restore checklist (only if still exists/visible)
  Object.keys(state.checklist || {}).forEach((id) => {
    const item = document.querySelector(`[data-task-id="${cssEscape(id)}"]`);
    if (!item) return;
    item.querySelector('input[type="checkbox"]').checked = !!state.checklist[id];
  });

  // restore text inputs
  const ayat = document.getElementById("quran_ayat");
  const page = document.getElementById("quran_page");
  const para = document.getElementById("quran_para");
  const ach = document.getElementById("special_achievement");
  if (ayat) ayat.value = state.quran?.ayat ?? "";
  if (page) page.value = state.quran?.page ?? "";
  if (para) para.value = state.quran?.para ?? "";
  if (ach) ach.value = state.achievement ?? "";
}

// ---------------- Core App Logic ----------------

function generateDayButtons() {
  const grid = document.getElementById("daysGrid");
  grid.innerHTML = "";
  for (let i = 1; i <= totalDays; i++) {
    const btn = document.createElement("button");
    btn.className = "day-btn";
    btn.textContent = i;
    btn.onclick = () => switchToDay(i);
    grid.appendChild(btn);
  }
}

function switchToDay(day) {
  currentDay = day;

  document.querySelectorAll(".day-btn").forEach((b, i) => {
    b.classList.toggle("active", i + 1 === day);
  });

  document.getElementById("currentDayText").textContent = `Day ${day} | দিন ${day}`;

  renderDynamicSections();
  loadDayData(day);
}

function loadDayData(day) {
  const saved = localStorage.getItem(`day_${day}`);
  const data = saved
    ? JSON.parse(saved)
    : { salah: {}, extraSalah: {}, quran: { ayat: "", page: "", para: "" }, checklist: {}, achievement: "" };

  // reset checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = false));

  // fixed salah
  ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach((prayer) => {
    if (data.salah?.[prayer]) {
      const row = document.querySelector(`[data-salah="${prayer}"]`);
      if (!row) return;
      if (data.salah[prayer].farz) row.querySelector('[data-type="farz"]').checked = true;
      if (data.salah[prayer].sunnah) row.querySelector('[data-type="sunnah"]').checked = true;
    }
  });

  // extra salah
  Object.keys(data.extraSalah || {}).forEach((id) => {
    if (!data.extraSalah[id]) return;
    const row = document.querySelector(`[data-extra-id="${cssEscape(id)}"]`);
    if (row) row.querySelector('[data-type="complete"]').checked = true;
  });

  // checklist
  Object.keys(data.checklist || {}).forEach((id) => {
    if (!data.checklist[id]) return;
    const item = document.querySelector(`[data-task-id="${cssEscape(id)}"]`);
    if (item) item.querySelector('input[type="checkbox"]').checked = true;
  });

  // texts
  document.getElementById("quran_ayat").value = data.quran?.ayat || "";
  document.getElementById("quran_page").value = data.quran?.page || "";
  document.getElementById("quran_para").value = data.quran?.para || "";
  document.getElementById("special_achievement").value = data.achievement || "";

  updateDailyProgress();
  updateDayButtonStatus();
}

function saveCurrentDay() {
  const data = { salah: {}, extraSalah: {}, quran: {}, checklist: {}, achievement: "" };

  // fixed salah
  ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach((prayer) => {
    const row = document.querySelector(`[data-salah="${prayer}"]`);
    if (!row) return;
    const farz = row.querySelector('[data-type="farz"]').checked;
    const sunnah = row.querySelector('[data-type="sunnah"]').checked;
    if (farz || sunnah) data.salah[prayer] = { farz, sunnah };
  });

  // extra salah
  document.querySelectorAll("[data-extra-id]").forEach((row) => {
    const id = row.getAttribute("data-extra-id");
    if (row.querySelector('[data-type="complete"]').checked) data.extraSalah[id] = true;
  });

  // checklist
  document.querySelectorAll("[data-task-id]").forEach((item) => {
    const id = item.getAttribute("data-task-id");
    if (item.querySelector('input[type="checkbox"]').checked) data.checklist[id] = true;
  });

  // texts
  data.quran.ayat = document.getElementById("quran_ayat").value.trim();
  data.quran.page = document.getElementById("quran_page").value.trim();
  data.quran.para = document.getElementById("quran_para").value.trim();
  data.achievement = document.getElementById("special_achievement").value.trim();

  localStorage.setItem(`day_${currentDay}`, JSON.stringify(data));

  updateDayButtonStatus();
  updateOverallStats();
  alert(`দিন ${currentDay} সেভ হয়েছে! | Day ${currentDay} Saved!`);
}

function updateDailyProgress() {
  // ✅ dynamic: counts visible checkboxes only
  const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  const totalVisible = allCheckboxes.length;

  let checked = 0;
  allCheckboxes.forEach((cb) => {
    if (cb.checked) checked++;
  });

  const percentage = totalVisible === 0 ? 0 : Math.round((checked / totalVisible) * 100);

  document.getElementById("progressBar").style.width = percentage + "%";
  document.getElementById("progressText").textContent = `${percentage}% Complete (${checked}/${totalVisible})`;
}

function updateDayButtonStatus() {
  document.querySelectorAll(".day-btn").forEach((btn, i) => {
    const day = i + 1;
    btn.classList.toggle("completed", !!localStorage.getItem(`day_${day}`));
  });
}

function updateOverallStats() {
  let savedDays = 0;
  let perfectDays = 0;

  for (let i = 1; i <= totalDays; i++) {
    const data = JSON.parse(localStorage.getItem(`day_${i}`) || "{}");

    const hasContent =
      Object.keys(data.salah || {}).length > 0 ||
      Object.keys(data.checklist || {}).length > 0 ||
      Object.keys(data.extraSalah || {}).length > 0;

    if (hasContent) {
      savedDays++;

      // "Perfect" = all 5 farz done
      const farzCount = Object.values(data.salah || {}).filter((p) => p.farz).length;
      if (farzCount === 5) perfectDays++;
    }
  }

  document.getElementById("completedDays").textContent = savedDays;
  document.getElementById("perfectDays").textContent = perfectDays;
  document.getElementById("completionRate").textContent = Math.round((savedDays / 30) * 100) + "%";
}

function resetCurrentDay() {
  if (confirm(`এই দিনের ডেটা রিসেট করবেন? | Reset Day ${currentDay}?`)) {
    localStorage.removeItem(`day_${currentDay}`);
    loadDayData(currentDay);
    updateOverallStats();
  }
}

function resetAll() {
  if (confirm("সব ৩০ দিনের ডেটা এবং আপনার যোগ করা কাজ মুছে ফেলবেন? | Delete ALL data and reset custom tasks?")) {
    localStorage.clear();
    location.reload();
  }
}

function updateDate() {
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  document.getElementById("currentDate").textContent = new Date().toLocaleDateString(undefined, options);
}

// ---------------- Small helpers ----------------

// prevent HTML injection in labels
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// safe inside onclick string
function escapeJs(str) {
  return String(str).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

// used in querySelector
function cssEscape(str) {
  if (window.CSS && CSS.escape) return CSS.escape(str);
  return String(str).replace(/["\\]/g, "\\$&");
}
