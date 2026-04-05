import { useEffect, useRef, useState } from 'react';
import { ExternalLink, AlertTriangle, Lightbulb, TrendingUp, Calendar, Shield, Sparkles } from 'lucide-react';

// Animated circular score gauge
function ScoreGauge({ score, label }) {
  const [displayed, setDisplayed] = useState(0);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (displayed / 100) * circ;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const bgLabel = score >= 70 ? 'text-green-600 dark:text-green-400' : score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  useEffect(() => {
    let frame;
    let current = 0;
    const step = () => {
      current = Math.min(current + 2, score);
      setDisplayed(current);
      if (current < score) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" className="dark:stroke-slate-700" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.05s linear' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white dark:text-white">{displayed}</span>
          <span className="text-xs text-[var(--text-muted)]">/100</span>
        </div>
      </div>
      <span className={`text-lg font-bold ${bgLabel}`}>{label}</span>
      <span className="text-xs text-[var(--text-muted)] dark:text-[var(--text-secondary)]">Financial Health Score</span>
    </div>
  );
}

// Animated horizontal bar
function Bar({ label, amount, max, color, symbol, delay = 0 }) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.min((amount / max) * 100, 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-[var(--text-secondary)] dark:text-[var(--text-secondary)] font-medium">{label}</span>
        <span className="font-semibold text-white dark:text-white">{symbol}{Number(amount).toLocaleString()}</span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

// Section wrapper with staggered reveal
function Section({ title, icon: Icon, color, children, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div ref={ref} className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className={`rounded-2xl border p-5 ${color}`}>
        <h3 className="flex items-center gap-2 font-bold text-base mb-4">
          <Icon size={18} /> {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

const PRIORITY_STYLES = {
  critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300',
  high:     'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-300',
  medium:   'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300',
};

const SOURCE_COLORS = {
  Reddit:       'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  Quora:        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  LinkedIn:     'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  Investopedia: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  Web:          'bg-gray-100 dark:bg-slate-700 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]',
};

export default function LifeAdvisorReport({ report, symbol = '₹' }) {
  if (!report) return null;
  const income = report.monthly_breakdown?.income || 1;

  return (
    <div className="space-y-6 animate-card-reveal">
      {/* Hero — Score + Summary */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreGauge score={report.financial_health_score || 0} label={report.financial_health_label || ''} />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-indigo-200 text-sm font-medium mb-2">Your Personalized Life Financial Plan</p>
            <p className="text-white text-base leading-relaxed">{report.summary}</p>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <Section title="Monthly Money Flow" icon={TrendingUp} color="border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[var(--bg-card)]" delay={100}>
        {report.monthly_breakdown && (
          <div className="space-y-3">
            {[
              { label: 'Income',               amount: report.monthly_breakdown.income,               color: 'bg-green-500', delay: 200 },
              { label: 'Expenses',             amount: report.monthly_breakdown.expenses,             color: 'bg-red-400',   delay: 350 },
              { label: 'EMIs / Loans',         amount: report.monthly_breakdown.total_emi,            color: 'bg-orange-400', delay: 500 },
              { label: 'Disposable Income',    amount: report.monthly_breakdown.disposable,           color: 'bg-blue-500',  delay: 650 },
              { label: 'Recommended Savings',  amount: report.monthly_breakdown.recommended_savings,  color: 'bg-indigo-500', delay: 800 },
            ].map((b) => (
              <Bar key={b.label} label={b.label} amount={b.amount || 0} max={income} color={b.color} symbol={symbol} delay={b.delay} />
            ))}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.1] flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Savings Rate</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {report.monthly_breakdown.savings_rate_pct?.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </Section>

      {/* Immediate Actions */}
      {report.immediate_actions?.length > 0 && (
        <Section title="Immediate Action Plan" icon={Sparkles} color="border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[var(--bg-card)]" delay={200}>
          <div className="space-y-3">
            {report.immediate_actions.map((action, i) => (
              <div key={i} className={`border rounded-xl p-4 transition-all duration-500 ${PRIORITY_STYLES[action.priority] || PRIORITY_STYLES.medium}`}
                style={{ transitionDelay: `${i * 80}ms`, opacity: 1 }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                        action.priority === 'critical' ? 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300' :
                        action.priority === 'high' ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300' :
                        'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300'}`}>
                        {action.priority}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] dark:text-[var(--text-secondary)]">{action.timeline}</span>
                    </div>
                    <p className="font-semibold text-sm">{action.title}</p>
                    <p className="text-xs mt-1 opacity-80">{action.description}</p>
                  </div>
                  {action.amount > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-xs opacity-60">Target</p>
                      <p className="font-bold text-sm">{symbol}{Number(action.amount).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Goals Timeline */}
      {report.goals_timeline?.length > 0 && (
        <Section title="Life Goals Timeline" icon={Calendar} color="border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[var(--bg-card)]" delay={300}>
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-indigo-200 dark:bg-slate-600" />
            {report.goals_timeline.map((g, i) => (
              <div key={i} className="relative mb-6 animate-card-left" style={{ animationDelay: `${i * 100 + 400}ms` }}>
                <div className="absolute -left-4 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-xs">
                  <span>{g.icon}</span>
                </div>
                <div className="bg-gray-50 dark:bg-[var(--bg-raised)] rounded-xl p-4 border border-gray-100 dark:border-white/[0.1]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white dark:text-white text-sm">{g.goal}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Target: {g.target_year}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)]">Corpus Needed</p>
                      <p className="font-bold text-white dark:text-white text-sm">{symbol}{Number(g.corpus_needed || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)] mt-2">{g.strategy}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                    <span>📅 Save {symbol}{Number(g.monthly_saving_needed || 0).toLocaleString()}/month</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Investment Plan */}
      {report.investment_plan?.length > 0 && (
        <Section title="Investment Recommendations" icon={TrendingUp} color="border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/10" delay={400}>
          <div className="grid gap-3">
            {report.investment_plan.map((inv, i) => (
              <div key={i} className="bg-white dark:bg-[var(--bg-raised)] rounded-xl p-4 border border-indigo-100 dark:border-white/[0.1] flex items-start gap-3"
                style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${inv.risk_level === 'high' ? 'bg-red-400' : inv.risk_level === 'medium' ? 'bg-amber-400' : 'bg-green-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-white dark:text-white text-sm">{inv.instrument}</p>
                    <span className="shrink-0 text-xs font-bold text-green-600 dark:text-green-400">{inv.expected_annual_return}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] dark:text-[var(--text-secondary)] mt-0.5">{inv.why}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[var(--text-muted)]">Monthly</p>
                  <p className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">{symbol}{Number(inv.monthly_amount || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Community Insights */}
      {report.community_insights?.length > 0 && (
        <Section title="Community Wisdom" icon={Lightbulb} color="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10" delay={500}>
          <div className="space-y-3">
            {report.community_insights.map((c, i) => (
              <div key={i} className="bg-white dark:bg-[var(--bg-raised)] rounded-xl p-3 border border-amber-100 dark:border-white/[0.1]">
                <div className="flex items-start gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${SOURCE_COLORS[c.source] || SOURCE_COLORS.Web}`}>
                    {c.source}
                  </span>
                  <p className="text-sm text-[var(--text-secondary)] dark:text-[var(--text-secondary)] flex-1">{c.insight}</p>
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer" className="shrink-0 text-[var(--text-muted)] hover:text-indigo-500 transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Risk + Tax side-by-side */}
      <div className="grid sm:grid-cols-2 gap-4">
        {report.risk_flags?.length > 0 && (
          <Section title="Risk Warnings" icon={AlertTriangle} color="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10" delay={600}>
            <ul className="space-y-2">
              {report.risk_flags.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                  <span className="mt-0.5">⚠️</span> {r}
                </li>
              ))}
            </ul>
          </Section>
        )}
        {report.tax_tips?.length > 0 && (
          <Section title="Tax Tips" icon={Shield} color="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10" delay={650}>
            <ul className="space-y-2">
              {report.tax_tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                  <span className="mt-0.5">💚</span> {t}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      {/* Motivation */}
      {report.motivation && (
        <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-center text-white shadow-lg animate-card-reveal" style={{ animationDelay: '700ms' }}>
          <span className="text-3xl mb-3 block">🌟</span>
          <p className="text-base font-medium leading-relaxed">{report.motivation}</p>
        </div>
      )}
    </div>
  );
}
