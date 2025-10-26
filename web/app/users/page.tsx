'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, createUser, updateUser, deleteUser, type CreateUserDto, type UpdateUserDto } from '@/lib/api/users';
import type { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Edit, Shield, User as UserIcon, Trash2, Key, UserPlus } from 'lucide-react';

export default function UsersPage() {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [formData, setFormData] = useState<UpdateUserDto>({});
  const [createFormData, setCreateFormData] = useState<CreateUserDto>({
    username: '',
    password: '',
    displayName: '',
    role: 'user',
  });
  const [newPassword, setNewPassword] = useState('');
  const queryClient = useQueryClient();

  // 获取所有用户
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
  });

  // 创建新用户
  const createUserMutation = useMutation({
    mutationFn: (dto: CreateUserDto) => createUser(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('用户创建成功');
      setCreatingUser(false);
      setCreateFormData({
        username: '',
        password: '',
        displayName: '',
        role: 'user',
      });
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || '创建失败');
    },
  });

  // 更新用户
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, dto }: { userId: string; dto: UpdateUserDto }) =>
      updateUser(userId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('用户信息已更新');
      setEditingUser(null);
      setFormData({});
      setNewPassword('');
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || '更新失败');
    },
  });

  // 删除用户
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('用户已删除');
      setDeletingUser(null);
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || '删除失败');
    },
  });

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
    });
    setNewPassword('');
  };

  const handleSaveUser = () => {
    if (!editingUser) return;
    const updateDto = { ...formData };
    if (newPassword) {
      updateDto.password = newPassword;
    }
    updateUserMutation.mutate({
      userId: editingUser.id,
      dto: updateDto,
    });
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;
    deleteUserMutation.mutate(deletingUser.id);
  };

  const handleCreateUser = () => {
    if (!createFormData.username || !createFormData.password) {
      toast.error('用户名和密码不能为空');
      return;
    }
    createUserMutation.mutate(createFormData);
  };

  const getRoleBadge = (role: UserRole) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
          <Shield className="mr-1 h-3 w-3" />
          管理员
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <UserIcon className="mr-1 h-3 w-3" />
        普通用户
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-4">用户管理</h1>
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-4">用户管理</h1>
        <p className="text-red-500">
          {(error as { response?: { status?: number } }).response?.status === 403
            ? '您没有权限访问此页面（仅管理员可访问）'
            : '加载失败，请重试'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">用户管理</h1>
          <p className="text-muted-foreground mt-2">
            管理系统中的所有用户，设置角色和权限
          </p>
        </div>
        <Button onClick={() => setCreatingUser(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          新建用户
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>显示名称</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最后登录</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>
                  {user.isActive ? (
                    <Badge variant="default">活跃</Badge>
                  ) : (
                    <Badge variant="secondary">已禁用</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.lastLoginAt ? (
                    format(new Date(user.lastLoginAt), 'yyyy-MM-dd HH:mm', {
                      locale: zhCN,
                    })
                  ) : (
                    <span className="text-muted-foreground">从未登录</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm', {
                    locale: zhCN,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      编辑
                    </Button>
                    {user.role !== 'admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingUser(user)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 编辑用户对话框 */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户 {editingUser?.username} 的信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">显示名称</Label>
              <Input
                id="displayName"
                value={formData.displayName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">用户角色</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">账户状态</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                重置密码
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="留空则不修改密码"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                输入新密码以重置用户密码，留空则保持原密码不变
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
            >
              取消
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建用户对话框 */}
      <Dialog open={creatingUser} onOpenChange={(open) => !open && setCreatingUser(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建用户</DialogTitle>
            <DialogDescription>
              创建新的系统用户账户
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-username">用户名 *</Label>
              <Input
                id="create-username"
                value={createFormData.username}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, username: e.target.value })
                }
                placeholder="输入用户名"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password">密码 *</Label>
              <Input
                id="create-password"
                type="password"
                value={createFormData.password}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, password: e.target.value })
                }
                placeholder="输入密码"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-displayName">显示名称</Label>
              <Input
                id="create-displayName"
                value={createFormData.displayName}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, displayName: e.target.value })
                }
                placeholder="留空则使用用户名"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-role">用户角色</Label>
              <Select
                value={createFormData.role}
                onValueChange={(value: UserRole) =>
                  setCreateFormData({ ...createFormData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreatingUser(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除用户 <strong>{deletingUser?.username}</strong> ({deletingUser?.displayName}) 吗？
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
