'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Comercio {
  id: string
  nombre: string
  email: string
  tipoPlan: string
  status: string
  limiteEventos: number
  limiteEventosCustom?: number
  eventosActivos: number
  ventasMesActual: number
  logo?: string
}

export default function ComerciosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [comercios, setComercios] = useState<Comercio[]>([])
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 25

  useEffect(() => {
    loadComercios()
  }, [page, filterPlan, filterStatus])

  const loadComercios = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString()
      })

      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }
      if (filterPlan !== 'all') {
        params.append('tipoPlan', filterPlan)
      }

      // En desarrollo, usar el bypass de admin
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (process.env.NODE_ENV !== 'production') {
        headers['X-Dev-Admin'] = 'yes'
      }

      const response = await fetch(`${API_URL}/api/admin/comercios?${params}`, { headers })
      
      if (response.ok) {
        const data = await response.json()
        setComercios(data.comercios || [])
        setTotal(data.total || 0)
      } else {
        console.error('Error response:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error data:', errorData)
      }
    } catch (error) {
      console.error('Error cargando comercios:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activo':
        return 'bg-green-500'
      case 'inactivo':
        return 'bg-red-500'
      case 'suspendido':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPlanBadge = (plan: string) => {
    const badges = {
      free: 'bg-gray-500/20 text-gray-400',
      basic: 'bg-purple-500/20 text-purple-400',
      pro: 'bg-blue-500/20 text-blue-400',
      premium: 'bg-green-500/20 text-green-400',
      enterprise: 'bg-yellow-500/20 text-yellow-400'
    }
    return badges[plan as keyof typeof badges] || badges.free
  }

  const getPlanLabel = (plan: string) => {
    const labels = {
      free: 'Free',
      basic: 'Basic',
      pro: 'Pro',
      premium: 'Premium',
      enterprise: 'Enterprise'
    }
    return labels[plan as keyof typeof labels] || plan
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const filteredComercios = comercios.filter(c =>
    search === '' ||
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-8">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Merchant Management</h1>
        <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#0d59f2] text-white text-sm font-bold leading-normal tracking-[0.015em] gap-2 hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]">
          <span className="material-symbols-outlined">add</span>
          <span className="truncate">New Merchant</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex-grow">
          <label className="flex flex-col min-w-40 h-12 w-full">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
              <div className="text-[#9ca6ba] flex bg-[#282e39] items-center justify-center pl-4 rounded-l-lg border border-r-0 border-gray-700">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#0d59f2] border border-l-0 border-gray-700 bg-[#282e39] h-full placeholder:text-[#9ca6ba] px-4 text-base font-normal leading-normal"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </label>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative">
            <select
              value={filterPlan}
              onChange={(e) => {
                setFilterPlan(e.target.value)
                setPage(1)
              }}
              className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#282e39] border border-gray-700 pl-4 pr-10 text-white text-sm font-medium appearance-none cursor-pointer hover:bg-[#3b4354] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
            >
              <option value="all">Plan: All</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <span className="material-symbols-outlined text-white text-xl absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setPage(1)
              }}
              className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#282e39] border border-gray-700 pl-4 pr-10 text-white text-sm font-medium appearance-none cursor-pointer hover:bg-[#3b4354] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
            >
              <option value="all">Status: All</option>
              <option value="activo">Active</option>
              <option value="inactivo">Inactive</option>
              <option value="suspendido">Suspended</option>
            </select>
            <span className="material-symbols-outlined text-white text-xl absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="w-full">
        <div className="overflow-hidden rounded-lg border border-[#3b4354] bg-[#111318]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1024px]">
              <thead>
                <tr className="bg-[#1b1f27]">
                  <th className="px-4 py-3 text-left w-12"></th>
                  <th className="px-4 py-3 text-left text-white w-[320px] text-sm font-medium leading-normal">Merchant</th>
                  <th className="px-4 py-3 text-left text-white w-40 text-sm font-medium leading-normal">Plan</th>
                  <th className="px-4 py-3 text-left text-white w-40 text-sm font-medium leading-normal">Status</th>
                  <th className="px-4 py-3 text-left text-white w-48 text-sm font-medium leading-normal">Event Limits</th>
                  <th className="px-4 py-3 text-left text-white w-48 text-sm font-medium leading-normal">Current Sales</th>
                  <th className="px-4 py-3 text-left text-white w-40 text-sm font-medium leading-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredComercios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#9ca6ba]">
                      No se encontraron comercios
                    </td>
                  </tr>
                ) : (
                  filteredComercios.map((comercio) => {
                    const limiteEfectivo = comercio.limiteEventosCustom !== undefined
                      ? comercio.limiteEventosCustom
                      : comercio.limiteEventos
                    const limiteTexto = limiteEfectivo === -1 || limiteEfectivo === 999999
                      ? 'Unlimited'
                      : `${comercio.eventosActivos} / ${limiteEfectivo}`

                    return (
                      <tr key={comercio.id} className="border-t border-t-[#3b4354] hover:bg-[#1b1f27] transition-colors">
                        <td className="px-4 py-2 h-[72px]">
                          <div className={`size-2.5 rounded-full ${getStatusColor(comercio.status)}`}></div>
                        </td>
                        <td className="px-4 py-2 h-[72px]">
                          <div className="flex items-center gap-3">
                            {comercio.logo ? (
                              <img src={comercio.logo} alt={comercio.nombre} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-[#0d59f2] to-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{comercio.nombre.charAt(0)}</span>
                              </div>
                            )}
                            <div>
                              <p className="text-white text-sm font-medium">{comercio.nombre}</p>
                              <p className="text-[#9ca6ba] text-sm">{comercio.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 h-[72px]">
                          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getPlanBadge(comercio.tipoPlan)}`}>
                            {getPlanLabel(comercio.tipoPlan)}
                          </span>
                        </td>
                        <td className="px-4 py-2 h-[72px]">
                          <p className="text-[#9ca6ba] text-sm capitalize">{comercio.status}</p>
                        </td>
                        <td className="px-4 py-2 h-[72px]">
                          <p className="text-[#9ca6ba] text-sm">{limiteTexto}</p>
                        </td>
                        <td className="px-4 py-2 h-[72px]">
                          <p className="text-white text-sm font-medium">{formatCurrency(comercio.ventasMesActual)}</p>
                        </td>
                        <td className="px-4 py-2 h-[72px]">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/comercios/${comercio.id}`}
                              className="p-2 rounded-md hover:bg-[#282e39] text-[#9ca6ba] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
                            >
                              <span className="material-symbols-outlined text-xl">visibility</span>
                            </Link>
                            <button className="p-2 rounded-md hover:bg-[#282e39] text-[#9ca6ba] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]">
                              <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                            <button className="p-2 rounded-md hover:bg-[#282e39] text-[#9ca6ba] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]">
                              <span className="material-symbols-outlined text-xl">settings</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {!loading && filteredComercios.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-[#9ca6ba]">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-[#282e39] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
            >
              <span className="material-symbols-outlined text-white">chevron_left</span>
            </button>
            
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2] ${
                    page === pageNum
                      ? 'bg-[#0d59f2] text-white'
                      : 'hover:bg-[#282e39] text-white'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            
            {totalPages > 5 && (
              <>
                <span className="text-white">...</span>
                <button
                  onClick={() => setPage(totalPages)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#282e39] text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
                >
                  {totalPages}
                </button>
              </>
            )}
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-[#282e39] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d59f2]"
            >
              <span className="material-symbols-outlined text-white">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
