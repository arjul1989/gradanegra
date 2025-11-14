'use client'

import { useState, useEffect } from 'react'
import { useComercio } from '@/contexts/ComercioContext'
import { useDialog } from '@/contexts/DialogContext'
import Link from 'next/link'
import Image from 'next/image'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Evento {
  id: string
  nombre: string
  descripcion: string
  imagen: string
  ciudad: string
  ubicacion: string
  destacado: boolean
  status: 'activo' | 'pausado' | 'finalizado' | 'cancelado'
  createdAt: string
  totalFechas?: number
  totalBoletos?: number
  totalVentas?: number
}

interface Filters {
  search: string
  status: string
  ciudad: string
}

export default function EventosPage() {
  const { comercio } = useComercio()
  const { confirm, showSuccess, showError } = useDialog()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const limit = 10

  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    ciudad: ''
  })

  // Ciudades únicas para el filtro
  const [ciudades, setCiudades] = useState<string[]>([])

  useEffect(() => {
    if (comercio?.id) {
      fetchEventos()
    }
  }, [comercio, offset, filters.status, filters.ciudad])

  const fetchEventos = async () => {
    if (!comercio?.id) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      })
      
      if (filters.status) params.append('status', filters.status)
      if (filters.ciudad) params.append('ciudad', filters.ciudad)

      const response = await fetch(`${API_URL}/api/comercios/${comercio.id}/eventos?${params}`)
      if (!response.ok) throw new Error('Error al cargar eventos')
      
      const data = await response.json()
      setEventos(data.eventos || [])
      setTotal(data.total || 0)

      // Extraer ciudades únicas
      const uniqueCiudades = [...new Set(
        (data.eventos || []).map((e: Evento) => e.ciudad).filter(Boolean)
      )] as string[]
      setCiudades(uniqueCiudades)

    } catch (error) {
      console.error('Error fetching eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setOffset(0)
    fetchEventos()
  }

  const handleStatusChange = async (eventoId: string, newStatus: 'activo' | 'pausado') => {
    try {
      const response = await fetch(`${API_URL}/api/eventos/${eventoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Error al actualizar estado')

      // Refrescar lista
      fetchEventos()
    } catch (error) {
      console.error('Error updating status:', error)
      await showError('Error al actualizar el estado del evento')
    }
  }

  const handleDelete = async (eventoId: string, eventoNombre: string) => {
    const confirmado = await confirm({
      title: '¿Eliminar evento?',
      message: `¿Estás seguro de eliminar el evento "${eventoNombre}"?\n\nEsta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      icon: 'danger'
    })
    
    if (!confirmado) return

    try {
      const response = await fetch(`${API_URL}/api/eventos/${eventoId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar evento')

      await showSuccess('Evento eliminado exitosamente')
      // Refrescar lista
      fetchEventos()
    } catch (error) {
      console.error('Error deleting evento:', error)
      await showError('Error al eliminar el evento')
    }
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
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-[#282e39] text-white'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  const filteredEventos = eventos.filter(evento => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return evento.nombre.toLowerCase().includes(searchLower) ||
             evento.ciudad.toLowerCase().includes(searchLower) ||
             evento.ubicacion.toLowerCase().includes(searchLower)
    }
    return true
  })

  if (loading && eventos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Mis Eventos</h1>
          <p className="text-gray-400 mt-1">Administra todos tus eventos</p>
        </div>
        <Link 
          href="/panel/eventos/crear"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0d59f2] to-blue-600 hover:from-blue-600 hover:to-[#0d59f2] text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Crear Nuevo Evento
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, ciudad o ubicación..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 bg-[#282e39] border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value })
                setOffset(0)
              }}
              className="w-full px-4 py-2 bg-[#282e39] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="pausado">Pausado</option>
              <option value="finalizado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Filtro por Ciudad */}
          <div>
            <select
              value={filters.ciudad}
              onChange={(e) => {
                setFilters({ ...filters, ciudad: e.target.value })
                setOffset(0)
              }}
              className="w-full px-4 py-2 bg-[#282e39] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent focus:outline-none"
            >
              <option value="">Todas las ciudades</option>
              {ciudades.map(ciudad => (
                <option key={ciudad} value={ciudad}>{ciudad}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Eventos */}
      {filteredEventos.length === 0 ? (
        <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-gray-700 mb-4">
            event_busy
          </span>
          <h3 className="text-xl font-semibold text-white mb-2">
            No se encontraron eventos
          </h3>
          <p className="text-gray-400 mb-6">
            {filters.search || filters.status || filters.ciudad
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando tu primer evento'}
          </p>
          {!filters.search && !filters.status && !filters.ciudad && (
            <Link 
              href="/panel/eventos/crear"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0d59f2] to-blue-600 hover:from-blue-600 hover:to-[#0d59f2] text-white rounded-xl font-medium transition-all"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Crear Primer Evento
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-[#1b1f27] rounded-xl border border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#282e39] border-b border-gray-700">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">Evento</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">Ciudad</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">Estado</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">Destacado</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">Fechas</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">Boletos</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">Ingresos</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredEventos.map((evento) => (
                  <tr key={evento.id} className="hover:bg-[#282e39] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#282e39]">
                          {evento.imagen ? (
                            <Image
                              src={evento.imagen}
                              alt={evento.nombre}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-gray-400">image</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <Link 
                            href={`/panel/eventos/${evento.id}`}
                            className="font-medium text-white hover:text-gray-700"
                          >
                            {evento.nombre}
                          </Link>
                          <p className="text-sm text-gray-400 truncate max-w-xs">
                            {evento.ubicacion}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {evento.ciudad}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(evento.status)}
                    </td>
                    <td className="px-6 py-4">
                      {evento.destacado ? (
                        <span className="inline-flex items-center gap-1 text-yellow-500">
                          <span className="material-symbols-outlined text-base">star</span>
                          <span className="text-xs font-medium">Sí</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {evento.totalFechas || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {evento.totalBoletos || 0}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {formatCurrency(evento.totalVentas || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/panel/eventos/${evento.id}`}
                          className="p-2 text-gray-400 hover:text-white hover:bg-[#282e39] rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </Link>
                        
                        <Link
                          href={`/panel/eventos/${evento.id}/editar`}
                          className="p-2 text-gray-400 hover:text-white hover:bg-[#282e39] rounded-lg transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </Link>

                        {evento.status === 'activo' && (
                          <button
                            onClick={() => handleStatusChange(evento.id, 'pausado')}
                            className="p-2 text-yellow-500 hover:text-yellow-400 hover:bg-[#282e39] rounded-lg transition-colors"
                            title="Pausar"
                          >
                            <span className="material-symbols-outlined text-xl">pause_circle</span>
                          </button>
                        )}

                        {evento.status === 'pausado' && (
                          <button
                            onClick={() => handleStatusChange(evento.id, 'activo')}
                            className="p-2 text-green-500 hover:text-green-400 hover:bg-[#282e39] rounded-lg transition-colors"
                            title="Activar"
                          >
                            <span className="material-symbols-outlined text-xl">play_circle</span>
                          </button>
                        )}

                        {(evento.status === 'pausado' || evento.status === 'activo') && (
                          <button
                            onClick={() => handleDelete(evento.id, evento.nombre)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-[#282e39] rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-[#282e39]">
              <div className="text-sm text-gray-400">
                Mostrando {offset + 1} - {Math.min(offset + limit, total)} de {total} eventos
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-white hover:bg-[#1b1f27] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-400">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-white hover:bg-[#1b1f27] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
