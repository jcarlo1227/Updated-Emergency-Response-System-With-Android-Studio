import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, User } from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { StatusBadge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/services/apiClient';
import type { Emergency, Paginated, ResponderLiveLocation } from '@/types';

export default function DispatchPage() {
  const qc = useQueryClient();
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [selectedResponder, setSelectedResponder] = useState<string>('');

  const { data: emergencies, isLoading: emLoading } = useQuery({
    queryKey: ['dispatch-emergencies'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Paginated<Emergency> }>('/emergencies/active?limit=50');
      return data.data.items.filter((e) => e.status === 'pending');
    },
    refetchInterval: 15_000,
  });

  const { data: responders, isLoading: rLoading } = useQuery({
    queryKey: ['responders-live'],
    queryFn: async () => {
      const { data } = await api.get<{ data: ResponderLiveLocation[] }>('/responders/locations/live');
      return data.data;
    },
    refetchInterval: 15_000,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ emergencyId, responderId }: { emergencyId: string; responderId: string }) =>
      api.post(`/emergencies/${emergencyId}/assign`, { responderId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dispatch-emergencies'] });
      setSelectedEmergency(null);
      setSelectedResponder('');
    },
  });

  return (
    <AdminShell title="Dispatch">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-slate-900">Unassigned Emergencies</h2>
          </div>
          {emLoading ? <TableSkeleton /> : (
            <div className="divide-y divide-slate-50">
              {(emergencies ?? []).length === 0 ? (
                <p className="p-8 text-center text-slate-400">No pending emergencies to dispatch</p>
              ) : (emergencies ?? []).map((em) => (
                <button
                  key={em._id}
                  onClick={() => setSelectedEmergency(em)}
                  className={`w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors ${selectedEmergency?._id === em._id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-900 capitalize">{em.type.replace('_', ' ')}</span>
                    <StatusBadge status={em.priority} />
                  </div>
                  <p className="text-xs text-slate-500">{em.barangay ?? 'Tanza'}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-slate-900">Available Responders</h2>
          </div>
          {rLoading ? <TableSkeleton /> : (
            <div className="divide-y divide-slate-50">
              {(responders ?? []).length === 0 ? (
                <p className="p-8 text-center text-slate-400">No on-duty responders found</p>
              ) : (responders ?? []).map((r) => (
                <div key={r.responderId} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.agencyType?.toUpperCase() ?? '—'} · {r.dutyStatus}</p>
                  </div>
                  <button
                    onClick={() => selectedEmergency && assignMutation.mutate({ emergencyId: selectedEmergency._id, responderId: r.responderId })}
                    disabled={!selectedEmergency || assignMutation.isPending}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-40"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEmergency && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 text-sm">
          <strong className="text-blue-900">Selected for dispatch:</strong>{' '}
          <span className="text-blue-700 capitalize">{selectedEmergency.type.replace('_', ' ')} — {selectedEmergency.barangay ?? 'Tanza'}</span>
          <span className="text-blue-500 ml-4">Click a responder's Assign button to dispatch.</span>
        </div>
      )}
    </AdminShell>
  );
}
