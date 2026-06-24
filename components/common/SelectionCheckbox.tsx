/**
 * SelectionCheckbox - rounded multi-select checkbox.
 * Lime fill + dark check when selected; hairline outline when not.
 */

import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, View } from 'react-native'

export default function SelectionCheckbox({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && (
        <Ionicons
          name="checkmark"
          size={16}
          color={theme.colors.primaryTextOn}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  }
})
