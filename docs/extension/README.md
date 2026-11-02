# 扩展篇：2023–2026 扩散模型前沿地图

> 主课解决“26 题”；扩展篇解决“26 题之外，2023–2026 发生了什么”。

---

## 1. 为什么需要扩展篇

主课覆盖到 SD3、ControlNet、IP-Adapter、LoRA、FID/CLIPScore，已经能应对大多数基础/中级面试。

但 2023–2026 的面试越来越常问：

- DiT 和 UNet 的区别？
- Flow Matching / Rectified Flow 是什么？
- LCM/Turbo/DMD 为什么能少步？
- Sora/视频扩散怎么做？
- 3D 生成、SDS 是什么？
- DDPO/Diffusion-DPO 怎么做对齐？
- FID 之外怎么评估组合能力？
- 扩散能做 LLM 吗？

这些在主课里只是“提到”，没有展开。扩展篇就是补这一块。

---

## 2. 两篇材料

| 材料 | 内容 | 适合 |
|---|---|---|
| [知识缺口审计](knowledge-gaps.md) | 16 个缺口、优先级、面试问法 | 想知道“还缺什么” |
| [2023–2026 论文地图](papers-2023-2026.md) | 30+ 论文卡片、影响力/星级/贡献/链接 | 想补前沿、准备延伸题 |

---

## 3. 先看结论

### 3.1 主课覆盖良好

- DDPM/DDIM/CFG/VAE/CLIP/ControlNet/IP-Adapter/LoRA/SDXL/SD3/FID 都有专门课时；
- 26 题基本能答；
- 不缺“基础”，缺“前沿”。

### 3.2 主要缺口

- DiT/Transformer 主干；
- Flow Matching/Rectified Flow；
- 一致性/蒸馏数学；
- 视频/世界模型；
- 3D/4D；
- 编辑/反演；
- ID 个性化；
- RLHF/DPO；
- 组合评估；
- 离散扩散/LLM；
- 安全/水印；
- 数据/recaption/scaling；
- 推理工程。

### 3.3 怎么补

- 不重写 26 节主课；
- 用扩展篇的“论文卡片 + 90 秒延伸回答”；
- 面试前 1–2 小时扫地图；
- 一周精读 10 篇 S/A 论文。

---

## 4. 推荐阅读顺序

### 4.1 面试前 1 小时

1. [知识缺口审计](knowledge-gaps.md) 的“缺口总表”；
2. [论文地图](papers-2023-2026.md) 第 0 节地图；
3. 第 9 节 15 问；
4. 选 5 篇 S 卡看“一句话 + 大贡献”。

### 4.2 一周精读

- Day 1：DiT、SD3、Sana；
- Day 2：Consistency、LCM、DMD2；
- Day 3：ControlNet、IP-Adapter、InstantID；
- Day 4：SVD、Sora、CogVideoX；
- Day 5：DreamFusion、MVDream、InstantMesh；
- Day 6：DDPO、Diffusion-DPO、GenEval/VQAScore；
- Day 7：LLaDA + 复盘。

---

## 5. 使用原则

1. **先问题，后论文**：不要从摘要开始读；
2. **一页纸**：每篇只记“问题/方法/贡献/局限”；
3. **90 秒**：能讲出来才算会；
4. **不追引用数**：引用数据库差异大，2026 年论文引用还没积累；
5. **不背名字**：知道它在哪条线上、解决什么。

---

## 6. 相关页面

- [课程总览](../course.md)
- [题目映射](../question-map.md)
- [公式速查](../formulas.md)
- [评估方案](../assessment.md)
