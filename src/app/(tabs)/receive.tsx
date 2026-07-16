import { supabase } from "@/services/supabase";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type InventoryItem = {
  id: string;
  name: string;
  stock: number;
};

type TransactionType = "in" | "out";

export default function ReceiveScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [txType, setTxType] = useState<TransactionType>("in");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("inventory_items")
      .select("id, name, stock")
      .order("name", { ascending: true });

    if (data) setItems(data);
  };

  const handleSubmit = async () => {
  setErrorMsg("");

  if (!selectedItem) {
    setErrorMsg("Pilih barang dulu");
    return;
  }
  const qty = parseInt(quantity, 10);
  if (!qty || qty <= 0) {
    setErrorMsg("Jumlah harus angka lebih dari 0");
    return;
  }

  if (txType === "out" && qty > selectedItem.stock) {
    setErrorMsg(`Stok ${selectedItem.name} cuma ${selectedItem.stock}, gak bisa keluar ${qty}`);
    return;
  }

  setSubmitting(true);

  const { error: txError } = await supabase.from("transactions").insert({
    item_id: selectedItem.id,
    item_name: selectedItem.name,
    type: txType,
    quantity: qty,
    notes: notes,
  });

  if (txError) {
    setErrorMsg(txError.message);
    setSubmitting(false);
    return;
  }

  const newStock =
    txType === "in" ? selectedItem.stock + qty : selectedItem.stock - qty;

  const { error: updateError } = await supabase
    .from("inventory_items")
    .update({ stock: newStock })
    .eq("id", selectedItem.id);

  setSubmitting(false);

  if (updateError) {
    setErrorMsg(updateError.message);
    return;
  }

  Alert.alert("Sukses", `Barang ${txType === "in" ? "masuk" : "keluar"} berhasil dicatat!`);
  setSelectedItem(null);
  setQuantity("");
  setNotes("");
  fetchItems();
};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Receive & Outgoing</Text>
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleButton, txType === "in" && styles.toggleButtonActiveIn]}
          onPress={() => setTxType("in")}
        >
          <Text style={[styles.toggleText, txType === "in" && styles.toggleTextActive]}>
            Barang Masuk
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, txType === "out" && styles.toggleButtonActiveOut]}
          onPress={() => setTxType("out")}
        >
          <Text style={[styles.toggleText, txType === "out" && styles.toggleTextActive]}>
            Barang Keluar
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Pilih Barang</Text>
      <View style={styles.itemList}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={[
              styles.itemOption,
              selectedItem?.id === item.id && styles.itemOptionSelected,
            ]}
            onPress={() => setSelectedItem(item)}
          >
            <Text
              style={[
                styles.itemOptionText,
                selectedItem?.id === item.id && styles.itemOptionTextSelected,
              ]}
            >
              {item.name} (stok: {item.stock})
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Jumlah {txType === "in" ? "Masuk" : "Keluar"}</Text>
      <TextInput
        style={styles.input}
        placeholder="Contoh: 10"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Catatan (opsional)</Text>
      <TextInput
        style={styles.input}
        placeholder={txType === "in" ? "Contoh: dari supplier A" : "Contoh: ke toko B"}
        value={notes}
        onChangeText={setNotes}
      />

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Menyimpan..." : "Simpan"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  toggleRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  toggleButtonActiveIn: { backgroundColor: "#22C55E", borderColor: "#22C55E" },
  toggleButtonActiveOut: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  toggleText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  toggleTextActive: { color: "#FFFFFF" },
  label: { fontSize: 14, fontWeight: "500", marginTop: 12, marginBottom: 8 },
  itemList: { gap: 8 },
  itemOption: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
  },
  itemOptionSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  itemOptionText: { fontSize: 15 },
  itemOptionTextSelected: { color: "#2563EB", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  buttonDisabled: { backgroundColor: "#93C5FD" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  errorText: {
  color: "#EF4444",
  textAlign: "center",
  marginBottom: 12,
  fontWeight: "500",
},
});