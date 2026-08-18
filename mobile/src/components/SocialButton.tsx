import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";

export type SocialVariant = "google" | "facebook";

export interface SocialButtonProps extends TouchableOpacityProps {
  title: string;
  variant: SocialVariant;
}

export function GoogleIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.24v3.15C3.26 21.39 7.37 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.24C.45 8.18 0 9.99 0 12s.45 3.82 1.24 5.39l4.04-3.15z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.61 1.24 6.61l4.04 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
      />
    </Svg>
  );
}

export function FacebookIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#FFFFFF"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </Svg>
  );
}

export function SocialButton({
  title,
  variant,
  onPress,
  style,
  ...props
}: SocialButtonProps) {
  const isGoogle = variant === "google";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isGoogle ? styles.googleButton : styles.facebookButton,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      {...props}
    >
      <View style={styles.iconContainer}>
        {isGoogle ? <GoogleIcon size={22} /> : <FacebookIcon size={22} />}
      </View>
      <Text
        style={[
          styles.text,
          isGoogle ? styles.googleText : styles.facebookText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    borderRadius: 18,
    height: 56,
    paddingHorizontal: 22,
  },
  googleButton: {
    backgroundColor: COLORS.googleBackground,
    borderWidth: 1.5,
    borderColor: COLORS.googleBorder,
  },
  facebookButton: {
    backgroundColor: COLORS.facebookBackground,
  },
  iconContainer: {
    marginRight: 16,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    textAlign: "left",
  },
  googleText: {
    color: COLORS.googleText,
  },
  facebookText: {
    color: COLORS.facebookText,
  },
});
