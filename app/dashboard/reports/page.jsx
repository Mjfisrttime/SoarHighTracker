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
      else await genPerformance();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const genAttendance = async () => {
    // 1. Get members
    const { data: members, error: memErr } = await supabase
      .from('group_members').select('users(id, name)').eq('group_id', selectedGroup);
    if (memErr) throw memErr;
    if (!members?.length) { setReportData({ type: 'empty', message: 'No members in this group.' }); return; }

    // 2. Get attendance sessions for the group
    let sessionQuery = supabase.from('attendance_sessions')
      .select('date')
      .eq('group_id', selectedGroup)
      .order('date', { ascending: true });
      
    if (selectedMonth) {
      const start = `${selectedMonth}-01`;
      const [y, m] = selectedMonth.split('-');
      const end = new Date(parseInt(y), parseInt(m), 1).toISOString().split('T')[0];
      sessionQuery = sessionQuery.gte('date', start).lt('date', end);
    }
    
    const { data: sessions, error: sessErr } = await sessionQuery;
    if (sessErr) throw sessErr;
    if (!sessions?.length) { setReportData({ type: 'empty', message: 'No attendance sessions found for this period.' }); return; }
    
    const dates = sessions.map(s => s.date);
    const userIds = members.map(m => m.users.id);

    // 3. Get explicit attendance records
    let query = supabase.from('attendance')
      .select('user_id, date, status')
      .eq('group_id', selectedGroup)
      .in('user_id', userIds)
      .in('date', dates);
      
    const { data: records, error: attErr } = await query;
    if (attErr) throw attErr;

    // 4. Build Report
    const userMap = {};
    members.forEach(m => {
      if (m.users) userMap[m.users.id] = { name: m.users.name, statuses: {}, stats: { Present: 0, Absent: 0, Late: 0 } };
    });

    if (records) {
      records.forEach(r => {
        if (userMap[r.user_id]) {
          userMap[r.user_id].statuses[r.date] = r.status;
        }
      });
    }

    // Calculate missing days as "Absent" and tally stats
    Object.values(userMap).forEach(user => {
      dates.forEach(d => {
        if (!user.statuses[d]) {
          user.statuses[d] = 'Absent'; // Lazy close logic
        }
        user.stats[user.statuses[d]]++;
      });
      const totalSessions = dates.length;
      user.stats.percent = totalSessions > 0 ? Math.round(((user.stats.Present + user.stats.Late) / totalSessions) * 100) : 0;
    });

    setReportData({ 
      type: 'attendance', 
      dates, 
      rows: Object.values(userMap).sort((a, b) => a.name.localeCompare(b.name)) 
    });
  };

  const genPerformance = async () => {
    // 1. Get members
    const { data: members, error: memErr } = await supabase
      .from('group_members').select('users(id, name)').eq('group_id', selectedGroup);
    if (memErr) throw memErr;
    if (!members?.length) { setReportData({ type: 'empty', message: 'No members in this group.' }); return; }

    const userIds = members.map(m => m.users.id);
    const userMap = {};
    members.forEach(m => {
      if (m.users) userMap[m.users.id] = { name: m.users.name, totalTasks: 0, totalSeconds: 0 };
    });

    // 2. Get Tasks
    let query = supabase.from('task_logs')
      .select('user_id, hours_spent')
      .eq('group_id', selectedGroup)
      .in('user_id', userIds);
      
    if (selectedMonth) {
      const start = `${selectedMonth}-01`;
      const [y, m] = selectedMonth.split('-');
      const end = new Date(parseInt(y), parseInt(m), 1).toISOString().split('T')[0];
      query = query.gte('date', start).lt('date', end);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    if (data && data.length > 0) {
      data.forEach(t => {
        if (userMap[t.user_id]) {
          userMap[t.user_id].totalTasks++;
          userMap[t.user_id].totalSeconds += parseTimeToSeconds(t.hours_spent);
        }
      });
    }

    setReportData({ 
      type: 'performance', 
      rows: Object.values(userMap).sort((a, b) => a.name.localeCompare(b.name)),
      hasData: data && data.length > 0
    });
  };

  if (loading) return <div className="text-slate-500">Loading reports...</div>;
  if (currentUser?.role !== 'Admin') {
    return <div className="text-center mt-12"><h2 className="text-2xl font-bold text-red-600">Access Denied</h2><p className="text-slate-600 mt-2">Only Admins can view reports.</p></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Analytics & Reports</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Report Type:</label>
          <select value={reportType} onChange={e => setReportType(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="attendance">Attendance Summary</option>
            <option value="performance">Member Performance (Tasks)</option>
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
                  <th className="p-4 font-semibold sticky left-0 bg-slate-50 border-r border-slate-200 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Member</th>
                  {reportData.dates.map(d => <th key={d} className="p-4 font-semibold whitespace-nowrap">{formatDate(d)}</th>)}
                  <th className="p-4 font-bold text-slate-800 bg-indigo-50 border-l border-indigo-100 text-center">Present</th>
                  <th className="p-4 font-bold text-slate-800 bg-indigo-50 text-center">Absent</th>
                  <th className="p-4 font-bold text-slate-800 bg-indigo-50 text-center">Late</th>
                  <th className="p-4 font-bold text-slate-800 bg-indigo-50 text-center">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{row.name}</td>
                    {reportData.dates.map(d => {
                      const s = row.statuses[d];
                      const cls = s === 'Present' ? 'text-green-600 font-bold bg-green-50/30' : s === 'Absent' ? 'text-red-600 font-bold bg-red-50/30' : s === 'Late' ? 'text-yellow-600 font-bold bg-yellow-50/30' : 'text-slate-400';
                      return <td key={d} className={`p-4 text-center ${cls}`}>{s === '-' ? '-' : s.charAt(0)}</td>;
                    })}
                    <td className="p-4 text-center font-bold text-green-700 bg-indigo-50/30 border-l border-indigo-100">{row.stats.Present}</td>
                    <td className="p-4 text-center font-bold text-red-700 bg-indigo-50/30">{row.stats.Absent}</td>
                    <td className="p-4 text-center font-bold text-yellow-700 bg-indigo-50/30">{row.stats.Late}</td>
                    <td className="p-4 text-center font-bold text-indigo-700 bg-indigo-50/30">{row.stats.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportData?.type === 'performance' && (
          <div className="p-6">
            {!reportData.hasData && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
                No tasks were submitted during this period, but here is the member list.
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                    <th className="p-4 font-semibold">Member</th>
                    <th className="p-4 font-semibold text-center">Total Tasks Completed</th>
                    <th className="p-4 font-semibold text-center">Total Time Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportData.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{row.name}</td>
                      <td className="p-4 text-center font-medium text-slate-600">{row.totalTasks}</td>
                      <td className="p-4 text-center font-bold text-indigo-600 bg-indigo-50/30 border-l border-indigo-50">{formatSecondsToTime(row.totalSeconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
