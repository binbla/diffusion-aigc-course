# 第 4 章教学材料包：条件控制与个性化

> **定位**：面试学习，不是工程实现课。  
> **不要求**训练 ControlNet/LoRA、不要求搭 demo、不要求跑微调。  
> **要求**：能解释 CLIP、ControlNet、IP-Adapter、LoRA 系列，能画结构、能比较、能选型、能用 90 秒回答 A1/A12/A13/A14/A15。

---

## 1. 这一包材料解决什么问题

第 4 章对应 5 道高频题：

- A1：CLIP 的架构、训练、损失；
- A12：LoRA / DreamBooth / Textual Inversion / Hypernetwork；
- A13：ControlNet；
- A14：IP-Adapter；
- A15：CLIP 编码特征的优缺点。

这五道题构成“条件控制与个性化”的完整链路：

```text
文本条件：CLIP → 语义
空间条件：ControlNet → 边缘/深度/姿态
图像条件：IP-Adapter → 风格/主体
模型定制：LoRA/DreamBooth/TI → 新概念/新主体
```

学完这一包，你能回答“怎么控制”“怎么定制”“各自边界在哪”，而不是只列工具名。

---

## 2. 材料清单

| 文件 | 是什么 | 为什么需要 | 学完能做什么 |
|---|---|---|---|
| [4.1 CLIP 全解](01-CLIP全解.md) | 文本/图像编码基础 | A1、A15 的核心 | 讲架构/损失/零样本，分析 CLIP 优缺点 |
| [4.2 ControlNet](02-ControlNet.md) | 空间条件 | A13 的核心 | 画结构，解释 zero convolution |
| [4.3 IP-Adapter](03-IP-Adapter.md) | 图像条件 | A14 的核心 | 画解耦 cross-attn，区分 ControlNet |
| [4.4 LoRA 系列](04-LoRA-DreamBooth-TI-Hypernetwork.md) | 个性化 | A12 的核心 | 比较四种方法，选型 |
| [05 章节面试题库](05-章节面试题库.md) | 面试演练 | 把知识压缩成 90 秒答案 | 回答 5 道核心题及追问 |
| [06 章节练习与答案](06-章节练习与答案.md) | 纸面练习 | 不写代码也能检查理解 | 写 CLIP loss、LoRA 参数、结构对比 |
| [07 讲师手册](07-讲师手册.md) | 授课脚本 | 让 4 节课可讲、可控制节奏 | 按 90 分钟组织课堂 |
| [08 材料设计理由](08-材料设计理由.md) | 设计说明 | 解释取舍、边界与可修改点 | 判断是否加深/换案例 |

---

## 3. 建议学习顺序

### 自学版（约 6–8 小时）

1. 读 4.1，写 CLIP loss，列 5 个局限；
2. 读 4.2，画 ControlNet 结构；
3. 读 4.3，画解耦 cross-attn；
4. 读 4.4，做四种个性化方法对比表；
5. 做 06 练习，对答案；
6. 用 05 做 90 秒回答；
7. 用 08 检查边界。

### 授课版（4 节 × 90 分钟）

- 第 1 节：4.1；
- 第 2 节：4.2；
- 第 3 节：4.3；
- 第 4 节：4.4 + 面试演练。

详细节奏见 [07 讲师手册](07-讲师手册.md)。

### 面试前复习版（45 分钟）

1. 写 CLIP loss；
2. 画 ControlNet 的 frozen base + trainable copy；
3. 写 IP-Adapter 解耦 cross-attn；
4. 做 LoRA/DreamBooth/TI 对比；
5. 看 05 的 5 道核心题。

---

## 4. 本章不做什么

- 不训练 ControlNet；
- 不训练 LoRA/DreamBooth；
- 不搭 IP-Adapter demo；
- 不做 CLIP 零样本实验。

本章只保留架构、公式、对比和面试表达。  
需要实操时，应作为“可选实验”，不进入主线。

---

## 5. 本章验收清单

- [ ] 能写 CLIP 双塔结构和对称 InfoNCE；
- [ ] 能说出 CLIP 的 5 个局限；
- [ ] 能画 ControlNet 结构，解释 zero convolution；
- [ ] 能写 IP-Adapter 解耦 cross-attn；
- [ ] 能区分 ControlNet 与 IP-Adapter；
- [ ] 能写 LoRA 公式；
- [ ] 能解释 DreamBooth 的 prior preservation；
- [ ] 能比较四种个性化方法；
- [ ] 能 90 秒回答 A1/A12/A13/A14/A15。

---

## 6. 对应面试题

| 题目 | 主材料 | 辅助材料 |
|---|---|---|
| A1 CLIP | 4.1 | 05、06 |
| A12 LoRA 系列 | 4.4 | 05、06 |
| A13 ControlNet | 4.2 | 05、06 |
| A14 IP-Adapter | 4.3 | 05、06 |
| A15 CLIP 特征 | 4.1 | 05、06 |

---

## 7. 设计原则

> **CLIP 解决“文本语义”，ControlNet 解决“空间结构”，IP-Adapter 解决“参考图语义”，LoRA 系列解决“模型定制”。**

四个工具各管一层，面试时先定位，再讲原理，不要堆名词。
