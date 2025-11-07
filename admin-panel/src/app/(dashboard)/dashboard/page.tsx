'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { dashboardAPI } from '@/lib/api';
import { 
  TrendingUp, 
  Store, 
  Calendar, 
  Ticket,
  DollarSign,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Metricas {
  comerciosActivos: number;
  eventosActivos: number;
  boletosVendidos: number;
  comisionesTotales: number;
  comparaciones?: {
    comercios: number;
    eventos: number;
    boletos: number;
    comisiones: number;
  };
}

interface Ingresos {
  mes: string;
  ingresos: number;
  comisiones: number;
}

interface Planes {
  free: { cantidad: number; porcentaje: number };
  basic: { cantidad: number; porcentaje: number };
  pro: { cantidad: number; porcentaje: number };
  enterprise: { cantidad: number; porcentaje: number };
}

interface TopComercio {
  comercioId: string;
  nombre: string;
  tipoPlan: string;
  totalVentas: number;
  cantidadBoletos: number;
  comisiones: number;
}

interface Actividad {
  adminEmail: string;
  accion: string;
  entidad: string;
  timestamp: any;
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [ingresos, setIngresos] = useState<Ingresos[]>([]);
  const [planes, setPlanes] = useState<Planes | null>(null);
  const [topComercios, setTopComercios] = useState<TopComercio[]>([]);
  const [actividad, setActividad] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [metricasData, ingresosData, planesData, topData, actividadData] = await Promise.all([
        dashboardAPI.getMetricas(token),
        dashboardAPI.getIngresos(token, '30d'),
        dashboardAPI.getPlanes(token),
        dashboardAPI.getTopComercios(token, '30d', 5),
        dashboardAPI.getActividad(token, 5),
      ]);

      setMetricas(metricasData as Metricas);
      setIngresos(ingresosData as Ingresos[]);
      setPlanes(planesData as Planes);
      setTopComercios(topData as TopComercio[]);
      setActividad(actividadData as Actividad[]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Cargando dashboard...</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-MX').format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Vista general de la plataforma</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Comercios Activos"
          value={metricas?.comerciosActivos || 0}
          icon={Store}
          change={metricas?.comparaciones?.comercios}
          color="blue"
        />
        <MetricCard
          title="Eventos Activos"
          value={metricas?.eventosActivos || 0}
          icon={Calendar}
          change={metricas?.comparaciones?.eventos}
          color="purple"
        />
        <MetricCard
          title="Boletos Vendidos"
          value={metricas?.boletosVendidos || 0}
          icon={Ticket}
          change={metricas?.comparaciones?.boletos}
          color="green"
        />
        <MetricCard
          title="Comisiones Totales"
          value={formatCurrency(metricas?.comisionesTotales || 0)}
          icon={DollarSign}
          change={metricas?.comparaciones?.comisiones}
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Ingresos y Comisiones (30 días)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ingresos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Line type="monotone" dataKey="ingresos" stroke="#8B5CF6" strokeWidth={2} />
              <Line type="monotone" dataKey="comisiones" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plans Distribution */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Distribución por Planes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { plan: 'Free', cantidad: planes?.free.cantidad || 0 },
              { plan: 'Basic', cantidad: planes?.basic.cantidad || 0 },
              { plan: 'Pro', cantidad: planes?.pro.cantidad || 0 },
              { plan: 'Enterprise', cantidad: planes?.enterprise.cantidad || 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="plan" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Bar dataKey="cantidad" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Merchants & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Merchants */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Comercios (30 días)</h3>
          <div className="space-y-3">
            {topComercios.map((comercio, index) => (
              <div key={comercio.comercioId} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-slate-500">#{index + 1}</span>
                  <div>
                    <p className="text-white font-medium">{comercio.nombre}</p>
                    <p className="text-sm text-slate-400">{comercio.tipoPlan.toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{formatCurrency(comercio.totalVentas)}</p>
                  <p className="text-sm text-green-400">{formatCurrency(comercio.comisiones)} comisión</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {actividad.map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-slate-700/50 rounded-lg">
                <div className="w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{item.accion}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {item.adminEmail} · {item.entidad}
                  </p>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(item.timestamp).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  change?: number;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
  }[color];

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-slate-400">{title}</p>
    </div>
  );
}
