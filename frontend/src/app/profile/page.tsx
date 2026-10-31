'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Mail,
  Globe,
  Sliders,
  Type,
  Eye,
  Zap,
  Save,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { MobileNavigation } from '@/components/MobileNavigation';
import { useAppStore } from '@/store/useAppStore';
import authService from '@/services/auth.service';
import { profileUpdateSchema, ProfileUpdateFormData } from '@/lib/validators';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    setUser,
    fontSize,
    setFontSize,
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    language,
    setLanguage,
    logout,
  } = useAppStore();

  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || 'Alex Mercer',
      email: user?.email || 'alex@example.com',
      preferred_language: user?.preferred_language || language || 'en',
      font_size: fontSize,
      high_contrast: highContrast,
      reduced_motion: reducedMotion,
    },
  });

  const onSubmit = async (data: ProfileUpdateFormData) => {
    setIsSaving(true);
    try {
      const updated = await authService.updateProfile({
        name: data.name,
        email: data.email,
        preferred_language: data.preferred_language,
        accessibility_settings: {
          font_size: data.font_size,
          high_contrast: data.high_contrast,
          theme: 'light',
          reduced_motion: data.reduced_motion,
          large_buttons: true,
        },
      });

      setUser(updated);
      setFontSize(data.font_size);
      setLanguage(data.preferred_language);
      if (data.high_contrast !== highContrast) toggleHighContrast();
      if (data.reduced_motion !== reducedMotion) toggleReducedMotion();

      toast.success('Profile and accessibility preferences successfully saved!');
    } catch {
      toast.error('Could not save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Signed out of VoiceExpression.');
    router.push('/login');
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] pb-16 md:pb-0">
      <AppSidebar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AppHeader
          title="User Profile & Settings"
          subtitle="Manage your personal identity, assistive configurations, and privacy."
          backHref="/dashboard"
        />

        {/* Profile Card Header */}
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 high-contrast:bg-black border-2 border-slate-200 dark:border-slate-800 high-contrast:border-yellow-400 shadow-md flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-3xl bg-[#6651E8] text-white flex items-center justify-center font-black text-3xl shadow-lg shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[#172554] dark:text-white high-contrast:text-yellow-400">
              {user?.name || 'Alex Mercer'}
            </h2>
            <p className="text-sm text-slate-500">{user?.email || 'alex@example.com'}</p>
            <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Patient Profile</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Voice Consent Granted</span>
              </span>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <Card className="p-8 space-y-6">
          <h3 className="text-xl font-black text-[#172554] dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#6651E8]" />
            <span>Edit Profile Details</span>
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <Input {...register('name')} className="pl-11" />
                  <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-600 font-bold">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Input {...register('email')} className="pl-11" />
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600 font-bold">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Preferred Spoken &amp; Interface Language
              </label>
              <select
                {...register('preferred_language')}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#6651E8] min-h-[48px]"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            {/* Accessibility Preferences */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Display &amp; Sensory Accessibility
              </span>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Default Text Scaling
                </label>
                <select
                  {...register('font_size')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                >
                  <option value="normal">Standard (100%)</option>
                  <option value="large">Large (115%)</option>
                  <option value="xlarge">Extra Large (130%)</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="prof_high_contrast"
                    {...register('high_contrast')}
                    className="w-4 h-4 rounded text-[#6651E8] focus:ring-[#6651E8] accent-[#6651E8]"
                  />
                  <label htmlFor="prof_high_contrast" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    High Contrast Palette (WCAG AAA)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="prof_reduced_motion"
                    {...register('reduced_motion')}
                    className="w-4 h-4 rounded text-[#6651E8] focus:ring-[#6651E8] accent-[#6651E8]"
                  />
                  <label htmlFor="prof_reduced_motion" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    Reduced Motion (Disable non-essential animations)
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className="w-full sm:w-auto text-rose-600 gap-2 min-h-[48px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>

              <Button
                type="submit"
                size="md"
                disabled={isSaving}
                className="w-full sm:w-auto gap-2 min-h-[48px] px-8"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </Button>
            </div>
          </form>
        </Card>
      </main>

      <MobileNavigation />
    </div>
  );
}

