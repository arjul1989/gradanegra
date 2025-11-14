'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useComercio } from '@/contexts/ComercioContext';

interface Estadisticas {
  eventosActivos: number;
  eventosDestacados: number;
  limiteEventos: number;
  totalCompras: number;
  ventasTotales: number;
  comisionesPlataforma: number;
  ingresosNetos: number;
  plan: string;
  comision: number;
}

interface Evento {
  id: string;
  nombre: string;
  imagen?: string;
  ciudad: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { comercio } = useComercio();
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [eventosRecientes, setEventosRecientes] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (comercio) {
      fetchData();
    }
  }, [comercio]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener estadísticas
      const statsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comercios/${comercio!.id}/estadisticas`
      );
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setEstadisticas(stats);
      }

      // Obtener eventos recientes
      const eventosResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comercios/${comercio!.id}/eventos?limit=5`
      );
      if (eventosResponse.ok) {
        const data = await eventosResponse.json();
        setEventosRecientes(data.eventos);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d59f2]"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'free':
        return 'bg-[#282e39] text-white';
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'pro':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      default:
        return 'bg-[#282e39] text-white';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'pausado':
        return 'bg-yellow-100 text-yellow-800';
      case 'finalizado':
        return 'bg-[#282e39] text-white';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-[#282e39] text-white';
    }
  };

  const progressPercentage = estadisticas && estadisticas.limiteEventos > 0
    ? (estadisticas.eventosActivos / estadisticas.limiteEventos) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-3xl font-black text-white">
          ¡Bienvenido, {comercio?.nombre}!
        </h1>
        <p className="text-gray-400 mt-2">
          Aquí tienes un resumen de la actividad de tus eventos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Eventos Activos */}
        <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm font-medium">Eventos Activos</p>
            <span className="material-symbols-outlined text-gray-400">event</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {estadisticas?.eventosActivos || 0}
          </p>
          {estadisticas && estadisticas.limiteEventos > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              de {estadisticas.limiteEventos} permitidos
            </p>
          )}
        </div>

        {/* Boletos Vendidos */}
        <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm font-medium">Boletos Vendidos</p>
            <span className="material-symbols-outlined text-gray-400">confirmation_number</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {estadisticas?.totalCompras || 0}
          </p>
          <p className="text-sm text-gray-400 mt-1">este mes</p>
        </div>

        {/* Ingresos Netos */}
        <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm font-medium">Ingresos Netos</p>
            <span className="material-symbols-outlined text-gray-400">payments</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(estadisticas?.ingresosNetos || 0)}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            después de {estadisticas?.comision || 0}% comisión
          </p>
        </div>
      </div>

      {/* Plan Card */}
      <div className="bg-[#1b1f27] rounded-xl border border-gray-700 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Gradient Side */}
          <div className="md:w-1/3 bg-gradient-to-br from-[#0d59f2] via-blue-600 to-blue-700 p-8 flex items-center justify-center">
            <div className="text-center text-white">
              <span className="material-symbols-outlined text-6xl mb-4">workspace_premium</span>
              <p className="text-2xl font-bold">Plan {comercio?.tipoPlan.toUpperCase()}</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Tu Plan Actual</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getPlanBadgeColor(comercio?.tipoPlan || 'free')}`}>
                  {comercio?.tipoPlan.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-gray-400 mb-4">
              Has creado {estadisticas?.eventosActivos || 0} de{' '}
              {estadisticas?.limiteEventos === -1 ? '∞' : estadisticas?.limiteEventos || 0}{' '}
              eventos permitidos
            </p>

            {/* Progress Bar */}
            {estadisticas && estadisticas.limiteEventos > 0 && (
              <div className="mb-6">
                <div className="w-full bg-[#282e39] rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#0d59f2] to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{progressPercentage.toFixed(0)}% utilizado</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Comisión: {comercio?.comision}% por venta
              </p>
              <Link
                href="/panel/configuracion"
                className="px-4 py-2 bg-[#0d59f2] hover:bg-[#0d59f2]/90 text-white rounded-lg text-sm font-medium transition-all"
              >
                Mejorar Plan
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Eventos Recientes</h3>
          <Link
            href="/panel/eventos"
            className="text-sm text-gray-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
          >
            Ver todos
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {eventosRecientes.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-700 mb-4">event_busy</span>
            <p className="text-gray-400 mb-4">No tienes eventos creados aún</p>
            <Link
              href="/panel/eventos/crear"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0d59f2] hover:bg-[#0d59f2]/90 text-white rounded-lg font-medium transition-all"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Crear tu primer evento
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {eventosRecientes.map((evento) => (
              <Link
                key={evento.id}
                href={`/panel/eventos/${evento.id}`}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-[#282e39] transition-colors border border-gray-700"
              >
                {/* Imagen */}
                <div className="w-20 h-20 bg-[#282e39] rounded-lg overflow-hidden flex-shrink-0">
                  {evento.imagen ? (
                    <Image
                      src={evento.imagen}
                      alt={evento.nombre}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400 text-3xl">image</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">{evento.nombre}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {evento.ciudad}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(evento.status)}`}>
                      {evento.status}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/panel/eventos/crear"
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-[#0d59f2] to-blue-600 text-white rounded-xl hover:from-[#0d59f2]/90 hover:to-blue-600/90 transition-all group"
        >
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl">add_circle</span>
          </div>
          <div>
            <p className="font-bold text-lg">Crear Nuevo Evento</p>
            <p className="text-sm text-blue-100">Configura fechas, precios y boletos</p>
          </div>
        </Link>

        <Link
          href="/panel/estadisticas"
          className="flex items-center gap-4 p-6 bg-[#1b1f27] border border-gray-700 rounded-xl hover:bg-[#282e39] transition-all group"
        >
          <div className="w-12 h-12 bg-[#282e39] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl text-[#0d59f2]">analytics</span>
          </div>
          <div>
            <p className="font-bold text-lg text-white">Ver Estadísticas</p>
            <p className="text-sm text-gray-400">Análisis detallado de ventas</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
