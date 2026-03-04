import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ClientTransaction } from "@/server/transactions.server";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Sarabun",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#10b981",
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#064e3b",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 10,
  },
  filterSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
  },
  filterTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
  },
  filterText: {
    fontSize: 10,
    color: "#4b5563",
    marginRight: 15,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#10b981",
    color: "#ffffff",
    fontWeight: "bold",
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 9,
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  col1: { flex: 1.5 }, // Transaction Number
  col2: { flex: 2 }, // Item Name
  col2a: { flex: 1.5 }, // Approved By Name
  col2b: { flex: 1.2 }, // Payment Method
  col3: { flex: 1.5 }, // Status
  col4: { flex: 1.2 }, // Amount
  col5: { flex: 1.5 }, // Date
  cell: {
    paddingHorizontal: 4,
  },
  summarySection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 11,
  },
  summaryLabel: {
    fontWeight: "bold",
    color: "#1f2937",
  },
  summaryValue: {
    color: "#10b981",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

interface ReportData {
  transactions: ClientTransaction[];
  filters: {
    searchTerm?: string;
    statusFilter?: string;
    dateStart?: string;
    dateEnd?: string;
    categoryId?: string;
    categoryName?: string;
    districtId?: string;
    districtName?: string;
    subDistrictId?: string;
    subDistrictName?: string;
  };
  generatedAt: string;
}

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "รอดำเนินการ ",
    approved: "อนุมัติแล้ว ",
    rejected: "ปฏิเสธ ",
    paid: "ชำระแล้ว ",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: "#f59e0b",
    approved: "#a855f7",
    rejected: "#ef4444",
    paid: "#10b981",
  };
  return colorMap[status] || "#6b7280";
};

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const getPaymentMethodLabel = (method: string): string => {
  const methodMap: Record<string, string> = {
    transfer: "โอน",
    cash: "เงินสด",
    โอน: "โอน",
    เงินสด: "เงินสด",
  };
  return methodMap[method] || method || "-";
};

export function TransactionHistoryReportTemplate({
  data,
}: {
  data: ReportData;
}) {
  const { transactions, filters, generatedAt } = data;

  // Calculate summary
  const totalAmount = transactions.reduce(
    (sum, tx) => sum + (tx.amount || 0),
    0,
  );
  const paidAmount = transactions
    .filter((tx) => tx.status === "paid")
    .reduce((sum, tx) => sum + (tx.displayAmount || tx.amount || 0), 0);

  const approvedAmount = transactions
    .filter((tx) => tx.status === "approved")
    .reduce((sum, tx) => sum + (tx.displayAmount || tx.amount || 0), 0);

  const pendingAmount = transactions
    .filter((tx) => tx.status === "pending")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>รายงานประวัติการเบิกเงิน</Text>

          <Text style={styles.subtitle}>
            วันที่สร้าง: {new Date(generatedAt).toLocaleString("th-TH")}
          </Text>
        </View>

        {/* Filters Display */}
        {(filters.searchTerm ||
          filters.statusFilter !== "all" ||
          filters.dateStart ||
          filters.dateEnd ||
          filters.categoryId ||
          filters.districtId ||
          filters.subDistrictId) && (
          <View style={styles.filterSection}>
            {(() => {
              const filterParts: string[] = [];
              if (filters.searchTerm) {
                filterParts.push(`ค้นหา: ${filters.searchTerm}`);
              }
              if (filters.statusFilter !== "all") {
                filterParts.push(
                  `สถานะ: ${getStatusLabel(filters.statusFilter)}`,
                );
              }
              if (filters.dateStart) {
                filterParts.push(
                  `วันเริ่มต้น: ${formatDate(filters.dateStart)}`,
                );
              }
              if (filters.dateEnd) {
                filterParts.push(`วันสิ้นสุด: ${formatDate(filters.dateEnd)}`);
              }
              if (filters.categoryName) {
                filterParts.push(`หมวดหมู่: ${filters.categoryName}`);
              }
              if (filters.districtName) {
                filterParts.push(`อำเภอ: ${filters.districtName}`);
              }
              if (filters.subDistrictName) {
                filterParts.push(`ตำบล: ${filters.subDistrictName}`);
              }
              const filterText = filterParts.join(" | ");
              return (
                <Text style={styles.filterTitle}>
                  ตัวกรองที่ใช้: {filterText}
                </Text>
              );
            })()}
          </View>
        )}

        {/* Table */}
        {transactions.length > 0 ? (
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <View style={styles.col1}>
                <Text style={styles.cell}>เลขที่รายการ</Text>
              </View>
              <View style={styles.col2}>
                <Text style={styles.cell}>รายการ</Text>
              </View>
              <View style={styles.col2a}>
                <Text style={styles.cell}>ผู้อนุมัติ</Text>
              </View>
              <View style={styles.col2b}>
                <Text style={styles.cell}>ประเภท</Text>
              </View>
              <View style={styles.col3}>
                <Text style={styles.cell}>สถานะ</Text>
              </View>
              <View style={styles.col4}>
                <Text style={[styles.cell, { textAlign: "right" }]}>
                  จำนวนเงิน{" "}
                </Text>
              </View>
              <View style={styles.col5}>
                <Text style={styles.cell}>วันที่</Text>
              </View>
            </View>

            {/* Rows */}
            {transactions.map((tx, index) => (
              <View
                key={tx.id}
                style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
              >
                <View style={styles.col1}>
                  <Text style={styles.cell}>{tx.transactionNumber}</Text>
                </View>
                <View style={styles.col2}>
                  <Text style={styles.cell}>{tx.itemName}</Text>
                </View>
                <View style={styles.col2a}>
                  <Text style={styles.cell}>{tx.approvedByName || "-"}</Text>
                </View>
                <View style={styles.col2b}>
                  <Text style={styles.cell}>
                    {getPaymentMethodLabel(tx.paymentMethod || "")}
                  </Text>
                </View>
                <View style={styles.col3}>
                  <Text
                    style={[styles.cell, { color: getStatusColor(tx.status) }]}
                  >
                    {getStatusLabel(tx.status)}
                  </Text>
                </View>
                <View style={styles.col4}>
                  <Text style={[styles.cell, { textAlign: "right" }]}>
                    ฿{formatCurrency(tx.displayAmount || tx.amount || 0)}
                  </Text>
                </View>
                <View style={styles.col5}>
                  <Text style={styles.cell}>{formatDate(tx.date)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text
            style={{ marginTop: 20, textAlign: "center", color: "#6b7280" }}
          >
            ไม่มีรายการที่ตรงกับตัวกรองที่เลือก
          </Text>
        )}

        {/* Summary */}
        {transactions.length > 0 && (
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>จำนวนรายการทั้งหมด </Text>
              <Text style={styles.summaryValue}>{transactions.length}</Text>
            </View>
            {/* <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>จำนวนเงินทั้งหมด </Text>
              <Text style={styles.summaryValue}>
                ฿{formatCurrency(totalAmount)}
              </Text>
            </View> */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>จำนวนเงินที่ชำระแล้ว : </Text>
              <Text style={styles.summaryValue}>
                ฿{formatCurrency(paidAmount)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                จำนวนเงินที่อนุมัติแล้ว :{" "}
              </Text>
              <Text style={styles.summaryValue}>
                ฿{formatCurrency(approvedAmount)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                จำนวนเงินที่รอดำเนินการ :{" "}
              </Text>
              <Text style={styles.summaryValue}>
                ฿{formatCurrency(pendingAmount)}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>รายงานประวัติการระงาน</Text>
          <Text>หน้า 1 จาก 1</Text>
        </View>
      </Page>
    </Document>
  );
}
