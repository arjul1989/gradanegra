'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Metricas {
  comerciosActivos: number
  eventosActivos: number
  boletosVendidos: number
  comisionesTotales: number
  comparacionPeriodoAnterior: {
    comercios: number
    eventos: number
    boletos: number
    comisiones: number
  }
}

interface TopComercio {
  id: string
  nombre: string
  totalVentas: number
  cantidadBoletos: number
}

interface Actividad {
  id: string
  accion: string
  entidad: string
  adminEmail: string
  timestamp: any
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [topComercios, setTopComercios] = useState<TopComercio[]>([])
  const [actividad, setActividad] = useState<Actividad[]>([])
  const [periodo, setPeriodo] = useState('30d')

  useEffect(() => {
    loadData()
  }, [periodo])

  const loadData = async () => {
    setLoading(true)
    try {
      // En desarrollo, usar el bypass de admin
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (process.env.NODE_ENV !== 'production') {
        headers['X-Dev-Admin'] = 'yes'
      }

      const [metricasRes, topRes, actividadRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/dashboard/metricas`, { headers }),
        fetch(`${API_URL}/api/admin/dashboard/top-comercios?periodo=${periodo}`, { headers }),
        fetch(`${API_URL}/api/admin/dashboard/actividad?limit=4`, { headers })
      ])

      if (metricasRes.ok) {
        const data = await metricasRes.json()
        setMetricas(data)
      } else {
        console.error('Error cargando métricas:', metricasRes.status)
      }

      if (topRes.ok) {
        const data = await topRes.json()
        setTopComercios(data.slice(0, 5))
      } else {
        console.error('Error cargando top comercios:', topRes.status)
      }

      if (actividadRes.ok) {
        const data = await actividadRes.json()
        setActividad(data)
      } else {
        console.error('Error cargando actividad:', actividadRes.status)
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-CO').format(value)
  }

  const getActivityIcon = (accion: string) => {
    if (accion.includes('crear') || accion.includes('aprobar')) {
      return { icon: 'check_circle', color: 'bg-[#28A745]/10 text-[#28A745]' }
    }
    if (accion.includes('cancelar') || accion.includes('eliminar')) {
      return { icon: 'cancel', color: 'bg-[#DC3545]/10 text-[#DC3545]' }
    }
    if (accion.includes('actualizar') || accion.includes('editar')) {
      return { icon: 'edit', color: 'bg-yellow-500/10 text-yellow-500' }
    }
    return { icon: 'add_circle', color: 'bg-[#0d59f2]/10 text-[#0d59f2]' }
  }

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Hace un momento'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds} segundos`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutos`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} horas`
    return `${Math.floor(seconds / 86400)} días`
  }

  if (loading && !metricas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Page Heading */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Dashboard</h1>
          <p className="text-[#9ca6ba]">Welcome back, Admin. Here's a summary of platform activity.</p>
        </div>
        <button
          onClick={() => setPeriodo(periodo === '30d' ? '7d' : '30d')}
          className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-[#1b1f27] border border-gray-700 text-sm font-medium text-white hover:bg-[#282e39] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
        >
          <span className="material-symbols-outlined text-base">calendar_today</span>
          <span className="truncate">Last {periodo === '30d' ? '30' : '7'} Days</span>
          <span className="material-symbols-outlined text-base">expand_more</span>
        </button>
      </div>

      {/* Stats Cards */}
      {metricas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#1b1f27] border border-[#3b4354]">
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-[#9ca6ba]">Active Merchants</p>
              <span className="material-symbols-outlined text-[#9ca6ba]">store</span>
            </div>
            <p className="text-3xl font-bold tracking-tight text-white">{formatNumber(metricas.comerciosActivos)}</p>
            <p className={`text-sm font-medium ${metricas.comparacionPeriodoAnterior.comercios >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
              {metricas.comparacionPeriodoAnterior.comercios >= 0 ? '+' : ''}{metricas.comparacionPeriodoAnterior.comercios}%
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#1b1f27] border border-[#3b4354]">
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-[#9ca6ba]">Active Events</p>
              <span className="material-symbols-outlined text-[#9ca6ba]">calendar_month</span>
            </div>
            <p className="text-3xl font-bold tracking-tight text-white">{formatNumber(metricas.eventosActivos)}</p>
            <p className={`text-sm font-medium ${metricas.comparacionPeriodoAnterior.eventos >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
              {metricas.comparacionPeriodoAnterior.eventos >= 0 ? '+' : ''}{metricas.comparacionPeriodoAnterior.eventos}%
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#1b1f27] border border-[#3b4354]">
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-[#9ca6ba]">Tickets Sold</p>
              <span className="material-symbols-outlined text-[#9ca6ba]">confirmation_number</span>
            </div>
            <p className="text-3xl font-bold tracking-tight text-white">{formatNumber(metricas.boletosVendidos)}</p>
            <p className={`text-sm font-medium ${metricas.comparacionPeriodoAnterior.boletos >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
              {metricas.comparacionPeriodoAnterior.boletos >= 0 ? '+' : ''}{metricas.comparacionPeriodoAnterior.boletos}%
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#1b1f27] border border-[#3b4354]">
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-[#9ca6ba]">Total Commissions</p>
              <span className="material-symbols-outlined text-[#9ca6ba]">attach_money</span>
            </div>
            <p className="text-3xl font-bold tracking-tight text-white">{formatCurrency(metricas.comisionesTotales)}</p>
            <p className={`text-sm font-medium ${metricas.comparacionPeriodoAnterior.comisiones >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
              {metricas.comparacionPeriodoAnterior.comisiones >= 0 ? '+' : ''}{metricas.comparacionPeriodoAnterior.comisiones}%
            </p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-3 flex flex-col gap-4 rounded-lg p-6 bg-[#1b1f27] border border-[#3b4354]">
          <div className="flex flex-col">
            <p className="text-lg font-semibold text-white">Gross Revenue vs. Commissions</p>
            <p className="text-sm text-[#9ca6ba]">Last 12 Months</p>
          </div>
          <div className="flex min-h-[280px] flex-1 flex-col justify-end">
            <svg fill="none" preserveAspectRatio="none" viewBox="0 0 478 150" width="100%" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H0V109Z" fill="url(#paint0_linear_chart)"></path>
              <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#0d59f2" strokeLinecap="round" strokeWidth="3"></path>
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_chart" x1="236" x2="236" y1="1" y2="149">
                  <stop stopColor="#0d59f2" stopOpacity="0.3"></stop>
                  <stop offset="1" stopColor="#0d59f2" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Plans Pie Chart */}
        <div className="lg:col-span-2 flex flex-col gap-4 rounded-lg p-6 bg-[#1b1f27] border border-[#3b4354]">
          <div className="flex flex-col">
            <p className="text-lg font-semibold text-white">Merchants by Plan</p>
            <p className="text-sm text-[#9ca6ba]">All Time</p>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="absolute text-center">
              <p className="text-3xl font-bold text-white">{metricas ? metricas.comerciosActivos : 0}</p>
              <p className="text-sm text-[#9ca6ba]">Total</p>
            </div>
            <svg height="200" viewBox="0 0 36 36" width="200">
              <circle cx="18" cy="18" fill="none" r="15.9154943092" stroke="#28A745" strokeDasharray="60, 100" strokeWidth="3"></circle>
              <circle cx="18" cy="18" fill="none" r="15.9154943092" stroke="#0d59f2" strokeDasharray="30, 100" strokeDashoffset="-60" strokeWidth="3"></circle>
              <circle cx="18" cy="18" fill="none" r="15.9154943092" stroke="#DC3545" strokeDasharray="10, 100" strokeDashoffset="-90" strokeWidth="3"></circle>
            </svg>
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-[#28A745]"></div>
              <span className="text-sm text-white">Pro</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-[#0d59f2]"></div>
              <span className="text-sm text-white">Basic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-[#DC3545]"></div>
              <span className="text-sm text-white">Enterprise</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Merchants Table */}
        <div className="lg:col-span-2 flex flex-col rounded-lg bg-[#1b1f27] border border-[#3b4354]">
          <h2 className="text-lg font-semibold p-4 border-b border-[#3b4354] text-white">Top 10 Merchants by Sales</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[#9ca6ba]">
                <tr>
                  <th className="px-4 py-3" scope="col">Rank</th>
                  <th className="px-4 py-3" scope="col">Merchant</th>
                  <th className="px-4 py-3 text-right" scope="col">Tickets Sold</th>
                  <th className="px-4 py-3 text-right" scope="col">Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {topComercios.length > 0 ? (
                  topComercios.map((comercio, index) => (
                    <tr key={comercio.id} className="border-b border-[#3b4354] hover:bg-[#282e39] transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{index + 1}</td>
                      <td className="px-4 py-3 text-white">{comercio.nombre}</td>
                      <td className="px-4 py-3 text-right text-[#9ca6ba]">{formatNumber(comercio.cantidadBoletos)}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(comercio.totalVentas)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#9ca6ba]">
                      No hay datos disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="flex flex-col rounded-lg bg-[#1b1f27] border border-[#3b4354]">
          <h2 className="text-lg font-semibold p-4 border-b border-[#3b4354] text-white">Recent Administrative Activity</h2>
          <div className="p-4 flex-1 flex flex-col gap-4">
            {actividad.length > 0 ? (
              actividad.map((act) => {
                const { icon, color } = getActivityIcon(act.accion)
                return (
                  <div key={act.id} className="flex gap-4">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${color}`}>
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div>
                      <p className="text-sm text-white">
                        {act.accion} en <span className="font-semibold">{act.entidad}</span> por {act.adminEmail}
                      </p>
                      <p className="text-xs text-[#9ca6ba]">hace {getTimeAgo(act.timestamp)}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#9ca6ba]">
                <p className="text-sm">No hay actividad reciente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
