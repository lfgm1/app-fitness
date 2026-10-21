// Ilustração da tela vazia do Progresso: o Frank espiando uma prancheta com o gráfico
// que ainda vai ser desenhado. (Cópia em SVG/PNG na pasta da identidade visual.)

import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

const C = {
  pena: '#F4F1E8',
  sombra: '#DDD7C6',
  crista: '#FF7A45',
  bico: '#FFC23D',
  tinta: '#15161A',
  ferro: '#8C929C',
  limao: '#C6F432',
  linha: '#9AA0AB',
  cartao: '#181A1F',
  borda: '#2A2D35',
};

// "?" na fonte Big Shoulders, convertido em curvas.
const QUESTION_MARK =
  'M215.2 61.1L212.6 61.1L212.5 60.2Q212.5 59.3 212.6 58.6Q212.7 58.0 213.1 57.4Q213.5 56.8 214.4 56.2L214.9 56.0Q215.1 55.8 215.2 55.5Q215.4 55.2 215.4 54.9Q215.4 54.5 215.4 54.2L215.4 52.0Q215.4 51.5 215.1 51.2Q214.7 50.9 214.0 50.9Q213.3 50.9 212.9 51.2Q212.5 51.5 212.5 52.0Q212.5 52.7 212.5 53.4Q212.5 54.1 212.5 54.6L209.2 54.6Q209.1 54.2 209.1 53.9Q209.1 53.5 209.1 53.3Q209.1 53.0 209.1 52.6Q209.3 50.2 210.4 49.2Q211.5 48.1 213.9 48.1Q216.6 48.1 217.7 49.2Q218.9 50.2 218.9 52.6Q218.9 52.8 218.9 53.1Q218.9 53.3 218.9 53.6Q218.9 53.9 218.9 54.2Q218.9 55.4 218.6 56.2Q218.4 56.9 218.0 57.3Q217.7 57.8 217.3 57.9Q216.9 58.1 216.6 58.3L216.0 58.6Q215.5 58.9 215.4 59.3Q215.3 59.7 215.3 60.2L215.2 61.1ZM215.9 66L211.9 66L211.9 63.1L215.9 63.1L215.9 66Z';

export function ProgressEmptyArt({ width = 220 }: { width?: number }) {
  return (
    <Svg
      width={width}
      height={(width * 200) / 240}
      viewBox="0 0 240 200"
      accessibilityLabel="Frank espiando uma prancheta com um gráfico vazio">
      {/* Prancheta */}
      <Rect x={50} y={30} width={120} height={152} rx={12} fill={C.borda} />
      <Rect x={60} y={48} width={100} height={124} rx={5} fill={C.pena} />
      <Rect x={88} y={22} width={44} height={16} rx={5} fill={C.ferro} />
      {/* Gráfico ainda vazio, com a linha tracejada do que vem pela frente */}
      <Path d="M74 152 H148 M74 152 V66" stroke={C.linha} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path
        d="M80 142 L100 128 L118 134 L142 92"
        stroke={C.tinta}
        strokeWidth={3}
        strokeDasharray="6 6"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={80} cy={142} r={4} fill={C.limao} stroke={C.tinta} strokeWidth={2} />
      {/* Frank espiando */}
      <G transform="translate(186 118) scale(0.62) translate(-100 -72)">
        <Circle cx={86} cy={36} r={10} fill={C.crista} />
        <Circle cx={100} cy={30} r={11} fill={C.crista} />
        <Circle cx={113} cy={37} r={9} fill={C.crista} />
        <Circle cx={100} cy={72} r={34} fill={C.pena} />
        <Circle cx={88} cy={68} r={8} fill="#FFFFFF" />
        <Circle cx={86} cy={69} r={4} fill={C.tinta} />
        <Circle cx={112} cy={68} r={8} fill="#FFFFFF" />
        <Circle cx={110} cy={69} r={4} fill={C.tinta} />
        <Path d="M80 58 L94 56 M120 54 L106 58" stroke={C.tinta} strokeWidth={3} strokeLinecap="round" />
        <Path d="M93 80 L107 80 L100 92 Z" fill={C.bico} />
        <Ellipse cx={100} cy={97} rx={4} ry={6} fill={C.crista} />
      </G>
      {/* Asa segurando o lápis */}
      <Ellipse cx={162} cy={146} rx={10} ry={13} fill={C.sombra} />
      <Path d="M150 158 L170 126" stroke={C.bico} strokeWidth={6} strokeLinecap="round" />
      <Path d="M150 158 L147 165 L154 161 Z" fill={C.tinta} />
      {/* Balão de dúvida */}
      <Circle cx={214} cy={58} r={15} fill={C.cartao} stroke={C.borda} strokeWidth={2} />
      <Path d={QUESTION_MARK} fill={C.limao} />
    </Svg>
  );
}
