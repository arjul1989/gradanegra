'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useComercio } from '@/contexts/ComercioContext'
import Image from 'next/image'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Evento {
  id: string
  comercioId: string
  nombre: string
  descripcion: string
  imagen: string
  ciudad: string
  ubicacion: string
  categoria: string
  destacado: boolean
  status: 'activo' | 'pausado' | 'finalizado' | 'cancelado'
  createdAt: string
  updatedAt: string
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

interface Boleto {
  id: string
  tierId: string
  numeroBoleto: string
  precio: number
  status: string
  compraId: string
  compradorEmail?: string
  fechaCompra?: string
  tierNombre?: string
}

export default function EventoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { comercio } = useComercio()
  const eventoId = params.id as string

  const [evento, setEvento] = useState<Evento | null>(null)
  const [fechas, setFechas] = useState<FechaEvento[]>([])
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFecha, setExpandedFecha] = useState<string | null>(null)
  const [showBoletos, setShowBoletos] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)

  useEffect(() => {
    if (comercio?.id && eventoId) {
      fetchEventoDetalle()
    }
  }, [comercio, eventoId])

  const fetchEventoDetalle = async () => {
    setLoading(true)
    try {
      // Fetch evento
      const eventoRes = await fetch(`${API_URL}/api/eventos/${eventoId}`)
      if (!eventoRes.ok) throw new Error('Evento no encontrado')
      const result = await eventoRes.json()
      
      if (!result.success || !result.data) {
        throw new Error('Respuesta inválida del servidor')
      }
      
      const eventoData = result.data

      // Verificar que el evento pertenece al comercio
      if (eventoData.comercioId !== comercio?.id) {
        alert('No tienes permiso para ver este evento')
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

      // Fetch boletos vendidos
      const boletosRes = await fetch(`${API_URL}/api/eventos/${eventoId}/boletos-vendidos`)
      if (boletosRes.ok) {
        const boletosData = await boletosRes.json()
        setBoletos(boletosData)
      }

    } catch (error) {
      console.error('Error fetching evento:', error)
      alert('Error al cargar el evento')
      router.push('/panel/eventos')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: 'activo' | 'pausado') => {
    const confirmMessage = newStatus === 'pausado' 
      ? '¿Pausar este evento? No será visible para los compradores.'
      : '¿Activar este evento? Será visible públicamente.'

    if (!confirm(confirmMessage)) return

    setChangingStatus(true)
    try {
      const response = await fetch(`${API_URL}/api/eventos/${eventoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Error al cambiar estado')

      setEvento(prev => prev ? { ...prev, status: newStatus } : null)
      alert(`✅ Evento ${newStatus === 'pausado' ? 'pausado' : 'activado'} exitosamente`)
    } catch (error) {
      console.error('Error changing status:', error)
      alert('❌ Error al cambiar el estado del evento')
    } finally {
      setChangingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(
      `¿Estás seguro de eliminar el evento "${evento?.nombre}"?\n\n` +
      'Esta acción no se puede deshacer. Se cancelarán todas las fechas y boletos.'
    )) return

    try {
      const response = await fetch(`${API_URL}/api/eventos/${eventoId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar')

      alert('✅ Evento eliminado exitosamente')
      router.push('/panel/eventos')
    } catch (error) {
      console.error('Error deleting:', error)
      alert('❌ Error al eliminar el evento')
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      activo: 'bg-green-100 text-green-800',
      pausado: 'bg-yellow-100 text-yellow-800',
      finalizado: 'bg-[#282e39] text-white',
      cancelado: 'bg-red-100 text-red-800'
    }
    
    const labels = {
      activo: 'Activo',
      pausado: 'Pausado',
      finalizado: 'Finalizado',
      cancelado: 'Cancelado'
    }

    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  // Cálculos de estadísticas
  const totalBoletosGenerados = fechas.reduce((sum, fecha) => 
    sum + fecha.tiers.reduce((tierSum, tier) => tierSum + tier.cantidad, 0), 0
  )

  const totalBoletosVendidos = boletos.filter(b => b.status === 'vendido' || b.status === 'usado').length

  const ingresosBrutos = boletos
    .filter(b => b.status === 'vendido' || b.status === 'usado')
    .reduce((sum, b) => sum + b.precio, 0)

  const comisionPlataforma = ingresosBrutos * ((comercio?.comision || 10) / 100)
  const ingresosNetos = ingresosBrutos - comisionPlataforma

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando evento...</p>
        </div>
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
          event_busy
        </span>
        <h2 className="text-2xl font-bold text-white mb-2">Evento no encontrado</h2>
        <Link href="/panel/eventos" className="text-gray-400 hover:text-white">
          Volver a Mis Eventos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/panel/eventos" className="hover:text-white">Mis Eventos</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-white">{evento.nombre}</span>
      </div>

      {/* Header */}
      <div className="bg-[#1b1f27] rounded-xl shadow-lg overflow-hidden">
        <div className="relative h-80 w-full">
          <Image
            src={evento.imagen}
            alt={evento.nombre}
            fill
            className="object-cover"
          />
          {evento.destacado && (
            <div className="absolute top-6 right-6 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
              <span className="material-symbols-outlined">star</span>
              Evento Destacado
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{evento.nombre}</h1>
              <div className="flex items-center gap-4 text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined">location_on</span>
                  <span>{evento.ciudad}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined">category</span>
                  <span>{evento.categoria}</span>
                </div>
              </div>
            </div>
            <div>
              {getStatusBadge(evento.status)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
            <Link
              href={`/panel/eventos/${eventoId}/editar`}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">edit</span>
              Editar
            </Link>

            <Link
              href={`/panel/eventos/${eventoId}/gestionar-fechas`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">event_note</span>
              Fechas y Tiers
            </Link>

            <Link
              href={`/panel/eventos/${eventoId}/verificar`}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
              Verificar Boletos
            </Link>

            {evento.status === 'activo' && (
              <button
                onClick={() => handleStatusChange('pausado')}
                disabled={changingStatus}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl">pause_circle</span>
                {changingStatus ? 'Pausando...' : 'Pausar'}
              </button>
            )}

            {evento.status === 'pausado' && (
              <button
                onClick={() => handleStatusChange('activo')}
                disabled={changingStatus}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl">play_circle</span>
                {changingStatus ? 'Activando...' : 'Activar'}
              </button>
            )}

            {(evento.status === 'pausado' || evento.status === 'activo') && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors ml-auto"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información General */}
          <div className="bg-[#1b1f27] rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Información General</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Descripción</h3>
                <p className="text-white whitespace-pre-wrap">{evento.descripcion}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Ubicación</h3>
                  <p className="text-white">{evento.ubicacion}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Categoría</h3>
                  <p className="text-white">{evento.categoria}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fechas del Evento */}
          <div className="bg-[#1b1f27] rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Fechas del Evento ({fechas.length})
            </h2>
            <div className="space-y-4">
              {fechas.map((fecha) => {
                const boletosVendidosFecha = fecha.tiers.reduce((sum, tier) => 
                  sum + (tier.cantidad - tier.disponibles), 0
                )
                const ocupacion = (boletosVendidosFecha / fecha.aforoTotal) * 100

                return (
                  <div key={fecha.id} className="border border-gray-700 rounded-lg overflow-hidden">
                    <div 
                      className="p-4 bg-[#282e39] cursor-pointer hover:bg-[#282e39] transition-colors"
                      onClick={() => setExpandedFecha(expandedFecha === fecha.id ? null : fecha.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">
                            {formatDate(fecha.fecha)}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {fecha.horaInicio}
                            {fecha.horaFin && ` - ${fecha.horaFin}`}
                          </p>
                        </div>
                        <div className="text-right mr-4">
                          <p className="text-sm text-gray-400">Ocupación</p>
                          <p className="text-lg font-bold text-white">
                            {boletosVendidosFecha} / {fecha.aforoTotal}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-gray-400">
                          {expandedFecha === fecha.id ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              ocupacion === 100 ? 'bg-green-500' :
                              ocupacion >= 75 ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(ocupacion, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {ocupacion.toFixed(1)}% ocupado
                        </p>
                      </div>
                    </div>

                    {/* Tiers (expandible) */}
                    {expandedFecha === fecha.id && (
                      <div className="p-4 border-t border-gray-700">
                        <h4 className="font-semibold text-white mb-3">Tiers de Entrada</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-700">
                                <th className="text-left py-2 px-2 text-gray-700 font-semibold">Tier</th>
                                <th className="text-right py-2 px-2 text-gray-700 font-semibold">Precio</th>
                                <th className="text-right py-2 px-2 text-gray-700 font-semibold">Vendidos/Total</th>
                                <th className="text-right py-2 px-2 text-gray-700 font-semibold">% Ocupación</th>
                                <th className="text-right py-2 px-2 text-gray-700 font-semibold">Disponibles</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fecha.tiers.map((tier) => {
                                const vendidos = tier.cantidad - tier.disponibles
                                const ocupacionTier = (vendidos / tier.cantidad) * 100

                                return (
                                  <tr key={tier.id} className="border-b border-gray-700">
                                    <td className="py-2 px-2">
                                      <div>
                                        <p className="font-medium text-white">{tier.nombre}</p>
                                        {tier.descripcion && (
                                          <p className="text-xs text-gray-400">{tier.descripcion}</p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="text-right py-2 px-2 text-white">
                                      {formatCurrency(tier.precio)}
                                    </td>
                                    <td className="text-right py-2 px-2 text-white">
                                      {vendidos} / {tier.cantidad}
                                    </td>
                                    <td className="text-right py-2 px-2">
                                      <span className={`font-semibold ${
                                        ocupacionTier === 100 ? 'text-green-600' :
                                        ocupacionTier >= 75 ? 'text-yellow-600' : 'text-blue-600'
                                      }`}>
                                        {ocupacionTier.toFixed(0)}%
                                      </span>
                                    </td>
                                    <td className="text-right py-2 px-2 font-semibold text-white">
                                      {tier.disponibles}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {fechas.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                  <p>No hay fechas configuradas</p>
                </div>
              )}
            </div>
          </div>

          {/* Boletos Vendidos */}
          <div className="bg-[#1b1f27] rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Boletos Vendidos ({totalBoletosVendidos})
              </h2>
              <button
                onClick={() => setShowBoletos(!showBoletos)}
                className="text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined">
                  {showBoletos ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>

            {showBoletos && (
              <div className="overflow-x-auto">
                {boletos.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 bg-[#282e39]">
                        <th className="text-left py-2 px-3 text-gray-700 font-semibold"># Boleto</th>
                        <th className="text-left py-2 px-3 text-gray-700 font-semibold">Tier</th>
                        <th className="text-right py-2 px-3 text-gray-700 font-semibold">Precio</th>
                        <th className="text-left py-2 px-3 text-gray-700 font-semibold">Fecha Compra</th>
                        <th className="text-left py-2 px-3 text-gray-700 font-semibold">Comprador</th>
                        <th className="text-left py-2 px-3 text-gray-700 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boletos.slice(0, 50).map((boleto) => (
                        <tr key={boleto.id} className="border-b border-gray-700 hover:bg-[#282e39]">
                          <td className="py-2 px-3 font-mono text-xs text-white">
                            {boleto.numeroBoleto}
                          </td>
                          <td className="py-2 px-3 text-white">
                            {boleto.tierNombre || '-'}
                          </td>
                          <td className="text-right py-2 px-3 text-white">
                            {formatCurrency(boleto.precio)}
                          </td>
                          <td className="py-2 px-3 text-gray-400 text-xs">
                            {boleto.fechaCompra || '-'}
                          </td>
                          <td className="py-2 px-3 text-white text-xs">
                            {boleto.compradorEmail || '-'}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              boleto.status === 'usado' ? 'bg-[#282e39] text-gray-700' :
                              boleto.status === 'vendido' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {boleto.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2">confirmation_number</span>
                    <p>No hay boletos vendidos aún</p>
                  </div>
                )}
                {boletos.length > 50 && (
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    Mostrando los primeros 50 de {boletos.length} boletos
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Columna Lateral - Estadísticas */}
        <div className="space-y-6">
          {/* Estadísticas de Ventas */}
          <div className="bg-gradient-to-br from-[#0d59f2] to-blue-600 rounded-xl shadow-lg p-6 text-white sticky top-4">
            <h2 className="text-lg font-bold mb-4">Estadísticas de Ventas</h2>
            
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-600">
                <p className="text-sm text-gray-700 mb-1">Total Boletos Generados</p>
                <p className="text-3xl font-bold">{totalBoletosGenerados.toLocaleString()}</p>
              </div>

              <div className="pb-4 border-b border-gray-600">
                <p className="text-sm text-gray-700 mb-1">Boletos Vendidos</p>
                <p className="text-3xl font-bold text-green-400">{totalBoletosVendidos.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {totalBoletosGenerados > 0 
                    ? `${((totalBoletosVendidos / totalBoletosGenerados) * 100).toFixed(1)}% vendido`
                    : '0% vendido'
                  }
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-1">Ingresos Brutos</p>
                <p className="text-2xl font-bold">{formatCurrency(ingresosBrutos)}</p>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-b border-gray-600">
                <div>
                  <p className="text-sm text-gray-700">Comisión Plataforma</p>
                  <p className="text-xs text-gray-400">({comercio?.comision || 10}%)</p>
                </div>
                <p className="text-lg font-semibold text-red-300">
                  -{formatCurrency(comisionPlataforma)}
                </p>
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-700 mb-1">Ingresos Netos</p>
                <p className="text-3xl font-bold text-green-400">
                  {formatCurrency(ingresosNetos)}
                </p>
              </div>
            </div>
          </div>

          {/* Info del Evento */}
          <div className="bg-[#1b1f27] rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-white mb-4">Información del Evento</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Creado el:</span>
                <span className="text-white font-medium">
                  {new Date(evento.createdAt).toLocaleDateString('es-CO')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Última actualización:</span>
                <span className="text-white font-medium">
                  {new Date(evento.updatedAt).toLocaleDateString('es-CO')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total de fechas:</span>
                <span className="text-white font-medium">{fechas.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Destacado:</span>
                <span className="text-white font-medium">
                  {evento.destacado ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
