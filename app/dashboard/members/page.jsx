"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, showToast } from '@/lib/utils';

export default function MembersPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [userGroups, setUserGroups] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
    const user = { ...session.user, ...profile };
    setCurrentUser(user);
    if (user.role === 'Admin') {
      await Promise.all([loadUsers(), loadAllGroups()]);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (!error && data) setAllUsers(data);
  };

  const loadAllGroups = async () => {
    const { data, error } = await supabase.from('groups').select('id, name').order('name');
    if (!error && data) setAllGroups(data);
  };

  const openAssignModal = async (userId, userName) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSelectedGroupId('');
    setModalOpen(true);
    await loadUserGroups(userId);
  };

  const loadUserGroups = async (userId) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name)')
      .eq('user_id', userId);
    if (!error && data) setUserGroups(data);
    else setUserGroups([]);
  };

  const assignToGroup = async () => {
    if (!selectedGroupId) {
      showToast('Please select a group.', 'error');
      return;
    }
    setAssigning(true);
    try {
      const { error } = await supabase.from('group_members').insert([{ user_id: selectedUserId, group_id: selectedGroupId }]);
      if (error) {
        if (error.code === '23505') throw new Error('User is already in this group.');
        throw error;
      }
      showToast('User added to group!', 'success');
      await loadUserGroups(selectedUserId);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAssigning(false);
    }
  };

  const removeFromGroup = async (userId, groupId) => {
    if (!confirm('Remove user from this group?')) return;
    try {
      const { error } = await supabase.from('group_members').delete().match({ user_id: userId, group_id: groupId });
      if (error) throw error;
      showToast('User removed from group.', 'success');
      await loadUserGroups(userId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <div className="text-slate-500">Loading members...</div>;

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="text-center mt-12">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
        <p className="text-slate-600">Only Admins can manage members.</p>
      </div>
    );
  }

  const filtered = allUsers.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Members</h1>

      <input
        type="text"
        placeholder="Search members..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Joined</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">No members found.</td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{u.name}</td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.role === 'Admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">{formatDate(u.created_at)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => openAssignModal(u.id, u.name)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Manage Groups
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Manage Groups</h2>
            <p className="text-sm text-slate-500 mb-6">For: <strong>{selectedUserName}</strong></p>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Current Groups:</h4>
              {userGroups.length === 0 ? (
                <p className="text-sm text-slate-400">Not in any groups.</p>
              ) : (
                <ul className="space-y-2">
                  {userGroups.map(gm => gm.groups && (
                    <li key={gm.groups.id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">{gm.groups.name}</span>
                      <button onClick={() => removeFromGroup(selectedUserId, gm.groups.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium">
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2 mb-4">
              <select
                value={selectedGroupId}
                onChange={e => setSelectedGroupId(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">Select a group...</option>
                {allGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button
                onClick={assignToGroup}
                disabled={assigning}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              >
                {assigning ? '...' : 'Add'}
              </button>
            </div>

            <button onClick={() => setModalOpen(false)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
