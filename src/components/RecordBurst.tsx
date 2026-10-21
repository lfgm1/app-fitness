// Selo de recorde pessoal no estilo "explosão" de gibi: estrela de pontas,
// contorno escuro e borda clara por fora. (Cópia em SVG/PNG na pasta da identidade visual.)

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { colors, fonts } from '@/theme';

const SIZES = {
  small: { width: 104, height: 36, spikes: 12, fontSize: 15 },
  large: { width: 230, height: 92, spikes: 16, fontSize: 38 },
};

/** Pontos de uma estrela "explosão" dentro de uma elipse. */
export function burstPoints(width: number, height: number, spikes: number, pad: number) {
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2 - pad;
  const ry = height / 2 - pad;
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    const r = i % 2 === 0 ? 1 : 0.8;
    points.push(`${(cx + Math.cos(angle) * rx * r).toFixed(1)},${(cy + Math.sin(angle) * ry * r).toFixed(1)}`);
  }
  return points.join(' ');
}

export function RecordBurst({ size = 'small', label = 'Recorde!' }: { size?: 'small' | 'large'; label?: string }) {
  const { width, height, spikes, fontSize } = SIZES[size];
  const stroke = size === 'large' ? 4 : 2;
  const points = burstPoints(width, height, spikes, stroke * 1.5);
  return (
    <View style={[styles.wrap, { width, height }]} accessibilityLabel="Recorde pessoal">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {/* Borda clara por fora, depois a estrela amarela com contorno escuro */}
        <Polygon points={points} fill={colors.pena} stroke={colors.pena} strokeWidth={stroke * 2.5} strokeLinejoin="round" />
        <Polygon points={points} fill={colors.bico} stroke={colors.background} strokeWidth={stroke} strokeLinejoin="round" />
      </Svg>
      <Text style={[styles.label, { fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] },
  label: {
    color: colors.primaryText,
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    includeFontPadding: false,
  },
});
