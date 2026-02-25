"use client";

import { useState } from "react";

interface ThaiDatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
}

export function ThaiDatePicker({
  label,
  value,
  onChange,
}: ThaiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState(
    value ? new Date(value + "T00:00:00Z").getMonth() : new Date().getMonth(),
  );
  const [tempYear, setTempYear] = useState(
    value
      ? new Date(value + "T00:00:00Z").getFullYear()
      : new Date().getFullYear(),
  );

  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const weekDays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  // Format number as Arabic numerals
  const toThaiNumeral = (num: number): string => {
    return String(num);
  };

  // Get days in month
  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
  };

  // Format date for display
  const formatThaiDate = (isoDate: string): string => {
    if (!isoDate) return "-";
    const date = new Date(isoDate + "T00:00:00Z");
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Handle date selection
  const handleDateSelect = (day: number) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const isoDate = `${tempYear}-${pad(tempMonth + 1)}-${pad(day)}`;
    onChange(isoDate);
    setIsOpen(false);
  };

  // Generate calendar days
  const calendarDays = [];
  const daysInMonth = getDaysInMonth(tempMonth, tempYear);
  const firstDay = getFirstDayOfMonth(tempMonth, tempYear);

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Year range for selection
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <div className="relative z-50">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800 text-left bg-white hover:bg-slate-50 transition-colors flex items-center justify-between"
        >
          <span className="text-sm">
            {value ? formatThaiDate(value) : "เลือกวันที่"}
          </span>
          <i
            className={`fas fa-chevron-down text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}
          ></i>
        </button>

        {/* Calendar Picker */}
        {isOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-4 w-80 max-h-96 overflow-y-auto">
            {/* Month and Year Selectors */}
            <div className="flex gap-2 mb-4">
              <select
                value={tempMonth}
                onChange={(e) => setTempMonth(parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {thaiMonths.map((month, idx) => (
                  <option key={idx} value={idx}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={tempYear}
                onChange={(e) => setTempYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-slate-200 rounded text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {toThaiNumeral(year)}
                  </option>
                ))}
              </select>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-slate-600 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => day && handleDateSelect(day)}
                  disabled={!day}
                  className={`aspect-square text-sm font-medium rounded flex items-center justify-center transition-colors ${
                    !day
                      ? "text-slate-300 cursor-default"
                      : value &&
                          new Date(value + "T00:00:00Z").getDate() === day &&
                          tempMonth ===
                            new Date(value + "T00:00:00Z").getMonth() &&
                          tempYear ===
                            new Date(value + "T00:00:00Z").getFullYear()
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-slate-700 hover:bg-emerald-50 cursor-pointer"
                  }`}
                >
                  {day && toThaiNumeral(day)}
                </button>
              ))}
            </div>

            {/* Close Button */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                ยกเลิก
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors"
                >
                  ลบ
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
