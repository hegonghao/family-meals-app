# SSL/HTTPS 配置指南

本指南将帮助你为 Family Meals App 配置 HTTPS/SSL 证书。

---

## 方案选择

### 方案 A: Let's Encrypt 免费证书 (推荐)

**优点**:
- 完全免费
- 自动续期
- 浏览器广泛信任
- 3 个月有效期,自动续签

**适用场景**: 拥有域名的生产环境

### 方案 B: 自签名证书

**优点**:
- 快速设置
- 适合测试

**缺点**:
- 浏览器会显示不安全警告
- 仅适合开发/测试环境

---

## 方案 A: 配置 Let's Encrypt 证书

### 前提条件

1. 拥有一个域名 (例如: example.com)
2. DNS 已指向你的服务器 IP
3. 服务器 80 和 443 端口可访问

### 步骤 1: 安装 Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### 步骤 2: 获取证书

#### 方法一: 使用 Standalone 模式 (推荐)

在启动 Docker 服务前获取证书:

```bash
# 确保 80 端口未被占用
sudo systemctl stop nginx  # 如果有系统 nginx
docker compose down        # 如果 Docker 服务在运行

# 获取证书
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com \
  --agree-tos \
  --email your-email@example.com

# 证书将保存在:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### 方法二: 使用 Webroot 模式

如果服务已经在运行:

```bash
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d your-domain.com \
  -d www.your-domain.com \
  --agree-tos \
  --email your-email@example.com
```

### 步骤 3: 配置 Nginx

```bash
# 备份原配置
cp nginx/nginx.conf nginx/nginx.conf.bak

# 使用 SSL 模板
cp nginx/nginx.conf.ssl-template nginx/nginx.conf

# 编辑配置,替换域名
nano nginx/nginx.conf

# 修改以下行:
# server_name your-domain.com www.your-domain.com;
# ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

### 步骤 4: 更新 Docker Compose

编辑 `docker-compose.yml`,在 nginx 服务中添加证书挂载:

```yaml
nginx:
  image: nginx:alpine
  container_name: family-meals-nginx
  restart: unless-stopped
  ports:
    - "${HTTP_PORT:-80}:80"
    - "${HTTPS_PORT:-443}:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro  # 添加这一行
  depends_on:
    - web
    - api
  networks:
    - family-meals-network
```

### 步骤 5: 重启服务

```bash
# 重启 Docker 服务
docker compose down
docker compose up -d

# 查看日志
docker compose logs -f nginx
```

### 步骤 6: 测试 HTTPS

```bash
# 测试 HTTP 重定向
curl -I http://your-domain.com

# 测试 HTTPS
curl -I https://your-domain.com

# 在线 SSL 测试
# 访问: https://www.ssllabs.com/ssltest/
```

### 步骤 7: 设置自动续期

Let's Encrypt 证书有效期 90 天,需要定期续期。

```bash
# 测试自动续期
sudo certbot renew --dry-run

# Certbot 会自动安装 cron job,无需手动配置
# 查看续期任务
sudo systemctl list-timers | grep certbot

# 或查看 cron
sudo cat /etc/cron.d/certbot
```

**手动续期**:

```bash
# 续期证书
sudo certbot renew

# 续期后重启 nginx 容器
docker compose restart nginx
```

---

## 方案 B: 使用自签名证书 (仅测试)

### 步骤 1: 生成自签名证书

```bash
# 创建 SSL 目录
mkdir -p nginx/ssl
cd nginx/ssl

# 生成私钥和证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=MyCompany/CN=localhost"

# 返回项目根目录
cd ../..
```

### 步骤 2: 配置 Nginx

```bash
# 使用 SSL 模板
cp nginx/nginx.conf.ssl-template nginx/nginx.conf

# 编辑配置
nano nginx/nginx.conf

# 修改证书路径:
# ssl_certificate /etc/nginx/ssl/cert.pem;
# ssl_certificate_key /etc/nginx/ssl/key.pem;

# 修改 server_name:
# server_name localhost;
```

### 步骤 3: 更新 Docker Compose

```yaml
nginx:
  # ... 其他配置
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro  # 挂载自签名证书
```

### 步骤 4: 重启服务

```bash
docker compose down
docker compose up -d
```

### 步骤 5: 访问测试

访问 `https://localhost`,浏览器会显示安全警告,点击"继续"即可访问。

---

## 常见问题

### Q1: Certbot 报错 "Port 80 is already in use"

**解决方法**:
```bash
# 停止占用 80 端口的服务
sudo systemctl stop nginx
# 或
docker compose down

# 然后重新运行 certbot
```

### Q2: DNS 未正确配置

**症状**: Certbot 报错 "Failed to verify domain"

**解决方法**:
```bash
# 检查 DNS 解析
nslookup your-domain.com
dig your-domain.com

# 确保 A 记录指向服务器 IP
```

### Q3: 证书续期失败

**解决方法**:
```bash
# 手动续期
sudo certbot renew --force-renewal

# 查看续期日志
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Q4: Nginx 配置错误

**解决方法**:
```bash
# 测试配置
docker compose exec nginx nginx -t

# 如果配置有误,恢复备份
cp nginx/nginx.conf.bak nginx/nginx.conf
docker compose restart nginx
```

### Q5: HTTPS 无法访问,但 HTTP 可以

**检查清单**:
```bash
# 1. 检查防火墙
sudo ufw status
sudo ufw allow 443/tcp

# 2. 检查 Nginx 是否监听 443
docker compose exec nginx netstat -tlnp | grep 443

# 3. 查看 Nginx 日志
docker compose logs nginx

# 4. 检查证书文件权限
sudo ls -la /etc/letsencrypt/live/your-domain.com/
```

---

## 安全最佳实践

### 1. 启用 HSTS

在 nginx.conf 中添加:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### 2. 配置强加密套件

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;
```

### 3. 启用 OCSP Stapling

```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;
```

### 4. 配置证书监控

设置提醒,在证书过期前 30 天通知:

```bash
# 创建监控脚本
cat > /usr/local/bin/check-ssl-expiry.sh << 'EOF'
#!/bin/bash
DOMAIN="your-domain.com"
EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt 30 ]; then
    echo "WARNING: SSL certificate for $DOMAIN expires in $DAYS_LEFT days!"
fi
EOF

chmod +x /usr/local/bin/check-ssl-expiry.sh

# 添加到 crontab (每天检查)
(crontab -l 2>/dev/null; echo "0 9 * * * /usr/local/bin/check-ssl-expiry.sh") | crontab -
```

---

## 验证 SSL 配置

### 在线工具

1. **SSL Labs**: https://www.ssllabs.com/ssltest/
   - 评分系统 (A+ 最佳)
   - 详细的安全报告

2. **SSL Checker**: https://www.sslshopper.com/ssl-checker.html
   - 快速证书验证

### 命令行检查

```bash
# 检查证书信息
openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null | openssl x509 -noout -dates

# 检查证书链
openssl s_client -connect your-domain.com:443 -showcerts

# 检查支持的协议
nmap --script ssl-enum-ciphers -p 443 your-domain.com
```

---

## 相关文档

- [Let's Encrypt 官方文档](https://letsencrypt.org/docs/)
- [Certbot 使用指南](https://certbot.eff.org/)
- [Nginx SSL 配置](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

---

**配置完成后,你的应用将通过 HTTPS 安全访问!** 🔒
