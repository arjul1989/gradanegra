'use client'

import { useState, useEffect } from 'react'
import { useComercio } from '@/contexts/ComercioContext'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface EstadisticasData {
  totalEventosCreados: number
  eventosActivos: number
  totalBoletosVendidos: number
  tasaOcupacionPromedio: number
  ingresosBrutos: number
  comisionesPagadas: number
  ingresosNetos: number
  ventasPorMes: { mes: string; ventas: number; ingresos: number }[]
  eventosPorVentas: { nombre: string; ventas: number; ingresos: number }[]
  ventasPorTier: { nombre: string; cantidad: number; porcentaje: number }[]
  ocupacionPorEvento: { nombre: string; vendidos: number; total: number; ocupacion: number }[]
}

export default function EstadisticasPage() {
  const { comercio } = useComercio()
  const [estadisticas, setEstadisticas] = useState<EstadisticasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [eventoSeleccionado, setEventoSeleccionado] = useState('')
  const [eventos, setEventos] = useState<any[]>([])

  useEffect(() => {
    // Establecer fechas por defecto (últimos 30 días)
    const hoy = new Date()
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setFechaFin(hoy.toISOString().split('T')[0])
    setFechaInicio(hace30Dias.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (comercio?.id && fechaInicio && fechaFin) {
      fetchEstadisticas()
      fetchEventos()
    }
  }, [comercio, fechaInicio, fechaFin, eventoSeleccionado])

  const fetchEventos = async () => {
    if (!comercio?.id) return

    try {
      const response = await fetch(`${API_URL}/api/comercios/${comercio.id}/eventos?limit=100`)
      if (!response.ok) throw new Error('Error al cargar eventos')
      
      const data = await response.json()
      setEventos(data.eventos || [])
    } catch (error) {
      console.error('Error fetching eventos:', error)
    }
  }

  const fetchEstadisticas = async () => {
    if (!comercio?.id) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin
      })
      
      if (eventoSeleccionado) {
        params.append('eventoId', eventoSeleccionado)
      }

      const response = await fetch(`${API_URL}/api/comercios/${comercio.id}/estadisticas?${params}`)
      if (!response.ok) throw new Error('Error al cargar estadísticas')
      
      const data = await response.json()
      setEstadisticas(data)
    } catch (error) {
      console.error('Error fetching estadisticas:', error)
      alert('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!estadisticas) return

    const csvData = [
      ['ESTADÍSTICAS GRADA NEGRA'],
      ['Comercio:', comercio?.nombre || ''],
      ['Período:', `${fechaInicio} a ${fechaFin}`],
      [''],
      ['RESUMEN GENERAL'],
      ['Total Eventos Creados', estadisticas.totalEventosCreados],
      ['Eventos Activos', estadisticas.eventosActivos],
      ['Total Boletos Vendidos', estadisticas.totalBoletosVendidos],
      ['Tasa Ocupación Promedio', `${estadisticas.tasaOcupacionPromedio.toFixed(2)}%`],
      ['Ingresos Brutos', formatCurrency(estadisticas.ingresosBrutos)],
      ['Comisiones Pagadas', formatCurrency(estadisticas.comisionesPagadas)],
      ['Ingresos Netos', formatCurrency(estadisticas.ingresosNetos)],
      [''],
      ['EVENTOS POR VENTAS'],
      ['Evento', 'Boletos Vendidos', 'Ingresos'],
      ...estadisticas.eventosPorVentas.map(e => [e.nombre, e.ventas, e.ingresos]),
      [''],
      ['OCUPACIÓN POR EVENTO'],
      ['Evento', 'Vendidos', 'Total', 'Ocupación %'],
      ...estadisticas.ocupacionPorEvento.map(e => [e.nombre, e.vendidos, e.total, e.ocupacion.toFixed(2)])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `estadisticas_${comercio?.slug}_${fechaInicio}_${fechaFin}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading && !estadisticas) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Estadísticas</h1>
          <p className="text-gray-400 mt-1">Analiza el rendimiento de tus eventos</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={!estadisticas}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">download</span>
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-[#1b1f27] rounded-xl border border-gray-700 shadow-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-4 py-2 bg-[#282e39] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-4 py-2 bg-[#282e39] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Evento Específico
            </label>
            <select
              value={eventoSeleccionado}
              onChange={(e) => setEventoSeleccionado(e.target.value)}
              className="w-full px-4 py-2 bg-[#282e39] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
            >
              <option value="">Todos los eventos</option>
              {eventos.map(evento => (
                <option key={evento.id} value={evento.id}>
                  {evento.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {estadisticas ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#1b1f27] border border-gray-700 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-blue-500 text-3xl">event</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-400 mb-1">Total Eventos</h3>
              <p className="text-3xl font-bold text-white">{estadisticas.totalEventosCreados}</p>
              <p className="text-xs text-green-500 mt-2">
                {estadisticas.eventosActivos} activos
              </p>
            </div>

            <div className="bg-[#1b1f27] border border-gray-700 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-green-500 text-3xl">confirmation_number</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-400 mb-1">Boletos Vendidos</h3>
              <p className="text-3xl font-bold text-white">
                {estadisticas.totalBoletosVendidos.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {estadisticas.tasaOcupacionPromedio.toFixed(1)}% ocupación promedio
              </p>
            </div>

            <div className="bg-[#1b1f27] border border-gray-700 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-purple-500 text-3xl">payments</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-400 mb-1">Ingresos Brutos</h3>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(estadisticas.ingresosBrutos)}
              </p>
              <p className="text-xs text-red-500 mt-2">
                -{formatCurrency(estadisticas.comisionesPagadas)} comisión
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-6 text-white border border-green-500">
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
              </div>
              <h3 className="text-sm font-semibold mb-1">Ingresos Netos</h3>
              <p className="text-3xl font-bold">
                {formatCurrency(estadisticas.ingresosNetos)}
              </p>
              <p className="text-xs mt-2 opacity-90">
                Después de comisiones
              </p>
            </div>
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ventas por Mes */}
            <div className="bg-[#1b1f27] border border-gray-700 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-white mb-4">Ventas por Mes</h2>
              {estadisticas.ventasPorMes.length > 0 ? (
                <div className="space-y-3">
                  {estadisticas.ventasPorMes.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.mes}</span>
                        <span className="text-sm font-bold text-white">
                          {item.ventas} boletos
                        </span>
                      </div>
                      <div className="w-full bg-[#282e39] rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-[#0d59f2] to-blue-600 h-3 rounded-full transition-all"
                          style={{
                            width: `${Math.min((item.ventas / Math.max(...estadisticas.ventasPorMes.map(v => v.ventas))) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatCurrency(item.ingresos)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2 text-gray-500">show_chart</span>
                  <p>No hay datos de ventas</p>
                </div>
              )}
            </div>

            {/* Ventas por Tier */}
            <div className="bg-[#1b1f27] border border-gray-700 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-white mb-4">Ventas por Tipo de Entrada</h2>
              {estadisticas.ventasPorTier.length > 0 ? (
                <div className="space-y-3">
                  {estadisticas.ventasPorTier.map((item, index) => {
                    const colors = [
                      'from-purple-500 to-purple-600',
                      'from-blue-500 to-blue-600',
                      'from-green-500 to-green-600',
                      'from-yellow-500 to-yellow-600',
                      'from-red-500 to-red-600'
                    ]
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{item.nombre}</span>
                          <span className="text-sm font-bold text-white">
                            {item.cantidad} ({item.porcentaje.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#282e39] rounded-full h-3">
                          <div
                            className={`bg-gradient-to-r ${colors[index % colors.length]} h-3 rounded-full transition-all`}
                            style={{ width: `${item.porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2 text-gray-500">pie_chart</span>
                  <p>No hay datos de tiers</p>
                </div>
              )}
            </div>
          </div>

          {/* Eventos por Ventas */}
          <div className="bg-[#1b1f27] border border-gray-700 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">Eventos Más Vendidos</h2>
            {estadisticas.eventosPorVentas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white">#</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white">Evento</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-white">Boletos Vendidos</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-white">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadisticas.eventosPorVentas.map((evento, index) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-[#282e39]">
                        <td className="py-3 px-4 text-sm text-gray-400">{index + 1}</td>
                        <td className="py-3 px-4 text-sm font-medium text-white">{evento.nombre}</td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-white">
                          {evento.ventas.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-green-500">
                          {formatCurrency(evento.ingresos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2 text-gray-500">bar_chart</span>
                <p>No hay datos de eventos</p>
              </div>
            )}
          </div>

          {/* Ocupación por Evento */}
          <div className="bg-[#1b1f27] border border-gray-700 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">Tasa de Ocupación por Evento</h2>
            {estadisticas.ocupacionPorEvento.length > 0 ? (
              <div className="space-y-4">
                {estadisticas.ocupacionPorEvento.map((evento, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{evento.nombre}</span>
                      <span className="text-sm font-bold text-white">
                        {evento.vendidos} / {evento.total} ({evento.ocupacion.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#282e39] rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all ${
                          evento.ocupacion === 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                          evento.ocupacion >= 75 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                          'bg-gradient-to-r from-[#0d59f2] to-blue-600'
                        }`}
                        style={{ width: `${Math.min(evento.ocupacion, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2 text-gray-500">analytics</span>
                <p>No hay datos de ocupación</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-[#1b1f27] border border-gray-700 rounded-xl shadow-lg p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-gray-700 mb-4">
            query_stats
          </span>
          <h3 className="text-xl font-semibold text-white mb-2">
            No hay datos disponibles
          </h3>
          <p className="text-gray-400 mb-6">
            Selecciona un rango de fechas para ver las estadísticas
          </p>
        </div>
      )}
    </div>
  )
}
