import { Colors } from "@/constants/colors";
import { supabase } from "@/services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSubtitle}>Warehouse App</Text>
            <Text style={styles.headerTitle}>Inventory</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={22} color={Colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama barang..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/item/${item.id}`)}>
              <View style={styles.cardIcon}>
                <Ionicons name="cube-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemUnit}>{item.unit}</Text>
              </View>
              <Text style={styles.itemStock}>{item.stock}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Belum ada data inventory.</Text>
          }
        />
      </View>

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
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 40,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerSubtitle: { color: "#FFFFFF", opacity: 0.85, fontSize: 13, marginBottom: 2 },
  headerTitle: { color: "#FFFFFF", fontSize: 26, fontWeight: "700" },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, padding: 16, marginTop: -16 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  itemUnit: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  itemStock: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginRight: 4 },
  emptyText: { textAlign: "center", color: Colors.textSecondary, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  errorText: { color: Colors.danger, marginBottom: 12, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  saveButton: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: "center" },
  saveButtonDisabled: { backgroundColor: Colors.disabled },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  cancelButton: { padding: 14, alignItems: "center", marginTop: 4 },
  cancelButtonText: { color: Colors.textSecondary, fontSize: 15 },
});