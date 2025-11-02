'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background-dark/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="material-symbols-outlined text-3xl text-primary">
            confirmation_number
          </span>
          <span className="font-display text-2xl font-bold">GRADA NEGRA</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-white hover:text-primary transition-colors text-sm font-medium">
            Descubrir
          </Link>
          {user && (
            <Link href="/mis-boletos" className="text-white/70 hover:text-primary transition-colors text-sm font-medium">
              Mis Eventos
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/perfil" className="flex items-center gap-2 text-white hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-2xl">account_circle</span>
                <span className="hidden md:block text-sm">{user.displayName || user.email}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-white/70 hover:text-red-500 transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-white hover:text-primary transition-colors"
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
