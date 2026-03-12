import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { useSession } from "next-auth/react";
import { handleWithdrawSubmitAction, logFormData } from "@/actions/withdrawal";
import { useAppToast } from "@/hooks/useAppToast";
import { WithdrawFormData } from "@/types/withdrawal";
import { FormErrorMessage } from "@/components/form/FormErrorMessage";
import { Input } from "@/components/form/Input";
import { Select } from "@/components/form/Select";
import { Textarea } from "@/components/form/Textarea";
import { CurrencyInput } from "@/components/form/CurrencyInput";
import { ImageUploadArea } from "@/components/form/ImageUploadArea";
import { ImagePreviewGallery } from "@/components/form/ImagePreviewGallery";
import { FormButtons } from "@/components/form/FormButtons";
import { Modal } from "@/components/ui/Modal";
import { Autocomplete } from "@/components/form/Autocomplete";
import { useActiveCategories } from "@/hooks/useCategories";
import { useActiveBankAccounts } from "@/hooks/useBankAccounts";
import {
  useDistrictsByProvince,
  useSubDistrictsByDistrict,
} from "@/hooks/useDistricts";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WithdrawFormData) => Promise<void>;
}

export function WithdrawModal({
  isOpen,
  onClose,
  onSubmit,
}: WithdrawModalProps) {
  const { data: session } = useSession();
  const { showToast } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ preview: string; file: File }>
  >([]);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [scheduleSearchInput, setScheduleSearchInput] = useState("");
  const [scheduleResults, setScheduleResults] = useState<any[]>([]);
  const [scheduleSearchLoading, setScheduleSearchLoading] = useState(false);
  const { data: categories, isLoading: categoriesLoading } =
    useActiveCategories();
  const { data: bankAccounts, isLoading: bankAccountsLoading } =
    useActiveBankAccounts(session?.user?.id || null);

  // Initialize form first
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WithdrawFormData>({
    defaultValues: {
      bankAccountId: "",
      itemName: "",
      category: "",
      payment_method: "",
      district_id: "",
      sub_district_id: "",
      amount: "",
      description: "",
      schedule_id: "",
    },
  });

  // Districts and sub-districts hooks
  const districtValue = watch("district_id");
  const { data: districts, isLoading: districtsLoading } =
    useDistrictsByProvince("หนองคาย"); // Hardcoded to Nongkhai province
  const { data: subDistricts, isLoading: subDistrictsLoading } =
    useSubDistrictsByDistrict(districtValue || null);

  const amountValue = watch("amount");
  const paymentMethodValue = watch("payment_method");

  // Handle schedule search on keyDown - fetch fresh API data every keystroke
  const handleScheduleKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    const query = (e.target as HTMLInputElement).value;
    setScheduleSearchInput(query);

    if (!query.trim()) {
      setScheduleResults([]);
      return;
    }

    setScheduleSearchLoading(true);
    try {
      const searchParams = new URLSearchParams({ q: query });
      const response = await fetch(
        `/api/schedules/search?${searchParams.toString()}`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setScheduleResults(data.data);
        } else {
          setScheduleResults([]);
        }
      } else {
        setScheduleResults([]);
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      setScheduleResults([]);
    } finally {
      setScheduleSearchLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const imageFiles = acceptedFiles.filter((file) =>
        file.type.startsWith("image/"),
      );
      if (imageFiles.length + uploadedImages.length > 5) {
        setError("สามารถอัปโหลดได้สูงสุด 5 รูปภาพ");
        return;
      }
      const newImages = imageFiles.map((file) => ({
        preview: URL.createObjectURL(file),
        file,
      }));
      setUploadedImages((prev) => [...prev, ...newImages]);
      setError(null);
    },
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
  });

  const handleClose = () => {
    reset();
    setError(null);
    setSelectedSchedule(null);
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    onClose();
  };

  const handleDeleteImage = (index: number) => {
    setUploadedImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleFormSubmit = async (data: WithdrawFormData) => {
    setLoading(true);
    setError(null);
    try {
      // Validate user ID
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const formDataWithImages: WithdrawFormData = {
        ...data,
        images: uploadedImages.map((img) => img.file),
      };

      // Log form data for debugging
      logFormData(formDataWithImages, "Before Submission");

      // Call server action with form data and images
      // Server action will handle image upload, processing, and transaction creation
      const result = await handleWithdrawSubmitAction(
        formDataWithImages,
        session.user.id,
        uploadedImages.map((img) => img.file),
      );

      console.log("✅ Withdrawal action result:", result);

      // Call parent onSubmit callback to trigger page refresh
      await onSubmit(formDataWithImages);

      showToast("ส่งคำขอเบิกเงินสำเร็จ!", "success");
      handleClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      console.error("❌ Withdrawal error:", errorMessage);
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="เบิกเงิน"
      icon="fa-arrow-right-from-bracket"
      isLoading={loading}
    >
      {/* Form Content */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
        {/* Error Message */}
        <FormErrorMessage error={error} />

        {/* Item Name */}
        <Input
          label="ชื่อรายการ"
          register={register("itemName", {
            required: "กรุณากรอกชื่อรายการ",
            minLength: {
              value: 3,
              message: "ชื่อรายการต้องมีอย่างน้อย 3 ตัวอักษร",
            },
          })}
          error={errors.itemName}
          placeholder="เช่น ค่าพัฒนาชุมชน"
          required
        />

        {/* Category & Type */}
        <div className="grid grid-cols-2 gap-4">
          {/* Category */}
          <Select
            label="หมวดหมู่"
            register={register("category", {
              required: "กรุณาเลือกหมวดหมู่",
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
            required
          />

          {/* Payment Method */}
          <Select
            label="ประเภท"
            register={register("payment_method", {
              required: "กรุณาเลือกประเภท",
            })}
            error={errors.payment_method}
            options={[
              { value: "cash", label: "เงินสด" },
              { value: "transfer", label: "โอนเงิน" },
            ]}
            placeholder="-- เลือกประเภท --"
            required
          />
        </div>

        {/* Schedule Autocomplete Selection */}
        <Autocomplete
          label="เลือกตารางการทำงาน (ไม่บังคับ)"
          placeholder="ค้นหาตารางการทำงาน..."
          data={scheduleResults}
          displayKey="title"
          valueKey="id"
          value={selectedSchedule}
          searchValue={scheduleSearchInput}
          isLoading={scheduleSearchLoading}
          onInputChange={(value) => {
            setScheduleSearchInput(value);
          }}
          onChange={(schedule) => {
            setSelectedSchedule(schedule);
            if (schedule) {
              setValue("schedule_id", schedule.id);
              setScheduleResults([]);
              setScheduleSearchInput(schedule.title); // Display selected schedule name
            } else {
              setValue("schedule_id", "");
              setScheduleResults([]);
              setScheduleSearchInput("");
            }
          }}
          onKeyDown={handleScheduleKeyDown}
          renderItem={(schedule: any) => (
            <div className="flex flex-col">
              <span className="font-medium">{schedule.title}</span>
              <span className="text-xs text-slate-500">
                {new Date(schedule.scheduled_date).toLocaleDateString("th-TH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                {schedule.time_start && `- ${schedule.time_start}`}
              </span>
            </div>
          )}
        />

        {/* districts & sub_districts */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="อำเภอ"
            register={register("district_id")}
            error={errors.district_id}
            options={
              districts?.map((district) => ({
                value: district.id.toString(),
                label: district.name,
              })) || []
            }
            placeholder={districtsLoading ? "กำลังโหลด..." : "-- เลือกอำเภอ --"}
            disabled={districtsLoading}
            onChange={(e: any) => {
              const districtId = e.target.value;
              setValue("district_id", districtId);
              // Reset sub_district when district changes
              setValue("sub_district_id", "");
            }}
          />

          <Select
            label="ตำบล"
            register={register("sub_district_id")}
            error={errors.sub_district_id}
            options={
              subDistricts?.map((subDistrict) => ({
                value: subDistrict.id.toString(),
                label: subDistrict.name,
              })) || []
            }
            placeholder={
              subDistrictsLoading
                ? "กำลังโหลด..."
                : districtValue
                  ? "-- เลือกตำบล --"
                  : "-- เลือกอำเภอก่อน --"
            }
            disabled={subDistrictsLoading || !districtValue}
            onChange={(e: any) => {
              setValue("sub_district_id", e.target.value);
            }}
          />
        </div>

        {/* Bank Account Selection - Required only for transfer */}
        {paymentMethodValue === "transfer" && (
          <Select
            label="บัญชีธนาคาร"
            register={register("bankAccountId", {
              required: "กรุณาเลือกบัญชีธนาคาร",
            })}
            error={errors.bankAccountId}
            options={
              bankAccounts?.map((account) => ({
                value: account.id,
                label: `${account.bank_name} - ${account.account_number} `,
              })) || []
            }
            placeholder={
              bankAccountsLoading ? "กำลังโหลด..." : "-- เลือกบัญชีธนาคาร --"
            }
            disabled={bankAccountsLoading}
            required
          />
        )}

        {/* Amount */}
        <CurrencyInput
          label="จำนวนเงิน"
          register={register("amount", {
            required: "กรุณากรอกจำนวนเงิน",
            min: {
              value: 100,
              message: "จำนวนเงินต้องมากกว่า 100 บาท",
            },
          })}
          error={errors.amount}
          placeholder="0.00"
          required
          prefix="฿"
        />

        {/* Description */}
        <Textarea
          label="หมายเหตุ"
          register={register("description")}
          placeholder="เพิ่มหมายเหตุเกี่ยวกับรายการนี้... (ไม่บังคับ)"
          rows={3}
        />

        {/* Image Upload */}
        <ImageUploadArea
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
          error={errors.images}
          acceptedFiles={uploadedImages.map((img) => img.file)}
        />

        {/* Image Preview Gallery */}
        <ImagePreviewGallery
          uploadedImages={uploadedImages}
          onDeleteImage={handleDeleteImage}
        />

        {/* Action Buttons */}
        <FormButtons
          isLoading={loading}
          onClose={handleClose}
          onSubmit={handleSubmit(handleFormSubmit)}
        />
      </form>
    </Modal>
  );
}
