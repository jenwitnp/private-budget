"use client";

import { StatusBadge } from "@/components/StatusBadge";
import type { Transaction } from "@/components/TransactionCard";
import type { TransactionDetailWithCategory } from "@/lib/database.views";
import type { TransactionImage } from "@/server/transactions.server";
import { useState, useEffect } from "react";
import { getTransactionImages } from "@/server/transactions.server";

interface TransactionDetailContentProps {
  transaction: TransactionDetailWithCategory;
  isLoading?: boolean;
  error?: Error | null;
}

export function TransactionDetailContent({
  transaction,
  isLoading = false,
  error = null,
}: TransactionDetailContentProps) {
  const [images, setImages] = useState<TransactionImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  // Fetch images for this transaction
  useEffect(() => {
    if (!transaction?.id) return;

    const loadImages = async () => {
      setImagesLoading(true);
      try {
        const result = await getTransactionImages(transaction.id);
        console.group("📸 [COMPONENT] Image Loading");
        console.log("Transaction ID:", transaction.id);
        console.log("Result:", result);
        if (result.data?.length) {
          console.log(`Loaded ${result.data.length} images`);
          result.data.forEach((img, idx) => {
            console.log(`[${idx + 1}] ${img.filename}`);
            console.log(`  URL: ${img.url}`);
            console.log(`  Cloud URL: ${img.cloud_url}`);
            console.log(`  Storage Path: ${img.storage_path}`);
          });
        }
        console.groupEnd();

        if (result.success && result.data) {
          setImages(result.data);
          // Auto-select first image if available
          if (result.data.length > 0) {
            setSelectedImageIndex(0);
          }
        }
      } catch (err) {
        console.error("Failed to load images:", err);
      } finally {
        setImagesLoading(false);
      }
    };

    loadImages();
  }, [transaction?.id]);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
          <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <i className="fas fa-exclamation-circle mr-2"></i>
        {error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลด"}
      </div>
    );
  }

  if (!transaction) {
    return null;
  }

  return (
    <div className="p-6 space-y-5">
      {/* Transaction Summary Section */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">
              เลขที่รายการ
            </p>
            <p className="text-xl font-bold text-slate-800 font-num">
              {transaction.transaction_number}
            </p>
          </div>
          <StatusBadge status={transaction.status as Transaction["status"]} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">จำนวนเงิน</p>
            <p className="text-lg font-bold text-emerald-600 font-num">
              ฿
              {transaction.amount?.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium mb-1">
              วันที่สร้าง
            </p>
            <p className="text-lg font-bold text-slate-700 font-num">
              {transaction.transaction_date
                ? new Date(transaction.transaction_date).toLocaleDateString(
                    "th-TH",
                  )
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Item Information */}
      {transaction.item_name && (
        <div className="border-b border-slate-200 pb-5">
          <p className="text-xs text-slate-500 font-medium mb-2">ชื่อรายการ</p>
          <p className="text-sm text-slate-800">{transaction.item_name}</p>
        </div>
      )}

      {/* Images Gallery Section */}
      {images.length > 0 && (
        <div className="border-b border-slate-200 pb-5">
          <p className="text-xs text-slate-500 font-medium mb-3">
            <i className="fas fa-images mr-1.5"></i>รูปภาพที่แนบมา (
            {images.length})
          </p>

          {/* Main Image Display */}
          {selectedImageIndex !== null && images[selectedImageIndex] && (
            <div className="mb-4 rounded-lg overflow-hidden bg-slate-100">
              <div className="relative w-full h-64 flex items-center justify-center">
                <img
                  src={images[selectedImageIndex].url || ""}
                  alt={`Transaction image ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as any).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23e2e8f0' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='16' fill='%2394a3b8'%3EUnable to load image%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              {images[selectedImageIndex].width &&
                images[selectedImageIndex].height && (
                  <div className="px-3 py-2 bg-slate-50 text-xs text-slate-600 text-center">
                    {images[selectedImageIndex].width} ×{" "}
                    {images[selectedImageIndex].height} px
                    {images[selectedImageIndex].file_size && (
                      <>
                        {" • "}
                        {(
                          (images[selectedImageIndex].file_size || 0) / 1024
                        ).toFixed(2)}{" "}
                        KB
                      </>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? "border-emerald-500 shadow-md"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  title={`Image ${index + 1}`}
                >
                  <img
                    src={image.url || ""}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as any).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23e2e8f0' width='400' height='400'/%3E%3C/svg%3E";
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Image Information */}
          {selectedImageIndex !== null && images[selectedImageIndex] && (
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1">
              <p>
                <span className="font-medium">ไฟล์:</span>{" "}
                {images[selectedImageIndex].filename}
              </p>
            </div>
          )}
        </div>
      )}

      {/* User Information Section */}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-3">ข้อมูลผู้ใช้</p>
        <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">ผู้ขอเบิก</p>
            <p className="text-sm text-slate-800">
              {transaction.user_full_name || transaction.user_username || "-"}
            </p>
          </div>
          {transaction.category_name && (
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">
                หมวดหมู่
              </p>
              <p className="text-sm text-slate-800 break-all">
                {transaction.category_name}
              </p>
            </div>
          )}
          {transaction.payment_method && (
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">ประเภท</p>
              <p className="text-sm text-slate-800 font-num">
                {transaction.payment_method === "transfer"
                  ? "โอนจ่าย"
                  : "เงินสด"}
              </p>
            </div>
          )}
          {transaction.bank_account_id && (
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">ธนาคาร</p>
              <p className="text-sm text-slate-800">
                {transaction.bank_name} - {transaction.account_number}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Location Information Section */}
      {(transaction.district_name || transaction.sub_district_name) && (
        <div>
          <p className="text-xs text-slate-500 font-medium mb-3">
            ข้อมูลที่ตั้ง
          </p>
          <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4">
            {transaction.district_name && (
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">อำเภอ</p>
                <p className="text-sm text-slate-800">
                  {transaction.district_name}
                </p>
              </div>
            )}
            {transaction.sub_district_name && (
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">ตำบล</p>
                <p className="text-sm text-slate-800">
                  {transaction.sub_district_name}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Information */}
      {transaction.description && (
        <div>
          <p className="text-xs text-slate-500 font-medium mb-3">
            ข้อมูลเพิ่มเติม
          </p>
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            {transaction.description && (
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">
                  คำอธิบาย
                </p>
                <p className="text-sm text-slate-800">
                  {transaction.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Information */}
      {(transaction.error_code || transaction.error_message) && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-xs text-red-700 font-medium mb-2">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            ข้อมูลข้อผิดพลาด
          </p>
          {transaction.error_code && (
            <p className="text-xs text-red-700">
              รหัส: {transaction.error_code}
            </p>
          )}
          {transaction.error_message && (
            <p className="text-xs text-red-700 mt-1">
              {transaction.error_message}
            </p>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="border-t border-slate-200 pt-5">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-500 font-medium mb-1">สร้างเมื่อ</p>
            <p className="text-slate-700">
              {transaction.created_at
                ? new Date(transaction.created_at).toLocaleString("th-TH")
                : "-"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 font-medium mb-1">อัปเดตล่าสุด</p>
            <p className="text-slate-700">
              {transaction.updated_at
                ? new Date(transaction.updated_at).toLocaleString("th-TH")
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
