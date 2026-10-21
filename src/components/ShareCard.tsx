// Card para compartilhar a fase do Frank (formato de story: 9 × 16). É um SVG só, com os textos
// já em curvas (lib/shareGlyphs), para virar imagem igual em qualquer celular.

import Svg, { G, Path, Polygon, Rect } from 'react-native-svg';

import { FrankArt, FrankHeadArt } from '@/components/Frank';
import { burstPoints } from '@/components/RecordBurst';
import { FRANK_PHASES } from '@/lib/frank';
import type { FrankPhase } from '@/lib/frank';
import { GLYPHS } from '@/lib/shareGlyphs';

export const CARD_W = 360;
export const CARD_H = 640;

const C = {
  fundo: '#0E0F12',
  cartao: '#181A1F',
  pena: '#F4F1E8',
  limao: '#C6F432',
  bico: '#FFC23D',
  tinta: '#15161A',
  apagado: '#9AA0AB',
};

/** Largura de um texto (em curvas) no tamanho pedido. Números são montados dígito a dígito. */
function textWidth(text: string, size: number) {
  const glyph = GLYPHS[text];
  if (glyph) return (glyph.w * size) / 100;
  return [...text].reduce((sum, ch) => sum + ((GLYPHS[ch]?.w ?? 30) * size) / 100, 0);
}

/** Desenha um texto já convertido em curvas, centralizado em x, com a linha de base em y. */
function GlyphText({ text, x, y, size, fill }: { text: string; x: number; y: number; size: number; fill: string }) {
  const scale = size / 100;
  let left = x - textWidth(text, size) / 2;
  const pieces = GLYPHS[text] ? [text] : [...text];
  return (
    <>
      {pieces.map((piece, i) => {
        const glyph = GLYPHS[piece];
        const at = left;
        left += ((glyph?.w ?? 30) * size) / 100;
        return glyph ? (
          <Path key={i} d={glyph.d} fill={fill} transform={`translate(${at.toFixed(1)} ${y}) scale(${scale})`} />
        ) : null;
      })}
    </>
  );
}

type Props = {
  phase: FrankPhase;
  workoutCount: number;
  /** "evoluiu": acabou de mudar de fase. "atual": mostrando a fase que a pessoa está. */
  variant: 'evoluiu' | 'atual';
  width?: number;
};

export function ShareCard({ phase, workoutCount, variant, width = CARD_W }: Props) {
  const name = (FRANK_PHASES.find((p) => p.phase === phase)?.name ?? phase).toUpperCase();
  const headline = variant === 'evoluiu' ? 'EVOLUIU!' : 'MEU FRANK';
  // O título cabe dentro da explosão (no máximo 200 de largura).
  const headlineSize = Math.min(52, (200 * 100) / (GLYPHS[headline]?.w ?? 200));
  const nameSize = Math.min(46, (280 * 100) / (GLYPHS[name]?.w ?? 300));
  const nameWidth = textWidth(name, nameSize);
  const tagH = nameSize * 0.78 + 22;
  const countWord = workoutCount === 1 ? 'TREINO' : 'TREINOS';
  const countSize = 30;
  const numberW = textWidth(String(workoutCount), countSize);
  const wordW = textWidth(countWord, countSize);
  const countLeft = CARD_W / 2 - (numberW + 10 + wordW) / 2;

  return (
    <Svg width={width} height={(width * CARD_H) / CARD_W} viewBox={`0 0 ${CARD_W} ${CARD_H}`}>
      <Rect x={0} y={0} width={CARD_W} height={CARD_H} fill={C.fundo} />
      {/* Moldura cartoon: contorno grosso e sombra verde */}
      <Rect x={20} y={20} width={330} height={610} rx={26} fill={C.limao} />
      <Rect x={12} y={12} width={330} height={610} rx={26} fill={C.cartao} stroke={C.pena} strokeWidth={4} />

      {/* Logo */}
      <Rect x={36} y={38} width={50} height={50} rx={13} fill={C.limao} />
      <G transform="translate(36 38) scale(0.5)">
        <FrankHeadArt />
      </G>
      <G transform="translate(96 0)">
        <GlyphText text="GAINS" x={textWidth('GAINS', 27) / 2} y={62} size={27} fill={C.pena} />
        <GlyphText text="CLUB" x={textWidth('CLUB', 27) / 2} y={86} size={27} fill={C.limao} />
      </G>

      {/* Título na explosão de gibi */}
      <G transform="rotate(-4 177 150)">
        <Polygon
          points={burstPoints(296, 104, 16, 14)}
          fill={C.pena}
          stroke={C.pena}
          strokeWidth={12}
          strokeLinejoin="round"
          transform="translate(29 98)"
        />
        <Polygon
          points={burstPoints(296, 104, 16, 14)}
          fill={C.bico}
          stroke={C.tinta}
          strokeWidth={4}
          strokeLinejoin="round"
          transform="translate(29 98)"
        />
        <GlyphText text={headline} x={177} y={150 + headlineSize * 0.38} size={headlineSize} fill={C.tinta} />
      </G>

      {/* Frank */}
      <FrankArt phase={phase} x={(CARD_W - 200 * 1.15) / 2 - 3} y={208} scale={1.15} />

      {/* Nome da fase numa etiqueta verde */}
      <G transform={`rotate(-2 177 ${530 - tagH / 2 + 10})`}>
        <Rect
          x={177 - nameWidth / 2 - 16}
          y={530 - nameSize * 0.78 - 11}
          width={nameWidth + 32}
          height={tagH}
          rx={8}
          fill={C.limao}
          stroke={C.pena}
          strokeWidth={3.5}
        />
        <GlyphText text={name} x={177} y={530} size={nameSize} fill={C.tinta} />
      </G>

      {/* Treinos */}
      <G transform={`translate(${countLeft - CARD_W / 2} 0)`}>
        <GlyphText text={String(workoutCount)} x={CARD_W / 2 + numberW / 2} y={584} size={countSize} fill={C.limao} />
        <GlyphText text={countWord} x={CARD_W / 2 + numberW + 10 + wordW / 2} y={584} size={countSize} fill={C.pena} />
      </G>

      <GlyphText text="URL" x={177} y={608} size={11} fill={C.apagado} />
    </Svg>
  );
}
