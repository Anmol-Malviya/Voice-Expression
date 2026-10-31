'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, User, Mail, Key, Globe, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import authService from '@/services/auth.service';
import { registerSchema, RegisterFormData } from '@/lib/validators';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setToken, setFontSize, toggleHighContrast } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      preferred_language: 'en',
      large_text: true,
      high_contrast: false,
      acceptTerms: true,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const res = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        preferred_language: data.preferred_language,
        accessibility_preferences: {
          font_size: data.large_text ? 'large' : 'normal',
          high_contrast: data.high_contrast,
        },
      });

      setToken(res.access_token);
      setUser(res.user);
      if (data.large_text) setFontSize('large');
      if (data.high_contrast) toggleHighContrast();

      toast.success('Account created successfully! Welcome to VoiceExpression.');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration encountered an error. Please check fields.';
      setServerError(msg);
      toast.error('Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 high-contrast:bg-black border-2 border-slate-200 dark:border-slate-800 high-contrast:border-yellow-400 rounded-3xl p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-950 text-[#6651E8] dark:text-purple-300 high-contrast:bg-yellow-400 high-contrast:text-black rounded-2xl flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#172554] dark:text-white high-contrast:text-yellow-400">
            Create Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalize your voice assistant and accessibility settings
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 text-xs font-bold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Alex Mercer"
                {...register('name')}
                className="pl-11"
                aria-invalid={!!errors.name}
              />
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
              <Input
                type="email"
                placeholder="alex@example.com"
                {...register('email')}
                className="pl-11"
                aria-invalid={!!errors.email}
              />
              <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600 font-bold">{errors.email.message}</p>
            )}
          </div>

          {/* Password & Confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="pl-10 pr-10 text-sm"
                  aria-invalid={!!errors.password}
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-rose-600 font-bold">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Confirm
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className="pl-10 text-sm"
                  aria-invalid={!!errors.confirmPassword}
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-[11px] text-rose-600 font-bold">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Preferred Spoken & Interface Language
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
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Accessibility Setup (Pre-configured)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="large_text"
                {...register('large_text')}
                className="w-4 h-4 rounded text-[#6651E8] focus:ring-[#6651E8] accent-[#6651E8]"
              />
              <label htmlFor="large_text" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                Enable Large Text Mode by default (115% scaling)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="high_contrast"
                {...register('high_contrast')}
                className="w-4 h-4 rounded text-[#6651E8] focus:ring-[#6651E8] accent-[#6651E8]"
              />
              <label htmlFor="high_contrast" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                Enable High Contrast WCAG AAA mode
              </label>
            </div>
          </div>

          {/* Terms Acceptance */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="acceptTerms"
              {...register('acceptTerms')}
              className="w-4 h-4 mt-0.5 rounded text-[#6651E8] focus:ring-[#6651E8] accent-[#6651E8]"
            />
            <label htmlFor="acceptTerms" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              I agree to the VoiceExpression privacy protocol, including strictly ephemeral video/audio processing.
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs text-rose-600 font-bold">{errors.acceptTerms.message}</p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full gap-2 min-h-[52px]"
            >
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <span>Already have an account? </span>
          <Link href="/login" className="font-bold text-[#6651E8] dark:text-purple-400 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
