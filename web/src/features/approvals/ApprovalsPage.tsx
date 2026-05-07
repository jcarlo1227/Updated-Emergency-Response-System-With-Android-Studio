import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import { CheckCircle, XCircle, User, Shield, Eye } from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { StatusBadge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/services/apiClient';
import { fmt } from '@/lib/utils';
import type { UserRegistration, ResponderRegistration } from '@/types';
import { ApprovalDetailsModal } from './ApprovalDetailsModal';

type AccountType = 'user' | 'responder';
type StatusFilter = 'pending' | 'approved' | 'rejected';

function useRegistrations(type: AccountType, status: StatusFilter) {
  return useQuery({
    queryKey: ['registrations', type, status],
    queryFn: async () => {
      const { data } = await api.get<{ data: { items: (UserRegistration | ResponderRegistration)[] } }>(
        `/admin/registrations?type=${type}&status=${status}`,
      );
      return data.data.items;
    },
  });
}

interface ActionModalState {
  open: boolean;
  action: 'approve' | 'reject' | null;
  id: string;
  type: AccountType;
  name: string;
}

export default function ApprovalsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<AccountType>('user');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [modal, setModal] = useState<ActionModalState>({ open: false, action: null, id: '', type: 'user', name: '' });
  const [reason, setReason] = useState('');
  const [actionErr, setActionErr] = useState('');
  const [details, setDetails] = useState<{ open: boolean; id: string; type: AccountType }>({ open: false, id: '', type: 'user' });

  const { data: list, isLoading } = useRegistrations(tab, statusFilter);

  const mutation = useMutation({
    mutationFn: async ({ id, action, type, reason }: { id: string; action: 'approve' | 'reject'; type: AccountType; reason?: string }) => {
      if (action === 'approve') {
        await api.post(`/admin/registrations/${id}/approve`, { type });
      } else {
        await api.post(`/admin/registrations/${id}/reject`, { type, reason });
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['registrations'] });
      setModal({ open: false, action: null, id: '', type: 'user', name: '' });
      setReason('');
      setActionErr('');
    },
    onError: (e: unknown) => {
      setActionErr((e as Error).message ?? 'Action failed');
    },
  });

  const openModal = (id: string, action: 'approve' | 'reject', type: AccountType, name: string) => {
    setReason('');
    setActionErr('');
    setModal({ open: true, action, id, type, name });
  };

  const openDetails = (id: string, type: AccountType) => {
    setDetails({ open: true, id, type });
  };

  const confirm = () => {
    if (!modal.action || !modal.id) return;
    if (modal.action === 'reject' && !reason.trim()) { setActionErr('Rejection reason is required.'); return; }
    mutation.mutate({ id: modal.id, action: modal.action, type: modal.type, reason: reason.trim() || undefined });
  };

  return (
    <AdminShell title="Approval Center">
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as AccountType)}>
        <div className="flex items-center justify-between mb-6">
          <Tabs.List className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <Tabs.Trigger value="user" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500 transition-all">
              <User className="w-4 h-4" /> Users
            </Tabs.Trigger>
            <Tabs.Trigger value="responder" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500 transition-all">
              <Shield className="w-4 h-4" /> Responders
            </Tabs.Trigger>
          </Tabs.List>

          <div className="flex gap-2">
            {(['pending', 'approved', 'rejected'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                  statusFilter === s ? 'bg-[#0F172A] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {(['user', 'responder'] as AccountType[]).map((t) => (
          <Tabs.Content key={t} value={t}>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {isLoading ? (
                <TableSkeleton />
              ) : !list || list.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No {statusFilter} {t} registrations</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">Email</th>
                      {t === 'responder' && <th className="px-6 py-3 text-left">Agency</th>}
                      <th className="px-6 py-3 text-left">Location</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Registered</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {list.map((item) => {
                      const resp = item as ResponderRegistration;
                      const usr = item as UserRegistration;
                      return (
                        <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                          <td className="px-6 py-4 text-slate-500">{item.email}</td>
                          {t === 'responder' && (
                            <td className="px-6 py-4 text-slate-500">
                              {resp.agencyType?.toUpperCase() ?? '—'}{resp.stationName ? ` · ${resp.stationName}` : ''}
                            </td>
                          )}
                          <td className="px-6 py-4 text-slate-500">
                            {t === 'user' ? (usr.barangay ?? '—') : (resp.coverageArea ?? '—')}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={item.approvalStatus} />
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{fmt(item.createdAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openDetails(item._id, t)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> Open
                              </button>
                              {statusFilter === 'pending' && (
                                <>
                                  <button
                                    onClick={() => openModal(item._id, 'approve', t, item.name)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button
                                    onClick={() => openModal(item._id, 'reject', t, item.name)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>

      <ApprovalDetailsModal
        open={details.open}
        onClose={() => setDetails((d) => ({ ...d, open: false }))}
        id={details.id}
        type={details.type}
        isPending={statusFilter === 'pending'}
        onApprove={(id, type, name) => {
          setDetails((d) => ({ ...d, open: false }));
          openModal(id, 'approve', type, name);
        }}
        onReject={(id, type, name) => {
          setDetails((d) => ({ ...d, open: false }));
          openModal(id, 'reject', type, name);
        }}
      />

      <Modal
        open={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        title={modal.action === 'approve' ? 'Confirm Approval' : 'Reject Registration'}
      >
        <p className="text-slate-600 text-sm mb-4">
          {modal.action === 'approve'
            ? `Approve ${modal.name}'s registration? They will be able to log in immediately.`
            : `Reject ${modal.name}'s registration?`}
        </p>
        {modal.action === 'reject' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Rejection reason (required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why this application is being rejected..."
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}
        {actionErr && <p className="text-red-600 text-sm mb-3">{actionErr}</p>}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setModal((m) => ({ ...m, open: false }))}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={mutation.isPending}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 ${
              modal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {mutation.isPending ? 'Processing…' : modal.action === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </Modal>
    </AdminShell>
  );
}
