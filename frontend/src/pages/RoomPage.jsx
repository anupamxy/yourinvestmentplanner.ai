import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Wifi, WifiOff, MessageSquare, Users } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { discussionsApi } from '../api/discussionsApi';
import { useRoomSocket } from '../hooks/useRoomSocket';
import useAuthStore from '../store/useAuthStore';

/* ─── Category gradient map ─── */
const CAT_GRAD = {
  stocks:       'from-blue-600 to-indigo-600',
  mutual_funds: 'from-emerald-600 to-teal-600',
  crypto:       'from-orange-500 to-amber-600',
  tax:          'from-violet-600 to-purple-600',
  goals:        'from-rose-600 to-pink-600',
  general:      'from-slate-600 to-slate-700',
};

/* ─── Single message bubble ─── */
function MessageBubble({ msg, isOwn }) {
  const time = new Date(msg.timestamp || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''} animate-slide-up`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                       ${isOwn ? 'bg-indigo-600' : 'bg-slate-700'}`}>
        {(msg.username || '?')[0].toUpperCase()}
      </div>
      <div className={`max-w-[72%] space-y-0.5 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && <p className="text-[10px] text-[var(--text-muted)] px-1">{msg.username}</p>}
        <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed
          ${isOwn
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-black text-[var(--text-primary)] border border-white/[0.08] rounded-tl-sm'
          }`}>
          {msg.content}
        </div>
        <p className="text-[10px] text-[var(--text-muted)] px-1">{time}</p>
      </div>
    </div>
  );
}

/* ─── System notification (join/leave) ─── */
function SystemMsg({ text }) {
  return (
    <div className="flex justify-center animate-fade-in">
      <span className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-card)] border border-white/[0.07] px-3 py-0.5 rounded-full">
        {text}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function RoomPage() {
  const { slug }              = useParams();
  const { user }              = useAuthStore();
  const [room, setRoom]       = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState('');
  const [online, setOnline]   = useState(new Set());
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  /* Load room info + history */
  useEffect(() => {
    Promise.all([discussionsApi.room(slug), discussionsApi.messages(slug)]).then(
      ([{ data: r }, { data: m }]) => {
        setRoom(r);
        setMessages(m.map((msg) => ({ ...msg, _type: 'message' })));
      }
    );
  }, [slug]);

  /* Handle incoming WebSocket events */
  const onEvent = useCallback((event) => {
    if (event.type === 'message') {
      setMessages((prev) => [...prev, { ...event, _type: 'message' }]);
    } else if (event.type === 'join') {
      setOnline((s) => new Set([...s, event.username]));
      setMessages((prev) => [...prev, { _type: 'system', content: `${event.username} joined the room` }]);
    } else if (event.type === 'leave') {
      setOnline((s) => { const n = new Set(s); n.delete(event.username); return n; });
      setMessages((prev) => [...prev, { _type: 'system', content: `${event.username} left the room` }]);
    }
  }, []);

  const { send, connected } = useRoomSocket(slug, onEvent);

  /* Auto-scroll on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const txt = input.trim();
    if (!txt || !connected) return;
    send(txt);
    setInput('');
    inputRef.current?.focus();
  };

  const gradient = CAT_GRAD[room?.category] || CAT_GRAD.general;

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto gap-4">

        {/* Room header */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} p-4 shadow-lg animate-fade-in`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/discussions" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <ArrowLeft size={15} className="text-white" />
              </Link>
              <div>
                <h1 className="font-bold text-white text-lg leading-tight">{room?.name || '…'}</h1>
                <p className="text-white/60 text-xs">{room?.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white/70 text-xs">
              <span className="flex items-center gap-1">
                <Users size={12} /> {online.size} online
              </span>
              <span className={`flex items-center gap-1 ${connected ? 'text-green-300' : 'text-red-300'}`}>
                {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {connected ? 'Connected' : 'Reconnecting…'}
              </span>
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* Messages */}
          <div className="lg:col-span-3 flex flex-col card p-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <MessageSquare size={32} className="text-slate-700 mb-3" />
                  <p className="text-[var(--text-muted)] text-sm">No messages yet</p>
                  <p className="text-[var(--text-muted)] text-xs mt-1">Be the first to start the conversation!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                msg._type === 'system'
                  ? <SystemMsg key={i} text={msg.content} />
                  : <MessageBubble key={msg.id || i} msg={msg} isOwn={msg.username === user?.username} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.07] p-3 flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={connected ? 'Type a message…' : 'Connecting…'}
                disabled={!connected}
                className="flex-1 bg-[var(--bg-card)] border border-white/[0.09] rounded-xl px-3 py-2.5 text-sm
                           text-white placeholder-slate-600 resize-none focus:outline-none
                           focus:ring-1 focus:ring-indigo-500 disabled:opacity-40 max-h-32"
                style={{ minHeight: 42 }}
              />
              <button
                onClick={handleSend}
                disabled={!connected || !input.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                           bg-gradient-to-br from-indigo-600 to-violet-600
                           hover:from-indigo-500 hover:to-violet-500
                           disabled:opacity-40 text-white shadow-md transition-all active:scale-95"
              >
                <Send size={15} />
              </button>
            </div>
          </div>

          {/* Online members sidebar */}
          <div className="hidden lg:flex flex-col card gap-3">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Online Now
            </p>
            {online.size === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">Only you here</p>
            ) : (
              [...online].map((name) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-[10px] font-bold text-white">
                    {name[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] truncate">{name}</span>
                </div>
              ))
            )}
            <div className="mt-auto pt-3 border-t border-white/[0.07] text-xs text-[var(--text-muted)]">
              Messages are not end-to-end encrypted
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
