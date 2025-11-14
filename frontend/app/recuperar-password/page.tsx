'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este email');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del email no es válido');
      } else {
        setError(err.message || 'Error al enviar el email de recuperación');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#101622] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/95 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-white/10 p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="material-symbols-outlined text-white text-4xl">mark_email_read</span>
            </div>

            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
              ¡Email Enviado!
            </h1>
            
            <p className="text-slate-600 dark:text-white/60 mb-2">
              Hemos enviado un enlace de recuperación a:
            </p>
            
            <p className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              {email}
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6 text-left">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 flex-shrink-0">info</span>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Pasos para recuperar tu contraseña:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Abre tu bandeja de entrada</li>
                    <li>Busca el email de Grada Negra</li>
                    <li>Haz click en el enlace</li>
                    <li>Crea una nueva contraseña</li>
                  </ol>
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="block w-full py-3 bg-[#0d59f2] hover:bg-[#0d59f2]/90 text-white font-bold rounded-lg transition-all text-center shadow-lg text-sm tracking-wide"
            >
              VOLVER A INICIAR SESIÓN
            </Link>

            <p className="text-xs text-slate-500 dark:text-white/60 mt-6">
              ¿No recibiste el email? Revisa tu carpeta de spam.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Recuperar Contraseña
          </h1>
          <p className="text-slate-600 dark:text-white/60 text-base">
            Ingresa tu email y te enviaremos instrucciones
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

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <p className="text-xs text-slate-500 dark:text-white/60 mt-2">
                Te enviaremos un enlace para restablecer tu contraseña
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0d59f2] hover:bg-[#0d59f2]/90 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Enviando...
                </span>
              ) : (
                'ENVIAR ENLACE DE RECUPERACIÓN'
              )}
            </button>
          </form>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link href="/login" className="text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 font-semibold text-sm">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
