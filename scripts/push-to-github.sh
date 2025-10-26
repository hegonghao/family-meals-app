#!/bin/bash

#############################################
# Family Meals App - GitHub 上传脚本 (Bash)
# 适用于 Linux/macOS 系统
#############################################

set -e

REPO_NAME="${1:-family-meals-app}"
PRIVATE="${2:-false}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}Family Meals App - GitHub 上传工具${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""

# 检查是否在项目目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}错误: 请在项目根目录下运行此脚本${NC}"
    exit 1
fi

# 检查 Git 是否安装
if ! command -v git &> /dev/null; then
    echo -e "${RED}错误: 未安装 Git${NC}"
    echo "Ubuntu/Debian: sudo apt install git"
    echo "macOS: brew install git"
    exit 1
fi

echo -e "${GREEN}✓${NC} Git 已安装"
echo ""

# 检查 GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}GitHub CLI (gh) 未安装${NC}"
    echo ""
    echo "有两种方式上传代码:"
    echo ""
    echo -e "${CYAN}方式 1: 安装 GitHub CLI (推荐)${NC}"
    echo "  Ubuntu/Debian:"
    echo "    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
    echo "    echo \"deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main\" | sudo tee /etc/apt/sources.list.d/github-cli.list"
    echo "    sudo apt update && sudo apt install gh"
    echo ""
    echo "  macOS:"
    echo "    brew install gh"
    echo ""
    echo -e "${CYAN}方式 2: 手动创建仓库${NC}"
    echo "  1. 访问 https://github.com/new"
    echo "  2. 创建名为 '$REPO_NAME' 的仓库"
    echo "  3. 复制仓库 URL"
    echo "  4. 运行: git remote add origin <仓库URL>"
    echo "  5. 运行: git push -u origin 001-dashboard-welcome-reminders"
    echo ""
    exit 0
fi

# 检查 GitHub CLI 认证状态
echo -e "${CYAN}检查 GitHub 认证状态...${NC}"
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}需要登录 GitHub${NC}"
    echo ""
    gh auth login
    if [ $? -ne 0 ]; then
        echo -e "${RED}GitHub 登录失败${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} GitHub 认证成功"
echo ""

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}检测到未提交的更改,正在提交...${NC}"
    git add .
    git commit -m "feat: initial commit - family meals management app

Features:
- NestJS backend with JWT authentication
- Next.js PWA frontend
- PostgreSQL database
- Docker deployment with SSL support
- Menu and order management system
- Deployment scripts and documentation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    echo -e "${GREEN}✓${NC} 代码已提交"
    echo ""
fi

# 创建 GitHub 仓库
echo -e "${CYAN}创建 GitHub 仓库: $REPO_NAME${NC}"

VISIBILITY_FLAG="--public"
if [ "$PRIVATE" = "true" ]; then
    VISIBILITY_FLAG="--private"
fi

if gh repo create $REPO_NAME $VISIBILITY_FLAG --source=. --remote=origin --push; then
    echo -e "${GREEN}✓${NC} 仓库创建并推送成功"
else
    echo -e "${YELLOW}仓库创建失败,可能已存在。尝试添加 remote...${NC}"

    # 获取用户名
    USERNAME=$(gh api user --jq .login)
    REPO_URL="https://github.com/$USERNAME/$REPO_NAME.git"

    # 检查 remote 是否已存在
    if git remote get-url origin &> /dev/null; then
        echo -e "${YELLOW}remote 'origin' 已存在,删除旧的...${NC}"
        git remote remove origin
    fi

    git remote add origin $REPO_URL
    echo -e "${GREEN}✓${NC} Remote 已添加: $REPO_URL"
    echo ""

    # 推送代码
    echo -e "${CYAN}推送代码到 GitHub...${NC}"
    CURRENT_BRANCH=$(git branch --show-current)
    git push -u origin $CURRENT_BRANCH
fi

# 成功信息
echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}✓ 代码已成功上传到 GitHub!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""

# 获取仓库信息
USERNAME=$(gh api user --jq .login)
REPO_URL="https://github.com/$USERNAME/$REPO_NAME"
CURRENT_BRANCH=$(git branch --show-current)

echo -e "${CYAN}仓库地址:${NC} $REPO_URL"
echo -e "${CYAN}分支:${NC} $CURRENT_BRANCH"
echo ""

echo -e "${YELLOW}下一步:${NC}"
echo "1. 在服务器上克隆仓库:"
echo "   git clone $REPO_URL.git"
echo ""
echo "2. 查看部署指南:"
echo "   cat DEPLOY_TO_SERVER.md"
echo ""
echo "3. 运行服务器环境设置脚本:"
echo "   bash scripts/server-setup.sh"
echo ""
echo "4. 快速部署:"
echo "   bash scripts/deploy-quick.sh"
echo ""
