import { describe, expect, it, vi } from 'vitest'
import React from 'react'

import { MaxWidthContainer } from '@/components/common/MaxWidthContainer'

const mockUseResponsiveLayout = vi.fn()

vi.mock('@/hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => mockUseResponsiveLayout()
}))

vi.mock('react-native', () => ({
  View: ({ style, children }: { style?: unknown; children?: unknown }) => ({
    type: 'View',
    props: { style, children }
  })
}))

describe('MaxWidthContainer', () => {
  it('renders children inside a View', () => {
    mockUseResponsiveLayout.mockReturnValue({
      containerStyle: {},
      breakpoint: 'regular',
      isCompact: false,
      isExpanded: false,
      compactAdjustments: null
    })

    const testChild = React.createElement('span', null, 'hello')
    const result = MaxWidthContainer({ children: testChild })

    expect(result.type).toBeTypeOf('function')
    expect(result.props.children).toEqual(testChild)
  })

  it('applies container styles on expanded breakpoint', () => {
    const expandedStyle = {
      maxWidth: 480,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 24
    }

    mockUseResponsiveLayout.mockReturnValue({
      containerStyle: expandedStyle,
      breakpoint: 'expanded',
      isCompact: false,
      isExpanded: true,
      compactAdjustments: null
    })

    const result = MaxWidthContainer({
      children: React.createElement('span', null, 'hello')
    })

    expect(result.props.style).toEqual(expect.arrayContaining([expandedStyle]))
  })

  it('passes through with no layout constraint on regular breakpoint', () => {
    mockUseResponsiveLayout.mockReturnValue({
      containerStyle: {},
      breakpoint: 'regular',
      isCompact: false,
      isExpanded: false,
      compactAdjustments: null
    })

    const result = MaxWidthContainer({
      children: React.createElement('span', null, 'hello')
    })

    expect(result.props.style).toEqual(expect.arrayContaining([{}]))
  })

  it('merges custom style prop', () => {
    const expandedStyle = {
      maxWidth: 480,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 24
    }

    mockUseResponsiveLayout.mockReturnValue({
      containerStyle: expandedStyle,
      breakpoint: 'expanded',
      isCompact: false,
      isExpanded: true,
      compactAdjustments: null
    })

    const customStyle = { marginTop: 10 }

    const result = MaxWidthContainer({
      children: React.createElement('span', null, 'hello'),
      style: customStyle
    })

    expect(result.props.style).toEqual([expandedStyle, customStyle])
  })
})
