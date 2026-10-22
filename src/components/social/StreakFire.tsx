// Fogo do streak atrás do ícone de perfil. Cada nível tem uma forma (1, 3 ou 5 chamas), uma cor
// e, nos mais altos, faíscas subindo. Um anel escuro separa o fogo da borda do ícone, que fica livre.
// Medidas no mesmo sistema do ícone: raio 44 = metade do tamanho.

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import type { StreakLevel } from '@/lib/streak';
import { colors } from '@/theme';

const SHAPES = {
  one: 'M0 -40 Q16 -18 12 0 Q9 14 0 16 Q-9 14 -12 0 Q-16 -18 0 -40 Z',
  three: 'M-30 16 Q-42 -8 -28 -34 Q-23 -16 -13 -14 Q-13 -40 0 -58 Q13 -40 13 -14 Q23 -16 28 -34 Q42 -8 30 16 Z',
  five: 'M-42 18 Q-54 -6 -44 -34 Q-37 -20 -29 -20 Q-31 -46 -16 -62 Q-12 -38 -6 -34 Q-4 -64 0 -78 Q6 -64 8 -34 Q13 -38 17 -62 Q31 -46 29 -20 Q37 -20 44 -34 Q54 -6 42 18 Z',
};

type Layer = { shape: keyof typeof SHAPES; y: number; scale: number; fill: string };
type Look = { layers: Layer[]; sparks: string[]; overhang: number };

const PENA = '#F4F1E8';
const LOOKS: Record<Exclude<StreakLevel, 'nenhum'>, Look> = {
  faisca: {
    layers: [
      { shape: 'one', y: -30, scale: 0.9, fill: '#FFC23D' },
      { shape: 'one', y: -26, scale: 0.45, fill: '#FFF3C4' },
    ],
    sparks: [],
    overhang: 26,
  },
  esquentando: {
    layers: [
      { shape: 'three', y: -16, scale: 0.8, fill: '#FF7A45' },
      { shape: 'three', y: -10, scale: 0.5, fill: '#FFC23D' },
    ],
    sparks: [],
    overhang: 22,
  },
  chamas: {
    layers: [
      { shape: 'five', y: -14, scale: 0.72, fill: '#FF5C5C' },
      { shape: 'five', y: -8, scale: 0.5, fill: '#FF7A45' },
      { shape: 'five', y: -4, scale: 0.3, fill: '#FFC23D' },
    ],
    sparks: [],
    overhang: 30,
  },
  incendio: {
    layers: [
      { shape: 'five', y: -14, scale: 0.88, fill: '#E0342B' },
      { shape: 'five', y: -8, scale: 0.62, fill: '#FF7A45' },
      { shape: 'five', y: -4, scale: 0.38, fill: '#FFC23D' },
    ],
    sparks: ['#FFC23D', '#FF7A45', '#FFC23D'],
    overhang: 44,
  },
  azul: {
    layers: [
      { shape: 'five', y: -14, scale: 0.88, fill: '#2E8FC0' },
      { shape: 'five', y: -8, scale: 0.62, fill: '#4CC9F0' },
      { shape: 'five', y: -4, scale: 0.38, fill: '#DDF6FF' },
    ],
    sparks: ['#4CC9F0', '#DDF6FF', '#4CC9F0'],
    overhang: 44,
  },
  lendario: {
    // Arco-íris: roxo por fora até vermelho no miolo.
    layers: [
      { shape: 'five', y: -14, scale: 0.94, fill: '#A78BFA' },
      { shape: 'five', y: -11, scale: 0.77, fill: '#4CC9F0' },
      { shape: 'five', y: -8, scale: 0.61, fill: '#5DCAA5' },
      { shape: 'five', y: -6, scale: 0.45, fill: '#FFC23D' },
      { shape: 'five', y: -4, scale: 0.3, fill: '#FF5C5C' },
    ],
    sparks: ['#A78BFA', '#5DCAA5', '#FFC23D', '#4CC9F0'],
    overhang: 50,
  },
};

// Onde as faíscas nascem (x, y), no sistema do ícone.
const SPARK_SPOTS = [
  [-34, -64],
  [31, -68],
  [0, -80],
  [16, -76],
];

// O desenho do fogo ocupa de -80 a 80 (largura) e de -100 a 60 (altura); o centro do ícone é (0, 0).
const BOX = 160;
const BOX_TOP = -100;
const useNative = Platform.OS !== 'web';

/** Uma camada de chama tremendo (cada camada num ritmo diferente). */
function FlameLayer({
  layer,
  unit,
  duration,
  first,
}: {
  layer: Layer;
  unit: number;
  duration: number;
  first: boolean;
}) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: useNative })
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);
  const scaleY = t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 1.06, 0.96, 1.03, 1] });
  const scaleX = t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 0.95, 1.04, 0.98, 1] });
  const rotate = t.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '-2deg', '1.5deg', '-1deg', '0deg'],
  });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: BOX * unit,
        height: BOX * unit,
        // A chama tremula a partir da base (o centro do ícone).
        transformOrigin: `50% ${(-BOX_TOP / BOX) * 100}%`,
        transform: [{ scaleX }, { scaleY }, { rotate }],
      }}>
      <Svg width={BOX * unit} height={BOX * unit} viewBox={`-80 ${BOX_TOP} ${BOX} ${BOX}`}>
        <G transform={`translate(0 ${layer.y}) scale(${layer.scale})`}>
          <Path
            d={SHAPES[layer.shape]}
            fill={layer.fill}
            stroke={first ? PENA : undefined}
            strokeWidth={first ? 5 : 0}
            strokeLinejoin="round"
          />
        </G>
      </Svg>
    </Animated.View>
  );
}

/** Faísca subindo e sumindo (cada uma começa num momento diferente). */
function Spark({ x, y, color, unit, delay }: { x: number; y: number; color: string; unit: number; delay: number }) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: useNative })
    );
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [t, delay]);
  const size = 5 * unit;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: (x + 80) * unit - size / 2,
        top: (y - BOX_TOP) * unit - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -16 * unit] }) }],
      }}
    />
  );
}

type Props = { level: StreakLevel; size: number; children: ReactNode };

/** Coloca o fogo do nível atrás do ícone. Sem streak, mostra só o ícone. */
export function StreakFire({ level, size, children }: Props) {
  if (level === 'nenhum') return <>{children}</>;
  const look = LOOKS[level];
  const unit = size / 88;
  const overhang = look.overhang * unit;
  const ring = 102 * unit;
  return (
    <View style={{ width: size, height: size + overhang }}>
      {/* Fogo: o centro do desenho fica no centro do ícone */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: size / 2 - 80 * unit, top: overhang + size / 2 + BOX_TOP * unit }}>
        {look.layers.map((layer, i) => (
          <FlameLayer key={i} layer={layer} unit={unit} duration={1000 + i * 170} first={i === 0} />
        ))}
        {look.sparks.map((color, i) => (
          <Spark key={i} x={SPARK_SPOTS[i][0]} y={SPARK_SPOTS[i][1]} color={color} unit={unit} delay={i * 470} />
        ))}
      </View>
      {/* Anel escuro: separa o fogo da borda do ícone */}
      <Svg
        width={ring}
        height={ring}
        style={{ position: 'absolute', left: size / 2 - ring / 2, top: overhang + size / 2 - ring / 2 }}>
        <Circle cx={ring / 2} cy={ring / 2} r={ring / 2} fill={colors.background} />
      </Svg>
      <View style={{ position: 'absolute', left: 0, top: overhang }}>{children}</View>
    </View>
  );
}
