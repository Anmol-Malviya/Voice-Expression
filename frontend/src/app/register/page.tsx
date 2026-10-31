'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus, User, Mail, Key, Globe, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  preferred_language: z.string().default('en'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setToken } = useAppStore();
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
      preferred_language: 'en',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const res = await api.post('/auth/register', data);
      setToken(res.data.access_token);
      setUser(res.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      // Local fallback for offline mode
      if (!err.response) {
        const fallbackUser = {
          id: 'usr_' + Date.now(),
          name: data.name,
          email: data.email,
          preferred_language: data.preferred_language,
        };
        setUser(fallbackUser);
        setToken('jwt_' + Date.now());
        router.push('/dashboard');
        return;
      }
      setServerError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 high-contrast:bg-black border-2 border-slate-200 dark:border-slate-800 high-contrast:border-yellow-400 rounded-3xl p-8 shadow-xl">
        
        {/* Header */}
        <div className="text-center mb-8">
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
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#172554] dark:text-slate-200 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-4 top-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Alex Mercer"
                className="pl-11"
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#172554] dark:text-slate-200 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-4 top-4 text-slate-400" />
              <Input
                type="email"
                placeholder="name@example.com"
                className="pl-11"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#172554] dark:text-slate-200 mb-1">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-4 top-4 text-slate-400" />
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                className="pl-11"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#172554] dark:text-slate-200 mb-1">
              Primary Language
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-4 top-4 text-slate-400" />
              <select
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172554] dark:text-white font-medium text-base focus:border-[#6651E8] min-h-[48px]"
                {...register('preferred_language')}
              >
                <option value="en">English (US/UK/IN)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="hi-en">Hinglish / Code-mixed</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full mt-2"
          >
            {isLoading ? "Creating Account..." : "Complete Registration"}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#6651E8] hover:underline">
            Sign In here
          </Link>
        </div>

      </div>
    </div>
  );
}

