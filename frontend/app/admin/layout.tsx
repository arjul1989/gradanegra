'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        router.push('/superadmin/login')
        return
      }

      try {
        // Verificar custom claim de admin
        const idTokenResult = await user.getIdTokenResult()
        if (!idTokenResult.claims.admin) {
          router.push('/')
          return
        }
        setIsAdmin(true)
      } catch (error) {
        console.error('Error verificando admin:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [user, router])

  const navItems = [
    { href: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/admin/comercios', icon: 'store', label: 'Merchants', iconFilled: true },
    { href: '/admin/planes', icon: 'credit_card', label: 'Plans' },
    { href: '/admin/reportes', icon: 'bar_chart', label: 'Reports' },
    { href: '/admin/configuracion', icon: 'settings', label: 'Settings' },
  ]

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#101622]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="relative flex min-h-screen w-full bg-[#101622]">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-[#111318] p-4 border-r border-gray-800">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#0d59f2] to-blue-600 rounded-full size-10 flex items-center justify-center">
              <span className="text-white font-bold text-lg">GN</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-base font-medium leading-normal">Admin Panel</h1>
              <p className="text-[#9ca6ba] text-sm font-normal leading-normal">Grada Negra</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-[#282e39]'
                  : 'hover:bg-[#282e39]'
              }`}
            >
              <span 
                className={`material-symbols-outlined text-white ${
                  isActive(item.href) && item.iconFilled ? 'fill' : ''
                }`}
                style={isActive(item.href) && item.iconFilled ? { fontVariationSettings: '"FILL" 1' } : {}}
              >
                {item.icon}
              </span>
              <p className="text-white text-sm font-medium leading-normal">{item.label}</p>
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-4">
          <Link
            href="/admin/soporte"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#282e39] transition-colors"
          >
            <span className="material-symbols-outlined text-white">help</span>
            <p className="text-white text-sm font-medium leading-normal">Support</p>
          </Link>
          <button
            onClick={() => {
              // Logout logic
              router.push('/superadmin/login')
            }}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#0d59f2] text-white text-sm font-bold leading-normal tracking-[0.015em] w-full mt-2 hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
          >
            <span className="truncate">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
