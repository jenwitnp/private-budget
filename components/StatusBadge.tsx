import type { Transaction } from "@/components/TransactionCard";

interface StatusBadgeProps {
  status: Transaction["status"];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  // Status color mapping
  const statusConfig: Record<
    Transaction["status"],
    {
      bgColor: string;
      textColor: string;
      icon: string;
      label: string;
    }
  > = {
    paid: {
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      icon: "fa-check-double",
      label: "ชำระแล้ว",
    },
    pending: {
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      icon: "fa-clock",
      label: "รอดำเนินการ",
    },
    approved: {
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      icon: "fa-thumbs-up",
      label: "อนุมัติแล้ว",
    },
    rejected: {
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      icon: "fa-times-circle",
      label: "ปฏิเสธ",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`shrink-0 text-xs md:text-sm px-3 md:px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap flex items-center gap-1.5 ${config.bgColor} ${config.textColor}`}
    >
      <i className={`fas text-xs ${config.icon}`}></i>
      {config.label}
    </span>
  );
}
