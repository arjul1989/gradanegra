'use client'

import { useState, useEffect } from 'react'
import { useComercio } from '@/contexts/ComercioContext'
import Image from 'next/image'
import { uploadComercioLogo, uploadComercioBanner } from '@/lib/uploadImage'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ComercioFormData {
  nombre: string
  slug: string
  descripcion: string
  email: string
  telefono: string
  website: string
  direccion: string
  ciudad: string
  pais: string
  logo: string
  imagenBanner: string
  colorPrimario: string
  colorSecundario: string
  redesSociales: {
    facebook: string
    instagram: string
    twitter: string
    tiktok: string
  }
}

const PLANES_INFO = {
  free: {
    nombre: 'FREE',
    precio: 'Gratis',
    limiteEventos: 2,
    usuarios: 1,
    comision: 10,
    destacados: 0,
    color: 'bg-[#282e39] text-white'
  },
  basic: {
    nombre: 'BASIC',
    precio: '$99,000 COP/mes',
    limiteEventos: 10,
    usuarios: 2,
    comision: 7,
    destacados: 0,
    color: 'bg-blue-100 text-blue-800'
  },
  pro: {
    nombre: 'PRO',
    precio: '$299,000 COP/mes',
    limiteEventos: 50,
    usuarios: 3,
    comision: 5,
    destacados: 2,
    color: 'bg-purple-100 text-purple-800'
  },
  enterprise: {
    nombre: 'ENTERPRISE',
    precio: 'Contactar',
    limiteEventos: 999999,
    usuarios: 10,
    comision: 3,
    destacados: 5,
    color: 'bg-gradient-to-r from-[#0d59f2] to-blue-600 text-white'
  }
}

export default function PerfilPage() {
  const { comercio, refreshComercio } = useComercio()
  const [activeTab, setActiveTab] = useState(1)
  const [formData, setFormData] = useState<ComercioFormData>({
    nombre: '',
    slug: '',
    descripcion: '',
    email: '',
    telefono: '',
    website: '',
    direccion: '',
    ciudad: '',
    pais: 'Colombia',
    logo: '',
    imagenBanner: '',
    colorPrimario: '#000000',
    colorSecundario: '#666666',
    redesSociales: {
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: ''
    }
  })
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (comercio) {
      setFormData({
        nombre: comercio.nombre || '',
        slug: comercio.slug || '',
        descripcion: comercio.descripcion || '',
        email: comercio.email || '',
        telefono: comercio.telefono || '',
        website: comercio.website || '',
        direccion: comercio.direccion || '',
        ciudad: comercio.ciudad || '',
        pais: comercio.pais || 'Colombia',
        logo: comercio.logo || '',
        imagenBanner: comercio.imagenBanner || '',
        colorPrimario: comercio.colorPrimario || '#000000',
        colorSecundario: comercio.colorSecundario || '#666666',
        redesSociales: {
          facebook: comercio.redesSociales?.facebook || '',
          instagram: comercio.redesSociales?.instagram || '',
          twitter: comercio.redesSociales?.twitter || '',
          tiktok: comercio.redesSociales?.tiktok || ''
        }
      })
    }
  }, [comercio])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleRedesSocialesChange = (red: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      redesSociales: { ...prev.redesSociales, [red]: value }
    }))
    setHasChanges(true)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !comercio) return

    setUploadingLogo(true)
    try {
      const url = await uploadComercioLogo(file, comercio.id)
      handleInputChange('logo', url)
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Error al subir el logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !comercio) return

    setUploadingBanner(true)
    try {
      const url = await uploadComercioBanner(file, comercio.id)
      handleInputChange('imagenBanner', url)
    } catch (error) {
      console.error('Error uploading banner:', error)
      alert('Error al subir el banner')
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleSave = async () => {
    if (!comercio) return

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/comercios/${comercio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Error al guardar')

      await refreshComercio()
      setHasChanges(false)
      alert('✅ Perfil actualizado exitosamente')
    } catch (error) {
      console.error('Error saving:', error)
      alert('❌ Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges && !confirm('¿Descartar los cambios?')) return
    
    if (comercio) {
      setFormData({
        nombre: comercio.nombre || '',
        slug: comercio.slug || '',
        descripcion: comercio.descripcion || '',
        email: comercio.email || '',
        telefono: comercio.telefono || '',
        website: comercio.website || '',
        direccion: comercio.direccion || '',
        ciudad: comercio.ciudad || '',
        pais: comercio.pais || 'Colombia',
        logo: comercio.logo || '',
        imagenBanner: comercio.imagenBanner || '',
        colorPrimario: comercio.colorPrimario || '#000000',
        colorSecundario: comercio.colorSecundario || '#666666',
        redesSociales: {
          facebook: comercio.redesSociales?.facebook || '',
          instagram: comercio.redesSociales?.instagram || '',
          twitter: comercio.redesSociales?.twitter || '',
          tiktok: comercio.redesSociales?.tiktok || ''
        }
      })
      setHasChanges(false)
    }
  }

  if (!comercio) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-[#0d59f2] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  const planActual = PLANES_INFO[comercio.tipoPlan as keyof typeof PLANES_INFO] || PLANES_INFO.free

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
        <p className="text-gray-400 mt-1">Administra la información de tu comercio</p>
      </div>

      {/* Tabs */}
      <div className="bg-[#1b1f27] border border-gray-700 rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab(1)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 1
                  ? 'border-gray-900 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">business</span>
                Información del Negocio
              </span>
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 2
                  ? 'border-gray-900 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">palette</span>
                Branding
              </span>
            </button>
            <button
              onClick={() => setActiveTab(3)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 3
                  ? 'border-gray-900 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">share</span>
                Redes Sociales
              </span>
            </button>
            <button
              onClick={() => setActiveTab(4)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 4
                  ? 'border-gray-900 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">credit_card</span>
                Plan y Facturación
              </span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab 1: Información del Negocio */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Nombre del Comercio *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                    placeholder="Ej: Eventos Colombia"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Slug (URL amigable)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#282e39] text-gray-400"
                    placeholder="eventos-colombia"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Este campo se genera automáticamente
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  placeholder="Describe tu negocio y lo que ofreces..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Email de Contacto *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                    placeholder="contacto@tuempresa.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Sitio Web
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  placeholder="https://www.tuempresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Dirección Completa
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  placeholder="Calle 123 #45-67, Barrio Centro"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                    placeholder="Bogotá"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    value={formData.pais}
                    onChange={(e) => handleInputChange('pais', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                    placeholder="Colombia"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Branding */}
          {activeTab === 2 && (
            <div className="space-y-6">
              {/* Logo */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Logo (512x512px recomendado)
                </label>
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32 rounded-lg border-2 border-dashed border-gray-600 overflow-hidden bg-[#282e39]">
                    {formData.logo ? (
                      <Image
                        src={formData.logo}
                        alt="Logo"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="material-symbols-outlined text-4xl text-gray-400">image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {uploadingLogo ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-xl">upload</span>
                          Subir Logo
                        </>
                      )}
                    </label>
                    <p className="text-xs text-gray-400 mt-2">
                      JPG, PNG o WEBP. Máximo 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Banner (1920x400px recomendado)
                </label>
                <div className="space-y-4">
                  <div className="relative w-full h-48 rounded-lg border-2 border-dashed border-gray-600 overflow-hidden bg-[#282e39]">
                    {formData.imagenBanner ? (
                      <Image
                        src={formData.imagenBanner}
                        alt="Banner"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="material-symbols-outlined text-4xl text-gray-400">panorama</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleBannerUpload}
                      disabled={uploadingBanner}
                      className="hidden"
                      id="banner-upload"
                    />
                    <label
                      htmlFor="banner-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      {uploadingBanner ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-xl">upload</span>
                          Subir Banner
                        </>
                      )}
                    </label>
                    <p className="text-xs text-gray-400 mt-2">
                      JPG, PNG o WEBP. Máximo 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Colores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Color Primario
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.colorPrimario}
                      onChange={(e) => handleInputChange('colorPrimario', e.target.value)}
                      className="h-12 w-20 rounded-lg border border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.colorPrimario}
                      onChange={(e) => handleInputChange('colorPrimario', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent font-mono"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Color Secundario
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.colorSecundario}
                      onChange={(e) => handleInputChange('colorSecundario', e.target.value)}
                      className="h-12 w-20 rounded-lg border border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.colorSecundario}
                      onChange={(e) => handleInputChange('colorSecundario', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent font-mono"
                      placeholder="#666666"
                    />
                  </div>
                </div>
              </div>

              {/* Vista Previa de Colores */}
              <div className="border border-gray-700 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Vista Previa de Colores</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">Color Primario</p>
                    <div
                      className="h-20 rounded-lg shadow-inner"
                      style={{ backgroundColor: formData.colorPrimario }}
                    ></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">Color Secundario</p>
                    <div
                      className="h-20 rounded-lg shadow-inner"
                      style={{ backgroundColor: formData.colorSecundario }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Redes Sociales */}
          {activeTab === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600">facebook</span>
                    Facebook
                  </span>
                </label>
                <input
                  type="url"
                  value={formData.redesSociales.facebook}
                  onChange={(e) => handleRedesSocialesChange('facebook', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  placeholder="https://www.facebook.com/tupagina"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-pink-600">photo_camera</span>
                    Instagram
                  </span>
                </label>
                <input
                  type="url"
                  value={formData.redesSociales.instagram}
                  onChange={(e) => handleRedesSocialesChange('instagram', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  placeholder="https://www.instagram.com/tuperfil"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400">alternate_email</span>
                    Twitter / X
                  </span>
                </label>
                <input
                  type="url"
                  value={formData.redesSociales.twitter}
                  onChange={(e) => handleRedesSocialesChange('twitter', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  placeholder="https://twitter.com/tuperfil"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-black">music_note</span>
                    TikTok
                  </span>
                </label>
                <input
                  type="url"
                  value={formData.redesSociales.tiktok}
                  onChange={(e) => handleRedesSocialesChange('tiktok', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent"
                  placeholder="https://www.tiktok.com/@tuperfil"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-600">info</span>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">¿Por qué agregar redes sociales?</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Tus compradores podrán seguirte fácilmente</li>
                      <li>Mayor visibilidad en la plataforma</li>
                      <li>Construye comunidad alrededor de tus eventos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Plan y Facturación */}
          {activeTab === 4 && (
            <div className="space-y-6">
              {/* Plan Actual */}
              <div className="bg-gradient-to-br from-[#282e39] to-[#1b1f27] rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Plan Actual</h3>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${planActual.color}`}>
                    {planActual.nombre}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#1b1f27] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{comercio.limiteEventos === 999999 ? '∞' : comercio.limiteEventos}</p>
                    <p className="text-xs text-gray-400 mt-1">Eventos</p>
                  </div>
                  <div className="bg-[#1b1f27] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{planActual.usuarios}</p>
                    <p className="text-xs text-gray-400 mt-1">Usuarios</p>
                  </div>
                  <div className="bg-[#1b1f27] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{comercio.comision}%</p>
                    <p className="text-xs text-gray-400 mt-1">Comisión</p>
                  </div>
                  <div className="bg-[#1b1f27] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{planActual.destacados}</p>
                    <p className="text-xs text-gray-400 mt-1">Destacados</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                  <div>
                    <p className="text-sm text-gray-400">Puede destacar eventos:</p>
                    <p className="text-lg font-semibold text-white">
                      {planActual.destacados > 0 ? 'Sí' : 'No'}
                    </p>
                  </div>
                  {comercio.tipoPlan !== 'enterprise' && (
                    <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl">
                      Mejorar Plan
                    </button>
                  )}
                </div>
              </div>

              {/* Comparación de Planes */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Comparación de Planes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-700 rounded-lg">
                    <thead>
                      <tr className="bg-[#282e39] border-b border-gray-700">
                        <th className="text-left px-4 py-3 text-sm font-semibold text-white">Característica</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-white">FREE</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-white">BASIC</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-white bg-purple-50">PRO</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-white">ENTERPRISE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      <tr>
                        <td className="px-4 py-3 text-sm text-white font-medium">Precio</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">Gratis</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">$99k/mes</td>
                        <td className="px-4 py-3 text-sm text-white font-semibold text-center bg-purple-50">$299k/mes</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">Contactar</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-white font-medium">Eventos</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">2</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">10</td>
                        <td className="px-4 py-3 text-sm text-white font-semibold text-center bg-purple-50">50</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">Ilimitado</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-white font-medium">Usuarios</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">1</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">2</td>
                        <td className="px-4 py-3 text-sm text-white font-semibold text-center bg-purple-50">3</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">10</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-white font-medium">Comisión</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">10%</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">7%</td>
                        <td className="px-4 py-3 text-sm text-white font-semibold text-center bg-purple-50">5%</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">3%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-white font-medium">Eventos Destacados</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">-</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">-</td>
                        <td className="px-4 py-3 text-sm text-white font-semibold text-center bg-purple-50">2</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">5</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-white font-medium">Soporte</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">Email</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">Email</td>
                        <td className="px-4 py-3 text-sm text-white font-semibold text-center bg-purple-50">Prioritario</td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-center">Dedicado</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons (except for Tab 4) */}
        {activeTab !== 4 && (
          <div className="px-6 py-4 bg-[#282e39] border-t border-gray-700 flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2 border border-gray-600 text-gray-700 rounded-lg hover:bg-[#1b1f27] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="px-6 py-2 bg-gradient-to-r from-[#0d59f2] to-blue-600 hover:from-blue-600 hover:to-[#0d59f2] text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">save</span>
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
