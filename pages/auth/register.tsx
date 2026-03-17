"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useAppToast } from "@/hooks/useAppToast";
import { registerUserAction, checkUsernameAvailability } from "@/actions/auth";
import { ImageCropper } from "@/components/auth/ImageCropper";

interface RegisterFormData {
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    mode: "onChange",
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");

  const usernameValue = watch("username");

  // Check username availability
  const handleCheckUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    const result = await checkUsernameAvailability(username);
    setUsernameAvailable(result.available);
    setCheckingUsername(false);
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.showToast("กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง", "error");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.showToast("ขนาดของรูปภาพต้องน้อยกว่า 5MB", "error");
        return;
      }

      setSelectedImageFile(file);
      setShowImageCropper(true);
    }
  };

  // Handle crop complete - store cropped image locally (not upload yet)
  const handleCropComplete = (canvas: HTMLCanvasElement) => {
    // Convert canvas to blob and store as base64
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.showToast("เกิดข้อผิดพลาดในการประมวลผลรูปภาพ", "error");
        return;
      }

      // Convert blob to base64 and store in state
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setCroppedImage(base64); // Store base64 for preview, upload will happen on form submit
        setShowImageCropper(false);
        toast.showToast(
          "ตัดรูปภาพสำเร็จ จะอัปโหลดพร้อมกับการลงทะเบียน",
          "success",
        );
      };
      reader.readAsDataURL(blob);
    });
  };

  // Handle form submission
  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Validate username availability one more time
      if (!usernameAvailable) {
        toast.showToast("ชื่อผู้ใช้ไม่ว่างอยู่", "error");
        return;
      }

      setLoading(true);

      let avatarUrl: string | undefined;

      // Upload cropped image if it exists
      if (croppedImage && croppedImage.startsWith("data:")) {
        try {
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
            toast.showToast("ไม่สามารถอัปโหลดรูปภาพได้", "error");
            setLoading(false);
            return;
          }

          const uploadData = await uploadResponse.json();

          if (!uploadData.success || !uploadData.files?.[0]?.url) {
            toast.showToast("ไม่สามารถอัปโหลดรูปภาพได้", "error");
            setLoading(false);
            return;
          }

          avatarUrl = uploadData.files[0].url;
        } catch (error) {
          toast.showToast("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ", "error");
          setLoading(false);
          return;
        }
      }

      // Now register user with uploaded image
      const result = await registerUserAction({
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        password: data.password,
        avatarUrl: avatarUrl || undefined,
      });

      if (!result.success) {
        toast.showToast(result.error || "การลงทะเบียนล้มเหลว", "error");
        setLoading(false);
        return;
      }

      toast.showToast(result.message || "Registration successful!", "success");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "การลงทะเบียนล้มเหลว";
      toast.showToast(errorMessage, "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  bg-blue-900  flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-700 mb-2">
              สมัครสมาชิก
            </h1>
            <p className="text-gray-600">สร้างบัญชีของคุณเพื่อเริ่มต้น</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-3">
                {croppedImage ? (
                  <img
                    src={croppedImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center">
                    <i className="fa-solid fa-user text-3xl text-gray-400"></i>
                  </div>
                )}
                {/* Upload Badge */}
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
              <p className="text-xs text-gray-500">อัปโหลดรูปโปรไฟล์</p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อผู้ใช้ *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ระบุชื่อผู้ใช้"
                  {...register("username", {
                    required: "กรุณากรอกชื่อผู้ใช้",
                    minLength: {
                      value: 3,
                      message: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_-]+$/,
                      message:
                        "ชื่อผู้ใช้สามารถมีเฉพาะตัวอักษร ตัวเลข _ และ - เท่านั้น",
                    },
                  })}
                  onChange={(e) => handleCheckUsername(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.username
                      ? "border-red-300 focus:ring-red-500"
                      : usernameAvailable === true
                        ? "border-blue-300 focus:ring-blue-500"
                        : usernameAvailable === false
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {/* Username Status Icons */}
                {usernameValue.length >= 3 && (
                  <div className="absolute right-3 top-2.5">
                    {checkingUsername ? (
                      <i className="fa-solid fa-spinner fa-spin text-gray-400"></i>
                    ) : usernameAvailable ? (
                      <i className="fa-solid fa-check text-blue-500"></i>
                    ) : (
                      <i className="fa-solid fa-xmark text-red-500"></i>
                    )}
                  </div>
                )}
              </div>
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.username.message}
                </p>
              )}
              {usernameAvailable === false && !errors.username && (
                <p className="text-red-500 text-sm mt-1">
                  ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว
                </p>
              )}
              {usernameAvailable === true && (
                <p className="text-blue-600 text-sm mt-1">ชื่อผู้ใช้ว่างอยู่</p>
              )}
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อจริง *
              </label>
              <input
                type="text"
                placeholder="ระบุชื่อจริง"
                {...register("firstName", {
                  required: "กรุณากรอกชื่อจริง",
                  minLength: {
                    value: 2,
                    message: "ชื่อจริงต้องมีอย่างน้อย 2 ตัวอักษร",
                  },
                })}
                className={`w-full px-4 py-2 border ${
                  errors.firstName ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                นามสกุล *
              </label>
              <input
                type="text"
                placeholder="ระบุนามสกุล"
                {...register("lastName", {
                  required: "กรุณากรอกนามสกุล",
                  minLength: {
                    value: 2,
                    message: "นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร",
                  },
                })}
                className={`w-full px-4 py-2 border ${
                  errors.lastName ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทรศัพท์ *
              </label>
              <input
                type="tel"
                placeholder="ระบุเบอร์โทรศัพท์"
                {...register("phone", {
                  required: "กรุณากรอกเบอร์โทรศัพท์",
                  pattern: {
                    value: /^[0-9+\-\s().]+$/,
                    message: "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง",
                  },
                })}
                className={`w-full px-4 py-2 border ${
                  errors.phone ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  {...register("password", {
                    required: "กรุณากรอกรหัสผ่าน",
                    minLength: {
                      value: 8,
                      message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
                    },
                  })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <i
                    className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  ></i>
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ยืนยันรหัสผ่าน *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="ระบุรหัสผ่านอีกครั้ง"
                  {...register("confirmPassword", {
                    required: "กรุณายืนยันรหัสผ่าน",
                    validate: (value) =>
                      value === passwordValue || "รหัสผ่านไม่ตรงกัน",
                  })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.confirmPassword
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <i
                    className={`fa-regular ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}
                  ></i>
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || usernameAvailable !== true}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  กำลังลงทะเบียน...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-user-plus"></i>
                  สมัครสมาชิก
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              มีบัญชีอยู่แล้ว?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        isOpen={showImageCropper}
        imageFile={selectedImageFile}
        onClose={() => setShowImageCropper(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}

export const getServerSideProps = async () => {
  // Allow unauthenticated access to register page
  return {
    props: {},
  };
};
