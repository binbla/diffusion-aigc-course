# 7.1 综合练习 A：DDPM 纸面推导与采样对比

> **所属章节**：第 7 章 综合练习与面试答辩  
> **课时**：90 分钟工作坊  
> **前置**：第 1–2 章  
> **对应面试题**：D5、D9、D1、D4、D3  
> **一句话目标**：不写代码，完成一页纸 DDPM 推导，并能用 8 分钟白板讲清“前向→后验→ELBO→噪声预测→采样→DDIM”。

---

## 1. 练习目标

完成后，你应该拥有：

1. 一页 A4 DDPM 推导；
2. 一张 DDPM/DDIM 对比表；
3. 一个 4 步 schedule 手算表；
4. 8 分钟白板讲解录音/视频；
5. 5 个追问的答案。

---

## 2. 一页纸结构

### 2.1 前向

$$
q(x_t\mid x_{t-1})
=\mathcal N(\sqrt{\alpha_t}x_{t-1},\beta_t I),
$$

$$
x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon.
$$

### 2.2 后验

$$
q(x_{t-1}\mid x_t,x_0)
=\mathcal N(\tilde\mu_t,\tilde\beta_t I),
$$

$$
\tilde\mu_t
=\frac{\sqrt{\bar\alpha_{t-1}}\beta_t}{1-\bar\alpha_t}x_0
+\frac{\sqrt{\alpha_t}(1-\bar\alpha_{t-1})}{1-\bar\alpha_t}x_t,
$$

$$
\tilde\beta_t
=\frac{1-\bar\alpha_{t-1}}{1-\bar\alpha_t}\beta_t.
$$

### 2.3 ELBO

$$
\mathcal L_{\mathrm{VLB}}
=\mathbb E_q\left[
D_{\mathrm{KL}}(q(x_T|x_0)\|p(x_T))
+\sum_{t=2}^{T}D_{\mathrm{KL}}(q(x_{t-1}|x_t,x_0)\|p_\theta(x_{t-1}|x_t))
-\log p_\theta(x_0|x_1)
\right].
$$

### 2.4 噪声预测

$$
\mu_\theta
=\frac{1}{\sqrt{\alpha_t}}
\left(
x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\epsilon_\theta
\right),
$$

$$
\mathcal L_{\mathrm{simple}}
=\mathbb E\left[
\|\epsilon-\epsilon_\theta(\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,t)\|^2
\right].
$$

### 2.5 采样

$$
x_{t-1}
=\mu_\theta+\sigma_t z.
$$

### 2.6 DDIM

$$
x_{t-1}
=\sqrt{\bar\alpha_{t-1}}\hat x_0
+\sqrt{1-\bar\alpha_{t-1}-\sigma_t^2}\epsilon_\theta
+\sigma_t\epsilon.
$$

---

## 3. 8 分钟白板讲解脚本

### 0–1 分钟：一句话

“DDPM 学的是从噪声逐步去噪；训练只学噪声预测，采样从高斯开始迭代。”

### 1–2 分钟：前向

- 马尔可夫加噪；
- 重参数化；
- 闭式边缘；
- $\bar\alpha_t$ 是累计信号保留率。

### 2–4 分钟：后验

- 贝叶斯公式；
- 两个高斯相乘；
- 配方得到 $\tilde\mu_t,\tilde\beta_t$；
- 给定 $x_0$ 后验才是高斯。

### 4–5 分钟：ELBO

- 三项：$L_T$、$L_{t-1}$、$L_0$；
- 固定方差，KL 只依赖均值；
- 均值匹配 → 噪声预测。

### 5–6 分钟：损失

- 代入 $x_0$；
- 得到 $\mu_\theta$；
- 简化 MSE；
- 说明 $\mathcal L_{\mathrm{simple}}$ 不是精确 ELBO。

### 6–7 分钟：采样

- 从 $x_T\sim\mathcal N(0,I)$；
- 逐步算均值 + 噪声；
- $t=1$ 不加噪声。

### 7–8 分钟：DDIM

- $\sigma=0$ 确定性；
- 可跳步/反演；
- DDPM 是特例。

---

## 4. DDPM/DDIM 对比表

| 维度 | DDPM | DDIM |
|---|---|---|
| 前向 | 马尔可夫 | 非马尔可夫，同边缘 |
| 反向 | 随机 | 可确定 |
| 步数 | 多 | 可跳步 |
| 多样性 | 高 | 较低 |
| 可复现 | 弱 | 强 |
| 编辑 | 不便 | 可反演 |

---

## 5. 手算表

取 $\beta=[0.1,0.2,0.3,0.4]$：

| $t$ | $\bar\alpha_t$ | 信号系数 | 噪声系数 | SNR |
|---|---|---|---|---|
| 1 | 0.9 | 0.949 | 0.316 | 9.00 |
| 2 | 0.72 | 0.849 | 0.529 | 2.57 |
| 3 | 0.504 | 0.710 | 0.704 | 1.02 |
| 4 | 0.3024 | 0.550 | 0.835 | 0.43 |

要求：

- 会算；
- 会解释 SNR；
- 会回答“为什么加噪幅度不一致”。

---

## 6. 5 个追问

1. 为什么 $q(x_t\mid x_0)$ 是高斯？
2. 为什么后验是高斯？
3. 为什么预测噪声等价于 score？
4. 为什么 $\mathcal L_{\mathrm{simple}}$ 能丢系数？
5. DDIM 为什么能跳步/反演？

---

## 7. 评分 Rubric（100 分）

| 维度 | 分值 | 标准 |
|---|---|---|
| 公式正确 | 30 | 无符号/系数错误 |
| 逻辑主线 | 25 | 前向→后验→ELBO→噪声→采样 |
| 解释深度 | 20 | 能解释“为什么” |
| 对比/边界 | 15 | DDPM/DDIM、局限 |
| 表达 | 10 | 8 分钟不卡壳 |

**通过线**：70；优秀：85。

---

## 8. 常见问题

- 把 $\beta_t$ 和 $\tilde\beta_t$ 混用；
- 后验均值系数写错；
- 说 $\mathcal L_{\mathrm{simple}}$ 是精确 ELBO；
- 采样最后一步加噪；
- DDIM 说成另一种训练。

---

## 9. 交付物

- 一页 A4 推导（手写/扫描或 Markdown）；
- 4 步手算表；
- 8 分钟白板视频/录音；
- 5 个追问答案。

---

## 10. 下一节

[7.2 SD 条件控制方案设计](02-SD条件控制方案设计.md)
