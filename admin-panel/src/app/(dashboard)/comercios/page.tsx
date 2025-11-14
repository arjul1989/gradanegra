'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { comerciosAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter,
  Eye,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Comercio {
  id: string;
  nombre: string;
  email: string;
  tipoPlan: string;
  status: string;
  eventosActivos: number;
  ventasMesActual: number;
  limiteEventosEfectivo: number;
  comisionEfectiva: number;
}

export default function ComerciosPage() {
  const { getToken, claims } = useAuth();
  const router = useRouter();
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  useEffect(() => {
    loadComercios();
  }, [statusFilter, planFilter]);

  const loadComercios = async () => {
    try {
      const token = await getToken();
      // If there's no token in development, allow dev bypass so local testing
      // can proceed using the backend `X-Dev-Admin` header. In production we
      // must require a token.
      if (!token && process.env.NODE_ENV === 'production') return;

      const params: any = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (planFilter) params.tipoPlan = planFilter;

  const data: any = await comerciosAPI.getList(token, params);
      setComercios(data.comercios || []);
    } catch (error) {
      console.error('Error loading comercios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComercios = comercios.filter(c => 
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      activo: 'bg-green-500/10 text-green-500 border-green-500/20',
      inactivo: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      suspendido: 'bg-red-500/10 text-red-500 border-red-500/20',
    }[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';

    const Icon = {
      activo: CheckCircle,
      inactivo: XCircle,
      suspendido: AlertCircle,
    }[status] || XCircle;

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${styles}`}>
        <Icon className="w-3 h-3" />
        <span>{status.toUpperCase()}</span>
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      basic: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      pro: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      enterprise: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    }[plan] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${colors}`}>
        {plan.toUpperCase()}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Cargando comercios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Comercios</h1>
          <p className="text-slate-400">Gestiona todos los comercios de la plataforma</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos los planes</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Comercio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Eventos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Ventas (mes)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Comisión
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredComercios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No se encontraron comercios
                  </td>
                </tr>
              ) : (
                filteredComercios.map((comercio) => (
                  <tr 
                    key={comercio.id} 
                    className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/comercios/${comercio.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{comercio.nombre}</p>
                        <p className="text-sm text-slate-400">{comercio.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPlanBadge(comercio.tipoPlan)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(comercio.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">
                        {comercio.eventosActivos} / {comercio.limiteEventosEfectivo === -1 ? '∞' : comercio.limiteEventosEfectivo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">
                        {formatCurrency(comercio.ventasMesActual)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400 font-medium">
                        {comercio.comisionEfectiva}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/comercios/${comercio.id}`);
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">Ver</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          Mostrando {filteredComercios.length} de {comercios.length} comercios
        </span>
      </div>
    </div>
  );
}
