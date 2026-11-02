# 3.1 AE/VAE/VQ-VAE 与图像 tokenizer

> **所属章节**：第 3 章 Latent Diffusion 与 Stable Diffusion  
> **课时**：90 分钟  
> **前置**：第 1 章（ELBO、重参数化）  
> **对应面试题**：A2、A3  
> **一句话目标**：学完能比较 AE/VAE/VQ-VAE，解释 SD 为什么用连续 VAE，并写清三者的训练目标。

---

## 1. 学习目标

学完本节，你应该能够：

1. **解释** AE、VAE、VQ-VAE 的隐空间差异；
2. **写出** VAE 的 ELBO 和重参数化；
3. **写出** VQ-VAE 的三项损失；
4. **解释** straight-through 与重参数化的区别；
5. **比较** 连续 VAE 与离散 VQ 在生成中的取舍；
6. **解释** Stable Diffusion 为什么选连续 VAE；
7. **用 90 秒**回答 A2，并接住 A3 的追问。

---

## 2. 为什么先讲 tokenizer

Stable Diffusion 不是直接在像素上扩散，而是：

```text
图像 x ──VAE Encoder──> latent z ──扩散/去噪──> latent z ──VAE Decoder──> 图像
```

所以必须先回答：

- 这个 VAE 是什么？
- 它和 VQ-VAE 有什么区别？
- 它为什么能把 512×512×3 压到 64×64×4？
- 压缩会不会损失细节？

这就是 A2/A3 的位置。

---

## 3. AE：确定性自编码器

### 3.1 结构

- 编码器 $E$：$x\to z$；
- 解码器 $D$：$z\to \hat x$；
- 损失：

$$
\mathcal L_{\mathrm{AE}}
=\|x-D(E(x))\|^2.
$$

### 3.2 特点

- 隐空间是确定性的；
- 没有先验，不能直接采样；
- 隐空间可能有“空洞”，插值效果差；
- 适合压缩、特征学习、去噪。

**面试要点**：AE 能重建，但不是生成模型。

---

## 4. VAE：概率隐空间

### 4.1 结构

编码器输出高斯参数：

$$
q_\phi(z\mid x)
=\mathcal N(\mu_\phi(x),\sigma_\phi^2(x)I).
$$

先验：

$$
p(z)=\mathcal N(0,I).
$$

解码器：

$$
p_\theta(x\mid z).
$$

### 4.2 ELBO

$$
\log p(x)
\ge
\mathbb E_{q_\phi(z\mid x)}[\log p_\theta(x\mid z)]
-D_{\mathrm{KL}}(q_\phi(z\mid x)\|p(z)).
$$

- 第一项：重建；
- 第二项：让后验靠近先验；
- 最大化 ELBO = 重建好 + 隐空间规整。

### 4.3 重参数化

$$
z=\mu+\sigma\odot\epsilon,
\qquad
\epsilon\sim\mathcal N(0,I).
$$

这样梯度可以对 $\mu,\sigma$ 反传。

### 4.4 特点

- 隐空间连续、平滑；
- 可以从先验采样；
- 重建容易模糊；
- KL 太强会导致 posterior collapse（隐变量被忽略）；
- $\beta$-VAE 通过调 KL 权重权衡重建/解耦。

**面试要点**：VAE 是显式密度（下界）模型；它的潜空间思想被 LDM 继承，但 SD 的 VAE 主要用来压缩。

---

## 5. VQ-VAE：离散 codebook

### 5.1 结构

编码器输出连续特征 $z_e(x)$，然后查 codebook：

$$
z_q(x)=e_k,
\qquad
k=\arg\min_j\|z_e(x)-e_j\|_2.
$$

- codebook 有 $K$ 个向量；
- 每个向量维度 $D$；
- 输出是离散 token。

### 5.2 损失

$$
\mathcal L
=\|x-D(z_q)\|^2
+\|\mathrm{sg}[z_e]-z_q\|^2
+\beta\|z_e-\mathrm{sg}[z_q]\|^2.
$$

三项分别：

1. **重建**：解码器要能还原；
2. **codebook**：让 codebook 向量靠近编码器输出；
3. **commitment**：让编码器输出不要离 codebook 太远。

$\mathrm{sg}[\cdot]$ 是 stop-gradient。

### 5.3 Straight-through

最近邻选择不可导，VQ-VAE 用 straight-through：

- 前向用 $z_q$；
- 反向把梯度直接传给 $z_e$；
- 这是有偏梯度，不是严格重参数化。

### 5.4 生成

VQ-VAE 本身只是 tokenizer：

- 先把图像变成离散 token；
- 再训练一个先验（PixelCNN/Transformer）在 token 上生成；
- 采样时先生成 token，再解码。

### 5.5 特点

- 离散 token，适合 Transformer；
- 避免高斯 KL 的 posterior collapse；
- 但可能 codebook collapse（少数 code 被频繁使用）；
- 量化会损失细节。

---

## 6. VQGAN

VQGAN = VQ-VAE + perceptual loss + adversarial loss。

- 判别器提升真实感；
- perceptual loss 改善纹理；
- 常用于高分辨率图像生成；
- DALL·E 1 使用 VQ-VAE 路线。

**面试要点**：VQGAN 不是“新的 VAE”，而是“VQ-VAE + GAN 训练”。

---

## 7. Stable Diffusion 为什么用连续 VAE

SD 使用：

- 连续 VAE；
- 4 通道 latent；
- 8 倍下采样；
- 重建 + perceptual + adversarial 训练；
- 缩放因子（如 0.18215）。

原因：

1. **扩散更适合连续空间**：高斯噪声、连续去噪；
2. **避免量化误差**：VQ 的离散化会丢细节；
3. **latent 更紧凑**：64×64×4 比像素空间小很多；
4. **VAE 可冻结**：训练扩散时不用联合训练 VAE。

对比：

| 维度 | 连续 VAE（SD） | VQ-VAE/VQGAN |
|---|---|---|
| 隐空间 | 连续 | 离散 |
| 扩散 | 自然 | 需要离散扩散/先验 |
| 细节 | 较好 | 量化损失 |
| 生成 | 扩散在 latent | 先 token 再解码 |
| 典型 | SD/SDXL/SD3 | DALL·E 1、VQGAN |

---

## 8. 压缩率计算

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

所以 latent diffusion 的空间元素约少 48 倍，计算量大幅下降。

---

## 9. 90 秒回答：AE/VAE/VQ-VAE 的区别

> **面试官问**：谈谈 AE、VAE 和 VQ-VAE 的区别。

**参考回答**：

“AE 是确定性自编码器，只学重建，隐空间没有先验，不能直接采样。VAE 把隐变量建模成高斯，用 ELBO 训练，重参数化让采样可导，隐空间连续平滑，但重建容易模糊、可能 posterior collapse。VQ-VAE 把连续特征量化到 codebook，得到离散 token，损失是重建 + codebook + commitment，用 straight-through 传梯度；它需要额外先验来生成。Stable Diffusion 用的是连续 VAE，不是 VQ-VAE，因为扩散更适合连续 latent，量化会丢细节。”

---

## 10. 90 秒回答：重参数技巧

> **面试官问**：重参数技巧是什么？

**参考回答**：

“把随机采样写成确定性变换加外部噪声。比如 $z\sim\mathcal N(\mu,\sigma^2)$，写成 $z=\mu+\sigma\odot\epsilon$，$\epsilon\sim\mathcal N(0,I)$，随机性只来自 $\epsilon$，梯度可以对 $\mu,\sigma$ 反传。VAE 用它训练编码器；Diffusion 的前向加噪也是同一个技巧，所以 $x_t$ 可以直接从 $x_0$ 采样。VQ-VAE 的离散选择不能用普通重参数化，通常用 straight-through。”

---

## 11. 常见误区

1. **“AE 能直接生成”**：没有先验，不能直接采样。
2. **“VAE 的 latent 一定解耦”**：不一定，$\beta$-VAE 只是鼓励解耦。
3. **“VQ-VAE 是 VAE 加量化但仍用 KL”**：VQ-VAE 用 codebook 损失，不是高斯 KL。
4. **“SD 的 VAE 是 VQ-VAE”**：SD 用连续 VAE。
5. **“VQ-VAE 不需要先验”**：生成时需要先验模型。
6. **“重参数化和 straight-through 一样”**：前者无偏，后者有偏。

---

## 12. 课堂练习

> 答案见 [06 章节练习与答案](06-章节练习与答案.md)。

1. 写出 VAE ELBO。
2. 写出 VQ-VAE 三项损失。
3. 解释 straight-through 与重参数化的区别。
4. 计算 512×512×3 → 64×64×4 的压缩倍率。
5. 比较连续 VAE 与 VQ-VAE 的优缺点。
6. 用 90 秒回答 A2。

---

## 13. 自测清单

- [ ] 能解释 AE 不能采样；
- [ ] 能写 VAE ELBO；
- [ ] 能写 VQ-VAE 损失；
- [ ] 能解释 straight-through；
- [ ] 能解释 SD 为什么用连续 VAE；
- [ ] 能算压缩倍率；
- [ ] 能 90 秒回答 A2/A3。

---

## 14. 本节材料为什么这样设计

- **先 AE 再 VAE 再 VQ**：按“确定性 → 连续概率 → 离散”递进。
- **三项损失拆开**：VQ-VAE 是 A2 的高频追问。
- **SD 的选择单列**：把 tokenizer 和 LDM 连起来。
- **压缩率计算**：让“为什么快”有数字。
- **不写代码**：本节是结构和公式，不是实现。

详细设计理由见 [08 材料设计理由](08-材料设计理由.md)。

---

## 15. 下一节

[3.2 LDM 与 SD 核心优化](02-LDM与SD核心优化.md)
