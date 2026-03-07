import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/form/Input";
import { Select } from "@/components/form/Select";
import { Modal } from "@/components/ui/Modal";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import type { Category } from "@/server/categories.server";

interface FormData {
  name: string;
  description?: string;
  color: string;
  display_order: number;
  status: "active" | "inactive";
}

export default function CategoriesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // React Query hooks
  const {
    data: categories = [],
    isLoading,
    error: fetchError,
  } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      color: "#64748B",
      display_order: 1,
      status: "active",
    },
  });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const colorValue = watch("color");

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      reset({
        name: category.name,
        description: category.description,
        color: category.color,
        display_order: category.display_order,
        status: category.status,
      });
    } else {
      setEditingId(null);
      reset({
        name: "",
        description: "",
        color: "#64748B",
        display_order: categories.length + 1,
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
      const submitData = {
        ...data,
        description: data.description || "",
      };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, input: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      handleCloseModal();
    } catch (err) {
      console.error("Error saving category:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete";
      setError(errorMsg);
    }
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <ProtectedRoute requiredPermission="create_user">
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />

        <div className="flex-1 flex flex-col">
          <Header />

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-slate-600">กำลังโหลดหมวดหมู่...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {fetchError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <i className="fa-solid fa-exclamation-circle mr-2"></i>
                Failed to load categories. Please try again.
              </div>
            )}

            {/* Content */}
            {!isLoading && !fetchError && (
              <>
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                      <i className="fa-solid fa-list text-blue-500"></i>
                      จัดการหมวดหมู่
                    </h1>
                    <p className="text-slate-600 mt-1">
                      {categories.length} หมวดหมู่
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-900 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span className="hidden sm:inline">เพิ่มหมวดหมู่</span>
                    <span className="sm:hidden">เพิ่ม</span>
                  </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="ค้นหาหมวดหมู่..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <i className="fa-solid fa-exclamation-circle mr-2"></i>
                    {error}
                  </div>
                )}

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Color Bar */}
                      <div
                        className="h-2"
                        style={{ backgroundColor: category.color }}
                      ></div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            {category.name}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              category.status === "active"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {category.status === "active"
                              ? "เปิดใช้"
                              : "ปิดใช้"}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 mb-3">
                          {category.description}
                        </p>

                        <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                          <i className="fa-solid fa-palette"></i>
                          <span>{category.color}</span>
                          <span>•</span>
                          <span>ลำดับที่ {category.display_order}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(category)}
                            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                          >
                            <i className="fa-solid fa-edit"></i>
                            <span className="hidden sm:inline">แก้ไข</span>
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={deleteMutation.isPending}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm font-medium disabled:opacity-50"
                          >
                            {deleteMutation.isPending ? (
                              <i className="fa-solid fa-spinner animate-spin"></i>
                            ) : (
                              <i className="fa-solid fa-trash"></i>
                            )}
                            <span className="hidden sm:inline">
                              {deleteMutation.isPending ? "กำลังลบ..." : "ลบ"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredCategories.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <i className="fa-solid fa-inbox text-4xl text-slate-300 mb-4 block"></i>
                    <p className="text-slate-500">ไม่พบหมวดหมู่</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
        size="md"
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Name */}
          <Input
            label="ชื่อหมวดหมู่"
            placeholder="เช่น ทั่วไป"
            register={register("name", {
              required: "กรุณากรอกชื่อหมวดหมู่",
            })}
            error={errors.name}
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              คำอธิบาย
            </label>
            <textarea
              {...register("description")}
              placeholder="เพิ่มคำอธิบาย..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              สี
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  {...register("color")}
                  className="h-10 w-16 rounded-lg border border-slate-200 cursor-pointer"
                />
              </div>
              <div className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm bg-slate-50 text-slate-600">
                {colorValue}
              </div>
            </div>
          </div>

          {/* Display Order */}
          <Input
            label="ลำดับการแสดงผล"
            type="number"
            placeholder="1"
            register={register("display_order", {
              valueAsNumber: true,
              min: {
                value: 1,
                message: "ลำดับต้องมากกว่า 0",
              },
            })}
            error={errors.display_order}
          />

          {/* Status */}
          <Select
            label="สถานะ"
            register={register("status")}
            options={[
              { value: "active", label: "เปิดใช้" },
              { value: "inactive", label: "ปิดใช้" },
            ]}
          />

          {/* Buttons */}
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
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "กำลังบันทึก..."
                : "บันทึก"}
            </button>
          </div>
        </form>
      </Modal>
    </ProtectedRoute>
  );
}
