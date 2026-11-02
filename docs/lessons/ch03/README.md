# 第 3 章教学材料包：Latent Diffusion 与 Stable Diffusion

> **定位**：面试学习，不是工程实现课。  
> **不要求**训练 SD、不要求写 UNet、不要求跑微调。  
> **要求**：能画架构、能解释训练、能比较 VAE/Attention、能回答 A2/A3/A5/A6/A8/A16/D7。

---

## 1. 这一包材料解决什么问题

第 3 章对应 7 道高频题：

- A2：AE、VAE、VQ-VAE 的区别；
- A3：重参数技巧；
- A5：Stable Diffusion 的核心优化；
- A6：Stable Diffusion 怎么训练；
- A8：SD 中的交叉注意力；
- A16：self attention 和 cross attention 的区别；
- D7：为什么要用 Offset Noise。

这些问题串起来就是一张 SD 架构图：

```text
图像 ──VAE Encoder──> latent ──UNet（含 Self/Cross Attn）──> latent ──VAE Decoder──> 图像
                                  ↑
                            CLIP 文本 + Cross-Attn
                                  ↑
                            CFG / 条件
```

学完这一包，你能从“VAE 压缩”一路讲到“SD 两阶段训练”，而不是只会说“SD 是 latent diffusion”。

---

## 2. 材料清单

| 文件 | 是什么 | 为什么需要 | 学完能做什么 |
|---|---|---|---|
| [3.1 AE/VAE/VQ-VAE](01-AE-VAE-VQVAE.md) | 图像 tokenizer | A2、A3 的核心 | 比较三者，解释 SD 为什么用连续 VAE |
| [3.2 LDM 与 SD 核心优化](02-LDM与SD核心优化.md) | 系统架构 | A5 的核心 | 画 SD 数据流，解释为什么快 |
| [3.3 Self/Cross Attention](03-SelfAttention与CrossAttention.md) | 条件注入 | A8、A16 的核心 | 写 attention 公式，解释文本如何进入图像 |
| [3.4 SD 训练与 Offset Noise](04-SD训练与OffsetNoise.md) | 训练配方 | A6、D7 的核心 | 复述两阶段训练，解释亮度问题 |
| [05 章节面试题库](05-章节面试题库.md) | 面试演练 | 把知识压缩成 90 秒答案 | 回答 7 道核心题及追问 |
| [06 章节练习与答案](06-章节练习与答案.md) | 纸面练习 | 不写代码也能检查理解 | 手算压缩率、写 ELBO/VQ loss、画 attention |
| [07 讲师手册](07-讲师手册.md) | 授课脚本 | 让 4 节课可讲、可控制节奏 | 按 90 分钟组织课堂 |
| [08 材料设计理由](08-材料设计理由.md) | 设计说明 | 解释取舍、边界与可修改点 | 判断是否加深/换案例 |

---

## 3. 建议学习顺序

### 自学版（约 6–8 小时）

1. 读 3.1，画 AE/VAE/VQ-VAE 对比表；
2. 读 3.2，画 SD 数据流；
3. 读 3.3，写 self/cross attention 公式；
4. 读 3.4，复述两阶段训练；
5. 做 06 练习，对答案；
6. 用 05 做 90 秒回答；
7. 用 08 检查边界。

### 授课版（4 节 × 90 分钟）

- 第 1 节：3.1；
- 第 2 节：3.2；
- 第 3 节：3.3；
- 第 4 节：3.4 + 面试演练。

详细节奏见 [07 讲师手册](07-讲师手册.md)。

### 面试前复习版（45 分钟）

1. 画 SD 数据流；
2. 写 Cross-Attention 公式；
3. 说两阶段训练；
4. 看 05 的 7 道核心题。

---

## 4. 本章不做什么

- 不训练 VAE/UNet；
- 不写完整 SD 代码；
- 不跑微调；
- 不做 FID/CLIPScore 实验。

本章只保留架构、公式、训练流程和面试表达。  
需要实操时，应作为“可选实验”，不进入主线。

---

## 5. 本章验收清单

- [ ] 能比较 AE/VAE/VQ-VAE；
- [ ] 能写 VAE ELBO 和 VQ-VAE 三项损失；
- [ ] 能解释重参数化；
- [ ] 能画 SD 数据流；
- [ ] 能解释 Latent Diffusion 为什么快；
- [ ] 能写 Self/Cross Attention 公式；
- [ ] 能复述 SD 两阶段训练；
- [ ] 能解释 Offset Noise；
- [ ] 能 90 秒回答 A2/A5/A8/A16；
- [ ] 能 2 分钟回答 A6。

---

## 6. 对应面试题

| 题目 | 主材料 | 辅助材料 |
|---|---|---|
| A2 AE/VAE/VQ-VAE | 3.1 | 05、06 |
| A3 重参数 | 3.1 | 05、06 |
| A5 SD 核心优化 | 3.2 | 05、06 |
| A6 SD 训练 | 3.4 | 05、06 |
| A8 Cross-Attention | 3.3 | 05、06 |
| A16 Self/Cross | 3.3 | 05、06 |
| D7 Offset Noise | 3.4 | 05、06 |

---

## 7. 设计原则

> **先有 tokenizer，再有 latent diffusion；先有 attention，再有条件生成；先有训练配方，再谈 Offset Noise。**

顺序不能乱，否则 SD 会被讲成“一个黑盒”。
