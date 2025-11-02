'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, name);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error al registrarse con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-dark">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="flex w-full max-w-[480px] flex-col items-center justify-center gap-2">
          {/* Logo */}
          <div className="w-full flex justify-center py-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="size-10 text-primary">
                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fillRule="evenodd" />
                </svg>
              </div>
              <span className="text-white text-xl font-bold">Grada Negra</span>
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-gray-50 tracking-tight text-[32px] font-bold leading-tight px-4 text-center pb-3 pt-6">
            Crea tu cuenta para no perderte nada
          </h1>

          {/* Google Sign In Button */}
          <div className="flex w-full flex-col items-stretch px-4 py-3 gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-white text-[#1f1f1f] text-base font-bold leading-normal tracking-[0.015em] w-full border border-gray-200 gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="truncate">Continuar con Google</span>
            </button>
          </div>

          {/* Divider */}
          <p className="text-gray-500 text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
            O regístrate con tu email
          </p>

          {/* Error Message */}
          {error && (
            <div className="w-full px-4">
              <div className="p-3 bg-red-900/20 border border-red-900 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-gray-300 text-base font-medium leading-normal pb-2">
                Nombre Completo
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary border border-gray-700 bg-gray-900/50 focus:border-primary h-14 placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal transition-colors"
                placeholder="Tu nombre completo"
              />
            </label>

            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-gray-300 text-base font-medium leading-normal pb-2">
                Correo Electrónico
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary border border-gray-700 bg-gray-900/50 focus:border-primary h-14 placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal transition-colors"
                placeholder="tucorreo@ejemplo.com"
              />
            </label>

            <label className="flex flex-col min-w-40 flex-1 relative">
              <p className="text-gray-300 text-base font-medium leading-normal pb-2">
                Contraseña
              </p>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary border border-gray-700 bg-gray-900/50 focus:border-primary h-14 placeholder:text-gray-500 p-[15px] pr-12 text-base font-normal leading-normal transition-colors"
                placeholder="Introduce tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[46px] text-gray-500 hover:text-gray-300"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </label>

            <label className="flex flex-col min-w-40 flex-1 relative">
              <p className="text-gray-300 text-base font-medium leading-normal pb-2">
                Confirmar Contraseña
              </p>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary border border-gray-700 bg-gray-900/50 focus:border-primary h-14 placeholder:text-gray-500 p-[15px] pr-12 text-base font-normal leading-normal transition-colors"
                placeholder="Confirma tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-[46px] text-gray-500 hover:text-gray-300"
              >
                <span className="material-symbols-outlined">
                  {showConfirmPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </label>

            <div className="w-full flex flex-col items-stretch py-3">
              <button
                type="submit"
                disabled={loading}
                className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] w-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="truncate">
                  {loading ? 'REGISTRANDO...' : 'REGISTRARME'}
                </span>
              </button>
            </div>
          </form>

          {/* Terms and Privacy */}
          <p className="text-gray-500 text-xs font-normal leading-normal px-6 text-center">
            Al registrarte, aceptas nuestros{' '}
            <Link href="#" className="font-medium text-gray-300 underline">
              Términos y Condiciones
            </Link>{' '}
            y{' '}
            <Link href="#" className="font-medium text-gray-300 underline">
              Política de Privacidad
            </Link>
            .
          </p>

          {/* Login Link */}
          <p className="text-gray-500 text-sm font-normal leading-normal py-4 px-4 text-center">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-bold text-primary hover:text-primary/80">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
