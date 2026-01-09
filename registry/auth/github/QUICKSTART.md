# GitHub 认证快速入门指南

本指南将帮助你快速在 Docker Registry 中启用 GitHub 认证支持。

## 📋 目录

- [功能概述](#功能概述)
- [快速开始](#快速开始)
- [配置示例](#配置示例)
- [使用场景](#使用场景)
- [常见问题](#常见问题)

## 功能概述

该认证模块为 Docker Registry 提供两种 GitHub 认证方式：

### 1️⃣ GitHub Personal Access Token (PAT)
- ✅ 适用于开发人员本地访问
- ✅ 支持 GitHub 和 GitHub Enterprise
- ✅ 可选的组织成员验证

### 2️⃣ GitHub Actions OIDC
- ✅ 适用于 CI/CD 自动化
- ✅ 无需存储长期凭证
- ✅ 自动过期（10分钟）
- ✅ 可限制特定仓库访问

## 快速开始

### 步骤 1：配置 Registry

编辑你的 registry 配置文件（通常是 `config.yml`）：

```yaml
version: 0.1
storage:
  filesystem:
    rootdirectory: /var/lib/registry
http:
  addr: :5000
  tls:
    certificate: /path/to/cert.pem
    key: /path/to/key.pem
auth:
  github:
    realm: "Docker Registry"
    enable_oidc: true
    oidc_audience: https://registry.example.com
```

### 步骤 2：启动 Registry

```bash
docker run -d \
  -p 5000:5000 \
  -v /path/to/config.yml:/etc/docker/registry/config.yml \
  -v /var/lib/registry:/var/lib/registry \
  --name registry \
  distribution/distribution:latest
```

### 步骤 3：测试认证

#### 使用 GitHub PAT

```bash
# 1. 生成 GitHub PAT
# 访问: https://github.com/settings/tokens
# 权限: read:user (必需), read:org (如果使用组织限制)

# 2. 登录 Registry
echo $GITHUB_TOKEN | docker login registry.example.com -u yourname --password-stdin

# 3. 推送镜像
docker tag myimage:latest registry.example.com/myimage:latest
docker push registry.example.com/myimage:latest
```

#### 在 GitHub Actions 中使用 OIDC

创建 `.github/workflows/docker-push.yml`：

```yaml
name: Push to Registry

on:
  push:
    branches: [ main ]

jobs:
  push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Get OIDC Token
        id: oidc
        run: |
          TOKEN=$(curl -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
            "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=https://registry.example.com" | jq -r .value)
          echo "::add-mask::$TOKEN"
          echo "token=$TOKEN" >> $GITHUB_OUTPUT
      
      - name: Login
        run: |
          echo "${{ steps.oidc.outputs.token }}" | \
            docker login registry.example.com -u github-actions --password-stdin
      
      - name: Push
        run: |
          docker build -t registry.example.com/myapp:latest .
          docker push registry.example.com/myapp:latest
```

## 配置示例

### 基础配置（公开访问 + GitHub 认证）

```yaml
auth:
  github:
    realm: "My Registry"
```

### 限制组织成员访问

```yaml
auth:
  github:
    realm: "Company Registry"
    allowed_orgs:
      - my-company
      - partner-org
```

### 仅允许特定仓库的 CI/CD 访问

```yaml
auth:
  github:
    realm: "CI Registry"
    enable_oidc: true
    oidc_audience: https://registry.example.com
    allowed_repos:
      - my-org/frontend
      - my-org/backend
      - my-org/api
```

### GitHub Enterprise 配置

```yaml
auth:
  github:
    realm: "Enterprise Registry"
    api_url: https://github.company.com/api/v3
    allowed_orgs:
      - engineering
```

### 完整生产配置

```yaml
version: 0.1
log:
  level: info
  formatter: json
  fields:
    service: registry
    environment: production

storage:
  s3:
    region: us-east-1
    bucket: my-registry-bucket
  delete:
    enabled: true
  cache:
    blobdescriptor: inmemory

http:
  addr: :5000
  secret: random-secret-string
  headers:
    X-Content-Type-Options: [nosniff]
    Strict-Transport-Security: [max-age=31536000]
  tls:
    certificate: /etc/ssl/certs/registry.crt
    key: /etc/ssl/private/registry.key

auth:
  github:
    realm: "Production Registry"
    enable_oidc: true
    oidc_audience: https://registry.company.com
    allowed_orgs:
      - my-organization
    allowed_repos:
      - my-organization/app1
      - my-organization/app2

health:
  storagedriver:
    enabled: true
    interval: 10s
    threshold: 3

proxy:
  remoteurl: https://registry-1.docker.io
  username: dockerhub-user
  password: dockerhub-token
```

## 使用场景

### 场景 1：开发团队访问

**需求**：只允许 GitHub 组织成员访问 Registry

**配置**：
```yaml
auth:
  github:
    realm: "Team Registry"
    allowed_orgs:
      - my-team
```

**使用**：
```bash
# 团队成员使用 GitHub PAT 登录
export GITHUB_TOKEN=ghp_xxxxx
echo $GITHUB_TOKEN | docker login registry.example.com -u $(whoami) --password-stdin
```

### 场景 2：CI/CD Pipeline

**需求**：GitHub Actions 自动推送镜像，无需存储密码

**配置**：
```yaml
auth:
  github:
    realm: "CI Registry"
    enable_oidc: true
    oidc_audience: https://registry.example.com
```

**GitHub Actions**：
```yaml
jobs:
  deploy:
    permissions:
      id-token: write
    steps:
      - name: Push to Registry
        run: |
          TOKEN=$(curl -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
            "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=https://registry.example.com" | jq -r .value)
          echo "$TOKEN" | docker login registry.example.com -u github-actions --password-stdin
          docker push registry.example.com/myapp:latest
```

### 场景 3：混合环境

**需求**：开发人员使用 PAT，CI/CD 使用 OIDC

**配置**：
```yaml
auth:
  github:
    realm: "Mixed Registry"
    enable_oidc: true
    oidc_audience: https://registry.example.com
    allowed_orgs:
      - my-org
```

两种认证方式都支持！

### 场景 4：多仓库访问控制

**需求**：只允许特定仓库的 Actions 推送

**配置**：
```yaml
auth:
  github:
    realm: "Restricted Registry"
    enable_oidc: true
    oidc_audience: https://registry.example.com
    allowed_repos:
      - company/production-app
      - company/staging-app
```

## 常见问题

### ❓ 如何生成 GitHub PAT？

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 选择权限：
   - `read:user` (必需)
   - `read:org` (如果使用组织验证)
4. 点击 "Generate token" 并保存

### ❓ OIDC token 在哪里获取？

在 GitHub Actions 中自动可用：

```yaml
jobs:
  build:
    permissions:
      id-token: write  # 必需权限
    steps:
      - name: Get token
        run: |
          curl -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
            "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=YOUR_AUDIENCE"
```

### ❓ 为什么认证失败？

**检查清单**：

1. ✅ Registry 使用 HTTPS（TLS）
2. ✅ GitHub PAT 有效且有正确权限
3. ✅ 配置文件中的 `oidc_audience` 与请求的匹配
4. ✅ GitHub Actions workflow 有 `id-token: write` 权限
5. ✅ 用户/仓库在 `allowed_orgs`/`allowed_repos` 列表中

**查看日志**：
```bash
docker logs registry-container 2>&1 | grep -i github
```

### ❓ 如何测试认证？

使用提供的测试脚本：

```bash
# 测试 GitHub PAT
./registry/auth/github/test-auth.sh pat ghp_xxxxxxxxxxxx

# 测试 OIDC token
./registry/auth/github/test-auth.sh oidc eyJhbGciOiJSUzI1NiIs...

# 在 GitHub Actions 中测试
./registry/auth/github/test-auth.sh actions https://registry.example.com
```

### ❓ 支持 GitHub Enterprise 吗？

支持！配置 `api_url`：

```yaml
auth:
  github:
    realm: "Enterprise Registry"
    api_url: https://github.company.com/api/v3
```

### ❓ 可以同时使用多种认证方式吗？

可以！配置多个认证后端：

```yaml
auth:
  token:
    realm: "Registry Realm"
    service: "Docker Registry"
    issuer: "Registry Service"
    rootcertbundle: /path/to/root.crt
  github:
    realm: "GitHub Auth"
    enable_oidc: true
```

但 Registry 只会使用第一个配置的认证方式。如需多种认证，考虑使用认证代理（如 nginx）。

### ❓ OIDC token 有效期多长？

GitHub Actions OIDC token 默认有效期为 **10 分钟**。在工作流中获取后应立即使用。

### ❓ 如何限制推送权限？

Registry 的 GitHub 认证模块只处理身份验证。要实现细粒度的授权控制，需要结合：

1. Token 认证服务器（如 [Portus](https://github.com/SUSE/Portus)）
2. Authorization plugin
3. OPA (Open Policy Agent) 集成

## 📚 更多资源

- [完整文档](./README.md)
- [配置示例](../../cmd/registry/config-github.yml)
- [GitHub Actions 示例](./ example-workflow.yml)
- [测试脚本](./test-auth.sh)

## 🤝 获取帮助

- 提交 Issue：https://github.com/distribution/distribution/issues
- 查看日志：`docker logs <registry-container>`
- 启用调试：在配置中设置 `log.level: debug`

## 📄 许可证

Apache License 2.0
