"use client";

import { useEffect, useState } from "react";
import {
  getDashboardSummary,
  getDistrictTotals,
  getSubDistrictTotals,
  getCategoryTotals,
  type DashboardSummary,
  type DistrictTotal,
  type SubDistrictTotal,
  type CategoryTotal,
} from "@/server/dashboard.server";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { DistrictsChart } from "@/components/dashboard/DistrictsChart";
import { SubDistrictsChart } from "@/components/dashboard/SubDistrictsChart";
import { CategoriesChart } from "@/components/dashboard/CategoriesChart";

export function DashboardCharts() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [districts, setDistricts] = useState<DistrictTotal[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrictTotal[]>([]);
  const [categories, setCategories] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [summaryData, districtsData, subDistrictsData, categoriesData] =
          await Promise.all([
            getDashboardSummary(),
            getDistrictTotals(),
            getSubDistrictTotals(),
            getCategoryTotals(),
          ]);

        setSummary(summaryData);
        setDistricts(districtsData);
        setSubDistricts(subDistrictsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-emerald-500"></i>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      {summary && <SummaryCards summary={summary} />}

      {/* Districts Chart */}
      {districts.length > 0 && <DistrictsChart data={districts} />}

      {/* Sub Districts Chart */}
      {subDistricts.length > 0 && <SubDistrictsChart data={subDistricts} />}

      {/* Categories Chart */}
      {categories.length > 0 && <CategoriesChart data={categories} />}
    </div>
  );
}
