# Family Meals App - GitHub 上传脚本 (PowerShell)
# 适用于 Windows 系统

param(
    [string]$RepoName = "family-meals-app",
    [switch]$Private
)

Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host "Family Meals App - GitHub 上传工具" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# 检查是否在项目目录
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "错误: 请在项目根目录下运行此脚本" -ForegroundColor Red
    exit 1
}

# 检查 Git 是否安装
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未安装 Git,请先安装: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Git 已安装`n" -ForegroundColor Green

# 检查 GitHub CLI
$hasGH = Get-Command gh -ErrorAction SilentlyContinue

if (-not $hasGH) {
    Write-Host "GitHub CLI (gh) 未安装" -ForegroundColor Yellow
    Write-Host "`n有两种方式上传代码:`n"
    Write-Host "方式 1: 安装 GitHub CLI (推荐)" -ForegroundColor Cyan
    Write-Host "  安装命令: winget install --id GitHub.cli"
    Write-Host "  或访问: https://cli.github.com/`n"

    Write-Host "方式 2: 手动创建仓库" -ForegroundColor Cyan
    Write-Host "  1. 访问 https://github.com/new"
    Write-Host "  2. 创建名为 '$RepoName' 的仓库"
    Write-Host "  3. 复制仓库 URL"
    Write-Host "  4. 运行: git remote add origin <仓库URL>"
    Write-Host "  5. 运行: git push -u origin 001-dashboard-welcome-reminders`n"

    $choice = Read-Host "是否要安装 GitHub CLI? (y/N)"
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        Write-Host "`n正在安装 GitHub CLI..." -ForegroundColor Cyan
        winget install --id GitHub.cli
        Write-Host "请重新运行此脚本" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`n请按照方式 2 手动操作" -ForegroundColor Yellow
        exit 0
    }
}

# 检查 GitHub CLI 认证状态
Write-Host "检查 GitHub 认证状态..." -ForegroundColor Cyan
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "需要登录 GitHub`n" -ForegroundColor Yellow
    gh auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "GitHub 登录失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ GitHub 认证成功`n" -ForegroundColor Green

# 检查是否有未提交的更改
$status = git status --porcelain
if ($status) {
    Write-Host "检测到未提交的更改,正在提交..." -ForegroundColor Yellow
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

    if ($LASTEXITCODE -ne 0) {
        Write-Host "提交失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ 代码已提交`n" -ForegroundColor Green
}

# 创建 GitHub 仓库
Write-Host "创建 GitHub 仓库: $RepoName" -ForegroundColor Cyan

$visibility = if ($Private) { "--private" } else { "--public" }

gh repo create $RepoName $visibility --source=. --remote=origin --push

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n仓库创建失败,可能已存在。尝试添加 remote..." -ForegroundColor Yellow

    # 获取用户名
    $username = gh api user --jq .login
    $repoUrl = "https://github.com/$username/$RepoName.git"

    # 检查 remote 是否已存在
    $remotes = git remote
    if ($remotes -contains "origin") {
        Write-Host "remote 'origin' 已存在,删除旧的..." -ForegroundColor Yellow
        git remote remove origin
    }

    git remote add origin $repoUrl
    Write-Host "✓ Remote 已添加: $repoUrl`n" -ForegroundColor Green
}

# 推送代码
Write-Host "推送代码到 GitHub..." -ForegroundColor Cyan
$currentBranch = git branch --show-current

git push -u origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=========================================="  -ForegroundColor Green
    Write-Host "✓ 代码已成功上传到 GitHub!" -ForegroundColor Green
    Write-Host "==========================================`n" -ForegroundColor Green

    # 获取仓库 URL
    $username = gh api user --jq .login
    $repoUrl = "https://github.com/$username/$RepoName"

    Write-Host "仓库地址: $repoUrl" -ForegroundColor Cyan
    Write-Host "分支: $currentBranch`n" -ForegroundColor Cyan

    Write-Host "下一步:" -ForegroundColor Yellow
    Write-Host "1. 在服务器上克隆仓库:"
    Write-Host "   git clone $repoUrl.git`n"
    Write-Host "2. 查看部署指南:"
    Write-Host "   cat DEPLOY_TO_SERVER.md`n"

    # 询问是否在浏览器中打开
    $open = Read-Host "是否在浏览器中打开仓库? (Y/n)"
    if ($open -ne 'n' -and $open -ne 'N') {
        Start-Process $repoUrl
    }
} else {
    Write-Host "代码推送失败" -ForegroundColor Red
    Write-Host "请检查网络连接和权限设置" -ForegroundColor Yellow
    exit 1
}
