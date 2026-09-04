import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react-native";
import * as Linking from 'expo-linking';
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
	ResetPasswordView,
} from "@/components";

import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export function AuthScreen() {
	const router = useRouter();

	const [mode, setMode] = useState<AuthMode>("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [resetToken, setResetToken] = useState("");
	const [username, setUsername] = useState("");

	const [request, response, promptAsync] = Google.useAuthRequest({
		webClientId: "119307991318-6q08olkvff98ol795k125ff5boh9ng8l.apps.googleusercontent.com",
		iosClientId: "119307991318-0drk1nlrgs2q2iq1o8of1r4v1cnivin9.apps.googleusercontent.com",
		redirectUri: "com.googleusercontent.apps.119307991318-0drk1nlrgs2q2iq1o8of1r4v1cnivin9:/oauth2redirect/google"
	});

	const isLogin = mode === "login";
	const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/auth' : 'http://localhost:3000/auth';

	// Écoute des liens entrants (Deep Linking)
	useEffect(() => {
		const handleDeepLink = (event: { url: string }) => {
			const parsed = Linking.parse(event.url);
			
			// On récupère action, token et email depuis les paramètres
			const { action, token, email: urlEmail } = parsed.queryParams || {};
			
			if (action === "reset-password" && token && urlEmail) {
				setResetToken(token as string);
				setEmail(urlEmail as string);
				setMode("reset_password"); // Bascule l'écran sur ResetPasswordView
			}
		};

		Linking.getInitialURL().then((url) => {
			if (url) handleDeepLink({ url });
		});

		const subscription = Linking.addEventListener("url", handleDeepLink);
		return () => subscription.remove();
	}, []);

	useEffect(() => {
		if (response?.type === "success" && response.authentication?.idToken) {
			handleGoogleLogin(response.authentication?.idToken);
		}
	}, [response]);

	const handleGoogleLogin = async (idToken: string) => {
		try {
			const response = await fetch(`${API_URL}/google`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					token: idToken,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				await saveToken(data.token);
				router.replace("/(tab)");
			} else {
				alert ("Network error: connection refused");
			}
		} catch (error) {
			console.log("Google login error:", error);
		}
	}

	async function saveToken(token: string) {
		if (Platform.OS === "web") {
			localStorage.setItem("userToken", token);
		} else {
			await SecureStore.setItemAsync("userToken", token);
		}
	}

	const handleForgotPasswordSubmit = async (targetEmail: string) => {
		if (!targetEmail.trim()) return;
		try {
			const response = await fetch(`${API_URL}/forgot-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: targetEmail }),
			});

			if (response.ok) {
				setEmail(targetEmail);
				setMode("email_check");
			} else {
				const data = await response.json();
				setErrorMessage(data.message || "Erreur lors de l'envoi de l'e-mail");
			}
		} catch (error) {
			setErrorMessage("Impossible de joindre le serveur.");
		}
	};

	const handleResetPasswordSubmit = async (newPassword: string) => {
		try {
			const response = await fetch(`${API_URL}/reset-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					email: email, 
					token: resetToken, 
					newPassword: newPassword 
				}),
			});

			if (response.ok) {
				setSuccessMessage("Mot de passe mis à jour ! Vous pouvez vous connecter.");
				setMode("login");
			} else {
				const data = await response.json();
				alert(data.message || "Erreur lors de la réinitialisation");
			}
		} catch (error) {
			alert("Impossible de joindre le serveur.");
		}
	};

	const handleMainSubmit = async () => {
		setErrorMessage("");
		setSuccessMessage("");
		try {
			if (mode === "signup") {
				const response = await fetch(`${API_URL}/register`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, password, username }),
				});
				if (response.ok) {
					setMode("email_check");
				} else {
					const data = await response.json();
					setErrorMessage(data.message || "Error while signing up");
				}
			} else if (mode === "login") {
				const response = await fetch(`${API_URL}/login`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, password }),
				});
				if (response.ok) {
					const data = await response.json();
					await saveToken(data.token);
					setSuccessMessage("Connexion réussie");
					router.replace("/(tab)");
				} else {
					const data = await response.json();
					setErrorMessage(data.message || "Error while login in");
				}
			}
		} catch (error) {
			console.log("Communication error with the server:", error);
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
				<AuthHeader />
				<View style={styles.cardWrapper}>
					<FormCard>
						{mode !== "reset_password" && <AuthTabs mode={mode} onModeChange={setMode} />}

						{mode === "reset_password" ? (
							<ResetPasswordView
								onSubmit={handleResetPasswordSubmit}
								onBackToLogin={() => setMode("login")}
							/>
						) : mode === "forgot_password" ? (
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
								{ !isLogin && (
									<CustomInput
										placeholder="user1234"
										value={username}
										onChangeText={setUsername}
										autoCapitalize="none"
										leftIcon={<User size={22} color={COLORS.inputIcon} />}
									/>
								)}

								<CustomInput
									placeholder="john.doe@email.com"
									value={email}
									onChangeText={setEmail}
									keyboardType="email-address"
									autoCapitalize="none"
									leftIcon={<Mail size={22} color={COLORS.inputIcon} />}
								/>

								<CustomInput
									placeholder="Enter password"
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

								{errorMessage ? (
									<Text style={styles.errorText}>{errorMessage}</Text>
								) : null}
								{successMessage ? (
									<Text style={styles.successText}>{successMessage}</Text>
								) : null}

								<PrimaryButton
									title={isLogin ? "Log in" : "Sign up"}
									onPress={handleMainSubmit}
									buttonStyle={styles.submitButtonMargin}
								/>

								<View style={styles.dividerContainer}>
									<View style={styles.dividerLine} />
									<Text style={styles.dividerText}>or</Text>
									<View style={styles.dividerLine} />
								</View>

								<SocialButton
									variant="google"
									onPress={() => promptAsync()}
									title={isLogin ? "Continue with Google" : "Sign up with Google"}
									style={styles.socialButtonMargin}
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
		fontFamily: FONTS.regular,
		fontSize: 13,
		color: COLORS.textMuted,
		textAlign: "right",
	},
	forgotPasswordContainer: {
		alignSelf: "flex-end",
		marginTop: 6,
		marginBottom: 16,
	},
	forgotPasswordText: {
		fontFamily: FONTS.semiBold,
		color: COLORS.primary,
		fontSize: 13,
	},
	errorText: {
		fontFamily: FONTS.regular,
		color: "red",
		fontSize: 13,
		marginBottom: 10,
		textAlign: "center",
	},
	successText: {
		fontFamily: FONTS.regular,
		color: "green",
		fontSize: 13,
		marginBottom: 10,
		textAlign: "center",
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
		fontFamily: FONTS.regular,
		marginHorizontal: 14,
		color: COLORS.textMuted,
		fontSize: 14,
	},
	socialButtonMargin: {
		marginBottom: 12,
	},
});