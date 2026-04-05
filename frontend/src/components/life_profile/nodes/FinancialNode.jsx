import { memo, useState, useContext } from 'react';
import { Handle, Position } from '@xyflow/react';
import { PiggyBank, Pencil, Check } from 'lucide-react';
import { CanvasCtx } from '../CanvasContext';
import { NodeField, NodeRow } from '../NodeField';

export default memo(function FinancialNode({ id, data }) {
  const [editing, setEditing] = useState(false);
  const { update } = useContext(CanvasCtx);
  const set = (field, val) => update(id, field, val);

  const sym = data.currency === 'INR' ? '₹' : data.currency === 'EUR' ? '€' : data.currency === 'GBP' ? '£' : '$';

  return (
    <div className="bg-white dark:bg-[var(--bg-raised)] rounded-2xl shadow-xl border border-green-200 dark:border-green-800 w-64 overflow-hidden">
      <Handle type="target" position={Position.Left}   id="left"   style={{ background: '#22c55e' }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ background: '#22c55e' }} />
      <Handle type="source" position={Position.Top}    id="top"    style={{ background: '#22c55e' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#22c55e' }} />

      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <PiggyBank size={15} />
          <span className="text-sm font-bold">Financial</span>
        </div>
        <button className="nodrag text-green-100 hover:text-white transition-colors p-0.5" onClick={() => setEditing((e) => !e)}>
          {editing ? <Check size={15} /> : <Pencil size={13} />}
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2.5">
        {editing ? (
          <>
            <NodeField label={`Monthly Expenses (${sym}) *`} value={data.monthly_expenses} onChange={(v) => set('monthly_expenses', v)} type="number" placeholder="Rent, food, bills…" />
            <NodeField label={`Current Savings (${sym})`} value={data.existing_savings} onChange={(v) => set('existing_savings', v)} type="number" placeholder="Total savings" />
          </>
        ) : (
          <>
            <NodeRow icon="💸" label={data.monthly_expenses ? `${sym}${Number(data.monthly_expenses).toLocaleString()} expenses/mo` : 'Add monthly expenses'} empty={!data.monthly_expenses} />
            <NodeRow icon="🏦" label={data.existing_savings ? `${sym}${Number(data.existing_savings).toLocaleString()} saved` : 'Add current savings'} empty={!data.existing_savings} />
          </>
        )}
      </div>
    </div>
  );
});
