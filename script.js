// ===== UTILITY FUNCTIONS =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close">×</button>
  `;
  
  container.appendChild(toast);
  
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  });
  
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function showModal(content) {
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal">${content}</div>
    </div>
  `;
  
  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });
}

function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
}

// ===== DATE & TIME =====
function updateDateTime() {
  const now = new Date();
  const formatted = now.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  document.getElementById("datetime").textContent = formatted;
}
setInterval(updateDateTime, 1000);
updateDateTime();

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "◐";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "◐" : "◉";
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateChartColors();
  
  // Update mobile theme button
  const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
  if (mobileThemeToggle) {
    mobileThemeToggle.textContent = isDark ? '◐ Theme' : '◉ Theme';
  }
});

// ===== NAVIGATION =====
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll("main section");
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    sections.forEach((s) => s.classList.remove("active-section"));
    document.getElementById(btn.dataset.section).classList.add("active-section");
    
    // Update progress section if it's being shown
    if (btn.dataset.section === "progress") {
      updateProgress();
    }
    
    // Initialize calculator if it's being shown
    if (btn.dataset.section === "calculator") {
      updateCalcDisplay();
    }
  });
});

// ===== DATA MANAGEMENT =====
let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = localStorage.getItem("currentUser") || null;
let tasks = [];
let notes = [];
let currentFilter = "all";
let currentDateFilter = "all";
let currentCategoryFilter = "all";
let currentProjectFilter = "all";
let taskSearchQuery = "";
let noteSearchQuery = "";
let globalSearchQuery = "";
let currentCalendarDate = new Date();
let widgetConfig = JSON.parse(localStorage.getItem("widgetConfig")) || null;

function normalizeEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
  return email.trim().toLowerCase();
}

function loadUserData() {
  if (!currentUser || !users[currentUser]) {
    tasks = [];
    notes = [];
    updateCategoryAndProjectLists();
    return;
  }
  tasks = users[currentUser].tasks || [];
  notes = users[currentUser].notes || [];
  updateCategoryAndProjectLists();
}

function saveUserData() {
  if (!currentUser) return;
  users[currentUser].tasks = tasks;
  users[currentUser].notes = notes;
  localStorage.setItem("users", JSON.stringify(users));
}

function updateAuthUI() {
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const accountBtn = document.getElementById("account-btn");
  const userBadge = document.getElementById("user-badge");
  const userName = document.getElementById("user-name");

  if (currentUser && users[currentUser]) {
    const name = users[currentUser].name || currentUser.split("@")[0];
    userName.textContent = name;
    userBadge.textContent = name;
    userBadge.classList.remove("hidden");
    loginBtn.classList.add("hidden");
    registerBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    accountBtn.classList.remove("hidden");
  } else {
    userName.textContent = "Guest";
    userBadge.classList.add("hidden");
    loginBtn.classList.remove("hidden");
    registerBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    accountBtn.classList.add("hidden");
  }
}

// ===== TASKS =====
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskPriority = document.getElementById("task-priority");
const taskCategory = document.getElementById("task-category");
const taskProject = document.getElementById("task-project");
const taskDueDate = document.getElementById("task-due-date");
const taskList = document.getElementById("task-list");
const taskSearch = document.getElementById("task-search");
const categoryFilter = document.getElementById("category-filter");
const projectFilter = document.getElementById("project-filter");
const globalSearch = document.getElementById("global-search");

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  const priority = taskPriority.value;
  const category = taskCategory.value.trim() || null;
  const project = taskProject.value.trim() || null;
  const dueDate = taskDueDate.value || null;
  if (!text) return;

  tasks.push({ 
    id: Date.now(), 
    text, 
    completed: false, 
    priority,
    category: category,
    project: project,
    dueDate: dueDate,
    createdAt: new Date().toISOString()
  });
  taskInput.value = "";
  taskCategory.value = "";
  taskProject.value = "";
  taskDueDate.value = "";
  updateCategoryAndProjectLists();
        renderTasks();
        updateCalendar();
        updateDashboard();
        updateProgress();
        showToast("Task added successfully!", "success");
});

taskSearch.addEventListener("input", (e) => {
  taskSearchQuery = e.target.value.toLowerCase();
  renderTasks();
});

function isTaskOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function filterByDate(tasks) {
  if (currentDateFilter === "all") return tasks;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return tasks.filter(task => {
    if (!task.dueDate) {
      if (currentDateFilter === "overdue") return false;
      return currentDateFilter === "all";
    }
    
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    
    if (currentDateFilter === "overdue") {
      return isTaskOverdue(task);
    }
    
    if (currentDateFilter === "today") {
      return due.getTime() === today.getTime();
    }
    
    if (currentDateFilter === "week") {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      return due >= today && due <= weekEnd;
    }
    
    if (currentDateFilter === "month") {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return due >= today && due <= monthEnd;
    }
    
    return true;
  });
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderTasks() {
  taskList.innerHTML = "";
  let filtered = tasks
    .filter((t) => currentFilter === "all" || t.priority === currentFilter)
    .filter((t) => t.text.toLowerCase().includes(taskSearchQuery))
    .filter((t) => globalSearchQuery === "" || t.text.toLowerCase().includes(globalSearchQuery.toLowerCase()))
    .filter((t) => currentCategoryFilter === "all" || t.category === currentCategoryFilter)
    .filter((t) => currentProjectFilter === "all" || t.project === currentProjectFilter);
  
  filtered = filterByDate(filtered);

  if (filtered.length === 0) {
    taskList.innerHTML = '<li style="text-align:center;padding:2rem;color:var(--text-light);">No tasks found</li>';
    updateDashboard();
    return;
  }

  filtered.forEach((task) => {
    const li = document.createElement("li");
    const overdue = isTaskOverdue(task);
    li.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''} ${overdue ? 'overdue' : ''}`;
    
    const dueDateHtml = task.dueDate ? `
      <span class="task-due-date ${overdue ? 'overdue' : ''}">
        ◐ ${formatDate(task.dueDate)} ${overdue ? '◬' : ''}
      </span>
    ` : '';
    
    const categoryHtml = task.category ? `<span class="task-badge category">${task.category}</span>` : '';
    const projectHtml = task.project ? `<span class="task-badge project">${task.project}</span>` : '';
    
    li.innerHTML = `
      <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
      <div class="task-content">
        <span class="task-text" data-id="${task.id}">${task.text}</span>
        <div class="task-meta">
          ${dueDateHtml}
          ${categoryHtml}
          ${projectHtml}
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn edit" data-id="${task.id}">◈</button>
        <button class="icon-btn delete" data-id="${task.id}">⌫</button>
      </div>
    `;
    taskList.appendChild(li);
  });

  // Event listeners
  document.querySelectorAll(".task-checkbox").forEach((box) => {
    box.addEventListener("click", (e) => {
      const id = parseInt(e.target.dataset.id);
      const task = tasks.find((t) => t.id === id);
      if (task) {
        task.completed = !task.completed;
        if (task.completed && !task.completedAt) {
          task.completedAt = new Date().toISOString();
        } else if (!task.completed) {
          task.completedAt = null;
        }
        renderTasks();
        updateCalendar();
        updateProgress();
        showToast(task.completed ? "Task completed!" : "Task reopened", "success");
      }
    });
  });

  document.querySelectorAll(".task-text").forEach((text) => {
    text.addEventListener("dblclick", (e) => {
      const id = parseInt(e.target.dataset.id);
      editTask(id);
    });
  });

  document.querySelectorAll(".task-actions .edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.dataset.id);
      editTask(id);
    });
  });

  document.querySelectorAll(".task-actions .delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.dataset.id);
      tasks = tasks.filter((t) => t.id !== id);
      renderTasks();
      updateCalendar();
      updateProgress();
      showToast("Task deleted", "error");
    });
  });

  updateDashboard();
  saveUserData();
}

function editTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const dueDateValue = task.dueDate ? task.dueDate.split('T')[0] : '';

  showModal(`
    <h3>Edit Task</h3>
    <label>Task Text</label>
    <input type="text" id="edit-task-text" value="${task.text}" />
    <label>Priority</label>
    <select id="edit-task-priority">
      <option value="low" ${task.priority === 'low' ? 'selected' : ''}>🟢 Low</option>
      <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>🟡 Medium</option>
      <option value="high" ${task.priority === 'high' ? 'selected' : ''}>🔴 High</option>
    </select>
    <label>Category</label>
    <input type="text" id="edit-task-category" value="${task.category || ''}" list="edit-category-list" />
    <datalist id="edit-category-list"></datalist>
    <label>Project</label>
    <input type="text" id="edit-task-project" value="${task.project || ''}" list="edit-project-list" />
    <datalist id="edit-project-list"></datalist>
    <label>Due Date</label>
    <input type="date" id="edit-task-due-date" value="${dueDateValue}" />
    <div class="modal-actions">
      <button class="btn btn-success" id="save-task-edit">Save</button>
      <button class="btn btn-danger" onclick="closeModal()">Cancel</button>
    </div>
  `);

  updateDatalistOptions('edit-category-list', getAllCategories());
  updateDatalistOptions('edit-project-list', getAllProjects());

  document.getElementById("save-task-edit").addEventListener("click", () => {
    const newText = document.getElementById("edit-task-text").value.trim();
    const newPriority = document.getElementById("edit-task-priority").value;
    const newCategory = document.getElementById("edit-task-category").value.trim() || null;
    const newProject = document.getElementById("edit-task-project").value.trim() || null;
    const newDueDate = document.getElementById("edit-task-due-date").value || null;
    if (newText) {
      task.text = newText;
      task.priority = newPriority;
      task.category = newCategory;
      task.project = newProject;
      task.dueDate = newDueDate;
      updateCategoryAndProjectLists();
      renderTasks();
      updateCalendar();
      updateProgress();
      closeModal();
      showToast("Task updated!", "success");
    }
  });
}

function getAllCategories() {
  const categories = new Set();
  tasks.forEach(t => { if (t.category) categories.add(t.category); });
  notes.forEach(n => { if (n.category) categories.add(n.category); });
  return Array.from(categories).sort();
}

function getAllProjects() {
  const projects = new Set();
  tasks.forEach(t => { if (t.project) projects.add(t.project); });
  return Array.from(projects).sort();
}

function updateDatalistOptions(listId, options) {
  const datalist = document.getElementById(listId);
  if (!datalist) return;
  datalist.innerHTML = '';
  options.forEach(option => {
    const optionEl = document.createElement('option');
    optionEl.value = option;
    datalist.appendChild(optionEl);
  });
}

function updateCategoryAndProjectLists() {
  const categories = getAllCategories();
  const projects = getAllProjects();
  
  updateDatalistOptions('category-list', categories);
  updateDatalistOptions('note-category-list', categories);
  updateDatalistOptions('project-list', projects);
  
  if (categoryFilter) {
    const currentValue = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });
    categoryFilter.value = currentValue || 'all';
  }
  
  if (projectFilter) {
    const currentValue = projectFilter.value;
    projectFilter.innerHTML = '<option value="all">All Projects</option>';
    projects.forEach(proj => {
      const option = document.createElement('option');
      option.value = proj;
      option.textContent = proj;
      projectFilter.appendChild(option);
    });
    projectFilter.value = currentValue || 'all';
  }
}

document.querySelectorAll(".filter-btn").forEach((btn) => {
  if (!btn.classList.contains("date-filter")) {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => {
        if (!b.classList.contains("date-filter")) {
          b.classList.remove("active");
        }
      });
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  }
});

document.querySelectorAll(".date-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".date-filter").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentDateFilter = btn.dataset.dateFilter;
    renderTasks();
  });
});

if (categoryFilter) {
  categoryFilter.addEventListener("change", () => {
    currentCategoryFilter = categoryFilter.value;
    renderTasks();
  });
}

if (projectFilter) {
  projectFilter.addEventListener("change", () => {
    currentProjectFilter = projectFilter.value;
    renderTasks();
  });
}

if (globalSearch) {
  globalSearch.addEventListener("input", (e) => {
    globalSearchQuery = e.target.value;
    renderTasks();
    renderNotes();
  });
}

// ===== NOTES =====
const noteForm = document.getElementById("note-form");
const noteTitle = document.getElementById("note-title");
const noteContent = document.getElementById("note-content");
const noteCategory = document.getElementById("note-category");
const noteList = document.getElementById("note-list");
const noteSearch = document.getElementById("note-search");

noteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = noteTitle.value.trim();
  const content = noteContent.value.trim();
  const category = noteCategory.value.trim() || null;
  if (!title || !content) return;

  notes.push({ 
    id: Date.now(), 
    title, 
    content,
    category: category,
    createdAt: new Date().toISOString()
  });
  noteTitle.value = "";
  noteContent.value = "";
  noteCategory.value = "";
  updateCategoryAndProjectLists();
  renderNotes();
  updateProgress();
  showToast("Note saved!", "success");
});

noteSearch.addEventListener("input", (e) => {
  noteSearchQuery = e.target.value.toLowerCase();
  renderNotes();
});

function renderNotes() {
  noteList.innerHTML = "";
  const filtered = notes.filter((n) => {
    const matchesSearch = (n.title.toLowerCase().includes(noteSearchQuery) ||
      n.content.toLowerCase().includes(noteSearchQuery));
    const matchesGlobal = globalSearchQuery === "" || 
      n.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(globalSearchQuery.toLowerCase());
    return matchesSearch && matchesGlobal;
  });

  if (filtered.length === 0) {
    noteList.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-light);">No notes found</div>';
    updateDashboard();
    return;
  }

  filtered.forEach((note) => {
    const div = document.createElement("div");
    div.className = "note-card";
    const categoryHtml = note.category ? `<span class="task-badge category">${note.category}</span>` : '';
    div.innerHTML = `
      <div class="note-header">
        <h4 class="note-title" data-id="${note.id}">${note.title}</h4>
        <div style="display:flex;gap:0.5rem;">
          <button class="icon-btn edit" data-id="${note.id}">◈</button>
          <button class="icon-btn delete" data-id="${note.id}">⌫</button>
        </div>
      </div>
      <p class="note-content" data-id="${note.id}">${note.content}</p>
      ${categoryHtml ? `<div class="note-meta">${categoryHtml}</div>` : ''}
    `;
    noteList.appendChild(div);
  });

  document.querySelectorAll(".note-title, .note-content").forEach((el) => {
    el.addEventListener("dblclick", (e) => {
      const id = parseInt(e.target.dataset.id);
      editNote(id);
    });
  });

  document.querySelectorAll(".note-card .edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.dataset.id);
      editNote(id);
    });
  });

  document.querySelectorAll(".note-card .delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.dataset.id);
      notes = notes.filter((n) => n.id !== id);
      renderNotes();
      updateProgress();
      showToast("Note deleted", "error");
    });
  });

  updateDashboard();
  saveUserData();
}

function editNote(id) {
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  showModal(`
    <h3>Edit Note</h3>
    <label>Title</label>
    <input type="text" id="edit-note-title" value="${note.title}" />
    <label>Content</label>
    <textarea id="edit-note-content" style="min-height:120px;">${note.content}</textarea>
    <label>Category</label>
    <input type="text" id="edit-note-category" value="${note.category || ''}" list="edit-note-category-list" />
    <datalist id="edit-note-category-list"></datalist>
    <div class="modal-actions">
      <button class="btn btn-success" id="save-note-edit">Save</button>
      <button class="btn btn-danger" onclick="closeModal()">Cancel</button>
    </div>
  `);

  updateDatalistOptions('edit-note-category-list', getAllCategories());

  document.getElementById("save-note-edit").addEventListener("click", () => {
    const newTitle = document.getElementById("edit-note-title").value.trim();
    const newContent = document.getElementById("edit-note-content").value.trim();
    const newCategory = document.getElementById("edit-note-category").value.trim() || null;
    if (newTitle && newContent) {
      note.title = newTitle;
      note.content = newContent;
      note.category = newCategory;
      updateCategoryAndProjectLists();
      renderNotes();
      updateProgress();
      closeModal();
      showToast("Note updated!", "success");
    }
  });
}

// ===== DASHBOARD =====
function calculateAvgCompletionTime() {
  const completedTasks = tasks.filter(t => t.completed && t.completedAt && t.createdAt);
  if (completedTasks.length === 0) return 0;
  
  const totalDays = completedTasks.reduce((sum, task) => {
    const created = new Date(task.createdAt);
    const completed = new Date(task.completedAt);
    const days = (completed - created) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);
  
  return Math.round((totalDays / completedTasks.length) * 10) / 10;
}

function calculateProductivityStreak() {
  const completedTasks = tasks.filter(t => t.completed && t.completedAt);
  if (completedTasks.length === 0) return 0;
  
  const completionDates = completedTasks.map(t => {
    const date = new Date(t.completedAt);
    return date.toDateString();
  });
  
  const uniqueDates = [...new Set(completionDates)].sort().reverse();
  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
    streak = 1;
    let checkDate = new Date();
    
    for (let i = 1; i < 365; i++) {
      const dateStr = checkDate.toDateString();
      if (uniqueDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  
  return streak;
}

function getTasksToday() {
  const today = new Date().toDateString();
  return tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt).toDateString();
    return completedDate === today;
  }).length;
}

function getProductivityData() {
  const data = [];
  const labels = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    labels.push(dayName);
    
    const tasksCompleted = tasks.filter(t => {
      if (!t.completed || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt).toDateString();
      return completedDate === dateStr;
    }).length;
    
    data.push(tasksCompleted);
  }
  
  return { labels, data };
}

function updateDashboard() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById("task-count").textContent = total;
  document.getElementById("completed-count").textContent = completed;
  document.getElementById("note-count").textContent = notes.length;
  
  const avgTime = calculateAvgCompletionTime();
  document.getElementById("avg-completion-time").textContent = avgTime > 0 ? `${avgTime} days` : "N/A";
  
  const streak = calculateProductivityStreak();
  document.getElementById("productivity-streak").textContent = `${streak} days`;
  
  const tasksToday = getTasksToday();
  document.getElementById("tasks-today").textContent = tasksToday;

  const circumference = 2 * Math.PI * 90;
  const progressCircle = document.querySelector(".progress-ring .progress");
  progressCircle.style.strokeDashoffset = circumference - (percent / 100) * circumference;
  document.getElementById("progress-text").textContent = `${percent}%`;

  updateChart();
  updatePriorityChart();
  updateProductivityChart();
}

let chartInstance = null;
let priorityChartInstance = null;
let productivityChartInstance = null;
let progressTimelineChartInstance = null;
let weeklyComparisonChartInstance = null;
let categoryProgressChartInstance = null;

function updateChart() {
  const canvas = document.getElementById("dashboardChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (chartInstance) chartInstance.destroy();

  const completed = tasks.filter((t) => t.completed).length;
  const pending = tasks.length - completed;

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completed", "Pending"],
      datasets: [{
        data: [completed, pending],
        backgroundColor: ["#10b981", "#e2e8f0"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, position: 'bottom' }
      }
    }
  });
}

function updatePriorityChart() {
  const canvas = document.getElementById("priorityChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (priorityChartInstance) priorityChartInstance.destroy();

  const low = tasks.filter(t => t.priority === 'low').length;
  const medium = tasks.filter(t => t.priority === 'medium').length;
  const high = tasks.filter(t => t.priority === 'high').length;

  priorityChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Low", "Medium", "High"],
      datasets: [{
        label: "Tasks",
        data: [low, medium, high],
        backgroundColor: ["#16a34a", "#f59e0b", "#ef4444"],
        borderRadius: 8,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          },
          grid: {
            display: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function updateProductivityChart() {
  const canvas = document.getElementById("productivityChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (productivityChartInstance) productivityChartInstance.destroy();

  const { labels, data } = getProductivityData();

  productivityChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Tasks Completed",
        data: data,
        borderColor: "#0ea5ff",
        backgroundColor: "rgba(14, 165, 255, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: "#0ea5ff",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          },
          grid: {
            color: "rgba(0, 0, 0, 0.05)"
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function updateChartColors() {
  if (chartInstance) {
    chartInstance.update();
  }
  if (priorityChartInstance) {
    priorityChartInstance.update();
  }
  if (productivityChartInstance) {
    productivityChartInstance.update();
  }
  if (progressTimelineChartInstance) {
    progressTimelineChartInstance.update();
  }
  if (weeklyComparisonChartInstance) {
    weeklyComparisonChartInstance.update();
  }
  if (categoryProgressChartInstance) {
    categoryProgressChartInstance.update();
  }
}

// ===== AUTH =====
document.getElementById("login-btn").addEventListener("click", () => {
  showModal(`
    <h3>Login</h3>
    <label>Email</label>
    <input type="text" id="login-email" placeholder="your@email.com" />
    <label>Password</label>
    <input type="password" id="login-password" placeholder="••••••••" />
    <div class="modal-actions">
      <button class="btn btn-success" id="login-submit">Login</button>
      <button class="btn btn-danger" onclick="closeModal()">Cancel</button>
    </div>
  `);

  document.getElementById("login-submit").addEventListener("click", () => {
    const emailRaw = document.getElementById("login-email").value;
    const pass = document.getElementById("login-password").value.trim();
    
    if (!emailRaw || !pass) {
      showToast("Please fill all fields", "error");
      return;
    }

    let email;
    try {
      email = normalizeEmail(emailRaw);
    } catch (e) {
      showToast(e.message, "error");
      return;
    }

    if (!users[email] || users[email].password !== pass) {
      showToast("Invalid credentials", "error");
      return;
    }

    currentUser = email;
    localStorage.setItem("currentUser", email);
    loadUserData();
    renderTasks();
    renderNotes();
    updateDashboard();
    updateProgress();
    updateAuthUI();
    closeModal();
    showToast(`Welcome back, ${users[email].name || email.split('@')[0]}!`, "success");
  });
});

document.getElementById("register-btn").addEventListener("click", () => {
  showModal(`
    <h3>Create Account</h3>
    <label>Name (optional)</label>
    <input type="text" id="register-name" placeholder="Your name" />
    <label>Email</label>
    <input type="text" id="register-email" placeholder="your@email.com" />
    <label>Password</label>
    <input type="password" id="register-password" placeholder="••••••••" />
    <div class="modal-actions">
      <button class="btn btn-success" id="register-submit">Register</button>
      <button class="btn btn-danger" onclick="closeModal()">Cancel</button>
    </div>
  `);

  document.getElementById("register-submit").addEventListener("click", () => {
    const name = document.getElementById("register-name").value.trim();
    const emailRaw = document.getElementById("register-email").value;
    const pass = document.getElementById("register-password").value.trim();
    
    if (!emailRaw || !pass) {
      showToast("Please fill all required fields", "error");
      return;
    }

    let email;
    try {
      email = normalizeEmail(emailRaw);
    } catch (e) {
      showToast(e.message, "error");
      return;
    }

    if (users[email]) {
      showToast("User already exists", "error");
      return;
    }

    users[email] = {
      password: pass,
      name: name || "User",
      tasks: [],
      notes: []
    };

    localStorage.setItem("users", JSON.stringify(users));
    closeModal();
    showToast("Account created successfully!", "success");
  });
});

document.getElementById("logout-btn").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("currentUser");
  tasks = [];
  notes = [];
    renderTasks();
    renderNotes();
    updateDashboard();
    updateProgress();
    updateAuthUI();
    showToast("Logged out successfully", "info");
});

document.getElementById("account-btn").addEventListener("click", () => {
  const user = users[currentUser];
  showModal(`
    <h3>Account Settings</h3>
    <label>Name</label>
    <input type="text" id="profile-name" value="${user.name || ''}" />
    <label>Email</label>
    <input type="text" id="profile-email" value="${currentUser}" disabled style="opacity:0.6;" />
    <label>New Password (leave empty to keep current)</label>
    <input type="password" id="profile-password" placeholder="••••••••" />
    <hr style="margin:1.5rem 0;border:none;border-top:1px solid var(--border);">
    <button class="btn btn-primary" id="export-btn" style="width:100%;margin-bottom:0.5rem;">📥 Export Data</button>
    <button class="btn btn-danger" id="delete-account-btn" style="width:100%;margin-bottom:1rem;">⌫ Delete Account</button>
    <div class="modal-actions">
      <button class="btn btn-success" id="save-profile">Save Changes</button>
      <button class="btn btn-danger" onclick="closeModal()">Close</button>
    </div>
  `);

  document.getElementById("save-profile").addEventListener("click", () => {
    const name = document.getElementById("profile-name").value.trim();
    const newPassword = document.getElementById("profile-password").value.trim();

    if (name) users[currentUser].name = name;
    if (newPassword) users[currentUser].password = newPassword;

    localStorage.setItem("users", JSON.stringify(users));
    updateAuthUI();
    closeModal();
    showToast("Profile updated successfully!", "success");
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    const data = { user: users[currentUser], tasks, notes };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nebula-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data exported successfully!", "success");
  });

  document.getElementById("delete-account-btn").addEventListener("click", () => {
    if (confirm("Are you sure? This cannot be undone.")) {
      delete users[currentUser];
      localStorage.setItem("users", JSON.stringify(users));
      currentUser = null;
      localStorage.removeItem("currentUser");
      tasks = [];
      notes = [];
      renderTasks();
      renderNotes();
      updateDashboard();
      updateProgress();
      updateAuthUI();
      closeModal();
      showToast("Account deleted", "error");
    }
  });
});

document.getElementById("reset-btn").addEventListener("click", () => {
  if (confirm("Delete all stored data? This cannot be undone.")) {
    localStorage.clear();
    users = {};
    currentUser = null;
    tasks = [];
    notes = [];
    renderTasks();
    renderNotes();
    updateDashboard();
    updateProgress();
    updateAuthUI();
    showToast("All data cleared", "error");
  }
});

// ===== CALENDAR =====
function updateCalendar() {
  const calendarGrid = document.getElementById("calendar-grid");
  const monthYear = document.getElementById("calendar-month-year");
  if (!calendarGrid || !monthYear) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  monthYear.textContent = currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  calendarGrid.innerHTML = '';
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = day;
    calendarGrid.appendChild(dayHeader);
  });
  
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyDay);
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    
    const dayTasks = tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === date.getTime();
    });
    
    const isToday = date.getTime() === today.getTime();
    const isOverdue = date < today && dayTasks.length > 0;
    
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${isToday ? 'today' : ''} ${isOverdue ? 'overdue' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`;
    dayElement.innerHTML = `
      <span class="calendar-day-number">${day}</span>
      ${dayTasks.length > 0 ? `<span class="calendar-task-count">${dayTasks.length}</span>` : ''}
    `;
    
    if (dayTasks.length > 0) {
      dayElement.addEventListener('click', () => {
        currentDateFilter = 'all';
        document.querySelectorAll('.date-filter').forEach(btn => {
          if (btn.dataset.dateFilter === 'all') {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        taskDueDate.value = dateStr;
        document.querySelector('[data-section="tasks"]').click();
      });
    }
    
    calendarGrid.appendChild(dayElement);
  }
}

document.getElementById("prev-month")?.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  updateCalendar();
});

document.getElementById("next-month")?.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  updateCalendar();
});

// ===== REMINDERS =====
function checkReminders() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const overdueTasks = tasks.filter(task => isTaskOverdue(task));
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  });
  
  if (overdueTasks.length > 0 && Notification.permission === "granted") {
    new Notification(`You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}!`, {
      body: overdueTasks.slice(0, 3).map(t => t.text).join(', ') + (overdueTasks.length > 3 ? '...' : ''),
      icon: '🔴'
    });
  }
  
  if (todayTasks.length > 0 && Notification.permission === "granted") {
    new Notification(`You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today!`, {
      body: todayTasks.slice(0, 3).map(t => t.text).join(', ') + (todayTasks.length > 3 ? '...' : ''),
      icon: '📅'
    });
  }
}

if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

setInterval(checkReminders, 60000);
checkReminders();

// ===== PARTICLES =====
function createParticles() {
  const container = document.getElementById('particles-container');
  if (!container) return;
  
  const particleCount = 30;
  
  function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.floor(Math.random() * 3) + 5;
    const duration = Math.random() * 10 + 12;
    const delay = Math.random() * 3;
    const top = Math.random() * 100;
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.top = `${top}%`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;
    
    const blueIntensity = Math.random() * 0.3 + 0.7;
    const blueColor = `rgba(14, 165, 255, ${blueIntensity})`;
    particle.style.background = '#0ea5ff';
    particle.style.boxShadow = `0 0 ${size * 1.5}px #0ea5ff, 0 0 ${size * 3}px rgba(14, 165, 255, 0.6)`;
    
    container.appendChild(particle);
    
    particle.addEventListener('animationend', () => {
      particle.remove();
      createParticle();
    });
  }
  
  for (let i = 0; i < particleCount; i++) {
    setTimeout(() => createParticle(), i * 500);
  }
}

// ===== WIDGETS =====
function initWidgets() {
  const container = document.getElementById("widgets-container");
  if (!container) return;

  if (widgetConfig && widgetConfig.order) {
    const widgets = Array.from(container.children);
    const orderedWidgets = widgetConfig.order.map(id => 
      widgets.find(w => w.dataset.widgetId === id)
    ).filter(Boolean);
    
    orderedWidgets.forEach(widget => container.appendChild(widget));
  }

  if (widgetConfig && widgetConfig.hidden) {
    widgetConfig.hidden.forEach(id => {
      const widget = container.querySelector(`[data-widget-id="${id}"]`);
      if (widget) widget.classList.add("hidden-widget");
    });
  }

  if (widgetConfig && widgetConfig.sizes) {
    Object.entries(widgetConfig.sizes).forEach(([id, size]) => {
      const widget = container.querySelector(`[data-widget-id="${id}"]`);
      if (widget) {
        widget.dataset.widgetSize = size;
        widget.classList.remove("widget-small", "widget-normal", "widget-wide");
        widget.classList.add(`widget-${size}`);
      }
    });
  }

  setupWidgetDragAndDrop();
  setupWidgetControls();
}

function setupWidgetDragAndDrop() {
  const container = document.getElementById("widgets-container");
  if (!container) return;

  const widgets = container.querySelectorAll(".widget");
  widgets.forEach(widget => {
    widget.addEventListener("dragstart", (e) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", widget.outerHTML);
      widget.classList.add("dragging");
    });

    widget.addEventListener("dragend", () => {
      widget.classList.remove("dragging");
    });

    widget.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(container, e.clientY);
      const dragging = container.querySelector(".dragging");
      if (afterElement == null) {
        container.appendChild(dragging);
      } else {
        container.insertBefore(dragging, afterElement);
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".widget:not(.dragging):not(.hidden-widget)")];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveWidgetConfig() {
  const container = document.getElementById("widgets-container");
  if (!container) return;

  const widgets = Array.from(container.querySelectorAll(".widget"));
  const order = widgets.map(w => w.dataset.widgetId);
  const hidden = widgets.filter(w => w.classList.contains("hidden-widget")).map(w => w.dataset.widgetId);
  const sizes = {};
  widgets.forEach(w => {
    sizes[w.dataset.widgetId] = w.dataset.widgetSize || "normal";
  });

  widgetConfig = { order, hidden, sizes };
  localStorage.setItem("widgetConfig", JSON.stringify(widgetConfig));
}

function setupWidgetControls() {
  // Use event delegation to handle dynamically added widgets
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("size-btn")) {
      e.stopPropagation();
      const widget = e.target.closest(".widget");
      if (!widget) return;
      
      const sizes = ["small", "normal", "wide"];
      const currentSize = widget.dataset.widgetSize || "normal";
      const currentIndex = sizes.indexOf(currentSize);
      const nextSize = sizes[(currentIndex + 1) % sizes.length];
      
      widget.classList.remove("widget-small", "widget-normal", "widget-wide");
      widget.classList.add(`widget-${nextSize}`);
      widget.dataset.widgetSize = nextSize;
      saveWidgetConfig();
      
      // Update charts if they exist
      if (widget.id === "progressTimelineChart" || widget.querySelector("#progressTimelineChart")) {
        updateProgressCharts();
      }
    }
    
    if (e.target.classList.contains("hide-btn")) {
      e.stopPropagation();
      const widget = e.target.closest(".widget");
      if (!widget) return;
      widget.classList.toggle("hidden-widget");
      saveWidgetConfig();
    }
  });

  document.getElementById("widget-settings-btn")?.addEventListener("click", () => {
    showWidgetSettingsModal();
  });
}

function showWidgetSettingsModal() {
  const container = document.getElementById("widgets-container");
  if (!container) return;

  const widgets = Array.from(container.querySelectorAll(".widget"));
  const hiddenWidgets = widgets.filter(w => w.classList.contains("hidden-widget"));
  
  let content = `
    <h3>Widget Settings</h3>
    <p style="margin-bottom:1rem;color:var(--text-light);">Drag widgets to reorder, or use the controls on each widget.</p>
    <div style="max-height:400px;overflow-y:auto;">
  `;

  hiddenWidgets.forEach(widget => {
    const id = widget.dataset.widgetId;
    const title = widget.querySelector("h3")?.textContent || id;
    content += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:var(--bg-light);border-radius:0.5rem;margin-bottom:0.5rem;">
        <span>${title}</span>
        <button class="btn btn-success show-widget-btn" data-widget-id="${id}">Show</button>
      </div>
    `;
  });

  if (hiddenWidgets.length === 0) {
    content += `<p style="text-align:center;color:var(--text-light);padding:2rem;">All widgets are visible</p>`;
  }

  content += `</div>
    <div class="modal-actions">
      <button class="btn btn-danger" onclick="resetWidgets()">Reset to Default</button>
      <button class="btn btn-primary" onclick="closeModal()">Close</button>
    </div>
  `;

  showModal(content);

  document.querySelectorAll(".show-widget-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const widgetId = btn.dataset.widgetId;
      const widget = container.querySelector(`[data-widget-id="${widgetId}"]`);
      if (widget) {
        widget.classList.remove("hidden-widget");
        saveWidgetConfig();
        closeModal();
        showWidgetSettingsModal();
      }
    });
  });
}

function resetWidgets() {
  if (confirm("Reset all widgets to default layout? This cannot be undone.")) {
    localStorage.removeItem("widgetConfig");
    widgetConfig = null;
    location.reload();
  }
}

const widgetsContainer = document.getElementById("widgets-container");
if (widgetsContainer) {
  widgetsContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    saveWidgetConfig();
  });
}

// ===== PROGRESS SECTION =====
function getTasksThisWeek() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  return tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    return completedDate >= weekStart;
  }).length;
}

function getTasksThisMonth() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  return tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    return completedDate >= monthStart;
  }).length;
}

function getCompletionRate() {
  const total = tasks.length;
  if (total === 0) return 0;
  const completed = tasks.filter(t => t.completed).length;
  return Math.round((completed / total) * 100);
}

function getBestStreak() {
  const completedTasks = tasks.filter(t => t.completed && t.completedAt);
  if (completedTasks.length === 0) return 0;
  
  const completionDates = completedTasks.map(t => {
    const date = new Date(t.completedAt);
    return date.toDateString();
  });
  
  const uniqueDates = [...new Set(completionDates)].sort();
  let bestStreak = 0;
  let currentStreak = 1;
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      currentStreak++;
    } else {
      bestStreak = Math.max(bestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  
  return Math.max(bestStreak, currentStreak);
}

function getProgressTimelineData() {
  const data = [];
  const labels = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    labels.push(`${dayName} ${dayNum}`);
    
    const tasksCompleted = tasks.filter(t => {
      if (!t.completed || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt).toDateString();
      return completedDate === dateStr;
    }).length;
    
    data.push(tasksCompleted);
  }
  
  return { labels, data };
}

function getWeeklyComparisonData() {
  const today = new Date();
  const weeks = [];
  const data = [];
  
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (today.getDay() + (i * 7)));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekLabel = `Week ${i === 0 ? 'This' : i === 1 ? 'Last' : i + ' weeks ago'}`;
    weeks.push(weekLabel);
    
    const tasksCompleted = tasks.filter(t => {
      if (!t.completed || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate >= weekStart && completedDate <= weekEnd;
    }).length;
    
    data.push(tasksCompleted);
  }
  
  return { labels: weeks, data };
}

function getCategoryProgressData() {
  const categories = getAllCategories();
  const categoryData = {};
  
  categories.forEach(cat => {
    const categoryTasks = tasks.filter(t => t.category === cat);
    const completed = categoryTasks.filter(t => t.completed).length;
    const total = categoryTasks.length;
    categoryData[cat] = { completed, total, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  });
  
  // Also include tasks without category
  const noCategoryTasks = tasks.filter(t => !t.category);
  const noCategoryCompleted = noCategoryTasks.filter(t => t.completed).length;
  const noCategoryTotal = noCategoryTasks.length;
  if (noCategoryTotal > 0) {
    categoryData['Uncategorized'] = {
      completed: noCategoryCompleted,
      total: noCategoryTotal,
      rate: Math.round((noCategoryCompleted / noCategoryTotal) * 100)
    };
  }
  
  return categoryData;
}

function updateProgressCharts() {
  // Progress Timeline Chart
  const timelineCanvas = document.getElementById("progressTimelineChart");
  if (timelineCanvas) {
    const ctx = timelineCanvas.getContext("2d");
    if (progressTimelineChartInstance) progressTimelineChartInstance.destroy();
    
    const { labels, data } = getProgressTimelineData();
    
    progressTimelineChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Tasks Completed",
          data: data,
          borderColor: "#0ea5ff",
          backgroundColor: "rgba(14, 165, 255, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#0ea5ff",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            grid: { color: "rgba(0, 0, 0, 0.05)" }
          },
          x: {
            grid: { display: false },
            ticks: { maxRotation: 45, minRotation: 45 }
          }
        }
      }
    });
  }
  
  // Weekly Comparison Chart
  const weeklyCanvas = document.getElementById("weeklyComparisonChart");
  if (weeklyCanvas) {
    const ctx = weeklyCanvas.getContext("2d");
    if (weeklyComparisonChartInstance) weeklyComparisonChartInstance.destroy();
    
    const { labels, data } = getWeeklyComparisonData();
    
    weeklyComparisonChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Tasks Completed",
          data: data,
          backgroundColor: ["#0ea5ff", "#6366f1", "#8b5cf6", "#ec4899"],
          borderRadius: 8,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            grid: { display: false }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }
  
  // Category Progress Chart
  const categoryCanvas = document.getElementById("categoryProgressChart");
  if (categoryCanvas) {
    const ctx = categoryCanvas.getContext("2d");
    if (categoryProgressChartInstance) categoryProgressChartInstance.destroy();
    
    const categoryData = getCategoryProgressData();
    const labels = Object.keys(categoryData);
    const rates = labels.map(cat => categoryData[cat].rate);
    
    categoryProgressChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: rates,
          backgroundColor: [
            "#0ea5ff",
            "#6366f1",
            "#8b5cf6",
            "#ec4899",
            "#f59e0b",
            "#10b981",
            "#ef4444"
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true, position: 'bottom' }
        }
      }
    });
  }
}

function getAchievements() {
  const achievements = [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const streak = calculateProductivityStreak();
  const bestStreak = getBestStreak();
  const weekTasks = getTasksThisWeek();
  const monthTasks = getTasksThisMonth();
  
  achievements.push({
    id: 'first-task',
    title: 'Getting Started',
    description: 'Create your first task',
    icon: '🎯',
    unlocked: totalTasks > 0,
    progress: Math.min(totalTasks, 1),
    max: 1
  });
  
  achievements.push({
    id: 'first-complete',
    title: 'First Completion',
    description: 'Complete your first task',
    icon: '◉',
    unlocked: completedTasks > 0,
    progress: Math.min(completedTasks, 1),
    max: 1
  });
  
  achievements.push({
    id: 'ten-tasks',
    title: 'Task Master',
    description: 'Complete 10 tasks',
    icon: '🌟',
    unlocked: completedTasks >= 10,
    progress: Math.min(completedTasks, 10),
    max: 10
  });
  
  achievements.push({
    id: 'fifty-tasks',
    title: 'Productivity Pro',
    description: 'Complete 50 tasks',
    icon: '💪',
    unlocked: completedTasks >= 50,
    progress: Math.min(completedTasks, 50),
    max: 50
  });
  
  achievements.push({
    id: 'hundred-tasks',
    title: 'Task Legend',
    description: 'Complete 100 tasks',
    icon: '👑',
    unlocked: completedTasks >= 100,
    progress: Math.min(completedTasks, 100),
    max: 100
  });
  
  achievements.push({
    id: 'streak-3',
    title: 'On Fire',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    unlocked: streak >= 3,
    progress: Math.min(streak, 3),
    max: 3
  });
  
  achievements.push({
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    unlocked: streak >= 7,
    progress: Math.min(streak, 7),
    max: 7
  });
  
  achievements.push({
    id: 'streak-30',
    title: 'Consistency King',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    unlocked: streak >= 30,
    progress: Math.min(streak, 30),
    max: 30
  });
  
  achievements.push({
    id: 'week-10',
    title: 'Weekly Champion',
    description: 'Complete 10 tasks in a week',
    icon: '📅',
    unlocked: weekTasks >= 10,
    progress: Math.min(weekTasks, 10),
    max: 10
  });
  
  achievements.push({
    id: 'month-50',
    title: 'Monthly Master',
    description: 'Complete 50 tasks in a month',
    icon: '📆',
    unlocked: monthTasks >= 50,
    progress: Math.min(monthTasks, 50),
    max: 50
  });
  
  achievements.push({
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Complete all tasks in a week',
    icon: '💯',
    unlocked: false,
    progress: 0,
    max: 1
  });
  
  achievements.push({
    id: 'best-streak-10',
    title: 'Streak Master',
    description: 'Achieve a 10-day best streak',
    icon: '🎖️',
    unlocked: bestStreak >= 10,
    progress: Math.min(bestStreak, 10),
    max: 10
  });
  
  return achievements;
}

function renderAchievements() {
  const container = document.getElementById("achievements-grid");
  if (!container) return;
  
  const achievements = getAchievements();
  container.innerHTML = "";
  
  achievements.forEach(achievement => {
    const card = document.createElement("div");
    card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : ''}`;
    
    const progressPercent = achievement.max > 0 ? (achievement.progress / achievement.max) * 100 : 0;
    
    card.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-content">
        <h4 class="achievement-title">${achievement.title}</h4>
        <p class="achievement-description">${achievement.description}</p>
        ${!achievement.unlocked ? `
          <div class="achievement-progress">
            ${achievement.progress} / ${achievement.max}
            <div class="achievement-progress-bar">
              <div class="achievement-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    container.appendChild(card);
  });
}

function getRecentActivity() {
  const activities = [];
  const today = new Date();
  
  // Get completed tasks
  tasks.filter(t => t.completed && t.completedAt).forEach(task => {
    activities.push({
      type: 'task-completed',
      text: `Completed task: "${task.text}"`,
      icon: '◉',
      time: new Date(task.completedAt)
    });
  });
  
  // Get created tasks
  tasks.forEach(task => {
    activities.push({
      type: 'task-created',
      text: `Created task: "${task.text}"`,
      icon: '◈',
      time: new Date(task.createdAt)
    });
  });
  
  // Get created notes
  notes.forEach(note => {
    activities.push({
      type: 'note-created',
      text: `Created note: "${note.title}"`,
      icon: '◐',
      time: new Date(note.createdAt)
    });
  });
  
  // Sort by time (most recent first) and limit to 20
  return activities
    .sort((a, b) => b.time - a.time)
    .slice(0, 20);
}

function formatActivityTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function renderRecentActivity() {
  const container = document.getElementById("activity-list");
  if (!container) return;
  
  const activities = getRecentActivity();
  container.innerHTML = "";
  
  if (activities.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-light);">No recent activity</div>';
    return;
  }
  
  activities.forEach(activity => {
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `
      <div class="activity-icon">${activity.icon}</div>
      <div class="activity-content">
        <p class="activity-text">${activity.text}</p>
        <span class="activity-time">${formatActivityTime(activity.time)}</span>
      </div>
    `;
    container.appendChild(item);
  });
}

function updateProgress() {
  // Update stats
  const weekTasks = getTasksThisWeek();
  const monthTasks = getTasksThisMonth();
  const completionRate = getCompletionRate();
  const bestStreak = getBestStreak();
  
  const weekEl = document.getElementById("progress-week");
  const monthEl = document.getElementById("progress-month");
  const rateEl = document.getElementById("progress-rate");
  const streakEl = document.getElementById("progress-best-streak");
  
  if (weekEl) weekEl.textContent = weekTasks;
  if (monthEl) monthEl.textContent = monthTasks;
  if (rateEl) rateEl.textContent = `${completionRate}%`;
  if (streakEl) streakEl.textContent = bestStreak;
  
  // Update charts
  updateProgressCharts();
  
  // Update achievements
  renderAchievements();
  
  // Update activity
  renderRecentActivity();
}

// ===== CALCULATOR =====
let calcState = {
  currentValue: '0',
  previousValue: null,
  operator: null,
  waitingForOperand: false,
  history: JSON.parse(localStorage.getItem('calcHistory')) || []
};

function updateCalcDisplay() {
  const screen = document.getElementById('calc-screen');
  const history = document.getElementById('calc-history');
  
  if (screen) {
    screen.textContent = formatNumber(calcState.currentValue);
  }
  
  if (history) {
    if (calcState.previousValue !== null && calcState.operator) {
      history.textContent = `${formatNumber(calcState.previousValue)} ${getOperatorSymbol(calcState.operator)}`;
    } else {
      history.textContent = '';
    }
  }
}

function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  const str = num.toString();
  if (str.length > 12) {
    return parseFloat(num).toExponential(6);
  }
  return str;
}

function getOperatorSymbol(op) {
  const symbols = {
    'add': '+',
    'subtract': '−',
    'multiply': '×',
    'divide': '÷'
  };
  return symbols[op] || op;
}

function inputNumber(num) {
  if (calcState.waitingForOperand) {
    calcState.currentValue = num;
    calcState.waitingForOperand = false;
  } else {
    calcState.currentValue = calcState.currentValue === '0' ? num : calcState.currentValue + num;
  }
  updateCalcDisplay();
}

function inputDecimal() {
  if (calcState.waitingForOperand) {
    calcState.currentValue = '0.';
    calcState.waitingForOperand = false;
  } else if (calcState.currentValue.indexOf('.') === -1) {
    calcState.currentValue += '.';
  }
  updateCalcDisplay();
}

function clear() {
  calcState.currentValue = '0';
  calcState.previousValue = null;
  calcState.operator = null;
  calcState.waitingForOperand = false;
  updateCalcDisplay();
}

function clearEntry() {
  calcState.currentValue = '0';
  updateCalcDisplay();
}

function backspace() {
  if (calcState.waitingForOperand) return;
  
  if (calcState.currentValue.length > 1) {
    calcState.currentValue = calcState.currentValue.slice(0, -1);
  } else {
    calcState.currentValue = '0';
  }
  updateCalcDisplay();
}

function performOperation() {
  const current = parseFloat(calcState.currentValue);
  const previous = calcState.previousValue !== null ? parseFloat(calcState.previousValue) : null;
  
  if (previous === null) return;
  
  let result;
  const expression = `${formatNumber(previous)} ${getOperatorSymbol(calcState.operator)} ${formatNumber(calcState.currentValue)}`;
  
  switch (calcState.operator) {
    case 'add':
      result = previous + current;
      break;
    case 'subtract':
      result = previous - current;
      break;
    case 'multiply':
      result = previous * current;
      break;
    case 'divide':
      if (current === 0) {
        showToast("Cannot divide by zero", "error");
        clear();
        return;
      }
      result = previous / current;
      break;
    default:
      return;
  }
  
  result = Math.round(result * 100000000) / 100000000; // Round to avoid floating point errors
  
  addToHistory(expression, result);
  
  calcState.currentValue = result.toString();
  calcState.previousValue = null;
  calcState.operator = null;
  calcState.waitingForOperand = true;
  updateCalcDisplay();
}

function setOperator(nextOperator) {
  const current = parseFloat(calcState.currentValue);
  
  if (calcState.previousValue === null) {
    calcState.previousValue = current;
  } else if (calcState.operator) {
    performOperation();
    calcState.previousValue = parseFloat(calcState.currentValue);
  }
  
  calcState.waitingForOperand = true;
  calcState.operator = nextOperator;
  updateCalcDisplay();
}

function negate() {
  if (calcState.currentValue !== '0') {
    calcState.currentValue = (parseFloat(calcState.currentValue) * -1).toString();
    updateCalcDisplay();
  }
}

function sqrt() {
  const value = parseFloat(calcState.currentValue);
  if (value < 0) {
    showToast("Cannot calculate square root of negative number", "error");
    return;
  }
  const result = Math.sqrt(value);
  addToHistory(`√${formatNumber(calcState.currentValue)}`, result);
  calcState.currentValue = result.toString();
  calcState.waitingForOperand = true;
  updateCalcDisplay();
}

function square() {
  const value = parseFloat(calcState.currentValue);
  const result = value * value;
  addToHistory(`${formatNumber(calcState.currentValue)}²`, result);
  calcState.currentValue = result.toString();
  calcState.waitingForOperand = true;
  updateCalcDisplay();
}

function percent() {
  const value = parseFloat(calcState.currentValue);
  const result = value / 100;
  calcState.currentValue = result.toString();
  calcState.waitingForOperand = true;
  updateCalcDisplay();
}

function inverse() {
  const value = parseFloat(calcState.currentValue);
  if (value === 0) {
    showToast("Cannot divide by zero", "error");
    return;
  }
  const result = 1 / value;
  addToHistory(`1/${formatNumber(calcState.currentValue)}`, result);
  calcState.currentValue = result.toString();
  calcState.waitingForOperand = true;
  updateCalcDisplay();
}

function addToHistory(expression, result) {
  const historyItem = {
    expression,
    result,
    timestamp: new Date().toISOString()
  };
  
  calcState.history.unshift(historyItem);
  if (calcState.history.length > 50) {
    calcState.history = calcState.history.slice(0, 50);
  }
  
  localStorage.setItem('calcHistory', JSON.stringify(calcState.history));
  renderCalcHistory();
}

function renderCalcHistory() {
  const container = document.getElementById('calc-history-list');
  if (!container) return;
  
  if (calcState.history.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-light);">No calculations yet</p>';
    return;
  }
  
  container.innerHTML = '';
  calcState.history.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'calc-history-item';
    div.innerHTML = `
      <div class="calc-history-expression">${item.expression}</div>
      <div class="calc-history-result">= ${formatNumber(item.result)}</div>
    `;
    div.addEventListener('click', () => {
      calcState.currentValue = item.result.toString();
      calcState.waitingForOperand = true;
      updateCalcDisplay();
    });
    container.appendChild(div);
  });
}

function initCalculator() {
  updateCalcDisplay();
  renderCalcHistory();
  
  // Number buttons
  document.querySelectorAll('.calc-btn-number[data-value]').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      if (value === '.') {
        inputDecimal();
      } else {
        inputNumber(value);
      }
    });
  });
  
  // Operator buttons
  document.querySelectorAll('.calc-btn-operator[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      setOperator(action);
    });
  });
  
  // Function buttons
  document.querySelectorAll('.calc-btn-function[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch (action) {
        case 'clear':
          clear();
          break;
        case 'clear-entry':
          clearEntry();
          break;
        case 'backspace':
          backspace();
          break;
      }
    });
  });
  
  // Advanced buttons
  document.querySelectorAll('.calc-btn-advanced[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch (action) {
        case 'sqrt':
          sqrt();
          break;
        case 'square':
          square();
          break;
        case 'percent':
          percent();
          break;
        case 'inverse':
          inverse();
          break;
      }
    });
  });
  
  // Equals button
  document.querySelector('.calc-btn-equals[data-action="equals"]')?.addEventListener('click', () => {
    if (calcState.operator && calcState.previousValue !== null) {
      performOperation();
    }
  });
  
  // Negate button
  document.querySelector('.calc-btn-function[data-action="negate"]')?.addEventListener('click', () => {
    negate();
  });
  
  // Clear history button
  document.getElementById('clear-history-btn')?.addEventListener('click', () => {
    if (confirm('Clear calculation history?')) {
      calcState.history = [];
      localStorage.removeItem('calcHistory');
      renderCalcHistory();
      showToast('History cleared', 'info');
    }
  });
  
  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('calculator')?.classList.contains('active-section')) return;
    
    const key = e.key;
    
    if (key >= '0' && key <= '9') {
      inputNumber(key);
    } else if (key === '.') {
      inputDecimal();
    } else if (key === '+') {
      e.preventDefault();
      setOperator('add');
    } else if (key === '-') {
      e.preventDefault();
      setOperator('subtract');
    } else if (key === '*') {
      e.preventDefault();
      setOperator('multiply');
    } else if (key === '/') {
      e.preventDefault();
      setOperator('divide');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      if (calcState.operator && calcState.previousValue !== null) {
        performOperation();
      }
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
      e.preventDefault();
      clear();
    } else if (key === 'Backspace') {
      e.preventDefault();
      backspace();
    }
  });
}


// ===== INIT =====
loadUserData();
updateCategoryAndProjectLists();
initWidgets();
renderTasks();
renderNotes();
updateDashboard();
updateCalendar();
updateAuthUI();
createParticles();
updateProgress();
initCalculator();
