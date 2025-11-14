'use client'

import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Reporte {
  nombreComercio: string
  plan: string
  tasaComision: number
  tasaComisionCustom?: number
  ingresosGenerados: number
  comisionesGradaNegra: number
}

interface Metricas {
  ingresosBrutos: number
  comisionesTotales: number
  ingresosNetos: number
  comprasTotales: number
}

export default function ReportesPage() {
  const [loading, setLoading] = useState(true)
  const [metricas, setMetricas] = useState<Metricas>({
    ingresosBrutos: 0,
    comisionesTotales: 0,
    ingresosNetos: 0,
    comprasTotales: 0
  })
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [filterMerchant, setFilterMerchant] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    setFechaFin(today.toISOString().split('T')[0])
    setFechaInicio(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      loadReportes()
    }
  }, [fechaInicio, fechaFin, filterMerchant, filterPlan, page])

  const loadReportes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin,
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString()
      })

      if (filterMerchant !== 'all') {
        params.append('comercioId', filterMerchant)
      }
      if (filterPlan !== 'all') {
        params.append('plan', filterPlan)
      }

      const response = await fetch(`${API_URL}/api/admin/reportes/comisiones?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setReportes(data.reportes || [])
        if (data.metricas) {
          setMetricas(data.metricas)
        }
      }
    } catch (error) {
      console.error('Error cargando reportes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin,
        formato: 'csv'
      })
      
      if (filterMerchant !== 'all') params.append('comercioId', filterMerchant)
      if (filterPlan !== 'all') params.append('plan', filterPlan)

      window.open(`${API_URL}/api/admin/reportes/exportar?${params}`, '_blank')
    } catch (error) {
      console.error('Error exportando CSV:', error)
    }
  }

  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin,
        formato: 'pdf'
      })
      
      if (filterMerchant !== 'all') params.append('comercioId', filterMerchant)
      if (filterPlan !== 'all') params.append('plan', filterPlan)

      window.open(`${API_URL}/api/admin/reportes/exportar?${params}`, '_blank')
    } catch (error) {
      console.error('Error exportando PDF:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2
    }).format(value)
  }

  const getPlanBadge = (plan: string) => {
    const badges = {
      free: 'bg-gray-500/20 text-gray-400',
      basic: 'bg-gray-500/20 text-gray-300',
      pro: 'bg-green-500/20 text-green-400',
      premium: 'bg-purple-500/20 text-purple-400',
      enterprise: 'bg-blue-500/20 text-blue-400'
    }
    return badges[plan as keyof typeof badges] || badges.free
  }

  const getPlanLabel = (plan: string) => {
    const labels = {
      free: 'Free',
      basic: 'Básico',
      pro: 'Pro',
      premium: 'Premium',
      enterprise: 'Enterprise'
    }
    return labels[plan as keyof typeof labels] || plan
  }

  return (
    <div className="p-8">
      {/* Page Heading */}
      <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Reporte Financiero</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#282e39] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#3b4354] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
          >
            <span className="material-symbols-outlined text-lg mr-2">download</span>
            <span className="truncate">Exportar CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#0d59f2] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
          >
            <span className="material-symbols-outlined text-lg mr-2">picture_as_pdf</span>
            <span className="truncate">Exportar PDF</span>
          </button>
        </div>
      </header>

      {/* Filters Section */}
      <div className="bg-[#282e39] rounded-xl p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Date Range */}
          <div className="flex flex-col gap-2">
            <label className="text-[#9ca6ba] text-xs font-bold uppercase">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="h-10 px-3 bg-[#101622] rounded-lg text-white text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[#9ca6ba] text-xs font-bold uppercase">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="h-10 px-3 bg-[#101622] rounded-lg text-white text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
            />
          </div>

          {/* Filter by Plan */}
          <div className="flex flex-col gap-2">
            <label className="text-[#9ca6ba] text-xs font-bold uppercase">Filtrar por Plan</label>
            <div className="relative">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-lg bg-[#101622] px-3 text-white text-sm appearance-none border border-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
              >
                <option value="all">Todos los Planes</option>
                <option value="free">Free</option>
                <option value="basic">Básico</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <span className="material-symbols-outlined text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">arrow_drop_down</span>
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={loadReportes}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#0d59f2] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
          >
            <span className="truncate">Aplicar Filtros</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#282e39] rounded-xl p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[#9ca6ba]">
            <p className="text-sm font-medium">Ingresos Brutos</p>
            <span className="material-symbols-outlined text-xl">paid</span>
          </div>
          <p className="text-white text-3xl font-bold leading-tight">{formatCurrency(metricas.ingresosBrutos)}</p>
        </div>
        
        <div className="bg-[#282e39] rounded-xl p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[#9ca6ba]">
            <p className="text-sm font-medium">Comisiones Totales</p>
            <span className="material-symbols-outlined text-xl">percent</span>
          </div>
          <p className="text-white text-3xl font-bold leading-tight">{formatCurrency(metricas.comisionesTotales)}</p>
        </div>
        
        <div className="bg-[#282e39] rounded-xl p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[#9ca6ba]">
            <p className="text-sm font-medium">Ingresos Netos</p>
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
          </div>
          <p className="text-[#0d59f2] text-3xl font-bold leading-tight">{formatCurrency(metricas.ingresosNetos)}</p>
        </div>
        
        <div className="bg-[#282e39] rounded-xl p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[#9ca6ba]">
            <p className="text-sm font-medium"># Compras Totales</p>
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
          </div>
          <p className="text-white text-3xl font-bold leading-tight">{metricas.comprasTotales.toLocaleString()}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#282e39] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-[#9ca6ba] uppercase bg-[#1b1f27]">
              <tr>
                <th className="px-6 py-3">Nombre del Comercio</th>
                <th className="px-6 py-3">Plan Contratado</th>
                <th className="px-6 py-3 text-right">Tasa de Comisión (%)</th>
                <th className="px-6 py-3 text-right">Ingresos Generados</th>
                <th className="px-6 py-3 text-right">Comisiones Grada Negra</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : reportes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#9ca6ba]">
                    No se encontraron reportes para el período seleccionado
                  </td>
                </tr>
              ) : (
                reportes.map((reporte, index) => {
                  const tasaEfectiva = reporte.tasaComisionCustom ?? reporte.tasaComision
                  const tieneCustom = reporte.tasaComisionCustom !== undefined

                  return (
                    <tr key={index} className="border-b border-[#1b1f27] hover:bg-[#3b4354] transition-colors">
                      <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{reporte.nombreComercio}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getPlanBadge(reporte.plan)}`}>
                          {getPlanLabel(reporte.plan)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {tasaEfectiva.toFixed(2)}
                          {tieneCustom && (
                            <span className="material-symbols-outlined text-[#0d59f2] text-base" title="Tasa personalizada">
                              star
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">{formatCurrency(reporte.ingresosGenerados)}</td>
                      <td className="px-6 py-4 text-right text-[#0d59f2] font-semibold">{formatCurrency(reporte.comisionesGradaNegra)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && reportes.length > 0 && (
          <nav className="flex items-center justify-between p-4">
            <span className="text-sm font-normal text-[#9ca6ba]">
              Mostrando <span className="font-semibold text-white">{((page - 1) * limit) + 1}-{Math.min(page * limit, reportes.length)}</span> de <span className="font-semibold text-white">{reportes.length}</span>
            </span>
            <ul className="inline-flex items-center -space-x-px">
              <li>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center justify-center px-3 h-8 leading-tight text-[#9ca6ba] bg-[#1b1f27] border border-[#3b4354] rounded-s-lg hover:bg-[#282e39] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
              </li>
              <li>
                <button className="flex items-center justify-center px-3 h-8 leading-tight text-white bg-[#282e39] border border-[#3b4354] focus:outline-none focus:ring-2 focus:ring-[#0d59f2]">
                  {page}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center justify-center px-3 h-8 leading-tight text-[#9ca6ba] bg-[#1b1f27] border border-[#3b4354] rounded-e-lg hover:bg-[#282e39] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  )
}
