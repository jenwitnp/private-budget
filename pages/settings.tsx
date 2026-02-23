"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/form/Input";
import { Modal } from "@/components/ui/Modal";
import {
  useUserSettings,
  useUpdateSettings,
  useChangePassword,
} from "@/hooks/useSettings";

interface SettingsFormData {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function SettingsPage() {
  const { status, data: session, update: updateSession } = useSession();
  const router = useRouter();
  const userId = (session?.user as any)?.id;

  // Settings form
  const {
    register: registerSettings,
    handleSubmit: handleSettingsSubmit,
    formState: { errors: settingsErrors },
    reset: resetSettings,
    watch: watchSettings,
  } = useForm<SettingsFormData>();

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm<PasswordFormData>();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Queries and mutations
  const { data: settings, isLoading } = useUserSettings(userId);
  const updateMutation = useUpdateSettings(userId);
  const changePasswordMutation = useChangePassword(userId);

  // Get user initial from first name or username
  const userInitial = (
    settings?.first_name?.[0] ||
    settings?.username?.[0] ||
    "?"
  ).toUpperCase();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (settings) {
      resetSettings({
        first_name: settings.first_name || "",
        last_name: settings.last_name || "",
        phone_number: settings.phone_number || "",
      });
    }
  }, [settings, resetSettings]);

  const onSettingsSubmit = async (data: SettingsFormData) => {
    try {
      await updateMutation.mutateAsync(data);
      // Refresh session to update user data
      await updateSession();
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (data.new_password !== data.confirm_password) {
      setPasswordMessage({
        type: "error",
        text: "รหัสผ่านใหม่ไม่ตรงกัน",
      });
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      setPasswordMessage({
        type: "success",
        text: "เปลี่ยนรหัสผ่านสำเร็จ",
      });
      resetPassword();
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: (err as Error).message || "เกิดข้อผิดพลาด",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Section */}
        <Card>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
            ข้อมูลส่วนตัว
          </h3>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full bg-emerald-500 border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-white text-4xl font-bold">
                {userInitial}
              </div>
              <p className="text-sm text-slate-600 font-medium">
                @{settings?.username}
              </p>
            </div>

            {/* Form */}
            <div className="flex-1 w-full">
              <form
                onSubmit={handleSettingsSubmit(onSettingsSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="ชื่อจริง"
                    placeholder="ชื่อจริง"
                    register={registerSettings("first_name")}
                    error={settingsErrors.first_name}
                  />
                  <Input
                    label="นามสกุล"
                    placeholder="นามสกุล"
                    register={registerSettings("last_name")}
                    error={settingsErrors.last_name}
                  />
                </div>
                <Input
                  label="เบอร์โทรศัพท์"
                  type="text"
                  placeholder="081-234-5678"
                  register={registerSettings("phone_number")}
                  error={settingsErrors.phone_number}
                />

                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending
                      ? "กำลังบันทึก..."
                      : "บันทึกการเปลี่ยนแปลง"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Card>

        {/* Security Section */}
        <Card>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
            ความปลอดภัย
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">รหัสผ่าน</p>
                <p className="text-sm text-slate-500">
                  เปลี่ยนรหัสผ่านของคุณเป็นระยะ
                </p>
              </div>
              <Button onClick={() => setShowPasswordModal(true)}>
                <i className="fa-solid fa-key mr-2"></i>
                เปลี่ยนรหัสผ่าน
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordMessage(null);
          resetPassword();
        }}
        title="เปลี่ยนรหัสผ่าน"
        size="md"
        isLoading={changePasswordMutation.isPending}
      >
        <div className="p-6 space-y-4">
          {passwordMessage && (
            <div
              className={`p-3 rounded-lg ${
                passwordMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <i
                className={`mr-2 ${
                  passwordMessage.type === "success"
                    ? "fa-solid fa-check-circle"
                    : "fa-solid fa-exclamation-circle"
                }`}
              ></i>
              {passwordMessage.text}
            </div>
          )}

          <form
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            <Input
              label="รหัสผ่านปัจจุบัน"
              type="password"
              placeholder="••••••••"
              register={registerPassword("current_password", {
                required: "กรุณากรอกรหัสผ่านปัจจุบัน",
              })}
              error={passwordErrors.current_password}
            />

            <Input
              label="รหัสผ่านใหม่"
              type="password"
              placeholder="••••••••"
              register={registerPassword("new_password", {
                required: "กรุณากรอกรหัสผ่านใหม่",
                minLength: {
                  value: 6,
                  message: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร",
                },
              })}
              error={passwordErrors.new_password}
            />

            <Input
              label="ยืนยันรหัสผ่านใหม่"
              type="password"
              placeholder="••••••••"
              register={registerPassword("confirm_password", {
                required: "กรุณายืนยันรหัสผ่าน",
              })}
              error={passwordErrors.confirm_password}
            />

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordMessage(null);
                  resetPassword();
                }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
              >
                {changePasswordMutation.isPending
                  ? "กำลังเปลี่ยน..."
                  : "เปลี่ยนรหัสผ่าน"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
