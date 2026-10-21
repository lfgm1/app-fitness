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
  // Cores do Frank (mascote): usar só nele e em comemorações.
  crista: '#FF7A45',
  bico: '#FFC23D',
  pena: '#F4F1E8',
};

export const statusColors: Record<ProgressStatus, string> = {
  inicio: '#9AA0AB',
  carga: '#C6F432',
  micro: '#4CC9F0',
  manteve: '#F2C94C',
  regrediu: '#FF7A7A',
};

export const radius = 14;

// Estilo cartoon "contorno grosso": borda clara e grossa + sombra sólida deslocada.
export const outlineColor = colors.pena;
export const outlineWidth = 2.5;

/** Borda grossa padrão (cards, botões e campos). */
export const outline = { borderWidth: outlineWidth, borderColor: outlineColor };

/** Sombra sólida deslocada para baixo e para a direita, como um adesivo colado no papel. */
export function hardShadow(color: string, offset = 4) {
  return { boxShadow: `${offset}px ${offset}px 0px ${color}` };
}

/** Fontes da identidade visual (carregadas em app/_layout.tsx). */
export const fonts = {
  display: 'BigShoulders_800ExtraBold',
  regular: 'PublicSans_400Regular',
  medium: 'PublicSans_500Medium',
  semibold: 'PublicSans_600SemiBold',
  bold: 'PublicSans_700Bold',
  mono: 'JetBrainsMono_500Medium',
};
