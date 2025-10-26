'use client';

import { WelcomeHeader } from '@/components/welcome-header';
import { MealReminderBanner } from '@/components/meal-reminder-banner';
import { MealSlotBadge } from '@/components/meal-slot-badge';
import { OrderCard } from '@/components/order-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCalendarOrders, useCancelOrder } from '@/lib/hooks/use-orders';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, LogIn, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/providers/auth-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function DashboardPage() {
  const router = useRouter();
  const [rangeStartDate, setRangeStartDate] = useState(() => startOfDay(new Date()));

  const rangeStart = format(rangeStartDate, 'yyyy-MM-dd');
  const rangeEnd = format(addDays(rangeStartDate, 6), 'yyyy-MM-dd');

  const { data: orders, isFetching, refetch } = useCalendarOrders(rangeStart, rangeEnd);
  const cancelMutation = useCancelOrder();

  // 从认证context获取当前用户
  const { user, isAuthenticated, logout } = useAuth();
  const currentUserId = user?.id || '';
  const currentUserName = user?.displayName || '游客';

  const handleLogout = () => {
    logout();
    toast.success('已退出登录');
    router.push('/login');
  };

  // 按日期和餐次分组订单
  const ordersGroupedByDate = () => {
    if (!orders) return [];

    type SlotGroup = {
      slot: string;
      orders: typeof orders;
    };

    const grouped: Array<{ date: Date; dateKey: string; slotGroups: SlotGroup[] }> = [];
    const ordersByDate = new Map<string, typeof orders>();

    orders.forEach((order) => {
      // 过滤已取消的订单
      if (order.status === 'CANCELLED') return;

      const dateKey = order.mealDate.slice(0, 10);
      if (!ordersByDate.has(dateKey)) {
        ordersByDate.set(dateKey, []);
      }
      ordersByDate.get(dateKey)!.push(order);
    });

    ordersByDate.forEach((dateOrders, dateKey) => {
      // 按餐次分组
      const slotMap = new Map<string, typeof orders>();

      dateOrders.forEach((order) => {
        if (!slotMap.has(order.slot)) {
          slotMap.set(order.slot, []);
        }
        slotMap.get(order.slot)!.push(order);
      });

      // 按餐次顺序排列
      const slotOrder = ['BREAKFAST', 'LUNCH', 'DINNER'];
      const slotGroups: SlotGroup[] = slotOrder
        .filter((slot) => slotMap.has(slot))
        .map((slot) => ({
          slot,
          orders: slotMap.get(slot)!,
        }));

      grouped.push({
        date: parseISO(dateKey),
        dateKey,
        slotGroups,
      });
    });

    return grouped.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelMutation.mutateAsync(orderId);
      toast.success('订单已取消');
      refetch();
    } catch (error) {
      toast.error('取消失败，请稍后重试');
      console.error(error);
    }
  };

  const handleEditOrder = (orderId: string) => {
    router.push(`/orders/new?edit=${orderId}`);
  };

  const getDateBadgeColor = (date: Date) => {
    const today = startOfDay(new Date());
    if (date.getTime() === today.getTime()) {
      return 'bg-blue-500 text-white';
    }
    if (date < today) {
      return 'bg-gray-400 text-white';
    }
    return 'bg-green-500 text-white';
  };

  const groupedOrders = ordersGroupedByDate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-3">
              <Link href="/orders/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  新订单
                </Button>
              </Link>

              {/* User Info / Login Button */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">{user.displayName || user.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>我的账号</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      <User className="mr-2 h-4 w-4" />
                      <span>{user.username}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>退出登录</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button variant="outline">
                    <LogIn className="mr-2 h-4 w-4" />
                    登录
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <WelcomeHeader displayName={currentUserName} />

        {/* Reminder Banner */}
        <MealReminderBanner />

        {/* Orders Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>我的订单</CardTitle>
                <CardDescription>
                  {currentUserName} • {format(new Date(), 'PPP', { locale: zhCN })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/menu">
                  <Button variant="outline" size="sm">
                    菜单管理
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRangeStartDate((prev) => addDays(prev, -7))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                上周
              </Button>

              <div className="text-center">
                <p className="font-semibold">
                  {format(rangeStartDate, 'MMM d', { locale: zhCN })} -{' '}
                  {format(addDays(rangeStartDate, 6), 'MMM d, yyyy', { locale: zhCN })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  本周订单
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setRangeStartDate((prev) => addDays(prev, 7))}
              >
                下周
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Loading State */}
            {isFetching && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isFetching && groupedOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">这7天暂无订单</p>
                <Link href="/orders/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    创建订单
                  </Button>
                </Link>
              </div>
            )}

            {/* Orders by Date */}
            {!isFetching && groupedOrders.length > 0 && (
              <div className="space-y-6">
                {groupedOrders.map((group) => (
                  <div key={group.dateKey}>
                    {/* Date Badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDateBadgeColor(
                          group.date
                        )}`}
                      >
                        {format(group.date, 'EEE, MMM d', { locale: zhCN })}
                      </div>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Slot Groups */}
                    <div className="space-y-5">
                      {group.slotGroups.map((slotGroup) => (
                        <div key={slotGroup.slot} className="space-y-3">
                          {/* Slot Header */}
                          <div className="flex items-center gap-2">
                            <MealSlotBadge slot={slotGroup.slot as 'BREAKFAST' | 'LUNCH' | 'DINNER'} size="md" />
                            <span className="text-sm text-muted-foreground">
                              {slotGroup.orders.length} 人点餐
                            </span>
                          </div>

                          {/* Orders in this slot */}
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pl-2">
                            {slotGroup.orders.map((order) => (
                              <OrderCard
                                key={order.id}
                                order={order}
                                isCurrentUser={order.user.id === currentUserId}
                                isCancelling={
                                  cancelMutation.isPending &&
                                  cancelMutation.variables === order.id
                                }
                                onEdit={handleEditOrder}
                                onCancel={handleCancelOrder}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
