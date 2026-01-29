/**
 * 规则编辑器组件（Gmail-like 过滤器编辑器）
 * 对应 PRD 第 10.1 节：Gmail-like 过滤器规则
 */

"use client";

import { useState } from "react";
import { Rule, RuleCondition, RuleAction, RuleOperator, RuleConditionField } from "@/types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Modal } from "../ui/Modal";
import { useRuleStore } from "@/app/store/useRuleStore";
import { useUIStore } from "@/app/store/useUIStore";
import { Plus, X, Save, TestTube } from "lucide-react";
import { matchRule } from "@/app/lib/rules";
import { CanonicalRecord } from "@/types";

interface RuleEditorProps {
  rule?: Rule | null;
  onSave?: (rule: Rule) => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export function RuleEditor({ rule, onSave, onCancel, isSaving = false }: RuleEditorProps) {
  const [name, setName] = useState(rule?.name || "");
  const [description, setDescription] = useState(rule?.description || "");
  const [conditions, setConditions] = useState<RuleCondition[]>(
    rule?.conditions || []
  );
  const [action, setAction] = useState<RuleAction>(rule?.action || {});
  const [priority, setPriority] = useState(rule?.priority || 0);
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [testTransaction, setTestTransaction] = useState<string>("");
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { addRule, updateRule } = useRuleStore();
  const { setSuccessMessage, setError } = useUIStore();

  const conditionFieldOptions: Array<{ value: RuleConditionField; label: string }> = [
    { value: "domain", label: "域名" },
    { value: "merchant_domain", label: "商户域名" },
    { value: "path", label: "路径" },
    { value: "description", label: "描述" },
    { value: "amount", label: "金额" },
    { value: "network", label: "网络" },
    { value: "status", label: "状态" },
    { value: "asset_symbol", label: "资产符号" },
    { value: "order_id", label: "订单ID" },
  ];

  const operatorOptions: Array<{ value: RuleOperator; label: string }> = [
    { value: "equals", label: "等于" },
    { value: "not_equals", label: "不等于" },
    { value: "contains", label: "包含" },
    { value: "not_contains", label: "不包含" },
    { value: "matches", label: "匹配（支持通配符）" },
    { value: "not_matches", label: "不匹配" },
    { value: "greater_than", label: "大于" },
    { value: "less_than", label: "小于" },
    { value: "greater_or_equal", label: "大于等于" },
    { value: "less_or_equal", label: "小于等于" },
  ];

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        field: "domain",
        operator: "equals",
        value: "",
      },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (
    index: number,
    field: keyof RuleCondition,
    value: any
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = {
      ...newConditions[index],
      [field]: value,
    };
    setConditions(newConditions);
  };

  const handleTest = async () => {
    if (!testTransaction) {
      setError("请输入交易 ID 进行测试");
      return;
    }

    setIsTesting(true);
    try {
      // TODO: 从 store 获取交易记录进行测试
      // 这里使用 Mock 数据
      const mockTransaction: CanonicalRecord = {
        event_id: testTransaction as any,
        persistence_id: "test",
        evidence_ref: "test",
        header_hashes_json: "{}",
        merchant_domain: "example.com",
        request_url: "https://example.com/path",
        amount_decimal_str: "1.0",
        amount_base_units_str: "1000000",
        decimals: 6,
        asset_symbol: "USDC",
        network: "base",
        status: "detected" as any,
        payee_wallet: "0x" + "1".repeat(40),
        fx_fiat_currency: "USD",
        created_at: new Date().toISOString() as any,
        updated_at: new Date().toISOString() as any,
      };

      const testRule: Rule = {
        rule_id: rule?.rule_id || ("test" as any),
        name,
        description,
        conditions,
        action,
        priority,
        enabled,
        version: rule?.version || 1,
        created_at: rule?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = matchRule(testRule, mockTransaction);
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "测试失败");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError("请输入规则名称");
      return;
    }
    if (conditions.length === 0) {
      setError("请至少添加一个条件");
      return;
    }

    const newRule: Rule = {
      rule_id: rule?.rule_id || (`rule_${Date.now()}` as any),
      name: name.trim(),
      description: description.trim() || undefined,
      conditions,
      action,
      priority,
      enabled,
      version: rule ? rule.version + 1 : 1,
      created_at: rule?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (rule) {
      updateRule(rule.rule_id, newRule);
    } else {
      addRule(newRule);
    }

    setSuccessMessage(rule ? "规则更新成功" : "规则创建成功");
    onSave?.(newRule);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        {rule ? "编辑规则" : "创建规则"}
      </h2>

      {/* 基本信息 */}
      <div className="space-y-4">
        <Input
          label="规则名称"
          placeholder="例如：Heurist API 费用"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="规则描述"
          placeholder="可选：规则用途说明"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="优先级"
            type="number"
            value={priority.toString()}
            onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
            helperText="数字越大优先级越高"
          />
          <div className="flex items-center space-x-2 pt-8">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              启用规则
            </label>
          </div>
        </div>
      </div>

      {/* 条件列表 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-gray-900">条件（AND 关系）</h3>
          <Button variant="ghost" size="sm" onClick={handleAddCondition}>
            <Plus className="h-4 w-4 mr-1" />
            添加条件
          </Button>
        </div>
        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
            >
              <Select
                options={conditionFieldOptions}
                value={condition.field}
                onChange={(e) =>
                  handleConditionChange(
                    index,
                    "field",
                    e.target.value as RuleConditionField
                  )
                }
                className="flex-1"
              />
              <Select
                options={operatorOptions}
                value={condition.operator}
                onChange={(e) =>
                  handleConditionChange(
                    index,
                    "operator",
                    e.target.value as RuleOperator
                  )
                }
                className="flex-1"
              />
              <Input
                value={String(condition.value)}
                onChange={(e) =>
                  handleConditionChange(index, "value", e.target.value)
                }
                className="flex-1"
                placeholder="值"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCondition(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {conditions.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              点击"添加条件"开始构建规则
            </p>
          )}
        </div>
      </div>

      {/* 动作设置 */}
      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-4">动作</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="分类"
            placeholder="例如：研发支出-API费"
            value={action.category || ""}
            onChange={(e) =>
              setAction({ ...action, category: e.target.value || undefined })
            }
          />
          <Input
            label="项目"
            placeholder="例如：Project Alpha"
            value={action.project || ""}
            onChange={(e) =>
              setAction({ ...action, project: e.target.value || undefined })
            }
          />
          <Input
            label="成本中心"
            placeholder="例如：Engineering"
            value={action.cost_center || ""}
            onChange={(e) =>
              setAction({
                ...action,
                cost_center: e.target.value || undefined,
              })
            }
          />
          <Input
            label="商户别名"
            placeholder="例如：Heurist"
            value={action.vendor_alias || ""}
            onChange={(e) =>
              setAction({
                ...action,
                vendor_alias: e.target.value || undefined,
              })
            }
          />
        </div>
      </div>

      {/* 规则测试 */}
      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-4">规则测试</h3>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="输入交易 ID 进行测试"
            value={testTransaction}
            onChange={(e) => setTestTransaction(e.target.value)}
            className="flex-1"
          />
          <Button variant="secondary" onClick={handleTest} disabled={isTesting}>
            <TestTube className="h-4 w-4 mr-2" />
            {isTesting ? "测试中..." : "测试"}
          </Button>
        </div>
        {testResult && (
          <div
            className={`mt-3 p-3 rounded-lg ${
              testResult.matched
                ? "bg-green-50 border border-green-200"
                : "bg-gray-50 border border-gray-200"
            }`}
          >
            <p className="text-sm font-medium">
              {testResult.matched ? "✓ 匹配" : "✗ 不匹配"}
            </p>
            {testResult.match_reason && (
              <p className="text-xs text-gray-600 mt-1">
                {testResult.match_reason}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "保存中..." : (rule ? "更新规则" : "创建规则")}
        </Button>
      </div>
    </div>
  );
}
