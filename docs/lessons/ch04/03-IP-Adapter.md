# 4.3 IP-Adapter

> **所属章节**：第 4 章 条件控制与个性化  
> **课时**：90 分钟  
> **前置**：CLIP、Cross-Attention  
> **对应面试题**：A14  
> **一句话目标**：学完能画出 IP-Adapter 的解耦 cross-attention，解释 image prompt 怎么工作，并区分它与 ControlNet。

---

## 1. 学习目标

学完本节，你应该能够：

1. **解释** 为什么需要 image prompt；
2. **画出** IP-Adapter 的结构；
3. **写出** 解耦 cross-attention 公式；
4. **说明** 为什么只训练少量参数；
5. **解释** `ip_adapter_scale` 和 negative image prompt；
6. **区分** IP-Adapter 与 ControlNet；
7. **用 90 秒**回答 A14。

---

## 2. 为什么需要 image prompt

文本很难描述：

- 一个人的长相；
- 一张图的风格；
- 一件衣服的纹理；
- 一个角色的细节；
- 参考图的构图。

IP-Adapter 的目标：

> 把一张参考图变成“图像 prompt”，注入冻结的 SD，同时保持文本兼容。

---

## 3. 结构

### 3.1 图像编码器

- CLIP ViT-H/14 或 OpenCLIP；
- 提取参考图特征；
- 全局语义/风格。

### 3.2 投影网络

- 把图像特征投影到 SD cross-attention 的维度；
- 得到图像 token 特征 $C_i$。

### 3.3 解耦 Cross-Attention

文本 cross-attention：

$$
\mathrm{Attn}_t
=\mathrm{Attn}(Q,K_t,V_t),
$$

图像 cross-attention：

$$
\mathrm{Attn}_i
=\mathrm{Attn}(Q,K_i,V_i).
$$

输出：

$$
\boxed{
h'
=\mathrm{Attn}(Q,K_t,V_t)
+\lambda\,\mathrm{Attn}(Q,K_i,V_i)
}
$$

- $Q$ 来自图像特征；
- $K_t,V_t$ 来自文本；
- $K_i,V_i$ 来自参考图；
- 两套 K/V 分离，避免文本/图像条件互相干扰；
- $\lambda$ 控制图像条件强度（`ip_adapter_scale`）。

---

## 4. 为什么叫“解耦”

如果直接把图像特征拼到文本 token 后面，再做一套 cross-attention：

- 文本和图像条件会共享同一套 K/V；
- 两种条件的分布不同，容易互相干扰；
- 调文本强度会影响图像，调图像强度会影响文本。

解耦后：

- 文本一套 K/V；
- 图像一套 K/V；
- 共享 Q；
- 输出相加；
- 可以独立调 $\lambda$。

---

## 5. 训练

- 数据：图像-文本对/参考图-目标图；
- 冻结 SD 和 CLIP 图像编码器；
- 只训练投影网络和图像 cross-attention 的 K/V；
- 损失仍是扩散噪声预测；
- 训练时随机丢弃条件，支持 CFG/组合；
- 原版约 22M 可训练参数。

---

## 6. 推理与使用

- 输入参考图 + 文本 prompt；
- `ip_adapter_scale` 控制参考图强度；
- 可以做风格迁移、角色参考、构图参考、人脸参考；
- 支持 negative image prompt（部分实现）；
- 可与 ControlNet 组合：
  - ControlNet 管空间结构；
  - IP-Adapter 管风格/主体/语义；
- **IP-Adapter Plus**：更细粒度图像特征/query transformer，提升细节；
- **IP-Adapter FaceID**：结合人脸识别 embedding，提升身份一致性。

---

## 7. 和 ControlNet 的区别

| 维度 | ControlNet | IP-Adapter |
|---|---|---|
| 条件类型 | 空间图（边缘/深度/姿态） | 参考图（语义/风格/主体） |
| 注入方式 | 编码器分支 + 零卷积 | 解耦 cross-attention |
| 控制内容 | 结构/布局 | 外观/风格/身份 |
| 预处理 | 通常需要（Canny/Depth） | 不需要，直接输入参考图 |
| 组合 | 可叠加 | 可叠加 |

一句话：

> **ControlNet 管“形状”，IP-Adapter 管“长相/风格”。**

---

## 8. 90 秒回答：IP-Adapter 的核心原理

> **面试官问**：介绍一下 IP-Adapter 的核心原理。

**参考回答**：

“IP-Adapter 用 CLIP 图像编码器提取参考图特征，投影后作为额外的图像 cross-attention 条件注入冻结的 SD。它把文本 cross-attention 和图像 cross-attention 解耦：文本一套 K/V，图像一套 K/V，共享 Q，输出相加，用 $\lambda$ 控制图像强度。这样文本和图像条件互不干扰，只训练少量参数（原版约 22M）。它适合风格/主体参考，和 ControlNet 管空间结构不同，两者可以组合。”

---

## 9. 追问与回答

### 追问 1：为什么图像和文本要解耦？

两种条件分布不同，共享 K/V 会互相干扰，也不方便独立调强度。

### 追问 2：为什么只训练少量参数？

冻结 SD/CLIP，保持原模型能力；只学条件注入，训练成本低。

### 追问 3：IP-Adapter 和 ControlNet 怎么选？

要控制姿态/边缘/深度用 ControlNet；要参考风格/人物/构图用 IP-Adapter；可以一起用。

### 追问 4：scale 太大会怎样？

会过度复制参考图，损失文本控制/多样性；太小则不起作用。

---

## 10. 常见误区

1. **说 IP-Adapter 把参考图拼到 latent**：它是 cross-attention 条件。
2. **把它和 ControlNet 混为一谈**：一个语义，一个空间。
3. **忽略 image encoder 的选择**：CLIP ViT-H/14 等影响效果。
4. **认为 scale 越大越好**：会复制/僵硬。
5. **忽略文本/图像条件冲突**：需要调 scale 和 prompt。

---

## 11. 课堂练习

> 答案见 [06 章节练习与答案](06-章节练习与答案.md)。

1. 画 IP-Adapter 结构。
2. 写解耦 cross-attn 公式。
3. 解释为什么只训练少量参数。
4. 比较 IP-Adapter 与 ControlNet。
5. 用 90 秒回答 A14。

---

## 12. 自测清单

- [ ] 能解释 image prompt；
- [ ] 能画解耦 cross-attn；
- [ ] 能解释 22M 参数花在哪；
- [ ] 能调 scale；
- [ ] 能区分 ControlNet；
- [ ] 能 90 秒回答 A14。

---

## 13. 本节材料为什么这样设计

- **先讲 image prompt 的需求**：不然只是背结构。
- **解耦公式单列**：A14 的核心。
- **与 ControlNet 对比**：面试最爱问“两者区别”。
- **scale/组合**：工程高频。
- **不写代码**：本节是架构和原理。

详细设计理由见 [08 材料设计理由](08-材料设计理由.md)。

---

## 14. 下一节

[4.4 LoRA / DreamBooth / Textual Inversion / Hypernetwork](04-LoRA-DreamBooth-TI-Hypernetwork.md)
