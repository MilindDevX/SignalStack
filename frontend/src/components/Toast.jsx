import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  const textColor = type === 'success' ? 'text-green-600' : 'text-red-600'
  const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500'

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColor} animate-in slide-in-from-right duration-300`}>
      <div className={iconColor}>
        {type === 'success' ? (
          <CheckCircle size={20} />
        ) : (
          <XCircle size={20} />
        )}
      </div>
      <span className={`text-sm font-medium ${textColor}`}>{message}</span>
      <button 
        className={`ml-2 p-1 rounded hover:bg-black/5 transition-colors ${textColor}`}
        onClick={onClose}
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default Toast
