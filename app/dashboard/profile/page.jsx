"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const { data } = await supabase.from('users').select('id, email, role, created_at, name').eq('id', session.user.id).single();
    if (data) { setProfile(data); setName(data.name || ''); }
    setLoading(false);
  };

  const updateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase.from('users').update({ name: name.trim() }).eq('id', profile.id);
      if (error) throw error;
      showToast('Name updated!', 'success');
      setProfile(prev => ({ ...prev, name: name.trim() }));
    } catch (err) {
      showToast('Failed to update name.', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showToast('Passwords do not match!', 'error'); return; }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast('Password updated!', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading profile...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
      <div className="max-w-3xl space-y-6">

        {/* Account Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Email</p>
              <p className="font-semibold text-slate-800">{profile?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Role</p>
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${profile?.role === 'Admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                {profile?.role}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Joined</p>
              <p className="font-semibold text-slate-800">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Update Name */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Update Profile</h3>
          <p className="text-slate-500 text-sm mb-6">Update your display name.</p>
          <form onSubmit={updateName} className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={savingName}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
              {savingName ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-red-500">
          <h3 className="text-xl font-bold text-red-600 mb-2">Security</h3>
          <p className="text-slate-500 text-sm mb-6">Change your account password.</p>
          <form onSubmit={updatePassword} className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input type="password" required minLength="6" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <input type="password" required minLength="6" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <button type="submit" disabled={savingPassword}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
