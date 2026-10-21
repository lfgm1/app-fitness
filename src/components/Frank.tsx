// Frank, o mascote do Gains Club, em vetor e animado.
//
// Cada fase é uma lista de camadas (partes do desenho com o mesmo viewBox). No app, cada camada
// fica num SVG próprio e as que se mexem são animadas com Animated.View (roda no lado nativo e
// funciona igual no celular e no navegador). Para virar imagem (card de compartilhar), as mesmas
// camadas são desenhadas juntas num SVG só, paradas: veja <FrankArt />.

import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { FRANK_PHASES } from '@/lib/frank';
import type { FrankPhase } from '@/lib/frank';

const C = {
  pena: '#F4F1E8',
  sombra: '#DDD7C6',
  crista: '#FF7A45',
  bico: '#FFC23D',
  bicoEscuro: '#E8A321',
  tinta: '#15161A',
  suor: '#7FD3F7',
  ferro: '#8C929C',
  limao: '#C6F432',
  limaoEscuro: '#9CC21F',
  ouro: '#F5C542',
  azul: '#4CC9F0',
};

export const FRANK_VIEW_W = 200;
export const FRANK_VIEW_H = 230;

// Letras "GC" da regata, já convertidas em curvas (fonte Big Shoulders).
const GC_PATH =
  'M92.1 154.3L92.1 154.3Q89.8 154.3 88.3 153.7Q86.9 153.1 86.2 151.7Q85.4 150.4 85.4 148.2L85.4 148.2Q85.3 146.7 85.3 144.9Q85.3 143.1 85.3 141.3Q85.3 139.4 85.3 137.6Q85.3 135.9 85.4 134.4L85.4 134.4Q85.5 132.2 86.2 130.8Q86.9 129.4 88.3 128.7Q89.8 128.1 92.1 128.1L92.1 128.1Q95.5 128.1 97.0 129.5Q98.6 130.9 98.8 134.2L98.8 134.2Q98.8 135.0 98.8 136.0Q98.8 137.1 98.8 137.9L98.8 137.9L94.3 137.9Q94.3 136.8 94.3 135.8Q94.3 134.7 94.3 133.6L94.3 133.6Q94.2 132.6 93.7 132.2Q93.2 131.7 92.1 131.7L92.1 131.7Q90.9 131.7 90.4 132.2Q89.9 132.6 89.8 133.6L89.8 133.6Q89.7 135.4 89.7 137.3Q89.6 139.2 89.6 141.2Q89.6 143.1 89.7 145.0Q89.7 146.9 89.8 148.7L89.8 148.7Q89.9 149.8 90.4 150.2Q90.9 150.7 92.1 150.7L92.1 150.7Q93.3 150.7 93.9 150.2Q94.4 149.8 94.5 148.7L94.5 148.7Q94.6 148.3 94.6 147.7Q94.6 147.2 94.6 146.6Q94.6 146.1 94.5 145.6L94.5 145.6L92.6 145.6L92.6 141.7L98.9 141.7Q98.9 143.3 98.9 145.0Q98.9 146.7 98.8 148.2L98.8 148.2Q98.7 151.5 97.1 152.9Q95.6 154.3 92.1 154.3ZM108.2 154.3L108.2 154.3Q104.7 154.3 103.1 152.9Q101.5 151.5 101.5 148.2L101.5 148.2Q101.4 146.3 101.4 144.6Q101.4 142.9 101.4 141.2Q101.4 139.5 101.4 137.8Q101.4 136.0 101.5 134.2L101.5 134.2Q101.5 131.0 103.1 129.6Q104.7 128.1 108.2 128.1L108.2 128.1Q111.6 128.1 113.2 129.6Q114.8 131.1 114.9 134.2L114.9 134.2Q114.9 134.8 114.9 135.4Q114.9 136.0 114.9 136.7Q114.8 137.3 114.8 137.9L114.8 137.9L110.4 137.9Q110.4 137.3 110.4 136.6Q110.4 135.9 110.4 135.2Q110.4 134.6 110.4 133.9L110.4 133.9Q110.4 132.8 109.9 132.2Q109.4 131.7 108.2 131.7L108.2 131.7Q107.0 131.7 106.5 132.2Q106.0 132.8 105.9 133.9L105.9 133.9Q105.9 135.8 105.8 137.6Q105.8 139.4 105.8 141.2Q105.8 143.0 105.8 144.8Q105.9 146.6 105.9 148.4L105.9 148.4Q106.0 149.6 106.5 150.2Q107.0 150.7 108.2 150.7L108.2 150.7Q109.4 150.7 110.0 150.2Q110.5 149.6 110.5 148.4L110.5 148.4Q110.6 147.8 110.6 147.2Q110.6 146.5 110.6 145.9Q110.6 145.2 110.5 144.4L110.5 144.4L115.0 144.4Q115.0 145.3 115.0 146.3Q115.0 147.3 115.0 148.2L115.0 148.2Q114.9 151.5 113.3 152.9Q111.8 154.3 108.2 154.3Z';

// ---------- Peças em comum ----------

/** Pés amarelos. `spread` = distância de cada perna até o meio. */
function Legs({ spread = 10, top = 168, bottom = 204, width = 5, foot = 8 }) {
  const l = 100 - spread;
  const r = 100 + spread;
  return (
    <>
      <Path
        d={`M${l} ${top} V${bottom} M${r} ${top} V${bottom}`}
        stroke={C.bico}
        strokeWidth={width}
        strokeLinecap="round"
      />
      <Path
        d={`M${l - foot} ${bottom + 2} H${l + foot / 2} M${r - foot / 2} ${bottom + 2} H${r + foot}`}
        stroke={C.bico}
        strokeWidth={width}
        strokeLinecap="round"
      />
    </>
  );
}

function Shadow({ rx = 44, cy = 212 }) {
  return <Ellipse cx={100} cy={cy} rx={rx} ry={6} fill="#000000" fillOpacity={0.25} />;
}

/** Crista de três bolinhas. */
function Crest({ y = 36, size = 1 }) {
  return (
    <>
      <Circle cx={100 - 14 * size} cy={y} r={10 * size} fill={C.crista} />
      <Circle cx={100} cy={y - 6 * size} r={11 * size} fill={C.crista} />
      <Circle cx={100 + 13 * size} cy={y + 1} r={9 * size} fill={C.crista} />
    </>
  );
}

type Brows = 'esforco' | 'animado' | 'decidido' | 'nenhuma';

/** Cabeça de frente: rosto redondo, olhos, sobrancelhas, bico e barbela. */
function Face({ y = 72, r = 34, brows = 'animado' as Brows }) {
  const browPath = {
    esforco: `M80 ${y - 12} L94 ${y - 17} M120 ${y - 12} L106 ${y - 17}`,
    animado: `M79 ${y - 17} Q86 ${y - 26} 94 ${y - 19} M106 ${y - 19} Q114 ${y - 26} 121 ${y - 17}`,
    decidido: `M80 ${y - 12} L95 ${y - 9} M120 ${y - 12} L106 ${y - 9}`,
    nenhuma: '',
  }[brows];
  return (
    <>
      <Circle cx={100} cy={y} r={r} fill={C.pena} />
      <Circle cx={88} cy={y - 4} r={8} fill="#FFFFFF" />
      <Circle cx={89} cy={y - 2} r={4} fill={C.tinta} />
      <Circle cx={112} cy={y - 4} r={8} fill="#FFFFFF" />
      <Circle cx={111} cy={y - 2} r={4} fill={C.tinta} />
      {browPath ? <Path d={browPath} stroke={C.tinta} strokeWidth={3} strokeLinecap="round" fill="none" /> : null}
      <Path d={`M93 ${y + 8} L107 ${y + 8} L100 ${y + 20} Z`} fill={C.bico} />
      <Ellipse cx={100} cy={y + 25} rx={4} ry={6} fill={C.crista} />
    </>
  );
}

/** Cabeça quadrada de queixo largo (Gigachad e Aura), com óculos escuros. */
function ChadFace() {
  return (
    <>
      <Crest y={20} size={1.25} />
      <Path d="M66 40 Q66 22 100 22 Q134 22 134 40 L136 78 Q136 96 100 96 Q64 96 64 78 Z" fill={C.pena} />
      <Path d="M68 80 Q100 104 132 80" fill="none" stroke={C.sombra} strokeWidth={4} strokeLinecap="round" />
      <Rect x={70} y={46} width={60} height={15} rx={6} fill={C.tinta} />
      <Rect x={76} y={49} width={18} height={5} rx={2.5} fill={C.ferro} />
      <Path d="M92 66 L108 66 L100 78 Z" fill={C.bico} />
      <Path d="M108 84 Q116 88 122 82" fill="none" stroke={C.tinta} strokeWidth={3} strokeLinecap="round" />
    </>
  );
}

/** Tronco largo de regata preta com "GC" e corrente dourada (Gigachad e Aura). */
function ChadTorso() {
  return (
    <>
      <Path d="M44 110 C44 92 70 84 100 84 C130 84 156 92 156 110 L146 182 C140 196 60 196 54 182 Z" fill={C.pena} />
      <Path d="M60 112 C62 100 80 96 100 96 C120 96 138 100 140 112 L134 176 C126 186 74 186 66 176 Z" fill={C.tinta} />
      <Path d={GC_PATH} fill={C.limao} />
      <Path d="M78 104 Q100 122 122 104" fill="none" stroke={C.ouro} strokeWidth={4} />
    </>
  );
}

const CHAD_ARM_LEFT = (
  <>
    <Path d="M44 104 C22 104 14 128 22 146 C30 160 50 154 54 140" fill={C.pena} />
    <Ellipse cx={30} cy={124} rx={16} ry={13} fill={C.sombra} />
  </>
);
const CHAD_ARM_RIGHT = (
  <>
    <Path d="M156 104 C178 104 186 128 178 146 C170 160 150 154 146 140" fill={C.pena} />
    <Ellipse cx={170} cy={124} rx={16} ry={13} fill={C.sombra} />
  </>
);
const CHAD_LEGS = (
  <>
    <Shadow rx={62} cy={222} />
    <Path d="M82 188 V214 M118 188 V214" stroke={C.bico} strokeWidth={7} strokeLinecap="round" />
    <Path d="M70 216 H94 M106 216 H130" stroke={C.bico} strokeWidth={7} strokeLinecap="round" />
  </>
);

// ---------- As fases ----------

/** Animação de cada camada (veja como cada uma é aplicada em <Frank />). */
type Anim = 'shake' | 'drop' | 'curl' | 'flexL' | 'flexR' | 'chest' | 'spin' | 'float';
type LayerDef = { anim?: Anim; el: ReactNode };

/** Movimento do corpo inteiro. */
const BODY_MOTION: Record<FrankPhase, 'wobble' | 'hop' | 'bob' | 'nod' | 'none'> = {
  ovo: 'wobble',
  pintinho: 'hop',
  frango: 'none',
  rato: 'nod',
  gymbro: 'bob',
  shape: 'bob',
  gigachad: 'bob',
  aura: 'bob',
};

function layersFor(phase: FrankPhase): LayerDef[] {
  switch (phase) {
    // Ovo: ainda não chocou. Só os olhos aparecem pela rachadura.
    case 'ovo':
      return [
        {
          el: (
            <>
              <Shadow rx={40} cy={214} />
              <Path
                d="M100 52 C140 52 158 120 156 158 C154 196 130 212 100 212 C70 212 46 196 44 158 C42 120 60 52 100 52 Z"
                fill={C.pena}
              />
              <Circle cx={74} cy={90} r={5} fill={C.sombra} />
              <Circle cx={128} cy={178} r={6} fill={C.sombra} />
              <Circle cx={66} cy={176} r={4} fill={C.sombra} />
              <Path
                d="M56 128 L70 118 L82 132 L96 116 L110 132 L124 118 L144 130"
                stroke={C.tinta}
                strokeWidth={3}
                fill="none"
                strokeLinejoin="round"
              />
              <Circle cx={88} cy={150} r={8} fill="#FFFFFF" />
              <Circle cx={89} cy={152} r={4} fill={C.tinta} />
              <Circle cx={112} cy={150} r={8} fill="#FFFFFF" />
              <Circle cx={111} cy={152} r={4} fill={C.tinta} />
            </>
          ),
        },
      ];

    // Pintinho: acabou de sair da casca (a metade de baixo continua nele).
    case 'pintinho':
      return [
        {
          el: (
            <>
              <Shadow rx={46} cy={214} />
              <Circle cx={94} cy={110} r={5} fill={C.crista} />
              <Circle cx={100} cy={105} r={6} fill={C.crista} />
              <Circle cx={106} cy={110} r={5} fill={C.crista} />
              <Circle cx={100} cy={150} r={42} fill={C.bico} />
              <Ellipse cx={60} cy={156} rx={10} ry={16} fill={C.bicoEscuro} />
              <Ellipse cx={140} cy={156} rx={10} ry={16} fill={C.bicoEscuro} />
              <Circle cx={87} cy={140} r={9} fill="#FFFFFF" />
              <Circle cx={88} cy={142} r={4.5} fill={C.tinta} />
              <Circle cx={113} cy={140} r={9} fill="#FFFFFF" />
              <Circle cx={112} cy={142} r={4.5} fill={C.tinta} />
              <Path
                d="M78 124 Q86 116 94 122 M106 122 Q114 116 122 124"
                stroke={C.tinta}
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />
              <Path d="M93 152 L107 152 L100 162 Z" fill={C.crista} />
              <Path
                d="M54 182 L64 172 L74 184 L86 170 L98 184 L110 170 L122 184 L134 172 L146 182 C146 204 126 214 100 214 C74 214 54 204 54 182 Z"
                fill={C.pena}
              />
              <Circle cx={124} cy={198} r={4} fill={C.sombra} />
            </>
          ),
        },
      ];

    // Frango: camiseta GG, braço P. Treme com a barra vazia e sua.
    case 'frango':
      return [
        {
          el: (
            <G y={8}>
              <Shadow />
              <Legs />
              <Ellipse cx={100} cy={142} rx={30} ry={34} fill={C.pena} />
              <Path d="M66 116 L134 116 L150 140 L136 150 L132 180 L68 180 L64 150 L50 140 Z" fill={C.azul} />
              <Path d="M86 116 Q100 128 114 116" fill="none" stroke={C.tinta} strokeWidth={2.5} />
              <Crest />
              <Face brows="esforco" />
            </G>
          ),
        },
        {
          anim: 'shake',
          el: (
            <G y={8}>
              <Line x1={24} y1={128} x2={176} y2={128} stroke={C.ferro} strokeWidth={5} strokeLinecap="round" />
              <Ellipse cx={72} cy={132} rx={9} ry={13} fill={C.sombra} />
              <Ellipse cx={128} cy={132} rx={9} ry={13} fill={C.sombra} />
              <Path d="M58 116 L62 122 M142 116 L138 122" stroke={C.tinta} strokeWidth={2} strokeLinecap="round" />
            </G>
          ),
        },
        {
          anim: 'drop',
          el: (
            <G y={8}>
              <Path d="M136 52 Q142 62 136 68 Q130 62 136 52 Z" fill={C.suor} />
            </G>
          ),
        },
      ];

    // Rato de academia: fone de ouvido e o garrafão de 2 litros. Balança a cabeça na música.
    case 'rato':
      return [
        {
          el: (
            <G y={8}>
              <Shadow rx={50} />
              <Legs spread={13} top={172} width={6} />
              <Ellipse cx={100} cy={140} rx={40} ry={38} fill={C.pena} />
              <Ellipse cx={58} cy={142} rx={10} ry={14} fill={C.sombra} />
              <Rect x={140} y={110} width={30} height={62} rx={10} fill={C.azul} />
              <Rect x={147} y={100} width={16} height={12} rx={3} fill={C.limao} />
              <Rect x={140} y={128} width={30} height={14} fill={C.tinta} fillOpacity={0.25} />
              <SvgText x={155} y={162} fontSize={13} fontWeight="900" textAnchor="middle" fill={C.tinta}>
                2L
              </SvgText>
              <Ellipse cx={140} cy={142} rx={10} ry={13} fill={C.sombra} />
              <Crest y={34} />
              <Face y={70} brows="animado" />
              <Path
                d="M64 72 Q62 26 100 26 Q138 26 136 72"
                stroke={C.tinta}
                strokeWidth={7}
                fill="none"
                strokeLinecap="round"
              />
              <Rect x={54} y={58} width={16} height={28} rx={7} fill={C.limao} />
              <Rect x={130} y={58} width={16} height={28} rx={7} fill={C.limao} />
            </G>
          ),
        },
        {
          anim: 'float',
          el: (
            <>
              <Circle cx={30} cy={56} r={6} fill={C.limao} />
              <Path d="M35 56 V34 L46 30" stroke={C.limao} strokeWidth={3} fill="none" strokeLinecap="round" />
              <Circle cx={172} cy={40} r={5} fill={C.limao} />
              <Path d="M176 40 V22" stroke={C.limao} strokeWidth={3} strokeLinecap="round" />
            </>
          ),
        },
      ];

    // Gymbro: regata cavada e boné pra trás, fazendo rosca com o haltere.
    case 'gymbro':
      return [
        {
          el: (
            <G y={8}>
              <Shadow rx={52} />
              <Legs spread={14} top={172} width={6} foot={12} />
              <Ellipse cx={100} cy={140} rx={44} ry={40} fill={C.pena} />
              <Path d="M72 108 Q100 122 128 108 L136 172 Q100 186 64 172 Z" fill={C.tinta} />
              <Path d="M58 132 C42 128 40 150 54 154" fill={C.pena} />
              <Ellipse cx={52} cy={142} rx={11} ry={13} fill={C.sombra} />
            </G>
          ),
        },
        {
          anim: 'curl',
          el: (
            // Braço afastado da cabeça, para o haltere aparecer inteiro.
            <G transform="translate(14 8)">
              <Path
                d="M140 128 C156 116 160 96 152 82"
                stroke={C.pena}
                strokeWidth={20}
                strokeLinecap="round"
                fill="none"
              />
              <Ellipse cx={152} cy={104} rx={12} ry={10} fill={C.sombra} />
              <Rect x={138} y={70} width={30} height={7} rx={3} fill={C.ferro} />
              <Rect x={132} y={62} width={10} height={23} rx={3} fill={C.tinta} />
              <Rect x={164} y={62} width={10} height={23} rx={3} fill={C.tinta} />
            </G>
          ),
        },
        {
          el: (
            <G y={8}>
              <Face y={66} brows="decidido" />
              <Path d="M66 54 Q66 28 100 28 Q134 28 134 54 Z" fill={C.limao} />
              <Path d="M66 50 L44 56 Q42 62 50 62 L68 56 Z" fill={C.limaoEscuro} />
              <Circle cx={100} cy={30} r={4} fill={C.limaoEscuro} />
            </G>
          ),
        },
      ];

    // Shape inexplicável: peitoral gigante em V... e as perninhas de frango de sempre.
    case 'shape':
      return [
        {
          el: (
            <>
              <Shadow rx={58} cy={220} />
              <Legs spread={9} top={176} bottom={210} width={4} foot={7} />
              <Ellipse cx={30} cy={122} rx={20} ry={30} fill={C.pena} />
              <Ellipse cx={30} cy={112} rx={14} ry={13} fill={C.sombra} />
              <Ellipse cx={170} cy={122} rx={20} ry={30} fill={C.pena} />
              <Ellipse cx={170} cy={112} rx={14} ry={13} fill={C.sombra} />
              <Path
                d="M28 96 C28 82 64 74 100 74 C136 74 172 82 172 96 L136 172 C128 184 72 184 64 172 Z"
                fill={C.pena}
              />
              <Path
                d="M60 104 Q80 120 100 106 Q120 120 140 104"
                fill="none"
                stroke={C.sombra}
                strokeWidth={4}
                strokeLinecap="round"
              />
              <Rect x={86} y={128} width={12} height={12} rx={4} fill={C.sombra} />
              <Rect x={102} y={128} width={12} height={12} rx={4} fill={C.sombra} />
              <Rect x={86} y={146} width={12} height={12} rx={4} fill={C.sombra} />
              <Rect x={102} y={146} width={12} height={12} rx={4} fill={C.sombra} />
              <Crest y={22} size={0.85} />
              <Face y={50} r={28} brows="decidido" />
            </>
          ),
        },
        {
          anim: 'float',
          el: (
            <>
              <SvgText x={176} y={50} fontSize={30} fontWeight="900" fill={C.limao}>
                ?
              </SvgText>
              <SvgText x={12} y={62} fontSize={22} fontWeight="900" fill={C.limao}>
                ?
              </SvgText>
            </>
          ),
        },
      ];

    // Gigachad: queixo quadrado, óculos escuros e corrente. Respira e flexiona.
    case 'gigachad':
      return [
        { el: CHAD_LEGS },
        { anim: 'flexL', el: CHAD_ARM_LEFT },
        { anim: 'flexR', el: CHAD_ARM_RIGHT },
        {
          anim: 'chest',
          el: (
            <>
              <ChadTorso />
              <ChadFace />
            </>
          ),
        },
      ];

    // Aura infinita: o Gigachad de coroa, com a aura girando em volta.
    case 'aura':
      return [
        {
          anim: 'spin',
          el: (
            <>
              <Circle cx={100} cy={120} r={98} fill="none" stroke={C.limao} strokeWidth={3} strokeDasharray="10 12" />
              <Circle
                cx={100}
                cy={120}
                r={88}
                fill="none"
                stroke={C.ouro}
                strokeWidth={2.5}
                strokeDasharray="2 10"
                strokeLinecap="round"
              />
              <Path d="M14 70 L18 60 L22 70 L32 74 L22 78 L18 88 L14 78 L4 74 Z" fill={C.ouro} />
              <Path d="M178 160 L181 152 L184 160 L192 163 L184 166 L181 174 L178 166 L170 163 Z" fill={C.limao} />
            </>
          ),
        },
        { el: CHAD_LEGS },
        { anim: 'flexL', el: CHAD_ARM_LEFT },
        { anim: 'flexR', el: CHAD_ARM_RIGHT },
        {
          anim: 'chest',
          el: (
            <>
              <ChadTorso />
              <ChadFace />
              <Path
                d="M70 26 L76 2 L88 16 L100 -2 L112 16 L124 2 L130 26 Z"
                fill={C.ouro}
                stroke={C.tinta}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
              <Circle cx={100} cy={14} r={4} fill={C.crista} />
            </>
          ),
        },
      ];
  }
}

// ---------- Animações ----------

/** Respeita a opção "Reduzir movimento" do sistema. */
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduce)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/** Valor que vai de 0 a 1 (e volta, no modo pingpong), para sempre. */
function useLoop(
  duration: number,
  enabled: boolean,
  mode: 'pingpong' | 'restart' = 'pingpong',
  delay = 0,
  easing = Easing.inOut(Easing.quad)
) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!enabled) {
      value.setValue(0);
      return;
    }
    const forward = Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver: true });
    const sequence =
      mode === 'pingpong'
        ? Animated.sequence([forward, Animated.timing(value, { toValue: 0, duration, easing, useNativeDriver: true })])
        : Animated.sequence([
            Animated.delay(delay),
            forward,
            Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]);
    const loop = Animated.loop(sequence);
    loop.start();
    return () => loop.stop();
  }, [value, duration, enabled, mode, delay, easing]);
  return value;
}

const LINEAR = Easing.linear;

/** Uma camada do desenho: ocupa o Frank inteiro e pode ser animada. */
function Layer({ children, style }: { children: ReactNode; style?: Animated.WithAnimatedValue<ViewStyle> }) {
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 -4 ${FRANK_VIEW_W} ${FRANK_VIEW_H}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/** Ponto de giro em % do desenho, a partir de coordenadas do viewBox. */
const origin = (x: number, y: number) => `${(x / FRANK_VIEW_W) * 100}% ${((y + 4) / FRANK_VIEW_H) * 100}%`;

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
  const layers = layersFor(phase);
  const uses = (anim: Anim) => animate && layers.some((l) => l.anim === anim);
  const motion = animate ? BODY_MOTION[phase] : 'none';

  const [pop] = useState(() => new Animated.Value(entrance ? 0 : 1));
  useEffect(() => {
    if (!entrance) return;
    if (reduceMotion) {
      pop.setValue(1);
      return;
    }
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 70, useNativeDriver: true }).start();
  }, [entrance, reduceMotion, pop]);

  // Partes que se mexem
  const shake = useLoop(90, uses('shake'));
  const sweat = useLoop(1400, uses('drop'), 'restart', 300);
  const curl = useLoop(900, uses('curl'));
  const breath = useLoop(1300, uses('chest') || uses('flexL'));
  const spin = useLoop(9000, uses('spin'), 'restart', 0, LINEAR);
  const float = useLoop(1200, uses('float'));

  // Corpo inteiro
  const body = useLoop(motion === 'nod' ? 420 : motion === 'hop' ? 480 : 1100, motion !== 'none');

  const layerStyle: Record<Anim, Animated.WithAnimatedValue<ViewStyle>> = {
    shake: { transform: [{ translateY: shake.interpolate({ inputRange: [0, 1], outputRange: [-1.5, 1.5] }) }] },
    drop: {
      opacity: sweat.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.8, 0] }),
      transform: [{ translateY: sweat.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) }],
    },
    curl: {
      transformOrigin: origin(152, 144),
      transform: [{ rotate: curl.interpolate({ inputRange: [0, 1], outputRange: ['8deg', '-22deg'] }) }],
    },
    flexL: {
      transformOrigin: origin(50, 110),
      transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
    },
    flexR: {
      transformOrigin: origin(150, 110),
      transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
    },
    chest: {
      transformOrigin: origin(100, 190),
      transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) }],
    },
    spin: {
      transformOrigin: origin(100, 120),
      transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
    },
    float: { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] },
  };

  const bodyTransform =
    motion === 'wobble'
      ? [{ rotate: body.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) }]
      : motion === 'hop'
        ? [{ translateY: body.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }]
        : [{ translateY: body.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }];

  const name = FRANK_PHASES.find((p) => p.phase === phase)?.name ?? phase;

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Frank, fase ${name}`}
      style={{
        width: size,
        height: (size * FRANK_VIEW_H) / FRANK_VIEW_W,
        transformOrigin: '50% 95%',
        transform: [...bodyTransform, { scale: pop }],
      }}>
      <View style={StyleSheet.absoluteFill}>
        {layers.map((layer, i) => (
          <Layer key={`${phase}-${i}`} style={animate && layer.anim ? layerStyle[layer.anim] : undefined}>
            {layer.el}
          </Layer>
        ))}
      </View>
    </Animated.View>
  );
}

/**
 * O Frank parado, como um grupo de SVG (para desenhar dentro de outro SVG, por exemplo no
 * card de compartilhar). Ocupa 200 × 230 a partir de (x, y).
 */
export function FrankArt({
  phase,
  x = 0,
  y = 0,
  scale = 1,
}: {
  phase: FrankPhase;
  x?: number;
  y?: number;
  scale?: number;
}) {
  return (
    <G transform={`translate(${x} ${y + 4 * scale}) scale(${scale})`}>
      {layersFor(phase).map((layer, i) => (
        <G key={i}>{layer.el}</G>
      ))}
    </G>
  );
}

/** Cabeça do Frank de perfil (a mesma do ícone do app), como grupo de SVG de 100 × 100. */
export function FrankHeadArt() {
  return (
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
  );
}

/** Cabeça do Frank de perfil (a mesma do ícone do app). Fica parada. */
export function FrankHead({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <FrankHeadArt />
    </Svg>
  );
}
