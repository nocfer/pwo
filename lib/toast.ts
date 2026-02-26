import Toast from 'react-native-toast-message'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ShowToastOptions {
  type: ToastType
  text1: string
  text2?: string
  visibilityTime?: number
}

/**
 * Show a toast notification
 */
export function showToast(options: ShowToastOptions) {
  const { type, text1, text2, visibilityTime } = options

  Toast.show({
    type,
    text1,
    text2,
    visibilityTime: visibilityTime || (type === 'error' ? 5000 : 3000),
    position: 'top',
    topOffset: 60
  })
}

/**
 * Show a success toast
 */
export function showSuccess(message: string, details?: string) {
  showToast({
    type: 'success',
    text1: message,
    text2: details
  })
}

/**
 * Show an error toast
 */
export function showError(message: string, details?: string) {
  showToast({
    type: 'error',
    text1: message,
    text2: details,
    visibilityTime: 5000
  })
}

/**
 * Show a warning toast
 */
export function showWarning(message: string, details?: string) {
  showToast({
    type: 'warning',
    text1: message,
    text2: details
  })
}

/**
 * Show an info toast
 */
export function showInfo(message: string, details?: string) {
  showToast({
    type: 'info',
    text1: message,
    text2: details
  })
}
