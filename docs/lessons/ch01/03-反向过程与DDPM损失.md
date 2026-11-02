# 1.3 反向过程与 DDPM 损失

> **所属章节**：第 1 章 扩散模型基础  
> **课时**：90 分钟  
> **前置**：1.2 前向过程与噪声 schedule  
> **对应面试题**：D5（核心）、D9（理论闭环）  
> **一句话目标**：学完能从真实后验推到 ELBO，再推到噪声预测损失和采样公式，并解释每一步为什么成立。

---

## 1. 学习目标

学完本节，你应该能够：

1. **写出** DDPM 的反向过程；
2. **推导** 真实后验 $q(x_{t-1}\mid x_t,x_0)$ 的均值和方差；
3. **分解** ELBO，并解释每一项的含义；
4. **推导** 噪声预测参数化 $\mu_\theta$；
5. **解释** 为什么最终可以只用简化 MSE；
6. **写出** 训练和采样的算法流程；
7. **比较** $\epsilon$、$x_0$、$v$ 三种预测目标；
8. **用 2 分钟**回答“推演 DDPM 公式”。

---

## 2. 为什么这一节是 DDPM 的核心

上一节解决了“怎么加噪”。这一节解决“怎么去噪”：

- 真实的反向分布是什么？
- 网络应该学什么？
- 为什么只学噪声就够？
- 训练损失为什么长这样？
- 采样公式怎么来的？

如果只背结论，面试官一追问“为什么后验是高斯”“为什么 $\mathcal L_{\mathrm{simple}}$ 可以丢掉权重”就会露馅。所以本节按“后验 → ELBO → 参数化 → 简化损失 → 采样”的顺序推。

---

## 3. 反向过程：我们要学什么分布

DDPM 假设反向过程也是高斯：

$$
p_\theta(x_{t-1}\mid x_t)
=\mathcal N\left(x_{t-1};\mu_\theta(x_t,t),\Sigma_\theta(x_t,t)\right).
$$

整个反向链：

$$
p_\theta(x_{0:T})
=p(x_T)\prod_{t=1}^{T}p_\theta(x_{t-1}\mid x_t),
\qquad
p(x_T)=\mathcal N(0,I).
$$

目标：让 $p_\theta(x_{t-1}\mid x_t)$ 逼近真实后验 $q(x_{t-1}\mid x_t,x_0)$。

为什么真实后验里会有 $x_0$？

- 只看 $x_t$，我们不知道它来自哪个 $x_0$，反向分布是多峰的；
- 但如果知道 $x_0$，反向就变成一个可计算的高斯；
- 训练时 $x_0$ 是已知的，所以可以用它来构造监督信号；
- 推理时 $x_0$ 未知，所以用网络预测它（或预测噪声）。

---

## 4. 推导真实后验

### 4.1 贝叶斯公式

$$
q(x_{t-1}\mid x_t,x_0)
=\frac{q(x_t\mid x_{t-1})q(x_{t-1}\mid x_0)}{q(x_t\mid x_0)}.
$$

三个分布都是高斯：

$$
q(x_t\mid x_{t-1})
=\mathcal N(\sqrt{\alpha_t}x_{t-1},\beta_t I),
$$

$$
q(x_{t-1}\mid x_0)
=\mathcal N(\sqrt{\bar\alpha_{t-1}}x_0,(1-\bar\alpha_{t-1})I),
$$

$$
q(x_t\mid x_0)
=\mathcal N(\sqrt{\bar\alpha_t}x_0,(1-\bar\alpha_t)I).
$$

分母与 $x_{t-1}$ 无关，可以当常数。分子是两个高斯的乘积，配方后仍是高斯。

### 4.2 配方结果

$$
q(x_{t-1}\mid x_t,x_0)
=\mathcal N\left(x_{t-1};\tilde\mu_t,\tilde\beta_t I\right),
$$

其中：

$$
\boxed{
\tilde\mu_t
=\frac{\sqrt{\bar\alpha_{t-1}}\beta_t}{1-\bar\alpha_t}x_0
+\frac{\sqrt{\alpha_t}(1-\bar\alpha_{t-1})}{1-\bar\alpha_t}x_t
}
$$

$$
\boxed{
\tilde\beta_t
=\frac{1-\bar\alpha_{t-1}}{1-\bar\alpha_t}\beta_t
}
$$

### 4.3 配方直觉

把分子写成 $x_{t-1}$ 的二次型：

$$
-\frac{1}{2}\left[
\frac{\|x_t-\sqrt{\alpha_t}x_{t-1}\|^2}{\beta_t}
+\frac{\|x_{t-1}-\sqrt{\bar\alpha_{t-1}}x_0\|^2}{1-\bar\alpha_{t-1}}
\right].
$$

- 第一项：$x_{t-1}$ 要能生成 $x_t$；
- 第二项：$x_{t-1}$ 要接近 $x_0$ 的加噪版本；
- 两项折中，得到后验均值；
- 二次型系数决定后验方差。

### 4.4 两个极端检查

- 当 $t$ 很小：$\bar\alpha_{t-1}\approx1$，后验应该很接近 $x_0$；
- 当 $t$ 很大：后验不确定性变大，$\tilde\beta_t$ 也变大。

这符合直觉：越靠近纯噪声，越难判断上一步是什么。

---

## 5. ELBO：DDPM 到底在优化什么

### 5.1 从对数似然到 ELBO

$$
\log p_\theta(x_0)
=\log \int p_\theta(x_{0:T})\,dx_{1:T}.
$$

引入前向分布 $q(x_{1:T}\mid x_0)$，用 Jensen 不等式：

$$
\log p_\theta(x_0)
\ge
\mathbb E_q\left[
\log\frac{p_\theta(x_{0:T})}{q(x_{1:T}\mid x_0)}
\right].
$$

展开：

$$
\mathcal L_{\mathrm{VLB}}
=\mathbb E_q\Big[
D_{\mathrm{KL}}\left(q(x_T\mid x_0)\|p(x_T)\right)
+\sum_{t=2}^{T}D_{\mathrm{KL}}\left(q(x_{t-1}\mid x_t,x_0)\|p_\theta(x_{t-1}\mid x_t)\right)
-\log p_\theta(x_0\mid x_1)
\Big].
$$

### 5.2 三项分别是什么

| 项 | 含义 | 直觉 |
|---|---|---|
| $L_T$ | 最后一步边缘与先验的 KL | $x_T$ 是否像标准高斯 |
| $L_{t-1}$ | 每步真实后验与网络后验的 KL | 网络去噪是否准确 |
| $L_0$ | 重建项 | 从 $x_1$ 恢复 $x_0$ 的质量 |

如果 $\bar\alpha_T\approx0$，$q(x_T\mid x_0)\approx\mathcal N(0,I)$，所以 $L_T\approx0$。

### 5.3 每一项怎么算

固定方差 $\Sigma_\theta=\sigma_t^2 I$ 时，两个高斯的 KL：

$$
D_{\mathrm{KL}}
=\frac{1}{2\sigma_t^2}\|\tilde\mu_t-\mu_\theta\|^2+C.
$$

所以中间项变成“均值匹配”：

$$
L_{t-1}
=\mathbb E_q\left[
\frac{1}{2\sigma_t^2}\|\tilde\mu_t-\mu_\theta(x_t,t)\|^2
\right]+C.
$$

这就是 DDPM 把“学分布”变成“学均值”的关键。

---

## 6. 从后验均值到噪声预测

### 6.1 用 $x_t,\epsilon$ 表示 $x_0$

由：

$$
x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,
$$

解出：

$$
x_0
=\frac{x_t-\sqrt{1-\bar\alpha_t}\epsilon}{\sqrt{\bar\alpha_t}}.
$$

### 6.2 代入后验均值

把 $x_0$ 代入 $\tilde\mu_t$，化简得：

$$
\tilde\mu_t
=\frac{1}{\sqrt{\alpha_t}}
\left(
x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\epsilon
\right).
$$

### 6.3 让网络预测噪声

令：

$$
\mu_\theta(x_t,t)
=\frac{1}{\sqrt{\alpha_t}}
\left(
x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\epsilon_\theta(x_t,t)
\right).
$$

于是均值匹配就变成噪声匹配：

$$
L_{t-1}
=\mathbb E\left[
\frac{\beta_t^2}{2\sigma_t^2\alpha_t(1-\bar\alpha_t)}
\|\epsilon-\epsilon_\theta(x_t,t)\|^2
\right].
$$

### 6.4 为什么可以丢掉系数

DDPM 使用简化损失：

$$
\boxed{
\mathcal L_{\mathrm{simple}}
=\mathbb E_{t,x_0,\epsilon}
\left[
\|\epsilon-\epsilon_\theta(\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,t)\|^2
\right]
}
$$

它丢掉了时间相关权重：

$$
\frac{\beta_t^2}{2\sigma_t^2\alpha_t(1-\bar\alpha_t)}.
$$

为什么可以丢？

- 这不是精确 ELBO，而是重新加权；
- 让每个时间步的损失量级更接近；
- 实验上生成质量更好；
- 面试时要明确：**$\mathcal L_{\mathrm{simple}}$ 是简化/重加权目标，不是精确似然。**

---

## 7. 为什么预测噪声等价于学习 score

前向条件分布的对数梯度：

$$
\nabla_{x_t}\log q(x_t\mid x_0)
=-\frac{x_t-\sqrt{\bar\alpha_t}x_0}{1-\bar\alpha_t}
=-\frac{\epsilon}{\sqrt{1-\bar\alpha_t}}.
$$

所以预测 $\epsilon$ 等价于预测 score 的方向。噪声预测不是“随便选的目标”，它和 score matching 是同一件事的两种写法。

---

## 8. 训练与采样流程（理解用，不要求写代码）

### 8.1 训练

1. 取一个真实样本 $x_0$；
2. 均匀随机采一个时间步 $t$；
3. 采标准高斯噪声 $\epsilon$；
4. 计算 $x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon$；
5. 网络预测 $\epsilon_\theta(x_t,t)$；
6. 计算 MSE，反传更新。

### 8.2 采样

1. 从 $x_T\sim\mathcal N(0,I)$ 开始；
2. 对 $t=T,T-1,\dots,1$：
   - 预测 $\epsilon_\theta(x_t,t)$；
   - 计算均值 $\mu_\theta$；
   - 采样 $x_{t-1}=\mu_\theta+\sigma_t z$；
   - $t=1$ 时不再加噪声；
3. 输出 $x_0$。

### 8.3 采样公式

$$
x_{t-1}
=\frac{1}{\sqrt{\alpha_t}}
\left(
x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\epsilon_\theta(x_t,t)
\right)
+\sigma_t z.
$$

- $\sigma_t^2=\beta_t$ 或 $\tilde\beta_t$；
- $t>1$ 时 $z\sim\mathcal N(0,I)$；
- $t=1$ 时 $z=0$。

---

## 9. $\epsilon$、$x_0$、$v$ 三种预测目标

### 9.1 $\epsilon$-prediction

网络输出噪声：

$$
\hat\epsilon=\epsilon_\theta(x_t,t).
$$

优点：

- 目标尺度稳定；
- 与 score 直接对应；
- 最常用。

### 9.2 $x_0$-prediction

网络输出干净图像：

$$
\hat x_0=f_\theta(x_t,t).
$$

优点：

- 直观；
- 可以直接看“预测的图”。

缺点：

- 高噪声时 $x_0$ 很不确定，预测容易不稳；
- 损失尺度随时间变化大。

### 9.3 $v$-prediction

定义：

$$
v=\sqrt{\bar\alpha_t}\epsilon-\sqrt{1-\bar\alpha_t}x_0.
$$

网络预测 $v$，再反解：

$$
x_0=\sqrt{\bar\alpha_t}x_t-\sqrt{1-\bar\alpha_t}v,
$$

$$
\epsilon=\sqrt{\bar\alpha_t}v+\sqrt{1-\bar\alpha_t}x_t.
$$

优点：

- 在高低噪声两端更平衡；
- 常用于改善高噪声端训练。

### 9.4 三者关系

三者数学上可以互相转换，但训练难度不同：

- $\epsilon$：最稳，面试默认；
- $x_0$：直观，但高噪声不稳；
- $v$：平衡，常见于 SD 2.x 768-v 等。

**面试要点**：不要只说“等价”，要补一句“可互转，但训练稳定性和误差尺度不同”。

---

## 10. 一个数值例子

假设：

- $\alpha_t=0.8$，$\beta_t=0.2$；
- $\bar\alpha_t=0.5$；
- $x_t=1.0$；
- 网络预测 $\epsilon_\theta=0.3$。

先算均值：

$$
\mu_\theta
=\frac{1}{\sqrt{0.8}}
\left(
1-\frac{0.2}{\sqrt{0.5}}\cdot0.3
\right)
\approx1.118\times(1-0.0849)
\approx1.023.
$$

若采样噪声 $z=0.5$，$\sigma_t=\sqrt{0.2}\approx0.447$：

$$
x_{t-1}
\approx1.023+0.447\times0.5
\approx1.247.
$$

这个例子说明：

- 去噪不是“直接减掉噪声”，而是先算均值，再加回一点随机性；
- 随机性在采样中仍然存在（DDPM）；
- 如果 $\sigma_t=0$，就是确定性采样（DDIM 的伏笔）。

---

## 11. 90 秒 / 2 分钟回答：推演 DDPM

> **面试官问**：推演一下 DDPM 公式。

**参考回答（约 2 分钟）**：

“DDPM 分前向和反向。前向是马尔可夫加噪：$q(x_t|x_{t-1})=\mathcal N(\sqrt{\alpha_t}x_{t-1},\beta_t I)$，展开得到 $x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon$。反向要学 $p_\theta(x_{t-1}|x_t)$，但真实后验还依赖 $x_0$。用贝叶斯公式，把 $q(x_t|x_{t-1})$ 和 $q(x_{t-1}|x_0)$ 相乘，配方得到 $q(x_{t-1}|x_t,x_0)=\mathcal N(\tilde\mu_t,\tilde\beta_t I)$，其中 $\tilde\mu_t$ 是 $x_0$ 和 $x_t$ 的线性组合。然后最大化 ELBO，分解成最后一步 KL、每步 KL 和重建项；固定方差时，每步 KL 只和均值差有关。把 $x_0$ 用 $x_t,\epsilon$ 替换，均值就变成 $\frac{1}{\sqrt{\alpha_t}}(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\epsilon)$，所以网络只要预测噪声 $\epsilon$。最后简化成 MSE，采样时从高斯开始，逐步算均值再加噪声。”

**如果时间只有 90 秒**：

“前向是马尔可夫高斯加噪，闭式边缘是 $x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon$。反向的真实后验在给定 $x_0$ 时是高斯，均值为 $\tilde\mu_t$。通过 ELBO 和固定方差，训练目标可以化成均值匹配；把 $x_0$ 换成 $x_t,\epsilon$ 后，等价于预测噪声的 MSE。采样就是从 $x_T$ 开始，按后验均值逐步去噪。”

---

## 12. 90 秒回答：实现 DDPM 需要什么条件

> **面试官问**：实现 DDPM 是否需要什么条件？

**参考回答**：

“这个问题要分两层。如果问‘条件生成’，DDPM 本身不需要标签，原始 DDPM 是无条件生成；条件可以通过 cross-attention、AdaGN 或条件 embedding 加。如果问‘实现前提’，最小闭环是：数据、噪声 schedule、一个带时间步编码的网络、噪声预测损失和采样器；理论上需要前向是高斯马尔可夫链、边缘有闭式、反向用高斯近似、$T$ 足够大让 $x_T$ 接近标准高斯。它不需要 GAN 判别器，也不需要显式分类器。要做好还需要 EMA、数据归一化、合适的 schedule 和足够的训练。”

---

## 13. 常见误区

1. **混淆 $q(x_t\mid x_{t-1})$ 和 $q(x_{t-1}\mid x_t,x_0)$**：前者是加噪，后者是真实后验。
2. **把 $\beta_t$ 和 $\tilde\beta_t$ 混用**：前者是每步加噪方差，后者是后验方差。
3. **ELBO 符号写错**：KL 是正的，重建项是负的。
4. **认为 $\mathcal L_{\mathrm{simple}}$ 是精确 ELBO**：它是简化/重加权。
5. **采样最后一步还加噪声**：$t=1$ 时 $z=0$。
6. **认为 $\epsilon$/$x_0$/$v$ 完全一样**：数学可互转，但训练稳定性不同。
7. **忘记 $x_T$ 要先验匹配**：$p(x_T)=\mathcal N(0,I)$。

---

## 14. 课堂练习

> 答案见 [06-章节练习与答案](06-章节练习与答案.md)。

1. 从贝叶斯公式出发，写出后验均值和方差。
2. 证明固定方差时 KL 只和均值差有关。
3. 把 $\tilde\mu_t$ 中的 $x_0$ 换成 $x_t,\epsilon$，推导 $\mu_\theta$。
4. 写出 DDPM 训练和采样的 5 个步骤（文字即可）。
5. 解释为什么 $\mathcal L_{\mathrm{simple}}$ 可以丢掉系数。
6. 用 2 分钟回答“推演 DDPM”。
7. 如果面试官问“为什么预测噪声而不是图像”，你怎么答？

---

## 15. 自测清单

- [ ] 能写出反向过程；
- [ ] 能推导真实后验；
- [ ] 能写出 ELBO 三项；
- [ ] 能推导噪声预测参数化；
- [ ] 能写出简化损失；
- [ ] 能写出采样公式；
- [ ] 能解释 $\epsilon$/$x_0$/$v$；
- [ ] 能 2 分钟回答 D5。

---

## 16. 本节材料为什么这样设计

- **按“后验 → ELBO → 参数化 → 简化”推进**：这是面试最稳的推导顺序。
- **先解释“为什么要后验”**：避免一上来公式劝退。
- **保留关键中间步骤**：面试官会追问“怎么配方”“为什么 KL 只依赖均值”。
- **数值例子**：把采样公式变成可手算的过程。
- **不写完整代码**：重点是推导和解释，代码不是本节目标。
- **单列 D9**：区分“条件生成”和“实现前提”，避免答偏。

详细设计理由见 [08-材料设计理由](08-材料设计理由.md)。

---

## 17. 下一节

[1.4 扩散变体与非高斯噪声](04-扩散变体与非高斯噪声.md)
