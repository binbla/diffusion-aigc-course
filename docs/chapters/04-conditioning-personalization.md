# 第 4 章 条件控制与个性化

> **课时**：4 节 / 6 小时  
> **前置**：第 3 章（SD、Cross-Attention）  
> **章节定位**：从“能生成”进入“能控制、能定制”。  
> **重要说明**：本章以面试学习为目标，**不要求训练 ControlNet/LoRA、不要求搭 demo**。

---

## 本章完整教学材料

| 材料 | 内容 |
|---|---|
| [第 4 章材料包总览](../lessons/ch04/README.md) | 材料清单、学习顺序、验收 |
| [4.1 CLIP 全解](../lessons/ch04/01-CLIP全解.md) | 双塔、InfoNCE、零样本、优缺点 |
| [4.2 ControlNet](../lessons/ch04/02-ControlNet.md) | frozen base、trainable copy、zero conv |
| [4.3 IP-Adapter](../lessons/ch04/03-IP-Adapter.md) | image prompt、解耦 cross-attn |
| [4.4 LoRA 系列](../lessons/ch04/04-LoRA-DreamBooth-TI-Hypernetwork.md) | LoRA、DreamBooth、TI、Hypernetwork |
| [章节面试题库](../lessons/ch04/05-章节面试题库.md) | 90 秒答案、追问树 |
| [章节练习与答案](../lessons/ch04/06-章节练习与答案.md) | CLIP loss、LoRA 参数、结构对比 |
| [讲师手册](../lessons/ch04/07-讲师手册.md) | 4 节课的时间、板书、互动 |
| [材料设计理由](../lessons/ch04/08-材料设计理由.md) | 为什么选这些内容、边界、可修改点 |

---

## 章节目标

完成本章后，你应该能够：

1. 讲清 CLIP 的双塔架构、对比训练和 InfoNCE；
2. 分析 CLIP 特征的优缺点，并解释 SD3 为什么引入 T5；
3. 画出 ControlNet 的结构，解释 zero convolution；
4. 画出 IP-Adapter 的解耦 cross-attention，区分它与 ControlNet；
5. 比较 LoRA、DreamBooth、Textual Inversion、Hypernetwork；
6. 为一个“主体一致 + 空间可控”的需求设计组合方案；
7. 用 90 秒回答 A1/A12/A13/A14/A15。

---

## 课时地图

| 节 | 主题 | 核心问题 | 对应面试题 |
|---|---|---|---|
| [4.1](../lessons/ch04/01-CLIP全解.md) | CLIP 全解 | CLIP 为什么能零样本？弱在哪里？ | A1、A15 |
| [4.2](../lessons/ch04/02-ControlNet.md) | ControlNet | 如何注入边缘/深度/姿态？ | A13 |
| [4.3](../lessons/ch04/03-IP-Adapter.md) | IP-Adapter | 如何用参考图做图像 prompt？ | A14 |
| [4.4](../lessons/ch04/04-LoRA-DreamBooth-TI-Hypernetwork.md) | LoRA 系列 | 少样本定制到底在训什么？ | A12 |

---

## 每节课讲什么、学什么

### 4.1 CLIP 全解

**讲什么**：

- 双塔架构；
- 对称 InfoNCE；
- 大 batch/温度/零样本；
- 77 token/组合性/偏差；
- SD/SDXL/SD3 的文本编码器。

**学什么**：

- 画双塔、写 loss；
- 解释零样本；
- 列 5 个局限；
- 90 秒回答 A1/A15。

**能处理什么**：

- A1、A15；
- “CLIP 为什么不是生成模型”；
- “CLIPScore 能不能当指标”；
- “SD3 为什么加 T5”。

---

### 4.2 ControlNet

**讲什么**：

- 为什么需要空间控制；
- frozen base + trainable copy；
- 条件编码器 + zero convolution；
- 训练/推理/多条件。

**学什么**：

- 画结构；
- 解释零卷积；
- 复述训练流程；
- 90 秒回答 A13。

**能处理什么**：

- A13；
- “为什么零卷积”；
- “训练整个 SD 吗”；
- “多 ControlNet 怎么组合”。

---

### 4.3 IP-Adapter

**讲什么**：

- image prompt；
- CLIP image encoder + projection；
- 解耦 cross-attention；
- 只训少量参数；
- 与 ControlNet 的分工。

**学什么**：

- 画结构；
- 写解耦公式；
- 调 scale；
- 90 秒回答 A14。

**能处理什么**：

- A14；
- “为什么解耦”；
- “22M 参数花在哪”；
- “什么时候用 IP-Adapter”。

---

### 4.4 LoRA 系列

**讲什么**：

- LoRA 公式/rank/alpha；
- DreamBooth prior preservation；
- Textual Inversion；
- Hypernetwork；
- 四种方法对比/选型。

**学什么**：

- 写 LoRA 公式；
- 解释 DreamBooth 先验；
- 比较四种方法；
- 90 秒回答 A12。

**能处理什么**：

- A12；
- “DreamBooth 是 LoRA 吗”；
- “TI 为什么文件小”；
- “什么时候用哪种”。

---

## 本章不做什么

- 不训练 ControlNet；
- 不训练 LoRA/DreamBooth；
- 不搭 IP-Adapter demo；
- 不做 CLIP 零样本实验。

代码只作为可选实验，不进入主线。详细理由见 [08 材料设计理由](../lessons/ch04/08-材料设计理由.md)。

---

## 章节综合练习

**需求**：给定一张人物参考图 + 一张姿态图，设计“同一人物在指定姿态下”的方案。

**要求**：

1. 用 IP-Adapter 保持人物/风格；
2. 用 ControlNet OpenPose 控制姿态；
3. 用 LoRA 或 DreamBooth 强化一致性；
4. 设计 scale/CFG/步数的对比方案；
5. 评估身份、姿态、质量。

**交付物**：架构图、3 组对比/分析、失败案例、5 分钟讲解。  
**不要求**训练/代码。

---

## 章节通关清单

- [ ] 能讲清 CLIP 架构/损失；
- [ ] 能说出 CLIP 特征优缺点；
- [ ] 能画 ControlNet 结构；
- [ ] 能解释 zero convolution；
- [ ] 能画 IP-Adapter 解耦 cross-attention；
- [ ] 能比较四种个性化方法；
- [ ] 完成组合方案设计与讲解。

---

## 下一章

[第 5 章 模型演进与系统对比](05-model-evolution.md)
