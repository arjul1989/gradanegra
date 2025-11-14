'use client'

import { useEffect } from 'react'

interface AlertDialogProps {
  isOpen: boolean
  title: string
  message: string
  buttonText?: string
  onClose: () => void
  type?: 'success' | 'error' | 'info' | 'warning'
}

export default function AlertDialog({
  isOpen,
  title,
  message,
  buttonText = 'Aceptar',
  onClose,
  type = 'info'
}: AlertDialogProps) {
  // Prevenir scroll cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Cerrar con tecla Escape o Enter
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === 'Enter') && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500/10',
          color: 'text-green-500',
          icon: 'check_circle',
          buttonClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        }
      case 'error':
        return {
          bg: 'bg-red-500/10',
          color: 'text-red-500',
          icon: 'error',
          buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-500/10',
          color: 'text-yellow-500',
          icon: 'warning',
          buttonClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        }
      default: // info
        return {
          bg: 'bg-blue-500/10',
          color: 'text-blue-500',
          icon: 'info',
          buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        }
    }
  }

  const typeConfig = getTypeConfig()

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Content */}
        <div className="relative bg-[#1b1f27] rounded-xl shadow-2xl max-w-md w-full border border-gray-700 transform transition-all">
          {/* Header con Ícono */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4">
              {/* Ícono */}
              <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${typeConfig.bg}`}>
                <span className={`material-symbols-outlined text-2xl ${typeConfig.color}`}>
                  {typeConfig.icon}
                </span>
              </div>
              
              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-2" id="modal-title">
                  {title}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Footer con Botón */}
          <div className="px-6 py-4 bg-[#111318] rounded-b-xl border-t border-gray-700 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111318] ${typeConfig.buttonClass}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

