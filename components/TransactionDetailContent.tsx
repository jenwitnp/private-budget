"use client";

import { StatusBadge } from "@/components/StatusBadge";
import type { Transaction } from "@/components/TransactionCard";
import type { TransactionDetailWithCategory } from "@/lib/database.views";

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
