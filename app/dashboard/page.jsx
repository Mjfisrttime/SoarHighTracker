"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return Math.floor(seconds) + 's ago';
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' min ago';
  return 'just now';
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const currentUser = { ...session.user, ...profile };
    setUser(currentUser);

    const todayDate = new Date().toISOString().split('T')[0];

    if (currentUser.role === 'Admin') {
      const [groups, members, attendance, tasks] = await Promise.all([
        supabase.from('groups').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', todayDate),
        supabase.from('task_logs').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        groups: groups.count || 0,
        members: members.count || 0,
        attendance: attendance.count || 0,
        tasks: tasks.count || 0,
      });
    } else {
      const [myGroups, myAttendance, myTasks] = await Promise.all([
        supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id),
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id),
        supabase.from('task_logs').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id),
      ]);
      setStats({
        myGroups: myGroups.count || 0,
        myAttendance: myAttendance.count || 0,
        myTasks: myTasks.count || 0,
      });
    }

    await loadActivityFeed(currentUser);
    setLoading(false);
  };

  const loadActivityFeed = async (currentUser) => {
    const allActivities = [];
    const isAdmin = currentUser.role === 'Admin';

    let tasksQuery = supabase
      .from('task_logs')
      .select('title, logged_at, users(name)')
      .order('logged_at', { ascending: false })
      .limit(10);
      
    if (!isAdmin) tasksQuery = tasksQuery.eq('user_id', currentUser.id);

    const { data: tasks } = await tasksQuery;
    if (tasks) {
      tasks.forEach(t => allActivities.push({
        type: 'Task',
        text: isAdmin ? `${t.users?.name || 'Unknown'} submitted a task: "${t.title}"` : `You submitted a task: "${t.title}"`,
        date: new Date(t.logged_at),
      }));
    }

    let attQuery = supabase
      .from('attendance')
      .select('status, date, users(name)')
      .order('date', { ascending: false })
      .limit(10);
      
    if (!isAdmin) attQuery = attQuery.eq('user_id', currentUser.id);

    const { data: att } = await attQuery;
    if (att) {
      att.forEach(a => allActivities.push({
        type: 'Attendance',
        text: isAdmin ? `${a.users?.name || 'Unknown'} was marked ${a.status}` : `You were marked ${a.status}`,
        date: new Date(a.date + 'T12:00:00Z'),
      }));
    }

    if (isAdmin) {
      const { data: grps } = await supabase
        .from('groups')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (grps) {
        grps.forEach(g => allActivities.push({
          type: 'Group',
          text: `New group created: "${g.name}"`,
          date: new Date(g.created_at),
        }));
      }

      const { data: gm } = await supabase
        .from('group_members')
        .select('assigned_at, users(name), groups(name)')
        .order('assigned_at', { ascending: false })
        .limit(10);
      if (gm) {
        gm.forEach(m => allActivities.push({
          type: 'Users',
          text: `${m.users?.name || 'A user'} was added to "${m.groups?.name || 'a group'}"`,
          date: new Date(m.assigned_at),
        }));
      }
    }

    allActivities.sort((a, b) => b.date - a.date);
    setActivities(allActivities.slice(0, 10));
  };

  if (loading) return <div className="text-slate-500">Loading dashboard...</div>;

  const badgeColor = {
    Task: 'bg-blue-100 text-blue-700',
    Attendance: 'bg-green-100 text-green-700',
    Group: 'bg-purple-100 text-purple-700',
    Users: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'Admin' ? (
          <>
            <StatCard label="Total Groups" value={stats.groups} color="bg-indigo-500" />
            <StatCard label="Total Members" value={stats.members} color="bg-emerald-500" />
            <StatCard label="Attendance Today" value={stats.attendance} color="bg-amber-500" />
            <StatCard label="Task Logs" value={stats.tasks} color="bg-rose-500" />
          </>
        ) : (
          <>
            <StatCard label="My Groups" value={stats.myGroups} color="bg-indigo-500" />
            <StatCard label="My Attendance" value={stats.myAttendance} color="bg-emerald-500" />
            <StatCard label="My Task Logs" value={stats.myTasks} color="bg-amber-500" />
          </>
        )}
      </div>

      {/* Quick Actions */}
      {user?.role === 'Admin' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/dashboard/groups" className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-3 px-4 rounded-xl text-center transition-colors shadow-sm border border-indigo-100">Create Group</Link>
          <Link href="/dashboard/members" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-3 px-4 rounded-xl text-center transition-colors shadow-sm border border-emerald-100">Manage Members</Link>
          <Link href="/dashboard/attendance" className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold py-3 px-4 rounded-xl text-center transition-colors shadow-sm border border-amber-100">Record Attendance</Link>
          <Link href="/dashboard/reports" className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-3 px-4 rounded-xl text-center transition-colors shadow-sm border border-rose-100">View Reports</Link>
        </div>
      )}

      {/* Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No recent activity.</div>
          ) : (
            activities.map((act, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${badgeColor[act.type] || 'bg-slate-100 text-slate-600'}`}>
                  {act.type.charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{act.text}</p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(act.date)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
        {value}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
