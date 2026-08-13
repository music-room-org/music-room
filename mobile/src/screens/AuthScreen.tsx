import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  AuthHeader,
  AuthMode,
  AuthTabs,
  CustomInput,
  EmailCheckView,
  ForgotPasswordView,
  FormCard,
  PrimaryButton,
  SocialButton,
} from "@/components";
import { COLORS } from "@/constants/colors";

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";

  const handleForgotPasswordSubmit = (targetEmail: string) => {
    if (targetEmail.trim()) {
      setEmail(targetEmail);
    }
    setMode("email_check");
  };

  const handleMainSubmit = () => {
    if (mode === "signup") {
      setMode("email_check");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <AuthHeader />

        {/* Card Section */}
        <View style={styles.cardWrapper}>
          <FormCard>
            {/* Header / Tab Navigation */}
            <AuthTabs mode={mode} onModeChange={setMode} />

            {/* Mode Content Views */}
            {mode === "forgot_password" ? (
              <ForgotPasswordView
                initialEmail={email}
                onSubmit={handleForgotPasswordSubmit}
                onBackToLogin={() => setMode("login")}
              />
            ) : mode === "email_check" ? (
              <EmailCheckView
                email={email}
                onResendEmail={() => {}}
                onBackToLogin={() => setMode("login")}
              />
            ) : (
              <View style={styles.formContainer}>
                <CustomInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={
                    <Ionicons
                      name="mail-outline"
                      size={22}
                      color={COLORS.inputIcon}
                    />
                  }
                />

                <CustomInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={22}
                      color={COLORS.inputIcon}
                    />
                  }
                  rightIcon={
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={COLORS.inputIcon}
                    />
                  }
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />

                {isLogin ? (
                  <TouchableOpacity
                    style={styles.forgotPasswordContainer}
                    onPress={() => setMode("forgot_password")}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot your password?
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.passwordHintContainer}>
                    <Text style={styles.passwordHintText}>
                      Min 8 chars., 1 upp., 1 low., 1 num.
                    </Text>
                  </View>
                )}

                {/* Main Submit Button */}
                <PrimaryButton
                  title={isLogin ? "Log in" : "Sign up"}
                  onPress={handleMainSubmit}
                  buttonStyle={styles.submitButtonMargin}
                />

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login Buttons */}
                <SocialButton
                  variant="google"
                  title={isLogin ? "Continue with Google" : "Sign up with Google"}
                  style={styles.socialButtonMargin}
                />

                <SocialButton
                  variant="facebook"
                  title={
                    isLogin ? "Continue with Facebook" : "Sign up with Facebook"
                  }
                />
              </View>
            )}
          </FormCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  cardWrapper: {
    marginTop: 10,
    paddingHorizontal: 18,
  },
  formContainer: {
    marginTop: 6,
  },
  passwordHintContainer: {
    alignSelf: "flex-end",
    marginTop: 6,
    marginBottom: 16,
  },
  passwordHintText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "500",
    textAlign: "right",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginTop: 6,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  submitButtonMargin: {
    marginTop: 10,
    marginBottom: 22,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },
  dividerText: {
    marginHorizontal: 14,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  socialButtonMargin: {
    marginBottom: 12,
  },
});
