import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  urgent?: boolean;
}

export function StatCard({ label, value, icon, trend, urgent }: StatCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4',
      urgent && 'border-red-200 bg-red-50',
    )}>
      {icon && (
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
          urgent ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600',
        )}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-slate-500 font-medium truncate">{label}</p>
        <p className={cn(
          'text-3xl font-black mt-1',
          urgent ? 'text-red-600' : 'text-slate-900',
        )}>
          {value}
        </p>
        {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
      </div>
    </div>
  );
}
