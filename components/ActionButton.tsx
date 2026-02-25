interface ActionButtonProps {
  icon: string;
  label: string;
  isEnabled: boolean;
  isLoading: boolean;
  canPerform?: boolean; // Additional check for action validity
  statusColor: {
    bg: string;
    text: string;
  };
  status: string;
  action: string;
  onClick?: () => void;
}

export function ActionButton({
  icon,
  label,
  isEnabled,
  isLoading,
  statusColor,
  status,
  action,
  onClick,
}: ActionButtonProps) {
  if (isEnabled) {
    // Active/Enabled button
    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
          isLoading
            ? action === "approve"
              ? "bg-blue-600 text-white opacity-75"
              : action === "reject"
                ? "bg-red-600 text-white opacity-75"
                : "bg-emerald-600 text-white opacity-75"
            : action === "approve"
              ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
              : action === "reject"
                ? "bg-red-50 hover:bg-red-100 text-red-700"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={`Status: ${status}`}
      >
        {isLoading ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            กำลังดำเนินการ
          </>
        ) : (
          <>
            <i className={`fas ${icon}`}></i>
            {label}
          </>
        )}
      </button>
    );
  }

  // Disabled button with status color
  return (
    <button
      disabled
      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 ${statusColor.bg} ${statusColor.text} font-medium rounded-lg text-xs md:text-sm cursor-not-allowed opacity-50`}
      title={`Status: ${status} | Cannot ${action}`}
    >
      <i className={`fas ${icon}`}></i>
      {label}
    </button>
  );
}
