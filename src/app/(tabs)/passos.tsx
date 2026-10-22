// Aba Passos: o círculo enche conforme os passos do dia chegam na meta do perfil (passando da meta,
// começa uma segunda volta mais escura), e embaixo a semana com os dias em que a meta foi batida.
// Os passos vêm do Apple Saúde ou do Health Connect, só no app baixável.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { StepGoalSheet } from '@/components/StepGoalSheet';
import { StepsRanking } from '@/components/StepsRanking';
import { Button, Card, Segmented } from '@/components/ui';
import { useProfile } from '@/data/profile';
import { healthAppName, installHealthApp, openHealthSettings } from '@/lib/steps';
import type { DaySteps } from '@/lib/steps';
import { DEFAULT_STEP_GOAL, formatSteps, useSteps } from '@/lib/useSteps';
import { colors, fonts, hardShadow, outlineColor } from '@/theme';

const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
// Verde mais escuro da segunda volta (passos além da meta).
const EXTRA_LAP = '#7FA81A';

const RING = 220;
const STROKE = 20;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Círculo de progresso: 0 a 1 é a primeira volta; acima de 1, a segunda volta por cima. */
function Ring({ progress, children }: { progress: number; children: React.ReactNode }) {
  const first = Math.min(1, progress);
  const extra = Math.min(1, Math.max(0, progress - 1));
  const arc = (p: number) => `${p * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING} height={RING} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Circle cx={RING / 2} cy={RING / 2} r={RADIUS} stroke={colors.border} strokeWidth={STROKE} fill="none" />
        {first > 0 && (
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={RADIUS}
            stroke={colors.primary}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap={first < 1 ? 'round' : 'butt'}
            strokeDasharray={arc(first)}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        )}
        {extra > 0 && (
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={RADIUS}
            stroke={EXTRA_LAP}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={arc(extra)}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

/** Dias seguidos com a meta batida, contando de hoje para trás (hoje só conta se já bateu). */
function goalStreak(week: DaySteps[], goal: number) {
  let count = 0;
  for (let i = week.length - 1; i >= 0; i--) {
    if (week[i].steps >= goal) count++;
    else if (i !== week.length - 1) break;
  }
  return count;
}

export default function StepsScreen() {
  const { profile, saveProfile } = useProfile();
  const [editing, setEditing] = useState(false);
  // Duas páginas, como Treinos/Progresso: o dia de hoje e o ranking entre amigos.
  const [tab, setTab] = useState<'hoje' | 'ranking'>('hoje');
  const goal = profile?.dailyStepGoal ?? DEFAULT_STEP_GOAL;
  const { state, week, today, denied, connect } = useSteps();

  if (state === 'loading') return <View style={styles.screen} />;

  let intro: ReactNode = null;
  if (state !== 'connected') {
    // Sem suporte (site, Expo Go), precisa instalar o Health Connect ou ainda não autorizou.
    const texts = {
      unsupported: {
        title: 'Passos no celular',
        text: 'A contagem de passos usa o app de saúde do celular, por isso funciona só no app baixado.',
      },
      install: {
        title: 'Instale o Health Connect',
        text: 'No Android, os passos vêm do Health Connect, o app de saúde do Google. Instale ou atualize pela Play Store e volte aqui.',
      },
      ask: {
        title: 'Conecte seus passos',
        text: `Autorize o Gains Club a ler seus passos no ${healthAppName} para ver o dia e a meta de ${formatSteps(goal)}. Só lemos os passos, e eles só saem do celular se você participar do ranking.`,
      },
    }[state];
    intro = (
      <Card style={styles.intro}>
        <Ionicons name="footsteps" size={44} color={state === 'unsupported' ? colors.textMuted : colors.primary} />
        <Text style={styles.introTitle}>{texts.title}</Text>
        <Text style={styles.introText}>{texts.text}</Text>
        {state === 'install' && <Button title="Abrir Play Store" icon="download-outline" onPress={installHealthApp} />}
        {state === 'ask' && <Button title={`Conectar ao ${healthAppName}`} onPress={connect} />}
        {state === 'ask' && denied && (
          <>
            <Text style={styles.error}>
              A permissão não foi dada. Libere a leitura de passos para o Gains Club no {healthAppName}.
            </Text>
            <Button title={`Abrir ${healthAppName}`} variant="secondary" small onPress={openHealthSettings} />
          </>
        )}
      </Card>
    );
  }

  // Só calculados quando os passos estão conectados.
  const progress = today / goal;
  const done = progress >= 1;
  const left = goal - today;
  const max = Math.max(goal, ...(week ?? []).map((d) => d.steps));
  const average = week ? Math.round(week.reduce((sum, d) => sum + d.steps, 0) / week.length) : 0;
  const streak = week ? goalStreak(week, goal) : 0;

  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        <Segmented
          options={[
            { key: 'hoje', label: 'Hoje' },
            { key: 'ranking', label: 'Ranking' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      {tab === 'ranking' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <StepsRanking week={week} access={state} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {intro}

          {state === 'connected' && (
            <>
              <Card style={[styles.ringCard, done && { borderColor: colors.primary }]}>
                <Ring progress={progress}>
                  <Text style={styles.count}>{formatSteps(today)}</Text>
                  <Text style={styles.goal}>de {formatSteps(goal)} passos</Text>
                  <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
                </Ring>
                {done ? (
                  <View style={styles.stamp}>
                    <Text style={styles.stampText}>Meta batida!</Text>
                  </View>
                ) : (
                  <Text style={styles.left}>
                    Falta{left === 1 ? '' : 'm'} <Text style={{ color: colors.text }}>{formatSteps(left)}</Text> passo
                    {left === 1 ? '' : 's'} pra meta
                  </Text>
                )}
              </Card>

              {week ? (
                <Card style={{ gap: 10 }}>
                  <View style={styles.weekTop}>
                    <Text style={styles.label}>Esta semana</Text>
                    {streak >= 2 ? (
                      <Text style={[styles.label, { color: colors.primary }]}>Metas seguidas: {streak} dias</Text>
                    ) : (
                      <Text style={styles.label}>Média {formatSteps(average)}</Text>
                    )}
                  </View>
                  <View style={styles.bars}>
                    {week.map((d, i) => {
                      const [y, m, day] = d.date.split('-').map(Number);
                      const letter = WEEKDAY_LETTERS[new Date(y, m - 1, day).getDay()];
                      const isToday = i === week.length - 1;
                      return (
                        <View key={d.date} style={styles.barCol}>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.bar,
                                { height: `${Math.max(4, (d.steps / max) * 100)}%` },
                                d.steps >= goal && { backgroundColor: colors.primary },
                                isToday && styles.barToday,
                              ]}
                            />
                          </View>
                          <Text style={[styles.letter, isToday && { color: colors.text }]}>{letter}</Text>
                        </View>
                      );
                    })}
                  </View>
                </Card>
              ) : (
                <Text style={styles.error}>Não deu para ler os passos agora.</Text>
              )}

              {week && week.every((d) => d.steps === 0) && (
                // No iPhone, quem nega a permissão só vê tudo zerado (o Apple Saúde não avisa o app).
                <Pressable onPress={openHealthSettings} style={styles.hint} accessibilityRole="button">
                  <Text style={styles.hintText}>
                    Tudo zerado? Confira se o Gains Club pode ler passos no {healthAppName}.{' '}
                    <Text style={{ color: colors.primary }}>Abrir {healthAppName}</Text>
                  </Text>
                </Pressable>
              )}
            </>
          )}

          {profile && (
            <>
              <Button
                title="Editar meta"
                icon="create-outline"
                variant="secondary"
                small
                onPress={() => setEditing(true)}
              />
              <StepGoalSheet
                visible={editing}
                goal={goal}
                onClose={() => setEditing(false)}
                onSave={(dailyStepGoal) => saveProfile({ ...profile, dailyStepGoal })}
              />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabs: { paddingHorizontal: 16, paddingTop: 8 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  intro: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  introTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  introText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  hint: { paddingHorizontal: 8 },
  hintText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
  ringCard: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  count: { color: colors.text, fontFamily: fonts.display, fontSize: 46, letterSpacing: 0.5 },
  goal: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
  percent: { color: colors.primary, fontFamily: fonts.bold, fontSize: 16, marginTop: 4 },
  left: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
  stamp: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: outlineColor,
    transform: [{ rotate: '-2deg' }],
    ...hardShadow(outlineColor, 3),
  },
  stampText: {
    color: colors.primaryText,
    fontFamily: fonts.bold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weekTop: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14 },
  bars: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: '100%', maxWidth: 28, height: 90, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 5, backgroundColor: colors.textFaint },
  barToday: { borderWidth: 2, borderColor: colors.text },
  letter: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 12 },
});
