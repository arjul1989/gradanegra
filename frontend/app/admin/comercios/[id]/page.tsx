'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface ComercioDetalle {
  id: string
  nombre: string
  email: string
  telefono?: string
  logo?: string
  tipoPlan: string
  status: string
  fechaCreacion: string
  limiteEventos: number
  limiteDestacados: number
  limiteUsuarios: number
  comision: number
  limiteEventosCustom?: number
  limiteDestacadosCustom?: number
  limiteUsuariosCustom?: number
  comisionCustom?: number
  eventosActivos: number
  ticketsVendidos: number
  ventasTotal: number
  ventasMensuales?: Array<{ mes: string; ventas: number }>
}

export default function ComercioDetallePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [comercio, setComercio] = useState<ComercioDetalle | null>(null)
  const [customValues, setCustomValues] = useState({
    limiteEventos: 0,
    limiteDestacados: 0,
    limiteUsuarios: 0,
    comision: 0
  })
  const [periodo, setPeriodo] = useState<'6m' | '1y'>('6m')

  useEffect(() => {
    loadComercio()
  }, [params.id])

  const loadComercio = async () => {
    setLoading(true)
    try {
      // En desarrollo, usar el bypass de admin
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (process.env.NODE_ENV !== 'production') {
        headers['X-Dev-Admin'] = 'yes'
      }

      const response = await fetch(`${API_URL}/api/admin/comercios/${params.id}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setComercio(data)
        // Initialize custom values
        setCustomValues({
          limiteEventos: data.limiteEventosCustom ?? data.limiteEventos,
          limiteDestacados: data.limiteDestacadosCustom ?? data.limiteDestacados,
          limiteUsuarios: data.limiteUsuariosCustom ?? data.limiteUsuarios,
          comision: data.comisionCustom ?? data.comision
        })
      } else if (response.status === 404) {
        router.push('/admin/comercios')
      } else {
        console.error('Error response:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error data:', errorData)
      }
    } catch (error) {
      console.error('Error cargando comercio:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCustom = async () => {
    if (!comercio) return

    try {
      // En desarrollo, usar el bypass de admin
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (process.env.NODE_ENV !== 'production') {
        headers['X-Dev-Admin'] = 'yes'
      }

      const response = await fetch(`${API_URL}/api/admin/comercios/${comercio.id}/plan`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          limiteEventosCustom: customValues.limiteEventos,
          limiteDestacadosCustom: customValues.limiteDestacados,
          limiteUsuariosCustom: customValues.limiteUsuarios,
          comisionCustom: customValues.comision,
          motivo: 'Configuración personalizada desde panel admin'
        })
      })

      if (response.ok) {
        await loadComercio()
        alert('Configuración personalizada guardada correctamente')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('Error response:', response.status, errorData)
        alert(`Error al guardar: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error guardando configuración:', error)
      alert('Error al guardar la configuración')
    }
  }

  const handleResetCustom = async () => {
    if (!comercio) return
    if (!confirm('¿Está seguro de restablecer a los valores estándar del plan?')) return

    setCustomValues({
      limiteEventos: comercio.limiteEventos,
      limiteDestacados: comercio.limiteDestacados,
      limiteUsuarios: comercio.limiteUsuarios,
      comision: comercio.comision
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPlanLabel = (plan: string) => {
    const labels = {
      free: 'Free',
      basic: 'Basic',
      pro: 'Pro',
      premium: 'Premium',
      enterprise: 'Enterprise'
    }
    return labels[plan as keyof typeof labels] || plan
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!comercio) {
    return (
      <div className="p-8">
        <p className="text-white">Comercio no encontrado</p>
        <Link href="/admin/comercios" className="text-[#0d59f2] hover:underline mt-4 inline-block">
          Volver a la lista
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Page Heading */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/admin/comercios" className="p-2 hover:bg-[#282e39] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]">
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </Link>
          <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em]">Merchant Details</h1>
        </div>
        <p className="text-[#9ca6ba] text-base font-normal leading-normal ml-14">
          View and manage merchant information, performance, and plan settings.
        </p>
      </div>

      {/* Three-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* Left Column - Merchant Info */}
        <div className="xl:col-span-1 lg:col-span-1 flex flex-col gap-6">
          {/* Profile Card */}
          <div className="bg-[#1b1f27] p-6 rounded-xl flex flex-col gap-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              {comercio.logo ? (
                <img src={comercio.logo} alt={comercio.nombre} className="size-20 rounded-lg object-cover" />
              ) : (
                <div className="size-20 bg-gradient-to-br from-[#0d59f2] to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">{comercio.nombre.charAt(0)}</span>
                </div>
              )}
              <div className="flex flex-col">
                <p className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">{comercio.nombre}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    comercio.status === 'activo'
                      ? 'bg-green-500/20 text-green-400'
                      : comercio.status === 'inactivo'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {comercio.status.charAt(0).toUpperCase() + comercio.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 border-t border-white/10 py-4">
                <p className="text-[#9ca6ba] text-sm font-normal">Email:</p>
                <p className="text-white text-sm font-medium text-right truncate">{comercio.email}</p>
              </div>
              {comercio.telefono && (
                <div className="grid grid-cols-[auto_1fr] gap-x-4 border-t border-white/10 py-4">
                  <p className="text-[#9ca6ba] text-sm font-normal">Teléfono:</p>
                  <p className="text-white text-sm font-medium text-right">{comercio.telefono}</p>
                </div>
              )}
              <div className="grid grid-cols-[auto_1fr] gap-x-4 border-t border-white/10 py-4">
                <p className="text-[#9ca6ba] text-sm font-normal">Registrado:</p>
                <p className="text-white text-sm font-medium text-right">{formatDate(comercio.fechaCreacion)}</p>
              </div>
            </div>
          </div>

          {/* Plan Card */}
          <div className="bg-[#1b1f27] p-6 rounded-xl">
            <div className="flex flex-col gap-4">
              <p className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                Plan Actual: {getPlanLabel(comercio.tipoPlan)}
              </p>
              <p className="text-[#9ca6ba] text-base font-normal leading-normal">
                Este es el plan base del comerciante. Puedes establecer valores personalizados en la columna derecha.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9ca6ba]">Eventos:</span>
                  <span className="text-white font-medium">{comercio.limiteEventos === -1 ? 'Ilimitado' : comercio.limiteEventos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca6ba]">Destacados:</span>
                  <span className="text-white font-medium">{comercio.limiteDestacados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca6ba]">Usuarios:</span>
                  <span className="text-white font-medium">{comercio.limiteUsuarios}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca6ba]">Comisión:</span>
                  <span className="text-white font-medium">{comercio.comision}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column - Performance */}
        <div className="xl:col-span-2 lg:col-span-2 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white">Estadísticas de Rendimiento</h2>
          
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#1b1f27] p-6 rounded-xl">
              <p className="text-sm font-medium text-[#9ca6ba]">Eventos Activos</p>
              <p className="text-4xl font-bold text-white mt-2">{comercio.eventosActivos}</p>
            </div>
            <div className="bg-[#1b1f27] p-6 rounded-xl">
              <p className="text-sm font-medium text-[#9ca6ba]">Tickets Vendidos</p>
              <p className="text-4xl font-bold text-white mt-2">{comercio.ticketsVendidos.toLocaleString()}</p>
            </div>
            <div className="bg-[#1b1f27] p-6 rounded-xl">
              <p className="text-sm font-medium text-[#9ca6ba]">Ingresos Totales</p>
              <p className="text-4xl font-bold text-white mt-2">{formatCurrency(comercio.ventasTotal)}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-[#1b1f27] p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Ventas Mensuales</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPeriodo('6m')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2] ${
                    periodo === '6m' ? 'bg-white/10 text-white' : 'text-[#9ca6ba] hover:bg-white/5'
                  }`}
                >
                  Last 6 months
                </button>
                <button
                  onClick={() => setPeriodo('1y')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2] ${
                    periodo === '1y' ? 'bg-white/10 text-white' : 'text-[#9ca6ba] hover:bg-white/5'
                  }`}
                >
                  YTD
                </button>
              </div>
            </div>
            <div className="h-64 w-full">
              <svg width="100%" height="100%" viewBox="0 0 500 250" preserveAspectRatio="none">
                <g style={{ fontSize: '10px', fontFamily: 'Inter' }} className="text-[#9ca6ba]">
                  <line x1="40" y1="220" x2="480" y2="220" stroke="currentColor" strokeWidth="1" />
                  <text x="65" y="235">Jan</text>
                  <text x="135" y="235">Feb</text>
                  <text x="205" y="235">Mar</text>
                  <text x="275" y="235">Apr</text>
                  <text x="345" y="235">May</text>
                  <text x="415" y="235">Jun</text>
                  <text x="10" y="220" dy="3">0</text>
                  <text x="10" y="150" dy="3">$25k</text>
                  <text x="10" y="80" dy="3">$50k</text>
                  <text x="10" y="10" dy="3">$75k</text>
                </g>
                <g fill="#0d59f2">
                  <rect x="60" y="180" width="20" height="40" rx="4" />
                  <rect x="130" y="160" width="20" height="60" rx="4" />
                  <rect x="200" y="140" width="20" height="80" rx="4" />
                  <rect x="270" y="110" width="20" height="110" rx="4" />
                  <rect x="340" y="80" width="20" height="140" rx="4" />
                  <rect x="410" y="40" width="20" height="180" rx="4" />
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column - Custom Configuration */}
        <div className="xl:col-span-1 lg:col-span-3 bg-[#1b1f27] p-6 rounded-xl flex flex-col self-start">
          <h2 className="text-xl font-bold text-white mb-2">Configuración Custom del Plan</h2>
          <p className="text-[#9ca6ba] text-sm mb-6">
            Estos valores anulan la configuración del plan estándar para este comerciante.
          </p>
          
          <div className="flex flex-col gap-6">
            {/* Event Limit */}
            <div>
              <label htmlFor="event-limit" className="block text-sm font-medium text-white mb-2">
                Límite de Eventos
              </label>
              <input
                id="event-limit"
                type="number"
                value={customValues.limiteEventos}
                onChange={(e) => setCustomValues({ ...customValues, limiteEventos: Number(e.target.value) })}
                className="block w-full rounded-lg border-0 bg-[#101622] py-2.5 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-[#0d59f2] sm:text-sm focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-[#9ca6ba]">
                Plan Estándar: {comercio.limiteEventos === -1 ? 'Ilimitado' : comercio.limiteEventos}
              </p>
            </div>

            {/* Featured Limit */}
            <div>
              <label htmlFor="featured-limit" className="block text-sm font-medium text-white mb-2">
                Límite de Destacados
              </label>
              <input
                id="featured-limit"
                type="number"
                value={customValues.limiteDestacados}
                onChange={(e) => setCustomValues({ ...customValues, limiteDestacados: Number(e.target.value) })}
                className="block w-full rounded-lg border-0 bg-[#101622] py-2.5 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-[#0d59f2] sm:text-sm focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-[#9ca6ba]">Plan Estándar: {comercio.limiteDestacados}</p>
            </div>

            {/* User Limit */}
            <div>
              <label htmlFor="user-limit" className="block text-sm font-medium text-white mb-2">
                Límite de Usuarios
              </label>
              <input
                id="user-limit"
                type="number"
                value={customValues.limiteUsuarios}
                onChange={(e) => setCustomValues({ ...customValues, limiteUsuarios: Number(e.target.value) })}
                className="block w-full rounded-lg border-0 bg-[#101622] py-2.5 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-[#0d59f2] sm:text-sm focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-[#9ca6ba]">Plan Estándar: {comercio.limiteUsuarios}</p>
            </div>

            {/* Commission */}
            <div>
              <label htmlFor="commission" className="block text-sm font-medium text-white mb-2">
                Porcentaje de Comisión (%)
              </label>
              <input
                id="commission"
                type="number"
                step="0.1"
                value={customValues.comision}
                onChange={(e) => setCustomValues({ ...customValues, comision: Number(e.target.value) })}
                className="block w-full rounded-lg border-0 bg-[#101622] py-2.5 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-[#0d59f2] sm:text-sm focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-[#9ca6ba]">Plan Estándar: {comercio.comision}%</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-4">
            <button
              onClick={handleSaveCustom}
              className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#0d59f2] text-white text-sm font-medium leading-normal hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
            >
              <span className="truncate">Guardar Cambios</span>
            </button>
            <button
              onClick={handleResetCustom}
              className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-[#9ca6ba] text-sm font-medium leading-normal hover:bg-white/5 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
            >
              <span className="truncate">Restablecer a Estándar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
