import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

function InsightCard({ 
  type = 'info', 
  title, 
  description, 
  metric,
  metricLabel,
  action,
  onAction 
}) {
  const getTypeStyles = () => {
    switch (type) {
      case 'warning': 
        return {
          bg: 'bg-amber-50 border-amber-200',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          metricColor: 'text-amber-700'
        }
      case 'success': 
        return {
          bg: 'bg-green-50 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          metricColor: 'text-green-700'
        }
      case 'danger': 
        return {
          bg: 'bg-red-50 border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-600',
          metricColor: 'text-red-700'
        }
      default: 
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: Info,
          iconColor: 'text-blue-600',
          metricColor: 'text-blue-700'
        }
    }
  }

  const styles = getTypeStyles()
  const IconComponent = styles.icon

  return (
    <div className={`rounded-xl border p-4 ${styles.bg}`}>
      <div className="flex gap-3">
        <div className={`mt-0.5 ${styles.iconColor}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-slate-900">{title}</h4>
          <p className="text-sm text-slate-600 mt-1">{description}</p>
          
          {metric !== undefined && (
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${styles.metricColor}`}>{metric}</span>
              {metricLabel && (
                <span className="text-sm text-slate-500">{metricLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {action && (
        <button 
          className="mt-3 ml-8 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          onClick={onAction}
        >
          {action} →
        </button>
      )}
    </div>
  )
}

export default InsightCard
