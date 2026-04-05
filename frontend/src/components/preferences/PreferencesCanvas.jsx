import { useCallback, useContext, useEffect, useMemo, useState, createContext, memo } from 'react';
import {
  ReactFlow, useNodesState, useEdgesState, addEdge,
  Handle, Position, Background, Controls, BackgroundVariant, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ShieldCheck, DollarSign, Layers, Target, Timer,
  Pencil, Check, Save, CheckCircle, Loader2,
} from 'lucide-react';

/* ─── Local context ─── */
const PrefCtx = createContext({ update: () => {} });

/* ─── Shared helpers ─── */
function Field({ label, value, onChange, type = 'text', placeholder, options }) {
  return (
    <div className="nodrag">
      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">{label}</label>
      {type === 'select' ? (
        <select value={value || ''} onChange={(e) => onChange(e.target.value)}
          className="w-full text-xs rounded-lg border border-slate-600 bg-[var(--bg-raised)] text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full text-xs rounded-lg border border-slate-600 bg-[var(--bg-raised)] text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
      ) : (
        <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full text-xs rounded-lg border border-slate-600 bg-[var(--bg-raised)] text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      )}
    </div>
  );
}

function NodeHeader({ gradient, icon: Icon, title, editing, onToggle }) {
  return (
    <div className={`${gradient} px-4 py-2.5 flex items-center justify-between`}>
      <div className="flex items-center gap-2 text-white">
        <Icon size={14} />
        <span className="text-xs font-bold">{title}</span>
      </div>
      <button className="nodrag text-white/70 hover:text-white transition-colors" onClick={onToggle}>
        {editing ? <Check size={13} /> : <Pencil size={12} />}
      </button>
    </div>
  );
}

/* ═══ NODE: Hub ═══ */
const HubNode = memo(function HubNode() {
  return (
    <div className="relative">
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((pos) => (
        <Handle key={pos} type="source" position={pos} style={{ background: '#6366f1' }} />
      ))}
      <div className="w-36 h-36 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700
                      flex flex-col items-center justify-center shadow-2xl border-4 border-white/10 select-none">
        <span className="text-4xl mb-1">📈</span>
        <p className="text-white font-black text-xs text-center tracking-tight">My Investments</p>
        <p className="text-indigo-200 text-[10px] mt-0.5">Edit each node</p>
      </div>
    </div>
  );
});

/* ═══ NODE: Risk ═══ */
const RISK_OPTIONS = [
  { value: 'conservative', label: 'Conservative', color: 'from-green-600 to-emerald-600',  ring: 'border-green-500',  badge: 'bg-green-900/40 text-green-300 border-green-700',  desc: 'Stable, dividend-focused' },
  { value: 'moderate',     label: 'Moderate',     color: 'from-amber-500 to-orange-600',   ring: 'border-amber-500',  badge: 'bg-amber-900/40 text-amber-300 border-amber-700',  desc: 'Balanced growth & value' },
  { value: 'aggressive',   label: 'Aggressive',   color: 'from-red-600 to-rose-600',       ring: 'border-red-500',    badge: 'bg-red-900/40 text-red-300 border-red-700',       desc: 'High-growth, high-risk' },
];

const RiskNode = memo(function RiskNode({ id, data }) {
  const [editing, setEditing] = useState(false);
  const { update } = useContext(PrefCtx);
  const current = RISK_OPTIONS.find((r) => r.value === (data.risk_tolerance || 'moderate')) || RISK_OPTIONS[1];

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-white/[0.1]/60 w-64 overflow-hidden">
      <Handle type="target" position={Position.Right} style={{ background: '#f59e0b' }} />
      <Handle type="source" position={Position.Left}  style={{ background: '#f59e0b' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#f59e0b' }} />

      <NodeHeader gradient="bg-gradient-to-r from-amber-500 to-orange-600" icon={ShieldCheck} title="Risk Tolerance" editing={editing} onToggle={() => setEditing((e) => !e)} />

      <div className="p-3 space-y-2">
        {editing ? (
          <div className="space-y-2 nodrag">
            {RISK_OPTIONS.map((r) => (
              <button key={r.value} onClick={() => update(id, 'risk_tolerance', r.value)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all
                  ${data.risk_tolerance === r.value ? `border-2 ${r.ring} bg-[var(--bg-raised)]` : 'border-white/[0.1] hover:border-slate-600 bg-[var(--bg-raised)]/50'}`}>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center shrink-0`}>
                  <ShieldCheck size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{r.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${current.color} flex items-center justify-center shrink-0`}>
              <ShieldCheck size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{current.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{current.desc}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

/* ═══ NODE: Budget ═══ */
const CURRENCIES = [
  { value: 'USD', label: '🇺🇸 USD — Dollar' },
  { value: 'INR', label: '🇮🇳 INR — Rupee' },
  { value: 'EUR', label: '🇪🇺 EUR — Euro' },
  { value: 'GBP', label: '🇬🇧 GBP — Pound' },
  { value: 'JPY', label: '🇯🇵 JPY — Yen' },
];

const BudgetNode = memo(function BudgetNode({ id, data }) {
  const [editing, setEditing] = useState(false);
  const { update } = useContext(PrefCtx);
  const sym = data.currency === 'INR' ? '₹' : data.currency === 'EUR' ? '€' : data.currency === 'GBP' ? '£' : data.currency === 'JPY' ? '¥' : '$';

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-white/[0.1]/60 w-64 overflow-hidden">
      <Handle type="target" position={Position.Left}  style={{ background: '#22c55e' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#22c55e' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#22c55e' }} />

      <NodeHeader gradient="bg-gradient-to-r from-emerald-600 to-green-600" icon={DollarSign} title="Budget & Currency" editing={editing} onToggle={() => setEditing((e) => !e)} />

      <div className="p-3 space-y-2.5">
        {editing ? (
          <>
            <Field label="Investment Budget" value={data.amount} onChange={(v) => update(id, 'amount', v)} type="number" placeholder="e.g. 100000" />
            <Field label="Currency" value={data.currency} onChange={(v) => update(id, 'currency', v)} type="select" options={CURRENCIES} />
            {data.currency === 'INR' && (
              <div className="nodrag text-[10px] bg-orange-950/40 border border-orange-800/40 rounded-lg px-2.5 py-2 text-orange-300">
                🇮🇳 Indian Market Mode: NSE stocks, ₹ analysis, SEBI/RBI context
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">
                {data.amount ? `${sym}${Number(data.amount).toLocaleString()}` : '—'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{data.currency || 'USD'} · Investment budget</p>
          </div>
        )}
      </div>
    </div>
  );
});

/* ═══ NODE: Sectors ═══ */
const SECTOR_LIST = [
  { value: 'technology',    label: 'Technology',    emoji: '💻' },
  { value: 'healthcare',    label: 'Healthcare',    emoji: '🏥' },
  { value: 'finance',       label: 'Finance',       emoji: '🏦' },
  { value: 'energy',        label: 'Energy',        emoji: '⚡' },
  { value: 'consumer',      label: 'Consumer',      emoji: '🛒' },
  { value: 'industrials',   label: 'Industrials',   emoji: '🏭' },
  { value: 'utilities',     label: 'Utilities',     emoji: '💡' },
  { value: 'real_estate',   label: 'Real Estate',   emoji: '🏢' },
  { value: 'materials',     label: 'Materials',     emoji: '⛏️' },
  { value: 'communication', label: 'Communication', emoji: '📡' },
];

const SectorsNode = memo(function SectorsNode({ id, data }) {
  const { update } = useContext(PrefCtx);
  const selected = data.selected || [];

  const toggle = (val) => {
    const next = selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val];
    update(id, 'selected', next);
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-white/[0.1]/60 w-80 overflow-hidden">
      <Handle type="target" position={Position.Top}  style={{ background: '#06b6d4' }} />
      <Handle type="source" position={Position.Left} style={{ background: '#06b6d4' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#06b6d4' }} />

      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Layers size={14} />
          <span className="text-xs font-bold">Market Sectors</span>
        </div>
        <span className="text-[10px] text-cyan-100 font-semibold">{selected.length} selected</span>
      </div>

      <div className="p-3 nodrag">
        <div className="grid grid-cols-2 gap-1.5">
          {SECTOR_LIST.map((s) => {
            const active = selected.includes(s.value);
            return (
              <button key={s.value} onClick={() => toggle(s.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border
                  ${active
                    ? 'bg-cyan-900/40 border-cyan-700/60 text-cyan-300'
                    : 'bg-[var(--bg-raised)] border-white/[0.1]/40 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-600'
                  }`}>
                <span className="text-sm">{s.emoji}</span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

/* ═══ NODE: Goal ═══ */
const GoalNode = memo(function GoalNode({ id, data }) {
  const [editing, setEditing] = useState(!data.text);
  const { update } = useContext(PrefCtx);

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-white/[0.1]/60 w-64 overflow-hidden">
      <Handle type="target" position={Position.Top}   style={{ background: '#8b5cf6' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#8b5cf6' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#8b5cf6' }} />

      <NodeHeader gradient="bg-gradient-to-r from-violet-600 to-purple-600" icon={Target} title="Investment Goal" editing={editing} onToggle={() => setEditing((e) => !e)} />

      <div className="p-3">
        {editing ? (
          <Field label="Describe your goal" value={data.text} onChange={(v) => update(id, 'text', v)} type="textarea"
            placeholder="e.g. Save for retirement in 20 years, build passive income of ₹1L/month..." />
        ) : (
          <p className={`text-xs leading-relaxed px-1 ${data.text ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)] italic'}`}>
            {data.text || 'Click ✏️ to describe your investment goal'}
          </p>
        )}
      </div>
    </div>
  );
});

/* ═══ NODE: Horizon ═══ */
const HORIZONS = [
  { value: 'short',  label: 'Short-term',  sub: '< 1 year',    color: 'from-rose-600 to-pink-600',    ring: 'border-rose-500' },
  { value: 'medium', label: 'Medium-term', sub: '1–5 years',   color: 'from-amber-500 to-yellow-600', ring: 'border-amber-500' },
  { value: 'long',   label: 'Long-term',   sub: '> 5 years',   color: 'from-emerald-600 to-green-600', ring: 'border-emerald-500' },
];

const HorizonNode = memo(function HorizonNode({ id, data }) {
  const [editing, setEditing] = useState(false);
  const { update } = useContext(PrefCtx);
  const current = HORIZONS.find((h) => h.value === (data.value || 'medium')) || HORIZONS[1];

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-white/[0.1]/60 w-56 overflow-hidden">
      <Handle type="target" position={Position.Left}  style={{ background: '#f43f5e' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#f43f5e' }} />
      <Handle type="source" position={Position.Top}   style={{ background: '#f43f5e' }} />

      <NodeHeader gradient="bg-gradient-to-r from-rose-600 to-pink-600" icon={Timer} title="Time Horizon" editing={editing} onToggle={() => setEditing((e) => !e)} />

      <div className="p-3 space-y-1.5">
        {editing ? (
          <div className="nodrag space-y-1.5">
            {HORIZONS.map((h) => (
              <button key={h.value} onClick={() => update(id, 'value', h.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all text-left
                  ${data.value === h.value ? `${h.ring} bg-[var(--bg-raised)]` : 'border-white/[0.1] hover:border-slate-600 bg-[var(--bg-raised)]/50'}`}>
                <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${h.color} shrink-0`} />
                <div>
                  <p className="text-xs font-bold text-white">{h.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{h.sub}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-1 py-1">
            <div className={`w-2 h-12 rounded-full bg-gradient-to-b ${current.color} shrink-0`} />
            <div>
              <p className="text-sm font-bold text-white">{current.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{current.sub}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

/* ─── Node registry ─── */
const NODE_TYPES = { hub: HubNode, risk: RiskNode, budget: BudgetNode, sectors: SectorsNode, goal: GoalNode, horizon: HorizonNode };

/* ─── Edge style ─── */
const EDGE = {
  type: 'smoothstep', animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: '#4f46e5' },
  style: { stroke: '#4f46e5', strokeWidth: 2, opacity: 0.6 },
};

/* ─── Build initial nodes from profile ─── */
function buildNodes(profile) {
  return [
    { id: 'hub',     type: 'hub',     position: { x: 420, y: 230 }, data: {} },
    { id: 'risk',    type: 'risk',    position: { x: 60,  y: 80  }, data: { risk_tolerance: profile?.risk_tolerance || 'moderate' } },
    { id: 'budget',  type: 'budget',  position: { x: 760, y: 80  }, data: { amount: profile?.budget || '', currency: profile?.currency || 'USD' } },
    { id: 'sectors', type: 'sectors', position: { x: 300, y: 480 }, data: { selected: profile?.sectors || ['technology'] } },
    { id: 'goal',    type: 'goal',    position: { x: 60,  y: 400 }, data: { text: profile?.investment_goal || '' } },
    { id: 'horizon', type: 'horizon', position: { x: 780, y: 380 }, data: { value: profile?.time_horizon || 'medium' } },
  ];
}

const INITIAL_EDGES = [
  { id: 'e-hub-risk',    source: 'hub', target: 'risk',    ...EDGE },
  { id: 'e-hub-budget',  source: 'hub', target: 'budget',  ...EDGE },
  { id: 'e-hub-sectors', source: 'hub', target: 'sectors', ...EDGE },
  { id: 'e-hub-goal',    source: 'hub', target: 'goal',    ...EDGE },
  { id: 'e-hub-horizon', source: 'hub', target: 'horizon', ...EDGE },
];

function buildPayload(nodes) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n.data]));
  return {
    risk_tolerance:   byId.risk?.risk_tolerance   || 'moderate',
    budget:           parseFloat(byId.budget?.amount) || 0,
    currency:         byId.budget?.currency        || 'USD',
    sectors:          byId.sectors?.selected       || ['technology'],
    investment_goal:  byId.goal?.text              || '',
    time_horizon:     byId.horizon?.value          || 'medium',
  };
}

/* ═══════════════════════════════════════════════════════ */
export default function PreferencesCanvas({ existingProfile, onSave, saving, saved }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [initialized, setInitialized]   = useState(false);

  useEffect(() => {
    if (!initialized) {
      setNodes(buildNodes(existingProfile));
      setInitialized(true);
    }
  }, [existingProfile, initialized]);

  const update = useCallback((nodeId, field, value) => {
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n));
  }, [setNodes]);

  const ctxValue = useMemo(() => ({ update }), [update]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...EDGE }, eds)),
    [setEdges]
  );

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <PrefCtx.Provider value={ctxValue}>
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.07]/60 shadow-2xl">

        {/* Toolbar */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <button
            onClick={() => onSave(buildPayload(nodes))}
            disabled={saving || saved}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl
                       bg-gradient-to-r from-indigo-600 to-violet-600
                       hover:from-indigo-500 hover:to-violet-500
                       text-white shadow-lg shadow-indigo-500/20 disabled:opacity-60 transition-all active:scale-95"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <CheckCircle size={13} /> : <Save size={13} />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>

        {/* Hint */}
        <div className="absolute bottom-3 left-3 z-10 text-[11px] text-[var(--text-muted)]
                        bg-[var(--bg-card)]/70 backdrop-blur rounded-lg px-2.5 py-1.5 pointer-events-none">
          ✏️ Click pencil to edit each card · Drag nodes to rearrange
        </div>

        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          colorMode={isDark ? 'dark' : 'light'}
          fitView fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3} maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color={isDark ? '#1e293b' : '#e2e8f0'} />
          <Controls showInteractive={false} className="!bottom-12 !left-3" />
        </ReactFlow>
      </div>
    </PrefCtx.Provider>
  );
}
