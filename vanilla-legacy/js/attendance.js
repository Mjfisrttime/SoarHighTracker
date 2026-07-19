const Attendance = {
    currentUser: null,
    currentGroupMembers: [],

    async init() {
        const session = await Auth.checkSession(true);
        if (!session) return;

        this.currentUser = await Auth.getCurrentUser();
        if (!this.currentUser) return;

        await Utils.loadComponents(this.currentUser.role, this.currentUser.name);

        if (this.currentUser.role === 'Admin') {
            document.getElementById('admin-attendance-view').classList.remove('hidden');
            this.initAdmin();
        } else {
            document.getElementById('member-attendance-view').classList.remove('hidden');
            this.initMember();
        }
    },

    // ==========================================
    // ADMIN LOGIC
    // ==========================================
    async initAdmin() {
        // Setup Date Picker
        const datePicker = document.getElementById('admin-date-picker');
        const today = new Date().toISOString().split('T')[0];
        datePicker.value = today;
        datePicker.max = today; // Prevent future dates

        // Bind events
        const groupSelect = document.getElementById('admin-group-select');
        const btnSave = document.getElementById('btn-save-attendance');

        groupSelect.addEventListener('change', () => this.loadMembersForAttendance());
        datePicker.addEventListener('change', () => this.loadMembersForAttendance());
        btnSave.addEventListener('click', () => this.saveAttendance());

        await this.loadAdminGroups();
    },

    async loadAdminGroups() {
        try {
            const { data, error } = await supabaseClient
                .from('groups')
                .select('id, name')
                .order('name');
            if (error) throw error;
            
            const select = document.getElementById('admin-group-select');
            data.forEach(g => {
                select.innerHTML += `<option value="${g.id}">${g.name}</option>`;
            });
        } catch (error) {
            console.error(error);
            Utils.showToast("Failed to load groups.", "error");
        }
    },

    async loadMembersForAttendance() {
        const groupId = document.getElementById('admin-group-select').value;
        const date = document.getElementById('admin-date-picker').value;
        const list = document.getElementById('admin-attendance-list');

        if (!groupId || !date) {
            list.innerHTML = '<tr><td colspan="2">Select a group and date.</td></tr>';
            return;
        }

        list.innerHTML = '<tr><td colspan="2">Loading...</td></tr>';

        try {
            // 1. Fetch members of the group
            const { data: members, error: memError } = await supabaseClient
                .from('group_members')
                .select('user_id, users(name)')
                .eq('group_id', groupId);

            if (memError) throw memError;

            if (!members || members.length === 0) {
                list.innerHTML = '<tr><td colspan="2">No members in this group.</td></tr>';
                this.currentGroupMembers = [];
                return;
            }

            // 2. Fetch existing attendance for this date to pre-fill radio buttons
            const userIds = members.map(m => m.user_id);
            const { data: existingRecords, error: attError } = await supabaseClient
                .from('attendance')
                .select('user_id, status')
                .eq('date', date)
                .in('user_id', userIds);

            if (attError) throw attError;

            // Create a lookup map for existing statuses
            const statusMap = {};
            if (existingRecords) {
                existingRecords.forEach(r => statusMap[r.user_id] = r.status);
            }

            this.currentGroupMembers = members;

            // 3. Render the table rows
            let html = '';
            members.forEach(m => {
                const uid = m.user_id;
                const name = m.users?.name || 'Unknown';
                const currentStatus = statusMap[uid] || 'Present'; // Default to Present if none

                html += `
                    <tr>
                        <td>${name}</td>
                        <td class="radio-group">
                            <label><input type="radio" name="status_${uid}" value="Present" ${currentStatus === 'Present' ? 'checked' : ''}> Present</label>
                            <label><input type="radio" name="status_${uid}" value="Absent" ${currentStatus === 'Absent' ? 'checked' : ''}> Absent</label>
                            <label><input type="radio" name="status_${uid}" value="Late" ${currentStatus === 'Late' ? 'checked' : ''}> Late</label>
                        </td>
                    </tr>
                `;
            });

            list.innerHTML = html;
        } catch (error) {
            console.error(error);
            list.innerHTML = '<tr><td colspan="2">Error loading data.</td></tr>';
        }
    },

    async saveAttendance() {
        const groupId = document.getElementById('admin-group-select').value;
        const date = document.getElementById('admin-date-picker').value;
        
        if (!groupId || !date || this.currentGroupMembers.length === 0) {
            Utils.showToast("Nothing to save.", "error");
            return;
        }

        const btn = document.getElementById('btn-save-attendance');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
            // Build the array of records to upsert
            const records = this.currentGroupMembers.map(m => {
                const uid = m.user_id;
                const status = document.querySelector(`input[name="status_${uid}"]:checked`).value;
                return {
                    user_id: uid,
                    date: date,
                    status: status
                };
            });

            // Upsert handles inserts or updates if the unique constraint (user_id, date) is met
            const { error } = await supabaseClient
                .from('attendance')
                .upsert(records, { onConflict: 'user_id, date' });

            if (error) throw error;

            Utils.showToast("Attendance saved successfully!", "success");
        } catch (error) {
            console.error(error);
            Utils.showToast(error.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Records';
        }
    },

    // ==========================================
    // MEMBER LOGIC
    // ==========================================
    async initMember() {
        try {
            const { data, error } = await supabaseClient
                .from('attendance')
                .select('date, status')
                .eq('user_id', this.currentUser.id)
                .order('date', { ascending: false });

            if (error) throw error;

            let present = 0, absent = 0, late = 0;
            let html = '';

            if (data && data.length > 0) {
                data.forEach(r => {
                    if (r.status === 'Present') present++;
                    if (r.status === 'Absent') absent++;
                    if (r.status === 'Late') late++;

                    let badgeClass = 'badge-present';
                    if (r.status === 'Absent') badgeClass = 'badge-absent';
                    if (r.status === 'Late') badgeClass = 'badge-late';

                    html += `
                        <tr>
                            <td>${Utils.formatDate(r.date)}</td>
                            <td><span class="badge ${badgeClass}">${r.status}</span></td>
                        </tr>
                    `;
                });
            } else {
                html = '<tr><td colspan="2">No attendance records found.</td></tr>';
            }

            document.getElementById('count-present').textContent = present;
            document.getElementById('count-absent').textContent = absent;
            document.getElementById('count-late').textContent = late;
            document.getElementById('member-recent-logs').innerHTML = html;

        } catch (error) {
            console.error(error);
            document.getElementById('member-recent-logs').innerHTML = '<tr><td colspan="2">Error loading records.</td></tr>';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Attendance.init();
});
