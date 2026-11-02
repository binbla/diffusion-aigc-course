# 第 2 章 采样、加速与引导

> **课时**：4 节 / 6 小时  
> **前置**：第 1 章（DDPM、后验、噪声预测）  
> **章节定位**：把“会训练”推进到“会采样、会加速、会调引导”。  
> **重要说明**：本章以面试学习为目标，**不要求实现采样器、不要求跑 benchmark、不要求训练蒸馏模型**。

---

## 本章完整教学材料

| 材料 | 内容 |
|---|---|
| [第 2 章材料包总览](../lessons/ch02/README.md) | 材料清单、学习顺序、验收 |
| [2.1 DDPM 采样与 DDIM](../lessons/ch02/01-DDPM采样与DDIM.md) | 采样公式、跳步、反演 |
| [2.2 SDE/ODE 与高阶采样器](../lessons/ch02/02-SDE-ODE与高阶采样器.md) | SDE/ODE、DPM-Solver、UniPC |
| [2.3 蒸馏与少步生成](../lessons/ch02/03-蒸馏与少步生成.md) | LCM、Turbo、DMD、Rectified Flow |
| [2.4 Classifier Guidance 与 CFG](../lessons/ch02/04-ClassifierGuidance与CFG.md) | score 分解、CFG、负向 prompt |
| [章节面试题库](../lessons/ch02/05-章节面试题库.md) | 90 秒答案、追问树 |
| [章节练习与答案](../lessons/ch02/06-章节练习与答案.md) | 概念/推导/计算题 |
| [讲师手册](../lessons/ch02/07-讲师手册.md) | 4 节课的时间、板书、互动 |
| [材料设计理由](../lessons/ch02/08-材料设计理由.md) | 为什么选这些内容、边界、可修改点 |

---

## 章节目标

完成本章后，你应该能够：

1. 写出 DDPM 祖先采样和 DDIM 更新式；
2. 解释 DDPM 与 DDIM 的关系、跳步与反演；
3. 区分 SDE/ODE、一阶/高阶/多步采样器；
4. 说出至少 4 类加速方法及其代价；
5. 推导 classifier guidance 与 CFG；
6. 解释 $w$、负向 prompt、过饱和；
7. 为不同任务选择采样器/加速/引导方案；
8. 用 90 秒回答 D1、D3、D4、D8。

---

## 课时地图

| 节 | 主题 | 核心问题 | 对应面试题 |
|---|---|---|---|
| [2.1](../lessons/ch02/01-DDPM采样与DDIM.md) | DDPM 采样与 DDIM | 同一个模型为什么能跳步？ | D1、D4 |
| [2.2](../lessons/ch02/02-SDE-ODE与高阶采样器.md) | SDE/ODE 与高阶采样器 | DPM-Solver 为什么快？ | D1、D3 |
| [2.3](../lessons/ch02/03-蒸馏与少步生成.md) | 蒸馏与少步生成 | 1–4 步是怎么做到的？ | D3 |
| [2.4](../lessons/ch02/04-ClassifierGuidance与CFG.md) | Guidance | 为什么不要分类器也能引导？ | D8 |

---

## 每节课讲什么、学什么

### 2.1 DDPM 采样与 DDIM

**讲什么**：

- DDPM 祖先采样；
- DDIM 非马尔可夫前向与更新式；
- $\sigma_t$ 的三种取值；
- 特例关系、跳步、反演。

**学什么**：

- 写 DDPM/DDIM 公式；
- 解释 DDPM 是 DDIM 的什么特例；
- 解释跳步/反演；
- 90 秒回答 D4。

**能处理什么**：

- D4；
- “DDIM 为什么能跳步”；
- “DDPM/DDIM 哪个好”；
- “DDIM inversion 怎么用于编辑”。

---

### 2.2 SDE/ODE 与高阶采样器

**讲什么**：

- 前向/反向 SDE；
- 概率流 ODE；
- Euler/Heun/PLMS/DPM-Solver/UniPC；
- sampler vs scheduler；
- 实际选型。

**学什么**：

- 分类至少 6 种采样器；
- 解释 DPM-Solver 为什么快；
- 区分 sampler/scheduler；
- 按任务选型。

**能处理什么**：

- D1；
- “DPM-Solver 为什么快”；
- “SDE/ODE 怎么选”；
- “步数少为什么不一定快”。

---

### 2.3 蒸馏与少步生成

**讲什么**：

- 渐进蒸馏；
- LCM/一致性模型；
- Turbo/对抗蒸馏；
- DMD；
- Rectified Flow。

**学什么**：

- 比较四类蒸馏；
- 解释少步的代价；
- 为场景选型；
- 90 秒回答 D3。

**能处理什么**：

- D3；
- “LCM 和 Turbo 区别”；
- “为什么 Turbo 低 CFG”；
- “手机端怎么选”。

---

### 2.4 Classifier Guidance 与 CFG

**讲什么**：

- score 分解；
- classifier guidance；
- CFG 与条件 dropout；
- 负向 prompt；
- $w$ 与过饱和。

**学什么**：

- 推导两种 guidance；
- 解释 CFG 为什么不需要分类器；
- 调 $w$；
- 90 秒回答 D8。

**能处理什么**：

- D8；
- “CFG 需要分类器吗”；
- “$w$ 为什么不能太大”；
- “负向 prompt 怎么实现”。

---

## 本章不做什么

- 不实现 DDIM/DPM-Solver；
- 不跑采样器 benchmark；
- 不训练 LCM/Turbo/DMD；
- 不做显存/时延优化。

代码只作为可选实验，不进入主线。详细理由见 [08 材料设计理由](../lessons/ch02/08-材料设计理由.md)。

---

## 章节产出（纸面/口述）

1. DDPM/DDIM 公式对照表；
2. 采样器分类表；
3. 加速方案选型表；
4. CFG 推导 + $w$ 调参说明；
5. 90 秒回答录音。

---

## 章节通关清单

- [ ] 能写 DDPM/DDIM 公式；
- [ ] 能解释特例/跳步/反演；
- [ ] 能分类采样器；
- [ ] 能比较 4 类加速；
- [ ] 能推导 CFG；
- [ ] 能解释高 CFG 的代价；
- [ ] 完成 06 练习。

---

## 下一章

[第 3 章 Latent Diffusion 与 Stable Diffusion](03-latent-sd.md)
