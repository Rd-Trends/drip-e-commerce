'use client'

import { useEffect } from 'react'
import { useQueryState } from 'nuqs'
import { toast } from 'sonner'

type ToastType = 'info' | 'success' | 'warning' | 'error'

interface QueryToastListenerProps {
  /**
   * The search query parameter key to listen for
   * @default 'warning'
   */
  queryKey?: string
  /**
   * Type of toast to display
   * @default 'info'
   */
  toastType?: ToastType
}

export function QueryToastListener({
  queryKey = 'warning',
  toastType = 'info',
}: QueryToastListenerProps) {
  const [message, setMessage] = useQueryState(queryKey, {
    defaultValue: '',
  })

  useEffect(() => {
    if (message) {
      switch (toastType) {
        case 'success':
          toast.success(message, { id: 'query-toast-success' })
          break
        case 'warning':
          toast.warning(message, { id: 'query-toast-warning' })
          break
        case 'error':
          toast.error(message, { id: 'query-toast-error' })
          break
        case 'info':
        default:
          toast.info(message, { id: 'query-toast-info' })
          break
      }

      // Clear the query parameter after showing the toast
      setMessage('')
    }
  }, [message, setMessage, toastType])

  return null
}
