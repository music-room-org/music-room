import React, { PropsWithChildren } from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { COLORS } from "@/constants/colors";

export type FormCardProps = PropsWithChildren<ViewProps>;

export function FormCard({ children, style, ...props }: FormCardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
});
