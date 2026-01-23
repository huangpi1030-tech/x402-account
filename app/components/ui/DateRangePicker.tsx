/**
 * 日期范围选择组件
 * 复用 Tailwind CSS 设计语言
 */

"use client";

import { useState } from "react";
import { Calendar, X } from "lucide-react";
import { Input } from "./Input";

interface DateRangePickerProps {
  label?: string;
  startDate?: string;
  endDate?: string;
  onChange?: (startDate: string, endDate: string) => void;
  error?: string;
}

export function DateRangePicker({
  label,
  startDate: initialStartDate,
  endDate: initialEndDate,
  onChange,
  error,
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState(initialStartDate || "");
  const [endDate, setEndDate] = useState(initialEndDate || "");

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (onChange) {
      onChange(value, endDate);
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (onChange) {
      onChange(startDate, value);
    }
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    if (onChange) {
      onChange("", "");
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="pl-10"
            placeholder="开始日期"
          />
        </div>
        <span className="text-gray-500">至</span>
        <div className="flex-1 relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="pl-10"
            placeholder="结束日期"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="清除"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
