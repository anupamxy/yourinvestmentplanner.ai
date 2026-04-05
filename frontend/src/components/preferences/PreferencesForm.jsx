import { useState, useEffect } from 'react';
import usePreferencesStore from '../../store/usePreferencesStore';
import { CheckCircle, AlertCircle } from 'lucide-react';

const SECTORS = [
  { value: 'technology',    label: 'Technology' },
  { value: 'healthcare',    label: 'Healthcare' },
  { value: 'finance',       label: 'Finance' },
  { value: 'energy',        label: 'Energy' },
  { value: 'consumer',      label: 'Consumer' },
  { value: 'industrials',   label: 'Industrials' },
  { value: 'utilities',     label: 'Utilities' },
  { value: 'real_estate',   label: 'Real Estate' },
  { value: 'materials',     label: 'Materials' },
  { value: 'communication', label: 'Communication' },
];

const HORIZONS = [
  { value: 'short',  label: 'Short-term (< 1 year)' },
  { value: 'medium', label: 'Medium-term (1–5 years)' },
  { value: 'long',   label: 'Long-term (> 5 years)' },
];

const DEFAULT_FORM = {
  risk_tolerance: 'moderate',
  sectors: ['technology'],
  budget: '',
  investment_goal: '',
  time_horizon: 'medium',
  currency: 'USD',
};

export default function PreferencesForm({ onSaved }) {
  const { profile, saving, error, fetchProfile, saveProfile } = usePreferencesStore();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchProfile(); }, []);
  useEffect(() => {
    if (profile) {
      setForm({
        risk_tolerance: profile.risk_tolerance,
        sectors: profile.sectors,
        budget: profile.budget,
        investment_goal: profile.investment_goal,
        time_horizon: profile.time_horizon,
        currency: profile.currency,
      });
    }
  }, [profile]);

  const toggleSector = (val) => {
    setForm((f) => ({
      ...f,
      sectors: f.sectors.includes(val)
        ? f.sectors.filter((s) => s !== val)
        : [...f.sectors, val],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await saveProfile({ ...form, budget: parseFloat(form.budget) });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (onSaved) onSaved();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Risk Tolerance */}
      <div>
        <label className="label">Risk Tolerance</label>
        <div className="grid grid-cols-3 gap-3">
          {['conservative', 'moderate', 'aggressive'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm((f) => ({ ...f, risk_tolerance: r }))}
              className={`py-2 px-3 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                form.risk_tolerance === r
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-[var(--text-secondary)] hover:border-gray-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {form.risk_tolerance === 'conservative' && 'Stable, dividend-focused investments'}
          {form.risk_tolerance === 'moderate' && 'Balanced mix of growth and value stocks'}
          {form.risk_tolerance === 'aggressive' && 'High-growth, higher-volatility positions'}
        </p>
      </div>

      {/* Sectors */}
      <div>
        <label className="label">Preferred Sectors <span className="text-[var(--text-muted)] font-normal">(select all that apply)</span></label>
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => toggleSector(s.value)}
              className={`py-1.5 px-3 rounded-full text-sm font-medium border transition-all ${
                form.sectors.includes(s.value)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-[var(--text-secondary)] hover:border-blue-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget + Currency */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="label">Investment Budget</label>
          <input
            type="number"
            min="100"
            step="100"
            required
            value={form.budget}
            onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
            placeholder="e.g. 10000"
            className="input"
          />
        </div>
        <div>
          <label className="label">Currency</label>
          <select
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            className="input"
          >
            <option value="USD">USD — US Dollar</option>
            <option value="INR">INR — Indian Rupee ₹</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="JPY">JPY — Japanese Yen</option>
          </select>
          {form.currency === 'INR' && (
            <div className="mt-2 flex items-start gap-2 text-xs bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg px-3 py-2 text-orange-700 dark:text-orange-300">
              <span className="text-base leading-none mt-0.5">🇮🇳</span>
              <span>
                <strong>Indian Market Mode:</strong> Analysis will use NSE-listed stocks (Nifty 50 companies) via Yahoo Finance. Recommendations will be in ₹ and include Indian market context — RBI policy, SEBI regulations, and tax implications (STCG/LTCG).
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Investment Goal */}
      <div>
        <label className="label">Investment Goal</label>
        <textarea
          required
          rows={3}
          value={form.investment_goal}
          onChange={(e) => setForm((f) => ({ ...f, investment_goal: e.target.value }))}
          placeholder="e.g. Save for retirement in 20 years, build a passive income stream, grow wealth by 15% annually..."
          className="input resize-none"
        />
      </div>

      {/* Time Horizon */}
      <div>
        <label className="label">Time Horizon</label>
        <div className="grid grid-cols-3 gap-3">
          {HORIZONS.map((h) => (
            <button
              key={h.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, time_horizon: h.value }))}
              className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                form.time_horizon === h.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-[var(--text-secondary)] hover:border-gray-300'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle size={16} /> Preferences saved successfully!
        </div>
      )}

      <button type="submit" disabled={saving || form.sectors.length === 0} className="btn-primary w-full py-3">
        {saving ? 'Saving...' : profile ? 'Update Preferences' : 'Save Preferences'}
      </button>
    </form>
  );
}
