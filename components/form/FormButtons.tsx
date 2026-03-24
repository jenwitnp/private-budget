interface FormButtonsProps {
  isLoading: boolean;
  onClose: () => void;
  formId?: string;
}

export function FormButtons({ isLoading, onClose, formId }: FormButtonsProps) {
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
        form={formId}
        disabled={isLoading}
        className="flex-1 px-4 py-2.5 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            กำลังประมวลผล...
          </>
        ) : (
          "เบิกเงิน"
        )}
      </button>
    </div>
  );
}
