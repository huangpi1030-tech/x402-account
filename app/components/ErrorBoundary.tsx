/**
 * 全局错误边界组件
 * 对应 PRD 第 9.2 节：错误处理
 */

"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/Button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary 捕获到错误:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              出现错误
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || "发生了未知错误"}
            </p>
            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <details className="text-left mb-4">
                <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                  错误详情
                </summary>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
            <div className="flex items-center justify-center space-x-3">
              <Button variant="primary" onClick={this.handleReset}>
                重试
              </Button>
              <Button
                variant="secondary"
                onClick={() => (window.location.href = "/")}
              >
                返回首页
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
