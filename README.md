## 最终版 PRD：X402 微支付聚合对账与报表生成器（Micro-Invoice Aggregator）

（融合“健壮性 + 数据治理 + 防御性链上验证 + 审计闭环 + 安全合规”增强）

---

### 0) 文档元信息

| 字段     | 内容                                                                                          |
| ------ | ------------------------------------------------------------------------------------------- |
| PRD 版本 | v1.0（金融级严谨增强版）                                                                              |
| 产品定位   | X402 记账中间件：将海量微支付转为可审计、可入账、可导出报表                                                            |
| 核心交付   | 月度 Statement PDF + 明细 CSV + 单笔 Receipt PDF + 可追溯证据链                                         |
| 目标平台   | Chrome/Edge Extension（MV3）+ Next.js Web App                                                 |
| 目标用户   | AI/Agent 高调用团队的管理员、财务、工程/运营负责人                                                              |
| 设计原则   | Non-repudiation（不可抵赖）/ Completeness（完整性）/ Determinism（确定性）/ Least-Sensitive Storage（最小敏感存储） |

---

## 1) 背景与问题定义

| 项目        | 内容                                                |
| --------- | ------------------------------------------------- |
| 未来场景      | AI 代理在短时间内对多个 X402 站点发起高频微支付；月底留下大量哈希/碎片化元数据      |
| 核心痛点（Bug） | “机器付钱很爽，人类对账很火葬场”：财务无法回答每笔支出用途、供应商、凭证链、汇率口径与科目归类  |
| 大厂盲区      | 支付网络/钱包只负责转账，不负责企业可入账报表与审计闭环                      |
| 产品机会      | 以浏览器扩展作为“采集探针”，将 X402 的“报价→授权→回执→链上验证”证据链标准化并聚合输出 |

---

## 2) 目标与非目标

| 类型    | 目标（P0 必须实现）                                        | 非目标（V1 明确不做）                            |
| ----- | -------------------------------------------------- | --------------------------------------- |
| 财务闭环  | 生成**内部可审计**的 Receipt/Statement（Level 1）并可导出 CSV 入账 | 自动生成“税务发票（Tax Invoice）”并承诺税务合规（通常需卖方开具） |
| 证据链严谨 | 证据链字段统一、链上可验证、可追溯、可解释、可回滚                          | 覆盖所有链/所有币种/所有站点变体一次到位                   |
| 数据治理  | 引入 FX 快照、精度安全、钱包归属标签、审计日志、缺口分析                     | 全自动识别商户法定主体信息（税号/地址）                    |
| 稳定性   | 采集层 WAL、防并发冲突、插件挂起不丢数据、RPC 冗余                      | 复杂审批流/预算审批/企业 SSO（P1）                   |

---

## 3) 角色与用户故事

| 角色      | 典型问题            | P0 用户故事                                 | 成功判定                     |
| ------- | --------------- | --------------------------------------- | ------------------------ |
| 管理员/创始人 | AI 花钱花在哪？预算怎么控？ | 绑定多个钱包并贴标签；月底生成月报并按部门/项目汇总              | 能在 5 分钟内导出可交付财务的 PDF/CSV |
| 财务      | 凭证呢？汇率口径呢？是否漏抓？ | 看每笔“买什么/付给谁/多少钱/tx_hash”；查看 FX 快照；看缺口分析 | 可审计、可追溯、可解释；可发现漏抓        |
| 工程/运营   | 请求太并发，站点变体多     | 插件稳定捕获；规则引擎批量归类；低置信需人工确认                | 自动归类占比持续提升，人工介入下降        |

---

## 4) MVP 范围（P0/P1）与 V1 必砍清单

### 4.1 功能列表

| 模块                    | P0（必须有）                                                    | P1（以后做）                       |
| --------------------- | ---------------------------------------------------------- | ----------------------------- |
| 采集层（Browser Recorder） | Persistence Id（业务幂等关联令牌）；WAL；并发冲突处理；Header 白名单采集；动态白名单云更新  | Body 采集；更多协议变体自动学习；跨重定向多跳关联增强 |
| 解析与规范化                | 多层级解析漏斗（v1/v2/变体）；BigInt/Decimal 精度；统一 Canonical Schema v2 | 插件式站点适配器 SDK；自动字段学习           |
| 链上验证与归因               | tx_hash 验证；无 tx_hash 的链上归因；置信度衰减算法；RPC 池冗余                 | 多链多资产；更高级消歧（学习/图算法）           |
| 数据治理                  | FX Snapshot（法币估值）；多钱包实体归属；审计日志（修改记录）；状态机                   | 合规包导出；企业权限/审批流                |
| 报表闭环                  | 月度 Statement PDF；Receipt PDF；CSV 导出；Gap Analysis（漏抓率）      | QuickBooks/Xero；自定义模板；多币种折算策略 |
| 规则引擎                  | Gmail-like 过滤器规则批量映射科目/项目/部门                               | ML 分类；共享规则库；审批发布流程            |
| 安全隐私                  | 本地加密存储（IndexedDB）；敏感信息最小化；密钥派生；权限最小化                       | 企业级 KMS/HSM；SSO；设备策略          |

### 4.2 V1 必砍清单（确保可落地）

| 砍掉项         | 原因           | P0 替代                      |
| ----------- | ------------ | -------------------------- |
| 税务发票自动化     | 法律与数据字段不完备   | 内部审计收据 + 月报 Statement      |
| 全站点 Body 采集 | 实现/隐私/兼容性高风险 | Header-first + 规则兜底 + 手动补录 |
| 多链多币种全覆盖    | 归因复杂度指数上升    | Base + USDC 做深做透           |
| 自动抓取商户主体信息  | 不可靠且合规风险     | vendor profile（P1）手工补全     |

---

## 5) 系统架构（增强版）

| 层         | 模块                    | 关键增强点                                                 |
| --------- | --------------------- | ----------------------------------------------------- |
| Capture   | Browser Recorder（MV3） | **WAL 快照先落盘**；Persistence Id；并发去重；动态白名单更新             |
| Normalize | Parser + Normalizer   | 多层解析漏斗；BigInt/Decimal；统一 Canonical v2；最小敏感存储（hash/截断） |
| Verify    | On-chain Verifier     | RPC 池冗余；置信度衰减；链上回执校验；缓存与限流防御                          |
| Govern    | Data Governance       | FX Snapshot；钱包归属标签；审计日志；状态机                           |
| Account   | Rules Engine          | Gmail-like 过滤器批量归类；可解释“为何命中规则”                        |
| Deliver   | PDF/CSV Generator     | Receipt/Statement；Gap Analysis；完整性与异常项展示              |

---

## 6) 状态机（金融级严谨：可审计、可回滚）

| 状态                 | 定义                                | 进入条件                       | 退出条件                                       |
| ------------------ | --------------------------------- | -------------------------- | ------------------------------------------ |
| `pending`          | 已捕获原始快照但未完成解析                     | WAL 写入成功                   | 解析出基础字段 → `detected`                       |
| `detected`         | 已生成 Canonical Record（含金额/网络/收款方等） | 解析器成功                      | 捕获授权/回执 → `settled` 或进入验证 → `verifying`    |
| `settled`          | 已拿到支付回执或可确认“已支付意图”                | 有 PAYMENT-RESPONSE 或足够授权证据 | 拿到 tx_hash 并链上校验 → `onchain_verified`      |
| `verifying`        | 正在链上验证/归因                         | 触发验证任务                     | 成功→`onchain_verified`，失败/超时→`needs_review` |
| `onchain_verified` | tx_hash 与链上事件匹配通过                 | 校验通过                       | 规则归类完成 → `accounted`                       |
| `needs_review`     | 低置信/冲突/缺字段需人工确认                   | 归因冲突或置信度衰减到阈值              | 人工确认/补录后→`onchain_verified` 或 `accounted`  |
| `accounted`        | 已归类、可入账、可汇总报表                     | 命中规则或人工归类                  | 月报生成不改变状态（只产生报表版本）                         |

---

## 7) 采集层（Browser Recorder）PRD：健壮性加固版

### 7.1 关键机制：Persistence Id（业务幂等关联令牌）

| 项目       | 设计                                                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 目的       | 在刷新、重试、多标签、并发下仍能将 402→授权→200→回执关联为同一笔“消费会话”                                                                                                     |
| 生成时机     | 捕获 402 或首次出现支付相关头字段时立即生成                                                                                                                        |
| 令牌构成（推荐） | `persistence_id = SHA256( normalized_url + method + network + recipient/payTo + amount_base_units + (orderId?nonce?validAfter?) + day_bucket )` |
| 说明       | `orderId/nonce/validAfter` 任一存在即可显著提升关联稳定性；`day_bucket` 防止长期碰撞                                                                                  |
| 验收       | 刷新页面/自动重试导致 requestId 改变时，UI 仍能将其归并为同一事件                                                                                                        |

### 7.2 WAL（Write-Ahead Logging）与并发冲突

| 项目     | P0 要求                    | 实现要点                                                                    | 验收                     |
| ------ | ------------------------ | ----------------------------------------------------------------------- | ---------------------- |
| WAL 快照 | **先落盘再处理**，防止 SW 挂起导致丢数据 | onHeadersReceived/onBeforeSendHeaders 触发时：立即写入 `RawEvidenceWAL`（仅白名单字段） | 浏览器挂起/重启后，WAL 可恢复并继续解析 |
| 并发去重   | 1 秒数十请求不产生重复账目           | 以 `persistence_id + stage(402/auth/receipt) + header_hash` 做幂等键         | 高并发压测下重复率可控（<1%）       |
| 队列恢复   | 解析/验证失败可重试               | WAL→ProcessingQueue→Canonical；失败入 Dead-letter 并可重试                      | 失败可追踪、可重放（不重放敏感签名原文）   |

### 7.3 动态白名单云端更新（无需发版适配新变体）

| 项目         | P0 要求                   | 实现要点                                                           | 验收                  |
| ---------- | ----------------------- | -------------------------------------------------------------- | ------------------- |
| Header 白名单 | 内置 v1/v2/变体关键头；支持远端配置增量 | Web App/Supabase 存 `header_allowlist_config`（版本号+签名）；扩展启动/每日拉取 | 新站点新增头字段后无需更新插件即可捕获 |
| 站点白名单/规则   | 支持域名级启用/禁用采集            | 远端下发 domain policy（采集开关、敏感字段处理级别）                              | 对敏感域名可一键停用          |

---

## 8) 解析引擎与数据治理：增强版 Canonical Schema v2

### 8.1 精度与大数安全（P0 强制）

| 风险              | P0 规则                     | 技术约束                                                                    |
| --------------- | ------------------------- | ----------------------------------------------------------------------- |
| 浮点误差导致金额偏差      | **严禁**使用 JS Number 进行金额计算 | `amount_base_units` 用 `BigInt`；`amount_decimal` 用 Decimal（如 Decimal.js） |
| 科学计数法污染 CSV/PDF | 所有导出必须字符串化并固定小数位策略        | `amount_base_units_str`、`amount_decimal_str` 字段用于导出                     |

### 8.2 增加 FX Snapshot 与多钱包归属（会计价值锚点）

| 新字段                     |          类型 |  必填 | 来源    | 说明                         |
| ----------------------- | ----------: | :-: | ----- | -------------------------- |
| `internal_wallet_alias` |        text |  否  | 用户配置  | 如“研发部 Agent-01”、“公司主钱包”    |
| `wallet_entity_id`      |        uuid |  否  | 系统    | 多钱包归属的实体维度（公司/部门/个人）       |
| `fx_fiat_currency`      |        text |  是  | 设置    | USD/CNY 等（默认 USD）          |
| `fx_rate`               | decimal_str |  否  | FX 服务 | 交易时刻汇率快照                   |
| `fiat_value_at_time`    | decimal_str |  否  | 计算    | `amount_decimal * fx_rate` |
| `fx_source`             |        text |  否  | 配置    | FX 来源标记（用于审计口径一致性）         |
| `fx_captured_at`        |    datetime |  否  | 系统    | FX 快照采集时间（尽量贴近 paid_at）    |

> 注：P0 可先支持 USD（USDC≈USD 但仍记录快照以满足审计口径一致性与年终复核）。

### 8.3 Canonical Record v2（最终“唯一真相表”）

| 字段组      | 字段（示例）                                                                           | P0 要求                  |
| -------- | -------------------------------------------------------------------------------- | ---------------------- |
| 关联与证据    | `event_id`、`persistence_id`、`evidence_ref`、`header_hashes_json`                  | 必须可追溯到 WAL/RawEvidence |
| 业务识别     | `merchant_domain`、`request_url`、`description`、`order_id`                         | 至少 domain + url 必填     |
| 支付要素     | `network`、`asset_symbol`、`decimals`、`amount_base_units_str`、`amount_decimal_str` | 精度安全强制                 |
| 角色地址     | `payer_wallet`、`payee_wallet`、`internal_wallet_alias`                            | payee 必填，payer 尽力补全    |
| 链上凭证     | `tx_hash`、`paid_at`、`block_number`、`verified_at`                                 | 有 tx_hash 必须校验一致性      |
| FX 与法币口径 | `fx_rate`、`fiat_value_at_time`、`fx_source`                                       | 有 paid_at 则尽量同步采集      |
| 会计归类     | `category`、`project`、`cost_center`、`rule_id_applied`                             | 规则命中必须可解释              |
| 状态机与置信度  | `status`、`confidence`、`needs_review_reason`                                      | 低置信必须可解释原因             |
| 安全最小化    | `signature_hash`、`authorization_hash`                                            | 只存 hash/截断，不存原文        |

---

## 9) 链上验证（Verifier）：防御性设计增强

### 9.1 RPC 池冗余与故障切换（P0）

| 项目    | P0 要求                         | 实现要点              | 验收                |
| ----- | ----------------------------- | ----------------- | ----------------- |
| RPC 池 | 至少 2–3 个可用端点（官方+第三方）          | 轮询/熔断/重试；按失败率动态降权 | 单一 RPC 限流时验证不长期卡住 |
| 缓存    | tx_hash 查询与 token decimals 缓存 | TTL；避免重复请求        | 性能稳定              |

### 9.2 置信度衰减算法（解决同额同收款并发误配）

| 规则     | 说明                    | 动作                                    |               |                                          |
| ------ | --------------------- | ------------------------------------- | ------------- | ---------------------------------------- |
| 时间差衰减  | `Δt =                 | http_time - block_time                | ` 超过 5 分钟显著降权 | `confidence -= f(Δt)`，并进入 `needs_review` |
| 多命中惩罚  | 同一时间窗命中多条 Transfer    | 每多一条命中 `confidence -= penalty`，要求人工确认 |               |                                          |
| 字段缺失惩罚 | 缺 payer 或缺 amount 等   | 降低 confidence，并标记原因                   |               |                                          |
| 最低阈值   | `confidence < 60`（建议） | 强制 `needs_review`                     |               |                                          |

---

## 10) 会计规则引擎（Rules Engine）：批量映射与可解释性

### 10.1 Gmail-like 过滤器规则（P0）

| 功能     | P0 要求                                           | 示例                                           |
| ------ | ----------------------------------------------- | -------------------------------------------- |
| 规则条件   | domain/path/description/amount/network/status 等 | `domain matches *.heurist.ai AND amount < 1` |
| 动作     | 设置 `category/project/cost_center/vendor_alias`  | `category=研发支出-API费`                         |
| 优先级与冲突 | 支持优先级；冲突可提示                                     | 规则 A 优先于规则 B                                 |
| 可解释性   | 每笔显示“命中哪条规则/为何命中”                               | UI 展示命中条件与动作                                 |

### 10.2 批量应用与回填

| 项目   | P0 要求                   |
| ---- | ----------------------- |
| 历史回填 | 新规则可对历史交易批量重算归类（产生审计日志） |
| 版本化  | 规则变更产生版本号，报表引用规则版本      |

---

## 11) 报表与闭环：Gap Analysis（缺口分析）加入月报

### 11.1 Gap Analysis（P0）

| 目标     | 方法                                              | 输出                    |
| ------ | ----------------------------------------------- | --------------------- |
| 发现漏抓支出 | 对比：钱包全量 Transfer Events vs 插件捕获的 X402 Canonical | 漏抓率、可疑支出列表（未被捕获但链上存在） |
| 审计意义   | 满足完整性（Completeness）要求                           | 月报新增“未识别支出预警”章节       |

### 11.2 月度 Statement 结构（P0）

| 章节                   | 内容                              | 必须字段                           |
| -------------------- | ------------------------------- | ------------------------------ |
| Executive Summary    | 总支出、Top Vendor、Top Category、漏抓率 | total_usdc、total_fiat、gap_rate |
| Vendor Breakdown     | 按 vendor/domain 汇总              | vendor、sum、count               |
| Category/Cost Center | 按科目/部门汇总                        | category、cost_center、sum       |
| Exceptions           | needs_review、unmatched、校验失败     | reason、count                   |
| Gap Analysis         | 未捕获链上支出列表（摘要）                   | tx_hash、to、value、time          |

---

## 12) 安全、隐私与合规：增强要求

### 12.1 本地加密存储（P0）

| 项目   | P0 要求             | 实现建议                    |
| ---- | ----------------- | ----------------------- |
| 存储介质 | IndexedDB（优先）     | 结构化、容量大                 |
| 加密   | 本地数据加密（透明）        | 密钥由用户登录口令或本机随机种子派生（KDF） |
| 最小敏感 | 不存签名/授权原文；地址可脱敏展示 | 仅保留 hash/截断             |

### 12.2 审计日志（Audit Trail）（P0）

| 项目    | P0 要求                                      | 审计字段                                   |
| ----- | ------------------------------------------ | -------------------------------------- |
| 记录范围  | 用户手动修改 vendor/status/category/project/rule | before/after、operator、timestamp、reason |
| 不可抵赖性 | 审计日志不可被静默覆盖                                | append-only；可导出                        |

---

## 13) Web App 页面规格（P0）

| 页面                | 关键组件                            | 金融级增强点                 |
| ----------------- | ------------------------------- | ---------------------- |
| Onboarding        | 钱包绑定+别名+实体归属；选择法币口径；RPC 设置（默认池） | 钱包别名用于成本分摊；FX 口径固定可审计  |
| Transactions      | 列表/筛选/状态/置信度；批量归类               | 低置信聚合视图与一键人工确认队列       |
| Detail            | 证据链时间线；链上校验详情；命中规则解释；编辑与审计日志入口  | 每次编辑必须填写 reason（可选但推荐） |
| Rules             | 过滤器编辑器；优先级；回填；版本                | 规则发布产生版本号              |
| Reports           | 月报生成；下载历史；Gap Analysis 展示       | 报表引用规则版本与 FX 口径        |
| Security/Settings | 数据导出/清空；采集域名策略；白名单版本            | 权限透明、数据可控可删            |

---

## 14) API/数据接口（Extension ↔ Web App）

| 接口                       | 方向                       | P0 说明                           |
| ------------------------ | ------------------------ | ------------------------------- |
| `syncRawEvidence()`      | Extension → Web App      | 上传 WAL/RawEvidence（加密后或脱敏）      |
| `syncCanonical()`        | Extension/Web → Supabase | 幂等写入 Canonical（event_id）        |
| `fetchAllowlistConfig()` | Extension ← Web App      | 拉取动态白名单与域名策略（签名校验）              |
| `requestVerify()`        | Web App → Verifier       | 触发批量验证/归因任务                     |
| `getFxSnapshot()`        | Web App → FX Service     | 记录 fx_rate 与 fiat_value_at_time |

---

## 15) 验收标准（Definition of Done）

| 维度    | P0 DoD（必须满足）                                     |
| ----- | ------------------------------------------------ |
| 数据完整性 | 每笔 Canonical 必可追溯到 RawEvidence；月报包含 Gap Analysis |
| 精度    | 全流程 BigInt/Decimal；导出无科学计数法导致的错账                 |
| 稳定性   | SW 挂起/重启不丢数据（WAL 恢复）；并发不产生大量重复                   |
| 可验证性  | 有 tx_hash 的交易 100% 可链上校验并记录校验结果                  |
| 可审计性  | 人工修改均有 Audit Trail；报表引用规则版本与 FX 口径               |
| 安全    | 本地加密存储；不保存可重放的签名原文                               |

---

## 16) 推荐技术栈（快速开发 + 企业可用）

| 层       | 推荐选型                                      | P0 说明                    |
| ------- | ----------------------------------------- | ------------------------ |
| Web App | Next.js（App Router）+ Tailwind + shadcn/ui | 管理台迭代快                   |
| 扩展      | Chrome/Edge MV3（Service Worker）           | 兼容主流                     |
| 本地存储    | IndexedDB + 加密层                           | WAL/Canonical/Audit 均可落盘 |
| 云端      | Supabase（Auth + Postgres + Storage）       | 可选同步与团队协作扩展              |
| PDF     | @react-pdf/renderer                       | 组件化模板、可版本化               |
| 精度库     | Decimal.js + BigInt                       | 强制金额安全                   |
| 链上      | RPC Pool（Base）+ 缓存层                       | 防限流与高可用                  |

---

## 17) 里程碑（建议拆解为可“vibe code”的工作包）

| WP  | 交付物                             | 关键点                |
| --- | ------------------------------- | ------------------ |
| WP1 | Extension WAL + Persistence Id  | 先落盘再处理；幂等关联        |
| WP2 | Parser Funnel v1 + Canonical v2 | 三类样本全通过；精度安全       |
| WP3 | Verifier v1（RPC Pool + 置信度衰减）   | 低置信进入 needs_review |
| WP4 | Rules Engine（过滤器+回填+解释）         | 批量归类闭环             |
| WP5 | PDF/CSV + Gap Analysis          | 月报可审计、可发现漏抓        |
| WP6 | Security（本地加密+审计日志）             | append-only 审计链    |

---

### 最终结论（产品“金融级严谨”的核心升级点）

| 维度 | 从“可用”到“不可辩驳”                                 |
| -- | -------------------------------------------- |
| 架构 | 采集升级为“WAL 快照→业务关联→解析→链上双校验”                  |
| 数据 | 引入 FX 快照、钱包归属、精度安全与状态机                       |
| 业务 | 规则引擎从手工补录升级为批量自动分类                           |
| 审计 | Gap Analysis + Audit Trail + 报表版本化（规则/FX 口径） |
| 容错 | 置信度衰减 + RPC 池冗余，极端环境仍可控                      |
