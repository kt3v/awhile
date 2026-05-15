import { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { TAG_COLOR_VAR, TAG_LABEL_COLOR, randomTagColor } from '../utils/tagColors';
import type { CellId, RangeTag } from '../types';

// Layout constants — must match Grid.tsx exactly
const ROW_PITCH = 24;    // h-5 (20px) + gap-1 (4px)
const DECADE_EXTRA = 17; // my-2 (8+8) + h-px (1)
const CELL_HEIGHT = 20;

const CHIP_HEIGHT = 20;
const MOBILE_CHIP_MAX_WIDTH = 78;
const DESKTOP_CHIP_MAX_WIDTH = MOBILE_CHIP_MAX_WIDTH * 3;
const MOBILE_COL_WIDTH = 82;    // chip max-width + gap
const DESKTOP_COL_WIDTH = DESKTOP_CHIP_MAX_WIDTH + 8;
const CHIP_GAP = 4;
const MAX_VERTICAL_SHIFT = 32;

function rowTopPx(yearIndex: number): number {
  const decades = Math.floor(yearIndex / 10);
  return yearIndex * ROW_PITCH + decades * DECADE_EXTRA;
}

// Top of chip centered vertically within year range
function chipCenteredTop(startIdx: number, endIdx: number): number {
  const rangeTop = rowTopPx(startIdx);
  const rangeBottom = rowTopPx(endIdx) + CELL_HEIGHT;
  return (rangeTop + rangeBottom) / 2 - CHIP_HEIGHT / 2;
}

function overlaps(aTop: number, bTop: number): boolean {
  return !(aTop + CHIP_HEIGHT + CHIP_GAP <= bTop || bTop + CHIP_HEIGHT + CHIP_GAP <= aTop);
}

function findNearestAvailableTop(idealTop: number, takenTops: number[]): { top: number; distance: number } {
  if (takenTops.length === 0) return { top: idealTop, distance: 0 };

  const candidates: number[] = [idealTop];
  for (const t of takenTops) {
    candidates.push(t - (CHIP_HEIGHT + CHIP_GAP));
    candidates.push(t + (CHIP_HEIGHT + CHIP_GAP));
  }

  let bestTop = idealTop;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidateTop of candidates) {
    const conflict = takenTops.some((takenTop) => overlaps(candidateTop, takenTop));
    if (conflict) continue;
    const distance = Math.abs(candidateTop - idealTop);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestTop = candidateTop;
    }
  }

  if (bestDistance !== Number.POSITIVE_INFINITY) {
    return { top: bestTop, distance: bestDistance };
  }

  let fallbackTop = idealTop;
  while (takenTops.some((takenTop) => overlaps(fallbackTop, takenTop))) {
    fallbackTop += CHIP_HEIGHT + CHIP_GAP;
  }
  return { top: fallbackTop, distance: Math.abs(fallbackTop - idealTop) };
}

function assignTagPositions(tags: RangeTag[], birthYear: number): Map<string, { col: number; top: number }> {
  const sorted = [...tags].sort((a, b) => {
    const aMid = (a.startYear + a.endYear) / 2;
    const bMid = (b.startYear + b.endYear) / 2;
    if (aMid !== bMid) return aMid - bMid;
    if (a.startYear !== b.startYear) return a.startYear - b.startYear;
    return a.endYear - b.endYear;
  });

  const positions = new Map<string, { col: number; top: number }>();
  const columns: number[][] = [];

  for (const tag of sorted) {
    const startIdx = Math.max(0, tag.startYear - birthYear);
    const endIdx = Math.max(0, tag.endYear - birthYear);
    const idealTop = chipCenteredTop(startIdx, endIdx);

    let col = 0;
    while (true) {
      if (!columns[col]) columns[col] = [];
      const { top, distance } = findNearestAvailableTop(idealTop, columns[col]);
      const shouldUseColumn = col === 0 || distance <= MAX_VERTICAL_SHIFT;
      if (shouldUseColumn) {
        columns[col].push(top);
        positions.set(tag.id, { col, top });
        break;
      }
      col += 1;
    }
  }

  return positions;
}

interface Props {
  birthYear: number;
  selectedRange: { start: CellId; end: CellId } | null;
  topOffset: number;
  onHoverTag: (id: string | null) => void;
  onClearRange: () => void;
}

export default function TagsSidebar({
  birthYear,
  selectedRange,
  topOffset,
  onHoverTag,
  onClearRange,
}: Props) {
  const rangeTags = useStore((s) => s.rangeTags);
  const selectedTagId = useStore((s) => s.selectedTagId);
  const addRangeTag = useStore((s) => s.addRangeTag);
  const selectTag = useStore((s) => s.selectTag);

  const [showForm, setShowForm] = useState(false);
  const [formLabel, setFormLabel] = useState('');
  const [localHovered, setLocalHovered] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedRange) {
      setShowForm(false);
      setFormLabel('');
    }
  }, [selectedRange]);

  useEffect(() => {
    if (showForm) inputRef.current?.focus();
  }, [showForm]);

  useEffect(() => {
    const syncMobile = () => setIsMobile(window.innerWidth < 640);
    syncMobile();
    window.addEventListener('resize', syncMobile);
    return () => window.removeEventListener('resize', syncMobile);
  }, []);

  const basePositionMap = assignTagPositions(rangeTags, birthYear);

  const rangeStartYear = selectedRange
    ? Math.min(selectedRange.start.year, selectedRange.end.year)
    : birthYear;
  const rangeEndYear = selectedRange
    ? Math.max(selectedRange.start.year, selectedRange.end.year)
    : birthYear;

  const draftLayout = (() => {
    if (!selectedRange) return null;
    const draftId = '__draft__';
    const map = assignTagPositions(
      [
        ...rangeTags,
        {
          id: draftId,
          label: '',
          color: 'blue',
          startYear: rangeStartYear,
          startMonth: 0,
          endYear: rangeEndYear,
          endMonth: 11,
          note: '',
          updatedAt: null,
        },
      ],
      birthYear
    );
    return {
      map,
      draftPos: map.get(draftId) ?? { col: 0, top: 0 },
    };
  })();

  const positionMap = draftLayout?.map ?? basePositionMap;
  const numColumns = positionMap.size > 0
    ? Math.max(...Array.from(positionMap.values(), (v) => v.col)) + 1
    : 0;
  const chipMaxWidth = isMobile ? MOBILE_CHIP_MAX_WIDTH : DESKTOP_CHIP_MAX_WIDTH;
  const colWidth = isMobile ? MOBILE_COL_WIDTH : DESKTOP_COL_WIDTH;

  // Sidebar width: columns stack leftward from the right edge (closest to grid).
  // Column 0 is rightmost (right: 0), column 1 is COL_WIDTH further left, etc.
  const sidebarWidth = numColumns * colWidth + chipMaxWidth;

  const addButtonLocalPos = draftLayout?.draftPos ?? { col: 0, top: 0 };
  const addButtonCol = isMobile ? 0 : addButtonLocalPos.col;
  const addButtonTop = topOffset + addButtonLocalPos.top;
  const addButtonRight = isMobile ? 0 : addButtonCol * colWidth;

  function handleSubmit() {
    if (!selectedRange || !formLabel.trim()) return;
    const startLinear = selectedRange.start.year * 12 + selectedRange.start.month;
    const endLinear = selectedRange.end.year * 12 + selectedRange.end.month;
    const [from, to] = startLinear <= endLinear
      ? [selectedRange.start, selectedRange.end]
      : [selectedRange.end, selectedRange.start];
    addRangeTag({
      label: formLabel.trim(),
      color: randomTagColor(),
      startYear: from.year,
      startMonth: from.month,
      endYear: to.year,
      endMonth: to.month,
      note: '',
      updatedAt: null,
    });
    onClearRange();
    setShowForm(false);
    setFormLabel('');
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') { setShowForm(false); setFormLabel(''); }
  }

  return (
    <div
      data-tags-sidebar
      className="relative shrink-0 pb-12"
      style={{ width: sidebarWidth, minWidth: chipMaxWidth + 2 }}
    >
      {/* Tag chips — anchored from the right (closest to grid) */}
      {rangeTags.map((tag) => {
        const pos = positionMap.get(tag.id) ?? { col: 0, top: 0 };
        const chipTop = topOffset + pos.top;
        // Column 0 = rightmost; each extra column goes further left
        const chipRight = pos.col * colWidth;
        const isHov = localHovered === tag.id;
        const isSel = selectedTagId === tag.id;
        const colorVar = TAG_COLOR_VAR[tag.color];
        const labelColor = TAG_LABEL_COLOR[tag.color];

        return (
          <div
            key={tag.id}
            title={tag.label}
            style={{
              position: 'absolute',
              top: chipTop,
              right: chipRight,
              height: CHIP_HEIGHT,
              maxWidth: chipMaxWidth,
              padding: '0 5px',
              borderRadius: 999,
              background: isHov || isSel
                ? colorVar
                : `color-mix(in srgb, ${colorVar} 60%, var(--bg-canvas))`,
              outline: isSel ? `2px solid ${colorVar}` : 'none',
              outlineOffset: 2,
              cursor: 'pointer',
              transition: 'background 150ms',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              boxShadow: isSel
                ? `0 0 0 3px color-mix(in srgb, ${colorVar} 25%, transparent)`
                : 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              touchAction: 'manipulation',
            }}
            onClick={() => selectTag(isSel ? null : tag.id)}
            onMouseEnter={() => { setLocalHovered(tag.id); onHoverTag(tag.id); }}
            onMouseLeave={() => { setLocalHovered(null); onHoverTag(null); }}
            onTouchStart={() => { setLocalHovered(tag.id); onHoverTag(tag.id); }}
            onTouchEnd={() => { setLocalHovered(null); onHoverTag(null); }}
            onTouchCancel={() => { setLocalHovered(null); onHoverTag(null); }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: labelColor,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '0.01em',
              flexShrink: 1,
              minWidth: 0,
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}>
              {tag.label}
            </span>
          </div>
        );
      })}

      {/* "Add tag" button — right-aligned (closest to grid) */}
      {selectedRange && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            position: 'absolute',
            top: addButtonTop,
            right: addButtonRight,
            height: CHIP_HEIGHT,
            padding: '0 6px',
            fontSize: 10,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: 'var(--text-2)',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: 'var(--shadow-sm)',
            transition: 'background 120ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M4 1v6M1 4h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add tag
        </button>
      )}

      {/* Inline add form — right-aligned */}
      {selectedRange && showForm && (
        <div
          style={{
            position: 'absolute',
            top: addButtonTop,
            right: isMobile ? undefined : addButtonRight,
            left: isMobile ? `calc(100% - ${chipMaxWidth}px)` : undefined,
            transform: isMobile ? `translateX(${chipMaxWidth + 4}px)` : undefined,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            zIndex: 10,
          }}
        >
          <input
            ref={inputRef}
            value={formLabel}
            onChange={(e) => setFormLabel(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Tag name…"
            style={{
              height: 22,
              width: 112,
              fontSize: 10,
              fontWeight: 500,
              padding: '0 7px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-1)',
              outline: 'none',
              boxShadow: 'var(--shadow-sm)',
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!formLabel.trim()}
            style={{
              height: 22,
              padding: '0 9px',
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 6,
              border: 'none',
              background: formLabel.trim() ? 'var(--blue)' : 'var(--bg-secondary)',
              color: formLabel.trim() ? '#fff' : 'var(--text-3)',
              cursor: formLabel.trim() ? 'pointer' : 'default',
              transition: 'background 120ms',
            }}
          >
            Add
          </button>
          <button
            onClick={() => { setShowForm(false); setFormLabel(''); }}
            style={{
              height: 22,
              width: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-3)',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
