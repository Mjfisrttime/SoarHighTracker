const Groups = {
    allGroups: [],
    currentUser: null,

    async init() {
        const session = await Auth.checkSession(true);
        if (!session) return;

        this.currentUser = await Auth.getCurrentUser();
        if (!this.currentUser) return;

        await Utils.loadComponents(this.currentUser.role, this.currentUser.name);

        if (this.currentUser.role !== 'Admin') {
            document.querySelector('.dashboard-content').innerHTML = `<h2>Access Denied</h2><p>Only Admins can manage groups.</p>`;
            return;
        }

        this.bindEvents();
        await this.loadGroups();
    },

    bindEvents() {
        // Modal logic
        const modal = document.getElementById('group-modal');
        const btnCreate = document.getElementById('btn-create-group');
        const btnClose = document.getElementById('modal-close');
        const form = document.getElementById('group-form');
        const searchInput = document.getElementById('search-groups');

        btnCreate.addEventListener('click', () => this.openModal());
        btnClose.addEventListener('click', () => this.closeModal());
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        form.addEventListener('submit', (e) => this.handleSave(e));

        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = this.allGroups.filter(g => g.name.toLowerCase().includes(term));
            this.renderGroups(filtered);
        });
    },

    async loadGroups() {
        const list = document.getElementById('groups-list');
        list.innerHTML = '<p>Loading groups...</p>';

        try {
            const { data, error } = await supabaseClient
                .from('groups')
                .select(`
                    id, name, description, created_at,
                    users!groups_created_by_fkey(name),
                    group_members(count)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.allGroups = data || [];
            this.renderGroups(this.allGroups);
        } catch (error) {
            console.error(error);
            list.innerHTML = '<p>Error loading groups.</p>';
        }
    },

    renderGroups(groups) {
        const list = document.getElementById('groups-list');
        if (groups.length === 0) {
            list.innerHTML = '<p>No groups found.</p>';
            return;
        }

        let html = '';
        groups.forEach(g => {
            const creator = g.users?.name || 'Unknown';
            const memberCount = g.group_members?.[0]?.count || 0;
            html += `
                <div class="card">
                    <h3>${g.name}</h3>
                    <p>${g.description || 'No description provided.'}</p>
                    <hr>
                    <p><small>Members: ${memberCount}</small></p>
                    <p><small>Created by: ${creator} on ${Utils.formatDate(g.created_at)}</small></p>
                    <div class="card-actions">
                        <button onclick="Groups.openModal('${g.id}')">Edit</button>
                        <button class="btn-danger" onclick="Groups.deleteGroup('${g.id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    },

    openModal(id = null) {
        const modal = document.getElementById('group-modal');
        const title = document.getElementById('modal-title');
        const idField = document.getElementById('group-id');
        const nameField = document.getElementById('group-name');
        const descField = document.getElementById('group-desc');

        if (id) {
            title.textContent = 'Edit Group';
            const group = this.allGroups.find(g => g.id === id);
            idField.value = group.id;
            nameField.value = group.name;
            descField.value = group.description || '';
        } else {
            title.textContent = 'Create Group';
            idField.value = '';
            nameField.value = '';
            descField.value = '';
        }

        modal.classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('group-modal').classList.add('hidden');
    },

    async handleSave(e) {
        e.preventDefault();
        const id = document.getElementById('group-id').value;
        const name = document.getElementById('group-name').value;
        const description = document.getElementById('group-desc').value;
        const btn = document.getElementById('btn-save-group');

        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
            if (id) {
                // Update
                const { error } = await supabaseClient
                    .from('groups')
                    .update({ name, description })
                    .eq('id', id);
                if (error) throw error;
                Utils.showToast("Group updated", "success");
            } else {
                // Insert
                const { error } = await supabaseClient
                    .from('groups')
                    .insert([{ name, description, created_by: this.currentUser.id }]);
                if (error) throw error;
                Utils.showToast("Group created", "success");
            }
            this.closeModal();
            await this.loadGroups();
        } catch (error) {
            console.error(error);
            Utils.showToast(error.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save';
        }
    },

    async deleteGroup(id) {
        if (!confirm("Are you sure you want to delete this group? All memberships will be removed.")) return;

        try {
            const { error } = await supabaseClient
                .from('groups')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            Utils.showToast("Group deleted", "success");
            await this.loadGroups();
        } catch (error) {
            console.error(error);
            Utils.showToast(error.message, "error");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Groups.init();
});
