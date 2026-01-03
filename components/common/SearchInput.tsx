/**
 * SearchInput - Reusable search input component
 *
 * Consolidates the duplicate search input UI from challenges.tsx and library.tsx
 */

import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { StyleSheet, TextInput, View, ViewStyle } from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
};

export function SearchInput({
  value,
  onChangeText,
  placeholder = "Search...",
  style
}: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[styles.container, isFocused && styles.containerFocused, style]}
    >
      <Ionicons
        name="search-outline"
        size={20}
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
      />
      {value.length > 0 && (
        <Ionicons
          name="close-circle"
          size={20}
          color={theme.colors.muted}
          onPress={() => onChangeText("")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.sm
  },
  containerFocused: {
    borderColor: theme.colors.primary,
    ...theme.shadows.md
  },
  icon: {
    marginRight: theme.spacing.sm
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingVertical: theme.spacing.xs
  }
});

export default SearchInput;
