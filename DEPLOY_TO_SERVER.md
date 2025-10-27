# 服务器部署完整指南

本指南将帮助你完成以下步骤:
1. 将代码上传到 GitHub
2. 在服务器上部署应用

---

## 第一部分: 上传代码到 GitHub

### 方法一: 使用 GitHub CLI (推荐)

#### 1. 安装 GitHub CLI

**Windows (PowerShell)**:
```powershell
# 使用 winget
winget install --id GitHub.cli

# 或使用 scoop
scoop install gh
```

**Ubuntu/Debian**:
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

#### 2. 认证 GitHub

```bash
gh auth login
# 选择: GitHub.com
# 选择: HTTPS
# 选择: Login with a web browser (或 Paste an authentication token)
# 如果选择 token,粘贴你的 GitHub token
```

#### 3. 创建仓库并推送

```bash
# 在项目目录下执行
cd D:\4\family-meals-app

# 创建 GitHub 仓库(公开)
gh repo create family-meals-app --public --source=. --remote=origin

# 或创建私有仓库
gh repo create family-meals-app --private --source=. --remote=origin

# 提交代码
git commit -m "feat: initial commit - family meals management app

Features:
- NestJS backend with JWT authentication
- Next.js PWA frontend
- PostgreSQL database
- Docker deployment
- Menu and order management system

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 推送到 GitHub
git push -u origin 001-dashboard-welcome-reminders
```

---

### 方法二: 手动创建仓库

#### 1. 在 GitHub 网站上创建仓库

1. 访问 https://github.com/new
2. 仓库名称: `family-meals-app`
3. 描述(可选): `家庭餐饮管理系统 - NestJS + Next.js PWA`
4. 选择 **Public** 或 **Private**
5. **不要** 勾选 "Initialize this repository with a README"
6. 点击 **Create repository**

#### 2. 本地推送代码

```bash
# 添加远程仓库 (替换 YOUR_USERNAME 为你的 GitHub 用户名)
git remote add origin https://github.com/YOUR_USERNAME/family-meals-app.git

# 提交代码
git commit -m "feat: initial commit - family meals management app

Features:
- NestJS backend with JWT authentication
- Next.js PWA frontend
- PostgreSQL database
- Docker deployment
- Menu and order management system

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 推送到 GitHub
git push -u origin 001-dashboard-welcome-reminders
```

---

## 第二部分: 服务器部署

### 前置准备

**需要的信息**:
- 服务器 IP 地址
- SSH 登录凭证
- 域名 (如果有)

### 步骤 1: 连接到服务器

```bash
ssh your_username@your_server_ip
```

### 步骤 2: 检查并安装 Docker

运行检查脚本:

```bash
# 检查 Docker 是否已安装
docker --version
docker-compose --version

# 如果未安装,运行以下命令
```

**安装 Docker 和 Docker Compose**:

```bash
# 更新包索引
sudo apt update

# 安装必要的包
sudo apt install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 验证安装
sudo docker --version
sudo docker compose version

# 将当前用户添加到 docker 组(避免每次使用 sudo)
sudo usermod -aG docker $USER

# 重新登录以应用组变更
exit
# 重新 SSH 连接
```

### 步骤 3: 克隆项目

```bash
# 克隆仓库 (替换为你的仓库 URL)
git clone https://github.com/YOUR_USERNAME/family-meals-app.git
cd family-meals-app
```

### 步骤 4: 配置环境变量

#### 4.1 配置根目录 .env

```bash
# 复制模板
cp .env.example .env

# 编辑文件
nano .env
```

修改以下内容:
```env
# 数据库配置 - 使用强密码!
POSTGRES_DB=family_meals
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE  # 修改这里!

# 端口配置
HTTP_PORT=80
HTTPS_PORT=443

# 环境
NODE_ENV=production
```

#### 4.2 配置后端 .env

```bash
# 复制模板
cp backend/.env.example backend/.env

# 编辑文件
nano backend/.env
```

修改以下内容:
```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置 (必须与根目录 .env 一致)
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE  # 与上面一致!
DB_NAME=family_meals

# JWT 配置 - 生成随机密钥!
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_HERE  # 至少 32 位随机字符串
JWT_EXPIRES=7d
```

**生成安全密钥**:
```bash
# 生成强密码
openssl rand -base64 32

# 生成 JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 步骤 5: 配置 HTTPS/SSL

#### 5.1 更新 Nginx 配置

编辑 `nginx/nginx.conf`,添加你的域名:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # 修改为你的域名

    # ... 其他配置
}
```

#### 5.2 安装 Certbot 并获取 SSL 证书

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 停止 nginx 容器(如果正在运行)
docker compose down nginx

# 获取 SSL 证书
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 证书将保存在: /etc/letsencrypt/live/your-domain.com/
```

#### 5.3 更新 Nginx 配置以使用 SSL

在 `nginx/nginx.conf` 中添加 HTTPS server 块:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书路径
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... 其他配置
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

#### 5.4 更新 docker-compose.yml

添加 SSL 证书挂载:

```yaml
nginx:
  # ... 其他配置
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro  # 添加这一行
```

### 步骤 6: 启动服务

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看启动日志
docker compose logs -f

# 等待所有服务启动(大约 1-2 分钟)
# 按 Ctrl+C 退出日志查看

# 检查服务状态
docker compose ps
```

**期望输出**:
```
NAME                  STATUS         PORTS
family-meals-db       Up (healthy)   5432/tcp
family-meals-api      Up (healthy)   3000/tcp
family-meals-web      Up             3000/tcp
family-meals-nginx    Up             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### 步骤 7: 配置防火墙

```bash
# 安装 UFW (如果未安装)
sudo apt install -y ufw

# 允许 SSH (重要!)
sudo ufw allow 22/tcp

# 允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable

# 检查状态
sudo ufw status
```

### 步骤 8: 验证部署

```bash
# 检查健康状态
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

### 步骤 9: 访问应用

在浏览器中访问:
- **前端**: https://your-domain.com
- **API 文档**: https://your-domain.com/api/docs

**默认测试账号** (运行 seed 后):
- 管理员: `admin` / `password`
- 用户: `john` / `password`

---

## 第三部分: 后续维护

### 更新应用

当你修改代码并推送到 GitHub 后:

```bash
# SSH 到服务器
ssh your_username@your_server_ip

# 进入项目目录
cd family-meals-app

# 拉取最新代码
git pull origin main

# 重新构建并启动
docker compose up -d --build

# 运行数据库迁移(如果有)
docker compose exec api npm run migration:run
```

### 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres

# 查看最近 100 行
docker compose logs --tail=100
```

### 备份数据库

```bash
# 创建备份
docker compose exec postgres pg_dump -U postgres family_meals > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
cat backup_20251023_120000.sql | docker compose exec -T postgres psql -U postgres family_meals
```

### 重启服务

```bash
# 重启所有服务
docker compose restart

# 重启特定服务
docker compose restart api
docker compose restart web
```

### SSL 证书续期

Certbot 会自动续期,但你可以手动测试:

```bash
# 测试续期(不实际执行)
sudo certbot renew --dry-run

# 手动续期
sudo certbot renew
```

---

## 常见问题

### Q1: 端口被占用

```bash
# 检查端口占用
sudo lsof -i :80
sudo lsof -i :443

# 修改 .env 中的端口
HTTP_PORT=8080
HTTPS_PORT=8443
```

### Q2: 数据库连接失败

```bash
# 检查数据库状态
docker compose logs postgres

# 重启数据库
docker compose restart postgres

# 检查环境变量
docker compose exec api env | grep DB_
```

### Q3: 前端无法连接后端

```bash
# 检查 API 健康状态
docker compose exec web curl http://api:3000/api/health

# 检查 Nginx 配置
docker compose exec nginx nginx -t

# 重启 Nginx
docker compose restart nginx
```

### Q4: SSL 证书问题

```bash
# 检查证书有效期
sudo certbot certificates

# 检查 Nginx SSL 配置
docker compose exec nginx cat /etc/nginx/nginx.conf

# 检查证书文件
sudo ls -la /etc/letsencrypt/live/your-domain.com/
```

---

## 安全检查清单

- [ ] 修改了所有默认密码
- [ ] 使用了强随机 JWT_SECRET
- [ ] 配置了 HTTPS/SSL
- [ ] 启用了防火墙
- [ ] 定期备份数据库
- [ ] 更新了 README 中的仓库 URL
- [ ] 设置了 DNS 记录指向服务器 IP
- [ ] 测试了 PWA 安装功能

---

## 性能优化建议

1. **启用 Gzip 压缩** - 在 nginx.conf 中配置
2. **配置 Redis 缓存** - 减少数据库查询
3. **使用 CDN** - 加速静态资源加载
4. **优化数据库索引** - 提高查询性能
5. **配置 PM2** - 进程管理和自动重启

---

## 获取帮助

如遇到问题:
1. 查看日志: `docker compose logs -f`
2. 检查服务状态: `docker compose ps`
3. 查看健康检查: `curl http://localhost/api/health`
4. 提交 Issue: https://github.com/YOUR_USERNAME/family-meals-app/issues

---

**祝部署顺利!** 🚀
