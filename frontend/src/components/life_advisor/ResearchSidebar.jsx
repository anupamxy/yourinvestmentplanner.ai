import { useState } from 'react';
import { ExternalLink, BookOpen, ChevronDown, Search } from 'lucide-react';

const SOURCE_META = {
  Reddit:            { emoji: '🔴', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
  Quora:             { emoji: '🟠', color: 'bg-red-500/10 border-red-500/20 text-red-400'           },
  LinkedIn:          { emoji: '🔵', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400'        },
  MoneyControl:      { emoji: '📊', color: 'bg-violet-500/10 border-violet-500/20 text-violet-400'  },
  'Economic Times':  { emoji: '📰', color: 'bg-sky-500/10 border-sky-500/20 text-sky-400'           },
  'Zerodha Varsity': { emoji: '📚', color: 'bg-teal-500/10 border-teal-500/20 text-teal-400'        },
  Investopedia:      { emoji: '📖', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'},
  Web:               { emoji: '🌐', color: 'bg-slate-500/10 border-slate-500/30 text-[var(--text-secondary)]'     },
};

function SourceCard({ source }) {
  const [open, setOpen] = useState(false);
  const meta = SOURCE_META[source.source] || SOURCE_META.Web;

  return (
    <div
      className={`border-b border-white/[0.04] last:border-0 transition-colors duration-150
                  ${open ? 'bg-indigo-500/[0.05]' : 'hover:bg-white/[0.03]'}`}
    >
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left">
        <span className="text-sm shrink-0 mt-0.5 leading-none">{meta.emoji}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${meta.color}`}>
              {source.source}
            </span>
          </div>
          <p className={`text-[12px] font-medium text-[var(--text-secondary)] leading-snug ${open ? '' : 'line-clamp-2'}`}>
            {source.title || 'Untitled'}
          </p>

          {open && (
            <div className="mt-2 space-y-1.5">
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{source.snippet}</p>
              {source.query && (
                <div className="flex items-center gap-1 text-[10px] text-slate-700">
                  <Search size={9} />
                  <span className="italic">"{source.query}"</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {source.url && (
            <a href={source.url} target="_blank" rel="noreferrer"
               onClick={(e) => e.stopPropagation()}
               className="text-slate-700 hover:text-indigo-400 transition-colors"
               title="Open source">
              <ExternalLink size={11} />
            </a>
          )}
          <ChevronDown size={11} className={`text-slate-700 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
    </div>
  );
}

export default function ResearchSidebar({ sources = [] }) {
  const [filter, setFilter] = useState('All');

  const groups  = sources.reduce((acc, s) => { const k = s.source || 'Web'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const tabs    = ['All', ...Object.keys(groups)];
  const filtered = filter === 'All' ? sources : sources.filter((s) => (s.source || 'Web') === filter);

  return (
    <div className="rounded-2xl border border-white/[0.07] overflow-hidden flex flex-col h-full"
         style={{ background: 'var(--bg-card)' }}>

      {/* Header */}
      <div className="px-4 py-4 border-b border-white/[0.05]"
           style={{ background: 'var(--bg-raised)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20
                          flex items-center justify-center">
            <BookOpen size={13} className="text-indigo-400" />
          </div>
          <h3 className="font-bold text-[13px] text-white">Research Sources</h3>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">
          {sources.length} results · Reddit, Quora &amp; financial sites
        </p>

        {sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all
                  ${filter === tab
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white/[0.05] border border-white/[0.07] text-[var(--text-secondary)] hover:bg-white/[0.08] hover:text-[var(--text-primary)]'
                  }`}
              >
                {tab === 'All'
                  ? `All (${sources.length})`
                  : `${SOURCE_META[tab]?.emoji || '🌐'} ${tab} (${groups[tab]})`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Source list */}
      <div className="flex-1 overflow-y-auto">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <span className="text-3xl mb-2">🔍</span>
            <p className="text-[13px] text-[var(--text-muted)]">No research sources yet</p>
            <p className="text-[11px] text-slate-700 mt-1">Run analysis to fetch community insights</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-[var(--text-muted)]">No {filter} results found</div>
        ) : (
          filtered.map((source, i) => <SourceCard key={i} source={source} />)
        )}
      </div>

      {/* Footer */}
      {sources.length > 0 && (
        <div className="px-4 py-2.5 border-t border-white/[0.05]"
             style={{ background: 'var(--bg-raised)' }}>
          <p className="text-[10px] text-slate-700 text-center">
            Click any result to expand · 🔗 to open source
          </p>
        </div>
      )}
    </div>
  );
}
