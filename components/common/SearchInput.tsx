/**
 * SearchInput - Reusable search input component
 */

import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Pressable, StyleSheet, TextInput, View, ViewStyle } from 'react-native'

type Props = {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  style?: ViewStyle
  autoFocus?: boolean
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
  autoFocus = false
}: Props) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <View
      style={[styles.container, isFocused && styles.containerFocused, style]}
    >
      <Ionicons
        name="search"
        size={18}
        color={isFocused ? theme.colors.primary : theme.colors.muted}
        style={styles.icon}
      />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.input}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.clearButtonPressed
          ]}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    height: 44
  },
  containerFocused: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md - 1
  },
  icon: {
    marginRight: theme.spacing.sm
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingVertical: 0
  },
  clearButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs
  },
  clearButtonPressed: {
    opacity: 0.6
  }
})

export default SearchInput
