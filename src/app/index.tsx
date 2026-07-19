import { Colors } from "@/constants/colors";
import { supabase } from "@/services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/(tabs)");
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    setErrorMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.brand}>Warehouse App</Text>
        <Text style={styles.heroTitle}>Welcome{"\n"}Back</Text>
      </View>

      <View style={styles.card}>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <Pressable
          style={styles.forgotLink}
          onPress={() => Alert.alert("Lupa Password", "Hubungi admin gudang untuk reset password.")}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        <Pressable
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>{loading ? "Loading..." : "Log in"}</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={styles.signupButton}
          onPress={() => Alert.alert("Akun Baru", "Hubungi admin gudang untuk pembuatan akun baru.")}
        >
          <Text style={styles.signupButtonText}>Hubungi Admin</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: {
    height: 260,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 60,
    padding: 24,
    justifyContent: "space-between",
    paddingTop: 60,
  },
  brand: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", opacity: 0.9 },
  heroTitle: { color: "#FFFFFF", fontSize: 32, fontWeight: "700", lineHeight: 38 },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    padding: 24,
    paddingTop: 32,
  },
  errorText: { color: Colors.danger, textAlign: "center", marginBottom: 12, fontWeight: "500" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    marginBottom: 16,
  },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  forgotLink: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: { color: Colors.primary, fontSize: 13, fontWeight: "600" },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  loginButtonDisabled: { backgroundColor: Colors.disabled },
  loginButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 13 },
  signupButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  signupButtonText: { color: Colors.textPrimary, fontSize: 16, fontWeight: "600" },
});