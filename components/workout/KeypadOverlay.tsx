import { theme } from '@/theme/theme'
import React from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { MaxWidthContainer } from '@/components/common/MaxWidthContainer'
import { NumericKeypad } from './NumericKeypad'

export type KeypadOverlayProps = {
  visible: boolean
  onDigit: (digit: number) => void
  onBackspace: () => void
  onDone: () => void
}

export function KeypadOverlay({
  visible,
  onDigit,
  onBackspace,
  onDone
}: KeypadOverlayProps) {
  const { height: screenHeight } = useWindowDimensions()

  if (!visible) return null

  return (
    <View style={[styles.overlay, { height: screenHeight * 0.4 }]}>
      <MaxWidthContainer>
        <NumericKeypad
          onDigit={onDigit}
          onBackspace={onBackspace}
          onDone={onDone}
        />
      </MaxWidthContainer>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.overlayGlass,
    justifyContent: 'center'
  }
})
