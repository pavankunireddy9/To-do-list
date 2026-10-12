
const $ = (selector) => document.querySelector(selector);

const today = new Date();

function dateKey(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const todayKey = dateKey(today);

let tasks;

try {
  const saved = JSON.parse(
    localStorage.getItem("perfectPlannerTasks")
  );
  tasks = Array.isArray(saved) ? saved : [];
} catch {
  tasks = [];
}

let currentView = "today";
let currentFilter = "all";
let calendarDate = new Date(
  today.getFullYear(),
  today.getMonth(),
  1
);

function saveTasks() {
  localStorage.setItem(
    "perfectPlannerTasks",
    JSON.stringify(tasks)
  );
}

function displayDate(value) {
  if (!value) return "No deadline";
  if (value === todayKey) return "Today";

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (value === dateKey(tomorrow)) return "Tomorrow";

  return new Date(value + "T12:00:00").toLocaleDateString(
    undefined,
    { month: "short", day: "numeric" }
  );
}

function initHeader() {
  const hour = new Date().getHours();

  $("#greeting").textContent =
    hour < 12 ? "Good morning!" :
    hour < 18 ? "Good afternoon!" :
    "Good evening!";

  $("#fullDate").textContent = today.toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric"
    }
  ).toUpperCase();
}

function visibleTasks() {
  let result = [...tasks];

  if (currentView === "today") {
    result = result.filter(t => t.date === todayKey);
  }

  if (currentView === "upcoming") {
    result = result
      .filter(t => t.date && t.date > todayKey && !t.completed)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  if (currentView === "completed") {
    result = result.filter(t => t.completed);
  }

  if (currentFilter === "pending") {
    result = result.filter(t => !t.completed);
  }

  if (currentFilter === "completed") {
    result = result.filter(t => t.completed);
  }

  return result;
}

function renderTasks() {
  const list = $("#taskList");
  const items = visibleTasks();

  list.replaceChildren();
  $("#emptyState").hidden = items.length > 0;

  const titles = {
    today: "Today's Tasks",
    upcoming: "Upcoming Tasks",
    completed: "Completed Tasks"
  };

  $("#listTitle").textContent = titles[currentView];

  items.forEach(task => {
    const card = document.createElement("article");
    card.className =
      "task-card" + (task.completed ? " completed" : "");

    const check = document.createElement("button");
    check.className = "check-task";
    check.type = "button";
    check.textContent = task.completed ? "✓" : "";
    check.setAttribute(
      "aria-label",
      task.completed ? "Mark as pending" : "Complete task"
    );

    check.addEventListener("click", () => {
      task.completed = !task.completed;
      saveTasks();
      render();
    });

    const main = document.createElement("div");
    main.className = "task-main";

    const name = document.createElement("div");
    name.className = "task-name";
    name.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const date = document.createElement("span");
    date.className = "task-date";
    date.textContent = "▦ " + displayDate(task.date);

    const category = document.createElement("span");
    category.className = "tag " + task.category;
    category.textContent = task.category;

    const priority = document.createElement("span");
    priority.className = "priority " + task.priority;
    priority.textContent = "• " + task.priority + " priority";

    meta.append(date, category, priority);
    main.append(name, meta);

    const del = document.createElement("button");
    del.className = "delete-task";
    del.type = "button";
    del.textContent = "×";
    del.setAttribute("aria-label", "Delete " + task.title);

    del.addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      render();
    });

    card.append(check, main, del);
    list.append(card);
  });
}

function renderStats() {
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;

  const overdue = tasks.filter(t =>
    !t.completed && t.date && t.date < todayKey
  ).length;

  const todayTasks = tasks.filter(t => t.date === todayKey);
  const doneToday = todayTasks.filter(t => t.completed).length;

  const percent = todayTasks.length
    ? Math.round(doneToday / todayTasks.length * 100)
    : 0;

  $("#todayCount").textContent = todayTasks.length;

  $("#upcomingCount").textContent = tasks.filter(t =>
    t.date && t.date > todayKey && !t.completed
  ).length;

  $("#completedCount").textContent = completed;

  $("#progressPercent").textContent = percent + "%";
  $("#progressCount").textContent =
    `${doneToday} of ${todayTasks.length} complete today`;

  $("#progressBar").style.width = percent + "%";
  $("#progressDone").textContent = completed;
  $("#progressPending").textContent = pending;
  $("#progressOverdue").textContent = overdue;

  if (todayTasks.length && percent === 100) {
    $("#motivation").textContent =
      "Amazing work! You completed today's plan. Celebrate your progress.";
  } else if (percent >= 50) {
    $("#motivation").textContent =
      "You're building momentum. Keep going!";
  } else {
    $("#motivation").textContent =
      "Focus on what you can do today. The rest can wait.";
  }
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  $("#monthLabel").textContent =
    calendarDate.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousDays = new Date(year, month, 0).getDate();

  const holder = $("#calendarDays");
  holder.replaceChildren();

  for (let i = 0; i < 42; i++) {
    let day;
    let date;
    let muted = false;

    if (i < firstDay) {
      day = previousDays - firstDay + i + 1;
      date = new Date(year, month - 1, day);
      muted = true;
    } else if (i >= firstDay + daysInMonth) {
      day = i - firstDay - daysInMonth + 1;
      date = new Date(year, month + 1, day);
      muted = true;
    } else {
      day = i - firstDay + 1;
      date = new Date(year, month, day);
    }

    const key = dateKey(date);
    const button = document.createElement("button");

    button.type = "button";
    button.className = "calendar-day";
    button.textContent = day;

    if (muted) button.classList.add("muted");
    if (key === todayKey) button.classList.add("today");

    if (tasks.some(t => t.date === key && !t.completed)) {
      button.classList.add("has-task");
    }

    button.setAttribute("aria-label", date.toLocaleDateString());

    button.addEventListener("click", () => {
      $("#dueDate").value = key;
      $("#taskInput").focus();
    });

    holder.append(button);
  }
}

function render() {
  renderTasks();
  renderStats();
  renderCalendar();
}

// Add a task
$("#taskForm").addEventListener("submit", event => {
  event.preventDefault();

  const title = $("#taskInput").value.trim();

  if (!title) return;

  tasks.unshift({
    id: Date.now(),
    title,
    date: $("#dueDate").value || todayKey,
    category: $("#category").value,
    priority: $("#priority").value,
    completed: false
  });

  saveTasks();

  $("#taskInput").value = "";
  $("#dueDate").value = todayKey;

  currentView = "today";
  currentFilter = "all";

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === currentView
    );
  });

  document.querySelectorAll(".filter").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.filter === currentFilter
    );
  });

  render();
});

// Navigation
document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;

    document.querySelectorAll(".nav-btn").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderTasks();
  });
});

// Task filters
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll(".filter").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderTasks();
  });
});

// Calendar navigation
$("#prevMonth").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

$("#nextMonth").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

// Initial setup
$("#dueDate").value = todayKey;
initHeader();
render();
