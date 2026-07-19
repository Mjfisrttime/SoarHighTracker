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
  const [sessionData, setSessionData] = useState(null); // { id, status, date }
  const [processing, setProcessing] = useState(false);

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

  const loadAttendanceData = async (groupId, date) => {
    if (!groupId || !date) { 
      setMembers([]); 
      setSessionData(null);
      return; 
    }

    // 1. Check for session
    const { data: sessionInfo } = await supabase
      .from('attendance_sessions')
      .select('id, status, date')
      .eq('group_id', groupId)
      .eq('date', date)
      .maybeSingle();

    // 2. Load group members
    const { data: memberData } = await supabase
      .from('group_members')
      .select('user_id, users(name)')
      .eq('group_id', groupId);
      
    if (!memberData || memberData.length === 0) { 
      setMembers([]);
      setSessionData(sessionInfo || null);
      return; 
    }

    const userIds = memberData.map(m => m.user_id);
    
    // 3. Load actual attendance records
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
      newStatusMap[m.user_id] = existingMap[m.user_id] || 'Pending';
    });

    // 4. Lazy Auto-Close Logic
    // If we loaded a past session that is still 'open', we automatically close it
    // and mark all pending members as Absent.
    const today = new Date().toISOString().split('T')[0];
    if (sessionInfo && sessionInfo.status === 'open' && sessionInfo.date < today) {
      // Update session status in DB
      await supabase.from('attendance_sessions').update({ status: 'closed' }).eq('id', sessionInfo.id);
      
      const absentRecords = memberData
        .filter(m => newStatusMap[m.user_id] === 'Pending')
        .map(m => ({
          group_id: groupId,
          user_id: m.user_id,
          date: sessionInfo.date,
          status: 'Absent'
        }));

      // Insert absents
      if (absentRecords.length > 0) {
        await supabase.from('attendance').upsert(absentRecords, { onConflict: 'user_id, group_id, date' });
        
        // Update local map
        absentRecords.forEach(r => newStatusMap[r.user_id] = 'Absent');
      }
      
      // Update local session state
      sessionInfo.status = 'closed';
    }

    setSessionData(sessionInfo || null);
    setMembers(memberData);
    setStatusMap(newStatusMap);
  };

  const handleGroupChange = (groupId) => {
    setSelectedGroup(groupId);
    loadAttendanceData(groupId, selectedDate);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    loadAttendanceData(selectedGroup, date);
  };

  const openSession = async () => {
    if (!selectedGroup || !selectedDate) return;
    const today = new Date().toISOString().split('T')[0];
    
    if (selectedDate !== today) {
      showToast('You can only open check-in sessions for Today.', 'error');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.from('attendance_sessions').insert([{
        group_id: selectedGroup,
        date: selectedDate,
        status: 'open'
      }]);
      if (error) throw error;
      showToast('Session opened! It will auto-close at midnight.', 'success');
      await loadAttendanceData(selectedGroup, selectedDate);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const overrideStatus = async (userId, currentStatus) => {
    if (!selectedGroup || !selectedDate) return;
    
    // Cycle status: Pending -> Present -> Absent -> Late -> Present
    let newStatus = 'Present';
    if (currentStatus === 'Present') newStatus = 'Absent';
    else if (currentStatus === 'Absent') newStatus = 'Late';

    try {
      const { error } = await supabase.from('attendance').upsert([{
        group_id: selectedGroup,
        user_id: userId,
        date: selectedDate,
        status: newStatus
      }], { onConflict: 'user_id, group_id, date' });
      
      if (error) throw error;
      setStatusMap(prev => ({ ...prev, [userId]: newStatus }));
      showToast('Status updated manually', 'success');
    } catch (err) {
      showToast(err.message, 'error');
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
        <h1 className="text-3xl font-bold text-slate-800">My Attendance History</h1>
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

  const today = new Date().toISOString().split('T')[0];
  const canOpenSession = selectedDate === today && !sessionData;

  // ADMIN VIEW
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Manage Attendance</h1>

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
          <input type="date" value={selectedDate} max={today}
            onChange={e => handleDateChange(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {selectedGroup && selectedDate && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">Session Status:</span>
              {!sessionData ? (
                <span className="text-slate-500 font-medium">Not Started</span>
              ) : sessionData.status === 'open' ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  OPEN (Closes at Midnight)
                </span>
              ) : (
                <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-bold">CLOSED</span>
              )}
            </div>
            
            <div>
              {canOpenSession && (
                <button onClick={openSession} disabled={processing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {processing ? '...' : 'Open Check-In Session'}
                </button>
              )}
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                <th className="p-4 font-semibold">Member</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {members.length === 0 ? (
                <tr><td colSpan="2" className="p-4 text-center text-slate-500">No members found in this group.</td></tr>
              ) : (
                members.map(m => {
                  const status = statusMap[m.user_id];
                  return (
                    <tr key={m.user_id} className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-800">{m.users?.name || 'Unknown'}</td>
                      <td className="p-4">
                        <button 
                          onClick={() => overrideStatus(m.user_id, status)}
                          title="Click to manually override status"
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                            status === 'Present' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                            status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                            status === 'Late' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' :
                            'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}>
                          {status === 'Pending' ? '⏳ Pending' : 
                           status === 'Present' ? '✅ Present' : 
                           status === 'Absent' ? '❌ Absent' : '⚠️ Late'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          <div className="p-3 bg-slate-50 text-xs text-slate-500 text-center border-t border-slate-200">
            Click a member's status badge to manually override it.
          </div>
        </div>
      )}
    </div>
  );
}
