import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export type TimerControlsProps = {
  isPaused: boolean
  onPause: () => void
  onResume: () => void
  onSkip: () => void
  layout?: 'row' | 'column'
}

export function TimerControls({
  isPaused,
  onPause,
  onResume,
  onSkip,
  layout = 'row'
}: TimerControlsProps) {
  return (
    <View style={[styles.container, layout === 'row' && styles.row]}>
      {!isPaused ? (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.buttonSecondary,
            pressed && styles.buttonPressed
          ]}
          onPress={onPause}
        >
          <Ionicons
            name="pause"
            size={18}
            color={theme.colors.text}
            style={styles.icon}
          />
          <Text style={styles.buttonSecondaryText}>Pause</Text>
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.buttonPrimary,
            pressed && styles.buttonPrimaryPressed
          ]}
          onPress={onResume}
        >
          <Ionicons
            name="play"
            size={18}
            color={theme.colors.primaryTextOn}
            style={styles.icon}
          />
          <Text style={styles.buttonPrimaryText}>Resume</Text>
        </Pressable>
      )}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.buttonSecondary,
          pressed && styles.buttonPressed
        ]}
        onPress={onSkip}
      >
        <Ionicons
          name="play-skip-forward"
          size={18}
          color={theme.colors.text}
          style={styles.icon}
        />
        <Text style={styles.buttonSecondaryText}>Skip</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    minHeight: 48
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface
  },
  buttonPressed: {
    backgroundColor: theme.colors.surface,
    transform: [{ scale: 0.98 }]
  },
  buttonPrimaryPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  icon: {
    marginRight: theme.spacing.sm
  },
  buttonPrimaryText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  buttonSecondaryText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  }
})

export default TimerControls
