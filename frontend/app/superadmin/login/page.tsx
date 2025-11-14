'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Link from 'next/link'

export default function SuperAdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Verificar custom claim de admin
      const idTokenResult = await user.getIdTokenResult()
      
      if (!idTokenResult.claims.admin) {
        setError('Esta cuenta no tiene permisos de super administrador')
        await auth.signOut()
        setLoading(false)
        return
      }

      // Redirigir al dashboard del super admin
      router.push('/admin/dashboard')
    } catch (error: any) {
      console.error('Error de login:', error)
      setError('Email o contraseña incorrectos')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#101622] to-[#1a1f2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1b1f27]/80 backdrop-blur-xl border border-[#3b4354]/50 rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-[#0d59f2] via-blue-600 to-[#0d59f2] rounded-full size-20 flex items-center justify-center shadow-lg shadow-blue-500/50">
              <span className="text-white font-bold text-3xl">GN</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Super Admin
          </h1>
          <p className="text-[#9ca6ba] text-center mb-2 text-sm">
            Grada Negra Platform Administration
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-px bg-gradient-to-r from-transparent via-[#0d59f2] to-transparent flex-1"></div>
            <span className="material-symbols-outlined text-[#0d59f2] text-sm">verified_user</span>
            <div className="h-px bg-gradient-to-r from-transparent via-[#0d59f2] to-transparent flex-1"></div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#282e39]/50 text-white border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent placeholder-[#9ca6ba] transition-all"
                placeholder="admin@gradanegra.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#282e39]/50 text-white border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent placeholder-[#9ca6ba] transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#0d59f2] to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-[#0d59f2] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0d59f2] focus:ring-offset-2 focus:ring-offset-[#1b1f27] shadow-lg shadow-blue-500/30 transform hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Iniciando sesión...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">login</span>
                  Iniciar Sesión
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#9ca6ba]">
              ¿No eres administrador de plataforma?{' '}
            </p>
            <Link href="/" className="text-[#0d59f2] hover:text-blue-400 font-semibold text-sm transition-colors inline-flex items-center gap-1 mt-2">
              <span className="material-symbols-outlined text-sm">home</span>
              Ir al sitio principal
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-[#9ca6ba]">Grada Negra Platform Admin v1.0</p>
          <p className="text-xs text-[#6b7280]">
            Acceso restringido · Solo personal autorizado
          </p>
        </div>
      </div>
    </div>
  )
}

