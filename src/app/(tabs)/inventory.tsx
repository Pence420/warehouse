import { supabase } from "@/services/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";


type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  unit: string;
};

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, stock, unit")
        .order("name", { ascending: true });

      if (error) {
        console.log("Error fetching inventory:", error.message);
      } else {
        setItems(data);
      }

      setLoading(false);
    };

    fetchItems();
  }, []);

  const filteredItems = items.filter((item) =>
  item.name.toLowerCase().includes(searchQuery.toLowerCase())
);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory</Text>

      <TextInput
      style={styles.searchInput}
      placeholder="Cari nama barang..."
      value={searchQuery}
      onChangeText={setSearchQuery}
    />

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/item/${item.id}`)}
          >
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemStock}>
              {item.stock} {item.unit}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Belum ada data inventory.</Text>
        }
        
      />
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: { fontSize: 16, fontWeight: "500" },
  itemStock: { fontSize: 16, color: "#64748B" },
  emptyText: { textAlign: "center", color: "#64748B", marginTop: 40 },
  searchInput: {
  borderWidth: 1,
  borderColor: "#E2E8F0",
  borderRadius: 12,
  padding: 12,
  fontSize: 15,
  marginBottom: 16,
  backgroundColor: "#FFFFFF",
},
});