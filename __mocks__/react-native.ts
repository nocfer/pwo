import { vi } from 'vitest'

export const Platform = { OS: 'web' }
export const useWindowDimensions = vi.fn(
  () => ({ width: 390, height: 844 }) as const
)
export const View = 'View'
export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles
}
