import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import Layout from "@/components/layout/Layout";
import { requireAuth } from "@/lib/auth/withAuth";

interface Transaction {
  id: string;
  transaction_number: string;
  item_name: string;
  amount: number;
  transaction_date: string;
  status: string;
}

export default function PDFPreviewPage() {
  const router = useRouter();
  const { previewId } = router.query;
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);

  // Auto-select transaction if previewId is in URL
  useEffect(() => {
    if (previewId && typeof previewId === "string") {
      setSelectedTransactionId(previewId);
    }
  }, [previewId]);

  // Fetch transactions list
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions-for-preview"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("transactions")
        .select(
          "id, transaction_number, item_name, amount, transaction_date, status",
        )
        .order("transaction_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Transaction[];
    },
  });

  const selectedTransaction = transactions.find(
    (t) => t.id === selectedTransactionId,
  );

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PDF Preview</h1>
          <p className="text-gray-600 mt-2">
            Select a transaction to preview its PDF receipt
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Transactions</h2>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No transactions found
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <button
                      key={transaction.id}
                      onClick={() => setSelectedTransactionId(transaction.id)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedTransactionId === transaction.id
                          ? "bg-blue-100 border-2 border-blue-500"
                          : "bg-gray-50 border-2 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="font-semibold text-sm">
                        {transaction.transaction_number}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {transaction.item_name}
                      </div>
                      <div className="text-xs font-semibold text-gray-700 mt-1">
                        ฿
                        {transaction.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(
                          transaction.transaction_date,
                        ).toLocaleDateString("en-US")}
                      </div>
                      <div className="text-xs mt-1">
                        <span
                          className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                            transaction.status === "pending"
                              ? "bg-yellow-500"
                              : transaction.status === "approved"
                                ? "bg-green-500"
                                : "bg-red-500"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PDF Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Preview</h2>

              {!selectedTransaction ? (
                <div className="flex items-center justify-center h-96 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 text-center">
                    Select a transaction to preview the PDF receipt
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Transaction Info */}
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Transaction</p>
                        <p className="text-lg font-semibold">
                          {selectedTransaction.transaction_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Amount</p>
                        <p className="text-lg font-semibold">
                          ฿
                          {selectedTransaction.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Item</p>
                        <p className="text-sm">
                          {selectedTransaction.item_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Date</p>
                        <p className="text-sm">
                          {new Date(
                            selectedTransaction.transaction_date,
                          ).toLocaleDateString("en-US")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PDF Viewer */}
                  <div className="border-2 border-gray-300 rounded">
                    <iframe
                      src={`/api/download-transaction?id=${selectedTransactionId}&preview=true`}
                      className="w-full h-96 rounded"
                      title={`PDF Preview - ${selectedTransaction.transaction_number}`}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = `/api/download-transaction?id=${selectedTransactionId}`;
                        link.download = `TRX-${selectedTransaction.transaction_number}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
                    >
                      📥 Download PDF
                    </button>
                    <button
                      onClick={() => {
                        const url = `/api/download-transaction?id=${selectedTransactionId}&preview=true`;
                        window.open(url, "_blank");
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition"
                    >
                      🔍 Open Full View
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Development Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 mb-2">
            💡 Development Notes
          </h3>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>
              • Use this page to design and test the PDF template during
              development
            </li>
            <li>
              • Changes to{" "}
              <code className="bg-amber-100 px-2 py-1 rounded">
                TransactionReceiptTemplate.tsx
              </code>{" "}
              will show live in the preview
            </li>
            <li>• Download button exports the PDF with proper filename</li>
            <li>
              • "Open Full View" opens the PDF in a new browser tab for
              fullscreen viewing
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps = requireAuth;
