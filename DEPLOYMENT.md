# Cloudflare Workers 静态资源部署指南

> 你现在看到的界面是 **Workers Builds**，不是旧版 Pages。  
> 本项目是纯静态 MkDocs 站点，用 **Worker + Static Assets** 部署最直接。  
> GitHub 仓库 → Cloudflare Workers Builds → 自动构建/部署。

---

## 1. 本地构建

```bash
cd diffusion-aigc-course
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m mkdocs build --strict
```

产物在 `site/`。

---

## 2. 推送到 GitHub

```bash
git init
git add .
git commit -m "Diffusion/AIGC course"
git branch -M main
git remote add origin git@github.com:<你的用户名>/<仓库名>.git
git push -u origin main
```

`.gitignore` 已忽略 `.venv/`、`site/`、`node_modules/`、`.wrangler/`。

---

## 3. Cloudflare Workers 连接仓库

1. Cloudflare Dashboard → **Workers & Pages**；
2. **Create application** → **Workers** → **Connect to Git**；
3. 选择 GitHub 仓库；
4. 进入你看到的四个字段：
   - 项目名称
   - 构建命令
   - 部署命令
   - 高级设置

### 3.1 项目名称

```text
diffusion-aigc-course
```

如果这个名字被占用，换一个，并同步改：

- `wrangler.jsonc` 的 `name`
- `mkdocs.yml` 的 `site_url`

### 3.2 构建命令

```bash
python -m pip install -r requirements.txt && python -m mkdocs build --strict && npm install
```

说明：

- `python -m` 避免 PATH 问题；
- `mkdocs build --strict` 生成 `site/`；
- `npm install` 安装 `package.json` 里的 `wrangler`。

### 3.3 部署命令

```text
npx wrangler deploy
```

`wrangler.jsonc` 已经配置：

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "diffusion-aigc-course",
  "compatibility_date": "2026-11-02",
  "assets": {
    "directory": "./site"
  }
}
```

所以 Worker 会把 `site/` 作为静态资源发布，不需要 `main` 脚本。

### 3.4 高级设置

- **Root directory**：留空（项目根目录）；
- **Build variables / 环境变量**：

```text
PYTHON_VERSION=3.11
```

> 如果构建镜像不支持 3.11，换 `3.12` 或 `3.10`。

---

## 4. 第一次部署

点 **Deploy**，日志里应该看到：

```text
pip install -r requirements.txt
mkdocs build --strict
npm install
npx wrangler deploy
```

成功后得到：

```text
https://diffusion-aigc-course.<你的-account-subdomain>.workers.dev
```

打开检查：

- 首页；
- 左侧导航；
- 搜索；
- 右下角 **AI 伴读**；
- 页面源码里的 `_headers` 是否生效（可稍后用 `curl -I` 验证）。

---

## 5. 更新 site_url

部署后拿到真实地址，改：

```yaml
# mkdocs.yml
site_url: https://diffusion-aigc-course.<你的-account-subdomain>.workers.dev/
```

或者自定义域名：

```yaml
site_url: https://your-domain.com/
```

然后：

```bash
git add mkdocs.yml
git commit -m "Set production URL"
git push
```

Cloudflare 会自动重新构建。

---

## 6. 自定义域名

Worker 项目 → **Settings** → **Domains & Routes** → **Add** → **Custom domain**。

- 域名在 Cloudflare：按提示自动加 DNS；
- 域名在别处：按提示加 CNAME。

然后把 `site_url` 改成自定义域名并 push。

---

## 7. 手动部署（备用）

如果 Workers Builds 的 Python 环境有问题：

```bash
cd diffusion-aigc-course
source .venv/bin/activate
python -m mkdocs build --strict

npm install
npx wrangler login
npm run deploy
```

`npm run deploy` 现在执行 `wrangler deploy`，读取 `wrangler.jsonc`，上传 `site/`。

> 这是备用路径；正常用 GitHub 自动构建即可。

---

## 8. 已配置的文件

| 文件 | 作用 |
|---|---|
| `wrangler.jsonc` | Worker 名称 + `site/` 静态资源目录 |
| `package.json` | `predeploy` 构建 + `deploy`（`wrangler deploy`） |
| `docs/_headers` | Workers 静态资源安全/缓存头，会复制到 `site/_headers` |
| `mkdocs.yml` | `site_url`、MkDocs 配置 |
| `requirements.txt` | Python 构建依赖 |

`_headers` 已配置：

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy`
- 静态资源长缓存
- HTML 短缓存

Workers 静态资源支持 `_headers`，会读取 `site/_headers`。

---

## 9. 常见问题

### 9.1 `mkdocs: command not found`

构建命令改成：

```bash
python -m pip install -r requirements.txt && python -m mkdocs build --strict && npm install
```

### 9.2 `No module named material`

确认 `requirements.txt` 包含：

```text
mkdocs-material>=9.5,<10
```

### 9.3 `wrangler: not found`

构建命令里加 `npm install`，部署命令用：

```text
npx wrangler deploy
```

仍然不行就用：

```text
npx --yes wrangler@4 deploy
```

### 9.4 部署后 404

确认 `wrangler.jsonc` 的：

```jsonc
"assets": { "directory": "./site" }
```

以及构建日志里 `site/` 已生成。

### 9.5 样式/搜索丢失

本地先跑：

```bash
python -m mkdocs build --strict
```

确认 `site/assets/`、`site/search/` 存在。

### 9.6 `_headers` 不生效

确认 `site/_headers` 存在，并且没有 Worker 脚本响应覆盖静态资源。  
当前是纯 assets Worker，`_headers` 会生效。

### 9.7 自定义域名后 canonical 不对

改 `mkdocs.yml` 的 `site_url`，push 重新部署。

---

## 10. 相关文档

- [Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Workers 静态资源](https://developers.cloudflare.com/workers/static-assets/)
- [Workers 静态资源 Headers](https://developers.cloudflare.com/workers/static-assets/headers/)
- [Wrangler deploy](https://developers.cloudflare.com/workers/wrangler/commands/general/#deploy)
