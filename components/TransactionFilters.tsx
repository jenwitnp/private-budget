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

export function TransactionFilters() {
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
  const buildQueryString = () => {
    const filterObject = {
      searchTerm,
      statusFilter,
      dateStart,
      dateEnd,
      categoryId,
      districtId,
      subDistrictId,
    };

    const params = new URLSearchParams();
    params.append("filters", JSON.stringify(filterObject));

    return params.toString();
  };

  const handleSubmit = () => {
    const queryString = buildQueryString();
    const fullUrl = queryString ? `/history?${queryString}` : "/history";

    console.group("📋 Query URL - Internal Test");
    console.log(
      "%cQuery String:",
      "color: #f59e0b; font-weight: bold; font-size: 14px;",
      queryString || "(no filters)",
    );
    console.log(
      "%cFull URL:",
      "color: #06b6d4; font-weight: bold; font-size: 14px;",
      fullUrl,
    );
    console.log("%cFilter Object:", "color: #10b981; font-weight: bold;", {
      searchTerm,
      statusFilter,
      dateStart,
      dateEnd,
      categoryId,
      districtId,
      subDistrictId,
    });
    console.groupEnd();

    // Navigate to the URL with filters
    router.push(fullUrl);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateStart("");
    setDateEnd("");
    setCategoryId("");
    setDistrictId("");
    setSubDistrictId("");

    console.log("🧹 [TransactionFilters] All filters cleared");
    router.push("/history");
  };

  return (
    <Card className="mb-6">
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
            className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
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
  );
}
