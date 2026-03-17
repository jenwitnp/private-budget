import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Modal } from "@/components/ui/Modal";

interface ImageCropperProps {
  isOpen: boolean;
  imageFile: File | null;
  onClose: () => void;
  onCropComplete: (croppedCanvas: HTMLCanvasElement) => void;
}

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropper({
  isOpen,
  imageFile,
  onClose,
  onCropComplete,
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null);

  // Load image when file changes
  const handleImageLoad = useCallback(() => {
    if (!imageFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Load image when modal opens
  useEffect(() => {
    if (isOpen && imageFile) {
      handleImageLoad();
    }
  }, [isOpen, imageFile, handleImageLoad]);

  const onCropChange = (newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropAreaChange = (
    _: unknown,
    croppedAreaPixels: CroppedAreaPixels,
  ) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (err) => reject(err));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });
  };

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(
        image,
        croppedAreaPixels.x * scaleX,
        croppedAreaPixels.y * scaleY,
        croppedAreaPixels.width * scaleX,
        croppedAreaPixels.height * scaleY,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      );

      onCropComplete(canvas);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ตัดรูปโปรไฟล์" size="lg">
      <div className="flex flex-col h-full max-h-[80vh]">
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {!imageSrc && imageFile && (
            <div className="flex flex-col items-center justify-center h-80 bg-gray-100 rounded-lg">
              <i className="fa-solid fa-spinner fa-spin text-3xl text-gray-400 mb-3"></i>
              <p className="text-gray-600">กำลังโหลดรูปภาพ...</p>
            </div>
          )}

          {/* No Image Selected */}
          {!imageSrc && !imageFile && (
            <div className="flex flex-col items-center justify-center h-80 bg-gray-100 rounded-lg">
              <i className="fa-solid fa-image text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-500">ไม่มีรูปภาพที่เลือก</p>
            </div>
          )}

          {/* Crop Container */}
          {imageSrc && (
            <div className="space-y-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden h-80">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1} // Square aspect ratio
                  cropShape="round"
                  showGrid={true}
                  onCropChange={onCropChange}
                  onCropAreaChange={onCropAreaChange}
                  onZoomChange={onZoomChange}
                />
              </div>

              {/* Zoom Slider */}
              <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                <label className="text-sm font-medium text-gray-700 block">
                  ระดับการขยาย
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <p className="text-xs text-gray-600 text-right">
                  {zoom.toFixed(1)}x
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <i className="fa-solid fa-info-circle"></i>
                  ลากเพื่อเคลื่อนที่ • ใช้สไลเดอร์เพื่อขยาย
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions - Fixed at Bottom */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={() => {
              setImageSrc(null);
              setCrop({ x: 0, y: 0 });
              setZoom(1);
              onClose();
            }}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-times"></i>
            ยกเลิก
          </button>
          <button
            onClick={handleCropConfirm}
            disabled={!imageSrc || !croppedAreaPixels}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-check"></i>
            ตัดและใช้
          </button>
        </div>
      </div>
    </Modal>
  );
}
