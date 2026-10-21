// Frank, o mascote do Gains Club, em vetor e animado.
//
// Cada fase é montada em camadas (SVGs sobrepostos com o mesmo viewBox). As partes
// que se mexem ficam numa camada própria, animada com Animated.View, o que roda
// no lado nativo e funciona igual no celular e no navegador.

import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import type { FrankPhase } from '@/lib/frank';

const C = {
  pena: '#F4F1E8',
  sombra: '#DDD7C6',
  crista: '#FF7A45',
  bico: '#FFC23D',
  tinta: '#15161A',
  suor: '#7FD3F7',
  ferro: '#8C929C',
  limao: '#C6F432',
  ouro: '#F5C542',
};

const VIEW_W = 200;
const VIEW_H = 230;

// Letras "GC" da regata, já convertidas em curvas (fonte Big Shoulders).
const GC_PATH =
  'M92.1 154.3L92.1 154.3Q89.8 154.3 88.3 153.7Q86.9 153.1 86.2 151.7Q85.4 150.4 85.4 148.2L85.4 148.2Q85.3 146.7 85.3 144.9Q85.3 143.1 85.3 141.3Q85.3 139.4 85.3 137.6Q85.3 135.9 85.4 134.4L85.4 134.4Q85.5 132.2 86.2 130.8Q86.9 129.4 88.3 128.7Q89.8 128.1 92.1 128.1L92.1 128.1Q95.5 128.1 97.0 129.5Q98.6 130.9 98.8 134.2L98.8 134.2Q98.8 135.0 98.8 136.0Q98.8 137.1 98.8 137.9L98.8 137.9L94.3 137.9Q94.3 136.8 94.3 135.8Q94.3 134.7 94.3 133.6L94.3 133.6Q94.2 132.6 93.7 132.2Q93.2 131.7 92.1 131.7L92.1 131.7Q90.9 131.7 90.4 132.2Q89.9 132.6 89.8 133.6L89.8 133.6Q89.7 135.4 89.7 137.3Q89.6 139.2 89.6 141.2Q89.6 143.1 89.7 145.0Q89.7 146.9 89.8 148.7L89.8 148.7Q89.9 149.8 90.4 150.2Q90.9 150.7 92.1 150.7L92.1 150.7Q93.3 150.7 93.9 150.2Q94.4 149.8 94.5 148.7L94.5 148.7Q94.6 148.3 94.6 147.7Q94.6 147.2 94.6 146.6Q94.6 146.1 94.5 145.6L94.5 145.6L92.6 145.6L92.6 141.7L98.9 141.7Q98.9 143.3 98.9 145.0Q98.9 146.7 98.8 148.2L98.8 148.2Q98.7 151.5 97.1 152.9Q95.6 154.3 92.1 154.3ZM108.2 154.3L108.2 154.3Q104.7 154.3 103.1 152.9Q101.5 151.5 101.5 148.2L101.5 148.2Q101.4 146.3 101.4 144.6Q101.4 142.9 101.4 141.2Q101.4 139.5 101.4 137.8Q101.4 136.0 101.5 134.2L101.5 134.2Q101.5 131.0 103.1 129.6Q104.7 128.1 108.2 128.1L108.2 128.1Q111.6 128.1 113.2 129.6Q114.8 131.1 114.9 134.2L114.9 134.2Q114.9 134.8 114.9 135.4Q114.9 136.0 114.9 136.7Q114.8 137.3 114.8 137.9L114.8 137.9L110.4 137.9Q110.4 137.3 110.4 136.6Q110.4 135.9 110.4 135.2Q110.4 134.6 110.4 133.9L110.4 133.9Q110.4 132.8 109.9 132.2Q109.4 131.7 108.2 131.7L108.2 131.7Q107.0 131.7 106.5 132.2Q106.0 132.8 105.9 133.9L105.9 133.9Q105.9 135.8 105.8 137.6Q105.8 139.4 105.8 141.2Q105.8 143.0 105.8 144.8Q105.9 146.6 105.9 148.4L105.9 148.4Q106.0 149.6 106.5 150.2Q107.0 150.7 108.2 150.7L108.2 150.7Q109.4 150.7 110.0 150.2Q110.5 149.6 110.5 148.4L110.5 148.4Q110.6 147.8 110.6 147.2Q110.6 146.5 110.6 145.9Q110.6 145.2 110.5 144.4L110.5 144.4L115.0 144.4Q115.0 145.3 115.0 146.3Q115.0 147.3 115.0 148.2L115.0 148.2Q114.9 151.5 113.3 152.9Q111.8 154.3 108.2 154.3Z';

// ---------- Animações ----------

/** Respeita a opção "Reduzir movimento" do sistema. */
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/** Valor que vai de 0 a 1 e volta, para sempre. */
function useLoop(duration: number, enabled: boolean, mode: 'pingpong' | 'restart' = 'pingpong', delay = 0) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!enabled) {
      value.setValue(0);
      return;
    }
    const ease = Easing.inOut(Easing.quad);
    const forward = Animated.timing(value, { toValue: 1, duration, easing: ease, useNativeDriver: true });
    const sequence =
      mode === 'pingpong'
        ? Animated.sequence([forward, Animated.timing(value, { toValue: 0, duration, easing: ease, useNativeDriver: true })])
        : Animated.sequence([Animated.delay(delay), forward, Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true })]);
    const loop = Animated.loop(sequence);
    loop.start();
    return () => loop.stop();
  }, [value, duration, enabled, mode, delay]);
  return value;
}

/** Uma camada do desenho: ocupa o Frank inteiro e pode ser animada. */
function Layer({ children, style }: { children: ReactNode; style?: Animated.WithAnimatedValue<ViewStyle> }) {
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/** Ponto de giro em % do desenho, a partir de coordenadas do viewBox. */
const origin = (x: number, y: number) => `${(x / VIEW_W) * 100}% ${(y / VIEW_H) * 100}%`;

// ---------- Fase 1: Frango (treme com a barra e sua) ----------

function Frango({ animate }: { animate: boolean }) {
  const shake = useLoop(90, animate);
  const sweat = useLoop(1400, animate, 'restart', 300);
  const barShake = shake.interpolate({ inputRange: [0, 1], outputRange: [-1.5, 1.5] });
  const dropY = sweat.interpolate({ inputRange: [0, 1], outputRange: [0, 22] });
  const dropOpacity = sweat.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.8, 0] });

  return (
    <>
      <Layer>
        <G y={8}>
          <Ellipse cx={100} cy={212} rx={44} ry={6} fill="#000000" fillOpacity={0.25} />
          <Path d="M90 168 V204 M110 168 V204" stroke={C.bico} strokeWidth={5} strokeLinecap="round" />
          <Path d="M80 206 H96 M104 206 H120" stroke={C.bico} strokeWidth={5} strokeLinecap="round" />
          <Ellipse cx={100} cy={142} rx={30} ry={34} fill={C.pena} />
          <Path d="M88 108 Q100 120 112 108 L110 124 L90 124 Z" fill={C.pena} />
          <Circle cx={86} cy={36} r={10} fill={C.crista} />
          <Circle cx={100} cy={30} r={11} fill={C.crista} />
          <Circle cx={113} cy={37} r={9} fill={C.crista} />
          <Circle cx={100} cy={72} r={34} fill={C.pena} />
          <Circle cx={88} cy={68} r={8} fill="#FFFFFF" />
          <Circle cx={89} cy={70} r={4} fill={C.tinta} />
          <Circle cx={112} cy={68} r={8} fill="#FFFFFF" />
          <Circle cx={111} cy={70} r={4} fill={C.tinta} />
          <Path d="M80 60 L94 55 M120 60 L106 55" stroke={C.tinta} strokeWidth={3} strokeLinecap="round" />
          <Path d="M93 80 L107 80 L100 92 Z" fill={C.bico} />
          <Ellipse cx={100} cy={97} rx={4} ry={6} fill={C.crista} />
        </G>
      </Layer>
      {/* Barra e asas tremendo de esforço */}
      <Layer style={{ transform: [{ translateY: barShake }] }}>
        <G y={8}>
          <Line x1={24} y1={128} x2={176} y2={128} stroke={C.ferro} strokeWidth={5} strokeLinecap="round" />
          <Ellipse cx={72} cy={132} rx={9} ry={13} fill={C.sombra} />
          <Ellipse cx={128} cy={132} rx={9} ry={13} fill={C.sombra} />
          <Path d="M58 116 L62 122 M142 116 L138 122" stroke={C.tinta} strokeWidth={2} strokeLinecap="round" />
        </G>
      </Layer>
      {/* Gota de suor escorrendo */}
      <Layer style={{ opacity: dropOpacity, transform: [{ translateY: dropY }] }}>
        <G y={8}>
          <Path d="M136 52 Q142 62 136 68 Q130 62 136 52 Z" fill={C.suor} />
        </G>
      </Layer>
    </>
  );
}

// ---------- Fase 2: Marombeiro (rosca com o haltere) ----------

function Marombeiro({ animate }: { animate: boolean }) {
  const curl = useLoop(900, animate);
  const armRotate = curl.interpolate({ inputRange: [0, 1], outputRange: ['8deg', '-22deg'] });

  return (
    <>
      <Layer>
        <G y={8}>
          <Ellipse cx={100} cy={212} rx={52} ry={6} fill="#000000" fillOpacity={0.25} />
          <Path d="M86 172 V204 M114 172 V204" stroke={C.bico} strokeWidth={6} strokeLinecap="round" />
          <Path d="M74 206 H94 M106 206 H126" stroke={C.bico} strokeWidth={6} strokeLinecap="round" />
          <Ellipse cx={100} cy={140} rx={42} ry={40} fill={C.pena} />
          <Path d="M58 132 C42 128 40 150 54 154" fill={C.pena} />
          <Ellipse cx={52} cy={142} rx={10} ry={12} fill={C.sombra} />
        </G>
      </Layer>
      {/* Braço com o haltere: gira em torno do ombro */}
      <Layer style={{ transformOrigin: origin(138, 136), transform: [{ rotate: armRotate }] }}>
        <G y={8}>
          <Path d="M140 128 C156 116 160 96 152 82" stroke={C.pena} strokeWidth={18} strokeLinecap="round" fill="none" />
          <Ellipse cx={152} cy={104} rx={11} ry={9} fill={C.sombra} />
          <Rect x={138} y={70} width={30} height={7} rx={3} fill={C.ferro} />
          <Rect x={132} y={62} width={10} height={23} rx={3} fill={C.tinta} />
          <Rect x={164} y={62} width={10} height={23} rx={3} fill={C.tinta} />
        </G>
      </Layer>
      <Layer>
        <G y={8}>
          <Circle cx={86} cy={30} r={11} fill={C.crista} />
          <Circle cx={100} cy={24} r={12} fill={C.crista} />
          <Circle cx={114} cy={31} r={10} fill={C.crista} />
          <Circle cx={100} cy={66} r={34} fill={C.pena} />
          <Rect x={66} y={44} width={68} height={10} rx={5} fill={C.limao} />
          <Path d="M68 50 L56 58 M68 50 L58 46" stroke={C.limao} strokeWidth={5} strokeLinecap="round" />
          <Circle cx={88} cy={68} r={7} fill="#FFFFFF" />
          <Circle cx={90} cy={69} r={4} fill={C.tinta} />
          <Circle cx={112} cy={68} r={7} fill="#FFFFFF" />
          <Circle cx={114} cy={69} r={4} fill={C.tinta} />
          <Path d="M80 60 L95 63 M120 60 L106 63" stroke={C.tinta} strokeWidth={3.5} strokeLinecap="round" />
          <Path d="M93 76 L107 76 L100 88 Z" fill={C.bico} />
          <Ellipse cx={100} cy={93} rx={5} ry={7} fill={C.crista} />
        </G>
      </Layer>
    </>
  );
}

// ---------- Fase 3: Monstro (respira e flexiona) ----------

function Monstro({ animate }: { animate: boolean }) {
  const breath = useLoop(1300, animate);
  const chest = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const flex = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <>
      <Layer>
        <Ellipse cx={100} cy={222} rx={62} ry={7} fill="#000000" fillOpacity={0.25} />
        <Path d="M82 188 V214 M118 188 V214" stroke={C.bico} strokeWidth={7} strokeLinecap="round" />
        <Path d="M70 216 H94 M106 216 H130" stroke={C.bico} strokeWidth={7} strokeLinecap="round" />
      </Layer>
      {/* Braços flexionando (cada um cresce a partir do ombro) */}
      <Layer style={{ transformOrigin: origin(50, 110), transform: [{ scale: flex }] }}>
        <Path d="M44 104 C22 104 14 128 22 146 C30 160 50 154 54 140" fill={C.pena} />
        <Ellipse cx={30} cy={124} rx={16} ry={13} fill={C.sombra} />
      </Layer>
      <Layer style={{ transformOrigin: origin(150, 110), transform: [{ scale: flex }] }}>
        <Path d="M156 104 C178 104 186 128 178 146 C170 160 150 154 146 140" fill={C.pena} />
        <Ellipse cx={170} cy={124} rx={16} ry={13} fill={C.sombra} />
      </Layer>
      {/* Peito estufando com a respiração */}
      <Layer style={{ transformOrigin: origin(100, 190), transform: [{ scaleX: chest }, { scaleY: chest }] }}>
        <Path d="M44 110 C44 92 70 84 100 84 C130 84 156 92 156 110 L146 182 C140 196 60 196 54 182 Z" fill={C.pena} />
        <Path d="M60 112 C62 100 80 96 100 96 C120 96 138 100 140 112 L134 176 C126 186 74 186 66 176 Z" fill={C.tinta} />
        <Path d={GC_PATH} fill={C.limao} />
        <Path d="M78 104 Q100 122 122 104" fill="none" stroke={C.ouro} strokeWidth={4} />
        <Circle cx={84} cy={22} r={13} fill={C.crista} />
        <Circle cx={100} cy={15} r={14} fill={C.crista} />
        <Circle cx={115} cy={23} r={12} fill={C.crista} />
        <Circle cx={100} cy={58} r={36} fill={C.pena} />
        <Rect x={72} y={46} width={56} height={16} rx={8} fill={C.tinta} />
        <Rect x={78} y={49} width={18} height={6} rx={3} fill={C.ferro} />
        <Path d="M92 70 L108 70 L100 84 Z" fill={C.bico} />
        <Ellipse cx={100} cy={90} rx={6} ry={8} fill={C.crista} />
        <Path d="M110 76 Q118 80 124 74" fill="none" stroke={C.tinta} strokeWidth={3} strokeLinecap="round" />
      </Layer>
    </>
  );
}

// ---------- Componentes públicos ----------

type FrankProps = {
  phase: FrankPhase;
  size?: number;
  /** Desliga as animações (o Frank fica parado). */
  still?: boolean;
  /** Entrada com um pulo, para quando o Frank acabou de mudar de fase. */
  entrance?: boolean;
};

/** Frank de corpo inteiro, animado conforme a fase. Proporção 200 × 230. */
export function Frank({ phase, size = 120, still = false, entrance = false }: FrankProps) {
  const reduceMotion = useReduceMotion();
  const animate = !still && !reduceMotion;

  const [pop] = useState(() => new Animated.Value(entrance ? 0 : 1));
  useEffect(() => {
    if (!entrance) return;
    if (reduceMotion) {
      pop.setValue(1);
      return;
    }
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 70, useNativeDriver: true }).start();
  }, [entrance, reduceMotion, pop]);

  // Todas as fases sobem e descem de leve, como quem respira; o Frango treme em vez disso.
  const bob = useLoop(1100, animate && phase !== 'frango');
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Frank, fase ${phase}`}
      style={{
        width: size,
        height: (size * VIEW_H) / VIEW_W,
        transform: [{ translateY: bobY }, { scale: pop }],
      }}>
      <View style={StyleSheet.absoluteFill}>
        {phase === 'frango' && <Frango animate={animate} />}
        {phase === 'marombeiro' && <Marombeiro animate={animate} />}
        {phase === 'monstro' && <Monstro animate={animate} />}
      </View>
    </Animated.View>
  );
}

/** Cabeça do Frank de perfil (a mesma do ícone do app). Fica parada. */
export function FrankHead({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G transform="translate(2 6) scale(0.96)">
        <Circle cx={40} cy={22} r={11} fill={C.crista} />
        <Circle cx={54} cy={17} r={12} fill={C.crista} />
        <Circle cx={66} cy={24} r={10} fill={C.crista} />
        <Circle cx={52} cy={54} r={30} fill={C.pena} />
        <Ellipse cx={64} cy={49} rx={6} ry={7} fill={C.tinta} />
        <Circle cx={66} cy={47} r={2} fill={C.pena} />
        <Path d="M58 41 L72 37" stroke={C.tinta} strokeWidth={4} strokeLinecap="round" />
        <Path d="M78 52 L96 59 L78 66 Z" fill={C.bico} />
        <Ellipse cx={78} cy={72} rx={5} ry={8} fill={C.crista} />
      </G>
    </Svg>
  );
}
