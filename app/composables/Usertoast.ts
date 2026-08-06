export interface ToastItem {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

let counter = 0

export function useToast() {
  const toasts = useState<ToastItem[]>('toast:items', () => [])

  function push(message: string, type: ToastItem['type'] = 'success', duration = 2800) {
    const id = ++counter
    toasts.value.push({ id, type, message })

    if (import.meta.client) {
      setTimeout(() => dismiss(id), duration)
    }
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function success(message: string, duration?: number) { push(message, 'success', duration) }
  function error(message: string, duration?: number)   { push(message, 'error', duration) }
  function info(message: string, duration?: number)    { push(message, 'info', duration) }

  return { toasts, push, dismiss, success, error, info }
} 