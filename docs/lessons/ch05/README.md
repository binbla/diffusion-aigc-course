# 第 5 章教学材料包：模型演进与系统对比

> **定位**：面试学习，不是工程复现课。  
> **不要求**训练 SDXL/SD3、不要求复现 DALL·E 2、不要求跑 GAN。  
> **要求**：能讲清 SDXL/SD3 的改动、SD 与 DALL·E 2 的路线差异、GAN 与 Diffusion 的取舍。

---

## 1. 这一包材料解决什么问题

第 5 章对应 4 道高频题：

- A7：SD 和 DALL·E 2 的异同；
- A10：SDXL 的核心优化；
- A11：SD3 的核心优化；
- D6：GAN 和 Diffusion 的区别。

这四道题是“模型演进线”：

```text
SD1.5（UNet + CLIP + Cross-Attn）
   ↓
SDXL（更大 UNet + 双文本编码器 + micro-conditioning + refiner）
   ↓
SD3（MMDiT + Rectified Flow + T5 + 16ch VAE）
   ↓
对比：DALL·E 2（unCLIP：prior + decoder）、GAN（对抗、一步）
```

学完这一包，你能把“模型为什么这样演进”讲成设计动机，而不是背参数。

---

## 2. 材料清单

| 文件 | 是什么 | 为什么需要 | 学完能做什么 |
|---|---|---|---|
| [5.1 SDXL](01-SDXL.md) | 1024 时代 | A10 的核心 | 讲双文本编码器/micro-conditioning/refiner |
| [5.2 SD3](02-SD3.md) | Transformer/Flow 时代 | A11 的核心 | 讲 MMDiT/Rectified Flow/T5/16ch VAE |
| [5.3 SD vs DALL·E 2 vs GAN](03-SD-DALLE2-GAN.md) | 路线对比 | A7、D6 的核心 | 画 LDM/unCLIP/GAN，做选型 |
| [05 章节面试题库](05-章节面试题库.md) | 面试演练 | 把知识压缩成 90 秒答案 | 回答 A7/A10/A11/D6 |
| [06 章节练习与答案](06-章节练习与答案.md) | 纸面练习 | 不写代码也能检查理解 | 对比架构、写 Flow loss、做选型 |
| [07 讲师手册](07-讲师手册.md) | 授课脚本 | 3 节课可讲、可控制节奏 | 按 90 分钟组织课堂 |
| [08 材料设计理由](08-材料设计理由.md) | 设计说明 | 解释取舍、边界与可修改点 | 判断是否加深/换案例 |

---

## 3. 建议学习顺序

### 自学版（约 4–5 小时）

1. 读 5.1，列 SDXL 四项改动；
2. 读 5.2，写 Flow loss，画 MMDiT；
3. 读 5.3，画 LDM/unCLIP/GAN 三路线；
4. 做 06 练习；
5. 用 05 做 90 秒回答；
6. 用 08 检查边界。

### 授课版（3 节 × 90 分钟）

- 第 1 节：5.1；
- 第 2 节：5.2；
- 第 3 节：5.3 + 面试演练。

详细节奏见 [07 讲师手册](07-讲师手册.md)。

---

## 4. 本章不做什么

- 不训练 SDXL/SD3；
- 不复现 DALL·E 2；
- 不跑 GAN；
- 不做 FID/CLIPScore 实验。

本章只保留架构、动机、公式和选型。

---

## 5. 本章验收清单

- [ ] 能说出 SDXL 的四项核心改动；
- [ ] 能解释 micro-conditioning；
- [ ] 能解释 base + refiner；
- [ ] 能写 Rectified Flow 的 loss；
- [ ] 能解释 MMDiT 与 Cross-Attention 的区别；
- [ ] 能说出 T5/16ch VAE 的作用；
- [ ] 能画 LDM vs unCLIP vs GAN；
- [ ] 能 90 秒回答 A7/A10/A11/D6。

---

## 6. 对应面试题

| 题目 | 主材料 | 辅助材料 |
|---|---|---|
| A7 SD vs DALL·E 2 | 5.3 | 05、06 |
| A10 SDXL | 5.1 | 05、06 |
| A11 SD3 | 5.2 | 05、06 |
| D6 GAN vs Diffusion | 5.3 | 05、06 |

---

## 7. 设计原则

> **每一次演进都要回答：改了什么、解决什么、代价是什么。**

只背“SDXL 更大、SD3 用 Transformer”不够，要能说出为什么。
