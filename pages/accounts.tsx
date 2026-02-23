"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/form/Input";
import { Select } from "@/components/form/Select";
import { Autocomplete } from "@/components/form/Autocomplete";
import { Modal } from "@/components/ui/Modal";
import {
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
  useSetPrimaryBankAccount,
} from "@/hooks/useBankAccounts";
import type { ThaiBank } from "@/lib/thaibanks";
import { THAI_BANKS } from "@/lib/thaibanks";
import type { CreateBankAccountInput } from "@/server/bank-accounts.server";

interface FormData {
  account_name: string;
  account_number: string;
  account_type: "savings" | "checking" | "fixed";
  branch_name?: string;
  account_holder_name?: string;
}

export default function AccountsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const userId = (session?.user as any)?.id;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      account_name: "",
      account_number: "",
      account_type: "savings",
      branch_name: "",
      account_holder_name: "",
    },
  });

  // State management
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<ThaiBank | null>(null);

  const userRole = (session?.user as any)?.role as
    | "owner"
    | "admin"
    | "user"
    | undefined;

  // React Query hooks
  const {
    data: accounts = [],
    isLoading,
    error: fetchError,
  } = useBankAccounts(userId);
  const createMutation = useCreateBankAccount(userId);
  const updateMutation = useUpdateBankAccount(userId);
  const deleteMutation = useDeleteBankAccount(userId, userRole);
  const setPrimaryMutation = useSetPrimaryBankAccount(userId);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const handleOpenModal = (accountId?: string) => {
    if (accountId) {
      // Edit mode
      const account = accounts.find((a) => a.id === accountId);
      if (account) {
        setEditingId(accountId);
        const bank = THAI_BANKS.find((b) => b.code === account.bank);
        if (bank) {
          setSelectedBank(bank);
        }
        reset({
          account_name: account.account_name,
          account_number: account.account_number,
          account_type: account.account_type,
          branch_name: account.branch_name || "",
          account_holder_name: account.account_holder_name || "",
        });
      }
    } else {
      // Create mode
      setEditingId(null);
      setSelectedBank(null);
      reset();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setSelectedBank(null);
    reset();
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (!selectedBank) {
        console.warn("No bank selected");
        return;
      }

      const input: CreateBankAccountInput = {
        account_name: data.account_name,
        account_number: data.account_number,
        account_type: data.account_type,
        bank: selectedBank.code,
        bank_name: selectedBank.name,
        branch_name: data.branch_name || "",
        account_holder_name: data.account_holder_name || "",
      };

      console.log("📋 Form Data:", data);
      console.log("🏦 Selected Bank:", selectedBank);
      console.log("📤 Sending Input:", input);

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, input });
      } else {
        await createMutation.mutateAsync(input);
      }
      handleCloseModal();
    } catch (err) {
      console.error("❌ Error saving account:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this account?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error("Error deleting account:", err);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimaryMutation.mutateAsync(id);
    } catch (err) {
      console.error("Error setting primary account:", err);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-600">กำลังโหลด...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <i className="fa-solid fa-exclamation-circle mr-2"></i>
          ไม่สามารถโหลดข้อมูลบัญชีได้ กรุณาลองใหม่อีกครั้ง
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">บัญชีธนาคารของฉัน</h1>
        <Button onClick={() => setShowModal(true)}>
          <i className="fa-solid fa-plus"></i> เพิ่มบัญชีธนาคาร
        </Button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card
            key={account.id}
            className={`relative ${
              account.is_primary
                ? "border-emerald-500 ring-4 ring-emerald-500/10"
                : "hover:border-emerald-300"
            }`}
          >
            {account.is_primary && (
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                บัญชีหลัก
                <i className="fa-solid fa-star ml-1 text-yellow-300"></i>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-slate-800">
                  {account.account_name}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    account.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {account.is_active ? "ใช้งาน" : "ไม่ใช้งาน"}
                </span>
              </div>
              <p className="text-slate-500 text-sm">
                {account.bank_name || account.bank}
              </p>
            </div>

            <div className="space-y-1 mb-6">
              <p className="text-slate-400 text-xs uppercase tracking-wide">
                หมายเลขบัญชี
              </p>
              <p className="text-lg font-bold font-num tracking-wider text-slate-700">
                {account.account_number}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleOpenModal(account.id)}
                className="flex-1 py-2 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 font-medium transition-colors"
              >
                <i className="fa-solid fa-edit mr-1"></i>
                แก้ไข
              </button>
              {!account.is_primary && (
                <button
                  onClick={() => handleSetPrimary(account.id)}
                  disabled={setPrimaryMutation.isPending}
                  className="flex-1 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 font-medium transition-colors disabled:opacity-50"
                  title="ตั้งเป็นบัญชีหลัก"
                >
                  <i className="fa-solid fa-star mr-1"></i>
                  ตั้งเป็นหลัก
                </button>
              )}
              <button
                onClick={() => handleDelete(account.id)}
                disabled={deleteMutation.isPending || account.is_primary}
                className="py-2 px-3 text-slate-400 bg-slate-50 rounded-lg hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                title={account.is_primary ? "ไม่สามารถลบบัญชีหลัก" : "ลบ"}
              >
                {deleteMutation.isPending ? (
                  <i className="fa-solid fa-spinner animate-spin"></i>
                ) : (
                  <i className="fa-solid fa-trash"></i>
                )}
              </button>
            </div>
          </Card>
        ))}

        {accounts.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12">
            <i className="fa-solid fa-inbox text-4xl text-slate-300 mb-4 block"></i>
            <p className="text-slate-500">
              ไม่มีบัญชีธนาคาร เพิ่มบัญชีแรกของคุณเลย!
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Account Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingId ? "แก้ไขบัญชี" : "เพิ่มบัญชีธนาคาร"}
        size="md"
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input
            label="ชื่อบัญชี"
            placeholder="เช่น บัญชีออมทรัพย์"
            register={register("account_name", {
              required: "กรุณากรอกชื่อบัญชี",
            })}
            error={errors.account_name}
          />

          <Autocomplete
            label="ชื่อธนาคาร"
            placeholder="ค้นหาธนาคาร..."
            data={THAI_BANKS}
            displayKey="name"
            valueKey="code"
            value={selectedBank}
            onChange={setSelectedBank}
            error={!selectedBank ? "กรุณาเลือกธนาคาร" : undefined}
            renderItem={(bank) => (
              <div className="flex items-center gap-2">
                {bank.logo && (
                  <img
                    src={bank.logo}
                    alt={bank.nameEn}
                    className="w-6 h-6 rounded"
                  />
                )}
                <div>
                  <div className="font-medium">{bank.name}</div>
                  <div className="text-xs text-slate-500">{bank.nameEn}</div>
                </div>
              </div>
            )}
          />

          <Input
            label="หมายเลขบัญชี"
            placeholder="กรอกหมายเลขบัญชี"
            register={register("account_number", {
              required: "กรุณากรอกหมายเลขบัญชี",
            })}
            error={errors.account_number}
          />

          <Select
            label="ประเภทบัญชี"
            register={register("account_type")}
            options={[
              { value: "savings", label: "ออมทรัพย์" },
              { value: "checking", label: "กระแสรายวัน" },
              { value: "fixed", label: "ประจำ" },
            ]}
          />

          <Input
            label="สาขา (ไม่จำเป็น)"
            placeholder="เช่น สาขาสีลม"
            register={register("branch_name")}
          />

          <Input
            label="ชื่อเจ้าของบัญชี (ไม่จำเป็น)"
            placeholder="ชื่อเต็ม"
            register={register("account_holder_name")}
          />

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "กำลังบันทึก..."
                : "บันทึก"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
