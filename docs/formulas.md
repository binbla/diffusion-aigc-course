# 公式速查

> 用途：面试前 10 分钟快速回忆。  
> 每个公式标注“对应课时”，卡住时回到章节。

---

## 1. DDPM 前向

$$
q(x_t\mid x_{t-1})
=\mathcal N\left(x_t;\sqrt{\alpha_t}x_{t-1},\beta_t I\right),
\quad \alpha_t=1-\beta_t.
$$

对应：1.2。

---

## 2. 闭式边缘

$$
x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,
\quad \epsilon\sim\mathcal N(0,I),
$$

$$
\bar\alpha_t=\prod_{s=1}^{t}\alpha_s.
$$

对应：1.2、D5。

---

## 3. 真实后验

$$
q(x_{t-1}\mid x_t,x_0)
=\mathcal N\left(x_{t-1};\tilde\mu_t,\tilde\beta_t I\right),
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

对应：1.3、D5。

---

## 4. DDPM 简化损失

$$
\mathcal L_{\mathrm{simple}}
=\mathbb E_{t,x_0,\epsilon}
\left[
\left\|\epsilon-\epsilon_\theta
\left(\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,t\right)
\right\|^2
\right].
$$

对应：1.3、D5。

---

## 5. DDPM 采样

$$
x_{t-1}
=\frac{1}{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\epsilon_\theta(x_t,t)\right)
+\sigma_t z.
$$

- $t>1$ 时 $z\sim\mathcal N(0,I)$；$t=1$ 时 $z=0$；
- $\sigma_t^2=\beta_t$ 或 $\tilde\beta_t$。

对应：2.1、D1。

---

## 6. DDIM 更新

$$
\hat x_0
=\frac{x_t-\sqrt{1-\bar\alpha_t}\epsilon_\theta(x_t,t)}{\sqrt{\bar\alpha_t}},
$$

$$
x_{t-1}
=\sqrt{\bar\alpha_{t-1}}\hat x_0
+\sqrt{1-\bar\alpha_{t-1}-\sigma_t^2}\,\epsilon_\theta(x_t,t)
+\sigma_t\epsilon.
$$

- $\sigma_t=0$：确定性 DDIM；
- $\sigma_t^2=\tilde\beta_t$ 且全步：DDPM 特例。

对应：2.1、D4。

---

## 7. CFG

$$
\tilde\epsilon
=\epsilon_\theta(x_t,\varnothing)
+w\left(\epsilon_\theta(x_t,c)-\epsilon_\theta(x_t,\varnothing)\right).
$$

负向 prompt：

$$
\tilde\epsilon
=\epsilon_\theta(x_t,c_{\mathrm{neg}})
+w\left(\epsilon_\theta(x_t,c)-\epsilon_\theta(x_t,c_{\mathrm{neg}})\right).
$$

对应：2.4、D8。

---

## 8. Classifier Guidance

$$
\tilde\epsilon
=\epsilon_\theta(x_t)
-s\sqrt{1-\bar\alpha_t}
\nabla_{x_t}\log p_\phi(c\mid x_t).
$$

对应：2.4、D8。

---

## 9. CLIP 损失

$$
s_{ij}=\frac{u_i^\top v_j}{\tau},
$$

$$
\mathcal L
=-\frac{1}{2N}\sum_{i=1}^{N}
\left[
\log\frac{e^{s_{ii}}}{\sum_j e^{s_{ij}}}
+
\log\frac{e^{s_{ii}}}{\sum_j e^{s_{ji}}}
\right].
$$

对应：4.1、A1。

---

## 10. VAE ELBO

$$
\log p(x)
\ge
\mathbb E_{q(z|x)}[\log p(x|z)]
-D_{\mathrm{KL}}(q(z|x)\|p(z)).
$$

重参数化：

$$
z=\mu+\sigma\odot\epsilon,
\quad \epsilon\sim\mathcal N(0,I).
$$

对应：3.1、A2、A3。

---

## 11. VQ-VAE 损失

$$
\mathcal L
=\|x-D(z_q)\|^2
+\|\mathrm{sg}[z_e]-z_q\|^2
+\beta\|z_e-\mathrm{sg}[z_q]\|^2.
$$

对应：3.1、A2。

---

## 12. LoRA

$$
W'=W+\frac{\alpha}{r}BA.
$$

- $B\in\mathbb R^{d\times r}$，$A\in\mathbb R^{r\times k}$；
- $B$ 初始化为 0，$A$ 随机。

对应：4.4、A12。

---

## 13. Rectified Flow

$$
x_t=(1-t)x_0+t\epsilon,
$$

$$
v=\epsilon-x_0,
$$

$$
\mathcal L
=\mathbb E\left[
\|v_\theta(x_t,t)-(\epsilon-x_0)\|^2
\right].
$$

对应：5.2、A11。

---

## 14. SNR

$$
\mathrm{SNR}(t)=\frac{\bar\alpha_t}{1-\bar\alpha_t}.
$$

- 信号系数：$\sqrt{\bar\alpha_t}$；
- 噪声系数：$\sqrt{1-\bar\alpha_t}$。

对应：1.2、D10。

---

## 15. FID

$$
\mathrm{FID}
=\|\mu_r-\mu_g\|^2
+\mathrm{Tr}\left(\Sigma_r+\Sigma_g-2(\Sigma_r\Sigma_g)^{1/2}\right).
$$

对应：6.1、A4。

---

## 16. 一页纸记忆顺序

1. $x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon$；
2. 后验 $\tilde\mu_t$；
3. $\mathcal L_{\mathrm{simple}}$；
4. DDPM/DDIM 采样；
5. CFG；
6. CLIP loss；
7. VAE ELBO；
8. LoRA；
9. Rectified Flow；
10. FID。

> 面试时先写“结论公式”，再解释符号；不要一上来推十行。
