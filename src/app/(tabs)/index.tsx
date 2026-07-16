import { supabase } from "@/services/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Transaction = {
  id: string;
  item_name: string;
  type: "in" | "out";
  quantity: number;
  created_at: string;
};

export default function DashboardScreen() {
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);

    // Total stok = jumlahin semua stock di inventory_items
    const { data: items } = await supabase.from("inventory_items").select("stock");
    const stockSum = items?.reduce((sum, item) => sum + item.stock, 0) ?? 0;
    setTotalStock(stockSum);

    // Semua transaksi (buat itung total in/out + 5 terbaru)
    const { data: transactions } = await supabase
      .from("transactions")
      .select("id, item_name, type, quantity, created_at")
      .order("created_at", { ascending: false });

    if (transactions) {
      const inSum = transactions
        .filter((t) => t.type === "in")
        .reduce((sum, t) => sum + t.quantity, 0);
      const outSum = transactions
        .filter((t) => t.type === "out")
        .reduce((sum, t) => sum + t.quantity, 0);

      setTotalIn(inSum);
      setTotalOut(outSum);
      setRecentTx(transactions.slice(0, 5));
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/"); // Menuju ke app/index.tsx (Login luar)
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.cardRow}>
        <View style={[styles.summaryCard, styles.cardIn]}>
          <Text style={styles.cardLabel}>Barang Masuk</Text>
          <Text style={styles.cardValue}>{totalIn}</Text>
        </View>
        <View style={[styles.summaryCard, styles.cardOut]}>
          <Text style={styles.cardLabel}>Barang Keluar</Text>
          <Text style={styles.cardValue}>{totalOut}</Text>
        </View>
      </View>

      <View style={styles.summaryCardFull}>
        <Text style={styles.cardLabel}>Total Stok Saat Ini</Text>
        <Text style={styles.cardValueLarge}>{totalStock}</Text>
      </View>

      <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
      {recentTx.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada transaksi.</Text>
      ) : (
        recentTx.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <Text style={styles.txName}>{tx.item_name}</Text>
            <Text style={tx.type === "in" ? styles.txIn : styles.txOut}>
              {tx.type === "in" ? "+" : "-"}
              {tx.quantity}
            </Text>
          </View>
        ))
      )}

      <Pressable style={styles.linkButton} onPress={() => router.push("/transactions")}>
        <Text style={styles.linkButtonText}>Lihat Transaction History</Text>
      </Pressable>

      <Pressable style={styles.linkButton} onPress={() => router.push("/profile")}>
        <Text style={styles.linkButtonText}>Profile & Settings</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>

      <Pressable style={styles.linkButton} onPress={() => router.push("/export")}>
        <Text style={styles.linkButtonText}>Export ke Excel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 16 },
  cardRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardIn: { backgroundColor: "#DCFCE7" },
  cardOut: { backgroundColor: "#FEE2E2" },
  summaryCardFull: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardLabel: { fontSize: 13, color: "#64748B", marginBottom: 4 },
  cardValue: { fontSize: 24, fontWeight: "700" },
  cardValueLarge: { fontSize: 32, fontWeight: "700", color: "#2563EB" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  emptyText: { color: "#64748B", marginBottom: 20 },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  txName: { fontSize: 15 },
  txIn: { fontSize: 15, fontWeight: "600", color: "#22C55E" },
  txOut: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
  linkButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
  },
  linkButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  logoutButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 40,
  },
  logoutButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});