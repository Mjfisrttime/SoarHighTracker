"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ role }) {
  const pathname = usePathname();

  const adminLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/groups', label: 'Groups', icon: '👥' },
    { href: '/dashboard/members', label: 'Members', icon: '👤' },
    { href: '/dashboard/attendance', label: 'Attendance', icon: '✅' },
    { href: '/dashboard/task-logs', label: 'Task Logs', icon: '📝' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📈' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
    { href: '/dashboard/profile', label: 'Profile', icon: '🔑' },
  ];

  const memberLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/groups', label: 'My Groups', icon: '👥' },
    { href: '/dashboard/attendance', label: 'Attendance', icon: '✅' },
    { href: '/dashboard/task-logs', label: 'Task Logs', icon: '📝' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
    { href: '/dashboard/profile', label: 'Profile', icon: '🔑' },
  ];

  const links = role === 'Admin' ? adminLinks : memberLinks;

  return (
    <aside className="w-64 bg-slate-800 text-slate-100 flex flex-col h-screen sticky top-0 shadow-lg shrink-0">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold tracking-wide text-white">SoarHigh Tracker</h2>
      </div>
      <ul className="flex-1 py-4 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href} className="mb-1 px-3">
              <Link
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
