"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Layout from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/form/Input";
import { Select } from "@/components/form/Select";
import { Modal } from "@/components/ui/Modal";
import { useAppToast } from "@/hooks/useAppToast";
import { requireAuth } from "@/lib/auth/withAuth";
import { useAuth } from "@/lib/providers/hooks/useAuthProvider";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/useUsers";
import type { CreateUserInput, UpdateUserInput } from "@/server/users.server";

interface FormData {
  username: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  password?: string;
  new_password?: string;
  role: "owner" | "admin" | "user";
  status: "active" | "inactive";
}

export default function UsersPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { session } = useAuth();
  const { showToast } = useAppToast();
  const currentUserRole = (session?.user as any)?.role;
  const isCurrentUserOwner = currentUserRole === "owner";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      username: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      password: "",
      new_password: "",
      role: "user",
      status: "active",
    },
  });

  const { data: users = [], isLoading, error: fetchError } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleOpenModal = (userId?: string) => {
    if (userId) {
      // Edit mode
      const user = users.find((u) => u.id === userId);
      if (user) {
        setEditingId(userId);
        setShowPassword(false);
        reset({
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: user.phone_number,
          role: user.role,
          status: user.status,
          new_password: "",
        });
      }
    } else {
      // Create mode - clear all fields
      setEditingId(null);
      setShowPassword(false);
      reset({
        username: "",
        first_name: "",
        last_name: "",
        phone_number: "",
        password: "",
        new_password: "",
        role: "user",
        status: "active",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setShowPassword(false);
    reset();
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editingId) {
        // Update user with optional password change
        const updateInput: UpdateUserInput = {
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number,
          role: data.role,
          status: data.status,
          ...(data.new_password && { password: data.new_password }),
        };
        console.log("📋 Updating user:", updateInput);
        await updateMutation.mutateAsync({ id: editingId, input: updateInput });
        showToast("อัปเดตผู้ใช้สำเร็จ!", "success");
      } else {
        // Create new user
        if (!data.password) {
          console.warn("Password is required for new user");
          showToast("กรุณากรอกรหัสผ่าน", "error");
          return;
        }
        const createInput: CreateUserInput = {
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number,
          password: data.password,
          role: data.role,
          status: data.status,
        };
        console.log("📋 Creating user:", createInput);
        await createMutation.mutateAsync(createInput);
        showToast("เพิ่มผู้ใช้สำเร็จ!", "success");
      }
      handleCloseModal();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      console.error("❌ Error saving user:", err);
      showToast(errorMessage, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast("ลบผู้ใช้สำเร็จ!", "success");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      console.error("Error deleting user:", err);
      showToast(errorMessage, "error");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-600">กำลังโหลกข้อมูล ผู้ใช้งาน...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (fetchError) {
    return (
      <Layout>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <i className="fa-solid fa-exclamation-circle mr-2"></i>
          ไม่สามารถโหลดข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">จัดการผู้ใช้</h1>
        <Button onClick={() => handleOpenModal()}>
          <i className="fa-solid fa-plus"></i> เพิ่มผู้ใช้ใหม่
        </Button>
      </div>

      {/* Users List - Mobile First Design */}
      {users.length === 0 && !isLoading ? (
        <Card>
          <div className="text-center py-12">
            <i className="fa-solid fa-inbox text-4xl text-slate-300 mb-4 block"></i>
            <p className="text-slate-500">
              ไม่มีผู้ใช้ เพิ่มผู้ใช้แรกของคุณเลย!
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile View - Card Layout */}
          <div className="grid gap-3 md:hidden">
            {users.map((user) => (
              <Card key={user.id} className="p-4 border border-slate-200">
                <div className="space-y-3">
                  {/* Avatar and Username */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                          {user.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{user.username}</p>
                      <p className="text-xs text-slate-500">
                        {user.first_name} {user.last_name}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        user.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.status === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
                    </span>
                  </div>

                  {/* Phone */}
                  {user.phone_number && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">เบอร์โทรศัพท์</p>
                      <p className="text-slate-700">{user.phone_number}</p>
                    </div>
                  )}

                  {/* Role */}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">บทบาท</p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "owner"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "admin"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {user.role === "owner"
                        ? "เจ้าของ"
                        : user.role === "admin"
                          ? "ผู้ดูแลระบบ"
                          : "ผู้ใช้"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => handleOpenModal(user.id)}
                      className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-edit"></i>
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-trash"></i>
                      ลบ
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop View - Table Layout */}
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700"></th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        ชื่อผู้ใช้
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        ชื่อจริง
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        เบอร์โทรศัพท์
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        บทบาท
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                              {user.username[0].toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {user.phone_number}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === "owner"
                                ? "bg-purple-100 text-purple-700"
                                : user.role === "admin"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {user.role === "owner"
                              ? "เจ้าของ"
                              : user.role === "admin"
                                ? "ผู้ดูแลระบบ"
                                : "ผู้ใช้"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {user.status === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm flex gap-2">
                          <button
                            onClick={() => handleOpenModal(user.id)}
                            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            title="แก้ไข"
                          >
                            <i className="fa-solid fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
                            title="ลบ"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingId ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
        size="md"
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input
            label="ชื่อผู้ใช้"
            placeholder="owner"
            register={register("username", {
              required: "กรุณากรอกชื่อผู้ใช้",
            })}
            error={errors.username}
          />

          <Input
            label="ชื่อจริง"
            placeholder="ชื่อจริง"
            register={register("first_name")}
            error={errors.first_name}
          />

          <Input
            label="นามสกุล"
            placeholder="นามสกุล"
            register={register("last_name")}
            error={errors.last_name}
          />

          <Input
            label="เบอร์โทรศัพท์"
            placeholder="0812345678"
            register={register("phone_number")}
            error={errors.phone_number}
          />

          {!editingId && (
            <Input
              label="รหัสผ่าน"
              type="password"
              placeholder="••••••••"
              register={register("password", {
                required: "กรุณากรอกรหัสผ่าน",
              })}
              error={errors.password}
            />
          )}

          {editingId && isCurrentUserOwner && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                เปลี่ยนรหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="ปล่อยว่างหากไม่ต้องการเปลี่ยน"
                  {...register("new_password")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                  title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  <i
                    className={`fa-solid ${
                      showPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>
              {errors.new_password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.new_password.message}
                </p>
              )}
            </div>
          )}

          {editingId && !isCurrentUserOwner && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <i className="fa-solid fa-lock"></i>
                เฉพาะผู้ใช้ที่มีบทบาท "เจ้าของ"
                เท่านั้นที่สามารถเปลี่ยนรหัสผ่านได้
              </p>
            </div>
          )}

          <Select
            label="บทบาท"
            register={register("role")}
            options={[
              { value: "user", label: "ผู้ใช้" },
              { value: "admin", label: "ผู้ดูแลระบบ" },
              { value: "owner", label: "เจ้าของ" },
            ]}
          />

          <Select
            label="สถานะ"
            register={register("status")}
            options={[
              { value: "active", label: "ใช้งาน" },
              { value: "inactive", label: "ไม่ใช้งาน" },
            ]}
          />

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "กำลังบันทึก..."
                : "บันทึก"}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

export const getServerSideProps = requireAuth;
