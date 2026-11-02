# 知识缺口审计：26 题之外，还缺什么

> 审计对象：现有 8 章、26 节课、3 个综合练习。  
> 结论先说：**原 26 题覆盖得比较完整，但“前沿延伸”有明显缺口。**  
> 如果面试只问原题，现有材料够；如果遇到 DiT、Flow、视频、3D、RLHF、评估，会明显缺一块。

---

## 1. 审计方法

从四个维度检查：

1. **理论**：是否覆盖扩散/score/ODE/Flow/离散扩散；
2. **架构**：是否覆盖 UNet/DiT/MMDiT/视频 Transformer；
3. **应用**：是否覆盖图像/视频/3D/编辑/个性化/科学；
4. **面试**：是否能回答“2023–2026 发生了什么”。

判定：

- **已覆盖**：课程有专门课时，能推导/画图；
- **部分覆盖**：提到但没展开；
- **缺口**：没有课时，也没有延伸材料。

---

## 2. 缺口总表

| # | 缺口 | 现状 | 面试会怎么问 | 建议补法 | 优先级 |
|---|---|---|---|---|---|
| 1 | DiT / Transformer 主干 | 只提到 SD3 的 MMDiT | “为什么从 UNet 转向 Transformer？” | 扩展篇 DiT/PixArt/Sana | 高 |
| 2 | Flow Matching / Rectified Flow | 只讲 SD3 的 Flow loss | “Flow 和 Diffusion 什么关系？” | 扩展篇 + 1 页公式 | 高 |
| 3 | 一致性模型/蒸馏数学 | 讲 LCM/Turbo/DMD，但没展开 consistency | “LCM 为什么能 1 步？” | 扩展篇 Consistency/LCM | 高 |
| 4 | 视频扩散/世界模型 | 完全没讲 | “Sora 怎么做的？视频扩散和图像扩散区别？” | 扩展篇视频章节 | 高 |
| 5 | 3D/4D 生成 | 完全没讲 | “DreamFusion/MVDream/InstantMesh 是什么？” | 扩展篇 3D 章节 | 中 |
| 6 | 编辑/反演 | 只提 DDIM inversion | “Prompt-to-Prompt/InstructPix2Pix 怎么做？” | 扩展篇编辑章节 | 高 |
| 7 | 个性化/ID 保持 | 讲 LoRA/DreamBooth/TI，但没讲 ID 方法 | “PhotoMaker/InstantID 和 LoRA 区别？” | 扩展篇个性化 | 中 |
| 8 | 偏好优化/RLHF | 完全没讲 | “DDPO/Diffusion-DPO 是什么？” | 扩展篇对齐章节 | 高 |
| 9 | 组合评估 | 只讲 FID/CLIPScore | “怎么评估计数/空间/属性绑定？” | 扩展篇 GenEval/VQAScore | 高 |
| 10 | 离散扩散/扩散 LLM | 只在 D2 提 D3PM | “扩散能生成文本吗？LLaDA 是什么？” | 扩展篇离散扩散 | 中 |
| 11 | 科学/音频/机器人 | 完全没讲 | “扩散除了图像还能做什么？” | 扩展篇应用 | 中 |
| 12 | 安全/水印/概念擦除 | 完全没讲 | “怎么防止生成侵权/NSFW？怎么擦除概念？” | 扩展篇安全 | 中 |
| 13 | 数据/recaption/scaling | 只讲数据过滤 | “DALL·E 3 的 recaption 有什么用？” | 扩展篇数据 | 中 |
| 14 | 推理工程/量化/缓存 | 第 2 章提了缓存/量化 | “怎么把 SD 部署到端侧？” | 扩展篇效率 | 中 |
| 15 | 模型全景（DALL·E 3/Imagen/Flux/SD3.5） | 只到 SD3 | “2024–2026 有哪些主流模型？” | 扩展篇模型地图 | 高 |
| 16 | 扩散 vs 自回归 | 只在 D6 对比 GAN | “为什么视频/语言开始用扩散？” | 扩展篇 + 讨论 | 中 |

---

## 3. 逐项说明

### 3.1 DiT / Transformer 主干（高）

现有课程讲了 UNet 和 MMDiT，但没有系统讲：

- DiT 如何把 latent patch 当 token；
- adaLN-Zero 条件注入；
- Gflops/scaling；
- PixArt/Sana 如何降低训练/推理成本。

面试如果问“SD3 为什么能换 Transformer”，只会说“MMDiT”不够，要能接到 DiT 的 patch tokenization/adalaN。

### 3.2 Flow Matching / Rectified Flow（高）

现有课程有 SD3 的 Flow loss，但缺：

- Flow Matching 的连续概率路径；
- Rectified Flow 的直线插值；
- 为什么轨迹更直、少步更容易；
- 和 DDPM/Score SDE 的统一视角。

这是 2024–2026 面试的高频延伸。

### 3.3 一致性模型/蒸馏数学（高）

现有课程讲了 LCM/Turbo/DMD 的“是什么”，但缺：

- consistency function $f(x_t,t)\to x_0$；
- 一致性蒸馏的边界条件；
- 为什么可以 1–4 步；
- 与渐进蒸馏/对抗蒸馏的区别。

### 3.4 视频扩散/世界模型（高）

完全没讲：

- 视频 VAE/3D VAE；
- 时空 attention；
- 图像预训练 → 视频微调；
- Sora 的“world simulator”叙事；
- SVD/CogVideoX/HunyuanVideo/Wan 的差异。

这是 2024–2026 最热的方向之一。

### 3.5 3D/4D 生成（中）

缺：

- DreamFusion 的 SDS；
- MVDream 的多视角一致性；
- InstantMesh/TripoSR 的 feed-forward 重建；
- 3DGS/4D 的扩散应用。

### 3.6 编辑/反演（高）

现有只提 DDIM inversion，缺：

- Prompt-to-Prompt 的 cross-attention 编辑；
- Null-text inversion；
- InstructPix2Pix 的指令编辑；
- MasaCtrl 的 consistent editing。

### 3.7 个性化/ID 保持（中）

现有 LoRA/DreamBooth/TI 是“训练型”个性化；缺：

- PhotoMaker 的 stacked ID embedding；
- InstantID 的 IdentityNet；
- PuLID 的 contrastive alignment；
- 与 IP-Adapter 的区别。

### 3.8 偏好优化/RLHF（高）

缺：

- DDPO 把去噪当 MDP；
- Diffusion-DPO 的偏好优化；
- reward model（ImageReward/HPSv2）；
- 奖励劫持/过优化。

### 3.9 组合评估（高）

现有 FID/CLIPScore 不够；缺：

- GenEval 的对象/计数/颜色/位置；
- T2I-CompBench；
- VQAScore 的 VQA 对齐；
- 人类偏好与奖励模型。

### 3.10 离散扩散/扩散 LLM（中）

缺：

- D3PM/MaskGIT 的离散转移；
- LLaDA 的 masked diffusion；
- 扩散语言模型与自回归的对比。

### 3.11 科学/音频/机器人（中）

缺：

- DiffDock 的分子对接；
- AudioLDM 的音频；
- Diffusion Policy 的机器人策略；
- 时间序列/RL/蛋白质。

### 3.12 安全/水印/概念擦除（中）

缺：

- 概念擦除（ESD/UCE）；
- 水印（Tree-Ring/Stable Signature）；
- 安全过滤/红队；
- 版权/记忆。

### 3.13 数据/recaption/scaling（中）

缺：

- DALL·E 3 的 recaption；
- 数据清洗/审美过滤；
- synthetic data；
- scaling law。

### 3.14 推理工程（中）

缺：

- 量化/蒸馏/缓存；
- TensorRT/端侧；
- 显存/吞吐优化；
- 服务化。

### 3.15 模型全景（高）

缺：

- DALL·E 3、Imagen、PixArt、Flux、SD3.5；
- 各自的核心改动；
- 开源/闭源/可控性对比。

### 3.16 扩散 vs 自回归（中）

缺：

- 为什么视频/语言开始用扩散；
- 扩散 LLM 的优劣；
- 与 AR 的混合。

---

## 4. 对课程的影响

现有 26 题仍然是“主干”，不建议重写；建议加一个**扩展篇**：

- 不增加 26 节主课；
- 用“论文地图 + 90 秒延伸回答”补前沿；
- 面试前 1–2 小时可扫完；
- 看到不会的论文，知道它在哪条线上。

---

## 5. 扩展篇入口

- [2023–2026 扩散模型论文地图](papers-2023-2026.md)
- [扩展篇总览](README.md)

---

## 6. 审计结论

- **原 26 题：覆盖良好**，足以应对基础/中级面试；
- **前沿延伸：缺口明显**，尤其是 DiT、Flow、视频、3D、RLHF、组合评估；
- **不需要重写主课**，加一个扩展篇即可；
- 扩展篇的目标不是“读完所有论文”，而是**建立 2023–2026 的技术地图**。
