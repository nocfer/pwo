/**
 * ToggleSwitch — thin adapter over the kit's Toggle (components/ui/Toggle).
 * Preserves the `onValueChange` API existing callers use; new code should use
 * the kit's Toggle (`onChange`) directly.
 * @deprecated import { Toggle } from '@/components/ui' instead.
 */

import Toggle from '@/components/ui/Toggle'

type Props = {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
  accessibilityLabel?: string
}

export default function ToggleSwitch({
  value,
  onValueChange,
  disabled,
  accessibilityLabel
}: Props) {
  return (
    <Toggle
      value={value}
      onChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
    />
  )
}
