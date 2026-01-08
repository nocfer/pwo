import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

type Props = {
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export default function Button({
  label,
  variant = "secondary",
  size = "md",
  icon,
  onPress,
  disabled = false,
  fullWidth = false,
  style
}: Props) {
  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";

  const sizeStyles = {
    sm: styles.buttonSm,
    md: styles.buttonMd,
    lg: styles.buttonLg
  };

  const iconSize = size === "sm" ? 16 : size === "lg" ? 20 : 18;

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, style]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          sizeStyles[size],
          isPrimary && styles.buttonPrimary,
          isGhost && styles.buttonGhost,
          pressed &&
            !disabled &&
            (isPrimary ? styles.buttonPrimaryPressed : styles.buttonPressed),
          disabled && styles.buttonDisabled
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={iconSize}
            color={
              isPrimary
                ? theme.colors.primaryTextOn
                : isGhost
                  ? theme.colors.primary
                  : theme.colors.text
            }
            style={styles.icon}
          />
        )}
        <Text
          style={[
            styles.label,
            size === "sm" && styles.labelSm,
            size === "lg" && styles.labelLg,
            isPrimary && styles.labelPrimary,
            isGhost && styles.labelGhost,
            disabled && styles.labelDisabled
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
    alignSelf: "flex-start"
  },
  fullWidth: {
    alignSelf: "stretch"
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface
  },
  buttonSm: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md
  },
  buttonMd: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg
  },
  buttonLg: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderColor: "transparent"
  },
  buttonPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }]
  },
  buttonPrimaryPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  buttonDisabled: {
    opacity: 0.5
  },
  icon: {
    marginRight: theme.spacing.sm
  },
  label: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  labelSm: {
    fontSize: 13
  },
  labelLg: {
    fontSize: 16
  },
  labelPrimary: {
    color: theme.colors.primaryTextOn
  },
  labelGhost: {
    color: theme.colors.primary
  },
  labelDisabled: {
    color: theme.colors.muted
  }
});
