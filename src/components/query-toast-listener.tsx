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
      setTimeout(() => {
        // Display the toast based on the specified type
        switch (toastType) {
          case 'success':
            toast.success(message)
            break
          case 'warning':
            toast.warning(message)
            break
          case 'error':
            toast.error(message)
            break
          case 'info':
          default:
            toast.info(message)
            break
        }
      }, 0)
      console.log('Toast displayed with message:', message)

      // Clear the query parameter after showing the toast
      setMessage('')
    }
  }, [message, setMessage, toastType])

  return null
}
