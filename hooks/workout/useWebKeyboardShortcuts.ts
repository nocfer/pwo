import { useEffect } from 'react'
import { Platform } from 'react-native'

export type WebKeyboardShortcutsConfig = {
  onEnter: () => boolean | void
  onTab: () => boolean | void
  onEscape: () => boolean | void
  onDigit?: (digit: number) => void
  onBackspace?: () => void
  enabled: boolean
}

export function useWebKeyboardShortcuts(config: WebKeyboardShortcutsConfig) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !config.enabled) return
    if (typeof document === 'undefined') return

    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return

      switch (e.key) {
        case 'Enter':
          if (config.onEnter()) e.preventDefault()
          break
        case 'Tab':
          if (e.shiftKey) return
          if (config.onTab()) e.preventDefault()
          break
        case 'Escape':
          if (config.onEscape()) e.preventDefault()
          break
        case 'Backspace':
          if (config.onBackspace) {
            e.preventDefault()
            config.onBackspace()
          }
          break
        default:
          if (config.onDigit && e.key >= '0' && e.key <= '9') {
            e.preventDefault()
            config.onDigit(parseInt(e.key, 10))
          }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [
    config.enabled,
    config.onEnter,
    config.onTab,
    config.onEscape,
    config.onDigit,
    config.onBackspace
  ])
}
