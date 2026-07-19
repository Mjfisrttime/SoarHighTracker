const Reports = {
    currentUser: null,

    async init() {
        const session = await Auth.checkSession(true);
        if (!session) return;

        this.currentUser = await Auth.getCurrentUser();
        if (!this.currentUser) return;

        await Utils.loadComponents(this.currentUser.role, this.currentUser.name);

        if (this.currentUser.role !== 'Admin') {
            document.querySelector('.dashboard-content').innerHTML = `
                <div class="page-header"><h1>Access Denied</h1></div>
                <div style="padding: 32px;"><p>Only Admins can view reports.</p></div>
            `;
            return;
        }

        document.getElementById('btn-generate').addEventListener('click', () => this.generateReport());
        await this.loadGroups();
    },

    async loadGroups() {
        try {
            const { data, error } = await supabaseClient
                .from('groups')
                .select('id, name')
                .order('name');
            
            if (error) throw error;
            
            const select = document.getElementById('report-group');
            data.forEach(g => {
                select.innerHTML += `<option value="${g.id}">${g.name}</option>`;
            });
        } catch (error) {
            console.error(error);
        }
    },

    async generateReport() {
        const type = document.getElementById('report-type').value;
        const groupId = document.getElementById('report-group').value;
        const month = document.getElementById('report-month').value; // format: YYYY-MM
        const container = document.getElementById('report-container');

        if (!groupId) {
            Utils.showToast("Please select a group first.", "error");
            return;
        }

        container.innerHTML = '<p style="padding: 24px;">Loading report data...</p>';

        try {
            if (type === 'attendance') {
                await this.generateAttendance(groupId, month, container);
            } else if (type === 'tasks') {
                await this.generateTasks(groupId, month, container);
            }
        } catch (error) {
            console.error(error);
            container.innerHTML = `<p style="padding: 24px; color: red;">Error: ${error.message}</p>`;
        }
    },

    async generateAttendance(groupId, month, container) {
        // 1. Get all members in the group
        const { data: members, error: memError } = await supabaseClient
            .from('group_members')
            .select('users(id, name)')
            .eq('group_id', groupId);
        
        if (memError) throw memError;

        // 2. Get all attendance records for the group
        const userIds = members.map(m => m.users.id);
        let query = supabaseClient
            .from('attendance')
            .select('user_id, date, status')
            .in('user_id', userIds)
            .order('date', { ascending: true });
        
        if (month) {
            // month is "YYYY-MM"
            const startDate = `${month}-01`;
            // Simple hack for end of month: advance to next month and subtract 1 day
            const [y, m] = month.split('-');
            const nextMonth = new Date(y, m, 1);
            const endDate = nextMonth.toISOString().split('T')[0]; // first day of next month (using < endDate)
            query = query.gte('date', startDate).lt('date', endDate);
        }

        const { data: records, error: attError } = await query;
        if (attError) throw attError;

        if (!members || members.length === 0) {
            container.innerHTML = '<p style="padding: 24px;">This group has no members.</p>';
            return;
        }

        if (!records || records.length === 0) {
            container.innerHTML = '<p style="padding: 24px;" class="empty-state">No attendance data found for the selected filters.</p>';
            return;
        }

        // Pivot Data
        // Get unique dates
        const dateSet = new Set();
        records.forEach(r => dateSet.add(r.date));
        const dates = Array.from(dateSet).sort();

        // Map users to their statuses by date
        const userMap = {};
        members.forEach(m => {
            if (m.users) {
                userMap[m.users.id] = { name: m.users.name, statuses: {}, stats: { Present: 0, Absent: 0, Late: 0 } };
            }
        });

        records.forEach(r => {
            if (userMap[r.user_id]) {
                userMap[r.user_id].statuses[r.date] = r.status;
                if (userMap[r.user_id].stats[r.status] !== undefined) {
                    userMap[r.user_id].stats[r.status]++;
                }
            }
        });

        // Generate HTML Table
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Member Name</th>
                        ${dates.map(d => `<th>${Utils.formatDate(d)}</th>`).join('')}
                        <th>Total Present</th>
                    </tr>
                </thead>
                <tbody>
        `;

        Object.values(userMap).sort((a, b) => a.name.localeCompare(b.name)).forEach(user => {
            html += `<tr><td><strong>${user.name}</strong></td>`;
            dates.forEach(d => {
                const status = user.statuses[d] || '-';
                let color = '';
                if (status === 'Present') color = 'color: green; font-weight: bold;';
                if (status === 'Absent') color = 'color: red; font-weight: bold;';
                if (status === 'Late') color = 'color: orange; font-weight: bold;';
                
                // Map status to single letter for grid compactness
                const shortStatus = status === '-' ? '-' : status.charAt(0);
                
                html += `<td style="${color}">${shortStatus}</td>`;
            });
            const totalDays = dates.length;
            html += `<td>${user.stats.Present} / ${totalDays}</td></tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    },

    async generateTasks(groupId, month, container) {
        let query = supabaseClient
            .from('task_logs')
            .select(`
                title, date, task_description, hours_spent,
                users(name)
            `)
            .eq('group_id', groupId)
            .order('date', { ascending: false });
        
        if (month) {
            const startDate = `${month}-01`;
            const [y, m] = month.split('-');
            const nextMonth = new Date(y, m, 1);
            const endDate = nextMonth.toISOString().split('T')[0];
            query = query.gte('date', startDate).lt('date', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="padding: 24px;" class="empty-state">No tasks found for the selected filters.</p>';
            return;
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Member</th>
                        <th>Task Title</th>
                        <th>Time Spent</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(t => {
            const userName = t.users?.name || 'Unknown';
            html += `
                <tr>
                    <td>${Utils.formatDate(t.date)}</td>
                    <td>${userName}</td>
                    <td>
                        <strong>${t.title}</strong><br>
                        <small style="color: var(--text-light);">${t.task_description}</small>
                    </td>
                    <td>${t.hours_spent}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Reports.init();
});
