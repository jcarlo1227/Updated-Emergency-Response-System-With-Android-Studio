import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { AdminShell } from '@/components/layout/AdminShell';
import { api } from '@/services/apiClient';
import { cn } from '@/lib/utils';

type RangeKey = 'today' | 'week' | 'month' | 'custom';

interface ReportsResponse {
  range: { from: string; to: string };
  totals: {
    totalIncidents: number;
    resolvedIncidents: number;
    pendingIncidents: number;
    ambulanceTotal: number;
    averageResponseTime: string;
  };
  incidentsByType: Record<string, number>;
  ambulanceByStatus: Record<string, number>;
  topBarangays: { barangay: string; count: number }[];
  responderActivity: { responderId: string; name: string; count: number }[];
  ambulanceUsage: {
    unitId: string;
    unitNumber?: number;
    unitName?: string;
    plateNumber?: string;
    count: number;
  }[];
  monthlyTrend: {
    ym: string;
    year: number;
    month: number;
    medical: number;
    crime: number;
    fire: number;
    general_sos: number;
    ambulance: number;
  }[];
}

interface FiltersResponse {
  responders: { id: string; name: string; role?: string }[];
  ambulanceUnits: {
    id: string;
    unitNumber: number;
    unitName?: string;
    plateNumber?: string;
  }[];
  barangays: string[];
}

const TYPE_COLORS: Record<string, string> = {
  medical: '#DC2626',
  fire: '#EA580C',
  crime: '#7C3AED',
  general_sos: '#0F172A',
};

const TYPE_LABELS: Record<string, string> = {
  medical: 'Medical',
  fire: 'Fire',
  crime: 'Crime',
  general_sos: 'General SOS',
};

export default function ReportsPage() {
  const [range, setRange] = useState<RangeKey>('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState<'all' | 'medical' | 'fire' | 'crime' | 'general_sos'>('all');
  const [barangay, setBarangay] = useState('all');
  const [responderId, setResponderId] = useState('all');
  const [unitId, setUnitId] = useState('all');

  const { data: filters } = useQuery({
    queryKey: ['reports-filters'],
    queryFn: async () => {
      const { data } = await api.get<{ data: FiltersResponse }>('/admin/reports/filters');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set('range', range);
    if (range === 'custom') {
      if (from) qs.set('from', new Date(from).toISOString());
      if (to) qs.set('to', new Date(to).toISOString());
    }
    if (type !== 'all') qs.set('type', type);
    if (barangay !== 'all') qs.set('barangay', barangay);
    if (responderId !== 'all') qs.set('responderId', responderId);
    if (unitId !== 'all') qs.set('ambulanceUnitId', unitId);
    return qs.toString();
  }, [range, from, to, type, barangay, responderId, unitId]);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', queryString],
    queryFn: async () => {
      const { data } = await api.get<{ data: ReportsResponse }>(
        `/admin/reports?${queryString}`,
      );
      return data.data;
    },
    refetchInterval: 60_000,
  });

  const incidentsByType = data?.incidentsByType ?? {};
  const incidentsPie = (['medical', 'fire', 'crime', 'general_sos'] as const)
    .map((t) => ({ name: TYPE_LABELS[t], value: incidentsByType[t] ?? 0, color: TYPE_COLORS[t] }))
    .filter((d) => d.value > 0);

  const ambulanceByStatus = data?.ambulanceByStatus ?? {};
  const ambulancePie = Object.entries(ambulanceByStatus)
    .map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: v }))
    .filter((d) => d.value > 0);

  const monthly = (data?.monthlyTrend ?? []).map((m) => ({
    ...m,
    label: shortMonthLabel(m.year, m.month),
  }));

  return (
    <AdminShell title="Reports & Analytics">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Filter label="Range">
            <select value={range} onChange={(e) => setRange(e.target.value as RangeKey)} className={inputCls}>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">Last 30 days</option>
              <option value="custom">Custom</option>
            </select>
          </Filter>
          {range === 'custom' && (
            <>
              <Filter label="From">
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
              </Filter>
              <Filter label="To">
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
              </Filter>
            </>
          )}
          <Filter label="Incident type">
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={inputCls}>
              <option value="all">All</option>
              <option value="medical">Medical</option>
              <option value="fire">Fire</option>
              <option value="crime">Crime</option>
              <option value="general_sos">General SOS</option>
            </select>
          </Filter>
          <Filter label="Barangay">
            <select value={barangay} onChange={(e) => setBarangay(e.target.value)} className={inputCls}>
              <option value="all">All</option>
              {(filters?.barangays ?? []).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </Filter>
          <Filter label="Responder">
            <select value={responderId} onChange={(e) => setResponderId(e.target.value)} className={inputCls}>
              <option value="all">All</option>
              {(filters?.responders ?? []).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Filter>
          <Filter label="Ambulance unit">
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={inputCls}>
              <option value="all">All</option>
              {(filters?.ambulanceUnits ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.unitNumber}
                  {u.plateNumber ? ` · ${u.plateNumber}` : ''}
                </option>
              ))}
            </select>
          </Filter>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          Loading reports…
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Stat label="Total incidents" value={data.totals.totalIncidents} />
            <Stat label="Resolved" value={data.totals.resolvedIncidents} accent="green" />
            <Stat label="Pending / active" value={data.totals.pendingIncidents} accent="amber" />
            <Stat label="Ambulance requests" value={data.totals.ambulanceTotal} />
            <Stat label="Avg response time" value={data.totals.averageResponseTime} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card title="Monthly Trend" subtitle="Incidents and ambulance requests">
              {monthly.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="medical" stroke={TYPE_COLORS.medical} strokeWidth={2} />
                    <Line type="monotone" dataKey="fire" stroke={TYPE_COLORS.fire} strokeWidth={2} />
                    <Line type="monotone" dataKey="crime" stroke={TYPE_COLORS.crime} strokeWidth={2} />
                    <Line type="monotone" dataKey="general_sos" stroke={TYPE_COLORS.general_sos} strokeWidth={2} name="General SOS" />
                    <Line type="monotone" dataKey="ambulance" stroke="#2563EB" strokeWidth={2} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Incidents by Type" subtitle="Within selected range">
              {incidentsPie.length === 0 ? (
                <Empty />
              ) : (
                <div className="flex items-center gap-8 flex-wrap">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={incidentsPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                        {incidentsPie.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {incidentsPie.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm text-slate-700 font-medium w-28">{entry.name}</span>
                        <span className="text-sm font-bold text-slate-900">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card title="Most Reported Barangays" subtitle="Top 10">
              {data.topBarangays.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.topBarangays} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="barangay" type="category" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Ambulance Usage" subtitle="Cases handled per unit">
              {data.ambulanceUsage.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={data.ambulanceUsage.map((u) => ({
                      name: `Unit ${u.unitNumber ?? '?'}${u.plateNumber ? ` (${u.plateNumber})` : ''}`,
                      count: u.count,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Responder Activity" subtitle="Cases handled — top 10" className="xl:col-span-2">
              {data.responderActivity.length === 0 ? (
                <Empty />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                      <th className="px-3 py-2 text-left">Responder</th>
                      <th className="px-3 py-2 text-right">Cases handled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.responderActivity.map((r) => (
                      <tr key={r.responderId}>
                        <td className="px-3 py-2 font-medium">{r.name}</td>
                        <td className="px-3 py-2 text-right font-bold">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Ambulance by Status" subtitle="Within selected range" className="xl:col-span-2">
              {ambulancePie.length === 0 ? (
                <Empty />
              ) : (
                <div className="flex items-center gap-8 flex-wrap">
                  {ambulancePie.map((entry) => (
                    <div key={entry.name} className="bg-slate-50 rounded-xl px-4 py-3 min-w-[140px]">
                      <p className="text-xs text-slate-500 font-medium capitalize">{entry.name}</p>
                      <p className="text-2xl font-black text-slate-900 mt-0.5">{entry.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

const inputCls =
  'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 font-semibold mb-1">{label}</label>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: 'green' | 'amber';
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        accent === 'green' && 'bg-green-50 border-green-200',
        accent === 'amber' && 'bg-amber-50 border-amber-200',
        !accent && 'bg-white border-slate-200',
      )}
    >
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p
        className={cn(
          'text-2xl font-black mt-0.5',
          accent === 'green' && 'text-green-700',
          accent === 'amber' && 'text-amber-700',
          !accent && 'text-slate-900',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200 p-6', className)}>
      <h2 className="font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-slate-500 text-xs mt-0.5 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-slate-400 py-8 text-center">No data for the selected filters.</p>;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortMonthLabel(year: number, month: number): string {
  const m = MONTHS[month - 1] ?? String(month);
  return `${m} ${String(year).slice(2)}`;
}
