"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, showToast } from '@/lib/utils';

// Time Tracking Helpers
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  let h = 0, m = 0, s = 0;
  const hMatch = timeStr.match(/(\d+)h/);
  const mMatch = timeStr.match(/(\d+)m/);
  const sMatch = timeStr.match(/(\d+)s/);
  
  if (hMatch) h = parseInt(hMatch[1], 10);
  if (mMatch) m = parseInt(mMatch[1], 10);
  if (sMatch) s = parseInt(sMatch[1], 10);
  
  return (h * 3600) + (m * 60) + s;
}

function formatSecondsToTime(totalSeconds) {
  if (!totalSeconds) return "0h 0m 0s";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  return `${h}h ${m}m ${s}s`;
}

export default function TaskLogsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin state
  const [adminGroups, setAdminGroups] = useState([]);
  const [adminMembers, setAdminMembers] = useState([]);
  const [allAdminTasks, setAllAdminTasks] = useState([]);
  
  // Admin filters
  const [filterGroup, setFilterGroup] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMember, setFilterMember] = useState('');

  // Member state
  const [memberGroups, setMemberGroups] = useState([]);
  const [memberTasks, setMemberTasks] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    group_id: '',
    hours: '',
    minutes: '',
    seconds: '',
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
      await Promise.all([fetchAdminGroups(), fetchAdminMembers(), fetchAllAdminTasks()]);
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
  
  const fetchAdminMembers = async () => {
    const { data } = await supabase.from('users').select('id, name').order('name');
    if (data) setAdminMembers(data);
  };

  const fetchAllAdminTasks = async () => {
    const { data } = await supabase
      .from('task_logs')
      .select('user_id, title, date, task_description, logged_at, group_id, hours_spent, users(name), groups(name)')
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
    const h = parseInt(formData.hours || '0', 10);
    const m = parseInt(formData.minutes || '0', 10);
    const s = parseInt(formData.seconds || '0', 10);
    
    if (h === 0 && m === 0 && s === 0) {
      showToast('Please enter the time spent on this task.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formattedTime = `${h}h ${m}m ${s}s`;
      const { error } = await supabase.from('task_logs').insert([{
        user_id: currentUser.id,
        title: formData.title.trim(),
        date: formData.date,
        group_id: formData.group_id || null,
        hours_spent: formattedTime,
        task_description: formData.description.trim() || 'No description provided.',
      }]);
      if (error) throw error;
      showToast('Task submitted!', 'success');
      setFormData({ title: '', date: new Date().toISOString().split('T')[0], group_id: '', hours: '', minutes: '', seconds: '', description: '' });
      await fetchMemberTasks(currentUser.id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading task logs...</div>;

  // Filter Logic (Admin)
  const filteredTasks = allAdminTasks.filter(t => {
    if (filterGroup && t.group_id !== filterGroup) return false;
    if (filterDate && t.date !== filterDate) return false;
    if (filterMember && t.user_id !== filterMember) return false;
    return true;
  });

  // Calculate Summaries (Admin)
  let totalSeconds = 0;
  const uniqueMembers = new Set();
  
  filteredTasks.forEach(t => {
    totalSeconds += parseTimeToSeconds(t.hours_spent);
    uniqueMembers.add(t.user_id);
  });

  // ADMIN VIEW
  if (currentUser?.role === 'Admin') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-800">Task Logbook</h1>
        
        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Group:</label>
            <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Groups</option>
              {adminGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Member:</label>
            <select value={filterMember} onChange={e => setFilterMember(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Members</option>
              {adminMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Date:</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={() => { setFilterGroup(''); setFilterMember(''); setFilterDate(''); }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium transition-colors border border-slate-300">
            Clear
          </button>
        </div>

        {/* Dynamic Summary Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm p-6 text-white flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-indigo-100 uppercase tracking-wider mb-1">Total Tasks</span>
            <span className="text-4xl font-bold">{filteredTasks.length}</span>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm p-6 text-white flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-emerald-100 uppercase tracking-wider mb-1">Total Time Logged</span>
            <span className="text-3xl font-bold">{formatSecondsToTime(totalSeconds)}</span>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-purple-100 uppercase tracking-wider mb-1">Active Members</span>
            <span className="text-4xl font-bold">{uniqueMembers.size}</span>
          </div>
        </div>

        {/* Logbook Table */}
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
                      <div className="text-xs text-slate-500 mt-1">Time: <span className="font-medium">{t.hours_spent}</span></div>
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
      <h1 className="text-3xl font-bold text-slate-800">Task Tracker</h1>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Time Spent *</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                    <input type="number" min="0" placeholder="0" value={formData.hours}
                      onChange={e => setFormData({ ...formData, hours: e.target.value })}
                      className="w-full p-2 outline-none text-center" />
                    <span className="bg-slate-50 text-slate-500 text-xs px-2 py-3 font-medium border-l border-slate-200">h</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                    <input type="number" min="0" max="59" placeholder="0" value={formData.minutes}
                      onChange={e => setFormData({ ...formData, minutes: e.target.value })}
                      className="w-full p-2 outline-none text-center" />
                    <span className="bg-slate-50 text-slate-500 text-xs px-2 py-3 font-medium border-l border-slate-200">m</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                    <input type="number" min="0" max="59" placeholder="0" value={formData.seconds}
                      onChange={e => setFormData({ ...formData, seconds: e.target.value })}
                      className="w-full p-2 outline-none text-center" />
                    <span className="bg-slate-50 text-slate-500 text-xs px-2 py-3 font-medium border-l border-slate-200">s</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea rows="3" value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-2">
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
                  <span className="font-semibold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded">Time: {t.hours_spent}</span>
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
