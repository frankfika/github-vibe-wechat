# OmniWriter 生产部署清单

目标服务器目录固定为 `/opt/omniwriter`。应用使用两个只监听 loopback 的实例（3011/3012），宿主机 Nginx 对外提供 HTTPS；容器 gateway（3080）仅用于内部健康与故障切换验证。

## 当前上线前门禁

- 域名已解析到 `49.234.25.35`，且不复用 `secondplanet.cc`。
- GitHub Environment `production` 已启用人工审批。
- Repository Secrets 已配置：`TCR_REGISTRY`、`TCR_NAMESPACE`、`TCR_USERNAME`、`TCR_PASSWORD`、`DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_SSH_KEY`。
- Repository Variable `PRODUCTION_URL` 使用最终 HTTPS 地址。
- 公网站点默认不注入共享模型密钥；用户在「设置 → AI 连接」保存自己的浏览器密钥。
- 如果确需服务器共享模型密钥，先给站点增加认证，再把纯 Key 写入 `/opt/omniwriter/secrets/anthropic_api_key`（0600），不要写进 Git、镜像或 Compose 环境。

## 首次发布

1. 合并并推送已通过 CI 的提交。
2. 在 GitHub Actions 手动运行 `Deploy production`；它构建 `linux/amd64` 不可变镜像、推送 TCR，并在服务器执行双实例滚动更新。
3. 将 `deploy/nginx.conf` 复制为 `/etc/nginx/sites-available/omniwriter`，把 `omniwriter.example.com` 替换为真实域名。
4. 执行 `sudo nginx -t`，启用站点并 reload Nginx。
5. 用 Certbot 为真实域名签发证书并强制 HTTPS。
6. 设置仓库变量 `PRODUCTION_URL=https://真实域名`，手动运行一次 `Monitor production`。

第 3–5 步会修改远端 Nginx/TLS，必须在执行前得到明确授权。

## 发布验证

```bash
cd /opt/omniwriter
COMPOSE_FILE=compose.production.yaml ENV_FILE=.env.production bash scripts/verify-ha.sh
curl --fail https://真实域名/api/health
curl --fail https://真实域名/api/ready
```

健康响应必须交替出现 `app-a` / `app-b`，版本必须等于本次 Git SHA；就绪响应必须为 `status: ready`，并报告 9 个平台和至少 7 套模板。定时监控还会真实生成并校验一个合成 ZIP。生产回归还应覆盖：真实 AI（使用浏览器个人 Key）、中英文 9/9 平台稿、七模板及三级标题层级、富文本复制、带来源图片、截图与 ZIP。

## 回滚

滚动脚本会在健康门禁或外部 smoke 失败时自动恢复 A/B 的旧镜像。需要人工回滚时，从 TCR 选择上一条已验证 SHA：

```bash
cd /opt/omniwriter
OMNIWRITER_IMAGE_REPOSITORY=你的TCR仓库/omniwriter \
APP_VERSION=上一版本SHA \
COMPOSE_FILE=compose.production.yaml \
ENV_FILE=.env.production \
BUILD_IMAGE=0 PULL_IMAGE=1 \
SMOKE_URL=http://127.0.0.1:3080 \
./scripts/deploy-ha.sh
```

不要使用 `latest`，不要删除当前和上一版镜像，至少保留两个已验证 SHA。
