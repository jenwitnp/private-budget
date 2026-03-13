"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import Layout from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/form/Input";
import { Select } from "@/components/form/Select";
import { ScheduleFormModal } from "@/components/schedule/ScheduleFormModal";
import { ScheduleCard } from "@/components/schedule/ScheduleCard";
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
import { submitScheduleAction } from "@/actions/schedules";
import type {
  CreateScheduleInput,
  UpdateScheduleInput,
  Schedule,
} from "@/server/schedule.server";

export interface FormData {
  scheduled_date: string;
  time_start?: string;
  time_end?: string;
  title?: string;
  address?: string;
  district_id?: string;
  sub_district_id?: string;
  note?: string;
  status: "active" | "completed" | "cancelled";
  show_withdraw_form?: boolean;
  payment_method?: string;
  bankAccountId?: string;
  amount?: string;
}

export interface FormState {
  province: string;
  district: string;
}

export const PROVINCES = ["หนองคาย"];

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
      show_withdraw_form: false,
      payment_method: "",
      bankAccountId: "",
      amount: "",
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
  const { data: schedulesByDate = [], isLoading: schedulesByDateLoading } =
    useSchedulesByDate(selectedDate || new Date().toISOString().split("T")[0]);

  const createMutation = useCreateSchedule();
  const updateMutation = useUpdateSchedule(editingId || "");
  const deleteMutation = useDeleteSchedule();

  // Load districts when province changes
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const data = await getDistrictsByProvince(formState.province);
        setDistricts(data.map((d) => ({ id: d.id.toString(), name: d.name })));
        setFormState((prev) => ({ ...prev, district: "" }));
        setSubDistricts(null);
      } catch (error) {
        // Error loading districts
      }
    };
    loadDistricts();
  }, [formState.province]);

  // Load sub-districts when district changes
  useEffect(() => {
    const loadSubDistricts = async () => {
      if (formState.district) {
        try {
          const data = await getSubDistrictsByDistrict(formState.district);
          setSubDistricts(
            data.map((s) => ({ id: s.id.toString(), name: s.name })),
          );
        } catch (error) {
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
      const userId = (session?.user as any)?.id;
      if (!userId) {
        toast.showToast("User not authenticated", "error");
        return;
      }

      // Debug: Log form data before submission
      console.log("📝 FORM DATA BEFORE SUBMISSION:", {
        scheduled_date: data.scheduled_date,
        title: data.title,
        address: data.address,
        district_id: data.district_id,
        sub_district_id: data.sub_district_id,
        status: data.status,
        show_withdraw_form: data.show_withdraw_form,
        payment_method: data.payment_method,
        bankAccountId: data.bankAccountId,
        amount: data.amount,
      });

      // ============================================
      // NEW FLOW: Form Submit -> Schedule Action -> Log Request Data -> Server
      // ============================================
      const result = await submitScheduleAction(
        userId,
        data,
        editingId || undefined,
      );

      if (!result.success) {
        toast.showToast(result.error || "เกิดข้อผิดพลาดในการบันทึก", "error");
        return;
      }

      // Show success message
      const successMessage = editingId
        ? "อัปเดตตารางการทำงานสำเร็จ"
        : "เพิ่มตารางการทำงานสำเร็จ";
      toast.showToast(successMessage, "success");

      handleCloseModal();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบ";
      toast.showToast(errorMessage, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบการทำงานนี้ใช่หรือไม่?")) return;
    try {
      // Use the deleteMutation that was already created at the top level
      const result = await deleteMutation.mutateAsync(id);

      if (!result.success) {
        toast.showToast(result.error || "เกิดข้อผิดพลาดในการลบ", "error");
        return;
      }

      toast.showToast("ลบตารางการทำงานสำเร็จ", "success");
    } catch (err) {
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

              {schedulesByDateLoading ? (
                <Card className="text-center py-8">
                  <i className="fa-solid fa-spinner fa-spin text-2xl text-emerald-600 mb-3 block"></i>
                  <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
                </Card>
              ) : schedulesByDate.length === 0 ? (
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
      <ScheduleFormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={onSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        isEditing={!!editingId}
        register={register}
        handleSubmit={handleSubmit}
        watch={watch}
        setValue={setValue}
        errors={errors}
        formState={formState}
        setFormState={setFormState}
        districts={districts}
        subDistricts={subDistricts}
        provinces={PROVINCES}
      />
    </Layout>
  );
}

export const getServerSideProps = requireAuth;
