/**
 * Onboarding 页面
 * 对应 PRD 第 8.1 节：Onboarding 页面
 */

"use client";

// React & Next.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Third-party
import { CheckCircle2, Wallet, DollarSign, Server, Loader2, AlertCircle } from "lucide-react";

// Components
import PageLayout from "../components/PageLayout";
import { Skeleton } from "../components/Skeleton";
import { WalletBindingForm, WalletList } from "../components/business";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

// Store
import { useConfigStore } from "../store/useConfigStore";
import { useUIStore } from "../store/useUIStore";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fxCurrency, setFxCurrency] = useState("USD");
  const [rpcEndpoints, setRpcEndpoints] = useState([
    { url: "https://mainnet.base.org", priority: 10, enabled: true },
    { url: "https://base.publicnode.com", priority: 5, enabled: true },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const { walletConfigs, fxConfig, rpcPoolConfig, setFxConfig, setRpcPoolConfig, loadConfigs, isLoading: configLoading, error } = useConfigStore();
  const { setSuccessMessage, setError } = useUIStore();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await loadConfigs();
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载配置失败");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [loadConfigs, setError]);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // 完成初始化
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // 保存配置
      if (fxCurrency) {
        await setFxConfig({
          fiat_currency: fxCurrency,
          fx_source: "coinbase",
          updated_at: new Date().toISOString(),
        });
      }

      if (rpcEndpoints.length > 0) {
        await setRpcPoolConfig({
          strategy: "round_robin",
          retry_count: 3,
          timeout_ms: 5000,
          endpoints: rpcEndpoints.map((ep, idx) => ({
            url: ep.url,
            name: `RPC ${idx + 1}`,
            priority: ep.priority,
            enabled: ep.enabled,
            failure_rate: 0,
          })),
          updated_at: new Date().toISOString(),
        });
      }

      setSuccessMessage("初始化完成！");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存配置失败");
    } finally {
      setIsCompleting(false);
    }
  };

  const isStepComplete = (stepNum: number) => {
    switch (stepNum) {
      case 1:
        return walletConfigs.length > 0;
      case 2:
        return fxCurrency !== "";
      case 3:
        return rpcEndpoints.length > 0 && rpcEndpoints.every((ep) => ep.url);
      default:
        return false;
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-16 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageLayout>
    );
  }

  // 错误状态
  if (error) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎使用 X402 Account</h1>
          <p className="text-gray-600">请完成以下步骤以开始使用</p>
        </div>

        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step === stepNum
                      ? "border-blue-600 bg-blue-600 text-white"
                      : step > stepNum
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  {step > stepNum ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span className="font-semibold">{stepNum}</span>
                  )}
                </div>
                {stepNum < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > stepNum ? "bg-green-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-600">钱包绑定</span>
            <span className="text-xs text-gray-600">法币口径</span>
            <span className="text-xs text-gray-600">RPC 设置</span>
            <span className="text-xs text-gray-600">完成</span>
          </div>
        </div>

        {/* 步骤内容 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <Wallet className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">步骤 1: 钱包绑定</h2>
              </div>
              <p className="text-gray-600 mb-4">
                绑定您的钱包地址，用于追踪交易记录。您可以绑定多个钱包。
              </p>
              <WalletBindingForm />
              {walletConfigs.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">已绑定的钱包</h3>
                  <WalletList />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <DollarSign className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">步骤 2: 法币口径选择</h2>
              </div>
              <p className="text-gray-600 mb-4">
                选择用于报表的法币口径。默认使用 USD。
              </p>
              <Select
                label="法币口径"
                options={[
                  { value: "USD", label: "USD (美元)" },
                  { value: "CNY", label: "CNY (人民币)" },
                  { value: "EUR", label: "EUR (欧元)" },
                ]}
                value={fxCurrency}
                onChange={(e) => setFxCurrency(e.target.value)}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <Server className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">步骤 3: RPC 端点配置</h2>
              </div>
              <p className="text-gray-600 mb-4">
                配置 RPC 端点池，用于链上验证。建议至少配置 2-3 个端点以提高可靠性。
              </p>
              <div className="space-y-4">
                {rpcEndpoints.map((endpoint, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Input
                      value={endpoint.url}
                      onChange={(e) => {
                        const newEndpoints = [...rpcEndpoints];
                        newEndpoints[idx].url = e.target.value;
                        setRpcEndpoints(newEndpoints);
                      }}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={endpoint.priority.toString()}
                      onChange={(e) => {
                        const newEndpoints = [...rpcEndpoints];
                        newEndpoints[idx].priority = parseInt(e.target.value) || 0;
                        setRpcEndpoints(newEndpoints);
                      }}
                      placeholder="优先级"
                      className="w-24"
                    />
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={endpoint.enabled}
                        onChange={(e) => {
                          const newEndpoints = [...rpcEndpoints];
                          newEndpoints[idx].enabled = e.target.checked;
                          setRpcEndpoints(newEndpoints);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">启用</span>
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRpcEndpoints(rpcEndpoints.filter((_, i) => i !== idx));
                      }}
                    >
                      删除
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRpcEndpoints([
                      ...rpcEndpoints,
                      { url: "", priority: 5, enabled: true },
                    ]);
                  }}
                >
                  添加端点
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">步骤 4: 完成初始化</h2>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">初始化检查</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>
                        钱包绑定: {walletConfigs.length > 0 ? "✓ 已完成" : "✗ 未完成"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>法币口径: {fxCurrency ? "✓ 已设置" : "✗ 未设置"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>
                        RPC 配置: {rpcEndpoints.length > 0 ? "✓ 已完成" : "✗ 未完成"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">
                  所有配置已完成，点击"完成"按钮开始使用 X402 Account。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 导航按钮 */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            上一步
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={(step < 4 && !isStepComplete(step)) || isCompleting}
          >
            {isCompleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              step === 4 ? "完成" : "下一步"
            )}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
