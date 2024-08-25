const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskDatetime = document.getElementById('task-datetime');
const taskPriority = document.getElementById('task-priority');
const todoList = document.getElementById('todo-list');
const inProgressList = document.getElementById('in-progress-list');
const doneList = document.getElementById('done-list');
const deleteAllBtn = document.getElementById('delete-all-btn');

const editModal = document.getElementById('edit-modal');
const editTaskForm = document.getElementById('edit-task-form');
const editTaskInput = document.getElementById('edit-task-input');
const editTaskDatetime = document.getElementById('edit-task-datetime');
const editTaskPriority = document.getElementById('edit-task-priority');
const editTaskColumn = document.getElementById('edit-task-column');
const closeModalBtn = document.getElementById('close-modal-btn');

let currentTaskElement = null;

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => {
        console.log('Loading task:', task); // Depura el contenido de la tarea
        addTaskToDOM(task);
    });
    updateCountdowns();
}

function saveTasks() {
    const tasks = Array.from(document.querySelectorAll('li')).map(li => ({
        id: li.id,
        text: li.querySelector('.task-text').textContent.trim(), // Usa .trim() para eliminar espacios en blanco
        datetime: li.querySelector('.task-datetime').value,
        priority: li.classList.contains('low-priority') ? 'Low' : 
                li.classList.contains('medium-priority') ? 'Medium' : 'High',
        completed: li.querySelector('.task-text').classList.contains('completed'),
        column: li.closest('ul').id
    }));
    console.log('Saving tasks:', tasks); // Depura los datos guardados
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function addTaskToDOM(task) {
    console.log('Adding task to DOM:', task); // Depura la tarea antes de agregarla
    const li = document.createElement('li');
    li.id = task.id || `task-${Date.now()}`; // Generar un ID único si no existe
    li.classList.add(`${task.priority.toLowerCase()}-priority`);
    li.setAttribute('draggable', true);
    li.dataset.column = task.column;

    // Asegúrate de que el texto y demás datos están bien definidos
    li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-info">
            <span class="task-text ${task.completed ? 'completed' : ''}">${task.text || 'Unnamed Task'}</span>
            <input type="datetime-local" class="task-datetime" value="${task.datetime}">
            <span class="countdown-time"></span>
        </div>
        <div class="task-actions">
            <button class="edit">Edit</button>
            <button class="remove">Delete</button>
        </div>
    `;

    console.log('Task element HTML:', li.innerHTML); // Depura el HTML generado

    li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', li.id); // Usa el ID del elemento
        e.target.classList.add('dragging');
    });

    li.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        saveTasks();
        updateCountdowns();
    });

    li.querySelector('.task-text').addEventListener('click', () => {
        li.querySelector('.task-text').classList.toggle('completed');
        saveTasks();
        updateCountdowns();
    });

    li.querySelector('.remove').addEventListener('click', () => {
        li.remove();
        saveTasks();
        updateCountdowns();
    });

    li.querySelector('.edit').addEventListener('click', () => {
        currentTaskElement = li;
        editTaskInput.value = li.querySelector('.task-text').textContent.trim();
        editTaskDatetime.value = li.querySelector('.task-datetime').value;
        editTaskPriority.value = li.classList.contains('low-priority') ? 'Low' :
                                 li.classList.contains('medium-priority') ? 'Medium' : 'High';
        editTaskColumn.value = li.dataset.column;
        editModal.style.display = 'flex';
    });

    li.querySelector('.task-checkbox').addEventListener('change', () => {
        saveTasks();
        updateCountdowns();
        updateDeleteAllButton();
    });

    const list = document.getElementById(task.column);
    if (list) {
        list.appendChild(li);
    } else {
        console.warn(`Column ${task.column} not found`);
    }
}

function updateCountdowns() {
    const now = new Date();
    document.querySelectorAll('li').forEach(li => {
        const datetime = new Date(li.querySelector('.task-datetime').value);
        const span = li.querySelector('.countdown-time');
        if (datetime < now) {
            span.textContent = 'Time is up!';
            span.classList.add('time-up');
        } else {
            const diff = datetime - now;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            span.textContent = `Time remaining: ${days}d ${hours}h ${minutes}m`;
            span.classList.remove('time-up');
        }
    });
    updateDeleteAllButton();
}

function updateDeleteAllButton() {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    deleteAllBtn.disabled = !anyChecked;
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const columnId = event.target.closest('ul')?.id;
    if (!columnId) return; // Asegúrate de que columnId esté definido

    const draggedElementId = event.dataTransfer.getData('text/plain');
    const draggedElement = document.getElementById(draggedElementId);

    if (draggedElement) {
        draggedElement.dataset.column = columnId;
        const newList = document.getElementById(columnId);
        if (newList) {
            newList.appendChild(draggedElement);
            saveTasks();
        } else {
            console.warn(`List ${columnId} not found`);
        }
    }
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    const taskDate = taskDatetime.value;
    const taskPriorityValue = taskPriority.value;
    if (taskText && taskDate) {
        addTaskToDOM({ 
            text: taskText, 
            datetime: taskDate, 
            priority: taskPriorityValue, 
            completed: false, 
            column: 'todo-list' 
        });
        taskInput.value = '';
        taskDatetime.value = '';
        saveTasks();
        updateCountdowns();
    }
});

deleteAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.task-checkbox:checked').forEach(cb => cb.parentElement.remove());
    saveTasks();
    updateCountdowns();
});

editTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentTaskElement) {
        currentTaskElement.querySelector('.task-text').textContent = editTaskInput.value.trim();
        currentTaskElement.querySelector('.task-datetime').value = editTaskDatetime.value;
        currentTaskElement.classList.remove('low-priority', 'medium-priority', 'high-priority');
        const priorityClass = editTaskPriority.value.toLowerCase() + '-priority';
        currentTaskElement.classList.add(priorityClass);

        // Move task to the selected column
        const newColumnId = editTaskColumn.value;
        const newList = document.getElementById(newColumnId);
        if (newList) {
            newList.appendChild(currentTaskElement);
            currentTaskElement.dataset.column = newColumnId;
        } else {
            console.warn(`List ${newColumnId} not found`);
        }
        
        saveTasks();
        updateCountdowns();
        editModal.style.display = 'none';
    }
});

closeModalBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
});

setInterval(updateCountdowns, 60000);

loadTasks();

document.querySelectorAll('ul').forEach(ul => {
    ul.addEventListener('dragover', allowDrop);
    ul.addEventListener('drop', drop);
});

const darkModeToggle = document.getElementById('dark-mode-toggle');

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = darkModeToggle.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
});
