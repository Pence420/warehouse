import { supabase } from "@/services/supabase";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as XLSX from "xlsx";

export default function ExportScreen() {
  const [exporting, setExporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleExport = async () => {
    setExporting(true);
    setStatusMsg("");

    const { data, error } = await supabase
      .from("transactions")
      .select("item_name, type, quantity, notes, created_at")
      .order("created_at", { ascending: false });

    if (error || !data) {
      setStatusMsg("Gagal ambil data: " + error?.message);
      setExporting(false);
      return;
    }

    // Format data biar rapi di Excel
    const formattedData = data.map((tx) => ({
      "Nama Barang": tx.item_name,
      "Tipe": tx.type === "in" ? "Masuk" : "Keluar",
      "Jumlah": tx.quantity,
      "Catatan": tx.notes ?? "",
      "Tanggal": new Date(tx.created_at).toLocaleString("id-ID"),
    }));

    // Bikin file Excel-nya
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

    const fileName = `warehouse_report_${Date.now()}.xlsx`;
    const fileUri = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    setExporting(false);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Simpan Laporan Warehouse",
      });
      setStatusMsg(`Berhasil! File: ${fileName}`);
    } else {
      setStatusMsg("Sharing tidak tersedia di device ini.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Export Excel</Text>
      <Text style={styles.description}>
        Export seluruh riwayat transaksi barang masuk & keluar ke file Excel (.xlsx).
      </Text>

      {statusMsg ? <Text style={styles.statusText}>{statusMsg}</Text> : null}

      <Pressable
        style={[styles.button, exporting && styles.buttonDisabled]}
        onPress={handleExport}
        disabled={exporting}
      >
        <Text style={styles.buttonText}>
          {exporting ? "Membuat file..." : "Export ke Excel"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 16 },
  title: { fontSize: 24, fontWeight: "600", textAlign: "center" },
  description: { fontSize: 14, color: "#64748B", textAlign: "center" },
  statusText: { fontSize: 14, color: "#22C55E", textAlign: "center", fontWeight: "500" },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: "#93C5FD" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});