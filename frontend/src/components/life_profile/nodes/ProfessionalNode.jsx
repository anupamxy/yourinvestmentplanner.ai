import { memo, useState, useContext } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Briefcase, Pencil, Check } from 'lucide-react';
import { CanvasCtx } from '../CanvasContext';
import { NodeField, NodeRow } from '../NodeField';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

export default memo(function ProfessionalNode({ id, data }) {
  const [editing, setEditing] = useState(false);
  const { update } = useContext(CanvasCtx);
  const set = (field, val) => update(id, field, val);

  const sym = data.currency === 'INR' ? '₹' : data.currency === 'EUR' ? '€' : data.currency === 'GBP' ? '£' : '$';

  return (
    <div className="bg-white dark:bg-[var(--bg-raised)] rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 w-64 overflow-hidden">
      <Handle type="target" position={Position.Right} id="right" style={{ background: '#3b82f6' }} />
      <Handle type="source" position={Position.Left}  id="left"  style={{ background: '#3b82f6' }} />
      <Handle type="source" position={Position.Top}   id="top"   style={{ background: '#3b82f6' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#3b82f6' }} />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Briefcase size={15} />
          <span className="text-sm font-bold">Professional</span>
        </div>
        <button
          className="nodrag text-blue-100 hover:text-white transition-colors p-0.5"
          onClick={() => setEditing((e) => !e)}
        >
          {editing ? <Check size={15} /> : <Pencil size={13} />}
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2.5">
        {editing ? (
          <>
            <NodeField label="Job Title *" value={data.profession} onChange={(v) => set('profession', v)} placeholder="e.g. Software Engineer" />
            <NodeField label="Employer" value={data.employer} onChange={(v) => set('employer', v)} placeholder="e.g. TCS, Self-employed" />
            <div className="grid grid-cols-2 gap-2">
              <NodeField label="Currency" value={data.currency} onChange={(v) => set('currency', v)} type="select" options={CURRENCIES} />
              <NodeField label={`Salary (${sym})`} value={data.monthly_salary} onChange={(v) => set('monthly_salary', v)} type="number" placeholder="Monthly" />
            </div>
            <div className="nodrag">
              <label className="text-xs text-[var(--text-muted)] dark:text-[var(--text-secondary)]">Experience: <strong>{data.years_of_experience || 0} yrs</strong></label>
              <input type="range" min="0" max="40" value={data.years_of_experience || 0}
                onChange={(e) => set('years_of_experience', parseInt(e.target.value))}
                className="w-full accent-blue-500 mt-1" />
            </div>
          </>
        ) : (
          <>
            <NodeRow icon="💼" label={data.profession || 'Add profession'} empty={!data.profession} />
            <NodeRow icon="🏢" label={data.employer  || 'Add employer'}   empty={!data.employer} />
            <NodeRow icon="💰" label={data.monthly_salary ? `${sym}${Number(data.monthly_salary).toLocaleString()}/mo` : 'Add salary'} empty={!data.monthly_salary} />
            <NodeRow icon="📅" label={`${data.years_of_experience || 0} yrs experience · ${data.currency || 'INR'}`} />
          </>
        )}
      </div>
    </div>
  );
});
