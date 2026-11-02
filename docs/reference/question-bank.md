# Diffusion 与 AIGC 面试高频问题：题目 · 答案 · 分析

> 本文面向算法岗、AIGC 岗、多模态生成岗的面试复习。共 26 题：Diffusion 10 题，AIGC 16 题。每题按「题目—答案—分析」组织；「分析」部分重点写面试官想听什么、常见追问和易错点。
>
> 记号约定：$\alpha_t=1-\beta_t$，$\bar\alpha_t=\prod_{s=1}^{t}\alpha_s$；$x_0$ 为真实数据，$x_T$ 为纯噪声；$\epsilon_\theta$ 为噪声预测网络；$c$ 为条件（文本、类别等）。

---

## 一、Diffusion 高频题

### D1. 扩散模型有哪些常见的采样方式？

**题目**：扩散模型有哪些常见的采样方式？

**答案**：

先说结论：**采样方式不是模型本身，而是“如何从 $x_T$ 逐步走回 $x_0$”**。同一个训练好的扩散模型，可以换不同的采样器。常见方式可以从四个维度分类：

| 类别 | 代表方法 | 随机性 | 典型步数 | 特点 |
|---|---|---|---|---|
| 祖先采样 / 马尔可夫采样 | DDPM、Euler ancestral（Euler a） | 随机 | 1000 或 20–50 | 每步注入噪声，多样性好，但结果不完全可复现 |
| 确定性采样 | DDIM（$\sigma=0$）、ODE Euler、Heun | 确定 | 20–100 | 可跳步、可反演，适合编辑和插值 |
| 高阶 / 指数积分器 | PLMS、DPM-Solver、DPM-Solver++、UniPC | 可确定可随机 | 10–30 | 用高阶近似减少步数，是目前最常用的一类 |
| SDE 采样 | Euler–Maruyama、Langevin、Predictor–Corrector | 随机 | 数十到数百 | 理论清晰，质量好，但通常更慢 |
| 蒸馏 / 少步模型 | 渐进蒸馏、LCM、SDXL-Turbo、DMD / DMD2 | 可确定可随机 | 1–8 | 需要额外训练或蒸馏，换速度 |
| Flow / 整流流采样 | Euler、Heun（用于 rectified flow） | 可确定可随机 | 1–30 | SD3、Flux 等使用，走直线轨迹 |

工程上常见的采样器名字包括：**Euler、Euler a、Heun、LMS、DPM2、DPM++ 2M、DPM++ SDE、UniPC、LCM**。它们主要差别在：

1. **离散化方式**：一阶 Euler、二阶 Heun、多步 DPM-Solver 等；
2. **是否注入随机噪声**：ancestral / SDE 会注入，DDIM 的 $\sigma=0$ 不注入；
3. **步长 schedule**：均匀、leading、Karras sigmas 等；
4. **预测目标**：$\epsilon$-prediction、$x_0$-prediction、$v$-prediction、flow velocity。

一个实用的选择建议：

- 追求通用质量：**DPM++ 2M Karras**、**UniPC**，20–30 步；
- 追求速度和确定性：**DDIM** 或 **Euler**，20–50 步；
- 追求多样性和“氛围感”：**Euler a**、**DPM++ SDE**；
- 实时/少步：**LCM**、**Turbo**、**DMD** 等蒸馏模型，1–8 步；
- SD3/Flux 等 flow 模型：优先 **Euler / Heun** 或模型推荐的 flow sampler。

**分析**：

- 面试官想确认你是否能把「模型」和「采样器」分开。很多人会把 DDIM 说成一种新模型，这是不准确的：**DDIM 可以使用 DDPM 的 checkpoint，只是换了反向过程**。
- 可追问：DDIM 为什么能跳步？DPM-Solver 为什么快？为什么少步采样容易糊？高分回答会落到「反向过程是一族高斯/ODE 的解，采样器只是数值近似」。
- 易错点：说“步数越少越好”；忽略 CFG、VAE、分辨率对速度的影响；把 ancestral 采样和 SDE 采样完全等同。

---

### D2. 扩散模型中添加的是高斯噪声，能否使用其他噪声的加噪方式？

**题目**：扩散模型中添加的是高斯噪声，能否使用其他噪声的加噪方式？

**答案**：

**可以，高斯噪声不是理论上必须的，而是一个非常方便的设计选择。** 但“换噪声”不是把 $\epsilon$ 换成另一个分布就结束了，需要重新定义前向转移、反向分布和训练目标。

高斯噪声流行的原因：

1. **中心极限定理**：很多微小独立扰动叠加后趋近高斯；
2. **热方程/连续扩散**：高斯核是扩散方程的基本解，前向过程可以写成 SDE；
3. **闭式边缘分布**：$q(x_t\mid x_0)$ 是高斯，任意时刻可直接采样；
4. **共轭性**：高斯似然 + 高斯先验，后验仍是高斯，反向过程可以用高斯近似；
5. **KL 有闭式**：变分下界容易计算；
6. **最大熵**：在给定均值方差下，高斯是熵最大的连续分布，破坏信息最“温和”。

其他加噪/退化方式确实存在：

| 方式 | 代表工作/场景 | 关键点 |
|---|---|---|
| 均匀噪声、Laplace 噪声 | 非高斯扩散研究 | 反向分布不再高斯，需要对应的 score/变分形式 |
| Poisson / Gamma 噪声 | 低计数成像、医学/天文 | 适合非负、计数型数据 |
| 离散类别噪声、吸收态噪声 | D3PM、MaskGIT 类模型 | 转移矩阵作用于 one-hot / token，适合离散数据 |
| 模糊、遮挡、下采样、超分退化 | Cold Diffusion | 前向是确定性退化，网络学习“恢复”而不是“去高斯噪声” |
| 任意插值路径 | Flow Matching / Rectified Flow | 不一定叫“加噪”，而是定义 $x_0$ 到噪声的连续路径 |
| Offset Noise | SD 微调 | 仍是高斯，但加入低频、空间相关的偏移，解决亮度问题 |

要换成非高斯噪声，至少要满足：

- 前向转移 $q(x_t\mid x_{t-1})$ 已知，或可仿真；
- 边缘 $q(x_t\mid x_0)$ 可采样，或能通过逐步模拟得到；
- 反向变分族要匹配真实后验的形式；非高斯后验往往不能简单用“预测噪声 + 高斯采样”；
- 训练目标（score matching / variational bound）要相应改写。

**分析**：

- 面试官通常想听「can 和 should 的区别」：理论上可以，工程上高斯最稳、最省事。
- 加分项：提到 **Cold Diffusion**（用模糊/遮挡等确定性退化）、**D3PM**（离散扩散）、**Flow Matching**（任意概率路径），说明你知道扩散不只有 DDPM 一种形式。
- 易错点：说“只能高斯，因为扩散方程要求高斯”——不对；高斯是选择，不是唯一解。另一个易错点是只换噪声分布却继续用 DDPM 的 MSE 目标，导致训练/采样不一致。

---

### D3. 介绍一下你了解的 Diffusion 加速方法？

**题目**：介绍一下你了解的 Diffusion 加速方法？

**答案**：

加速要同时看两个量：**每步耗时**和**总步数**。可以按“是否重新训练”分类。

#### 1）训练-free：更好的采样器 / 数值积分

- **DDIM**：确定性、可跳步，20–50 步；
- **PLMS / PNDM**：线性多步法；
- **DPM-Solver / DPM-Solver++**：指数积分器，10–25 步即可；
- **UniPC**：统一预测-校正框架；
- **Heun / Euler**：用于 flow 模型的高阶/一阶求解；
- **Karras sigma schedule**：让步长在噪声大的区域更合理。

这类方法不改模型，只改反向过程的数值解法，是最常用的第一层加速。

#### 2）蒸馏 / 少步模型

- **渐进蒸馏（Progressive Distillation）**：把 2 步教师蒸馏成 1 步学生，反复折半；
- **Consistency Models / LCM**：学习“任意时刻都能直接映射到 $x_0$”的一致性函数，1–4 步；
- **Adversarial Distillation**：如 SDXL-Turbo，用对抗损失 + 蒸馏，1–4 步；
- **DMD / DMD2**：分布匹配蒸馏，让学生分布逼近教师分布；
- **Rectified Flow / Reflow**：把概率流轨迹拉直，减少积分步数。

这类方法通常需要额外训练，换来的速度提升最大，但可能损失多样性、细节或提示跟随。

#### 3）架构与表示层加速

- **Latent Diffusion**：在 VAE 潜空间扩散，而不是像素空间；
- **更小的学生模型 / 剪枝 / 量化**：INT8、FP8、4-bit；
- **MMDiT / 更高效 Transformer**：减少注意力开销；
- **线性注意力、FlashAttention、xFormers**：降低 attention 的显存和时延；
- **16 通道 VAE、更好的压缩率**：减少 token 数（但要注意重建质量）。

#### 4）缓存与复用

- **DeepCache**：复用 UNet 浅层特征；
- **TeaCache**：根据时间步特征变化决定是否跳过计算；
- **Cross-attention / text embedding 缓存**：同一个 prompt 多次采样时复用文本编码；
- **Feature caching**：在视频/批量生成中复用相邻帧特征。

#### 5）系统级加速

- FP16 / BF16 / FP8、TensorRT、`torch.compile`；
- FlashAttention / xFormers / SDPA；
- VAE tiling / slicing，降低高分辨率显存；
- 动态 batch、并行采样、多卡 **DistriFusion**；
- 减少不必要的 VAE 解码/编码。

#### 6）引导与条件层面的加速

- **CFG distillation**：把“条件 + 无条件”两次前向蒸馏成一次；
- **APG / guidance-free**：减少 CFG 带来的额外计算；
- **guidance interval**：只在部分时间步使用 CFG；
- **prompt caching**：固定 prompt 时复用 text encoder 输出。

**分析**：

- 面试官不希望只听到“用 DDIM”。高分回答会区分：**training-free 采样器、蒸馏、系统优化、缓存、架构**。
- 可追问：LCM 和 Turbo 的区别？LCM 是一致性蒸馏，Turbo 是对抗蒸馏 + 少步；DMD 是分布匹配。三者都能少步，但训练信号和目标不同。
- 易错点：把“减少采样步数”当成唯一加速；忽略 VAE 解码、文本编码、attention 在端到端时延中的占比；少步模型直接套用高 CFG 导致过饱和。

---

### D4. DDPM 和 DDIM 的关系？

**题目**：DDPM 和 DDIM 的关系？

**答案**：

一句话：**DDPM 和 DDIM 共享同一个前向边缘分布和训练目标，区别在反向过程；DDPM 是 DDIM 的一个特例。**

| 维度 | DDPM | DDIM |
|---|---|---|
| 前向过程 | 马尔可夫链，$q(x_t\mid x_{t-1})$ | 非马尔可夫，但保持相同的 $q(x_t\mid x_0)$ |
| 反向过程 | 随机祖先采样，每步注入噪声 | 可确定性（$\sigma=0$），也可随机 |
| 训练目标 | 噪声预测 MSE（简化 ELBO） | 可用同一个 $\epsilon_\theta$，无需重新训练 |
| 采样步数 | 通常 $T=1000$ | 可以取子序列，20–50 步甚至更少 |
| 随机性 | 高 | 低/可控 |
| 典型用途 | 质量基线、多样性 | 快速采样、反演、编辑、插值 |

DDIM 的采样公式可以写成：

$$
x_{t-1}
=\sqrt{\bar\alpha_{t-1}}\hat x_0
+\sqrt{1-\bar\alpha_{t-1}-\sigma_t^2}\,\epsilon_\theta(x_t,t)
+\sigma_t\epsilon,
$$

其中

$$
\hat x_0=\frac{x_t-\sqrt{1-\bar\alpha_t}\,\epsilon_\theta(x_t,t)}{\sqrt{\bar\alpha_t}}.
$$

- 当 $\sigma_t=0$：完全确定性，得到 DDIM 的 ODE 形式；
- 当 $\sigma_t^2=\tilde\beta_t$ 且取全部时间步：退化为 DDPM 的祖先采样；
- 取子序列 $\tau_1<\dots<\tau_S$：就是 DDIM 的跳步采样。

所以：

1. **DDIM 不是新模型**，同一份 DDPM checkpoint 可以直接用 DDIM 采样；
2. **DDPM 是 DDIM 在特定方差和完整步数下的特例**；
3. DDIM 的确定性版本对应概率流 ODE，DDPM 对应随机 SDE；
4. DDIM 可以反演（DDIM inversion），因此常用于图像编辑、prompt-to-prompt、视频一致性。

**分析**：

- 面试官想确认你是否理解“同一训练目标、不同反向过程”。能写出 DDIM 更新式是加分项。
- 可追问：DDIM 为什么能跳步？因为它的反向过程定义在子序列上，且边缘分布与训练时一致；不是简单“每隔几步采样”。
- 易错点：说“DDIM 是另一种训练方法”；说“DDIM 一定比 DDPM 好”——高步数下两者接近，DDIM 在极低步数可能损失细节；DDIM 的确定性也意味着多样性低于 DDPM。

---

### D5. 推演 DDPM 公式。

**题目**：推演 DDPM 公式。

**答案**：

#### 1. 前向过程

给定真实数据 $x_0$，DDPM 定义一个马尔可夫加噪链：

$$
q(x_t\mid x_{t-1})
=\mathcal N\left(x_t;\sqrt{\alpha_t}x_{t-1},\beta_t I\right),
\quad \alpha_t=1-\beta_t.
$$

$$
q(x_{1:T}\mid x_0)=\prod_{t=1}^{T}q(x_t\mid x_{t-1}).
$$

用重参数化写：

$$
x_t=\sqrt{\alpha_t}x_{t-1}+\sqrt{\beta_t}\epsilon_{t-1},
\quad \epsilon_{t-1}\sim\mathcal N(0,I).
$$

#### 2. 任意时刻的边缘分布

令 $\bar\alpha_t=\prod_{s=1}^{t}\alpha_s$。可以证明：

$$
q(x_t\mid x_0)
=\mathcal N\left(x_t;\sqrt{\bar\alpha_t}x_0,(1-\bar\alpha_t)I\right),
$$

即

$$
x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,
\quad \epsilon\sim\mathcal N(0,I).
$$

证明思路：假设 $x_{t-1}=\sqrt{\bar\alpha_{t-1}}x_0+\sqrt{1-\bar\alpha_{t-1}}\epsilon'$，则

$$
x_t
=\sqrt{\alpha_t}x_{t-1}+\sqrt{\beta_t}\epsilon''
=\sqrt{\bar\alpha_t}x_0
+\sqrt{\alpha_t(1-\bar\alpha_{t-1})+\beta_t}\,\epsilon''',
$$

而

$$
\alpha_t(1-\bar\alpha_{t-1})+\beta_t
=1-\bar\alpha_t.
$$

#### 3. 真实反向后验

由贝叶斯公式：

$$
q(x_{t-1}\mid x_t,x_0)
=\frac{q(x_t\mid x_{t-1})q(x_{t-1}\mid x_0)}{q(x_t\mid x_0)}.
$$

三个高斯相乘，配方后仍是高斯：

$$
q(x_{t-1}\mid x_t,x_0)
=\mathcal N\left(x_{t-1};\tilde\mu_t,\tilde\beta_t I\right),
$$

其中

$$
\tilde\mu_t
=\frac{\sqrt{\bar\alpha_{t-1}}\beta_t}{1-\bar\alpha_t}x_0
+\frac{\sqrt{\alpha_t}(1-\bar\alpha_{t-1})}{1-\bar\alpha_t}x_t,
$$

$$
\tilde\beta_t
=\frac{1-\bar\alpha_{t-1}}{1-\bar\alpha_t}\beta_t.
$$

#### 4. 变分下界

扩散模型学习反向过程：

$$
p_\theta(x_{0:T})
=p(x_T)\prod_{t=1}^{T}p_\theta(x_{t-1}\mid x_t),
$$

$$
p_\theta(x_{t-1}\mid x_t)
=\mathcal N\left(x_{t-1};\mu_\theta(x_t,t),\Sigma_\theta(x_t,t)\right).
$$

由 Jensen 不等式：

$$
\log p_\theta(x_0)
\ge \mathbb E_q\left[
\log\frac{p_\theta(x_{0:T})}{q(x_{1:T}\mid x_0)}
\right].
$$

展开并整理，得到负 ELBO：

$$
\mathcal L_{\mathrm{VLB}}
=\mathbb E_q\Big[
D_{\mathrm{KL}}\left(q(x_T\mid x_0)\|p(x_T)\right)
+\sum_{t=2}^{T}D_{\mathrm{KL}}\left(q(x_{t-1}\mid x_t,x_0)\|p_\theta(x_{t-1}\mid x_t)\right)
-\log p_\theta(x_0\mid x_1)
\Big].
$$

- 第一项：$q(x_T\mid x_0)$ 与先验 $\mathcal N(0,I)$ 的差距；当 $\bar\alpha_T\approx0$ 时近似为 0；
- 中间项：每一步真实后验与网络预测后验的 KL；
- 最后一项：重建项。

#### 5. 参数化与简化损失

固定方差 $\Sigma_\theta=\sigma_t^2 I$ 时，两个高斯的 KL 只和均值差有关：

$$
L_{t-1}
=\mathbb E_q\left[
\frac{1}{2\sigma_t^2}\|\tilde\mu_t-\mu_\theta(x_t,t)\|^2
\right]+C.
$$

把 $\tilde\mu_t$ 中的 $x_0$ 用 $x_t$ 和 $\epsilon$ 表示：

$$
x_0=\frac{x_t-\sqrt{1-\bar\alpha_t}\epsilon}{\sqrt{\bar\alpha_t}}.
$$

代入后，$\tilde\mu_t$ 可以写成：

$$
\tilde\mu_t
=\frac{1}{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\epsilon\right).
$$

因此让网络预测噪声：

$$
\mu_\theta(x_t,t)
=\frac{1}{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\epsilon_\theta(x_t,t)\right).
$$

此时

$$
L_{t-1}
=\mathbb E\left[
\frac{\beta_t^2}{2\sigma_t^2\alpha_t(1-\bar\alpha_t)}
\|\epsilon-\epsilon_\theta(x_t,t)\|^2
\right].
$$

DDPM 发现丢掉前面的时间相关权重、使用简单 MSE 效果更好：

$$
\boxed{
\mathcal L_{\mathrm{simple}}
=\mathbb E_{t,x_0,\epsilon}
\left[
\left\|\epsilon-\epsilon_\theta
\left(\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,t\right)
\right\|^2
\right]
}
$$

注意：$\mathcal L_{\mathrm{simple}}$ 不是精确的 ELBO，而是对 ELBO 的加权/简化，但生成质量更好。

#### 6. 训练与采样

训练伪代码：

```python
for x0 in dataloader:
    t = randint(1, T)
    eps = randn_like(x0)
    xt = sqrt(alpha_bar[t]) * x0 + sqrt(1 - alpha_bar[t]) * eps
    loss = mse(eps, eps_theta(xt, t))
    loss.backward()
```

采样：

$$
x_{t-1}
=\frac{1}{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\epsilon_\theta(x_t,t)\right)
+\sigma_t z,
\quad z\sim\mathcal N(0,I),
$$

其中 $t>1$ 时加噪声，$t=1$ 时 $z=0$；$\sigma_t^2$ 可以取 $\beta_t$ 或 $\tilde\beta_t$。

等价的 $x_0$ 预测形式：

$$
\hat x_0
=\frac{x_t-\sqrt{1-\bar\alpha_t}\,\epsilon_\theta(x_t,t)}{\sqrt{\bar\alpha_t}}.
$$

$v$-prediction 则定义：

$$
v=\sqrt{\bar\alpha_t}\epsilon-\sqrt{1-\bar\alpha_t}x_0,
$$

网络预测 $v$，再反解 $x_0$ 和 $\epsilon$。$v$-prediction 在高低噪声两端更平衡，常用于 SD 2.x 的 768-v、SDXL 部分配置和视频扩散。

**分析**：

- 这是 Diffusion 面试的核心推导，面试官主要看五件事：**马尔可夫前向、闭式边缘、真实后验、ELBO 分解、噪声预测参数化**。
- 可追问：为什么 $q(x_T\mid x_0)\approx\mathcal N(0,I)$？因为 $\bar\alpha_T\to0$，信号系数消失。为什么后验是高斯？因为三个高斯相乘。为什么只学均值？因为固定方差时 KL 只依赖均值。
- 易错点：把 $\beta_t$ 和 $\tilde\beta_t$ 混用；后验均值符号写错；忘记 $t=1$ 不加噪声；把 $\mathcal L_{\mathrm{simple}}$ 说成精确 ELBO；把 $x_0$ 预测和 $\epsilon$ 预测说成完全等价（数学上可互转，但训练难度和稳定性不同）。

---

### D6. GAN 和 Diffusion 的区别？

**题目**：GAN 和 Diffusion 的区别？

**答案**：

两者都是生成模型，但建模方式、训练信号和采样过程完全不同。

| 维度 | GAN | Diffusion |
|---|---|---|
| 生成方式 | 隐变量 $z$ 一次前向生成 | 从噪声出发，多步去噪 |
| 训练目标 | 对抗博弈（minimax） | 去噪/变分下界/score matching |
| 训练稳定性 | 较不稳定，需调参 | 相对稳定，但训练成本高 |
| 采样速度 | 快，通常 1 步 | 慢，多步；可蒸馏加速 |
| 多样性/模式覆盖 | 易模式坍塌、漏模式 | 通常覆盖更好，但也可能 memorize |
| 保真度 | 常很锐利 | 高质量，少步时可能糊 |
| 似然 | 一般没有 | 有 ELBO/似然下界 |
| 隐空间 | 隐空间语义可能较弱 | 噪声空间、VAE 潜空间可编辑 |
| 条件控制 | 条件 GAN、StyleGAN 等 | CFG、ControlNet、inpainting 很自然 |
| 典型代表 | StyleGAN、BigGAN、CycleGAN | DDPM、LDM、SD、DALL-E 2/3、SD3 |

GAN 的目标：

$$
\min_G\max_D\;
\mathbb E_{x\sim p_{\mathrm{data}}}[\log D(x)]
+\mathbb E_{z\sim p_z}[\log(1-D(G(z)))].
$$

Diffusion 的目标（以 DDPM 为例）：

$$
\mathbb E_{t,x_0,\epsilon}
\left[
\|\epsilon-\epsilon_\theta(\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,t)\|^2
\right].
$$

直观理解：

- GAN 是“生成器骗判别器”，学习信号来自判别器，容易出现训练不均衡、模式坍塌；
- Diffusion 是“网络学会把噪声逐步还原成数据”，每步有明确回归目标，训练更稳定；
- GAN 的采样是**一步映射**，Diffusion 的采样是**迭代求解**；
- Diffusion 的迭代过程天然支持条件引导、编辑、inpainting、多步控制；
- GAN 在实时、低算力、特定域（人脸、超分）仍有优势。

实际系统中经常混合：

- **VQGAN**：VQ-VAE + GAN 判别器 + perceptual loss；
- **SDXL-Turbo / ADD**：对抗蒸馏把 diffusion 压到少步；
- **VAE 训练**：SD 的 VAE 使用 reconstruction + perceptual + adversarial loss。

**分析**：

- 不要绝对地说“Diffusion 全面优于 GAN”。更准确的表述是：**在大规模文生图任务上，Diffusion 因为训练稳定、可扩展、可控性强而成为主流；GAN 在速度、特定域高保真上仍有价值。**
- 可追问：为什么 Diffusion 模式覆盖更好？因为它的训练目标近似覆盖整个数据分布，且随机采样过程有多样性；但 Diffusion 也可能出现偏见、记忆和模式缺失。
- 易错点：把 GAN 的“模式坍塌”说成 Diffusion 完全没有；把 Diffusion 的“多步”说成不可加速。

---

### D7. 训练 Stable Diffusion 时为什么要使用 Offset Noise？

**题目**：训练 Stable Diffusion 时为什么要使用 Offset Noise？

**答案**：

**Offset Noise 解决的是“模型只会生成中等亮度图像，难以生成极暗或极亮图像”的问题。**

标准前向加噪是：

$$
x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,
\quad \epsilon\sim\mathcal N(0,I).
$$

标准高斯噪声的每个像素独立、均值为 0，因此它的**低频/直流分量非常小**（整张图的平均噪声接近 0）。而图像被归一化到 $[-1,1]$ 后，数据集的整体亮度分布通常集中在中间；模型在训练中很少见到“整张图带明显正/负偏移”的 latent。结果就是：

- 训练分布中的全局亮度变化不足；
- 模型倾向于回归到数据集的平均亮度；
- 推理时即使 prompt 写“纯黑背景/极暗场景”，也容易生成灰蒙蒙的中间调；
- 这就是常说的“平均灰度先验”或“亮度偏置”。

Offset Noise 的做法是给噪声加一个**每个通道共享、空间上不变的低频偏移**：

$$
\tilde\epsilon=\epsilon+\eta,
\quad
\eta\sim\mathcal N(0,\sigma_{\mathrm{offset}}^2 I_c),
$$

其中 $\eta$ 在每个通道内所有空间位置相同，$\sigma_{\mathrm{offset}}$ 常取 0.1 左右。于是：

$$
x_t
=\sqrt{\bar\alpha_t}x_0
+\sqrt{1-\bar\alpha_t}(\epsilon+\eta).
$$

这样训练时就会出现整体偏亮/偏暗的 latent，模型被迫学会去噪任意直流偏移，从而获得控制全局亮度和对比度的能力。推理时仍然使用标准高斯噪声，不需要额外加 offset。

效果与代价：

- 改善极暗/极亮、纯色背景、强对比场景；
- 可能影响部分构图/多样性，属于微调技巧；
- 不是原始 SD 的必需组件，常见于社区微调模型；
- 与“zero terminal SNR”“v-prediction”解决的是相关问题，但机制不同：后者主要处理 $t=T$ 时训练/推理不一致，Offset Noise 主要补足低频亮度分布。

**分析**：

- 面试官想听到“低频噪声/全局亮度偏移”，而不是简单说“让图片更亮”。
- 可追问：为什么普通高斯噪声的低频分量小？因为空间独立、均值为 0，平均后方差按 $1/N$ 缩小。为什么这会导致推理问题？因为生成暗图需要 latent 有明显负均值，而模型训练时几乎没见过。
- 易错点：把 Offset Noise 和推理时的“noise offset”混为一谈；说“推理时也要加 offset”；忽略它只是微调技巧，不是扩散理论必需。

---

### D8. 介绍一下 classifier-free guidance 和 classifier guidance 的区别？

**题目**：介绍一下 classifier-free guidance 和 classifier guidance 的区别？

**答案**：

两者都是在采样时用条件信息增强“条件生成”的引导方法，但**是否需要额外分类器**不同。

#### 1）Classifier Guidance

用一个在噪声图像上训练的分类器 $p_\phi(c\mid x_t)$，利用它的梯度修改 score：

$$
\nabla_{x_t}\log p(x_t\mid c)
=\nabla_{x_t}\log p(x_t)
+\nabla_{x_t}\log p(c\mid x_t).
$$

在 $\epsilon$-prediction 下常见形式：

$$
\tilde\epsilon
=\epsilon_\theta(x_t)
-s\sqrt{1-\bar\alpha_t}\,
\nabla_{x_t}\log p_\phi(c\mid x_t),
$$

其中 $s$ 是引导强度。

特点：

- 需要额外训练一个**噪声分类器**；
- 分类器要在带噪数据上训练，且要对 $x_t$ 可导；
- 可以用在无条件 diffusion 上；
- 引导强时容易产生对抗样本式伪影、饱和度问题；
- 训练和调参成本更高。

#### 2）Classifier-Free Guidance（CFG）

同时训练条件模型和无条件模型（通常用条件 dropout 实现）：

$$
\tilde\epsilon
=\epsilon_\theta(x_t,\varnothing)
+w\left(\epsilon_\theta(x_t,c)-\epsilon_\theta(x_t,\varnothing)\right).
$$

- $w=1$：不引导；
- $w>1$：增强条件一致性，牺牲多样性；
- 负向 prompt 可以写成用 $c_{\mathrm{neg}}$ 代替 $\varnothing$：

$$
\tilde\epsilon
=\epsilon_\theta(x_t,c_{\mathrm{neg}})
+w\left(\epsilon_\theta(x_t,c)-\epsilon_\theta(x_t,c_{\mathrm{neg}})\right).
$$

特点：

- 不需要额外分类器；
- 需要条件 + 无条件联合训练（通常 10% 概率把条件置空）；
- 推理时两次前向（条件一次、无条件一次），计算量约翻倍；
- 是实现简单、效果稳定的主流方案；
- 高 $w$ 会导致过饱和、细节僵硬、多样性下降。

#### 3）关系

CFG 可以看作**隐式分类器引导**：它用条件/无条件 score 之差近似分类器梯度，从而避免显式训练分类器。因此：

- Classifier Guidance：显式分类器 + 梯度；
- CFG：隐式分类器 + 条件/无条件模型差；
- 两者都能增强条件一致性，但 CFG 更简单、更常用。

| 维度 | Classifier Guidance | CFG |
|---|---|---|
| 额外模型 | 需要噪声分类器 | 不需要 |
| 训练 | 分类器 + diffusion | 条件/无条件联合训练 |
| 推理 | 1 次 diffusion + 分类器梯度 | 2 次 diffusion 前向 |
| 条件类型 | 通常是类别 | 文本、类别、任意条件 |
| 多样性 | 引导强时下降 | 引导强时下降 |
| 常见问题 | 对抗伪影、分类器不准 | 过饱和、颜色偏移 |

**分析**：

- 高频易错点：把 CFG 说成“需要分类器”。CFG 的 “free” 就是 **classifier-free**。
- 可追问：CFG 为什么有效？因为它隐式地建模了 $p(c\mid x_t)$ 的梯度；为什么 $w$ 太大会坏？因为条件分布被过度锐化，偏离真实数据流形。
- 加分项：提到 CFG++、APG、PAG、SAG、dynamic CFG、guidance rescale 等改进；提到 CFG 在 flow matching 中的对应形式。

---

### D9. 实现 DDPM 是否需要什么条件？

**题目**：实现 DDPM 是否需要什么条件？

**答案**：

这个问题有两种理解，最好分开回答。

#### 理解一：DDPM 是否需要“条件生成”的条件？

**不需要。** 原始 DDPM 是无条件生成模型，只学习 $p(x)$，不需要标签、文本或配对数据。条件生成是额外能力：

- 类别条件：condition embedding + AdaGN / concat；
- 文本条件：CLIP/T5 编码 + cross-attention；
- 条件 dropout + CFG：训练时随机置空条件，推理时做引导；
- ControlNet / IP-Adapter：外挂空间或图像条件。

#### 理解二：实现一个能工作的 DDPM，需要哪些前提？

**最小闭环**：

1. **数据**：归一化到 $[-1,1]$ 的图像/特征；
2. **噪声 schedule**：$\beta_t$ 或 $\bar\alpha_t$，如线性、cosine；
3. **网络**：$\epsilon_\theta(x_t,t)$，通常是 U-Net/DiT，必须有时间步编码；
4. **训练目标**：噪声预测 MSE；
5. **采样器**：从 $x_T\sim\mathcal N(0,I)$ 逐步去噪；
6. **训练细节**：优化器、EMA、混合精度、足够大的 batch/step。

**理论前提**：

- 前向是马尔可夫高斯链；
- $q(x_t\mid x_0)$ 有闭式；
- 反向用高斯近似；
- $T$ 足够大，使 $x_T$ 近似标准高斯；
- 数据分布有足够覆盖，网络容量足够。

**不需要**：

- 不需要 GAN 判别器；
- 不需要显式分类器；
- 不需要可逆编码器；
- 不需要配对数据（无条件场景）。

训练伪代码：

```python
for x0 in loader:
    t = randint(1, T)
    eps = randn_like(x0)
    xt = sqrt(ab[t]) * x0 + sqrt(1 - ab[t]) * eps
    loss = mse(eps, model(xt, t))
    loss.backward()
    optimizer.step()
```

采样伪代码：

```python
x = randn(shape)
for t in reversed(range(T)):
    eps = model(x, t)
    x = (x - beta[t] / sqrt(1 - ab[t]) * eps) / sqrt(alpha[t])
    if t > 0:
        x = x + sqrt(beta[t]) * randn_like(x)
```

**分析**：

- 这个题容易答偏。先澄清“条件生成”与“实现前提”，会显得思路清楚。
- 面试官可能追问：DDPM 一定要 U-Net 吗？不一定，DiT、MLP、ConvNet 都可以；U-Net 只是归纳偏置好。
- 易错点：说“DDPM 必须有标签”；说“必须用 classifier”；忽略 EMA、时间步编码、数据归一化等工程条件。

---

### D10. 为什么 DDPM 加噪声的幅度是不一致的？

**题目**：为什么 DDPM 加噪声的幅度是不一致的？

**答案**：

先澄清：**“每一步加的噪声方差”$\beta_t$ 确实通常不是常数，而是一个 schedule；但“总噪声”是逐步累积的。** 这两件事要分开。

DDPM 的加噪：

$$
x_t=\sqrt{\alpha_t}x_{t-1}+\sqrt{\beta_t}\epsilon,
\quad \alpha_t=1-\beta_t.
$$

展开到 $x_0$：

$$
x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon.
$$

- 信号系数：$\sqrt{\bar\alpha_t}$，随 $t$ 单调下降；
- 噪声系数：$\sqrt{1-\bar\alpha_t}$，随 $t$ 单调上升；
- 信噪比：

$$
\mathrm{SNR}(t)=\frac{\bar\alpha_t}{1-\bar\alpha_t},
$$

随 $t$ 单调下降。

典型 schedule 是线性的：

$$
\beta_1=10^{-4},\quad \beta_T=0.02,\quad T=1000,
$$

即早期每步加很小的噪声，后期每步加更大的噪声。

为什么要这样设计？

1. **早期图像结构清晰**：如果一开始就加很大噪声，细节被瞬间破坏，网络很难学习细粒度去噪；小噪声让模型先学局部纹理。
2. **后期需要破坏结构**：到了 $t$ 接近 $T$，要让 $x_T$ 接近 $\mathcal N(0,I)$，必须让噪声占据主导；否则反向采样起点不对，生成会偏。
3. **让 SNR 平滑下降**：训练时 $t$ 是均匀采样的，如果某些区间 SNR 变化过陡，模型会在这些区间学不好；schedule 控制的是“难度课程”。
4. **数值稳定**：$\bar\alpha_t$ 逐渐减小，避免信号/噪声比例在少数步内剧变。

“幅度不一致”可以指两层：

- **每步增量不一致**：$\beta_t$ 从 $10^{-4}$ 增到 $0.02$；
- **任意时刻的总噪声水平不一致**：$\sqrt{1-\bar\alpha_t}$ 随 $t$ 增大。

如果 $\beta_t$ 取常数，理论上也能定义扩散过程，但 SNR 轨迹不同，实际效果通常不如精心设计的 schedule。常见 schedule：

- **线性**：DDPM 原始；
- **cosine**：低分辨率/大 $T$ 时更平滑，避免两端 SNR 变化过快；
- **sigmoid / scaled linear**：SD 常用；
- **zero terminal SNR**：让 $t=T$ 时信号完全为 0，消除训练/推理的端点不一致；
- **Karras sigma**：采样时使用。

**分析**：

- 面试官想确认你是否理解“噪声 schedule 控制 SNR”，而不是把 $\beta_t$ 和总噪声混为一谈。
- 可追问：为什么 $t=T$ 要近似标准高斯？因为反向采样从先验开始，先验必须匹配。为什么 cosine 有时更好？它让 SNR 在两端下降得更平缓。
- 易错点：说“因为高斯噪声随机，所以幅度不一样”；说“$\beta_t$ 就是 $x_t$ 的方差”；忽略 schedule 是设计选择，不是 DDPM 理论强制。

---

## 二、AIGC 高频题

### A1. 介绍 CLIP 的模型架构、训练方法与损失函数。

**题目**：介绍 CLIP 的模型架构、训练方法与损失函数。

**答案**：

CLIP（Contrastive Language–Image Pre-training）是一个**图文对比学习模型**，不是生成模型。它把图像和文本映射到同一个语义空间，用于零样本分类、检索、图文匹配，也常作为扩散模型的文本/图像编码器。

#### 1）模型架构

- **图像编码器**：ResNet-50/101 或 ViT-B/32、ViT-B/16、ViT-L/14；输出图像特征；
- **文本编码器**：Transformer（宽度随规模变化），输入 BPE token，取 `[EOS]` 位置的表示；
- **投影层**：图像/文本特征分别线性投影到共享维度（如 512/768）；
- **归一化**：投影后做 L2 normalize；
- **温度**：可学习的 logit scale（$\exp(t)$）。

#### 2）训练方法

- 数据：约 4 亿图文对（WebImageText）；
- 大 batch（如 32,768）；
- 对每个 batch 内的图像和文本做对比学习；
- 图像只做随机裁剪/缩放等轻量增强，不做强增强；
- 文本使用 BPE tokenizer，截断/填充到固定长度；
- 训练目标是对称 InfoNCE。

#### 3）损失函数

设图像特征 $u_i$、文本特征 $v_j$，温度 $\tau$：

$$
s_{ij}=\frac{u_i^\top v_j}{\tau}.
$$

对称对比损失：

$$
\mathcal L
=-\frac{1}{2N}\sum_{i=1}^{N}
\left[
\log\frac{e^{s_{ii}}}{\sum_{j=1}^{N}e^{s_{ij}}}
+
\log\frac{e^{s_{ii}}}{\sum_{j=1}^{N}e^{s_{ji}}}
\right].
$$

- 第一项：图像 $i$ 匹配文本 $i$（image-to-text）；
- 第二项：文本 $i$ 匹配图像 $i$（text-to-image）；
- 对角线是正样本，其余是负样本；
- 大 batch 提供更多负样本，是对比学习效果的关键。

#### 4）零样本使用

- 构造 prompt，如 “a photo of a {class}”；
- 用文本编码器得到每个类别的文本特征；
- 图像特征与所有类别文本特征算 cosine 相似度；
- 取最高分作为预测；
- 可用 prompt ensemble 提升鲁棒性。

**分析**：

- 面试官想听“双塔 + 对比学习 + 对称 InfoNCE + 大 batch”，而不是把 CLIP 说成生成模型。
- 可追问：为什么 CLIP 的 batch 要大？负样本越多，对比学习信号越强；为什么文本取 `[EOS]`？因为要一个句向量；为什么用 temperature？控制 softmax 的锐度。
- 易错点：把 CLIP 的损失说成交叉熵但只写一个方向；忽略 L2 normalize；把 CLIP 和 BLIP/ALIGN 混为一谈。

---

### A2. 谈谈 AE、VAE 和 VQ-VAE 的区别。

**题目**：谈谈 AE、VAE 和 VQ-VAE 的区别。

**答案**：

三者都是“编码—解码”结构，区别在**隐空间是否概率化、是否离散化、能否采样生成**。

| 模型 | 隐空间 | 训练目标 | 能否直接采样 | 特点 |
|---|---|---|---|---|
| AE | 连续、确定性 | 重建损失（MSE/L1） | 不能，隐空间没有先验 | 简单，适合压缩/特征学习；隐空间可能有“空洞” |
| VAE | 连续、随机 | ELBO = 重建 − KL | 可以，从先验采样 | 隐空间平滑，但容易模糊、后验坍塌 |
| VQ-VAE | 离散 codebook | 重建 + codebook + commitment | 需要额外先验（PixelCNN/Transformer） | 离散 token，适合 Transformer 生成；避免 KL 后验坍塌 |
| VQGAN | 离散 + GAN | VQ-VAE + perceptual + adversarial | 需要先验 | 重建更真实，常用于高分辨率生成 |

#### 1）AE

编码器 $E$ 把 $x$ 映射到 $z$，解码器 $D$ 重建：

$$
\mathcal L_{\mathrm{AE}}=\|x-D(E(x))\|^2.
$$

- 没有概率模型，不能从先验采样；
- 隐空间可能不连续，插值效果差；
- 常用于降维、压缩、特征提取。

#### 2）VAE

编码器输出高斯参数：

$$
q(z\mid x)=\mathcal N(\mu(x),\sigma^2(x)I).
$$

先验 $p(z)=\mathcal N(0,I)$，ELBO：

$$
\log p(x)
\ge
\mathbb E_{q(z\mid x)}[\log p(x\mid z)]
-D_{\mathrm{KL}}(q(z\mid x)\|p(z)).
$$

- 重参数化：$z=\mu+\sigma\odot\epsilon$；
- 隐空间连续、平滑，可采样；
- 但重建容易模糊，KL 过强会导致 posterior collapse（隐变量被忽略）；
- $\beta$-VAE 通过调 KL 权重权衡解耦/重建。

#### 3）VQ-VAE

编码器输出连续特征 $z_e(x)$，用最近邻查 codebook：

$$
z_q(x)=e_k,\quad k=\arg\min_j\|z_e(x)-e_j\|_2.
$$

损失：

$$
\mathcal L
=\|x-D(z_q(x))\|^2
+\|\mathrm{sg}[z_e(x)]-z_q(x)\|^2
+\beta\|z_e(x)-\mathrm{sg}[z_q(x)]\|^2,
$$

其中 $\mathrm{sg}[\cdot]$ 是 stop-gradient。

- 第一项：重建；
- 第二项：codebook 向编码器输出靠近；
- 第三项：commitment，让编码器输出不要乱跑；
- 反向传播用 straight-through estimator；
- 离散 token 可以用 Transformer/PixelCNN 学习先验，再做生成；
- 可能出现 codebook collapse（少数 code 被频繁使用）。

#### 4）和 Stable Diffusion 的关系

- Stable Diffusion 使用的是**连续 VAE**，不是 VQ-VAE：图像编码到 4 通道 latent，扩散在 latent 上做，最后解码；
- DALL-E 1 使用 VQ-VAE 的离散 token；
- VQGAN 在 VQ-VAE 上加 GAN/perceptual loss，提升重建真实感。

**分析**：

- 面试官想听“AE 不能采样、VAE 连续概率、VQ-VAE 离散 token”这条主线。
- 可追问：VAE 为什么会模糊？因为 ELBO 的重建项是像素级似然，且 KL 约束压缩隐空间；VQ-VAE 为什么需要先验？因为 codebook 本身不是生成模型。
- 易错点：把 VQ-VAE 说成“VAE 加量化但仍有 KL”；把 Stable Diffusion 的 VAE 说成 VQ-VAE；忽略 straight-through。

---

### A3. 重参数技巧是什么？

**题目**：重参数技巧是什么？

**答案**：

重参数技巧（reparameterization trick）是**把“随机采样”改写成“确定性变换 + 外部噪声”**，从而让梯度穿过采样操作。

以 VAE 为例，隐变量：

$$
z\sim\mathcal N(\mu,\sigma^2 I).
$$

直接采样 $z$ 是不可导的。改写成：

$$
z=\mu+\sigma\odot\epsilon,
\quad \epsilon\sim\mathcal N(0,I).
$$

这样：

- 随机性来自 $\epsilon$，与参数 $\mu,\sigma$ 无关；
- $\mu,\sigma$ 通过确定性函数进入 $z$；
- 梯度可以反传：

$$
\frac{\partial z}{\partial\mu}=1,\qquad
\frac{\partial z}{\partial\sigma}=\epsilon.
$$

在扩散模型里，前向加噪也是同样的思想：

$$
x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,
\quad \epsilon\sim\mathcal N(0,I).
$$

这让任意时刻的 $x_t$ 可以直接从 $x_0$ 采样，并且训练目标可以对 $\epsilon$ 做回归。

为什么需要它？

- 采样操作本身是随机的，无法直接对分布参数求导；
- 重参数化提供了**低方差的路径导数（pathwise derivative）**；
- 相比 score function/REINFORCE 估计，梯度更稳定。

注意：

- 重参数化适用于连续分布，且分布可以写成“标准噪声的确定性变换”；
- 离散的 VQ-VAE 不能用普通重参数化，通常用 **straight-through estimator**，这是有偏梯度，不是严格的重参数化；
- 扩散里的“重参数化”与 VAE 里的“重参数化”是同一个技巧的不同用法。

**分析**：

- 面试官想听“把随机性剥离到 $\epsilon$，让 $\mu,\sigma$ 可导”。
- 可追问：为什么不用 REINFORCE？因为方差大；为什么 VQ-VAE 不用它？因为离散采样不可导，需要 straight-through。
- 易错点：把重参数化和“重新参数化网络”混淆；说 straight-through 是重参数化。

---

### A4. 图像生成的评估指标有哪些？

**题目**：图像生成的评估指标有哪些？

**答案**：

图像生成评估通常分四类：**保真度、多样性、图文对齐、人类偏好/下游能力**。没有单一指标能覆盖全部。

| 指标 | 衡量什么 | 方向 | 备注 |
|---|---|---|---|
| FID | 生成分布与真实分布的特征距离 | 越低越好 | 最常用；对预处理、样本数敏感；不衡量文本对齐 |
| IS | 质量 + 多样性 | 越高越好 | 基于 Inception；可被刷分；不衡量对齐 |
| KID | 分布差异（MMD） | 越低越好 | 无偏估计，适合小样本 |
| CLIP Score | 图文语义对齐 | 越高越好 | 用 CLIP 算相似度；可被 prompt 刷分 |
| Precision / Recall | 保真度 / 覆盖率 | 越高越好 | 更适合诊断模式坍塌/漏模式 |
| LPIPS | 感知相似度 | 越低越好 | 需要参考图；用于重建/编辑 |
| PSNR / SSIM | 像素/结构相似度 | 越高越好 | 对感知质量不敏感 |
| 人类偏好 | 主观质量 | — | 最可靠但昂贵 |
| GenEval / T2I-CompBench | 组合能力（计数、颜色、位置） | 越高越好 | 细粒度文本对齐 |
| HPSv2 / ImageReward / PickScore | 人类偏好奖励 | 越高越好 | 可能带偏好偏差 |
| OCR accuracy | 文字渲染 | 越高越好 | 评估文字生成 |

重点展开：

#### FID

$$
\mathrm{FID}
=\|\mu_r-\mu_g\|^2
+\mathrm{Tr}\left(\Sigma_r+\Sigma_g-2(\Sigma_r\Sigma_g)^{1/2}\right),
$$

其中 $r$ 是真实图，$g$ 是生成图，特征通常来自 Inception-v3 的 pool3。

注意：

- FID 假设特征服从高斯，样本量少时估计有偏；
- 不同实现（resize、归一化、Inception 权重）不可直接比较；
- FID 低不代表文本对齐好，也不代表人类觉得好看。

#### CLIP Score

$$
\mathrm{CLIPScore}(I,T)
=\cos\left(f_I(I),f_T(T)\right)
$$

（有的实现会做缩放）。它衡量图文语义相似度，但不惩罚图像质量、不擅长细粒度计数/空间关系。

#### Precision / Recall

- Precision：生成样本有多少落在真实分布附近（保真度）；
- Recall：真实分布有多少被生成覆盖（多样性/覆盖率）；
- 对诊断 GAN 模式坍塌、Diffusion 漏模式很有用。

#### 任务相关指标

- 图像编辑/重建：PSNR、SSIM、LPIPS；
- 超分：PSNR/SSIM/LPIPS；
- 人脸：FID、身份相似度；
- 文生图：FID + CLIPScore + 人类偏好 + GenEval；
- 视频：FVD、帧间一致性、光流误差。

**分析**：

- 面试官想听“没有万能指标，要组合使用”。只背 FID/IS 是不够的。
- 可追问：FID 的缺点？对样本量/预处理敏感、依赖 Inception 特征、不衡量文本对齐；CLIP Score 的缺点？可被刷分、弱组合推理。
- 加分项：提到 Precision/Recall、GenEval、HPSv2、ImageReward；说明“离线指标 + 人类评估”结合。

---

### A5. Stable Diffusion 的核心优化是什么？

**题目**：Stable Diffusion 的核心优化是什么？

**答案**：

如果只选一个核心：**Latent Diffusion——把扩散过程从像素空间搬到 VAE 潜空间**。围绕这个核心，还有三个关键设计：**VAE 压缩、cross-attention 文本条件、classifier-free guidance**。

#### 1）Latent Diffusion

标准像素扩散直接对 $x\in\mathbb R^{H\times W\times3}$ 加噪。SD 先用 VAE：

$$
z_0=\mathcal E(x_0),\qquad
\hat x_0=\mathcal D(z_0).
$$

在潜空间做扩散：

$$
z_t=\sqrt{\bar\alpha_t}z_0+\sqrt{1-\bar\alpha_t}\epsilon,
$$

训练：

$$
\mathcal L
=\mathbb E_{z_0,t,\epsilon,c}
\left[
\|\epsilon-\epsilon_\theta(z_t,t,c)\|^2
\right].
$$

为什么快：

- 512×512×3 约 78.6 万个元素；
- 64×64×4 约 1.6 万个元素；
- 空间元素减少约 48 倍，注意力/卷积的计算量大幅下降；
- VAE 只编码/解码一次，扩散迭代都在低维 latent 中完成。

#### 2）VAE 压缩与重建

- 下采样 8 倍，4 通道 latent；
- 训练目标：重建 + perceptual + adversarial；
- 需要保证解码质量，否则扩散学得再好也会被 VAE 糊掉；
- SD 使用缩放因子（如 0.18215）把 latent 缩放到适合扩散的尺度。

#### 3）Cross-Attention 文本条件

- 文本编码器（CLIP）输出 token 序列；
- UNet 的中间特征作为 Query，文本特征作为 Key/Value；
- 在每个分辨率层注入文本信息；
- 文本编码器通常冻结，只训练 cross-attention 投影和 UNet。

#### 4）Classifier-Free Guidance

- 训练时以一定概率丢弃文本条件；
- 推理时组合条件和无条件预测；
- 提升 prompt 跟随，但高 CFG 会过饱和、降多样性。

#### 5）工程优化

- UNet + 残差块 + 低分辨率 self-attention；
- EMA、混合精度、gradient checkpointing；
- xFormers/FlashAttention；
- 分辨率分桶、aspect ratio bucketing；
- 大规模 LAION 数据 + aesthetic 过滤。

**分析**：

- 面试官想听“latent diffusion 是核心，不是简单把模型变小”。要能说出“在 VAE 潜空间扩散”和“像素空间扩散”的区别。
- 可追问：VAE 会不会成为瓶颈？会，VAE 重建差会限制上限；为什么不用 VQ-VAE？连续 latent 更适合扩散，避免离散量化误差。
- 易错点：把 SD 的 VAE 说成 VQ-VAE；忽略 cross-attention 和 CFG；只说“UNet 更大”。

---

### A6. Stable Diffusion 是怎么训练的？

**题目**：Stable Diffusion 是怎么训练的？

**答案**：

SD 的训练是**两阶段**：先训练 VAE，再冻结 VAE、训练 latent diffusion UNet。

#### 阶段 1：训练 VAE

- 编码器 $\mathcal E$：图像 → 4 通道 latent；
- 解码器 $\mathcal D$：latent → 图像；
- 损失：重建损失（L1/L2）+ perceptual loss（LPIPS）+ adversarial loss（patch discriminator）；
- 目标：压缩到 8 倍下采样，同时尽量保留细节；
- 训练好后冻结，作为扩散模型的“图像 tokenizer”。

#### 阶段 2：训练 Latent Diffusion UNet

1. 取图像 $x_0$，用 VAE 编码：

$$
z_0=\mathcal E(x_0).
$$

2. 随机采样时间步 $t$ 和噪声 $\epsilon$：

$$
z_t=\sqrt{\bar\alpha_t}z_0+\sqrt{1-\bar\alpha_t}\epsilon.
$$

3. 文本编码：

$$
c=\mathrm{TextEncoder}(\text{caption}).
$$

4. UNet 预测噪声：

$$
\hat\epsilon=\epsilon_\theta(z_t,t,c).
$$

5. 损失：

$$
\mathcal L
=\mathbb E_{z_0,t,\epsilon,c}
\left[
\|\epsilon-\epsilon_\theta(z_t,t,c)\|^2
\right].
$$

6. 训练细节：

- 文本编码器（CLIP）通常冻结；
- 以约 10% 概率把文本置空，训练 CFG 的无条件分支；
- EMA 权重用于推理；
- 混合精度、gradient checkpointing、xFormers；
- 多分辨率/多宽高比训练，aspect ratio bucketing；
- 数据来自 LAION 等图文对，经过 aesthetic、分辨率、NSFW、水印等过滤；
- 训练目标可能是 $\epsilon$-prediction、$v$-prediction 或 flow matching，取决于版本。

#### 版本差异

| 版本 | 文本编码器 | 分辨率 | 预测目标/架构 |
|---|---|---|---|
| SD 1.x | CLIP ViT-L/14 | 512 | $\epsilon$-prediction，UNet |
| SD 2.x | OpenCLIP ViT-H/14 | 512/768 | 提供 $\epsilon$ 与 $v$-prediction 变体 |
| SDXL | CLIP-L + OpenCLIP bigG | 1024 | 双文本编码器、micro-conditioning、base + refiner |
| SD3 | CLIP-L + OpenCLIP bigG + T5-XXL | 1024 | MMDiT + rectified flow |

#### 微调阶段

- Full fine-tune：全量更新 UNet；
- LoRA：低秩适配；
- DreamBooth：少样本 subject 定制；
- Textual Inversion：学习新 token embedding；
- ControlNet：加空间条件分支；
- IP-Adapter：加图像 prompt 分支。

**分析**：

- 面试官想听“两阶段、VAE 冻结、文本编码器冻结、CFG dropout、latent 上的噪声预测”。
- 可追问：为什么要冻结 VAE？因为联合训练不稳定、计算量大，且 VAE 负责压缩质量；为什么要文本 dropout？为了 CFG 的无条件分支。
- 易错点：说 SD 是端到端训练 VAE + UNet；说文本编码器也全量训练；忽略数据过滤和分辨率分桶。

---

### A7. 介绍一下 SD、DALL-E 2 两者的异同。

**题目**：介绍一下 SD、DALL-E 2 两者的异同。

**答案**：

两者都是**文本到图像扩散模型**，都使用 CLIP 文本编码器、都使用扩散解码/去噪、都使用引导提升图文对齐。但架构路线不同：

- **Stable Diffusion**：Latent Diffusion + 文本 token 的 cross-attention；
- **DALL-E 2**：unCLIP 路线，先验（prior）+ 扩散解码器，条件主要是 CLIP 图像嵌入。

| 维度 | Stable Diffusion | DALL-E 2 |
|---|---|---|
| 核心架构 | VAE + UNet，latent diffusion | Prior + diffusion decoder（unCLIP） |
| 文本条件方式 | 文本 token 做 cross-attention 的 K/V | 文本先映射到 CLIP 图像嵌入，再条件化解码 |
| 是否有 prior | 没有 | 有，文本嵌入 → 图像嵌入 |
| 扩散空间 | VAE latent（64×64×4） | 低分辨率图像空间，再超分 |
| 输出分辨率 | 512/768/1024（版本相关） | 1024 |
| 是否开源 | 开放权重，生态完整 | 闭源 API |
| 可控性 | LoRA、ControlNet、IP-Adapter、inpainting | 主要靠 API，控制能力有限 |
| 数据 | LAION 系列 | OpenAI 内部数据 |

#### 相同点

1. 都用 CLIP 文本编码器理解 prompt；
2. 都用扩散过程生成图像；
3. 都用 classifier-free guidance 或类似引导增强条件；
4. 都采用“两阶段”思路：SD 是 VAE + LDM，DALL-E 2 是 prior + decoder；
5. 都在大规模图文对上训练。

#### 不同点

1. **条件注入路径不同**：
   - SD：文本 token 序列通过 cross-attention 注入 UNet， token 级别对齐；
   - DALL-E 2：文本先经过 prior 变成 CLIP 图像嵌入，解码器主要condition on 这个图像嵌入，更偏“全局语义”。
2. **是否有 prior**：
   - DALL-E 2 的 prior 是从文本嵌入到图像嵌入的映射，是 unCLIP 的关键；
   - SD 没有 prior，直接用文本 token 条件扩散。
3. **扩散空间不同**：
   - SD 在 VAE latent 上扩散；
   - DALL-E 2 的 decoder 在低分辨率图像上扩散，再用超分网络到 1024。
4. **生态与可控性**：
   - SD 开放权重，催生 LoRA/ControlNet/IP-Adapter 等生态；
   - DALL-E 2 闭源，主要使用 API。
5. **风格与提示跟随**：
   - DALL-E 2 在部分复杂语义/风格上表现好；
   - SD 1.5 的开放生态和可控性更强，后续 SDXL/SD3 在质量上继续提升。

**分析**：

- 面试官想听“unCLIP 的 prior + decoder”与“LDM 的 cross-attention”这条核心差异，而不是只说“一个开源一个闭源”。
- 可追问：DALL-E 2 为什么需要 prior？因为它的 decoder 条件在 CLIP 图像嵌入空间，而文本和图像嵌入之间有模态差距，prior 做桥接。SD 为什么不需要？因为 cross-attention 直接对齐文本 token 和图像特征。
- 易错点：说 DALL-E 2 也是 latent diffusion；说两者完全一样；忽略 DALL-E 2 的超分阶段。

---

### A8. 谈谈 Stable Diffusion 中的交叉注意力机制。

**题目**：谈谈 Stable Diffusion 中的交叉注意力机制。

**答案**：

在 SD 1.x/2.x 中，文本条件主要通过 **cross-attention** 注入 UNet：**图像特征提供 Query，文本特征提供 Key/Value**。

#### 1）计算过程

设 UNet 某层图像特征展平为：

$$
X\in\mathbb R^{N\times d},\quad N=H\times W,
$$

文本编码器输出：

$$
C\in\mathbb R^{L\times d},\quad L=77.
$$

则：

$$
Q=XW_Q,\qquad
K=CW_K,\qquad
V=CW_V,
$$

$$
\mathrm{Attention}(Q,K,V)
=\mathrm{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V.
$$

- $QK^\top$：每个图像位置对每个文本 token 的相似度；
- softmax 归一化后得到注意力权重；
- 用权重加权文本 value，得到该图像位置的条件特征；
- 多头拼接 + 线性投影 + 残差 + LayerNorm/FFN。

#### 2）在 UNet 中的位置

- 每个分辨率层通常有：ResBlock → Self-Attention → Cross-Attention → FFN；
- 低分辨率层计算量小，cross-attention 多放在这些层；
- 文本 K/V 在每个 cross-attention block 中由各自的投影生成，但文本编码只做一次；
- 文本编码器（CLIP）通常冻结，训练的是 cross-attention 的投影和 UNet。

#### 3）作用

- **token 级对齐**：prompt 中的词可以对应到图像局部区域；
- **属性绑定**：把颜色、材质、对象关联到空间位置；
- **prompt 权重**：通过缩放某些 token 的 attention 权重实现强调/弱化；
- **注意力图可视化**：可以看到 “dog”“sky” 等 token 关注哪些区域；
- **编辑**：prompt-to-prompt、attention edit 通过替换/修改 cross-attention map 实现。

#### 4）局限

- CLIP 文本编码器通常限制 77 token，长 prompt 会被截断；
- CLIP 特征是“bag-of-words”式的，弱于计数、空间关系、否定；
- cross-attention 是单向的：图像查文本，文本不感知图像；
- 文本渲染、复杂排版能力有限；
- SDXL 用双文本编码器 + pooled embedding 改进全局条件；
- SD3 用 MMDiT 的联合注意力替代 cross-attention，让文本和图像 token 双向交互。

**分析**：

- 面试官想听“Q 来自图像，K/V 来自文本”这个关键点，以及“不是文本 self-attention”。
- 可追问：cross-attention 的复杂度？$O(NL)$，比图像 self-attention 的 $O(N^2)$ 便宜；为什么放在低分辨率？省算力。
- 易错点：把 Q/K/V 的来源说反；说 cross-attention 是文本和图像各自 attention 再拼接；忽略 77 token 限制。

---

### A9. 如何改善 GAN 的模式坍塌？

**题目**：如何改善 GAN 的模式坍塌？

**答案**：

模式坍塌（mode collapse）指生成器只覆盖数据分布的少数模式，很多真实模式生成不出来。改善思路分五类：

#### 1）损失函数与正则

- **WGAN / WGAN-GP**：用 Wasserstein 距离 + 梯度惩罚，提供更平滑的训练信号；
- **Hinge loss**：稳定判别器；
- **Least Squares GAN**：缓解梯度消失；
- **R1 / R2 正则**：惩罚判别器对真实/生成样本的梯度；
- **Spectral Normalization**：限制判别器 Lipschitz 常数；
- **Feature matching**：让生成器匹配判别器中间特征，而不是只骗输出。

#### 2）架构与训练策略

- **StyleGAN / BigGAN**：更好的生成器架构、噪声注入、类别条件；
- **Progressive Growing**：从低分辨率逐步增长；
- **EMA**：生成器权重滑动平均，稳定采样；
- **TTUR**：判别器和生成器不同学习率；
- **Unrolled GAN**：生成器考虑判别器未来几步的更新，缓解追逐；
- **Mini-batch discrimination**：让判别器看到 batch 内多样性；
- **PacGAN**：判别器看多个样本的联合分布，惩罚模式集中。

#### 3）多样性目标

- **Diversity loss / mode-seeking loss**：显式鼓励生成样本之间不同；
- **Multiple generators / mixture of generators**：不同生成器负责不同模式；
- **Replay buffer**：保留历史生成样本，防止判别器遗忘；
- **Conditional GAN**：用标签/条件分离模式，降低无条件模式坍塌。

#### 4）数据与评估

- 更大、更均衡的数据；
- 数据增强（注意不要引入伪影）；
- 用 **Precision/Recall** 诊断：precision 高、recall 低通常说明漏模式；
- 不要只看 FID，FID 可能掩盖模式缺失。

#### 5）混合方案

- **VAE-GAN**：VAE 提供覆盖，GAN 提供锐利度；
- **Diffusion + GAN**：用扩散教师蒸馏 GAN/少步生成器；
- **GAN inversion / 预训练先验**：借助外部模型改善模式覆盖。

#### 注意

- **Truncation trick** 是推理时权衡：截断 latent 提高保真度，但会降低多样性，不能真正解决训练中的模式坍塌；
- 模式坍塌和“模式丢弃（mode dropping）”不同：前者可能完全塌到少数样本，后者是部分模式没学到。

**分析**：

- 面试官想听“原因 + 多层手段”，而不是只背“WGAN-GP”。
- 可追问：WGAN 为什么能缓解？因为 Wasserstein 距离在分布不重叠时仍有梯度；R1 正则为什么有效？限制判别器过强，给生成器更平滑的信号。
- 易错点：把 truncation 当成解决方案；说“换更大模型就能解决”；忽略评估指标。

---

### A10. SDXL 的核心优化？

**题目**：SDXL 的核心优化？

**答案**：

SDXL 不是单点改动，而是**更大模型 + 更强文本条件 + 微条件 + 两阶段精修 + 更高分辨率训练**的组合。核心可以概括为五点：

#### 1）双文本编码器

- 使用 **CLIP ViT-L/14** + **OpenCLIP ViT-bigG/14**；
- 两个文本编码器的 token 特征拼接，提供更丰富的语义；
- OpenCLIP 的 pooled text embedding 作为全局条件，加入时间步嵌入；
- 比 SD 1.5 单一 CLIP-L 更强，尤其是指令跟随和风格描述。

#### 2）更大的 UNet 与架构调整

- UNet 显著变大，transformer block 更多；
- 在不同分辨率使用 self-attention / cross-attention；
- 训练和推理成本更高，但质量、细节、文字能力提升。

#### 3）Micro-conditioning（微条件）

除了文本，还把以下信息作为条件：

- 原始图像尺寸；
- 裁剪坐标（crop top-left）；
- 目标尺寸/宽高比。

这些条件被嵌入后加到时间步条件中。作用是：

- 让模型知道“这张图是怎么被裁剪/缩放的”；
- 改善多宽高比生成；
- 减少训练时的裁剪偏差，提升构图稳定性。

这是 SDXL 很容易被忽略但很重要的设计。

#### 4）Base + Refiner 两阶段

- **Base**：生成主体结构和语义，输出 latent；
- **Refiner**：对 base latent 做 img2img 式精修（低 strength），增强局部细节、纹理、文字等；
- Refiner 是可选的，base 单独也能用；
- 两阶段比单个超大模型更省算力，也方便分别调参。

#### 5）更高分辨率与数据/训练优化

- 原生 1024×1024 训练；
- 多宽高比 bucketing；
- 更好的 VAE 重建；
- 更大规模、更高质量的数据与 aesthetic 过滤；
- 训练技巧：EMA、混合精度、gradient checkpointing 等。

| 维度 | SD 1.5 | SDXL |
|---|---|---|
| 文本编码器 | CLIP ViT-L/14 | CLIP-L + OpenCLIP bigG |
| 分辨率 | 512 | 1024 |
| 条件 | 文本 cross-attn | 双文本 + pooled + micro-conditioning |
| 架构 | 较小 UNet | 更大 UNet |
| 生成流程 | 单模型 | base + refiner（可选） |
| 多宽高比 | 一般 | 原生支持更好 |

**分析**：

- 面试官想听“双文本编码器、micro-conditioning、refiner、1024、多宽高比”，而不是只说“模型更大”。
- 可追问：micro-conditioning 解决什么问题？训练时随机裁剪导致图像内容与构图偏移，告诉模型裁剪信息可以让它学会补偿。refiner 是不是必须？不是，base 已经能出图，refiner 主要提升细节。
- 易错点：把 SDXL 说成新架构（它仍是 LDM/UNet）；忽略 refiner 是可选阶段；说双文本编码器只是简单拼接而忽略 pooled embedding。

---

### A11. SD3 的核心优化？

**题目**：SD3 的核心优化？

**答案**：

SD3 的核心是三点：**MMDiT 架构 + Rectified Flow 训练目标 + 更强的文本编码器/VAE**。它从 SDXL 的 UNet + cross-attention 路线，转向 Transformer + 联合注意力 + 流匹配。

#### 1）MMDiT（Multimodal Diffusion Transformer）

- 文本 token 和图像 token 分别经过 modality-specific 的投影/MLP；
- 在 Transformer block 中把两种 token 拼接，做**联合 self-attention**；
- 文本和图像可以双向交互，而不是 SD 1.x/2.x 的“图像查文本”单向 cross-attention；
- 使用 QK normalization 稳定训练；
- 相比 UNet，Transformer 更容易扩展参数量和数据量。

#### 2）Rectified Flow / Flow Matching

不再用 DDPM 的随机前向加噪，而是定义从数据到噪声的直线插值：

$$
x_t=(1-t)x_0+t\epsilon,
\quad t\in[0,1].
$$

目标速度：

$$
v=\epsilon-x_0.
$$

训练：

$$
\mathcal L
=\mathbb E_{x_0,\epsilon,t}
\left[
\|v_\theta(x_t,t)-(\epsilon-x_0)\|^2
\right].
$$

采样用 Euler/Heun 解 ODE：

$$
x_{t-\Delta}=x_t-\Delta\,v_\theta(x_t,t).
$$

优点：

- 轨迹更直，少步采样更容易；
- 训练目标稳定；
- 与 flow matching / rectified flow 生态兼容；
- SD3 使用 logit-normal 时间步采样，让中间时间步获得更多训练。

#### 3）三文本编码器

- **CLIP ViT-L/14**：通用语义；
- **OpenCLIP ViT-bigG/14**：更强视觉-语言对齐；
- **T5-XXL**：长文本、组合推理、文字渲染；
- 三个编码器特征拼接/融合，显著提升复杂 prompt 和文字生成能力。

#### 4）16 通道 VAE

- SD 1.x/2.x/XL 使用 4 通道、8 倍下采样 VAE；
- SD3 使用 **16 通道 VAE**，提升重建质量，减少压缩伪影；
- 更好的 VAE 对文字、细节、纹理生成很重要。

#### 5）规模化

- SD3 Medium 约 2B 参数，SD3 Large 约 8B；
- 更大数据、更高分辨率、更好的 caption；
- SD3.5 延续 MMDiT/rectified flow，提供 Large、Medium、Turbo 等变体。

| 维度 | SDXL | SD3 |
|---|---|---|
| 主干 | UNet | MMDiT |
| 条件交互 | cross-attention | 文本/图像联合 attention |
| 训练目标 | 扩散（ε/v） | Rectified Flow |
| 文本编码器 | CLIP-L + OpenCLIP bigG | CLIP-L + OpenCLIP bigG + T5-XXL |
| VAE | 4 通道 | 16 通道 |
| 文字/复杂 prompt | 中等 | 明显增强 |

**分析**：

- 面试官想听“MMDiT + rectified flow + T5 + 16ch VAE”，而不是“SD3 就是更大的 SDXL”。
- 可追问：Rectified Flow 和 DDPM 的关系？它仍是生成模型/连续归一化流，和扩散同属“从噪声到数据”的框架，但前向是确定性插值，训练目标变成速度回归。MMDiT 和 cross-attention 的区别？联合注意力让文本和图像双向交互，cross-attention 是图像单向查文本。
- 易错点：说 SD3 还用 UNet；说 flow matching 不需要多步采样；忽略 T5 对长 prompt 的作用。

---

### A12. 谈谈 LoRA / DreamBooth / Textual Inversion / Hypernetworks，原理以及差异。

**题目**：谈谈 LoRA / DreamBooth / Textual Inversion / Hypernetworks，原理以及差异。

**答案**：

这四者都是**对预训练扩散模型做定制化/个性化**的方法，但训练对象和注入位置不同。

| 方法 | 训练什么 | 是否改原权重 | 数据量 | 文件大小 | 能力 | 常见问题 |
|---|---|---|---|---|---|---|
| LoRA | 低秩增量矩阵 $\Delta W=BA$ | 不改原权重，挂载增量 | 几十到几百张 | 几 MB 到几十 MB | 风格、角色、概念 | rank/学习率不当会过拟合 |
| DreamBooth | 全量微调（也可用 LoRA） | 改权重 | 3–5 张主体图 + 先验图 | GB 级（全量） | 强主体绑定 | 过拟合、语言漂移 |
| Textual Inversion | 新 token embedding | 不改权重 | 3–5 张 | KB 级 | 概念/风格 token | 容量有限，复杂主体弱 |
| Hypernetwork | 生成权重的辅助网络 | 不改原权重，生成 adapter | 几十到几百张 | 几十到几百 MB | 风格/概念 | 训练不稳定，较少使用 |

#### 1）LoRA

对原权重 $W\in\mathbb R^{d\times k}$，不直接更新，而是学习低秩增量：

$$
W'=W+\Delta W=W+BA,
$$

其中 $B\in\mathbb R^{d\times r}$，$A\in\mathbb R^{r\times k}$，$r\ll\min(d,k)$。

- 初始化：$A$ 随机，$B=0$，所以初始 $\Delta W=0$；
- 常加缩放 $\alpha/r$；
- 在 SD 中通常作用于 cross-attention 的 Q/K/V/out 投影，也可作用于 UNet 其他线性层；
- 训练只更新 $A,B$，参数量极小；
- 推理可动态加载、可合并进原权重；
- 多个 LoRA 可以组合，但需要注意权重冲突。

优点：轻量、训练快、易分享、可组合。缺点：rank 太小容量不足，太大会过拟合；对复杂主体可能不如全量微调。

#### 2）DreamBooth

- 输入：3–5 张某个主体（人、宠物、物体）的图片 + 类别描述；
- 用一个**唯一标识符**（如 `sks dog`）绑定主体；
- 微调整个模型（或 LoRA）；
- 关键：**class prior preservation**，用基础模型生成同类别的先验图，防止语言漂移/过拟合：

$$
\mathcal L
=\mathbb E\left[
\|\epsilon-\epsilon_\theta(x_t,c)\|^2
+\lambda\|\epsilon'-\epsilon_\theta(x_t',c_{\mathrm{prior}})\|^2
\right].
$$

- 优点：主体一致性强；
- 缺点：容易过拟合、忘记原模型能力、训练成本高；
- 常见做法：DreamBooth + LoRA，兼顾效果和成本。

#### 3）Textual Inversion

- 在文本编码器的词嵌入表中新增一个 token（如 `<my-style>`）；
- 冻结模型，只优化这个 embedding；
- 用少量图片，通过扩散损失训练：

$$
\min_{v}\;
\mathbb E\left[
\|\epsilon-\epsilon_\theta(x_t,t,c(v))\|^2
\right].
$$

- 优点：文件极小（KB），不改变模型权重，易组合；
- 缺点：容量有限，复杂主体/细节弱；一个 token 能表达的信息有限；
- 适合风格、材质、简单概念，不适合高保真人物。

#### 4）Hypernetwork

- 训练一个辅助网络，输入一个 learned embedding，输出原模型某些层的权重增量/参数；
- 原模型冻结；
- 在 SD 社区中常作用于 cross-attention；
- 文件通常比 LoRA 大，训练更不稳定；
- 现在使用较少，逐渐被 LoRA 取代。

#### 核心差异

- **LoRA**：权重空间的低秩增量，参数高效；
- **DreamBooth**：一种训练配方，强调少样本主体绑定 + 先验保持，可用全量或 LoRA；
- **Textual Inversion**：提示词空间的新 token，容量最小；
- **Hypernetwork**：用网络生成权重，介于两者之间，但工程上不如 LoRA 流行。

**分析**：

- 面试官常把 DreamBooth 和 LoRA 混着问。高分回答会指出：**DreamBooth 是“怎么训”，LoRA 是“训什么参数”，两者可以组合。**
- 可追问：Textual Inversion 和 LoRA 的区别？前者只学 prompt embedding，后者学权重增量；谁容量大？LoRA。DreamBooth 为什么需要先验图？防止过拟合和语言漂移。
- 易错点：说 LoRA 会改原模型权重（推理可合并，但训练时是增量）；说 Textual Inversion 能改 UNet；忽略 DreamBooth 的 prior preservation。

---

### A13. 介绍一下 ControlNet 的核心原理。

**题目**：介绍一下 ControlNet 的核心原理。

**答案**：

ControlNet 的核心是：**在冻结的 Stable Diffusion 旁边，复制一份可训练的编码器分支，用“零初始化卷积”把空间条件注入进去，从而在保留原模型生成能力的同时获得强空间控制。**

#### 1）结构

- **锁定副本（locked copy）**：原 SD UNet 的编码器/中间块，参数冻结，保留预训练知识；
- **可训练副本（trainable copy）**：复制同一部分，参数可训练；
- **条件编码器**：把控制图（Canny、深度、姿态、scribble、法线等）编码成特征；
- **零卷积（zero convolution）**：$1\times1$ 卷积，权重和偏置初始化为 0，连接可训练副本和锁定副本/解码器。

流程可以简写为：

$$
h_{\mathrm{base}}=\mathrm{LockedEncoder}(z_t),
$$

$$
h_{\mathrm{cond}}=\mathrm{TrainableEncoder}(z_t+\mathrm{CondEncoder}(c)),
$$

$$
h_{\mathrm{out}}=h_{\mathrm{base}}+\mathrm{ZeroConv}(h_{\mathrm{cond}}).
$$

零卷积初始输出为 0，所以训练开始时 ControlNet 对原模型没有任何影响；随着训练进行，它逐渐学会注入条件。

#### 2）训练

- 数据：三元组（控制图、目标图、文本）；
- 冻结原 SD，只训练 ControlNet 分支和零卷积；
- 损失与普通扩散相同：噪声预测 MSE；
- 文本条件做 CFG dropout；
- 控制图由预处理算法得到（Canny、MiDaS 深度、OpenPose 等）。

#### 3）推理

- 输入控制图和 prompt；
- 通过 `controlnet_conditioning_scale` 调节控制强度；
- 多个 ControlNet 可以叠加（如 depth + canny + pose）；
- 支持 guess mode（无 prompt 时也能根据控制图生成）；
- 控制太强会僵硬/伪影，太弱则不起作用。

#### 4）为什么有效

- **保留先验**：原模型冻结，不会被小数据集破坏；
- **稳定注入**：零卷积保证初始无扰动，训练平稳；
- **空间对齐**：控制图与 latent 空间对齐，分支学习局部结构；
- **可插拔**：每个条件训练一个 ControlNet，可组合。

#### 5）变体

- ControlNet 1.1：更多条件类型、更好的训练；
- T2I-Adapter：更轻量的条件适配器；
- ControlNet-XS：更小、更快；
- ControlNet++：改进训练/条件一致性。

**分析**：

- 面试官想听“frozen base + trainable copy + zero convolution”，而不是“加了一张条件图”。
- 可追问：为什么零初始化？保证初始不破坏原模型，训练稳定。为什么复制编码器而不是只加一个 adapter？编码器容量更大，能学到更强的空间对应。
- 易错点：说 ControlNet 会训练整个 SD；说零卷积是普通卷积；忽略控制图预处理和 CFG。

---

### A14. 介绍一下 IP-Adapter 的核心原理。

**题目**：介绍一下 IP-Adapter 的核心原理。

**答案**：

IP-Adapter 的核心是：**把“图像 prompt”作为一种额外的 cross-attention 条件，通过解耦的 cross-attention 注入冻结的 SD，从而用参考图控制风格、主体或构图。**

#### 1）结构

- **图像编码器**：CLIP ViT-H/14（或 OpenCLIP）提取参考图特征；
- **投影网络**：把图像特征投影到 SD 的 cross-attention 维度；
- **解耦 cross-attention**：
  - 文本 cross-attention：$Q$ 来自图像特征，$K_t,V_t$ 来自文本；
  - 图像 cross-attention：$Q$ 同样来自图像特征，$K_i,V_i$ 来自参考图特征；
  - 两路输出相加：

$$
h'
=\mathrm{Attn}(Q,K_t,V_t)
+\lambda\,\mathrm{Attn}(Q,K_i,V_i).
$$

- 原 SD 权重冻结，只训练新增的投影和图像 cross-attention 的 K/V；
- 原版约 22M 可训练参数，文件很小。

#### 2）训练

- 数据：图像-文本对（参考图 + 目标图/描述）；
- 冻结 SD 和 CLIP 图像编码器；
- 只训练 IP-Adapter 的投影和 cross-attention 参数；
- 损失仍是扩散噪声预测；
- 训练时随机丢弃文本/图像条件，支持 CFG 和条件组合。

#### 3）使用

- 输入参考图 + 文本 prompt；
- `ip_adapter_scale` 控制图像条件强度；
- 可以做风格迁移、角色参考、构图参考、人脸参考；
- 可与 ControlNet 组合：ControlNet 管空间结构，IP-Adapter 管语义/风格；
- 支持 negative image prompt；
- **IP-Adapter Plus**：使用更细粒度的图像特征/query transformer，提升细节；
- **IP-Adapter FaceID**：结合人脸识别 embedding，提升身份一致性。

#### 4）和 ControlNet 的区别

| 维度 | ControlNet | IP-Adapter |
|---|---|---|
| 条件类型 | 空间图（边缘、深度、姿态） | 参考图（语义、风格、主体） |
| 注入方式 | 编码器分支 + 零卷积 | 解耦 cross-attention |
| 控制内容 | 结构/布局 | 外观/风格/身份 |
| 是否需要预处理 | 通常需要（Canny、Depth 等） | 不需要，直接输入参考图 |
| 组合 | 可与 IP-Adapter 叠加 | 可与 ControlNet 叠加 |

**分析**：

- 面试官想听“图像 prompt + 解耦 cross-attention + 冻结 SD”，而不是“把参考图拼到输入”。
- 可追问：为什么要解耦？文本和图像条件分布不同， shared cross-attention 会互相干扰；分开建模更灵活，也方便调节强度。为什么只训练少量参数？保持原模型能力，降低训练成本。
- 易错点：说 IP-Adapter 改 UNet 主体；把它和 ControlNet 混为一谈；忽略 image encoder 的选择和 scale 调节。

---

### A15. 谈谈 CLIP 编码特征的优缺点。

**题目**：谈谈 CLIP 编码特征的优缺点。

**答案**：

CLIP 特征分图像特征和文本特征，二者共享一个对比学习空间。总体优点是**语义强、零样本、跨模态对齐好**；缺点集中在**细粒度、组合性、空间关系和长文本**。

#### 优点

1. **语义表达强**：大规模图文对比学习，能捕捉对象、风格、场景等高层语义；
2. **零样本迁移**：不需要下游标签，直接用 prompt 做分类/检索；
3. **共享嵌入空间**：图像和文本可以直接算相似度，适合跨模态检索、生成条件；
4. **鲁棒性较好**：对域偏移、风格变化通常比 ImageNet 监督模型更稳；
5. **工程友好**：推理快、可冻结、生态成熟；SD 1.x/2.x/XL 都用它做文本编码器；
6. **图像特征适合全局条件**：IP-Adapter、风格参考、图文评估都常用。

#### 缺点

1. **77 token 限制**：CLIP 文本编码器通常最多 77 个 token，长 prompt 会被截断；
2. **Bag-of-words 倾向**：对词序、否定、数量、空间关系不敏感，例如 “a red cube on a blue sphere” 容易混淆属性绑定；
3. **细粒度空间信息弱**：图像特征是全局语义，不适合密集预测/精确布局；
4. **计数和组合推理弱**：CLIP 不是为计数/关系推理训练的；
5. **提示词敏感**：不同模板、同义词、标点可能显著影响结果；
6. **偏差与安全**：训练数据带来的性别、种族、文化偏见；
7. **模态 gap**：图像和文本特征虽然对齐，但仍存在分布差异；
8. **CLIP Score 可被刷**：优化图文相似度不一定提升真实生成质量。

#### 在 AIGC 中的体现

- SD 1.x/2.x：CLIP 文本特征作为 cross-attention 的 K/V，token 级条件；
- SDXL：CLIP-L + OpenCLIP bigG，双编码器 + pooled embedding；
- SD3：引入 T5-XXL 弥补 CLIP 的长文本/组合推理不足；
- IP-Adapter：CLIP 图像特征作为图像 prompt；
- 评估：CLIP Score 衡量图文对齐，但不能单独作为生成质量指标。

**分析**：

- 面试官想听“CLIP 是匹配模型，不是生成模型；强在全局语义，弱在细粒度组合”。
- 可追问：为什么 SD3 要加 T5？因为 CLIP 的 77 token 和 bag-of-words 限制，T5 更适合长文本、计数、文字渲染。为什么 IP-Adapter 用 CLIP 图像特征？因为全局语义/风格足够，且与文本空间对齐。
- 易错点：把 CLIP 特征说成“像素级/空间特征”；忽略 77 token；把 CLIP Score 当成唯一评估。

---

### A16. 介绍一下 self attention 和 cross attention 的区别。

**题目**：介绍一下 self attention 和 cross attention 的区别。

**答案**：

核心区别是 **Q、K、V 的来源**：self-attention 的 Q/K/V 来自同一个序列；cross-attention 的 Q 来自一个序列，K/V 来自另一个序列。

#### 1）Self-Attention

$$
Q=XW_Q,\quad K=XW_K,\quad V=XW_V,
$$

$$
\mathrm{Attn}(Q,K,V)
=\mathrm{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V.
$$

- 建模同一模态/同一序列内部的依赖；
- 图像 self-attention：像素/patches 之间建立全局关系；
- 文本 self-attention：token 之间建模上下文；
- 复杂度 $O(N^2)$；
- 对输入顺序具有置换等变性（需要位置编码注入顺序）。

#### 2）Cross-Attention

$$
Q=XW_Q,\quad K=CW_K,\quad V=CW_V,
$$

其中 $X$ 是目标序列（如图像特征），$C$ 是条件序列（如文本）。

- 建模两个模态/两个序列之间的对齐；
- 在 SD 中：图像特征查文本 token，决定每个空间位置关注哪些词；
- 复杂度 $O(NM)$，$N$ 是图像 token 数，$M$ 是文本 token 数；
- 不对称：图像可以看文本，文本不反看图像（除非用联合注意力）。

#### 3）对比

| 维度 | Self-Attention | Cross-Attention |
|---|---|---|
| Q/K/V 来源 | 同一序列 | Q 来自目标，K/V 来自条件 |
| 作用 | 模态内依赖 | 跨模态对齐 |
| 典型位置 | UNet 图像层、文本 Transformer | SD 的 text-to-image 条件注入 |
| 复杂度 | $O(N^2)$ | $O(NM)$ |
| 是否对称 | 是 | 否 |
| 条件控制 | 无 | 有 |

#### 4）在 SD / SD3 中的体现

- SD 1.x/2.x：UNet 中先 self-attention 建模图像内部关系，再 cross-attention 注入文本；
- SDXL：双文本编码器 + cross-attention + pooled text embedding；
- SD3：MMDiT 使用**联合 self-attention**，把文本 token 和图像 token 拼在一起做 attention，但不同模态使用不同的 QKV 投影；这比单向 cross-attention 更灵活。

**分析**：

- 面试官想听“Q/K/V 来源不同”，并能结合 SD 说明“图像 Q、文本 K/V”。
- 可追问：cross-attention 能不能看成条件 self-attention？可以，把条件序列拼到输入里再做 mask 就是联合注意力的一种形式。为什么 SD3 用 MMDiT？因为联合注意力让文本和图像双向交互，表达力更强。
- 易错点：只说“self 是同模态、cross 是跨模态”但说不出 Q/K/V 来源；把 cross-attention 的 Q 说成文本；忽略复杂度差异。

---

## 三、一页纸速查

### 3.1 DDPM vs DDIM

| 项目 | DDPM | DDIM |
|---|---|---|
| 前向 | 马尔可夫 | 非马尔可夫，同边缘 |
| 反向 | 随机 | 可确定（$\sigma=0$） |
| 训练 | $\epsilon$-MSE | 同一个网络 |
| 步数 | 1000 | 可跳步 20–50 |
| 特点 | 多样、慢 | 快、可反演 |

### 3.2 GAN vs Diffusion

| 项目 | GAN | Diffusion |
|---|---|---|
| 训练 | 对抗 | 去噪回归 |
| 采样 | 1 步 | 多步 |
| 稳定 | 较难 | 较稳 |
| 多样性 | 易坍塌 | 较好 |
| 可控 | 条件 GAN | CFG/ControlNet |
| 速度 | 快 | 慢，可蒸馏 |

### 3.3 AE vs VAE vs VQ-VAE

| 项目 | AE | VAE | VQ-VAE |
|---|---|---|---|
| 隐空间 | 连续确定 | 连续随机 | 离散 codebook |
| 目标 | 重建 | ELBO | 重建 + codebook + commitment |
| 采样 | 否 | 是 | 需先验 |
| 典型用途 | 压缩 | 生成/表示 | 离散 token 生成 |

### 3.4 SD 1.5 vs SDXL vs SD3

| 项目 | SD 1.5 | SDXL | SD3 |
|---|---|---|---|
| 主干 | UNet | 更大 UNet | MMDiT |
| 文本 | CLIP-L | CLIP-L + OpenCLIP bigG | CLIP-L + bigG + T5 |
| 分辨率 | 512 | 1024 | 1024 |
| 条件 | cross-attn | cross-attn + pooled + micro-cond | 联合 attention |
| 目标 | ε | ε/v | Rectified Flow |
| VAE | 4ch | 4ch | 16ch |
| 特点 | 轻、生态好 | 质量/构图强 | 文字/复杂 prompt 强 |

### 3.5 LoRA vs DreamBooth vs TI vs Hypernetwork

| 项目 | LoRA | DreamBooth | Textual Inversion | Hypernetwork |
|---|---|---|---|---|
| 训练对象 | 低秩增量 | 全量/ LoRA | 新 token embedding | 生成权重的网络 |
| 原权重 | 不变 | 变 | 不变 | 不变 |
| 容量 | 中 | 高 | 低 | 中高 |
| 文件 | 小 | 大 | 极小 | 中 |
| 适合 | 风格/角色 | 强主体 | 概念/风格 | 风格 |

### 3.6 ControlNet vs IP-Adapter

| 项目 | ControlNet | IP-Adapter |
|---|---|---|
| 条件 | 空间图 | 参考图 |
| 注入 | 编码器分支 + 零卷积 | 解耦 cross-attention |
| 控制 | 结构/布局 | 风格/主体/语义 |
| 预处理 | 通常需要 | 不需要 |

### 3.7 关键公式

**前向边缘**：

$$
x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon.
$$

**真实后验均值**：

$$
\tilde\mu_t
=\frac{\sqrt{\bar\alpha_{t-1}}\beta_t}{1-\bar\alpha_t}x_0
+\frac{\sqrt{\alpha_t}(1-\bar\alpha_{t-1})}{1-\bar\alpha_t}x_t.
$$

**训练损失**：

$$
\mathcal L_{\mathrm{simple}}
=\mathbb E\left[
\|\epsilon-\epsilon_\theta(x_t,t)\|^2
\right].
$$

**DDPM 采样**：

$$
x_{t-1}
=\frac{1}{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\epsilon_\theta(x_t,t)\right)
+\sigma_t z.
$$

**CFG**：

$$
\tilde\epsilon
=\epsilon_\theta(x_t,\varnothing)
+w\left(\epsilon_\theta(x_t,c)-\epsilon_\theta(x_t,\varnothing)\right).
$$

**CLIP 损失**：

$$
\mathcal L
=-\frac{1}{2N}\sum_i
\left[
\log\frac{e^{s_{ii}}}{\sum_j e^{s_{ij}}}
+
\log\frac{e^{s_{ii}}}{\sum_j e^{s_{ji}}}
\right].
$$

**VAE ELBO**：

$$
\log p(x)
\ge
\mathbb E_{q(z|x)}[\log p(x|z)]
-D_{\mathrm{KL}}(q(z|x)\|p(z)).
$$

**LoRA**：

$$
W'=W+\frac{\alpha}{r}BA.
$$

---

## 四、面试作答模板与易错点

### 4.1 通用答题结构

面对一个开放题，可以用“四步法”：

1. **一句话定义**：它是什么、解决什么问题；
2. **核心原理**：关键公式/结构/训练目标；
3. **对比与取舍**：和相近方法比，优缺点；
4. **实践与局限**：在 SD/SDXL/SD3 中怎么用，有什么坑。

例如问“DDIM 和 DDPM 的关系”：

> 一句话：共享训练目标，区别在反向过程。  
> 原理：DDIM 用非马尔可夫前向、确定性反向，可跳步。  
> 对比：DDPM 随机、多样；DDIM 快、可反演。  
> 实践：同一 checkpoint 可换采样器，编辑任务常用 DDIM inversion。

### 4.2 高频易错点清单

- ❌ “DDIM 是另一种训练方法” → ✅ 同一训练目标，不同采样器。
- ❌ “CFG 需要分类器” → ✅ classifier-free，不需要。
- ❌ “Diffusion 只能加高斯噪声” → ✅ 高斯是选择，Cold Diffusion/D3PM 是反例。
- ❌ “SD 的 VAE 是 VQ-VAE” → ✅ SD 用连续 VAE，DALL-E 1 用 VQ-VAE。
- ❌ “DreamBooth 就是 LoRA” → ✅ DreamBooth 是训练配方，LoRA 是参数高效方法，可组合。
- ❌ “ControlNet 训练整个 SD” → ✅ 冻结 base，只训分支。
- ❌ “IP-Adapter 和 ControlNet 一样” → ✅ 前者语义/风格，后者空间结构。
- ❌ “FID 低就一定好” → ✅ FID 不衡量文本对齐，且对实现敏感。
- ❌ “SD3 还是 UNet” → ✅ MMDiT + Rectified Flow。
- ❌ “β_t 就是 x_t 的方差” → ✅ β_t 是每步增量，累计噪声是 $1-\bar\alpha_t$。

### 4.3 可主动加分的关键词

- **DDPM**：马尔可夫链、闭式边缘、后验、ELBO、$\epsilon$-prediction、$v$-prediction、zero terminal SNR。
- **采样**：DDIM、DPM-Solver++、UniPC、LCM、Rectified Flow、probability flow ODE。
- **条件**：CFG、classifier guidance、ControlNet、IP-Adapter、cross-attention、MMDiT。
- **模型**：LDM、VAE、VQ-VAE、DiT、UNet、SDXL、SD3。
- **评估**：FID、CLIPScore、Precision/Recall、GenEval、HPSv2。
- **微调**：LoRA、DreamBooth、Textual Inversion、Hypernetwork。

### 4.4 反问面试官的问题（可选）

- 团队更关注训练、推理优化，还是数据/评测？
- 目前主要用 SDXL、SD3 还是自研 DiT/Flow 模型？
- 生成质量评估以人工为主，还是 FID/CLIPScore/奖励模型？
- 推理部署的硬件和延迟目标是什么？

---

## 五、参考论文

1. Ho, Jain, Abbeel. **Denoising Diffusion Probabilistic Models**. NeurIPS 2020.
2. Song, Meng, Ermon. **Denoising Diffusion Implicit Models**. ICLR 2021.
3. Song et al. **Score-Based Generative Modeling through Stochastic Differential Equations**. ICLR 2021.
4. Dhariwal, Nichol. **Diffusion Models Beat GANs on Image Synthesis**. NeurIPS 2021.
5. Ho, Salimans. **Classifier-Free Diffusion Guidance**. 2022.
6. Rombach et al. **High-Resolution Image Synthesis with Latent Diffusion Models**. CVPR 2022.
7. Ramesh et al. **Hierarchical Text-Conditional Image Generation with CLIP Latents**（DALL-E 2）. 2022.
8. Radford et al. **Learning Transferable Visual Models From Natural Language Supervision**（CLIP）. ICML 2021.
9. Podell et al. **SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis**. 2023.
10. Esser et al. **Scaling Rectified Flow Transformers for High-Resolution Image Synthesis**（SD3）. ICML 2024.
11. Zhang, Rao, Agrawala. **Adding Conditional Control to Text-to-Image Diffusion Models**（ControlNet）. ICCV 2023.
12. Ye et al. **IP-Adapter: Text Compatible Image Prompt Adapter for Text-to-Image Diffusion Models**. 2023.
13. Hu et al. **LoRA: Low-Rank Adaptation of Large Language Models**. ICLR 2022.
14. Ruiz et al. **DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation**. CVPR 2023.
15. Gal et al. **An Image is Worth One Word: Personalizing Text-to-Image Generation using Textual Inversion**. ICLR 2023.
16. van den Oord et al. **Neural Discrete Representation Learning**（VQ-VAE）. NeurIPS 2017.
17. Esser et al. **Taming Transformers for High-Resolution Image Synthesis**（VQGAN）. CVPR 2021.
18. Lu et al. **DPM-Solver: A Fast ODE Solver for Diffusion Probabilistic Model Sampling**. NeurIPS 2022.
19. Luo et al. **Latent Consistency Models**. 2023.
20. Guttenberg. **Offset Noise: A Simple Method to Generate Extremely Dark or Bright Images**. 2023.

---

> 最后提醒：面试中不要只背结论。每个问题尽量落到“**它解决什么问题、核心公式/结构是什么、和相近方法比取舍是什么、在 SD/SDXL/SD3 里怎么用**”这四层，基本就能覆盖大多数追问。
