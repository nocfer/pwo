import { describe, expect, it, vi } from 'vitest'
import { useWindowDimensions } from 'react-native'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'

// useMemo is bypassed to test pure logic directly; memoization correctness
// (dependency on width only) should be validated in integration/render tests
vi.mock('react', () => ({
  useMemo: (fn: () => unknown) => fn()
}))

const mockDimensions = useWindowDimensions as ReturnType<typeof vi.fn>

const callHook = (width: number) => {
  mockDimensions.mockReturnValue({ width, height: 844 })
  return useResponsiveLayout()
}

describe('useResponsiveLayout', () => {
  describe('compact breakpoint (< 375)', () => {
    it('returns compact for width 360', () => {
      const result = callHook(360)
      expect(result.breakpoint).toBe('compact')
      expect(result.isCompact).toBe(true)
      expect(result.isExpanded).toBe(false)
    })

    it('returns compactAdjustments with reduction values', () => {
      const result = callHook(360)
      expect(result.compactAdjustments).toEqual({
        spacingReduction: 1,
        fontSizeReduction: 1
      })
    })

    it('returns empty containerStyle', () => {
      const result = callHook(360)
      expect(result.containerStyle).toEqual({})
    })
  })

  describe('regular breakpoint (375-430)', () => {
    it('returns regular for width 390', () => {
      const result = callHook(390)
      expect(result.breakpoint).toBe('regular')
      expect(result.isCompact).toBe(false)
      expect(result.isExpanded).toBe(false)
    })

    it('returns null compactAdjustments', () => {
      const result = callHook(390)
      expect(result.compactAdjustments).toBeNull()
    })

    it('returns empty containerStyle', () => {
      const result = callHook(390)
      expect(result.containerStyle).toEqual({})
    })
  })

  describe('expanded breakpoint (> 430)', () => {
    it('returns expanded for width 768', () => {
      const result = callHook(768)
      expect(result.breakpoint).toBe('expanded')
      expect(result.isCompact).toBe(false)
      expect(result.isExpanded).toBe(true)
    })

    it('returns containerStyle with maxWidth 480 and xl padding', () => {
      const result = callHook(768)
      expect(result.containerStyle).toEqual({
        maxWidth: 480,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 24
      })
    })

    it('returns null compactAdjustments', () => {
      const result = callHook(768)
      expect(result.compactAdjustments).toBeNull()
    })
  })

  describe('boundary values', () => {
    it('374 is compact (< 375)', () => {
      const result = callHook(374)
      expect(result.breakpoint).toBe('compact')
      expect(result.isCompact).toBe(true)
    })

    it('375 is regular (>= 375)', () => {
      const result = callHook(375)
      expect(result.breakpoint).toBe('regular')
      expect(result.isCompact).toBe(false)
      expect(result.isExpanded).toBe(false)
      expect(result.compactAdjustments).toBeNull()
      expect(result.containerStyle).toEqual({})
    })

    it('430 is regular (<= 430)', () => {
      const result = callHook(430)
      expect(result.breakpoint).toBe('regular')
      expect(result.isExpanded).toBe(false)
    })

    it('431 is expanded (> 430)', () => {
      const result = callHook(431)
      expect(result.breakpoint).toBe('expanded')
      expect(result.isExpanded).toBe(true)
    })
  })
})
