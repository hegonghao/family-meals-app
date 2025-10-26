#!/bin/bash

#############################################
# Family Meals App - 快速部署脚本
# 在已经配置好的服务器上快速部署/更新应用
#############################################

set -e

echo "=========================================="
echo "Family Meals App - 快速部署"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查是否在项目目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}错误: 请在项目根目录下运行此脚本${NC}"
    exit 1
fi

#############################################
# 步骤 1: 拉取最新代码
#############################################
echo -e "${BLUE}=== 步骤 1/5: 拉取最新代码 ===${NC}"
git pull
echo -e "${GREEN}✓${NC} 代码更新完成"
echo ""

#############################################
# 步骤 2: 检查环境变量
#############################################
echo -e "${BLUE}=== 步骤 2/5: 检查环境变量 ===${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ 未找到 .env 文件${NC}"
    cp .env.example .env
    echo "已创建 .env 文件,请编辑配置:"
    echo "  nano .env"
    exit 1
fi

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠ 未找到 backend/.env 文件${NC}"
    cp backend/.env.example backend/.env
    echo "已创建 backend/.env 文件,请编辑配置:"
    echo "  nano backend/.env"
    exit 1
fi

echo -e "${GREEN}✓${NC} 环境变量文件存在"
echo ""

#############################################
# 步骤 3: 停止旧容器
#############################################
echo -e "${BLUE}=== 步骤 3/5: 停止旧容器 ===${NC}"
docker compose down
echo -e "${GREEN}✓${NC} 旧容器已停止"
echo ""

#############################################
# 步骤 4: 构建并启动新容器
#############################################
echo -e "${BLUE}=== 步骤 4/5: 构建并启动服务 ===${NC}"
docker compose up -d --build

echo ""
echo "等待服务启动..."
sleep 10

echo -e "${GREEN}✓${NC} 服务已启动"
echo ""

#############################################
# 步骤 5: 检查服务状态
#############################################
echo -e "${BLUE}=== 步骤 5/5: 检查服务状态 ===${NC}"
docker compose ps
echo ""

# 等待健康检查
echo "等待健康检查..."
sleep 5

# 检查 API 健康状态
if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API 健康检查通过"
else
    echo -e "${YELLOW}⚠${NC} API 健康检查失败,请查看日志"
    echo "运行: docker compose logs api"
fi

echo ""

#############################################
# 完成
#############################################
echo "=========================================="
echo -e "${GREEN}✓ 部署完成!${NC}"
echo "=========================================="
echo ""
echo "服务访问:"
echo "- 前端: http://your-server-ip (或 https://your-domain.com)"
echo "- API 文档: http://your-server-ip/api/docs"
echo "- 健康检查: http://your-server-ip/api/health"
echo ""
echo "常用命令:"
echo "- 查看日志: docker compose logs -f"
echo "- 查看状态: docker compose ps"
echo "- 重启服务: docker compose restart"
echo "- 停止服务: docker compose down"
echo ""
