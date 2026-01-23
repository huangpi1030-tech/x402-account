/**
 * 规则匹配解释组件
 * 对应 PRD 第 10.1 节：可解释性（每笔显示"命中哪条规则/为何命中"）
 */

"use client";

import { RuleMatchResult } from "@/types";
import { CheckCircle2, XCircle } from "lucide-react";

interface RuleMatchExplanationProps {
  matchResults: RuleMatchResult[];
}

export function RuleMatchExplanation({
  matchResults,
}: RuleMatchExplanationProps) {
  const matchedRules = matchResults.filter((r) => r.matched);

  if (matchedRules.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">未命中任何规则</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matchedRules.map((result) => (
        <div
          key={result.rule_id}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900 mb-1">
                {result.rule_name}
              </h4>
              {result.match_reason && (
                <p className="text-sm text-green-800 mb-2">
                  {result.match_reason}
                </p>
              )}
              {result.matched_conditions.length > 0 && (
                <div className="space-y-1">
                  {result.matched_conditions.map((condition, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 text-xs"
                    >
                      {condition.matched ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400" />
                      )}
                      <span
                        className={
                          condition.matched
                            ? "text-green-800"
                            : "text-gray-500"
                        }
                      >
                        {condition.reason || `${condition.condition.field} ${condition.condition.operator} ${condition.condition.value}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
