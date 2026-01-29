/**
 * 钱包绑定表单组件
 * 对应 PRD 第 8.1 节：Onboarding 页面 - 钱包绑定流程
 */

"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { useConfigStore } from "@/app/store/useConfigStore";
import { useUIStore } from "@/app/store/useUIStore";
import { WalletConfig, UUID } from "@/types";
import { Loader2 } from "lucide-react";

export function WalletBindingForm() {
  const [address, setAddress] = useState("");
  const [alias, setAlias] = useState("");
  const [entityId, setEntityId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addWalletConfig } = useConfigStore();
  const { setSuccessMessage, setError } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证地址格式
    if (!address || !address.startsWith("0x") || address.length !== 42) {
      setError("请输入有效的以太坊地址（0x开头，42字符）");
      return;
    }

    setIsSubmitting(true);
    try {
      const walletConfig: WalletConfig = {
        wallet_address: address,
        alias: alias || address.slice(0, 10) + "...",
        entity_id: entityId ? (entityId as UUID) : undefined,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await addWalletConfig(walletConfig);

      setSuccessMessage("钱包绑定成功");
      setAddress("");
      setAlias("");
      setEntityId("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "钱包绑定失败"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="钱包地址"
        placeholder="0x..."
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
        helperText="请输入以太坊地址（0x开头，42字符）"
      />
      <Input
        label="别名"
        placeholder="例如：主钱包"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
      />
      <Input
        label="实体归属"
        placeholder="例如：Company A"
        value={entityId}
        onChange={(e) => setEntityId(e.target.value)}
        helperText="可选：用于多实体管理"
      />
      <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            绑定中...
          </>
        ) : (
          "绑定钱包"
        )}
      </Button>
    </form>
  );
}
