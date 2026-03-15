import { useEffect, useState } from "react";
import { fetchScheduleImagesAction } from "@/actions/schedule-images";
import type { Schedule } from "@/server/schedule.server";

interface StoredImage {
  id: string;
  url: string;
  filename: string;
  created_at: string;
  uploader_first_name: string | null;
  uploader_last_name: string | null;
}

interface ImagesGalleryContentProps {
  schedule: Schedule;
  isLoading?: boolean;
  error?: Error | null;
}

export function ImagesGalleryContent({
  schedule,
  isLoading = false,
  error,
}: ImagesGalleryContentProps) {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [loading, setLoading] = useState(isLoading);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    fetchImages();
  }, [schedule.id]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const result = await fetchScheduleImagesAction(schedule.id);
      if (result.success && result.images) {
        setImages(result.images);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600">
          <i className="fa-solid fa-circle-exclamation text-3xl mb-2"></i>
          <p className="mt-2 font-medium">เกิดข้อผิดพลาดในการโหลดรูปภาพ</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block">
          <i className="fa-solid fa-spinner animate-spin text-3xl text-blue-600"></i>
          <p className="mt-3 text-slate-600">กำลังโหลดรูปภาพ...</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-slate-400">
          <i className="fa-solid fa-image text-4xl mb-2"></i>
          <p className="mt-2 font-medium">ไม่มีรูปภาพ</p>
          <p className="text-sm text-slate-500 mt-1">
            ยังไม่มีรูปภาพสำหรับตารางงานนี้
          </p>
        </div>
      </div>
    );
  }

  if (selectedImageIndex !== null) {
    const selectedImage = images[selectedImageIndex];
    return (
      <div className="p-6 space-y-4">
        {/* Lightbox View */}
        <div className="bg-slate-900 rounded-lg overflow-hidden">
          <img
            src={selectedImage.url}
            alt={selectedImage.filename}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>

        {/* Image Info */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div>
            <h3 className="font-medium text-slate-800 break-all">
              {selectedImage.filename}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {new Date(selectedImage.created_at).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Uploader Info */}
          {(selectedImage.uploader_first_name ||
            selectedImage.uploader_last_name) && (
            <div className="border-t border-slate-200 pt-3">
              <p className="text-xs font-medium text-slate-500 mb-1">
                <i className="fa-solid fa-user-circle mr-1"></i>
                ผู้อัพโหลด
              </p>
              <p className="text-sm text-slate-700 font-medium">
                {selectedImage.uploader_first_name}{" "}
                {selectedImage.uploader_last_name}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 justify-between items-center">
          <button
            onClick={() =>
              setSelectedImageIndex(
                selectedImageIndex === 0
                  ? images.length - 1
                  : selectedImageIndex - 1,
              )
            }
            className="px-4 py-2 text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-arrow-left"></i>
            ก่อนหน้า
          </button>

          <span className="text-sm font-medium text-slate-600">
            {selectedImageIndex + 1} / {images.length}
          </span>

          <button
            onClick={() =>
              setSelectedImageIndex(
                selectedImageIndex === images.length - 1
                  ? 0
                  : selectedImageIndex + 1,
              )
            }
            className="px-4 py-2 text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            ถัดไป
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={() => setSelectedImageIndex(null)}
          className="w-full px-4 py-2 text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
        >
          <i className="fa-solid fa-times mr-2"></i>
          ปิด
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Schedule Info */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-sm font-medium text-blue-900">
          <i className="fa-solid fa-calendar-days mr-2"></i>
          {schedule.title || schedule.scheduled_date}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          รวมทั้งหมด: <span className="font-bold">{images.length}</span> รูป
        </p>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedImageIndex(index)}
            className="group relative rounded-lg overflow-hidden bg-slate-100 aspect-square hover:shadow-lg transition-shadow"
          >
            <img
              src={image.url}
              alt={image.filename}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-magnifying-glass text-2xl"></i>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 space-y-1">
              <p className="text-xs text-white font-medium truncate">
                {index + 1}/{images.length}
              </p>
              {(image.uploader_first_name || image.uploader_last_name) && (
                <p className="text-xs text-white/90 truncate">
                  <i className="fa-solid fa-user-circle mr-1"></i>
                  {image.uploader_first_name} {image.uploader_last_name}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
