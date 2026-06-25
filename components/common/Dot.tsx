/**
 * Dot - Small status dot (offline-pending indicator, banner dot, etc.).
 * One definition so the pending/offline affordance stays consistent everywhere.
 */

import { theme } from '@/theme/theme'
import { View } from 'react-native'

type Props = {
  size?: number
  color?: string
}

export function Dot({ size = 8, color = theme.colors.warning }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color
      }}
    />
  )
}

export default Dot
