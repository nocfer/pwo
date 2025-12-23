/**
 * QR Code Scanner Screen
 */

import { ScreenHeader } from "@/components";
import QRCodeScanner from "@/components/common/QRCodeScanner";
import { decodeProgramFromShare } from "@/lib/utils/programShare";
import { theme } from "@/theme/theme";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanScreen() {
  const [isNavigating, setIsNavigating] = useState(false);
  const lastScannedDataRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  // Reset navigation state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, [])
  );

  const handleScan = (data: string) => {
    // Prevent scanning while already navigating
    if (isNavigating) return;
    
    const now = Date.now();
    const timeSinceLastScan = now - lastScanTimeRef.current;
    
    // Prevent re-scanning the same QR code within 2 seconds
    // This prevents the loop when returning from preview
    if (
      lastScannedDataRef.current === data &&
      timeSinceLastScan < 2000
    ) {
      return;
    }
    
    try {
      setIsNavigating(true);
      lastScannedDataRef.current = data;
      lastScanTimeRef.current = now;
      
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
      setIsNavigating(false);
      lastScannedDataRef.current = null;
      Alert.alert(
        "Invalid QR Code",
        error instanceof Error
          ? error.message
          : "This QR code does not contain a valid program."
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
      <QRCodeScanner onScan={handleScan} onClose={handleClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  }
});

