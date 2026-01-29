/**
 * Rules 页面
 * 对应 PRD 第 8.4 节：Rules 页面
 */

"use client";

// React
import { useEffect, useState } from "react";

// Third-party
import { Plus, AlertCircle } from "lucide-react";

// Types
import { Rule } from "@/types";

// Components
import PageLayout from "../components/PageLayout";
import { Skeleton } from "../components/Skeleton";
import { RuleList, RuleEditor } from "../components/business";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

// Store
import { useRuleStore } from "../store/useRuleStore";
import { useUIStore } from "../store/useUIStore";

export default function RulesPage() {
  const { rules, isLoading, error, loadRules, addRule, updateRule } = useRuleStore();
  const { setSuccessMessage, setError: setUIError } = useUIStore();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleCreate = () => {
    setEditingRule(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  };

  const handleSave = async (rule: Rule) => {
    setIsSaving(true);
    try {
      if (editingRule) {
        await updateRule(rule.rule_id, rule);
        setSuccessMessage("规则更新成功");
      } else {
        await addRule(rule);
        setSuccessMessage("规则创建成功");
      }
      setIsEditorOpen(false);
      setEditingRule(null);
    } catch (err) {
      setUIError(err instanceof Error ? err.message : "保存规则失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditorOpen(false);
    setEditingRule(null);
  };

  // 显示错误状态
  if (error) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="primary" onClick={() => loadRules()}>
            重试
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">规则管理</h1>
            <p className="text-gray-600 mt-1">
              创建和管理规则来自动归类交易记录
            </p>
          </div>
          <Button variant="primary" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            创建规则
          </Button>
        </div>

        {/* Loading 状态 */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <RuleList onEdit={handleEdit} />
        )}

        {/* 规则编辑器弹窗 */}
        {isEditorOpen && (
          <Modal
            isOpen={isEditorOpen}
            onClose={handleCancel}
            title={editingRule ? "编辑规则" : "创建规则"}
            size="xl"
          >
            <RuleEditor
              rule={editingRule}
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={isSaving}
            />
          </Modal>
        )}
      </div>
    </PageLayout>
  );
}
