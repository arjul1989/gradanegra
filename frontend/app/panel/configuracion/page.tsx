'use client'

import { useState, useEffect } from 'react'
import { useComercio } from '@/contexts/ComercioContext'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function ConfiguracionPage() {
  const { comercio, refreshComercio } = useComercio()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [configuracion, setConfiguracion] = useState({
    notificaciones: {
      email: true,
      ventas: true,
      eventos: true,
      recordatorios: true,
    },
    privacidad: {
      perfilPublico: true,
      mostrarEstadisticas: false,
    },
    facturacion: {
      razonSocial: '',
      nit: '',
      direccionFiscal: '',
      emailFacturacion: '',
    },
    integraciones: {
      mercadoPago: false,
      stripe: false,
      paypal: false,
    }
  })

  useEffect(() => {
    if (comercio) {
      // Cargar configuración si existe
      setConfiguracion(prev => ({
        ...prev,
        facturacion: {
          razonSocial: comercio.razonSocial || '',
          nit: comercio.nit || '',
          direccionFiscal: comercio.direccionFiscal || '',
          emailFacturacion: comercio.emailFacturacion || comercio.email || '',
        }
      }))
    }
  }, [comercio])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/comercios/${comercio?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razonSocial: configuracion.facturacion.razonSocial,
          nit: configuracion.facturacion.nit,
          direccionFiscal: configuracion.facturacion.direccionFiscal,
          emailFacturacion: configuracion.facturacion.emailFacturacion,
        })
      })

      if (response.ok) {
        alert('✅ Configuración guardada exitosamente')
        await refreshComercio()
      } else {
        alert('❌ Error al guardar la configuración')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  if (!comercio) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
        <p className="text-gray-400">
          Administra las preferencias y configuraciones de tu cuenta
        </p>
      </div>

      {/* Secciones */}
      <div className="space-y-6">
        {/* Notificaciones */}
        <div className="bg-[#1b1f27] rounded-lg border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-[#0d59f2] text-2xl">notifications</span>
            <h2 className="text-xl font-bold text-white">Notificaciones</h2>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-[#282e39] rounded-lg hover:bg-[#3b4354] transition-colors cursor-pointer">
              <div>
                <p className="text-white font-medium">Notificaciones por Email</p>
                <p className="text-sm text-gray-400">Recibe actualizaciones en tu correo</p>
              </div>
              <input
                type="checkbox"
                checked={configuracion.notificaciones.email}
                onChange={(e) => setConfiguracion({
                  ...configuracion,
                  notificaciones: { ...configuracion.notificaciones, email: e.target.checked }
                })}
                className="w-5 h-5 accent-[#0d59f2] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d59f2] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-[#282e39] rounded-lg hover:bg-[#3b4354] transition-colors cursor-pointer">
              <div>
                <p className="text-white font-medium">Alertas de Ventas</p>
                <p className="text-sm text-gray-400">Notificación cuando se venda un boleto</p>
              </div>
              <input
                type="checkbox"
                checked={configuracion.notificaciones.ventas}
                onChange={(e) => setConfiguracion({
                  ...configuracion,
                  notificaciones: { ...configuracion.notificaciones, ventas: e.target.checked }
                })}
                className="w-5 h-5 accent-[#0d59f2] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d59f2] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-[#282e39] rounded-lg hover:bg-[#3b4354] transition-colors cursor-pointer">
              <div>
                <p className="text-white font-medium">Recordatorios de Eventos</p>
                <p className="text-sm text-gray-400">Avisos antes de que inicie un evento</p>
              </div>
              <input
                type="checkbox"
                checked={configuracion.notificaciones.recordatorios}
                onChange={(e) => setConfiguracion({
                  ...configuracion,
                  notificaciones: { ...configuracion.notificaciones, recordatorios: e.target.checked }
                })}
                className="w-5 h-5 accent-[#0d59f2] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d59f2] rounded"
              />
            </label>
          </div>
        </div>

        {/* Facturación */}
        <div className="bg-[#1b1f27] rounded-lg border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-[#0d59f2] text-2xl">receipt_long</span>
            <h2 className="text-xl font-bold text-white">Información de Facturación</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Razón Social
              </label>
              <input
                type="text"
                value={configuracion.facturacion.razonSocial}
                onChange={(e) => setConfiguracion({
                  ...configuracion,
                  facturacion: { ...configuracion.facturacion, razonSocial: e.target.value }
                })}
                placeholder="Empresa S.A.S."
                className="w-full px-4 py-2 bg-[#282e39] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                NIT
              </label>
              <input
                type="text"
                value={configuracion.facturacion.nit}
                onChange={(e) => setConfiguracion({
                  ...configuracion,
                  facturacion: { ...configuracion.facturacion, nit: e.target.value }
                })}
                placeholder="900.123.456-7"
                className="w-full px-4 py-2 bg-[#282e39] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent placeholder-gray-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                Dirección Fiscal
              </label>
              <input
                type="text"
                value={configuracion.facturacion.direccionFiscal}
                onChange={(e) => setConfiguracion({
                  ...configuracion,
                  facturacion: { ...configuracion.facturacion, direccionFiscal: e.target.value }
                })}
                placeholder="Calle 123 #45-67"
                className="w-full px-4 py-2 bg-[#282e39] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent placeholder-gray-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                Email de Facturación
              </label>
              <input
                type="email"
                value={configuracion.facturacion.emailFacturacion}
                onChange={(e) => setConfiguracion({
                  ...configuracion,
                  facturacion: { ...configuracion.facturacion, emailFacturacion: e.target.value }
                })}
                placeholder="facturacion@empresa.com"
                className="w-full px-4 py-2 bg-[#282e39] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Privacidad */}
        <div className="bg-[#1b1f27] rounded-lg border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-[#0d59f2] text-2xl">lock</span>
            <h2 className="text-xl font-bold text-white">Privacidad</h2>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-[#282e39] rounded-lg hover:bg-[#3b4354] transition-colors cursor-pointer">
              <div>
                <p className="text-white font-medium">Perfil Público</p>
                <p className="text-sm text-gray-400">Permite que otros vean tu perfil</p>
              </div>
              <input
                type="checkbox"
                checked={configuracion.privacidad.perfilPublico}
                onChange={(e) => setConfiguracion({
                  ...configuracion,
                  privacidad: { ...configuracion.privacidad, perfilPublico: e.target.checked }
                })}
                className="w-5 h-5 accent-[#0d59f2] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d59f2] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-[#282e39] rounded-lg hover:bg-[#3b4354] transition-colors cursor-pointer">
              <div>
                <p className="text-white font-medium">Mostrar Estadísticas</p>
                <p className="text-sm text-gray-400">Muestra ventas y asistencias en tu perfil</p>
              </div>
              <input
                type="checkbox"
                checked={configuracion.privacidad.mostrarEstadisticas}
                onChange={(e) => setConfiguracion({
                  ...configuracion,
                  privacidad: { ...configuracion.privacidad, mostrarEstadisticas: e.target.checked }
                })}
                className="w-5 h-5 accent-[#0d59f2] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d59f2] rounded"
              />
            </label>
          </div>
        </div>

        {/* Integraciones */}
        <div className="bg-[#1b1f27] rounded-lg border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-[#0d59f2] text-2xl">extension</span>
            <h2 className="text-xl font-bold text-white">Integraciones</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#282e39] rounded-lg">
              <div>
                <p className="text-white font-medium">Mercado Pago</p>
                <p className="text-sm text-gray-400">Próximamente disponible</p>
              </div>
              <input
                type="checkbox"
                disabled
                checked={configuracion.integraciones.mercadoPago}
                className="w-5 h-5 accent-[#0d59f2] cursor-not-allowed opacity-50 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#282e39] rounded-lg">
              <div>
                <p className="text-white font-medium">Stripe</p>
                <p className="text-sm text-gray-400">Próximamente disponible</p>
              </div>
              <input
                type="checkbox"
                disabled
                checked={configuracion.integraciones.stripe}
                className="w-5 h-5 accent-[#0d59f2] cursor-not-allowed opacity-50 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#282e39] rounded-lg">
              <div>
                <p className="text-white font-medium">PayPal</p>
                <p className="text-sm text-gray-400">Próximamente disponible</p>
              </div>
              <input
                type="checkbox"
                disabled
                checked={configuracion.integraciones.paypal}
                className="w-5 h-5 accent-[#0d59f2] cursor-not-allowed opacity-50 rounded"
              />
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => router.push('/panel/dashboard')}
            className="px-6 py-3 border border-gray-700 text-white rounded-lg hover:bg-[#282e39] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-[#0d59f2] to-blue-600 hover:from-blue-600 hover:to-[#0d59f2] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
