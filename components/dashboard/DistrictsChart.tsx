import { DistrictTotal } from "@/server/dashboard.server";

interface DistrictsChartProps {
  data: DistrictTotal[];
}

export function DistrictsChart({ data }: DistrictsChartProps) {
  const topDistricts = data.slice(0, 10);
  const maxAmount = Math.max(...topDistricts.map((d) => d.total_amount || 0));

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <i className="fa-solid fa-chart-bar text-blue-500"></i>
        ยอดจ่ายตามเขต (Top 10)
      </h3>

      <div className="space-y-4">
        {topDistricts.map((district) => (
          <div key={district.district_id} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="font-medium text-slate-800">
                  {district.district_name}
                </p>
                <p className="text-xs text-slate-500">
                  {district.paid_count} / {district.transaction_count} รายการ
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">
                  ฿{district.total_amount?.toLocaleString("th-TH") || "0"}
                </p>
              </div>
            </div>

            {/* Bar */}
            <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end px-3 transition-all duration-300 group-hover:from-blue-600 group-hover:to-blue-700"
                style={{
                  width: `${((district.total_amount || 0) / maxAmount) * 100}%`,
                }}
              >
                {((district.total_amount || 0) / maxAmount) * 100 > 15 && (
                  <span className="text-xs font-bold text-white">
                    {(((district.total_amount || 0) / maxAmount) * 100).toFixed(
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
