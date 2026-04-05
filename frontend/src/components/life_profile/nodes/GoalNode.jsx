import { memo, useState, useContext } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Target, Pencil, Check, X } from 'lucide-react';
import { CanvasCtx } from '../CanvasContext';
import { NodeField, NodeRow } from '../NodeField';

export const GOAL_OPTIONS = [
  { value: 'house',          label: 'Buy a House',       emoji: '🏠' },
  { value: 'marriage',       label: 'Marriage',           emoji: '💍' },
  { value: 'retirement',     label: 'Retirement',         emoji: '🌴' },
  { value: 'education',      label: "Child's Education",  emoji: '🎓' },
  { value: 'business',       label: 'Start a Business',   emoji: '🚀' },
  { value: 'emergency_fund', label: 'Emergency Fund',     emoji: '🛡️' },
  { value: 'travel',         label: 'Travel',             emoji: '✈️' },
  { value: 'vehicle',        label: 'Buy a Vehicle',      emoji: '🚗' },
];

export const GOAL_MAP = Object.fromEntries(GOAL_OPTIONS.map((g) => [g.value, g]));

export default memo(function GoalNode({ id, data }) {
  const [editing, setEditing] = useState(!data.goal_key);  // start in edit if new
  const { update, remove } = useContext(CanvasCtx);
  const set = (field, val) => update(id, field, val);

  const goal = GOAL_MAP[data.goal_key] || {};
  const sym  = data.currency === 'INR' ? '₹' : '$';

  const goalOptions = GOAL_OPTIONS.map((g) => ({ value: g.value, label: `${g.emoji} ${g.label}` }));

  return (
    <div className="bg-white dark:bg-[var(--bg-raised)] rounded-2xl shadow-xl border border-amber-200 dark:border-amber-700 w-60 overflow-hidden">
      <Handle type="target" position={Position.Top}    id="top"    style={{ background: '#f59e0b' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#f59e0b' }} />
      <Handle type="target" position={Position.Left}   id="left"   style={{ background: '#f59e0b' }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ background: '#f59e0b' }} />

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Target size={13} />
          <span className="text-xs font-bold">Life Goal</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="nodrag text-amber-100 hover:text-white transition-colors" onClick={() => setEditing((e) => !e)}>
            {editing ? <Check size={13} /> : <Pencil size={12} />}
          </button>
          <button className="nodrag text-amber-100 hover:text-red-200 transition-colors" onClick={() => remove(id)}>
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {editing ? (
          <>
            <NodeField label="Goal Type" value={data.goal_key} onChange={(v) => { set('goal_key', v); const g = GOAL_MAP[v]; if (g) set('emoji', g.emoji); }} type="select" options={goalOptions} />
            <NodeField label="Target Year" value={data.target_year} onChange={(v) => set('target_year', v)} type="number" placeholder={String(new Date().getFullYear() + 5)} />
            <NodeField label="Budget" value={data.budget} onChange={(v) => set('budget', v)} type="number" placeholder="Estimated cost" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{goal.emoji || '🎯'}</span>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)] dark:text-white">{goal.label || 'Set a goal'}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Target: {data.target_year || '—'}</p>
              </div>
            </div>
            <NodeRow icon="💰" label={data.budget ? `${sym}${Number(data.budget).toLocaleString()} budget` : 'Add budget'} empty={!data.budget} />
          </>
        )}
      </div>
    </div>
  );
});
