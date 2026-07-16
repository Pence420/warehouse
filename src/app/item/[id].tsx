import { supabase } from "@/services/supabase";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  unit: string;
};

type Transaction = {
  id: string;
  type: "in" | "out";
  quantity: number;
  notes: string | null;
  party: string | null;
  created_at: string;
};

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      const { data: itemData } = await supabase
        .from("inventory_items")
        .select("id, name, stock, unit")
        .eq("id", id)
        .single();

      const { data: historyData } = await supabase
        .from("transactions")
        .select("id, type, quantity, notes, party, created_at")
        .eq("item_id", id)
        .order("created_at", { ascending: false });

      setItem(itemData);
      setHistory(historyData ?? []);
      setLoading(false);
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text>Barang tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.infoCard}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.stockText}>
          Stok saat ini: {item.stock} {item.unit}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>

      {history.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada riwayat untuk barang ini.</Text>
      ) : (
        history.map((tx) => (
          <View key={tx.id} style={styles.historyRow}>
            <View>
                <Text style={tx.type === "in" ? styles.txIn : styles.txOut}>
                {tx.type === "in" ? "Masuk" : "Keluar"} — {tx.quantity}
                </Text>
                {tx.party ? (
                <Text style={styles.notes}>
                    {tx.type === "in" ? "Supplier" : "Tujuan"}: {tx.party}
                </Text>
                ) : null}
                {tx.notes ? <Text style={styles.notes}>{tx.notes}</Text> : null}
            </View>
            <Text style={styles.date}>
                {new Date(tx.created_at).toLocaleDateString("id-ID")}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  infoCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  itemName: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  stockText: { fontSize: 15, color: "#334155" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  emptyText: { color: "#64748B" },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  txIn: { fontSize: 15, fontWeight: "600", color: "#22C55E" },
  txOut: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
  notes: { fontSize: 13, color: "#64748B", marginTop: 2 },
  date: { fontSize: 12, color: "#94A3B8" },
});