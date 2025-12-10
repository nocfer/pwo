import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

type Props = {
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export default function Button({
  label,
  variant = "secondary",
  icon,
  onPress,
  disabled = false,
  fullWidth = false,
  style,
}: Props) {
  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, style]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          isPrimary && styles.buttonPrimary,
          isGhost && styles.buttonGhost,
          pressed &&
            !disabled &&
            (isPrimary ? styles.buttonPrimaryPressed : styles.buttonPressed),
          disabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={isPrimary ? theme.colors.primaryTextOn : theme.colors.text}
            style={styles.icon}
          />
        )}
        <Text
          style={[
            styles.label,
            isPrimary && styles.labelPrimary,
            isGhost && styles.labelGhost,
            disabled && styles.labelDisabled,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: {
    backgroundColor: theme.colors.card,
  },
  buttonPrimaryPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  label: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  },
  labelPrimary: {
    color: theme.colors.primaryTextOn,
  },
  labelGhost: {
    color: theme.colors.primary,
  },
  labelDisabled: {
    color: theme.colors.muted,
  },
});
