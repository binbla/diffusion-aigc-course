# 4.4 LoRA / DreamBooth / Textual Inversion / Hypernetwork

> **所属章节**：第 4 章 条件控制与个性化  
> **课时**：90 分钟  
> **前置**：SD 架构、Cross-Attention  
> **对应面试题**：A12  
> **一句话目标**：学完能说清四种个性化方法分别在训练什么、容量多大、适合什么场景，并能做选型。

---

## 1. 学习目标

学完本节，你应该能够：

1. **写出** LoRA 的低秩增量公式；
2. **解释** rank/alpha、目标模块、合并；
3. **说明** DreamBooth 的少样本训练和 prior preservation；
4. **解释** Textual Inversion 只学 token embedding；
5. **说明** Hypernetwork 的“网络生成权重”；
6. **比较** 四种方法的容量、文件、数据量、风险；
7. **用 90 秒**回答 A12，并接住“LoRA 和 DreamBooth 的区别”。

---

## 2. 为什么需要个性化

预训练 SD 不知道：

- 你的脸；
- 你的宠物；
- 你的品牌；
- 你的画风；
- 一个特定物体。

个性化方法要解决：

> 用少量数据，把新概念/新主体注入模型，同时尽量保留原能力。

四条路线：

- **LoRA**：低秩增量；
- **DreamBooth**：少样本微调配方；
- **Textual Inversion**：新 token embedding；
- **Hypernetwork**：小网络生成权重。

---

## 3. LoRA

### 3.1 公式

对原权重 $W\in\mathbb R^{d\times k}$，不直接更新，而是学低秩增量：

$$
W'=W+\Delta W
=W+\frac{\alpha}{r}BA,
$$

其中：

- $B\in\mathbb R^{d\times r}$；
- $A\in\mathbb R^{r\times k}$；
- $r\ll\min(d,k)$；
- $\alpha$ 是缩放。

### 3.2 初始化

- $A$ 随机；
- $B=0$；
- 所以初始 $\Delta W=0$，不破坏原模型。

### 3.3 作用位置

在 SD 中通常作用于：

- cross-attention 的 Q/K/V/out 投影；
- 也可作用于 UNet 其他线性层；
- 有时也加在文本编码器上。

### 3.4 训练与推理

- 只更新 $A,B$；
- 文件小（几 MB 到几十 MB）；
- 推理可动态加载；
- 可合并进原权重；
- 多个 LoRA 可组合，但可能冲突。

### 3.5 优缺点

优点：

- 参数高效；
- 训练快；
- 易分享/组合；
- 不破坏原权重。

缺点：

- rank 太小容量不足；
- 太大会过拟合；
- 复杂主体可能不如全量微调。

---

## 4. DreamBooth

### 4.1 流程

- 输入：3–5 张主体图（人/宠物/物体）；
- 一个唯一标识符（如 `sks dog`）；
- 微调整个模型，或用 LoRA；
- 目标：把标识符绑定到主体。

### 4.2 Class prior preservation

用基础模型生成同类别的先验图，防止语言漂移/过拟合：

$$
\mathcal L
=\mathbb E\left[
\|\epsilon-\epsilon_\theta(x_t,c)\|^2
+\lambda\|\epsilon'-\epsilon_\theta(x_t',c_{\mathrm{prior}})\|^2
\right].
$$

- 第一项：主体图去噪；
- 第二项：先验图去噪；
- 让模型保留“类别”的一般知识。

### 4.3 优缺点

优点：

- 主体一致性强；
- 少样本；
- 可结合 LoRA 降成本。

缺点：

- 容易过拟合；
- 可能忘记原模型能力/语言漂移；
- 全量微调成本高。

**面试要点**：DreamBooth 是训练配方，不是参数高效方法；它可以全量，也可以 LoRA。

---

## 5. Textual Inversion

### 5.1 思想

在文本编码器的词嵌入表中新增一个 token（如 `<my-style>`），冻结模型，只优化这个 embedding。

### 5.2 损失

$$
\min_{v}\;
\mathbb E\left[
\|\epsilon-\epsilon_\theta(x_t,t,c(v))\|^2
\right].
$$

- 只学 $v$；
- 模型权重不变；
- 文件 KB 级。

### 5.3 优缺点

优点：

- 文件极小；
- 不改变模型；
- 易组合；
- 适合风格/简单概念。

缺点：

- 容量有限；
- 复杂主体/高保真人物弱；
- 一个 token 能表达的信息有限。

---

## 6. Hypernetwork

### 6.1 思想

训练一个辅助网络，输入一个 learned embedding，输出原模型某些层的权重增量：

$$
\Delta W=H_\theta(e).
$$

- 原模型冻结；
- 辅助网络学习“怎么改权重”；
- 在 SD 社区中常作用于 cross-attention。

### 6.2 特点

- 文件通常比 LoRA 大；
- 训练更不稳定；
- 现在使用较少，逐渐被 LoRA 取代；
- 适合风格/概念，但工程生态不如 LoRA。

---

## 7. 对比表

| 方法 | 训练对象 | 是否改原权重 | 数据量 | 文件大小 | 容量 | 适合 |
|---|---|---|---|---|---|---|
| LoRA | 低秩增量 $BA$ | 不改，挂载增量 | 几十–几百张 | 几 MB–几十 MB | 中 | 风格/角色/概念 |
| DreamBooth | 全量或 LoRA | 改（全量） | 3–5 张 + 先验 | GB 级（全量） | 高 | 强主体绑定 |
| Textual Inversion | 新 token embedding | 不改 | 3–5 张 | KB 级 | 低 | 概念/风格 |
| Hypernetwork | 生成权重的网络 | 不改 | 几十–几百张 | 几十–几百 MB | 中高 | 风格 |

---

## 8. 怎么选

| 需求 | 推荐 |
|---|---|
| 学一个画风 | LoRA / TI |
| 学一个人/宠物 | DreamBooth + LoRA |
| 快速试错 | LoRA |
| 文件要极小 | TI |
| 需要强主体一致性 | DreamBooth |
| 研究/实验 | Hypernetwork（较少） |

---

## 9. 90 秒回答：四种方法的区别

> **面试官问**：谈谈 LoRA / DreamBooth / Textual Inversion / Hypernetwork 的原理和差异。

**参考回答**：

“LoRA 学低秩增量 $W+\frac{\alpha}{r}BA$，只训练 A/B，文件小、可组合。DreamBooth 是少样本主体定制配方，用 3–5 张图和唯一标识符，配合 class prior preservation 防止过拟合，可以全量微调或加 LoRA。Textual Inversion 冻结模型，只学一个新的 token embedding，文件 KB 级，但容量有限。Hypernetwork 用小网络生成权重增量，原模型冻结，文件较大、训练不如 LoRA 稳定。核心区别是：LoRA 改权重增量，DreamBooth 是训练配方，TI 改 prompt token，Hypernetwork 生成权重。”

---

## 10. 追问与回答

### 追问 1：LoRA 和 DreamBooth 是什么关系？

DreamBooth 是“怎么训”的配方，LoRA 是“训哪些参数”的方法；可以组合成 DreamBooth LoRA。

### 追问 2：TI 为什么文件这么小？

只存一个新 token 的 embedding，不存模型权重。

### 追问 3：DreamBooth 为什么需要先验图？

防止过拟合和语言漂移，让模型保留类别的一般知识。

### 追问 4：LoRA 的 rank 怎么选？

小 rank 容量低但轻，大 rank 容量高但易过拟合；常用 4–64，视任务调。

---

## 11. 常见误区

1. **把 DreamBooth 等同于 LoRA**：一个是配方，一个是 PEFT。
2. **说 LoRA 改原权重**：训练是增量，推理可合并。
3. **说 TI 改 UNet**：只学文本 embedding。
4. **忽略 prior preservation**：DreamBooth 的关键。
5. **认为文件越小效果越好**：TI 容量有限。

---

## 12. 课堂练习

> 答案见 [06 章节练习与答案](06-章节练习与答案.md)。

1. 写 LoRA 公式。
2. 解释 DreamBooth prior loss。
3. 说明 TI 只学什么。
4. 比较四种方法的容量/文件。
5. 用 90 秒回答 A12。

---

## 13. 自测清单

- [ ] 能写 LoRA 公式；
- [ ] 能解释 rank/alpha；
- [ ] 能解释 DreamBooth prior；
- [ ] 能解释 TI；
- [ ] 能解释 Hypernetwork；
- [ ] 能做选型；
- [ ] 能 90 秒回答 A12。

---

## 14. 本节材料为什么这样设计

- **先 LoRA 再 DreamBooth**：先讲参数高效，再讲训练配方。
- **对比表**：A12 的核心。
- **选型表**：把知识变成决策。
- **不写代码**：本节是方法和取舍，不是训练实现。

详细设计理由见 [08 材料设计理由](08-材料设计理由.md)。

---

## 15. 下一节

[章节面试题库](05-章节面试题库.md)
