/**
 * ToggleSwitch - themed wrapper around RN Switch.
 *
 * ON  = lime track + dark knob; OFF = hairline track + muted knob.
 * (Approximates the design spec's 46×28 / lime / dark-knob switch using the
 * platform Switch, so there's no new dependency.)
 */

import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import { Switch } from 'react-native'

type Props = {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
  accessibilityLabel?: string
}

export default function ToggleSwitch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel
}: Props) {
  return (
    <Switch
      value={value}
      onValueChange={next => {
        haptics.buttonTap()
        onValueChange(next)
      }}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{
        false: theme.colors.borderLight,
        true: theme.colors.primary
      }}
      thumbColor={value ? theme.colors.primaryTextOn : theme.colors.subtext}
      ios_backgroundColor={theme.colors.borderLight}
    />
  )
}
