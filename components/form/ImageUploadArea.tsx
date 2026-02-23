interface ImageUploadAreaProps {
  getRootProps: () => Record<string, any>;
  getInputProps: () => Record<string, any>;
  isDragActive: boolean;
  error?: any;
  acceptedFiles: File[];
}

export function ImageUploadArea({
  getRootProps,
  getInputProps,
  isDragActive,
  error,
  acceptedFiles,
}: ImageUploadAreaProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        อัปโหลดรูปภาพหลักฐาน <span className="text-red-500">*</span>
      </label>
      <div
        {...getRootProps()}
        className={`relative p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
          isDragActive
            ? "border-emerald-500 bg-emerald-50"
            : error
              ? "border-red-300 bg-red-50"
              : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
      >
        <input {...getInputProps()} />

        <div className="text-center">
          <div className="text-3xl mb-2">📷</div>
          <p className="text-slate-700 font-medium">
            {isDragActive
              ? "ปล่อยไฟล์ที่นี่..."
              : "ลากไฟล์มาที่นี่ หรือคลิกเพื่อเลือก"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            รองรับ JPG, PNG, WebP (สูงสุด 5MB ต่อไฟล์)
          </p>
        </div>

        {acceptedFiles.length > 0 && (
          <div className="mt-3 text-center text-sm text-emerald-600 font-medium">
            {acceptedFiles.length} ไฟล์เลือกไว้
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-2">
          {error.message || "กรุณาอัปโหลดรูปภาพ"}
        </p>
      )}
    </div>
  );
}
