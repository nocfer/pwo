/**
 * QRCodeShareModal - Modal component for displaying QR code for program sharing
 */

import { encodeProgramForShare } from "@/lib/utils/programShare";
import { theme } from "@/theme/theme";
import { Program } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type Props = {
  program: Program;
  visible: boolean;
  onClose: () => void;
};

export default function QRCodeShareModal({ program, visible, onClose }: Props) {
  const qrData = useMemo(() => {
    return encodeProgramForShare(program);
  }, [program]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons
                name="qr-code-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.title}>Share Program</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed
              ]}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <Text style={styles.programName}>{program.name}</Text>
            {program.description && (
              <Text style={styles.programDescription}>
                {program.description}
              </Text>
            )}

            <View style={styles.qrContainer}>
              <QRCode
                value={qrData}
                size={280}
                color={theme.colors.text}
                backgroundColor={theme.colors.background}
                logo={undefined}
                logoSize={0}
                logoMargin={0}
                logoBackgroundColor="transparent"
              />
            </View>

            <Text style={styles.instruction}>
              Scan this QR code to import this program
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    width: "100%",
    maxWidth: 400,
    ...theme.shadows.lg
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  closeButton: {
    padding: theme.spacing.xs,
    margin: -theme.spacing.xs
  },
  closeButtonPressed: {
    opacity: 0.6
  },
  content: {
    padding: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.md
  },
  programName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: "center"
  },
  programDescription: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: "center"
  },
  qrContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: theme.spacing.md
  },
  instruction: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: "center",
    marginTop: theme.spacing.sm
  }
});
