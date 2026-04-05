import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { reportApi } from '../../api/reportApi';

const SUGGESTIONS = [
  'Which stocks should I prioritize and why?',
  'What are the biggest risks in my portfolio?',
  'How does my risk tolerance affect these recommendations?',
  'Can you explain the allocation percentages?',
  'What should I do if the market drops significantly?',
];

function TypingCursor() {
  return <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-0.5 rounded-sm animate-pulse" />;
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white
        ${isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-violet-600 to-indigo-600'}`}>
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
        ${isUser
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'border border-white/[0.08] text-[var(--text-primary)] rounded-tl-sm'
        }`}
        style={isUser ? {} : { background: 'var(--bg-raised)' }}
      >
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <div className="report-content">
            {msg.content ? (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                {msg.streaming && <TypingCursor />}
              </>
            ) : (
              <span className="flex items-center gap-1 text-[var(--text-muted)]">
                <span className="dot-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="dot-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="dot-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </span>
            )}
          </div>
        )}
        {msg.error && (
          <p className="mt-1 text-red-400 flex items-center gap-1 text-xs">
            <AlertCircle size={11} /> {msg.error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReportQA({ reportId }) {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendQuestion = async (question) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput('');
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: q },
      { role: 'ai',   content: '', streaming: true },
    ]);

    try {
      const res = await reportApi.askStream(reportId, q);
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') {
            setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, streaming: false } : m));
            setLoading(false);
            inputRef.current?.focus();
            return;
          }
          try {
            const payload = JSON.parse(raw);
            if (payload.chunk) {
              setMessages((prev) => prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: m.content + payload.chunk } : m
              ));
            } else if (payload.error) {
              setMessages((prev) => prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: 'Something went wrong.', error: payload.error, streaming: false } : m
              ));
              setLoading(false);
              return;
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      setMessages((prev) => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, content: 'Failed to connect. Please try again.', error: err.message, streaming: false } : m
      ));
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion(input); }
  };

  return (
    <div className="mt-5 rounded-2xl border border-white/[0.08] overflow-hidden"
         style={{ background: 'var(--bg-card)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]"
           style={{ background: 'var(--bg-raised)' }}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600
                        flex items-center justify-center shadow-md shadow-indigo-500/25">
          <Sparkles size={15} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white text-[13px]">Ask About Your Report</h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Ask anything about your investment plan, risks, or strategy
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-2xl border border-white/[0.08]
                              flex items-center justify-center mx-auto mb-3"
                   style={{ background: 'var(--bg-raised)' }}>
                <Bot size={20} className="text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Ask me anything about your report</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">I have full context of your investment plan</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => sendQuestion(s)}
                  className="px-3 py-1.5 text-[11px] rounded-full
                             border border-indigo-500/25 bg-indigo-500/8
                             text-indigo-300 hover:bg-indigo-500/15 hover:border-indigo-500/40
                             transition-all duration-150">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => <Message key={i} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.07]"
           style={{ background: 'var(--bg-raised)' }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask a question about your investment plan…"
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm
                       text-[var(--text-primary)] placeholder-[var(--text-muted)]
                       focus:outline-none disabled:opacity-50
                       max-h-28 overflow-y-auto transition-all"
            style={{
              minHeight: '42px',
              background: 'var(--bg-input)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
            onBlur={(e)  => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
          />
          <button
            onClick={() => sendQuestion(input)}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500
                       disabled:opacity-30 disabled:cursor-not-allowed
                       flex items-center justify-center transition-all active:scale-95
                       shadow-md shadow-indigo-600/25 shrink-0"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Send size={15} className="text-white" />
            }
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-1.5 pl-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
