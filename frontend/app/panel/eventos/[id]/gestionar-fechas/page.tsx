'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useComercio } from '@/contexts/ComercioContext'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Evento {
  id: string
  nombre: string
  comercioId: string
}

interface Tier {
  id: string
  fechaEventoId: string
  nombre: string
  descripcion: string
  precio: number
  cantidad: number
  disponibles: number
  orden: number
  status: string
}

interface FechaEvento {
  id: string
  eventoId: string
  fecha: string
  horaInicio: string
  horaFin: string
  aforoTotal: number
  aforoDisponible: number
  status: string
  tiers: Tier[]
}

export default function GestionarFechasPage() {
  const params = useParams()
  const router = useRouter()
  const { comercio } = useComercio()
  const eventoId = params.id as string

  const [evento, setEvento] = useState<Evento | null>(null)
  const [fechas, setFechas] = useState<FechaEvento[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedFecha, setExpandedFecha] = useState<string | null>(null)

  // Modals
  const [showAddFechaModal, setShowAddFechaModal] = useState(false)
  const [showAddTierModal, setShowAddTierModal] = useState(false)
  const [showEditTierModal, setShowEditTierModal] = useState(false)
  const [selectedFechaId, setSelectedFechaId] = useState<string>('')
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null)

  // Form data
  const [nuevaFecha, setNuevaFecha] = useState({
    fecha: '',
    horaInicio: '',
    horaFin: '',
    aforoTotal: ''
  })

  const [nuevoTier, setNuevoTier] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    cantidad: '',
    orden: '1'
  })

  useEffect(() => {
    if (comercio?.id && eventoId) {
      fetchData()
    }
  }, [comercio, eventoId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch evento
      const eventoRes = await fetch(`${API_URL}/api/eventos/${eventoId}`)
      if (!eventoRes.ok) throw new Error('Evento no encontrado')
      const eventoData = await eventoRes.json()

      if (eventoData.comercioId !== comercio?.id) {
        alert('No tienes permiso para gestionar este evento')
        router.push('/panel/eventos')
        return
      }

      setEvento(eventoData)

      // Fetch fechas con tiers
      const fechasRes = await fetch(`${API_URL}/api/eventos/${eventoId}/fechas`)
      if (fechasRes.ok) {
        const fechasData = await fechasRes.json()
        setFechas(fechasData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFecha = async () => {
    if (!nuevaFecha.fecha || !nuevaFecha.horaInicio || !nuevaFecha.aforoTotal) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/fechasEvento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventoId,
          fecha: nuevaFecha.fecha,
          horaInicio: nuevaFecha.horaInicio,
          horaFin: nuevaFecha.horaFin || null,
          aforoTotal: parseInt(nuevaFecha.aforoTotal),
          aforoDisponible: parseInt(nuevaFecha.aforoTotal),
          status: 'activa'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al agregar fecha')
      }

      alert('✅ Fecha agregada exitosamente')
      setShowAddFechaModal(false)
      setNuevaFecha({ fecha: '', horaInicio: '', horaFin: '', aforoTotal: '' })
      await fetchData()
    } catch (error: any) {
      console.error('Error adding fecha:', error)
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddTier = async () => {
    if (!selectedFechaId || !nuevoTier.nombre || !nuevoTier.precio || !nuevoTier.cantidad) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaEventoId: selectedFechaId,
          nombre: nuevoTier.nombre,
          descripcion: nuevoTier.descripcion || '',
          precio: parseFloat(nuevoTier.precio),
          cantidad: parseInt(nuevoTier.cantidad),
          disponibles: parseInt(nuevoTier.cantidad),
          orden: parseInt(nuevoTier.orden),
          status: 'activo'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al agregar tier')
      }

      const tier = await response.json()

      // Generar boletos
      await fetch(`${API_URL}/api/tiers/${tier.id}/generar-boletos`, {
        method: 'POST'
      })

      alert('✅ Tier agregado y boletos generados exitosamente')
      setShowAddTierModal(false)
      setNuevoTier({ nombre: '', descripcion: '', precio: '', cantidad: '', orden: '1' })
      await fetchData()
    } catch (error: any) {
      console.error('Error adding tier:', error)
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTier = async () => {
    if (!selectedTier) return

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/tiers/${selectedTier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: selectedTier.nombre,
          descripcion: selectedTier.descripcion,
          precio: selectedTier.precio,
          orden: selectedTier.orden
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar tier')
      }

      alert('✅ Tier actualizado exitosamente')
      setShowEditTierModal(false)
      setSelectedTier(null)
      await fetchData()
    } catch (error: any) {
      console.error('Error updating tier:', error)
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFecha = async (fechaId: string) => {
    const fecha = fechas.find(f => f.id === fechaId)
    if (!fecha) return

    const vendidos = fecha.aforoTotal - fecha.aforoDisponible
    if (vendidos > 0) {
      alert(`❌ No puedes eliminar esta fecha porque ya tiene ${vendidos} boletos vendidos`)
      return
    }

    const confirm = window.confirm('¿Estás seguro de eliminar esta fecha? Se eliminarán todos los tiers y boletos asociados.')
    if (!confirm) return

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/fechasEvento/${fechaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar fecha')
      }

      alert('✅ Fecha eliminada exitosamente')
      await fetchData()
    } catch (error: any) {
      console.error('Error deleting fecha:', error)
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTier = async (tier: Tier) => {
    const vendidos = tier.cantidad - tier.disponibles
    if (vendidos > 0) {
      alert(`❌ No puedes eliminar este tier porque ya tiene ${vendidos} boletos vendidos`)
      return
    }

    const confirm = window.confirm(`¿Estás seguro de eliminar el tier "${tier.nombre}"?`)
    if (!confirm) return

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/tiers/${tier.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar tier')
      }

      alert('✅ Tier eliminado exitosamente')
      await fetchData()
    } catch (error: any) {
      console.error('Error deleting tier:', error)
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando fechas y tiers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/panel/eventos/${eventoId}`}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <h1 className="text-2xl font-bold text-white">Gestionar Fechas y Entradas</h1>
            </div>
            <p className="text-gray-400">{evento?.nombre}</p>
          </div>
          <button
            onClick={() => setShowAddFechaModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0d59f2] to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-[#0d59f2] transition-all shadow-lg font-medium"
          >
            <span className="material-symbols-outlined">add</span>
            Agregar Fecha
          </button>
        </div>
      </div>

      {/* Lista de Fechas */}
      {fechas.length === 0 ? (
        <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-gray-400 mb-4 block">
            event_busy
          </span>
          <h3 className="text-xl font-bold text-white mb-2">No hay fechas creadas</h3>
          <p className="text-gray-400 mb-6">Agrega la primera fecha para tu evento</p>
          <button
            onClick={() => setShowAddFechaModal(true)}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Agregar Primera Fecha
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {fechas.map((fecha) => {
            const isExpanded = expandedFecha === fecha.id
            const vendidos = fecha.aforoTotal - fecha.aforoDisponible
            const ocupacion = (vendidos / fecha.aforoTotal) * 100

            return (
              <div key={fecha.id} className="bg-[#1b1f27] rounded-xl border border-gray-700 shadow-sm overflow-hidden">
                {/* Header de la Fecha */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {new Date(fecha.fecha + 'T00:00').toLocaleDateString('es-CO', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          fecha.status === 'activa' ? 'bg-green-100 text-green-800' :
                          fecha.status === 'agotada' ? 'bg-red-100 text-red-800' :
                          'bg-[#282e39] text-white'
                        }`}>
                          {fecha.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">schedule</span>
                          <span>{fecha.horaInicio} {fecha.horaFin && `- ${fecha.horaFin}`}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">confirmation_number</span>
                          <span>{vendidos} / {fecha.aforoTotal} vendidos ({ocupacion.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedFecha(isExpanded ? null : fecha.id)}
                        className="px-4 py-2 border border-gray-600 text-gray-700 rounded-lg hover:bg-[#282e39] transition-colors font-medium"
                      >
                        {isExpanded ? 'Ocultar Tiers' : 'Ver Tiers'}
                      </button>
                      {vendidos === 0 && (
                        <button
                          onClick={() => handleDeleteFecha(fecha.id)}
                          disabled={saving}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        ocupacion >= 100 ? 'bg-red-600' :
                        ocupacion >= 75 ? 'bg-yellow-500' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(ocupacion, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Tiers (expandible) */}
                {isExpanded && (
                  <div className="border-t border-gray-700 p-6 bg-[#282e39]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-white">
                        Tipos de Entrada ({fecha.tiers.length})
                      </h4>
                      <button
                        onClick={() => {
                          setSelectedFechaId(fecha.id)
                          setShowAddTierModal(true)
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        Agregar Tier
                      </button>
                    </div>

                    {fecha.tiers.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No hay tiers creados para esta fecha
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {fecha.tiers.sort((a, b) => a.orden - b.orden).map((tier) => {
                          const tierVendidos = tier.cantidad - tier.disponibles
                          const tierOcupacion = (tierVendidos / tier.cantidad) * 100

                          return (
                            <div key={tier.id} className="bg-[#1b1f27] rounded-lg border border-gray-700 p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-semibold text-white">{tier.nombre}</h5>
                                    <span className="text-sm text-gray-400">#{tier.orden}</span>
                                  </div>
                                  {tier.descripcion && (
                                    <p className="text-sm text-gray-400 mb-2">{tier.descripcion}</p>
                                  )}
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="font-semibold text-green-600">
                                      ${tier.precio.toLocaleString('es-CO')} COP
                                    </span>
                                    <span className="text-gray-400">
                                      {tierVendidos} / {tier.cantidad} vendidos
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedTier(tier)
                                      setShowEditTierModal(true)
                                    }}
                                    className="p-2 text-gray-400 hover:bg-[#282e39] rounded-lg transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-base">edit</span>
                                  </button>
                                  {tierVendidos === 0 && (
                                    <button
                                      onClick={() => handleDeleteTier(tier)}
                                      disabled={saving}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      <span className="material-symbols-outlined text-base">delete</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Progress Bar del Tier */}
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    tierOcupacion >= 100 ? 'bg-red-600' :
                                    tierOcupacion >= 75 ? 'bg-yellow-500' :
                                    'bg-blue-600'
                                  }`}
                                  style={{ width: `${Math.min(tierOcupacion, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Agregar Fecha */}
      {showAddFechaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b1f27] rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Agregar Nueva Fecha</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={nuevaFecha.fecha}
                  onChange={(e) => setNuevaFecha({ ...nuevaFecha, fecha: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    value={nuevaFecha.horaInicio}
                    onChange={(e) => setNuevaFecha({ ...nuevaFecha, horaInicio: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={nuevaFecha.horaFin}
                    onChange={(e) => setNuevaFecha({ ...nuevaFecha, horaFin: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Aforo Total *
                </label>
                <input
                  type="number"
                  min="1"
                  value={nuevaFecha.aforoTotal}
                  onChange={(e) => setNuevaFecha({ ...nuevaFecha, aforoTotal: e.target.value })}
                  placeholder="Ej: 500"
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddFechaModal(false)
                  setNuevaFecha({ fecha: '', horaInicio: '', horaFin: '', aforoTotal: '' })
                }}
                disabled={saving}
                className="flex-1 px-4 py-3 border border-gray-600 text-gray-700 rounded-lg hover:bg-[#282e39] transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddFecha}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Agregar Fecha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar Tier */}
      {showAddTierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b1f27] rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Agregar Tipo de Entrada</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={nuevoTier.nombre}
                  onChange={(e) => setNuevoTier({ ...nuevoTier, nombre: e.target.value })}
                  placeholder="Ej: General, VIP, Palco"
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Descripción
                </label>
                <textarea
                  value={nuevoTier.descripcion}
                  onChange={(e) => setNuevoTier({ ...nuevoTier, descripcion: e.target.value })}
                  rows={2}
                  placeholder="Descripción opcional del tier"
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Precio (COP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={nuevoTier.precio}
                    onChange={(e) => setNuevoTier({ ...nuevoTier, precio: e.target.value })}
                    placeholder="50000"
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoTier.cantidad}
                    onChange={(e) => setNuevoTier({ ...nuevoTier, cantidad: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  min="1"
                  value={nuevoTier.orden}
                  onChange={(e) => setNuevoTier({ ...nuevoTier, orden: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddTierModal(false)
                  setNuevoTier({ nombre: '', descripcion: '', precio: '', cantidad: '', orden: '1' })
                }}
                disabled={saving}
                className="flex-1 px-4 py-3 border border-gray-600 text-gray-700 rounded-lg hover:bg-[#282e39] transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTier}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? 'Creando...' : 'Crear Tier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Tier */}
      {showEditTierModal && selectedTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b1f27] rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Editar Tipo de Entrada</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Solo puedes editar nombre, descripción, precio y orden. 
                La cantidad no se puede modificar si hay boletos vendidos.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={selectedTier.nombre}
                  onChange={(e) => setSelectedTier({ ...selectedTier, nombre: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Descripción
                </label>
                <textarea
                  value={selectedTier.descripcion}
                  onChange={(e) => setSelectedTier({ ...selectedTier, descripcion: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Precio (COP) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={selectedTier.precio}
                  onChange={(e) => setSelectedTier({ ...selectedTier, precio: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  min="1"
                  value={selectedTier.orden}
                  onChange={(e) => setSelectedTier({ ...selectedTier, orden: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                />
              </div>

              <div className="bg-[#282e39] border border-gray-700 rounded-lg p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Cantidad total:</span>
                  <span className="font-semibold">{selectedTier.cantidad} boletos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Vendidos:</span>
                  <span className="font-semibold">{selectedTier.cantidad - selectedTier.disponibles} boletos</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditTierModal(false)
                  setSelectedTier(null)
                }}
                disabled={saving}
                className="flex-1 px-4 py-3 border border-gray-600 text-gray-700 rounded-lg hover:bg-[#282e39] transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateTier}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
