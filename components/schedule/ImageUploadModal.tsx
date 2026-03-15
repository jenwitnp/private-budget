import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useAppToast } from "@/hooks/useAppToast";
import {
  uploadScheduleImagesAction,
  fetchScheduleImagesAction,
  deleteScheduleImageAction,
} from "@/actions/schedule-images";
import { FormErrorMessage } from "@/components/form/FormErrorMessage";
import { Modal } from "@/components/ui/Modal";
import type { Schedule } from "@/server/schedule.server";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  userId: string;
}

interface UploadedImage {
  preview: string;
  file: File;
}

interface StoredImage {
  id: string;
  url: string;
  filename: string;
  created_at: string;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  schedule,
  userId,
}: ImageUploadModalProps) {
  const { showToast } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [storedImages, setStoredImages] = useState<StoredImage[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  // Fetch existing images when modal opens
  useEffect(() => {
    if (isOpen && schedule.id) {
      fetchExistingImages();
    }
  }, [isOpen, schedule.id]);

  const fetchExistingImages = async () => {
    try {
      const result = await fetchScheduleImagesAction(schedule.id);
      if (result.success && result.images) {
        setStoredImages(result.images);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const imageFiles = acceptedFiles.filter((file) =>
        file.type.startsWith("image/"),
      );

      const totalImages =
        uploadedImages.length + storedImages.length + imageFiles.length;
      if (totalImages > 5) {
        setError(
          `สามารถอัปโหลดได้สูงสุด 5 รูปภาพ (ปัจจุบัน: ${uploadedImages.length + storedImages.length})`,
        );
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

  const handleDeleteUploadedImage = (index: number) => {
    setUploadedImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleDeleteStoredImage = async (imageId: string) => {
    try {
      setDeletingImageId(imageId);
      const result = await deleteScheduleImageAction(imageId);

      if (result.success) {
        setStoredImages((prev) => prev.filter((img) => img.id !== imageId));
        showToast("ลบรูปภาพสำเร็จ", "success");
      } else {
        showToast(result.message, "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการลบรูปภาพ", "error");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSubmit = async () => {
    if (uploadedImages.length === 0) {
      setError("กรุณาเลือกอย่างน้อยหนึ่งรูปภาพ");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get transaction ID if exists
      const transactionId = schedule.transaction_id || null;

      const result = await uploadScheduleImagesAction({
        scheduleId: schedule.id,
        transactionId, // Will be stored in DB only if not null
        userId,
        images: uploadedImages.map((img) => img.file),
      });

      if (result.success) {
        showToast(result.message, "success");

        // Update stored images to include newly uploaded ones
        if (result.images) {
          setStoredImages((prev) => [...result.images!, ...prev]);
        }

        // Clear uploaded images
        uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
        setUploadedImages([]);

        // Close modal after successful upload
        onClose();
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการอัปโหลด");
        showToast(result.error || "Upload failed", "error");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="อัพโหลดรูปภาพ"
      icon="fa-images"
      isLoading={loading}
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2.5 font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || uploadedImages.length === 0}
            className="px-4 py-2.5 font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? "กำลังอัพโหลด..." : "อัพโหลด"}
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
        {/* Error Message */}
        <FormErrorMessage error={error} />

        {/* Schedule Info */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            ตารางงาน: {schedule.title || schedule.scheduled_date}
          </p>
          {schedule.transaction_id && (
            <p className="text-xs text-blue-700 mt-1">
              ✓ เชื่อมโยงกับรายการเบิกเงิน: {schedule.transaction_number}
            </p>
          )}
        </div>

        {/* Existing Images */}
        {storedImages.length > 0 && (
          <div>
            <h3 className="font-medium text-slate-700 mb-3">
              รูปภาพที่อัพโหลดแล้ว ({storedImages.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {storedImages.map((image) => (
                <div
                  key={image.id}
                  className="relative group rounded-lg overflow-hidden bg-slate-100"
                >
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    onClick={() => handleDeleteStoredImage(image.id)}
                    disabled={deletingImageId === image.id}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    title="ลบรูปภาพ"
                  >
                    <i className="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {storedImages.length > 0 && uploadedImages.length > 0 && (
          <div className="border-t border-slate-200"></div>
        )}

        {/* Upload Area */}
        <div>
          <h3 className="font-medium text-slate-700 mb-3">เลือกรูปภาพใหม่</h3>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 hover:border-slate-400"
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="text-4xl mb-3 text-slate-400">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            {isDragActive ? (
              <p className="text-blue-600 font-medium">วางรูปภาพที่นี่</p>
            ) : (
              <>
                <p className="text-slate-700 font-medium mb-1">
                  ลากรูปภาพที่นี่ หรือคลิกเพื่อเลือก
                </p>
                <p className="text-xs text-slate-500">
                  ได้รับการสนับสนุน: JPG, PNG, GIF, WebP (ไม่เกิน 5MB ต่อรูป)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Image Preview Gallery */}
        {uploadedImages.length > 0 && (
          <div>
            <h3 className="font-medium text-slate-700 mb-3">
              รูปภาพใหม่ที่เลือก ({uploadedImages.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {uploadedImages.map((image, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden bg-slate-100"
                >
                  <img
                    src={image.preview}
                    alt={`preview-${index}`}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    onClick={() => handleDeleteUploadedImage(index)}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="ลบรูปภาพ"
                  >
                    <i className="fa-solid fa-trash text-sm"></i>
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {(image.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Limits Info */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <i className="fa-solid fa-info-circle mr-2"></i>
            สูงสุด 5 รูปภาพต่อตารางงาน
            {schedule.transaction_id &&
              ` (เชื่อมโยงกับรายการเบิกเงิน: ${schedule.transaction_number})`}
          </p>
        </div>
      </div>
    </Modal>
  );
}
