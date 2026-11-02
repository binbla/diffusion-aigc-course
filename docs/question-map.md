# 26 题题目—课时映射

> 用途：查漏补缺、安排复习、做模拟面试抽题。  
> 重要度：**S** = 必须能白板推导/画图；**A** = 高频，必须讲顺；**B** = 加分项。

---

## 1. Diffusion 10 题

| 编号 | 题目 | 课时 | 重要度 | 必须掌握的关键词 |
|---|---|---|---|---|
| D1 | 扩散模型有哪些常见的采样方式？ | 2.1、2.2 | S | DDPM、DDIM、DPM-Solver、UniPC、LCM、SDE/ODE |
| D2 | 添加高斯噪声，能否使用其他噪声？ | 1.4 | A | 高斯假设、Cold Diffusion、D3PM、Flow Matching |
| D3 | 介绍一下你了解的 Diffusion 加速方法？ | 2.2、2.3、7.1 | S | 采样器、蒸馏、LCM、Turbo、DMD、缓存、量化 |
| D4 | DDPM 和 DDIM 的关系？ | 2.1 | S | 同边缘、非马尔可夫、确定性、跳步、特例 |
| D5 | 推演 DDPM 公式。 | 1.2、1.3、7.1 | S | 前向、后验、ELBO、噪声预测、采样 |
| D6 | GAN 和 Diffusion 的区别？ | 1.1、5.3 | A | 对抗 vs 去噪、一步 vs 多步、稳定性、模式覆盖 |
| D7 | 训练 SD 为什么要用 Offset Noise？ | 3.4 | A | 低频噪声、亮度偏移、平均灰度先验 |
| D8 | classifier-free guidance 和 classifier guidance 的区别？ | 2.4 | S | score 分解、显式/隐式分类器、CFG、$w$ |
| D9 | 实现 DDPM 是否需要什么条件？ | 1.3、7.1 | A | 最小闭环、理论前提、无条件/条件、工程细节 |
| D10 | 为什么 DDPM 加噪声的幅度不一致？ | 1.2 | S | $\beta_t$、$\bar\alpha_t$、SNR、schedule |

---

## 2. AIGC 16 题

| 编号 | 题目 | 课时 | 重要度 | 必须掌握的关键词 |
|---|---|---|---|---|
| A1 | 介绍 CLIP 的模型架构、训练方法与损失函数。 | 4.1 | S | 双塔、InfoNCE、大 batch、温度、零样本 |
| A2 | 谈谈 AE、VAE 和 VQ-VAE 的区别。 | 3.1 | S | ELBO、重参数、codebook、straight-through |
| A3 | 重参数技巧是什么？ | 1.2、3.1 | A | 随机性剥离、pathwise derivative、VQ 对比 |
| A4 | 图像生成的评估指标有哪些？ | 6.1 | S | FID、IS、CLIPScore、Precision/Recall、GenEval |
| A5 | Stable Diffusion 的核心优化是什么？ | 3.2 | S | Latent Diffusion、VAE、Cross-Attn、CFG |
| A6 | Stable Diffusion 是怎么训练的？ | 3.4 | S | 两阶段、冻结 VAE、CFG dropout、EMA、bucketing |
| A7 | 介绍一下 SD、DALL·E 2 两者的异同。 | 5.3 | A | LDM vs unCLIP、prior、decoder、开放/闭源 |
| A8 | 谈谈 SD 中的交叉注意力机制。 | 3.3 | S | Q 图像、K/V 文本、$O(NM)$、77 token |
| A9 | 如何改善 GAN 的模式坍塌？ | 6.2 | A | WGAN-GP、R1、spectral norm、PacGAN、Precision/Recall |
| A10 | SDXL 的核心优化？ | 5.1 | S | 双文本编码器、micro-conditioning、refiner、1024 |
| A11 | SD3 的核心优化？ | 5.2 | S | MMDiT、Rectified Flow、T5、16ch VAE |
| A12 | LoRA / DreamBooth / Textual Inversion / Hypernetworks | 4.4 | S | 低秩增量、prior preservation、token embedding |
| A13 | ControlNet 的核心原理？ | 4.2 | S | frozen base、trainable copy、zero convolution |
| A14 | IP-Adapter 的核心原理？ | 4.3 | S | image prompt、解耦 cross-attention、22M |
| A15 | CLIP 编码特征的优缺点？ | 4.1 | A | 全局语义、77 token、组合性、模态 gap |
| A16 | self attention 和 cross attention 的区别？ | 3.3 | S | Q/K/V 来源、同模态/跨模态、复杂度 |

---

## 3. 按章节统计

| 章节 | 题目 | 题数 |
|---|---|---|
| 第 1 章 | D2、D5、D6、D9、D10、A3 | 6 |
| 第 2 章 | D1、D3、D4、D8 | 4 |
| 第 3 章 | A2、A5、A6、A8、A16、D7 | 6 |
| 第 4 章 | A1、A12、A13、A14、A15 | 5 |
| 第 5 章 | A7、A10、A11、D6 | 4 |
| 第 6 章 | A4、A9 | 2 |
| 第 7 章 | 综合应用 | — |

> 注：部分题目跨章节，统计按“主讲课时”计数。

---

## 4. 三遍复习法

### 第一遍：理解（按章节）

- 跟着课时顺序学；
- 重点是“为什么”，不是背结论；
- 每节课完成一个产出。

### 第二遍：压缩（按题）

- 把每道题压缩成 3 个关键词 + 1 个公式/图；
- 用 90 秒复述；
- 标记“讲不顺”的题。

### 第三遍：模拟（按面试）

- 随机抽题，限时回答；
- 每题追问两层“为什么”；
- 白板推导核心 10 题；
- 记录卡壳点，回到课时补。

---

## 5. 核心 10 题（必须白板）

如果时间有限，优先掌握：

1. D5 DDPM 推导；
2. D4 DDPM/DDIM；
3. D8 CFG；
4. D10 噪声 schedule；
5. A1 CLIP loss；
6. A8 Cross-Attention；
7. A2 VAE/VQ-VAE；
8. A5 SD 架构；
9. A10/A11 SDXL/SD3 演进；
10. A13 ControlNet。

---

## 6. 抽题建议

- 一面：D1、D4、D5、D8、A1、A2、A5、A8；
- 二面：D2、D3、D7、D9、A6、A10、A11、A12；
- 三面/系统设计：A4、A7、A9、A13、A14、A15、方案/项目深挖；
- 交叉面：D6、A16、A3、D10。

---

## 7. 相关页面

- [完整题库（题目/答案/分析）](reference/question-bank.md)
- [课程总览](course.md)
- [学习路径](syllabus.md)
- [评估方案](assessment.md)
