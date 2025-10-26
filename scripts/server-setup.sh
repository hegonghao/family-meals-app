#!/bin/bash

#############################################
# Family Meals App - 服务器自动部署脚本
# 适用于 Ubuntu/Debian 系统
#############################################

set -e  # 遇到错误立即退出

echo "=========================================="
echo "Family Meals App - 服务器环境设置"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 或有 sudo 权限
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}请不要使用 root 用户运行此脚本${NC}"
   echo "使用普通用户,脚本会在需要时自动使用 sudo"
   exit 1
fi

# 检查是否有 sudo 权限
if ! sudo -v; then
    echo -e "${RED}此脚本需要 sudo 权限${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} 权限检查通过"
echo ""

#############################################
# 步骤 1: 更新系统
#############################################
echo "=== 步骤 1/6: 更新系统包 ==="
sudo apt update
sudo apt upgrade -y
echo -e "${GREEN}✓${NC} 系统更新完成"
echo ""

#############################################
# 步骤 2: 检查并安装 Docker
#############################################
echo "=== 步骤 2/6: 检查 Docker ==="

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} Docker 已安装: $DOCKER_VERSION"
else
    echo -e "${YELLOW}Docker 未安装,开始安装...${NC}"

    # 安装必要的包
    sudo apt install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

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

    echo -e "${GREEN}✓${NC} Docker 安装完成"
fi

# 检查 Docker Compose
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    echo -e "${GREEN}✓${NC} Docker Compose 已安装: $COMPOSE_VERSION"
else
    echo -e "${RED}✗${NC} Docker Compose 未找到"
    echo "请检查 Docker 安装"
    exit 1
fi

echo ""

#############################################
# 步骤 3: 配置 Docker 用户组
#############################################
echo "=== 步骤 3/6: 配置 Docker 用户权限 ==="

if groups $USER | grep &>/dev/null '\bdocker\b'; then
    echo -e "${GREEN}✓${NC} 用户已在 docker 组中"
else
    echo "将用户 $USER 添加到 docker 组..."
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}⚠${NC}  用户组变更需要重新登录才能生效"
    echo "请运行: exit 然后重新 SSH 连接"
    NEED_RELOGIN=true
fi

echo ""

#############################################
# 步骤 4: 安装其他必要工具
#############################################
echo "=== 步骤 4/6: 安装必要工具 ==="

# 安装 git
if ! command -v git &> /dev/null; then
    echo "安装 Git..."
    sudo apt install -y git
    echo -e "${GREEN}✓${NC} Git 安装完成"
else
    echo -e "${GREEN}✓${NC} Git 已安装"
fi

# 安装 curl
if ! command -v curl &> /dev/null; then
    echo "安装 curl..."
    sudo apt install -y curl
    echo -e "${GREEN}✓${NC} curl 安装完成"
else
    echo -e "${GREEN}✓${NC} curl 已安装"
fi

# 安装 certbot (SSL 证书)
if ! command -v certbot &> /dev/null; then
    echo "安装 Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓${NC} Certbot 安装完成"
else
    echo -e "${GREEN}✓${NC} Certbot 已安装"
fi

echo ""

#############################################
# 步骤 5: 配置防火墙
#############################################
echo "=== 步骤 5/6: 配置防火墙 ==="

if command -v ufw &> /dev/null; then
    # 确保 SSH 端口开放(避免锁住自己)
    sudo ufw allow 22/tcp comment 'SSH'
    sudo ufw allow 80/tcp comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'

    # 检查 UFW 是否启用
    if sudo ufw status | grep -q "Status: active"; then
        echo -e "${GREEN}✓${NC} UFW 已启用且规则已配置"
    else
        echo -e "${YELLOW}UFW 已安装但未启用${NC}"
        echo "防火墙规则已配置,请手动启用: sudo ufw enable"
    fi
else
    echo "安装 UFW..."
    sudo apt install -y ufw
    sudo ufw allow 22/tcp comment 'SSH'
    sudo ufw allow 80/tcp comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'
    echo -e "${YELLOW}UFW 已安装,请手动启用: sudo ufw enable${NC}"
fi

echo ""

#############################################
# 步骤 6: 系统信息
#############################################
echo "=== 步骤 6/6: 系统信息 ==="

echo ""
echo "系统信息:"
echo "- OS: $(lsb_release -ds)"
echo "- Docker: $(docker --version)"
echo "- Docker Compose: $(docker compose version --short)"
echo "- Git: $(git --version)"
echo ""

#############################################
# 完成
#############################################
echo "=========================================="
echo -e "${GREEN}✓ 服务器环境设置完成!${NC}"
echo "=========================================="
echo ""

if [ "$NEED_RELOGIN" = true ]; then
    echo -e "${YELLOW}重要提示:${NC}"
    echo "1. 请运行 'exit' 退出当前会话"
    echo "2. 重新 SSH 连接到服务器"
    echo "3. 然后克隆项目并部署"
    echo ""
fi

echo "下一步操作:"
echo "1. 克隆项目:"
echo "   git clone https://github.com/YOUR_USERNAME/family-meals-app.git"
echo ""
echo "2. 进入项目目录:"
echo "   cd family-meals-app"
echo ""
echo "3. 配置环境变量:"
echo "   cp .env.example .env"
echo "   cp backend/.env.example backend/.env"
echo "   nano .env          # 修改数据库密码"
echo "   nano backend/.env  # 修改 JWT secret 等"
echo ""
echo "4. (可选) 如果有域名,配置 SSL:"
echo "   sudo certbot certonly --standalone -d your-domain.com"
echo "   # 然后更新 nginx/nginx.conf 和 docker-compose.yml"
echo ""
echo "5. 启动服务:"
echo "   docker compose up -d --build"
echo ""
echo "6. 查看日志:"
echo "   docker compose logs -f"
echo ""
echo "详细部署指南请查看: DEPLOY_TO_SERVER.md"
echo ""
