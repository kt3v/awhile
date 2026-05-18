export default function Legend() {
  return (
    <div className="flex items-center gap-5 text-xs font-medium" style={{ color: 'var(--text-3)' }}>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm inline-block cell-past" />
        Empty
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm inline-block cell-future cell-has-note" />
        Has note
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-sm inline-block cell-future ring-2 ring-[var(--orange)] ring-offset-1"
          style={{ '--tw-ring-offset-color': 'var(--bg-header)' } as React.CSSProperties}
        />
        Current
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-sm inline-block cell-past ring-2 ring-[var(--blue)] ring-offset-1"
          style={{ '--tw-ring-offset-color': 'var(--bg-header)' } as React.CSSProperties}
        />
        Selected
      </span>
    </div>
  );
}
