import { useEffect, useState, useCallback } from 'react';
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Plus, Trash2, Pencil, TrendingUp, TrendingDown,
  Wallet, BarChart3, PieChart as PieIcon, X, Check, Loader2,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { portfolioApi } from '../api/portfolioApi';

/* ─── constants ─── */
const ASSET_TYPES = [
  { value: 'stock',       label: 'Stock' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'etf',         label: 'ETF' },
  { value: 'crypto',      label: 'Crypto' },
  { value: 'fd',          label: 'Fixed Deposit' },
  { value: 'gold',        label: 'Gold' },
  { value: 'ppf',         label: 'PPF / NPS' },
  { value: 'bonds',       label: 'Bonds / Debt' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'other',       label: 'Other' },
];

const TYPE_COLORS = {
  Stock: '#6366f1', 'Mutual Fund': '#22c55e', ETF: '#f59e0b',
  Crypto: '#f43f5e', 'Fixed Deposit': '#06b6d4', Gold: '#eab308',
  'PPF / NPS': '#8b5cf6', 'Bonds / Debt': '#64748b',
  'Real Estate': '#10b981', Other: '#94a3b8',
};

const CHART_COLORS = Object.values(TYPE_COLORS);

const EMPTY_FORM = {
  asset_name: '', asset_type: 'stock', ticker: '',
  quantity: '', buy_price: '', current_price: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '', currency: 'INR',
};

/* ─── helpers ─── */
function fmt(n, sym = '₹') {
  if (!n && n !== 0) return '—';
  const abs = Math.abs(Number(n));
  const s = abs >= 1e7 ? `${(abs / 1e7).toFixed(2)}Cr`
          : abs >= 1e5 ? `${(abs / 1e5).toFixed(2)}L`
          : abs.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return (n < 0 ? '-' : '') + sym + s;
}

/* ─── Stat card ─── */
function StatCard({ label, value, sub, icon: Icon, color, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`card relative overflow-hidden transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20 ${color}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-black text-white">{value}</p>
          {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
    </div>
  );
}

/* ─── Custom tooltip for charts ─── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-card)] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
      {label && <p className="text-[var(--text-secondary)] mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color || p.fill }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ─── Add/Edit modal ─── */
function EntryModal({ entry, onClose, onSave }) {
  const [form, setForm] = useState(entry || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const sym = form.currency === 'INR' ? '₹' : '$';
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.asset_name || !form.buy_price || !form.date) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h3 className="font-bold text-white">{entry ? 'Edit Investment' : 'Add Investment'}</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Asset Name *</label>
            <input className="input" placeholder="e.g. TCS, Nifty 50 ETF, Bitcoin" value={form.asset_name} onChange={(e) => set('asset_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.asset_type} onChange={(e) => set('asset_type', e.target.value)}>
              {ASSET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
              <option value="INR">INR ₹</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
            </select>
          </div>
          <div>
            <label className="label">Ticker / Symbol</label>
            <input className="input" placeholder="e.g. TCS.NS" value={form.ticker} onChange={(e) => set('ticker', e.target.value)} />
          </div>
          <div>
            <label className="label">Date *</label>
            <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Quantity</label>
            <input className="input" type="number" min="0" step="any" placeholder="Units" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
          </div>
          <div>
            <label className="label">Buy Price ({sym})</label>
            <input className="input" type="number" min="0" step="any" placeholder="Per unit" value={form.buy_price} onChange={(e) => set('buy_price', e.target.value)} />
          </div>
          <div>
            <label className="label">Current Price ({sym})</label>
            <input className="input" type="number" min="0" step="any" placeholder="Per unit today" value={form.current_price} onChange={(e) => set('current_price', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <input className="input" placeholder="Optional notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {entry ? 'Update' : 'Add Investment'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function PortfolioPage() {
  const [entries, setEntries]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);   // null | 'add' | entry object
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    const [{ data: e }, { data: s }] = await Promise.all([portfolioApi.list(), portfolioApi.summary()]);
    setEntries(e);
    setSummary(s);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    if (modal?.id) {
      await portfolioApi.update(modal.id, form);
    } else {
      await portfolioApi.create(form);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    await portfolioApi.remove(id);
    setDeleting(null);
    load();
  };

  const sym = entries[0]?.currency === 'USD' ? '$' : '₹';
  const gainPositive = summary?.gain_loss >= 0;

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Wallet size={22} className="text-indigo-400" /> My Portfolio
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Track all your investments in one place</p>
          </div>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 btn-primary text-sm"
          >
            <Plus size={15} /> Add Investment
          </button>
        </div>

        {/* Stat cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Invested"  value={fmt(summary.total_invested, sym)}  icon={Wallet}      color="bg-indigo-600"  delay={0} />
            <StatCard label="Current Value"   value={fmt(summary.total_current, sym)}   icon={BarChart3}   color="bg-emerald-600" delay={80} />
            <StatCard
              label="Unrealised P&L"
              value={fmt(summary.gain_loss, sym)}
              sub={`${gainPositive ? '+' : ''}${summary.gain_loss_pct}%`}
              icon={gainPositive ? TrendingUp : TrendingDown}
              color={gainPositive ? 'bg-green-600' : 'bg-red-600'}
              delay={160}
            />
            <StatCard label="Holdings"  value={summary.entries}  sub="instruments"  icon={PieIcon}  color="bg-violet-600"  delay={240} />
          </div>
        )}

        {/* Charts row */}
        {summary?.allocation?.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Donut — asset allocation */}
            <div className="card">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <PieIcon size={15} className="text-indigo-400" /> Asset Allocation
              </h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie data={summary.allocation} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" paddingAngle={3}>
                      {summary.allocation.map((entry, i) => (
                        <Cell key={i} fill={TYPE_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {summary.allocation.map((a, i) => {
                    const color = TYPE_COLORS[a.name] || CHART_COLORS[i % CHART_COLORS.length];
                    const pct   = summary.total_invested > 0 ? ((a.value / summary.total_invested) * 100).toFixed(1) : 0;
                    return (
                      <div key={a.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-[var(--text-secondary)]">{a.name}</span>
                        </div>
                        <span className="text-[var(--text-primary)] font-semibold">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bar — monthly investments */}
            <div className="card">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <BarChart3 size={15} className="text-emerald-400" /> Monthly Investments
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={summary.monthly} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="amount" name="Invested" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Portfolio table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">All Holdings</h3>
            {entries.length > 0 && <span className="text-xs text-[var(--text-muted)]">{entries.length} entries</span>}
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="animate-spin text-indigo-400" size={28} />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center">
              <Wallet size={36} className="text-slate-700 mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] font-medium mb-1">No investments yet</p>
              <p className="text-[var(--text-muted)] text-sm mb-4">Add your first investment to start tracking</p>
              <button onClick={() => setModal('add')} className="btn-primary text-sm inline-flex items-center gap-2">
                <Plus size={14} /> Add Investment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                    {['Asset', 'Type', 'Invested', 'Current', 'P&L', 'Date', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const gain    = e.gain_loss || 0;
                    const gainPct = e.gain_loss_pct || 0;
                    const pos     = gain >= 0;
                    return (
                      <tr key={e.id}
                        className="border-b border-white/[0.07]/50 hover:bg-white/[0.03] transition-colors animate-slide-up"
                        style={{ animationDelay: `${i * 30}ms` }}>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-white">{e.asset_name}</p>
                          {e.ticker && <p className="text-xs text-[var(--text-muted)]">{e.ticker}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--text-secondary)]">
                            {ASSET_TYPES.find((t) => t.value === e.asset_type)?.label || e.asset_type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-[var(--text-primary)]">{fmt(e.invested_amount, sym)}</td>
                        <td className="px-5 py-3.5 font-medium text-[var(--text-primary)]">{fmt(e.current_value, sym)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-bold ${pos ? 'text-green-400' : 'text-red-400'}`}>
                            {pos ? '+' : ''}{fmt(gain, sym)}
                          </span>
                          <p className={`text-[10px] ${pos ? 'text-green-600' : 'text-red-600'}`}>
                            {pos ? '▲' : '▼'} {Math.abs(gainPct)}%
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">{e.date}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setModal(e)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-indigo-400 hover:bg-white/[0.06]transition-all">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-white/[0.06]transition-all">
                              {deleting === e.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <EntryModal
          entry={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </Layout>
  );
}
