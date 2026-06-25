# 人生十字路口 · 决策教练

AI 驱动的多专家决策辅导应用。说出你的纠结，AI 教练会召唤专家团队，通过四阶段流程帮你理清思路、做出更好的决策。

## 功能特性

- **四阶段决策流程**：识别 → 专家访谈 → 专家辩论 → 生成报告
- **多专家系统**：根据决策类型自动匹配相关领域专家
- **实时交互**：SSE 流式传输，即时响应
- **决策报告**：包含评分图表、核心冲突分析、策略建议、行动计划

## 技术栈

### 后端
- Node.js + Express + TypeScript
- Prisma ORM + SQLite
- DeepSeek API（LLM 提供商）

### 前端
- Vue 3 + Vite + TypeScript
- 模块化状态管理

## 快速开始

### 环境要求
- Node.js 18+
- DeepSeek API Key

### 1. 克隆项目

```bash
git clone https://github.com/Ephemera11/crossroads.git
cd crossroads
```

### 2. 安装依赖

```bash
npm install
```

### 3. 初始化数据库

```bash
cd server
npx prisma generate
npx prisma db push
cd ..
```

### 4. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 5. 启动开发服务器

```bash
# 启动后端（端口 3000）
cd server
node --env-file=.env --import tsx --watch src/index.ts

# 另开终端，启动前端（端口 5173）
cd client
npx vite --port 5173 --host
```

访问 http://localhost:5173 即可使用。

## 生产部署

### 构建前端

```bash
cd client
npm run build
```

### 使用 PM2 运行后端

```bash
cd server
npm install -g pm2
pm2 start src/index.ts --name crossroads-server
```

### Nginx 反向代理配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/crossroads/client/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 项目结构

```
crossroads/
├── server/              # 后端
│   ├── src/
│   │   ├── agents/      # AI Agent（分类器、面试官、辩论员、报告生成器）
│   │   ├── llm/         # LLM 抽象层
│   │   ├── routes/      # API 路由
│   │   ├── services/    # 业务逻辑
│   │   └── store/       # Prisma 客户端
│   └── prisma/
│       └── schema.prisma
├── client/              # 前端
│   ├── src/
│   │   ├── components/  # Vue 组件
│   │   ├── composables/ # 组合式函数
│   │   └── views/       # 页面视图
│   └── vite.config.ts
└── package.json         # 根目录 monorepo 配置
```

## 数据模型

- **Session** — 决策会话
- **Message** — 消息记录（用户/教练/专家）
- **Expert** — 专家信息
- **Report** — 决策报告

数据库使用 SQLite，文件位于 `server/prisma/dev.db`（已加入 `.gitignore`，不会被提交）。

## 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 是 |

## License

MIT
