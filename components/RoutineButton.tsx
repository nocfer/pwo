import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
type Props = {
  label: string;
  slug: string;
};

export default async function RoutineButton({ label, slug }: Props) {
  return (
    <View style={styles.buttonContainer}>
      <Pressable
        style={styles.button}
        onPress={() =>
          router.navigate({
            pathname: "/(tabs)/routines/[slug]",
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
    height: 168,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  button: {
    borderRadius: 10,
    width: 380,
    height: 68,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 16,
  },
});
