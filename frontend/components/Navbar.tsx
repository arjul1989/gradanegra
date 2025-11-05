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
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background-dark/95 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6 max-w-7xl">
        <Link href="/" className="flex items-center gap-2 text-white group">
          <span className="material-symbols-outlined text-2xl text-primary group-hover:scale-110 transition-transform">
            confirmation_number
          </span>
          <span className="font-display text-xl font-bold tracking-tight">GRADA NEGRA</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
            Eventos
          </Link>
          {user && (
            <Link href="/mis-boletos" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Mis Boletos
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/perfil" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">account_circle</span>
                <span className="hidden md:block text-sm font-medium">{user.displayName || user.email?.split('@')[0]}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-xs text-white/60 hover:text-red-500 transition-colors font-medium"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-white/80 hover:text-white transition-colors font-medium px-3 py-1.5"
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className="text-sm bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-lg shadow-primary/30"
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
