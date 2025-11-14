"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Compra {
  id: string;
  eventoNombre: string;
  eventoImagen: string;
  cantidadBoletos: number;
  total: number;
  metodoPago: 'tarjeta' | 'pse' | 'efectivo' | 'transferencia';
  status: 'pendiente' | 'completada' | 'cancelada' | 'reembolsada';
  fechaCompra: any;
  nombre: string;
  email: string;
}

function HistorialComprasContent() {
  const { user } = useAuth();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [filteredCompras, setFilteredCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalCompras: 0,
    totalGastado: 0,
    promedioCompra: 0
  });

  useEffect(() => {
    if (user) {
      fetchCompras();
      fetchResumen();
    }
  }, [user]);

  useEffect(() => {
    filterCompras();
  }, [compras, statusFilter, dateFrom, dateTo]);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
      
      const params = new URLSearchParams();
      if (statusFilter !== 'todas') params.append('status', statusFilter);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/compras/user/${user?.uid}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al cargar compras');

      const data = await response.json();
      setCompras(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumen = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/compras/user/${user?.uid}/resumen`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error al cargar resumen:', err);
    }
  };

  const filterCompras = () => {
    let filtered = [...compras];

    // Filter by status
    if (statusFilter !== 'todas') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(c => {
        const compraDate = new Date(c.fechaCompra._seconds * 1000);
        return compraDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59); // Include full day
      filtered = filtered.filter(c => {
        const compraDate = new Date(c.fechaCompra._seconds * 1000);
        return compraDate <= toDate;
      });
    }

    setFilteredCompras(filtered);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completada: { text: 'Completada', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      pendiente: { text: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      cancelada: { text: 'Cancelada', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      reembolsada: { text: 'Reembolsada', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    };
    return badges[status as keyof typeof badges] || badges.completada;
  };

  const getMetodoPagoIcon = (metodo: string) => {
    const icons: Record<string, string> = {
      tarjeta: 'credit_card',
      pse: 'account_balance',
      efectivo: 'payments',
      transferencia: 'sync_alt',
    };
    return icons[metodo] || 'payment';
  };

  const formatDate = (timestamp: any) => {
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-background-dark">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-slate-900 dark:text-white">Cargando historial...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-background-dark">
      <Navbar />

      <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-7xl flex-col gap-8">
          {/* Header */}
          <div>
            <h1 className="text-slate-900 dark:text-white text-4xl font-black tracking-tight">
              Historial de Compras
            </h1>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Compras</p>
              <p className="text-slate-900 dark:text-white text-3xl font-bold mt-2">{stats.totalCompras}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Gastado</p>
              <p className="text-slate-900 dark:text-white text-3xl font-bold mt-2">
                ${stats.totalGastado.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Promedio por Compra</p>
              <p className="text-slate-900 dark:text-white text-3xl font-bold mt-2">
                ${stats.promedioCompra.toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-4">
                {/* Date From */}
                <div className="flex flex-col min-w-40 flex-1">
                  <label className="text-slate-900 dark:text-white text-sm font-medium mb-2">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="form-input w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 h-12 px-4 text-base"
                  />
                </div>

                {/* Date To */}
                <div className="flex flex-col min-w-40 flex-1">
                  <label className="text-slate-900 dark:text-white text-sm font-medium mb-2">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="form-input w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 h-12 px-4 text-base"
                  />
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setStatusFilter('todas');
                  }}
                  className="h-12 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>

              {/* Status Filters */}
              <div>
                <p className="text-slate-900 dark:text-white text-sm font-medium mb-2">Estado de la compra</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setStatusFilter('todas')}
                    className={`h-8 px-4 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === 'todas'
                        ? 'bg-primary text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setStatusFilter('completada')}
                    className={`h-8 px-4 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === 'completada'
                        ? 'bg-primary text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    Completadas
                  </button>
                  <button
                    onClick={() => setStatusFilter('pendiente')}
                    className={`h-8 px-4 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === 'pendiente'
                        ? 'bg-primary text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    Pendientes
                  </button>
                  <button
                    onClick={() => setStatusFilter('cancelada')}
                    className={`h-8 px-4 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === 'cancelada'
                        ? 'bg-primary text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    Canceladas
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-4">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Compras Table/Cards */}
          {filteredCompras.length === 0 ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">
                receipt_long
              </span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                No tienes compras en esta categoría
              </p>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Explora eventos y realiza tu primera compra
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="text-left px-6 py-4 text-slate-900 dark:text-white text-sm font-semibold">Fecha</th>
                      <th className="text-left px-6 py-4 text-slate-900 dark:text-white text-sm font-semibold">Evento</th>
                      <th className="text-left px-6 py-4 text-slate-900 dark:text-white text-sm font-semibold">Boletos</th>
                      <th className="text-left px-6 py-4 text-slate-900 dark:text-white text-sm font-semibold">Total</th>
                      <th className="text-left px-6 py-4 text-slate-900 dark:text-white text-sm font-semibold">Método</th>
                      <th className="text-left px-6 py-4 text-slate-900 dark:text-white text-sm font-semibold">Estado</th>
                      <th className="text-left px-6 py-4 text-slate-900 dark:text-white text-sm font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredCompras.map((compra) => {
                      const badge = getStatusBadge(compra.status);
                      return (
                        <tr key={compra.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-6 py-4 text-slate-900 dark:text-white text-sm">
                            {formatDate(compra.fechaCompra)}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-slate-900 dark:text-white text-sm font-medium">
                              {compra.eventoNombre}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-slate-900 dark:text-white text-sm">
                            {compra.cantidadBoletos} {compra.cantidadBoletos === 1 ? 'boleto' : 'boletos'}
                          </td>
                          <td className="px-6 py-4 text-slate-900 dark:text-white text-sm font-semibold">
                            ${compra.total.toLocaleString('es-CO')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                              <span className="material-symbols-outlined text-base">
                                {getMetodoPagoIcon(compra.metodoPago)}
                              </span>
                              <span className="capitalize">{compra.metodoPago}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                              {badge.text}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Link href={`/usuario/boletos?compraId=${compra.id}`}>
                              <button className="text-primary hover:text-primary/80 text-sm font-medium">
                                Ver Boletos
                              </button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                {filteredCompras.map((compra) => {
                  const badge = getStatusBadge(compra.status);
                  return (
                    <div key={compra.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-slate-900 dark:text-white text-sm font-bold">
                            {compra.eventoNombre}
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                            {formatDate(compra.fechaCompra)}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Boletos</p>
                          <p className="text-slate-900 dark:text-white font-medium">
                            {compra.cantidadBoletos}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Total</p>
                          <p className="text-slate-900 dark:text-white font-semibold">
                            ${compra.total.toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                        <span className="material-symbols-outlined text-base">
                          {getMetodoPagoIcon(compra.metodoPago)}
                        </span>
                        <span className="capitalize">{compra.metodoPago}</span>
                      </div>

                      <Link href={`/usuario/boletos?compraId=${compra.id}`}>
                        <button className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90">
                          Ver Boletos
                        </button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function HistorialCompras() {
  return (
    <ProtectedRoute>
      <HistorialComprasContent />
    </ProtectedRoute>
  );
}
