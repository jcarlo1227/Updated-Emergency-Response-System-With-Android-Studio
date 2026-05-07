import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { CheckCircle, XCircle, Truck, ChevronLeft, Navigation, User as UserIcon, Flag } from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/services/apiClient';
import { getSocket } from '@/services/socketClient';
import { fmt } from '@/lib/utils';
import { TANZA_CENTER, TANZA_ZOOM } from '@/styles/tokens';
import type { AmbulanceRequest, AmbulanceUnit, Paginated, ResponderRegistration } from '@/types';

type StatusFilter = 'pending_review' | 'approved' | 'rejected' | 'assigned' | 'completed' | 'all';

const pickupIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const dropIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', iconSize: [25, 41], iconAnchor: [12, 41] });

export default function AmbulanceRequestsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending_review');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selected, setSelected] = useState<AmbulanceRequest | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [assignModal, setAssignModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedResponder, setSelectedResponder] = useState<string>('');

  const { data: listData, isLoading, refetch } = useQuery({
    queryKey: ['ambulance-requests', statusFilter, includeArchived],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      if (includeArchived) qs.set('includeArchived', 'true');
      const params = qs.toString() ? `?${qs.toString()}` : '';
      const { data } = await api.get<{ data: Paginated<AmbulanceRequest> }>(`/admin/ambulance-requests${params}`);
      return data.data;
    },
    refetchInterval: 30_000,
  });

  const { data: availableUnits } = useQuery({
    queryKey: ['ambulance-units-available'],
    queryFn: async () => {
      const { data } = await api.get<{ data: AmbulanceUnit[] }>('/admin/ambulance-requests/units/available');
      return data.data;
    },
    enabled: assignModal,
  });

  const { data: responders } = useQuery({
    queryKey: ['responders-list'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { items: ResponderRegistration[] } }>('/admin/registrations?type=responder&status=approved');
      return data.data.items;
    },
    enabled: assignModal,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => void refetch();
    socket.on('ambulance_request.created', handler);
    socket.on('ambulance_request.reviewed', handler);
    socket.on('ambulance_request.assigned', handler);
    socket.on('ambulance_request.completed', handler);
    return () => {
      socket.off('ambulance_request.created', handler);
      socket.off('ambulance_request.reviewed', handler);
      socket.off('ambulance_request.assigned', handler);
      socket.off('ambulance_request.completed', handler);
    };
  }, [refetch]);

  const approveMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/admin/ambulance-requests/${id}/approve`, { notes: 'Approved by admin' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['ambulance-requests'] }); setSelected((s) => s ? { ...s, status: 'approved' } : s); },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => api.post(`/admin/ambulance-requests/${id}/reject`, { reason }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['ambulance-requests'] }); setRejectModal(false); setSelected(null); },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, unitId, responderId }: { id: string; unitId: string; responderId: string }) =>
      api.post(`/admin/ambulance-requests/${id}/assign`, { ambulanceUnitId: unitId, responderId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ambulance-requests'] });
      void qc.invalidateQueries({ queryKey: ['ambulance-units-available'] });
      setAssignModal(false);
      setSelected(null);
    },
  });

  const transitionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: 'mark-on-the-way' | 'mark-picked-up' | 'mark-completed';
    }) => {
      const { data } = await api.post<{ data: AmbulanceRequest }>(
        `/admin/ambulance-requests/${id}/${action}`,
        {},
      );
      return data.data;
    },
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: ['ambulance-requests'] });
      setSelected(updated);
    },
  });

  const requests = listData?.items ?? [];

  if (selected) {
    const pickup = selected.pickupLocation.coordinates;
    const drop = selected.dropOffLocation.coordinates;
    return (
      <AdminShell
        title="Ambulance Request Detail"
        actions={
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ChevronLeft className="w-4 h-4" /> Back to list
          </button>
        }
      >
        {selected.isEmergencyPriority && (
          <div className="mb-4 bg-red-600 text-white rounded-2xl px-6 py-3 flex items-center gap-3 font-bold">
            <span className="animate-pulse">🚨</span>
            CRITICAL — Emergency Ambulance Request
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                Sender Information
                {selected.isTanzaCitizenPriority && (
                  <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5 font-bold">Tanza Priority</span>
                )}
              </h2>
              <dl className="space-y-3">
                <Row label="Full name" value={selected.senderSnapshot?.fullName} />
                <Row label="Age" value={selected.senderSnapshot?.age?.toString()} />
                <Row label="Blood type" value={selected.senderSnapshot?.bloodType} />
                <Row label="Municipality" value={selected.senderSnapshot?.municipality} />
                <Row label="Barangay" value={selected.senderSnapshot?.barangay} />
              </dl>
              {selected.outsideScopeFlag && (
                <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl p-3 font-semibold">
                  ⚠ Outside Tanza scope — requires admin decision
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-4">Status</h2>
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge status={selected.status} />
                <PriorityBadge priority={selected.isEmergencyPriority ? 'critical' : 'medium'} />
              </div>
              {selected.status === 'pending_review' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => approveMutation.mutate(selected._id)}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => setRejectModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
              {selected.status === 'approved' && (
                <button
                  onClick={() => setAssignModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold"
                >
                  <Truck className="w-4 h-4" /> Assign Ambulance Unit
                </button>
              )}
              {(['assigned', 'on_the_way', 'arrived_pickup', 'patient_onboard'] as const).includes(
                selected.status as 'assigned' | 'on_the_way' | 'arrived_pickup' | 'patient_onboard',
              ) && (
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'assigned' && (
                    <button
                      onClick={() =>
                        transitionMutation.mutate({ id: selected._id, action: 'mark-on-the-way' })
                      }
                      disabled={transitionMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      <Navigation className="w-4 h-4" /> Mark On the Way
                    </button>
                  )}
                  {(selected.status === 'assigned' ||
                    selected.status === 'on_the_way' ||
                    selected.status === 'arrived_pickup') && (
                    <button
                      onClick={() =>
                        transitionMutation.mutate({ id: selected._id, action: 'mark-picked-up' })
                      }
                      disabled={transitionMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      <UserIcon className="w-4 h-4" /> Mark Picked Up
                    </button>
                  )}
                  <button
                    onClick={() =>
                      transitionMutation.mutate({ id: selected._id, action: 'mark-completed' })
                    }
                    disabled={transitionMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    <Flag className="w-4 h-4" /> Mark Completed
                  </button>
                </div>
              )}
              {selected.rejectionReason && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                  <strong>Rejection reason:</strong> {selected.rejectionReason}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-4">Transport Form</h2>
              <div className="mb-3">
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full px-3 py-1 capitalize">
                  {selected.requestType} Transport
                </span>
              </div>
              <dl className="space-y-3">
                <Row label="Patient name" value={selected.patient.fullName} />
                <Row label="Contact" value={selected.patient.contactNumber} />
                <Row label="Address" value={selected.patient.address} />
                <Row label="Condition" value={selected.patient.medicalCondition} />
                {selected.patient.specialRequirements && <Row label="Special req." value={selected.patient.specialRequirements} />}
                {selected.accompanyingPerson && <Row label="Accompanying" value={`${selected.accompanyingPerson.fullName} · ${selected.accompanyingPerson.contactNumber}`} />}
                {selected.requestedDate && <Row label="Requested date" value={selected.requestedDate} />}
                {selected.requestedTime && <Row label="Requested time" value={selected.requestedTime} />}
              </dl>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm">Route Map</h2>
                <p className="text-xs text-slate-500 mt-1">
                  🟢 Pickup: {selected.pickupLocation.addressLabel}<br />
                  🔴 Drop-off: {selected.dropOffLocation.addressLabel}
                </p>
              </div>
              <div style={{ height: 240 }}>
                <MapContainer
                  center={[pickup[1], pickup[0]]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[pickup[1], pickup[0]]} icon={pickupIcon}>
                    <Popup>Pickup: {selected.pickupLocation.addressLabel}</Popup>
                  </Marker>
                  <Marker position={[drop[1], drop[0]]} icon={dropIcon}>
                    <Popup>Drop-off: {selected.dropOffLocation.addressLabel}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </div>
        </div>

        <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Reject Transport Request">
          <p className="text-slate-600 text-sm mb-4">Provide a reason for rejection. The applicant will be notified.</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Reason for rejection..."
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
          />
          <div className="flex gap-3 justify-end">
            <button onClick={() => setRejectModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700">Cancel</button>
            <button
              onClick={() => rejectReason.trim() && rejectMutation.mutate({ id: selected._id, reason: rejectReason.trim() })}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {rejectMutation.isPending ? 'Rejecting…' : 'Reject Request'}
            </button>
          </div>
        </Modal>

        <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Ambulance Unit" className="max-w-xl">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Available Ambulance Unit</label>
              {!availableUnits ? <p className="text-slate-400 text-sm">Loading units…</p> : availableUnits.length === 0 ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm font-medium">
                  No ambulance units available for this time range.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {availableUnits.map((unit) => (
                    <button
                      key={unit._id}
                      onClick={() => setSelectedUnit(unit._id)}
                      className={`p-3 rounded-xl border text-sm font-bold transition-colors ${
                        selectedUnit === unit._id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      Unit #{unit.unitNumber}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Responder</label>
              <select
                value={selectedResponder}
                onChange={(e) => setSelectedResponder(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Choose responder —</option>
                {(responders ?? []).map((r) => (
                  <option key={r._id} value={r._id}>{r.name} · {r.agencyType ?? r.department}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setAssignModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700">Cancel</button>
              <button
                onClick={() => selectedUnit && selectedResponder && assignMutation.mutate({ id: selected._id, unitId: selectedUnit, responderId: selectedResponder })}
                disabled={!selectedUnit || !selectedResponder || assignMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {assignMutation.isPending ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        </Modal>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Ambulance Requests">
      <div className="flex gap-2 flex-wrap items-center mb-6">
        {(['pending_review', 'approved', 'assigned', 'completed', 'rejected', 'all'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors capitalize ${
              statusFilter === s ? 'bg-[#0F172A] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
        {(statusFilter === 'rejected' || statusFilter === 'all') && (
          <label className="ml-auto flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show archived rejected (&gt; 31 days)
          </label>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? <TableSkeleton /> : requests.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No {statusFilter.replace('_', ' ')} requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Patient</th>
                  <th className="px-6 py-3 text-left">Sender</th>
                  <th className="px-6 py-3 text-left">Pickup</th>
                  <th className="px-6 py-3 text-left">Scheduled</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Submitted</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map((req) => (
                  <tr
                    key={req._id}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${req.isEmergencyPriority ? 'bg-red-50/40' : ''}`}
                    onClick={() => setSelected(req)}
                  >
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-2.5 py-0.5 capitalize ${
                        req.requestType === 'emergency' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {req.isEmergencyPriority && '🚨 '}{req.requestType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-medium">{req.patient.fullName}</td>
                    <td className="px-6 py-4 text-slate-500">{req.senderSnapshot?.fullName ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs max-w-[140px] truncate">{req.pickupLocation.addressLabel}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {req.requestedDate ? `${req.requestedDate.slice(0, 10)} ${req.requestedTime ?? ''}` : '—'}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{fmt(req.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(req); }}
                        className="px-3 py-1.5 bg-[#0F172A] text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
                      >
                        Open
                      </button>
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

function Row({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-4">
      <dt className="text-slate-400 text-xs w-28 flex-shrink-0 pt-0.5">{label}</dt>
      <dd className="text-slate-800 text-sm font-medium flex-1">{value}</dd>
    </div>
  );
}
