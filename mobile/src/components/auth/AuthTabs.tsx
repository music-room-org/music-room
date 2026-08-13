import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants/colors";

export type AuthMode = "login" | "signup" | "forgot_password" | "email_check";

export interface AuthTabsProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

export function AuthTabs({ mode, onModeChange }: AuthTabsProps) {
  if (mode === "forgot_password" || mode === "email_check") {
    const title =
      mode === "forgot_password"
        ? "Forgot your password?"
        : "Check your inbox!";

    return (
      <View style={styles.tabHeader}>
        <View style={styles.singleTabButton}>
          <Text style={styles.singleTabText}>{title}</Text>
          <View style={[styles.activeIndicator, styles.singleActiveIndicator]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabHeader}>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onModeChange("login")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            mode === "login" && styles.activeTabText,
          ]}
        >
          Log in
        </Text>
        {mode === "login" && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onModeChange("signup")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            mode === "signup" && styles.activeTabText,
          ]}
        >
          Sign up
        </Text>
        {mode === "signup" && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8,
    position: "relative",
  },
  tabText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.tabInactive,
    textAlign: "center",
  },
  activeTabText: {
    color: COLORS.primary,
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "60%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  singleTabButton: {
    alignItems: "center",
    paddingBottom: 8,
    position: "relative",
    width: "100%",
  },
  singleTabText: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
  },
  singleActiveIndicator: {
    width: "80%",
  },
});
