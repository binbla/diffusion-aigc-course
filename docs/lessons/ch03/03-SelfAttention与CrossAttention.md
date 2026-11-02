# 3.3 Self-Attention 与 Cross-Attention

> **所属章节**：第 3 章 Latent Diffusion 与 Stable Diffusion  
> **课时**：90 分钟  
> **前置**：3.2 SD 架构  
> **对应面试题**：A8、A16  
> **一句话目标**：学完能写出 self/cross attention 公式，解释 Q/K/V 来源，并说清文本如何进入 SD 的图像特征。

---

## 1. 学习目标

学完本节，你应该能够：

1. **写出** self-attention 和 cross-attention 的公式；
2. **说明** Q/K/V 分别来自哪里；
3. **计算** 两种 attention 的复杂度；
4. **解释** SD 中 cross-attention 的位置与作用；
5. **解释** attention map 如何对应文本 token；
6. **说明** SD3 的 MMDiT 与 cross-attention 的区别；
7. **用 90 秒**回答 A8/A16。

---

## 2. 为什么 attention 是 SD 的关键

SD 的条件生成靠两件事：

- 文本编码器把 prompt 变成 token 特征；
- cross-attention 把 token 特征注入图像特征。

如果没有 cross-attention，文本只是一个全局向量，无法告诉模型“猫在左边、天空在上面”。

---

## 3. Self-Attention

### 3.1 公式

输入序列 $X\in\mathbb R^{N\times d}$：

$$
Q=XW_Q,\qquad
K=XW_K,\qquad
V=XW_V,
$$

$$
\mathrm{Attn}(Q,K,V)
=\mathrm{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V.
$$

- $Q,K,V$ 都来自同一个 $X$；
- 每个位置可以关注其他所有位置；
- 复杂度 $O(N^2d)$。

### 3.2 在 SD 中

- 图像特征图展平成 token；
- self-attention 建模图像内部的长程依赖；
- 通常放在较低分辨率层，控制计算量；
- 卷积提供局部/空间归纳偏置。

### 3.3 特点

- 同模态；
- 对称；
- 适合建模全局关系；
- 需要位置/结构信息（SD 中由卷积和特征图结构提供）。

---

## 4. Cross-Attention

### 4.1 公式

图像特征 $X\in\mathbb R^{N\times d}$，文本特征 $C\in\mathbb R^{L\times d}$：

$$
Q=XW_Q,\qquad
K=CW_K,\qquad
V=CW_V,
$$

$$
\mathrm{CrossAttn}(X,C)
=\mathrm{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V.
$$

- $Q$ 来自图像；
- $K,V$ 来自文本；
- 每个图像位置对每个文本 token 分配注意力；
- 复杂度 $O(NLd)$。

### 4.2 形状例子

假设：

- 图像特征 $16\times16$，$N=256$；
- 文本长度 $L=77$；
- 维度 $d=320$。

则：

- $Q$：$256\times320$；
- $K^\top$：$320\times77$；
- 注意力矩阵：$256\times77$；
- 输出：$256\times320$。

### 4.3 在 SD 中

- 每个分辨率层：ResBlock → Self-Attn → Cross-Attn → FFN；
- 文本编码只做一次；
- 每个 cross-attn block 有自己的 $W_Q,W_K,W_V$；
- 文本编码器通常冻结。

### 4.4 作用

- token 级对齐；
- 属性绑定；
- prompt 权重；
- attention map 可视化；
- prompt-to-prompt 编辑。

---

## 5. 复杂度对比

| 类型 | 复杂度 | 说明 |
|---|---|---|
| Self-Attention | $O(N^2d)$ | 图像 token 两两交互 |
| Cross-Attention | $O(NLd)$ | 图像 token 与文本 token 交互 |

通常 $L=77$，$N=H\times W$。在低分辨率层，$N$ 较小，cross-attn 成本可控。

---

## 6. Attention Map 与文本对齐

cross-attention 的注意力矩阵：

$$
A=\mathrm{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)
\in\mathbb{R}^{N\times L}.
$$

- 每一行是一个图像位置对所有文本 token 的权重；
- 可以可视化某个 token 关注哪些区域；
- 可以用于 prompt-to-prompt、attention edit；
- 但 attention 不是解释性的“因果图”，只是相关性。

---

## 7. SD 中 Cross-Attention 的局限

1. **77 token 限制**：长 prompt 被截断；
2. **bag-of-words**：弱计数、空间、否定；
3. **单向**：图像查文本，文本不反看图像；
4. **文本渲染弱**：复杂排版困难；
5. **属性绑定不稳定**：颜色/对象可能错配；
6. **分辨率限制**：cross-attn 多放在低分辨率层。

---

## 8. MMDiT：SD3 的变化

SD3 不再用 UNet + cross-attention，而用 MMDiT：

- 文本 token 和图像 token 分别投影；
- 拼接后做**联合 self-attention**；
- 不同模态使用不同 QKV/MLP；
- 双向交互；
- QK normalization 稳定训练。

区别：

| 维度 | Cross-Attention（SD1/2/XL） | MMDiT（SD3） |
|---|---|---|
| 交互 | 图像查文本，单向 | 文本/图像联合，双向 |
| 主干 | UNet | Transformer |
| 条件 | 外挂 cross-attn | 内嵌联合 attention |
| 扩展性 | 受 UNet 限制 | 更容易 scale |

---

## 9. 90 秒回答：SD 中的交叉注意力

> **面试官问**：谈谈 Stable Diffusion 中的交叉注意力机制。

**参考回答**：

“在 SD 里，cross-attention 的图像特征提供 Query，文本 token 提供 Key/Value。具体是 $Q=XW_Q$，$K=CW_K$，$V=CW_V$，然后 softmax 注意力加权。这样每个图像位置都能关注 prompt 里的不同词，实现 token 级条件注入。它通常放在 UNet 的低分辨率层，文本编码只做一次，每个 block 有自己的投影。局限是 77 token、组合性弱、单向；SD3 改用 MMDiT 的联合注意力。”

---

## 10. 90 秒回答：Self-Attention 与 Cross-Attention 的区别

> **面试官问**：self attention 和 cross attention 的区别？

**参考回答**：

“核心是 Q/K/V 的来源。Self-attention 的 Q/K/V 都来自同一个序列，建模模态内部依赖；cross-attention 的 Q 来自目标序列，K/V 来自条件序列，建模跨模态对齐。复杂度上 self 是 $O(N^2)$，cross 是 $O(NM)$。在 SD 里，self-attention 建模图像内部关系，cross-attention 让图像查文本。SD3 的 MMDiT 把两种 token 拼起来做联合 self-attention，但不同模态用不同投影。”

---

## 11. 常见误区

1. **把 cross-attention 的 Q 说成文本**：Q 来自图像。
2. **把 cross-attention 当成文本 self-attention**：K/V 来自文本，但 Q 来自图像。
3. **忽略 77 token**：长 prompt 会截断。
4. **认为 attention map 是因果解释**：只是相关性。
5. **把 MMDiT 说成“更大的 cross-attn”**：它是联合注意力。

---

## 12. 课堂练习

> 答案见 [06 章节练习与答案](06-章节练习与答案.md)。

1. 写出 self/cross attention 公式。
2. 给定 $N=256,L=77,d=320$，写出 Q/K/V 和注意力矩阵形状。
3. 解释 cross-attention 的 Q/K/V 来源。
4. 比较两种 attention 的复杂度。
5. 画 SD 中 attention 的位置。
6. 用 90 秒回答 A8/A16。

---

## 13. 自测清单

- [ ] 能写两种 attention 公式；
- [ ] 能说 Q/K/V 来源；
- [ ] 能算复杂度；
- [ ] 能画 SD 中的位置；
- [ ] 能解释 attention map；
- [ ] 能说 MMDiT 的区别；
- [ ] 能 90 秒回答 A8/A16。

---

## 14. 本节材料为什么这样设计

- **公式 + 形状**：面试常追问“Q 从哪来”。
- **复杂度对比**：解释为什么 cross-attn 放低分辨率。
- **Attention map**：连接可视化与编辑。
- **MMDiT 预告**：为 SD3 铺垫。
- **不写代码**：本节是结构和公式。

详细设计理由见 [08 材料设计理由](08-材料设计理由.md)。

---

## 15. 下一节

[3.4 SD 训练与 Offset Noise](04-SD训练与OffsetNoise.md)
