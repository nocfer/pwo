import React from 'react'
import { View, type ViewStyle } from 'react-native'

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'

type MaxWidthContainerProps = {
  children: React.ReactNode
  style?: ViewStyle
}

export const MaxWidthContainer = ({
  children,
  style
}: MaxWidthContainerProps) => {
  const { containerStyle } = useResponsiveLayout()

  return <View style={[containerStyle, style]}>{children}</View>
}
