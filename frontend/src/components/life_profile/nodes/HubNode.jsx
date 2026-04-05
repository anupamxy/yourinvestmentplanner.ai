import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

export default memo(function HubNode() {
  return (
    <div className="relative">
      <Handle type="source" position={Position.Top}    id="top"    style={{ background: '#a78bfa' }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ background: '#a78bfa' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#a78bfa' }} />
      <Handle type="source" position={Position.Left}   id="left"   style={{ background: '#a78bfa' }} />

      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex flex-col items-center justify-center shadow-2xl border-4 border-white/20 select-none">
        <span className="text-5xl mb-1">🌟</span>
        <p className="text-white font-bold text-xs tracking-wide">My Life Profile</p>
        <p className="text-indigo-200 text-[10px] mt-0.5">Drag to arrange</p>
      </div>
    </div>
  );
});
