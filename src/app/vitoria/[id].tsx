// "Resumo de vitória": aparece logo depois de salvar um treino. Tudo entra em sequência, como uma
// revelação: o Frank surge com uma explosão de faíscas, "TREINO CONCLUÍDO!" cai como um carimbo,
// os números sobem um a um (e contam do zero), o card de recorde entra com um tremidinho, a barra de
// XP do Frank enche e, por último, os botões. Daqui vai para o detalhe do treino ou volta para o app.

import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EvolutionModal } from '@/components/EvolutionModal';
import { Frank } from '@/components/Frank';
import { ShareSheet } from '@/components/ShareSheet';
import { Button, EmptyState } from '@/components/ui';
import { useStore } from '@/data/store';
import type { Session, SetEntry } from '@/data/store';
import { formatDateLong } from '@/lib/format';
import { frankProgress, frankXp } from '@/lib/frank';
import { bestSet, compareSets, isPersonalRecord, previousSets } from '@/lib/progress';
import { DAYS_PER_WEEK, computeStreak } from '@/lib/streak';
import { useUnits } from '@/lib/units';
import { colors, fonts, hardShadow, outlineColor } from '@/theme';

const NATIVE = Platform.OS !== 'web';

// Quando cada parte entra (ms depois de abrir a tela).
const AT = {
  frank: 0,
  burst: 150,
  title: 450,
  stats: 800, // + 110 por card
  highlight: 1300,
  progress: 1550,
  bar: 1750,
  buttons: 1900,
};

// Faíscas da explosão atrás do Frank: ângulo de cada uma e a cor (fixos, sem sorteio).
const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  angle: (i / 14) * Math.PI * 2,
  distance: 70 + (i % 3) * 18,
  color: [colors.primary, colors.bico, colors.crista, colors.pena][i % 4],
  size: 7 + (i % 2) * 4,
}));

function clock() {
  return new Date();
}

/** Peso total levantado: carga × repetições de todas as séries (exercícios de tempo não entram). */
function totalVolume(session: Session) {
  return session.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => (set.seconds !== undefined ? s : s + set.weight * set.reps), 0),
    0
  );
}

/** Um valor de 0 a 1 que anima depois de "delay" (ms). */
function useEntrance(delay: number, kind: 'spring' | 'timing' = 'spring', duration = 500) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation =
      kind === 'spring'
        ? Animated.spring(value, { toValue: 1, delay, friction: 6, tension: 80, useNativeDriver: NATIVE })
        : Animated.timing(value, {
            toValue: 1,
            delay,
            duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: NATIVE,
          });
    animation.start();
    return () => animation.stop();
  }, [value, delay, kind, duration]);
  return value;
}

/** Entra subindo e aparecendo. */
function Rise({ delay, children, style }: { delay: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useEntrance(delay);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

/** "Carimbo": entra grande e bate no lugar, levemente torto. */
function Stamp({ delay, children }: { delay: number; children: ReactNode }) {
  const t = useEntrance(delay, 'timing', 380);
  return (
    <Animated.View
      style={{
        opacity: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
        transform: [
          { scale: t.interpolate({ inputRange: [0, 0.75, 0.88, 1], outputRange: [2.4, 0.94, 1.04, 1] }) },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['-9deg', '-2deg'] }) },
        ],
      }}>
      {children}
    </Animated.View>
  );
}

/** Entra crescendo e dá um tremidinho no fim (o card de recorde). */
function Shake({ delay, children }: { delay: number; children: ReactNode }) {
  const t = useEntrance(delay, 'timing', 650);
  return (
    <Animated.View
      style={{
        opacity: t.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] }),
        transform: [
          { scale: t.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.7, 1.03, 1] }) },
          {
            rotate: t.interpolate({
              inputRange: [0, 0.45, 0.6, 0.75, 0.9, 1],
              outputRange: ['0deg', '0deg', '-3deg', '3deg', '-1.5deg', '0deg'],
            }),
          },
        ],
      }}>
      {children}
    </Animated.View>
  );
}

/** O Frank surgindo, com faíscas saindo de trás dele. */
function FrankBurst({ phase }: { phase: Parameters<typeof Frank>[0]['phase'] }) {
  const pop = useEntrance(AT.frank);
  const burst = useEntrance(AT.burst, 'timing', 900);
  return (
    <View style={styles.frankBox}>
      {SPARKS.map((spark, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: spark.size,
            height: spark.size,
            borderRadius: spark.size / 2,
            backgroundColor: spark.color,
            opacity: burst.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              {
                translateX: burst.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.cos(spark.angle) * spark.distance],
                }),
              },
              {
                translateY: burst.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.sin(spark.angle) * spark.distance],
                }),
              },
              { scale: burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1.2, 0.5] }) },
            ],
          }}
        />
      ))}
      <Animated.View
        style={{
          opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
        }}>
        <Frank phase={phase} size={130} />
      </Animated.View>
    </View>
  );
}

/** Número que conta do zero até o valor (em ~0,9 s), começando depois de "delay". */
function useCountUp(target: number, delay: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const tick = (time: number) => {
      if (!start) start = time + delay;
      const t = Math.max(0, Math.min(1, (time - start) / 900));
      // Começa rápido e desacelera no fim.
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay]);
  return value;
}

/** Barra que enche de "from" até "to" (0 a 1). */
function FillBar({ from, to, delay }: { from: number; to: number; delay: number }) {
  const [width] = useState(() => new Animated.Value(from));
  useEffect(() => {
    const animation = Animated.timing(width, {
      toValue: to,
      delay,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      // Largura não roda no "native driver".
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [width, to, delay]);
  return (
    <View style={styles.track}>
      <Animated.View
        style={[styles.fill, { width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
      />
    </View>
  );
}

function formatThousands(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, '.');
}

function Stat({ value, label, gold }: { value: string; label: string; gold?: boolean }) {
  return (
    <View style={[styles.stat, gold && { borderColor: colors.bico }]}>
      <Text style={[styles.statValue, gold && { color: colors.bico }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function VictoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, getExercise } = useStore();
  const units = useUnits();
  const [evolutionSeen, setEvolutionSeen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [now] = useState(clock);
  const session = sessions.find((s) => s.id === id);

  const volumeKg = session ? totalVolume(session) : 0;
  const volumeShown = useCountUp(units.unit === 'kg' ? volumeKg : volumeKg * 2.20462, AT.stats);
  const setsCount = session ? session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) : 0;
  const setsShown = useCountUp(setsCount, AT.stats + 110);

  if (!session) {
    return <EmptyState icon="alert-circle-outline" title="Treino não encontrado" text="Ele pode ter sido excluído." />;
  }

  // Frank: XP com e sem este treino (só o primeiro treino do dia dá XP) e se mudou de fase.
  const xpNow = frankXp(sessions);
  const xpBefore = frankXp(sessions.filter((s) => s.id !== session.id));
  const progress = frankProgress(xpNow);
  const before = frankProgress(xpBefore);
  const newPhase = progress.current.phase !== before.current.phase ? progress.current : null;
  const gainedXp = xpNow - xpBefore;
  // A barra enche a partir de onde estava (se mudou de fase, a barra nova começa do zero).
  const barFrom = newPhase ? 0 : before.progress;

  // Recordes e destaques (carga ou micro subiu).
  const results = session.exercises.map((ex) => ({
    exerciseId: ex.exerciseId,
    name: getExercise(ex.exerciseId)?.name ?? 'Exercício',
    best: bestSet(ex.sets) as SetEntry | undefined,
    isPR: isPersonalRecord(sessions, ex.exerciseId, ex.sets, session.date),
    status: compareSets(previousSets(sessions, ex.exerciseId, session.date), ex.sets),
  }));
  const records = results.filter((r) => r.isPR && r.best);
  const ups = results.filter((r) => !r.isPR && (r.status === 'carga' || r.status === 'micro') && r.best);
  // Sem recorde nem subida: a melhor série do dia (a mais pesada), para o card nunca ficar vazio.
  const heaviest = [...results]
    .filter((r) => r.best && r.best.seconds === undefined)
    .sort((a, b) => (b.best?.weight ?? 0) - (a.best?.weight ?? 0))[0];

  const streak = computeStreak(sessions, now);
  const weekDone = Math.min(streak.thisWeekCount, DAYS_PER_WEEK);
  const weekLeft = DAYS_PER_WEEK - weekDone;
  const minutes = session.durationMin;

  const highlight =
    records.length > 0 ? (
      <View style={[styles.card, { borderColor: colors.bico, ...hardShadow(colors.bico) }]}>
        <Text style={[styles.cardTitle, { color: colors.bico }]}>🏆 Novos recordes</Text>
        {records.map((r) => (
          <View key={r.exerciseId} style={styles.row}>
            <Text style={styles.rowName} numberOfLines={1}>
              {r.name}
            </Text>
            <Text style={styles.rowValue}>{units.set(r.best!)}</Text>
          </View>
        ))}
      </View>
    ) : ups.length > 0 ? (
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.primary }]}>⬆ Você evoluiu</Text>
        {ups.map((r) => (
          <View key={r.exerciseId} style={styles.row}>
            <Text style={styles.rowName} numberOfLines={1}>
              {r.name}
            </Text>
            <Text style={styles.rowValue}>{units.set(r.best!)}</Text>
          </View>
        ))}
      </View>
    ) : heaviest ? (
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.primary }]}>⭐ Melhor série do dia</Text>
        <View style={styles.row}>
          <Text style={styles.rowName} numberOfLines={1}>
            {heaviest.name}
          </Text>
          <Text style={styles.rowValue}>{units.set(heaviest.best!)}</Text>
        </View>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <FrankBurst phase={progress.current.phase} />

        <Stamp delay={AT.title}>
          <Text style={styles.title}>
            Treino{'\n'}
            <Text style={{ color: colors.primary }}>concluído!</Text>
          </Text>
        </Stamp>
        <Rise delay={AT.title + 150}>
          <Text style={styles.subtitle}>
            {session.workoutName} · {formatDateLong(session.date)}
          </Text>
        </Rise>

        <View style={styles.grid}>
          <Rise delay={AT.stats} style={styles.statWrap}>
            <Stat value={`${formatThousands(volumeShown)} ${units.unit}`} label="levantados" />
          </Rise>
          <Rise delay={AT.stats + 110} style={styles.statWrap}>
            <Stat value={String(setsShown)} label={setsCount === 1 ? 'série' : 'séries'} />
          </Rise>
          <Rise delay={AT.stats + 220} style={styles.statWrap}>
            {minutes ? (
              <Stat value={`${minutes} min`} label="de treino" />
            ) : (
              <Stat value={String(session.exercises.length)} label="exercícios" />
            )}
          </Rise>
          <Rise delay={AT.stats + 330} style={styles.statWrap}>
            <Stat value={String(records.length)} label={records.length === 1 ? 'recorde' : 'recordes'} gold />
          </Rise>
        </View>

        {highlight &&
          (records.length > 0 ? (
            <Shake delay={AT.highlight}>{highlight}</Shake>
          ) : (
            <Rise delay={AT.highlight}>{highlight}</Rise>
          ))}

        <Rise delay={AT.progress} style={styles.progressBlock}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {weekLeft <= 0
                ? '🔥 Semana garantida!'
                : `🔥 Falta${weekLeft === 1 ? '' : 'm'} ${weekLeft} treino${weekLeft === 1 ? '' : 's'} na semana`}
            </Text>
            <Text style={styles.progressMeta}>
              {weekDone} de {DAYS_PER_WEEK}
            </Text>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {gainedXp > 0 ? `🐣 +${gainedXp} XP para o Frank` : '🐣 O XP de hoje já estava contado'}
            </Text>
            <Text style={styles.progressMeta}>
              {progress.next ? `falta${progress.remaining === 1 ? '' : 'm'} ${progress.remaining}` : 'fase máxima'}
            </Text>
          </View>
          <FillBar from={barFrom} to={progress.progress} delay={AT.bar} />
          {progress.next && <Text style={styles.progressMeta}>para virar {progress.next.name}</Text>}
        </Rise>

        <Rise delay={AT.buttons} style={{ gap: 10 }}>
          <Button title="Compartilhar meu Frank" icon="share-social-outline" onPress={() => setSharing(true)} />
          <View style={styles.actions}>
            <Button
              title="Ver detalhes"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => router.replace({ pathname: '/sessao/[id]', params: { id: session.id } })}
            />
            <Button
              title="Concluir"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
          </View>
        </Rise>
      </ScrollView>

      {newPhase && (
        <EvolutionModal
          visible={!evolutionSeen}
          phase={newPhase.phase}
          xp={xpNow}
          onClose={() => setEvolutionSeen(true)}
        />
      )}
      <ShareSheet
        visible={sharing}
        onClose={() => setSharing(false)}
        phase={progress.current.phase}
        xp={xpNow}
        variant="atual"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 14, paddingBottom: 32 },
  frankBox: { alignItems: 'center', justifyContent: 'center', height: 160, marginTop: 4 },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 42,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statWrap: { flexBasis: '47%', flexGrow: 1 },
  stat: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  statValue: { color: colors.text, fontFamily: fonts.display, fontSize: 28, letterSpacing: 0.4 },
  statLabel: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 },
  card: {
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: outlineColor,
    backgroundColor: colors.card,
    ...hardShadow(outlineColor),
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowName: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  rowValue: { color: colors.text, fontFamily: fonts.mono, fontSize: 14 },
  progressBlock: { gap: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  progressText: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  progressMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  actions: { flexDirection: 'row', gap: 10 },
});
