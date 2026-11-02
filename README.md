# Diffusion / AIGC 面试课堂

把 26 道 Diffusion / AIGC 高频面试题，拆成 **8 章、26 节课、3 个综合练习**，形成一条“能推导、能解释、能比较、能面试表达”的学习路径。

> **当前版本：Phase 5 — 主课 + 扩展篇完成。**  
> 全课程 8 章、26 节课、3 个综合练习，加 2023–2026 前沿论文地图。  
> **定位**：面试学习，不是工程实现课；不要求写完整 DDPM 代码、不要求训练模型。

---

## 快速开始

### 方式一：直接阅读

从 [课程首页](docs/index.md) 开始，或先看 [课程总览](docs/course.md)。

第 1 章建议从 [材料包总览](docs/lessons/ch01/README.md) 开始。

### 方式二：本地起一个课程网站

需要 Python 3.10+：

```bash
cd diffusion-aigc-course
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
mkdocs serve
```

打开终端提示的本地地址（通常是 `http://127.0.0.1:8000`）。

### 方式三：作为 Obsidian / Typora 仓库

直接用 Obsidian 打开本目录，`docs/` 下都是标准 Markdown，公式用 LaTeX。

---

## 这门课有什么

### 8 章

| 章 | 主题 | 解决什么 |
|---|---|---|
| 0 | 导学 | 能力地图、学习路径、自测 |
| 1 | 扩散基础 | DDPM 推导、噪声 schedule、非高斯变体 |
| 2 | 采样/加速/引导 | DDIM、DPM-Solver、蒸馏、CFG |
| 3 | LDM 与 SD | VAE、Latent Diffusion、Attention、训练 |
| 4 | 条件与个性化 | CLIP、ControlNet、IP-Adapter、LoRA |
| 5 | 模型演进 | SDXL、SD3、DALL·E 2、GAN |
| 6 | 评估与面试 | FID/CLIPScore、模式坍塌、模拟面试 |
| 7 | 综合练习 | 纸面推导、方案设计、答辩 |

### 26 节课

每节课都有：

- **本节要回答的问题**；
- **讲什么**（知识点/公式/架构）；
- **学什么**（可检查的学习产出）；
- **对应面试题**；
- **课堂练习**；
- **课后作业**；
- **验收标准**；
- **常见误区**。

### 第 1–7 章完整材料包

每章都不是只有课时计划，而是包含：

- 4 节完整讲义（概念、推导、数值例子、90 秒回答）；
- 章节面试题库（90 秒答案 + 追问树 + 模拟面试脚本）；
- 章节练习与答案（概念/推导/计算，不写代码）；
- 讲师手册（4 节课的时间、板书、互动、禁忌）；
- 材料设计理由（为什么选这些内容、能学到什么、能处理什么、可修改点）。

入口：[第 1 章](docs/lessons/ch01/README.md)、[第 2 章](docs/lessons/ch02/README.md)、[第 3 章](docs/lessons/ch03/README.md)、[第 4 章](docs/lessons/ch04/README.md)、[第 5 章](docs/lessons/ch05/README.md)、[第 6 章](docs/lessons/ch06/README.md)、[第 7 章](docs/lessons/ch07/README.md)。

### 3 个综合练习（非工程实现）

1. **练习 A**：DDPM 纸面推导 + 采样对比；
2. **练习 B**：SD 条件控制方案设计；
3. **练习 C**：评测方案 + 10 分钟面试答辩。

> 不要求完整代码、不要求训练模型；重点是推导、方案、取舍和表达。

### 扩展篇（2023–2026）

主课覆盖 26 题；扩展篇补前沿：

- [知识缺口审计](docs/extension/knowledge-gaps.md)：16 个缺口、优先级、面试问法；
- [2023–2026 论文地图](docs/extension/papers-2023-2026.md)：30+ 论文卡片，含名字、影响力、星级、贡献、链接。

### 部署与 AI 伴读

- [Cloudflare Pages 部署指南](DEPLOYMENT.md)
- [AI 伴读设计说明（BYOK，无服务器）](AI_COMPANION.md)

### 配套资料

- [完整题库：题目/答案/分析](docs/reference/question-bank.md)
- [26 题—课时映射](docs/question-map.md)
- [公式速查](docs/formulas.md)
- [评估方案与面试 Rubric](docs/assessment.md)
- [课时教案模板](templates/lesson-template.md)

---

## 目录结构

```text
diffusion-aigc-course/
├── README.md
├── mkdocs.yml
├── requirements.txt
├── .gitignore
├── docs/
│   ├── index.md                     # 课程首页
│   ├── course.md                    # 课程总览：8 章 26 节
│   ├── syllabus.md                  # 2/6/8 周学习路径
│   ├── question-map.md              # 26 题 → 课时
│   ├── assessment.md                # 评估与面试 rubric
│   ├── formulas.md                  # 公式速查
│   ├── chapters/                    # 章节总览与课时计划
│   ├── lessons/
│   │   ├── ch01/                # 第 1 章完整教学材料
│   │   ├── ch02/                # 第 2 章完整教学材料
│   │   ├── ch03/                # 第 3 章完整教学材料
│   │   ├── ch04/                # 第 4 章完整教学材料
│   │   ├── ch05/                # 第 5 章完整教学材料
│   │   ├── ch06/                # 第 6 章完整教学材料
│   │   └── ch07/                # 第 7 章完整教学材料
│   ├── extension/               # 2023–2026 扩展篇
│   │   ├── knowledge-gaps.md
│   │   └── papers-2023-2026.md
│   └── reference/
│       └── question-bank.md         # 26 题完整答案
└── templates/
    └── lesson-template.md           # 后续写单节课讲义的模板
```

---

## 设计原则

1. **问题驱动**：每节课从面试题/工程问题开始；
2. **三层递进**：公式 → 架构 → 面试表达；
3. **输出倒逼**：每节课有练习，每章有可检查产出；
4. **可检查**：不靠“看过”，靠推导、手算、90 秒回答；
5. **面试导向**：90 秒回答 + 两层追问 + 模拟面试；
6. **诚实呈现**：不会就说不会，方案/练习要写失败与局限。

---

## 推荐路径

| 路径 | 周期 | 适合 |
|---|---|---|
| 速通 | 2 周 / 12 节核心课 | 面试在即 |
| 标准 | 6 周 / 26 节 + 综合练习 A/B | 大多数求职者 |
| 深入 | 8 周 / 26 节 + 3 个综合练习 + 模拟面试 | 冲高薪/研究岗 |

详见 [学习路径与周计划](docs/syllabus.md)。

---

## 下一步

- [x] 第 1–7 章完整讲义、面试题库、练习、讲师手册、设计理由；
- [x] 第 5–7 章模型演进、评估与综合练习；
- [x] 扩展篇：知识缺口审计 + 2023–2026 论文地图；
- [ ] 课程视频/录音脚本；
- [ ] 扩展题库与英文版。
- [ ] 第 7 章综合练习模板与评分表；
- [ ] 模拟面试题库与录音脚本；
- [ ] 英文面试版 / 60 分钟精简版。

---

## License / 使用说明

本课程材料用于个人学习与技术分享。引用论文时请以原文为准；题目答案中的版本细节（如 SD 2.x 的预测目标、SDXL 的配置）以官方模型卡/论文为准。
