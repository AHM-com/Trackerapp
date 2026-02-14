let currentDay = 1;
const totalDays = 30;

// Total checkboxes counted in progress:
// 5 prayers × 2 (farz + sunnah) = 10
// 3 extra prayers × 1 (complete) = 3
// 12 checklist items = 12
// TOTAL = 25 items
const TOTAL_CHECKBOX_ITEMS = 25;

document.addEventListener('DOMContentLoaded', () => {
    generateDayButtons();
    loadAllData();
    switchToDay(1);
    updateDate();
});

function generateDayButtons() {
    const grid = document.getElementById('daysGrid');
    grid.innerHTML = '';
    for (let i = 1; i <= totalDays; i++) {
        const btn = document.createElement('button');
        btn.className = 'day-btn';
        btn.textContent = i;
        btn.onclick = () => switchToDay(i);
        grid.appendChild(btn);
    }
}

function switchToDay(day) {
    currentDay = day;
    document.querySelectorAll('.day-btn').forEach((b, i) => {
        b.classList.toggle('active', i + 1 === day);
    });
    document.getElementById('currentDayText').textContent = `Day ${day} | দিন ${day}`;
    loadDayData(day);
}

function loadDayData(day) {
    const saved = localStorage.getItem(`day_${day}`);
    const data = saved ? JSON.parse(saved) : { 
        salah: {}, 
        quran: { ayat: '', page: '', para: '' }, 
        checklist: {}, 
        achievement: '' 
    };

    // Reset all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // Reset text inputs
    document.getElementById('quran_ayat').value = '';
    document.getElementById('quran_page').value = '';
    document.getElementById('quran_para').value = '';
    document.getElementById('special_achievement').value = '';

    // Load 5 daily prayers with Farz/Sunnah
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(prayer => {
        if (data.salah?.[prayer]) {
            const row = document.querySelector(`[data-salah="${prayer}"]`);
            if (row) {
                if (data.salah[prayer].farz) {
                    row.querySelector('[data-type="farz"]').checked = true;
                }
                if (data.salah[prayer].sunnah) {
                    row.querySelector('[data-type="sunnah"]').checked = true;
                }
            }
        }
    });

    // Load extra prayers (Taraweeh, Duha, Tahiyatul Wudu)
    ['taraweeh', 'duha', 'tahiyatul_wudu'].forEach(prayer => {
        if (data.salah?.[prayer]?.complete) {
            const row = document.querySelector(`[data-salah="${prayer}"]`);
            if (row) {
                row.querySelector('[data-type="complete"]').checked = true;
            }
        }
    });

    // Load Quran text inputs (NOT counted in progress)
    if (data.quran) {
        if (data.quran.ayat) document.getElementById('quran_ayat').value = data.quran.ayat;
        if (data.quran.page) document.getElementById('quran_page').value = data.quran.page;
        if (data.quran.para) document.getElementById('quran_para').value = data.quran.para;
    }

    // Load Checklist checkboxes (counted in progress)
    if (data.checklist) {
        Object.keys(data.checklist).forEach(key => {
            const cb = document.querySelector(`[data-check="${key}"]`);
            if (cb && data.checklist[key]) {
                cb.checked = true;
            }
        });
    }

    // Load Special Achievement text (NOT counted in progress)
    if (data.achievement) {
        document.getElementById('special_achievement').value = data.achievement;
    }

    updateDailyProgress();
    updateDayButtonStatus();
}

function saveCurrentDay() {
    const data = { 
        salah: {}, 
        quran: {}, 
        checklist: {}, 
        achievement: '' 
    };

    // Save 5 daily prayers with Farz/Sunnah
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(prayer => {
        const row = document.querySelector(`[data-salah="${prayer}"]`);
        if (row) {
            const farz = row.querySelector('[data-type="farz"]').checked;
            const sunnah = row.querySelector('[data-type="sunnah"]').checked;
            if (farz || sunnah) {
                data.salah[prayer] = { farz, sunnah };
            }
        }
    });

    // Save extra prayers (single checkbox)
    ['taraweeh', 'duha', 'tahiyatul_wudu'].forEach(prayer => {
        const row = document.querySelector(`[data-salah="${prayer}"]`);
        if (row) {
            const complete = row.querySelector('[data-type="complete"]').checked;
            if (complete) {
                data.salah[prayer] = { complete: true };
            }
        }
    });

    // Save Quran text inputs (NOT counted in progress)
    data.quran.ayat = document.getElementById('quran_ayat').value.trim();
    data.quran.page = document.getElementById('quran_page').value.trim();
    data.quran.para = document.getElementById('quran_para').value.trim();

    // Save Checklist checkboxes (counted in progress)
    document.querySelectorAll('[data-check]').forEach(cb => {
        if (cb.checked) {
            data.checklist[cb.dataset.check] = true;
        }
    });

    // Save Special Achievement text (NOT counted in progress)
    data.achievement = document.getElementById('special_achievement').value.trim();

    localStorage.setItem(`day_${currentDay}`, JSON.stringify(data));
    
    updateDayButtonStatus();
    updateOverallStats();
    showNotification(`✅ Day ${currentDay} Saved Successfully! | দিন ${currentDay} সেভ হয়েছে!`, 'success');
}

function updateDailyProgress() {
    let checked = 0;
    
    // Count only checkboxes (Salah + Checklist)
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.checked) checked++;
    });
    
    const percentage = Math.min(100, Math.round((checked / TOTAL_CHECKBOX_ITEMS) * 100));
    
    document.getElementById('progressBar').style.width = percentage + '%';
    document.getElementById('progressText').textContent = `${percentage}% Complete (${checked}/${TOTAL_CHECKBOX_ITEMS})`;
}

function updateDayButtonStatus() {
    document.querySelectorAll('.day-btn').forEach((btn, i) => {
        const day = i + 1;
        btn.classList.toggle('completed', !!localStorage.getItem(`day_${day}`));
    });
}

function updateOverallStats() {
    let savedDays = 0;
    let perfectDays = 0;

    for (let i = 1; i <= totalDays; i++) {
        const data = JSON.parse(localStorage.getItem(`day_${i}`) || '{}');
        
        // Check if day has any content
        const hasSalah = Object.keys(data.salah || {}).length > 0;
        const hasChecklist = Object.keys(data.checklist || {}).length > 0;
        
        if (hasSalah || hasChecklist) {
            savedDays++;
            
            // Perfect day = all 8 salah items + at least 8 checklist items
            const salahCount = Object.keys(data.salah || {}).length;
            const checkCount = Object.keys(data.checklist || {}).length;
            if (salahCount === 8 && checkCount >= 8) {
                perfectDays++;
            }
        }
    }

    document.getElementById('completedDays').textContent = savedDays;
    document.getElementById('perfectDays').textContent = perfectDays;
    document.getElementById('completionRate').textContent = Math.round((savedDays / 30) * 100) + '%';
}

function resetCurrentDay() {
    if (confirm(`Reset Day ${currentDay}? | দিন ${currentDay} রিসেট করবেন?`)) {
        localStorage.removeItem(`day_${currentDay}`);
        loadDayData(currentDay);
        showNotification('🔄 Day Reset! | দিন রিসেট হয়েছে!', 'info');
    }
}

function resetAll() {
    if (confirm('Delete ALL 30 days data? | সব ৩০ দিনের ডেটা মুছে ফেলবেন?')) {
        for (let i = 1; i <= 30; i++) {
            localStorage.removeItem(`day_${i}`);
        }
        switchToDay(1);
        showNotification('🗑️ All Data Cleared! | সব ডেটা মুছে ফেলা হয়েছে!', 'warning');
    }
}

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateBangla = new Date().toLocaleDateString('bn-BD', options);
    const dateEnglish = new Date().toLocaleDateString('en-US', options);
    document.getElementById('currentDate').textContent = `${dateBangla} | ${dateEnglish}`;
}

function showNotification(msg, type = 'success') {
    const old = document.querySelector('.notification');
    if (old) old.remove();
    
    const colors = { 
        success: '#28a745', 
        info: '#17a2b8', 
        warning: '#dc3545' 
    };
    
    const div = document.createElement('div');
    div.className = 'notification';
    div.textContent = msg;
    div.style.cssText = `
        background: ${colors[type]};
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.animation = 'slideOut 0.4s ease';
        setTimeout(() => div.remove(), 400);
    }, 3500);
}

// Live progress update (no auto-save)
document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updateDailyProgress);
});

// Prevent non-numeric input in Quran fields
document.querySelectorAll('.quran-input-group input').forEach(input => {
    input.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
});

function loadAllData() {
    updateDayButtonStatus();
    updateOverallStats();
}