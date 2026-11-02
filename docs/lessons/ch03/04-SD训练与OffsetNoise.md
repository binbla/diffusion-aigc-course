# 3.4 SD 训练与 Offset Noise

> **所属章节**：第 3 章 Latent Diffusion 与 Stable Diffusion  
> **课时**：90 分钟  
> **前置**：3.1–3.3  
> **对应面试题**：A6、D7  
> **一句话目标**：学完能复述 SD 两阶段训练，解释每个训练 trick 的作用，并说清 Offset Noise 为什么能改善极暗/极亮图像。

---

## 1. 学习目标

学完这一节，你应该能够：

1. **复述** SD 的两阶段训练；
2. **解释** 为什么冻结 VAE 和文本编码器；
3. **说明** CFG dropout、EMA、bucketing 的作用；
4. **区分** $\epsilon$/$v$/flow 三种预测目标；
5. **解释** Offset Noise 的动机、公式和代价；
6. **区分** Offset Noise、Zero Terminal SNR、$v$-prediction；
7. **用 2 分钟**回答 A6，用 90 秒回答 D7。

---

## 2. 两阶段训练总览

```text
阶段 1：训练 VAE（图像 ↔ latent）
        ↓
阶段 2：冻结 VAE，训练 Latent Diffusion UNet
        ↓
        文本编码器通常也冻结
```

### 2.1 阶段 1：VAE

- 编码器 $E$：图像 → 4 通道 latent；
- 解码器 $D$：latent → 图像；
- 损失：
  - 重建损失（L1/L2）；
  - perceptual loss（LPIPS）；
  - adversarial loss（patch discriminator）。
- 目标：8 倍下采样，同时保留细节；
- 训练好后冻结。

### 2.2 阶段 2：Latent Diffusion

1. 图像 $x_0$ → VAE 编码 $z_0$；
2. 采样 $t$、噪声 $\epsilon$；
3. $z_t=\sqrt{\bar\alpha_t}z_0+\sqrt{1-\bar\alpha_t}\epsilon$；
4. 文本编码 $c$；
5. UNet 预测 $\epsilon_\theta(z_t,t,c)$；
6. MSE 损失，反传更新 UNet。

目标：

$$
\mathcal L
=\mathbb E_{z_0,t,\epsilon,c}
\left[
\|\epsilon-\epsilon_\theta(z_t,t,c)\|^2
\right].
$$

---

## 3. 关键训练 trick

### 3.1 冻结 VAE

- VAE 已能压缩/解码；
- 联合训练不稳定、计算量大；
- 冻结后扩散只学去噪；
- 代价：VAE 重建质量成为上限。

### 3.2 冻结文本编码器

- CLIP 已经学好语义；
- 冻结降低训练成本；
- 只训练 cross-attention 投影和 UNet；
- 代价：文本编码器的 77 token/组合性限制会传递。

### 3.3 CFG dropout

- 以约 10% 概率把文本置空；
- 让同一网络同时具备条件和无条件能力；
- 推理时才能做 CFG。

### 3.4 EMA

- 维护模型权重的滑动平均；
- 采样时用 EMA 权重；
- 提升稳定性/质量。

### 3.5 分辨率分桶

- 多宽高比训练；
- 避免统一 resize 造成裁剪/变形；
- 每个 batch 内按分辨率分桶；
- 提升多比例生成质量。

### 3.6 数据过滤

- 分辨率；
- aesthetic 分数；
- NSFW；
- 水印/重复；
- caption 质量。

### 3.7 混合精度/梯度检查点

- 降显存；
- 提速；
- 大模型训练必备。

---

## 4. 预测目标：$\epsilon$ / $v$ / flow

### 4.1 $\epsilon$-prediction

网络预测噪声：

$$
\hat\epsilon=\epsilon_\theta(z_t,t,c).
$$

- 最常用；
- 目标尺度稳定；
- SD1.x/XL 常见。

### 4.2 $v$-prediction

$$
v=\sqrt{\bar\alpha_t}\epsilon-\sqrt{1-\bar\alpha_t}z_0.
$$

- 高低噪声两端更平衡；
- SD2.1 768-v 等使用；
- 可与 zero terminal SNR 配合。

### 4.3 Flow / velocity

SD3 使用 Rectified Flow：

$$
z_t=(1-t)z_0+t\epsilon,
\qquad
v=\epsilon-z_0.
$$

- 预测速度；
- Euler/Heun 采样；
- 见第 5 章。

> 具体版本以官方配置为准，面试时说“SD1.x/XL 常用 ε，SD2 有 v 变体，SD3 用 flow”即可。

---

## 5. Offset Noise

### 5.1 现象

SD 容易生成“中间亮度”的图：

- 极暗/极亮场景不稳定；
- 纯黑/纯白背景容易灰；
- prompt 写“very dark”不一定有效。

### 5.2 原因：低频噪声不足

标准前向：

$$
z_t=\sqrt{\bar\alpha_t}z_0+\sqrt{1-\bar\alpha_t}\epsilon,
\qquad
\epsilon\sim\mathcal N(0,I).
$$

标准高斯噪声每个像素独立、均值为 0，**整张图的平均噪声接近 0**。因此训练时很少出现“整张 latent 有明显正/负偏移”的样本。

但生成极暗图需要 latent 有明显负均值。模型没怎么见过这种全局偏移，就容易回归到数据集的平均亮度。

### 5.3 做法

给噪声加一个每通道共享、空间不变的偏移：

$$
\tilde\epsilon=\epsilon+\eta,
\qquad
\eta\sim\mathcal N(0,\sigma_{\mathrm{offset}}^2 I_c),
$$

其中 $\eta$ 在每个通道内所有空间位置相同，$\sigma_{\mathrm{offset}}$ 常取 0.1 左右。

训练时：

$$
z_t
=\sqrt{\bar\alpha_t}z_0
+\sqrt{1-\bar\alpha_t}(\epsilon+\eta).
$$

推理时仍用标准高斯噪声，不需要额外加 offset。

### 5.4 效果与代价

改善：

- 极暗/极亮；
- 强对比；
- 纯色背景；
- 全局亮度控制。

代价：

- 可能影响部分构图/多样性；
- 属于微调技巧；
- 不是原始 SD 的必需组件。

### 5.5 和 Zero Terminal SNR / $v$-prediction 的区别

| 方法 | 解决什么 |
|---|---|
| Offset Noise | 低频亮度偏移不足 |
| Zero Terminal SNR | $t=T$ 端点训练/推理不一致 |
| $v$-prediction | 高低噪声端预测尺度不平衡 |

三者可以组合，但机制不同。

---

## 6. 90 秒回答：Offset Noise 为什么有用

> **面试官问**：训练 SD 时为什么要用 Offset Noise？

**参考回答**：

“标准高斯噪声每个像素独立、均值为 0，整张图的低频/平均分量很小。SD 训练时很少见到整体偏亮或偏暗的 latent，所以模型倾向于生成中间亮度，极暗/极亮不稳定。Offset Noise 在噪声上加一个每通道共享、空间不变的偏移，让训练样本出现全局亮度变化，模型就学会去噪任意直流偏移。推理时仍用标准噪声。它改善亮度和对比度，但可能影响多样性，是微调技巧，不是扩散理论必需。”

---

## 7. 2 分钟回答：SD 怎么训练

> **面试官问**：Stable Diffusion 是怎么训练的？

**参考回答**：

“分两阶段。第一阶段训练 VAE：编码器把图像压到 8 倍下采样、4 通道 latent，解码器重建，损失是重建 + perceptual + adversarial；训练好后冻结。第二阶段在 latent 上训练扩散 UNet：图像编码成 $z_0$，加噪得到 $z_t$，CLIP 编码文本，UNet 预测噪声，用 MSE 训练。文本编码器通常冻结，训练时以约 10% 概率丢弃文本条件，支持 CFG；还用 EMA、混合精度、分辨率分桶和数据过滤。推理时从噪声开始，用 UNet 逐步去噪，再 VAE 解码。”

---

## 8. 常见误区

1. **“SD 端到端训练 VAE + UNet”**：两阶段，VAE 冻结。
2. **“文本编码器也全量训练”**：通常冻结。
3. **“Offset Noise 是推理技巧”**：训练时用，推理不用。
4. **“Offset Noise 和 zero terminal SNR 一样”**：机制不同。
5. **“CFG dropout 是为了省算力”**：是为了训练无条件分支。
6. **“VAE 越大越好”**：重建质量和 latent 维度要平衡。

---

## 9. 课堂练习

> 答案见 [06 章节练习与答案](06-章节练习与答案.md)。

1. 画两阶段训练流程图。
2. 写出 LDM 训练损失。
3. 解释 CFG dropout。
4. 解释 Offset Noise 的低频逻辑。
5. 区分 Offset Noise / zero terminal SNR / $v$-pred。
6. 用 90 秒回答 D7。

---

## 10. 自测清单

- [ ] 能复述两阶段训练；
- [ ] 能解释冻结 VAE/文本编码器；
- [ ] 能解释 CFG dropout/EMA/bucketing；
- [ ] 能区分预测目标；
- [ ] 能解释 Offset Noise；
- [ ] 能 2 分钟回答 A6；
- [ ] 能 90 秒回答 D7。

---

## 11. 本节材料为什么这样设计

- **两阶段先讲清**：A6 的主线。
- **trick 逐项解释**：面试常追问“为什么”。
- **Offset Noise 单列**：D7 的核心。
- **三种亮度/端点方法对比**：避免混淆。
- **不写代码**：本节是训练流程和动机。

详细设计理由见 [08 材料设计理由](08-材料设计理由.md)。

---

## 12. 下一节

[章节面试题库](05-章节面试题库.md)
