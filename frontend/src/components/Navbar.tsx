'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Volume2, 
  Sun, 
  Moon, 
  Eye, 
  Type, 
  MessageSquare, 
  LayoutDashboard, 
  Video, 
  Sliders, 
  User, 
  LogOut, 
  LogIn,
  History
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const Navbar = () => {
  const pathname = usePathname();
  const { 
    fontSize, 
    cycleFontSize, 
    highContrast, 
    toggleHighContrast, 
    theme, 
    toggleTheme,
    user,
    logout,
    isAuthenticated
  } = useAppStore();

  const isActive = (path: string) => pathname === path;

  return (
    <header 
      role="banner"
      className="sticky top-0 z-40 w-full border-b backdrop-blur bg-white/95 dark:bg-slate-900/95 high-contrast:bg-black high-contrast:border-yellow-400 border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-brand-500 rounded-lg p-1"
            aria-label="VoiceExpression Home"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#6651E8] to-indigo-500 high-contrast:bg-yellow-400 flex items-center justify-center text-white high-contrast:text-black shadow-md">
              <Volume2 className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-[#172554] dark:text-white high-contrast:text-yellow-400">
                Voice<span className="text-[#6651E8] dark:text-purple-400 high-contrast:text-white">Expression</span>
              </span>
              <span className="hidden sm:block text-xs font-semibold text-teal-700 dark:text-teal-400 high-contrast:text-cyan-300">
                AI Manthan 2.0 &bull; PS16
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5" aria-label="Main Navigation">
            <Link
              href="/conversation/active"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-sm min-h-[48px] ${
                pathname.startsWith('/conversation')
                  ? 'bg-[#6651E8] text-white shadow-md high-contrast:bg-yellow-400 high-contrast:text-black'
                  : 'text-[#172554] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Live Conversation</span>
            </Link>

            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-sm min-h-[48px] ${
                isActive('/dashboard')
                  ? 'bg-[#6651E8] text-white shadow-md high-contrast:bg-yellow-400 high-contrast:text-black'
                  : 'text-[#172554] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/gesture"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-sm min-h-[48px] ${
                isActive('/gesture')
                  ? 'bg-[#6651E8] text-white shadow-md high-contrast:bg-yellow-400 high-contrast:text-black'
                  : 'text-[#172554] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Gestures</span>
            </Link>

            <Link
              href="/history"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-sm min-h-[48px] ${
                isActive('/history')
                  ? 'bg-[#6651E8] text-white shadow-md high-contrast:bg-yellow-400 high-contrast:text-black'
                  : 'text-[#172554] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </Link>

            <Link
              href="/settings"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-sm min-h-[48px] ${
                isActive('/settings')
                  ? 'bg-[#6651E8] text-white shadow-md high-contrast:bg-yellow-400 high-contrast:text-black'
                  : 'text-[#172554] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </nav>

          {/* Quick Accessibility Toggles */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={cycleFontSize}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
              aria-label={`Cycle font size. Current: ${fontSize}`}
            >
              <Type className="w-3.5 h-3.5 text-[#6651E8]" />
              <span className="uppercase">{fontSize}</span>
            </button>

            <button
              onClick={toggleHighContrast}
              className={`p-2.5 rounded-xl border font-bold transition ${
                highContrast 
                  ? 'bg-yellow-400 text-black border-yellow-400' 
                  : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-label="Toggle High Contrast"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <span className="hidden lg:inline text-xs font-bold text-[#172554] dark:text-white">
                  {user?.name || 'Alex Mercer'}
                </span>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-[#6651E8] text-white font-bold text-xs shadow"
              >
                Sign In
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;

