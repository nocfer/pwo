/**
 * TextField — themed text input.
 *
 * Default variant is a full-width field; `number` and `time` are the compact,
 * center-aligned inline variants used in set/rest editors (Space Grotesk numerals,
 * tabular). Focus draws a lime border + lime caret. The caller owns `value`.
 */

import { theme } from '@/theme/theme'
import { useState } from 'react'
import {
  KeyboardTypeOptions,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle
} from 'react-native'

export type TextFieldVariant = 'default' | 'number' | 'time'

type Props = {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  variant?: TextFieldVariant
  keyboardType?: KeyboardTypeOptions
  editable?: boolean
  autoFocus?: boolean
  maxLength?: number
  // Standard secure-entry / autofill / submission props passed straight through
  // to the underlying TextInput so the field is usable in real forms.
  secureTextEntry?: boolean
  autoCapitalize?: TextInputProps['autoCapitalize']
  autoComplete?: TextInputProps['autoComplete']
  autoCorrect?: boolean
  textContentType?: TextInputProps['textContentType']
  returnKeyType?: TextInputProps['returnKeyType']
  onSubmitEditing?: TextInputProps['onSubmitEditing']
  onFocus?: () => void
  onBlur?: () => void
  accessibilityLabel?: string
  style?: ViewStyle
}

export default function TextField({
  value,
  onChangeText,
  placeholder,
  variant = 'default',
  keyboardType,
  editable = true,
  autoFocus = false,
  maxLength,
  secureTextEntry,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  onFocus,
  onBlur,
  accessibilityLabel,
  style
}: Props) {
  const [focused, setFocused] = useState(false)
  const isInline = variant !== 'default'

  // number → numeric keypad; time (mm:ss) → numbers-and-punctuation.
  const resolvedKeyboard: KeyboardTypeOptions =
    keyboardType ??
    (variant === 'number'
      ? 'number-pad'
      : variant === 'time'
        ? 'numbers-and-punctuation'
        : 'default')

  return (
    <View
      style={[
        styles.container,
        isInline ? styles.containerInline : styles.containerDefault,
        focused && styles.focused,
        !editable && styles.disabled,
        style
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        keyboardType={resolvedKeyboard}
        editable={editable}
        autoFocus={autoFocus}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        textContentType={textContentType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        // Lime caret on both platforms.
        selectionColor={theme.colors.primary}
        cursorColor={theme.colors.primary}
        onFocus={() => {
          setFocused(true)
          onFocus?.()
        }}
        onBlur={() => {
          setFocused(false)
          onBlur?.()
        }}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        style={[styles.input, isInline && styles.inputInline]}
      />
    </View>
  )
}

const baseInput: TextStyle = {
  color: theme.colors.text,
  padding: 0
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center'
  },
  containerDefault: {
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    minHeight: 48
  },
  containerInline: {
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 44,
    minWidth: 64
  },
  focused: {
    borderColor: theme.colors.primary
  },
  disabled: {
    opacity: 0.5
  },
  input: {
    ...baseInput,
    ...theme.typography.body
  },
  inputInline: {
    ...baseInput,
    ...theme.typography.metric,
    textAlign: 'center'
  }
})
