# 人生十字路口 · 决策教练 — 实现设计规格

> 基于原始设计文档的实施规格，记录 brainstorming 阶段确认的全部技术决策。

---

## 1. 技术选型

| 维度 | 选择 | 理由 |
|---|---|---|
| 全栈语言 | Node.js + TypeScript | 前后端统一语言，AI Agent 编排友好 |
| 前端框架 | Vite + Vue 3 SPA | 用户已掌握，轻量快速 |
| 后端框架 | Express | 简洁成熟，路由清晰 |
| AI 引擎 | DeepSeek API + 抽象层 | 用户有 API Key，抽象层支持未来切换 |
| 数据存储 | SQLite + Prisma ORM | 类型安全，轻量无外部依赖 |
| 通信方式 | HTTP REST + SSE 流式推送 | 实时阶段切换通知 |
| 交互流程 | 完整四阶段 | 决策识别 → 专家访谈 → 辩论 → 报告 |

---

## 2. 整体架构

```
crossroads/
├── client/                    # Vite + Vue 3 前端
│   ├── src/
│   │   ├── components/        # 聊天界面、专家卡片、报告卡片等
│   │   ├── composables/       # 状态管理、API 调用、SSE 流
│   │   ├── views/             # 主页面（决策对话页）
│   │   ├── types/             # TypeScript 类型定义
│   │   └── App.vue
│   └── vite.config.ts
├── server/                    # Node.js 后端
│   ├── src/
│   │   ├── routes/            # Express API 路由
│   │   ├── agents/            # 决策识别器、专家管理器、辩论主持、报告生成器
│   │   ├── llm/               # LLM 抽象层（DeepSeek 适配器 + 接口）
│   │   ├── store/             # Prisma 数据访问层
│   │   └── index.ts           # 入口
│   ├── prisma/
│   │   └── schema.prisma      # 数据模型
│   └── package.json
├── package.json               # 根 monorepo 配置
└── README.md
```

核心设计决策：
- 前后端分离，`client/` 和 `server/` 各自独立 `package.json`，根目录用 `npm workspaces` 管理
- LLM 抽象层：定义 `ILLMProvider` 接口，`DeepSeekProvider` 是第一实现
- 每个 Agent 是独立的纯函数模块，接收上下文 → 返回结构化响应
- 前端用 SSE 接收后端流式对话数据，每阶段切换时广播事件类型

---

## 3. 数据模型

```prisma
model Session {
  id            String       @id @default(cuid())
  title         String?      // 自动从用户首条消息提取
  decisionType  String?      // career | lifestyle | relationship | education | general
  status        String       @default("active") // active | completed | abandoned
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  messages      Message[]
  experts       Expert[]
  report        Report?
}

model Message {
  id        String   @id @default(cuid())
  sessionId  String
  session    Session  @relation(fields: [sessionId], references: [id])
  role      String   // user | coach | expert | system
  expertRole String?  // career_advisor | lifestyle_coach | financial_planner | ...
  phase     String   // identification | interview | debate | report
  content   String
  createdAt DateTime @default(now())
}

model Expert {
  id        String   @id @default(cuid())
  sessionId  String
  session    Session  @relation(fields: [sessionId], references: [id])
  role      String   // career_advisor | lifestyle_coach | financial_planner | ...
  name      String   // "职业发展顾问" | "生活方式教练" | "财务规划师"
  summary   String?  // 该专家的最终分析沉淀
  score     String?  // JSON string: { "optionA": 7.5, "optionB": 6.0 }
  createdAt DateTime @default(now())
}

model Report {
  id          String   @id @default(cuid())
  sessionId    String   @unique
  session      Session  @relation(fields: [sessionId], references: [id])
  scoresJson  String?  // 专家加权对比数据 (JSON)
  coreConflict String? // 核心矛盾点
  strategy    String?  // 分阶段策略建议
  actionItems String?  // 下一步行动清单 (JSON array)
  createdAt   DateTime @default(now())
}
```

---

## 4. API 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/sessions` | 创建新决策会话 |
| `GET` | `/api/sessions/:id` | 获取会话详情（含消息历史） |
| `GET` | `/api/sessions/:id/stream` | SSE 流式端点，实时推送阶段变化 |
| `POST` | `/api/sessions/:id/messages` | 发送用户消息，触发下一阶段推进 |
| `GET` | `/api/sessions/:id/report` | 获取最终决策报告 |
| `GET` | `/api/sessions` | 会话列表（历史记录） |

SSE 事件类型：
- `phase_change` — 阶段切换通知
- `expert_speaking` — 某专家开始发言
- `expert_question` — 专家提问内容
- `coach_summary` — 教练总结
- `debate_round` — 辩论回合
- `report_ready` — 报告生成完毕

---

## 5. AI Agent 层设计

### 5.1 LLM 抽象层

```typescript
interface ILLMProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string>;
}
```

`DeepSeekProvider` 实现该接口，通过环境变量 `DEEPSEEK_API_KEY` 和 `DEEPSEEK_BASE_URL` 配置。

### 5.2 四个 Agent 模块

**决策识别器 (DecisionClassifier)**

输入：用户的初始自然语言描述
输出：`{ decisionType, options[], recommendedExperts[] }`

**专家访谈器 (ExpertInterviewer)**

每位专家独立调用，传入角色 system prompt + 用户上下文 + 追问策略。每位专家提出 1-2 个问题，用户回答后再次调用该专家做初步分析沉淀。

**辩论主持人 (DebateModerator)**

将三位专家的分析结果 + 用户原始上下文一次性传入 LLM，输出结构化辩论：
```json
{
  "expertOpinions": [
    { "expert": "职业发展顾问", "stance": "倾向回成都", "score": 7.5, "reasoning": "..." },
    { "expert": "生活方式教练", "stance": "倾向回成都", "score": 8.0, "reasoning": "..." },
    { "expert": "财务规划师", "stance": "倾向留上海", "score": 6.5, "reasoning": "..." }
  ],
  "consensus": "...",
  "divergence": "...",
  "coachQuestion": "你现在更倾向于哪条路？"
}
```

**报告生成器 (ReportGenerator)**

接收辩论结果 + 全部对话历史，输出结构化最终报告（得分对比、核心矛盾、策略建议、行动清单）。

### 5.3 阶段调度逻辑

```
Phase 1: 用户发送消息 → DecisionClassifier → 返回专家阵容
Phase 2: ExpertInterviewer(专家1) → 等用户回答 → ExpertInterviewer(专家1沉淀)
         → ExpertInterviewer(专家2) → 等用户回答 → 同上
         → ExpertInterviewer(专家3) → 等用户回答 → 同上
Phase 3: DebateModerator → 可选：用户倾向反馈 → 再次辩论
Phase 4: ReportGenerator → 返回最终报告
```

每个阶段推进由 `/messages` POST 触发，后端根据当前阶段和已完成进度决定调用哪个 Agent。

---

## 6. 前端设计

### 6.1 组件树

```
App.vue
└── ChatView.vue                    # 主视图
    ├── SessionHeader.vue           # 顶部：会话标题 + 决策类型标签 + 阶段指示器
    ├── ChatPanel.vue               # 对话消息列表（核心）
    │   ├── UserMessage.vue         # 用户消息气泡
    │   ├── CoachMessage.vue        # 教练消息（召唤专家、辩论总结）
    │   ├── ExpertCard.vue          # 专家身份卡 + 问题 + 分析
    │   └── PhaseIndicator.vue      # 阶段切换提示条
    ├── ChatInput.vue               # 底部输入区
    └── ReportModal.vue             # 最终报告弹窗/全屏卡片
        ├── ScoreChart.vue          # 专家加权对比图（ECharts 雷达图/柱状图）
        ├── ConflictSection.vue     # 核心矛盾点
        ├── StrategySection.vue     # 分阶段策略
        └── ActionList.vue          # 行动清单
```

### 6.2 视觉风格

温暖、专业、对话感。深色/渐变背景 + 卡片式消息流。每位专家有独特的颜色标识：
- 职业发展顾问 — 蓝色
- 生活方式教练 — 绿色
- 财务规划师 — 金色
- 情感关系教练 — 粉色
- 教育规划师 — 紫色

### 6.3 状态管理

使用 Vue 3 Composable (`useSession`) 管理核心状态，无需额外状态管理库：

```typescript
const session = ref<Session>()
const messages = ref<Message[]>()
const currentPhase = ref<Phase>()  // 'identification' | 'interview' | 'debate' | 'report'
const currentExpert = ref<Expert>() // 当前正在发言的专家
const isStreaming = ref(false)
```

SSE 连接通过 `fetch` + `ReadableStream` 实现，监听后端推送的各类事件更新状态。

---

## 7. MVP 范围确认

- [x] 用户输入场景 → AI 识别决策类型 + 召唤 3 个默认专家
- [x] 三位专家依次提问（每人 1-2 轮）
- [x] 教练主持辩论/总结
- [x] 生成结构化的决策报告卡（ECharts 可视化 + 文字分析）
- [x] 完整的对话 UI（聊天界面形式）

**不包含**：记忆系统、专家角色自定义、多语言、移动端适配。