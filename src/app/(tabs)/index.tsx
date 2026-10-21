import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExerciseImage } from '@/components/ExerciseImage';
import { Button, Card, SectionTitle, StatusBadge } from '@/components/ui';
import { useProfile } from '@/data/profile';
import { useStore } from '@/data/store';
import type { Workout } from '@/data/store';
import { formatShortDate } from '@/lib/format';
import { exerciseHistory } from '@/lib/progress';
import { useUnits } from '@/lib/units';
import { colors } from '@/theme';

const WEEKDAY_LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

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

  // Progressões dos últimos 7 dias.
  const since = new Date(now.getTime() - SEVEN_DAYS).toISOString();
  const exerciseIds = [...new Set(sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))];
  const achievements = exerciseIds
    .flatMap((id) =>
      exerciseHistory(sessions, id)
        .filter((h) => h.date >= since && (h.status === 'carga' || h.status === 'micro'))
        .map((h) => ({ ...h, exerciseId: id }))
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.greeting}>
          {greeting(now.getHours())}
          {firstName ? `, ${firstName}` : ''}!
        </Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      {workouts.length === 0 ? (
        <Card style={styles.welcome}>
          <Ionicons name="barbell" size={32} color={colors.primary} />
          <Text style={styles.welcomeTitle}>Vamos começar?</Text>
          <Text style={styles.welcomeText}>
            Monte seu primeiro treino, por exemplo “Peito”, escolhendo os exercícios. Depois é só registrar as cargas
            e acompanhar sua evolução.
          </Text>
          <Button title="Criar meu primeiro treino" icon="add" onPress={() => router.push('/treino/editar')} />
        </Card>
      ) : (
        <>
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

          {achievements.length > 0 && (
            <>
              <SectionTitle>Conquistas recentes</SectionTitle>
              {achievements.map((a) => (
                <Pressable
                  key={a.sessionId + a.exerciseId}
                  onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: a.exerciseId } })}>
                  <Card style={styles.achievement}>
                    <ExerciseImage exerciseId={a.exerciseId} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.achievementName} numberOfLines={1}>
                        {getExercise(a.exerciseId)?.name ?? 'Exercício'}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {units.set(a.best)} · {formatShortDate(a.date)}
                      </Text>
                    </View>
                    <StatusBadge status={a.status} />
                  </Card>
                </Pressable>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  greeting: { color: colors.text, fontSize: 26, fontWeight: '800' },
  date: { color: colors.textMuted, fontSize: 15, marginTop: 2 },
  welcome: { alignItems: 'flex-start', gap: 10, padding: 20 },
  welcomeTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  welcomeText: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 6 },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardLabel: { color: colors.textMuted, fontSize: 13 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
  cardMeta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  weekCount: { color: colors.text, fontSize: 16, fontWeight: '700' },
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
  dayLetter: { color: colors.textFaint, fontSize: 12, fontWeight: '700' },
  achievement: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  achievementName: { color: colors.text, fontSize: 15, fontWeight: '700' },
});
