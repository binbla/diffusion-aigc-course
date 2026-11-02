# 2.2 SDE/ODE 与高阶采样器

> **所属章节**：第 2 章 采样、加速与引导  
> **课时**：90 分钟  
> **前置**：2.1 DDPM/DDIM  
> **对应面试题**：D1、D3  
> **一句话目标**：学完能把采样器按“SDE/ODE、阶数、单步/多步、随机性”分类，并解释 DPM-Solver 为什么能用更少步。

---

## 1. 学习目标

学完本节，你应该能够：

1. **解释** 扩散模型为什么可以写成 SDE 和 ODE；
2. **区分** 反向 SDE 与概率流 ODE；
3. **分类** Euler、Heun、PLMS、DPM-Solver、DPM-Solver++、UniPC；
4. **解释** 高阶/指数积分器为什么能减少步数；
5. **说明** 采样器（sampler）与调度器（scheduler）的区别；
6. **根据任务选择** 采样器；
7. **用 90 秒**回答“常见采样方式”和“DPM-Solver 为什么快”。

---

## 2. 为什么需要 SDE/ODE 视角

DDPM/DDIM 是离散时间步的采样。实际模型有 1000 步，推理时想用 20 步甚至 4 步。

SDE/ODE 视角的价值：

- 把“离散加噪”看成连续时间扩散；
- 把“采样”看成解一个微分方程；
- 用数值分析工具设计更高效的求解器；
- 解释不同 sampler 的统一框架。

一句话：

> **DDPM/DDIM 是离散算法，SDE/ODE 是连续极限；采样器是解这个连续过程的数值方法。**

---

## 3. 前向 SDE、反向 SDE、概率流 ODE

### 3.1 前向 SDE

连续时间前向过程可以写成：

$$
dx=f(x,t)\,dt+g(t)\,dw.
$$

- $f$：漂移项；
- $g$：扩散系数；
- $dw$：布朗运动。

DDPM 的离散加噪是它的一个离散化。

### 3.2 反向 SDE

反向过程：

$$
dx=
\left[
f(x,t)-g(t)^2\nabla_x\log p_t(x)
\right]dt
+g(t)\,d\bar w.
$$

其中 $\nabla_x\log p_t(x)$ 是 score。

### 3.3 概率流 ODE

去掉随机项，得到确定性 ODE：

$$
\frac{dx}{dt}
=f(x,t)-\frac{1}{2}g(t)^2\nabla_x\log p_t(x).
$$

关键性质：

> 概率流 ODE 与反向 SDE 的边缘分布相同，但轨迹是确定的。

这解释了：

- DDIM 的确定性采样；
- ODE solver 可以复用同一个 score 网络；
- 同一模型可以有随机/确定两种采样。

### 3.4 和噪声预测的关系

DDPM 的 score 可以用噪声预测表示：

$$
\nabla_{x_t}\log q(x_t\mid x_0)
=-\frac{\epsilon}{\sqrt{1-\bar\alpha_t}}.
$$

所以网络预测 $\epsilon_\theta$ 就等价于估计 score，SDE/ODE 可以直接用它。

---

## 4. 采样器的分类

### 4.1 按随机性

| 类型 | 代表 | 特点 |
|---|---|---|
| 随机 SDE | Euler–Maruyama、Langevin、DDPM | 每步注入噪声，多样性好 |
| 确定性 ODE | DDIM（$\sigma=0$）、Euler、Heun | 可复现、可反演 |
| 可调随机 | DDIM with $\sigma>0$、某些 SDE solver | 在两者之间 |

### 4.2 按数值方法

| 类型 | 代表 | 特点 |
|---|---|---|
| 一阶 | Euler、Euler a | 简单，步数多 |
| 二阶 | Heun、DPM-Solver-2 | 更准，步数少 |
| 多步 | PLMS、DPM-Solver++ 2M | 复用历史，效率高 |
| 预测-校正 | UniPC | 预测 + 校正，稳定 |
| 指数积分 | DPM-Solver 系列 | 解析处理线性部分 |

### 4.3 按模型类型

- 离散扩散：DDPM/DDIM/DPM-Solver；
- Flow Matching：Euler/Heun 解 ODE；
- 蒸馏模型：LCM/Turbo 通常配少步 solver。

---

## 5. 几个代表方法

### 5.1 Euler

最简单的 ODE 积分：

$$
x_{t-\Delta}=x_t-\Delta\,v_\theta(x_t,t).
$$

- 一阶；
- 步长小才准；
- 常用于 Flow 模型。

### 5.2 Heun

二阶：

1. 先 Euler 预测；
2. 再在预测点算一次导数；
3. 取平均。

- 比 Euler 准；
- 每步两次模型评估；
- 适合少步但要求质量。

### 5.3 PLMS

Pseudo Linear Multistep：

- 用历史几步的导数做线性组合；
- 比单步更准；
- 需要保存历史；
- 是较早的快速采样器。

### 5.4 DPM-Solver

核心直觉：

- 扩散 ODE 有半线性结构；
- 线性部分可以解析积分；
- 非线性部分用高阶近似；
- 因此 10–25 步就能接近多步 DDPM。

DPM-Solver++：

- 改进稳定性/高阶版本；
- 2M 表示二阶多步；
- 常用于 SD 默认快速采样。

### 5.5 UniPC

Unified Predictor-Corrector：

- 预测 + 校正；
- 统一不同阶数；
- 质量稳定，常用于 15–30 步。

### 5.6 Karras sigma

不是 solver，而是噪声 schedule：

- 在噪声大的区域用更大步长；
- 在噪声小的区域更细；
- 常与 Euler/Heun 搭配。

---

## 6. 为什么高阶采样器能少步

数值积分有两个误差来源：

1. **离散误差**：步长太大，近似不准；
2. **截断误差**：低阶方法忽略高阶项。

高阶方法：

- 用更多导数信息，单步更准；
- 允许更大步长；
- 因此总步数更少。

但注意：

- 高阶不等于一定更快；
- 每步可能多次模型评估；
- 步数少不一定 wall-clock 少；
- 还要看 batch、CFG、VAE 解码。

---

## 7. Sampler 与 Scheduler 的区别

| 概念 | 作用 | 例子 |
|---|---|---|
| Scheduler | 定义噪声水平/时间步/$\sigma$ | linear、cosine、Karras、leading |
| Sampler | 给定噪声水平，如何数值积分 | Euler、Heun、DPM++ 2M、UniPC |

同一个 sampler 可以配不同 scheduler；同一个 scheduler 也可以配不同 sampler。

面试时不要把“换 scheduler”说成“换模型”。

---

## 8. 实际怎么选

| 场景 | 推荐 | 理由 |
|---|---|---|
| 通用文生图 | DPM++ 2M Karras / UniPC，20–30 步 | 质量/速度平衡 |
| 需要确定性/编辑 | DDIM，20–50 步 | 可复现、可反演 |
| 多样性/氛围 | Euler a / SDE | 随机性 |
| Flow 模型 | Euler / Heun | 匹配 ODE 训练 |
| 实时 | LCM/Turbo + 少步 solver | 蒸馏模型 |
| 低显存 | 少步 + 低分辨率 + 量化 | 降低每步成本 |

---

## 9. 90 秒回答：DPM-Solver 为什么快

> **面试官问**：DPM-Solver 为什么能用更少步？

**参考回答**：

“它把扩散的反向过程写成半线性 ODE，线性部分可以解析积分，非线性部分用高阶近似，所以每一步比 Euler 更准，允许更大步长。它不是蒸馏模型，也不改网络，只是更好的数值求解器。DPM-Solver++ 进一步改进了高阶/多步稳定性，所以 10–25 步就能接近多步 DDPM 的质量。代价是每步可能多次模型评估，实际时延要看 wall-clock。”

---

## 10. 90 秒回答：常见采样方式

> **面试官问**：扩散模型有哪些常见采样方式？

**参考回答**：

“可以按随机性和数值方法分。随机采样有 DDPM 祖先采样、Euler a、SDE；确定性采样有 DDIM、ODE Euler、Heun；高阶/多步有 PLMS、DPM-Solver、DPM-Solver++、UniPC；少步蒸馏有 LCM、Turbo、DMD；Flow 模型用 Euler/Heun 解 ODE。实际选择看任务：通用质量用 DPM++ 2M/UniPC，编辑用 DDIM，实时用蒸馏模型。”

---

## 11. 常见误区

1. **“DPM-Solver 是蒸馏模型”**：它是数值求解器，不改网络。
2. **“ODE 一定比 SDE 好”**：ODE 可复现，SDE 多样性更好。
3. **“阶数越高越好”**：每步成本、稳定性、步数要一起看。
4. **“步数少一定快”**：还要看每步模型评估次数和 CFG。
5. **“scheduler 就是 sampler”**：一个是噪声 schedule，一个是积分方法。
6. **“DDIM 就是 ODE”**：DDIM 的 $\sigma=0$ 版本对应 ODE，但 DDIM 也可随机。

---

## 12. 课堂练习

> 答案见 [06 章节练习与答案](06-章节练习与答案.md)。

1. 画一张采样器分类表（随机/确定、一阶/二阶/多步）。
2. 解释反向 SDE 与概率流 ODE 的关系。
3. 为什么 DPM-Solver 能用更少步？
4. sampler 和 scheduler 的区别？
5. 为“编辑任务”和“实时生成”各选一个采样器，并说明理由。
6. 用 90 秒回答 D1。

---

## 13. 自测清单

- [ ] 能写出前向/反向 SDE 的直觉；
- [ ] 能解释概率流 ODE；
- [ ] 能分类至少 6 种采样器；
- [ ] 能解释高阶为什么快；
- [ ] 能区分 sampler/scheduler；
- [ ] 能根据任务选型；
- [ ] 能 90 秒回答 D1/D3。

---

## 14. 本节材料为什么这样设计

- **先 SDE/ODE 再列 sampler**：避免只背名字。
- **分类表**：面试时能快速展开。
- **DPM-Solver 单列**：D3 最常追问。
- **实际选型**：把知识和工程决策连起来。
- **不写代码**：本节是概念和选型，不是实现 solver。

详细设计理由见 [08 材料设计理由](08-材料设计理由.md)。

---

## 15. 下一节

[2.3 蒸馏与少步生成](03-蒸馏与少步生成.md)
