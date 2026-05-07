import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertCircle } from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { StatusBadge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { api, getApiError } from '@/services/apiClient';
import { fmt } from '@/lib/utils';
import type {
  ResponderRegistration,
  ResponderRole,
  DutyStatus,
  AmbulanceUnitOption,
} from '@/types';

type StatusFilter = 'approved' | 'pending' | 'rejected';

const RESPONDER_ROLES: { value: ResponderRole; label: string }[] = [
  { value: 'medic', label: 'Medic' },
  { value: 'fire_responder', label: 'Fire Responder' },
  { value: 'police_responder', label: 'Police Responder' },
  { value: 'ambulance_driver', label: 'Ambulance Driver' },
  { value: 'disaster_response', label: 'Disaster Response' },
  { value: 'general_responder', label: 'General Responder' },
];

const DUTY_STATUSES: { value: DutyStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'offline', label: 'Offline' },
  { value: 'suspended', label: 'Suspended' },
];

interface CreateForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  streetAddress: string;
  dateOfBirth: string;
  responderRole: ResponderRole | '';
  assignedAmbulanceUnitId: string;
  dutyStatus: DutyStatus;
}

const EMPTY_FORM: CreateForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  streetAddress: '',
  dateOfBirth: '',
  responderRole: '',
  assignedAmbulanceUnitId: '',
  dutyStatus: 'available',
};

function ageFromDob(dobIso: string): number | null {
  if (!dobIso) return null;
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export default function RespondersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('approved');
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['responders', status],
    queryFn: async () => {
      const { data } = await api.get<{ data: { items: ResponderRegistration[] } }>(
        `/admin/registrations?type=responder&status=${status}`,
      );
      return data.data.items;
    },
  });

  const { data: units } = useQuery({
    queryKey: ['ambulance-units'],
    enabled: createModal,
    queryFn: async () => {
      const { data } = await api.get<{ data: AmbulanceUnitOption[] }>('/admin/ambulance-units');
      return data.data;
    },
  });

  const selectedUnit = useMemo(
    () => units?.find((u) => u._id === form.assignedAmbulanceUnitId),
    [units, form.assignedAmbulanceUnitId],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        streetAddress: form.streetAddress.trim(),
        dateOfBirth: form.dateOfBirth,
        responderRole: form.responderRole,
        assignedAmbulanceUnitId: form.assignedAmbulanceUnitId || undefined,
        dutyStatus: form.dutyStatus,
      };
      const { data } = await api.post('/admin/responders', payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['responders'] });
      setCreateModal(false);
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (e) => {
      setFormError(getApiError(e));
    },
  });

  const submit = () => {
    setFormError('');
    if (!form.name.trim() || form.name.trim().length < 2) {
      setFormError('Full name is required.');
      return;
    }
    if (!form.email.includes('@')) {
      setFormError('Enter a valid email.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (form.phone.trim().length < 7) {
      setFormError('Enter a valid contact number.');
      return;
    }
    if (form.streetAddress.trim().length < 2) {
      setFormError('Address is required.');
      return;
    }
    if (!form.dateOfBirth) {
      setFormError('Date of birth is required.');
      return;
    }
    const age = ageFromDob(form.dateOfBirth);
    if (age == null || age < 18 || age > 100) {
      setFormError('Responder must be 18–100 years old.');
      return;
    }
    if (!form.responderRole) {
      setFormError('Select a responder role.');
      return;
    }
    createMutation.mutate();
  };

  const closeModal = () => {
    if (createMutation.isPending) return;
    setCreateModal(false);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const derivedAge = ageFromDob(form.dateOfBirth);

  return (
    <AdminShell
      title="Responders"
      actions={
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-xl text-sm font-bold hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" /> Create Responder
        </button>
      }
    >
      <div className="flex gap-2 mb-6">
        {(['approved', 'pending', 'rejected'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize ${status === s ? 'bg-[#0F172A] text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data ?? []).map((r) => {
                const role = r.responderRole
                  ? RESPONDER_ROLES.find((rr) => rr.value === r.responderRole)?.label
                  : (r.agencyType?.toUpperCase() ?? r.department);
                return (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{r.name}</td>
                    <td className="px-6 py-4 text-slate-500">{role ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-500">{r.phone ?? '—'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.dutyStatus ?? r.approvalStatus} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{fmt(r.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={createModal} onClose={closeModal} title="Create Responder" className="max-w-2xl">
        <div className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Contact number" required>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Password" required>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min 8 characters"
                className={inputCls}
              />
            </Field>
            <Field label="Date of birth" required>
              <input
                type="date"
                value={form.dateOfBirth}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Age (auto)">
              <input
                type="text"
                value={derivedAge != null ? `${derivedAge} years` : ''}
                readOnly
                className={`${inputCls} bg-slate-50 text-slate-500`}
              />
            </Field>
          </div>

          <Field label="Address" required>
            <input
              type="text"
              value={form.streetAddress}
              onChange={(e) => setForm((f) => ({ ...f, streetAddress: e.target.value }))}
              placeholder="Street, barangay, municipality"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Role / field" required>
              <select
                value={form.responderRole}
                onChange={(e) => setForm((f) => ({ ...f, responderRole: e.target.value as ResponderRole }))}
                className={inputCls}
              >
                <option value="">Select role…</option>
                {RESPONDER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status" required>
              <select
                value={form.dutyStatus}
                onChange={(e) => setForm((f) => ({ ...f, dutyStatus: e.target.value as DutyStatus }))}
                className={inputCls}
              >
                {DUTY_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Assigned ambulance unit">
              <select
                value={form.assignedAmbulanceUnitId}
                onChange={(e) => setForm((f) => ({ ...f, assignedAmbulanceUnitId: e.target.value }))}
                className={inputCls}
              >
                <option value="">None</option>
                {(units ?? []).map((u) => (
                  <option key={u._id} value={u._id}>
                    Unit {u.unitNumber}
                    {u.unitName ? ` — ${u.unitName}` : ''}
                    {u.plateNumber ? ` (${u.plateNumber})` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Plate number">
              <input
                type="text"
                value={selectedUnit?.plateNumber ?? ''}
                readOnly
                placeholder="Auto from unit"
                className={`${inputCls} bg-slate-50 text-slate-500`}
              />
            </Field>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 mt-4">
            <button
              onClick={closeModal}
              disabled={createMutation.isPending}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-[#0F172A] text-white rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminShell>
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
