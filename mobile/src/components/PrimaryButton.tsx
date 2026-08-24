import React from "react";
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";

export interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
}


export function PrimaryButton({
  title,
  onPress,
  buttonStyle,
  textStyle,
  ...props
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle]}
      onPress={onPress}
      activeOpacity={0.8}
      {...props}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontFamily: FONTS.medium,
    color: COLORS.white,
    fontSize: 17,
  },
});
