"use client";

import { useState, useEffect } from "react";
import {
  UseFormRegister,
  FieldValues,
  UseFormHandleSubmit,
  FormState,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/form/Input";
import { Select } from "@/components/form/Select";
import { CurrencyInput } from "@/components/form/CurrencyInput";
import { useAppToast } from "@/hooks/useAppToast";
import { useActiveCategories } from "@/hooks/useCategories";
import {
  fetchScheduleImagesAction,
  deleteScheduleImageAction,
} from "@/actions/schedule-images";
import type { FormData } from "@/pages/schedule";
import type { Schedule } from "@/server/schedule.server";
import { useActiveBankAccounts } from "@/hooks/useBankAccounts";
import { useSession } from "next-auth/react";

interface UploadedImage {
  preview: string;
  file: File;
}

interface StoredImage {
  id: string;
  url: string;
  filename: string;
  created_at: string;
}

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
  schedule?: Schedule | null;
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
  schedule,
}: ScheduleFormModalProps) {
  const { data: session } = useSession();
  const { data: bankAccounts, isLoading: bankAccountsLoading } =
    useActiveBankAccounts(session?.user?.id || null);
  const { data: categories, isLoading: categoriesLoading } =
    useActiveCategories();
  const { showToast } = useAppToast();

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [storedImages, setStoredImages] = useState<StoredImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const showWithdrawForm = watch("show_withdraw_form");
  const paymentMethodValue = watch("payment_method");

  // Fetch existing images when modal opens
  useEffect(() => {
    if (isOpen && schedule?.id) {
      fetchExistingImages();
    } else {
      setStoredImages([]);
      setUploadedImages([]);
    }
  }, [isOpen, schedule?.id]);

  const fetchExistingImages = async () => {
    try {
      const result = await fetchScheduleImagesAction(schedule!.id);
      if (result.success && result.images) {
        setStoredImages(result.images);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const imageFiles = acceptedFiles.filter((file) =>
        file.type.startsWith("image/"),
      );

      const totalImages =
        uploadedImages.length + storedImages.length + imageFiles.length;
      if (totalImages > 5) {
        setImageError(
          `สามารถอัปโหลดได้สูงสุด 5 รูปภาพ (ปัจจุบัน: ${uploadedImages.length + storedImages.length})`,
        );
        return;
      }

      const newImages = imageFiles.map((file) => ({
        preview: URL.createObjectURL(file),
        file,
      }));
      setUploadedImages((prev) => [...prev, ...newImages]);
      setImageError(null);
    },
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
  });

  const handleDeleteUploadedImage = (index: number) => {
    setUploadedImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleDeleteStoredImage = async (imageId: string) => {
    try {
      setDeletingImageId(imageId);
      const result = await deleteScheduleImageAction(imageId);

      if (result.success) {
        setStoredImages((prev) => prev.filter((img) => img.id !== imageId));
        showToast("ลบรูปภาพสำเร็จ", "success");
      } else {
        showToast(result.message, "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการลบรูปภาพ", "error");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleFormSubmit = async (data: FormData) => {
    // Include uploaded images in the form data
    data.images = uploadedImages.map((img) => img.file);

    // Submit the form (schedule + images + transaction all together)
    onSubmit(data);

    // Clean up preview URLs after submission
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
  };

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
        onSubmit={handleSubmit(handleFormSubmit)}
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

        {/* District and Sub-District Fields */}
        <div className="grid grid-cols-2 gap-3">
          {/* District Field */}
          <div>
            <Select
              label="อำเภอ"
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
          </div>

          {/* Sub-District Field */}
          <div>
            <Select
              label="ตำบล"
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
          </div>
        </div>

        {/* Withdrawal Transaction Section */}
        {isEditing && schedule?.transaction_id ? (
          schedule?.transaction_status === "pending" ? (
            // Pending Transaction - Editable Form
            <>
              {/* Show info that transaction is pending and editable */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                <p className="text-xs text-amber-800 flex items-center gap-1">
                  <i className="fa-solid fa-info-circle"></i>
                  รายการเบิกเงินอยู่ในสถานะรออนุมัติ คุณสามารถแก้ไขได้
                </p>
              </div>

              <div className="space-y-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                {/* Payment Method */}
                <Select
                  label="ประเภท *"
                  register={register("payment_method", {
                    validate: (value) => (!value ? "กรุณาเลือกประเภท" : true),
                  })}
                  error={errors.payment_method}
                  options={[
                    { value: "cash", label: "เงินสด" },
                    { value: "transfer", label: "โอนเงิน" },
                  ]}
                  placeholder="-- เลือกประเภท --"
                  required={true}
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
                    validate: (value) => (!value ? "กรุณากรอกจำนวนเงิน" : true),
                  })}
                  error={errors.amount}
                  placeholder="0.00"
                  required={true}
                  prefix="฿"
                />
              </div>
            </>
          ) : (
            // Non-pending Transaction - Read-only Display
            <div className="space-y-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    <i className="fa-solid fa-receipt mr-2 text-emerald-600"></i>
                    รายการเบิกเงิน (ที่ยื่นแล้ว)
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-emerald-600 text-white rounded font-medium">
                  {schedule.transaction_status || "pending"}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {schedule.transaction_number && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">เลขที่อ้างอิง:</span>
                    <span className="font-medium text-slate-800">
                      {schedule.transaction_number}
                    </span>
                  </div>
                )}

                {schedule.transaction_payment_method && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">ประเภท:</span>
                    <span className="font-medium text-slate-800">
                      {schedule.transaction_payment_method === "cash"
                        ? "เงินสด"
                        : schedule.transaction_payment_method === "transfer"
                          ? "โอนเงิน"
                          : schedule.transaction_payment_method}
                    </span>
                  </div>
                )}

                {schedule.transaction_amount && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">จำนวนเงิน:</span>
                    <span className="font-medium text-emerald-600">
                      ฿
                      {Number(schedule.transaction_amount).toLocaleString(
                        "th-TH",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </span>
                  </div>
                )}

                {schedule.transaction_net_amount && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">จำนวนสุทธิ:</span>
                    <span className="font-medium text-slate-800">
                      ฿
                      {Number(schedule.transaction_net_amount).toLocaleString(
                        "th-TH",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-3 p-2 bg-white rounded border border-slate-200">
                <i className="fa-solid fa-info-circle mr-1"></i>
                ไม่สามารถแก้ไขรายการเบิกเงินได้ กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          )
        ) : (
          // New Transaction - Create Form
          <>
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
                {/* Category */}
                <Select
                  label="หมวดหมู่ *"
                  register={register("category", {
                    validate: (value) =>
                      showWithdrawForm && !value ? "กรุณาเลือกหมวดหมู่" : true,
                  })}
                  error={errors.category}
                  options={
                    categories?.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })) || []
                  }
                  placeholder={
                    categoriesLoading ? "กำลังโหลด..." : "-- เลือกหมวดหมู่ --"
                  }
                  disabled={categoriesLoading}
                  required={showWithdrawForm}
                />

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
          </>
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

        {/* Image Upload Section */}
        <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          {/* Image Error */}
          {imageError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-xs flex items-center gap-2">
                <i className="fa-solid fa-exclamation-circle"></i>
                {imageError}
              </p>
            </div>
          )}

          <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-images text-blue-600"></i>
            อัพโหลดรูปภาพ (ไม่บังคับ)
          </h3>

          {/* Existing Images - Only show for edited schedules */}
          {isEditing && storedImages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">
                รูปภาพที่อัพโหลดแล้ว ({storedImages.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {storedImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group rounded-lg overflow-hidden bg-slate-100"
                  >
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-20 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteStoredImage(image.id)}
                      disabled={deletingImageId === image.id}
                      className="absolute top-0.5 right-0.5 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 text-xs"
                      title="ลบรูปภาพ"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {isEditing &&
            storedImages.length > 0 &&
            uploadedImages.length > 0 && (
              <div className="border-t border-blue-200"></div>
            )}

          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
              isDragActive
                ? "border-blue-500 bg-blue-100"
                : "border-blue-300 hover:border-blue-400 bg-white"
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-2xl mb-1 text-blue-400">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            {isDragActive ? (
              <p className="text-blue-600 font-medium text-xs">
                วางรูปภาพที่นี่
              </p>
            ) : (
              <>
                <p className="text-slate-700 font-medium text-xs mb-0.5">
                  ลากรูปภาพที่นี่ หรือคลิกเพื่อเลือก
                </p>
                <p className="text-xs text-slate-500">
                  JPG, PNG, GIF, WebP (ไม่เกิน 5MB)
                </p>
              </>
            )}
          </div>

          {/* Image Preview Gallery */}
          {uploadedImages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">
                รูปภาพใหม่ที่เลือก ({uploadedImages.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden bg-slate-100"
                  >
                    <img
                      src={image.preview}
                      alt={`preview-${index}`}
                      className="w-full h-20 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteUploadedImage(index)}
                      className="absolute top-0.5 right-0.5 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="ลบรูปภาพ"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limits Info */}
          <p className="text-xs text-blue-700 p-2 bg-white rounded border border-blue-200">
            <i className="fa-solid fa-info-circle mr-1"></i>
            สูงสุด 5 รูปภาพต่อตารางงาน
          </p>
        </div>

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
