const API_BASE = 'http://localhost:5000/api';
let todos = [];

async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        const data = await response.json();
        return { success: true, data, status: response.status };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function getPriorityClass(priority) {
    switch(priority) {
        case 'high': return 'priority-high';
        case 'medium': return 'priority-medium';
        case 'low': return 'priority-low';
        default: return 'priority-medium';
    }
}

function createTodoElement(todo) {
    const isCompleted = todo.completed ? 'completed' : '';
    const priorityClass = getPriorityClass(todo.priority);
    
    return `
        <div class="todo-item ${isCompleted}" data-id="${todo.id}">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo(${todo.id})">
            <div class="todo-content">
                <div class="todo-title">${todo.title}</div>
                <div class="todo-meta">
                    ${todo.due_date ? `<span><i class="fas fa-calendar"></i> ${formatDate(todo.due_date)}</span>` : ''}
                    <span class="todo-priority ${priorityClass}">
                        <i class="fas fa-flag"></i> ${todo.priority}
                    </span>
                    <span class="todo-category">
                        <i class="fas fa-tag"></i> ${todo.category || 'other'}
                    </span>
                    <span><i class="fas fa-clock"></i> ${formatDate(todo.created_at)}</span>
                </div>
            </div>
            <div class="todo-actions">
                <button class="action-btn edit-btn" onclick="editTodo(${todo.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteTodo(${todo.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('totalTodos').textContent = total;
    document.getElementById('completedTodos').textContent = completed;
    document.getElementById('pendingTodos').textContent = pending;
    document.getElementById('completionRate').textContent = rate + '%';
    document.getElementById('progressFill').style.width = rate + '%';
}

function renderTodos(todosToRender = todos) {
    const container = document.getElementById('todosContainer');
    
    if (todosToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No todos found!</h3>
                <p>Try adjusting your filters or add a new todo</p>
            </div>
        `;
        return;
    }

    container.innerHTML = todosToRender.map(createTodoElement).join('');
}

function filterTodos() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;

    let filtered = todos.filter(todo => {
        const matchesSearch = todo.title.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'completed' && todo.completed) ||
            (statusFilter === 'pending' && !todo.completed);
        const matchesPriority = priorityFilter === 'all' || todo.priority === priorityFilter;
        const matchesCategory = categoryFilter === 'all' || (todo.category || 'other') === categoryFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    renderTodos(filtered);
}

async function loadTodos() {
    const result = await makeRequest(`${API_BASE}/todos`);
    if (result.success) {
        todos = Array.isArray(result.data) ? result.data : [];
        updateStats();
        renderTodos();
    }
}

async function createTodo() {
    const title = document.getElementById('newTodoTitle').value.trim();
    const dueDate = document.getElementById('newTodoDueDate').value;
    const priority = document.getElementById('newTodoPriority').value;
    const category = document.getElementById('newTodoCategory').value;

    if (!title) {
        alert('Please enter a todo title!');
        return;
    }

    const todoData = {
        title,
        due_date: dueDate || null,
        priority,
        category
    };

    const result = await makeRequest(`${API_BASE}/todos`, {
        method: 'POST',
        body: JSON.stringify(todoData)
    });

    if (result.success) {
        document.getElementById('newTodoTitle').value = '';
        document.getElementById('newTodoDueDate').value = '';
        document.getElementById('newTodoPriority').value = 'medium';
        document.getElementById('newTodoCategory').value = 'personal';
        await loadTodos();
    } else {
        alert('Error creating todo: ' + result.error);
    }
}

async function toggleTodo(id) {
    const result = await makeRequest(`${API_BASE}/todos/${id}/toggle`, {
        method: 'PATCH'
    });

    if (result.success) {
        await loadTodos();
    } else {
        alert('Error toggling todo: ' + result.error);
    }
}

async function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newTitle = prompt('Edit todo:', todo.title);
    if (newTitle === null || newTitle.trim() === '') return;

    const result = await makeRequest(`${API_BASE}/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: newTitle.trim() })
    });

    if (result.success) {
        await loadTodos();
    } else {
        alert('Error updating todo: ' + result.error);
    }
}

async function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this todo?')) {
        return;
    }

    const result = await makeRequest(`${API_BASE}/todos/${id}`, {
        method: 'DELETE'
    });

    if (result.success) {
        await loadTodos();
    } else {
        alert('Error deleting todo: ' + result.error);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        createTodo();
    }
});

// Auto-focus on input
document.getElementById('newTodoTitle').focus();

// Load todos on page load
window.onload = function() {
    loadTodos();
}; 