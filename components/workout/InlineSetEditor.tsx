import { theme } from '@/theme/theme'
import type { SetStatus } from '@/types/workout'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { SlideInDown } from 'react-native-reanimated'

export type EditorField = 'weight' | 'reps'

export type InlineSetEditorProps = {
  visible: boolean
  field: EditorField
  setNumber: number
  status: SetStatus
  value: number
  /** Base value (prefill) the quick chips are arranged around. */
  prefillBase: number
  onChange: (value: number) => void
  onDone: () => void
  onSecondary: () => void
}

function secondaryLabel(status: SetStatus): string {
  if (status === 'editing') return 'Unlog set'
  if (status === 'skipped') return 'Restore set'
  return 'Skip set'
}

function quickChips(field: EditorField, base: number): number[] {
  const raw =
    field === 'weight'
      ? [base - 5, base, base + 5, base + 10]
      : [base - 1, base, base + 1, base + 2]
  const floor = field === 'weight' ? 0 : 1
  // De-dupe while preserving order, drop values below the floor.
  const seen = new Set<number>()
  const chips: number[] = []
  for (const v of raw) {
    if (v < floor || seen.has(v)) continue
    seen.add(v)
    chips.push(v)
  }
  return chips
}

export function InlineSetEditor({
  visible,
  field,
  setNumber,
  status,
  value,
  prefillBase,
  onChange,
  onDone,
  onSecondary
}: InlineSetEditorProps) {
  const step = field === 'weight' ? 5 : 1
  const floor = field === 'weight' ? 0 : 1
  const unit = field === 'weight' ? 'lb' : 'reps'
  const chips = quickChips(field, prefillBase)

  const decrement = () => onChange(Math.max(floor, value - step))
  const increment = () => onChange(value + step)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDone}
    >
      <Pressable
        style={styles.scrim}
        onPress={onDone}
        accessibilityLabel="Close editor"
      >
        <Animated.View
          style={styles.cardWrap}
          entering={SlideInDown.duration(350)}
        >
          <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>
            SET {setNumber} · {field.toUpperCase()}
          </Text>

          <View style={styles.stepperRow}>
            <Pressable
              style={[styles.stepBtn, styles.stepMinus]}
              onPress={decrement}
              accessibilityRole="button"
              accessibilityLabel={`Decrease ${field}`}
            >
              <Ionicons
                name="remove"
                size={24}
                color={theme.colors.session.textPrimary}
              />
            </Pressable>

            <View style={styles.valueWrap}>
              <Text style={styles.value} accessibilityLabel={`${value} ${unit}`}>
                {value}
              </Text>
              <Text style={styles.unit}>{unit}</Text>
            </View>

            <Pressable
              style={[styles.stepBtn, styles.stepPlus]}
              onPress={increment}
              accessibilityRole="button"
              accessibilityLabel={`Increase ${field}`}
            >
              <Ionicons
                name="add"
                size={24}
                color={theme.colors.session.onLime}
              />
            </Pressable>
          </View>

          <View style={styles.chips}>
            {chips.map(chip => {
              const selected = chip === value
              return (
                <Pressable
                  key={chip}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => onChange(chip)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Set ${field} to ${chip}`}
                >
                  <Text
                    style={[styles.chipText, selected && styles.chipTextSelected]}
                  >
                    {chip}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.secondaryBtn]}
              onPress={onSecondary}
              accessibilityRole="button"
              accessibilityLabel={secondaryLabel(status)}
            >
              <Text style={styles.secondaryText}>{secondaryLabel(status)}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.doneBtn]}
              onPress={onDone}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: theme.colors.session.editorScrim
  },
  cardWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 96
  },
  card: {
    backgroundColor: theme.colors.session.elevated,
    borderWidth: 1,
    borderColor: theme.colors.session.editorBorder,
    borderRadius: 24,
    padding: 20,
    boxShadow: '0 28px 60px rgba(0,0,0,0.6)',
    elevation: 12
  },
  title: {
    fontSize: 10,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 1.4,
    color: theme.colors.session.faint
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14
  },
  stepBtn: {
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepMinus: {
    backgroundColor: theme.colors.session.controlBg
  },
  stepPlus: {
    backgroundColor: theme.colors.session.lime
  },
  valueWrap: {
    flex: 1,
    alignItems: 'center'
  },
  value: {
    fontSize: 52,
    fontFamily: theme.fonts.displayMed,
    color: theme.colors.session.lime,
    fontVariant: ['tabular-nums']
  },
  unit: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.session.muted,
    marginTop: -4
  },
  chips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginTop: 18
  },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.session.controlBg
  },
  chipSelected: {
    backgroundColor: theme.colors.session.lime
  },
  chipText: {
    fontSize: 15,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.subtext,
    fontVariant: ['tabular-nums']
  },
  chipTextSelected: {
    color: theme.colors.session.onLime
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: 18
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryBtn: {
    backgroundColor: theme.colors.session.dangerEditorBg
  },
  secondaryText: {
    fontSize: 15,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.danger
  },
  doneBtn: {
    backgroundColor: theme.colors.session.doneBtnBg
  },
  doneText: {
    fontSize: 15,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.textPrimary
  }
})
