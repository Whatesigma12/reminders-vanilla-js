const taskInput = document.getElementById("taskInput");
const topicInput = document.getElementById("topicInput");
const dateInput = document.getElementById("dateInput");
const prioritySelect = document.getElementById("prioritySelect");
const subtasksInput = document.getElementById("subtasksInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const priorityFilter = document.getElementById("priorityFilter");
const taskCount = document.getElementById("taskCount");
const activeCount = document.getElementById("activeCount");
const completedCount = document.getElementById("completedCount");
const emptyMessage = document.getElementById("emptyMessage");

let tasks = [];

loadTasks();
renderTasks();

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", event => {
    if(event.key === "Enter"){
        addTask();
    }
});
searchInput.addEventListener("input", renderTasks);
filterSelect.addEventListener("change", renderTasks);
priorityFilter.addEventListener("change", renderTasks);

function addTask(){
    const text = taskInput.value.trim();
    const topic = topicInput.value.trim();

    if(text === ""){
        alert("Введите задачу");
        return;
    }

    if(topic === ""){
        alert("Введите тему задачи");
        return;
    }

    const subtasks = subtasksInput.value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => ({
            id: Date.now() + Math.random(),
            text: item,
            completed: false
        }));

    const task = {
        id: Date.now(),
        text,
        topic,
        date: dateInput.value,
        priority: prioritySelect.value,
        completed: false,
        subtasks
    };

    tasks.push(task);
    saveTasks();
    renderTasks();

    taskInput.value = "";
    topicInput.value = "";
    dateInput.value = "";
    prioritySelect.value = "Низкий";
    subtasksInput.value = "";
}

function renderTasks(){
    taskList.innerHTML = "";

    let filtered = [...tasks];
    const search = searchInput.value.toLowerCase().trim();

    if(search){
        filtered = filtered.filter(task => {
            const subtasksText = task.subtasks.map(subtask => subtask.text).join(" ").toLowerCase();
            return task.text.toLowerCase().includes(search) ||
                task.topic.toLowerCase().includes(search) ||
                subtasksText.includes(search);
        });
    }

    const statusFilter = filterSelect.value;

    if(statusFilter === "active"){
        filtered = filtered.filter(task => !task.completed);
    }

    if(statusFilter === "completed"){
        filtered = filtered.filter(task => task.completed);
    }

    const selectedPriority = priorityFilter.value;

    if(selectedPriority !== "all"){
        filtered = filtered.filter(task => task.priority === selectedPriority);
    }

    filtered.forEach(task => {
        const li = document.createElement("li");
        li.className = "task";

        if(task.completed){
            li.classList.add("completed");
        }

        const priorityClass = getPriorityClass(task.priority);
        const formattedDate = task.date ? formatDate(task.date) : "Без даты";

        li.innerHTML = `
            <div class="task-header">
                <div class="task-main">
                    <input class="task-checkbox" type="checkbox" ${task.completed ? "checked" : ""}>
                    <div>
                        <div class="task-title"></div>
                        <div class="meta">
                            <span class="badge topic">Тема: ${escapeHtml(task.topic)}</span>
                            <span class="badge date">Дата: ${formattedDate}</span>
                            <span class="badge ${priorityClass}">${task.priority}</span>
                        </div>
                    </div>
                </div>
                <div class="actions">
                    <button class="small-btn edit-btn">Изменить</button>
                    <button class="small-btn delete-btn">Удалить</button>
                </div>
            </div>

            <div class="subtasks"></div>

            <div class="subtask-form">
                <input class="new-subtask-input" type="text" placeholder="Добавить подзадачу...">
                <button class="add-subtask-btn small-btn">Добавить</button>
            </div>
        `;

        li.querySelector(".task-title").textContent = task.text;

        li.querySelector(".task-checkbox").addEventListener("change", () => toggleTask(task.id));
        li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));
        li.querySelector(".edit-btn").addEventListener("click", () => editTask(task.id));

        const subtasksContainer = li.querySelector(".subtasks");
        renderSubtasks(subtasksContainer, task);

        const newSubtaskInput = li.querySelector(".new-subtask-input");
        const addSubtaskBtn = li.querySelector(".add-subtask-btn");

        addSubtaskBtn.addEventListener("click", () => addSubtask(task.id, newSubtaskInput.value));
        newSubtaskInput.addEventListener("keydown", event => {
            if(event.key === "Enter"){
                addSubtask(task.id, newSubtaskInput.value);
            }
        });

        taskList.appendChild(li);
    });

    updateCounters();
    emptyMessage.classList.toggle("visible", filtered.length === 0);
}

function renderSubtasks(container, task){
    container.innerHTML = "";

    if(task.subtasks.length === 0){
        const empty = document.createElement("p");
        empty.className = "empty-subtasks";
        empty.textContent = "Подзадач пока нет.";
        container.appendChild(empty);
        return;
    }

    task.subtasks.forEach(subtask => {
        const row = document.createElement("div");
        row.className = "subtask";

        if(subtask.completed){
            row.classList.add("done");
        }

        row.innerHTML = `
            <div class="subtask-left">
                <input type="checkbox" ${subtask.completed ? "checked" : ""}>
                <span></span>
            </div>
            <button class="remove-subtask">×</button>
        `;

        row.querySelector("span").textContent = subtask.text;
        row.querySelector("input").addEventListener("change", () => toggleSubtask(task.id, subtask.id));
        row.querySelector(".remove-subtask").addEventListener("click", () => deleteSubtask(task.id, subtask.id));

        container.appendChild(row);
    });
}

function deleteTask(id){
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function toggleTask(id){
    tasks = tasks.map(task => {
        if(task.id === id){
            return {...task, completed: !task.completed};
        }
        return task;
    });

    saveTasks();
    renderTasks();
}

function editTask(id){
    const task = tasks.find(item => item.id === id);

    const newText = prompt("Изменить задачу:", task.text);
    if(newText === null || newText.trim() === "") return;

    const newTopic = prompt("Изменить тему:", task.topic);
    if(newTopic === null || newTopic.trim() === "") return;

    const newDate = prompt("Изменить дату в формате ГГГГ-ММ-ДД:", task.date || "");
    if(newDate === null) return;

    tasks = tasks.map(item => {
        if(item.id === id){
            return {
                ...item,
                text: newText.trim(),
                topic: newTopic.trim(),
                date: newDate.trim()
            };
        }
        return item;
    });

    saveTasks();
    renderTasks();
}

function addSubtask(taskId, text){
    const value = text.trim();

    if(value === ""){
        alert("Введите текст подзадачи");
        return;
    }

    tasks = tasks.map(task => {
        if(task.id === taskId){
            return {
                ...task,
                subtasks: [
                    ...task.subtasks,
                    {id: Date.now() + Math.random(), text: value, completed: false}
                ]
            };
        }
        return task;
    });

    saveTasks();
    renderTasks();
}

function toggleSubtask(taskId, subtaskId){
    tasks = tasks.map(task => {
        if(task.id === taskId){
            return {
                ...task,
                subtasks: task.subtasks.map(subtask => {
                    if(subtask.id === subtaskId){
                        return {...subtask, completed: !subtask.completed};
                    }
                    return subtask;
                })
            };
        }
        return task;
    });

    saveTasks();
    renderTasks();
}

function deleteSubtask(taskId, subtaskId){
    tasks = tasks.map(task => {
        if(task.id === taskId){
            return {
                ...task,
                subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId)
            };
        }
        return task;
    });

    saveTasks();
    renderTasks();
}

function updateCounters(){
    taskCount.textContent = tasks.length;
    activeCount.textContent = tasks.filter(task => !task.completed).length;
    completedCount.textContent = tasks.filter(task => task.completed).length;
}

function getPriorityClass(priority){
    if(priority === "Низкий") return "priority-low";
    if(priority === "Средний") return "priority-medium";
    if(priority === "Высокий") return "priority-high";
    return "";
}

function formatDate(date){
    return new Date(date + "T00:00:00").toLocaleDateString("ru-RU");
}

function escapeHtml(value){
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function saveTasks(){
    localStorage.setItem("reminders-vanilla", JSON.stringify(tasks));
}

function loadTasks(){
    const data = localStorage.getItem("reminders-vanilla");

    if(data){
        try{
            tasks = JSON.parse(data).map(task => ({
                ...task,
                topic: task.topic || task.category || "Без темы",
                date: task.date || "",
                subtasks: task.subtasks || []
            }));
        }catch(error){
            tasks = [];
        }
    }
}
