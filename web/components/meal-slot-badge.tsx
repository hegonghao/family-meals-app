import type { MealSlot } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MealSlotBadgeProps {
  slot: MealSlot;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SLOT_CONFIG: Record<MealSlot, { label: string; bgColor: string; textColor: string }> = {
  BREAKFAST: {
    label: '早餐',
    bgColor: 'bg-amber-500',
    textColor: 'text-white'
  },
  LUNCH: {
    label: '午餐',
    bgColor: 'bg-blue-500',
    textColor: 'text-white'
  },
  DINNER: {
    label: '晚餐',
    bgColor: 'bg-indigo-600',
    textColor: 'text-white'
  },
};

export function MealSlotBadge({ slot, size = 'sm', className }: MealSlotBadgeProps) {
  const config = SLOT_CONFIG[slot];

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}
