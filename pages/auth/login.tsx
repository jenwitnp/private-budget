"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/form/Input";

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      username: "owner",
      password: "password123",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        console.error("❌ [LOGIN] Error:", result.error);
      } else if (result?.ok) {
        console.log("✅ [LOGIN] Success");
        router.push("/");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาด");
      console.error("❌ [LOGIN] Exception:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-blue-500 to-blue-400 flex items-center justify-center text-white shadow-lg mx-auto mb-6">
            <i className="fa-solid fa-wallet text-3xl"></i>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            ยินดีต้อนรับกลับ
          </h1>
          <p className="text-slate-500">
            กรุณาเข้าสู่ระบบเพื่อจัดการบัญชีของคุณ
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <i className="fa-solid fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            <Input
              label="ชื่อผู้ใช้"
              placeholder="owner"
              register={register("username", {
                required: "กรุณากรอกชื่อผู้ใช้",
              })}
              error={errors.username}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                รหัสผ่าน
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <i className="fa-solid fa-lock"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "กรุณากรอกรหัสผ่าน",
                  })}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200 focus:ring-blue-500"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i
                    className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  ></i>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-slate-600"
              >
                จำฉันไว้ในระบบ
              </label>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full">
              เข้าสู่ระบบ
            </Button>
          </form>
        </div>

        {/* Footer Description */}
        <p className="text-center text-sm text-slate-600 mt-6">
          ระบบเบิกเงิน ปลอดภัย และตรวจสอบได้ทุกขั้นตอน
        </p>
      </div>
    </div>
  );
}
