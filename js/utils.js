/* Helper Utils */
const Utils = {
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    },
    showToast(message, type = 'info') {
        alert(`${type.toUpperCase()}: ${message}`);
    },

    async loadComponents(role, userName) {
        try {
            // Load Sidebar
            const sidebarRes = await fetch('components/sidebar.html');
            const sidebarHtml = await sidebarRes.text();
            const sidebarContainer = document.getElementById('sidebar-container');
            if (sidebarContainer) sidebarContainer.innerHTML = sidebarHtml;

            // Load Navbar
            const navbarRes = await fetch('components/navbar.html');
            const navbarHtml = await navbarRes.text();
            const navbarContainer = document.getElementById('navbar-container');
            if (navbarContainer) navbarContainer.innerHTML = navbarHtml;

            // Update user name in navbar
            const nameEl = document.getElementById('nav-user-name');
            if (nameEl) nameEl.textContent = userName || 'User';

            // Render specific sidebar links based on role
            this.renderSidebar(role);

        } catch (error) {
            console.error("Error loading components:", error);
        }
    },

    renderSidebar(role) {
        const sidebarLinks = document.getElementById('sidebar-links');
        if (!sidebarLinks) return;

        let html = '';
        if (role === 'Admin') {
            html += `
                <li><a href="dashboard.html">Dashboard</a></li>
                <li><a href="groups.html">Groups</a></li>
                <li><a href="members.html">Members</a></li>
                <li><a href="attendance.html">Attendance</a></li>
                <li><a href="#">Task Logs</a></li>
                <li><a href="#">Reports</a></li>
                <li><a href="#">Profile</a></li>
            `;
        } else {
            html += `
                <li><a href="dashboard.html">Dashboard</a></li>
                <li><a href="#">My Groups</a></li>
                <li><a href="attendance.html">Attendance</a></li>
                <li><a href="#">Task Logs</a></li>
                <li><a href="#">Profile</a></li>
            `;
        }
        sidebarLinks.innerHTML = html;
    }
};
