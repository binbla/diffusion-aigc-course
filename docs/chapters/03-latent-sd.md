# 第 3 章 Latent Diffusion 与 Stable Diffusion

> **课时**：4 节 / 6 小时  
> **前置**：第 1–2 章（DDPM、采样、CFG）  
> **章节定位**：从“扩散算法”进入“真实文生图系统”，理解 SD 的 VAE、UNet、Cross-Attention、训练配方和亮度问题。  
> **重要说明**：本章以面试学习为目标，**不要求训练 SD、不要求写 UNet、不要求跑微调**。

---

## 本章完整教学材料

| 材料 | 内容 |
|---|---|
| [第 3 章材料包总览](../lessons/ch03/README.md) | 材料清单、学习顺序、验收 |
| [3.1 AE/VAE/VQ-VAE](../lessons/ch03/01-AE-VAE-VQVAE.md) | ELBO、重参数、codebook、SD VAE |
| [3.2 LDM 与 SD](../lessons/ch03/02-LDM与SD核心优化.md) | 数据流、latent diffusion、瓶颈 |
| [3.3 Attention](../lessons/ch03/03-SelfAttention与CrossAttention.md) | Q/K/V、形状、SD 位置、MMDiT |
| [3.4 SD 训练与 Offset Noise](../lessons/ch03/04-SD训练与OffsetNoise.md) | 两阶段、trick、亮度问题 |
| [章节面试题库](../lessons/ch03/05-章节面试题库.md) | 90 秒答案、追问树 |
| [章节练习与答案](../lessons/ch03/06-章节练习与答案.md) | 概念/推导/计算题 |
| [讲师手册](../lessons/ch03/07-讲师手册.md) | 4 节课的时间、板书、互动 |
| [材料设计理由](../lessons/ch03/08-材料设计理由.md) | 为什么选这些内容、边界、可修改点 |

---

## 章节目标

完成本章后，你应该能够：

1. 比较 AE、VAE、VQ-VAE、VQGAN 的隐空间与训练目标；
2. 画出完整的 Stable Diffusion 数据流；
3. 解释 Latent Diffusion 为什么能大幅降低计算量；
4. 说清楚 Self-Attention 与 Cross-Attention 在 SD 中的分工；
5. 复述 SD 两阶段训练和关键 trick；
6. 解释 Offset Noise、Zero Terminal SNR、$v$-prediction 各自解决什么问题；
7. 用 90 秒回答 A2/A5/A8/A16，用 2 分钟回答 A6。

---

## 课时地图

| 节 | 主题 | 核心问题 | 对应面试题 |
|---|---|---|---|
| [3.1](../lessons/ch03/01-AE-VAE-VQVAE.md) | AE/VAE/VQ-VAE | SD 为什么用连续 VAE？ | A2、A3 |
| [3.2](../lessons/ch03/02-LDM与SD核心优化.md) | LDM 与 SD | SD 到底“优化”了什么？ | A5 |
| [3.3](../lessons/ch03/03-SelfAttention与CrossAttention.md) | Attention | 文本如何进入图像？ | A8、A16 |
| [3.4](../lessons/ch03/04-SD训练与OffsetNoise.md) | SD 训练与 Offset Noise | SD 怎么训？亮度问题怎么解？ | A6、D7 |

---

## 每节课讲什么、学什么

### 3.1 AE/VAE/VQ-VAE

**讲什么**：

- AE 的确定性隐空间；
- VAE ELBO/重参数/模糊；
- VQ-VAE codebook/三项损失/straight-through；
- VQGAN；
- SD 为什么用连续 VAE。

**学什么**：

- 写 VAE ELBO；
- 写 VQ-VAE 损失；
- 比较三者；
- 算压缩倍率；
- 90 秒回答 A2/A3。

**能处理什么**：

- A2、A3；
- “SD 的 VAE 是不是 VQ-VAE”；
- “VAE 为什么模糊”；
- “VQ-VAE 怎么生成”。

---

### 3.2 LDM 与 SD 核心优化

**讲什么**：

- 像素扩散 vs latent diffusion；
- SD 数据流；
- VAE/UNet/CLIP/Cross-Attn/CFG 分工；
- 48 倍压缩；
- 瓶颈。

**学什么**：

- 画 SD 数据流；
- 算 latent 尺寸；
- 解释为什么快；
- 指出瓶颈；
- 90 秒回答 A5。

**能处理什么**：

- A5；
- “为什么不用像素扩散”；
- “SD 为什么快”；
- “SD 的瓶颈在哪”。

---

### 3.3 Self-Attention 与 Cross-Attention

**讲什么**：

- Q/K/V 与公式；
- 两种 attention 的区别；
- SD 中的位置；
- attention map；
- MMDiT。

**学什么**：

- 写两种 attention；
- 算形状/复杂度；
- 解释文本注入；
- 90 秒回答 A8/A16。

**能处理什么**：

- A8、A16；
- “Q 从哪来”；
- “为什么放低分辨率”；
- “SD3 为什么改 MMDiT”。

---

### 3.4 SD 训练与 Offset Noise

**讲什么**：

- 两阶段训练；
- 冻结 VAE/文本编码器；
- CFG dropout/EMA/bucketing；
- 预测目标；
- Offset Noise；
- zero terminal SNR/v-pred。

**学什么**：

- 复述两阶段；
- 解释每个 trick；
- 解释 Offset Noise；
- 区分三种方法；
- 2 分钟回答 A6。

**能处理什么**：

- A6、D7；
- “为什么分两阶段”；
- “Offset Noise 为什么有效”；
- “它和 zero terminal SNR 一样吗”。

---

## 本章不做什么

- 不训练 VAE/UNet；
- 不写完整 SD 代码；
- 不跑微调；
- 不做 FID/CLIPScore 实验。

代码只作为可选实验，不进入主线。详细理由见 [08 材料设计理由](../lessons/ch03/08-材料设计理由.md)。

---

## 章节产出（纸面/口述）

1. AE/VAE/VQ-VAE 对比表；
2. SD 数据流图；
3. Attention 公式 + 形状表；
4. 两阶段训练流程图；
5. Offset Noise 解释卡；
6. 90 秒回答录音。

---

## 章节通关清单

- [ ] 能比较 AE/VAE/VQ-VAE；
- [ ] 能写 VAE ELBO 和 VQ 损失；
- [ ] 能画 SD 数据流；
- [ ] 能解释 latent diffusion 的加速；
- [ ] 能写 self/cross attention；
- [ ] 能复述 SD 两阶段训练；
- [ ] 能解释 Offset Noise；
- [ ] 完成 06 练习。

---

## 下一章

[第 4 章 条件控制与个性化](04-conditioning-personalization.md)
