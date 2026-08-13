import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS } from "@/constants/colors";

export interface BackToLoginButtonProps {
  onPress: () => void;
  title?: string;
}

export function BackToLoginButton({
  onPress,
  title = "Back to Log in",
}: BackToLoginButtonProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginTop: 8,
    paddingVertical: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
  },
});
