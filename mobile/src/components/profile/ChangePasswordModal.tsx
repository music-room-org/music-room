import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { X } from "lucide-react-native";
import { COLORS, FONTS } from "@/constants";
import { CustomInput } from "../CustomInput";
import { PrimaryButton } from "../PrimaryButton";

interface ChangePasswordModalProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (currentPassword: string, newPassword: string) => void;
}

export function ChangePasswordModal({ visible, onClose, onSubmit }: ChangePasswordModalProps) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const handleValidation = () => {
		if (newPassword === confirmPassword) {
			onSubmit(currentPassword, newPassword);

			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		}
	};

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.overlay}>
				<View style={styles.modalContent}>
					<View style={styles.header}>
						<Text style={styles.title}>Change my password</Text>

						<TouchableOpacity onPress={onClose}>
							<X color={COLORS.textPrimary} size={24} />
						</TouchableOpacity>
					</View>

					<View style={styles.form}>
						<View style={styles.inputWrapper}>
							<Text style={styles.label}>Current password</Text>

							<CustomInput
								placeholder="••••••••"
								value={currentPassword}
								onChangeText={setCurrentPassword}
							/>
						</View>

						<View style={styles.inputWrapper}>
							<Text style={styles.label}>New password</Text>

							<CustomInput
								placeholder="••••••••"
								value={newPassword}
								onChangeText={setNewPassword}
							/>
						</View>

						<View style={styles.inputWrapper}>
							<Text style={styles.label}>Confirm new password</Text>

							<CustomInput
								placeholder="••••••••"
								value={confirmPassword}
								onChangeText={setConfirmPassword}
							/>
						</View>
					</View>

					<PrimaryButton
						title="Save modification"
						onPress={handleValidation}
						buttonStyle={{ backgroundColor: COLORS.primary }}
						textStyle={{ color: COLORS.white }}
					/>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},

	modalContent: {
		backgroundColor: COLORS.white,
		borderRadius: 24,
		padding: 24,
	},

	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
	},

	title: {
		fontFamily: FONTS.semiBold,
		fontSize: 18,
		color: COLORS.textPrimary,
	},

	form: {
		marginBottom: 24,
	},

	inputWrapper: {
		marginBottom: 16,
	},

	label: {
		fontFamily: FONTS.semiBold,
		fontSize: 14,
		color: COLORS.textPrimary,
		marginBottom: 8,
	}
});