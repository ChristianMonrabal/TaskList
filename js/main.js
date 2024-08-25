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
        addTaskToDOM(task);
    });
    updateDeleteAllButton();
}

function saveTasks() {
    const tasks = Array.from(document.querySelectorAll('li')).map(li => ({
        id: li.id,
        text: li.querySelector('.task-text').textContent.trim(),
        datetime: li.querySelector('.task-datetime').value,
        priority: li.classList.contains('low-priority') ? 'Low' : 
                li.classList.contains('medium-priority') ? 'Medium' : 'High',
        completed: li.querySelector('.task-text').classList.contains('completed'),
        column: li.closest('ul').id
    }));
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function addTaskToDOM(task) {
    const li = document.createElement('li');
    li.id = task.id || `task-${Date.now()}`;
    li.classList.add(`${task.priority.toLowerCase()}-priority`);
    li.setAttribute('draggable', true);
    li.dataset.column = task.column;

    li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-info">
            <span class="task-text ${task.completed ? 'completed' : ''}">${task.text || 'Unnamed Task'}</span>
            <input type="datetime-local" class="task-datetime" value="${task.datetime}">
        </div>
        <div class="task-actions">
            <button class="edit">Edit</button>
            <button class="remove">Delete</button>
        </div>
    `;

    li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', li.id);
        e.target.classList.add('dragging');
    });

    li.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        saveTasks();
    });

    li.querySelector('.task-text').addEventListener('click', () => {
        li.querySelector('.task-text').classList.toggle('completed');
        saveTasks();
    });

    li.querySelector('.remove').addEventListener('click', () => {
        li.remove();
        saveTasks();
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
        updateDeleteAllButton();
    });

    const list = document.getElementById(task.column);
    if (list) {
        list.appendChild(li);
    } else {
        console.warn(`Column ${task.column} not found`);
    }
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
    if (!columnId) return;

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
    }
});

deleteAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.task-checkbox:checked').forEach(cb => cb.parentElement.remove());
    saveTasks();
});

editTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentTaskElement) {
        currentTaskElement.querySelector('.task-text').textContent = editTaskInput.value.trim();
        currentTaskElement.querySelector('.task-datetime').value = editTaskDatetime.value;
        currentTaskElement.classList.remove('low-priority', 'medium-priority', 'high-priority');
        const priorityClass = editTaskPriority.value.toLowerCase() + '-priority';
        currentTaskElement.classList.add(priorityClass);

        const newColumnId = editTaskColumn.value;
        const newList = document.getElementById(newColumnId);
        if (newList) {
            newList.appendChild(currentTaskElement);
            currentTaskElement.dataset.column = newColumnId;
        } else {
            console.warn(`List ${newColumnId} not found`);
        }
        
        saveTasks();
        editModal.style.display = 'none';
    }
});

closeModalBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
});

loadTasks();

document.querySelectorAll('ul').forEach(ul => {
    ul.addEventListener('dragover', allowDrop);
    ul.addEventListener('drop', drop);
});
