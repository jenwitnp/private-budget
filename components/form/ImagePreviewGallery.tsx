interface ImagePreviewGalleryProps {
  uploadedImages: Array<{
    preview: string;
    file: File;
  }>;
  onDeleteImage: (index: number) => void;
}

export function ImagePreviewGallery({
  uploadedImages,
  onDeleteImage,
}: ImagePreviewGalleryProps) {
  if (uploadedImages.length === 0) return null;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-3">
        ไฟล์ที่อัปโหลด ({uploadedImages.length})
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {uploadedImages.map((item, index) => (
          <div
            key={index}
            className="relative group rounded-lg overflow-hidden border border-slate-200"
          >
            <img
              src={item.preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-24 object-cover"
            />

            <button
              type="button"
              onClick={() => onDeleteImage(index)}
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg">
                ✕
              </span>
            </button>

            <div className="absolute top-1 right-1 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {(item.file.size / 1024 / 1024).toFixed(2)}MB
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
