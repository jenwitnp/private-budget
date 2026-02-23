interface FormButtonsProps {
  isLoading: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}

export function FormButtons({ isLoading, onClose }: FormButtonsProps) {
  return (
    <div className="flex gap-3 pt-6 border-t border-slate-200">
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ยกเลิก
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            กำลังประมวลผล...
          </>
        ) : (
          "ถอนเงิน"
        )}
      </button>
    </div>
  );
}
