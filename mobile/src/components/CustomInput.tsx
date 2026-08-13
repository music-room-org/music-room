import React from "react";
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants/colors";

export interface CustomInputProps extends TextInputProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function CustomInput({
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}: CustomInputProps) {
  return (
    <View style={styles.container}>
      {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={COLORS.placeholder}
        {...props}
      />
      {rightIcon && (
        <TouchableOpacity
          onPress={onRightIconPress}
          disabled={!onRightIconPress}
          style={styles.rightIconContainer}
          activeOpacity={0.7}
        >
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  leftIconContainer: {
    marginRight: 12,
  },
  rightIconContainer: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.inputText,
    fontWeight: "500",
  },
});
