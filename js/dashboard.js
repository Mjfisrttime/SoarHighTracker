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

            // Load placeholder activity feed for Phase 3
            document.getElementById('activity-feed').innerHTML = '<p>No recent activity found.</p>';

        } catch (error) {
            console.error("Error loading dashboard data:", error);
            document.getElementById('dashboard-cards').innerHTML = '<p>Error loading dashboard data.</p>';
        }
    }
};
