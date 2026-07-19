import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Colors } from "@/constants/colors";
import { supabase } from "@/services/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

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

    if (itemData) {
      setItem(itemData);
      setEditName(itemData.name);
      setEditStock(String(itemData.stock));
      setEditUnit(itemData.unit);
    }
    setHistory(historyData ?? []);
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    setErrorMsg("");

    if (!editName.trim()) {
      setErrorMsg("Nama barang wajib diisi");
      return;
    }
    const stockNum = parseInt(editStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setErrorMsg("Stok harus angka 0 atau lebih");
      return;
    }
    if (!editUnit.trim()) {
      setErrorMsg("Satuan wajib diisi");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("inventory_items")
      .update({ name: editName.trim(), stock: stockNum, unit: editUnit.trim() })
      .eq("id", id);
    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setEditMode(false);
    fetchDetail();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    setDeleting(false);

    if (error) {
      setErrorMsg(error.message);
      setConfirmDelete(false);
      return;
    }

    router.back();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      {editMode ? (
        <View style={styles.infoCard}>
          <Input placeholder="Nama Barang" value={editName} onChangeText={setEditName} />
          <Input
            placeholder="Stok"
            value={editStock}
            onChangeText={setEditStock}
            keyboardType="numeric"
          />
          <Input placeholder="Satuan" value={editUnit} onChangeText={setEditUnit} />

          <View style={styles.editActions}>
            <View style={{ flex: 1 }}>
              <Button title="Simpan" onPress={handleSaveEdit} loading={saving} />
            </View>
            <Pressable style={styles.cancelBtn} onPress={() => setEditMode(false)}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.stockText}>
            Stok saat ini: {item.stock} {item.unit}
          </Text>

          <View style={styles.actionRow}>
            <Pressable style={styles.editButton} onPress={() => setEditMode(true)}>
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={() => setConfirmDelete(true)}>
              <Text style={styles.deleteButtonText}>Hapus</Text>
            </Pressable>
          </View>
        </View>
      )}

      {confirmDelete && (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>
            Yakin mau hapus "{item.name}"? Riwayat transaksinya tetap tersimpan, tapi barang ini gak akan muncul lagi di Inventory.
          </Text>
          <View style={styles.editActions}>
            <View style={{ flex: 1 }}>
              <Button title="Ya, Hapus" onPress={handleDelete} loading={deleting} variant="danger" />
            </View>
            <Pressable style={styles.cancelBtn} onPress={() => setConfirmDelete(false)}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </Pressable>
          </View>
        </View>
      )}

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
  errorText: { color: Colors.danger, marginBottom: 12, fontWeight: "500" },
  infoCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  itemName: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  stockText: { fontSize: 15, color: "#334155", marginBottom: 16 },
  actionRow: { flexDirection: "row", gap: 8 },
  editButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  editButtonText: { color: Colors.primary, fontWeight: "600" },
  deleteButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  deleteButtonText: { color: Colors.danger, fontWeight: "600" },
  editActions: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 4 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 14 },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: "500" },
  confirmBox: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  confirmText: { fontSize: 14, color: "#334155", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  emptyText: { color: Colors.textSecondary },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  txIn: { fontSize: 15, fontWeight: "600", color: Colors.success },
  txOut: { fontSize: 15, fontWeight: "600", color: Colors.danger },
  notes: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  date: { fontSize: 12, color: Colors.textMuted },
});