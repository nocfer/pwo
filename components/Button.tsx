import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  theme?: "primary";
};

function standardButton({ label }: Props) {
  return (
    <View style={styles.buttonContainer}>
      <Pressable
        style={styles.button}
        onPress={() => alert("You pressed a button.")}
      >
        <Text style={styles.buttonLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

function primaryButton({ label }: Props) {
  return (
    <View
      style={[
        styles.buttonContainer,
        { borderWidth: 2, borderColor: "#ffd33d", borderRadius: 10 },
      ]}
    >
      <Pressable
        style={[styles.button, { backgroundColor: "#fff" }]}
        onPress={() => router.navigate("/(tabs)/routines")}
      >
        <FontAwesome
          name="picture-o"
          size={18}
          color="#25292e"
          style={styles.buttonIcon}
        />
        <Text style={[styles.buttonLabel, { color: "#25292e" }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

export default function Button({ label, theme }: Props) {
  if (theme === "primary") {
    return primaryButton({ label });
  }
  return standardButton({ label });
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 320,
    height: 68,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  button: {
    borderRadius: 10,
    width: "100%",
    height: "100%",
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
