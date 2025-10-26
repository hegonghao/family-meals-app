# Family Meals App 🍽️

> 家庭餐饮管理系统 - 便捷的订餐和管理平台

一个现代化的家庭餐饮管理系统，采用 NestJS 后端 + Next.js PWA 前端，支持完整的订餐流程管理。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-brightgreen.svg)](https://www.docker.com/)

## ✨ 功能特性

### 核心功能

- 🔐 **用户认证系统**
  - JWT 令牌认证
  - 安全的密码哈希（bcrypt）
  - 用户资料管理

- 🍱 **菜单管理**
  - 菜品的增删改查
  - 按餐次分类（早餐、午餐、晚餐）
  - 菜品状态管理（启用/禁用）

- 📋 **订单系统**
  - 提前订餐
  - 订单编辑与取消
  - 日历视图查看订单
  - 防止重复点菜
  - 订单状态追踪

- 📱 **PWA 支持**
  - 可安装到手机主屏幕
  - 离线缓存支持
  - 类原生应用体验
  - 跨平台兼容

### 生产级特性

- 🔒 **安全性**: Helmet 中间件、速率限制、CORS 配置
- 📚 **API 文档**: Swagger/OpenAPI 自动生成
- 📝 **日志系统**: Winston 结构化日志
- 🚨 **错误处理**: 全局异常过滤器
- 🏥 **健康检查**: 数据库连接状态监控
- 🗃️ **数据库迁移**: TypeORM 迁移系统
- 🌱 **数据种子**: 示例数据生成
- 🐳 **容器化**: Docker Compose 一键部署

## 🛠️ 技术栈

### 后端
- **框架**: NestJS 10.x
- **数据库**: PostgreSQL 16
- **ORM**: TypeORM
- **认证**: JWT + Passport
- **文档**: Swagger/OpenAPI
- **日志**: Winston
- **测试**: Jest

### 前端
- **框架**: Next.js 15.x (App Router)
- **语言**: TypeScript 5.x
- **样式**: Tailwind CSS + shadcn/ui
- **状态管理**: TanStack Query (React Query)
- **PWA**: @ducanh2912/next-pwa
- **UI 组件**: Radix UI + Lucide Icons

### 基础设施
- **反向代理**: Nginx
- **容器**: Docker + Docker Compose
- **数据库**: PostgreSQL 16

## 🚀 快速开始

### 方式一：Docker Compose（推荐）

最简单的部署方式，一键启动所有服务：

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/family-meals-app.git
cd family-meals-app

# 2. 配置环境变量
cp .env.example .env
cp backend/.env.example backend/.env

# 3. 启动所有服务
docker-compose up -d

# 4. 访问应用
# 前端: http://localhost
# 后端 API: http://localhost/api
# API 文档: http://localhost/api/docs
```

服务将在几分钟内启动完成！

### 方式二：手动启动

#### 前置要求

- Node.js 20+
- PostgreSQL 16
- npm 或 yarn

#### 1. 启动数据库

```bash
docker run -d \
  --name family-meals-db \
  -e POSTGRES_DB=family_meals \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 6432:5432 \
  postgres:16-alpine
```

#### 2. 启动后端

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 运行迁移
npm run migration:run

# 种子数据（可选）
npm run seed

# 启动开发服务器
npm run start:dev
```

**测试账号**（运行 seed 后）：
- 管理员: `admin` / `admin123`
- 用户1: `john` / `user123`
- 用户2: `jane` / `user123`

后端服务：
- API: http://localhost:3000/api
- Swagger 文档: http://localhost:3000/api/docs
- 健康检查: http://localhost:3000/api/health

#### 3. 启动前端

```bash
cd web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端访问: http://localhost:3001

## 📁 项目结构

```
family-meals-app/
├── backend/                 # NestJS 后端
│   ├── src/
│   │   ├── auth/           # JWT 认证模块
│   │   ├── users/          # 用户管理
│   │   ├── menu/           # 菜单管理
│   │   ├── orders/         # 订单管理
│   │   ├── health/         # 健康检查
│   │   ├── common/         # 共享代码（枚举、过滤器）
│   │   ├── config/         # 配置文件
│   │   └── database/       # 数据库相关（迁移、种子）
│   ├── test/               # 测试文件
│   ├── Dockerfile          # 后端容器配置
│   └── .env.example        # 环境变量模板
│
├── web/                     # Next.js 前端
│   ├── app/                # App Router 页面
│   │   ├── dashboard/      # 仪表盘
│   │   ├── menu/           # 菜单管理
│   │   ├── orders/         # 订单管理
│   │   ├── users/          # 用户管理
│   │   └── profile/        # 个人资料
│   ├── components/         # React 组件
│   │   ├── ui/            # shadcn/ui 组件
│   │   └── ...            # 业务组件
│   ├── lib/               # 工具库
│   │   ├── api/           # API 客户端
│   │   └── providers/     # Context Providers
│   ├── public/            # 静态资源
│   │   ├── manifest.json  # PWA 配置
│   │   └── icons/         # PWA 图标
│   ├── Dockerfile         # 前端容器配置
│   └── next.config.ts     # Next.js 配置
│
├── nginx/                  # Nginx 配置
│   ├── nginx.conf         # 反向代理配置
│   └── ssl/               # SSL 证书目录
│
├── docker-compose.yml      # Docker Compose 配置
├── .env.example           # 环境变量模板
├── README.md              # 本文件
├── DEPLOYMENT.md          # 详细部署文档
└── GITHUB_GUIDE.md        # GitHub 使用指南
```

## 📖 API 文档

### Swagger UI

启动后端服务后，访问 http://localhost:3000/api/docs 查看交互式 API 文档。

### 核心端点

**认证**
- `POST /api/auth/login` - 用户登录

**用户管理**
- `POST /api/users` - 创建用户
- `GET /api/users` - 获取用户列表
- `GET /api/users/:id` - 获取用户详情
- `PATCH /api/users/:id` - 更新用户

**菜单管理**
- `POST /api/menu/dishes` - 创建菜品
- `GET /api/menu/dishes` - 获取菜品列表
- `PATCH /api/menu/dishes/:id` - 更新菜品
- `DELETE /api/menu/dishes/:id` - 删除菜品
- `GET /api/menu/slots/:slot` - 按餐次获取菜单

**订单管理**
- `POST /api/orders` - 创建订单
- `GET /api/orders/upcoming` - 获取即将到来的订单
- `GET /api/orders/calendar-range` - 按日期范围获取订单
- `GET /api/orders/by-date` - 按日期获取订单
- `PATCH /api/orders/:id` - 更新订单
- `POST /api/orders/:id/cancel` - 取消订单

**健康检查**
- `GET /api/health` - 服务健康状态

除了 `/auth/login` 和 `/health`，所有端点都需要 JWT 认证。请在请求头中添加：
```
Authorization: Bearer <your-jwt-token>
```

## 🧪 测试

```bash
cd backend

# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:cov

# E2E 测试
npm run test:e2e
```

**测试覆盖率**：
- ✅ AuthService: 100%
- ✅ UsersService: 100%
- ✅ MenuService: 100%
- ✅ OrdersService: 100%
- 📊 **总计: 51 个测试通过**

## 🗃️ 数据库管理

### 迁移

```bash
cd backend

# 根据实体变更生成迁移
npm run migration:generate src/database/migrations/MigrationName

# 创建空迁移
npm run migration:create src/database/migrations/MigrationName

# 运行待执行的迁移
npm run migration:run

# 回滚最后一次迁移
npm run migration:revert
```

### 备份与恢复

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U postgres family_meals > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup_20250101.sql | docker-compose exec -T postgres psql -U postgres family_meals
```

## 🐳 Docker 命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重新构建
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 进入容器
docker-compose exec api sh
docker-compose exec web sh

# 清理所有容器和卷
docker-compose down -v --rmi all
```

## 🔧 环境变量

### 根目录 `.env`

```env
# 数据库配置
POSTGRES_DB=family_meals
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# 端口配置
HTTP_PORT=80
HTTPS_PORT=443

# 环境
NODE_ENV=production
```

### `backend/.env`

```env
# 服务器
PORT=3000
NODE_ENV=development

# 数据库
DB_HOST=localhost
DB_PORT=6432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=family_meals

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES=7d
```

⚠️ **生产环境必须修改**：
- `POSTGRES_PASSWORD` - 使用强密码
- `JWT_SECRET` - 生成随机字符串（至少 32 位）

## 📚 文档

- [部署指南](./DEPLOYMENT.md) - 详细的部署步骤和配置
- [GitHub 指南](./GITHUB_GUIDE.md) - Git 和 GitHub 使用教程
- [API 文档](http://localhost:3000/api/docs) - Swagger 交互式文档

## 🔒 安全特性

- **Helmet**: 设置安全的 HTTP 头
- **速率限制**: 10 请求/60秒/IP
- **CORS**: 可配置的跨域策略
- **JWT 认证**: 安全的令牌机制
- **密码哈希**: bcrypt 加密存储
- **HTTPS**: 生产环境强制 HTTPS

## 🌐 PWA 功能

- ✅ 可安装到设备主屏幕
- ✅ 离线缓存静态资源
- ✅ Service Worker 后台同步
- ✅ 响应式设计，适配各种屏幕
- ✅ 快速加载，优秀的性能

### 测试 PWA

**开发环境（局域网）**：
```bash
cd web
npm run dev -- -H 0.0.0.0
# 手机访问: http://<your-ip>:3000
```

**完整测试（HTTPS）**：
```bash
# 使用 ngrok 提供临时 HTTPS
ngrok http 3000
# 手机访问 ngrok 提供的 HTTPS URL
```

## 🎯 路线图

- [x] 用户认证系统
- [x] 菜单管理功能
- [x] 订单系统
- [x] PWA 支持
- [x] Docker 部署
- [x] API 文档
- [ ] 管理员仪表盘统计
- [ ] 订单导出（CSV/Excel）
- [ ] 推送通知
- [ ] 多语言支持（i18n）
- [ ] Redis 缓存
- [ ] CI/CD 流程

## 👥 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交修改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 提交规范

使用语义化提交信息：
- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `style:` - 代码格式（不影响功能）
- `refactor:` - 重构
- `test:` - 测试相关
- `chore:` - 构建/工具配置

### 代码规范

```bash
# 运行 ESLint
npm run lint

# 自动修复
npm run lint:fix

# 代码格式化
npm run format
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 支持

遇到问题？

1. 查看 [常见问题](./DEPLOYMENT.md#常见问题)
2. 搜索 [已有 Issues](https://github.com/your-username/family-meals-app/issues)
3. 创建新 Issue

## 📧 联系方式

- 项目仓库: https://github.com/your-username/family-meals-app
- 问题反馈: https://github.com/your-username/family-meals-app/issues

---

**开发愉快！** 🚀

如有任何问题，欢迎提 Issue 或 PR。
