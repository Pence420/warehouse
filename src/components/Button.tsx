import { Colors } from "@/constants/colors";
import { Pressable, PressableProps, StyleSheet, Text } from "react-native";

type ButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: "primary" | "danger" | "outline";
};

export function Button({ title, loading, variant = "primary", disabled, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[
        styles.base,
        variant === "primary" && styles.primary,
        variant === "danger" && styles.danger,
        variant === "outline" && styles.outline,
        isDisabled && styles.disabled,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      <Text
        style={[
          styles.text,
          variant === "outline" && styles.outlineText,
        ]}
      >
        {loading ? "Loading..." : title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  primary: { backgroundColor: Colors.primary },
  danger: { backgroundColor: Colors.danger },
  outline: { backgroundColor: "transparent", borderWidth: 1, borderColor: Colors.border },
  disabled: { opacity: 0.5 },
  text: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  outlineText: { color: Colors.textPrimary },
});