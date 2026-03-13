"use client";

import {
  UseFormRegister,
  FieldValues,
  UseFormHandleSubmit,
  FormState,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/form/Input";
import { Select } from "@/components/form/Select";
import { CurrencyInput } from "@/components/form/CurrencyInput";
import type { FormData } from "@/pages/schedule";
import { useActiveBankAccounts } from "@/hooks/useBankAccounts";
import { useSession } from "next-auth/react";

interface ScheduleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
  isEditing: boolean;
  register: UseFormRegister<FormData>;
  handleSubmit: UseFormHandleSubmit<FormData>;
  watch: UseFormWatch<FormData>;
  setValue: UseFormSetValue<FormData>;
  errors: FormState<FormData>["errors"];
  formState: {
    province: string;
    district: string;
  };
  setFormState: (
    state:
      | { province: string; district: string }
      | ((prev: { province: string; district: string }) => {
          province: string;
          district: string;
        }),
  ) => void;
  districts: { id: string; name: string }[] | null;
  subDistricts: { id: string; name: string }[] | null;
  provinces: string[];
}

const THAI_STATUSES = [
  { value: "active", label: "กำลังดำเนินการ" },
  { value: "completed", label: "เสร็จสิ้น" },
  { value: "cancelled", label: "ยกเลิก" },
];

export function ScheduleFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  isEditing,
  register,
  handleSubmit,
  watch,
  setValue,
  errors,
  formState,
  setFormState,
  districts,
  subDistricts,
  provinces,
}: ScheduleFormModalProps) {
  const { data: session } = useSession();
  const { data: bankAccounts, isLoading: bankAccountsLoading } =
    useActiveBankAccounts(session?.user?.id || null);

  const showWithdrawForm = watch("show_withdraw_form");
  const paymentMethodValue = watch("payment_method");
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "แก้ไขตารางการทำงาน" : "เพิ่มตารางการทำงาน"}
      size="md"
      isLoading={isLoading}
      closeOnBackdropClick={false}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="p-6 space-y-4"
      >
        {/* Date Field */}
        <Input
          label="วันที่ *"
          type="date"
          register={register("scheduled_date", {
            required: "กรุณาเลือกวันที่",
          })}
          error={errors.scheduled_date}
        />

        {/* Time Fields */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="เวลาเริ่ม *"
            type="time"
            register={register("time_start", {
              required: "กรุณาเลือกเวลาเริ่ม",
              validate: (value) => {
                if (!value) return true;
                const timeEnd = watch("time_end");
                if (timeEnd && value >= timeEnd) {
                  return "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด";
                }
                return true;
              },
            })}
            error={errors.time_start}
          />
          <Input
            label="เวลาสิ้นสุด *"
            type="time"
            register={register("time_end", {
              required: "กรุณาเลือกเวลาสิ้นสุด",
              validate: (value) => {
                if (!value) return true;
                const timeStart = watch("time_start");
                if (timeStart && value <= timeStart) {
                  return "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม";
                }
                return true;
              },
            })}
            error={errors.time_end}
          />
        </div>

        {/* Title Field */}
        <Input
          label="ชื่ออีเว้นท์ *"
          placeholder="เช่น ประชุมทีมงาน, ตรวจสอบอุปกรณ์"
          register={register("title", {
            required: "กรุณากรอกชื่ออีเว้นท์",
            maxLength: {
              value: 255,
              message: "ชื่ออีเว้นท์ต้องไม่เกิน 255 ตัวอักษร",
            },
          })}
          error={errors.title}
        />

        {/* Address Field */}
        <Input
          label="ที่อยู่ *"
          placeholder="เช่น 123/4 ซอย 5 ถนนประเทศไทย"
          register={register("address", {
            required: "กรุณากรอกที่อยู่",
            maxLength: {
              value: 255,
              message: "ที่อยู่ต้องไม่เกิน 255 ตัวอักษร",
            },
          })}
          error={errors.address}
        />

        {/* Province Field */}
        <Select
          label="จังหวัด"
          options={provinces.map((p) => ({ value: p, label: p }))}
          value={formState.province}
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              province: e.target.value,
            }))
          }
        />

        {/* District Field */}
        <Select
          label="อำเภอ *"
          placeholder="กรุณาเลือก"
          options={
            districts?.map((d) => ({ value: d.id, label: d.name })) || []
          }
          value={watch("district_id") || ""}
          onChange={(e) => {
            const value = e.target.value;
            // Update both form state and React Hook Form
            setFormState((prev) => ({
              ...prev,
              district: value,
            }));
            setValue("district_id", value);
            // Reset sub-district when district changes
            setValue("sub_district_id", "");
          }}
          disabled={!districts}
        />
        {errors.district_id && (
          <p className="text-red-500 text-sm -mt-3">
            {errors.district_id.message}
          </p>
        )}

        {/* Sub-District Field */}
        <Select
          label="ตำบล *"
          placeholder="กรุณาเลือก"
          options={
            subDistricts?.map((s) => ({ value: s.id, label: s.name })) || []
          }
          value={watch("sub_district_id") || ""}
          onChange={(e) => {
            const fieldValue = e.target.value;
            setValue("sub_district_id", fieldValue);
          }}
          disabled={!subDistricts}
        />
        {errors.sub_district_id && (
          <p className="text-red-500 text-sm -mt-3">
            {errors.sub_district_id.message}
          </p>
        )}

        {/* Show Withdraw Form Checkbox */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <input
            id="show_withdraw_form"
            type="checkbox"
            {...register("show_withdraw_form")}
            className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
          />
          <label
            htmlFor="show_withdraw_form"
            className="text-sm font-medium text-slate-700 cursor-pointer"
          >
            เพิ่มรายการเบิกเงินให้กับตารางการทำงานนี้
          </label>
        </div>

        {/* Withdraw Form Fields - Conditionally Rendered */}
        {showWithdrawForm && (
          <div className="space-y-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            {/* Payment Method */}
            <Select
              label="ประเภท *"
              register={register("payment_method", {
                validate: (value) =>
                  showWithdrawForm && !value ? "กรุณาเลือกประเภท" : true,
              })}
              error={errors.payment_method}
              options={[
                { value: "cash", label: "เงินสด" },
                { value: "transfer", label: "โอนเงิน" },
              ]}
              placeholder="-- เลือกประเภท --"
              required={showWithdrawForm}
              onChange={(e) => {
                setValue("payment_method", e.target.value);
              }}
            />

            {/* Bank Account Selection - Required only for transfer */}
            {paymentMethodValue === "transfer" && (
              <Select
                label="บัญชีธนาคาร *"
                register={register("bankAccountId", {
                  validate: (value) =>
                    paymentMethodValue === "transfer" && !value
                      ? "กรุณาเลือกบัญชีธนาคาร"
                      : true,
                })}
                error={errors.bankAccountId}
                options={
                  bankAccounts?.map((account) => ({
                    value: account.id,
                    label: `${account.bank_name} - ${account.account_number}`,
                  })) || []
                }
                placeholder={
                  bankAccountsLoading
                    ? "กำลังโหลด..."
                    : "-- เลือกบัญชีธนาคาร --"
                }
                disabled={bankAccountsLoading}
                required
              />
            )}

            {/* Amount */}
            <CurrencyInput
              label="จำนวนเงิน *"
              register={register("amount", {
                validate: (value) =>
                  showWithdrawForm && !value ? "กรุณากรอกจำนวนเงิน" : true,
              })}
              error={errors.amount}
              placeholder="0.00"
              required={showWithdrawForm}
              prefix="฿"
            />
          </div>
        )}

        {/* Note Field */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            หมายเหตุ
          </label>
          <textarea
            {...register("note", {
              maxLength: {
                value: 500,
                message: "หมายเหตุต้องไม่เกิน 500 ตัวอักษร",
              },
            })}
            placeholder="เช่น เตรียมอุปกรณ์ XYZ, หารือเรื่อง ABC"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-colors text-slate-800 ${
              errors.note
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-300 focus:ring-emerald-500"
            }`}
            rows={3}
          ></textarea>
          {errors.note && (
            <p className="text-red-500 text-sm mt-1">{errors.note.message}</p>
          )}
        </div>

        {/* Status Field */}
        <Select
          label="สถานะ *"
          options={THAI_STATUSES}
          register={register("status", {
            required: "กรุณาเลือกสถานะ",
          })}
          error={errors.status}
        />

        {/* Validation Summary - Show if there are errors */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm font-medium flex items-center gap-2">
              <i className="fa-solid fa-exclamation-circle"></i>
              กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <i className="fa-solid fa-save"></i>
                บันทึก
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
