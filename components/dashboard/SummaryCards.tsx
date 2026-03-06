import { DashboardSummary } from "@/server/dashboard.server";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      icon: "fa-money-bill-wave",
      label: "ยอดจ่ายแล้ว",
      value: `฿${summary.total_paid_amount?.toLocaleString("th-TH") || "0"}`,
      color: "from-emerald-500 to-emerald-600",
    },
    // {
    //   icon: "fa-receipt",
    //   label: "รวมรายการทั้งหมด",
    //   value: summary.total_transactions || 0,
    //   color: "from-blue-500 to-blue-600",
    // },
    {
      icon: "fa-check-circle",
      label: "รายการจ่ายแล้ว",
      value: summary.total_paid_transactions || 0,
      color: "from-teal-500 to-teal-600",
    },
    {
      icon: "fa-hourglass-end",
      label: "รายการรอดำเนินการ",
      value: summary.total_pending_transactions || 0,
      color: "from-amber-500 to-amber-600",
    },
    {
      icon: "fa-location-dot",
      label: "เขตที่มีรายการ",
      value: summary.total_districts || 0,
      color: "from-purple-500 to-purple-600",
    },
    // {
    //   icon: "fa-tag",
    //   label: "หมวดหมู่",
    //   value: summary.total_categories || 0,
    //   color: "from-pink-500 to-pink-600",
    // },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-lg`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">{card.label}</p>
              <p className="text-2xl font-bold mt-2">{card.value}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className={`fa-solid ${card.icon} text-xl`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
