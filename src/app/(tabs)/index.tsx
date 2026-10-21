import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExerciseImage } from '@/components/ExerciseImage';
import { Frank } from '@/components/Frank';
import { StartLineArt } from '@/components/StartLineArt';
import { Button, Card, PRBadge, SectionTitle, StatusBadge } from '@/components/ui';
import { isTimedExercise } from '@/data/exercises';
import { useProfile } from '@/data/profile';
import { useStore } from '@/data/store';
import type { Workout } from '@/data/store';
import { frankProgress } from '@/lib/frank';
import { formatShortDate } from '@/lib/format';
import { exerciseHistory } from '@/lib/progress';
import { useUnits } from '@/lib/units';
import { colors, fonts, hardShadow } from '@/theme';

const WEEKDAY_LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// Cada toque no link manda um número novo, para a aba Treinos trocar para Progresso mesmo se já estiver aberta.
let progressLinkCount = 0;
function openProgress() {
  progressLinkCount += 1;
  router.push({ pathname: '/treinos', params: { aba: 'progresso', v: String(progressLinkCount) } });
}

function greeting(hour: number) {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Segunda-feira 00:00 da semana atual. */
function startOfWeek(now: Date) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export default function HomeScreen() {
  const { workouts, sessions, drafts, getExercise } = useStore();
  const { profile } = useProfile();
  const units = useUnits();
  const [now] = useState(() => new Date());

  const firstName = profile?.name?.split(' ')[0];
  const today = `${WEEKDAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;

  // Fase do Frank, pelo total de treinos registrados.
  const frank = frankProgress(sessions.length);

  // Treino em andamento (rascunho salvo).
  const inProgress = workouts.find((w) => drafts[w.id]);

  // Sugestão: o treino que está há mais tempo sem ser feito (nunca feito vem primeiro).
  const lastDone = (w: Workout) =>
    sessions
      .filter((s) => s.workoutId === w.id)
      .map((s) => s.date)
      .sort()
      .at(-1);
  const suggestion = [...workouts]
    .filter((w) => w.id !== inProgress?.id)
    .sort((a, b) => (lastDone(a) ?? '').localeCompare(lastDone(b) ?? ''))[0];

  // Dias treinados nesta semana (segunda a domingo).
  const weekStart = startOfWeek(now);
  const trainedDays = new Set(
    sessions
      .map((s) => new Date(s.date))
      .filter((d) => d >= weekStart)
      .map((d) => (d.getDay() + 6) % 7)
  );
  const weekCount = sessions.filter((s) => new Date(s.date) >= weekStart).length;
  const todayIndex = (now.getDay() + 6) % 7;

  // Conquistas dos últimos 7 dias. A primeira é o destaque: recorde, depois carga, depois micro.
  const since = new Date(now.getTime() - SEVEN_DAYS).toISOString();
  const exerciseIds = [...new Set(sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))];
  const rank = (a: { isPR: boolean; status: string }) => (a.isPR ? 2 : a.status === 'carga' ? 1 : 0);
  const achievements = exerciseIds
    .flatMap((id) =>
      exerciseHistory(sessions, id)
        .filter((h) => h.date >= since && (h.status === 'carga' || h.status === 'micro'))
        .map((h) => ({ ...h, exerciseId: id }))
    )
    .sort((a, b) => rank(b) - rank(a) || b.date.localeCompare(a.date));
  const highlight = achievements[0];
  const others = achievements.length - 1;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.greeting}>
          {greeting(now.getHours())}
          {firstName ? ', ' : ''}
          {firstName && <Text style={{ color: colors.primary }}>{firstName}</Text>}!
        </Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      {workouts.length === 0 ? (
        <Card style={styles.welcome}>
          <StartLineArt width={220} />
          <Text style={styles.welcomeTitle}>Vamos começar?</Text>
          <Text style={styles.welcomeText}>
            Monte seu primeiro treino, por exemplo “Peito”, escolhendo os exercícios. Depois é só registrar as cargas
            e acompanhar sua evolução.
          </Text>
          <Button title="Criar meu primeiro treino" icon="add" onPress={() => router.push('/treino/editar')} />
        </Card>
      ) : (
        <>
          <Pressable
            onPress={() => router.push('/frank')}
            accessibilityRole="button"
            accessibilityLabel="Ver as evoluções do Frank">
            <Card style={styles.frankCard}>
              <Frank phase={frank.current.phase} size={84} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.cardLabel}>Seu Frank</Text>
                <Text style={styles.cardTitle}>{frank.current.name}</Text>
                <View style={styles.frankBar}>
                  <View style={[styles.frankFill, { width: `${Math.round(frank.progress * 100)}%` }]} />
                </View>
                <Text style={styles.cardMeta}>
                  {frank.next
                    ? `${frank.remaining} treino${frank.remaining === 1 ? '' : 's'} para virar ${frank.next.name}`
                    : `Fase máxima · ${sessions.length} treinos registrados`}
                </Text>
                <View style={styles.frankLink}>
                  <Text style={styles.frankLinkText}>Ver evoluções</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </Card>
          </Pressable>

          {inProgress && (
            <Card style={[styles.highlight, { borderColor: colors.primary }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>Treino em andamento</Text>
                <Text style={styles.cardTitle}>{inProgress.name}</Text>
              </View>
              <Button
                title="Continuar"
                icon="time-outline"
                small
                onPress={() => router.push({ pathname: '/registrar/[id]', params: { id: inProgress.id } })}
              />
            </Card>
          )}

          {suggestion && (
            <Card style={styles.highlight}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>Próximo treino sugerido</Text>
                <Text style={styles.cardTitle}>{suggestion.name}</Text>
                <Text style={styles.cardMeta}>
                  {lastDone(suggestion) ? `Último em ${formatShortDate(lastDone(suggestion)!)}` : 'Ainda não feito'}
                </Text>
              </View>
              <Button
                title="Registrar"
                icon="play"
                small
                onPress={() => router.push({ pathname: '/registrar/[id]', params: { id: suggestion.id } })}
              />
            </Card>
          )}

          <SectionTitle>Sua semana</SectionTitle>
          <Card style={{ gap: 14 }}>
            <Text style={styles.weekCount}>
              <Text style={{ color: colors.primary }}>{weekCount}</Text> treino{weekCount === 1 ? '' : 's'} esta
              semana
            </Text>
            <View style={styles.days}>
              {WEEKDAY_LETTERS.map((letter, i) => {
                const trained = trainedDays.has(i);
                return (
                  <View key={i} style={styles.day}>
                    <View style={[styles.dayDot, trained && styles.dayDotDone, i === todayIndex && styles.dayDotToday]}>
                      {trained && <Ionicons name="checkmark" size={14} color={colors.primaryText} />}
                    </View>
                    <Text style={[styles.dayLetter, i === todayIndex && { color: colors.text }]}>{letter}</Text>
                  </View>
                );
              })}
            </View>
          </Card>

          {highlight && (
            <>
              <SectionTitle>Destaque da semana</SectionTitle>
              <Pressable
                onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: highlight.exerciseId } })}>
                <Card style={[styles.weekHighlight, highlight.isPR && styles.weekHighlightRecord]}>
                  <ExerciseImage exerciseId={highlight.exerciseId} size={56} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.weekHighlightTop}>
                      <Text style={styles.cardLabel}>Melhor da semana</Text>
                      {highlight.isPR ? (
                        <PRBadge />
                      ) : (
                        <StatusBadge status={highlight.status} timed={isTimedExercise(highlight.exerciseId)} />
                      )}
                    </View>
                    <Text style={styles.highlightName} numberOfLines={2}>
                      {getExercise(highlight.exerciseId)?.name ?? 'Exercício'}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {units.set(highlight.best)} · {formatShortDate(highlight.date)}
                    </Text>
                  </View>
                </Card>
              </Pressable>
              {others > 0 && (
                <Pressable onPress={openProgress} style={styles.moreLink} hitSlop={8}>
                  <Text style={styles.moreText}>
                    +{others} conquista{others === 1 ? '' : 's'} na semana ›
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  greeting: { color: colors.text, fontSize: 40, lineHeight: 41, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  date: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, marginTop: 2 },
  welcome: { alignItems: 'flex-start', gap: 10, padding: 20 },
  welcomeTitle: { color: colors.text, fontSize: 25, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  welcomeText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginBottom: 6 },
  frankCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  frankLink: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 6 },
  frankLinkText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13 },
  frankBar: { height: 6, borderRadius: 3, backgroundColor: colors.cardAlt, overflow: 'hidden', marginTop: 4 },
  frankFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardLabel: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14 },
  cardTitle: { color: colors.text, fontSize: 23, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },
  cardMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  weekCount: { color: colors.text, fontSize: 16, fontFamily: fonts.bold },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 6 },
  dayDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotDone: { backgroundColor: colors.primary },
  dayDotToday: { borderWidth: 2, borderColor: colors.textMuted },
  dayLetter: { color: colors.textFaint, fontSize: 12, fontFamily: fonts.mono },
  weekHighlight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weekHighlightTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  weekHighlightRecord: { borderColor: colors.bico, ...hardShadow(colors.bico) },
  highlightName: { color: colors.text, fontSize: 22, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  moreLink: { alignSelf: 'flex-end', marginTop: -2 },
  moreText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 14 },
});
