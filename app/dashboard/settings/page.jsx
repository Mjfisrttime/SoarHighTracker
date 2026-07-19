"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Settings</h1>

      <div className="max-w-2xl space-y-6">

        {/* Account Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Account</h3>
          <p className="text-slate-500 text-sm mb-6">Manage your profile and security credentials.</p>
          <Link href="/dashboard/profile"
            className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium transition-colors border border-slate-300">
            Go to Profile Settings
          </Link>
        </div>

        {/* System & Logout */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-red-500">
          <h3 className="text-xl font-bold text-red-600 mb-2">System</h3>
          <div className="flex items-center justify-between py-4 mb-4 border-b border-slate-100">
            <span className="font-medium text-slate-700">App Version</span>
            <span className="text-slate-500 text-sm">v1.0.0-NextJS</span>
          </div>
          <button onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors">
            Sign Out of Application
          </button>
        </div>
      </div>
    </div>
  );
}
