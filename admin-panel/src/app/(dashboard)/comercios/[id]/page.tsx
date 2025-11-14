'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { comerciosAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import {
  ArrowLeft,
  Settings,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit
} from 'lucide-react';
import CustomPlanModal from '@/components/CustomPlanModal';

export default function ComercioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, claims } = useAuth();
  const router = useRouter();
  const [comercio, setComercio] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const isSuperAdmin = claims?.adminRole === 'super_admin';

  useEffect(() => {
    loadComercio();
  }, [id]);

  const loadComercio = async () => {
    try {
      const token = await getToken();
      // In production we require a token. In development allow null so the
      // backend dev-bypass (`X-Dev-Admin`) can be used.
      if (!token && process.env.NODE_ENV === 'production') return;

      const [comercioData, estadisticasData, eventosData] = await Promise.all([
        comerciosAPI.getById(token, id),
        comerciosAPI.getEstadisticas(token, id),
        comerciosAPI.getEventos(token, id, { limit: 10 }),
      ]);

      setComercio(comercioData);
      setEstadisticas(estadisticasData);
      setEventos((eventosData as any).eventos || []);
    } catch (error) {
      console.error('Error loading comercio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (data: any) => {
    try {
      const token = await getToken();
      if (!token && process.env.NODE_ENV === 'production') return;

      await comerciosAPI.updatePlan(token, id, data);
      await loadComercio(); // Reload data
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  };

  const handleChangeStatus = async (status: string) => {
    if (!confirm(`¿Estás seguro de cambiar el estado a ${status}?`)) return;

    const motivo = prompt('Motivo del cambio (opcional):');
    
    try {
      const token = await getToken();
      if (!token && process.env.NODE_ENV === 'production') return;

      await comerciosAPI.updateEstado(token, id, status, motivo || undefined);
      await loadComercio();
    } catch (error: any) {
      alert(error.message || 'Error al cambiar estado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Cargando comercio...</div>
      </div>
    );
  }

  if (!comercio) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Comercio no encontrado</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

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
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${styles}`}>
        <Icon className="w-4 h-4" />
        <span>{status.toUpperCase()}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{comercio.nombre}</h1>
            <p className="text-slate-400">{comercio.email}</p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(comercio.status)}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-white">{estadisticas?.totalEventos || 0}</p>
          <p className="text-sm text-slate-400">Eventos Totales</p>
          <p className="text-xs text-slate-500 mt-1">{estadisticas?.eventosActivos || 0} activos</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-white">{estadisticas?.boletosVendidos || 0}</p>
          <p className="text-sm text-slate-400">Boletos Vendidos</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(estadisticas?.ingresosBrutos || 0)}</p>
          <p className="text-sm text-slate-400">Ingresos Brutos</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(estadisticas?.comisionesGeneradas || 0)}</p>
          <p className="text-sm text-slate-400">Comisiones Generadas</p>
          <p className="text-xs text-slate-500 mt-1">{estadisticas?.comisionPorcentaje || 0}%</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Configuration */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Configuración del Plan</h3>
              {isSuperAdmin && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Plan Base</p>
                <p className="text-white font-medium uppercase">{comercio.tipoPlan}</p>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Eventos</span>
                    <div className="text-right">
                      <span className="text-white font-medium">
                        {comercio.limiteEventosEfectivo === -1 ? '∞' : comercio.limiteEventosEfectivo}
                      </span>
                      {comercio.limiteEventosCustom !== undefined && (
                        <span className="ml-2 text-xs text-purple-400">custom</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Destacados</span>
                    <div className="text-right">
                      <span className="text-white font-medium">
                        {comercio.limiteDestacadosEfectivo === -1 ? '∞' : comercio.limiteDestacadosEfectivo}
                      </span>
                      {comercio.limiteDestacadosCustom !== undefined && (
                        <span className="ml-2 text-xs text-purple-400">custom</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Usuarios</span>
                    <div className="text-right">
                      <span className="text-white font-medium">
                        {comercio.limiteUsuariosEfectivo === -1 ? '∞' : comercio.limiteUsuariosEfectivo}
                      </span>
                      {comercio.limiteUsuariosCustom !== undefined && (
                        <span className="ml-2 text-xs text-purple-400">custom</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Comisión</span>
                    <div className="text-right">
                      <span className="text-white font-medium">{comercio.comisionEfectiva}%</span>
                      {comercio.comisionCustom !== undefined && (
                        <span className="ml-2 text-xs text-purple-400">custom</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isSuperAdmin && comercio.status !== 'suspendido' && (
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-sm text-slate-400 mb-2">Cambiar Estado</p>
                  <div className="flex gap-2">
                    {comercio.status !== 'activo' && (
                      <button
                        onClick={() => handleChangeStatus('activo')}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Activar
                      </button>
                    )}
                    {comercio.status !== 'inactivo' && (
                      <button
                        onClick={() => handleChangeStatus('inactivo')}
                        className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Desactivar
                      </button>
                    )}
                    <button
                      onClick={() => handleChangeStatus('suspendido')}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Suspender
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Eventos */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Eventos Recientes</h3>
            
            {eventos.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No hay eventos</p>
            ) : (
              <div className="space-y-3">
                {eventos.map((evento) => (
                  <div key={evento.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">{evento.nombre}</p>
                      <p className="text-sm text-slate-400">{evento.ciudad}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        evento.status === 'activo' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {evento.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Plan Modal */}
      <CustomPlanModal
        comercio={comercio}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleUpdatePlan}
      />
    </div>
  );
}
