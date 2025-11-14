"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface PaymentRecord {
  id: string;
  mercadoPagoId: string;
  externalReference: string;
  status: string;
  statusDetail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentMethodId: string;
  payerEmail: string;
  payerFirstName: string;
  payerLastName: string;
  comercioId: string;
  eventoId: string;
  compraId: string;
  createdAt: string;
  updatedAt: string;
  processedAt: string;
  approvedAt: string;
  rejectedAt: string;
  processor: string;
}

interface PaymentStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  cancelled: number;
  refunded: number;
  totalAmount: number;
  approvedAmount: number;
  paymentMethods: Record<string, number>;
  processor: string;
}

export default function AdminPagosPage() {
  const { user } = useAuth();
  const [comercioId, setComercioId] = useState<string>("");
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PaymentRecord[]>([]);
  const [rejectedPayments, setRejectedPayments] = useState<PaymentRecord[]>([]);
  const [approvedPayments, setApprovedPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'pending' | 'rejected' | 'approved'>('summary');
  const [timeRange, setTimeRange] = useState('30d');

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO');
  };

  // Obtener estado del pago con color
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-500', label: 'Pendiente' },
      approved: { color: 'bg-green-500', label: 'Aprobado' },
      rejected: { color: 'bg-red-500', label: 'Rechazado' },
      cancelled: { color: 'bg-gray-500', label: 'Cancelado' },
      refunded: { color: 'bg-blue-500', label: 'Reembolsado' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-400', label: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Obtener método de pago con icono
  const getPaymentMethodIcon = (method: string) => {
    const methodIcons: Record<string, string> = {
      card: '💳',
      pse: '🏦',
      efecty: '🏪',
      visa: '💳',
      mastercard: '💳',
      amex: '💳'
    };
    
    return methodIcons[method] || '💰';
  };

  // Cargar estadísticas de pagos
  const loadPaymentStats = async () => {
    if (!comercioId) return;

    try {
      const response = await fetch(`${API_URL}/api/payments-admin/summary/${comercioId}?timeRange=${timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Cargar pagos por estado
  const loadPaymentsByStatus = async (status: 'pending' | 'rejected' | 'approved') => {
    if (!comercioId) return;

    try {
      const response = await fetch(`${API_URL}/api/payments-admin/${status}/${comercioId}?limit=50`);
      const data = await response.json();
      
      if (data.success) {
        if (status === 'pending') setPendingPayments(data.data);
        if (status === 'rejected') setRejectedPayments(data.data);
        if (status === 'approved') setApprovedPayments(data.data);
      }
    } catch (error) {
      console.error(`Error cargando pagos ${status}:`, error);
    }
  };

  // Cargar datos cuando cambie el comercio o timeRange
  useEffect(() => {
    if (comercioId) {
      loadPaymentStats();
      if (activeTab !== 'summary') {
        loadPaymentsByStatus(activeTab);
      }
    }
  }, [comercioId, timeRange, activeTab]);

  const handleTabChange = (tab: 'summary' | 'pending' | 'rejected' | 'approved') => {
    setActiveTab(tab);
    if (tab !== 'summary') {
      loadPaymentsByStatus(tab);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/admin"
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Volver al Panel
            </Link>
            <h1 className="text-3xl font-bold text-white">Panel de Pagos</h1>
          </div>

          {/* Selector de Comercio */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ID del Comercio
            </label>
            <input
              type="text"
              value={comercioId}
              onChange={(e) => setComercioId(e.target.value)}
              placeholder="Ingresa el ID del comercio para ver sus estadísticas"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filtros */}
          {comercioId && (
            <div className="flex gap-4 mb-6">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
            </div>
          )}
        </div>

        {/* Tabs */}
        {comercioId && (
          <div className="mb-6">
            <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg w-fit">
              {[
                { key: 'summary', label: 'Resumen', icon: '📊' },
                { key: 'pending', label: 'Pendientes', icon: '⏳' },
                { key: 'rejected', label: 'Rechazados', icon: '❌' },
                { key: 'approved', label: 'Aprobados', icon: '✅' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'bg-primary text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contenido de las tabs */}
        {comercioId ? (
          <div className="space-y-6">
            
            {/* Tab: Resumen */}
            {activeTab === 'summary' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Estadísticas principales */}
                <div className="bg-slate-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Pagos</p>
                      <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <span className="text-2xl">💰</span>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Pagos Aprobados</p>
                      <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
                    </div>
                    <span className="text-2xl">✅</span>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Recaudado</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(stats.approvedAmount)}</p>
                    </div>
                    <span className="text-2xl">💵</span>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Procesador</p>
                      <p className="text-lg font-bold text-white">{stats.processor}</p>
                    </div>
                    <span className="text-2xl">🏪</span>
                  </div>
                </div>

                {/* Métodos de pago */}
                <div className="md:col-span-2 lg:col-span-4 bg-slate-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Métodos de Pago</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(stats.paymentMethods).map(([method, count]) => (
                      <div key={method} className="flex items-center gap-2 bg-slate-700 rounded-lg p-3">
                        <span className="text-xl">{getPaymentMethodIcon(method)}</span>
                        <div>
                          <p className="text-white font-medium capitalize">{method}</p>
                          <p className="text-slate-300 text-sm">{count} pagos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Pagos Pendientes */}
            {activeTab === 'pending' && (
              <div className="bg-slate-800 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-white">Pagos Pendientes ({pendingPayments.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Método</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Comprador</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">ID MP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {pendingPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-700/50">
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            <div className="flex items-center gap-2">
                              <span>{getPaymentMethodIcon(payment.paymentMethod)}</span>
                              <span className="capitalize">{payment.paymentMethod}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300 font-medium">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            <div>
                              <p className="font-medium">{payment.payerFirstName} {payment.payerLastName}</p>
                              <p className="text-slate-400">{payment.payerEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                            {payment.mercadoPagoId?.substring(0, 8)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Pagos Rechazados */}
            {activeTab === 'rejected' && (
              <div className="bg-slate-800 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-white">Pagos Rechazados ({rejectedPayments.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Método</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Comprador</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {rejectedPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-700/50">
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            <div className="flex items-center gap-2">
                              <span>{getPaymentMethodIcon(payment.paymentMethod)}</span>
                              <span className="capitalize">{payment.paymentMethod}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300 font-medium">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            <div>
                              <p className="font-medium">{payment.payerFirstName} {payment.payerLastName}</p>
                              <p className="text-slate-400">{payment.payerEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {payment.statusDetail || 'Sin detalle'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Pagos Aprobados */}
            {activeTab === 'approved' && (
              <div className="bg-slate-800 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-white">Pagos Aprobados ({approvedPayments.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Método</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Comprador</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">ID Compra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {approvedPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-700/50">
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            <div className="flex items-center gap-2">
                              <span>{getPaymentMethodIcon(payment.paymentMethod)}</span>
                              <span className="capitalize">{payment.paymentMethod}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300 font-medium">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            <div>
                              <p className="font-medium">{payment.payerFirstName} {payment.payerLastName}</p>
                              <p className="text-slate-400">{payment.payerEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                            {payment.externalReference?.substring(0, 8)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-400 text-lg">
              Ingresa un ID de comercio para ver las estadísticas de pagos
            </div>
          </div>
        )}
      </div>
    </div>
  );
}