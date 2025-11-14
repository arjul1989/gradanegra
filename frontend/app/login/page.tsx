'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push(redirect);
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email o contraseña incorrectos');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del email no es válido');
      } else if (err.code === 'auth/user-disabled') {
        setError('Esta cuenta ha sido deshabilitada');
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push(redirect);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#101622] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="size-12 bg-[#0d59f2] rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">GN</span>
            </div>
            <span className="text-slate-900 dark:text-white text-2xl font-bold">Grada Negra</span>
          </Link>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            ¡Bienvenido de nuevo!
          </h1>
          <p className="text-slate-600 dark:text-white/60 text-base">
            Ingresa a tu cuenta para continuar
          </p>
        </div>

        {/* Card con efecto glassmorphism */}
        <div className="bg-white/95 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-white/10 p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-sm">error</span>
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-[#282e39] border border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:bg-white/10 rounded-lg font-medium text-slate-700 dark:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-sm font-medium">Continuar con Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/95 dark:bg-transparent text-slate-500 dark:text-white/60 font-medium">
                O continúa con email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1b1f27] border border-slate-300 dark:border-[#3b4354] rounded-lg focus:ring-2 focus:ring-[#0d59f2]/50 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#9ca6ba]"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-900 dark:text-white">
                  Contraseña
                </label>
                <Link href="/recuperar-password" className="text-sm text-[#0d59f2] hover:text-[#0d59f2]/80 font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1b1f27] border border-slate-300 dark:border-[#3b4354] rounded-lg focus:ring-2 focus:ring-[#0d59f2]/50 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#9ca6ba] pr-12"
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/60 hover:text-slate-600 dark:hover:text-white"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0d59f2] hover:bg-[#0d59f2]/90 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Iniciando sesión...
                </span>
              ) : (
                'INICIAR SESIÓN'
              )}
            </button>
          </form>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-slate-600 dark:text-white/60 text-sm">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="font-bold text-[#0d59f2] hover:text-[#0d59f2]/80 transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>

        {/* Business Link */}
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-500 dark:text-white/60">
            ¿Eres organizador de eventos?{' '}
            <Link href="/panel/login" className="font-semibold text-slate-700 dark:text-white hover:text-[#0d59f2] dark:hover:text-[#0d59f2]">
              Ingresa aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#101622] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#0d59f2]">progress_activity</span>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
