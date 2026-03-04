/**
 * Report Modal Component
 * Modal for generating transaction history reports with filters
 * Allows users to select filters and generate PDF report
 */

"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Forms";
import { ThaiDatePicker } from "@/components/form/ThaiDatePicker";
import { useActiveCategories } from "@/hooks/useCategories";
import {
  useAllDistricts,
  useSubDistrictsByDistrict,
} from "@/hooks/useDistricts";
import type React from "react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters?: {
    searchTerm?: string;
    statusFilter?: string;
    dateStart?: string;
    dateEnd?: string;
    categoryId?: string;
    districtId?: string;
    subDistrictId?: string;
  };
}

export function ReportModal({
  isOpen,
  onClose,
  currentFilters = {},
}: ReportModalProps) {
  const [searchTerm, setSearchTerm] = useState(currentFilters.searchTerm || "");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "paid"
  >((currentFilters.statusFilter as any) || "all");
  const [dateStart, setDateStart] = useState(currentFilters.dateStart || "");
  const [dateEnd, setDateEnd] = useState(currentFilters.dateEnd || "");
  const [categoryId, setCategoryId] = useState(currentFilters.categoryId || "");
  const [districtId, setDistrictId] = useState(currentFilters.districtId || "");
  const [subDistrictId, setSubDistrictId] = useState(
    currentFilters.subDistrictId || "",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const { data: categories = [] } = useActiveCategories();
  const { data: allDistricts = [] } = useAllDistricts();
  const { data: subDistricts = [] } = useSubDistrictsByDistrict(
    districtId || null,
  );

  const handleGenerateReport = async (previewMode: boolean = false) => {
    try {
      setIsGenerating(true);
      setError(null);

      // Build filter query string
      const filterParams = new URLSearchParams();
      if (searchTerm) filterParams.append("searchTerm", searchTerm);
      if (statusFilter !== "all")
        filterParams.append("statusFilter", statusFilter);
      if (dateStart) filterParams.append("dateStart", dateStart);
      if (dateEnd) filterParams.append("dateEnd", dateEnd);
      if (categoryId) filterParams.append("categoryId", categoryId);
      if (districtId) filterParams.append("districtId", districtId);
      if (subDistrictId) filterParams.append("subDistrictId", subDistrictId);
      if (previewMode) filterParams.append("preview", "true");

      const queryString = filterParams.toString();
      const url = `/api/generate-report${queryString ? `?${queryString}` : ""}`;

      console.log(
        `[ReportModal] 📊 Generating report (${previewMode ? "PREVIEW" : "DOWNLOAD"}) with URL:`,
        url,
      );

      // Open PDF in new window/tab for preview, or in same window for download
      window.open(url, previewMode ? "_blank" : "_self");

      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate report";
      setError(errorMessage);
      console.error("[ReportModal] Error:", errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="สร้างรายงาน"
      isLoading={isGenerating}
      size="lg"
    >
      <div className="space-y-8 p-4">
        {/* Section 1: Search */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <i className="fas fa-search text-slate-500"></i>
            <label className="text-sm font-semibold text-slate-700">
              ค้นหา
            </label>
          </div>
          <Input
            icon="fa-search"
            placeholder="ค้นหาเลขที่รายการหรือชื่อ"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Section 2: Location Filters */}
        <div className="bg-slate-50 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-map-marker-alt text-blue-600"></i>
            <h3 className="text-sm font-bold text-slate-900">ตำแหน่ง</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                หมวดหมู่
              </label>
              <Select
                value={categoryId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setCategoryId(e.target.value)
                }
                options={[
                  { value: "", label: "ทั้งหมด" },
                  ...categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  })),
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                อำเภอ
              </label>
              <Select
                value={districtId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setDistrictId(e.target.value);
                  setSubDistrictId("");
                }}
                options={[
                  { value: "", label: "ทั้งหมด" },
                  ...allDistricts.map((dist) => ({
                    value: dist.id,
                    label: dist.name,
                  })),
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                ตำบล
              </label>
              <Select
                value={subDistrictId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSubDistrictId(e.target.value)
                }
                options={[
                  { value: "", label: "ทั้งหมด" },
                  ...subDistricts.map((subDist) => ({
                    value: subDist.id,
                    label: subDist.name,
                  })),
                ]}
                disabled={!districtId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                สถานะ
              </label>
              <Select
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setStatusFilter(
                    (e.target.value as
                      | "all"
                      | "pending"
                      | "approved"
                      | "rejected"
                      | "paid") || "all",
                  )
                }
                options={[
                  { value: "all", label: "ทั้งหมด" },
                  { value: "pending", label: "รอดำเนินการ" },
                  { value: "approved", label: "อนุมัติแล้ว" },
                  { value: "rejected", label: "ปฏิเสธ" },
                  { value: "paid", label: "ชำระแล้ว" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Date Range */}
        <div className="bg-indigo-50 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-calendar text-indigo-600"></i>
            <h3 className="text-sm font-bold text-slate-900">ช่วงวันที่</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                เริ่มต้น
              </label>
              <ThaiDatePicker
                label=""
                value={dateStart}
                onChange={setDateStart}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                สิ้นสุด
              </label>
              <ThaiDatePicker label="" value={dateEnd} onChange={setDateEnd} />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-red-600 text-lg"></i>
              <span className="font-semibold text-red-900">เกิดข้อผิดพลาด</span>
            </div>
            <p className="text-sm text-red-700 ml-8">{error}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-3">
            <i className="fas fa-info-circle text-blue-600 text-lg mt-0.5 shrink-0"></i>
            <div className="space-y-1">
              <p className="font-semibold text-blue-900">วิธีการใช้งาน</p>
              <p className="text-sm text-blue-800">
                เลือกตัวกรองตามต้องการแล้วคลิก
                <span className="font-semibold">&nbsp;ดูตัวอย่าง&nbsp;</span>
                เพื่อดูรายงานในเบราว์เซอร์ หรือคลิก
                <span className="font-semibold">&nbsp;ดาวน์โหลด PDF&nbsp;</span>
                เพื่อบันทึกไฟล์
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t-2 border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => handleGenerateReport(true)}
            disabled={isGenerating}
            className="flex-1 px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
          >
            {isGenerating ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              <>
                <i className="fas fa-eye text-lg"></i>
                ดูตัวอย่าง
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleGenerateReport(false)}
            disabled={isGenerating}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
          >
            {isGenerating ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              <>
                <i className="fas fa-download text-lg"></i>
                ดาวน์โหลด PDF
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
