/**
 * Toast 容器组件
 * 全局 Toast 提示系统
 * 对应 PRD 第 9.4 节：用户体验 - 操作反馈
 */

"use client";

import { useEffect, useState } from "react";
import { ToastContainer as ReactToastContainer, ToastType } from "./ui/Toast";
import { useUIStore } from "../store/useUIStore";

export function ToastContainer() {
  const { successMessage, error, setSuccessMessage, setError } = useUIStore();
  const [toasts, setToasts] = useState<
    Array<{ id: string; type: ToastType; message: string }>
  >([]);

  useEffect(() => {
    if (successMessage) {
      const id = `toast-${Date.now()}`;
      setToasts((prev) => [
        ...prev,
        { id, type: "success", message: successMessage },
      ]);
      setSuccessMessage(null);
    }
  }, [successMessage, setSuccessMessage]);

  useEffect(() => {
    if (error) {
      const id = `toast-${Date.now()}`;
      setToasts((prev) => [...prev, { id, type: "error", message: error }]);
      setError(null);
    }
  }, [error, setError]);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return <ReactToastContainer toasts={toasts} onClose={handleClose} />;
}
