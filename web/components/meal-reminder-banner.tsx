'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useMissingMeals } from '@/lib/hooks/use-missing-meals';
import type { MealSlot } from '@/lib/types';
import { UtensilsCrossed, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const SLOT_NAMES: Record<MealSlot, string> = {
  BREAKFAST: '早餐',
  LUNCH: '中餐',
  DINNER: '晚餐',
};

export function MealReminderBanner() {
  const { data, isLoading } = useMissingMeals();

  // 不显示横幅的情况
  if (isLoading || !data || data.allOrdered) {
    return null;
  }

  const { missingSlots } = data;

  // 构建提醒文本
  const getReminderText = (): string => {
    if (missingSlots.length === 0) return '';
    if (missingSlots.length === 3) {
      return '您还未点明天的早餐、中餐和晚餐';
    }
    if (missingSlots.length === 2) {
      const [first, second] = missingSlots.map((slot) => SLOT_NAMES[slot]);
      return `您还未点明天的${first}和${second}`;
    }
    return `您还未点明天的${SLOT_NAMES[missingSlots[0]]}`;
  };

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
      <UtensilsCrossed className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      <AlertTitle className="text-orange-900 dark:text-orange-100 font-semibold">
        餐次提醒
      </AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-orange-200 mt-2">
        <div className="flex items-center justify-between gap-4">
          <span>{getReminderText()}</span>
          <Link href="/orders/new">
            <Button
              variant="outline"
              size="sm"
              className="border-orange-300 hover:bg-orange-100 dark:border-orange-800 dark:hover:bg-orange-900/50"
            >
              立即点餐
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}
