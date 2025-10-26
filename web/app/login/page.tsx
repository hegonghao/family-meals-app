'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { login } from '@/lib/auth';
import { useAuth } from '@/lib/providers/auth-provider';
import Link from 'next/link';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // 获取重定向参数
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null;
  const from = searchParams?.get('from') || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await login(data);
      setUser(response.user);
      toast.success(`欢迎回来，${response.user.displayName}！`);
      // 登录成功后重定向到原始页面或dashboard
      router.push(from);
    } catch (error: unknown) {
      console.error(error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || '登录失败，请检查用户名和密码';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Family Meals</h1>
          <p className="text-muted-foreground mt-2">家庭餐饮管理系统</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>登录</CardTitle>
            <CardDescription>输入您的账号和密码以继续</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  placeholder="请输入用户名"
                  {...register('username')}
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">密码</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    忘记密码？
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  {...register('password')}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                登录
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">还没有账号？ </span>
              <Link href="/register" className="text-primary hover:underline">
                立即注册
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-sm text-center text-muted-foreground">
              测试账号：<code className="font-mono">admin</code> / <code className="font-mono">password</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
