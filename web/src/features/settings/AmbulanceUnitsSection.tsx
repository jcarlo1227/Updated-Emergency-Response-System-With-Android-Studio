import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Truck,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { api, getApiError } from '@/services/apiClient';
import { cn } from '@/lib/utils';
import type { AmbulanceUnitOption, ResponderRegistration } from '@/types';

type AmbulanceUnitDetail = AmbulanceUnitOption & {
  unitType?: 'bls' | 'als' | 'patient_transport' | 'rescue' | 'other';
  assignedDriverId?: string;
  notes?: string;
  activeRequestId?: string;
};

const UNIT_TYPES: { value: NonNullable<AmbulanceUnitDetail['unitType']>; label: string }[] = [
  { value: 'bls', label: 'BLS — Basic Life Support' },
  { value: 'als', label: 'ALS — Advanced Life Support' },
  { value: 'patient_transport', label: 'Patient Transport' },
  { value: 'rescue', label: 'Rescue' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS: { value: AmbulanceUnitDetail['availabilityStatus']; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'maintenance', label: 'Under Maintenance' },
  { value: 'out_of_service', label: 'Inactive' },
];

interface FormState {
  unitNumber: string;
  unitName: string;
  plateNumber: string;
  unitType: AmbulanceUnitDetail['unitType'] | '';
  availabilityStatus: AmbulanceUnitDetail['availabilityStatus'];
  assignedDriverId: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  unitNumber: '',
  unitName: '',
  plateNumber: '',
  unitType: '',
  availabilityStatus: 'available',
  assignedDriverId: '',
  notes: '',
};

export function AmbulanceUnitsSection() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<AmbulanceUnitDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<AmbulanceUnitDetail | null>(null);

  const { data: units, isLoading } = useQuery({
    queryKey: ['ambulance-units'],
    queryFn: async () => {
      const { data } = await api.get<{ data: AmbulanceUnitDetail[] }>('/admin/ambulance-units');
      return data.data;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ['responders-list-approved'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { items: ResponderRegistration[] } }>(
        '/admin/registrations?type=responder&status=approved',
      );
      return data.data.items;
    },
    enabled: creating || !!editing,
    staleTime: 60_000,
  });

  const isOpen = creating || !!editing;
  const closeModal = () => {
    if (saveMutation.isPending) return;
    setCreating(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setCreating(true);
  };

  const openEdit = (u: AmbulanceUnitDetail) => {
    setForm({
      unitNumber: String(u.unitNumber ?? ''),
      unitName: u.unitName ?? '',
      plateNumber: u.plateNumber ?? '',
      unitType: u.unitType ?? '',
      availabilityStatus: u.availabilityStatus,
      assignedDriverId: u.assignedDriverId ?? '',
      notes: u.notes ?? '',
    });
    setFormError('');
    setEditing(u);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        availabilityStatus: form.availabilityStatus,
      };
      if (form.unitNumber.trim()) payload.unitNumber = Number(form.unitNumber);
      if (form.unitName.trim()) payload.unitName = form.unitName.trim();
      if (form.plateNumber.trim()) payload.plateNumber = form.plateNumber.trim().toUpperCase();
      if (form.unitType) payload.unitType = form.unitType;
      if (form.assignedDriverId) payload.assignedDriverId = form.assignedDriverId;
      if (form.notes.trim()) payload.notes = form.notes.trim();
      if (editing) {
        await api.patch(`/admin/ambulance-units/${editing._id}`, payload);
      } else {
        await api.post('/admin/ambulance-units', payload);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ambulance-units'] });
      closeModal();
    },
    onError: (e) => setFormError(getApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/ambulance-units/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ambulance-units'] });
      setConfirmDelete(null);
    },
  });

  const submit = () => {
    setFormError('');
    if (!form.plateNumber.trim() && !editing) {
      setFormError('Plate number is required.');
      return;
    }
    if (!form.unitName.trim() && !editing) {
      setFormError('Unit name is required.');
      return;
    }
    saveMutation.mutate();
  };

  const orderedUnits = useMemo(
    () => (units ?? []).slice().sort((a, b) => (a.unitNumber ?? 0) - (b.unitNumber ?? 0)),
    [units],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ambulance Units</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage the physical ambulance fleet, plate numbers, status, and assigned drivers.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-xl text-sm font-bold hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" /> Add Unit
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : orderedUnits.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No ambulance units yet</p>
            <p className="text-sm mt-1">Add your first physical unit to enable dispatch.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                <th className="px-6 py-3 text-left w-16">Unit</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left w-32">Plate</th>
                <th className="px-6 py-3 text-left w-32">Type</th>
                <th className="px-6 py-3 text-left w-36">Status</th>
                <th className="px-6 py-3 text-left w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orderedUnits.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-bold text-slate-900">#{u.unitNumber ?? '—'}</td>
                  <td className="px-6 py-3">{u.unitName ?? <span className="text-slate-400">—</span>}</td>
                  <td className="px-6 py-3 font-mono text-xs">
                    {u.plateNumber ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                    {u.unitType ?? '—'}
                  </td>
                  <td className="px-6 py-3">
                    <StatusPill status={u.availabilityStatus} />
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                        aria-label="Edit unit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(u)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        aria-label="Delete unit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={isOpen}
        onClose={closeModal}
        title={editing ? `Edit Unit #${editing.unitNumber}` : 'Add Ambulance Unit'}
        className="max-w-xl"
      >
        <div className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit number">
              <input
                type="number"
                value={form.unitNumber}
                onChange={(e) => setForm((f) => ({ ...f, unitNumber: e.target.value }))}
                placeholder="Auto"
                min={1}
                max={12}
                className={inputCls}
              />
            </Field>
            <Field label="Plate number" required={!editing}>
              <input
                type="text"
                value={form.plateNumber}
                onChange={(e) => setForm((f) => ({ ...f, plateNumber: e.target.value }))}
                placeholder="ABC-1234"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Unit name" required={!editing}>
            <input
              type="text"
              value={form.unitName}
              onChange={(e) => setForm((f) => ({ ...f, unitName: e.target.value }))}
              placeholder="e.g. MDRRMO Ambulance 1"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit type">
              <select
                value={form.unitType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    unitType: e.target.value as FormState['unitType'],
                  }))
                }
                className={inputCls}
              >
                <option value="">Not set</option>
                {UNIT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status" required>
              <select
                value={form.availabilityStatus}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    availabilityStatus: e.target.value as FormState['availabilityStatus'],
                  }))
                }
                className={inputCls}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Assigned driver">
            <select
              value={form.assignedDriverId}
              onChange={(e) => setForm((f) => ({ ...f, assignedDriverId: e.target.value }))}
              className={inputCls}
            >
              <option value="">None</option>
              {(drivers ?? []).map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                  {d.responderRole ? ` — ${d.responderRole}` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className={cn(inputCls, 'resize-none')}
              placeholder="Optional"
            />
          </Field>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button
              onClick={closeModal}
              disabled={saveMutation.isPending}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saveMutation.isPending}
              className="px-4 py-2 bg-[#0F172A] text-white rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add unit'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => deleteMutation.isPending ? null : setConfirmDelete(null)}
        title="Delete ambulance unit"
      >
        {confirmDelete && (
          <>
            <p className="text-slate-600 text-sm mb-4">
              Delete <strong>Unit #{confirmDelete.unitNumber}</strong> ({confirmDelete.unitName ?? 'unnamed'}
              {confirmDelete.plateNumber ? ` · ${confirmDelete.plateNumber}` : ''})?
              This is permanent.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete._id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete unit'}
              </button>
            </div>
            {deleteMutation.error && (
              <p className="mt-3 text-sm text-red-600">
                {getApiError(deleteMutation.error)}
              </p>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

const inputCls =
  'w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: AmbulanceUnitDetail['availabilityStatus'] }) {
  const map: Record<AmbulanceUnitDetail['availabilityStatus'], { label: string; cls: string }> = {
    available: { label: 'Available', cls: 'bg-green-50 text-green-700 border-green-200' },
    assigned: { label: 'Assigned', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    maintenance: { label: 'Maintenance', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    out_of_service: { label: 'Inactive', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  };
  const m = map[status];
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border', m.cls)}>
      {m.label}
    </span>
  );
}
