import { CategoryTotal } from "@/server/dashboard.server";

interface CategoriesChartProps {
  data: CategoryTotal[];
}

export function CategoriesChart({ data }: CategoriesChartProps) {
  const maxAmount = Math.max(...data.map((c) => c.total_amount || 0));
  const colors = [
    "from-blue-500 to-blue-600",
    "from-emerald-500 to-emerald-600",
    "from-purple-500 to-purple-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
    "from-red-500 to-red-600",
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <i className="fa-solid fa-chart-pie text-purple-500"></i>
        ยอดจ่ายตามหมวดหมู่
      </h3>

      <div className="space-y-4">
        {data.map((category, idx) => (
          <div key={category.category_id} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="font-medium text-slate-800">
                  {category.category_name}
                </p>
                <p className="text-xs text-slate-500">
                  {category.paid_count} / {category.transaction_count} รายการ
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">
                  ฿{category.total_amount?.toLocaleString("th-TH") || "0"}
                </p>
              </div>
            </div>

            {/* Bar */}
            <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} flex items-center justify-end px-3 transition-all duration-300 group-hover:shadow-md`}
                style={{
                  width: `${((category.total_amount || 0) / maxAmount) * 100}%`,
                  opacity:
                    ((category.total_amount || 0) / maxAmount) * 100 > 5
                      ? 1
                      : 0.7,
                }}
              >
                {((category.total_amount || 0) / maxAmount) * 100 > 15 && (
                  <span className="text-xs font-bold text-white">
                    {(((category.total_amount || 0) / maxAmount) * 100).toFixed(
                      0,
                    )}
                    %
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
