'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'
import AlertDialog from '@/components/AlertDialog'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  icon?: 'warning' | 'danger' | 'info' | 'success'
  confirmButtonClass?: string
}

interface AlertOptions {
  title: string
  message: string
  buttonText?: string
  type?: 'success' | 'error' | 'info' | 'warning'
}

interface DialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  alert: (options: AlertOptions) => Promise<void>
  showSuccess: (message: string, title?: string) => Promise<void>
  showError: (message: string, title?: string) => Promise<void>
  showWarning: (message: string, title?: string) => Promise<void>
  showInfo: (message: string, title?: string) => Promise<void>
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export const useDialog = () => {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}

interface DialogState {
  isOpen: boolean
  options: ConfirmOptions | AlertOptions
  type: 'confirm' | 'alert'
  resolve?: (value: boolean | void) => void
}

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    options: { title: '', message: '' },
    type: 'confirm'
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options,
        type: 'confirm',
        resolve: resolve as (value: boolean | void) => void
      })
    })
  }, [])

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options,
        type: 'alert',
        resolve: resolve as (value: boolean | void) => void
      })
    })
  }, [])

  const showSuccess = useCallback((message: string, title: string = '¡Éxito!'): Promise<void> => {
    return alert({ title, message, type: 'success' })
  }, [alert])

  const showError = useCallback((message: string, title: string = 'Error'): Promise<void> => {
    return alert({ title, message, type: 'error' })
  }, [alert])

  const showWarning = useCallback((message: string, title: string = 'Advertencia'): Promise<void> => {
    return alert({ title, message, type: 'warning' })
  }, [alert])

  const showInfo = useCallback((message: string, title: string = 'Información'): Promise<void> => {
    return alert({ title, message, type: 'info' })
  }, [alert])

  const handleConfirm = () => {
    dialogState.resolve?.(true)
    setDialogState({ ...dialogState, isOpen: false })
  }

  const handleCancel = () => {
    if (dialogState.type === 'confirm') {
      dialogState.resolve?.(false)
    }
    setDialogState({ ...dialogState, isOpen: false })
  }

  const handleAlertClose = () => {
    dialogState.resolve?.()
    setDialogState({ ...dialogState, isOpen: false })
  }

  return (
    <DialogContext.Provider value={{ confirm, alert, showSuccess, showError, showWarning, showInfo }}>
      {children}
      
      {dialogState.type === 'confirm' && (
        <ConfirmDialog
          isOpen={dialogState.isOpen}
          {...(dialogState.options as ConfirmOptions)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {dialogState.type === 'alert' && (
        <AlertDialog
          isOpen={dialogState.isOpen}
          {...(dialogState.options as AlertOptions)}
          onClose={handleAlertClose}
        />
      )}
    </DialogContext.Provider>
  )
}

