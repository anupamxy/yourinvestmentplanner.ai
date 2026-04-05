import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Calendar, TrendingUp, BadgeCheck, Download,
  FileText, FileDown, Printer, ChevronDown,
} from 'lucide-react';

/* ─── Download helpers ─── */
function downloadMd(report, date) {
  const header = `# Investment Analysis Report\n**Date:** ${date}\n**Tickers:** ${(report.tickers || []).join(', ')}\n**Confidence:** ${Math.round((report.confidence_score || 0) * 100)}%\n\n---\n\n`;
  const blob = new Blob([header + (report.full_report || '')], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `investai-report-${date.replace(/\s/g, '-')}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadTxt(report, date) {
  const text = `INVESTAI REPORT — ${date}\nTickers: ${(report.tickers || []).join(', ')}\nConfidence: ${Math.round((report.confidence_score || 0) * 100)}%\n\n${(report.full_report || '').replace(/[#*`_~]/g, '')}`;
  const blob = new Blob([text], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `investai-report-${date.replace(/\s/g, '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function printReport(report, date) {
  const win = window.open('', '_blank');
  const html = `<!DOCTYPE html><html><head><title>InvestAI Report — ${date}</title>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:40px auto;color:#1a1a2e;line-height:1.7}
      h1{font-size:1.8rem;border-bottom:2px solid #6366f1;padding-bottom:8px;color:#1a1a2e}
      h2{font-size:1.3rem;color:#2d2d5e;margin-top:2rem;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
      h3{font-size:1.1rem;color:#3d3d6e}
      p,li{color:#374151}strong{color:#111827}
      table{width:100%;border-collapse:collapse;margin:1rem 0}
      th{background:#f3f4f6;border:1px solid #d1d5db;padding:8px 12px;font-weight:600}
      td{border:1px solid #d1d5db;padding:8px 12px}
      blockquote{border-left:4px solid #6366f1;padding-left:1rem;color:#6b7280}
      .meta{background:#f9fafb;padding:12px 16px;border-radius:8px;margin-bottom:2rem;font-size:.9rem;color:#6b7280}
    </style></head><body>
    <h1>📊 Investment Analysis Report</h1>
    <div class="meta"><strong>Date:</strong> ${date} &nbsp;|&nbsp;
      <strong>Tickers:</strong> ${(report.tickers || []).join(', ') || '—'} &nbsp;|&nbsp;
      <strong>Confidence:</strong> ${Math.round((report.confidence_score || 0) * 100)}%
    </div>${report.full_report?.replace(/\n/g, '<br>') || ''}
    </body></html>`;
  win.document.documentElement.innerHTML = html;
  win.print();
}

/* ─── Dropdown menu ─── */
function DownloadMenu({ report, date }) {
  const [open, setOpen] = useState(false);

  const options = [
    { icon: FileDown,  label: 'Markdown (.md)',  action: () => downloadMd(report, date)  },
    { icon: FileText,  label: 'Plain text (.txt)', action: () => downloadTxt(report, date) },
    { icon: Printer,   label: 'Print / Save PDF',  action: () => printReport(report, date) },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-[13px] font-semibold
                   px-3 py-1.5 rounded-xl
                   bg-indigo-600/10 hover:bg-indigo-600/20
                   border border-indigo-500/30 hover:border-indigo-500/60
                   text-indigo-400 hover:text-indigo-300
                   transition-all duration-200"
      >
        <Download size={13} /> Download
        <ChevronDown size={11} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-48
                          rounded-xl border border-white/[0.09] shadow-2xl overflow-hidden animate-scale-in"
               style={{ background: 'var(--bg-raised)' }}>
            {options.map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={() => { action(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                           text-[var(--text-secondary)] hover:text-white
                           hover:bg-white/[0.06] transition-colors text-left"
              >
                <Icon size={13} className="text-indigo-400 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function ReportViewer({ report }) {
  if (!report) return null;

  const date  = new Date(report.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const score = Math.round((report.confidence_score || 0) * 100);
  const scoreColor = score >= 75 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25'
                   : score >= 50 ? 'text-amber-400 bg-amber-400/10 border-amber-400/25'
                   :               'text-red-400 bg-red-400/10 border-red-400/25';

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Report header card ── */}
      <div className="rounded-2xl border border-white/[0.08] overflow-hidden"
           style={{ background: 'var(--bg-card)' }}>

        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          {/* Left — meta info */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
              <Calendar size={12} /> {date}
            </div>

            {report.tickers?.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <TrendingUp size={12} className="text-indigo-400 shrink-0" />
                {report.tickers.map((t) => (
                  <span key={t}
                    className="text-[11px] font-mono font-semibold
                               bg-indigo-500/10 border border-indigo-500/20
                               text-indigo-300 px-1.5 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {score > 0 && (
              <span className={`flex items-center gap-1 text-[11px] font-semibold
                               px-2 py-0.5 rounded-full border ${scoreColor}`}>
                <BadgeCheck size={11} /> {score}% confidence
              </span>
            )}
          </div>

          {/* Right — download */}
          <DownloadMenu report={report} date={date} />
        </div>
      </div>

      {/* ── Report body ── */}
      <div className="rounded-2xl border border-white/[0.07] overflow-hidden"
           style={{ background: 'var(--bg-card)' }}>
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-2"
             style={{ background: 'var(--bg-raised)' }}>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25
                          flex items-center justify-center">
            <TrendingUp size={13} className="text-indigo-400" />
          </div>
          <h2 className="text-[14px] font-bold text-white">Investment Analysis Report</h2>
        </div>

        <div className="px-6 py-6 report-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report.full_report}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
