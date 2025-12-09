import ProgressView from "@/components/ProgressView";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function RoutinePage() {
  const params = useLocalSearchParams();
  console.log(params);
  return (
    <View>
      <Text>View user (imperative)</Text>
      <ProgressView slug={params.slug as string}></ProgressView>
    </View>
  );
}
