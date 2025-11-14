'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useComercio } from '@/contexts/ComercioContext'
import Image from 'next/image'
import Link from 'next/link'
import { uploadEventoImage } from '@/lib/uploadImage'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface EventoFormData {
  nombre: string
  descripcion: string
  categoria: string
  ciudad: string
  ubicacion: string
  imagen: string
  destacado: boolean
}

const CATEGORIAS = [
  'Conciertos',
  'Teatro',
  'Deportes',
  'Festivales',
  'Conferencias',
  'Exposiciones',
  'Gastronómico',
  'Familiar',
  'Otro'
]

export default function EditarEventoPage() {
  const router = useRouter()
  const params = useParams()
  const eventoId = params.id as string
  const { comercio } = useComercio()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<EventoFormData>({
    nombre: '',
    descripcion: '',
    categoria: '',
    ciudad: '',
    ubicacion: '',
    imagen: '',
    destacado: false
  })

  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [loadingEvento, setLoadingEvento] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  // Validar si el comercio puede destacar eventos
  const puedeDestacar = comercio?.tipoPlan === 'pro' || comercio?.tipoPlan === 'enterprise'

  // Cargar datos del evento
  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const response = await fetch(`${API_URL}/api/eventos/${eventoId}`)
        if (!response.ok) throw new Error('Evento no encontrado')

        const result = await response.json()
        
        if (!result.success || !result.data) {
          throw new Error('Respuesta inválida del servidor')
        }

        const evento = result.data

        // Verificar que el evento pertenece al comercio
        if (evento.comercioId !== comercio?.id) {
          alert('No tienes permisos para editar este evento')
          router.push('/panel/eventos')
          return
        }

        setFormData({
          nombre: evento.nombre || '',
          descripcion: evento.descripcion || '',
          categoria: evento.categoria || '',
          ciudad: evento.ciudad || '',
          ubicacion: evento.ubicacion || '',
          imagen: evento.imagen || '',
          destacado: evento.destacado || false
        })

        if (evento.imagen) {
          setImagePreview(evento.imagen)
        }

      } catch (error) {
        console.error('Error loading evento:', error)
        alert('Error al cargar el evento')
        router.push('/panel/eventos')
      } finally {
        setLoadingEvento(false)
      }
    }

    if (comercio?.id && eventoId) {
      fetchEvento()
    }
  }, [comercio, eventoId, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    setHasChanges(true)

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, imagen: 'Solo se permiten archivos JPG, PNG o WEBP' }))
      return
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB en bytes
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, imagen: 'La imagen no debe superar 5MB' }))
      return
    }

    setImageFile(file)
    setHasChanges(true)
    
    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Limpiar error
    if (errors.imagen) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.imagen
        return newErrors
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Simular evento de input para reutilizar la validación
    const input = fileInputRef.current
    if (input) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      input.files = dataTransfer.files
      handleImageSelect({ target: input } as any)
    }
  }

  const changeImage = () => {
    fileInputRef.current?.click()
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del evento es requerido'
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida'
    } else if (formData.descripcion.length < 50) {
      newErrors.descripcion = 'La descripción debe tener al menos 50 caracteres'
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Selecciona una categoría'
    }

    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es requerida'
    }

    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = 'La ubicación es requerida'
    }

    if (!imagePreview && !formData.imagen) {
      newErrors.imagen = 'Debes subir una imagen del evento'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return formData.imagen // Mantener imagen existente

    setUploading(true)
    try {
      // Subir nueva imagen a Firebase Storage
      const result = await uploadEventoImage(imageFile)
      return result.url

    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      // Scroll al primer error
      const firstErrorField = Object.keys(errors)[0]
      document.getElementsByName(firstErrorField)[0]?.focus()
      return
    }

    if (!comercio?.id) {
      alert('No se pudo identificar tu comercio')
      return
    }

    setLoading(true)

    try {
      // Subir nueva imagen si se cambió
      const imagenUrl = await uploadImage()

      // Actualizar el evento
      const response = await fetch(`${API_URL}/api/eventos/${eventoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          categoria: formData.categoria,
          ciudad: formData.ciudad,
          ubicacion: formData.ubicacion,
          imagen: imagenUrl,
          destacado: formData.destacado
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar evento')
      }

      alert('✅ Evento actualizado exitosamente')
      router.push(`/panel/eventos/${eventoId}`)

    } catch (error: any) {
      console.error('Error updating evento:', error)
      alert(error.message || 'Error al actualizar el evento')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      const confirm = window.confirm('¿Descartar los cambios realizados?')
      if (!confirm) return
    }
    router.push(`/panel/eventos/${eventoId}`)
  }

  const caracteresRestantes = 2000 - formData.descripcion.length

  if (loadingEvento) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando evento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/panel/eventos/${eventoId}`}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <h1 className="text-2xl font-bold text-white">Editar Evento</h1>
            </div>
            <p className="text-gray-400">Modifica la información básica del evento</p>
          </div>
          {hasChanges && (
            <div className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">edit</span>
              Cambios sin guardar
            </div>
          )}
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#1b1f27] rounded-xl border border-gray-700 p-6 shadow-sm space-y-6">
          
          {/* Nombre del Evento */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-semibold text-white mb-2">
              Nombre del Evento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej: Festival de Verano 2025"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                errors.nombre ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">error</span>
                {errors.nombre}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-semibold text-white mb-2">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={6}
              placeholder="Describe tu evento: qué incluye, qué esperar, información importante para los asistentes..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent resize-none ${
                errors.descripcion ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              <div>
                {errors.descripcion && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">error</span>
                    {errors.descripcion}
                  </p>
                )}
              </div>
              <p className={`text-sm ${caracteresRestantes < 100 ? 'text-red-600' : 'text-gray-400'}`}>
                {caracteresRestantes} caracteres restantes
              </p>
            </div>
          </div>

          {/* Categoría y Ciudad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="categoria" className="block text-sm font-semibold text-white mb-2">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                  errors.categoria ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIAS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.categoria && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">error</span>
                  {errors.categoria}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ciudad" className="block text-sm font-semibold text-white mb-2">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ciudad"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleInputChange}
                placeholder="Ej: Bogotá"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                  errors.ciudad ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.ciudad && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">error</span>
                  {errors.ciudad}
                </p>
              )}
            </div>
          </div>

          {/* Ubicación / Dirección */}
          <div>
            <label htmlFor="ubicacion" className="block text-sm font-semibold text-white mb-2">
              Ubicación / Dirección <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="ubicacion"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleInputChange}
              placeholder="Ej: Estadio Nemesio Camacho El Campín, Cra. 30 #57-60"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent ${
                errors.ubicacion ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.ubicacion && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">error</span>
                {errors.ubicacion}
              </p>
            )}
          </div>

          {/* Imagen del Evento */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Imagen del Evento <span className="text-red-500">*</span>
            </label>
            
            {imagePreview ? (
              <div className="relative border-2 border-gray-600 rounded-lg overflow-hidden">
                <div className="relative w-full h-64">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={changeImage}
                  className="absolute top-2 right-2 px-4 py-2 bg-[#1b1f27] text-white rounded-lg hover:bg-[#282e39] transition-colors shadow-lg font-medium flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  Cambiar imagen
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  errors.imagen
                    ? 'border-red-500 bg-red-50 hover:bg-red-100'
                    : 'border-gray-600 hover:border-gray-400 bg-[#282e39] hover:bg-[#282e39]'
                }`}
              >
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4 block">
                  cloud_upload
                </span>
                <p className="text-gray-700 font-medium mb-1">
                  Arrastra una imagen o haz click para seleccionar
                </p>
                <p className="text-sm text-gray-400">
                  JPG, PNG o WEBP (máx. 5MB) • Recomendado: 1920x1080px
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            )}

            {errors.imagen && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">error</span>
                {errors.imagen}
              </p>
            )}
          </div>

          {/* Destacar Evento */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="destacado"
                name="destacado"
                checked={formData.destacado}
                onChange={handleInputChange}
                disabled={!puedeDestacar}
                className="mt-1 w-5 h-5 border-gray-600 rounded focus:ring-[#0d59f2] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <label
                  htmlFor="destacado"
                  className={`text-sm font-semibold ${puedeDestacar ? 'text-white' : 'text-gray-400'}`}
                >
                  Destacar este evento en la página principal
                  {!puedeDestacar && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-400 rounded">
                      Solo PRO y ENTERPRISE
                    </span>
                  )}
                </label>
                <p className="text-sm text-gray-400 mt-1">
                  {puedeDestacar
                    ? 'Los eventos destacados aparecen en el carrusel principal y obtienen mayor visibilidad.'
                    : 'Mejora tu plan a PRO o ENTERPRISE para destacar tus eventos.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advertencia para eventos con ventas */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-yellow-600">info</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                Importante al editar eventos
              </h3>
              <p className="text-sm text-yellow-800">
                Los cambios en información básica no afectan las fechas, tiers o boletos ya creados. 
                Para modificar fechas o precios, usa las opciones específicas en el detalle del evento.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-between bg-[#1b1f27] rounded-xl border border-gray-700 p-6 shadow-sm">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-600 text-gray-700 rounded-lg hover:bg-[#282e39] transition-colors font-medium"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading || uploading || !hasChanges}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#0d59f2] to-blue-600 hover:from-blue-600 hover:to-[#0d59f2] text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{uploading ? 'Subiendo imagen...' : 'Guardando cambios...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">save</span>
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
