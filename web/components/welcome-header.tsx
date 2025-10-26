'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRandomPoem } from '@/lib/hooks/use-poems';
import { Sun, Moon, Cloud } from 'lucide-react';

interface WelcomeHeaderProps {
  displayName: string;
}

export function WelcomeHeader({ displayName }: WelcomeHeaderProps) {
  const { data: poem, isLoading } = useRandomPoem();

  // 根据时间显示不同的问候语和图标
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { text: '夜深了', icon: Moon };
    if (hour < 12) return { text: '早上好', icon: Sun };
    if (hour < 18) return { text: '下午好', icon: Cloud };
    return { text: '晚上好', icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <GreetingIcon className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">
              {greeting.text}，{displayName}！
            </h2>

            {isLoading ? (
              <div className="space-y-2 mt-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : poem ? (
              <p className="text-sm text-muted-foreground mt-2 italic">
                {poem.text}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                欢迎使用家庭餐饮管理系统
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
