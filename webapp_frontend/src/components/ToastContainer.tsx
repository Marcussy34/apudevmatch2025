import React from 'react'
import Toast, { ToastProps } from './Toast'

interface ToastContainerProps {
  toasts: ToastProps[]
  onRemoveToast: (id: string) => void
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onRemoveToast} />
      ))}
    </div>
  )
}

export default ToastContainer