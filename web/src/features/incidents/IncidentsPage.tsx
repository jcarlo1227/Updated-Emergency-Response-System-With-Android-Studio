import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, MapPin, CheckCircle } from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { StatusBadge, TypeBadge, PriorityBadge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/services/apiClient';
import { getSocket } from '@/services/socketClient';
import { fmt } from '@/lib/utils';
import type { Emergency, Paginated } from '@/types';

const FILTERS = ['all', 'critical', 'medical', 'fire', 'crime', 'general_sos'] as const;
type Filter = (typeof FILTERS)[number];

export default function IncidentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [resolveModal, setResolveModal] = useState<{ open: boolean; id: string; type: string } | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['active-emergencies-full', filter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (filter !== 'all' && filter !== 'critical') params.set('type', filter);
      const { data } = await api.get<{ data: Paginated<Emergency> }>(`/emergencies/active?${params}`);
      let items = data.data.items;
      if (filter === 'critical') items = items.filter((e) => e.priority === 'critical');
      return items;
    },
    refetchInterval: 20_000,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => void refetch();
    socket.on('emergency.created', handler);
    socket.on('emergency.updated', handler);
    socket.on('emergency.resolved', handler);
    socket.on('emergency.iot_keychain_created', handler);
    return () => {
      socket.off('emergency.created', handler);
      socket.off('emergency.updated', handler);
      socket.off('emergency.resolved', handler);
      socket.off('emergency.iot_keychain_created', handler);
    };
  }, [refetch]);

  const resolveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      await api.post(`/admin/emergencies/${id}/resolve`, { resolutionNotes: notes });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['active-emergencies-full'] });
      setResolveModal(null);
      setResolveNotes('');
    },
  });

  const emergencies = data ?? [];

  return (
    <AdminShell title="Live Incidents">
      <div className="space-y-6">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors capitalize ${
                filter === f ? 'bg-[#0F172A] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f === 'general_sos' ? 'SOS' : f === 'all' ? `All (${emergencies.length})` : f}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <TableSkeleton />
          ) : emergencies.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No active incidents</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Priority</th>
                    <th className="px-6 py-3 text-left">Source</th>
                    <th className="px-6 py-3 text-left">Location</th>
                    <th className="px-6 py-3 text-left">Scope</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Time</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {emergencies.map((em) => (
                    <tr
                      key={em._id}
                      className={`hover:bg-slate-50 transition-colors ${em.priority === 'critical' ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <TypeBadge type={em.type} source={em.source} />
                      </td>
                      <td className="px-6 py-4"><PriorityBadge priority={em.priority} /></td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {em.source === 'iot_keychain' ? (
                          <span className="text-blue-600 font-semibold">IoT Keychain</span>
                        ) : (
                          'Mobile App'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs">
                            {em.barangay ?? `${em.currentLocation.coordinates[1].toFixed(4)}, ${em.currentLocation.coordinates[0].toFixed(4)}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {em.outsideScopeFlag ? (
                          <span className="text-amber-600 text-xs font-bold">⚠ Outside</span>
                        ) : (
                          <span className="text-green-600 text-xs font-bold">✓ Tanza</span>
                        )}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={em.status} /></td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{fmt(em.createdAt)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setResolveModal({ open: true, id: em._id, type: em.type })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={resolveModal?.open ?? false}
        onClose={() => setResolveModal(null)}
        title="Resolve Emergency"
      >
        <p className="text-slate-600 text-sm mb-4">
          Mark this <strong className="capitalize">{resolveModal?.type?.replace('_', ' ')}</strong> emergency as resolved? This action is permanent.
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Resolution notes (optional)</label>
          <textarea
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            rows={3}
            placeholder="Describe how the emergency was resolved..."
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setResolveModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => resolveModal && resolveMutation.mutate({ id: resolveModal.id, notes: resolveNotes || undefined })}
            disabled={resolveMutation.isPending}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {resolveMutation.isPending ? 'Resolving…' : 'Confirm Resolve'}
          </button>
        </div>
      </Modal>
    </AdminShell>
  );
}
