export const C = {
  green: '#25D366',
  greenDark: '#128C7E',
  ink: '#0a0a0a',
  gray: '#9ca3af',
  grayText: '#6b7280',
  line: '#e5e7eb',
  light: '#dcfce7',
  white: '#ffffff',
  off: '#f9f9f9',
  badgeDark: '#0d2e1a',
  red: '#ef4444',
  waOut: '#d9fdd3',
};
export const FONT = 'Poppins, sans-serif';
export type Theme = 'dark' | 'light' | 'green';
export const bgOf = (t: Theme) => (t === 'dark' ? C.ink : t === 'green' ? C.green : C.white);
export const inkOf = (t: Theme) => (t === 'light' ? C.ink : C.white);
export const accentOf = (t: Theme) => (t === 'green' ? C.ink : C.green);
export const mutedOf = (t: Theme) => (t === 'dark' ? C.gray : t === 'green' ? 'rgba(0,0,0,0.65)' : C.grayText);
