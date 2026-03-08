"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Forms";
import { ThaiDatePicker } from "@/components/form/ThaiDatePicker";
import { useActiveCategories } from "@/hooks/useCategories";
import {
  useAllDistricts,
  useSubDistrictsByDistrict,
} from "@/hooks/useDistricts";
import type React from "react";

interface TransactionFiltersProps {
  isFiltersExpanded: boolean;
  setIsFiltersExpanded: (expanded: boolean) => void;
}

export function TransactionFilters({
  isFiltersExpanded,
  setIsFiltersExpanded,
}: TransactionFiltersProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "paid"
  >("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [subDistrictId, setSubDistrictId] = useState("");

  // Fetch data
  const { data: categories = [] } = useActiveCategories();
  const { data: allDistricts = [] } = useAllDistricts();
  const { data: subDistricts = [] } = useSubDistrictsByDistrict(
    districtId || null,
  );
  // Build query string from filter state
  const buildQueryString = (overrideDateEnd?: string) => {
    const filterObject = {
      searchTerm,
      statusFilter,
      dateStart,
      dateEnd: overrideDateEnd || dateEnd,
      categoryId,
      districtId,
      subDistrictId,
    };

    const params = new URLSearchParams();
    params.append("filters", JSON.stringify(filterObject));

    return params.toString();
  };

  const handleSubmit = () => {
    // 🎯 UX Fix: Auto-fill end date with start date for single-day filtering
    // When user picks only start date, query shows ONLY that day's data
    // Example: Pick "8/3/2569" → system queries 8/3/2569 00:00 to 8/3/2569 23:59
    const finalDateEnd = dateEnd || dateStart;

    const queryString = buildQueryString(finalDateEnd);
    const fullUrl = queryString ? `/history?${queryString}` : "/history";

    // Navigate to the URL with filters
    router.push(fullUrl);

    // Close mobile filter panel after submit
    setIsFiltersExpanded(false);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateStart("");
    setDateEnd("");
    setCategoryId("");
    setDistrictId("");
    setSubDistrictId("");

    router.push("/history");

    // Close mobile filter panel after clear
    setIsFiltersExpanded(false);
  };

  return (
    <>
      {/* Mobile: Quick filter badges when collapsed */}
      {!isFiltersExpanded && (
        <div className="md:hidden flex gap-2  overflow-x-auto pb-2">
          {searchTerm && (
            <div className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1">
              <i className="fas fa-search"></i>
              <span className="truncate max-w-[100px]">{searchTerm}</span>
            </div>
          )}
          {categoryId && (
            <div className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
              <i className="fas fa-tag mr-1"></i>
              หมวดหมู่
            </div>
          )}
          {districtId && (
            <div className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
              <i className="fas fa-map-marker-alt mr-1"></i>
              อำเภอ
            </div>
          )}
          {dateStart && (
            <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              <i className="fas fa-calendar mr-1"></i>
              วันที่
            </div>
          )}
        </div>
      )}

      {/* Mobile: Expanded Filter Panel */}
      {isFiltersExpanded && (
        <Card className="mb-6">
          <div className="space-y-4">
            {/* Full Width Search */}
            <div>
              <Input
                label="ค้นหา"
                icon="fa-search"
                placeholder="เลขที่รายการ"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* 2-Column Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select
                  label="หมวดหมู่"
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
              <div>
                <Select
                  label="อำเภอ"
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
              <div>
                <Select
                  label="ตำบล"
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
              <div>
                <Select
                  label="สถานะ"
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
              <div>
                <ThaiDatePicker
                  label="วันที่เริ่มต้น"
                  value={dateStart}
                  onChange={setDateStart}
                />
              </div>
              <div>
                <ThaiDatePicker
                  label="วันที่สิ้นสุด"
                  value={dateEnd}
                  onChange={setDateEnd}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-blue-950 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <i className="fas fa-search"></i>
                ค้นหา
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex-1 px-4 py-2.5 bg-slate-400 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <i className="fas fa-times"></i>
                ล้าง
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Desktop: Full filter row */}
      <Card className="mb-6 hidden md:block">
        <div className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
          <div className="flex-1 w-full">
            <Input
              label="ค้นหา"
              icon="fa-search"
              placeholder="เลขที่รายการ"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full md:w-48">
            <Select
              label="หมวดหมู่"
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
          <div className="w-full md:w-48">
            <Select
              label="อำเภอ"
              value={districtId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setDistrictId(e.target.value);
                setSubDistrictId(""); // Reset sub-district when district changes
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
          <div className="w-full md:w-48">
            <Select
              label="ตำบล"
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
          <div className="w-full md:w-48">
            <Select
              label="สถานะ"
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
          <div className="w-full md:w-48">
            <ThaiDatePicker
              label="วันที่เริ่มต้น"
              value={dateStart}
              onChange={setDateStart}
            />
          </div>
          <div className="w-full md:w-48">
            <ThaiDatePicker
              label="วันที่สิ้นสุด"
              value={dateEnd}
              onChange={setDateEnd}
            />
          </div>
          <div className="w-full md:w-auto flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <i className="fas fa-search"></i>
              ค้นหา
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex-1 md:flex-none px-6 py-2.5 bg-slate-400 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <i className="fas fa-times"></i>
              ล้างตัวกรอง
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}
