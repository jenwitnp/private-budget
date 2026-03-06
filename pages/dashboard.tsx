"use client";

import Layout from "@/components/layout/Layout";
import { DashboardCharts } from "@/components/DashboardCharts";
import { requireAuth } from "@/lib/auth/withAuth";

export default function DashboardPage() {
  return (
    <Layout>
      {/* Page Title */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <i className="fa-solid fa-chart-line text-blue-500 text-2xl"></i>
          <span>การวิเคราะห์ข้อมูล</span>
        </h2>
        <p className="text-slate-600">ดูข้อมูลสถิติและรายงานการใช้งานของคุณ</p>
      </div>

      {/* Dashboard Charts */}
      <DashboardCharts />
    </Layout>
  );
}

export const getServerSideProps = requireAuth;
