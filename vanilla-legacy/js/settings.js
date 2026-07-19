const Settings = {
    async init() {
        const session = await Auth.checkSession(true);
        if (!session) return;

        const user = await Auth.getCurrentUser();
        if (!user) return;

        await Utils.loadComponents(user.role, user.name);

        this.setupThemeToggle();

        document.getElementById('btn-logout').addEventListener('click', () => {
            Auth.logout();
        });
    },

    setupThemeToggle() {
        const btn = document.getElementById('btn-toggle-theme');
        
        // Initial state
        if (document.body.classList.contains('dark-theme')) {
            btn.textContent = 'Disable Dark Mode';
            btn.classList.replace('btn-primary', 'btn-secondary');
        }

        btn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            
            if (document.body.classList.contains('dark-theme')) {
                localStorage.setItem('theme', 'dark');
                btn.textContent = 'Disable Dark Mode';
                btn.classList.replace('btn-primary', 'btn-secondary');
            } else {
                localStorage.setItem('theme', 'light');
                btn.textContent = 'Enable Dark Mode';
                btn.classList.replace('btn-secondary', 'btn-primary');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Settings.init();
});
