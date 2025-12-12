import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  programId: string;
};

export default function ChallengeButton({ label, programId }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={() =>
        router.navigate({
          pathname: "/programs/[id]",
          params: { id: programId },
        })
      }
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="barbell-outline"
            size={24}
            color={theme.colors.primary}
          />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.md,
  },
  buttonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  label: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1,
  },
});
