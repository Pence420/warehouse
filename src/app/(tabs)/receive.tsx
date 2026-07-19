import { Colors } from "@/constants/colors";
import { supabase } from "@/services/supabase";
import { Ionicons } from "@expo/vector-icons";
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
  const [party, setParty] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTransactionDate(today);
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("inventory_items")
      .select("id, name, stock")
      .order("name", { ascending: true });

    if (data) setItems(data);
  };

  const isValidDate = (dateStr: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
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

    if (!transactionDate || !isValidDate(transactionDate)) {
      setErrorMsg("Tanggal harus diisi dengan format YYYY-MM-DD (contoh: 2026-07-16)");
      return;
    }

    if (!party.trim()) {
      setErrorMsg(txType === "in" ? "Supplier wajib diisi" : "Destination wajib diisi");
      return;
    }

    setSubmitting(true);

    const { data: freshItem, error: fetchError } = await supabase
      .from("inventory_items")
      .select("stock")
      .eq("id", selectedItem.id)
      .single();

    if (fetchError || !freshItem) {
      setErrorMsg("Gagal cek stok terbaru, coba lagi");
      setSubmitting(false);
      return;
    }

    if (txType === "out" && qty > freshItem.stock) {
      setErrorMsg(`Stok ${selectedItem.name} sekarang cuma ${freshItem.stock}, gak bisa keluar ${qty}`);
      setSubmitting(false);
      return;
    }

    const { error: txError } = await supabase.from("transactions").insert({
      item_id: selectedItem.id,
      item_name: selectedItem.name,
      type: txType,
      quantity: qty,
      notes: notes,
      party: party,
      transaction_date: transactionDate,
    });

    if (txError) {
      setErrorMsg(txError.message);
      setSubmitting(false);
      return;
    }

    const newStock = txType === "in" ? freshItem.stock + qty : freshItem.stock - qty;

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
    setParty("");
    setTransactionDate(new Date().toISOString().split("T")[0]);
    fetchItems();
  };

  const filteredItemOptions = items.filter((item) =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Warehouse App</Text>
        <Text style={styles.headerTitle}>Receive & Outgoing</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleButton, txType === "in" && styles.toggleButtonActiveIn]}
            onPress={() => setTxType("in")}
          >
            <Ionicons
              name="arrow-down-circle-outline"
              size={18}
              color={txType === "in" ? "#FFFFFF" : Colors.textSecondary}
            />
            <Text style={[styles.toggleText, txType === "in" && styles.toggleTextActive]}>
              Barang Masuk
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, txType === "out" && styles.toggleButtonActiveOut]}
            onPress={() => setTxType("out")}
          >
            <Ionicons
              name="arrow-up-circle-outline"
              size={18}
              color={txType === "out" ? "#FFFFFF" : Colors.textSecondary}
            />
            <Text style={[styles.toggleText, txType === "out" && styles.toggleTextActive]}>
              Barang Keluar
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Pilih Barang</Text>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama barang..."
              value={itemSearch}
              onChangeText={setItemSearch}
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.itemList}>
            {filteredItemOptions.map((item) => (
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
          {filteredItemOptions.length === 0 && (
            <Text style={styles.emptySearchText}>Barang tidak ditemukan.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Jumlah {txType === "in" ? "Masuk" : "Keluar"}</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 10"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          <Text style={styles.label}>{txType === "in" ? "Supplier" : "Destination"}</Text>
          <TextInput
            style={styles.input}
            placeholder={txType === "in" ? "Nama supplier" : "Tujuan pengiriman"}
            value={party}
            onChangeText={setParty}
          />

          <Text style={styles.label}>{txType === "in" ? "Tanggal Diterima" : "Tanggal Keluar"}</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (contoh: 2026-07-16)"
            value={transactionDate}
            onChangeText={setTransactionDate}
          />

          <Text style={styles.label}>Catatan (opsional)</Text>
          <TextInput
            style={styles.input}
            placeholder={txType === "in" ? "Contoh: dari supplier A" : "Contoh: ke toko B"}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 40,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerSubtitle: { color: "#FFFFFF", opacity: 0.85, fontSize: 13, marginBottom: 2 },
  headerTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  body: { flex: 1, padding: 16, marginTop: -12 },
  errorText: {
    color: Colors.danger,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  toggleRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
  },
  toggleButtonActiveIn: { backgroundColor: Colors.success, borderColor: Colors.success },
  toggleButtonActiveOut: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  toggleText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  toggleTextActive: { color: "#FFFFFF" },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  label: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 8, marginTop: 4 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14 },
  itemList: { gap: 8 },
  itemOption: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
  },
  itemOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  itemOptionText: { fontSize: 14 },
  itemOptionTextSelected: { color: Colors.primary, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 4,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: Colors.disabled },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  emptySearchText: { color: Colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: "center" },
});