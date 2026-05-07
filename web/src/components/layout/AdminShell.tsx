import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { NotificationCenterButton } from '@/features/notifications/NotificationCenterButton';

interface AdminShellProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function AdminShell({ children, title, actions }: AdminShellProps) {
  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#F8FAFC] border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          {title ? (
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            {actions}
            <NotificationCenterButton />
          </div>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
