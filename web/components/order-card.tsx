'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MealSlotBadge } from './meal-slot-badge';
import type { Order } from '@/lib/types';
import { Edit, X, Loader2 } from 'lucide-react';
import { parseISO, isBefore, startOfDay } from 'date-fns';

interface OrderCardProps {
  order: Order;
  onEdit?: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
  isCurrentUser?: boolean;
  isCancelling?: boolean;
}

export function OrderCard({
  order,
  onEdit,
  onCancel,
  isCurrentUser = false,
  isCancelling = false,
}: OrderCardProps) {
  const orderDate = startOfDay(parseISO(order.mealDate));
  const today = startOfDay(new Date());
  const isEditable = !isBefore(orderDate, today);
  const showActions = isCurrentUser && isEditable;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MealSlotBadge slot={order.slot} />
            <span className="text-sm font-medium text-muted-foreground">
              {order.user.displayName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {order.status === 'CANCELLED' && (
              <Badge variant="destructive">已取消</Badge>
            )}
            {order.status === 'CONFIRMED' && (
              <Badge variant="default">已确认</Badge>
            )}
            {order.status === 'PENDING' && (
              <Badge variant="secondary">待确认</Badge>
            )}

            {showActions && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit?.(order.id)}
                  disabled={isCancelling}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onCancel?.(order.id)}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {order.items.length > 0 ? (
          <div className="text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-baseline gap-1">
                <span className="text-muted-foreground">•</span>
                <span className="font-medium">{item.dishName || item.dish?.name}</span>
                <span className="text-muted-foreground">×{item.quantity}</span>
                {item.specialInstruction && (
                  <span className="text-xs text-muted-foreground italic">
                    ({item.specialInstruction})
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无菜品</p>
        )}

        {order.notes && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            📝 {order.notes}
          </p>
        )}

        {!isEditable && isCurrentUser && (
          <p className="text-xs text-muted-foreground italic pt-2">
            过去的订单
          </p>
        )}
      </CardContent>
    </Card>
  );
}
