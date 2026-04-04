import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { reportApi } from '../../api/reportApi';

// Suggested starter questions shown before the first message
const SUGGESTIONS = [
  'Which stocks should I prioritize and why?',
  'What are the biggest risks in my portfolio?',
  'How does my risk tolerance affect these recommendations?',
  'Can you explain the allocation percentages?',
  'What should I do if the market drops significantly?',
];

function TypingCursor() {
  return (
    <span className="inline-block w-2 h-4 bg-indigo-500 dark:bg-indigo-400 ml-0.5 rounded-sm animate-pulse" />
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
        ${isUser
          ? 'bg-indigo-500 dark:bg-indigo-600'
          : 'bg-gradient-to-br from-violet-500 to-indigo-600'
        }`}
      >
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-indigo-500 dark:bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-100 rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <div className="report-content prose prose-sm dark:prose-invert max-w-none">
            {msg.content ? (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
                {msg.streaming && <TypingCursor />}
              </>
            ) : (
              <span className="flex items-center gap-2 text-gray-400 dark:text-slate-400">
                <span className="dot-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="dot-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="dot-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </span>
            )}
          </div>
        )}
        {msg.error && (
          <p className="mt-1 text-red-300 flex items-center gap-1 text-xs">
            <AlertCircle size={12} /> {msg.error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReportQA({ reportId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuestion = async (question) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput('');
    setLoading(true);

    // Add user message + empty AI placeholder
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: q },
      { role: 'ai', content: '', streaming: true },
    ]);

    try {
      const res = await reportApi.askStream(reportId, q);
      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // SSE lines end with \n\n — process complete lines only
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep potentially incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') {
            setMessages((prev) =>
              prev.map((m, i) => (i === prev.length - 1 ? { ...m, streaming: false } : m))
            );
            setLoading(false);
            inputRef.current?.focus();
            return;
          }
          try {
            const payload = JSON.parse(raw);
            if (payload.chunk) {
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1
                    ? { ...m, content: m.content + payload.chunk }
                    : m
                )
              );
            } else if (payload.error) {
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1
                    ? { ...m, content: 'Something went wrong.', error: payload.error, streaming: false }
                    : m
                )
              );
              setLoading(false);
              return;
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, content: 'Failed to connect. Please try again.', error: err.message, streaming: false }
            : m
        )
      );
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(input);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-slate-800 dark:to-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Ask About Your Report</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">Ask anything about your investment plan, risks, or strategy</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="h-96 overflow-y-auto px-5 py-4 space-y-5 scroll-smooth">
        {messages.length === 0 ? (
          /* Empty state — suggestion chips */
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                <Bot size={24} className="text-indigo-500 dark:text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Ask me anything about your report</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">I have full context of your investment plan</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendQuestion(s)}
                  className="px-3 py-1.5 text-xs rounded-full border border-indigo-200 dark:border-slate-600
                    bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300
                    hover:bg-indigo-100 dark:hover:bg-slate-600 transition-colors"
                >
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

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask a question about your investment plan..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-slate-600
              bg-white dark:bg-slate-700 text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-slate-400
              px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500
              disabled:opacity-50 max-h-28 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={() => sendQuestion(input)}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600
              disabled:bg-gray-200 dark:disabled:bg-slate-600 disabled:cursor-not-allowed
              flex items-center justify-center transition-colors shadow-sm"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} className="text-white disabled:text-gray-400" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5 pl-1">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
