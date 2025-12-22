/**
 * QR Code Scanner Screen
 */

import { ScreenHeader } from "@/components";
import QRCodeScanner from "@/components/common/QRCodeScanner";
import { decodeProgramFromShare } from "@/lib/utils/programShare";
import { theme } from "@/theme/theme";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanScreen() {
  const [scanKey, setScanKey] = useState(0);

  // Reset scanner when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setScanKey((prev) => prev + 1);
    }, [])
  );

  const handleScan = (data: string) => {
    try {
      // Decode and validate the program data
      const programData = decodeProgramFromShare(data);

      // Navigate to preview screen with the program data
      router.push({
        pathname: "/library/import/preview",
        params: {
          programData: JSON.stringify(programData)
        }
      });
    } catch (error) {
      Alert.alert(
        "Invalid QR Code",
        error instanceof Error
          ? error.message
          : "This QR code does not contain a valid program.",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset scanner to allow scanning again
              setScanKey((prev) => prev + 1);
            }
          }
        ]
      );
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <ScreenHeader
        title="Scan QR Code"
        subtitle="Scan a program QR code to import"
        showBackButton={false}
        rightElement={null}
      />
      <QRCodeScanner key={scanKey} onScan={handleScan} onClose={handleClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  }
});

