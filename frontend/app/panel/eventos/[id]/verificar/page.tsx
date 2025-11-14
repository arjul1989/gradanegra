'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface VerificationResult {
  valid: boolean
  status: string
  warnings: string[]
  errors: string[]
  boleto: {
    id: string
    numeroBoleto: string
    precio: number
    status: string
    fechaUso?: any
  }
  tier: {
    nombre: string
    descripcion: string
  }
  evento: {
    nombre: string
    imagen: string
    ubicacion: string
  }
  fecha: {
    fecha: string
    horaInicio: string
    horaFin: string
  }
  comprador: {
    nombre: string
    email: string
    telefono: string
  } | null
}

interface Estadisticas {
  totalBoletos: number
  boletosVendidos: number
  boletosUsados: number
  tasaAsistencia: number
}

export default function VerificarBoletosPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const eventoId = params.id as string

  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [comercioId, setComercioId] = useState('')
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true)

  // Cargar comercioId y estadísticas
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar evento para obtener comercioId
        const eventoRes = await fetch(`/api/eventos/${eventoId}`)
        if (eventoRes.ok) {
          const evento = await eventoRes.json()
          setComercioId(evento.comercioId)
        }

        // Cargar estadísticas
        const statsRes = await fetch(`/api/verificacion/estadisticas/${eventoId}`)
        if (statsRes.ok) {
          const stats = await statsRes.json()
          setEstadisticas(stats)
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoadingEstadisticas(false)
      }
    }

    loadData()
  }, [eventoId])

  const handleVerify = async () => {
    if (!inputValue.trim()) {
      alert('Por favor ingresa un código QR o número de boleto')
      return
    }

    setLoading(true)
    setShowResult(false)

    try {
      const res = await fetch('/api/verificacion/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode: inputValue,
          numeroBoleto: inputValue,
          comercioId
        })
      })

      const data = await res.json()
      setVerificationResult(data)
      setShowResult(true)

    } catch (error) {
      console.error('Error en verificación:', error)
      alert('Error al verificar el boleto')
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarUsado = async () => {
    if (!verificationResult?.boleto.id) return

    if (!confirm('¿Confirmas que deseas marcar este boleto como usado?')) return

    try {
      const res = await fetch('/api/verificacion/marcar-usado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boletoId: verificationResult.boleto.id,
          verificadorId: user?.uid,
          ubicacion: 'web-panel'
        })
      })

      if (res.ok) {
        alert('✅ Boleto marcado como usado exitosamente')
        
        // Actualizar resultado
        setVerificationResult({
          ...verificationResult,
          boleto: {
            ...verificationResult.boleto,
            status: 'usado'
          },
          status: 'usado',
          valid: false,
          errors: ['Este boleto ya fue usado']
        })

        // Recargar estadísticas
        const statsRes = await fetch(`/api/verificacion/estadisticas/${eventoId}`)
        if (statsRes.ok) {
          const stats = await statsRes.json()
          setEstadisticas(stats)
        }

        // Limpiar input
        setInputValue('')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error al marcar como usado:', error)
      alert('Error al marcar el boleto')
    }
  }

  const handleNewScan = () => {
    setInputValue('')
    setVerificationResult(null)
    setShowResult(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <span className="material-icons text-xl">arrow_back</span>
          <span>Volver</span>
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">
          Verificar Boletos
        </h1>
        <p className="text-gray-400">
          Escanea o ingresa el código para verificar la validez del boleto
        </p>
      </div>

      {/* Estadísticas */}
      {!loadingEstadisticas && estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1b1f27] p-4 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Total Boletos</div>
            <div className="text-2xl font-bold text-white">
              {estadisticas.totalBoletos}
            </div>
          </div>

          <div className="bg-[#1b1f27] p-4 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Vendidos</div>
            <div className="text-2xl font-bold text-blue-600">
              {estadisticas.boletosVendidos}
            </div>
          </div>

          <div className="bg-[#1b1f27] p-4 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Usados</div>
            <div className="text-2xl font-bold text-green-600">
              {estadisticas.boletosUsados}
            </div>
          </div>

          <div className="bg-[#1b1f27] p-4 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Asistencia</div>
            <div className="text-2xl font-bold text-purple-600">
              {estadisticas.tasaAsistencia}%
            </div>
          </div>
        </div>
      )}

      {/* Scanner Section */}
      {!showResult ? (
        <div className="bg-[#1b1f27] rounded-lg border border-gray-700 p-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-4">
                <span className="material-icons text-5xl text-blue-600">qr_code_scanner</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Escanear Boleto
              </h2>
              <p className="text-gray-400 text-sm">
                Ingresa el código QR o número de boleto
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código / Número de Boleto
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerify()
                    }
                  }}
                  placeholder="Ej: BOL-123456 o código QR"
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
                  autoFocus
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || !inputValue.trim()}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-icons animate-spin">refresh</span>
                    Verificando...
                  </>
                ) : (
                  <>
                    <span className="material-icons">check_circle</span>
                    Verificar Boleto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Result Section */
        <div className="space-y-6">
          {/* Status Card */}
          <div
            className={`rounded-lg border-2 p-6 ${
              verificationResult?.valid
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${
                  verificationResult?.valid ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                <span className="material-icons text-4xl text-white">
                  {verificationResult?.valid ? 'check_circle' : 'cancel'}
                </span>
              </div>

              <div className="flex-1">
                <h2
                  className={`text-2xl font-bold mb-2 ${
                    verificationResult?.valid ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {verificationResult?.valid ? '✅ Boleto Válido' : '❌ Boleto No Válido'}
                </h2>

                {/* Errors */}
                {verificationResult?.errors && verificationResult.errors.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {verificationResult.errors.map((error, idx) => (
                      <p key={idx} className="text-red-800 font-medium">
                        • {error}
                      </p>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {verificationResult?.warnings && verificationResult.warnings.length > 0 && (
                  <div className="space-y-1">
                    {verificationResult.warnings.map((warning, idx) => (
                      <p key={idx} className="text-yellow-700 text-sm">
                        ⚠️ {warning}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          {verificationResult && (
            <div className="bg-[#1b1f27] rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-icons">confirmation_number</span>
                Detalles del Boleto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Número de Boleto</div>
                  <div className="font-mono font-bold text-white">
                    {verificationResult.boleto.numeroBoleto}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Precio</div>
                  <div className="font-bold text-white">
                    ${verificationResult.boleto.precio.toLocaleString('es-CO')}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Tier</div>
                  <div className="font-bold text-white">
                    {verificationResult.tier.nombre}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Status</div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      verificationResult.boleto.status === 'vendido'
                        ? 'bg-green-100 text-green-800'
                        : verificationResult.boleto.status === 'usado'
                        ? 'bg-[#282e39] text-white'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {verificationResult.boleto.status}
                  </span>
                </div>
              </div>

              {/* Event Info */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="font-bold text-white mb-3">Evento</h4>
                <div className="flex items-start gap-4">
                  {verificationResult.evento.imagen && (
                    <img
                      src={verificationResult.evento.imagen}
                      alt={verificationResult.evento.nombre}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <div className="font-bold text-white mb-1">
                      {verificationResult.evento.nombre}
                    </div>
                    <div className="text-sm text-gray-400 mb-1">
                      📍 {verificationResult.evento.ubicacion}
                    </div>
                    <div className="text-sm text-gray-400">
                      📅 {new Date(verificationResult.fecha.fecha).toLocaleDateString('es-CO')} -{' '}
                      {verificationResult.fecha.horaInicio}
                    </div>
                  </div>
                </div>
              </div>

              {/* Buyer Info */}
              {verificationResult.comprador && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h4 className="font-bold text-white mb-3">Comprador</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400">Nombre</div>
                      <div className="font-medium text-white">
                        {verificationResult.comprador.nombre}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Email</div>
                      <div className="font-medium text-white">
                        {verificationResult.comprador.email}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Teléfono</div>
                      <div className="font-medium text-white">
                        {verificationResult.comprador.telefono}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleNewScan}
              className="flex-1 py-3 px-4 bg-[#282e39] text-gray-700 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <span className="material-icons">qr_code_scanner</span>
              Escanear Otro
            </button>

            {verificationResult?.valid && verificationResult.boleto.status === 'vendido' && (
              <button
                onClick={handleMarcarUsado}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <span className="material-icons">check</span>
                Marcar como Usado
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
