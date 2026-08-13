import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CustomInput } from "@/components/CustomInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BackToLoginButton } from "@/components/auth/BackToLoginButton";
import { COLORS } from "@/constants/colors";

export interface ForgotPasswordViewProps {
  initialEmail?: string;
  onSubmit: (email: string) => void;
  onBackToLogin: () => void;
}

export function ForgotPasswordView({
  initialEmail = "",
  onSubmit,
  onBackToLogin,
}: ForgotPasswordViewProps) {
  const [email, setEmail] = useState(initialEmail);

  return (
    <View style={styles.container}>
      <Text style={styles.instructionText}>
        Enter your email address and you will receive a link to reset your password.
      </Text>

      <CustomInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon={
          <Ionicons name="mail-outline" size={22} color={COLORS.inputIcon} />
        }
      />

      <PrimaryButton
        title="Reset password"
        onPress={() => onSubmit(email)}
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
  instructionText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDescription,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 16,
  },
});
