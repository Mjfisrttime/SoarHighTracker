"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, showToast } from '@/lib/utils';

export default function GroupsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin state
  const [allGroups, setAllGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Member state
  const [memberGroups, setMemberGroups] = useState([]);

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
      await loadGroups();
    } else {
      await loadMemberGroups(user.id);
    }
    setLoading(false);
  };

  const loadGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, description, created_at, group_members(count), users!groups_created_by_fkey(name)')
      .order('created_at', { ascending: false });
    if (!error && data) setAllGroups(data);
  };

  const loadMemberGroups = async (userId) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('groups(id, name, description, created_at, users!groups_created_by_fkey(name))')
      .eq('user_id', userId);
    if (!error && data) {
      setMemberGroups(data.map(gm => gm.groups).filter(Boolean));
    }
  };

  const openModal = (group = null) => {
    if (group) {
      setEditId(group.id);
      setGroupName(group.name);
      setGroupDesc(group.description || '');
    } else {
      setEditId('');
      setGroupName('');
      setGroupDesc('');
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        const { error } = await supabase.from('groups').update({ name: groupName, description: groupDesc }).eq('id', editId);
        if (error) throw error;
        showToast('Group updated', 'success');
      } else {
        const { error } = await supabase.from('groups').insert([{ name: groupName, description: groupDesc, created_by: currentUser.id }]);
        if (error) throw error;
        showToast('Group created', 'success');
      }
      setModalOpen(false);
      await loadGroups();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (id) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      const { error } = await supabase.from('groups').delete().eq('id', id);
      if (error) throw error;
      showToast('Group deleted', 'success');
      await loadGroups();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <div className="text-slate-500">Loading groups...</div>;

  const filtered = allGroups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // MEMBER VIEW
  if (currentUser?.role !== 'Admin') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-800">My Groups</h1>
        {memberGroups.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
            You are not assigned to any groups yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberGroups.map(g => (
              <div key={g.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-2">{g.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{g.description || 'No description.'}</p>
                <p className="text-xs text-slate-400">Created by {g.users?.name || 'Unknown'} on {formatDate(g.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ADMIN VIEW
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Groups</h1>
        <button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-colors">
          + Create Group
        </button>
      </div>

      <input
        type="text"
        placeholder="Search groups..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">No groups found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(g => (
            <div key={g.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{g.name}</h3>
              <p className="text-sm text-slate-600 mb-3 flex-1">{g.description || 'No description.'}</p>
              <div className="text-xs text-slate-400 mb-4">
                <span>Members: {g.group_members?.[0]?.count || 0}</span>
                <span className="mx-2">•</span>
                <span>Created by {g.users?.name || 'Unknown'} on {formatDate(g.created_at)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(g)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  Edit
                </button>
                <button onClick={() => deleteGroup(g.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editId ? 'Edit Group' : 'Create Group'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
                <input type="text" required value={groupName} onChange={e => setGroupName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea rows="3" value={groupDesc} onChange={e => setGroupDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
