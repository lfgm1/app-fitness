// Círculo de progresso (abas Passos e Calorias): 0 a 1 é a primeira volta; acima de 1, uma segunda
// volta por cima, em outra cor (verde mais escuro nos passos; laranja nas calorias, quando passa da meta).

import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/theme';

// Verde mais escuro da segunda volta.
const EXTRA_LAP = '#7FA81A';

export function ProgressRing({
  progress,
  color = colors.primary,
  extraColor = EXTRA_LAP,
  size: RING = 220,
  stroke: STROKE = 20,
  children,
}: {
  progress: number;
  /** Cor da primeira volta. */
  color?: string;
  extraColor?: string;
  /** Tamanho do círculo e espessura da linha (o grande das abas é 220 / 20). */
  size?: number;
  stroke?: number;
  children: ReactNode;
}) {
  const RADIUS = (RING - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const first = Math.min(1, progress);
  const extra = Math.min(1, Math.max(0, progress - 1));
  const arc = (p: number) => `${p * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING} height={RING} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Circle cx={RING / 2} cy={RING / 2} r={RADIUS} stroke={colors.border} strokeWidth={STROKE} fill="none" />
        {first > 0 && (
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap={first < 1 ? 'round' : 'butt'}
            strokeDasharray={arc(first)}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        )}
        {extra > 0 && (
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={RADIUS}
            stroke={extraColor}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={arc(extra)}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}
