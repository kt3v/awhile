import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import MonthCell from './MonthCell';
import TagsSidebar from './TagsSidebar';
import { MONTHS_SHORT, parseBirthDate, isBeforeBirth } from '../utils/dates';
import { useStore, cellKey } from '../store/useStore';
import { TAG_COLOR_VAR } from '../utils/tagColors';
import type { CellId } from '../types';

const TOUCH_HOLD_MS = 180;
const TOUCH_MOVE_CANCEL_PX = 10;

interface PendingTouch {
  cell: CellId;
  startX: number;
  startY: number;
  holdTimer: number;
}

function cellLinearIndex(cell: CellId): number {
  return cell.year * 12 + cell.month;
}

function cellInRange(cell: CellId, start: CellId, end: CellId): boolean {
  const idx = cellLinearIndex(cell);
  const lo = Math.min(cellLinearIndex(start), cellLinearIndex(end));
  const hi = Math.max(cellLinearIndex(start), cellLinearIndex(end));
  return idx >= lo && idx <= hi;
}

export default function Grid() {
  const settings = useStore((s) => s.settings);
  const notes = useStore((s) => s.notes);
  const selectedCell = useStore((s) => s.selectedCell);
  const selectCell = useStore((s) => s.selectCell);
  const rangeTags = useStore((s) => s.rangeTags);
  const selectedTagId = useStore((s) => s.selectedTagId);

  const [drag, setDrag] = useState<{ start: CellId; end: CellId; moved: boolean } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: CellId; end: CellId } | null>(null);
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<CellId | null>(null);
  const [headerHeight, setHeaderHeight] = useState(26);
  const [touchSelecting, setTouchSelecting] = useState(false);

  const dragRef = useRef(drag);
  dragRef.current = drag;
  const headerRef = useRef<HTMLDivElement>(null);
  const touchSelectingRef = useRef(touchSelecting);
  touchSelectingRef.current = touchSelecting;
  const pendingTouchRef = useRef<PendingTouch | null>(null);

  const clearPendingTouch = useCallback(() => {
    const pending = pendingTouchRef.current;
    if (pending) window.clearTimeout(pending.holdTimer);
    pendingTouchRef.current = null;
  }, []);

  useLayoutEffect(() => {
    if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
  }, []);

  // Clear selectedRange when a tag is opened
  useEffect(() => {
    if (selectedTagId) setSelectedRange(null);
  }, [selectedTagId]);

  const handleCellMouseDown = useCallback((cell: CellId) => {
    setDrag({ start: cell, end: cell, moved: false });
  }, []);

  const handleCellMouseEnter = useCallback((cell: CellId) => {
    setHoveredCell(cell);
    setDrag((prev) => {
      if (!prev) return null;
      const moved = prev.moved || cellLinearIndex(cell) !== cellLinearIndex(prev.start);
      return { ...prev, end: cell, moved };
    });
  }, []);

  const beginTouchRangeSelection = useCallback((cell: CellId) => {
    setDrag({ start: cell, end: cell, moved: false });
    setSelectedRange(null);
    selectCell(null);
    setTouchSelecting(true);
  }, [selectCell]);

  const handleCellTouchStart = useCallback((cell: CellId, e: React.TouchEvent<HTMLButtonElement>) => {
    if (e.touches.length !== 1) return;
    clearPendingTouch();
    const touch = e.touches[0];
    const holdTimer = window.setTimeout(() => {
      beginTouchRangeSelection(cell);
      pendingTouchRef.current = null;
    }, TOUCH_HOLD_MS);

    pendingTouchRef.current = {
      cell,
      startX: touch.clientX,
      startY: touch.clientY,
      holdTimer,
    };
  }, [beginTouchRangeSelection, clearPendingTouch]);

  useEffect(() => {
    const onMouseUp = () => {
      const d = dragRef.current;
      if (!d) return;
      if (!d.moved) {
        setSelectedRange(null);
        selectCell(d.start);
      } else {
        setSelectedRange({ start: d.start, end: d.end });
        selectCell(null);
      }
      setDrag(null);
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [selectCell]);

  useEffect(() => {
    const cellFromPoint = (x: number, y: number): CellId | null => {
      const el = document.elementFromPoint(x, y)?.closest('button[data-cell-year][data-cell-month]') as HTMLElement | null;
      if (!el) return null;
      const year = Number(el.dataset.cellYear);
      const month = Number(el.dataset.cellMonth);
      if (Number.isNaN(year) || Number.isNaN(month)) return null;
      return { year, month };
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;

      const pending = pendingTouchRef.current;
      if (pending) {
        const dx = t.clientX - pending.startX;
        const dy = t.clientY - pending.startY;
        if (Math.hypot(dx, dy) > TOUCH_MOVE_CANCEL_PX) {
          clearPendingTouch();
        }
      }

      if (!touchSelectingRef.current) return;

      e.preventDefault();
      const cell = cellFromPoint(t.clientX, t.clientY);
      if (cell) handleCellMouseEnter(cell);
    };

    const onTouchEnd = () => {
      const pending = pendingTouchRef.current;
      if (pending) {
        clearPendingTouch();
        setSelectedRange(null);
        selectCell(pending.cell);
        return;
      }

      if (!touchSelectingRef.current) return;

      const d = dragRef.current;
      if (!d) {
        setTouchSelecting(false);
        return;
      }

      if (!d.moved) {
        setSelectedRange(null);
        selectCell(d.start);
      } else {
        setSelectedRange({ start: d.start, end: d.end });
        selectCell(null);
      }
      setDrag(null);
      setTouchSelecting(false);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [clearPendingTouch, handleCellMouseEnter, selectCell]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedRange(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!settings) return null;

  const { year: birthYear } = parseBirthDate(settings.birthDate);
  const years = Array.from({ length: settings.totalYears }, (_, i) => birthYear + i);
  const activeRange = drag ?? selectedRange;

  const hoveredTag = hoveredTagId ? rangeTags.find((t) => t.id === hoveredTagId) : null;
  const topOffset = 24 + headerHeight; // pt-6 + measured header height

  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden no-touch-select"
      style={drag ? { cursor: 'crosshair' } : undefined}
      onMouseLeave={() => setHoveredCell(null)}
    >
      <div className="flex justify-end sm:justify-center min-h-full">
        <div className="relative min-w-fit pl-1 pr-3 sm:px-10 pt-6 pb-12 ml-7 sm:ml-0">
          <div className="absolute top-0" style={{ right: '100%' }}>
            <TagsSidebar
              birthYear={birthYear}
              selectedRange={selectedRange}
              topOffset={topOffset}
              onHoverTag={setHoveredTagId}
              onClearRange={() => setSelectedRange(null)}
            />
          </div>
          {/* Month header — sticky */}
          <div
            ref={headerRef}
            className="sticky top-0 z-10 flex items-center gap-1 pb-3 select-none"
            style={{ background: 'var(--bg-canvas)' }}
          >
            <span className="w-8 sm:w-20 shrink-0" />
            {MONTHS_SHORT.map((m, i) => (
              <span
                key={m}
                className="w-5 text-center text-[10px] shrink-0"
                style={{
                  color: hoveredCell?.month === i ? 'var(--text-1)' : 'var(--text-3)',
                  fontWeight: hoveredCell?.month === i ? 700 : 500,
                }}
              >
                {m}
              </span>
            ))}
          </div>

          {/* Year rows */}
          <div className="flex flex-col gap-1">
            {years.map((year) => {
              const age = year - birthYear;
              const isDecade = age > 0 && age % 10 === 0;
              return (
                <div key={year}>
                  {isDecade && (
                    <div className="flex items-center gap-1 my-2">
                      <span className="w-8 sm:w-20 shrink-0" />
                      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span
                      className="w-8 sm:w-20 shrink-0 text-right pr-1 sm:pr-3 text-[10px] sm:text-[11px] tabular-nums select-none"
                      style={{
                        color: hoveredCell?.year === year ? 'var(--text-1)' : 'var(--text-3)',
                        fontWeight: hoveredCell?.year === year ? 700 : 400,
                      }}
                    >
                      {year}
                    </span>
                    {Array.from({ length: 12 }, (_, month) => {
                      const key = cellKey(year, month);
                      const cell: CellId = { year, month };
                      const cellLinear = year * 12 + month;

                      const stripes = hoveredTagId
                        ? []
                        : rangeTags.reduce<Array<{ colorVar: string; rank: number }>>((acc, tag, idx) => {
                            const tagStart = tag.startYear * 12 + (tag.startMonth ?? 0);
                            const tagEnd = tag.endYear * 12 + (tag.endMonth ?? 11);
                            if (cellLinear >= tagStart && cellLinear <= tagEnd)
                              acc.push({ colorVar: TAG_COLOR_VAR[tag.color], rank: idx });
                            return acc;
                          }, []);

                      const hoveredColor = hoveredTag
                        ? (() => {
                            const tagStart = hoveredTag.startYear * 12 + (hoveredTag.startMonth ?? 0);
                            const tagEnd = hoveredTag.endYear * 12 + (hoveredTag.endMonth ?? 11);
                            return cellLinear >= tagStart && cellLinear <= tagEnd
                              ? TAG_COLOR_VAR[hoveredTag.color]
                              : undefined;
                          })()
                        : undefined;

                      const inRange = activeRange
                        ? cellInRange(cell, activeRange.start, activeRange.end)
                        : false;
                      const isRangeEnd = activeRange
                        ? cellLinearIndex(cell) === cellLinearIndex(activeRange.start) ||
                          cellLinearIndex(cell) === cellLinearIndex(activeRange.end)
                        : false;
                      return (
                        <MonthCell
                          key={key}
                          year={year}
                          month={month}
                          note={notes[key]}
                          isSelected={
                            !activeRange &&
                            selectedCell?.year === year &&
                            selectedCell?.month === month
                          }
                          isInRange={inRange}
                          isRangeEnd={isRangeEnd}
                          stripes={stripes}
                          hoveredColor={hoveredColor}
                          inactive={isBeforeBirth(year, month, settings.birthDate)}
                          onMouseDown={handleCellMouseDown}
                          onMouseEnter={handleCellMouseEnter}
                          onTouchStart={handleCellTouchStart}
                        />
                      );
                    })}
                    {age > 0 && (
                      <span
                          className="hidden sm:inline-block pl-2 text-[10px] sm:text-[11px] tabular-nums shrink-0 select-none"
                          style={{ color: 'var(--text-3)', opacity: 0.5 }}
                        >
                        {age}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
