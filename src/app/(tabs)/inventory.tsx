import { supabase } from "@/services/supabase";
import { router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [addErrorMsg, setAddErrorMsg] = useState("");
  const [adding, setAdding] = useState(false);
  const navigation = useNavigation();

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

  useEffect(() => {
  fetchItems();

  const unsubscribe = navigation.addListener("focus", () => {
    fetchItems();
  });

  return unsubscribe;
}, [navigation]);

  const handleAddItem = async () => {
  setAddErrorMsg("");

  if (!newName.trim()) {
    setAddErrorMsg("Nama barang wajib diisi");
    return;
  }
  const stockNum = parseInt(newStock, 10);
  if (isNaN(stockNum) || stockNum < 0) {
    setAddErrorMsg("Stok awal harus angka 0 atau lebih");
    return;
  }
  if (!newUnit.trim()) {
    setAddErrorMsg("Satuan wajib diisi (contoh: pcs, box)");
    return;
  }

  setAdding(true);

  const { error } = await supabase.from("inventory_items").insert({
    name: newName.trim(),
    stock: stockNum,
    unit: newUnit.trim(),
  });

  setAdding(false);

  if (error) {
    setAddErrorMsg(error.message);
    return;
  }

  setNewName("");
  setNewStock("");
  setNewUnit("");
  setModalVisible(false);
  fetchItems();
};

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
    <View style={styles.headerRow}>
      <Text style={styles.title}>Inventory</Text>
      <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Tambah</Text>
      </Pressable>
    </View>

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

    <Modal visible={modalVisible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Tambah Barang Baru</Text>

          {addErrorMsg ? <Text style={styles.errorText}>{addErrorMsg}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Nama Barang"
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={styles.input}
            placeholder="Stok Awal (contoh: 0)"
            value={newStock}
            onChangeText={setNewStock}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Satuan (contoh: pcs, box)"
            value={newUnit}
            onChangeText={setNewUnit}
          />

          <Pressable
            style={[styles.saveButton, adding && styles.saveButtonDisabled]}
            onPress={handleAddItem}
            disabled={adding}
          >
            <Text style={styles.saveButtonText}>
              {adding ? "Menyimpan..." : "Simpan"}
            </Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Batal</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
addButton: { backgroundColor: "#2563EB", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
addButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
errorText: { color: "#EF4444", marginBottom: 12, fontWeight: "500" },
modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
input: {
  borderWidth: 1,
  borderColor: "#E2E8F0",
  borderRadius: 12,
  padding: 14,
  fontSize: 16,
  marginBottom: 12,
},
saveButton: { backgroundColor: "#2563EB", borderRadius: 12, padding: 14, alignItems: "center" },
saveButtonDisabled: { backgroundColor: "#93C5FD" },
saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
cancelButton: { padding: 14, alignItems: "center", marginTop: 4 },
cancelButtonText: { color: "#64748B", fontSize: 15 },
});