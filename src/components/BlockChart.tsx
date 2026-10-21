// Gráfico em blocos da carga máxima por treino, no estilo cartoon do app.
// Cada treino é uma barra grossa com contorno e sombra sólida. A cor mostra o tipo
// de progressão e o treino de recorde fica dourado. Em cima de cada barra vai a carga;
// dentro dela, as repetições ("×6"), para a micro progressão também aparecer.

import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { G, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { formatShortDate } from '@/lib/format';
import { useUnits } from '@/lib/units';
import type { HistoryEntry, ProgressStatus } from '@/lib/progress';
import { colors, fonts, outlineColor, statusColors } from '@/theme';

const HEIGHT = 240;
const PAD = { top: 34, bottom: 26, side: 10 };
const BAR_W = 26;
const GAP = 10;

/**
 * Cor de cada barra. "Manteve" e "início" ficam em grafite, para o dourado ficar
 * só para o recorde e as cores fortes só para quando você evoluiu (ou caiu).
 */
export const BLOCK_COLORS: Record<ProgressStatus, string> = {
  inicio: '#3A3E48',
  carga: statusColors.carga,
  micro: statusColors.micro,
  manteve: '#3A3E48',
  regrediu: statusColors.regrediu,
};

export function blockColor(entry: HistoryEntry) {
  return entry.isPR ? colors.bico : BLOCK_COLORS[entry.status];
}
const SHADOW = 3;

type Props = {
  entries: HistoryEntry[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

/** Estrelinha de recorde em cima da barra dourada. */
function starPoints(cx: number, cy: number, r: number) {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * i) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    points.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
  }
  return points.join(' ');
}

export function BlockChart({ entries, selectedIndex, onSelect }: Props) {
  const [width, setWidth] = useState(0);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const units = useUnits();
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const weights = entries.map((e) => e.best.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  // A base não começa no zero: assim uma subida de 2,5 kg aparece de verdade na altura da barra.
  const range = max - min || 5;
  const base = Math.max(0, min - range * 0.8);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const barHeight = (kg: number) => 18 + ((kg - base) / (max - base || 1)) * (plotH - 18);

  // Com muitos treinos o gráfico rola para o lado (começa mostrando os mais recentes).
  const contentW = Math.max(width, PAD.side * 2 + entries.length * BAR_W + (entries.length - 1) * GAP + SHADOW);
  const offset = Math.max(PAD.side, (contentW - (entries.length * BAR_W + (entries.length - 1) * GAP)) / 2);
  const x = (i: number) => offset + i * (BAR_W + GAP);
  const showDate = (i: number) => entries.length <= 6 || i === 0 || i === entries.length - 1 || i === selectedIndex;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {width > 0 && (
        <ScrollView
          ref={scroll}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
          <View style={{ width: contentW, height: HEIGHT }}>
            <Svg width={contentW} height={HEIGHT}>
              {entries.map((e, i) => {
                const h = barHeight(e.best.weight);
                const top = HEIGHT - PAD.bottom - h;
                const left = x(i);
                const selected = i === selectedIndex;
                const fill = blockColor(e);
                const darkBar = !e.isPR && (e.status === 'manteve' || e.status === 'inicio');
                const label = units.weight(e.best.weight);
                return (
                  <G key={e.sessionId}>
                    {/* Sombra sólida, depois a barra com contorno */}
                    <Rect x={left + SHADOW} y={top + SHADOW} width={BAR_W} height={h} rx={6} fill={outlineColor} />
                    <Rect
                      x={left}
                      y={top}
                      width={BAR_W}
                      height={h}
                      rx={6}
                      fill={fill}
                      stroke={selected ? colors.background : outlineColor}
                      strokeWidth={selected ? 3.5 : 2.5}
                    />
                    {h >= 34 && (
                      <SvgText
                        x={left + BAR_W / 2}
                        y={top + 18}
                        fill={darkBar ? colors.text : colors.primaryText}
                        fontSize={10}
                        fontFamily={fonts.mono}
                        textAnchor="middle">
                        ×{e.best.reps}
                      </SvgText>
                    )}

                    {/* Carga em cima da barra: etiqueta clara na barra tocada */}
                    {e.isPR && <Polygon points={starPoints(left + BAR_W / 2, top - 24, 9)} fill={colors.bico} />}
                    {selected ? (
                      <>
                        <Rect
                          x={left + BAR_W / 2 - 22}
                          y={top - 21}
                          width={44}
                          height={17}
                          rx={5}
                          fill={outlineColor}
                          stroke={colors.background}
                          strokeWidth={2}
                        />
                        <SvgText
                          x={left + BAR_W / 2}
                          y={top - 9}
                          fill={colors.primaryText}
                          fontSize={10}
                          fontFamily={fonts.mono}
                          textAnchor="middle">
                          {label}
                        </SvgText>
                      </>
                    ) : (
                      <SvgText
                        x={left + BAR_W / 2}
                        y={top - 8}
                        fill={colors.text}
                        fontSize={10}
                        fontFamily={fonts.mono}
                        textAnchor="middle">
                        {label}
                      </SvgText>
                    )}

                    {showDate(i) && (
                      <SvgText
                        x={left + BAR_W / 2}
                        y={HEIGHT - 8}
                        fill={selected ? colors.text : colors.textFaint}
                        fontSize={10}
                        fontFamily={fonts.mono}
                        textAnchor="middle">
                        {formatShortDate(e.date)}
                      </SvgText>
                    )}
                  </G>
                );
              })}
            </Svg>
            {/* Áreas de toque: a coluna inteira de cada barra */}
            {entries.map((e, i) => (
              <Pressable
                key={'touch' + e.sessionId}
                onPress={() => onSelect(i)}
                accessibilityLabel={`Treino de ${formatShortDate(e.date)}: ${units.set(e.best)}`}
                style={[styles.touch, { left: x(i) - GAP / 2, width: BAR_W + GAP }]}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: HEIGHT, width: '100%' },
  touch: { position: 'absolute', top: 0, bottom: 0 },
});
