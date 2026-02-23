import { CSSProperties, ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  [key: string]: any;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl p-6 shadow-sm border border-slate-100",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface BalanceCardProps {
  title: string;
  amount: number;
  currency?: string;
  change?: number;
  icon?: string;
}

export function BalanceCard({
  title,
  amount,
  currency = "฿",
  change = 0,
  icon = "fa-wallet",
}: BalanceCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all duration-500"></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold font-num tracking-tight">
            {currency}
            {amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
          <i className={`fa-solid ${icon} text-emerald-400`}></i>
        </div>
      </div>

      <div className="flex gap-2 relative z-10">
        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
          <i className="fa-solid fa-arrow-trend-up mr-1"></i>
          {change > 0 ? "+" : ""}
          {change}%
        </span>
        <span className="text-xs text-slate-400 mt-1">จากเดือนที่แล้ว</span>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: "emerald" | "blue" | "amber" | "red";
}

export function StatCard({
  icon,
  label,
  value,
  color = "emerald",
}: StatCardProps) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div
          className={clsx(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            colorMap[color],
          )}
        >
          <i className={`fa-solid ${icon} text-xl`}></i>
        </div>
        <div>
          <p className="text-slate-500 text-sm">{label}</p>
          <p className="text-2xl font-bold text-slate-800 font-num">{value}</p>
        </div>
      </div>
    </Card>
  );
}
