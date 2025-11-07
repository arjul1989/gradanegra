'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { reportesAPI } from '@/lib/api';
import { Download, FileText, DollarSign, TrendingUp } from 'lucide-react';

interface ReporteComisiones {
  resumen: {
    totalComercios: number;
    totalCompras: number;
    totalBoletos: number;
    ingresosBrutosTotales: number;
    comisionesTotales: number;
    comisionPromedio: number;
    periodo: {
      inicio: Date;
      fin: Date;
    };
  };
  detalles: Array<{
    comercioId: string;
    comercioNombre: string;
    tipoPlan: string;
    ciudad: string;
    comisionPorcentaje: number;
    esComisionCustom: boolean;
    cantidadCompras: number;
    cantidadBoletos: number;
    ingresosBrutos: number;
    comisionGenerada: number;
  }>;
}

export default function ReportesPage() {
  const { getToken } = useAuth();
  const [reporte, setReporte] = useState<ReporteComisiones | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoPlan, setTipoPlan] = useState('');
  const [ciudad, setCiudad] = useState('');

  useEffect(() => {
    // Set default dates (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setFechaInicio(firstDay.toISOString().split('T')[0]);
    setFechaFin(now.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      loadReporte();
    }
  }, [fechaInicio, fechaFin, tipoPlan, ciudad]);

  const loadReporte = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const params: any = {
        fechaInicio,
        fechaFin,
      };
      if (tipoPlan) params.tipoPlan = tipoPlan;
      if (ciudad) params.ciudad = ciudad;

      const data: any = await reportesAPI.getComisiones(token, params);
      setReporte(data);
    } catch (error) {
      console.error('Error loading reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (formato: 'csv' | 'excel' | 'pdf') => {
    try {
      setExporting(true);
      const token = await getToken();
      if (!token) return;

      const params: any = {
        fechaInicio,
        fechaFin,
      };
      if (tipoPlan) params.tipoPlan = tipoPlan;
      if (ciudad) params.ciudad = ciudad;

      const blob = await reportesAPI.exportar(token, formato, params);
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_comisiones_${fechaInicio}_${fechaFin}.${formato}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(error.message || 'Error al exportar');
    } finally {
      setExporting(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-white mb-2">Reportes y Comisiones</h1>
        <p className="text-slate-400">Análisis financiero de la plataforma</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Plan
            </label>
            <select
              value={tipoPlan}
              onChange={(e) => setTipoPlan(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Ciudad
            </label>
            <input
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Filtrar por ciudad"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting || !reporte}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Cargando reporte...</div>
        </div>
      ) : reporte ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-white">{reporte.resumen.totalComercios}</p>
              <p className="text-sm text-slate-400">Comercios</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(reporte.resumen.totalBoletos)}</p>
              <p className="text-sm text-slate-400">Boletos Vendidos</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(reporte.resumen.ingresosBrutosTotales)}</p>
              <p className="text-sm text-slate-400">Ingresos Brutos</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(reporte.resumen.comisionesTotales)}</p>
              <p className="text-sm text-slate-400">Comisiones Totales</p>
              <p className="text-xs text-slate-500 mt-1">Promedio: {formatCurrency(reporte.resumen.comisionPromedio)}</p>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Detalle por Comercio</h3>
            </div>
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
                      Ciudad
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Compras
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Boletos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Ingresos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Comisión %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Comisión $
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {reporte.detalles.map((detalle) => (
                    <tr key={detalle.comercioId} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{detalle.comercioNombre}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300 text-sm uppercase">{detalle.tipoPlan}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300 text-sm">{detalle.ciudad || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white">{formatNumber(detalle.cantidadCompras)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white">{formatNumber(detalle.cantidadBoletos)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-medium">{formatCurrency(detalle.ingresosBrutos)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <span className="text-white">{detalle.comisionPorcentaje}%</span>
                          {detalle.esComisionCustom && (
                            <span className="text-xs text-purple-400">custom</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-green-400 font-semibold">{formatCurrency(detalle.comisionGenerada)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
