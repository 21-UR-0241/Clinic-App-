'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

function IconMail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="14" height="10" rx="1.5" />
      <path d="M3.5 5.5 10 11l6.5-5.5" />
    </svg>
  );
}
function IconLock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4.5" y="9" width="11" height="7.5" rx="1.5" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}
function IconEye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 10s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" />
      <circle cx="10" cy="10" r="2.25" />
    </svg>
  );
}
function IconEyeOff(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3l14 14M8.3 8.4a2.25 2.25 0 0 0 3.15 3.2M6.2 6.3C4 7.6 2.5 10 2.5 10s2.8 5 8 5c1.1 0 2.1-.2 2.95-.55M11.9 4.65A8.7 8.7 0 0 1 18 10s-.7 1.25-2 2.4" />
    </svg>
  );
}
function IconAlert(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6.5v4M10 13.5h.01" />
    </svg>
  );
}
function IconSpinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="motion-safe:animate-spin" {...props}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth={2} opacity={0.25} />
      <path d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@clinic.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken } = response.data;

      document.cookie = `token=${token}; path=/; max-age=3600`;
      document.cookie = `refreshToken=${refreshToken}; path=/; max-age=604800`;

      router.push('/patients');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7F5] px-4 text-[#16302B]">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0F6D66] text-lg font-semibold text-white">
            +
          </span>
          <div className="text-center">
            <h1 className="font-['Fraunces',_Georgia,_serif] text-2xl font-medium tracking-tight text-[#16302B]">
              Clinic App
            </h1>
            <p className="mt-1 text-sm text-[#4B5D58]">Sign in to manage patient records</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#DDE5E1] bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                Email address
              </label>
              <div className="relative">
                <IconMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9C96]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-[#DDE5E1] py-2.5 pl-9 pr-3 text-sm text-[#16302B] placeholder:text-[#8A9C96] focus:border-[#0F6D66] focus:outline-none focus:ring-2 focus:ring-[#0F6D66]/20"
                  placeholder="you@clinic.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                Password
              </label>
              <div className="relative">
                <IconLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9C96]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-[#DDE5E1] py-2.5 pl-9 pr-10 text-sm text-[#16302B] placeholder:text-[#8A9C96] focus:border-[#0F6D66] focus:outline-none focus:ring-2 focus:ring-[#0F6D66]/20"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9C96] hover:text-[#4B5D58]"
                >
                  {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-[#F0C9BE] bg-[#F4E3DD] px-3 py-2.5 text-sm text-[#8C332E]">
                <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0F6D66] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0B534E] disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition"
            >
              {loading && <IconSpinner className="h-4 w-4" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-[#8A9C96]">
          Demo account — admin@clinic.com / Admin@123 (local development only)
        </p>
      </div>
    </div>
  );
}