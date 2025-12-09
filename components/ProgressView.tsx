import { StyleSheet, Text, View } from "react-native";

type Props = {
  slug: string;
};

export default async function ProgressView({ slug }: Props) {
  const progress = await import("@/assets/data/progress.json");

  const last7DaysProgress = progress.default.find((p) => p.slug === slug);

  return (
    <View style={styles.viewContainer}>
      {last7DaysProgress?.streak?.map((hit, i) => (
        <Text key={i}>{hit}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  viewContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
});
