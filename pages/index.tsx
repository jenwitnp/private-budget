import { useSession, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BalanceCard, StatCard } from "@/components/ui/Card";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-emerald-500"></i>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <BalanceCard
          title="ยอดเงินคงเหลือ"
          amount={25400}
          change={12}
          icon="fa-wallet"
        />

        <StatCard
          icon="fa-hourglass-end"
          label="รอดำเนินการ"
          value="฿5,000.00"
          color="blue"
        />

        <StatCard
          icon="fa-check-circle"
          label="จ่ายแล้วเดือนนี้"
          value="฿120,500.00"
          color="emerald"
        />
      </div>

      {/* Charts and Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            แนวโน้มการถอนเงิน (6 เดือนล่าสุด)
          </h3>
          <div className="h-64 flex items-end gap-4">
            {[30, 50, 35, 65, 45, 70].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg hover:from-emerald-600 hover:to-emerald-500 transition-colors cursor-pointer relative group"
                style={{ height: `${height * 2}px` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ฿{(height * 1000).toLocaleString("th-TH")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            รายการล่าสุด
          </h3>
          <div className="space-y-4">
            {[
              {
                name: "บัญชีกสิกรไทย",
                amount: "฿2,500.00",
                date: "2 ชั่วโมงที่แล้ว",
                status: "success",
              },
              {
                name: "บัญชีไทยพาณิชย์",
                amount: "฿5,000.00",
                date: "เมื่อวานนี้",
                status: "success",
              },
              {
                name: "บัญชีธนาชาติ",
                amount: "฿3,500.00",
                date: "3 วันที่แล้ว",
                status: "pending",
              },
            ].map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {tx.name}
                  </p>
                  <p className="text-xs text-slate-500">{tx.date}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {tx.amount}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {tx.status === "success" ? "สำเร็จ" : "รอดำเนินการ"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(context: any) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
