'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, UtensilsCrossed, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/providers/auth-provider';

export default function Home() {
  const { isAuthenticated } = useAuth();

  const primaryCtaHref = isAuthenticated ? '/dashboard' : '/login';
  const primaryCtaLabel = isAuthenticated ? '进入控制台' : '开始使用';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Family Meals</h1>
          </div>
          <nav className="hidden md:flex gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/menu">
              <Button variant="ghost">菜单</Button>
            </Link>
            <Link href="/orders">
              <Button variant="ghost">订单</Button>
            </Link>
            <Link href="/users">
              <Button variant="ghost">用户</Button>
            </Link>
          </nav>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="outline">进入控制台</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button>登录</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold tracking-tight mb-6">家庭餐饮管理系统</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          便捷的订餐平台，轻松管理家庭餐饮。支持多餐次预订、实时提醒、数据分析等功能。
        </p>
        <div className="flex gap-4 justify-center">
          <Link href={primaryCtaHref}>
            <Button size="lg">{primaryCtaLabel}</Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg">
              了解更多
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-primary mb-2" />
              <CardTitle>日历视图</CardTitle>
              <CardDescription>
                一目了然查看本周所有订单，轻松规划餐饮安排
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>每周视图订单展示</li>
                <li>按日期筛选订单</li>
                <li>快速编辑订单</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <UtensilsCrossed className="h-10 w-10 text-primary mb-2" />
              <CardTitle>菜单管理</CardTitle>
              <CardDescription>
                灵活的菜品管理，支持早中晚三个餐次
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>按餐次分类展示</li>
                <li>启用 / 禁用菜品</li>
                <li>快速添加菜品</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>用户管理</CardTitle>
              <CardDescription>
                多用户支持，每个成员独立订餐
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>多层级权限管理</li>
                <li>个性化偏好设置</li>
                <li>提醒开关自定义</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>智能提醒</CardTitle>
              <CardDescription>
                自动检测未点餐次，及时提醒
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>未点餐提醒</li>
                <li>诗词欢迎语</li>
                <li>个性化设置</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-center">技术栈</CardTitle>
            <CardDescription className="text-center">
              基于现代前端技术构建的高性能应用
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <h3 className="font-semibold mb-2">前端框架</h3>
                <p className="text-sm text-muted-foreground">
                  Next.js 15 · React 19 · TypeScript
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">UI组件</h3>
                <p className="text-sm text-muted-foreground">
                  Shadcn/ui · Radix UI · Tailwind CSS
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">状态管理</h3>
                <p className="text-sm text-muted-foreground">
                  TanStack Query v5 · React Hook Form
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Family Meals App. Built with ❤️ using Next.js and Shadcn/ui.</p>
        </div>
      </footer>
    </div>
  );
}
