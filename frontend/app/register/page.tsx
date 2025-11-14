'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendEmailVerification } from 'firebase/auth';

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Form, 2: Email Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { signUp, signInWithGoogle, user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar que tenga al menos una letra y un número (sin restricción de caracteres especiales)
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasLetter || !hasNumber) {
      setError('La contraseña debe contener al menos una letra y un número');
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Iniciando registro...');
      
      // Crear usuario con Firebase Auth
      const userCredential = await signUp(email, password, name);
      console.log('✅ Usuario creado:', userCredential.user.uid);

      // Enviar email de verificación
      try {
        await sendEmailVerification(userCredential.user, {
          url: `${window.location.origin}/login`,
          handleCodeInApp: false,
        });
        console.log('✅ Email de verificación enviado');
        
        // Cambiar al paso 2 (verificación de email)
        setStep(2);
      } catch (emailError: any) {
        console.error('⚠️ Error al enviar email de verificación:', emailError);
        // No es crítico, continuar
        router.push('/');
      }
      
    } catch (err: any) {
      console.error('❌ Error en registro:', err);
      
      // Mensajes de error más amigables
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado. ¿Quieres iniciar sesión?');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del email no es válido');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es muy débil. Usa al menos 6 caracteres con letras y números');
      } else {
        setError(err.message || 'Error al crear la cuenta');
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
      router.push('/');
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Error al registrarse con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    
    setResending(true);
    setError('');

    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      alert('Email de verificación reenviado. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      console.error('Error resending verification:', err);
      setError('Error al reenviar el email. Intenta de nuevo en unos momentos.');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Email Verification Screen
  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#101622] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white/95 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-white/10 p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-[#0d59f2] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="material-symbols-outlined text-white text-4xl">mark_email_unread</span>
            </div>

            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
              ¡Verifica tu Email!
            </h1>
            
            <p className="text-slate-600 dark:text-white/60 mb-2">
              Hemos enviado un enlace de verificación a:
            </p>
            
            <p className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              {email}
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6 text-left">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 flex-shrink-0">info</span>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Pasos para verificar:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Abre tu bandeja de entrada</li>
                    <li>Busca el email de Grada Negra</li>
                    <li>Haz click en el enlace de verificación</li>
                    <li>Regresa aquí e inicia sesión</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full py-3 bg-slate-100 dark:bg-[#282e39] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-medium rounded-lg transition-all disabled:opacity-50 text-sm"
              >
                {resending ? 'Reenviando...' : 'Reenviar email de verificación'}
              </button>

              <Link
                href="/login"
                className="block w-full py-3 bg-[#0d59f2] hover:bg-[#0d59f2]/90 text-white font-bold rounded-lg transition-all text-center shadow-lg text-sm tracking-wide"
              >
                IR A INICIAR SESIÓN
              </Link>
            </div>

            <p className="text-xs text-slate-500 dark:text-white/60 mt-6">
              ¿No recibiste el email? Revisa tu carpeta de spam o reenvía el mensaje.
            </p>
          </div>

          {/* Back to home */}
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

  // Step 1: Registration Form
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
            Crea tu cuenta
          </h1>
          <p className="text-slate-600 dark:text-white/60 text-base">
            Únete y no te pierdas ningún evento
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
                O regístrate con email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1b1f27] border border-slate-300 dark:border-[#3b4354] rounded-lg focus:ring-2 focus:ring-[#0d59f2]/50 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#9ca6ba]"
                placeholder="Tu nombre completo"
              />
            </div>

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
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1b1f27] border border-slate-300 dark:border-[#3b4354] rounded-lg focus:ring-2 focus:ring-[#0d59f2]/50 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#9ca6ba] pr-12"
                  placeholder="Mínimo 6 caracteres"
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
              <p className="text-xs text-slate-500 dark:text-white/60 mt-1.5">
                Usa al menos una letra y un número
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1b1f27] border border-slate-300 dark:border-[#3b4354] rounded-lg focus:ring-2 focus:ring-[#0d59f2]/50 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#9ca6ba] pr-12"
                  placeholder="Confirma tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/60 hover:text-slate-600 dark:hover:text-white"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showConfirmPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-slate-50 dark:bg-[#282e39]/50 border border-slate-200 dark:border-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
                Al registrarte, aceptas nuestros{' '}
                <Link href="/terminos" className="font-semibold text-slate-900 dark:text-white hover:text-[#0d59f2] dark:hover:text-[#0d59f2]">
                  Términos de Servicio
                </Link>{' '}
                y{' '}
                <Link href="/privacidad" className="font-semibold text-slate-900 dark:text-white hover:text-[#0d59f2] dark:hover:text-[#0d59f2]">
                  Política de Privacidad
                </Link>
              </p>
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
                  Creando cuenta...
                </span>
              ) : (
                'CREAR CUENTA'
              )}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-slate-600 dark:text-white/60 text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-bold text-[#0d59f2] hover:text-[#0d59f2]/80 transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>

        {/* Business Link */}
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-500 dark:text-white/60">
            ¿Eres organizador de eventos?{' '}
            <Link href="/panel/register" className="font-semibold text-slate-700 dark:text-white hover:text-[#0d59f2] dark:hover:text-[#0d59f2]">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
