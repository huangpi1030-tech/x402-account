/**
 * 钱包列表组件
 * 对应 PRD 第 8.1 节：Onboarding 页面 - 钱包绑定流程
 */

"use client";

import { WalletConfig } from "@/types";
import { useConfigStore } from "@/app/store/useConfigStore";
import { Button } from "../ui/Button";
import { AddressDisplay } from "../ui/AddressDisplay";
import { EmptyState } from "../ui/EmptyState";
import { Wallet, Edit, Trash2 } from "lucide-react";

export function WalletList() {
  const { walletConfigs, deleteWalletConfig } = useConfigStore();

  const handleDelete = (address: string) => {
    if (confirm("确定要删除这个钱包吗？")) {
      deleteWalletConfig(address);
    }
  };

  if (walletConfigs.length === 0) {
    return (
      <EmptyState
        title="暂无钱包"
        description="请先绑定钱包地址"
        icon={<Wallet className="h-12 w-12 text-gray-400" />}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
      {walletConfigs.map((wallet) => (
        <div
          key={wallet.wallet_address}
          className="p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {wallet.alias || "未命名钱包"}
                </h3>
                {wallet.entity_id && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    {wallet.entity_id}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">地址:</span>
                  <AddressDisplay address={wallet.wallet_address} />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(wallet.wallet_address)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
