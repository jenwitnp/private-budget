export interface WithdrawButtonProps {
  onClick: () => void;
}

export function WithdrawButton({ onClick }: WithdrawButtonProps) {
  return (
    <>
      {/* Desktop - Regular Button */}
      <button
        onClick={onClick}
        className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-sm"
      >
        <i className="fa-solid fa-plus"></i>
        เบิกเงิน
      </button>

      {/* Mobile - Floating Action Button */}
      <button
        onClick={onClick}
        className="md:hidden fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl z-40"
      >
        <i className="fa-solid fa-plus"></i>
        เบิกเงิน
      </button>
    </>
  );
}
