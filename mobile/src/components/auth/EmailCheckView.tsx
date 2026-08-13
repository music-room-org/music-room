import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BackToLoginButton } from "@/components/auth/BackToLoginButton";
import { COLORS } from "@/constants/colors";

export interface EmailCheckViewProps {
  email?: string;
  onResendEmail: () => void;
  onBackToLogin: () => void;
}

export function EmailCheckView({
  email = "@user__email",
  onResendEmail,
  onBackToLogin,
}: EmailCheckViewProps) {
  const displayEmail = email.trim() ? email : "@user__email";

  return (
    <View style={styles.container}>
      <Text style={styles.messageText}>
        We’ve sent a verification link to
      </Text>

      <Text style={styles.emailText}>{displayEmail}</Text>

      <Text style={styles.messageText}>
        Please click the link in that email to activate your account before logging in.
      </Text>

      <PrimaryButton
        title="Resend email"
        onPress={onResendEmail}
        buttonStyle={styles.submitButton}
      />

      <BackToLoginButton onPress={onBackToLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
  },
  messageText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDescription,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.emailHighlight,
    textAlign: "center",
    marginVertical: 12,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
  },
});
