"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, showToast } from '@/lib/utils';

export default function AttendancePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin state
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [members, setMembers] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Member state
  const [myRecords, setMyRecords] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0 });

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
      await loadAdminGroups();
    } else {
      await loadMemberAttendance(user.id);
    }
    setLoading(false);
  };

  // === ADMIN ===
  const loadAdminGroups = async () => {
    const { data } = await supabase.from('groups').select('id, name').order('name');
    if (data) setGroups(data);
  };

  const loadMembersForAttendance = async (groupId, date) => {
    if (!groupId || !date) { setMembers([]); return; }

    const { data: memberData, error } = await supabase
      .from('group_members')
      .select('user_id, users(name)')
      .eq('group_id', groupId);
    if (error || !memberData || memberData.length === 0) { setMembers([]); return; }

    const userIds = memberData.map(m => m.user_id);
    const { data: existing } = await supabase
      .from('attendance')
      .select('user_id, status')
      .eq('group_id', groupId)
      .eq('date', date)
      .in('user_id', userIds);

    const existingMap = {};
    if (existing) existing.forEach(r => existingMap[r.user_id] = r.status);

    const newStatusMap = {};
    memberData.forEach(m => {
      newStatusMap[m.user_id] = existingMap[m.user_id] || 'Present';
    });

    setMembers(memberData);
    setStatusMap(newStatusMap);
  };

  const handleGroupChange = (groupId) => {
    setSelectedGroup(groupId);
    loadMembersForAttendance(groupId, selectedDate);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    loadMembersForAttendance(selectedGroup, date);
  };

  const setMemberStatus = (userId, status) => {
    setStatusMap(prev => ({ ...prev, [userId]: status }));
  };

  const saveAttendance = async () => {
    if (!selectedGroup || !selectedDate || members.length === 0) {
      showToast('Nothing to save.', 'error');
      return;
    }
    // JS-level future date validation
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate > today) {
      showToast('Cannot record attendance for a future date.', 'error');
      return;
    }
    setSavingAttendance(true);
    try {
      const records = members.map(m => ({
        group_id: selectedGroup,
        user_id: m.user_id,
        date: selectedDate,
        status: statusMap[m.user_id] || 'Present',
      }));
      const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'user_id, group_id, date' });
      if (error) throw error;
      showToast('Attendance saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  // === MEMBER ===
  const loadMemberAttendance = async (userId) => {
    const { data } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (data) {
      setMyRecords(data);
      let p = 0, a = 0, l = 0;
      data.forEach(r => {
        if (r.status === 'Present') p++;
        if (r.status === 'Absent') a++;
        if (r.status === 'Late') l++;
      });
      setStats({ present: p, absent: a, late: l });
    }
  };

  if (loading) return <div className="text-slate-500">Loading attendance...</div>;

  // MEMBER VIEW
  if (currentUser?.role !== 'Admin') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-800">My Attendance</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            <p className="text-sm text-green-700">Present</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-sm text-red-700">Absent</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            <p className="text-sm text-yellow-700">Late</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {myRecords.length === 0 ? (
                <tr><td colSpan="2" className="p-4 text-center text-slate-500">No records found.</td></tr>
              ) : (
                myRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-700">{formatDate(r.date)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        r.status === 'Present' ? 'bg-green-100 text-green-700' :
                        r.status === 'Absent' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ADMIN VIEW
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Attendance</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Group:</label>
          <select value={selectedGroup} onChange={e => handleGroupChange(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select a group...</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Date:</label>
          <input type="date" value={selectedDate} max={new Date().toISOString().split('T')[0]}
            onChange={e => handleDateChange(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <button onClick={saveAttendance} disabled={savingAttendance}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
            {savingAttendance ? 'Saving...' : 'Save Records'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
              <th className="p-4 font-semibold">Member</th>
              <th className="p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {members.length === 0 ? (
              <tr><td colSpan="2" className="p-4 text-center text-slate-500">Select a group and date to view members.</td></tr>
            ) : (
              members.map(m => (
                <tr key={m.user_id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{m.users?.name || 'Unknown'}</td>
                  <td className="p-4">
                    <div className="flex gap-4">
                      {['Present', 'Absent', 'Late'].map(status => (
                        <label key={status} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`status_${m.user_id}`}
                            value={status}
                            checked={statusMap[m.user_id] === status}
                            onChange={() => setMemberStatus(m.user_id, status)}
                            className="accent-indigo-600"
                          />
                          <span className={`text-sm font-medium ${
                            status === 'Present' ? 'text-green-600' :
                            status === 'Absent' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>{status}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
