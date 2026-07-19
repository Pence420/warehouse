import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Colors } from "@/constants/colors";
import { supabase } from "@/services/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function LoginScreen() {
// 1. Semua state wajib diletakkan di top-level komponen
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  useEffect(() => {
  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
       router.replace("/(tabs)")
    }
  };

  checkSession();
}, []);

  // 2. Fungsi login dibuat tunggal dan menggunakan async/await secara benar
  const handleLogin = async () => {
    setErrorMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      // Supabase menggunakan properti 'email' untuk login default
      email: username, 
      password: password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Jika berhasil, arahkan ke dashboard
     router.replace("/(tabs)")
  };

  return (
    <View style={styles.container}>
      {/* State errorMsg sekarang bisa diakses dengan aman di sini */}
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
      
      <Text style={styles.title}>Login</Text>

    <Input
      placeholder="Username (Email)"
      value={username}
      onChangeText={setUsername}
      autoCapitalize="none"
      keyboardType="email-address"
    />

    <Input
      placeholder="Password"
      value={password}
      onChangeText={setPassword}
      secureTextEntry
    />

      {/* State loading sekarang bisa diakses untuk disable tombol */}
      <Button title="Login" onPress={handleLogin} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled, // Membuat tombol agak pudar saat loading
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 8,
  }
});