export function InfoBox() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex gap-3">
        <div className="flex-shrink-0 text-lg">ℹ️</div>
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">ข้อมูลการถอนเงิน</p>
          <ul className="space-y-1 text-xs text-blue-800">
            <li>• การถอนเงินจะได้รับภายใน 1-2 วันทำการ</li>
            <li>• ค่าธรรมเนียมการถอนเงิน ฿5.00 ต่อครั้ง</li>
            <li>• เลือกบัญชีธนาคารที่ถูกต้องเพื่อหลีกเลี่ยงความผิดพลาด</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
