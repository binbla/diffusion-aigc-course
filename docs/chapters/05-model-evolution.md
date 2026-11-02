# 第 5 章 模型演进与系统对比

> **课时**：3 节 / 4.5 小时  
> **前置**：第 3–4 章（SD、条件控制）  
> **章节定位**：把单点知识连成“模型演进线”，理解 SD → SDXL → SD3，以及 SD、DALL·E 2、GAN 的路线差异。  
> **重要说明**：本章以面试学习为目标，**不要求训练 SDXL/SD3、不复现 DALL·E 2、不跑 GAN**。

---

## 本章完整教学材料

| 材料 | 内容 |
|---|---|
| [第 5 章材料包总览](../lessons/ch05/README.md) | 材料清单、学习顺序、验收 |
| [5.1 SDXL](../lessons/ch05/01-SDXL.md) | 双文本、micro-conditioning、refiner |
| [5.2 SD3](../lessons/ch05/02-SD3.md) | MMDiT、Rectified Flow、T5、16ch VAE |
| [5.3 三路线对比](../lessons/ch05/03-SD-DALLE2-GAN.md) | LDM vs unCLIP vs GAN |
| [章节面试题库](../lessons/ch05/05-章节面试题库.md) | 90 秒答案、追问树 |
| [章节练习与答案](../lessons/ch05/06-章节练习与答案.md) | Flow 计算、架构对比 |
| [讲师手册](../lessons/ch05/07-讲师手册.md) | 3 节课的时间、板书、互动 |
| [材料设计理由](../lessons/ch05/08-材料设计理由.md) | 为什么选这些内容、边界、可修改点 |

---

## 章节目标

完成本章后，你应该能够：

1. 说出 SDXL 的四项核心改动及其解决的问题；
2. 说出 SD3 的 MMDiT、Rectified Flow、T5、16 通道 VAE 的作用；
3. 画出 SD（LDM）与 DALL·E 2（unCLIP）的架构差异；
4. 从训练、采样、多样性、可控性比较 GAN 与 Diffusion；
5. 根据业务约束选择模型与架构；
6. 用 90 秒回答 A7/A10/A11/D6。

---

## 课时地图

| 节 | 主题 | 核心问题 | 对应面试题 |
|---|---|---|---|
| [5.1](../lessons/ch05/01-SDXL.md) | SDXL | 为什么 SDXL 能显著提升构图和文字？ | A10 |
| [5.2](../lessons/ch05/02-SD3.md) | SD3 / MMDiT / Rectified Flow | 为什么从 UNet 转向 Transformer？ | A11 |
| [5.3](../lessons/ch05/03-SD-DALLE2-GAN.md) | SD vs DALL·E 2 vs GAN | 三条生成路线怎么选？ | A7、D6 |

---

## 每节课讲什么、学什么

### 5.1 SDXL

**讲什么**：

- 双文本编码器；
- 更大 UNet；
- micro-conditioning；
- base + refiner；
- 1024/多宽高比。

**学什么**：

- 说四项改动；
- 解释 micro-conditioning；
- 解释 base/refiner；
- 90 秒回答 A10。

**能处理什么**：

- A10；
- “SDXL 只是更大吗”；
- “refiner 必须吗”；
- “SDXL 解决 77 token 了吗”。

---

### 5.2 SD3

**讲什么**：

- MMDiT 与 cross-attn 的区别；
- Rectified Flow 的插值/损失/采样；
- 三文本编码器；
- 16ch VAE；
- SD3.5。

**学什么**：

- 写 Flow loss；
- 画 MMDiT；
- 解释 T5/16ch VAE；
- 90 秒回答 A11。

**能处理什么**：

- A11；
- “Flow 是不是 Diffusion”；
- “为什么加 T5”；
- “为什么 16ch VAE”。

---

### 5.3 SD vs DALL·E 2 vs GAN

**讲什么**：

- LDM；
- unCLIP（prior + decoder + 超分）；
- GAN；
- 条件注入/开放程度/可控性；
- 选型。

**学什么**：

- 画三路线；
- 解释 prior；
- 比较条件注入；
- 90 秒回答 A7/D6。

**能处理什么**：

- A7/D6；
- “DALL·E 2 为什么需要 prior”；
- “SD 为什么不需要”；
- “GAN 还有什么价值”。

---

## 本章不做什么

- 不训练 SDXL/SD3；
- 不复现 DALL·E 2；
- 不跑 GAN；
- 不做 FID 实验。

代码只作为可选实验，不进入主线。详细理由见 [08 材料设计理由](../lessons/ch05/08-材料设计理由.md)。

---

## 章节产出（纸面/口述）

1. SD1.5 → SDXL → SD3 演进表；
2. MMDiT 结构图 + Flow loss；
3. LDM/unCLIP/GAN 三路线图；
4. 3 个场景的选型建议；
5. 90 秒回答录音。

---

## 章节通关清单

- [ ] 能说 SDXL 四项改动；
- [ ] 能解释 micro-conditioning；
- [ ] 能写 Flow loss；
- [ ] 能解释 MMDiT；
- [ ] 能画 LDM vs unCLIP；
- [ ] 能比较 GAN/Diffusion；
- [ ] 能完成选型表。

---

## 下一章

[第 6 章 评估、失败模式与面试实战](06-evaluation-interview.md)
