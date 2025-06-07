'use client';

import { useState, useEffect } from 'react';
import { Zap, Calendar, Briefcase, BookOpen, MessageCircle, Plus, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardService } from '@/lib/services/dashboard';
import type { QuickAction } from '@/types/dashboard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface QuickActionsProps {
  userId: string;
  className?: string;
}

export function QuickActions({ userId, className }: QuickActionsProps) {
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadQuickActions();
  }, [userId]);

  const loadQuickActions = async () => {
    setIsLoading(true);
    try {
      const data = await DashboardService.getQuickActions(userId);
      setActions(data);
    } catch (error) {
      console.error('Failed to load quick actions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (icon?: string) => {
    switch (icon) {
      case 'Calendar':
        return <Calendar className="h-5 w-5" />;
      case 'Briefcase':
        return <Briefcase className="h-5 w-5" />;
      case 'BookOpen':
        return <BookOpen className="h-5 w-5" />;
      case 'MessageCircle':
        return <MessageCircle className="h-5 w-5" />;
      case 'Settings':
        return <Settings className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const getActionColor = (color?: string) => {
    const colorMap: Record<string, string> = {
      teal: 'bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700',
      blue: 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
      purple: 'bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700',
      green: 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
      orange: 'bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700',
    };
    return colorMap[color || 'teal'] || colorMap.teal;
  };

  const handleAction = (action: QuickAction) => {
    switch (action.action_type) {
      case 'link':
        router.push(action.action_target);
        break;
      case 'function':
        // Handle function actions (e.g., open modal, trigger action)
        console.log('Function action:', action.action_target);
        break;
      case 'modal':
        // Handle modal actions
        console.log('Modal action:', action.action_target);
        break;
    }
  };

  return (
    <Card className={cn("bg-slate-800 border-slate-700", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-teal-400" />
          <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          className="text-slate-400 hover:text-white"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
          </div>
        ) : actions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No quick actions configured</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {action.action_type === 'link' ? (
                  <Link href={action.action_target}>
                    <Button
                      className={cn(
                        "w-full h-24 flex flex-col items-center justify-center gap-2 text-white shadow-lg",
                        getActionColor(action.color)
                      )}
                    >
                      {getActionIcon(action.icon)}
                      <span className="text-xs font-medium">
                        {action.action_name}
                      </span>
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={() => handleAction(action)}
                    className={cn(
                      "w-full h-24 flex flex-col items-center justify-center gap-2 text-white shadow-lg",
                      getActionColor(action.color)
                    )}
                  >
                    {getActionIcon(action.icon)}
                    <span className="text-xs font-medium">
                      {action.action_name}
                    </span>
                  </Button>
                )}
              </motion.div>
            ))}
            
            {/* Add new action button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: actions.length * 0.1 }}
            >
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 border-dashed"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs font-medium">Add Action</span>
              </Button>
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
