'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Tier {
  id: string
  nombre: string
  descripcion: string
  precio: number
  cantidad: number
  orden: number
}

interface FechaConTiers {
  id: string
  fecha: string
  horaInicio: string
  horaFin: string
  aforoTotal: number
  tiers: Tier[]
}

interface EventoEnCreacion {
  id: string
  nombre: string
  fechas: any[]
  step: number
}

export default function CrearEventoPaso3Page() {
  const router = useRouter()
  const [evento, setEvento] = useState<EventoEnCreacion | null>(null)
  const [fechasConTiers, setFechasConTiers] = useState<FechaConTiers[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [expandedFecha, setExpandedFecha] = useState<string | null>(null)

  useEffect(() => {
    // Cargar el evento desde localStorage
    const eventoGuardado = localStorage.getItem('eventoEnCreacion')
    if (!eventoGuardado) {
      router.push('/panel/eventos/crear')
      return
    }

    const eventoData = JSON.parse(eventoGuardado)
    if (!eventoData.fechas || eventoData.fechas.length === 0) {
      router.push('/panel/eventos/crear/paso-2')
      return
    }

    setEvento(eventoData)

    // Inicializar fechas con tiers vacíos
    const fechasIniciales = eventoData.fechas.map((fecha: any) => ({
      ...fecha,
      tiers: fecha.tiers || []
    }))
    setFechasConTiers(fechasIniciales)

    // Expandir la primera fecha por defecto
    if (fechasIniciales.length > 0) {
      setExpandedFecha(fechasIniciales[0].id)
    }
  }, [router])

  const agregarTier = (fechaId: string) => {
    const nuevoTier: Tier = {
      id: `temp-${Date.now()}`,
      nombre: '',
      descripcion: '',
      precio: 0,
      cantidad: 0,
      orden: 1
    }

    setFechasConTiers(fechasConTiers.map(fecha => {
      if (fecha.id === fechaId) {
        const maxOrden = fecha.tiers.length > 0 
          ? Math.max(...fecha.tiers.map(t => t.orden))
          : 0
        return {
          ...fecha,
          tiers: [...fecha.tiers, { ...nuevoTier, orden: maxOrden + 1 }]
        }
      }
      return fecha
    }))
  }

  const actualizarTier = (
    fechaId: string, 
    tierId: string, 
    field: keyof Tier, 
    value: string | number
  ) => {
    setFechasConTiers(fechasConTiers.map(fecha => {
      if (fecha.id === fechaId) {
        return {
          ...fecha,
          tiers: fecha.tiers.map(tier => 
            tier.id === tierId ? { ...tier, [field]: value } : tier
          )
        }
      }
      return fecha
    }))

    // Limpiar error del campo
    const errorKey = `${fechaId}-${tierId}-${field}`
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  const eliminarTier = (fechaId: string, tierId: string) => {
    setFechasConTiers(fechasConTiers.map(fecha => {
      if (fecha.id === fechaId) {
        return {
          ...fecha,
          tiers: fecha.tiers.filter(tier => tier.id !== tierId)
        }
      }
      return fecha
    }))
  }

  const validateTiers = (): boolean => {
    const newErrors: Record<string, string> = {}
    let hasError = false

    fechasConTiers.forEach(fecha => {
      if (fecha.tiers.length === 0) {
        newErrors[`${fecha.id}-general`] = 'Debes agregar al menos un tier para esta fecha'
        hasError = true
      }

      let totalBoletos = 0

      fecha.tiers.forEach(tier => {
        if (!tier.nombre.trim()) {
          newErrors[`${fecha.id}-${tier.id}-nombre`] = 'El nombre es requerido'
          hasError = true
        }

        if (!tier.precio || tier.precio <= 0) {
          newErrors[`${fecha.id}-${tier.id}-precio`] = 'El precio debe ser mayor a 0'
          hasError = true
        }

        if (!tier.cantidad || tier.cantidad <= 0) {
          newErrors[`${fecha.id}-${tier.id}-cantidad`] = 'La cantidad debe ser mayor a 0'
          hasError = true
        }

        totalBoletos += tier.cantidad || 0
      })

      // Validar que la suma de boletos no exceda el aforo
      if (totalBoletos > fecha.aforoTotal) {
        newErrors[`${fecha.id}-aforo`] = `La suma de boletos (${totalBoletos}) excede el aforo total (${fecha.aforoTotal})`
        hasError = true
      }

      if (fecha.tiers.length > 0 && totalBoletos < fecha.aforoTotal) {
        newErrors[`${fecha.id}-aforo-warning`] = `Hay ${fecha.aforoTotal - totalBoletos} boletos sin asignar a ningún tier`
      }
    })

    setErrors(newErrors)
    return !hasError
  }

  const handleVolver = () => {
    // Guardar progreso antes de volver
    if (evento) {
      localStorage.setItem('eventoEnCreacion', JSON.stringify({
        ...evento,
        fechas: fechasConTiers.map(f => ({ ...f, tiers: f.tiers }))
      }))
    }
    router.push('/panel/eventos/crear/paso-2')
  }

  const handleSiguiente = async () => {
    if (!validateTiers()) {
      const firstError = document.querySelector('.error-message')
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setLoading(true)

    try {
      // Crear todos los tiers en el backend
      for (const fecha of fechasConTiers) {
        for (const tier of fecha.tiers) {
          const response = await fetch(`${API_URL}/api/tiers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fechaEventoId: fecha.id,
              nombre: tier.nombre,
              descripcion: tier.descripcion || '',
              precio: tier.precio,
              cantidad: tier.cantidad,
              disponibles: tier.cantidad,
              orden: tier.orden,
              status: 'activo'
            })
          })

          if (!response.ok) {
            throw new Error(`Error al crear tier ${tier.nombre}`)
          }
        }
      }

      // Guardar en localStorage y continuar al paso 4
      localStorage.setItem('eventoEnCreacion', JSON.stringify({
        ...evento,
        fechas: fechasConTiers,
        step: 3
      }))

      router.push('/panel/eventos/crear/paso-4')

    } catch (error: any) {
      console.error('Error creating tiers:', error)
      alert(error.message || 'Error al crear los tiers')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatFechaDisplay = (fecha: string, horaInicio: string, horaFin?: string) => {
    const date = new Date(fecha + 'T00:00:00')
    const dateStr = date.toLocaleDateString('es-CO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    const timeStr = horaFin 
      ? `${horaInicio} - ${horaFin}` 
      : horaInicio
    return `${dateStr} • ${timeStr}`
  }

  const getTotalBoletosForFecha = (fecha: FechaConTiers) => {
    return fecha.tiers.reduce((sum, tier) => sum + (tier.cantidad || 0), 0)
  }

  const getIngresoPotencialForFecha = (fecha: FechaConTiers) => {
    return fecha.tiers.reduce((sum, tier) => 
      sum + ((tier.precio || 0) * (tier.cantidad || 0)), 0
    )
  }

  if (!evento) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Crear Nuevo Evento</h1>
            <p className="text-gray-400 mt-1">Paso 3 de 4: Tiers y Precios</p>
            <p className="text-sm text-gray-400 mt-1">
              Evento: <span className="font-medium text-white">{evento.nombre}</span>
            </p>
          </div>
          <Link
            href="/panel/eventos"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-900 rounded-full"></div>
          <div className="flex-1 h-2 bg-gray-900 rounded-full"></div>
          <div className="flex-1 h-2 bg-gray-900 rounded-full"></div>
          <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
        </div>

        <div className="flex justify-between mt-3 text-xs text-gray-400">
          <span className="text-gray-400">Información</span>
          <span className="text-gray-400">Fechas</span>
          <span className="font-medium text-white">Tiers</span>
          <span>Resumen</span>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 text-2xl">info</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Configura los tipos de entrada (tiers)</h3>
            <p className="text-sm text-blue-800">
              Por cada fecha, crea los diferentes tipos de entrada como General, VIP, Palco, etc.
              Define el precio y cantidad de boletos para cada tier. La suma de boletos debe ser igual o menor al aforo de la fecha.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de fechas con tiers */}
      <div className="space-y-4">
        {fechasConTiers.map((fecha, index) => {
          const isExpanded = expandedFecha === fecha.id
          const totalBoletos = getTotalBoletosForFecha(fecha)
          const ingresoPotencial = getIngresoPotencialForFecha(fecha)
          const porcentajeOcupacion = (totalBoletos / fecha.aforoTotal) * 100

          return (
            <div key={fecha.id} className="bg-[#1b1f27] rounded-xl border border-gray-700 shadow-sm overflow-hidden">
              {/* Header de la fecha */}
              <div 
                className="p-6 cursor-pointer hover:bg-[#282e39] transition-colors"
                onClick={() => setExpandedFecha(isExpanded ? null : fecha.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        Fecha {index + 1}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        porcentajeOcupacion === 100 
                          ? 'bg-green-100 text-green-800'
                          : porcentajeOcupacion > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-[#282e39] text-white'
                      }`}>
                        {fecha.tiers.length} {fecha.tiers.length === 1 ? 'tier' : 'tiers'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {formatFechaDisplay(fecha.fecha, fecha.horaInicio, fecha.horaFin)}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Boletos asignados</p>
                        <p className="text-sm font-semibold text-white">
                          {totalBoletos} / {fecha.aforoTotal}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Ingreso potencial</p>
                        <p className="text-sm font-semibold text-white">
                          {formatCurrency(ingresoPotencial)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Ocupación</p>
                        <p className="text-sm font-semibold text-white">
                          {porcentajeOcupacion.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        porcentajeOcupacion > 100 
                          ? 'bg-red-600'
                          : porcentajeOcupacion === 100
                          ? 'bg-green-600'
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(porcentajeOcupacion, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Errores de aforo */}
                {errors[`${fecha.id}-aforo`] && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1 error-message">
                    <span className="material-symbols-outlined text-base">error</span>
                    {errors[`${fecha.id}-aforo`]}
                  </p>
                )}
                {errors[`${fecha.id}-aforo-warning`] && !errors[`${fecha.id}-aforo`] && (
                  <p className="mt-2 text-sm text-yellow-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">warning</span>
                    {errors[`${fecha.id}-aforo-warning`]}
                  </p>
                )}
                {errors[`${fecha.id}-general`] && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1 error-message">
                    <span className="material-symbols-outlined text-base">error</span>
                    {errors[`${fecha.id}-general`]}
                  </p>
                )}
              </div>

              {/* Contenido expandible - Tiers */}
              {isExpanded && (
                <div className="border-t border-gray-700 p-6 space-y-4 bg-[#282e39]">
                  {fecha.tiers.map((tier, tierIndex) => (
                    <div key={tier.id} className="bg-[#1b1f27] rounded-lg border border-gray-700 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-white">Tier {tierIndex + 1}</h4>
                        <button
                          type="button"
                          onClick={() => eliminarTier(fecha.id, tier.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar tier"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">
                            Nombre <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={tier.nombre}
                            onChange={(e) => actualizarTier(fecha.id, tier.id, 'nombre', e.target.value)}
                            placeholder="Ej: General, VIP, Palco"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                              errors[`${fecha.id}-${tier.id}-nombre`] ? 'border-red-500' : 'border-gray-600'
                            }`}
                          />
                          {errors[`${fecha.id}-${tier.id}-nombre`] && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1 error-message">
                              <span className="material-symbols-outlined text-base">error</span>
                              {errors[`${fecha.id}-${tier.id}-nombre`]}
                            </p>
                          )}
                        </div>

                        {/* Orden */}
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">
                            Orden
                          </label>
                          <input
                            type="number"
                            value={tier.orden}
                            onChange={(e) => actualizarTier(fecha.id, tier.id, 'orden', parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                          />
                          <p className="mt-1 text-xs text-gray-400">Orden de visualización</p>
                        </div>

                        {/* Descripción */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-white mb-2">
                            Descripción <span className="text-gray-400 text-xs">(opcional)</span>
                          </label>
                          <textarea
                            value={tier.descripcion}
                            onChange={(e) => actualizarTier(fecha.id, tier.id, 'descripcion', e.target.value)}
                            rows={2}
                            placeholder="Ej: Incluye acceso VIP y bebida de cortesía"
                            className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent resize-none"
                          />
                        </div>

                        {/* Precio */}
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">
                            Precio (COP) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={tier.precio || ''}
                            onChange={(e) => actualizarTier(fecha.id, tier.id, 'precio', parseInt(e.target.value) || 0)}
                            min="0"
                            step="1000"
                            placeholder="50000"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                              errors[`${fecha.id}-${tier.id}-precio`] ? 'border-red-500' : 'border-gray-600'
                            }`}
                          />
                          {errors[`${fecha.id}-${tier.id}-precio`] && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1 error-message">
                              <span className="material-symbols-outlined text-base">error</span>
                              {errors[`${fecha.id}-${tier.id}-precio`]}
                            </p>
                          )}
                        </div>

                        {/* Cantidad */}
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">
                            Cantidad de boletos <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={tier.cantidad || ''}
                            onChange={(e) => actualizarTier(fecha.id, tier.id, 'cantidad', parseInt(e.target.value) || 0)}
                            min="1"
                            placeholder="100"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                              errors[`${fecha.id}-${tier.id}-cantidad`] ? 'border-red-500' : 'border-gray-600'
                            }`}
                          />
                          {errors[`${fecha.id}-${tier.id}-cantidad`] && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1 error-message">
                              <span className="material-symbols-outlined text-base">error</span>
                              {errors[`${fecha.id}-${tier.id}-cantidad`]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Resumen del tier */}
                      {tier.precio > 0 && tier.cantidad > 0 && (
                        <div className="mt-4 p-3 bg-[#282e39] rounded-lg">
                          <p className="text-sm text-gray-400">
                            Ingreso potencial: <span className="font-semibold text-white">
                              {formatCurrency(tier.precio * tier.cantidad)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Botón agregar tier */}
                  <button
                    type="button"
                    onClick={() => agregarTier(fecha.id)}
                    className="w-full py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-400 hover:text-white hover:bg-[#1b1f27] transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    Agregar Tier
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Botones de navegación */}
      <div className="flex items-center justify-between bg-[#1b1f27] rounded-xl border border-gray-700 p-6 shadow-sm">
        <button
          type="button"
          onClick={handleVolver}
          className="flex items-center gap-2 px-6 py-3 border border-gray-600 text-gray-700 rounded-lg hover:bg-[#282e39] transition-colors font-medium"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Volver
        </button>

        <button
          type="button"
          onClick={handleSiguiente}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#0d59f2] to-blue-600 hover:from-blue-600 hover:to-[#0d59f2] text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Guardando tiers...</span>
            </>
          ) : (
            <>
              <span>Siguiente</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
