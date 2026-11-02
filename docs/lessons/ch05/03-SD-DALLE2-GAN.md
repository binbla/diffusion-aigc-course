# 5.3 SD vs DALL·E 2 vs GAN

> **所属章节**：第 5 章 模型演进与系统对比  
> **课时**：90 分钟  
> **前置**：SD、SDXL、SD3、GAN 基础  
> **对应面试题**：A7、D6  
> **一句话目标**：学完能画清 LDM、unCLIP、GAN 三条路线，解释 SD 与 DALL·E 2 的架构差异，并做系统选型。

---

## 1. 学习目标

学完本节，你应该能够：

1. **画出** SD 的 LDM 路线；
2. **画出** DALL·E 2 的 unCLIP 路线；
3. **解释** prior 的作用；
4. **说明** SD 与 DALL·E 2 的条件注入差异；
5. **比较** GAN 与 Diffusion 的取舍；
6. **为业务场景**选择模型/架构；
7. **用 90 秒**回答 A7/D6。

---

## 2. 三条路线

```text
SD（LDM）：
文本 token → CLIP → Cross-Attn（注入 UNet）→ latent 去噪 → VAE 解码

DALL·E 2（unCLIP）：
文本 → CLIP text → prior → CLIP image embedding → diffusion decoder → 超分

GAN：
噪声 → 生成器 → 图像；判别器给对抗信号
```

---

## 3. SD：Latent Diffusion

- VAE 把图像压到 4 通道 latent；
- UNet 在 latent 上去噪；
- 文本 token 通过 cross-attention 注入；
- 无 prior；
- 开放权重，生态完整。

关键：

- 条件在 token 级注入；
- 图像/文本对齐由 cross-attention 学；
- 可用 LoRA/ControlNet/IP-Adapter 扩展。

---

## 4. DALL·E 2：unCLIP

### 4.1 两阶段

1. **Prior**：文本嵌入 → CLIP 图像嵌入；
2. **Decoder**：以 CLIP 图像嵌入为条件，扩散生成图像。

### 4.2 为什么需要 prior

- 文本和图像在 CLIP 空间有模态 gap；
- prior 学习“文本对应的图像嵌入”；
- decoder 条件在图像嵌入上，生成更偏全局语义。

### 4.3 Decoder

- 在低分辨率图像上扩散（如 64×64）；
- 再用超分网络到 1024；
- 条件主要是 CLIP image embedding，不是 token 级 cross-attn。

### 4.4 特点

- 闭源 API；
- 生成质量/语义强；
- 控制/微调能力有限；
- 与 SD 的开放生态不同。

---

## 5. GAN

- 生成器 + 判别器；
- 对抗训练；
- 一步生成；
- 快、锐利；
- 训练不稳定、模式坍塌；
- 无似然（一般）。

GAN 在实时、特定域仍有价值；Diffusion 在大规模文生图上更主流。

---

## 6. 对比表

| 维度 | SD（LDM） | DALL·E 2（unCLIP） | GAN |
|---|---|---|---|
| 核心架构 | VAE + UNet | Prior + diffusion decoder | Generator + Discriminator |
| 条件注入 | 文本 token cross-attn | CLIP image embedding | 条件 GAN/embedding |
| 是否有 prior | 无 | 有 | 无 |
| 扩散空间 | VAE latent | 低分辨率图像 + 超分 | 无 |
| 采样 | 多步 | 多步 | 一步 |
| 训练稳定性 | 较稳 | 较稳 | 较难 |
| 多样性 | 较好 | 较好 | 易坍塌 |
| 可控性 | 强（LoRA/ControlNet） | 较弱（API） | 条件 GAN |
| 开放程度 | 开放权重 | 闭源 | 视实现 |
| 典型用途 | 开源生态/定制 | API 文生图 | 实时/特定域 |

---

## 7. SD vs DALL·E 2 的关键差异

1. **条件路径**：
   - SD：文本 token → cross-attn；
   - DALL·E 2：文本 → prior → 图像 embedding → decoder。
2. **是否有 prior**：
   - DALL·E 2 有；
   - SD 没有。
3. **扩散空间**：
   - SD 在 VAE latent；
   - DALL·E 2 在低分辨率图像 + 超分。
4. **生态**：
   - SD 开放，可微调/控制；
   - DALL·E 2 闭源 API。

相同点：

- 都用 CLIP 文本编码器；
- 都用扩散/去噪；
- 都用 CFG/引导；
- 都训练于大规模图文对。

---

## 8. 系统选型

| 场景 | 推荐 | 理由 |
|---|---|---|
| 开源/可定制 | SD/SDXL/SD3 | 可 LoRA/ControlNet |
| API 快速接入 | DALL·E 2/3 或闭源模型 | 免部署 |
| 实时低成本 | GAN/蒸馏 Diffusion | 一步/少步 |
| 高质量文生图 | SDXL/SD3/闭源 | 质量/语义 |
| 强空间控制 | SD + ControlNet | 结构可控 |
| 主体一致 | SD + IP-Adapter/LoRA | 参考图/定制 |

---

## 9. 90 秒回答：SD 与 DALL·E 2 的异同

> **面试官问**：介绍一下 SD、DALL·E 2 两者的异同。

**参考回答**：

“两者都用 CLIP 文本编码器、都用扩散、都用引导，但路线不同。SD 是 Latent Diffusion：VAE 把图像压到 latent，UNet 去噪，文本 token 通过 cross-attention 注入，没有 prior。DALL·E 2 是 unCLIP：先用 prior 把文本嵌入映射到 CLIP 图像嵌入，再用 diffusion decoder 以图像嵌入为条件生成，低分辨率扩散后超分到 1024。SD 开放权重、可控性强，能接 LoRA/ControlNet；DALL·E 2 闭源 API，控制有限。两者不是同一个架构。”

---

## 10. 90 秒回答：GAN 与 Diffusion 的区别

> **面试官问**：GAN 和 Diffusion 的区别？

**参考回答**：

“GAN 用生成器和判别器对抗训练，学隐式映射，一步出图，快、锐利，但训练不稳定、容易模式坍塌。Diffusion 学逐步去噪，训练目标稳定、模式覆盖通常更好、条件控制自然，但采样慢。实际系统会混合，比如 VQGAN 用 GAN 提升重建，或少步扩散用对抗蒸馏。”

---

## 11. 常见误区

1. **说 DALL·E 2 也是 latent diffusion**：它是 unCLIP，prior + decoder。
2. **说两者完全一样**：条件路径/prior/扩散空间不同。
3. **说 GAN 已完全过时**：实时/特定域仍有价值。
4. **忽略 DALL·E 2 的超分阶段**。
5. **只比较开源/闭源**：还要比较条件路径/可控性。

---

## 12. 课堂练习

> 答案见 [06 章节练习与答案](06-章节练习与答案.md)。

1. 画 LDM/unCLIP/GAN 三路线。
2. 解释 prior 的作用。
3. 比较 SD/DALL·E 2 的条件注入。
4. 给三个场景做选型。
5. 用 90 秒回答 A7/D6。

---

## 13. 自测清单

- [ ] 能画 LDM；
- [ ] 能画 unCLIP；
- [ ] 能解释 prior；
- [ ] 能比较条件注入；
- [ ] 能比较 GAN/Diffusion；
- [ ] 能做选型；
- [ ] 能 90 秒回答 A7/D6。

---

## 14. 本节材料为什么这样设计

- **三条路线图**：A7/D6 的核心。
- **prior 单列**：最容易被忽略。
- **选型表**：把架构差异转成决策。
- **不写代码**：本节是系统对比。

详细设计理由见 [08 材料设计理由](08-材料设计理由.md)。

---

## 15. 下一节

[章节面试题库](05-章节面试题库.md)
