import { Card } from "@/components/ui/Card";

interface TransactionStatsGridProps {
  stats: {
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
  };
  onStatusClick: (status: string) => void;
}

export function TransactionStatsGrid({
  stats,
  onStatusClick,
}: TransactionStatsGridProps) {
  const statusCards = [
    {
      key: "all",
      label: "ทั้งหมด",
      color: "text-blue-600",
      icon: "fa-layer-group",
      count: stats.pending + stats.approved + stats.rejected + stats.paid,
    },
    {
      key: "pending",
      label: "รออนุมัติ",
      color: "text-amber-600",
      icon: "fa-hourglass-end",
      count: stats.pending,
    },
    {
      key: "approved",
      label: "อนุมัติแล้ว",
      color: "text-purple-600",
      icon: "fa-check-circle",
      count: stats.approved,
    },

    {
      key: "paid",
      label: "ชำระแล้ว",
      color: "text-emerald-600",
      icon: "fa-check-double",
      count: stats.paid,
    },
    {
      key: "rejected",
      label: "ปฎิเสธ",
      color: "text-red-600",
      icon: "fa-times-circle",
      count: stats.rejected,
    },
  ];

  return (
    <div
      className="mb-6 overflow-x-auto"
      style={
        {
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        } as React.CSSProperties & {
          scrollbarWidth: string;
          msOverflowStyle: string;
        }
      }
    >
      <style>{`
        div[class*="overflow-x-auto"] {
          -webkit-scrollbar: none;
        }
        div[class*="overflow-x-auto"]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="flex gap-3 md:gap-4 md:grid md:grid-cols-5 pt-1 pb-1 flex-nowrap">
        {statusCards.map((card) => (
          <Card
            key={card.key}
            className="text-center py-4 md:py-6 hover:shadow-md transition-shadow cursor-pointer flex-shrink-0"
            // style={{ minWidth: "calc((100vw - 48px) / 4)" }}
            onClick={() => onStatusClick(card.key)}
          >
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs md:text-sm text-slate-600 font-medium">
                {card.label}
              </p>
            </div>
            <p className={`text-2xl md:text-3xl font-bold ${card.color} mt-2`}>
              {card.count}
            </p>
            <p className="text-xs text-slate-500 mt-1">รายการ</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
