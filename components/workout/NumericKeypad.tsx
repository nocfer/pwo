import { theme } from '@/theme/theme'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export type NumericKeypadProps = {
  onDigit: (digit: number) => void
  onBackspace: () => void
  onDone: () => void
}

const DIGIT_ROWS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]

export function NumericKeypad({
  onDigit,
  onBackspace,
  onDone
}: NumericKeypadProps) {
  return (
    <View style={styles.container}>
      {DIGIT_ROWS.map(row => (
        <View key={row[0]} style={styles.row}>
          {row.map(d => (
            <Pressable
              key={d}
              style={({ pressed }) => [
                styles.key,
                styles.digitKey,
                pressed && styles.keyPressed
              ]}
              onPress={() => onDigit(d)}
              accessibilityLabel={`digit ${d}`}
              accessibilityHint={`Enter digit ${d}`}
              accessibilityRole="button"
            >
              <Text style={styles.digitText}>{d}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [
            styles.key,
            styles.backspaceKey,
            pressed && styles.keyPressed
          ]}
          onPress={onBackspace}
          accessibilityLabel="backspace"
          accessibilityHint="Delete last digit"
          accessibilityRole="button"
        >
          <Text style={styles.backspaceText}>⌫</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.key,
            styles.digitKey,
            pressed && styles.keyPressed
          ]}
          onPress={() => onDigit(0)}
          accessibilityLabel="digit 0"
          accessibilityHint="Enter digit 0"
          accessibilityRole="button"
        >
          <Text style={styles.digitText}>0</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.key,
            styles.doneKey,
            pressed && styles.keyPressed
          ]}
          onPress={onDone}
          accessibilityLabel="done, dismiss keypad"
          accessibilityHint="Confirm value and move to next field"
          accessibilityRole="button"
        >
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  key: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md
  },
  keyPressed: {
    opacity: 0.7
  },
  digitKey: {
    backgroundColor: theme.colors.surfaceElevated
  },
  backspaceKey: {
    backgroundColor: theme.colors.surface
  },
  doneKey: {
    backgroundColor: theme.colors.primary
  },
  digitText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  backspaceText: {
    ...theme.typography.bodyBold,
    color: theme.colors.subtext
  },
  doneText: {
    ...theme.typography.body,
    color: theme.colors.primaryTextOn
  }
})
