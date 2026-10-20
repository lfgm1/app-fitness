import type { ProgressStatus } from '@/lib/progress';

export const colors = {
  background: '#0E0F12',
  card: '#181A1F',
  cardAlt: '#20232A',
  border: '#2A2D35',
  text: '#F2F3F5',
  textMuted: '#9AA0AB',
  textFaint: '#646A75',
  primary: '#C6F432',
  primaryText: '#0E0F12',
  danger: '#FF5C5C',
};

export const statusColors: Record<ProgressStatus, string> = {
  inicio: '#9AA0AB',
  carga: '#C6F432',
  micro: '#4CC9F0',
  manteve: '#F2C94C',
  regrediu: '#FF7A7A',
};

export const radius = 14;
