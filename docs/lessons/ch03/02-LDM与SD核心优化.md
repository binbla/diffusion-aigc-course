# 3.2 LDM 与 SD 核心优化

> **所属章节**：第 3 章 Latent Diffusion 与 Stable Diffusion  
> **课时**：90 分钟  
> **前置**：3.1 VAE/VQ-VAE  
> **对应面试题**：A5  
> **一句话目标**：学完能画出 SD 数据流，解释 Latent Diffusion 为什么快，并说清 VAE/UNet/CLIP/Cross-Attn/CFG 的分工。

---

## 1. 学习目标

学完本节，你应该能够：

1. **解释** Latent Diffusion 与像素扩散的区别；
2. **画出** SD 的完整数据流；
3. **说明** VAE、UNet、文本编码器、Cross-Attention 各自负责什么；
4. **计算** latent 压缩带来的计算量下降；
5. **解释** SD 的核心优化与瓶颈；
6. **用 90 秒**回答 A5，并接住“为什么不用像素扩散”的追问。

---

## 2. 从像素扩散到 Latent Diffusion

像素扩散：

$$
x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,
$$

网络直接在 $x\in\mathbb R^{H\times W\times3}$ 上去噪。

Latent Diffusion：

$$
z_0=\mathcal E(x_0),
$$

在 latent 上扩散：

$$
z_t=\sqrt{\bar\alpha_t}z_0+\sqrt{1-\bar\alpha_t}\epsilon,
$$

网络预测 $\epsilon_\theta(z_t,t,c)$，最后：

$$
\hat x_0=\mathcal D(z_0).
$$

关键区别：

- 扩散发生在低维 latent；
- VAE 只编码/解码一次；
- 文本条件通过 cross-attention 注入 UNet。

---

## 3. SD 的完整数据流

```text
文本 prompt
   │
   ▼
CLIP Text Encoder
   │  token embeddings
   ▼
Cross-Attention（注入 UNet）
   ▲
   │
噪声 z_T ──> UNet 去噪 ──> z_0 ──> VAE Decoder ──> 图像
```

更细一点：

1. 文本 → tokenizer → CLIP → 文本 token 特征；
2. 图像（训练时）→ VAE Encoder → latent $z_0$；
3. 采样噪声 $\epsilon$，得到 $z_t$；
4. UNet 输入 $z_t$、时间步 $t$、文本条件 $c$；
5. UNet 内 self-attention 建模图像内部关系，cross-attention 注入文本；
6. 预测噪声，逐步去噪到 $z_0$；
7. VAE Decoder 解码成图像。

---

## 4. 四个核心组件

### 4.1 VAE

- 图像 ↔ latent；
- 8 倍下采样，4 通道；
- 训练：重建 + perceptual + adversarial；
- 冻结后用于扩散训练；
- 是生成质量的“上限”之一。

### 4.2 UNet

- 去噪主干；
- 编码器—解码器 + skip connection；
- 残差块、self-attention、cross-attention；
- 时间步通过 embedding 注入。

### 4.3 文本编码器

- SD1.x/2.x 用 CLIP；
- SDXL 用 CLIP-L + OpenCLIP bigG；
- SD3 加 T5；
- 通常冻结，只训练 cross-attention 投影和 UNet。

### 4.4 Cross-Attention

- 图像特征做 Query；
- 文本 token 做 Key/Value；
- 把文本信息注入每个空间位置；
- 是 SD 条件生成的核心。

### 4.5 CFG

- 训练时条件 dropout；
- 推理时条件和无条件组合；
- 提升 prompt 跟随；
- 成本约翻倍。

---

## 5. 为什么 Latent Diffusion 快

### 5.1 计算量对比

512×512×3：

$$
512\times512\times3=786{,}432.
$$

64×64×4：

$$
64\times64\times4=16{,}384.
$$

倍率：

$$
786{,}432/16{,}384\approx48.
$$

### 5.2 注意力成本

Self-attention 复杂度与 token 数的平方相关：

$$
O(N^2).
$$

latent 的 $N$ 从 $512^2$ 降到 $64^2$，注意力成本大幅下降。

### 5.3 VAE 只跑一次

- 编码一次；
- 扩散多步都在 latent；
- 解码一次；
- 相比每步都在像素空间跑 UNet，省很多。

---

## 6. SD 的核心优化到底是什么

如果只选一个：

> **Latent Diffusion：把扩散搬到 VAE 潜空间。**

围绕它的四个关键设计：

1. **VAE 压缩**：降低空间维度；
2. **Cross-Attention**：文本条件注入；
3. **CFG**：增强 prompt 跟随；
4. **UNet/数据/训练配方**：质量与可扩展性。

面试时不要只说“SD 用了 latent”，要能解释：

- latent 多大；
- 为什么快；
- VAE 为什么是瓶颈；
- 文本怎么进去。

---

## 7. 瓶颈在哪里

1. **VAE 重建质量**：VAE 糊，最终图也糊；
2. **文本编码器上限**：CLIP 77 token、组合性弱；
3. **Cross-Attention 分辨率/层数**：条件注入不够细；
4. **采样步数/CFG**：速度与质量权衡；
5. **显存带宽**：高分辨率/大模型；
6. **数据质量**：caption、分辨率、审美过滤。

---

## 8. 版本差异（预告）

| 版本 | 主要变化 |
|---|---|
| SD 1.x | CLIP-L，512，UNet，4ch VAE |
| SD 2.x | OpenCLIP-H，512/768，ε/v |
| SDXL | 双文本编码器，1024，micro-conditioning，refiner |
| SD3 | MMDiT，Rectified Flow，T5，16ch VAE |

本节先把 SD1.x 的架构讲清，后面再展开演进。

---

## 9. 90 秒回答：SD 的核心优化

> **面试官问**：Stable Diffusion 的核心优化是什么？

**参考回答**：

“核心是 Latent Diffusion：先用 VAE 把图像压到 8 倍下采样、4 通道的 latent，扩散在 latent 上做，而不是像素空间。512×512×3 变成 64×64×4，空间元素少约 48 倍，注意力和卷积成本大幅下降。然后 UNet 去噪，文本通过 CLIP + cross-attention 注入，推理用 CFG 增强 prompt 跟随。VAE 只编码/解码一次，所以整体比像素扩散快很多。代价是 VAE 重建质量会成为上限，文本编码器也有 77 token 等限制。”

---

## 10. 追问与回答

### 追问 1：为什么不用像素扩散？

计算量太大，高分辨率下注意力/卷积成本高；latent 压缩后可以在有限算力下训练大模型。

### 追问 2：VAE 会不会损失细节？

会，VAE 是瓶颈；所以 SD 的 VAE 用 perceptual + adversarial 训练，SD3 还用 16 通道 VAE 改善重建。

### 追问 3：文本编码器为什么要冻结？

降低训练成本、保持语义能力；只训练 cross-attention 和 UNet 就够。

### 追问 4：CFG 是必须的吗？

不是，但它是提升 prompt 跟随的主流方法；代价是两次前向和可能的过饱和。

---

## 11. 常见误区

1. **“SD 在像素空间扩散”**：它在 VAE latent 上扩散。
2. **“latent 越小越好”**：太小会丢细节，VAE 重建是瓶颈。
3. **“VAE 负责生成”**：生成由扩散完成，VAE 负责压缩/解码。
4. **“文本编码器也全量训练”**：通常冻结。
5. **“SD 的核心只是 UNet 更大”**：核心是 latent diffusion + 条件注入。

---

## 12. 课堂练习

> 答案见 [06 章节练习与答案](06-章节练习与答案.md)。

1. 画 SD 数据流。
2. 计算 512/768/1024 的 latent 尺寸（8 倍下采样）。
3. 解释为什么 latent diffusion 快。
4. 说出 VAE/UNet/CLIP/Cross-Attn 的分工。
5. 用 90 秒回答 A5。

---

## 13. 自测清单

- [ ] 能画 SD 数据流；
- [ ] 能解释 latent diffusion；
- [ ] 能算压缩倍率；
- [ ] 能说出四个核心组件；
- [ ] 能指出至少两个瓶颈；
- [ ] 能 90 秒回答 A5。

---

## 14. 本节材料为什么这样设计

- **先数据流再组件**：先有全局图，再拆模块。
- **计算量数字**：让“为什么快”可验证。
- **瓶颈单列**：面试常追问“SD 的局限”。
- **不写代码**：本节是架构和取舍。

详细设计理由见 [08 材料设计理由](08-材料设计理由.md)。

---

## 15. 下一节

[3.3 Self-Attention 与 Cross-Attention](03-SelfAttention与CrossAttention.md)
