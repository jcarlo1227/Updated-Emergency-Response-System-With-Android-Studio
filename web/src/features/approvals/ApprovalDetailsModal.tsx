import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { AuthedImage } from '@/components/ui/AuthedImage';
import { StatusBadge } from '@/components/ui/Badge';
import { api } from '@/services/apiClient';
import { fmt } from '@/lib/utils';
import type { UserRegistration, ResponderRegistration } from '@/types';

type AccountType = 'user' | 'responder';

interface Props {
  open: boolean;
  onClose: () => void;
  id: string;
  type: AccountType;
  isPending: boolean;
  onApprove: (id: string, type: AccountType, name: string) => void;
  onReject: (id: string, type: AccountType, name: string) => void;
}

function useRegistrationDetail(id: string, type: AccountType, enabled: boolean) {
  return useQuery({
    queryKey: ['registration', type, id],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ data: UserRegistration | ResponderRegistration }>(
        `/admin/registrations/${id}?type=${type}`,
      );
      return data.data;
    },
  });
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide font-semibold text-slate-400">{label}</div>
      <div className="mt-1 text-sm text-slate-900 break-words">{value || <span className="text-slate-400">Not provided</span>}</div>
    </div>
  );
}

export function ApprovalDetailsModal({ open, onClose, id, type, isPending, onApprove, onReject }: Props) {
  const { data, isLoading, isError } = useRegistrationDetail(id, type, open && !!id);
  const [imageZoom, setImageZoom] = useState<{ fileId: string; label: string } | null>(null);

  const isUser = type === 'user';
  const user = isUser ? (data as UserRegistration | undefined) : undefined;
  const responder = !isUser ? (data as ResponderRegistration | undefined) : undefined;

  const fullAddress = isUser
    ? [user?.streetAddress, user?.barangay, user?.municipality].filter(Boolean).join(', ')
    : '';

  const titleName = data?.name ?? 'Registration details';

  return (
    <>
      <Modal open={open} onClose={onClose} title={titleName} className="max-w-3xl">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
        {isError && (
          <div className="text-center py-12 text-red-500 text-sm">Failed to load registration.</div>
        )}
        {data && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wide font-semibold text-slate-500">
                  {type === 'user' ? 'User' : 'Responder'}
                </span>
                <StatusBadge status={data.approvalStatus} />
              </div>
              <span className="text-xs text-slate-500">Submitted {fmt(data.createdAt)}</span>
            </div>

            <section>
              <h4 className="text-sm font-bold text-slate-900 mb-3">Identity</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full name" value={data.name} />
                <Field label="Email" value={data.email} />
                {isUser && <Field label="Phone" value={user?.phone} />}
                {!isUser && <Field label="Badge ID" value={responder?.badgeId} />}
                {isUser && (
                  <Field
                    label="Date of birth"
                    value={user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : null}
                  />
                )}
                {isUser && <Field label="Age" value={user?.age != null ? `${user.age} years` : null} />}
                {isUser && <Field label="Blood type" value={user?.bloodType} />}
              </div>
            </section>

            {isUser && (
              <section>
                <h4 className="text-sm font-bold text-slate-900 mb-3">Address</h4>
                <Field label="Residential address" value={fullAddress} />
              </section>
            )}

            {isUser && (
              <section>
                <h4 className="text-sm font-bold text-slate-900 mb-3">Emergency contact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Contact person" value={user?.emergencyContactName} />
                  <Field label="Contact number" value={user?.emergencyContactNumber} />
                </div>
              </section>
            )}

            {!isUser && (
              <section>
                <h4 className="text-sm font-bold text-slate-900 mb-3">Responder details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Department" value={responder?.department} />
                  <Field label="Agency" value={responder?.agencyType?.toUpperCase()} />
                  <Field label="Station" value={responder?.stationName} />
                  <Field label="Position" value={responder?.position} />
                  <Field label="Coverage area" value={responder?.coverageArea} />
                </div>
              </section>
            )}

            <section>
              <h4 className="text-sm font-bold text-slate-900 mb-3">Verification documents</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide font-semibold text-slate-400 mb-2">
                    Face photo
                  </div>
                  <button
                    type="button"
                    onClick={() => data.faceCaptureFileId && setImageZoom({ fileId: data.faceCaptureFileId, label: 'Face photo' })}
                    className="block w-full h-48 cursor-zoom-in"
                    disabled={!data.faceCaptureFileId}
                  >
                    <AuthedImage fileId={data.faceCaptureFileId} alt="Face capture" className="w-full h-48" />
                  </button>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide font-semibold text-slate-400 mb-2">
                    {isUser ? 'Valid ID / Proof of residency' : 'Credentials'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const fid = isUser ? user?.proofOfResidencyFileId : responder?.credentialFileId;
                      if (fid) setImageZoom({ fileId: fid, label: isUser ? 'Valid ID' : 'Credentials' });
                    }}
                    className="block w-full h-48 cursor-zoom-in"
                  >
                    <AuthedImage
                      fileId={isUser ? user?.proofOfResidencyFileId : responder?.credentialFileId}
                      alt={isUser ? 'Valid ID' : 'Credentials'}
                      className="w-full h-48"
                    />
                  </button>
                </div>
              </div>
            </section>

            {data.rejectionReason && (
              <section className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wide font-semibold text-red-700 mb-1">Rejection reason</div>
                <div className="text-sm text-red-800">{data.rejectionReason}</div>
              </section>
            )}

            {isPending && (
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => onReject(id, type, data.name)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => onApprove(id, type, data.name)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {imageZoom && (
        <Modal
          open={!!imageZoom}
          onClose={() => setImageZoom(null)}
          title={imageZoom.label}
          className="max-w-4xl"
        >
          <AuthedImage fileId={imageZoom.fileId} alt={imageZoom.label} className="w-full max-h-[70vh]" />
        </Modal>
      )}
    </>
  );
}
