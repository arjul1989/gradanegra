'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useComercio } from '@/contexts/ComercioContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Cupon {
  id: string
  codigo: string
  tipo: 'porcentaje' | 'monto'
  valor: number
  descripcion: string
  eventosAplicables: string[]
  limiteUsos: number
  usosActuales: number
  vigenciaInicio: any
  vigenciaFin: any
  status: 'activo' | 'inactivo' | 'expirado' | 'eliminado'
  createdAt: any
}

interface Evento {
  id: string
  nombre: string
}

export default function CuponesPage() {
  const router = useRouter()
  const { comercio } = useComercio()

  const [cupones, setCupones] = useState<Cupon[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCupon, setEditingCupon] = useState<Cupon | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    codigo: '',
    tipo: 'porcentaje' as 'porcentaje' | 'monto',
    valor: '',
    descripcion: '',
    eventosAplicables: [] as string[],
    limiteUsos: '',
    vigenciaInicio: '',
    vigenciaFin: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (comercio?.id) {
      loadData()
    }
  }, [comercio])

  const loadData = async () => {
    setLoading(true)
    try {
      // Cargar cupones
      const cuponesRes = await fetch(`${API_URL}/api/cupones/comercio/${comercio?.id}`)
      if (cuponesRes.ok) {
        const cuponesData = await cuponesRes.json()
        setCupones(cuponesData)
      }

      // Cargar eventos del comercio
      const eventosRes = await fetch(`${API_URL}/api/comercios/${comercio?.id}/eventos`)
      if (eventosRes.ok) {
        const eventosData = await eventosRes.json()
        console.log('📋 Eventos cargados:', eventosData)
        // Mostrar todos los eventos excepto los eliminados
        const todosEventos = eventosData.eventos || []
        const eventosFiltrados = todosEventos
          .filter((e: any) => {
            // Filtrar eliminados
            if (e.status === 'eliminado' || e.estado === 'eliminado' || e.deletedAt) {
              return false
            }
            return true
          })
          .map((e: any) => ({
            id: e.id,
            // Normalizar nombre (puede ser 'nombre' o 'titulo')
            nombre: e.nombre || e.titulo || 'Evento sin nombre'
          }))
        console.log('📋 Eventos filtrados:', eventosFiltrados.length, 'de', todosEventos.length)
        setEventos(eventosFiltrados)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (cupon?: Cupon) => {
    if (cupon) {
      setEditingCupon(cupon)
      setFormData({
        codigo: cupon.codigo,
        tipo: cupon.tipo,
        valor: cupon.valor.toString(),
        descripcion: cupon.descripcion,
        eventosAplicables: cupon.eventosAplicables || [],
        limiteUsos: cupon.limiteUsos.toString(),
        vigenciaInicio: cupon.vigenciaInicio 
          ? formatDateForInput(cupon.vigenciaInicio.toDate ? cupon.vigenciaInicio.toDate() : new Date(cupon.vigenciaInicio))
          : '',
        vigenciaFin: cupon.vigenciaFin 
          ? formatDateForInput(cupon.vigenciaFin.toDate ? cupon.vigenciaFin.toDate() : new Date(cupon.vigenciaFin))
          : ''
      })
    } else {
      setEditingCupon(null)
      setFormData({
        codigo: '',
        tipo: 'porcentaje',
        valor: '',
        descripcion: '',
        eventosAplicables: [],
        limiteUsos: '',
        vigenciaInicio: '',
        vigenciaFin: ''
      })
    }
    setErrors({})
    setShowModal(true)
  }

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'Código requerido'
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor debe ser mayor a 0'
    }

    if (formData.tipo === 'porcentaje' && parseFloat(formData.valor) > 100) {
      newErrors.valor = 'Porcentaje no puede ser mayor a 100'
    }

    if (formData.tipo === 'monto' && parseFloat(formData.valor) < 1000) {
      newErrors.valor = 'Monto mínimo: 1000 COP'
    }

    if (formData.vigenciaInicio && formData.vigenciaFin) {
      if (new Date(formData.vigenciaInicio) > new Date(formData.vigenciaFin)) {
        newErrors.vigenciaFin = 'Fecha de fin debe ser posterior a la de inicio'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      if (editingCupon) {
        // Actualizar cupón existente
        const res = await fetch(`${API_URL}/api/cupones/${editingCupon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            descripcion: formData.descripcion,
            eventosAplicables: formData.eventosAplicables,
            limiteUsos: formData.limiteUsos ? parseInt(formData.limiteUsos) : 0,
            vigenciaInicio: formData.vigenciaInicio || null,
            vigenciaFin: formData.vigenciaFin || null
          })
        })

        if (!res.ok) {
          const error = await res.json()
          alert(error.error || 'Error al actualizar cupón')
          return
        }

        alert('✅ Cupón actualizado exitosamente')
      } else {
        // Crear nuevo cupón
        const res = await fetch(`${API_URL}/api/cupones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: formData.codigo.toUpperCase().trim(),
            comercioId: comercio?.id,
            tipo: formData.tipo,
            valor: parseFloat(formData.valor),
            descripcion: formData.descripcion,
            eventosAplicables: formData.eventosAplicables,
            limiteUsos: formData.limiteUsos ? parseInt(formData.limiteUsos) : 0,
            vigenciaInicio: formData.vigenciaInicio || null,
            vigenciaFin: formData.vigenciaFin || null
          })
        })

        if (!res.ok) {
          const error = await res.json()
          alert(error.error || 'Error al crear cupón')
          return
        }

        alert('✅ Cupón creado exitosamente')
      }

      setShowModal(false)
      loadData()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar cupón')
    } finally {
      setSaving(false)
    }
  }

  const handleChangeStatus = async (cuponId: string, newStatus: string) => {
    if (!confirm(`¿Confirmas cambiar el status a "${newStatus}"?`)) return

    try {
      const res = await fetch(`${API_URL}/api/cupones/${cuponId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        alert('✅ Status actualizado')
        loadData()
      } else {
        alert('Error al actualizar status')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar status')
    }
  }

  const handleDelete = async (cuponId: string) => {
    if (!confirm('¿Estás seguro de eliminar este cupón? Esta acción no se puede deshacer.')) return

    try {
      const res = await fetch(`${API_URL}/api/cupones/${cuponId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        alert('✅ Cupón eliminado')
        loadData()
      } else {
        alert('Error al eliminar cupón')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar cupón')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      activo: 'bg-green-100 text-green-800',
      inactivo: 'bg-[#282e39] text-white',
      expirado: 'bg-gray-600 text-gray-200',
      eliminado: 'bg-gray-700 text-gray-300'
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando cupones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Cupones de Descuento
          </h1>
          <p className="text-gray-400">
            Crea y gestiona cupones para ofrecer descuentos a tus clientes
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-gradient-to-r from-[#0d59f2] to-blue-600 hover:from-blue-600 hover:to-[#0d59f2] text-white rounded-lg transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
        >
          Crear Cupón
        </button>
      </div>

      {/* Lista de Cupones */}
      {cupones.length === 0 ? (
        <div className="bg-[#1b1f27] rounded-lg border border-gray-700 p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#282e39] flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-gray-500">confirmation_number</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No hay cupones</h2>
          <p className="text-gray-400 mb-4">
            Crea tu primer cupón para ofrecer descuentos
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-gradient-to-r from-[#0d59f2] to-blue-600 hover:from-blue-600 hover:to-[#0d59f2] text-white rounded-lg transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
          >
            Crear Cupón
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cupones.map(cupon => (
            <div
              key={cupon.id}
              className="bg-[#1b1f27] rounded-lg border border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-mono font-bold text-xl text-white mb-1">
                    {cupon.codigo}
                  </div>
                  {getStatusBadge(cupon.status)}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#0d59f2]">
                    {cupon.tipo === 'porcentaje' ? `${cupon.valor}%` : `$${cupon.valor.toLocaleString()}`}
                  </div>
                  <div className="text-xs text-gray-400">
                    {cupon.tipo === 'porcentaje' ? 'Descuento' : 'COP'}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {cupon.descripcion && (
                <p className="text-sm text-gray-400 mb-4">
                  {cupon.descripcion}
                </p>
              )}

              {/* Usos */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-400">Usos</span>
                  <span className="font-semibold text-white">
                    {cupon.usosActuales} {cupon.limiteUsos > 0 ? `/ ${cupon.limiteUsos}` : '/ ∞'}
                  </span>
                </div>
                {cupon.limiteUsos > 0 && (
                  <div className="w-full bg-[#282e39] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#0d59f2] to-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((cupon.usosActuales / cupon.limiteUsos) * 100, 100)}%`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Vigencia */}
              {(cupon.vigenciaInicio || cupon.vigenciaFin) && (
                <div className="text-xs text-gray-400 mb-4">
                  {cupon.vigenciaInicio && (
                    <div>
                      Desde: {new Date(cupon.vigenciaInicio.toDate ? cupon.vigenciaInicio.toDate() : cupon.vigenciaInicio).toLocaleDateString('es-CO')}
                    </div>
                  )}
                  {cupon.vigenciaFin && (
                    <div>
                      Hasta: {new Date(cupon.vigenciaFin.toDate ? cupon.vigenciaFin.toDate() : cupon.vigenciaFin).toLocaleDateString('es-CO')}
                    </div>
                  )}
                </div>
              )}

              {/* Eventos */}
              {cupon.eventosAplicables.length > 0 ? (
                <div className="text-xs text-gray-400 mb-4">
                  Válido para {cupon.eventosAplicables.length} evento(s)
                </div>
              ) : (
                <div className="text-xs text-green-600 mb-4">
                  ✓ Válido para todos los eventos
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleOpenModal(cupon)}
                  className="flex-1 px-3 py-2 text-sm bg-[#282e39] text-white rounded hover:bg-[#3b4354] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
                >
                  Editar
                </button>

                {cupon.status === 'activo' && (
                  <button
                    onClick={() => handleChangeStatus(cupon.id, 'inactivo')}
                    className="flex-1 px-3 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    Desactivar
                  </button>
                )}

                {cupon.status === 'inactivo' && (
                  <button
                    onClick={() => handleChangeStatus(cupon.id, 'activo')}
                    className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    Activar
                  </button>
                )}

                <button
                  onClick={() => handleDelete(cupon.id)}
                  className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#282e39] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
                >
                  <span className="material-icons text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b1f27] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">
                {editingCupon ? 'Editar Cupón' : 'Crear Cupón'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Código */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  disabled={!!editingCupon}
                  placeholder="Ej: VERANO2025"
                  className={`w-full px-4 py-2 border rounded-lg font-mono bg-[#282e39] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                    editingCupon ? 'cursor-not-allowed opacity-60' : ''
                  } ${errors.codigo ? 'border-[#0d59f2]' : 'border-gray-700'}`}
                />
                {errors.codigo && <p className="text-[#0d59f2] text-sm mt-1">{errors.codigo}</p>}
                {editingCupon && (
                  <p className="text-xs text-gray-400 mt-1">El código no se puede modificar</p>
                )}
              </div>

              {/* Tipo y Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Tipo de Descuento *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                    disabled={!!editingCupon}
                    className={`w-full px-4 py-2 border border-gray-700 bg-[#282e39] text-white rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                      editingCupon ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="monto">Monto Fijo (COP)</option>
                  </select>
                  {editingCupon && (
                    <p className="text-xs text-gray-400 mt-1">El tipo no se puede modificar</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Valor *
                  </label>
                  <input
                    type="number"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    disabled={!!editingCupon}
                    placeholder={formData.tipo === 'porcentaje' ? '10' : '5000'}
                    className={`w-full px-4 py-2 border rounded-lg bg-[#282e39] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                      editingCupon ? 'cursor-not-allowed opacity-60' : ''
                    } ${errors.valor ? 'border-[#0d59f2]' : 'border-gray-700'}`}
                  />
                  {errors.valor && <p className="text-[#0d59f2] text-sm mt-1">{errors.valor}</p>}
                  {editingCupon && (
                    <p className="text-xs text-gray-400 mt-1">El valor no se puede modificar</p>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Ej: Descuento de verano para eventos en diciembre"
                  className="w-full px-4 py-2 border border-gray-700 bg-[#282e39] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  rows={2}
                />
              </div>

              {/* Eventos Aplicables */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Eventos Aplicables
                </label>
                <div className="border border-gray-700 bg-[#1b1f27] rounded-lg p-3 max-h-40 overflow-y-auto">
                  <label className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-[#282e39] p-1 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.eventosAplicables.length === 0}
                      onChange={(e) => {
                        setFormData({ ...formData, eventosAplicables: [] })
                      }}
                      className="rounded accent-[#0d59f2] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
                    />
                    <span className="text-sm font-semibold text-[#0d59f2]">Todos los eventos</span>
                  </label>
                  
                  {eventos.map(evento => (
                    <label key={evento.id} className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-[#282e39] p-1 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.eventosAplicables.includes(evento.id)}
                        disabled={formData.eventosAplicables.length === 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              eventosAplicables: [...formData.eventosAplicables, evento.id]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              eventosAplicables: formData.eventosAplicables.filter(id => id !== evento.id)
                            })
                          }
                        }}
                        className="rounded accent-[#0d59f2] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d59f2] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className={`text-sm ${formData.eventosAplicables.length === 0 ? 'text-gray-500' : 'text-white'}`}>{evento.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Límite de Usos */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Límite de Usos (0 = ilimitado)
                </label>
                <input
                  type="number"
                  value={formData.limiteUsos}
                  onChange={(e) => setFormData({ ...formData, limiteUsos: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-700 bg-[#282e39] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                />
              </div>

              {/* Vigencia */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Vigencia Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.vigenciaInicio}
                    onChange={(e) => setFormData({ ...formData, vigenciaInicio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-700 bg-[#282e39] text-white rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Vigencia Fin
                  </label>
                  <input
                    type="date"
                    value={formData.vigenciaFin}
                    onChange={(e) => setFormData({ ...formData, vigenciaFin: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg bg-[#282e39] text-white focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                      errors.vigenciaFin ? 'border-[#0d59f2]' : 'border-gray-700'
                    }`}
                  />
                  {errors.vigenciaFin && <p className="text-[#0d59f2] text-sm mt-1">{errors.vigenciaFin}</p>}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-700 bg-transparent text-white rounded-lg hover:bg-[#282e39] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#0d59f2] to-blue-600 hover:from-blue-600 hover:to-[#0d59f2] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
              >
                {saving ? 'Guardando...' : editingCupon ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
