'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useComercio } from '@/contexts/ComercioContext'
import Image from 'next/image'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface EventoData {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  ciudad: string
  ubicacion: string
  imagen: string
  destacado: boolean
}

interface FechaData {
  id: string
  fecha: string
  horaInicio: string
  horaFin: string
  aforoTotal: number
}

interface TierData {
  id: string
  fechaEventoId: string
  nombre: string
  descripcion: string
  precio: number
  cantidad: number
  orden: number
}

interface FechaConTiers extends FechaData {
  tiers: TierData[]
}

export default function Paso4Page() {
  const router = useRouter()
  const { comercio } = useComercio()
  const [evento, setEvento] = useState<EventoData | null>(null)
  const [fechasConTiers, setFechasConTiers] = useState<FechaConTiers[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  useEffect(() => {
    // Load event data from localStorage
    const eventoStr = localStorage.getItem('eventoCreado')
    const fechasStr = localStorage.getItem('fechasConTiers')

    if (!eventoStr || !fechasStr) {
      router.push('/panel/eventos/crear')
      return
    }

    try {
      const eventoData = JSON.parse(eventoStr)
      const fechasData = JSON.parse(fechasStr)
      
      setEvento(eventoData)
      setFechasConTiers(fechasData)
    } catch (error) {
      console.error('Error loading data:', error)
      router.push('/panel/eventos/crear')
    }
  }, [router])

  // Calculate totals
  const getTotalBoletos = () => {
    return fechasConTiers.reduce((total, fecha) => {
      return total + fecha.tiers.reduce((sum, tier) => sum + tier.cantidad, 0)
    }, 0)
  }

  const getIngresosBrutos = () => {
    return fechasConTiers.reduce((total, fecha) => {
      return total + fecha.tiers.reduce((sum, tier) => sum + (tier.precio * tier.cantidad), 0)
    }, 0)
  }

  const getComision = () => {
    const ingresosBrutos = getIngresosBrutos()
    const comisionPorcentaje = comercio?.comision || 10
    return (ingresosBrutos * comisionPorcentaje) / 100
  }

  const getIngresosNetos = () => {
    return getIngresosBrutos() - getComision()
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

  const handleBack = () => {
    router.push('/panel/eventos/crear/paso-3')
  }

  const handleSaveDraft = async () => {
    if (!evento) return

    setIsSavingDraft(true)
    try {
      // Update event status to 'pausado' (draft)
      const response = await fetch(`${API_URL}/api/eventos/${evento.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'pausado'
        })
      })

      if (!response.ok) {
        throw new Error('Error al guardar borrador')
      }

      // Clear localStorage
      localStorage.removeItem('eventoCreado')
      localStorage.removeItem('fechasEvento')
      localStorage.removeItem('fechasConTiers')

      alert('✅ Evento guardado como borrador')
      router.push('/panel/eventos')
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('❌ Error al guardar borrador')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handlePublish = async () => {
    if (!evento) return

    const confirmed = confirm(
      `¿Estás seguro de publicar el evento "${evento.nombre}"?\n\n` +
      `Se generarán ${getTotalBoletos()} boletos individuales.\n` +
      `Este proceso puede tardar unos momentos.`
    )

    if (!confirmed) return

    setIsPublishing(true)
    try {
      // Generate boletos for each tier
      let boletosGenerados = 0
      
      for (const fecha of fechasConTiers) {
        for (const tier of fecha.tiers) {
          const response = await fetch(`${API_URL}/api/tiers/${tier.id}/generar-boletos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            throw new Error(`Error al generar boletos para ${tier.nombre}`)
          }

          const result = await response.json()
          boletosGenerados += result.boletosGenerados
        }
      }

      // Update event status to 'activo' (published)
      const updateResponse = await fetch(`${API_URL}/api/eventos/${evento.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'activo'
        })
      })

      if (!updateResponse.ok) {
        throw new Error('Error al publicar evento')
      }

      // Clear localStorage
      localStorage.removeItem('eventoCreado')
      localStorage.removeItem('fechasEvento')
      localStorage.removeItem('fechasConTiers')

      alert(`✅ Evento publicado exitosamente\n\n${boletosGenerados} boletos generados`)
      router.push('/panel/eventos')
    } catch (error) {
      console.error('Error publishing event:', error)
      alert('❌ Error al publicar evento. Por favor intenta nuevamente.')
    } finally {
      setIsPublishing(false)
    }
  }

  if (!evento || fechasConTiers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando resumen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
              ✓
            </div>
            <span className="text-sm text-gray-400">Información Básica</span>
          </div>
          <div className="h-px flex-1 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
              ✓
            </div>
            <span className="text-sm text-gray-400">Fechas</span>
          </div>
          <div className="h-px flex-1 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
              ✓
            </div>
            <span className="text-sm text-gray-400">Tiers</span>
          </div>
          <div className="h-px flex-1 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold">
              4
            </div>
            <span className="text-sm font-semibold text-white">Resumen</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Resumen y Publicación</h1>
        <p className="text-gray-400">
          Revisa toda la información antes de publicar tu evento
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Event Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Card */}
          <div className="bg-[#1b1f27] rounded-xl shadow-lg overflow-hidden">
            <div className="relative h-64 w-full">
              <Image
                src={evento.imagen}
                alt={evento.nombre}
                fill
                className="object-cover"
              />
              {evento.destacado && (
                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">star</span>
                  Destacado
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-2">{evento.nombre}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">location_on</span>
                  {evento.ciudad}
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">category</span>
                  {evento.categoria}
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{evento.descripcion}</p>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  <span className="material-symbols-outlined text-lg align-middle">place</span>
                  {' '}{evento.ubicacion}
                </p>
              </div>
            </div>
          </div>

          {/* Dates and Tiers */}
          <div className="bg-[#1b1f27] rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Fechas y Entradas</h3>
            <div className="space-y-6">
              {fechasConTiers.map((fecha, index) => (
                <div key={fecha.id} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-white">
                        {formatDate(fecha.fecha)}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {fecha.horaInicio}
                        {fecha.horaFin && ` - ${fecha.horaFin}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Aforo Total</p>
                      <p className="text-lg font-bold text-white">
                        {fecha.aforoTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Tiers Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-2 font-semibold text-gray-700">Tier</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-700">Precio</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-700">Cantidad</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fecha.tiers.map((tier) => (
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
                              {tier.cantidad.toLocaleString()}
                            </td>
                            <td className="text-right py-2 px-2 font-semibold text-white">
                              {formatCurrency(tier.precio * tier.cantidad)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-600">
                          <td colSpan={2} className="py-2 px-2 font-semibold text-white">
                            Subtotal Fecha
                          </td>
                          <td className="text-right py-2 px-2 font-semibold text-white">
                            {fecha.tiers.reduce((sum, t) => sum + t.cantidad, 0).toLocaleString()}
                          </td>
                          <td className="text-right py-2 px-2 font-semibold text-white">
                            {formatCurrency(
                              fecha.tiers.reduce((sum, t) => sum + (t.precio * t.cantidad), 0)
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Financial Summary */}
        <div className="space-y-6">
          {/* Financial Card */}
          <div className="bg-gradient-to-br from-[#0d59f2] to-blue-600 rounded-xl shadow-lg p-6 text-white sticky top-4">
            <h3 className="text-lg font-bold mb-4">Proyección Financiera</h3>
            
            <div className="space-y-4">
              {/* Total Boletos */}
              <div className="pb-4 border-b border-gray-600">
                <p className="text-sm text-gray-700 mb-1">Total de Boletos</p>
                <p className="text-3xl font-bold">{getTotalBoletos().toLocaleString()}</p>
              </div>

              {/* Ingresos Brutos */}
              <div>
                <p className="text-sm text-gray-700 mb-1">Ingresos Brutos</p>
                <p className="text-2xl font-bold">{formatCurrency(getIngresosBrutos())}</p>
                <p className="text-xs text-gray-400 mt-1">Si se venden todos los boletos</p>
              </div>

              {/* Comisión */}
              <div className="flex items-center justify-between py-3 border-t border-b border-gray-600">
                <div>
                  <p className="text-sm text-gray-700">Comisión Plataforma</p>
                  <p className="text-xs text-gray-400">({comercio?.comision || 10}%)</p>
                </div>
                <p className="text-lg font-semibold text-red-300">
                  -{formatCurrency(getComision())}
                </p>
              </div>

              {/* Ingresos Netos */}
              <div className="pt-2">
                <p className="text-sm text-gray-700 mb-1">Ingresos Netos Estimados</p>
                <p className="text-3xl font-bold text-green-400">
                  {formatCurrency(getIngresosNetos())}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-600 space-y-3">
              <button
                onClick={handlePublish}
                disabled={isPublishing || isSavingDraft}
                className="w-full bg-[#1b1f27] text-white py-3 rounded-lg font-semibold hover:bg-[#282e39] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                    Publicando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    Publicar Evento
                  </>
                )}
              </button>

              <button
                onClick={handleSaveDraft}
                disabled={isPublishing || isSavingDraft}
                className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingDraft ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Guardar Borrador
                  </>
                )}
              </button>

              <button
                onClick={handleBack}
                disabled={isPublishing || isSavingDraft}
                className="w-full bg-transparent border-2 border-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Volver
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600">info</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Antes de publicar:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Verifica que toda la información sea correcta</li>
                  <li>Los boletos se generarán automáticamente</li>
                  <li>El evento será visible en el sitio público</li>
                  <li>Podrás pausar o editar el evento después</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
