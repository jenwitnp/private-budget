import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnBackdropClick?: boolean;
  isLoading?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  size = "md",
  closeOnBackdropClick = true,
  isLoading = false,
}: ModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't close if loading or if closeOnBackdropClick is disabled
    if (isLoading || !closeOnBackdropClick) return;

    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity ${
          isLoading ? "cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={handleBackdropClick}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`bg-white rounded-2xl shadow-xl ${sizeClasses[size]} w-full max-h-screen overflow-visible flex flex-col pointer-events-auto`}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {icon && <i className={`fa-solid ${icon} text-emerald-500`}></i>}
              {title}
            </h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`text-slate-400 text-2xl leading-none transition-colors ${
                isLoading
                  ? "cursor-not-allowed opacity-50"
                  : "hover:text-slate-600 cursor-pointer"
              }`}
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </>
  );
}
