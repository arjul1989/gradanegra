'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface FechaEvento {
  id: string
  fecha: string // YYYY-MM-DD
  horaInicio: string // HH:MM
  horaFin: string // HH:MM
  aforoTotal: number
}

interface EventoEnCreacion {
  id: string
  nombre: string
  descripcion: string
  imagen: string
  ciudad: string
  ubicacion: string
  categoria: string
  destacado: boolean
  status: string
  comercioId: string
  step: number
}

export default function CrearEventoPaso2Page() {
  const router = useRouter()
  const [evento, setEvento] = useState<EventoEnCreacion | null>(null)
  const [fechas, setFechas] = useState<FechaEvento[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Cargar el evento desde localStorage
    const eventoGuardado = localStorage.getItem('eventoEnCreacion')
    if (!eventoGuardado) {
      router.push('/panel/eventos/crear')
      return
    }

    const eventoData = JSON.parse(eventoGuardado)
    setEvento(eventoData)

    // Si ya hay fechas guardadas, cargarlas
    if (eventoData.fechas) {
      setFechas(eventoData.fechas)
    }
  }, [router])

  const agregarFecha = () => {
    const nuevaFecha: FechaEvento = {
      id: `temp-${Date.now()}`,
      fecha: '',
      horaInicio: '',
      horaFin: '',
      aforoTotal: 0
    }
    setFechas([...fechas, nuevaFecha])
  }

  const actualizarFecha = (id: string, field: keyof FechaEvento, value: string | number) => {
    setFechas(fechas.map(fecha => 
      fecha.id === id ? { ...fecha, [field]: value } : fecha
    ))

    // Limpiar error del campo si existe
    const errorKey = `${id}-${field}`
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  const eliminarFecha = (id: string) => {
    setFechas(fechas.filter(fecha => fecha.id !== id))
    
    // Limpiar errores relacionados con esta fecha
    const newErrors = { ...errors }
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(id)) {
        delete newErrors[key]
      }
    })
    setErrors(newErrors)
  }

  const validateFechas = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (fechas.length === 0) {
      newErrors.general = 'Debes agregar al menos una fecha para el evento'
      setErrors(newErrors)
      return false
    }

    fechas.forEach(fecha => {
      if (!fecha.fecha) {
        newErrors[`${fecha.id}-fecha`] = 'La fecha es requerida'
      } else {
        // Validar que la fecha no sea en el pasado
        const fechaSeleccionada = new Date(fecha.fecha)
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        if (fechaSeleccionada < hoy) {
          newErrors[`${fecha.id}-fecha`] = 'La fecha no puede ser en el pasado'
        }
      }

      if (!fecha.horaInicio) {
        newErrors[`${fecha.id}-horaInicio`] = 'La hora de inicio es requerida'
      }

      // Hora fin es opcional, pero si existe debe ser mayor que hora inicio
      if (fecha.horaFin && fecha.horaInicio) {
        if (fecha.horaFin <= fecha.horaInicio) {
          newErrors[`${fecha.id}-horaFin`] = 'Debe ser mayor a la hora de inicio'
        }
      }

      if (!fecha.aforoTotal || fecha.aforoTotal <= 0) {
        newErrors[`${fecha.id}-aforoTotal`] = 'El aforo debe ser mayor a 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleVolver = () => {
    // Guardar las fechas actuales antes de volver
    if (evento) {
      localStorage.setItem('eventoEnCreacion', JSON.stringify({
        ...evento,
        fechas
      }))
    }
    router.push('/panel/eventos/crear')
  }

  const handleSiguiente = async () => {
    if (!validateFechas()) {
      // Scroll al primer error
      const firstError = document.querySelector('.error-message')
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    if (!evento?.id) {
      alert('Error: No se encontró el ID del evento')
      return
    }

    setLoading(true)

    try {
      // Crear fechas en el backend
      const fechasCreadas = await Promise.all(
        fechas.map(async (fecha) => {
          const response = await fetch(`${API_URL}/api/fechasEvento`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              eventoId: evento.id,
              fecha: fecha.fecha,
              horaInicio: fecha.horaInicio,
              horaFin: fecha.horaFin || null,
              aforoTotal: fecha.aforoTotal,
              aforoDisponible: fecha.aforoTotal,
              status: 'activa'
            })
          })

          if (!response.ok) {
            throw new Error('Error al crear fecha')
          }

          return await response.json()
        })
      )

      // Guardar las fechas con sus IDs reales en localStorage
      localStorage.setItem('eventoEnCreacion', JSON.stringify({
        ...evento,
        fechas: fechasCreadas,
        step: 2
      }))

      // Redirigir al paso 3
      router.push('/panel/eventos/crear/paso-3')

    } catch (error: any) {
      console.error('Error creating fechas:', error)
      alert(error.message || 'Error al crear las fechas del evento')
    } finally {
      setLoading(false)
    }
  }

  const formatFechaDisplay = (fecha: string) => {
    if (!fecha) return ''
    const date = new Date(fecha + 'T00:00:00')
    return date.toLocaleDateString('es-CO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header con wizard steps */}
      <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Crear Nuevo Evento</h1>
            <p className="text-gray-400 mt-1">Paso 2 de 4: Fechas y Horarios</p>
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
          <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
          <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
        </div>

        <div className="flex justify-between mt-3 text-xs text-gray-400">
          <span className="text-gray-400">Información</span>
          <span className="font-medium text-white">Fechas</span>
          <span>Tiers</span>
          <span>Resumen</span>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 text-2xl">info</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Agrega las fechas de tu evento</h3>
            <p className="text-sm text-blue-800">
              Un evento puede tener múltiples fechas. Por ejemplo, un concierto con varias funciones o un festival de varios días.
              En el siguiente paso podrás configurar los tipos de entrada (tiers) para cada fecha.
            </p>
          </div>
        </div>
      </div>

      {/* Error general */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 error-message">
          <div className="flex items-center gap-2 text-red-800">
            <span className="material-symbols-outlined">error</span>
            <p className="font-medium">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Lista de fechas */}
      <div className="space-y-4">
        {fechas.map((fecha, index) => (
          <div key={fecha.id} className="bg-[#1b1f27] rounded-xl border border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Fecha {index + 1}
                {fecha.fecha && (
                  <span className="ml-3 text-sm font-normal text-gray-400">
                    {formatFechaDisplay(fecha.fecha)}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => eliminarFecha(fecha.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar fecha"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha */}
              <div className="md:col-span-2">
                <label htmlFor={`fecha-${fecha.id}`} className="block text-sm font-semibold text-white mb-2">
                  Fecha del Evento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id={`fecha-${fecha.id}`}
                  value={fecha.fecha}
                  onChange={(e) => actualizarFecha(fecha.id, 'fecha', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                    errors[`${fecha.id}-fecha`] ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors[`${fecha.id}-fecha`] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1 error-message">
                    <span className="material-symbols-outlined text-base">error</span>
                    {errors[`${fecha.id}-fecha`]}
                  </p>
                )}
              </div>

              {/* Hora Inicio */}
              <div>
                <label htmlFor={`horaInicio-${fecha.id}`} className="block text-sm font-semibold text-white mb-2">
                  Hora de Inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id={`horaInicio-${fecha.id}`}
                  value={fecha.horaInicio}
                  onChange={(e) => actualizarFecha(fecha.id, 'horaInicio', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                    errors[`${fecha.id}-horaInicio`] ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors[`${fecha.id}-horaInicio`] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1 error-message">
                    <span className="material-symbols-outlined text-base">error</span>
                    {errors[`${fecha.id}-horaInicio`]}
                  </p>
                )}
              </div>

              {/* Hora Fin */}
              <div>
                <label htmlFor={`horaFin-${fecha.id}`} className="block text-sm font-semibold text-white mb-2">
                  Hora de Fin <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input
                  type="time"
                  id={`horaFin-${fecha.id}`}
                  value={fecha.horaFin}
                  onChange={(e) => actualizarFecha(fecha.id, 'horaFin', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                    errors[`${fecha.id}-horaFin`] ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors[`${fecha.id}-horaFin`] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1 error-message">
                    <span className="material-symbols-outlined text-base">error</span>
                    {errors[`${fecha.id}-horaFin`]}
                  </p>
                )}
              </div>

              {/* Aforo Total */}
              <div className="md:col-span-2">
                <label htmlFor={`aforo-${fecha.id}`} className="block text-sm font-semibold text-white mb-2">
                  Aforo Total <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id={`aforo-${fecha.id}`}
                  value={fecha.aforoTotal || ''}
                  onChange={(e) => actualizarFecha(fecha.id, 'aforoTotal', parseInt(e.target.value) || 0)}
                  min="1"
                  placeholder="Ej: 500"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                    errors[`${fecha.id}-aforoTotal`] ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                <p className="mt-1 text-sm text-gray-400">
                  Capacidad máxima de personas para esta fecha
                </p>
                {errors[`${fecha.id}-aforoTotal`] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1 error-message">
                    <span className="material-symbols-outlined text-base">error</span>
                    {errors[`${fecha.id}-aforoTotal`]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Botón agregar fecha */}
        <button
          type="button"
          onClick={agregarFecha}
          className="w-full py-4 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:border-gray-400 hover:text-white hover:bg-[#282e39] transition-all flex items-center justify-center gap-2 font-medium"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Agregar Fecha
        </button>
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
          disabled={loading || fechas.length === 0}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#0d59f2] to-blue-600 hover:from-blue-600 hover:to-[#0d59f2] text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Guardando fechas...</span>
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
