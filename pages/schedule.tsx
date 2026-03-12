"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import Layout from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/form/Input";
import { Select } from "@/components/form/Select";
import { Modal } from "@/components/ui/Modal";
import { ScheduleCard } from "@/components/ScheduleCard";
import { requireAuth } from "@/lib/auth/withAuth";
import { useAppToast } from "@/hooks/useAppToast";
import {
  useSchedulesByMonth,
  useSchedulesByDate,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
} from "@/hooks/useSchedules";
import {
  getDistrictsByProvince,
  getSubDistrictsByDistrict,
} from "@/server/districts.server";
import type {
  CreateScheduleInput,
  UpdateScheduleInput,
  Schedule,
} from "@/server/schedule.server";

interface FormData {
  scheduled_date: string;
  time_start?: string;
  time_end?: string;
  title?: string;
  address?: string;
  district_id?: string;
  sub_district_id?: string;
  note?: string;
  status: "active" | "completed" | "cancelled";
}

interface FormState {
  province: string;
  district: string;
}

const PROVINCES = ["หนองคาย"];

export default function SchedulePage() {
  const { data: session } = useSession();
  const toast = useAppToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [formState, setFormState] = useState<FormState>({
    province: PROVINCES[0],
    district: "",
  });
  const [districts, setDistricts] = useState<
    { id: string; name: string }[] | null
  >(null);
  const [subDistricts, setSubDistricts] = useState<
    { id: string; name: string }[] | null
  >(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      scheduled_date: new Date().toISOString().split("T")[0],
      status: "active",
      district_id: "",
      sub_district_id: "",
    },
  });

  // Register district_id and sub_district_id with validation
  useEffect(() => {
    register("district_id", {
      required: "กรุณาเลือกอำเภอ",
    });
    register("sub_district_id", {
      required: "กรุณาเลือกตำบล",
    });
  }, [register]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: schedulesByMonth = [], isLoading: monthLoading } =
    useSchedulesByMonth(year, month);
  const { data: schedulesByDate = [] } = useSchedulesByDate(
    selectedDate || new Date().toISOString().split("T")[0],
  );

  const createMutation = useCreateSchedule();
  const updateMutation = useUpdateSchedule(editingId || "");
  const deleteMutation = useDeleteSchedule("");

  // Load districts when province changes
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const data = await getDistrictsByProvince(formState.province);
        setDistricts(data.map((d) => ({ id: d.id.toString(), name: d.name })));
        setFormState((prev) => ({ ...prev, district: "" }));
        setSubDistricts(null);
      } catch (error) {
        console.error("Error loading districts:", error);
      }
    };
    loadDistricts();
  }, [formState.province]);

  // Load sub-districts when district changes
  useEffect(() => {
    const loadSubDistricts = async () => {
      if (formState.district) {
        try {
          console.log(
            "Loading sub-districts for district:",
            formState.district,
          );
          const data = await getSubDistrictsByDistrict(formState.district);
          console.log("Sub-districts loaded:", data);
          setSubDistricts(
            data.map((s) => ({ id: s.id.toString(), name: s.name })),
          );
        } catch (error) {
          console.error("Error loading sub-districts:", error);
          setSubDistricts([]);
        }
      } else {
        setSubDistricts(null);
      }
    };
    loadSubDistricts();
  }, [formState.district]);

  const handleMonthChange = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleOpenModal = (date?: string, schedule?: Schedule) => {
    if (schedule) {
      setEditingId(schedule.id);
      const districtIdStr = schedule.district_id?.toString() || "";
      // Update formState.district so sub-districts will load via useEffect
      setFormState((prev) => ({
        ...prev,
        district: districtIdStr,
      }));
      reset({
        scheduled_date: schedule.scheduled_date,
        time_start: schedule.time_start,
        time_end: schedule.time_end,
        title: schedule.title,
        address: schedule.address,
        district_id: districtIdStr,
        sub_district_id: schedule.sub_district_id?.toString(),
        note: schedule.note,
        status: schedule.status,
      });
    } else {
      setEditingId(null);
      reset({
        scheduled_date: date || new Date().toISOString().split("T")[0],
        status: "active",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: FormData) => {
    try {
      console.log("\n=== SCHEDULE FORM SUBMIT START ===");
      console.log("Form data received:", data);
      console.log("✅ district_id from form:", data.district_id);
      console.log("✅ sub_district_id from form:", data.sub_district_id);
      console.log("Current user ID:", (session?.user as any)?.id);
      console.log("Current user:", session?.user);

      const payload = {
        scheduled_date: data.scheduled_date,
        time_start: data.time_start || undefined,
        time_end: data.time_end || undefined,
        title: data.title || undefined,
        address: data.address || undefined,
        district_id: data.district_id || undefined,
        sub_district_id: data.sub_district_id || undefined,
        note: data.note || undefined,
        status: data.status,
      };

      console.log("Payload prepared:", payload);
      console.log("Edit mode:", !!editingId, "ID:", editingId);

      let result;
      if (editingId) {
        console.log("Calling updateMutation...");
        result = await updateMutation.mutateAsync(
          payload as UpdateScheduleInput,
        );
      } else {
        console.log("Calling createMutation...");
        result = await createMutation.mutateAsync(
          payload as CreateScheduleInput,
        );
      }

      console.log("Mutation result:", result);

      // Check if mutation was successful
      if (!result.success) {
        console.error("❌ Mutation failed:", result.error);
        toast.showToast(result.error || "เกิดข้อผิดพลาดในการบันทึก", "error");
        return;
      }

      // Show success message
      const successMessage = editingId
        ? "อัปเดตตารางการทำงานสำเร็จ"
        : "เพิ่มตารางการทำงานสำเร็จ";
      toast.showToast(successMessage, "success");
      console.log("Submit successful, closing modal");
      handleCloseModal();
    } catch (err) {
      console.error("❌ Error saving schedule:", err);
      const errorMessage =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบ";
      console.error("Error details:", {
        message: errorMessage,
        stack: (err as any)?.stack,
      });
      toast.showToast(errorMessage, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบการทำงานนี้ใช่หรือไม่?")) return;
    try {
      const { mutateAsync } = useDeleteSchedule(id);
      const result = await mutateAsync();

      if (!result.success) {
        console.error("❌ Delete failed:", result.error);
        toast.showToast(result.error || "เกิดข้อผิดพลาดในการลบ", "error");
        return;
      }

      toast.showToast("ลบตารางการทำงานสำเร็จ", "success");
    } catch (err) {
      console.error("Error deleting schedule:", err);
      const errorMessage =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบ";
      toast.showToast(errorMessage, "error");
    }
  };

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const calendarDays = [];
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const formatDateString = (day: number) => {
    return `${currentDate.getFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getDaySchedules = (day: number) => {
    const dateStr = formatDateString(day);
    return schedulesByMonth.filter((s) => s.scheduled_date === dateStr);
  };

  const getSchedulesByDateMap = () => {
    const map = new Map<string, Schedule[]>();
    schedulesByMonth.forEach((schedule) => {
      if (!map.has(schedule.scheduled_date)) {
        map.set(schedule.scheduled_date, []);
      }
      map.get(schedule.scheduled_date)!.push(schedule);
    });
    return map;
  };

  const monthName = currentDate.toLocaleString("th-TH", { month: "long" });
  const yearName = currentDate.getFullYear() + 543;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        {/* Title and View Toggle */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-slate-800">ตารางการทำงาน</h1>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("calendar")}
              className={`py-1.5 px-3 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                viewMode === "calendar"
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <i className="fa-solid fa-calendar"></i>
              <span className=" sm:inline">ปฎิทิน</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`py-1.5 px-3 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                viewMode === "list"
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <i className="fa-solid fa-bars"></i>
              <span className=" sm:inline">รายการ</span>
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-chevron-left text-slate-600"></i>
          </button>

          <div className="text-center flex-1">
            <p className="text-lg font-semibold text-slate-800">
              {monthName} {yearName}
            </p>
          </div>

          <button
            onClick={() => handleMonthChange(1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-chevron-right text-slate-600"></i>
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <>
          <Card className="mb-6">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 p-3 bg-slate-50 border-b border-slate-200">
              {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-slate-600 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1 p-3">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="aspect-square bg-slate-50 rounded"
                    ></div>
                  );
                }

                const dateStr = formatDateString(day);
                const daySchedules = getDaySchedules(day);
                const isSelected = selectedDate === dateStr;
                const isToday =
                  dateStr === new Date().toISOString().split("T")[0];

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`aspect-square rounded-lg p-2 text-center transition-colors relative flex flex-col items-center justify-center text-sm font-medium border-2 ${
                      isSelected
                        ? "bg-emerald-100 border-emerald-500"
                        : isToday
                          ? "bg-blue-50 border-blue-300"
                          : daySchedules.length > 0
                            ? "bg-orange-50 border-orange-300"
                            : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        isToday ? "text-blue-600 font-bold" : "text-slate-700"
                      }`}
                    >
                      {day}
                    </span>
                    {daySchedules.length > 0 && (
                      <span className="text-xs bg-orange-500 text-white px-1.5 rounded-full mt-0.5">
                        {daySchedules.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Add Schedule Button */}
          <div className="mb-6">
            <Button
              onClick={() =>
                handleOpenModal(
                  selectedDate || new Date().toISOString().split("T")[0],
                )
              }
              className="w-full"
            >
              <i className="fa-solid fa-plus"></i> เพิ่มตารางการทำงาน
            </Button>
          </div>

          {/* Schedule List for Selected Date */}
          {selectedDate && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                กำหนดการ:{" "}
                {new Date(selectedDate).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h2>

              {schedulesByDate.length === 0 ? (
                <Card className="text-center py-8 text-slate-500">
                  <i className="fa-solid fa-calendar-days text-2xl mb-2 mr-2 block"></i>
                  ไม่มีตารางการทำงานในวันนี้
                </Card>
              ) : (
                <div className="space-y-3">
                  {schedulesByDate.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      onEdit={handleOpenModal}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <>
          {/* Add Schedule Button */}
          <div className="mb-6">
            <Button
              onClick={() =>
                handleOpenModal(new Date().toISOString().split("T")[0])
              }
              className="w-full"
            >
              <i className="fa-solid fa-plus"></i> เพิ่มตารางการทำงาน
            </Button>
          </div>

          {/* All Schedules List */}
          <div className="space-y-6">
            {schedulesByMonth.length === 0 ? (
              <Card className="text-center py-8 text-slate-500">
                <i className="fa-solid fa-inbox text-3xl mb-3 block"></i>
                <p>ไม่มีตารางการทำงานในเดือนนี้</p>
              </Card>
            ) : (
              Array.from(getSchedulesByDateMap().entries())
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .map(([date, schedules]) => (
                  <div key={date}>
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 rounded-lg border-l-4 border-emerald-500 mb-3">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <i className="fa-solid fa-calendar-check text-emerald-600"></i>
                        {new Date(date).toLocaleDateString("th-TH", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                    </div>
                    <div className="space-y-2 mb-4">
                      {schedules.map((schedule) => (
                        <ScheduleCard
                          key={schedule.id}
                          schedule={schedule}
                          onEdit={handleOpenModal}
                          onDelete={handleDelete}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </>
      )}

      {/* Add/Edit Schedule Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingId ? "แก้ไขตารางการทำงาน" : "เพิ่มตารางการทำงาน"}
        size="md"
        isLoading={createMutation.isPending || updateMutation.isPending}
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
            options={PROVINCES.map((p) => ({ value: p, label: p }))}
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
            options={[
              { value: "active", label: "กำลังดำเนินการ" },
              { value: "completed", label: "เสร็จสิ้น" },
              { value: "cancelled", label: "ยกเลิก" },
            ]}
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
              onClick={handleCloseModal}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {createMutation.isPending || updateMutation.isPending ? (
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
    </Layout>
  );
}

export const getServerSideProps = requireAuth;
