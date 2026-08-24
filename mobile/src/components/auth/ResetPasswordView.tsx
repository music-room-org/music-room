import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LockKeyhole, Eye, EyeOff } from "lucide-react-native";
import { CustomInput } from "@/components/CustomInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BackToLoginButton } from "@/components/auth/BackToLoginButton";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";

export interface ResetPasswordViewProps {
  onSubmit: (password: string) => Promise<void>;
  onBackToLogin: () => void;
}

export function ResetPasswordView({
  onSubmit,
  onBackToLogin,
}: ResetPasswordViewProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError(""); // Réinitialiser l'erreur
    
    // Vérifications basiques avant d'envoyer au serveur
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }

    // Appel de la fonction pour envoyer la requête à l'API
    await onSubmit(password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instructionText}>
        Veuillez saisir votre nouveau mot de passe.
      </Text>

      {/* Affichage des erreurs de saisie */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <CustomInput
        placeholder="Nouveau mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        leftIcon={<LockKeyhole size={22} color={COLORS.inputIcon} />}
        rightIcon={
          showPassword ? (
            <EyeOff size={22} color={COLORS.inputIcon} />
          ) : (
            <Eye size={22} color={COLORS.inputIcon} />
          )
        }
        onRightIconPress={() => setShowPassword(!showPassword)}
      />

      <CustomInput
        placeholder="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        leftIcon={<LockKeyhole size={22} color={COLORS.inputIcon} />}
        rightIcon={
          showConfirmPassword ? (
            <EyeOff size={22} color={COLORS.inputIcon} />
          ) : (
            <Eye size={22} color={COLORS.inputIcon} />
          )
        }
        onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
      />

      <PrimaryButton
        title="Confirmer"
        onPress={handleReset}
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
  errorText: {
    fontFamily: FONTS.regular,
    color: "red",
    fontSize: 13,
    marginBottom: 10,
    textAlign: "center",
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 16,
  },
});