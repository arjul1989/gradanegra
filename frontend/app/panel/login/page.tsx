'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function PanelLoginPage() {
  const router = useRouter();
  const { user, signInWithGoogle, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Si ya está autenticado, verificar si tiene comercio
    if (user && !loading) {
      console.log('✅ Usuario autenticado, verificando acceso al comercio:', user.email);
      checkComercioAccess();
    }
  }, [user, loading]);

  const checkComercioAccess = async () => {
    try {
      console.log('🔍 Verificando comercio para usuario:', user?.uid);
      // Verificar si el usuario tiene un comercio asociado
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comercios/by-user/${user?.uid}`);
      
      if (response.ok) {
        const comercio = await response.json();
        console.log('📊 Comercio encontrado:', comercio);
        if (comercio && comercio.id) {
          // Tiene comercio, redirigir al dashboard
          console.log('✅ Redirigiendo al dashboard...');
          router.push('/panel/dashboard');
        } else {
          console.log('⚠️ El usuario no tiene un comercio asociado');
        }
      } else {
        console.log('❌ Error al verificar comercio:', response.status);
      }
    } catch (error) {
      console.error('❌ Error verificando acceso:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      console.log('🔐 Iniciando login con Google...');
      await signInWithGoogle();
      console.log('✅ Login completado, esperando verificación de comercio...');
      // El useEffect se encargará de verificar el comercio
    } catch (error) {
      console.error('❌ Error al iniciar sesión:', error);
      alert('Error al iniciar sesión. Por favor, intenta nuevamente.');
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#101622] via-[#1b1f27] to-[#101622]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-[#101622] via-[#1b1f27] to-[#101622] p-4">
      <div className="layout-container flex h-full w-full max-w-md grow flex-col items-center justify-center">
        <div className="flex w-full flex-col items-center gap-8 rounded-xl border border-gray-700/50 bg-[#1b1f27] p-8 shadow-lg">
          {/* Logo */}
          <div className="flex w-full justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#0d59f2] to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">GN</span>
            </div>
          </div>

          {/* Título y subtítulo */}
          <div className="flex w-full flex-col gap-2 text-center">
            <h1 className="text-white text-3xl font-black leading-tight tracking-tight">
              Panel de Comercios
            </h1>
            <p className="text-gray-400 text-base font-normal leading-normal">
              Gestiona tus eventos y ventas
            </p>
          </div>

          {/* Botón de Google Sign In */}
          <div className="flex w-full px-4 py-3 justify-center">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="flex min-w-[84px] w-full max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-gradient-to-r from-[#0d59f2] to-blue-600 hover:from-blue-600 hover:to-[#0d59f2] text-white gap-3 text-base font-bold leading-normal tracking-wide transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#fff"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#fff"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#fff"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#fff"
                    />
                  </svg>
                  <span className="truncate">Continuar con Google</span>
                </>
              )}
            </button>
          </div>

          {/* Nota informativa */}
          <div className="w-full pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400 text-center">
              Solo usuarios con cuenta de comercio pueden acceder
            </p>
          </div>
        </div>

        {/* Botón de regreso */}
        <div className="mt-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Volver al sitio principal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
