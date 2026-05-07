import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'red' | 'green' | 'amber' | 'blue' | 'navy' | 'outline';

const variants: Record<Variant, string> = {
  default: 'bg-slate-100 text-slate-700',
  red: 'bg-red-50 text-red-700 border border-red-200',
  green: 'bg-green-50 text-green-700 border border-green-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border border-blue-200',
  navy: 'bg-[#0F172A] text-white',
  outline: 'border border-slate-300 text-slate-600',
};

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold', variants[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    pending: { label: 'Pending', variant: 'amber' },
    pending_review: { label: 'Pending Review', variant: 'amber' },
    approved: { label: 'Approved', variant: 'green' },
    rejected: { label: 'Rejected', variant: 'red' },
    assigned: { label: 'Assigned', variant: 'blue' },
    on_the_way: { label: 'On the Way', variant: 'blue' },
    responder_on_the_way: { label: 'On the Way', variant: 'blue' },
    arrived_pickup: { label: 'Arrived', variant: 'green' },
    patient_onboard: { label: 'Patient Onboard', variant: 'blue' },
    completed: { label: 'Completed', variant: 'green' },
    resolved: { label: 'Resolved', variant: 'green' },
    cancelled: { label: 'Cancelled', variant: 'red' },
    off_duty: { label: 'Off Duty', variant: 'outline' },
    on_duty: { label: 'On Duty', variant: 'green' },
    busy: { label: 'Busy', variant: 'amber' },
  };
  const cfg = map[status] ?? { label: status, variant: 'default' as Variant };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    critical: { label: 'CRITICAL', variant: 'red' },
    high: { label: 'HIGH', variant: 'amber' },
    medium: { label: 'MEDIUM', variant: 'blue' },
    low: { label: 'LOW', variant: 'outline' },
  };
  const cfg = map[priority] ?? { label: priority.toUpperCase(), variant: 'default' as Variant };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function TypeBadge({ type, source }: { type: string; source?: string }) {
  const label = type === 'medical' ? 'Medical'
    : type === 'crime' ? 'Crime'
    : type === 'fire' ? 'Fire'
    : type === 'general_sos' ? 'SOS'
    : type;
  const variant: Variant = type === 'medical' ? 'red'
    : type === 'fire' ? 'amber'
    : type === 'crime' ? 'navy'
    : 'outline';
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant={variant}>{label}</Badge>
      {source === 'iot_keychain' && (
        <Badge variant="blue" className="text-[10px]">IoT</Badge>
      )}
    </div>
  );
}
