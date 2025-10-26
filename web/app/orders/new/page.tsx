'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, Minus, Plus, ArrowLeft } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/lib/providers/auth-provider';
import { useCreateOrder, useUpdateOrder, useOrder } from '@/lib/hooks/use-orders';
import { useDishesBySlot } from '@/lib/hooks/use-menu';
import { MealSlotBadge } from '@/components/meal-slot-badge';
import type { MealSlot, Dish } from '@/lib/types';

type DishQuantity = {
  dishId: string;
  dishName: string;
  quantity: number;
};

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { user } = useAuth();

  const [date, setDate] = useState<Date>(addDays(startOfDay(new Date()), 1));
  const [slot, setSlot] = useState<MealSlot>('BREAKFAST');
  const [notes, setNotes] = useState('');
  const [dishQuantities, setDishQuantities] = useState<Map<string, DishQuantity>>(new Map());

  const { data: existingOrder, isLoading: isLoadingOrder } = useOrder(editId || '');
  const { data: dishes, isLoading: isLoadingDishes } = useDishesBySlot(slot);
  const createMutation = useCreateOrder();
  const updateMutation = useUpdateOrder();

  const isEditMode = !!editId;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Load existing order data when editing
  useEffect(() => {
    if (existingOrder && isEditMode) {
      setDate(startOfDay(new Date(existingOrder.mealDate)));
      setSlot(existingOrder.slot);
      setNotes(existingOrder.notes || '');

      const quantities = new Map<string, DishQuantity>();
      existingOrder.items.forEach((item) => {
        if (item.dish) {
          quantities.set(item.dish.id, {
            dishId: item.dish.id,
            dishName: item.dish.name,
            quantity: item.quantity,
          });
        }
      });
      setDishQuantities(quantities);
    }
  }, [existingOrder, isEditMode]);

  // Reset quantities when slot changes (only when not loading existing order)
  useEffect(() => {
    if (!isEditMode || !isLoadingOrder) {
      setDishQuantities(new Map());
    }
  }, [slot, isEditMode, isLoadingOrder]);

  const handleQuantityChange = (dish: Dish, delta: number) => {
    setDishQuantities((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(dish.id);
      const newQuantity = (current?.quantity || 0) + delta;

      if (newQuantity <= 0) {
        newMap.delete(dish.id);
      } else {
        newMap.set(dish.id, {
          dishId: dish.id,
          dishName: dish.name,
          quantity: newQuantity,
        });
      }
      return newMap;
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (dishQuantities.size === 0) {
      toast.error('请至少选择一个菜品');
      return;
    }

    const items = Array.from(dishQuantities.values()).map((dq) => ({
      dishId: dq.dishId,
      quantity: dq.quantity,
    }));

    try {
      if (isEditMode && editId) {
        await updateMutation.mutateAsync({
          id: editId,
          dto: {
            mealDate: format(date, 'yyyy-MM-dd'),
            slot,
            notes: notes.trim() || undefined,
            items,
          },
        });
        toast.success('订单更新成功');
      } else {
        await createMutation.mutateAsync({
          userId: user.id,
          mealDate: format(date, 'yyyy-MM-dd'),
          slot,
          notes: notes.trim() || undefined,
          items,
        });
        toast.success('订单创建成功');
      }
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error(error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || (isEditMode ? '更新失败' : '创建失败');
      toast.error(message);
    }
  };

  const totalItems = Array.from(dishQuantities.values()).reduce(
    (sum, dq) => sum + dq.quantity,
    0
  );

  if (isEditMode && isLoadingOrder) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">
              {isEditMode ? '编辑订单' : '创建订单'}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid gap-6">
          {/* Date and Slot Selection */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>选择用餐日期和餐次</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label>用餐日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, 'PPP', { locale: zhCN })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                      disabled={(date) => date < startOfDay(new Date())}
                      initialFocus
                      locale={zhCN}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Meal Slot Tabs */}
              <div className="space-y-2">
                <Label>餐次</Label>
                <Tabs value={slot} onValueChange={(value) => setSlot(value as MealSlot)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="BREAKFAST">早餐</TabsTrigger>
                    <TabsTrigger value="LUNCH">中餐</TabsTrigger>
                    <TabsTrigger value="DINNER">晚餐</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Dish Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>选择菜品</CardTitle>
                  <CardDescription>
                    为 <MealSlotBadge slot={slot} className="inline-flex" /> 选择菜品和数量
                  </CardDescription>
                </div>
                {totalItems > 0 && (
                  <div className="text-sm text-muted-foreground">
                    已选 {totalItems} 份
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Loading State */}
              {isLoadingDishes && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoadingDishes && (!dishes || dishes.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">该餐次暂无可用菜品</p>
                  <Link href="/menu" className="mt-4 inline-block">
                    <Button variant="outline" size="sm">
                      去菜单管理添加菜品
                    </Button>
                  </Link>
                </div>
              )}

              {/* Dishes List */}
              {!isLoadingDishes && dishes && dishes.length > 0 && (
                <div className="space-y-2">
                  {dishes.map((dish) => {
                    const quantity = dishQuantities.get(dish.id)?.quantity || 0;
                    return (
                      <div
                        key={dish.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="font-medium">{dish.name}</div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(dish, -1)}
                            disabled={quantity === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="w-8 text-center font-medium">{quantity}</div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(dish, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>备注</CardTitle>
              <CardDescription>添加订单备注（可选）</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="输入备注信息..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || dishQuantities.size === 0}
              className="flex-1"
            >
              {isSubmitting
                ? isEditMode
                  ? '保存中...'
                  : '创建中...'
                : isEditMode
                ? '保存订单'
                : '创建订单'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
