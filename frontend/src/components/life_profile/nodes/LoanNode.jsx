import { memo, useState, useContext } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CreditCard, Pencil, Check, X } from 'lucide-react';
import { CanvasCtx } from '../CanvasContext';
import { NodeField, NodeRow } from '../NodeField';

const LOAN_TYPES = ['Home Loan', 'Car Loan', 'Personal Loan', 'Education Loan', 'Business Loan', 'Other'];

export default memo(function LoanNode({ id, data }) {
  const [editing, setEditing] = useState(!data.loan_type);  // start in edit if new
  const { update, remove } = useContext(CanvasCtx);
  const set = (field, val) => update(id, field, val);

  const sym = data.currency === 'INR' ? '₹' : '$';

  return (
    <div className="bg-white dark:bg-[var(--bg-raised)] rounded-2xl shadow-xl border border-red-200 dark:border-red-800 w-60 overflow-hidden">
      <Handle type="target" position={Position.Top}    id="top"    style={{ background: '#ef4444' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#ef4444' }} />
      <Handle type="target" position={Position.Left}   id="left"   style={{ background: '#ef4444' }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ background: '#ef4444' }} />

      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-rose-500 px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <CreditCard size={13} />
          <span className="text-xs font-bold">Loan / EMI</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="nodrag text-red-100 hover:text-white transition-colors" onClick={() => setEditing((e) => !e)}>
            {editing ? <Check size={13} /> : <Pencil size={12} />}
          </button>
          <button className="nodrag text-red-100 hover:text-yellow-200 transition-colors" onClick={() => remove(id)}>
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {editing ? (
          <>
            <NodeField label="Loan Type" value={data.loan_type} onChange={(v) => set('loan_type', v)} type="select" options={LOAN_TYPES} />
            <NodeField label={`EMI Amount (${sym})`} value={data.emi_amount} onChange={(v) => set('emi_amount', v)} type="number" placeholder="Monthly EMI" />
            <NodeField label="Months Remaining" value={data.remaining_months} onChange={(v) => set('remaining_months', v)} type="number" placeholder="e.g. 36" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💳</span>
              <p className="text-sm font-bold text-[var(--text-primary)] dark:text-white">{data.loan_type || 'Add loan type'}</p>
            </div>
            <NodeRow icon="📅" label={data.emi_amount ? `${sym}${Number(data.emi_amount).toLocaleString()}/mo EMI` : 'Add EMI amount'} empty={!data.emi_amount} />
            <NodeRow icon="⏳" label={data.remaining_months ? `${data.remaining_months} months left` : 'Add duration'} empty={!data.remaining_months} />
          </>
        )}
      </div>
    </div>
  );
});
