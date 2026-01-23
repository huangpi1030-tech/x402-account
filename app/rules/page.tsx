/**
 * Rules 页面
 * 对应 PRD 第 8.4 节：Rules 页面
 */

"use client";

import { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import { RuleList, RuleEditor } from "../components/business";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useRuleStore } from "../store/useRuleStore";
import { Rule } from "@/types";
import { Plus, GripVertical } from "lucide-react";

export default function RulesPage() {
  const { rules, loadRules, addRule, updateRule } = useRuleStore();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

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

  const handleSave = (rule: Rule) => {
    if (editingRule) {
      updateRule(rule.rule_id, rule);
    } else {
      addRule(rule);
    }
    setIsEditorOpen(false);
    setEditingRule(null);
  };

  const handleCancel = () => {
    setIsEditorOpen(false);
    setEditingRule(null);
  };

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

        <RuleList onEdit={handleEdit} />

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
            />
          </Modal>
        )}
      </div>
    </PageLayout>
  );
}
