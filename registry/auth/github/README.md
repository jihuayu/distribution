# GitHub Authentication for Docker Registry

该模块为 Docker Registry (distribution) 提供 GitHub 认证支持，包括：

- **GitHub Personal Access Tokens (PAT)**：使用 GitHub PAT 进行用户认证
- **GitHub Actions OIDC**：支持 GitHub Actions 工作流使用 OIDC token 进行无密码认证

## 功能特性

### 1. GitHub PAT 认证
- 支持标准 GitHub Personal Access Token
- 可选的组织成员验证
- 支持 GitHub Enterprise

### 2. GitHub Actions OIDC 认证
- 无需存储长期凭证
- 基于 JWT token 的认证
- 可配置的 audience 验证
- 可限制特定仓库访问
- Token 自动过期（默认10分钟）

### 3. 访问控制
- 限制特定 GitHub 组织的成员访问
- 限制特定 GitHub 仓库的访问（OIDC）
- 灵活的配置选项

## 快速开始

### 1. 配置 Registry

在 registry 配置文件中添加 GitHub 认证：

```yaml
auth:
  github:
    realm: "Docker Registry"
    enable_oidc: true
    oidc_audience: https://registry.example.com
```

### 2. 使用 GitHub PAT 登录

```bash
echo $GITHUB_TOKEN | docker login registry.example.com -u username --password-stdin
```

### 3. 在 GitHub Actions 中使用

```yaml
jobs:
  build:
    permissions:
      id-token: write
    steps:
      - name: Get OIDC Token
        id: oidc
        run: |
          TOKEN=$(curl -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
            "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=https://registry.example.com" | jq -r .value)
          echo "token=$TOKEN" >> $GITHUB_OUTPUT
      
      - name: Login to Registry
        run: |
          echo "${{ steps.oidc.outputs.token }}" | \
            docker login registry.example.com -u github-actions --password-stdin
```

## 配置选项

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `realm` | string | 是 | - | 认证域名 |
| `api_url` | string | 否 | `https://api.github.com` | GitHub API URL（用于 Enterprise） |
| `enable_oidc` | bool | 否 | `false` | 启用 GitHub Actions OIDC 支持 |
| `oidc_audience` | string | 否 | - | OIDC token 的预期 audience |
| `allowed_orgs` | []string | 否 | - | 允许访问的 GitHub 组织列表 |
| `allowed_repos` | []string | 否 | - | 允许访问的仓库列表（格式：owner/repo） |

## 配置示例

### 基础配置

```yaml
auth:
  github:
    realm: "Docker Registry"
```

### 限制组织访问

```yaml
auth:
  github:
    realm: "Docker Registry"
    allowed_orgs:
      - my-organization
      - partner-org
```

### 完整 OIDC 配置

```yaml
auth:
  github:
    realm: "Docker Registry"
    enable_oidc: true
    oidc_audience: https://registry.example.com
    allowed_orgs:
      - my-organization
    allowed_repos:
      - my-organization/app1
      - my-organization/app2
```

### GitHub Enterprise

```yaml
auth:
  github:
    realm: "Docker Registry"
    api_url: https://github.example.com/api/v3
```

## 认证流程

### GitHub PAT 认证流程

1. 客户端在 Authorization header 中发送 PAT：`Bearer <token>` 或 `token <token>`
2. Registry 调用 GitHub API `/user` 验证 token
3. 如果配置了 `allowed_orgs`，验证用户组织成员资格
4. 返回认证结果和用户信息

### GitHub Actions OIDC 认证流程

1. GitHub Actions 工作流请求 OIDC token
2. 客户端在 Authorization header 中发送 OIDC token：`Bearer <jwt-token>`
3. Registry 解码并验证 JWT token：
   - 验证 token 格式
   - 验证 audience（如果配置）
   - 验证过期时间
   - 验证仓库（如果配置了 `allowed_repos`）
4. 返回认证结果，使用 `actor` 作为用户名

## OIDC Token 结构

GitHub Actions OIDC token 包含以下声明：

```json
{
  "sub": "repo:owner/repo:ref:refs/heads/main",
  "aud": "https://registry.example.com",
  "repository": "owner/repo",
  "actor": "github-username",
  "workflow": "CI/CD Pipeline",
  "ref": "refs/heads/main",
  "sha": "abc123...",
  "exp": 1234567890,
  "iat": 1234567800
}
```

## 权限要求

### GitHub PAT 权限

基础认证：
- `read:user` - 读取用户信息

组织验证（如果使用 `allowed_orgs`）：
- `read:org` - 读取组织成员信息

### GitHub Actions 权限

在 workflow 中需要：

```yaml
permissions:
  id-token: write  # 允许获取 OIDC token
  contents: read   # 读取代码（如需要）
```

## 安全最佳实践

1. **使用 HTTPS**：在生产环境始终使用 TLS
2. **限制访问**：使用 `allowed_orgs` 或 `allowed_repos` 限制访问
3. **最小权限**：PAT 只授予必要的权限
4. **Token 轮换**：定期轮换 PAT
5. **Audience 验证**：始终配置 `oidc_audience` 进行 OIDC 认证
6. **监控日志**：启用日志记录和监控

## 故障排查

### 常见错误

#### 1. "Bad credentials" / 401 Unauthorized

**原因**：
- GitHub PAT 无效或已过期
- PAT 权限不足

**解决方案**：
- 重新生成 GitHub PAT
- 确保 PAT 具有 `read:user` 权限
- 如果使用组织验证，确保有 `read:org` 权限

#### 2. "Invalid OIDC token"

**原因**：
- Token 格式错误
- Token 已过期
- Audience 不匹配

**解决方案**：
- 检查 GitHub Actions 中的 OIDC token 请求
- 确保 `oidc_audience` 配置正确
- OIDC token 有效期为 10 分钟，确保及时使用

#### 3. "Organization membership check failed"

**原因**：
- 用户不是配置的组织成员
- PAT 缺少 `read:org` 权限

**解决方案**：
- 确认用户是组织成员
- 更新 PAT 权限

### 调试

启用调试日志：

```yaml
log:
  level: debug
```

查看认证日志：

```bash
docker logs registry-container 2>&1 | grep -i github
```

测试认证：

```bash
# 测试 PAT
curl -v -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://registry.example.com/v2/

# 测试 OIDC
curl -v -H "Authorization: Bearer $OIDC_TOKEN" \
  https://registry.example.com/v2/
```

## 与其他认证方式对比

| 特性 | GitHub PAT | GitHub Actions OIDC | htpasswd | Token |
|------|------------|---------------------|----------|-------|
| 无需存储密码 | ✓ | ✓ | ✗ | ✓ |
| 动态用户管理 | ✓ | ✓ | ✗ | ✗ |
| 组织集成 | ✓ | ✓ | ✗ | ✗ |
| 自动过期 | ✗ | ✓ | ✗ | ✓ |
| GitHub Actions | ✓ | ✓✓ | ✗ | ✗ |
| 复杂度 | 低 | 中 | 低 | 中 |

## 开发和测试

### 运行测试

```bash
go test -v ./registry/auth/github/
```

### 代码覆盖率

```bash
go test -cover ./registry/auth/github/
```

## 示例场景

### 场景 1：企业内部 Registry

适用于需要 GitHub 组织成员才能访问的企业 Registry：

```yaml
auth:
  github:
    realm: "Company Registry"
    allowed_orgs:
      - my-company
```

### 场景 2：CI/CD Pipeline

GitHub Actions 自动化部署：

```yaml
auth:
  github:
    realm: "CI Registry"
    enable_oidc: true
    oidc_audience: https://registry.example.com
    allowed_repos:
      - my-org/frontend
      - my-org/backend
```

### 场景 3：混合环境

同时支持开发人员（PAT）和 CI/CD（OIDC）：

```yaml
auth:
  github:
    realm: "Mixed Registry"
    enable_oidc: true
    oidc_audience: https://registry.example.com
    allowed_orgs:
      - my-org
```

## 参考资料

- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Docker Registry Authentication](https://docs.docker.com/registry/configuration/#auth)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)

## 贡献

欢迎贡献！请参阅项目的 CONTRIBUTING.md 文件。

## 许可证

Apache License 2.0 - 详见 LICENSE 文件
