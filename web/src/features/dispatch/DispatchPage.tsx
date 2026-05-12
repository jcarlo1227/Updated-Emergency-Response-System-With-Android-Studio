import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, User, CheckCircle, AlertCircle } from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { StatusBadge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { api, getApiError } from '@/services/apiClient';
import type { Emergency, Paginated, ResponderLiveLocation } from '@/types';

const AVAILABLE_STATUSES = new Set(['on_duty', 'available']);

export default function DispatchPage() {
  const qc = useQueryClient();
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [selectedResponder, setSelectedResponder] = useState<string>('');
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

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
      const em = selectedEmergency;
      setSelectedEmergency(null);
      setSelectedResponder('');
      setDispatchError(null);
      setDispatchSuccess(
        `Dispatched ${em?.type.replace('_', ' ') ?? 'emergency'} successfully.`,
      );
      setTimeout(() => setDispatchSuccess(null), 4000);
    },
    onError: (err) => {
      setDispatchError(getApiError(err));
    },
  });

  return (
    <AdminShell title="Dispatch">
      {dispatchSuccess && (
        <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3 text-sm text-green-800 font-semibold">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          {dispatchSuccess}
        </div>
      )}
      {dispatchError && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-sm text-red-700 font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          {dispatchError}
          <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setDispatchError(null)}>✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned emergencies */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-slate-900">Unassigned Emergencies</h2>
            {(emergencies?.length ?? 0) > 0 && (
              <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold rounded-full px-2.5 py-0.5">
                {emergencies?.length}
              </span>
            )}
          </div>
          {emLoading ? <TableSkeleton /> : (
            <div className="divide-y divide-slate-50">
              {(emergencies ?? []).length === 0 ? (
                <p className="p-8 text-center text-slate-400">No pending emergencies to dispatch</p>
              ) : (emergencies ?? []).map((em) => (
                <button
                  key={em._id}
                  onClick={() => { setSelectedEmergency(em); setDispatchError(null); }}
                  className={`w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors ${selectedEmergency?._id === em._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
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

        {/* Available responders */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-slate-900">On-Duty Responders</h2>
            {!rLoading && (
              <span className="ml-auto text-xs text-slate-400">
                {(responders ?? []).filter((r) => AVAILABLE_STATUSES.has(r.dutyStatus ?? '')).length} available
              </span>
            )}
          </div>
          {rLoading ? <TableSkeleton /> : (
            <div className="divide-y divide-slate-50">
              {(responders ?? []).length === 0 ? (
                <p className="p-8 text-center text-slate-400">No on-duty responders found</p>
              ) : (responders ?? []).map((r) => {
                const isAvailable = AVAILABLE_STATUSES.has(r.dutyStatus ?? '');
                return (
                  <div key={r.responderId} className={`px-6 py-4 flex items-center justify-between ${!isAvailable ? 'opacity-50' : ''}`}>
                    <div>
                      <p className="font-medium text-sm text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500">
                        {r.agencyType?.toUpperCase() ?? '—'}
                        <span className={`ml-2 font-semibold ${isAvailable ? 'text-green-600' : 'text-amber-500'}`}>
                          · {r.dutyStatus ?? 'unknown'}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (!selectedEmergency) {
                          setDispatchError('Select an emergency first.');
                          return;
                        }
                        assignMutation.mutate({
                          emergencyId: selectedEmergency._id,
                          responderId: r.responderId,
                        });
                      }}
                      disabled={!isAvailable || assignMutation.isPending}
                      title={!isAvailable ? `Responder is ${r.dutyStatus}` : undefined}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {assignMutation.isPending ? 'Dispatching…' : 'Assign'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedEmergency && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 text-sm flex items-center gap-3">
          <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span>
            <strong className="text-blue-900">Selected:</strong>{' '}
            <span className="text-blue-700 capitalize">{selectedEmergency.type.replace('_', ' ')} — {selectedEmergency.barangay ?? 'Tanza'}</span>
          </span>
          <span className="text-blue-400 ml-2">Click a responder's Assign button to dispatch.</span>
          <button onClick={() => setSelectedEmergency(null)} className="ml-auto text-blue-400 hover:text-blue-600 text-xs">Clear</button>
        </div>
      )}
    </AdminShell>
  );
}
