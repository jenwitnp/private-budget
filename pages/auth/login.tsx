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
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative z-10 bg-white">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg mb-6">
            <i className="fa-solid fa-wallet text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            ยินดีต้อนรับกลับ!
          </h1>
          <p className="text-slate-500">
            กรุณาเข้าสู่ระบบเพื่อจัดการบัญชีของคุณ
          </p>
        </div>

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
                type="password"
                {...register("password", {
                  required: "กรุณากรอกรหัสผ่าน",
                })}
                className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                  errors.password
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-emerald-500"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                <i className="fa-regular fa-eye"></i>
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-slate-600"
              >
                จำฉันไว้ในระบบ
              </label>
            </div>
            <a
              href="#"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
            >
              ลืมรหัสผ่าน?
            </a>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            เข้าสู่ระบบ
          </Button>
        </form>

        {/* Social Login */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">
                หรือเข้าสู่ระบบด้วย
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm font-medium text-slate-700">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-medium text-slate-700">
                Facebook
              </span>
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          ยังไม่มีบัญชีใช่ไหม?{" "}
          <a
            href="#"
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
            สมัครสมาชิก
          </a>
        </p>
      </div>

      {/* Right Side - Decor */}
      <div className="hidden lg:flex relative w-1/2 bg-slate-900 overflow-hidden flex-col justify-center items-center text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-slate-900/90 z-10"></div>
        <img
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1951&q=80"
          alt="Money Background"
        />

        <div className="relative z-20 text-white px-12 text-center">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            จัดการการเงินของคุณ
            <br />
            ได้อย่างง่ายดาย
          </h2>
          <p className="text-lg text-slate-300 max-w-md mx-auto">
            ระบบถอนเงินที่รวดเร็ว ปลอดภัย และตรวจสอบได้ทุกขั้นตอน
            พร้อมทีมซัพพอร์ตตลอด 24 ชั่วโมง
          </p>

          <div className="mt-12 flex gap-4 justify-center">
            {[
              { value: "99.9%", label: "Uptime" },
              { value: "5m+", label: "Transactions" },
              { value: "24/7", label: "Support" },
            ].map((stat) => (
              <div
                key={stat.value}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10"
              >
                <div className="text-3xl font-bold text-emerald-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
