/** Shared field input used inside node edit-mode cards. */
export function NodeField({ label, value, onChange, type = 'text', placeholder, options }) {
  return (
    <div className="nodrag">
      <label className="block text-xs text-[var(--text-muted)] dark:text-[var(--text-secondary)] mb-0.5">{label}</label>
      {type === 'select' ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-xs rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>
              {o.label ?? o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-xs rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      )}
    </div>
  );
}

/** Read-only row displayed in view mode. */
export function NodeRow({ icon, label, empty }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${empty ? 'text-slate-700 dark:text-[var(--text-muted)] italic' : 'text-[var(--text-secondary)] dark:text-[var(--text-secondary)] font-medium'}`}>
      <span className="text-sm">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
