# Diffusion / AIGC 面试课堂

> 从 26 道高频题，到 26 节课、3 个综合练习。  
> 不背答案，建立“能推导、能解释、能评测、能表达”的能力链。

---

## 从这里开始

| 你是 | 先看 |
|---|---|
| 第一次来 | [课程总览](course.md) |
| 想排学习计划 | [学习路径与周计划](syllabus.md) |
| 想查某道题 | [题目—课时映射](question-map.md) |
| 面试在即 | [公式速查](formulas.md) + [模拟面试](chapters/06-evaluation-interview.md) |
| 想用 AI 伴读 | [配置说明](ai-companion.md)（可选，自带 API） |
| 想直接看答案 | [完整题库](reference/question-bank.md) |

---

## 课程地图

### 第 0 章 导学

[从面试题到能力地图](chapters/00-orientation.md)  
能力模型、26 题地图、学习路径、环境准备。

### 第 1 章 扩散模型基础

[完整教学材料](lessons/ch01/README.md) · [章节总览](chapters/01-foundations.md)

- 生成模型全景与扩散直觉；
- 前向过程、重参数化、噪声 schedule；
- 反向过程、ELBO、DDPM 损失；
- 非高斯噪声、Cold Diffusion、D3PM、Flow Matching。

### 第 2 章 采样、加速与引导

[完整教学材料](lessons/ch02/README.md) · [章节总览](chapters/02-sampling-guidance.md)

- DDPM 采样与 DDIM；
- SDE/ODE 与高阶采样器；
- 蒸馏与少步生成；
- Classifier Guidance 与 CFG。

### 第 3 章 Latent Diffusion 与 Stable Diffusion

[完整教学材料](lessons/ch03/README.md) · [章节总览](chapters/03-latent-sd.md)

- AE / VAE / VQ-VAE；
- LDM 与 SD 核心优化；
- Self-Attention / Cross-Attention；
- SD 训练全流程与 Offset Noise。

### 第 4 章 条件控制与个性化

[完整教学材料](lessons/ch04/README.md) · [章节总览](chapters/04-conditioning-personalization.md)

- CLIP 全解；
- ControlNet；
- IP-Adapter；
- LoRA / DreamBooth / Textual Inversion / Hypernetwork。

### 第 5 章 模型演进与系统对比

[完整教学材料](lessons/ch05/README.md) · [章节总览](chapters/05-model-evolution.md)

- SDXL；
- SD3 / MMDiT / Rectified Flow；
- SD vs DALL·E 2 vs GAN。

### 第 6 章 评估、失败模式与面试实战

[完整教学材料](lessons/ch06/README.md) · [章节总览](chapters/06-evaluation-interview.md)

- 图像生成评估指标；
- GAN 模式坍塌；
- 26 题串讲与模拟面试。

### 第 7 章 综合练习与面试答辩

[完整教学材料](lessons/ch07/README.md) · [章节总览](chapters/07-capstone.md)

- 练习 A：DDPM 纸面推导与采样对比；
- 练习 B：SD 条件控制方案设计；
- 练习 C：评测方案与面试答辩。

---

## 学完你会得到什么

- 一份可白板推导的 DDPM/DDIM/CFG 笔记；
- 一份 SD 条件控制方案（不要求训练）；
- 一份评测方案与答辩材料；
- 一套 90 秒回答 + 追问应对模板；
- 一张 26 题掌握度地图。

---

## 课程状态

- ✅ 课程章节与 26 节课设计；
- ✅ 题库归档；
- ✅ 学习路径、题目映射、评估方案、公式速查；
- ✅ 第 1–7 章完整教学材料；
- ✅ 全课程材料包完成；
- ✅ 综合练习模板与评分表；
- ✅ 扩展篇：知识缺口审计 + 2023–2026 论文地图；
- ⏳ 扩展题库/英文版（可选）。

> 当前版本是 **Phase 5：主课 + 扩展篇完成**。全课程 8 章、26 节课、3 个综合练习，加 2023–2026 前沿论文地图。

---

## 扩展篇：2023–2026

主课覆盖 26 题；扩展篇补前沿：

- [知识缺口审计](extension/knowledge-gaps.md)：16 个缺口、优先级、面试问法；
- [2023–2026 论文地图](extension/papers-2023-2026.md)：30+ 论文卡片，名字/影响力/星级/贡献/链接。

---

## 推荐节奏

- **时间紧**：2 周速通 12 节核心课；
- **大多数**：6 周标准，26 节 + 综合练习 A/B；
- **冲高薪**：8 周深入，26 节 + 综合练习 A/B/C + 模拟面试。

详见 [学习路径](syllabus.md)。
