# 2.4 Classifier Guidance 与 CFG

> **所属章节**：第 2 章 采样、加速与引导  
> **课时**：90 分钟  
> **前置**：2.1–2.3  
> **对应面试题**：D8  
> **一句话目标**：学完能推导 classifier guidance 和 CFG，解释 $w$、负向 prompt、过饱和，并说清二者的本质区别。

---

## 1. 学习目标

学完本节，你应该能够：

1. **解释** 条件生成为什么需要 guidance；
2. **写出** score 分解公式；
3. **推导** classifier guidance 的 $\epsilon$ 形式；
4. **推导** CFG 公式，并解释它是“隐式分类器”；
5. **说明** 训练时为什么要条件 dropout；
6. **解释** $w$ 的作用、过高/过低的表现；
7. **解释** 负向 prompt 的实现；
8. **用 90 秒**回答 D8，并接住“CFG 需要分类器吗”这类追问。

---

## 2. 为什么需要 guidance

条件生成想得到：

$$
p(x\mid c),
$$

但模型学的是联合分布/条件分布。采样时如果只用条件模型，可能出现：

- prompt 跟随不够；
- 细节不符合描述；
- 条件信号被数据先验淹没。

Guidance 的作用：

> 在采样时放大“条件方向”，让结果更符合 $c$，代价是多样性下降。

---

## 3. Score 分解

由贝叶斯公式：

$$
p(x\mid c)=\frac{p(x)p(c\mid x)}{p(c)}.
$$

对 $x$ 取对数梯度：

$$
\nabla_x\log p(x\mid c)
=\nabla_x\log p(x)
+\nabla_x\log p(c\mid x).
$$

- 第一项：无条件数据分布；
- 第二项：分类器/条件模型给出的“像不像 $c$”；
- 引导强度 $s$ 控制第二项的权重。

---

## 4. Classifier Guidance

### 4.1 形式

训练一个噪声分类器 $p_\phi(c\mid x_t)$，用它的梯度修改 score：

$$
\tilde\epsilon
=\epsilon_\theta(x_t)
-s\sqrt{1-\bar\alpha_t}
\nabla_{x_t}\log p_\phi(c\mid x_t).
$$

### 4.2 要求

- 分类器要在带噪数据上训练；
- 分类器要对 $x_t$ 可导；
- 需要额外模型；
- 引导强时可能产生对抗伪影。

### 4.3 优点/缺点

优点：

- 可以用无条件 diffusion + 分类器；
- 类别条件直观；
- 引导强度可调。

缺点：

- 额外训练分类器；
- 噪声分类器难训；
- 梯度可能不稳定；
- 主要用于类别条件，文本条件不方便。

---

## 5. Classifier-Free Guidance（CFG）

### 5.1 训练

- 训练条件模型 $\epsilon_\theta(x_t,t,c)$；
- 以一定概率（如 10%）把 $c$ 置空，训练无条件分支 $\epsilon_\theta(x_t,t,\varnothing)$；
- 两个分支共享网络。

### 5.2 采样

$$
\boxed{
\tilde\epsilon
=\epsilon_\theta(x_t,\varnothing)
+w\left(
\epsilon_\theta(x_t,c)
-\epsilon_\theta(x_t,\varnothing)
\right)
}
$$

- $w=1$：不引导；
- $w>1$：增强条件；
- $w<1$：弱化条件。

### 5.3 为什么叫 classifier-free

它没有显式分类器，而是用“条件模型 - 无条件模型”的差来近似：

$$
\nabla_x\log p(c\mid x)
\propto
\nabla_x\log p(x\mid c)-\nabla_x\log p(x).
$$

所以 CFG 可以看成**隐式分类器引导**。

### 5.4 负向 prompt

用负向条件 $c_{\mathrm{neg}}$ 替代 $\varnothing$：

$$
\tilde\epsilon
=\epsilon_\theta(x_t,c_{\mathrm{neg}})
+w\left(
\epsilon_\theta(x_t,c)
-\epsilon_\theta(x_t,c_{\mathrm{neg}})
\right).
$$

- 负向 prompt 不是“删除概念”的保证；
- 它只是把采样推离负向条件；
- 有时会引入新的偏差/伪影。

---

## 6. $w$ 的影响

| $w$ | 效果 |
|---|---|
| 1 | 不引导，多样性高，prompt 跟随一般 |
| 3–5 | 温和增强，通用 |
| 7–9 | 强引导，SD1.5 常用，色彩更饱和 |
| 12+ | 过饱和、伪影、多样性下降 |
| 0 | 接近无条件 |

不同模型的最佳 $w$ 不同：

- SD1.5：7–9；
- SDXL：5–7；
- Turbo/LCM：1–2；
- Flow 模型：需要看训练配置。

---

## 7. 为什么高 CFG 会过饱和

直观解释：

- CFG 放大“条件方向”；
- 过度放大后，样本偏离数据流形；
- 表现为对比度/饱和度升高、纹理僵硬、细节重复；
- 多样性下降。

工程上常用：

- **CFG rescale**：把引导后的结果缩放回原尺度；
- **dynamic CFG**：不同时间步用不同 $w$；
- **APG / PAG / SAG**：改进引导方向或注意力；
- **CFG++**：针对 flow/连续模型的改进。

---

## 8. Classifier Guidance vs CFG

| 维度 | Classifier Guidance | CFG |
|---|---|---|
| 额外模型 | 需要噪声分类器 | 不需要 |
| 训练 | 分类器 + diffusion | 条件/无条件联合训练 |
| 推理 | diffusion + 分类器梯度 | 两次 diffusion 前向 |
| 条件类型 | 多为类别 | 文本/类别/任意条件 |
| 稳定性 | 分类器梯度可能不稳 | 简单稳定 |
| 多样性 | 强引导下降 | 强引导下降 |
| 常见问题 | 对抗伪影 | 过饱和 |

---

## 9. 90 秒回答：CFG 和 classifier guidance 的区别

> **面试官问**：classifier-free guidance 和 classifier guidance 的区别？

**参考回答**：

“Classifier guidance 需要额外训练一个噪声分类器，用 $\nabla\log p(c|x_t)$ 修改 score；CFG 不需要分类器，而是同时训练条件和无条件模型，采样时用 $\epsilon_\theta(x_t,c)-\epsilon_\theta(x_t,\varnothing)$ 的差来近似分类器梯度，再乘引导强度 $w$。CFG 更简单、更通用，是文生图的主流；但它要两次前向，$w$ 太高会过饱和、降多样性。两者本质都是放大条件方向。”

---

## 10. 追问与回答

### 追问 1：CFG 需要分类器吗？

不需要。CFG 的 “classifier-free” 就是不需要显式分类器；它用条件/无条件模型的差。

### 追问 2：为什么训练时要 dropout 条件？

为了让同一个网络同时具备条件和无条件能力；否则推理时没有 $\epsilon_\theta(x_t,\varnothing)$。

### 追问 3：负向 prompt 怎么实现？

把负向文本编码作为 $c_{\mathrm{neg}}$，替代空条件；公式上就是用负向预测作为基线。

### 追问 4：CFG 为什么会让图更“锐”？

它放大了条件方向，让样本更靠近条件分布的高密度区域；但过度放大会偏离数据流形。

### 追问 5：CFG 和 classifier guidance 能一起用吗？

理论上可以，但工程上通常只用一种；CFG 更简单，classifier guidance 更少见。

---

## 11. 常见误区

1. **“CFG 需要分类器”**：不需要。
2. **“CFG 就是 classifier guidance”**：CFG 是隐式分类器引导。
3. **“$w$ 越大越好”**：过大会过饱和、降多样性。
4. **“负向 prompt 能删除概念”**：只是推离，不保证删除。
5. **“CFG 不增加计算”**：通常两次前向，成本约翻倍。
6. **“所有模型的最佳 CFG 一样”**：SD1.5/SDXL/Turbo 差异很大。

---

## 12. 课堂练习

> 答案见 [06 章节练习与答案](06-章节练习与答案.md)。

1. 写出 score 分解。
2. 写出 classifier guidance 的 $\epsilon$ 形式。
3. 写出 CFG 公式。
4. 解释 CFG 为什么是隐式分类器。
5. 负向 prompt 的公式怎么写？
6. 用 90 秒回答 D8。

---

## 13. 自测清单

- [ ] 能写 score 分解；
- [ ] 能写 classifier guidance；
- [ ] 能写 CFG；
- [ ] 能解释条件 dropout；
- [ ] 能解释 $w$ 的影响；
- [ ] 能解释负向 prompt；
- [ ] 能 90 秒回答 D8。

---

## 14. 本节材料为什么这样设计

- **先 score 分解**：两种 guidance 的统一语言。
- **对比表**：D8 的核心。
- **$w$ 的实践**：面试常问“怎么调”。
- **负向 prompt 单列**：工程常见。
- **不写代码**：本节是公式和取舍，不是采样实现。

详细设计理由见 [08 材料设计理由](08-材料设计理由.md)。

---

## 15. 下一节

[章节面试题库](05-章节面试题库.md)
