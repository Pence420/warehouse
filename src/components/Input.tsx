import { Colors } from "@/constants/colors";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

export function Input(props: TextInputProps) {
  return <TextInput style={styles.input} placeholderTextColor={Colors.textMuted} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: Colors.card,
    marginBottom: 12,
  },
});