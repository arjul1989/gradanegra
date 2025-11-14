'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a la nueva URL del super admin
    router.replace('/superadmin/login')
  }, [router])

  return (
    <div className="min-h-screen bg-[#101622] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Redirigiendo al super admin...</p>
      </div>
    </div>
  )
}
