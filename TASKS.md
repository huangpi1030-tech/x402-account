# X402 Account 前端开发任务清单

基于 PRD v1.0（金融级严谨增强版）拆解的前端开发任务，按依赖关系排序。

---

## 阶段一：基础架构与类型定义（Foundation）

### 1.1 TypeScript 类型系统
- [ ] 定义状态机类型：`TransactionStatus`（pending, detected, settled, verifying, onchain_verified, needs_review, accounted）
- [ ] 定义精度安全类型：`BigIntString`, `DecimalString`（用于金额字段）
- [ ] 定义网络类型：`Network`（Base, Ethereum 等）
- [ ] 定义资产类型：`AssetSymbol`, `Decimals`
- [ ] 定义时间戳类型：`ISODateTime`, `UnixTimestamp`

### 1.2 Canonical Schema v2 核心类型
- [ ] 定义 `CanonicalRecord` 接口（包含所有字段组）
  - [ ] 关联与证据字段：`event_id`, `persistence_id`, `evidence_ref`, `header_hashes_json`
  - [ ] 业务识别字段：`merchant_domain`, `request_url`, `description`, `order_id`
  - [ ] 支付要素字段：`network`, `asset_symbol`, `decimals`, `amount_base_units_str`, `amount_decimal_str`
  - [ ] 角色地址字段：`payer_wallet`, `payee_wallet`, `internal_wallet_alias`
  - [ ] 链上凭证字段：`tx_hash`, `paid_at`, `block_number`, `verified_at`
  - [ ] FX 与法币口径字段：`fx_fiat_currency`, `fx_rate`, `fiat_value_at_time`, `fx_source`, `fx_captured_at`
  - [ ] 会计归类字段：`category`, `project`, `cost_center`, `rule_id_applied`
  - [ ] 状态机与置信度字段：`status`, `confidence`, `needs_review_reason`
  - [ ] 安全最小化字段：`signature_hash`, `authorization_hash`

### 1.3 数据治理相关类型
- [ ] 定义 `WalletEntity` 类型（钱包实体归属）
- [ ] 定义 `FxSnapshot` 类型（汇率快照）
- [ ] 定义 `AuditLog` 类型（审计日志：before/after, operator, timestamp, reason）
- [ ] 定义 `RawEvidence` 类型（WAL 原始证据）

### 1.4 规则引擎类型
- [ ] 定义 `RuleCondition` 类型（domain/path/description/amount/network/status 等条件）
- [ ] 定义 `RuleAction` 类型（设置 category/project/cost_center/vendor_alias）
- [ ] 定义 `Rule` 类型（包含条件、动作、优先级、版本号）
- [ ] 定义 `RuleMatchResult` 类型（命中规则、解释原因）

### 1.5 报表相关类型
- [ ] 定义 `MonthlyStatement` 类型（Executive Summary, Vendor Breakdown, Category/Cost Center, Exceptions, Gap Analysis）
- [ ] 定义 `Receipt` 类型（单笔收据）
- [ ] 定义 `GapAnalysis` 类型（漏抓率、可疑支出列表）

### 1.6 配置与设置类型
- [ ] 定义 `WalletConfig` 类型（钱包绑定、别名、实体归属）
- [ ] 定义 `FxConfig` 类型（法币口径、FX 来源）
- [ ] 定义 `RpcPoolConfig` 类型（RPC 端点池配置）
- [ ] 定义 `AllowlistConfig` 类型（Header 白名单、站点白名单）

---

## 阶段二：工具函数与精度安全（Utilities）

### 2.1 精度计算工具
- [ ] 安装并配置 `decimal.js` 库
- [ ] 实现 `BigInt` 与 `Decimal` 转换工具函数
- [ ] 实现金额格式化函数（避免科学计数法）
- [ ] 实现金额计算函数（加法、减法、乘法，使用 Decimal）
- [ ] 实现精度验证函数（确保金额字段符合精度要求）

### 2.2 状态机工具
- [ ] 实现状态转换验证函数（检查状态转换是否合法）
- [ ] 实现状态转换函数（根据业务逻辑转换状态）
- [ ] 实现状态显示工具（状态到中文标签的映射）

### 2.3 置信度计算工具
- [ ] 实现时间差衰减算法（`Δt = http_time - block_time`，超过 5 分钟降权）
- [ ] 实现多命中惩罚算法（同一时间窗多条 Transfer 降权）
- [ ] 实现字段缺失惩罚算法（缺字段降权）
- [ ] 实现置信度阈值判断（`confidence < 60` 进入 needs_review）

### 2.4 数据格式化工具
- [ ] 实现地址脱敏函数（显示前 6 位 + 后 4 位）
- [ ] 实现时间格式化函数（ISO 转本地时间显示）
- [ ] 实现金额显示函数（带货币符号、千分位）
- [ ] 实现哈希截断函数（显示前 8 位 + 后 4 位）

### 2.5 Persistence Id 生成工具
- [ ] 实现 `generatePersistenceId` 函数（SHA256 哈希生成）
- [ ] 实现幂等键生成函数（`persistence_id + stage + header_hash`）

---

## 阶段三：本地存储与加密（Storage）

### 3.1 IndexedDB 封装
- [ ] 实现 IndexedDB 初始化函数
- [ ] 实现数据存储接口（WAL、Canonical、Audit Log）
- [ ] 实现数据查询接口（按 event_id、persistence_id、时间范围查询）
- [ ] 实现数据索引（支持多字段查询）
- [ ] 实现数据迁移函数（版本升级）

### 3.2 加密存储层
- [ ] 实现密钥派生函数（KDF，基于用户口令或本机随机种子）
- [ ] 实现数据加密函数（透明加密）
- [ ] 实现数据解密函数
- [ ] 实现敏感字段脱敏存储（只存 hash/截断）

### 3.3 状态管理（State Management）
- [ ] 选择状态管理方案（Zustand 或 Context API）
- [ ] 实现交易记录状态管理（列表、筛选、分页）
- [ ] 实现规则引擎状态管理（规则列表、当前编辑规则）
- [ ] 实现配置状态管理（钱包配置、FX 配置、RPC 配置）
- [ ] 实现 UI 状态管理（加载状态、错误状态、选中项）

---

## 阶段四：API 接口与数据同步（API Layer）

### 4.1 API 接口定义
- [ ] 定义 `syncRawEvidence()` 接口（Extension → Web App，上传 WAL）
- [ ] 定义 `syncCanonical()` 接口（Extension/Web → Supabase，幂等写入）
- [ ] 定义 `fetchAllowlistConfig()` 接口（Extension ← Web App，拉取白名单）
- [ ] 定义 `requestVerify()` 接口（Web App → Verifier，触发验证）
- [ ] 定义 `getFxSnapshot()` 接口（Web App → FX Service，获取汇率）

### 4.2 Mock 数据服务（开发阶段）
- [ ] 实现 Mock Canonical 数据生成器（生成测试交易记录）
- [ ] 实现 Mock 规则数据生成器
- [ ] 实现 Mock 报表数据生成器
- [ ] 实现 Mock API 响应（模拟后端接口）

### 4.3 数据同步逻辑
- [ ] 实现幂等写入逻辑（基于 event_id 去重）
- [ ] 实现增量同步逻辑（只同步新数据）
- [ ] 实现冲突处理逻辑（并发写入冲突解决）
- [ ] 实现重试机制（失败自动重试）

---

## 阶段五：核心功能模块（Core Features）

### 5.1 规则引擎（Rules Engine）
- [ ] 实现规则条件匹配函数（domain/path/description/amount/network/status）
- [ ] 实现规则优先级排序（支持优先级字段）
- [ ] 实现规则冲突检测（多规则命中时提示）
- [ ] 实现规则批量应用函数（对历史交易批量归类）
- [ ] 实现规则版本化（规则变更产生版本号）
- [ ] 实现规则可解释性（返回命中原因）

### 5.2 链上验证模块（On-chain Verifier）
- [ ] 实现 RPC 池管理（至少 2-3 个端点，轮询/熔断/重试）
- [ ] 实现 RPC 故障切换逻辑（按失败率动态降权）
- [ ] 实现 tx_hash 验证函数（查询链上交易）
- [ ] 实现链上归因函数（无 tx_hash 时的归因逻辑）
- [ ] 实现验证结果缓存（TTL 缓存，避免重复请求）
- [ ] 实现批量验证任务队列

### 5.3 数据治理模块（Data Governance）
- [ ] 实现 FX Snapshot 采集逻辑（获取交易时刻汇率）
- [ ] 实现法币价值计算（`amount_decimal * fx_rate`）
- [ ] 实现钱包归属标签管理（多钱包实体归属）
- [ ] 实现审计日志记录（append-only，记录所有修改）
- [ ] 实现审计日志查询（按时间、操作类型查询）

### 5.4 报表生成模块（Report Generator）
- [ ] 安装并配置 `@react-pdf/renderer`
- [ ] 实现月度 Statement PDF 模板
  - [ ] Executive Summary 章节（总支出、Top Vendor、Top Category、漏抓率）
  - [ ] Vendor Breakdown 章节（按 vendor/domain 汇总）
  - [ ] Category/Cost Center 章节（按科目/部门汇总）
  - [ ] Exceptions 章节（needs_review、unmatched、校验失败）
  - [ ] Gap Analysis 章节（未捕获链上支出列表）
- [ ] 实现单笔 Receipt PDF 模板
- [ ] 实现 CSV 导出功能（明细数据，无科学计数法）
- [ ] 实现报表版本化（引用规则版本与 FX 口径）

### 5.5 Gap Analysis 模块
- [ ] 实现链上 Transfer Events 获取（钱包全量交易）
- [ ] 实现漏抓检测逻辑（对比链上交易 vs 插件捕获）
- [ ] 实现漏抓率计算
- [ ] 实现可疑支出列表生成

---

## 阶段六：UI 基础组件（UI Components）

### 6.1 布局组件
- [ ] 实现 `Header` 组件（标题栏，已完成）
- [ ] 实现 `Sidebar` 组件（侧边导航）
- [ ] 实现 `PageLayout` 组件（页面布局容器）

### 6.2 表单组件
- [ ] 实现 `SearchBar` 组件（搜索框，已完成）
- [ ] 实现 `FilterPanel` 组件（筛选面板：状态、时间、金额范围）
- [ ] 实现 `Input` 组件（带验证的输入框）
- [ ] 实现 `Select` 组件（下拉选择）
- [ ] 实现 `DateRangePicker` 组件（日期范围选择）

### 6.3 数据展示组件
- [ ] 实现 `StatusBadge` 组件（状态徽章，已完成）
- [ ] 实现 `ConfidenceIndicator` 组件（置信度指示器）
- [ ] 实现 `AmountDisplay` 组件（金额显示，带精度安全）
- [ ] 实现 `AddressDisplay` 组件（地址显示，带脱敏）
- [ ] 实现 `HashDisplay` 组件（哈希显示，带截断）
- [ ] 实现 `TimeDisplay` 组件（时间显示，相对时间 + 绝对时间）

### 6.4 列表组件
- [ ] 实现 `TransactionList` 组件（交易列表，已完成基础版）
- [ ] 实现 `TransactionItem` 组件（交易项，已完成基础版）
- [ ] 实现 `Pagination` 组件（分页）
- [ ] 实现 `EmptyState` 组件（空状态）

### 6.5 操作组件
- [ ] 实现 `Button` 组件（按钮，多种变体）
- [ ] 实现 `Modal` 组件（模态框）
- [ ] 实现 `ConfirmDialog` 组件（确认对话框）
- [ ] 实现 `Toast` 组件（提示消息）

---

## 阶段七：业务组件（Business Components）

### 7.1 交易相关组件
- [ ] 实现 `TransactionFilters` 组件（高级筛选：状态、置信度、时间、金额）
- [ ] 实现 `TransactionBulkActions` 组件（批量操作：批量归类、批量审核）
- [ ] 实现 `LowConfidenceQueue` 组件（低置信聚合视图，一键人工确认队列）
- [ ] 实现 `TransactionDetailModal` 组件（交易详情弹窗）

### 7.2 规则引擎组件
- [ ] 实现 `RuleEditor` 组件（Gmail-like 过滤器编辑器）
  - [ ] 规则条件构建器（domain/path/description/amount/network/status）
  - [ ] 规则动作设置器（category/project/cost_center/vendor_alias）
  - [ ] 规则优先级设置
  - [ ] 规则测试功能（预览匹配结果）
- [ ] 实现 `RuleList` 组件（规则列表）
- [ ] 实现 `RuleMatchExplanation` 组件（显示命中规则及原因）

### 7.3 钱包管理组件
- [ ] 实现 `WalletBindingForm` 组件（钱包绑定表单：地址、别名、实体归属）
- [ ] 实现 `WalletList` 组件（钱包列表）
- [ ] 实现 `WalletEntitySelector` 组件（钱包实体选择器）

### 7.4 报表组件
- [ ] 实现 `ReportGenerator` 组件（报表生成器：选择时间范围、生成 PDF/CSV）
- [ ] 实现 `ReportDownloadHistory` 组件（下载历史）
- [ ] 实现 `GapAnalysisView` 组件（Gap Analysis 可视化展示）

### 7.5 审计日志组件
- [ ] 实现 `AuditLogViewer` 组件（审计日志查看器）
- [ ] 实现 `AuditLogFilter` 组件（按时间、操作类型、操作人筛选）

---

## 阶段八：页面实现（Pages）

### 8.1 Onboarding 页面
- [ ] 实现钱包绑定流程（钱包地址输入、别名设置、实体归属选择）
- [ ] 实现法币口径选择（USD/CNY 等，默认 USD）
- [ ] 实现 RPC 设置（RPC 端点池配置，默认池）
- [ ] 实现初始化完成检查

### 8.2 Transactions 页面（主页面）
- [ ] 完善交易列表展示（状态、置信度、金额、时间）
- [ ] 实现搜索功能（搜索交易记录、域名、金额）
- [ ] 实现筛选功能（状态、时间范围、金额范围、网络）
- [ ] 实现排序功能（按时间、金额、置信度排序）
- [ ] 实现分页功能
- [ ] 实现批量操作（批量归类、批量审核）
- [ ] 实现低置信队列视图（聚合显示需审核的交易）

### 8.3 Transaction Detail 页面
- [ ] 实现证据链时间线展示（402 → 授权 → 回执 → 链上验证）
- [ ] 实现链上校验详情展示（tx_hash、block_number、验证结果）
- [ ] 实现命中规则解释展示（显示命中的规则及原因）
- [ ] 实现编辑功能（编辑 vendor/status/category/project，需填写 reason）
- [ ] 实现审计日志入口（查看该交易的修改历史）
- [ ] 实现导出 Receipt PDF 功能

### 8.4 Rules 页面
- [ ] 实现规则列表展示（规则列表、优先级、启用状态）
- [ ] 实现规则创建/编辑功能（使用 RuleEditor 组件）
- [ ] 实现规则删除功能（需确认）
- [ ] 实现规则优先级调整（拖拽排序）
- [ ] 实现规则批量回填功能（对历史交易应用新规则）
- [ ] 实现规则版本历史查看

### 8.5 Reports 页面
- [ ] 实现月报生成功能（选择月份，生成 Statement PDF）
- [ ] 实现报表下载历史（已生成的报表列表）
- [ ] 实现 Gap Analysis 展示（漏抓率、可疑支出列表）
- [ ] 实现 CSV 导出功能（明细数据导出）
- [ ] 实现报表预览功能（生成前预览）

### 8.6 Security/Settings 页面
- [ ] 实现数据导出功能（导出所有 Canonical 数据）
- [ ] 实现数据清空功能（清空本地数据，需确认）
- [ ] 实现采集域名策略管理（域名级启用/禁用采集）
- [ ] 实现白名单版本查看（当前使用的白名单版本）
- [ ] 实现加密密钥管理（查看/重置密钥）
- [ ] 实现审计日志导出功能

---

## 阶段九：集成与优化（Integration）

### 9.1 路由与导航
- [ ] 配置 Next.js App Router 路由（所有页面路由）
- [ ] 实现导航菜单（侧边栏导航）
- [ ] 实现面包屑导航
- [ ] 实现页面权限控制（如需要）

### 9.2 错误处理
- [ ] 实现全局错误边界（Error Boundary）
- [ ] 实现 API 错误处理（统一错误提示）
- [ ] 实现表单验证错误提示
- [ ] 实现数据加载错误提示（重试机制）

### 9.3 性能优化
- [ ] 实现列表虚拟滚动（大量数据时）
- [ ] 实现数据懒加载（按需加载）
- [ ] 实现图片/资源优化（Next.js Image）
- [ ] 实现代码分割（按路由分割）

### 9.4 用户体验
- [ ] 实现加载状态指示（Skeleton、Spinner）
- [ ] 实现操作反馈（Toast 提示）
- [ ] 实现键盘快捷键（如需要）
- [ ] 实现响应式设计（移动端适配）

### 9.5 测试与验证
- [ ] 编写组件单元测试（关键组件）
- [ ] 编写工具函数测试（精度计算、状态机等）
- [ ] 编写集成测试（关键流程）
- [ ] 进行端到端测试（E2E）

---

## 阶段十：文档与部署（Documentation）

### 10.1 开发文档
- [ ] 编写组件使用文档
- [ ] 编写 API 接口文档
- [ ] 编写数据模型文档
- [ ] 编写开发规范文档

### 10.2 部署准备
- [ ] 配置生产环境变量
- [ ] 配置构建优化
- [ ] 配置错误监控（如 Sentry）
- [ ] 配置性能监控

---

## 注意事项

1. **精度安全**：所有金额计算必须使用 `Decimal.js` 和 `BigInt`，严禁使用 JS Number
2. **状态机**：严格遵循状态转换规则，不允许非法状态转换
3. **审计日志**：所有用户修改操作必须记录审计日志（append-only）
4. **可追溯性**：每笔 Canonical 必须可追溯到 RawEvidence
5. **最小敏感存储**：不存储签名/授权原文，只存储 hash/截断
6. **模块化**：每个组件代码不超过 200 行，复杂功能必须拆分

---

**最后更新**：基于 PRD v1.0（金融级严谨增强版）
