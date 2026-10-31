'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  History,
  Video,
  Sliders,
  User,
  LogOut,
  Volume2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/conversation/active', label: 'Live Conversation', icon: MessageSquare },
  { href: '/history', label: 'History', icon: History },
  { href: '/gesture', label: 'Gesture Recognition', icon: Video },
  { href: '/settings', label: 'Settings', icon: Sliders },
  { href: '/profile', label: 'Profile', icon: User },
];

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAppStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside
      aria-label="Application Sidebar"
      className="hidden md:flex flex-col w-64 lg:w-72 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md high-contrast:bg-black high-contrast:border-yellow-400 p-5 shrink-0 min-h-[calc(100vh-5rem)] justify-between"
    >
      <div className="space-y-6">
        {/* Navigation Section */}
        <nav className="space-y-1.5" aria-label="Main App Navigation">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all text-sm min-h-[52px] group ${
                  isActive
                    ? 'bg-[#6651E8] text-white shadow-md high-contrast:bg-yellow-400 high-contrast:text-black'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white high-contrast:text-black' : 'text-slate-400 group-hover:text-brand-500'
                  }`}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 opacity-75" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Card & Logout */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[56px]"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-[#6651E8] dark:text-purple-300 flex items-center justify-center font-black text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-[#172554] dark:text-white truncate">
              {user?.name || 'Alex Mercer'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || 'alex@example.com'}
            </p>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-sm min-h-[48px] transition"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;

