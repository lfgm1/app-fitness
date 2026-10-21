// Gráfico dos exercícios de tempo (ex: prancha), no estilo cartoon do app.
// Cada treino é uma barra deitada: quanto mais comprida, mais tempo. Uma linha
// tracejada dourada marca o recorde. As cores são as mesmas do gráfico em blocos.

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { blockColor } from '@/components/BlockChart';
import { formatDuration, formatShortDate } from '@/lib/format';
import type { HistoryEntry } from '@/lib/progress';
import { colors, fonts, outlineColor } from '@/theme';

const ROW_H = 30;
const BAR_H = 18;
const LABEL_W = 46;
const TIME_W = 46;
const SHADOW = 3;
const PAD = { top: 6, bottom: 22 };

type Props = {
  entries: HistoryEntry[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function TimeBarChart({ entries, selectedIndex, onSelect }: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const seconds = entries.map((e) => e.best.seconds ?? 0);
  const record = Math.max(...seconds, 1);
  const barArea = width - LABEL_W - TIME_W - SHADOW;
  const barWidth = (s: number) => Math.max(BAR_H, (s / record) * barArea);
  const recordX = LABEL_W + barArea;
  const height = PAD.top + entries.length * ROW_H + PAD.bottom;

  return (
    <View style={[styles.container, { height }]} onLayout={onLayout}>
      {width > 0 && (
        <>
          <Svg width={width} height={height}>
            {entries.map((e, i) => {
              const y = PAD.top + i * ROW_H + (ROW_H - BAR_H) / 2;
              const w = barWidth(seconds[i]);
              const selected = i === selectedIndex;
              const time = formatDuration(seconds[i]);
              return (
                <G key={e.sessionId}>
                  <SvgText
                    x={LABEL_W - 8}
                    y={y + BAR_H / 2 + 4}
                    fill={selected ? colors.text : colors.textFaint}
                    fontSize={10}
                    fontFamily={fonts.mono}
                    textAnchor="end">
                    {formatShortDate(e.date)}
                  </SvgText>
                  {/* Sombra sólida, depois a barra com contorno */}
                  <Rect
                    x={LABEL_W + SHADOW}
                    y={y + SHADOW}
                    width={w}
                    height={BAR_H}
                    rx={BAR_H / 2}
                    fill={outlineColor}
                  />
                  <Rect
                    x={LABEL_W}
                    y={y}
                    width={w}
                    height={BAR_H}
                    rx={BAR_H / 2}
                    fill={blockColor(e)}
                    stroke={selected ? colors.background : outlineColor}
                    strokeWidth={selected ? 3.5 : 2.5}
                  />
                  {selected ? (
                    <>
                      <Rect
                        x={LABEL_W + w + 6}
                        y={y}
                        width={TIME_W - 8}
                        height={BAR_H}
                        rx={5}
                        fill={outlineColor}
                        stroke={colors.background}
                        strokeWidth={2}
                      />
                      <SvgText
                        x={LABEL_W + w + 6 + (TIME_W - 8) / 2}
                        y={y + BAR_H / 2 + 4}
                        fill={colors.primaryText}
                        fontSize={10}
                        fontFamily={fonts.mono}
                        textAnchor="middle">
                        {time}
                      </SvgText>
                    </>
                  ) : (
                    <SvgText
                      x={LABEL_W + w + 8}
                      y={y + BAR_H / 2 + 4}
                      fill={e.isPR ? colors.bico : colors.text}
                      fontSize={10}
                      fontFamily={fonts.mono}>
                      {e.isPR ? `${time} ★` : time}
                    </SvgText>
                  )}
                </G>
              );
            })}

            {/* Linha do recorde */}
            <Line
              x1={recordX}
              x2={recordX}
              y1={PAD.top - 4}
              y2={height - PAD.bottom + 2}
              stroke={colors.bico}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            <SvgText
              x={recordX}
              y={height - 6}
              fill={colors.bico}
              fontSize={10}
              fontFamily={fonts.mono}
              textAnchor="middle">
              recorde {formatDuration(record)}
            </SvgText>
          </Svg>

          {/* Áreas de toque: a linha inteira de cada treino */}
          {entries.map((e, i) => (
            <Pressable
              key={'touch' + e.sessionId}
              onPress={() => onSelect(i)}
              accessibilityLabel={`Treino de ${formatShortDate(e.date)}: ${formatDuration(seconds[i])}`}
              style={[styles.touch, { top: PAD.top + i * ROW_H, height: ROW_H }]}
            />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  touch: { position: 'absolute', left: 0, right: 0 },
});
