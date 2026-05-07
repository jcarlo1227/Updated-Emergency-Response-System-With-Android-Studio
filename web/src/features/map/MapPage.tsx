import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, AlertTriangle, Wifi } from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { TypeBadge, PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { AuthedImage } from '@/components/ui/AuthedImage';
import { api } from '@/services/apiClient';
import { getSocket } from '@/services/socketClient';
import { fmt } from '@/lib/utils';
import { TANZA_CENTER, TANZA_ZOOM } from '@/styles/tokens';
import type { Emergency, Paginated } from '@/types';

function makeIcon(color: string, iot = false) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path fill="${color}" stroke="white" stroke-width="2" d="M16 2C9.4 2 4 7.4 4 14c0 9 12 26 12 26s12-17 12-26C28 7.4 22.6 2 16 2z"/>
    ${iot ? `<text x="16" y="18" text-anchor="middle" fill="white" font-size="9" font-weight="bold">IoT</text>` : `<circle cx="16" cy="14" r="5" fill="white"/>`}
  </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
    className: '',
  });
}

const ICONS: Record<string, L.DivIcon> = {
  medical: makeIcon('#DC2626'),
  crime: makeIcon('#7C3AED'),
  fire: makeIcon('#EA580C'),
  general_sos: makeIcon('#0F172A'),
  iot: makeIcon('#DC2626', true),
};

function FitBounds({ emergencies }: { emergencies: Emergency[] }) {
  const map = useMap();
  useEffect(() => {
    if (emergencies.length === 0) return;
    const bounds = L.latLngBounds(
      emergencies.map((em) => [em.currentLocation.coordinates[1], em.currentLocation.coordinates[0]] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [emergencies, map]);
  return <></>;
}

export default function MapPage() {
  const [selected, setSelected] = useState<Emergency | null>(null);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);

  const { data } = useQuery({
    queryKey: ['map-emergencies'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Paginated<Emergency> }>('/emergencies/active?limit=100');
      return data.data.items;
    },
    refetchInterval: 20_000,
  });

  useEffect(() => {
    if (data) setEmergencies(data);
  }, [data]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const upsert = async (payload: { emergencyId: string }) => {
      try {
        const { data } = await api.get<{ data: Emergency }>(`/emergencies/${payload.emergencyId}`);
        setEmergencies((prev) => {
          const idx = prev.findIndex((e) => e._id === data.data._id);
          if (idx >= 0) { const next = [...prev]; next[idx] = data.data; return next; }
          return [data.data, ...prev];
        });
      } catch {}
    };

    const remove = (payload: { emergencyId: string }) => {
      setEmergencies((prev) => prev.filter((e) => e._id !== payload.emergencyId));
      setSelected((s) => s?._id === payload.emergencyId ? null : s);
    };

    socket.on('emergency.created', upsert);
    socket.on('emergency.iot_keychain_created', upsert);
    socket.on('emergency.updated', upsert);
    socket.on('emergency.assigned', upsert);
    socket.on('emergency.resolved', remove);

    return () => {
      socket.off('emergency.created', upsert);
      socket.off('emergency.iot_keychain_created', upsert);
      socket.off('emergency.updated', upsert);
      socket.off('emergency.assigned', upsert);
      socket.off('emergency.resolved', remove);
    };
  }, []);

  return (
    <AdminShell title="Map Center">
      <div className="flex gap-4 -mt-2">
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
          <MapContainer
            center={TANZA_CENTER}
            zoom={TANZA_ZOOM}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {emergencies.map((em) => (
            <Marker
              key={em._id}
              position={[em.currentLocation.coordinates[1], em.currentLocation.coordinates[0]]}
              icon={em.source === 'iot_keychain' ? ICONS.iot : (ICONS[em.type] ?? ICONS.general_sos)}
              eventHandlers={{ click: () => setSelected(em) }}
            >
              <Popup>
                <div className="text-xs font-bold">{em.type.replace('_', ' ').toUpperCase()}</div>
                <div className="text-xs text-gray-500">{em.barangay ?? 'Tanza'}</div>
              </Popup>
            </Marker>
          ))}
          <FitBounds emergencies={emergencies} />
          </MapContainer>
        </div>

        {selected && (
          <div className="w-80 bg-white rounded-2xl border border-slate-200 overflow-y-auto flex-shrink-0" style={{ maxHeight: 'calc(100vh - 160px)' }}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between">
              <div>
                <TypeBadge type={selected.type} source={selected.source} />
                {selected.priority === 'critical' && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-red-600 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> CRITICAL
                  </div>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3 text-sm">
              <StatusBadge status={selected.status} />

              {selected.outsideScopeFlag && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl p-3 font-semibold">
                  ⚠ Outside Tanza Municipality — Admin decision required
                </div>
              )}

              {selected.userSnapshot && (
                <div className="space-y-3 bg-slate-50 rounded-xl p-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Sender Details</h3>
                  {selected.userSnapshot.faceCaptureFileId && (
                    <AuthedImage
                      fileId={selected.userSnapshot.faceCaptureFileId}
                      alt="Sender face photo"
                      className="w-full h-40 rounded-lg"
                    />
                  )}
                  <div className="space-y-2.5">
                    <Detail label="Name" value={selected.userSnapshot.fullName} />
                    <Detail label="Age" value={selected.userSnapshot.age?.toString()} />
                    <Detail
                      label="Date of birth"
                      value={
                        selected.userSnapshot.dateOfBirth
                          ? new Date(selected.userSnapshot.dateOfBirth).toLocaleDateString()
                          : undefined
                      }
                    />
                    <Detail label="Blood type" value={selected.userSnapshot.bloodType} />
                    <Detail
                      label="Address"
                      value={[
                        selected.userSnapshot.streetAddress,
                        selected.userSnapshot.barangay,
                        selected.userSnapshot.municipality,
                      ].filter(Boolean).join(', ') || undefined}
                    />
                    <Detail label="Contact number" value={selected.userSnapshot.phone} />
                    <Detail label="Emergency contact" value={selected.userSnapshot.emergencyContactName} />
                    <Detail label="Emergency number" value={selected.userSnapshot.emergencyContactNumber} />
                  </div>
                </div>
              )}

              <div className="space-y-2.5 bg-slate-50 rounded-xl p-4">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Current Location</h3>
                <Detail label="Barangay" value={selected.barangay} />
                <Detail
                  label="Coordinates"
                  value={`${selected.currentLocation.coordinates[1].toFixed(5)}, ${selected.currentLocation.coordinates[0].toFixed(5)}`}
                />
                {selected.currentLocation.accuracyMeters && (
                  <Detail label="Accuracy" value={`±${selected.currentLocation.accuracyMeters.toFixed(0)}m`} />
                )}
              </div>

              {selected.source === 'iot_keychain' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2.5">
                  <h3 className="font-bold text-blue-700 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5" /> IoT Keychain
                  </h3>
                  <Detail label="Device ID" value={selected.sourceDeviceId} />
                  <Detail label="Event ID" value={selected.bleEventId} />
                  {selected.deviceBatteryAtTrigger !== undefined && (
                    <Detail label="Battery at trigger" value={`${selected.deviceBatteryAtTrigger}%`} />
                  )}
                </div>
              )}

              {selected.notes && <Detail label="Notes" value={selected.notes} />}
              <Detail label="Reported at" value={fmt(selected.createdAt)} />
            </div>
          </div>
        )}

        {!selected && (
          <div className="w-72 bg-white rounded-2xl border border-slate-200 overflow-y-auto flex-shrink-0" style={{ maxHeight: 'calc(100vh - 160px)' }}>
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">Active Incidents ({emergencies.length})</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {emergencies.length === 0 ? (
                <p className="p-6 text-center text-slate-400 text-sm">No active incidents</p>
              ) : emergencies.map((em) => (
                <button
                  key={em._id}
                  onClick={() => setSelected(em)}
                  className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <TypeBadge type={em.type} source={em.source} />
                  <p className="text-xs text-slate-500 mt-1.5">{em.barangay ?? 'Tanza'} · {fmt(em.createdAt)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function Detail({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-slate-400 text-xs w-28 flex-shrink-0">{label}</span>
      <span className="text-slate-800 text-xs font-medium flex-1 break-words">{value}</span>
    </div>
  );
}
