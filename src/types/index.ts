export interface Note {
  text: string;
  updatedAt: string;
}

export interface Settings {
  birthDate: string; // "YYYY-MM-DD"
  totalYears: number;
  passwordEnabled?: boolean;
  passwordHash?: string;
}

export interface CellId {
  year: number;
  month: number; // 0–11
}

export type TagColor = 'blue' | 'green' | 'orange' | 'red' | 'mustard' | 'purple' | 'pink' | 'teal' | 'cyan' | 'lime' | 'amber' | 'rose' | 'indigo' | 'coral' | 'fuchsia' | 'brown';

export interface RangeTag {
  id: string;
  label: string;
  color: TagColor;
  startYear: number;
  startMonth: number; // 0-11
  endYear: number;
  endMonth: number; // 0-11
  note: string;
  updatedAt: string | null;
}

export interface PersistedState {
  settings: Settings | null;
  notes: Record<string, Note>;
  rangeTags: RangeTag[];
  theme: 'light' | 'dark';
}
