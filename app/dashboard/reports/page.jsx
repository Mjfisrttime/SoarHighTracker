"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, showToast } from '@/lib/utils';

export default function ReportsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [reportType, setReportType] = useState('attendance');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

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
      const { data } = await supabase.from('groups').select('id, name').order('name');
      if (data) setGroups(data);
    }
    setLoading(false);
  };

  const generateReport = async () => {
    if (!selectedGroup) { showToast('Please select a group.', 'error'); return; }
    setGenerating(true);
    setReportData(null);
    try {
      if (reportType === 'attendance') await genAttendance();
      else await genTasks();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const genAttendance = async () => {
    const { data: members, error: memErr } = await supabase
      .from('group_members').select('users(id, name)').eq('group_id', selectedGroup);
    if (memErr) throw memErr;
    if (!members?.length) { setReportData({ type: 'empty', message: 'No members in this group.' }); return; }

    const userIds = members.map(m => m.users.id);
    let query = supabase.from('attendance').select('user_id, date, status').in('user_id', userIds).order('date', { ascending: true });
    if (selectedMonth) {
      const start = `${selectedMonth}-01`;
      const [y, m] = selectedMonth.split('-');
      const end = new Date(parseInt(y), parseInt(m), 1).toISOString().split('T')[0];
      query = query.gte('date', start).lt('date', end);
    }
    const { data: records, error: attErr } = await query;
    if (attErr) throw attErr;
    if (!records?.length) { setReportData({ type: 'empty', message: 'No attendance data found.' }); return; }

    const dateSet = new Set();
    records.forEach(r => dateSet.add(r.date));
    const dates = Array.from(dateSet).sort();

    const userMap = {};
    members.forEach(m => {
      if (m.users) userMap[m.users.id] = { name: m.users.name, statuses: {}, stats: { Present: 0, Absent: 0, Late: 0 } };
    });
    records.forEach(r => {
      if (userMap[r.user_id]) {
        userMap[r.user_id].statuses[r.date] = r.status;
        if (userMap[r.user_id].stats[r.status] !== undefined) userMap[r.user_id].stats[r.status]++;
      }
    });
    setReportData({ type: 'attendance', dates, rows: Object.values(userMap).sort((a, b) => a.name.localeCompare(b.name)) });
  };

  const genTasks = async () => {
    let query = supabase.from('task_logs').select('title, date, task_description, hours_spent, users(name)')
      .eq('group_id', selectedGroup).order('date', { ascending: false });
    if (selectedMonth) {
      const start = `${selectedMonth}-01`;
      const [y, m] = selectedMonth.split('-');
      const end = new Date(parseInt(y), parseInt(m), 1).toISOString().split('T')[0];
      query = query.gte('date', start).lt('date', end);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) { setReportData({ type: 'empty', message: 'No tasks found.' }); return; }
    setReportData({ type: 'tasks', tasks: data });
  };

  if (loading) return <div className="text-slate-500">Loading reports...</div>;
  if (currentUser?.role !== 'Admin') {
    return <div className="text-center mt-12"><h2 className="text-2xl font-bold text-red-600">Access Denied</h2><p className="text-slate-600 mt-2">Only Admins can view reports.</p></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Reports</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Report Type:</label>
          <select value={reportType} onChange={e => setReportType(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="attendance">Attendance Grid</option>
            <option value="tasks">Task Logs List</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Group (Required):</label>
          <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select a Group...</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Month (Optional):</label>
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={generateReport} disabled={generating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[200px]">
        {!reportData && !generating && (
          <div className="p-12 text-center text-slate-400">Select a report type and group, then click Generate.</div>
        )}
        {generating && <div className="p-12 text-center text-slate-500">Loading report data...</div>}
        {reportData?.type === 'empty' && <div className="p-12 text-center text-slate-500">{reportData.message}</div>}

        {reportData?.type === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                  <th className="p-4 font-semibold sticky left-0 bg-slate-50">Member</th>
                  {reportData.dates.map(d => <th key={d} className="p-4 font-semibold whitespace-nowrap">{formatDate(d)}</th>)}
                  <th className="p-4 font-semibold text-center">Present</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800 sticky left-0 bg-white">{row.name}</td>
                    {reportData.dates.map(d => {
                      const s = row.statuses[d] || '-';
                      const cls = s === 'Present' ? 'text-green-600 font-bold' : s === 'Absent' ? 'text-red-600 font-bold' : s === 'Late' ? 'text-yellow-600 font-bold' : 'text-slate-400';
                      return <td key={d} className={`p-4 text-center ${cls}`}>{s === '-' ? '-' : s.charAt(0)}</td>;
                    })}
                    <td className="p-4 text-center font-medium">{row.stats.Present} / {reportData.dates.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportData?.type === 'tasks' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Member</th>
                  <th className="p-4 font-semibold">Task</th>
                  <th className="p-4 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData.tasks.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-600 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="p-4 font-medium text-slate-800">{t.users?.name || 'Unknown'}</td>
                    <td className="p-4"><div className="font-semibold">{t.title}</div><div className="text-sm text-slate-500 mt-1">{t.task_description}</div></td>
                    <td className="p-4 text-slate-600">{t.hours_spent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
