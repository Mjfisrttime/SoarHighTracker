const Profile = {
    currentUser: null,

    async init() {
        const session = await Auth.checkSession(true);
        if (!session) return;

        this.currentUser = await Auth.getCurrentUser();
        if (!this.currentUser) return;

        await Utils.loadComponents(this.currentUser.role, this.currentUser.name);

        await this.loadProfileData();

        document.getElementById('form-update-name').addEventListener('submit', (e) => this.updateName(e));
        document.getElementById('form-change-password').addEventListener('submit', (e) => this.changePassword(e));
    },

    async loadProfileData() {
        try {
            // Fetch fresh data from users table to get exact join date and role
            const { data, error } = await supabaseClient
                .from('users')
                .select('email, role, created_at, name')
                .eq('id', this.currentUser.id)
                .single();

            if (error) throw error;

            document.getElementById('profile-email').textContent = data.email;
            document.getElementById('profile-role').textContent = data.role;
            
            const joinDate = new Date(data.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            document.getElementById('profile-joined').textContent = joinDate;

            document.getElementById('profile-name').value = data.name;

        } catch (error) {
            console.error("Error loading profile:", error);
            Utils.showToast("Failed to load profile details.", "error");
        }
    },

    async updateName(e) {
        e.preventDefault();
        
        const newName = document.getElementById('profile-name').value.trim();
        if (!newName) return;

        const btn = document.getElementById('btn-save-name');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
            const { error } = await supabaseClient
                .from('users')
                .update({ name: newName })
                .eq('id', this.currentUser.id);

            if (error) throw error;

            Utils.showToast("Profile name updated successfully!", "success");
            
            // Update the navbar dynamically
            const nameEl = document.getElementById('nav-user-name');
            if (nameEl) nameEl.textContent = newName;

            // Update local user object
            this.currentUser.name = newName;

        } catch (error) {
            console.error(error);
            Utils.showToast("Failed to update name.", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Changes';
        }
    },

    async changePassword(e) {
        e.preventDefault();

        const newPass = document.getElementById('new-password').value;
        const confPass = document.getElementById('confirm-password').value;

        if (newPass !== confPass) {
            Utils.showToast("Passwords do not match!", "error");
            return;
        }

        const btn = document.getElementById('btn-save-password');
        btn.disabled = true;
        btn.textContent = 'Updating...';

        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: newPass
            });

            if (error) throw error;

            Utils.showToast("Password updated successfully!", "success");
            document.getElementById('form-change-password').reset();

        } catch (error) {
            console.error(error);
            Utils.showToast(error.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Update Password';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Profile.init();
});
