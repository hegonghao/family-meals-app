# 快速开始指南

一站式指南,帮助你快速将 Family Meals App 部署到服务器。

---

## 📋 目录

- [本地上传到 GitHub](#本地上传到-github)
- [服务器部署](#服务器部署)
- [常用命令](#常用命令)

---

## 本地上传到 GitHub

### 方法一: 使用自动化脚本 (推荐)

#### Windows (PowerShell)

```powershell
# 运行上传脚本
.\scripts\push-to-github.ps1

# 创建私有仓库
.\scripts\push-to-github.ps1 -Private
```

#### Linux/macOS (Bash)

```bash
# 添加执行权限
chmod +x scripts/*.sh

# 运行上传脚本
bash scripts/push-to-github.sh

# 创建私有仓库
bash scripts/push-to-github.sh family-meals-app true
```

脚本会自动:
1. 检查 GitHub CLI 是否已安装
2. 验证 GitHub 认证
3. 提交所有更改
4. 创建 GitHub 仓库
5. 推送代码

### 方法二: 手动操作

#### 1. 安装 GitHub CLI

**Windows**:
```powershell
winget install --id GitHub.cli
```

**Ubuntu/Debian**:
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list
sudo apt update && sudo apt install gh
```

**macOS**:
```bash
brew install gh
```

#### 2. 认证 GitHub

```bash
gh auth login
# 选择 GitHub.com
# 选择 HTTPS
# 选择登录方式 (浏览器或 token)
```

#### 3. 创建仓库并推送

```bash
# 公开仓库
gh repo create family-meals-app --public --source=. --remote=origin

# 或私有仓库
gh repo create family-meals-app --private --source=. --remote=origin

# 提交代码
git add .
git commit -m "feat: initial commit"

# 推送
git push -u origin 001-dashboard-welcome-reminders
```

---

## 服务器部署

### 准备工作

1. **服务器要求**:
   - Ubuntu 20.04/22.04 或 Debian 系统
   - 至少 2GB RAM
   - 至少 10GB 磁盘空间
   - Root 或 sudo 权限

2. **域名配置** (如果使用 HTTPS):
   - 将域名的 A 记录指向服务器 IP
   - 等待 DNS 生效 (通常几分钟到几小时)

### 一键部署流程

#### 步骤 1: 连接服务器

```bash
ssh your_username@your_server_ip
```

#### 步骤 2: 运行环境设置脚本

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/family-meals-app.git
cd family-meals-app

# 添加执行权限
chmod +x scripts/*.sh

# 运行服务器环境设置脚本
bash scripts/server-setup.sh
```

此脚本会自动:
- 更新系统
- 安装 Docker 和 Docker Compose
- 安装必要工具 (Git, Certbot 等)
- 配置防火墙
- 配置 Docker 用户组

**重要**: 如果脚本提示需要重新登录,请:
```bash
exit
# 重新 SSH 连接
ssh your_username@your_server_ip
cd family-meals-app
```

#### 步骤 3: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
cp backend/.env.example backend/.env

# 编辑根目录 .env
nano .env
```

**必须修改**:
```env
POSTGRES_PASSWORD=your_strong_password_here  # 使用强密码
```

```bash
# 编辑后端 .env
nano backend/.env
```

**必须修改**:
```env
DB_PASSWORD=your_strong_password_here       # 与上面一致
JWT_SECRET=your_super_secret_jwt_key_here   # 随机字符串,至少 32 位
```

**生成安全密钥**:
```bash
# 生成强密码
openssl rand -base64 32

# 生成 JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 步骤 4: 配置 SSL (可选但推荐)

如果你有域名,强烈建议配置 HTTPS:

```bash
# 1. 获取 SSL 证书
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com \
  --agree-tos \
  --email your-email@example.com

# 2. 使用 SSL 配置模板
cp nginx/nginx.conf.ssl-template nginx/nginx.conf

# 3. 编辑 Nginx 配置,替换域名
nano nginx/nginx.conf
# 修改: server_name your-domain.com www.your-domain.com;
# 修改证书路径 (如果不是 Let's Encrypt)

# 4. 更新 docker-compose.yml
nano docker-compose.yml
# 在 nginx 服务的 volumes 中添加:
#   - /etc/letsencrypt:/etc/letsencrypt:ro
```

详细 SSL 配置指南: [SSL_SETUP_GUIDE.md](./SSL_SETUP_GUIDE.md)

#### 步骤 5: 启动服务

```bash
# 使用快速部署脚本
bash scripts/deploy-quick.sh

# 或手动启动
docker compose up -d --build

# 查看启动日志
docker compose logs -f
```

#### 步骤 6: 验证部署

```bash
# 检查服务状态
docker compose ps

# 检查 API 健康状态
curl http://localhost/api/health

# 或从外部访问
curl https://your-domain.com/api/health
```

**期望响应**:
```json
{
  "status": "ok",
  "database": "healthy",
  "timestamp": "2025-10-23T..."
}
```

#### 步骤 7: 访问应用

在浏览器中访问:
- **前端**: `https://your-domain.com` (或 `http://your-server-ip`)
- **API 文档**: `https://your-domain.com/api/docs`
- **健康检查**: `https://your-domain.com/api/health`

**默认测试账号**:
- 管理员: `admin` / `admin123`
- 用户: `john` / `user123`

---

## 常用命令

### Docker 管理

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f          # 所有服务
docker compose logs -f api      # 后端 API
docker compose logs -f web      # 前端
docker compose logs -f postgres # 数据库

# 重启服务
docker compose restart
docker compose restart api      # 重启特定服务

# 停止服务
docker compose down

# 重新构建并启动
docker compose up -d --build

# 清理所有容器和卷
docker compose down -v --rmi all
```

### 数据库管理

```bash
# 进入数据库容器
docker compose exec postgres psql -U postgres -d family_meals

# 备份数据库
docker compose exec postgres pg_dump -U postgres family_meals > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup_20251023.sql | docker compose exec -T postgres psql -U postgres family_meals

# 运行迁移
docker compose exec api npm run migration:run

# 回滚迁移
docker compose exec api npm run migration:revert
```

### 代码更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker compose up -d --build

# 运行迁移 (如果有数据库变更)
docker compose exec api npm run migration:run
```

### SSL 证书管理

```bash
# 检查证书有效期
sudo certbot certificates

# 手动续期
sudo certbot renew

# 续期后重启 Nginx
docker compose restart nginx

# 测试自动续期
sudo certbot renew --dry-run
```

### 日志和调试

```bash
# 实时查看所有日志
docker compose logs -f

# 查看最近 100 行日志
docker compose logs --tail=100

# 查看特定时间范围的日志
docker compose logs --since 30m

# 进入容器 Shell
docker compose exec api sh
docker compose exec web sh
```

---

## 🛠️ 故障排查

### 端口被占用

```bash
# 检查端口占用
sudo lsof -i :80
sudo lsof -i :443

# 修改 .env 中的端口
HTTP_PORT=8080
HTTPS_PORT=8443
```

### 数据库连接失败

```bash
# 检查数据库状态
docker compose logs postgres

# 重启数据库
docker compose restart postgres

# 验证环境变量
docker compose exec api env | grep DB_
```

### 前端无法访问

```bash
# 检查前端日志
docker compose logs web

# 检查 Nginx 配置
docker compose exec nginx nginx -t

# 重启 Nginx
docker compose restart nginx
```

### SSL 证书问题

```bash
# 检查证书文件
sudo ls -la /etc/letsencrypt/live/your-domain.com/

# 查看 Nginx 错误日志
docker compose logs nginx | grep error

# 测试 Nginx 配置
docker compose exec nginx nginx -t
```

---

## 📚 相关文档

- [完整部署指南](./DEPLOY_TO_SERVER.md) - 详细的部署步骤和配置
- [SSL 设置指南](./SSL_SETUP_GUIDE.md) - HTTPS/SSL 证书配置
- [GitHub 指南](./GITHUB_GUIDE.md) - Git 和 GitHub 使用教程
- [项目 README](./README.md) - 项目介绍和功能说明

---

## 🎯 快速检查清单

部署完成后,确保:

- [ ] 所有 Docker 容器都在运行 (`docker compose ps`)
- [ ] API 健康检查通过 (`curl http://localhost/api/health`)
- [ ] 前端可以访问
- [ ] 可以成功登录
- [ ] 修改了默认密码和 JWT Secret
- [ ] (可选) 配置了 HTTPS
- [ ] (可选) 配置了防火墙

---

**祝部署顺利!** 🚀

如有问题,请查看:
- [完整部署文档](./DEPLOY_TO_SERVER.md)
- [常见问题排查](./DEPLOY_TO_SERVER.md#常见问题)
- 提交 Issue: https://github.com/YOUR_USERNAME/family-meals-app/issues
