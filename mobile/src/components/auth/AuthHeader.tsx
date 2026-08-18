import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";

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
    fontFamily: FONTS.bold,
    fontSize: 40,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 21,
    color: COLORS.textSecondary,
    lineHeight: 28,
  },
});
