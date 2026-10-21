// Gráfico de linha da carga máxima por treino.
// Cada ponto tem a cor do tipo de progressão, e acima dele aparecem as
// repetições feitas naquela carga ("×6"). Assim a micro progressão
// (mesma carga, mais repetições) também fica visível no gráfico.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { formatShortDate, formatWeight } from '@/lib/format';
import { kgToUnit, useUnits } from '@/lib/units';
import type { HistoryEntry } from '@/lib/progress';
import { colors, statusColors } from '@/theme';

const HEIGHT = 230;
const PAD = { top: 28, right: 18, bottom: 28, left: 44 };

type Props = {
  entries: HistoryEntry[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function ProgressChart({ entries, selectedIndex, onSelect }: Props) {
  const [width, setWidth] = useState(0);
  const { unit } = useUnits();
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const weights = entries.map((e) => e.best.weight);
  let min = Math.min(...weights);
  let max = Math.max(...weights);
  if (min === max) {
    min = Math.max(0, min - 5);
    max = max + 5;
  } else {
    const pad = (max - min) * 0.15;
    min = Math.max(0, min - pad);
    max = max + pad;
  }

  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (entries.length === 1 ? plotW / 2 : (i / (entries.length - 1)) * plotW);
  const y = (kg: number) => PAD.top + plotH - ((kg - min) / (max - min)) * plotH;

  const ticks = [0, 1, 2, 3].map((i) => min + ((max - min) * i) / 3);
  const showReps = entries.length <= 12;
  const dateIdx =
    entries.length <= 4
      ? entries.map((_, i) => i)
      : [0, Math.floor((entries.length - 1) / 2), entries.length - 1];

  return (
    <View style={styles.container} onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {ticks.map((t) => (
            <Line
              key={'g' + t}
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke={colors.border}
              strokeDasharray="4 4"
            />
          ))}
          {ticks.map((t) => (
            <SvgText
              key={'t' + t}
              x={PAD.left - 8}
              y={y(t) + 4}
              fill={colors.textFaint}
              fontSize={11}
              textAnchor="end">
              {formatWeight(Math.round(kgToUnit(t, unit) * 2) / 2)}
            </SvgText>
          ))}
          {dateIdx.map((i) => (
            <SvgText
              key={'d' + i}
              x={x(i)}
              y={HEIGHT - 8}
              fill={colors.textFaint}
              fontSize={11}
              textAnchor="middle">
              {formatShortDate(entries[i].date)}
            </SvgText>
          ))}

          {entries.length > 1 && (
            <Polyline
              points={entries.map((e, i) => `${x(i)},${y(e.best.weight)}`).join(' ')}
              fill="none"
              stroke={colors.textMuted}
              strokeWidth={2}
            />
          )}

          {entries.map((e, i) => {
            const cx = x(i);
            const cy = y(e.best.weight);
            const color = statusColors[e.status];
            const selected = i === selectedIndex;
            return (
              <SvgText
                key={'r' + i}
                x={cx}
                y={cy - 12}
                fill={selected || showReps ? color : 'transparent'}
                fontSize={11}
                fontWeight="bold"
                textAnchor="middle">
                ×{e.best.reps}
              </SvgText>
            );
          })}

          {entries.map((e, i) => {
            const cx = x(i);
            const cy = y(e.best.weight);
            const selected = i === selectedIndex;
            return (
              <Circle
                key={'p' + i}
                cx={cx}
                cy={cy}
                r={selected ? 7 : 5}
                fill={statusColors[e.status]}
                stroke={selected ? colors.text : colors.background}
                strokeWidth={2}
              />
            );
          })}

          {/* Áreas de toque maiores e invisíveis em cima de cada ponto */}
          {entries.map((e, i) => (
            <Circle
              key={'h' + i}
              cx={x(i)}
              cy={y(e.best.weight)}
              r={18}
              fill="transparent"
              onPress={() => onSelect(i)}
            />
          ))}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: HEIGHT, width: '100%' },
});
