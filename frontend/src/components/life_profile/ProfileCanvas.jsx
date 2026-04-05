import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow, useNodesState, useEdgesState, addEdge,
  Background, Controls, MiniMap,
  MarkerType, BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Plus, Save, CheckCircle, Loader2, ChevronDown } from 'lucide-react';

import { CanvasCtx } from './CanvasContext';
import HubNode          from './nodes/HubNode';
import ProfessionalNode from './nodes/ProfessionalNode';
import PersonalNode     from './nodes/PersonalNode';
import FinancialNode    from './nodes/FinancialNode';
import GoalNode, { GOAL_MAP, GOAL_OPTIONS } from './nodes/GoalNode';
import LoanNode         from './nodes/LoanNode';

/* ─── node type registry ─── */
const NODE_TYPES = {
  hub:          HubNode,
  professional: ProfessionalNode,
  personal:     PersonalNode,
  financial:    FinancialNode,
  goal:         GoalNode,
  loan:         LoanNode,
};

/* ─── edge style ─── */
const EDGE_STYLE = {
  type: 'smoothstep',
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: '#6366f1' },
  style: { stroke: '#6366f1', strokeWidth: 2, opacity: 0.7 },
};

/* ─── build initial nodes from optional existing profile ─── */
function buildNodes(profile) {
  const nodes = [
    {
      id: 'hub',
      type: 'hub',
      position: { x: 440, y: 220 },
      data: {},
    },
    {
      id: 'professional',
      type: 'professional',
      position: { x: 60, y: 60 },
      data: {
        profession:          profile?.profession            || '',
        employer:            profile?.employer              || '',
        monthly_salary:      profile?.monthly_salary        || '',
        years_of_experience: profile?.years_of_experience   || 0,
        currency:            profile?.currency              || 'INR',
      },
    },
    {
      id: 'personal',
      type: 'personal',
      position: { x: 60, y: 340 },
      data: {
        age:            profile?.age            || '',
        city:           profile?.city           || '',
        marital_status: profile?.marital_status || 'single',
        family_members: profile?.family_members || 1,
        dependents:     profile?.dependents     || 0,
      },
    },
    {
      id: 'financial',
      type: 'financial',
      position: { x: 800, y: 220 },
      data: {
        monthly_expenses: profile?.monthly_expenses || '',
        existing_savings: profile?.existing_savings || '',
        currency:         profile?.currency         || 'INR',
      },
    },
  ];

  // Goal nodes from existing profile
  (profile?.life_goals || []).forEach((gk, i) => {
    nodes.push({
      id: `goal-${gk}`,
      type: 'goal',
      position: { x: 200 + i * 280, y: 560 },
      data: {
        goal_key:    gk,
        emoji:       GOAL_MAP[gk]?.emoji || '🎯',
        target_year: profile.goals_detail?.[gk]?.target_year || (new Date().getFullYear() + 5),
        budget:      profile.goals_detail?.[gk]?.budget      || '',
        currency:    profile?.currency || 'INR',
      },
    });
  });

  // Loan nodes from existing profile
  (profile?.existing_loans || []).forEach((loan, i) => {
    nodes.push({
      id: `loan-${Date.now()}-${i}`,
      type: 'loan',
      position: { x: 820 + i * 280, y: 420 },
      data: {
        loan_type:        loan.type,
        emi_amount:       loan.emi_amount,
        remaining_months: loan.remaining_months,
        currency:         profile?.currency || 'INR',
      },
    });
  });

  return nodes;
}

function buildEdges(nodes) {
  const edges = [
    { id: 'e-hub-prof', source: 'hub', target: 'professional', ...EDGE_STYLE },
    { id: 'e-hub-pers', source: 'hub', target: 'personal',     ...EDGE_STYLE },
    { id: 'e-hub-fin',  source: 'hub', target: 'financial',    ...EDGE_STYLE },
  ];
  nodes
    .filter((n) => n.type === 'goal' || n.type === 'loan')
    .forEach((n) => {
      edges.push({ id: `e-hub-${n.id}`, source: 'hub', target: n.id, ...EDGE_STYLE });
    });
  return edges;
}

/* ─── compile graph → backend profile payload ─── */
function buildPayload(nodes) {
  const byId   = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const byType = (t) => nodes.filter((n) => n.type === t);

  const prof = byId.professional?.data || {};
  const pers = byId.personal?.data     || {};
  const fin  = byId.financial?.data    || {};

  const goalNodes = byType('goal');
  const loanNodes = byType('loan');

  return {
    profession:          prof.profession          || '',
    employer:            prof.employer            || '',
    monthly_salary:      parseFloat(prof.monthly_salary)  || 0,
    years_of_experience: prof.years_of_experience || 0,
    currency:            prof.currency            || 'INR',

    age:            pers.age ? parseInt(pers.age) : null,
    city:           pers.city           || '',
    marital_status: pers.marital_status || 'single',
    family_members: pers.family_members || 1,
    dependents:     pers.dependents     || 0,

    monthly_expenses: parseFloat(fin.monthly_expenses) || 0,
    existing_savings: parseFloat(fin.existing_savings) || 0,

    life_goals: goalNodes.filter((n) => n.data.goal_key).map((n) => n.data.goal_key),

    goals_detail: Object.fromEntries(
      goalNodes
        .filter((n) => n.data.goal_key)
        .map((n) => [n.data.goal_key, { target_year: n.data.target_year, budget: n.data.budget }])
    ),

    existing_loans: loanNodes.map((n) => ({
      type:             n.data.loan_type        || '',
      emi_amount:       parseFloat(n.data.emi_amount)       || 0,
      remaining_months: parseInt(n.data.remaining_months)   || 0,
    })),
  };
}

/* ═══════════════════════════════════════════════════════════════ */
export default function ProfileCanvas({ existingProfile, onSave, saving, saved }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [initialized, setInitialized]   = useState(false);
  const [goalMenuOpen, setGoalMenuOpen] = useState(false);
  const goalMenuRef = useRef(null);

  /* initialize once profile is available */
  useEffect(() => {
    if (!initialized) {
      const initialNodes = buildNodes(existingProfile);
      setNodes(initialNodes);
      setEdges(buildEdges(initialNodes));
      setInitialized(true);
    }
  }, [existingProfile, initialized]);

  /* close goal dropdown on outside click */
  useEffect(() => {
    const handler = (e) => { if (goalMenuRef.current && !goalMenuRef.current.contains(e.target)) setGoalMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─ callbacks passed via context ─ */
  const update = useCallback((nodeId, field, value) => {
    setNodes((nds) =>
      nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n)
    );
  }, [setNodes]);

  const remove = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const ctxValue = useMemo(() => ({ update, remove }), [update, remove]);

  /* ─ connect handles ─ */
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...EDGE_STYLE }, eds)),
    [setEdges]
  );

  /* ─ add goal node ─ */
  const addGoal = useCallback((goalKey) => {
    setGoalMenuOpen(false);
    const existing = nodes.find((n) => n.type === 'goal' && n.data.goal_key === goalKey);
    if (existing) return;   // already on canvas

    const goalNodes  = nodes.filter((n) => n.type === 'goal');
    const id = `goal-${goalKey}`;
    const newNode = {
      id,
      type: 'goal',
      position: { x: 200 + goalNodes.length * 290, y: 560 },
      data: {
        goal_key:    goalKey,
        emoji:       GOAL_MAP[goalKey]?.emoji || '🎯',
        target_year: new Date().getFullYear() + 5,
        budget:      '',
        currency:    nodes.find((n) => n.id === 'professional')?.data?.currency || 'INR',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, { id: `e-hub-${id}`, source: 'hub', target: id, ...EDGE_STYLE }]);
  }, [nodes, setNodes, setEdges]);

  /* ─ add loan node ─ */
  const addLoan = useCallback(() => {
    const loanNodes = nodes.filter((n) => n.type === 'loan');
    const id = `loan-${Date.now()}`;
    const newNode = {
      id,
      type: 'loan',
      position: { x: 820 + loanNodes.length * 290, y: 420 },
      data: {
        loan_type:        '',
        emi_amount:       '',
        remaining_months: '',
        currency:         nodes.find((n) => n.id === 'professional')?.data?.currency || 'INR',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, { id: `e-hub-${id}`, source: 'hub', target: id, ...EDGE_STYLE }]);
  }, [nodes, setNodes, setEdges]);

  /* ─ save ─ */
  const handleSave = () => onSave(buildPayload(nodes));

  /* ─ dark mode detection ─ */
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <CanvasCtx.Provider value={ctxValue}>
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.1] shadow-xl">

        {/* ── Toolbar ── */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 dark:bg-[var(--bg-raised)]/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-lg border border-gray-200 dark:border-white/[0.1]">

          {/* Add Goal */}
          <div className="relative" ref={goalMenuRef}>
            <button
              onClick={() => setGoalMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            >
              <Plus size={13} /> Add Goal <ChevronDown size={11} className={`transition-transform ${goalMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {goalMenuOpen && (
              <div className="absolute top-full mt-1.5 left-0 bg-white dark:bg-[var(--bg-raised)] rounded-xl border border-gray-200 dark:border-white/[0.1] shadow-xl p-2 grid grid-cols-2 gap-1 w-64 z-20">
                {GOAL_OPTIONS.map((g) => {
                  const alreadyAdded = nodes.some((n) => n.type === 'goal' && n.data.goal_key === g.value);
                  return (
                    <button
                      key={g.value}
                      onClick={() => addGoal(g.value)}
                      disabled={alreadyAdded}
                      className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-colors text-left ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]'}`}
                    >
                      <span>{g.emoji}</span> {g.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Loan */}
          <button
            onClick={addLoan}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <Plus size={13} /> Add Loan
          </button>

          <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 mx-1" />

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <CheckCircle size={13} /> : <Save size={13} />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Profile'}
          </button>
        </div>

        {/* ── Canvas hint ── */}
        <div className="absolute bottom-3 left-3 z-10 text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)] bg-white/70 dark:bg-[var(--bg-raised)]/70 backdrop-blur rounded-lg px-2.5 py-1.5 pointer-events-none">
          ✏️ Click pencil on any node to edit · Drag nodes to rearrange · Connect handles to link
        </div>

        {/* ── React Flow ── */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          colorMode={isDark ? 'dark' : 'light'}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={isDark ? '#334155' : '#e2e8f0'} />
          <Controls className="!bottom-12 !left-3" showInteractive={false} />
          <MiniMap
            nodeColor={(n) =>
              n.type === 'professional' ? '#3b82f6' :
              n.type === 'personal'     ? '#a855f7' :
              n.type === 'financial'    ? '#22c55e' :
              n.type === 'goal'         ? '#f59e0b' :
              n.type === 'loan'         ? '#ef4444' :
              '#6366f1'
            }
            className="!bottom-12 !right-3 !rounded-xl overflow-hidden border border-gray-200 dark:border-white/[0.1]"
            style={{ width: 140, height: 90 }}
          />
        </ReactFlow>
      </div>
    </CanvasCtx.Provider>
  );
}
