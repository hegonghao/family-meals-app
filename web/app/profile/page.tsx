'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { updateOwnProfile } from '@/lib/api/users';
import { useAuth } from '@/lib/providers/auth-provider';

const profileSchema = z
  .object({
    displayName: z
      .string()
      .min(1, '显示名不能为空')
      .max(50, '显示名不能超过 50 个字符'),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const wantsPasswordChange = Boolean(
      (data.newPassword && data.newPassword.length > 0) ||
      (data.currentPassword && data.currentPassword.length > 0) ||
      (data.confirmPassword && data.confirmPassword.length > 0),
    );

    if (!wantsPasswordChange) {
      return;
    }

    if (!data.currentPassword || data.currentPassword.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请输入当前密码',
        path: ['currentPassword'],
      });
    }

    if (!data.newPassword || data.newPassword.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请输入新密码',
        path: ['newPassword'],
      });
    } else if (data.newPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '密码至少 8 个字符',
        path: ['newPassword'],
      });
    }

    if (!data.confirmPassword || data.confirmPassword.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请再次输入新密码',
        path: ['confirmPassword'],
      });
    }

    if (
      data.newPassword &&
      data.confirmPassword &&
      data.newPassword !== data.confirmPassword
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '两次输入的新密码不一致',
        path: ['confirmPassword'],
      });
    }
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    reset({
      displayName: user?.displayName ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }, [reset, user?.displayName]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) {
      toast.error('用户信息未加载，请稍后再试');
      return;
    }

    const payload: {
      displayName?: string;
      currentPassword?: string;
      newPassword?: string;
    } = {};

    const trimmedDisplayName = values.displayName.trim();
    if (trimmedDisplayName && trimmedDisplayName !== user.displayName) {
      payload.displayName = trimmedDisplayName;
    }

    if (values.newPassword) {
      payload.currentPassword = values.currentPassword;
      payload.newPassword = values.newPassword;
    }

    if (!payload.displayName && !payload.newPassword) {
      toast.info('没有需要更新的内容');
      reset({
        displayName: user.displayName,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      return;
    }

    try {
      const updatedUser = await updateOwnProfile(payload);
      setUser(updatedUser);
      toast.success('个人资料已更新');
      reset({
        displayName: updatedUser.displayName,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message ?? '更新失败，请稍后重试';
      if (Array.isArray(message)) {
        message.forEach((item: string) => toast.error(item));
      } else {
        toast.error(message);
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">个人资料</h1>
          <p className="text-muted-foreground">更新显示名或修改登录密码。</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-center sm:w-auto"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回上一页
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>以下信息将用于系统内的欢迎语与通知提醒。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" value={user.username} disabled readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">显示名</Label>
              <Input
                id="displayName"
                placeholder="请输入显示名"
                {...register('displayName')}
                disabled={isSubmitting}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">{errors.displayName.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label>密码</Label>
                <p className="text-sm text-muted-foreground">
                  若需更改密码，请填写以下三个字段。留空则保持不变。
                </p>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="currentPassword">当前密码</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="请输入当前密码"
                    {...register('currentPassword')}
                    disabled={isSubmitting}
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="newPassword">新密码</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="请输入新密码"
                    {...register('newPassword')}
                    disabled={isSubmitting}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">确认新密码</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    {...register('confirmPassword')}
                    disabled={isSubmitting}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() =>
                  reset({
                    displayName: user.displayName,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  })
                }
              >
                重置
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存更改'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
