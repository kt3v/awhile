export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const now = new Date();
const CUR_YEAR = now.getFullYear();
const CUR_MONTH = now.getMonth();

export function isCurrentMonth(year: number, month: number): boolean {
  return year === CUR_YEAR && month === CUR_MONTH;
}

export function isPast(year: number, month: number): boolean {
  return year < CUR_YEAR || (year === CUR_YEAR && month < CUR_MONTH);
}

// Parse "YYYY-MM-DD" without timezone shifts (split manually)
export function parseBirthDate(birthDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = birthDate.split('-').map(Number);
  return { year, month: month - 1, day }; // month is 0-indexed
}

// True only for months in the birth year that came before the birth month
export function isBeforeBirth(year: number, month: number, birthDate: string): boolean {
  const birth = parseBirthDate(birthDate);
  return year === birth.year && month < birth.month;
}
