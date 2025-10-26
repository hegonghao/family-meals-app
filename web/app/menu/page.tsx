'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useDishes, useCreateDish, useUpdateDish, useDeleteDish } from '@/lib/hooks/use-menu';
import { MealSlotBadge } from '@/components/meal-slot-badge';
import type { Dish, MealSlot, CreateDishDto, UpdateDishDto } from '@/lib/types';

type DishFormData = {
  name: string;
  slot: MealSlot;
  isActive: boolean;
};

export default function MenuPage() {
  const [selectedSlot, setSelectedSlot] = useState<MealSlot | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [deletingDish, setDeletingDish] = useState<Dish | null>(null);
  const [formData, setFormData] = useState<DishFormData>({
    name: '',
    slot: 'BREAKFAST',
    isActive: true,
  });

  const { data: dishes, isLoading } = useDishes();
  const createMutation = useCreateDish();
  const updateMutation = useUpdateDish();
  const deleteMutation = useDeleteDish();

  // Filter dishes by slot and search query
  const filteredDishes = dishes?.filter((dish) => {
    const matchesSlot = selectedSlot === 'ALL' || dish.slot === selectedSlot;
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSlot && matchesSearch;
  }) || [];

  const resetForm = () => {
    setFormData({
      name: '',
      slot: 'BREAKFAST',
      isActive: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入菜品名称');
      return;
    }

    try {
      const dto: CreateDishDto = {
        name: formData.name.trim(),
        slot: formData.slot,
        isActive: formData.isActive,
      };
      await createMutation.mutateAsync(dto);
      toast.success('菜品创建成功');
      setIsCreateOpen(false);
      resetForm();
    } catch (error: unknown) {
      console.error(error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || '创建失败，请稍后重试';
      toast.error(message);
    }
  };

  const handleEdit = async () => {
    if (!editingDish) return;
    if (!formData.name.trim()) {
      toast.error('请输入菜品名称');
      return;
    }

    try {
      const dto: UpdateDishDto = {
        name: formData.name.trim(),
        slot: formData.slot,
        isActive: formData.isActive,
      };
      await updateMutation.mutateAsync({ id: editingDish.id, dto });
      toast.success('菜品更新成功');
      setEditingDish(null);
      resetForm();
    } catch (error: unknown) {
      console.error(error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || '更新失败，请稍后重试';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingDish) return;

    try {
      await deleteMutation.mutateAsync(deletingDish.id);
      toast.success('菜品删除成功');
      setDeletingDish(null);
    } catch (error: unknown) {
      console.error(error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || '删除失败，请稍后重试';
      toast.error(message);
    }
  };

  const openEditDialog = (dish: Dish) => {
    setFormData({
      name: dish.name,
      slot: dish.slot,
      isActive: dish.isActive,
    });
    setEditingDish(dish);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const closeEditDialog = () => {
    setEditingDish(null);
    resetForm();
  };

  const closeCreateDialog = () => {
    setIsCreateOpen(false);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">菜单管理</h1>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              新增菜品
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>菜品列表</CardTitle>
            <CardDescription>管理早餐、中餐和晚餐的菜品</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Meal Slot Tabs */}
              <Tabs
                value={selectedSlot}
                onValueChange={(value) => setSelectedSlot(value as MealSlot | 'ALL')}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="ALL">全部</TabsTrigger>
                  <TabsTrigger value="BREAKFAST">早餐</TabsTrigger>
                  <TabsTrigger value="LUNCH">中餐</TabsTrigger>
                  <TabsTrigger value="DINNER">晚餐</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索菜品名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredDishes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? '未找到匹配的菜品' : '暂无菜品'}
                </p>
                {!searchQuery && (
                  <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    创建第一个菜品
                  </Button>
                )}
              </div>
            )}

            {/* Dishes Table */}
            {!isLoading && filteredDishes.length > 0 && (
              <div className="space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 rounded-lg font-medium text-sm">
                  <div className="col-span-5">菜品名称</div>
                  <div className="col-span-2">餐次</div>
                  <div className="col-span-2">状态</div>
                  <div className="col-span-3 text-right">操作</div>
                </div>

                {/* Table Body */}
                {filteredDishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="col-span-5 flex items-center font-medium">
                      {dish.name}
                    </div>
                    <div className="col-span-2 flex items-center">
                      <MealSlotBadge slot={dish.slot} />
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span
                        className={`text-sm ${
                          dish.isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                        }`}
                      >
                        {dish.isActive ? '启用' : '停用'}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(dish)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingDish(dish)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增菜品</DialogTitle>
            <DialogDescription>添加新的菜品到菜单中</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">菜品名称</Label>
              <Input
                id="create-name"
                placeholder="请输入菜品名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-slot">餐次</Label>
              <Select
                value={formData.slot}
                onValueChange={(value) => setFormData({ ...formData, slot: value as MealSlot })}
              >
                <SelectTrigger id="create-slot">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BREAKFAST">早餐</SelectItem>
                  <SelectItem value="LUNCH">中餐</SelectItem>
                  <SelectItem value="DINNER">晚餐</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create-active">启用状态</Label>
              <Switch
                id="create-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCreateDialog}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDish} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑菜品</DialogTitle>
            <DialogDescription>修改菜品信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">菜品名称</Label>
              <Input
                id="edit-name"
                placeholder="请输入菜品名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slot">餐次</Label>
              <Select
                value={formData.slot}
                onValueChange={(value) => setFormData({ ...formData, slot: value as MealSlot })}
              >
                <SelectTrigger id="edit-slot">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BREAKFAST">早餐</SelectItem>
                  <SelectItem value="LUNCH">中餐</SelectItem>
                  <SelectItem value="DINNER">晚餐</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">启用状态</Label>
              <Switch
                id="edit-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              取消
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDish} onOpenChange={(open) => !open && setDeletingDish(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除菜品 <span className="font-semibold">{deletingDish?.name}</span> 吗？
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
