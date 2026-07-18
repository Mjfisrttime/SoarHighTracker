const Dashboard = {
    async init(user) {
        try {
            const role = user.role;
            const cardsGrid = document.getElementById('dashboard-cards');
            cardsGrid.innerHTML = '<div>Loading dashboard...</div>';

            let cardsHtml = '';

            if (role === 'Admin') {
                // Admin stats
                const { count: groupsCount } = await supabaseClient.from('groups').select('*', { count: 'exact', head: true });
                const { count: membersCount } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });
                const { count: attendanceCount } = await supabaseClient.from('attendance').select('*', { count: 'exact', head: true });
                const { count: tasksCount } = await supabaseClient.from('task_logs').select('*', { count: 'exact', head: true });

                cardsHtml = `
                    <div class="card">
                        <h3>Total Groups</h3>
                        <p class="card-value">${groupsCount || 0}</p>
                    </div>
                    <div class="card">
                        <h3>Total Members</h3>
                        <p class="card-value">${membersCount || 0}</p>
                    </div>
                    <div class="card">
                        <h3>Total Attendance</h3>
                        <p class="card-value">${attendanceCount || 0}</p>
                    </div>
                    <div class="card">
                        <h3>Task Logs</h3>
                        <p class="card-value">${tasksCount || 0}</p>
                    </div>
                `;
            } else {
                // Member stats
                const { count: myGroupsCount } = await supabaseClient.from('group_members').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
                const { count: myAttendanceCount } = await supabaseClient.from('attendance').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
                const { count: myTasksCount } = await supabaseClient.from('task_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

                cardsHtml = `
                    <div class="card">
                        <h3>My Groups</h3>
                        <p class="card-value">${myGroupsCount || 0}</p>
                    </div>
                    <div class="card">
                        <h3>My Attendance</h3>
                        <p class="card-value">${myAttendanceCount || 0}</p>
                    </div>
                    <div class="card">
                        <h3>My Task Logs</h3>
                        <p class="card-value">${myTasksCount || 0}</p>
                    </div>
                `;
            }

            cardsGrid.innerHTML = cardsHtml;

            // Load activity feed
            await this.loadActivityFeed();

        } catch (error) {
            console.error("Error loading dashboard data:", error);
            document.getElementById('dashboard-cards').innerHTML = '<p>Error loading dashboard data.</p>';
        }
    },

    async loadActivityFeed() {
        const feedContainer = document.getElementById('activity-feed');
        feedContainer.innerHTML = '<p style="padding: 16px;">Loading recent activity...</p>';
        
        try {
            const activities = [];

            // 1. Fetch Task Logs
            const { data: tasks } = await supabaseClient
                .from('task_logs')
                .select('title, logged_at, users(name)')
                .order('logged_at', { ascending: false })
                .limit(10);
            if (tasks) {
                tasks.forEach(t => activities.push({
                    type: 'Task',
                    text: `<strong>${t.users?.name || 'Unknown'}</strong> submitted a task: "${t.title}"`,
                    date: new Date(t.logged_at)
                }));
            }

            // 2. Fetch Attendance
            const { data: att } = await supabaseClient
                .from('attendance')
                .select('status, date, users(name)')
                .order('date', { ascending: false })
                .limit(10);
            if (att) {
                att.forEach(a => activities.push({
                    type: 'Attendance',
                    text: `<strong>${a.users?.name || 'Unknown'}</strong> was marked <em>${a.status}</em>`,
                    // Note: 'date' column in attendance is a date string. We'll approximate time to start of day, or use now if it's today.
                    // For a more accurate feed, a created_at column would be better, but we'll use date.
                    date: new Date(a.date + 'T12:00:00Z')
                }));
            }

            // 3. Fetch Groups
            const { data: grps } = await supabaseClient
                .from('groups')
                .select('name, created_at, users!groups_created_by_fkey(name)')
                .order('created_at', { ascending: false })
                .limit(10);
            if (grps) {
                grps.forEach(g => activities.push({
                    type: 'Group',
                    text: `<strong>${g.users?.name || 'Admin'}</strong> created a new group: "${g.name}"`,
                    date: new Date(g.created_at)
                }));
            }

            // 4. Fetch Group Members
            const { data: gm } = await supabaseClient
                .from('group_members')
                .select('assigned_at, users(name), groups(name)')
                .order('assigned_at', { ascending: false })
                .limit(10);
            if (gm) {
                gm.forEach(m => activities.push({
                    type: 'Users',
                    text: `<strong>${m.users?.name || 'A user'}</strong> was added to "${m.groups?.name || 'a group'}"`,
                    date: new Date(m.assigned_at)
                }));
            }

            // Sort all activities by date descending
            activities.sort((a, b) => b.date - a.date);

            // Take top 10
            const top10 = activities.slice(0, 10);

            if (top10.length === 0) {
                feedContainer.innerHTML = '<p style="padding: 16px;" class="empty-state">No recent activities found.</p>';
                return;
            }

            let html = '';
            top10.forEach(act => {
                let badgeClass = '';
                if (act.type === 'Task') badgeClass = 'bg-blue';
                if (act.type === 'Attendance') badgeClass = 'bg-green';
                if (act.type === 'Group') badgeClass = 'bg-purple';
                if (act.type === 'Users') badgeClass = 'bg-orange';

                html += `
                    <div class="activity-item">
                        <div class="activity-icon ${badgeClass}">
                            ${act.type.charAt(0)}
                        </div>
                        <div class="activity-content">
                            <p>${act.text}</p>
                            <small>${this.timeAgo(act.date)}</small>
                        </div>
                    </div>
                `;
            });
            
            feedContainer.innerHTML = html;

        } catch (error) {
            console.error("Feed error:", error);
            feedContainer.innerHTML = '<p style="padding: 16px; color: red;">Error loading activity feed.</p>';
        }
    },

    timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    }
};
