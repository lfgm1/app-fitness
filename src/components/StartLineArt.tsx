// Ilustração do card "Vamos começar?" da aba Início: o Frank na linha de largada.
// (Cópia em SVG/PNG na pasta da identidade visual.)

import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

const C = {
  pena: '#F4F1E8',
  crista: '#FF7A45',
  bico: '#FFC23D',
  tinta: '#15161A',
  limao: '#C6F432',
  ferro: '#8C929C',
  fundo: '#0E0F12',
};

// "LARGADA" na fonte Big Shoulders, convertido em curvas.
const LABEL =
  'M29.8 142L24.8 142L24.8 130L26.9 130L26.9 140.2L29.8 140.2L29.8 142ZM32.4 142L30.2 142L31.9 130L35.5 130L37.1 142L34.9 142L34.7 139.4L32.6 139.4L32.4 142ZM33.1 134.9L32.8 137.5L34.5 137.5L34.2 134.9L34.0 131.8L33.3 131.8L33.1 134.9ZM40.2 142L38.1 142L38.1 130L41.0 130Q42.6 130 43.3 130.6Q44.0 131.3 44.1 132.8L44.1 132.8Q44.1 133.2 44.1 133.6Q44.1 134.0 44.1 134.3Q44.1 134.7 44.1 135.1L44.1 135.1Q44.1 136.0 43.8 136.6Q43.5 137.2 42.9 137.5L42.9 137.5L44.3 142L42.1 142L40.9 137.9L40.2 137.9L40.2 142ZM40.2 131.8L40.2 136.0L41.0 136.0Q41.5 136.0 41.7 135.8Q42.0 135.6 42.0 135.2L42.0 135.2Q42.0 134.8 42.0 134.4Q42.0 133.9 42.0 133.5Q42.0 133.1 42.0 132.7L42.0 132.7Q42.0 132.3 41.7 132.1Q41.5 131.8 41.0 131.8L41.0 131.8L40.2 131.8ZM48.5 142.1L48.5 142.1Q47.4 142.1 46.7 141.9Q46.1 141.6 45.7 140.9Q45.4 140.3 45.4 139.3L45.4 139.3Q45.3 138.6 45.3 137.7Q45.3 136.9 45.3 136.0Q45.3 135.2 45.3 134.3Q45.3 133.5 45.4 132.8L45.4 132.8Q45.4 131.8 45.7 131.1Q46.1 130.5 46.7 130.2Q47.4 129.9 48.5 129.9L48.5 129.9Q50.1 129.9 50.8 130.5Q51.5 131.2 51.6 132.7L51.6 132.7Q51.7 133.1 51.7 133.6Q51.7 134.1 51.6 134.4L51.6 134.4L49.5 134.4Q49.6 133.9 49.6 133.5Q49.6 133.0 49.5 132.5L49.5 132.5Q49.5 132.0 49.3 131.8Q49.0 131.6 48.5 131.6L48.5 131.6Q48.0 131.6 47.7 131.8Q47.5 132.0 47.4 132.5L47.4 132.5Q47.4 133.3 47.4 134.2Q47.4 135.1 47.4 136.0Q47.4 136.9 47.4 137.8Q47.4 138.7 47.4 139.5L47.4 139.5Q47.5 140.0 47.7 140.2Q48.0 140.4 48.5 140.4L48.5 140.4Q49.1 140.4 49.3 140.2Q49.6 140.0 49.6 139.5L49.6 139.5Q49.7 139.3 49.7 139.1Q49.7 138.8 49.7 138.5Q49.7 138.3 49.6 138.1L49.6 138.1L48.8 138.1L48.8 136.3L51.7 136.3Q51.7 137.0 51.7 137.8Q51.7 138.6 51.7 139.3L51.7 139.3Q51.6 140.8 50.9 141.5Q50.1 142.1 48.5 142.1ZM54.6 142L52.5 142L54.1 130L57.7 130L59.3 142L57.1 142L56.9 139.4L54.9 139.4L54.6 142ZM55.3 134.9L55.1 137.5L56.7 137.5L56.4 134.9L56.2 131.8L55.5 131.8L55.3 134.9ZM63.4 142L60.3 142L60.3 130L63.4 130Q65.0 130 65.7 130.7Q66.4 131.4 66.5 132.9L66.5 132.9Q66.5 134.0 66.5 135.0Q66.5 136 66.5 137.0Q66.5 138.0 66.5 139.1L66.5 139.1Q66.4 140.6 65.7 141.3Q65.0 142 63.4 142L63.4 142ZM62.4 131.8L62.4 140.2L63.4 140.2Q63.9 140.2 64.1 139.9Q64.4 139.7 64.4 139.3L64.4 139.3Q64.4 138.5 64.4 137.6Q64.4 136.8 64.4 136.0Q64.4 135.2 64.4 134.3Q64.4 133.5 64.4 132.7L64.4 132.7Q64.4 132.3 64.1 132.1Q63.9 131.8 63.4 131.8L63.4 131.8L62.4 131.8ZM69.4 142L67.3 142L68.9 130L72.5 130L74.1 142L72.0 142L71.7 139.4L69.7 139.4L69.4 142ZM70.1 134.9L69.9 137.5L71.5 137.5L71.2 134.9L71.0 131.8L70.3 131.8L70.1 134.9Z';

// Bandeira quadriculada: 5 linhas x 4 colunas de casas de 8 px.
const FLAG = Array.from({ length: 20 }, (_, i) => ({ row: Math.floor(i / 4), col: i % 4 }));

export function StartLineArt({ width = 240 }: { width?: number }) {
  return (
    <Svg
      width={width}
      height={(width * 150) / 240}
      viewBox="0 0 240 150"
      accessibilityLabel="Frank na linha de largada">
      <Rect x={14} y={120} width={212} height={5} rx={2.5} fill={C.pena} />
      <Path d="M14 112 H226" stroke={C.limao} strokeWidth={3} strokeDasharray="10 8" strokeLinecap="round" />
      <Path d={LABEL} fill={C.limao} />
      <Rect x={165} y={26} width={4} height={94} rx={2} fill={C.ferro} />
      <Rect x={169} y={29} width={34} height={42} rx={2} fill="none" stroke={C.pena} strokeWidth={2} />
      {FLAG.map(({ row, col }) => (
        <Rect
          key={`${row}-${col}`}
          x={170 + col * 8}
          y={30 + row * 8}
          width={8}
          height={8}
          fill={(row + col) % 2 ? C.fundo : C.pena}
        />
      ))}
      <Path d="M52 38 L60 24 M68 34 L82 26 M44 52 L30 46" stroke={C.limao} strokeWidth={3} strokeLinecap="round" />
      <G transform="translate(96 80) scale(0.82) translate(-100 -72)">
        <Circle cx={86} cy={36} r={10} fill={C.crista} />
        <Circle cx={100} cy={30} r={11} fill={C.crista} />
        <Circle cx={113} cy={37} r={9} fill={C.crista} />
        <Circle cx={100} cy={72} r={34} fill={C.pena} />
        <Circle cx={88} cy={68} r={8} fill="#FFFFFF" />
        <Circle cx={89} cy={69} r={4} fill={C.tinta} />
        <Circle cx={112} cy={68} r={8} fill="#FFFFFF" />
        <Circle cx={113} cy={69} r={4} fill={C.tinta} />
        <Path
          d="M79 55 Q86 46 94 53 M106 53 Q114 46 121 55"
          fill="none"
          stroke={C.tinta}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path d="M93 80 L107 80 L100 92 Z" fill={C.bico} />
        <Ellipse cx={100} cy={97} rx={4} ry={6} fill={C.crista} />
      </G>
    </Svg>
  );
}
