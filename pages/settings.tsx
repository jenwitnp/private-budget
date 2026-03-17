"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Layout from "@/components/layout/Layout";
import { useAppToast } from "@/hooks/useAppToast";
import { requireAuth } from "@/lib/auth/withAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/form/Input";
import { Modal } from "@/components/ui/Modal";
import { ImageCropper } from "@/components/auth/ImageCropper";
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
  const { showToast } = useAppToast();

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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Image upload state
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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
      showToast("อัปเดตการตั้งค่าสำเร็จ!", "success");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update settings";
      showToast(errorMessage, "error");
      console.error("Error updating settings:", err);
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast("กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง", "error");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("ขนาดรูปภาพต้องน้อยกว่า 5MB", "error");
        return;
      }

      setSelectedImageFile(file);
      setShowImageCropper(true);
    }
  };

  // Handle crop complete
  const handleCropComplete = (canvas: HTMLCanvasElement) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        showToast("เกิดข้อผิดพลาดในการประมวลผลรูปภาพ", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setCroppedImage(base64);
        setShowImageCropper(false);
        showToast("ตัดรูปภาพสำเร็จ", "success");
      };
      reader.readAsDataURL(blob);
    });
  };

  // Delete old image from GCP
  const deleteOldImage = async (imageUrl: string) => {
    try {
      const response = await fetch("/api/delete-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: imageUrl }),
      });

      if (!response.ok) {
        console.warn("Failed to delete old image from GCP");
      }
    } catch (error) {
      console.warn("Error deleting old image:", error);
    }
  };

  // Upload new image and update avatar
  const handleUploadAvatar = async () => {
    if (!croppedImage) return;

    try {
      setUploadingImage(true);

      // Upload to GCP
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: [croppedImage],
        }),
      });

      if (!uploadResponse.ok) {
        showToast("ไม่สามารถอัปโหลดรูปภาพได้", "error");
        setUploadingImage(false);
        return;
      }

      const uploadData = await uploadResponse.json();

      if (!uploadData.success || !uploadData.files?.[0]?.url) {
        showToast("ไม่สามารถอัปโหลดรูปภาพได้", "error");
        setUploadingImage(false);
        return;
      }

      const newImageUrl = uploadData.files[0].url;

      // Delete old image if it exists
      if (settings?.avatar_url) {
        await deleteOldImage(settings.avatar_url);
      }

      // Update user profile with new avatar URL
      await updateMutation.mutateAsync({
        ...settings,
        avatar_url: newImageUrl,
      });

      // Refresh session
      await updateSession();

      // Clear cropped image state
      setCroppedImage(null);

      showToast("อัปเดตรูปโปรไฟล์สำเร็จ!", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "ไม่สามารถอัปเดตรูปภาพได้";
      showToast(errorMessage, "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (data.new_password !== data.confirm_password) {
      showToast("รหัสผ่านไม่ตรงกัน!", "error");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      showToast("เปลี่ยนรหัสผ่านสำเร็จ!", "success");
      resetPassword();
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to change password";
      console.error("❌ Change password error:", errorMessage);
      showToast(errorMessage, "error");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Section */}
        <Card>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
            ข้อมูลส่วนตัว
          </h3>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {croppedImage ? (
                  <img
                    src={croppedImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                  />
                ) : settings?.avatar_url ? (
                  <img
                    src={settings.avatar_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-500 border-4 border-white shadow-md text-white text-4xl font-bold flex items-center justify-center">
                    {userInitial}
                  </div>
                )}
                {/* Camera Badge */}
                <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer transition-colors">
                  <i className="fa-solid fa-camera text-sm"></i>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-slate-600 font-medium">
                @{settings?.username}
              </p>

              {/* Upload button for cropped image */}
              {croppedImage && (
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setCroppedImage(null)}
                    className="flex-1 px-3 py-2 border border-slate-300 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleUploadAvatar}
                    disabled={uploadingImage}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {uploadingImage ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        กำลังอัปโหลด...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check"></i>
                        บันทึก
                      </>
                    )}
                  </button>
                </div>
              )}
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
          setShowCurrentPassword(false);
          setShowNewPassword(false);
          setShowConfirmPassword(false);
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
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
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
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                รหัสผ่านปัจจุบัน
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <i className="fa-solid fa-lock"></i>
                </span>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...registerPassword("current_password", {
                    required: "กรุณากรอกรหัสผ่านปัจจุบัน",
                  })}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                    passwordErrors.current_password
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200 focus:ring-emerald-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i
                    className={`fa-regular ${
                      showCurrentPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>
              {passwordErrors.current_password && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordErrors.current_password.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <i className="fa-solid fa-key"></i>
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...registerPassword("new_password", {
                    required: "กรุณากรอกรหัสผ่านใหม่",
                    minLength: {
                      value: 6,
                      message: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร",
                    },
                  })}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                    passwordErrors.new_password
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200 focus:ring-emerald-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i
                    className={`fa-regular ${
                      showNewPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>
              {passwordErrors.new_password && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordErrors.new_password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <i className="fa-solid fa-check"></i>
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...registerPassword("confirm_password", {
                    required: "กรุณายืนยันรหัสผ่าน",
                  })}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                    passwordErrors.confirm_password
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200 focus:ring-emerald-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i
                    className={`fa-regular ${
                      showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>
              {passwordErrors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordErrors.confirm_password.message}
                </p>
              )}
            </div>

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
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {changePasswordMutation.isPending
                  ? "กำลังเปลี่ยน..."
                  : "เปลี่ยนรหัสผ่าน"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Image Cropper Modal */}
      <ImageCropper
        isOpen={showImageCropper}
        imageFile={selectedImageFile}
        onClose={() => setShowImageCropper(false)}
        onCropComplete={handleCropComplete}
      />
    </Layout>
  );
}

export const getServerSideProps = requireAuth;
