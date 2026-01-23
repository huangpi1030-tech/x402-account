/**
 * 规则列表组件
 * 对应 PRD 第 8.4 节：Rules 页面 - 规则列表展示
 */

"use client";

import { useState } from "react";
import { Rule } from "@/types";
import { useRuleStore } from "@/app/store/useRuleStore";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { CheckCircle2, XCircle, Edit, Trash2 } from "lucide-react";

export function RuleList() {
  const { rules, toggleRule, deleteRule } = useRuleStore();
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  const handleToggle = (ruleId: string) => {
    toggleRule(ruleId);
  };

  const handleDelete = (ruleId: string) => {
    if (confirm("确定要删除这条规则吗？")) {
      deleteRule(ruleId);
    }
  };

  if (rules.length === 0) {
    return (
      <EmptyState
        title="暂无规则"
        description="创建第一条规则来自动归类交易"
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
      {rules.map((rule) => (
        <div
          key={rule.rule_id}
          className="p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {rule.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    rule.enabled
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {rule.enabled ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      已启用
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      已禁用
                    </>
                  )}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  优先级: {rule.priority}
                </span>
              </div>
              {rule.description && (
                <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
              )}
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-gray-500">条件:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {rule.conditions.map((condition, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {condition.field} {condition.operator} {String(condition.value)}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">动作:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {rule.action.category && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        分类: {rule.action.category}
                      </span>
                    )}
                    {rule.action.project && (
                      <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        项目: {rule.action.project}
                      </span>
                    )}
                    {rule.action.cost_center && (
                      <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                        成本中心: {rule.action.cost_center}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRuleId(rule.rule_id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggle(rule.rule_id)}
              >
                {rule.enabled ? "禁用" : "启用"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(rule.rule_id)}
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
