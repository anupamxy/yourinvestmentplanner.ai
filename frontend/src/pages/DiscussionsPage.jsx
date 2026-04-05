import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Plus, Users, X, Loader2, Check } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { discussionsApi } from '../api/discussionsApi';

const CATEGORIES = [
  { value: 'all',          label: 'All Rooms',      emoji: '🌐' },
  { value: 'stocks',       label: 'Stocks',         emoji: '📈' },
  { value: 'mutual_funds', label: 'Mutual Funds',   emoji: '🏦' },
  { value: 'crypto',       label: 'Crypto',         emoji: '₿' },
  { value: 'tax',          label: 'Tax & Planning', emoji: '📊' },
  { value: 'goals',        label: 'Financial Goals',emoji: '🎯' },
  { value: 'general',      label: 'General',        emoji: '💬' },
];

const CAT_COLORS = {
  stocks:       'from-blue-600 to-indigo-600',
  mutual_funds: 'from-emerald-600 to-teal-600',
  crypto:       'from-orange-500 to-amber-600',
  tax:          'from-violet-600 to-purple-600',
  goals:        'from-rose-600 to-pink-600',
  general:      'from-slate-600 to-slate-700',
};

function CreateRoomModal({ onClose, onCreate }) {
  const [form, setForm]     = useState({ name: '', category: 'general', description: '' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onCreate(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h3 className="font-bold text-white">Create Discussion Room</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Room Name *</label>
            <input className="input" placeholder="e.g. Smallcap Picks 2025" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} placeholder="What's this room about?"
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !form.name.trim()} className="btn-primary text-sm flex items-center gap-2">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomCard({ room, index }) {
  const gradient = CAT_COLORS[room.category] || CAT_COLORS.general;
  const catInfo  = CATEGORIES.find((c) => c.value === room.category) || CATEGORIES[0];

  return (
    <Link
      to={`/discussions/${room.slug}`}
      className="card p-0 overflow-hidden group hover:border-slate-600 hover:-translate-y-0.5 transition-all duration-200 animate-slide-up block"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Top gradient bar */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white group-hover:text-white transition-colors truncate">
              {room.name}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{room.description || 'No description'}</p>
          </div>
          <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${gradient} text-white`}>
            {catInfo.emoji}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <MessageSquare size={11} /> {room.message_count ?? 0} messages
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} /> {catInfo.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function DiscussionsPage() {
  const [rooms, setRooms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('all');
  const [creating, setCreating] = useState(false);

  const loadRooms = async (cat) => {
    setLoading(true);
    const { data } = await discussionsApi.rooms(cat === 'all' ? null : cat);
    setRooms(data);
    setLoading(false);
  };

  useEffect(() => { loadRooms(category); }, [category]);

  const handleCreate = async (form) => {
    await discussionsApi.createRoom(form);
    setCreating(false);
    loadRooms(category);
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageSquare size={22} className="text-indigo-400" /> Investment Discussions
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Real-time chat rooms — discuss stocks, funds, goals with the community
            </p>
          </div>
          <button onClick={() => setCreating(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={14} /> Create Room
          </button>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all
                ${category === c.value
                  ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-300'
                  : 'bg-[var(--bg-card)] border-white/[0.07] text-[var(--text-muted)] hover:border-white/[0.15] hover:text-[var(--text-primary)]'
                }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Room grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-400" size={32} />
          </div>
        ) : rooms.length === 0 ? (
          <div className="card text-center py-16">
            <MessageSquare size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-[var(--text-secondary)] font-medium">No rooms yet in this category</p>
            <button onClick={() => setCreating(true)} className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
              <Plus size={13} /> Be the first to create one
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((r, i) => <RoomCard key={r.id} room={r} index={i} />)}
          </div>
        )}
      </div>

      {creating && (
        <CreateRoomModal onClose={() => setCreating(false)} onCreate={handleCreate} />
      )}
    </Layout>
  );
}
