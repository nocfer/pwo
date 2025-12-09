import { theme } from "@/theme/theme";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
type Props = {
  label: string;
  slug: string;
};

export default function RoutineButton({ label, slug }: Props) {
  return (
    <View style={styles.buttonContainer}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() =>
          router.navigate({
            pathname: "/routines/[slug]",
            params: { slug },
          })
        }
      >
        <Text style={styles.buttonLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 320,
    height: 88,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  button: {
    borderRadius: 12,
    width: "100%",
    height: "100%",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  buttonPressed: {
    backgroundColor: theme.colors.card,
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    color: theme.colors.text,
    fontSize: 16,
  },
});
