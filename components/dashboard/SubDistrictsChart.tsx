import { SubDistrictTotal } from "@/server/dashboard.server";

interface SubDistrictsChartProps {
  data: SubDistrictTotal[];
}

export function SubDistrictsChart({ data }: SubDistrictsChartProps) {
  const topSubDistricts = data.slice(0, 10);
  const maxAmount = Math.max(
    ...topSubDistricts.map((sd) => sd.total_amount || 0),
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <i className="fa-solid fa-chart-bar text-emerald-500"></i>
        ยอดจ่ายตามตำบล (Top 10)
      </h3>

      <div className="space-y-4">
        {topSubDistricts.map((subDistrict) => (
          <div key={subDistrict.sub_district_id} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="font-medium text-slate-800">
                  {subDistrict.sub_district_name}
                </p>
                <p className="text-xs text-slate-500">
                  {subDistrict.district_name} • {subDistrict.paid_count} /{" "}
                  {subDistrict.transaction_count} รายการ
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">
                  ฿{subDistrict.total_amount?.toLocaleString("th-TH") || "0"}
                </p>
              </div>
            </div>

            {/* Bar */}
            <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-end px-3 transition-all duration-300 group-hover:from-emerald-600 group-hover:to-emerald-700"
                style={{
                  width: `${((subDistrict.total_amount || 0) / maxAmount) * 100}%`,
                }}
              >
                {((subDistrict.total_amount || 0) / maxAmount) * 100 > 15 && (
                  <span className="text-xs font-bold text-white">
                    {(
                      ((subDistrict.total_amount || 0) / maxAmount) *
                      100
                    ).toFixed(0)}
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
