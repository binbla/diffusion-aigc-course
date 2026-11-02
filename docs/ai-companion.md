# AI 伴读（可选，BYOK）

> **它是什么**：一个可选的阅读伴侣，帮你总结当前页、解释选中内容、出小测、回答本章问题。  
> **它不是什么**：不是账号系统，不是云端服务，不会把 Key 上传到本站。  
> **没有它**：课程阅读、搜索、导航完全正常。

---

## 1. 怎么用

1. 打开任意课程页面；
2. 点右下角 **AI 伴读**；
3. 在“设置”里填：
   - 服务商；
   - API Base URL；
   - 模型名；
   - 你的 API Key；
4. 点 **保存并开始**；
5. 用“总结本页 / 解释选中 / 出 3 道题”或直接提问。

Key 只保存在**你自己的浏览器 localStorage**，请求由浏览器直接发给你配置的服务商。  
本站是纯静态页面，没有服务器接收 Key。

---

## 2. 常见服务商配置

| 服务商 | Base URL | 模型示例 | 备注 |
|---|---|---|---|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | 以账号可用模型为准 |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` | OpenAI 兼容 |
| OpenRouter | `https://openrouter.ai/api/v1` | `openai/gpt-4o-mini` | 多模型聚合 |
| Ollama（本地） | `http://localhost:11434/v1` | `llama3.1` | 需要允许 CORS |
| LM Studio（本地） | `http://localhost:1234/v1` | 本地模型名 | 需要开启本地服务 |
| 自定义 | 你的兼容端点 | 你的模型名 | 需支持 `/chat/completions` |

> 模型名会变化，以服务商文档为准。  
> 这里调用的是 **OpenAI 兼容的 `/chat/completions`** 接口。

---

## 3. CORS 说明

浏览器直连 API 可能被 CORS 阻挡。遇到 `Failed to fetch`：

- 换一个允许浏览器直连的服务商；
- 或使用本地 Ollama / LM Studio；
- Ollama 需要允许当前站点，例如：

```bash
OLLAMA_ORIGINS="https://你的站点域名" ollama serve
```

本地调试时也可临时用：

```bash
OLLAMA_ORIGINS="*" ollama serve
```

重启 Ollama 后生效。

---

## 4. 隐私与安全

- Key 存在 `localStorage`，不会上传到本站；
- 但浏览器里任何能执行本页 JS 的脚本，理论上都能读取 `localStorage`；
- 建议使用**单独的低额度 Key**，不要用主账号 Key；
- 不用时点“清除”，或清理浏览器站点数据；
- 页面内容只在你点击按钮/发送问题时发给模型服务商；
- 重要结论请对照课程原文，AI 可能出错。

---

## 5. 三个快捷按钮

- **总结本页**：5 个要点 + 1 个自测问题；
- **解释选中**：先选中正文，再点；解释该段在整章中的作用；
- **出 3 道题**：2 选择 + 1 简答，附答案。

---

## 6. 没配置好会怎样

- 页面阅读不受影响；
- 点按钮会提示先填 API 设置；
- 调用失败会在对话里显示错误，不会破坏页面。

---

## 7. 为什么不做后端

这个项目的目标是：

> 静态课程 + 用户自己的 AI 伴侣 + 不商用。

所以刻意不做：

- 账号系统；
- 云端 Key 托管；
- 计费/限流；
- 数据库；
- 服务器。

代价是：Key 在浏览器里、CORS 可能受限、没有跨设备同步。  
收益是：部署极简、无运维、无隐私集中风险、完全静态。

---

## 8. 相关

- Cloudflare Workers 静态部署：见仓库根目录 `DEPLOYMENT.md`
- AI 伴读设计说明：见仓库根目录 `AI_COMPANION.md`
- [课程首页](index.md)
