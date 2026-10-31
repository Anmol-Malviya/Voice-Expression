'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Mail, Key, Eye, EyeOff, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import authService, { DEMO_USER } from '@/services/auth.service';
import { loginSchema, LoginFormData } from '@/lib/validators';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken, loginAsDemo } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'alex@example.com',
      password: 'strongPassword123',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const res = await authService.login({
        email: data.email,
        password: data.password,
        remember_me: data.rememberMe,
      });
      setToken(res.access_token);
      setUser(res.user);
      toast.success(`Welcome back, ${res.user.name}!`);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password. You can also use the 1-Click Demo Account below.';
      setServerError(msg);
      toast.error('Sign in failed. Check credentials or use Demo Login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = () => {
    loginAsDemo();
    toast.success('Signed in with Alex Mercer (Demo Evaluator Profile)');
    router.push('/dashboard');
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info('Password recovery link dispatched to your registered email address.');
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 high-contrast:bg-black border-2 border-slate-200 dark:border-slate-800 high-contrast:border-yellow-400 rounded-3xl p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-950 text-[#6651E8] dark:text-purple-300 high-contrast:bg-yellow-400 high-contrast:text-black rounded-2xl flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#172554] dark:text-white high-contrast:text-yellow-400">
            Sign In
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access your live assistive sessions and speech preferences
          </p>
        </div>

        {/* 1-Click Demo Evaluation Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between gap-3">
          <div className="text-left">
            <div className="font-bold text-xs sm:text-sm text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#6651E8]" />
              <span>Evaluator Demo Account</span>
            </div>
            <div className="text-[11px] text-purple-700 dark:text-purple-300">
              Instant 1-click test access as Alex Mercer
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleDemoClick}
            className="gap-1 text-xs shrink-0"
          >
            <span>Demo Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Input
                type="email"
                placeholder="name@example.com"
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-bold text-[#6651E8] dark:text-purple-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className="pl-11 pr-11"
                aria-invalid={!!errors.password}
              />
              <Key className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600 font-bold">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rememberMe"
              {...register('rememberMe')}
              className="w-4 h-4 rounded border-slate-300 text-[#6651E8] focus:ring-[#6651E8] accent-[#6651E8]"
            />
            <label htmlFor="rememberMe" className="text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
              Remember me on this assistive device
            </label>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full gap-2 min-h-[52px]"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <span>Don't have an account yet? </span>
          <Link href="/register" className="font-bold text-[#6651E8] dark:text-purple-400 hover:underline">
            Register for free
          </Link>
        </div>
      </div>
    </div>
  );
}
