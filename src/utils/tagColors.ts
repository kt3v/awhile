import type { TagColor } from '../types';

export const TAG_COLOR_LIST: TagColor[] = [
  'blue', 'green', 'orange', 'red', 'mustard',
  'purple', 'pink', 'teal', 'cyan', 'lime',
  'amber', 'rose', 'indigo', 'coral', 'fuchsia', 'brown',
];

export const TAG_COLOR_VAR: Record<TagColor, string> = {
  blue:    'var(--blue)',
  green:   'var(--green)',
  orange:  'var(--orange)',
  red:     'var(--red)',
  mustard: 'var(--mustard)',
  purple:  'var(--purple)',
  pink:    'var(--pink)',
  teal:    'var(--teal)',
  cyan:    'var(--cyan)',
  lime:    'var(--lime)',
  amber:   'var(--amber)',
  rose:    'var(--rose)',
  indigo:  'var(--indigo)',
  coral:   'var(--coral)',
  fuchsia: 'var(--fuchsia)',
  brown:   'var(--brown)',
};

export const TAG_LABEL_COLOR: Record<TagColor, string> = {
  blue:    '#fff',
  green:   '#fff',
  orange:  '#fff',
  red:     '#fff',
  mustard: 'var(--text-1)',
  purple:  '#fff',
  pink:    '#fff',
  teal:    '#fff',
  cyan:    '#fff',
  lime:    '#fff',
  amber:   '#fff',
  rose:    '#fff',
  indigo:  '#fff',
  coral:   '#fff',
  fuchsia: '#fff',
  brown:   '#fff',
};

export function randomTagColor(): TagColor {
  return TAG_COLOR_LIST[Math.floor(Math.random() * TAG_COLOR_LIST.length)];
}
