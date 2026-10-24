// O jogo Frank Flap desenhado na tela. Toque para o Frank voar. Só anda enquanto "playing"
// (descanso correndo); quando o descanso acaba, congela e continua no próximo.

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { FLAP_H, FLAP_LAYOUT, FLAP_W, GROUND, flap, getFlap, holdFlap, isResuming, stepFlap } from '@/lib/frankFlap';
import { colors, fonts, outlineColor } from '@/theme';

const { FRANK_X, GAP, BAR_W } = FLAP_LAYOUT;

function clock() {
  return Date.now();
}

type Props = { workoutId: string; playing: boolean; width: number };

export function FrankFlap({ workoutId, playing, width }: Props) {
  // Só para redesenhar a cada quadro; o estado do jogo fica em lib/frankFlap.
  const [, setFrame] = useState(0);
  const game = getFlap(workoutId);

  useEffect(() => {
    if (!playing) return;
    holdFlap(workoutId);
    let raf = 0;
    let last = 0;
    const tick = (time: number) => {
      // No máximo 3 quadros de uma vez (se o celular travar um pouco, o Frank não "teleporta").
      const steps = last ? Math.min(3, (time - last) / (1000 / 60)) : 1;
      last = time;
      stepFlap(getFlap(workoutId), steps, clock());
      setFrame((f) => f + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, workoutId]);

  function onTap() {
    if (!playing) return;
    flap(workoutId, clock());
    setFrame((f) => f + 1);
  }

  const height = (width * FLAP_H) / FLAP_W;
  const tilt = Math.max(-28, Math.min(55, game.velocity * 6));
  const groundShift = -(game.distance % 24);
  // Contagem para voltar à partida pausada (3, 2, 1).
  const countdown = game.resumeAt !== null ? Math.max(1, Math.ceil((game.resumeAt - clock()) / 1000)) : null;
  const hint = game.dead
    ? 'Bateu! Toque para recomeçar'
    : isResuming(game)
      ? 'Toque para continuar'
      : 'Toque para voar';

  return (
    <View style={[styles.box, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${FLAP_W} ${FLAP_H}`} pointerEvents="none">
        <Rect x={0} y={0} width={FLAP_W} height={FLAP_H} fill={colors.cardAlt} />
        {/* Barras com anilhas */}
        {game.bars.map((bar, i) => {
          const top = bar.gapY - GAP / 2;
          const bottom = bar.gapY + GAP / 2;
          return (
            <G key={i}>
              <Rect x={bar.x + 16} y={0} width={8} height={top} fill={colors.textMuted} />
              <Rect x={bar.x + 16} y={bottom} width={8} height={FLAP_H - GROUND - bottom} fill={colors.textMuted} />
              <Rect
                x={bar.x}
                y={top - 20}
                width={BAR_W}
                height={20}
                rx={4}
                fill={colors.primary}
                stroke={outlineColor}
                strokeWidth={2.5}
              />
              <Rect
                x={bar.x}
                y={bottom}
                width={BAR_W}
                height={20}
                rx={4}
                fill={colors.primary}
                stroke={outlineColor}
                strokeWidth={2.5}
              />
            </G>
          );
        })}
        {/* Chão */}
        <Rect x={0} y={FLAP_H - GROUND} width={FLAP_W} height={GROUND} fill={colors.card} />
        {Array.from({ length: 13 }, (_, i) => (
          <Rect key={i} x={groundShift + i * 24} y={FLAP_H - GROUND} width={12} height={4} fill={colors.border} />
        ))}
        {/* Frank */}
        <G transform={`translate(${FRANK_X} ${game.y}) rotate(${tilt})`}>
          <Circle cx={-6} cy={-15} r={6} fill={colors.crista} />
          <Circle cx={1} cy={-18} r={6.5} fill={colors.crista} />
          <Circle cx={8} cy={-14} r={5.5} fill={colors.crista} />
          <Circle r={15} fill={colors.pena} />
          <Path d="M13 -3 L23 1 L13 5 Z" fill={colors.bico} />
          <Ellipse cx={13} cy={8} rx={2.8} ry={4.5} fill={colors.crista} />
          <Ellipse cx={6} cy={-3} rx={3.2} ry={3.8} fill="#15161A" />
          <Path d="M2 -9 L10 -11" stroke="#15161A" strokeWidth={2.2} strokeLinecap="round" />
        </G>
        <SvgText x={12} y={26} fill={colors.text} fontSize={20} fontFamily={fonts.display}>
          {String(game.score)}
        </SvgText>
        <SvgText x={FLAP_W - 12} y={24} fill={colors.bico} fontSize={12} fontFamily={fonts.bold} textAnchor="end">
          {`recorde ${game.best}`}
        </SvgText>
      </Svg>
      {playing && countdown !== null && (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.countdown}>{countdown}</Text>
        </View>
      )}
      {playing && countdown === null && (game.waiting || game.dead) && (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      )}
      {/* Camada invisível por cima do desenho que recebe os toques. No navegador ela escuta o toque
          direto (o botão do React Native às vezes não repassa toques dentro de uma janela sobreposta). */}
      {Platform.OS === 'web' ? (
        <View style={styles.touch} onPointerDown={onTap} role="button" aria-label="Fazer o Frank voar" />
      ) : (
        <Pressable
          style={styles.touch}
          onPressIn={onTap}
          accessibilityRole="button"
          accessibilityLabel="Fazer o Frank voar"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  touch: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  box: { borderRadius: 12, overflow: 'hidden', borderWidth: 2.5, borderColor: outlineColor },
  hint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  countdown: {
    color: colors.primary,
    fontFamily: fonts.display,
    fontSize: 72,
    textShadowColor: 'rgba(14,15,18,0.9)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  hintText: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 15,
    backgroundColor: 'rgba(14,15,18,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
