'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  History,
  Video,
  Sliders,
  User,
} from 'lucide-react';

const MOBILE_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/conversation/active', label: 'Speak', icon: MessageSquare },
  { href: '/gesture', label: 'Gesture', icon: Video },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Sliders },
];

export const MobileNavigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 high-contrast:bg-black high-contrast:border-yellow-400 px-2 py-1 safe-area-pb"
    >
      <div className="flex items-center justify-around">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl min-h-[54px] min-w-[54px] transition-all ${
                isActive
                  ? 'text-[#6651E8] dark:text-purple-400 high-contrast:text-yellow-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl ${
                  isActive ? 'bg-purple-100 dark:bg-purple-950/70 high-contrast:bg-yellow-400 high-contrast:text-black' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-bold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;

