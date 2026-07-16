import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. app/index.tsx (Halaman Login) otomatis jadi yang pertama */}
      <Stack.Screen name="index" /> 

      {/* 2. WAJIB daftarkan grup tabs agar Android tahu jalan ke dashboard */}
      <Stack.Screen name="(tabs)" /> 

      {/* Halaman lainnya */}
      <Stack.Screen
        name="transactions"
        options={{ headerShown: true, title: "Transaction History" }}
      />
      <Stack.Screen
        name="export"
        options={{ headerShown: true, title: "Export Excel" }}
      />
      <Stack.Screen
        name="profile"
        options={{ headerShown: true, title: "Profile & Settings" }}
      />
      <Stack.Screen
        name="item/[id]"
        options={{ headerShown: true, title: "Detail Barang" }}
      />
    </Stack>
  );
}