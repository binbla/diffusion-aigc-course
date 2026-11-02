# AI 伴读设计说明（BYOK，无服务器）

> 目标：静态课程 + 用户自己的 AI 阅读伴侣。  
> 不商用、不赚钱、不做账号、不做云端 Key 托管。  
> 没有 AI，课程也能完整学习。

---

## 1. 一句话

> **页面是静态的，AI 是用户自己的，Key 只存在用户浏览器里。**

---

## 2. 为什么不做后端

这个项目不需要：

- 用户系统；
- 云端数据库；
- API Key 托管；
- 计费/限流；
- 管理后台。

所以不做 Server 端，避免：

- 运维；
- 隐私集中风险；
- 成本；
- 合规复杂度。

代价：

- 每个用户自己准备 API；
- 浏览器直连可能受 CORS 限制；
- 没有跨设备同步。

收益：

- 纯静态部署；
- 零服务器成本；
- Key 不经过本站；
- 代码/内容可完全公开。

---

## 3. 用户体验

```text
阅读课程
  └── 右下角「AI 伴读」（可选）
        ├── 设置：Base URL / 模型 / Key
        ├── 总结本页
        ├── 解释选中
        ├── 出 3 道题
        └── 自由提问
```

- 不点按钮时，页面和普通文档一样；
- 配置只存在 `localStorage`；
- 每次请求带当前页面标题 + 正文截断 + 用户问题；
- 回答只作为辅助，重要结论以课程原文为准。

---

## 4. 技术结构

```text
docs/
├── javascripts/ai-companion.js   # UI + fetch
├── stylesheets/ai-companion.css  # 样式
└── ai-companion.md               # 使用说明
```

请求：

```text
浏览器
  → POST {user_base_url}/chat/completions
  → Authorization: Bearer {user_key}
  → 返回 choices[0].message.content
```

没有本站服务器参与。

---

## 5. 支持的服务商

任何 OpenAI 兼容 `/chat/completions` 的服务：

- OpenAI；
- DeepSeek；
- OpenRouter；
- Ollama；
- LM Studio；
- 自建兼容端点。

配置示例见 [AI 伴读使用说明](docs/ai-companion.md)。

---

## 6. 安全边界

- Key 存在浏览器 `localStorage`；
- 本站不上传 Key；
- 但浏览器里的第三方脚本理论上可读取 localStorage；
- 建议用户使用单独的低额度 Key；
- 提供“清除”按钮；
- 不在页面里硬编码任何 Key。

---

## 7. 这是 C 端还是 S 端？

都不是“平台”：

- 它不是一个 C 端商业产品；
- 也不是一个 S 端 API 服务；
- 它是**静态课程里的一个可选客户端功能**。

如果未来要商业化，才需要：

- 云端 Key 托管；
- 账号/进度；
- 限流/计费；
- RAG/内容治理。

当前不做。

---

## 8. 相关

- [使用说明](docs/ai-companion.md)
- [Cloudflare Workers 静态部署](DEPLOYMENT.md)
- [课程首页](docs/index.md)
