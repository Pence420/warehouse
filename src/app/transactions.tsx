import { supabase } from "@/services/supabase";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

type Transaction = {
  id: string;
  item_name: string;
  type: "in" | "out";
  quantity: number;
  notes: string | null;
  created_at: string;
};

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, item_name, type, quantity, notes, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Error fetching transactions:", error.message);
      } else {
        setTransactions(data);
      }

      setLoading(false);
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.itemName}>{item.item_name}</Text>
              <View
                style={[
                  styles.badge,
                  item.type === "in" ? styles.badgeIn : styles.badgeOut,
                ]}
              >
                <Text style={styles.badgeText}>
                  {item.type === "in" ? "Masuk" : "Keluar"}
                </Text>
              </View>
            </View>
            <Text style={styles.quantity}>Jumlah: {item.quantity}</Text>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleString("id-ID")}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Belum ada transaksi.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemName: { fontSize: 16, fontWeight: "600" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeIn: { backgroundColor: "#DCFCE7" },
  badgeOut: { backgroundColor: "#FEE2E2" },
  badgeText: { fontSize: 12, fontWeight: "600" },
  quantity: { fontSize: 14, color: "#334155", marginBottom: 4 },
  notes: { fontSize: 13, color: "#64748B", marginBottom: 4 },
  date: { fontSize: 12, color: "#94A3B8" },
  emptyText: { textAlign: "center", color: "#64748B", marginTop: 40 },
});