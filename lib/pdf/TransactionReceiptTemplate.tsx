import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// Register fonts for Thai support
import fs from "fs";
import path from "path";

// Styles definition - optimized for Thai language
const styles = StyleSheet.create({
  page: {
    padding: 15,
    backgroundColor: "#ffffff",
  },
  // ========== HEADER SECTION ==========
  header: {
    marginBottom: 12,
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 8,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Sarabun",
    marginBottom: 2,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Sarabun",
    color: "#1a1a1a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    fontSize: 9,
    fontFamily: "Sarabun",
    gap: 10,
  },
  headerCol: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 8,
    color: "#666",
    fontFamily: "Sarabun",
  },
  headerValue: {
    fontSize: 9,
    fontWeight: "bold",
    fontFamily: "Sarabun",
  },
  // ========== ITEM SECTION ==========
  itemSection: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  itemName: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Sarabun",
    marginBottom: 3,
  },
  itemMeta: {
    flexDirection: "row",
    marginBottom: 4,
  },
  metaTag: {
    fontSize: 8,
    // backgroundColor: "#f0f0f0",
    padding: 2,
    // paddingHorizontal: 4,
    borderRadius: 2,
    fontFamily: "Sarabun",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 4,
    paddingTop: 2, // Add space
    paddingBottom: 2,
  },
  amountLabel: {
    fontSize: 11,

    fontFamily: "Sarabun",
    color: "#666",
    lineHeight: 1.5,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Sarabun",
    color: "#27ae60",
  },
  // ========== PEOPLE SECTION ==========
  peopleSection: {
    marginBottom: 10,
    flexDirection: "row",
    gap: 6,
  },
  personCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 6,
    borderRadius: 3,
    backgroundColor: "#fafafa",
  },
  personRole: {
    fontSize: 8,
    fontWeight: "bold",
    fontFamily: "Sarabun",
    color: "#666",
    marginBottom: 2,
  },
  personName: {
    fontSize: 9,
    fontFamily: "Sarabun",
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  // ========== IMAGES SECTION ==========
  imagesSection: {
    marginBottom: 10,
    paddingBottom: 8,
  },
  imagesSectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Sarabun",
    marginBottom: 6,
    color: "#1a1a1a",
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    width: "100%",
  },
  imageContainer: {
    height: 120,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 2,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imageWrapper: {
    height: 120,
    objectFit: "contain",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  imagePlaceholderText: {
    fontSize: 7,
    color: "#999",
    textAlign: "center",
    fontFamily: "Sarabun",
  },
  // ========== FOOTER ==========
  footer: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    textAlign: "center",
    fontSize: 7,
    fontFamily: "Sarabun",
    color: "#888",
  },
});

interface TransactionData {
  id: string;
  transaction_number: string;
  item_name?: string;
  amount?: number;
  displayAmount?: number;
  net_amount?: number;
  currency?: string;
  status?: string;
  payment_method?: string;
  fee_amount?: number;
  description?: string;
  transaction_date?: string;
  category_name?: string;
  district_name?: string;
  sub_district_name?: string;
  user_full_name?: string;
  created_by_name?: string;
  approved_by_name?: string;
  paid_by_name?: string;
}

interface ImageData {
  url: string;
  filename: string;
  width?: number;
  height?: number;
  dataUrl?: string;
}

interface TransactionReceiptTemplateProps {
  transaction: TransactionData;
  images: ImageData[];
}

export function TransactionReceiptTemplate({
  transaction,
  images,
}: TransactionReceiptTemplateProps) {
  // ========== DEBUG LOGGING ==========
  if (typeof window === "undefined") {
    // Only log on server side (PDF generation)
    console.group("🔍 [PDF DEBUG] Transaction Data Structure");
    console.log("Transaction ID:", transaction.id);
    console.log("Created By Name:", transaction.created_by_name);
    console.log("Approved By Name:", transaction.approved_by_name);
    console.log("Paid By Name:", transaction.paid_by_name);
    console.log(
      "Full Transaction Object Keys:",
      Object.keys(transaction).sort(),
    );
    console.log("Full Transaction Object:", transaction);
    console.groupEnd();
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return "0.00";
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString("th-TH");
    return new Date(dateString).toLocaleDateString("th-TH");
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "pending":
        return "รอดำเนินการ ";
      case "approved":
        return "อนุมัติแล้ว ";
      case "rejected":
        return "ปฏิเสธ ";
      case "paid":
        return "ชำระแล้ว ";
      default:
        return status || "N/A";
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case "cash":
        return "เงินสด";
      case "transfer":
        return "โอนเงิน";
      default:
        return method || "N/A";
    }
  };

  // Option B: Calculate width to maintain aspect ratio without overlap
  const containerWidth = 825; // Available width for images (A4 landscape minus margins and padding)
  const gapSize = 4;
  const imagesPerRow = 6; // Adjust this to fit your design
  const imageWidth =
    (containerWidth - gapSize * (imagesPerRow - 1)) / imagesPerRow;

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* ==================== HEADER SECTION ==================== */}
        <View style={styles.header}>
          <Text style={styles.receiptTitle}>ใบเบิกเงิน</Text>
          <Text style={styles.receiptNumber}>
            {transaction.transaction_number}
          </Text>
          <View style={styles.headerRow}>
            <View style={styles.headerCol}>
              <Text style={styles.headerLabel}>วันที่</Text>
              <Text style={styles.headerValue}>
                {formatDate(transaction.transaction_date)}
              </Text>
            </View>
            <View style={styles.headerCol}>
              <Text style={styles.headerLabel}>สถานะ</Text>
              <Text style={styles.headerValue}>
                {getStatusLabel(transaction.status)}
              </Text>
            </View>
            <View style={styles.headerCol}>
              <Text style={styles.headerLabel}>วิธีการชำระ </Text>
              <Text style={styles.headerValue}>
                {getPaymentMethodLabel(transaction.payment_method)}
              </Text>
            </View>
          </View>
        </View>

        {/* ==================== ITEM SECTION ==================== */}
        <View style={styles.itemSection}>
          <Text style={styles.itemName}>
            {transaction.item_name || "ไม่ระบุรายการ"}
          </Text>
          <View style={styles.itemMeta}>
            {transaction.category_name && (
              <Text style={styles.metaTag}>{transaction.category_name} </Text>
            )}
            {transaction.district_name && (
              <Text style={styles.metaTag}>
                {" / "} {transaction.district_name}{" "}
              </Text>
            )}
            {transaction.sub_district_name && (
              <Text style={styles.metaTag}>
                {" / "} {transaction.sub_district_name}{" "}
              </Text>
            )}
          </View>
          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>จำนวนเงิน </Text>
              {transaction.displayAmount &&
                transaction.displayAmount !== transaction.amount && (
                  <Text
                    style={{
                      fontSize: 8,
                      color: "#999",
                      fontFamily: "Sarabun",
                    }}
                  >
                    ฿ {formatCurrency(transaction.amount)}
                  </Text>
                )}
            </View>
            <Text style={styles.amountValue}>
              ฿{" "}
              {formatCurrency(transaction.displayAmount || transaction.amount)}
            </Text>
          </View>
        </View>

        {/* ==================== PEOPLE SECTION ==================== */}
        <View style={styles.peopleSection}>
          <View style={styles.personCard}>
            <Text style={styles.personRole}>ผู้ขอเบิก</Text>
            <Text style={styles.personName}>
              {transaction.user_full_name?.trim() || " "}
            </Text>
            {/* DEBUG: Show if field is missing */}
            {!transaction.created_by_name && (
              <Text style={{ fontSize: 6, color: "#ff0000", marginTop: 2 }}>
                [DEBUG: created_by_name missing]
              </Text>
            )}
          </View>
          <View style={styles.personCard}>
            <Text style={styles.personRole}>ผู้อนุมัติ</Text>
            <Text style={styles.personName}>
              {transaction.approved_by_name?.trim() || " "}
            </Text>
            {/* DEBUG: Show if field is missing */}
            {!transaction.approved_by_name && (
              <Text style={{ fontSize: 6, color: "#ff0000", marginTop: 2 }}>
                [DEBUG: approved_by_name missing]
              </Text>
            )}
          </View>
          <View style={styles.personCard}>
            <Text style={styles.personRole}>ผู้จ่ายเงิน</Text>
            <Text style={styles.personName}>
              {transaction.paid_by_name?.trim() || " "}
            </Text>
            {/* DEBUG: Show if field is missing */}
            {!transaction.paid_by_name && (
              <Text style={{ fontSize: 6, color: "#ff0000", marginTop: 2 }}>
                [DEBUG: paid_by_name missing]
              </Text>
            )}
          </View>
        </View>

        {/* ==================== IMAGES SECTION ==================== */}
        {images.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={styles.imagesSectionTitle}>
              ภาพประกอบ ({images.length} ภาพ)
            </Text>
            <View style={styles.imagesGrid}>
              {images.map((image, index) => (
                <View
                  key={index}
                  style={{
                    ...styles.imageContainer,
                    width: imageWidth,
                    marginRight:
                      index % imagesPerRow === imagesPerRow - 1 ? 0 : gapSize,
                    marginBottom: gapSize,
                  }}
                >
                  {image.dataUrl ? (
                    <Image
                      src={image.dataUrl}
                      style={{
                        ...styles.imageWrapper,
                        width: imageWidth,
                      }}
                      cache={false}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderText}>รูปที่</Text>
                      <Text style={styles.imagePlaceholderText}>
                        {index + 1}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ==================== FOOTER ==================== */}
        <View style={styles.footer}>
          <Text>
            สร้างที่ {new Date().toLocaleString("th-TH")} | ID: {transaction.id}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
