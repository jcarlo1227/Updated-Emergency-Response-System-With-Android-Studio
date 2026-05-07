import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { api } from '@/services/apiClient';
import { fmt, cn } from '@/lib/utils';
import type { AuditLog, AuditSeverity } from '@/types';

type ActorRoleFilter = 'all' | 'user' | 'responder' | 'admin' | 'system';
type SeverityFilter = 'all' | AuditSeverity;
type ModuleFilter = string;

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [actorRole, setActorRole] = useState<ActorRoleFilter>('all');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: modules } = useQuery({
    queryKey: ['audit-modules'],
    queryFn: async () => {
      const { data } = await api.get<{ data: string[] }>('/admin/audit-logs/modules');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { search, actorRole, severity, moduleFilter, from, to }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set('limit', '100');
      if (actorRole !== 'all') qs.set('actorRole', actorRole);
      if (severity !== 'all') qs.set('severity', severity);
      if (moduleFilter !== 'all') qs.set('module', moduleFilter);
      if (search.trim()) qs.set('search', search.trim());
      if (from) qs.set('from', new Date(from).toISOString());
      if (to) qs.set('to', new Date(to).toISOString());
      const { data } = await api.get<{ data: { items: AuditLog[]; total: number } }>(
        `/admin/audit-logs?${qs.toString()}`,
      );
      return data.data;
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <AdminShell title="Audit Logs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-6">
        <div className="lg:col-span-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, reason, or action…"
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="lg:col-span-2 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All modules</option>
          {(modules ?? []).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as SeverityFilter)}
          className="lg:col-span-2 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <select
          value={actorRole}
          onChange={(e) => setActorRole(e.target.value as ActorRoleFilter)}
          className="lg:col-span-3 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All actors</option>
          <option value="admin">Admin</option>
          <option value="responder">Responder</option>
          <option value="user">User</option>
          <option value="system">System</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="lg:col-span-3 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="From"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="lg:col-span-3 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="To"
        />
        <div className="lg:col-span-3 flex items-center justify-end text-xs text-slate-500">
          {!isLoading && `${items.length} of ${total} entries`}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="font-medium">No audit records found</p>
            <p className="text-sm mt-1">Try widening your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                  <th className="px-6 py-3 text-left w-44">Date / Time</th>
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-left w-28">Module</th>
                  <th className="px-6 py-3 text-left w-28">Severity</th>
                  <th className="px-6 py-3 text-left w-28">Actor</th>
                  <th className="px-6 py-3 text-left w-32">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((log) => (
                  <tr
                    key={log._id}
                    className={cn(
                      'hover:bg-slate-50 transition-colors',
                      log.severity === 'critical' && 'bg-red-50/30',
                    )}
                  >
                    <td className="px-6 py-3 text-slate-500 text-xs">{fmt(log.createdAt)}</td>
                    <td className="px-6 py-3">
                      <p className="text-slate-800 text-sm">{log.description ?? log.action}</p>
                      {log.reason && (
                        <p className="text-xs text-slate-500 mt-1">
                          <span className="font-semibold text-slate-600">Reason: </span>
                          {log.reason}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">{log.action}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700">
                        {log.module ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <SeverityBadge severity={log.severity ?? 'info'} />
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 capitalize">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-400 text-xs font-mono">
                      {log.targetType ? (
                        <>
                          {log.targetType}
                          {log.targetId ? ` · ${log.targetId.slice(-6)}` : ''}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  if (severity === 'critical') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-red-50 text-red-700 border border-red-200">
        <AlertTriangle className="w-3 h-3" /> Critical
      </span>
    );
  }
  if (severity === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertCircle className="w-3 h-3" /> Warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
      <Info className="w-3 h-3" /> Info
    </span>
  );
}
