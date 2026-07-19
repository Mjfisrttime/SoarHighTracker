"use client";

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Navbar({ userName }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-white px-8 py-4 flex justify-between items-center shadow-sm border-b border-slate-200">
      <div className="text-lg font-bold text-slate-800 lg:hidden">
        SoarHigh Tracker
      </div>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-6">
        <span className="font-medium text-slate-700">{userName || 'Loading...'}</span>
        <button
          onClick={handleLogout}
          className="bg-transparent border border-slate-300 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
