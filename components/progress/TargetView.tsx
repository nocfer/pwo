/**
 * TargetView - Placeholder for target/goal tracking component
 */

import { theme } from '@/theme/theme'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

type TargetViewProps = {
  slug?: string
}

export function TargetView({ slug }: TargetViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Target view coming soon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    alignItems: 'center'
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.muted
  }
})

export default TargetView
