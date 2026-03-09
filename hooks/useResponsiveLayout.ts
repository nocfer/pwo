import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

const COMPACT_MAX = 375
const REGULAR_MAX = 430
const EXPANDED_MAX_WIDTH = 480
const EXPANDED_PADDING = 24

type Breakpoint = 'compact' | 'regular' | 'expanded'

type CompactAdjustments = {
  spacingReduction: number
  fontSizeReduction: number
}

type ContainerStyle = {
  maxWidth: number
  alignSelf: 'center'
  width: '100%'
  paddingHorizontal: number
}

type ResponsiveLayout = {
  breakpoint: Breakpoint
  isCompact: boolean
  isExpanded: boolean
  containerStyle: ContainerStyle | Record<string, never>
  compactAdjustments: CompactAdjustments | null
}

export const useResponsiveLayout = (): ResponsiveLayout => {
  const { width } = useWindowDimensions()

  return useMemo(() => {
    const breakpoint: Breakpoint =
      width < COMPACT_MAX
        ? 'compact'
        : width > REGULAR_MAX
          ? 'expanded'
          : 'regular'

    const isCompact = breakpoint === 'compact'
    const isExpanded = breakpoint === 'expanded'

    const containerStyle: ContainerStyle | Record<string, never> = isExpanded
      ? {
          maxWidth: EXPANDED_MAX_WIDTH,
          alignSelf: 'center',
          width: '100%',
          paddingHorizontal: EXPANDED_PADDING
        }
      : {}

    const compactAdjustments: CompactAdjustments | null = isCompact
      ? { spacingReduction: 1, fontSizeReduction: 1 }
      : null

    return {
      breakpoint,
      isCompact,
      isExpanded,
      containerStyle,
      compactAdjustments
    }
  }, [width])
}
