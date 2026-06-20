// State
let habits = [];
let currentStreak = 0;
let lastLoginDate = null;
let currentHistoryHabitId = null;
let calendarDate = new Date();
let filterState = { status: 'all', category: 'all', routine: 'all', search: '', warningOnly: false };
let userStats = { level: 1, exp: 0, badges: [] };
let noteContext = { id: null, dateStr: null }; // For Note Modal

// DOM Elements
const dateDisplay = document.getElementById('current-date');
const completedCountDisplay = document.getElementById('completed-count');
const streakCountDisplay = document.getElementById('streak-count');

const addHabitForm = document.getElementById('add-habit-form');
const habitInput = document.getElementById('habit-input');
const habitTargetInput = document.getElementById('habit-target');
const habitCategoryInput = document.getElementById('habit-category');
const habitRoutineInput = document.getElementById('habit-routine');

const habitList = document.getElementById('habit-list');
const themeSelector = document.getElementById('theme-selector');
const filterBtns = document.querySelectorAll('.filter-btn:not(#toggle-advanced-btn)');
const toggleAdvancedBtn = document.getElementById('toggle-advanced-btn');
const advancedFiltersPanel = document.getElementById('advanced-filters-panel');
const filterCategory = document.getElementById('filter-category');
const filterRoutine = document.getElementById('filter-routine');
const filterSearch = document.getElementById('filter-search');
const filterWarning = document.getElementById('filter-warning');
const resetFiltersBtn = document.getElementById('reset-filters-btn');

// Modals
const historyModal = document.getElementById('history-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalHabitTitle = document.getElementById('modal-habit-title');
const calendarMonthYear = document.getElementById('calendar-month-year');
const calendarGrid = document.getElementById('calendar-grid');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const calendarNoteDisplay = document.getElementById('calendar-note-display');
const calendarNoteDate = document.getElementById('calendar-note-date');
const calendarNoteText = document.getElementById('calendar-note-text');

const dashboardModal = document.getElementById('dashboard-modal');
const openDashboardBtn = document.getElementById('open-dashboard-btn');
const closeDashboardBtn = document.getElementById('close-dashboard');

const noteModal = document.getElementById('note-modal');
const closeNoteModalBtn = document.getElementById('close-note-modal');
const noteTextarea = document.getElementById('note-textarea');
const saveNoteBtn = document.getElementById('save-note-btn');
const noteHabitName = document.getElementById('note-habit-name');

const editModal = document.getElementById('edit-modal');
const closeEditModalBtn = document.getElementById('close-edit-modal');
const editHabitId = document.getElementById('edit-habit-id');
const editHabitName = document.getElementById('edit-habit-name');
const editHabitTarget = document.getElementById('edit-habit-target');
const editHabitCategory = document.getElementById('edit-habit-category');
const editHabitRoutine = document.getElementById('edit-habit-routine');
const saveEditBtn = document.getElementById('save-edit-btn');

const toastContainer = document.getElementById('toast-container');


// Badge Definitions
const BADGE_DEFS = [
    { id: 'first_step', icon: '🔰', name: '初めの一歩', desc: '初めてタスクを完了した' },
    { id: 'streak_3', icon: '🔥', name: '三日坊主卒業', desc: '3日連続でタスクを達成した' },
    { id: 'streak_7', icon: '✨', name: '習慣化の兆し', desc: '7日連続でタスクを達成した' },
    { id: 'level_5', icon: '🌿', name: '双葉', desc: 'レベル5に到達した' },
    { id: 'level_10', icon: '🌳', name: 'ベテラン', desc: 'レベル10に到達した' },
    { id: 'health_master', icon: '💪', name: '健康マニア', desc: '健康カテゴリを累計20回達成' },
    { id: 'study_master', icon: '📚', name: '勉強の虫', desc: '学習カテゴリを累計20回達成' }
];

// Initialize
function init() {
    loadTheme();
    loadData();
    checkDateAndReset();
    updateDateDisplay();
    updateLevelUI();
    render();
}

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem('appTheme') || 'white';
    document.body.dataset.theme = savedTheme;
    themeSelector.value = savedTheme;
}

themeSelector.addEventListener('change', (e) => {
    const newTheme = e.target.value;
    document.body.dataset.theme = newTheme;
    localStorage.setItem('appTheme', newTheme);
});

// Data Management
function loadData() {
    const savedHabits = localStorage.getItem('habits');
    const savedStreak = localStorage.getItem('currentStreak');
    const savedLastLogin = localStorage.getItem('lastLoginDate');
    const savedUserStats = localStorage.getItem('userStats');

    if (savedUserStats) {
        userStats = JSON.parse(savedUserStats);
        if(!userStats.badges) userStats.badges = [];
    }

    if (savedHabits) {
        let parsedHabits = JSON.parse(savedHabits);
        
        // Migration
        habits = parsedHabits.map(h => {
            if(!h.targetCount) h.targetCount = 1;
            if(!h.dailyRecords) h.dailyRecords = {};
            if(!h.createdAt) h.createdAt = getTodayString();
            if(!h.category) h.category = 'other'; 
            if(!h.routine) h.routine = 'anytime'; // New routine property
            
            // Migrate dailyRecords format from Number to Object {count, note}
            Object.keys(h.dailyRecords).forEach(dateStr => {
                if(typeof h.dailyRecords[dateStr] === 'number') {
                    h.dailyRecords[dateStr] = { count: h.dailyRecords[dateStr], note: '' };
                }
            });
            return h;
        });
    }

    if (savedStreak) currentStreak = parseInt(savedStreak);
    if (savedLastLogin) lastLoginDate = savedLastLogin;

    if (!savedHabits && habits.length === 0) {
        const todayStr = getTodayString();
        habits = [
            { id: generateId(), name: '歯磨きをする', targetCount: 1, category: 'health', routine: 'morning', dailyRecords: {}, createdAt: todayStr },
            { id: generateId(), name: '本を1章読む', targetCount: 1, category: 'study', routine: 'anytime', dailyRecords: {}, createdAt: todayStr },
            { id: generateId(), name: 'メールチェック', targetCount: 1, category: 'work', routine: 'morning', dailyRecords: {}, createdAt: todayStr }
        ];
        saveData();
    }
}

function saveData() {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('currentStreak', currentStreak.toString());
    localStorage.setItem('lastLoginDate', getTodayString());
    localStorage.setItem('userStats', JSON.stringify(userStats));
    checkBadges();
}

function getTodayString() {
    const today = new Date();
    return formatDate(today);
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Toast Notifications
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 4500);
}

// Badges Logic
function checkBadges() {
    const earned = new Set(userStats.badges);
    let newlyEarned = [];
    
    let totalCompletions = 0;
    let healthCompletions = 0;
    let studyCompletions = 0;
    let maxStreak = 0;

    habits.forEach(h => {
        const streak = getHabitStreak(h);
        if(streak > maxStreak) maxStreak = streak;
        
        Object.values(h.dailyRecords).forEach(record => {
            if(record.count >= h.targetCount) {
                totalCompletions++;
                if(h.category === 'health') healthCompletions++;
                if(h.category === 'study') studyCompletions++;
            }
        });
    });

    if(totalCompletions > 0 && !earned.has('first_step')) newlyEarned.push('first_step');
    if(maxStreak >= 3 && !earned.has('streak_3')) newlyEarned.push('streak_3');
    if(maxStreak >= 7 && !earned.has('streak_7')) newlyEarned.push('streak_7');
    if(userStats.level >= 5 && !earned.has('level_5')) newlyEarned.push('level_5');
    if(userStats.level >= 10 && !earned.has('level_10')) newlyEarned.push('level_10');
    if(healthCompletions >= 20 && !earned.has('health_master')) newlyEarned.push('health_master');
    if(studyCompletions >= 20 && !earned.has('study_master')) newlyEarned.push('study_master');

    if(newlyEarned.length > 0) {
        userStats.badges.push(...newlyEarned);
        // Save silently without triggering checkBadges again
        localStorage.setItem('userStats', JSON.stringify(userStats));
        
        newlyEarned.forEach(id => {
            const b = BADGE_DEFS.find(x => x.id === id);
            showToast(`🏆 バッジ獲得: ${b.name}`);
        });
    }
}


// Level & EXP System
function addExp(amount) {
    userStats.exp += amount;
    checkLevelUp();
    saveData();
    updateLevelUI();
}

function removeExp(amount) {
    userStats.exp -= amount;
    if (userStats.exp < 0) {
        if (userStats.level > 1) {
            userStats.level--;
            let expNeeded = userStats.level * 100;
            userStats.exp = expNeeded + userStats.exp;
        } else {
            userStats.exp = 0;
        }
    }
    saveData();
    updateLevelUI();
}

function checkLevelUp() {
    let expNeeded = userStats.level * 100;
    let leveledUp = false;
    while (userStats.exp >= expNeeded) {
        userStats.exp -= expNeeded;
        userStats.level++;
        expNeeded = userStats.level * 100;
        leveledUp = true;
    }
    if (leveledUp) {
        showToast(`🎉 レベルアップ！ Lv.${userStats.level} になりました！`);
    }
}

function updateLevelUI() {
    const levelDisplay = document.getElementById('level-display');
    const expText = document.getElementById('exp-text');
    const expFill = document.getElementById('exp-fill');
    const plantIcon = document.getElementById('plant-icon');

    const expNeeded = userStats.level * 100;
    
    levelDisplay.textContent = `Lv. ${userStats.level}`;
    expText.textContent = `${userStats.exp} / ${expNeeded} EXP`;
    
    const percentage = Math.min(100, Math.max(0, (userStats.exp / expNeeded) * 100));
    expFill.style.width = `${percentage}%`;

    if (userStats.level < 5) {
        plantIcon.className = 'fa-solid fa-seedling';
        plantIcon.style.color = '#10b981'; 
    } else if (userStats.level < 10) {
        plantIcon.className = 'fa-solid fa-leaf';
        plantIcon.style.color = '#34d399'; 
    } else if (userStats.level < 20) {
        plantIcon.className = 'fa-solid fa-tree';
        plantIcon.style.color = '#059669'; 
    } else {
        plantIcon.className = 'fa-solid fa-crown';
        plantIcon.style.color = '#fbbf24'; 
    }
}

// Logic for daily resets and streaks
function checkDateAndReset() {
    const today = getTodayString();
    
    if (lastLoginDate && lastLoginDate !== today) {
        const last = new Date(lastLoginDate);
        const curr = new Date(today);
        const diffTime = Math.abs(curr - last);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays > 1) {
            currentStreak = 0;
        }
        lastLoginDate = today;
        saveData();
    } else if (!lastLoginDate) {
        lastLoginDate = today;
        saveData();
    }
}

function getRecord(habit, dateStr) {
    return habit.dailyRecords[dateStr] || { count: 0, note: '' };
}

function isHabitCompleted(habit, dateStr) {
    return getRecord(habit, dateStr).count >= habit.targetCount;
}

function getDaysSinceLastCompletion(habit, todayStr) {
    let lastCompletedDateStr = null;
    let maxTime = 0;

    for (const [dateStr, record] of Object.entries(habit.dailyRecords)) {
        if (record.count >= habit.targetCount) {
            const time = new Date(dateStr).getTime();
            if (time > maxTime) {
                maxTime = time;
                lastCompletedDateStr = dateStr;
            }
        }
    }

    const today = new Date(todayStr);

    if (!lastCompletedDateStr) {
        if(habit.createdAt) {
            const created = new Date(habit.createdAt);
            const diffTime = today - created;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays; 
        }
        return 0; 
    }

    const lastDate = new Date(lastCompletedDateStr);
    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function calculateStats() {
    const today = getTodayString();
    let completedToday = 0;

    habits.forEach(habit => {
        if (isHabitCompleted(habit, today)) {
            completedToday++;
        }
    });

    completedCountDisplay.textContent = completedToday;
    
    if(completedToday > 0 && currentStreak === 0) {
        currentStreak = 1;
        saveData();
    }
    streakCountDisplay.textContent = currentStreak;
}

// Filters
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        filterState.status = e.target.dataset.filter;
        render();
    });
});

toggleAdvancedBtn.addEventListener('click', () => {
    advancedFiltersPanel.classList.toggle('hidden');
});

function handleFilterChange() {
    filterState.category = filterCategory.value;
    filterState.routine = filterRoutine.value;
    filterState.search = filterSearch.value.toLowerCase().trim();
    filterState.warningOnly = filterWarning.checked;
    render();
}

filterCategory.addEventListener('change', handleFilterChange);
filterRoutine.addEventListener('change', handleFilterChange);
filterSearch.addEventListener('input', handleFilterChange);
filterWarning.addEventListener('change', handleFilterChange);

resetFiltersBtn.addEventListener('click', () => {
    filterCategory.value = 'all';
    filterRoutine.value = 'all';
    filterSearch.value = '';
    filterWarning.checked = false;
    handleFilterChange();
});

// Drag and Drop Logic (Reordering within routines)
function isAllFiltersOff() {
    return filterState.status === 'all' && 
           filterState.category === 'all' && 
           filterState.routine === 'all' && 
           filterState.search === '' && 
           filterState.warningOnly === false;
}

habitList.addEventListener('dragstart', (e) => {
    if (!isAllFiltersOff()) return;
    const item = e.target.closest('.habit-item');
    if (item) {
        item.classList.add('dragging');
    }
});

habitList.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!isAllFiltersOff()) return;
    
    const draggingItem = document.querySelector('.dragging');
    const overItem = e.target.closest('.habit-item');
    
    if (draggingItem && overItem && draggingItem !== overItem) {
        // Prevent dragging across different routines visually if they have headers
        const bounding = overItem.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        if (e.clientY - offset > 0) {
            overItem.after(draggingItem);
        } else {
            overItem.before(draggingItem);
        }
    }
});

habitList.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!isAllFiltersOff()) return;
    
    const draggingItem = document.querySelector('.dragging');
    if (draggingItem) {
        draggingItem.classList.remove('dragging');
        
        const items = [...habitList.querySelectorAll('.habit-item')];
        const newHabitsOrder = items.map(item => item.dataset.id);
        
        habits.sort((a, b) => {
            return newHabitsOrder.indexOf(a.id) - newHabitsOrder.indexOf(b.id);
        });
        
        saveData();
        render(); 
    }
});

habitList.addEventListener('dragend', (e) => {
    const item = e.target.closest('.habit-item');
    if (item) {
        item.classList.remove('dragging');
    }
});


// Interactions: Form
addHabitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = habitInput.value.trim();
    const target = parseInt(habitTargetInput.value) || 1;
    const category = habitCategoryInput.value || 'other';
    const routine = habitRoutineInput.value || 'anytime';

    if (name && target > 0) {
        habits.push({
            id: generateId(),
            name: name,
            targetCount: target,
            category: category,
            routine: routine,
            dailyRecords: {},
            createdAt: getTodayString()
        });
        habitInput.value = '';
        habitTargetInput.value = '1';
        saveData();
        render();
    }
});

window.incrementHabit = function(id) {
    const today = getTodayString();
    const habit = habits.find(h => h.id === id);
    if (habit) {
        let record = getRecord(habit, today);
        if(record.count < habit.targetCount) {
            record.count++;
            habit.dailyRecords[today] = record;
            
            if (record.count === habit.targetCount) {
                addExp(50);
            }
        }
        saveData();
        render();
        if(!historyModal.classList.contains('hidden') && currentHistoryHabitId === id) {
            renderCalendar();
        }
    }
};

window.decrementHabit = function(event, id) {
    event.stopPropagation();
    const today = getTodayString();
    const habit = habits.find(h => h.id === id);
    if (habit) {
        let record = getRecord(habit, today);
        if(record.count > 0) {
            if (record.count === habit.targetCount) {
                removeExp(50);
            }
            record.count--;
            if(record.count === 0 && !record.note) {
                delete habit.dailyRecords[today];
            } else {
                habit.dailyRecords[today] = record;
            }
        }
        saveData();
        render();
        if(!historyModal.classList.contains('hidden') && currentHistoryHabitId === id) {
            renderCalendar();
        }
    }
};

window.deleteHabit = function(id) {
    if(confirm('この習慣を削除してもよろしいですか？')) {
        habits = habits.filter(h => h.id !== id);
        saveData();
        render();
    }
};

// Edit Habit Logic
window.openEditModal = function(id) {
    const habit = habits.find(h => h.id === id);
    if(habit) {
        editHabitId.value = habit.id;
        editHabitName.value = habit.name;
        editHabitTarget.value = habit.targetCount;
        editHabitCategory.value = habit.category || 'other';
        editHabitRoutine.value = habit.routine || 'anytime';
        editModal.classList.remove('hidden');
    }
};
closeEditModalBtn.addEventListener('click', () => editModal.classList.add('hidden'));

saveEditBtn.addEventListener('click', () => {
    const id = editHabitId.value;
    const habit = habits.find(h => h.id === id);
    if(habit) {
        const name = editHabitName.value.trim();
        const target = parseInt(editHabitTarget.value);
        if(name && target > 0) {
            habit.name = name;
            habit.targetCount = target;
            habit.category = editHabitCategory.value;
            habit.routine = editHabitRoutine.value;
            saveData();
            render();
            editModal.classList.add('hidden');
        }
    }
});


// Note Modal Logic
window.openNoteModal = function(id, dateStr = getTodayString()) {
    const habit = habits.find(h => h.id === id);
    if(habit) {
        noteContext = { id, dateStr };
        noteHabitName.textContent = `${habit.name} (${dateStr})`;
        
        let record = getRecord(habit, dateStr);
        noteTextarea.value = record.note || '';
        
        noteModal.classList.remove('hidden');
        noteTextarea.focus();
    }
};

closeNoteModalBtn.addEventListener('click', () => noteModal.classList.add('hidden'));

saveNoteBtn.addEventListener('click', () => {
    const habit = habits.find(h => h.id === noteContext.id);
    if(habit) {
        let record = getRecord(habit, noteContext.dateStr);
        record.note = noteTextarea.value.trim();
        
        if(record.count === 0 && record.note === '') {
            delete habit.dailyRecords[noteContext.dateStr];
        } else {
            habit.dailyRecords[noteContext.dateStr] = record;
        }
        
        saveData();
        noteModal.classList.add('hidden');
        
        // Refresh calendar if open
        if(!historyModal.classList.contains('hidden') && currentHistoryHabitId === habit.id) {
            renderCalendar();
            // Also update note display below calendar
            calendarNoteText.textContent = record.note;
            if(!record.note) calendarNoteDisplay.classList.add('hidden');
        }
    }
});


// UI Rendering
function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('ja-JP', options);
    if (dateDisplay) dateDisplay.textContent = dateStr;
}

function renderMiniGraph(habit) {
    let html = `<div class="mini-graph"><span class="mini-graph-label">Last 7 days:</span>`;
    for(let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);
        const isDone = isHabitCompleted(habit, dateStr);
        html += `<div class="mini-dot ${isDone ? 'done' : 'missed'}" title="${dateStr}"></div>`;
    }
    html += `</div>`;
    return html;
}

function render() {
    const today = getTodayString();
    habitList.innerHTML = '';

    const isAllFilter = isAllFiltersOff();
    
    let filteredHabits = habits.filter(h => {
        // Status filter
        if(filterState.status === 'incomplete' && isHabitCompleted(h, today)) return false;
        if(filterState.status === 'completed' && !isHabitCompleted(h, today)) return false;

        // Category filter
        if(filterState.category !== 'all' && (h.category || 'other') !== filterState.category) return false;

        // Routine filter
        if(filterState.routine !== 'all' && (h.routine || 'anytime') !== filterState.routine) return false;

        // Search filter
        if(filterState.search !== '' && !h.name.toLowerCase().includes(filterState.search)) return false;

        // Warning filter
        if(filterState.warningOnly) {
            const daysMissed = getDaysSinceLastCompletion(h, today);
            const isCompletedToday = getRecord(h, today).count >= h.targetCount;
            if(daysMissed < 2 || isCompletedToday) return false;
        }

        return true;
    });

    if (filteredHabits.length === 0) {
        let msg = "最初の習慣を追加して、新しい毎日を始めましょう！";
        if(filterState.status === 'incomplete' && habits.length > 0) msg = "今日のタスクはすべて完了しています！素晴らしいです！🎉";
        if(filterState.status === 'completed' && habits.length > 0) msg = "まだ今日完了したタスクはありません。";
        if(!isAllFilter && habits.length > 0 && filterState.status !== 'incomplete' && filterState.status !== 'completed') msg = "条件に一致する習慣が見つかりませんでした。";
        
        habitList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-seedling"></i>
                <p>${msg}</p>
            </div>
        `;
    } else {
        const routines = [
            { id: 'morning', icon: '☀️', name: '朝のルーティン' },
            { id: 'afternoon', icon: '☕', name: '昼のルーティン' },
            { id: 'evening', icon: '🌙', name: '夜のルーティン' },
            { id: 'anytime', icon: '🌟', name: 'いつでも' }
        ];

        routines.forEach(routine => {
            const routineHabits = filteredHabits.filter(h => h.routine === routine.id);
            if(routineHabits.length > 0) {
                // Render Routine Header
                const header = document.createElement('div');
                header.className = 'routine-header';
                header.innerHTML = `${routine.icon} ${routine.name}`;
                habitList.appendChild(header);

                // Render Habits in this routine
                routineHabits.forEach((habit, index) => {
                    const record = getRecord(habit, today);
                    const isCompletedToday = record.count >= habit.targetCount;
                    const daysMissed = getDaysSinceLastCompletion(habit, today);
                    const hasNote = record.note && record.note.trim() !== '';
                    
                    const li = document.createElement('li');
                    li.className = `habit-item ${isCompletedToday ? 'completed' : ''}`;
                    li.style.animationDelay = `${index * 0.05}s`;
                    li.dataset.id = habit.id;
                    
                    if (isAllFilter) li.draggable = true;
                    
                    let warningHtml = '';
                    if (daysMissed >= 2 && !isCompletedToday) {
                        warningHtml = `<div class="habit-warning"><i class="fa-solid fa-triangle-exclamation"></i> ${daysMissed}日していません！</div>`;
                    }

                    const catNames = { 'health': '💪 健康', 'study': '📚 学習', 'work': '💼 仕事', 'hobby': '🎨 趣味', 'chores': '🧹 家事', 'other': '🌟 その他' };
                    const catTag = `<span class="category-tag cat-${habit.category || 'other'}">${catNames[habit.category] || catNames.other}</span>`;

                    li.innerHTML = `
                        <div class="habit-main-row">
                            <div class="habit-info-group">
                                <div class="counter-ui">
                                    <button class="btn-minus" onclick="decrementHabit(event, '${habit.id}')" title="カウントを減らす">
                                        <i class="fa-solid fa-minus"></i>
                                    </button>
                                    <div class="counter-pill ${isCompletedToday ? 'completed' : ''}" onclick="incrementHabit('${habit.id}')" title="カウントを増やす">
                                        ${isCompletedToday ? '<i class="fa-solid fa-check"></i>' : `${record.count} / ${habit.targetCount}`}
                                    </div>
                                </div>
                                <div class="habit-name-wrapper" onclick="incrementHabit('${habit.id}')">
                                    ${catTag}
                                    <span class="habit-name">${escapeHTML(habit.name)}</span>
                                </div>
                            </div>
                            <div class="habit-actions">
                                <button class="btn-icon note" onclick="openNoteModal('${habit.id}')" title="メモを書く">
                                    <i class="${hasNote ? 'fa-solid' : 'fa-regular'} fa-note-sticky"></i>
                                </button>
                                <button class="btn-icon history" onclick="openHistory('${habit.id}')" title="履歴を見る">
                                    <i class="fa-regular fa-calendar-days"></i>
                                </button>
                                <button class="btn-icon edit" onclick="openEditModal('${habit.id}')" title="編集">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button class="btn-icon delete" onclick="deleteHabit('${habit.id}')" title="削除">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                        <div class="habit-meta-row">
                            ${warningHtml}
                            ${renderMiniGraph(habit)}
                        </div>
                    `;
                    habitList.appendChild(li);
                });
            }
        });
    }

    calculateStats();
}


// ---------------------------
// History Modal & Calendar
// ---------------------------
window.openHistory = function(id) {
    const habit = habits.find(h => h.id === id);
    if(habit) {
        currentHistoryHabitId = id;
        modalHabitTitle.textContent = habit.name;
        calendarDate = new Date(); 
        calendarNoteDisplay.classList.add('hidden'); // hide note display initially
        renderCalendar();
        historyModal.classList.remove('hidden');
    }
}

closeModalBtn.addEventListener('click', () => { historyModal.classList.add('hidden'); });
prevMonthBtn.addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() - 1); renderCalendar(); });
nextMonthBtn.addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() + 1); renderCalendar(); });

window.showCalendarNote = function(dateStr) {
    const habit = habits.find(h => h.id === currentHistoryHabitId);
    if(habit) {
        const record = getRecord(habit, dateStr);
        if(record.note) {
            calendarNoteDate.textContent = `📝 ${dateStr} のメモ`;
            calendarNoteText.textContent = record.note;
            calendarNoteDisplay.classList.remove('hidden');
        } else {
            calendarNoteDisplay.classList.add('hidden');
        }
    }
};

function renderCalendar() {
    const habit = habits.find(h => h.id === currentHistoryHabitId);
    if(!habit) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    calendarMonthYear.textContent = `${year}年 ${month + 1}月`;
    
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    let html = '';
    
    dayNames.forEach(day => { html += `<div class="cal-day-name">${day}</div>`; });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = getTodayString();

    for(let i = 0; i < firstDay; i++) { html += `<div class="cal-cell empty"></div>`; }

    for(let i = 1; i <= daysInMonth; i++) {
        const dateStr = formatDate(new Date(year, month, i));
        const record = getRecord(habit, dateStr);
        const isCompleted = record.count >= habit.targetCount;
        const isToday = dateStr === todayStr;
        const hasNote = record.note && record.note.trim() !== '';
        
        let classes = 'cal-cell';
        if(isCompleted) classes += ' completed';
        if(isToday) classes += ' today';

        let content = `${i}`;
        if(record.count > 0 && habit.targetCount > 1) {
            content += `<span class="cal-cell-count">${record.count}/${habit.targetCount}</span>`;
        }
        if(hasNote) {
            content += `<i class="fa-solid fa-circle" style="font-size: 0.3rem; margin-top: 2px; color: var(--accent-gradient);"></i>`;
        }

        html += `<div class="${classes}" onclick="showCalendarNote('${dateStr}')">${content}</div>`;
    }

    calendarGrid.innerHTML = html;
}

// ---------------------------
// Dashboard & Analytics Logic
// ---------------------------
openDashboardBtn.addEventListener('click', () => {
    renderDashboard();
    dashboardModal.classList.remove('hidden');
});

closeDashboardBtn.addEventListener('click', () => {
    dashboardModal.classList.add('hidden');
});

function renderDashboard() {
    renderBadges();
    renderHeatmap();
    renderWeeklyChart();
    renderCategoryBreakdown();
    renderRanking();
}

function renderBadges() {
    const container = document.getElementById('badges-container');
    let html = '';
    const earned = new Set(userStats.badges || []);

    BADGE_DEFS.forEach(b => {
        const isUnlocked = earned.has(b.id);
        html += `
            <div class="badge-item ${isUnlocked ? 'unlocked' : ''}">
                <div class="badge-icon" title="${b.name}\n${b.desc}">${b.icon}</div>
                <span class="badge-name">${b.name}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderHeatmap() {
    const container = document.getElementById('heatmap-grid');
    let html = '<div class="heatmap-grid-inner">';
    
    const daysToRender = 91; // 13 weeks * 7 days
    let dates = [];
    for(let i = daysToRender - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(formatDate(d));
    }
    
    dates.forEach(dateStr => {
        let completedCount = 0;
        habits.forEach(h => {
            if (isHabitCompleted(h, dateStr)) completedCount++;
        });
        
        let lvl = 0;
        if(completedCount > 0) lvl = 1;
        if(completedCount >= 2) lvl = 2;
        if(completedCount >= 4) lvl = 3;
        if(completedCount >= 6) lvl = 4;
        
        html += `<div class="heatmap-cell lvl-${lvl}" title="${dateStr}: ${completedCount}タスク完了"></div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function renderWeeklyChart() {
    const container = document.getElementById('weekly-chart');
    let html = '';
    
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    let maxCount = 0;
    
    let weeklyData = [];
    for(let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);
        let count = 0;
        habits.forEach(h => { if (isHabitCompleted(h, dateStr)) count++; });
        if(count > maxCount) maxCount = count;
        weeklyData.push({ day: dayNames[d.getDay()], count });
    }
    
    if(maxCount === 0) maxCount = 1; 
    
    weeklyData.forEach(d => {
        const height = (d.count / maxCount) * 100;
        html += `
            <div class="bar-col">
                <span class="bar-label" style="font-weight:bold; color:var(--text-main);">${d.count}</span>
                <div class="bar-fill" style="height: ${height}%"></div>
                <span class="bar-label">${d.day}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderCategoryBreakdown() {
    const container = document.getElementById('category-chart');
    const catCounts = { 'health': 0, 'study': 0, 'work': 0, 'hobby': 0, 'chores': 0, 'other': 0 };
    const catColors = { 'health': '#ef4444', 'study': '#3b82f6', 'work': '#f59e0b', 'hobby': '#a855f7', 'chores': '#14b8a6', 'other': '#9ca3af' };
    const catNames = { 'health': '健康', 'study': '学習', 'work': '仕事', 'hobby': '趣味', 'chores': '家事', 'other': 'その他' };
    
    let total = 0;
    
    habits.forEach(h => {
        const cat = h.category || 'other';
        Object.entries(h.dailyRecords).forEach(([dateStr, record]) => {
            if(record.count >= h.targetCount) {
                catCounts[cat]++;
                total++;
            }
        });
    });
    
    if(total === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">まだ完了データがありません。</p>';
        return;
    }
    
    let html = '';
    const sortedCats = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]);
    
    sortedCats.forEach(cat => {
        if(catCounts[cat] > 0) {
            const percentage = (catCounts[cat] / total) * 100;
            html += `
                <div class="cat-row">
                    <span class="cat-label" style="color: ${catColors[cat]}">${catNames[cat]}</span>
                    <div class="cat-bar-bg">
                        <div class="cat-bar-fill" style="width: ${percentage}%; background-color: ${catColors[cat]}"></div>
                    </div>
                    <span class="cat-count">${catCounts[cat]}</span>
                </div>
            `;
        }
    });
    container.innerHTML = html;
}

function getHabitStreak(habit) {
    const todayStr = getTodayString();
    let currentStreak = 0;
    let checkDate = new Date();
    
    if(!isHabitCompleted(habit, todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while(true) {
        const dStr = formatDate(checkDate);
        if(isHabitCompleted(habit, dStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return currentStreak;
}

function renderRanking() {
    const container = document.getElementById('ranking-list');
    
    const habitsWithStreak = habits.map(h => ({
        ...h,
        streak: getHabitStreak(h)
    }));
    
    habitsWithStreak.sort((a, b) => b.streak - a.streak);
    
    const top3 = habitsWithStreak.slice(0, 3).filter(h => h.streak > 0);
    
    if(top3.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">まだ連続記録はありません。今日から始めましょう！</p>';
        return;
    }
    
    let html = '';
    top3.forEach((h, i) => {
        const rank = i + 1;
        const catNames = { 'health': '💪', 'study': '📚', 'work': '💼', 'hobby': '🎨', 'chores': '🧹', 'other': '🌟' };
        html += `
            <li class="ranking-item">
                <div class="rank-badge rank-${rank}">${rank}</div>
                <div class="rank-info">
                    <span class="rank-name">${catNames[h.category || 'other']} ${escapeHTML(h.name)}</span>
                    <span class="rank-streak">🔥 ${h.streak} 日連続中！</span>
                </div>
            </li>
        `;
    });
    container.innerHTML = html;
}

// Utils
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Run app
init();
