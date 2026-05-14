import { memo } from 'react';
import { isCurrentMonth, isPast, MONTHS_SHORT } from '../utils/dates';
import type { CellId, Note } from '../types';

interface TagStripe {
  colorVar: string;
  rank: number;
}

interface Props {
  year: number;
  month: number;
  note: Note | undefined;
  isSelected: boolean;
  isInRange: boolean;
  isRangeEnd: boolean;
  inactive: boolean;
  stripes?: TagStripe[];
  hoveredColor?: string;
  onMouseDown: (cell: CellId) => void;
  onMouseEnter: (cell: CellId) => void;
  onTouchStart: (cell: CellId, e: React.TouchEvent<HTMLButtonElement>) => void;
}

const MonthCell = memo(({ year, month, note, isSelected, isInRange, isRangeEnd, inactive, stripes, hoveredColor, onMouseDown, onMouseEnter, onTouchStart }: Props) => {
  if (inactive) {
    return <div className="w-5 h-5 rounded-sm shrink-0 cell-inactive" title="" />;
  }

  const current = isCurrentMonth(year, month);
  const past = isPast(year, month);
  const hasNote = !!note?.text?.trim();

  const cellClass = hasNote
    ? (past ? 'cell-note-past' : 'cell-note-future')
    : (past ? 'cell-past' : 'cell-future');

  let ringClass = '';
  let extraStyle: React.CSSProperties = {};

  if (isSelected) {
    ringClass = 'ring-2 ring-[var(--blue)] ring-offset-1';
    extraStyle = { '--tw-ring-offset-color': 'var(--bg-canvas)' } as React.CSSProperties;
  } else if (isInRange) {
    extraStyle = {
      background: 'var(--blue)',
      outline: isRangeEnd ? '2px solid color-mix(in srgb, var(--blue) 60%, #000)' : 'none',
      outlineOffset: '-1px',
    };
  } else if (hoveredColor) {
    extraStyle = {
      background: `color-mix(in srgb, ${hoveredColor} 55%, var(--bg-canvas))`,
      outline: `1px solid color-mix(in srgb, ${hoveredColor} 80%, transparent)`,
      outlineOffset: '-1px',
    };
  } else if (current) {
    ringClass = 'ring-2 ring-[var(--orange)] ring-offset-1';
    extraStyle = { '--tw-ring-offset-color': 'var(--bg-canvas)' } as React.CSSProperties;
  }

  const cell: CellId = { year, month };
  const showStripes = !hoveredColor && !isInRange && stripes && stripes.length > 0;

  return (
    <button
      title={`${MONTHS_SHORT[month]} ${year}`}
      data-cell-year={year}
      data-cell-month={month}
      onMouseDown={(e) => { e.preventDefault(); onMouseDown(cell); }}
      onMouseEnter={() => onMouseEnter(cell)}
      onTouchStart={(e) => onTouchStart(cell, e)}
      onContextMenu={(e) => e.preventDefault()}
      className={`w-5 h-5 rounded-sm transition-all duration-100 shrink-0 relative ${cellClass} ${ringClass}`}
      style={Object.keys(extraStyle).length ? extraStyle : undefined}
    >
      {showStripes && (() => {
        const sorted = [...stripes!].sort((a, b) => a.rank - b.rank);
        const N = sorted.length;
        return (
          <span className="absolute inset-0 pointer-events-none">
            {sorted.map(({ colorVar, rank }, i) => (
              <span
                key={rank}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: `${100 / N}%`,
                  bottom: `${(i / N) * 100}%`,
                  background: `color-mix(in srgb, ${colorVar} 55%, transparent)`,
                }}
              />
            ))}
          </span>
        );
      })()}
    </button>
  );
});

MonthCell.displayName = 'MonthCell';
export default MonthCell;
