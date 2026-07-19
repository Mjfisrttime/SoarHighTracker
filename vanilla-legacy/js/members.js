const Members = {
    allUsers: [],
    allGroups: [],
    currentUser: null,

    async init() {
        const session = await Auth.checkSession(true);
        if (!session) return;

        this.currentUser = await Auth.getCurrentUser();
        if (!this.currentUser) return;

        await Utils.loadComponents(this.currentUser.role, this.currentUser.name);

        if (this.currentUser.role !== 'Admin') {
            document.querySelector('.dashboard-content').innerHTML = `<h2>Access Denied</h2><p>Only Admins can manage members.</p>`;
            return;
        }

        this.bindEvents();
        await Promise.all([this.loadUsers(), this.loadAllGroups()]);
    },

    bindEvents() {
        const modal = document.getElementById('assign-modal');
        const btnClose = document.getElementById('modal-close');
        const btnAdd = document.getElementById('btn-add-to-group');
        const searchInput = document.getElementById('search-members');

        btnClose.addEventListener('click', () => this.closeModal());
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        btnAdd.addEventListener('click', () => this.assignToGroup());

        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = this.allUsers.filter(u => 
                u.name.toLowerCase().includes(term) || 
                u.email.toLowerCase().includes(term)
            );
            this.renderUsers(filtered);
        });
    },

    async loadUsers() {
        const list = document.getElementById('members-list');
        list.innerHTML = '<tr><td colspan="5">Loading members...</td></tr>';

        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.allUsers = data || [];
            this.renderUsers(this.allUsers);
        } catch (error) {
            console.error(error);
            list.innerHTML = '<tr><td colspan="5">Error loading members.</td></tr>';
        }
    },

    async loadAllGroups() {
        try {
            const { data, error } = await supabaseClient
                .from('groups')
                .select('id, name')
                .order('name');

            if (error) throw error;
            this.allGroups = data || [];
        } catch (error) {
            console.error("Error loading groups for dropdown:", error);
        }
    },

    renderUsers(users) {
        const list = document.getElementById('members-list');
        if (users.length === 0) {
            list.innerHTML = '<tr><td colspan="5">No members found.</td></tr>';
            return;
        }

        let html = '';
        users.forEach(u => {
            html += `
                <tr>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td>${u.role}</td>
                    <td>${Utils.formatDate(u.created_at)}</td>
                    <td>
                        <button onclick="Members.openAssignModal('${u.id}', '${u.name.replace(/'/g, "\\'")}')">Manage Groups</button>
                    </td>
                </tr>
            `;
        });
        list.innerHTML = html;
    },

    async openAssignModal(userId, userName) {
        document.getElementById('assign-user-name').textContent = userName;
        document.getElementById('assign-user-id').value = userId;
        
        // Populate group dropdown
        const select = document.getElementById('group-select');
        let options = '<option value="">Select a group...</option>';
        this.allGroups.forEach(g => {
            options += `<option value="${g.id}">${g.name}</option>`;
        });
        select.innerHTML = options;

        document.getElementById('assign-modal').classList.remove('hidden');
        await this.loadUserGroups(userId);
    },

    closeModal() {
        document.getElementById('assign-modal').classList.add('hidden');
    },

    async loadUserGroups(userId) {
        const list = document.getElementById('current-groups-list');
        list.innerHTML = '<li>Loading...</li>';

        try {
            const { data, error } = await supabaseClient
                .from('group_members')
                .select(`
                    group_id,
                    groups (id, name)
                `)
                .eq('user_id', userId);

            if (error) throw error;

            if (!data || data.length === 0) {
                list.innerHTML = '<li>User is not in any groups.</li>';
                return;
            }

            let html = '';
            data.forEach(gm => {
                if (gm.groups) {
                    html += `
                        <li>
                            <span>${gm.groups.name}</span>
                            <button class="btn-danger btn-sm" onclick="Members.removeFromGroup('${userId}', '${gm.groups.id}')">Remove</button>
                        </li>
                    `;
                }
            });
            list.innerHTML = html;

        } catch (error) {
            console.error(error);
            list.innerHTML = '<li>Error loading user groups.</li>';
        }
    },

    async assignToGroup() {
        const userId = document.getElementById('assign-user-id').value;
        const groupId = document.getElementById('group-select').value;
        const btn = document.getElementById('btn-add-to-group');

        if (!groupId) {
            Utils.showToast("Please select a group first.", "error");
            return;
        }

        btn.disabled = true;
        btn.textContent = '...';

        try {
            const { error } = await supabaseClient
                .from('group_members')
                .insert([{ user_id: userId, group_id: groupId }]);
            
            if (error) {
                if (error.code === '23505') { // Unique violation
                    throw new Error("User is already in this group.");
                }
                throw error;
            }

            Utils.showToast("User added to group!", "success");
            await this.loadUserGroups(userId); // refresh list
        } catch (error) {
            console.error(error);
            Utils.showToast(error.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Add';
        }
    },

    async removeFromGroup(userId, groupId) {
        if (!confirm("Are you sure you want to remove this user from the group?")) return;

        try {
            const { error } = await supabaseClient
                .from('group_members')
                .delete()
                .match({ user_id: userId, group_id: groupId });

            if (error) throw error;

            Utils.showToast("User removed from group.", "success");
            await this.loadUserGroups(userId); // refresh list
        } catch (error) {
            console.error(error);
            Utils.showToast(error.message, "error");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Members.init();
});
