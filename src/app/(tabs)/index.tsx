import { Colors } from "@/constants/colors";
import { supabase } from "@/services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

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
  const [allTx, setAllTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");

  useEffect(() => {
    fetchSummary();
  }, []);

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
      setAllTx(transactions);
    }

    setLoading(false);
  };

  const inboundRatio =
    totalIn + totalOut > 0 ? Math.round((totalIn / (totalIn + totalOut)) * 100) : 0;

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (inboundRatio / 100) * circumference;

  const filteredTx = allTx
    .filter((tx) => filterType === "all" || tx.type === filterType)
    .slice(0, 8);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSubtitle}>Warehouse App</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <Pressable style={styles.bellButton} onPress={() => router.push("/transactions")}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Overview</Text>

            <View style={styles.gaugeWrap}>
              <Svg width={110} height={110} viewBox="0 0 110 110">
                <Circle
                  cx={55}
                  cy={55}
                  r={radius}
                  stroke={Colors.border}
                  strokeWidth={10}
                  fill="none"
                />
                <Circle
                  cx={55}
                  cy={55}
                  r={radius}
                  stroke={Colors.primary}
                  strokeWidth={10}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                />
              </Svg>
              <View style={styles.gaugeCenter}>
                <Text style={styles.gaugePercent}>{inboundRatio}%</Text>
              </View>
            </View>

            <Text style={styles.gaugeCaption}>Rasio Barang Masuk</Text>
          </View>

          <View style={styles.sideStats}>
            <View style={styles.smallCard}>
              <View style={[styles.smallIcon, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="swap-vertical-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.smallValue}>{allTx.length}</Text>
              <Text style={styles.smallLabel}>Total Transaksi</Text>
            </View>

            <View style={styles.smallCard}>
              <View style={[styles.smallIcon, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="cube-outline" size={18} color={Colors.success} />
              </View>
              <Text style={styles.smallValue}>{totalStock}</Text>
              <Text style={styles.smallLabel}>Total Stok</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.totalCard} onPress={() => router.push("/(tabs)/inventory")}>
          <View style={styles.totalIconWrap}>
            <Ionicons name="archive-outline" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.totalLabel}>Lihat Semua Inventory</Text>
            <Text style={styles.totalValue}>{totalStock} unit tersedia</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Pressable>

        <View style={styles.filterRow}>
          {(["all", "in", "out"] as const).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterTab, filterType === f && styles.filterTabActive]}
              onPress={() => setFilterType(f)}
            >
              <Text style={[styles.filterTabText, filterType === f && styles.filterTabTextActive]}>
                {f === "all" ? "Semua" : f === "in" ? "Masuk" : "Keluar"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
        {filteredTx.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada transaksi.</Text>
        ) : (
          filteredTx.map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <View
                style={[
                  styles.txBadge,
                  { backgroundColor: tx.type === "in" ? Colors.successLight : Colors.dangerLight },
                ]}
              >
                <Ionicons
                  name={tx.type === "in" ? "arrow-down-outline" : "arrow-up-outline"}
                  size={16}
                  color={tx.type === "in" ? Colors.success : Colors.danger}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txName}>{tx.item_name}</Text>
                <Text style={styles.txDate}>
                  {new Date(tx.created_at).toLocaleDateString("id-ID")}
                </Text>
              </View>
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
            <Pressable style={styles.menuCard} onPress={() => router.push("/export")}>
              <View style={[styles.menuIcon, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="download-outline" size={22} color={Colors.success} />
              </View>
              <Text style={styles.menuCardText}>Export{"\n"}Excel</Text>
            </Pressable>

            <Pressable style={styles.menuCard} onPress={() => router.push("/profile")}>
              <View style={[styles.menuIcon, { backgroundColor: "#F1F5F9" }]}>
                <Ionicons name="person-outline" size={22} color={Colors.secondary} />
              </View>
              <Text style={styles.menuCardText}>Profile &{"\n"}Settings</Text>
            </Pressable>
          </View>
          <View style={styles.menuRow}>
            <Pressable
              style={styles.menuCard}
              onPress={async () => {
                await supabase.auth.signOut();
                router.replace("/");
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: Colors.dangerLight }]}>
                <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
              </View>
              <Text style={styles.menuCardText}>Logout</Text>
            </Pressable>

            <Pressable style={styles.menuCard} onPress={() => router.push("/transactions")}>
              <View style={[styles.menuIcon, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="time-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.menuCardText}>Transaction{"\n"}History</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 40,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerSubtitle: { color: "#FFFFFF", opacity: 0.85, fontSize: 13, marginBottom: 2 },
  headerTitle: { color: "#FFFFFF", fontSize: 26, fontWeight: "700" },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 16, marginTop: -12 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  overviewCard: {
    flex: 1.3,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overviewLabel: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, alignSelf: "flex-start", marginBottom: 8 },
  gaugeWrap: { width: 110, height: 110, alignItems: "center", justifyContent: "center" },
  gaugeCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  gaugePercent: { fontSize: 22, fontWeight: "700", color: Colors.textPrimary },
  gaugeCaption: { fontSize: 12, color: Colors.textSecondary, marginTop: 8, textAlign: "center" },
  sideStats: { flex: 1, gap: 12 },
  smallCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
  },
  smallIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  smallValue: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  smallLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  totalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  totalLabel: { fontSize: 13, color: Colors.textSecondary },
  totalValue: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginTop: 2 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  filterTabTextActive: { color: "#FFFFFF" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12, marginTop: 4, color: Colors.textPrimary },
  emptyText: { color: Colors.textSecondary, marginBottom: 20 },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txBadge: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  txName: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  txDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  txIn: { fontSize: 14, fontWeight: "700", color: Colors.success },
  txOut: { fontSize: 14, fontWeight: "700", color: Colors.danger },
  menuGrid: { gap: 12, marginBottom: 40 },
  menuRow: { flexDirection: "row", gap: 12 },
  menuCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  menuIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuCardText: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
});