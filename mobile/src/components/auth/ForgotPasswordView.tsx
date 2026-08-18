import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Mail } from "lucide-react-native";
import { CustomInput } from "@/components/CustomInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BackToLoginButton } from "@/components/auth/BackToLoginButton";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";

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
        placeholder="john.doe@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon={
          <Mail size={22} color={COLORS.inputIcon} />
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
    fontFamily: FONTS.regular,
    fontSize: 15,
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
