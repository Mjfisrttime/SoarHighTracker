const TaskLogs = {
    currentUser: null,
    allAdminTasks: [], // Cache for admin filtering

    async init() {
        const session = await Auth.checkSession(true);
        if (!session) return;

        this.currentUser = await Auth.getCurrentUser();
        if (!this.currentUser) return;

        await Utils.loadComponents(this.currentUser.role, this.currentUser.name);

        if (this.currentUser.role === 'Admin') {
            document.getElementById('admin-task-view').classList.remove('hidden');
            this.initAdmin();
        } else {
            document.getElementById('member-task-view').classList.remove('hidden');
            this.initMember();
        }
    },

    // ==========================================
    // MEMBER LOGIC
    // ==========================================
    async initMember() {
        // Setup Date Picker Max
        const dateInput = document.getElementById('task-date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.max = today;

        document.getElementById('task-form').addEventListener('submit', (e) => this.submitTask(e));

        await Promise.all([this.loadMemberGroups(), this.loadMyTasks()]);
    },

    async loadMemberGroups() {
        try {
            const { data, error } = await supabaseClient
                .from('group_members')
                .select('groups(id, name)')
                .eq('user_id', this.currentUser.id);

            if (error) throw error;
            
            const select = document.getElementById('task-group');
            if (data) {
                data.forEach(gm => {
                    if (gm.groups) {
                        select.innerHTML += `<option value="${gm.groups.id}">${gm.groups.name}</option>`;
                    }
                });
            }
        } catch (error) {
            console.error(error);
        }
    },

    async submitTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('task-title').value.trim();
        const date = document.getElementById('task-date').value;
        const groupId = document.getElementById('task-group').value || null;
        const hours = document.getElementById('task-hours').value.trim();
        const description = document.getElementById('task-desc').value.trim();
        const btn = document.getElementById('btn-submit-task');

        btn.disabled = true;
        btn.textContent = 'Submitting...';

        try {
            const { error } = await supabaseClient
                .from('task_logs')
                .insert([{ 
                    user_id: this.currentUser.id, 
                    title: title,
                    date: date,
                    group_id: groupId,
                    hours_spent: hours,
                    task_description: description || 'No description provided.'
                }]);

            if (error) throw error;

            Utils.showToast("Task submitted successfully!", "success");
            document.getElementById('task-form').reset();
            document.getElementById('task-date').value = new Date().toISOString().split('T')[0];
            await this.loadMyTasks();
        } catch (error) {
            console.error(error);
            Utils.showToast(error.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Submit Task';
        }
    },

    async loadMyTasks() {
        const list = document.getElementById('member-tasks-list');
        list.innerHTML = '<p>Loading tasks...</p>';

        try {
            const { data, error } = await supabaseClient
                .from('task_logs')
                .select(`
                    title, date, task_description,
                    groups(name)
                `)
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            // Note: because the original schema didn't have created_at on task_logs, 
            // wait, the original schema had logged_at DEFAULT NOW(). We should order by logged_at.
            // Let's modify the query to order by logged_at.
            
        } catch (error) {
            console.error(error);
        }
    }
};

// Let's redefine the query carefully to avoid errors:
TaskLogs.loadMyTasks = async function() {
    const list = document.getElementById('member-tasks-list');
    list.innerHTML = '<p>Loading tasks...</p>';

    try {
        const { data, error } = await supabaseClient
            .from('task_logs')
            .select(`
                title, date, task_description, logged_at, hours_spent,
                groups(name)
            `)
            .eq('user_id', this.currentUser.id)
            .order('logged_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            list.innerHTML = '<p class="empty-state">You haven\'t submitted any tasks yet.</p>';
            return;
        }

        let html = '';
        data.forEach(t => {
            const groupBadge = t.groups ? `<span class="badge badge-group">${t.groups.name}</span>` : '';
            html += `
                <div class="task-card">
                    <h4>${t.title} ${groupBadge}</h4>
                    <small>${Utils.formatDate(t.date)} - Time Spent: ${t.hours_spent}</small>
                    <p>${t.task_description}</p>
                </div>
            `;
        });
        list.innerHTML = html;
    } catch (error) {
        console.error(error);
        list.innerHTML = '<p>Error loading tasks.</p>';
    }
};

// ==========================================
// ADMIN LOGIC
// ==========================================
TaskLogs.initAdmin = async function() {
    const groupSelect = document.getElementById('admin-filter-group');
    const dateSelect = document.getElementById('admin-filter-date');
    const btnClear = document.getElementById('btn-clear-filters');

    groupSelect.addEventListener('change', () => this.applyFilters());
    dateSelect.addEventListener('change', () => this.applyFilters());
    btnClear.addEventListener('click', () => {
        groupSelect.value = '';
        dateSelect.value = '';
        this.applyFilters();
    });

    await Promise.all([this.loadAdminGroups(), this.loadAllTasks()]);
};

TaskLogs.loadAdminGroups = async function() {
    try {
        const { data, error } = await supabaseClient
            .from('groups')
            .select('id, name')
            .order('name');
        
        if (error) throw error;
        
        const select = document.getElementById('admin-filter-group');
        data.forEach(g => {
            select.innerHTML += `<option value="${g.id}">${g.name}</option>`;
        });
    } catch (error) {
        console.error(error);
    }
};

TaskLogs.loadAllTasks = async function() {
    const list = document.getElementById('admin-tasks-list');
    
    try {
        const { data, error } = await supabaseClient
            .from('task_logs')
            .select(`
                title, date, task_description, logged_at, group_id, hours_spent,
                users(name),
                groups(name)
            `)
            .order('logged_at', { ascending: false });

        if (error) throw error;
        
        this.allAdminTasks = data || [];
        this.applyFilters();
    } catch (error) {
        console.error(error);
        list.innerHTML = '<tr><td colspan="5">Error loading tasks.</td></tr>';
    }
};

TaskLogs.applyFilters = function() {
    const groupId = document.getElementById('admin-filter-group').value;
    const date = document.getElementById('admin-filter-date').value;
    const list = document.getElementById('admin-tasks-list');

    let filtered = this.allAdminTasks;

    if (groupId) {
        filtered = filtered.filter(t => t.group_id === groupId);
    }
    if (date) {
        filtered = filtered.filter(t => t.date === date);
    }

    if (filtered.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="empty-state">No tasks match the selected filters.</td></tr>';
        return;
    }

    let html = '';
    filtered.forEach(t => {
        const userName = t.users?.name || 'Unknown';
        const groupName = t.groups?.name || '-';
        html += `
            <tr>
                <td>${Utils.formatDate(t.date)}</td>
                <td>${userName}</td>
                <td>${groupName}</td>
                <td><strong>${t.title}</strong> (Time: ${t.hours_spent})</td>
                <td>${t.task_description}</td>
            </tr>
        `;
    });
    list.innerHTML = html;
};

document.addEventListener('DOMContentLoaded', () => {
    TaskLogs.init();
});
