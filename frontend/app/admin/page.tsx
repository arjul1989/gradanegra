'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRoot() {
  const router = useRouter()

  useEffect(() => {
    router.push('/admin/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#101622]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Redirigiendo...</p>
      </div>
    </div>
  )
}
