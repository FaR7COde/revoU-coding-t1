/* ==========================================================================
   Life Dashboard — Clean Minimalist JavaScript
   Features: Clock, Greeting, Custom Name, Focus Timer, Task Board, Quick Links,
             Light/Dark Mode, Sort Tasks, Toast Notifications
   All data persisted via Local Storage.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ──────────────────────────────────────────────
  // DOM References
  // ──────────────────────────────────────────────
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date-display');
  const greetingPrefix = document.getElementById('greeting-prefix');
  const nameInput = document.getElementById('name-input');

  const themeToggle = document.getElementById('theme-toggle');
  const iconMoon = document.getElementById('theme-icon-moon');
  const iconSun = document.getElementById('theme-icon-sun');

  // Timer
  const timerDisplay = document.getElementById('timer-display');
  const timerLabel = document.getElementById('timer-label');
  const startBtn = document.getElementById('timer-start');
  const pauseBtn = document.getElementById('timer-pause');
  const resetBtn = document.getElementById('timer-reset');
  const timerTabs = document.querySelectorAll('.timer-tab');
  const presetBtns = document.querySelectorAll('.preset');
  const sessionCountEl = document.getElementById('session-count');
  const ringFg = document.querySelector('.ring-fg');

  // Tasks
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskPriority = document.getElementById('task-priority');
  const taskCategory = document.getElementById('task-category');
  const taskDueDate = document.getElementById('task-due-date');
  const tasksContainer = document.getElementById('tasks-container');
  const sortSelect = document.getElementById('sort-select');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const progressPercent = document.getElementById('progress-percent');
  const progressFill = document.getElementById('progress-fill');

  // Links
  const linkForm = document.getElementById('link-form');
  const linkNameInput = document.getElementById('link-name');
  const linkUrlInput = document.getElementById('link-url');
  const linksContainer = document.getElementById('links-container');

  // Toast
  const toastContainer = document.getElementById('toast-container');

  // ──────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────
  let tasks = JSON.parse(localStorage.getItem('dashboard_tasks')) || [];
  let links = JSON.parse(localStorage.getItem('dashboard_links')) || [
    { id: 1, name: 'Google', url: 'https://www.google.com' },
    { id: 2, name: 'Gmail', url: 'https://mail.google.com' },
    { id: 3, name: 'GitHub', url: 'https://github.com' }
  ];
  let activeFilter = 'all';

  // Timer state
  let currentMode = 'focus';
  const timerDurations = {
    'focus': parseInt(localStorage.getItem('timer_dur_focus')) || 25 * 60,
    'short-break': parseInt(localStorage.getItem('timer_dur_short')) || 5 * 60,
    'long-break': parseInt(localStorage.getItem('timer_dur_long')) || 15 * 60
  };
  let timerInterval = null;
  let timerRunning = false;
  let timeLeft = timerDurations[currentMode];
  let sessionCount = parseInt(localStorage.getItem('dashboard_sessions')) || 0;

  // SVG ring math
  const RING_RADIUS = 85;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  if (ringFg) {
    ringFg.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
    ringFg.style.strokeDashoffset = RING_CIRCUMFERENCE;
  }

  // ──────────────────────────────────────────────
  // Utilities
  // ──────────────────────────────────────────────
  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, (ch) => map[ch]);
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast${type === 'error' ? ' toast-error' : ''}`;

    const icon = type === 'error'
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

    toast.innerHTML = `${icon}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2500);
  }

  // ──────────────────────────────────────────────
  // Theme (Light / Dark)
  // ──────────────────────────────────────────────
  function initTheme() {
    const saved = localStorage.getItem('dashboard_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      iconMoon.classList.add('hidden');
      iconSun.classList.remove('hidden');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      iconMoon.classList.remove('hidden');
      iconSun.classList.add('hidden');
    }
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('dashboard_theme', 'light');
      iconMoon.classList.remove('hidden');
      iconSun.classList.add('hidden');
      showToast('Switched to Light Mode');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('dashboard_theme', 'dark');
      iconMoon.classList.add('hidden');
      iconSun.classList.remove('hidden');
      showToast('Switched to Dark Mode');
    }
  });

  // ──────────────────────────────────────────────
  // Clock, Date & Greeting
  // ──────────────────────────────────────────────
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}:${s}`;

    dateEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const hour = now.getHours();
    let greeting = 'Good Night';
    if (hour >= 5 && hour < 12) greeting = 'Good Morning';
    else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17 && hour < 22) greeting = 'Good Evening';
    greetingPrefix.textContent = greeting;
  }

  // ──────────────────────────────────────────────
  // Custom Name (Challenge #2)
  // ──────────────────────────────────────────────
  function autoResizeName() {
    const temp = document.createElement('span');
    temp.style.visibility = 'hidden';
    temp.style.position = 'absolute';
    temp.style.whiteSpace = 'pre';
    temp.style.font = window.getComputedStyle(nameInput).font;
    temp.textContent = nameInput.value || nameInput.placeholder || 'stranger';
    document.body.appendChild(temp);
    nameInput.style.width = `${temp.getBoundingClientRect().width + 12}px`;
    temp.remove();
  }

  nameInput.value = localStorage.getItem('dashboard_name') || '';
  autoResizeName();

  nameInput.addEventListener('input', () => {
    autoResizeName();
    localStorage.setItem('dashboard_name', nameInput.value.trim());
  });

  updateClock();
  setInterval(updateClock, 1000);

  // ──────────────────────────────────────────────
  // Focus Timer (Pomodoro)
  // ──────────────────────────────────────────────
  function playAlarm() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const beep = (time, freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.35, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        osc.start(time);
        osc.stop(time + 0.45);
      };
      beep(ctx.currentTime, 587.33);
      beep(ctx.currentTime + 0.3, 659.25);
      beep(ctx.currentTime + 0.6, 880.00);
    } catch (e) {
      console.warn('Audio alarm failed', e);
    }
  }

  function formatTime(sec) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function setRingProgress(percent) {
    if (!ringFg) return;
    const offset = RING_CIRCUMFERENCE - (percent / 100 * RING_CIRCUMFERENCE);
    ringFg.style.strokeDashoffset = offset;
  }

  function updateTimerUI() {
    timerDisplay.textContent = formatTime(timeLeft);
    const maxDur = timerDurations[currentMode];
    const pct = maxDur > 0 ? (timeLeft / maxDur) * 100 : 0;
    setRingProgress(pct);

    if (timerRunning) {
      const label = currentMode === 'focus' ? 'Focusing' : 'Break';
      document.title = `(${formatTime(timeLeft)}) ${label} — Dashboard`;
    } else {
      document.title = 'Life Dashboard — Organize Your Day';
    }
  }

  function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerUI();

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        playAlarm();

        if (currentMode === 'focus') {
          sessionCount++;
          localStorage.setItem('dashboard_sessions', sessionCount);
          sessionCountEl.textContent = sessionCount;
          showToast('Focus session complete! Great work.');
          switchMode('short-break');
        } else {
          showToast('Break over — ready to focus?');
          switchMode('focus');
        }
      }
    }, 1000);

    updateTimerUI();
    showToast('Timer started');
  }

  function pauseTimer() {
    if (!timerRunning) return;
    clearInterval(timerInterval);
    timerRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    updateTimerUI();
    showToast('Timer paused');
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timeLeft = timerDurations[currentMode];
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    updateTimerUI();
  }

  function switchMode(mode) {
    currentMode = mode;

    timerTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // Update ring color & label
    if (ringFg) {
      if (mode === 'focus') {
        ringFg.style.stroke = 'var(--primary)';
        timerLabel.textContent = 'Focus';
      } else if (mode === 'short-break') {
        ringFg.style.stroke = 'var(--success)';
        timerLabel.textContent = 'Short Break';
      } else {
        ringFg.style.stroke = 'hsl(195, 85%, 50%)';
        timerLabel.textContent = 'Long Break';
      }
    }

    highlightActivePreset();
    resetTimer();
  }

  function highlightActivePreset() {
    presetBtns.forEach(btn => {
      const mins = parseInt(btn.dataset.minutes);
      btn.classList.toggle('active', timerDurations[currentMode] === mins * 60);
    });
  }

  // Timer tab clicks
  timerTabs.forEach(tab => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });

  // Preset clicks
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.dataset.minutes);
      timerDurations[currentMode] = mins * 60;

      // Persist per-mode
      const keys = { 'focus': 'timer_dur_focus', 'short-break': 'timer_dur_short', 'long-break': 'timer_dur_long' };
      localStorage.setItem(keys[currentMode], timerDurations[currentMode]);

      highlightActivePreset();
      resetTimer();
      showToast(`Duration set to ${mins} minutes`);
    });
  });

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);

  sessionCountEl.textContent = sessionCount;
  switchMode('focus');

  // ──────────────────────────────────────────────
  // Task Board
  // ──────────────────────────────────────────────
  function saveTasks() {
    localStorage.setItem('dashboard_tasks', JSON.stringify(tasks));
    updateProgress();
  }

  function updateProgress() {
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    progressPercent.textContent = `${pct}%`;
    progressFill.style.width = `${pct}%`;
  }

  function getFilteredSortedTasks() {
    let list = [...tasks];

    // Filter
    if (activeFilter === 'active') list = list.filter(t => !t.completed);
    else if (activeFilter === 'completed') list = list.filter(t => t.completed);

    // Sort (Challenge #3)
    const sortBy = sortSelect.value;
    if (sortBy === 'alphabetical') {
      list.sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortBy === 'priority-highest') {
      const pMap = { high: 3, medium: 2, low: 1 };
      list.sort((a, b) => pMap[b.priority] - pMap[a.priority]);
    } else if (sortBy === 'due-date') {
      list.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else {
      // date-newest (default)
      list.sort((a, b) => b.createdAt - a.createdAt);
    }

    return list;
  }

  function renderTasks() {
    tasksContainer.innerHTML = '';
    const list = getFilteredSortedTasks();

    if (list.length === 0) {
      let msg = 'No tasks yet — add one above!';
      if (activeFilter === 'active') msg = 'All clear! No active tasks.';
      if (activeFilter === 'completed') msg = 'No completed tasks yet.';

      tasksContainer.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span>${msg}</span>
        </div>`;
      return;
    }

    list.forEach(task => {
      const el = document.createElement('div');
      el.className = `task-item${task.completed ? ' completed' : ''}`;
      el.dataset.id = task.id;

      // Due date
      let dueHtml = '';
      if (task.dueDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        const isOverdue = task.dueDate < todayStr && !task.completed;
        const formatted = new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dueHtml = `<span class="due-badge${isOverdue ? ' overdue' : ''}">${isOverdue ? 'Overdue · ' : ''}${formatted}</span>`;
      }

      // Category labels
      const catLabels = { work: 'Work', personal: 'Personal', study: 'Study', life: 'Life' };

      el.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Toggle completion">
        <div class="task-content">
          <span class="task-text">${escapeHtml(task.text)}</span>
          <div class="task-meta">
            <span class="pill pill-${task.priority}">${task.priority}</span>
            <span class="pill pill-${task.category}">${catLabels[task.category] || 'Life'}</span>
            ${dueHtml}
          </div>
        </div>
        <div class="task-actions">
          <button class="action-btn edit" title="Edit" aria-label="Edit task">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-btn delete" title="Delete" aria-label="Delete task">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>`;

      // Checkbox toggle
      el.querySelector('.task-checkbox').addEventListener('change', () => {
        toggleTask(task.id);
      });

      // Delete
      el.querySelector('.action-btn.delete').addEventListener('click', () => {
        deleteTask(task.id);
      });

      // Edit (click or double-click text)
      const editBtn = el.querySelector('.action-btn.edit');
      const textSpan = el.querySelector('.task-text');

      const startEdit = () => {
        if (el.classList.contains('editing')) return;
        el.classList.add('editing');
        const currentText = task.text;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-edit-input';
        input.value = currentText;
        textSpan.replaceWith(input);
        input.focus();

        let done = false;
        const finish = (save) => {
          if (done) return;
          done = true;

          if (save) {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
              if (isDuplicate(newText)) {
                showToast('A task with that name already exists', 'error');
                done = false;
                input.focus();
                return;
              }
              task.text = newText;
              saveTasks();
              showToast('Task updated');
            }
          }
          renderTasks();
        };

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') finish(true);
          if (e.key === 'Escape') finish(false);
        });
        input.addEventListener('blur', () => finish(true));
      };

      editBtn.addEventListener('click', startEdit);
      textSpan.addEventListener('dblclick', startEdit);

      tasksContainer.appendChild(el);
    });
  }

  function isDuplicate(text) {
    return tasks.some(t => t.text.trim().toLowerCase() === text.trim().toLowerCase());
  }

  function addTask(e) {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    if (isDuplicate(text)) {
      showToast('This task already exists!', 'error');
      return;
    }

    tasks.push({
      id: Date.now(),
      text,
      completed: false,
      priority: taskPriority.value,
      category: taskCategory.value,
      dueDate: taskDueDate.value || null,
      createdAt: Date.now()
    });

    saveTasks();
    taskInput.value = '';
    taskPriority.value = 'medium';
    taskCategory.value = 'personal';
    taskDueDate.value = '';
    renderTasks();
    showToast('Task added');
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
      if (task.completed) showToast('Task completed! 🎉');
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    showToast('Task deleted');
  }

  taskForm.addEventListener('submit', addTask);
  sortSelect.addEventListener('change', renderTasks);

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  // ──────────────────────────────────────────────
  // Quick Links
  // ──────────────────────────────────────────────
  function saveLinks() {
    localStorage.setItem('dashboard_links', JSON.stringify(links));
  }

  function getFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return '';
    }
  }

  function renderLinks() {
    linksContainer.innerHTML = '';

    if (links.length === 0) {
      linksContainer.innerHTML = '<div class="empty-state" style="padding:1rem 0;width:100%"><span>No links saved yet.</span></div>';
      return;
    }

    links.forEach(link => {
      const chip = document.createElement('a');
      chip.className = 'link-chip';
      chip.href = link.url;
      chip.target = '_blank';
      chip.rel = 'noopener noreferrer';

      const faviconUrl = getFaviconUrl(link.url);
      const faviconHtml = faviconUrl
        ? `<img class="link-favicon" src="${faviconUrl}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : '';

      chip.innerHTML = `
        ${faviconHtml}
        <span>${escapeHtml(link.name)}</span>
        <button class="link-delete" title="Remove" aria-label="Remove link">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>`;

      chip.querySelector('.link-delete').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteLink(link.id);
      });

      linksContainer.appendChild(chip);
    });
  }

  function addLink(e) {
    e.preventDefault();
    const name = linkNameInput.value.trim();
    let url = linkUrlInput.value.trim();

    if (!name || !url) {
      showToast('Please fill in both fields', 'error');
      return;
    }

    // Auto-prefix https
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      showToast('Please enter a valid URL', 'error');
      return;
    }

    links.push({ id: Date.now(), name, url });
    saveLinks();
    linkNameInput.value = '';
    linkUrlInput.value = '';
    renderLinks();
    showToast(`"${name}" shortcut added`);
  }

  function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    saveLinks();
    renderLinks();
    showToast('Shortcut removed');
  }

  linkForm.addEventListener('submit', addLink);

  // ──────────────────────────────────────────────
  // Initialize Everything
  // ──────────────────────────────────────────────
  initTheme();
  renderTasks();
  saveTasks();
  renderLinks();
});
