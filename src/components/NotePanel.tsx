import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore, cellKey } from '../store/useStore';
import { MONTHS_FULL, parseBirthDate } from '../utils/dates';
import { TAG_COLOR_VAR } from '../utils/tagColors';
import type { RangeTag } from '../types';
import RichEditor, { type RichEditorHandle } from './RichEditor';

function htmlCharCount(html: string): number {
  return html.replace(/<[^>]*>/g, '').trim().length;
}

function tagsForYear(year: number, tags: RangeTag[]): RangeTag[] {
  return tags.filter((t) => year >= t.startYear && year <= t.endYear);
}

function overlappingRangeTags(tag: RangeTag, tags: RangeTag[]): RangeTag[] {
  return tags.filter(
    (t) => t.id !== tag.id && t.startYear <= tag.endYear && tag.startYear <= t.endYear
  );
}

export default function NotePanel() {
  const selectedCell = useStore((s) => s.selectedCell);
  const notes = useStore((s) => s.notes);
  const setNote = useStore((s) => s.setNote);
  const selectCell = useStore((s) => s.selectCell);
  const birthDate = useStore((s) => s.settings?.birthDate);
  const birthYear = birthDate ? parseBirthDate(birthDate).year : undefined;

  const selectedTagId = useStore((s) => s.selectedTagId);
  const rangeTags = useStore((s) => s.rangeTags);
  const selectTag = useStore((s) => s.selectTag);
  const updateRangeTagNote = useStore((s) => s.updateRangeTagNote);
  const deleteRangeTag = useStore((s) => s.deleteRangeTag);
  const renameRangeTag = useStore((s) => s.renameRangeTag);

  const primaryTag = selectedTagId ? (rangeTags.find((t) => t.id === selectedTagId) ?? null) : null;
  const isOpen = !!selectedCell || !!primaryTag;

  const [activeTabId, setActiveTabId] = useState<'month' | string>('month');
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichEditorHandle>(null);

  const tabs: Array<'month' | string> = selectedCell
    ? ['month', ...tagsForYear(selectedCell.year, rangeTags).map((t) => t.id)]
    : primaryTag
    ? [primaryTag.id, ...overlappingRangeTags(primaryTag, rangeTags).map((t) => t.id)]
    : [];

  const showTabs = tabs.length > 1;

  const displayTag =
    activeTabId !== 'month' ? (rangeTags.find((t) => t.id === activeTabId) ?? null) : null;

  const cellKey_ = selectedCell ? cellKey(selectedCell.year, selectedCell.month) : '';
  const note = cellKey_ ? notes[cellKey_] : undefined;

  // Reset active tab whenever the primary selection changes
  useEffect(() => {
    if (selectedCell) {
      setActiveTabId('month');
    } else if (selectedTagId) {
      setActiveTabId(selectedTagId);
    }
    setIsTagMenuOpen(false);
    setIsRenameOpen(false);
    setRenameValue('');
  }, [selectedCell, selectedTagId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isRenameOpen) {
        setIsRenameOpen(false);
        setRenameValue('');
        return;
      }
      if (e.key === 'Escape' && isTagMenuOpen) {
        setIsTagMenuOpen(false);
        return;
      }
      if (e.key === 'Escape') {
        if (selectedCell) selectCell(null);
        if (selectedTagId) selectTag(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedCell, selectedTagId, selectCell, selectTag, isTagMenuOpen, isRenameOpen]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!isTagMenuOpen) return;
      if (!menuRef.current?.contains(e.target as Node)) {
        setIsTagMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [isTagMenuOpen]);

  useEffect(() => {
    if (!displayTag) setIsTagMenuOpen(false);
  }, [displayTag]);

  useEffect(() => {
    if (isRenameOpen) {
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 0);
    }
  }, [isRenameOpen]);

  const handleCellChange = useCallback(
    (html: string) => {
      if (!selectedCell) return;
      setNote(cellKey(selectedCell.year, selectedCell.month), html);
    },
    [selectedCell, setNote]
  );

  const handleTagNoteChange = useCallback(
    (html: string) => {
      if (activeTabId === 'month') return;
      updateRangeTagNote(activeTabId, html);
    },
    [activeTabId, updateRangeTagNote]
  );

  const closePanel = useCallback(() => {
    if (selectedCell) selectCell(null);
    else selectTag(null);
  }, [selectedCell, selectCell, selectTag]);

  const openRename = useCallback(() => {
    if (!displayTag) return;
    setRenameValue(displayTag.label);
    setIsRenameOpen(true);
    setIsTagMenuOpen(false);
  }, [displayTag]);

  const closeRename = useCallback(() => {
    setIsRenameOpen(false);
    setRenameValue('');
  }, []);

  const submitRename = useCallback(() => {
    if (!displayTag) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === displayTag.label) {
      closeRename();
      return;
    }
    renameRangeTag(displayTag.id, trimmed);
    closeRename();
  }, [displayTag, renameRangeTag, renameValue, closeRename]);

  const editorValue = activeTabId === 'month' ? (note?.text ?? '') : (displayTag?.note ?? '');
  const editorOnChange = activeTabId === 'month' ? handleCellChange : handleTagNoteChange;
  const editorPlaceholder =
    activeTabId === 'month'
      ? 'Write something about this month…'
      : 'Write something about this period…';
  const editorKey = activeTabId === 'month' ? `cell-${cellKey_}` : `tag-${activeTabId}`;
  const charCount = htmlCharCount(editorValue);
  const savedAt = activeTabId === 'month' ? note?.updatedAt : displayTag?.updatedAt;

  return (
    <>
      {isOpen && (
        <div
          className="absolute inset-0 z-10 sm:hidden"
          onClick={closePanel}
        />
      )}

      <aside
        className={[
          'absolute right-0 top-0 bottom-0 w-full sm:w-[700px] flex flex-col z-20 transition-transform duration-300 ease-in-out overflow-hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{
          background: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        {isOpen && (
          <>
            <div style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
              {/* Title + action buttons */}
              <div className="flex items-center px-6 pt-5 pb-4 gap-3">
                {/* Mobile: back arrow on the left */}
                <div className="sm:hidden flex items-center shrink-0">
                  <BackButton onClick={closePanel} />
                </div>

                <div className="flex-1 min-w-0">
                  {activeTabId === 'month' && selectedCell ? (
                    <div className="flex items-center gap-2.5">
                      <h2
                        className="text-[18px] leading-tight shrink-0"
                        style={{
                          fontFamily: "'Lora', Georgia, serif",
                          fontWeight: 560,
                          letterSpacing: '-0.025em',
                          color: 'var(--text-1)',
                        }}
                      >
                        {MONTHS_FULL[selectedCell.month]} {selectedCell.year}
                      </h2>
                      <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-3)' }}>
                        Age {selectedCell.year - (birthYear ?? selectedCell.year)}
                      </span>
                    </div>
                  ) : displayTag ? (
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className="w-2.5 h-2.5 rounded-sm shrink-0 self-center"
                          style={{ background: TAG_COLOR_VAR[displayTag.color] }}
                        />
                        <h2
                          className="text-[18px] leading-tight"
                          style={{
                            fontFamily: "'Lora', Georgia, serif",
                            fontWeight: 560,
                            letterSpacing: '-0.025em',
                            color: 'var(--text-1)',
                          }}
                        >
                          {displayTag.label}
                        </h2>
                      </div>
                      <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-3)' }}>
                        {displayTag.startYear === displayTag.endYear
                          ? `${displayTag.startYear}`
                          : `${displayTag.startYear} – ${displayTag.endYear}`}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5 ml-auto shrink-0">
                  {displayTag && (
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => setIsTagMenuOpen((v) => !v)}
                        aria-label="Tag options"
                        className="p-1.5 transition-colors duration-150"
                        style={{
                          color: 'var(--text-3)',
                          background: 'transparent',
                          border: '1px solid transparent',
                          borderRadius: '8px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <circle cx="3" cy="7" r="1.2" fill="currentColor" />
                          <circle cx="7" cy="7" r="1.2" fill="currentColor" />
                          <circle cx="11" cy="7" r="1.2" fill="currentColor" />
                        </svg>
                      </button>

                      {isTagMenuOpen && (
                        <div
                          className="absolute right-0 mt-1 min-w-40 overflow-hidden"
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          <button
                            onClick={openRename}
                            className="w-full text-left px-3 py-2 text-sm font-medium transition-colors duration-150"
                            style={{ color: 'var(--text-1)', background: 'transparent' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--bg-secondary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            Rename tag
                          </button>
                          <button
                            onClick={() => {
                              const nextTabId = tabs.find((id) => id !== displayTag.id);
                              deleteRangeTag(displayTag.id);
                              if (selectedTagId === displayTag.id) {
                                selectTag(null);
                              } else {
                                setActiveTabId(nextTabId ?? 'month');
                              }
                              setIsTagMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-medium transition-colors duration-150"
                            style={{ color: '#C8523A', background: 'transparent' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                'color-mix(in srgb, #E63946 10%, var(--bg-primary))';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            Delete tag range
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Desktop: close X on the right */}
                  <div className="hidden sm:block">
                    <CloseButton onClick={closePanel} />
                  </div>
                </div>
              </div>

              {/* Tab bar — always rendered; tabs only shown when multiple exist */}
              <div
                className="flex items-center"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <div className="flex flex-1 overflow-x-auto">
                  {showTabs && tabs.map((tabId, idx) => {
                    const isActive = tabId === activeTabId;
                    if (tabId === 'month') {
                      return (
                        <TabButton
                          key="month"
                          label={MONTHS_FULL[selectedCell!.month].slice(0, 3)}
                          isActive={isActive}
                          isFirst={idx === 0}
                          onClick={() => setActiveTabId('month')}
                        />
                      );
                    }
                    const tag = rangeTags.find((t) => t.id === tabId);
                    if (!tag) return null;
                    return (
                      <TabButton
                        key={tabId}
                        label={tag.label}
                        color={TAG_COLOR_VAR[tag.color]}
                        isActive={isActive}
                        isFirst={idx === 0}
                        onClick={() => setActiveTabId(tabId)}
                      />
                    );
                  })}
                </div>
                <div className="shrink-0 px-3 flex items-center">
                  <ImageInsertButton onClick={() => editorRef.current?.openImagePicker()} />
                </div>
              </div>
            </div>

            <RichEditor
              ref={editorRef}
              key={editorKey}
              value={editorValue}
              placeholder={editorPlaceholder}
              onChange={editorOnChange}
            />

            <PanelFooter savedAt={savedAt} charCount={charCount} />

            {isRenameOpen && displayTag && (
              <div
                className="absolute inset-0 z-30 flex items-center justify-center px-4"
                style={{ background: 'color-mix(in srgb, var(--bg-canvas) 60%, transparent)' }}
                onClick={closeRename}
              >
                <div
                  className="w-full max-w-sm rounded-xl p-4"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: 'var(--text-1)' }}
                  >
                    Rename tag
                  </h3>
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitRename();
                      if (e.key === 'Escape') closeRename();
                    }}
                    placeholder="Tag name"
                    className="w-full h-10 px-3 text-sm rounded-lg outline-none"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-1)',
                    }}
                  />
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={closeRename}
                      className="px-3 h-9 rounded-lg text-sm font-medium"
                      style={{
                        color: 'var(--text-2)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitRename}
                      disabled={!renameValue.trim()}
                      className="px-3 h-9 rounded-lg text-sm font-medium"
                      style={{
                        color: '#fff',
                        background: renameValue.trim() ? 'var(--blue)' : 'var(--bg-secondary)',
                        border: '1px solid transparent',
                        opacity: renameValue.trim() ? 1 : 0.65,
                        cursor: renameValue.trim() ? 'pointer' : 'default',
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}

function ImageInsertButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Insert image"
      title="Insert image"
      className="p-1.5 transition-colors duration-150"
      style={{
        color: 'var(--text-3)',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: '6px',
        lineHeight: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text-2)';
        e.currentTarget.style.background = 'var(--bg-secondary)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-3)';
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1.5" y="2" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1.5 9.5l3-3.5 2.5 2.5 2-2 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="5" cy="5.5" r="1" fill="currentColor" />
      </svg>
    </button>
  );
}

function TabButton({
  label,
  color,
  isActive,
  isFirst,
  onClick,
}: {
  label: string;
  color?: string;
  isActive: boolean;
  isFirst?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 shrink-0 transition-colors duration-150"
      style={{
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: isFirst ? 24 : 16,
        paddingRight: 16,
        color: isActive ? 'var(--text-1)' : 'var(--text-3)',
        background: 'transparent',
        border: 'none',
        borderBottom: isActive ? '2px solid var(--text-2)' : '2px solid transparent',
        fontSize: 12,
        fontWeight: isActive ? 600 : 500,
        cursor: 'pointer',
      }}
    >
      {color && (
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: 2,
            background: color,
            flexShrink: 0,
          }}
        />
      )}
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 120,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close panel"
      className="p-1.5 transition-colors duration-150"
      style={{
        color: 'var(--text-3)',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: '8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#C8523A';
        e.currentTarget.style.background = 'color-mix(in srgb, #E63946 13%, var(--bg-header))';
        e.currentTarget.style.borderColor = 'color-mix(in srgb, #E63946 40%, var(--border))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-3)';
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Go back"
      className="p-1.5 transition-colors duration-150"
      style={{
        color: 'var(--text-3)',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: '8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text-1)';
        e.currentTarget.style.background = 'var(--bg-secondary)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-3)';
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function PanelFooter({
  savedAt,
  charCount,
}: {
  savedAt: string | null | undefined;
  charCount: number;
}) {
  return (
    <div
      className="flex items-center justify-between px-6 py-3"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-header)' }}
    >
      <span
        className="text-xs font-medium flex items-center gap-1.5"
        style={{ color: savedAt ? 'var(--green)' : 'var(--text-3)' }}
      >
        {savedAt && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M1.5 5l2.5 2.5 4.5-4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {savedAt
          ? `Saved ${new Date(savedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}`
          : 'Not saved yet'}
      </span>
      <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>
        {charCount} chars
      </span>
    </div>
  );
}
