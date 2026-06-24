import { ConfettiCelebration } from '@/components/ConfettiCelebration'
import { MaxWidthContainer } from '@/components/common/MaxWidthContainer'
import { theme } from '@/theme/theme'
import { formatCount } from '@/lib/utils/format'
import type { WorkoutRecap as WorkoutRecapModel } from '@/lib/workoutRecap'
import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

export type WorkoutRecapProps = {
  programName: string
  recap: WorkoutRecapModel
  onShare: () => void
  onDone: () => void
}

function Stat({
  value,
  label,
  highlight
}: {
  value: string
  label: string
  highlight?: boolean
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export function WorkoutRecap({
  programName,
  recap,
  onShare,
  onDone
}: WorkoutRecapProps) {
  return (
    <View style={styles.root}>
      <ConfettiCelebration show message="Session complete 🎉" subMessage="" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <MaxWidthContainer>
          <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
          <Text style={styles.title}>{programName} · recap</Text>

          <View style={styles.statRow}>
            <Stat value={recap.timeStr} label="time" />
            <Stat value={String(recap.setsCount)} label="sets" />
            <Stat
              value={recap.volume.toLocaleString('en-US')}
              label="lb volume"
              highlight
            />
          </View>

          {recap.totalSkipped > 0 ? (
            <View style={styles.skippedPill}>
              <Text style={styles.skippedText}>
                {formatCount(recap.totalSkipped, 'set')} skipped
              </Text>
            </View>
          ) : null}

          <View style={styles.rows}>
            {recap.rows.map(row => (
              <View key={row.exerciseId} style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text style={styles.rowDetail} numberOfLines={1}>
                    {row.detail}
                  </Text>
                </View>
                {row.isPR ? (
                  <View style={styles.prBadge}>
                    <Text style={styles.prText}>PR</Text>
                  </View>
                ) : (
                  <Text style={styles.noPr}>—</Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.shareBtn,
                pressed && styles.pressed
              ]}
              onPress={onShare}
              accessibilityRole="button"
              accessibilityLabel="Share workout"
            >
              <Text style={styles.shareText}>Share</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.doneBtn,
                pressed && styles.pressed
              ]}
              onPress={onDone}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </MaxWidthContainer>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.session.appBg
  },
  scroll: {
    flex: 1
  },
  content: {
    padding: 22,
    paddingTop: theme.spacing.xxl
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 1.4,
    color: theme.colors.session.cyan
  },
  title: {
    fontSize: 26,
    fontFamily: theme.fonts.display,
    letterSpacing: -0.4,
    color: theme.colors.session.textPrimary,
    marginTop: 6
  },
  statRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.lg
  },
  stat: {
    flex: 1
  },
  statValue: {
    fontSize: 24,
    fontFamily: theme.fonts.displayMed,
    color: theme.colors.session.textPrimary,
    fontVariant: ['tabular-nums']
  },
  statValueHighlight: {
    color: theme.colors.session.lime
  },
  statLabel: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.session.muted,
    marginTop: 2
  },
  skippedPill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.session.trackBg,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: theme.spacing.lg
  },
  skippedText: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.session.subtext
  },
  rows: {
    marginTop: theme.spacing.xl,
    gap: 2
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.session.hairline
  },
  rowInfo: {
    flex: 1
  },
  rowName: {
    fontSize: 15,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.textPrimary
  },
  rowDetail: {
    fontSize: 13,
    fontFamily: theme.fonts.medium,
    color: theme.colors.session.muted,
    marginTop: 2
  },
  prBadge: {
    backgroundColor: theme.colors.session.limeTintBg,
    borderRadius: theme.radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 9
  },
  prText: {
    fontSize: 10,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 1,
    color: theme.colors.session.lime
  },
  noPr: {
    fontSize: 15,
    fontFamily: theme.fonts.medium,
    color: theme.colors.session.faint
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxl
  },
  shareBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.session.controlBg
  },
  shareText: {
    fontSize: 16,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.textPrimary
  },
  doneBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.session.lime
  },
  doneText: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.session.onLime
  },
  pressed: {
    opacity: 0.85
  }
})
