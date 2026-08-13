import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/constants/colors";

export interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AuthHeader({
  title = "Welcome",
  subtitle = "Where music\nmeet collaboration",
}: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 16,
  },
  textWrapper: {
    maxWidth: "100%",
  },
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 21,
    fontWeight: "600",
    color: COLORS.textSecondary,
    lineHeight: 28,
  },
});

