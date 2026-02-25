interface DisabledActionButtonProps {
  icon: string;
  label: string;
  statusColor: {
    bg: string;
    text: string;
  };
  status: string;
  action: string;
}

export function DisabledActionButton({
  icon,
  label,
  statusColor,
  status,
  action,
}: DisabledActionButtonProps) {
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
