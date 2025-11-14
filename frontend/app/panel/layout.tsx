'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useComercio, ComercioProvider } from '@/contexts/ComercioContext';

function PanelLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading, signOut } = useAuth();
  const { comercio, loading: comercioLoading } = useComercio();

  useEffect(() => {
    // Si no está autenticado y no está en login, redirigir
    if (!authLoading && !user && pathname !== '/panel/login') {
      router.push('/panel/login');
    }

    // Si está en login pero ya tiene comercio, redirigir al dashboard
    if (!authLoading && user && comercio && pathname === '/panel/login') {
      router.push('/panel/dashboard');
    }
  }, [user, comercio, authLoading, comercioLoading, pathname, router]);

  // Si está en la página de login, no mostrar el layout
  if (pathname === '/panel/login') {
    return <>{children}</>;
  }

  // Loading state
  if (authLoading || comercioLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#101622]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d59f2] mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando panel...</p>
        </div>
      </div>
    );
  }

  // Si no hay comercio, mostrar mensaje
  if (!comercio) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#101622] p-4">
        <div className="max-w-md w-full bg-[#1b1f27] rounded-xl shadow-lg p-8 text-center border border-gray-700">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-400 text-3xl">error</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sin Acceso</h2>
          <p className="text-gray-400 mb-6">
            No tienes un comercio asociado a tu cuenta. Contacta al administrador para obtener acceso.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-[#282e39] hover:bg-[#3b4354] text-white rounded-lg transition-colors"
            >
              Volver al inicio
            </button>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/panel/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/panel/eventos', icon: 'confirmation_number', label: 'Mis Eventos' },
    { href: '/panel/eventos/crear', icon: 'add_circle', label: 'Crear Evento' },
    { href: '/panel/perfil', icon: 'person', label: 'Mi Perfil' },
    { href: '/panel/estadisticas', icon: 'analytics', label: 'Estadísticas' },
    { href: '/panel/equipo', icon: 'group', label: 'Equipo' },
    { href: '/panel/cupones', icon: 'local_offer', label: 'Cupones' },
    { href: '/panel/configuracion', icon: 'settings', label: 'Configuración' },
  ];

  const isActive = (href: string) => {
    // Exact match para evitar que /panel/eventos active también /panel/eventos/crear
    if (href === '/panel/eventos') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="flex h-screen bg-[#101622]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#1b1f27] flex-col sticky top-0 h-screen">
        {/* Logo/Brand */}
        <div className="p-4">
          <Link href="/panel/dashboard" className="flex items-center gap-3">
            {comercio.logo ? (
              <Image src={comercio.logo} alt={comercio.nombre} width={40} height={40} className="rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-[#0d59f2] to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {comercio.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-medium text-white truncate">{comercio.nombre}</h2>
              <p className="text-xs text-[#9ca6ba] font-normal">Merchant Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isActive(item.href)
                  ? 'bg-[#0d59f2] text-white'
                  : 'text-white hover:bg-[#282e39]'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 mt-auto space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-[#282e39] transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>home</span>
            <span className="text-sm font-medium">Sitio Principal</span>
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-red-600/20 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>logout</span>
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-[#101622] border-b border-[#3b4354] sticky top-0 bg-opacity-80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-end px-10 py-3 gap-8">
            <div className="flex gap-2">
              {/* Notifications */}
              <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#282e39] text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 transition-colors hover:bg-[#3b4354]">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
              </button>

              {/* Help */}
              <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#282e39] text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 transition-colors hover:bg-[#3b4354]">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
              </button>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'Usuario'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-[#0d59f2] to-blue-600 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">person</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#101622]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <ComercioProvider>
      <PanelLayoutContent>{children}</PanelLayoutContent>
    </ComercioProvider>
  );
}
