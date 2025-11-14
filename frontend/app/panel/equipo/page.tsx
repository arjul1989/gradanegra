'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useComercio } from '@/contexts/ComercioContext'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Usuario {
  id: string
  userId: string
  email: string
  displayName?: string
  photoURL?: string
  rol: 'admin' | 'editor' | 'viewer'
  status: string
  createdAt: any
}

const ROLES = [
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Acceso total: gestionar eventos, equipo, facturación y configuración',
    color: 'purple'
  },
  {
    value: 'editor',
    label: 'Editor',
    description: 'Puede crear y editar eventos, pero no gestionar el equipo ni la facturación',
    color: 'blue'
  },
  {
    value: 'viewer',
    label: 'Visualizador',
    description: 'Solo puede ver estadísticas y eventos, sin permisos de edición',
    color: 'gray'
  }
]

export default function EquipoPage() {
  const router = useRouter()
  const { comercio } = useComercio()
  const { user } = useAuth()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const [inviteForm, setInviteForm] = useState({
    email: '',
    rol: 'editor'
  })

  // Obtener rol del usuario actual
  const usuarioActual = usuarios.find(u => u.userId === user?.uid)
  const esAdmin = usuarioActual?.rol === 'admin'

  const limiteUsuarios = {
    free: 1,
    basic: 2,
    pro: 3,
    premium: 5,
    enterprise: 10
  }[comercio?.tipoPlan || 'free']

  useEffect(() => {
    if (comercio?.id) {
      fetchUsuarios()
    }
  }, [comercio])

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/comercios/${comercio?.id}/usuarios`)
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data.filter((u: Usuario) => u.status === 'activo'))
      }
    } catch (error) {
      console.error('Error loading usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteForm.email) {
      alert('Por favor ingresa un email')
      return
    }

    if (usuarios.length >= limiteUsuarios) {
      alert(`Has alcanzado el límite de ${limiteUsuarios} usuario(s) para tu plan ${comercio?.tipoPlan?.toUpperCase()}. Mejora tu plan para agregar más usuarios.`)
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/comercios/${comercio?.id}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inviteForm,
          invitadoPor: user?.uid
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al invitar usuario')
      }

      alert('✅ Usuario invitado exitosamente')
      setShowInviteModal(false)
      setInviteForm({ email: '', rol: 'editor' })
      await fetchUsuarios()
    } catch (error: any) {
      console.error('Error inviting user:', error)
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangeRol = async (usuario: Usuario, nuevoRol: string) => {
    if (usuario.userId === user?.uid) {
      alert('No puedes cambiar tu propio rol')
      return
    }

    const confirm = window.confirm(`¿Cambiar rol de ${usuario.email} a ${ROLES.find(r => r.value === nuevoRol)?.label}?`)
    if (!confirm) return

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/comercios/${comercio?.id}/usuarios/${usuario.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: nuevoRol })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar rol')
      }

      alert('✅ Rol actualizado exitosamente')
      await fetchUsuarios()
    } catch (error: any) {
      console.error('Error updating rol:', error)
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (usuario: Usuario) => {
    if (usuario.userId === user?.uid) {
      alert('No puedes eliminarte a ti mismo')
      return
    }

    const confirm = window.confirm(`¿Eliminar a ${usuario.email} del equipo?`)
    if (!confirm) return

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/comercios/${comercio?.id}/usuarios/${usuario.userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar usuario')
      }

      alert('✅ Usuario eliminado exitosamente')
      await fetchUsuarios()
    } catch (error: any) {
      console.error('Error removing user:', error)
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const getRolBadgeColor = (rol: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      editor: 'bg-blue-100 text-blue-800',
      viewer: 'bg-[#282e39] text-white'
    }
    return colors[rol as keyof typeof colors] || colors.viewer
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando equipo...</p>
        </div>
      </div>
    )
  }

  if (!esAdmin && usuarioActual) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-6xl text-yellow-600 mb-4 block">
            lock
          </span>
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h2>
          <p className="text-gray-700 mb-4">
            Solo los administradores pueden gestionar el equipo.
          </p>
          <p className="text-sm text-gray-400">
            Tu rol actual: <span className="font-semibold">{ROLES.find(r => r.value === usuarioActual.rol)?.label}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Equipo</h1>
            <p className="text-gray-400">
              Gestiona los usuarios que tienen acceso al panel de {comercio?.nombre}
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            disabled={usuarios.length >= limiteUsuarios}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0d59f2] to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-[#0d59f2] transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">person_add</span>
            Invitar Usuario
          </button>
        </div>

        {/* Plan Info */}
        <div className="flex items-center gap-4 p-4 bg-[#282e39] rounded-lg">
          <span className="material-symbols-outlined text-gray-400">info</span>
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{usuarios.length} / {limiteUsuarios}</span> usuarios utilizados
            </p>
            <p className="text-xs text-gray-400">
              Tu plan {comercio?.tipoPlan?.toUpperCase()} permite hasta {limiteUsuarios} usuario(s)
            </p>
          </div>
          {usuarios.length >= limiteUsuarios && (
            <button className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors font-medium">
              Mejorar Plan
            </button>
          )}
        </div>
      </div>

      {/* Roles Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES.map((rol) => (
          <div key={rol.value} className="bg-[#1b1f27] rounded-xl border border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-${rol.color}-600`}>
                {rol.value === 'admin' ? 'admin_panel_settings' : 
                 rol.value === 'editor' ? 'edit' : 'visibility'}
              </span>
              <h3 className="font-bold text-white">{rol.label}</h3>
            </div>
            <p className="text-sm text-gray-400">{rol.description}</p>
          </div>
        ))}
      </div>

      {/* Users List */}
      <div className="bg-[#1b1f27] rounded-xl border border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#282e39] border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Fecha Ingreso
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {usuarios.map((usuario) => {
                const esUsuarioActual = usuario.userId === user?.uid

                return (
                  <tr key={usuario.id} className="hover:bg-[#282e39] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {usuario.photoURL ? (
                          <img
                            src={usuario.photoURL}
                            alt={usuario.displayName || usuario.email}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-400">person</span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">
                            {usuario.displayName || usuario.email}
                            {esUsuarioActual && (
                              <span className="ml-2 text-xs text-gray-400">(Tú)</span>
                            )}
                          </p>
                          {usuario.displayName && (
                            <p className="text-sm text-gray-400">{usuario.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {esAdmin && !esUsuarioActual ? (
                        <select
                          value={usuario.rol}
                          onChange={(e) => handleChangeRol(usuario, e.target.value)}
                          disabled={saving}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getRolBadgeColor(usuario.rol)} border-0 cursor-pointer disabled:opacity-50`}
                        >
                          {ROLES.map(rol => (
                            <option key={rol.value} value={rol.value}>{rol.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRolBadgeColor(usuario.rol)}`}>
                          {ROLES.find(r => r.value === usuario.rol)?.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {usuario.createdAt?.toDate ? 
                        usuario.createdAt.toDate().toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 
                        'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      {esAdmin && !esUsuarioActual && (
                        <button
                          onClick={() => handleRemove(usuario)}
                          disabled={saving}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar usuario"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Invitar Usuario */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b1f27] rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Invitar Usuario</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Email del usuario *
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-400">
                  El usuario debe tener una cuenta en Grada Negra
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Rol *
                </label>
                {ROLES.map((rol) => (
                  <label key={rol.value} className="flex items-start gap-3 p-3 border border-gray-700 rounded-lg mb-2 cursor-pointer hover:bg-[#282e39] transition-colors">
                    <input
                      type="radio"
                      name="rol"
                      value={rol.value}
                      checked={inviteForm.rol === rol.value}
                      onChange={(e) => setInviteForm({ ...inviteForm, rol: e.target.value })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{rol.label}</p>
                      <p className="text-xs text-gray-400">{rol.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteForm({ email: '', rol: 'editor' })
                }}
                disabled={saving}
                className="flex-1 px-4 py-3 border border-gray-600 text-gray-700 rounded-lg hover:bg-[#282e39] transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleInvite}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? 'Invitando...' : 'Invitar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
