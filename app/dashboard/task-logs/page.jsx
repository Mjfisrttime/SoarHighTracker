"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, showToast } from '@/lib/utils';

export default function TaskLogsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin state
  const [adminGroups, setAdminGroups] = useState([]);
  const [allAdminTasks, setAllAdminTasks] = useState([]);
  const [filterGroup, setFilterGroup] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Member state
  const [memberGroups, setMemberGroups] = useState([]);
  const [memberTasks, setMemberTasks] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    group_id: '',
    hours_spent: '',
    description: '',
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
    const user = { ...session.user, ...profile };
    setCurrentUser(user);

    if (user.role === 'Admin') {
      await Promise.all([fetchAdminGroups(), fetchAllAdminTasks()]);
    } else {
      await Promise.all([fetchMemberGroups(user.id), fetchMemberTasks(user.id)]);
    }
    setLoading(false);
  };

  // Admin
  const fetchAdminGroups = async () => {
    const { data } = await supabase.from('groups').select('id, name').order('name');
    if (data) setAdminGroups(data);
  };

  const fetchAllAdminTasks = async () => {
    const { data } = await supabase
      .from('task_logs')
      .select('title, date, task_description, logged_at, group_id, hours_spent, users(name), groups(name)')
      .order('logged_at', { ascending: false });
    if (data) setAllAdminTasks(data);
  };

  // Member
  const fetchMemberGroups = async (userId) => {
    const { data } = await supabase.from('group_members').select('groups(id, name)').eq('user_id', userId);
    if (data) setMemberGroups(data.map(gm => gm.groups).filter(Boolean));
  };

  const fetchMemberTasks = async (userId) => {
    const { data } = await supabase
      .from('task_logs')
      .select('title, date, task_description, logged_at, hours_spent, groups(name)')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });
    if (data) setMemberTasks(data);
  };

  const submitTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('task_logs').insert([{
        user_id: currentUser.id,
        title: formData.title.trim(),
        date: formData.date,
        group_id: formData.group_id || null,
        hours_spent: formData.hours_spent.trim(),
        task_description: formData.description.trim() || 'No description provided.',
      }]);
      if (error) throw error;
      showToast('Task submitted!', 'success');
      setFormData({ title: '', date: new Date().toISOString().split('T')[0], group_id: '', hours_spent: '', description: '' });
      await fetchMemberTasks(currentUser.id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading task logs...</div>;

  const filteredTasks = allAdminTasks.filter(t => {
    if (filterGroup && t.group_id !== filterGroup) return false;
    if (filterDate && t.date !== filterDate) return false;
    return true;
  });

  // ADMIN VIEW
  if (currentUser?.role === 'Admin') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-800">Task Logs</h1>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Group:</label>
            <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Groups</option>
              {adminGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Date:</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={() => { setFilterGroup(''); setFilterDate(''); }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium transition-colors border border-slate-300">
            Clear
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Member</th>
                <th className="p-4 font-semibold">Group</th>
                <th className="p-4 font-semibold">Task</th>
                <th className="p-4 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTasks.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">No tasks match the selected filters.</td></tr>
              ) : (
                filteredTasks.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-600 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="p-4 font-medium text-slate-800">{t.users?.name || 'Unknown'}</td>
                    <td className="p-4">{t.groups?.name || '-'}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{t.title}</div>
                      <div className="text-xs text-slate-500 mt-1">Time: {t.hours_spent}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{t.task_description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // MEMBER VIEW
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Task Logs</h1>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Form */}
        <div className="w-full lg:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Submit New Task</h2>
          <form onSubmit={submitTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input type="text" required minLength="3" value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input type="date" required max={new Date().toISOString().split('T')[0]} value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Group (Optional)</label>
              <select value={formData.group_id} onChange={e => setFormData({ ...formData, group_id: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select a group...</option>
                {memberGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time Spent *</label>
              <input type="text" required value={formData.hours_spent}
                onChange={e => setFormData({ ...formData, hours_spent: e.target.value })}
                placeholder='e.g. "2 hours"'
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea rows="3" value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Task'}
            </button>
          </form>
        </div>

        {/* Feed */}
        <div className="w-full lg:w-2/3 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 px-2">My Recent Tasks</h2>
          {memberTasks.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
              No tasks submitted yet.
            </div>
          ) : (
            memberTasks.map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                    {t.title}
                    {t.groups?.name && (
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">{t.groups.name}</span>
                    )}
                  </h4>
                </div>
                <div className="text-sm text-slate-500 mb-3 flex gap-4">
                  <span>{formatDate(t.date)}</span>
                  <span>Time: {t.hours_spent}</span>
                </div>
                <p className="text-sm text-slate-700">{t.task_description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
