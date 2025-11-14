'use client'

import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmButtonClass?: string
  onConfirm: () => void
  onCancel: () => void
  icon?: 'warning' | 'danger' | 'info' | 'success'
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonClass,
  onConfirm,
  onCancel,
  icon = 'warning'
}: ConfirmDialogProps) {
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

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const getIconConfig = () => {
    switch (icon) {
      case 'danger':
        return {
          bg: 'bg-red-500/10',
          color: 'text-red-500',
          icon: 'error'
        }
      case 'success':
        return {
          bg: 'bg-green-500/10',
          color: 'text-green-500',
          icon: 'check_circle'
        }
      case 'info':
        return {
          bg: 'bg-blue-500/10',
          color: 'text-blue-500',
          icon: 'info'
        }
      default: // warning
        return {
          bg: 'bg-yellow-500/10',
          color: 'text-yellow-500',
          icon: 'warning'
        }
    }
  }

  const iconConfig = getIconConfig()

  const getConfirmButtonClass = () => {
    if (confirmButtonClass) return confirmButtonClass
    
    switch (icon) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
      default:
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    }
  }

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
        onClick={onCancel}
      ></div>

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Content */}
        <div className="relative bg-[#1b1f27] rounded-xl shadow-2xl max-w-md w-full border border-gray-700 transform transition-all">
          {/* Header con Ícono */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4">
              {/* Ícono */}
              <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${iconConfig.bg}`}>
                <span className={`material-symbols-outlined text-2xl ${iconConfig.color}`}>
                  {iconConfig.icon}
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

          {/* Footer con Botones */}
          <div className="px-6 py-4 bg-[#111318] rounded-b-xl border-t border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-transparent hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[#111318]"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111318] ${getConfirmButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

