import { memo, useState, useContext } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Users, Pencil, Check } from 'lucide-react';
import { CanvasCtx } from '../CanvasContext';
import { NodeField, NodeRow } from '../NodeField';

const MARITAL = [
  { value: 'single',   label: 'Single' },
  { value: 'married',  label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
];

export default memo(function PersonalNode({ id, data }) {
  const [editing, setEditing] = useState(false);
  const { update } = useContext(CanvasCtx);
  const set = (field, val) => update(id, field, val);

  return (
    <div className="bg-white dark:bg-[var(--bg-raised)] rounded-2xl shadow-xl border border-purple-200 dark:border-purple-800 w-64 overflow-hidden">
      <Handle type="target" position={Position.Right}  id="right"  style={{ background: '#a855f7' }} />
      <Handle type="source" position={Position.Left}   id="left"   style={{ background: '#a855f7' }} />
      <Handle type="source" position={Position.Top}    id="top"    style={{ background: '#a855f7' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#a855f7' }} />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Users size={15} />
          <span className="text-sm font-bold">Personal</span>
        </div>
        <button className="nodrag text-purple-100 hover:text-white transition-colors p-0.5" onClick={() => setEditing((e) => !e)}>
          {editing ? <Check size={15} /> : <Pencil size={13} />}
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2.5">
        {editing ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <NodeField label="Age *" value={data.age} onChange={(v) => set('age', v)} type="number" placeholder="e.g. 28" />
              <NodeField label="City" value={data.city} onChange={(v) => set('city', v)} placeholder="e.g. Mumbai" />
            </div>
            <NodeField label="Marital Status" value={data.marital_status} onChange={(v) => set('marital_status', v)} type="select" options={MARITAL} />
            <div className="nodrag space-y-2">
              <div>
                <label className="text-xs text-[var(--text-muted)] dark:text-[var(--text-secondary)]">Family Members: <strong>{data.family_members || 1}</strong></label>
                <input type="range" min="1" max="10" value={data.family_members || 1} onChange={(e) => set('family_members', parseInt(e.target.value))} className="w-full accent-purple-500 mt-1" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] dark:text-[var(--text-secondary)]">Dependents: <strong>{data.dependents || 0}</strong></label>
                <input type="range" min="0" max="8" value={data.dependents || 0} onChange={(e) => set('dependents', parseInt(e.target.value))} className="w-full accent-purple-500 mt-1" />
              </div>
            </div>
          </>
        ) : (
          <>
            <NodeRow icon="🎂" label={data.age ? `Age ${data.age}` : 'Add age'} empty={!data.age} />
            <NodeRow icon="📍" label={data.city || 'Add city'} empty={!data.city} />
            <NodeRow icon="💑" label={data.marital_status ? data.marital_status.charAt(0).toUpperCase() + data.marital_status.slice(1) : 'Single'} />
            <NodeRow icon="👨‍👩‍👧" label={`${data.family_members || 1} family · ${data.dependents || 0} dependents`} />
          </>
        )}
      </div>
    </div>
  );
});
