/**
 * Program Import Preview Screen
 */

import { ErrorScreen, ScreenHeader } from "@/components";
import ProgramImportPreview from "@/components/program/ProgramImportPreview";
import { useDataActions } from "@/context/DataContext";
import {
  decodeProgramFromShare,
  ShareableProgramData
} from "@/lib/utils/programShare";
import { theme } from "@/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ImportPreviewScreen() {
  const params = useLocalSearchParams();
  const actions = useDataActions();
  const [isImporting, setIsImporting] = useState(false);

  const programDataParam = params.programData as string | undefined;

  if (!programDataParam) {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
        <ScreenHeader title="Import Program" />
        <ErrorScreen message="No program data provided." />
      </SafeAreaView>
    );
  }

  let programData: ShareableProgramData;
  try {
    // Parse the program data from params
    const parsed = JSON.parse(programDataParam);
    programData = decodeProgramFromShare(JSON.stringify(parsed));
  } catch (error) {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
        <ScreenHeader title="Import Program" />
        <ErrorScreen
          message={
            error instanceof Error
              ? error.message
              : "Invalid program data format."
          }
        />
      </SafeAreaView>
    );
  }

  const handleConfirm = async () => {
    setIsImporting(true);
    try {
      // Import the program using DataContext
      await actions.upsertProgram({
        id: `prg_${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        name: programData.name,
        description: programData.description,
        blocks: programData.blocks,
        challengeConfig: programData.challengeConfig
      });

      // Navigate back to library
      router.replace("/(tabs)/library");
    } catch (error) {
      Alert.alert(
        "Import Failed",
        error instanceof Error ? error.message : "Could not import program."
      );
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to scanner screen
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback: navigate to scanner if we can't go back
      router.replace("/library/scan");
    }
  };

  const handleBack = () => {
    // Navigate back to scanner screen
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback: navigate to scanner if we can't go back
      router.replace("/library/scan");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <ScreenHeader title="Import Program" onBack={handleBack} />
      <ProgramImportPreview
        programData={programData}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isImporting={isImporting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  }
});
