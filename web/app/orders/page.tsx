'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Search, X, Pencil, Ban } from 'lucide-react';
import { format, subDays, addDays, startOfDay, endOfDay, isBefore, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCalendarOrders, useCancelOrder } from '@/lib/hooks/use-orders';
import { MealSlotBadge } from '@/components/meal-slot-badge';
import type { MealSlot, OrderStatus } from '@/lib/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  PENDING: { label: '待确认', variant: 'default' },
  CONFIRMED: { label: '已确认', variant: 'secondary' },
  CANCELLED: { label: '已取消', variant: 'destructive' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(startOfDay(new Date()), 7),
    end: addDays(endOfDay(new Date()), 7),
  });
  const [selectedSlot, setSelectedSlot] = useState<MealSlot | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  const rangeStart = format(dateRange.start, 'yyyy-MM-dd');
  const rangeEnd = format(dateRange.end, 'yyyy-MM-dd');

  const { data: orders, isLoading } = useCalendarOrders(rangeStart, rangeEnd);
  const cancelMutation = useCancelOrder();

  // Filter and sort orders
  const filteredOrders = (orders?.filter((order) => {
    const matchesSlot = selectedSlot === 'ALL' || order.slot === selectedSlot;
    // 当选择 'ALL' 时，排除已取消的订单
    const matchesStatus = selectedStatus === 'ALL'
      ? order.status !== 'CANCELLED'
      : order.status === selectedStatus;
    const matchesSearch =
      searchQuery === '' ||
      order.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) =>
        item.dishName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSlot && matchesStatus && matchesSearch;
  }) || []).sort((a, b) => {
    // Sort by date (descending - latest first)
    const dateA = new Date(a.mealDate).getTime();
    const dateB = new Date(b.mealDate).getTime();
    if (dateA !== dateB) {
      return dateB - dateA;
    }

    // If same date, sort by meal slot (BREAKFAST -> LUNCH -> DINNER)
    const slotOrder = { BREAKFAST: 0, LUNCH: 1, DINNER: 2 };
    return slotOrder[a.slot] - slotOrder[b.slot];
  });

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelMutation.mutateAsync(orderId);
      toast.success('订单已取消');
    } catch (error: unknown) {
      console.error(error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || '取消失败，请稍后重试';
      toast.error(message);
    }
  };

  const clearFilters = () => {
    setSelectedSlot('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
  };

  const hasFilters = selectedSlot !== 'ALL' || selectedStatus !== 'ALL' || searchQuery !== '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">订单管理</h1>
            <Link href="/orders/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新订单
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>订单列表</CardTitle>
            <CardDescription>查看和管理所有订单</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="space-y-4 mb-6">
              {/* Date Range Picker */}
              <div className="flex flex-wrap gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.start, 'yyyy/MM/dd')} - {format(dateRange.end, 'yyyy/MM/dd')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDateRange({
                              start: subDays(startOfDay(new Date()), 7),
                              end: endOfDay(new Date()),
                            })
                          }
                        >
                          过去7天
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDateRange({
                              start: subDays(startOfDay(new Date()), 30),
                              end: endOfDay(new Date()),
                            })
                          }
                        >
                          过去30天
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDateRange({
                              start: startOfDay(new Date()),
                              end: addDays(endOfDay(new Date()), 7),
                            })
                          }
                        >
                          未来7天
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Slot and Status Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Tabs value={selectedSlot} onValueChange={(value) => setSelectedSlot(value as MealSlot | 'ALL')}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="ALL">全部</TabsTrigger>
                      <TabsTrigger value="BREAKFAST">早餐</TabsTrigger>
                      <TabsTrigger value="LUNCH">中餐</TabsTrigger>
                      <TabsTrigger value="DINNER">晚餐</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as OrderStatus | 'ALL')}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="订单状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全部状态</SelectItem>
                    <SelectItem value="PENDING">待确认</SelectItem>
                    <SelectItem value="CONFIRMED">已确认</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search and Clear */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索用户名或菜品..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {hasFilters && (
                  <Button variant="ghost" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    清除筛选
                  </Button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {hasFilters ? '未找到匹配的订单' : '暂无订单'}
                </p>
                <Link href="/orders/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    创建订单
                  </Button>
                </Link>
              </div>
            )}

            {/* Orders List */}
            {!isLoading && filteredOrders.length > 0 && (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const orderDate = startOfDay(parseISO(order.mealDate));
                  const today = startOfDay(new Date());
                  const isEditable = !isBefore(orderDate, today);
                  const canModify = order.status !== 'CANCELLED' && isEditable;

                  return (
                    <div
                      key={order.id}
                      className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <MealSlotBadge slot={order.slot} />
                          <Badge variant={STATUS_CONFIG[order.status].variant}>
                            {STATUS_CONFIG[order.status].label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(order.mealDate), 'yyyy年MM月dd日', { locale: zhCN })}
                          </span>
                          {!isEditable && (
                            <span className="text-xs text-muted-foreground italic">
                              (已过期)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {canModify && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/orders/new?edit=${order.id}`)}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                编辑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancelMutation.isPending && cancelMutation.variables === order.id}
                                className="text-destructive hover:text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                {cancelMutation.isPending && cancelMutation.variables === order.id
                                  ? '取消中...'
                                  : '取消'}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">用户:</span>
                        <span>{order.user.displayName}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">菜品:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {order.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs"
                            >
                              {item.dishName} × {item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                      {order.notes && (
                        <div className="text-sm">
                          <span className="font-medium">备注:</span>
                          <span className="ml-2 text-muted-foreground">{order.notes}</span>
                        </div>
                      )}
                    </div>
                    </div>
                  );
                })}

                <div className="mt-4 text-center text-sm text-muted-foreground">
                  共 {filteredOrders.length} 个订单
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
