/**
 * Life Dashboard — app.js
 * Features: clock, greeting, focus timer, tasks (no duplicates),
 *           quick links, local storage persistence, dark mode, name modal
 */

'use strict';

/* =============================================
   CONSTANTS & STATE
   ============================================= */
const LS_KEY_NAME    = 'dashboard_username';
const LS_KEY_TASKS   = 'dashboard_tasks';
const LS_KEY_LINKS   = 'dashboard_links';
const LS_KEY_THEME   = 'dashboard_theme';

let timerSeconds  = 25 * 60;   // 25 minutes in seconds
let timerInterval = null;
let timerRunning  = false;

/* =============================================
   DOM REFERENCES
   ============================================= */
// Modal
const nameModal      = document.getElementById('name-modal');
const modalNameInput = document.getElementById('modal-name-input');
const modalSaveBtn   = document.getElementById('modal-save-btn');

// Top card
const clockEl       = document.getElementById('clock');
const dateDisplayEl = document.getElementById('date-display');
const greetingEl    = document.getElementById('greeting');
const themeToggle   = document.getElementById('theme-toggle');
const changeNameBtn = document.getElementById('change-name-btn');

// Timer
const timerDisplay = document.getElementById('timer-display');
const timerStart   = document.getElementById('timer-start');
const timerStop    = document.getElementById('timer-stop');
const timerReset   = document.getElementById('timer-reset');

// Tasks
const taskInput    = document.getElementById('task-input');
const taskAddBtn   = document.getElementById('task-add-btn');
const taskList     = document.getElementById('task-list');
const taskError    = document.getElementById('task-error');

// Links
const linkNameInput  = document.getElementById('link-name-input');
const linkUrlInput   = document.getElementById('link-url-input');
const linkAddBtn     = document.getElementById('link-add-btn');
const linksContainer = document.getElementById('links-container');
const linkError      = document.getElementById('link-error');

/* =============================================
   CLOCK & GREETING
   ============================================= */
function updateClock() {
  const now = new Date();

  // Clock
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${hh}:${mm}:${ss}`;

  // Date — e.g. "Wednesday, October 7, 2026"
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateDisplayEl.textContent = now.toLocaleDateString(undefined, dateOptions);

  // Greeting text
  const hour = now.getHours();
  let period;
  if (hour < 12)      period = 'Good Morning';
  else if (hour < 17) period = 'Good Afternoon';
  else if (hour < 21) period = 'Good Evening';
  else                period = 'Good Night';

  const name = localStorage.getItem(LS_KEY_NAME);
  greetingEl.textContent = name ? `${period}, ${name}! 👋` : `${period}! 👋`;
}

// Kick off immediately, then every second
updateClock();
setInterval(updateClock, 1000);

/* =============================================
   NAME MODAL
   ============================================= */
function openModal() {
  nameModal.classList.remove('hidden');
  modalNameInput.value = localStorage.getItem(LS_KEY_NAME) || '';
  modalNameInput.focus();
}

function closeModal() {
  nameModal.classList.add('hidden');
}

function saveName() {
  const name = modalNameInput.value.trim();
  if (!name) {
    modalNameInput.focus();
    modalNameInput.style.borderColor = 'var(--error-color)';
    setTimeout(() => (modalNameInput.style.borderColor = ''), 1200);
    return;
  }
  localStorage.setItem(LS_KEY_NAME, name);
  updateClock();       // refresh greeting immediately
  closeModal();
}

modalSaveBtn.addEventListener('click', saveName);
modalNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveName();
});

changeNameBtn.addEventListener('click', openModal);

// Show modal if name not yet set
if (!localStorage.getItem(LS_KEY_NAME)) {
  openModal();
}

/* =============================================
   DARK MODE TOGGLE
   ============================================= */
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
    themeToggle.title = 'Switch to light mode';
  } else {
    document.body.classList.remove('dark-mode');
    themeToggle.textContent = '🌙';
    themeToggle.title = 'Switch to dark mode';
  }
}

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark-mode');
  const next   = isDark ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(LS_KEY_THEME, next);
});

// Apply saved theme on load
applyTheme(localStorage.getItem(LS_KEY_THEME) || 'light');

/* =============================================
   FOCUS TIMER
   ============================================= */
function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timerSeconds);
}

timerStart.addEventListener('click', () => {
  if (timerRunning) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.textContent = '00:00';
      // Optional audio cue via title flash
      flashTimerDone();
      return;
    }
    timerSeconds--;
    renderTimer();
  }, 1000);
});

timerStop.addEventListener('click', () => {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
});

timerReset.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning  = false;
  timerSeconds  = 25 * 60;
  renderTimer();
});

function flashTimerDone() {
  let count = 0;
  const id  = setInterval(() => {
    timerDisplay.style.opacity = timerDisplay.style.opacity === '0.3' ? '1' : '0.3';
    if (++count >= 8) {
      clearInterval(id);
      timerDisplay.style.opacity = '1';
    }
  }, 300);
}

/* =============================================
   TASKS
   ============================================= */
function loadTasks() {
  return JSON.parse(localStorage.getItem(LS_KEY_TASKS) || '[]');
}

function saveTasks(tasks) {
  localStorage.setItem(LS_KEY_TASKS, JSON.stringify(tasks));
}

function renderTasks() {
  const tasks = loadTasks();
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    const empty = document.createElement('li');
    empty.style.cssText = 'color: var(--text-muted); font-size: 0.88rem; padding: 8px 4px;';
    empty.textContent   = 'No tasks yet. Add one above!';
    taskList.appendChild(empty);
    return;
  }

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item';

    const checkbox = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => {
      const all = loadTasks();
      all[index].done = checkbox.checked;
      saveTasks(all);
      renderTasks();
    });

    const label = document.createElement('span');
    label.className = 'task-label' + (task.done ? ' done' : '');
    label.textContent = task.text;

    const delBtn = document.createElement('button');
    delBtn.className  = 'task-delete-btn';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      const all = loadTasks();
      all.splice(index, 1);
      saveTasks(all);
      renderTasks();
    });

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(delBtn);
    taskList.appendChild(li);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const tasks = loadTasks();

  // Duplicate check (case-insensitive)
  const duplicate = tasks.some(
    (t) => t.text.toLowerCase() === text.toLowerCase()
  );
  if (duplicate) {
    showError(taskError);
    return;
  }

  hideError(taskError);
  tasks.push({ text, done: false });
  saveTasks(tasks);
  taskInput.value = '';
  renderTasks();
  taskInput.focus();
}

taskAddBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

taskInput.addEventListener('input', () => hideError(taskError));

renderTasks();

/* =============================================
   QUICK LINKS
   ============================================= */
function loadLinks() {
  const defaults = [
    { name: 'Google',   url: 'https://google.com'   },
    { name: 'Gmail',    url: 'https://mail.google.com' },
    { name: 'Calendar', url: 'https://calendar.google.com' },
  ];
  const saved = localStorage.getItem(LS_KEY_LINKS);
  // First visit: seed with defaults
  if (saved === null) {
    saveLinks(defaults);
    return defaults;
  }
  return JSON.parse(saved);
}

function saveLinks(links) {
  localStorage.setItem(LS_KEY_LINKS, JSON.stringify(links));
}

function renderLinks() {
  const links = loadLinks();
  linksContainer.innerHTML = '';

  links.forEach((link, index) => {
    const pill = document.createElement('div');
    pill.className = 'link-pill';

    const anchor = document.createElement('a');
    anchor.className  = 'link-pill-text';
    anchor.href       = link.url;
    anchor.target     = '_blank';
    anchor.rel        = 'noopener noreferrer';
    anchor.textContent = link.name;

    const xBtn = document.createElement('button');
    xBtn.className  = 'link-pill-delete';
    xBtn.textContent = '×';
    xBtn.title = `Remove ${link.name}`;
    xBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const all = loadLinks();
      all.splice(index, 1);
      saveLinks(all);
      renderLinks();
    });

    pill.appendChild(anchor);
    pill.appendChild(xBtn);
    linksContainer.appendChild(pill);
  });
}

function addLink() {
  const name = linkNameInput.value.trim();
  const url  = linkUrlInput.value.trim();

  if (!name || !url) {
    showError(linkError);
    return;
  }

  // Prepend https:// if no protocol supplied
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const links = loadLinks();
  links.push({ name, url: normalizedUrl });
  saveLinks(links);

  linkNameInput.value = '';
  linkUrlInput.value  = '';
  hideError(linkError);
  renderLinks();
}

linkAddBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink();
});
linkNameInput.addEventListener('input', () => hideError(linkError));
linkUrlInput.addEventListener('input',  () => hideError(linkError));

renderLinks();

/* =============================================
   HELPERS
   ============================================= */
function showError(el) {
  el.classList.remove('hidden');
  // Auto-hide after 2.5 seconds
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => hideError(el), 2500);
}

function hideError(el) {
  el.classList.add('hidden');
}
