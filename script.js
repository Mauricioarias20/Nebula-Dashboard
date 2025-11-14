// ===== Date & Time =====
function updateDateTime() {
  const now = new Date();
  const formatted = now.toLocaleString("en-US", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  document.getElementById("datetime").textContent = formatted;
}
setInterval(updateDateTime, 1000);
updateDateTime();

// ===== Theme Toggle =====
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark") ? "🌙" : "☀️";
  updateChartColors();
});

// ===== Navigation =====
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll("main section");
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    sections.forEach((s) => s.classList.remove("active-section"));
    document.getElementById(btn.dataset.section).classList.add("active-section");
  });
});

// ===== User Data Management =====
let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = localStorage.getItem("currentUser") || null;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function loadUserData() {
  if (!currentUser || !users[currentUser]) {
    tasks = [];
    notes = [];
    return;
  }
  tasks = users[currentUser].tasks || [];
  notes = users[currentUser].notes || [];
}

function saveUserData() {
  if (!currentUser) return;
  users[currentUser].tasks = tasks;
  users[currentUser].notes = notes;
  localStorage.setItem("users", JSON.stringify(users));
}

// ===== Dashboard Elements =====
const taskCount = document.getElementById("task-count");
const completedCount = document.getElementById("completed-count");
const noteCount = document.getElementById("note-count");
const progressCircle = document.querySelector(".progress-ring .progress");
const progressText = document.getElementById("progress-text");

// ===== Tasks =====
let tasks = [];
let currentFilter = "all";

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskPriority = document.getElementById("task-priority");
const taskList = document.getElementById("task-list");

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  const priority = taskPriority.value;
  if (!text) return;

  tasks.push({ text, completed: false, priority });
  taskInput.value = "";
  renderTasks();
});

function renderTasks() {
  taskList.innerHTML = "";
  tasks
    .filter((t) => currentFilter === "all" || t.priority === currentFilter)
    .forEach((t, i) => {
      const li = document.createElement("li");
      li.className = `task-item ${t.priority}` + (t.completed ? " completed" : "");
      li.innerHTML = `
        <span>${t.text}</span>
        <div class="task-buttons">
          <button class="done">✔</button>
          <button class="delete">✖</button>
        </div>
      `;
      li.querySelector(".done").addEventListener("click", () => {
        t.completed = !t.completed;
        renderTasks();
      });
      li.querySelector(".delete").addEventListener("click", () => {
        tasks.splice(i, 1);
        renderTasks();
      });
      taskList.appendChild(li);
    });

  updateDashboard();
  saveUserData();
}

// ===== Filters =====
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ===== Notes =====
let notes = [];
const noteForm = document.getElementById("note-form");
const noteTitle = document.getElementById("note-title");
const noteContent = document.getElementById("note-content");
const noteList = document.getElementById("note-list");

noteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = noteTitle.value.trim();
  const content = noteContent.value.trim();
  if (!title || !content) return;

  notes.push({ title, content });
  noteTitle.value = "";
  noteContent.value = "";
  renderNotes();
});

function renderNotes() {
  noteList.innerHTML = "";
  notes.forEach((n, i) => {
    const div = document.createElement("div");
    div.className = "note";
    div.innerHTML = `
      <h3>${n.title}</h3>
      <p>${n.content}</p>
      <button class="delete">Delete</button>
    `;
    div.querySelector(".delete").addEventListener("click", () => {
      notes.splice(i, 1);
      renderNotes();
    });
    noteList.appendChild(div);
  });

  updateDashboard();
  saveUserData();
}

// ===== Dashboard Update =====
function updateDashboard() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  taskCount.textContent = total;
  completedCount.textContent = completed;
  noteCount.textContent = notes.length;

  const circumference = 2 * Math.PI * 54;
  progressCircle.style.strokeDashoffset = circumference - (percent / 100) * circumference;
  progressText.textContent = `${percent}%`;

  updateChart(total, completed);
}

// ===== Chart.js =====
let chartInstance = null;
function updateChart(total, completed) {
  const ctx = document.getElementById("dashboardChart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  const isDark = document.body.classList.contains("dark");

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completed", "Pending"],
      datasets: [
        {
          data: [completed, total - completed],
          backgroundColor: isDark
            ? ["#00b8ff", "#333"]
            : ["#00d4ff", "#e6e6e6"],
          borderWidth: 0,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });
}

function updateChartColors() {
  if (!chartInstance) return;
  const isDark = document.body.classList.contains("dark");
  chartInstance.data.datasets[0].backgroundColor = isDark
    ? ["#00b8ff", "#333"]
    : ["#00d4ff", "#e6e6e6"];
  chartInstance.update();
}

// ===== Modals =====
const loginModal = document.getElementById("login-modal");
const registerModal = document.getElementById("register-modal");
const modalBackdrop = document.getElementById("modal-backdrop");

function closeModals() {
  loginModal.classList.add("hidden");
  registerModal.classList.add("hidden");
  modalBackdrop.classList.add("hidden");
}

document.getElementById("login-btn").addEventListener("click", () => {
  loginModal.classList.remove("hidden");
  modalBackdrop.classList.remove("hidden");
});
document.getElementById("register-btn").addEventListener("click", () => {
  registerModal.classList.remove("hidden");
  modalBackdrop.classList.remove("hidden");
});
document.querySelectorAll(".close-modal").forEach((btn) =>
  btn.addEventListener("click", closeModals)
);

// ===== Auth =====
document.getElementById("register-submit").addEventListener("click", () => {
  const name = document.getElementById("register-name").value.trim();
  const emailRaw = document.getElementById("register-email").value;
  const pass = document.getElementById("register-password").value.trim();
  if (!emailRaw || !pass) return alert("Fill all fields.");

  const email = normalizeEmail(emailRaw);
  if (users[email]) return alert("User already exists.");

  users[email] = {
    password: pass,
    name: name || "User",
    tasks: [],
    notes: []
  };

  localStorage.setItem("users", JSON.stringify(users));
  alert("Account created.");
  closeModals();
});

document.getElementById("login-submit").addEventListener("click", () => {
  const emailRaw = document.getElementById("login-email").value;
  const pass = document.getElementById("login-password").value.trim();
  const email = normalizeEmail(emailRaw);

  if (!email || !pass) return alert("Fill all fields.");
  if (!users[email] || users[email].password !== pass) return alert("Invalid credentials.");

  currentUser = email;
  localStorage.setItem("currentUser", email);

  loadUserData();
  renderTasks();
  renderNotes();

  document.getElementById("user-name").textContent = users[email].name || email.split("@")[0];
  document.getElementById("user-display").textContent = email;

  document.getElementById("login-btn").classList.add("hidden");
  document.getElementById("register-btn").classList.add("hidden");
  document.getElementById("logout-btn").classList.remove("hidden");
  document.getElementById("user-display").classList.remove("hidden");

  closeModals();
});

document.getElementById("logout-btn").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("currentUser");
  tasks = [];
  notes = [];
  renderTasks();
  renderNotes();
  document.getElementById("user-name").textContent = "Guest";
  document.getElementById("user-display").classList.add("hidden");
  document.getElementById("login-btn").classList.remove("hidden");
  document.getElementById("register-btn").classList.remove("hidden");
  document.getElementById("logout-btn").classList.add("hidden");
});

// ===== Reset All Data =====
document.getElementById("reset-btn").addEventListener("click", () => {
  if (!confirm("Delete all stored data?")) return;
  localStorage.clear();
  users = {};
  currentUser = null;
  tasks = [];
  notes = [];
  renderTasks();
  renderNotes();
  alert("All data cleared.");
});

// ===== Initialize =====
loadUserData();
renderTasks();
renderNotes();
updateDashboard();