import { Colors } from "@/constants/colors";
import { supabase } from "@/services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
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

  const navigation = useNavigation();

  useEffect(() => {
  fetchSummary();

  const unsubscribe = navigation.addListener("focus", () => {
    fetchSummary();
  });

  return unsubscribe;
}, [navigation]);


  const fetchSummary = async () => {
    setLoading(true);

    const { data: items } = await supabase.from("inventory_items").select("stock");
    const stockSum = items?.reduce((sum, item) => sum + item.stock, 0) ?? 0;
    setTotalStock(stockSum);

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
    router.replace("/");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
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

      <Text style={styles.sectionTitle}>Menu Lainnya</Text>

      <View style={styles.menuGrid}>
        <View style={styles.menuRow}>
          <Pressable style={styles.menuCard} onPress={() => router.push("/transactions")}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="time-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.menuCardText}>Transaction{"\n"}History</Text>
          </Pressable>

          <Pressable style={styles.menuCard} onPress={() => router.push("/export")}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="download-outline" size={22} color={Colors.success} />
            </View>
            <Text style={styles.menuCardText}>Export{"\n"}Excel</Text>
          </Pressable>
        </View>

        <View style={styles.menuRow}>
          <Pressable style={styles.menuCard} onPress={() => router.push("/profile")}>
            <View style={[styles.menuIcon, { backgroundColor: "#F1F5F9" }]}>
              <Ionicons name="person-outline" size={22} color={Colors.secondary} />
            </View>
            <Text style={styles.menuCardText}>Profile &{"\n"}Settings</Text>
          </Pressable>

          <Pressable style={styles.menuCard} onPress={handleLogout}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.dangerLight }]}>
              <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
            </View>
            <Text style={styles.menuCardText}>Logout</Text>
          </Pressable>
        </View>
      </View>
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
  cardIn: { backgroundColor: Colors.successLight },
  cardOut: { backgroundColor: Colors.dangerLight },
  summaryCardFull: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  cardValue: { fontSize: 24, fontWeight: "700" },
  cardValueLarge: { fontSize: 32, fontWeight: "700", color: Colors.primary },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12, marginTop: 8 },
  emptyText: { color: Colors.textSecondary, marginBottom: 20 },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  txName: { fontSize: 15 },
  txIn: { fontSize: 15, fontWeight: "600", color: Colors.success },
  txOut: { fontSize: 15, fontWeight: "600", color: Colors.danger },

  menuGrid: {
  gap: 12,
  marginBottom: 40,
},
menuRow: {
  flexDirection: "row",
  gap: 12,
},
menuCard: {
  flex: 1,
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 16,
  padding: 16,
  gap: 10,
},
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuCardText: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
});