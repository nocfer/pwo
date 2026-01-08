/**
 * SearchInput - Reusable search input component
 */

import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ViewStyle
} from "react-native";

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
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    height: 44
  },
  containerFocused: {
    borderColor: theme.colors.primary
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
    padding: theme.spacing.xs
  },
  clearButtonPressed: {
    opacity: 0.7
  }
});

export default SearchInput;
