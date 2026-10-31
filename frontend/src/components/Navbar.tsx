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
  History,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const Navbar = () => {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const {
    fontSize,
    cycleFontSize,
    highContrast,
    toggleHighContrast,
    theme,
    toggleTheme,
    user,
    logout,
    isAuthenticated,
  } = useAppStore();

  const isActive = (path: string) => pathname === path;

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md bg-white/95 dark:bg-slate-900/95 high-contrast:bg-black high-contrast:border-yellow-400 border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-brand-500 rounded-lg p-1"
            aria-label="VoiceExpression Home"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6651E8] to-indigo-500 high-contrast:bg-yellow-400 flex items-center justify-center text-white high-contrast:text-black shadow-md">
              <Volume2 className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-[#172554] dark:text-white high-contrast:text-yellow-400">
                Voice<span className="text-[#6651E8] dark:text-purple-400 high-contrast:text-white">Expression</span>
              </span>
              <span className="hidden sm:block text-[11px] font-bold text-teal-700 dark:text-teal-400 high-contrast:text-cyan-300 uppercase tracking-wider">
                AI Manthan 2.0 &bull; PS16
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5" aria-label="Main Navigation">
            {isLanding ? (
              <>
                <Link
                  href="/"
                  className="px-3.5 py-2 rounded-xl font-bold text-sm text-[#172554] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Home
                </Link>
                <a
                  href="#features"
                  className="px-3.5 py-2 rounded-xl font-bold text-sm text-[#172554] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="px-3.5 py-2 rounded-xl font-bold text-sm text-[#172554] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  How It Works
                </a>
                <a
                  href="#about"
                  className="px-3.5 py-2 rounded-xl font-bold text-sm text-[#172554] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  About
                </a>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition text-sm min-h-[44px] ${
                    isActive('/dashboard')
                      ? 'bg-[#6651E8] text-white shadow-md high-contrast:bg-yellow-400 high-contrast:text-black'
                      : 'text-[#172554] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/conversation/active"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition text-sm min-h-[44px] ${
                    pathname.startsWith('/conversation')
                      ? 'bg-[#6651E8] text-white shadow-md high-contrast:bg-yellow-400 high-contrast:text-black'
                      : 'text-[#172554] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Conversation</span>
                </Link>

                <Link
                  href="/gesture"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition text-sm min-h-[44px] ${
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition text-sm min-h-[44px] ${
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition text-sm min-h-[44px] ${
                    isActive('/settings')
                      ? 'bg-[#6651E8] text-white shadow-md high-contrast:bg-yellow-400 high-contrast:text-black'
                      : 'text-[#172554] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              </>
            )}
          </nav>

          {/* Accessibility Quick Toggles & User Auth CTA */}
          <div className="flex items-center gap-2">
            {/* Font Size Cycle */}
            <button
              onClick={cycleFontSize}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black min-h-[44px] flex items-center gap-1.5 transition"
              title={`Cycle text size: ${fontSize}`}
              aria-label={`Cycle font size. Current is ${fontSize}`}
            >
              <Type className="w-4 h-4 text-[#6651E8] dark:text-purple-400" />
              <span className="hidden sm:inline capitalize">{fontSize}</span>
            </button>

            {/* High Contrast */}
            <button
              onClick={toggleHighContrast}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-black min-h-[44px] flex items-center gap-1.5 transition ${
                highContrast
                  ? 'bg-yellow-400 text-black border-yellow-500'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Toggle High Contrast"
              aria-pressed={highContrast}
            >
              <Eye className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Contrast</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-500" />
              )}
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 min-h-[44px] transition"
              >
                <span className="hidden sm:inline text-xs font-bold text-purple-900 dark:text-purple-200">
                  {user?.name ? user.name.split(' ')[0] : 'Profile'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#6651E8] text-white flex items-center justify-center font-black text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl font-bold text-sm text-[#172554] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] flex items-center"
                >
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl font-extrabold text-sm bg-[#6651E8] text-white hover:bg-[#533ed4] shadow-sm min-h-[44px] flex items-center"
                >
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
