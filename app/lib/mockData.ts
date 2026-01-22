/**
 * Mock 数据生成器
 * 基于 CanonicalRecord 类型生成测试数据
 * 对应 PRD 第 8.3 节：Canonical Record v2
 */

import {
  CanonicalRecord,
  TransactionStatus,
  Network,
} from "@/types";

/**
 * 生成 Mock CanonicalRecord 数据
 * 用于前端开发和测试
 */
export function generateMockTransactions(): CanonicalRecord[] {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      // ========== 关联与证据字段 ==========
      event_id: "550e8400-e29b-41d4-a716-446655440001",
      persistence_id: "persist-001",
      evidence_ref: "evidence-001",
      header_hashes_json: JSON.stringify({ hash1: "abc123", hash2: "def456" }),

      // ========== 业务识别字段 ==========
      merchant_domain: "api.heurist.ai",
      request_url: "https://api.heurist.ai/v1/chat",
      description: "Heurist AI API 调用",
      order_id: "order-heurist-001",

      // ========== 支付要素字段 ==========
      network: "base" as Network,
      asset_symbol: "USDC",
      decimals: 6,
      amount_base_units_str: "50000", // 0.05 USDC = 50000 (6 decimals)
      amount_decimal_str: "0.05",

      // ========== 角色地址字段 ==========
      payer_wallet: "0x1234567890123456789012345678901234567890",
      payee_wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      internal_wallet_alias: "研发部 Agent-01",
      wallet_entity_id: "entity-001",

      // ========== 链上凭证字段 ==========
      tx_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      paid_at: "2024-01-15T14:32:15Z",
      block_number: 12345678,
      verified_at: "2024-01-15T14:33:00Z",

      // ========== FX 与法币口径字段 ==========
      fx_fiat_currency: "USD",
      fx_rate: "1.0",
      fiat_value_at_time: "0.05",
      fx_source: "coinbase",
      fx_captured_at: "2024-01-15T14:32:16Z",

      // ========== 会计归类字段 ==========
      category: "研发支出-API费",
      project: "AI Agent 项目",
      cost_center: "研发部",
      rule_id_applied: "rule-001",

      // ========== 状态机与置信度字段 ==========
      status: TransactionStatus.ONCHAIN_VERIFIED,
      confidence: 95,
      needs_review_reason: undefined,

      // ========== 安全最小化字段 ==========
      signature_hash: "sig_hash_abc123",
      authorization_hash: "auth_hash_def456",

      // ========== 元数据字段 ==========
      created_at: "2024-01-15T14:32:10Z",
      updated_at: now,
    },
    {
      event_id: "550e8400-e29b-41d4-a716-446655440002",
      persistence_id: "persist-002",
      evidence_ref: "evidence-002",
      header_hashes_json: JSON.stringify({ hash1: "xyz789" }),

      merchant_domain: "openrouter.ai",
      request_url: "https://openrouter.ai/api/v1/chat",
      description: "OpenRouter API 调用",
      order_id: "order-openrouter-001",

      network: "base" as Network,
      asset_symbol: "USDC",
      decimals: 6,
      amount_base_units_str: "120000", // 0.12 USDC
      amount_decimal_str: "0.12",

      payer_wallet: "0x1234567890123456789012345678901234567890",
      payee_wallet: "0x9876543210987654321098765432109876543210",
      internal_wallet_alias: "研发部 Agent-01",

      tx_hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      paid_at: "2024-01-15T13:21:08Z",
      block_number: 12345670,
      verified_at: "2024-01-15T13:22:00Z",

      fx_fiat_currency: "USD",
      fx_rate: "1.0",
      fiat_value_at_time: "0.12",
      fx_source: "coinbase",
      fx_captured_at: "2024-01-15T13:21:09Z",

      category: "研发支出-API费",
      project: "AI Agent 项目",
      cost_center: "研发部",

      status: TransactionStatus.SETTLED,
      confidence: 85,

      signature_hash: "sig_hash_xyz789",
      authorization_hash: "auth_hash_abc123",

      created_at: "2024-01-15T13:21:05Z",
      updated_at: now,
    },
    {
      event_id: "550e8400-e29b-41d4-a716-446655440003",
      persistence_id: "persist-003",
      evidence_ref: "evidence-003",
      header_hashes_json: JSON.stringify({ hash1: "mno456" }),

      merchant_domain: "api.anthropic.com",
      request_url: "https://api.anthropic.com/v1/messages",
      description: "Anthropic Claude API 调用",

      network: "base" as Network,
      asset_symbol: "USDC",
      decimals: 6,
      amount_base_units_str: "80000", // 0.08 USDC
      amount_decimal_str: "0.08",

      payer_wallet: "0x1234567890123456789012345678901234567890",
      payee_wallet: "0x1111111111111111111111111111111111111111",
      internal_wallet_alias: "研发部 Agent-01",

      paid_at: "2024-01-15T12:15:42Z",

      fx_fiat_currency: "USD",
      fx_rate: "1.0",
      fiat_value_at_time: "0.08",
      fx_source: "coinbase",
      fx_captured_at: "2024-01-15T12:15:43Z",

      status: TransactionStatus.VERIFYING,
      confidence: 70,

      signature_hash: "sig_hash_mno456",

      created_at: "2024-01-15T12:15:40Z",
      updated_at: now,
    },
    {
      event_id: "550e8400-e29b-41d4-a716-446655440004",
      persistence_id: "persist-004",
      evidence_ref: "evidence-004",
      header_hashes_json: JSON.stringify({ hash1: "pqr123" }),

      merchant_domain: "unknown.example.com",
      request_url: "https://unknown.example.com/api",
      description: "未知服务",

      network: "base" as Network,
      asset_symbol: "USDC",
      decimals: 6,
      amount_base_units_str: "30000", // 0.03 USDC
      amount_decimal_str: "0.03",

      payee_wallet: "0x2222222222222222222222222222222222222222",
      internal_wallet_alias: "研发部 Agent-01",

      paid_at: "2024-01-15T11:05:23Z",

      fx_fiat_currency: "USD",
      fx_rate: "1.0",
      fiat_value_at_time: "0.03",
      fx_source: "coinbase",
      fx_captured_at: "2024-01-15T11:05:24Z",

      status: TransactionStatus.NEEDS_REVIEW,
      confidence: 45,
      needs_review_reason: "缺少 tx_hash，无法链上验证",

      signature_hash: "sig_hash_pqr123",

      created_at: "2024-01-15T11:05:20Z",
      updated_at: now,
    },
    {
      event_id: "550e8400-e29b-41d4-a716-446655440005",
      persistence_id: "persist-005",
      evidence_ref: "evidence-005",
      header_hashes_json: JSON.stringify({ hash1: "stu789" }),

      merchant_domain: "api.perplexity.ai",
      request_url: "https://api.perplexity.ai/chat/completions",
      description: "Perplexity API 调用",
      order_id: "order-perplexity-001",

      network: "base" as Network,
      asset_symbol: "USDC",
      decimals: 6,
      amount_base_units_str: "150000", // 0.15 USDC
      amount_decimal_str: "0.15",

      payer_wallet: "0x1234567890123456789012345678901234567890",
      payee_wallet: "0x3333333333333333333333333333333333333333",
      internal_wallet_alias: "研发部 Agent-01",

      tx_hash: "0x9876543210987654321098765432109876543210987654321098765432109876",
      paid_at: "2024-01-14T18:45:30Z",
      block_number: 12345650,
      verified_at: "2024-01-14T18:46:00Z",

      fx_fiat_currency: "USD",
      fx_rate: "1.0",
      fiat_value_at_time: "0.15",
      fx_source: "coinbase",
      fx_captured_at: "2024-01-14T18:45:31Z",

      category: "研发支出-API费",
      project: "AI Agent 项目",
      cost_center: "研发部",
      rule_id_applied: "rule-002",

      status: TransactionStatus.ACCOUNTED,
      confidence: 98,

      signature_hash: "sig_hash_stu789",
      authorization_hash: "auth_hash_xyz789",

      created_at: "2024-01-14T18:45:25Z",
      updated_at: yesterday,
    },
  ];
}
