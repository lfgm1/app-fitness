// Ranking de passos na aba Passos: entre amigos ou geral (todos os usuários), do dia ou da semana
// (segunda a domingo, igual ao streak). É opcional: só quem toca em "Participar do ranking" manda os
// totais de cada dia para o servidor, e só quem participa vê o ranking. No geral só aparece quem ligou
// "Aparecer no ranking geral".
// Onde não dá para ler passos (site), quem já participa pelo celular vê o ranking, mas não manda passos.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Avatar } from '@/components/social/Avatar';
import { Button, Card } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { getProfile, getStepsRanking, reportSteps, setShareSteps, setStepsPublic } from '@/data/social';
import type { StepsRankingRow } from '@/data/social';
import { confirmAction } from '@/lib/format';
import type { DaySteps, StepsAccess } from '@/lib/steps';
import { formatSteps } from '@/lib/useSteps';
import { colors, fonts } from '@/theme';

// Ouro, prata e bronze para os 3 primeiros.
const MEDALS = ['#F2C94C', '#C9CED6', '#D98E54'];

type Period = 'dia' | 'semana';
type Scope = 'amigos' | 'geral';

type Props = {
  /** Passos dos últimos 7 dias (o último é hoje); null quando não dá para ler passos aqui. */
  week: DaySteps[] | null;
  /** Em que pé está o acesso aos passos neste aparelho. */
  access: StepsAccess;
};

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Os dias desta semana, de segunda até hoje (hoje é o último). Sem passos lidos, só as datas. */
function thisWeek(week: DaySteps[] | null): DaySteps[] {
  if (!week) {
    const now = new Date();
    const sinceMonday = (now.getDay() + 6) % 7;
    return Array.from({ length: sinceMonday + 1 }, (_, i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - sinceMonday + i);
      return { date: isoDate(day), steps: 0 };
    });
  }
  const [y, m, d] = week[week.length - 1].date.split('-').map(Number);
  // getDay: domingo = 0; aqui segunda = 0.
  const sinceMonday = (new Date(y, m - 1, d).getDay() + 6) % 7;
  return week.slice(week.length - 1 - sinceMonday);
}

/** Abas Amigos | Geral, com ícone e um traço embaixo da escolhida. */
function ScopeTabs({ value, onChange }: { value: Scope; onChange: (value: Scope) => void }) {
  const tabs: [Scope, string, IconName][] = [
    ['amigos', 'Amigos', 'people'],
    ['geral', 'Geral', 'globe-outline'],
  ];
  return (
    <View style={styles.tabs}>
      {tabs.map(([key, label, icon]) => {
        const on = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.tab, on && styles.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}>
            <Ionicons name={icon} size={17} color={on ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabText, on && { color: colors.primary }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Diário · Semanal: só texto, a escolhida mais clara. */
function PeriodSwitch({ value, onChange }: { value: Period; onChange: (value: Period) => void }) {
  return (
    <View style={styles.periods}>
      {(['dia', 'semana'] as const).map((key, i) => (
        <Fragment key={key}>
          {i > 0 && <Text style={styles.periodDot}>·</Text>}
          <Pressable
            onPress={() => onChange(key)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ selected: value === key }}>
            <Text style={[styles.periodText, value === key && styles.periodOn]}>
              {key === 'dia' ? 'Diário' : 'Semanal'}
            </Text>
          </Pressable>
        </Fragment>
      ))}
    </View>
  );
}

export function StepsRanking({ week, access }: Props) {
  const canReport = access === 'connected' && week !== null;
  const [scope, setScope] = useState<Scope>('amigos');
  const [period, setPeriod] = useState<Period>('dia');
  const days = thisWeek(week);
  const today = days[days.length - 1];
  const from = period === 'dia' ? today.date : days[0].date;
  const { session } = useAuth();
  const userId = session?.user.id;
  // null = carregando ou sem perfil no Social (aí o ranking não aparece).
  const [sharing, setSharing] = useState<boolean | null>(null);
  // Aparece no ranking geral.
  const [isPublic, setIsPublic] = useState(false);
  const [rows, setRows] = useState<StepsRankingRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const profile = await getProfile(userId);
      setIsPublic(profile?.stepsPublic ?? false);
      setSharing(profile ? profile.shareSteps : null);
      if (!profile?.shareSteps) return;
      if (canReport) await reportSteps(days);
      setRows(await getStepsRanking(from, today.date, scope));
      setError(false);
    } catch {
      setError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `days` muda junto com `week`.
  }, [userId, week, from, scope, canReport]);

  // Atualiza ao abrir a aba e quando os passos mudam.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );
  useEffect(() => {
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function join() {
    setBusy(true);
    try {
      await setShareSteps(true);
      await refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function leave() {
    confirmAction(
      'Sair do ranking?',
      'Ninguém mais vê seus passos (nem no ranking geral) e os passos já enviados são apagados.',
      'Sair',
      async () => {
        try {
          await setShareSteps(false);
          setSharing(false);
          setIsPublic(false);
          setRows(null);
        } catch {
          setError(true);
        }
      }
    );
  }

  async function togglePublic(on: boolean) {
    setIsPublic(on);
    try {
      await setStepsPublic(on);
      await refresh();
    } catch {
      setIsPublic(!on);
      setError(true);
    }
  }

  if (!userId || sharing === null) return null;

  if (!sharing) {
    return (
      <Card style={{ gap: 10 }}>
        <Text style={styles.title}>Ranking</Text>
        <Text style={styles.text}>
          Veja quem deu mais passos hoje e na semana, entre seus amigos e entre todos do Gains Club. Participando, seus
          amigos que também participam veem seus passos de cada dia. No ranking geral você só aparece se quiser.
        </Text>
        {canReport ? (
          <Button
            title={busy ? 'Entrando...' : 'Participar do ranking'}
            icon="trophy-outline"
            small
            onPress={join}
            disabled={busy}
          />
        ) : (
          <Text style={styles.notice}>
            {access === 'unsupported'
              ? 'Para participar, use o Gains Club no celular: os passos vêm do app de saúde dele.'
              : 'Para participar, conecte seus passos na página Hoje.'}
          </Text>
        )}
        {error && <Text style={styles.error}>Não deu para entrar agora. Tente de novo.</Text>}
      </Card>
    );
  }

  const list = rows;
  const others = (list ?? []).filter((r) => r.userId !== userId).length;

  return (
    <Card style={{ gap: 10 }}>
      <ScopeTabs
        value={scope}
        onChange={(next) => {
          setScope(next);
          setRows(null);
        }}
      />
      <PeriodSwitch
        value={period}
        onChange={(next) => {
          setPeriod(next);
          setRows(null);
        }}
      />
      {period === 'semana' && (
        <Text style={[styles.text, { textAlign: 'center' }]}>Soma de segunda até hoje. Recomeça toda segunda.</Text>
      )}

      {list === null ? (
        error ? (
          <Text style={styles.error}>Não deu para carregar o ranking agora.</Text>
        ) : null
      ) : (
        <>
          {list.map((row, i) => {
            const isMe = row.userId === userId;
            // No geral, se eu estou fora dos 50 primeiros, minha linha vem depois de um "...".
            const gap = i > 0 && row.position > list[i - 1].position + 1;
            return (
              <Fragment key={row.userId}>
                {gap && <Text style={styles.gap}>...</Text>}
                <Pressable
                  // Toca para abrir o perfil (o meu abre a aba Perfil). No exemplo, as pessoas não existem.
                  onPress={() =>
                    isMe
                      ? router.push('/perfil')
                      : router.push({ pathname: '/usuario/[id]', params: { id: row.userId } })
                  }
                  style={({ pressed }) => [styles.row, isMe && styles.rowMe, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${row.position}º ${isMe ? 'Você' : row.displayName}, ${formatSteps(row.steps)} passos. Ver perfil`}>
                  <Text
                    style={[styles.position, row.position <= 3 && { color: MEDALS[row.position - 1] }]}
                    numberOfLines={1}>
                    {row.position}º
                  </Text>
                  <Avatar name={row.displayName} icon={row.avatar} size={36} streakWeeks={row.streakWeeks} />
                  <Text style={[styles.name, isMe && { color: colors.primary }]} numberOfLines={1}>
                    {isMe ? 'Você' : row.displayName}
                  </Text>
                  <Text style={styles.steps}>{formatSteps(row.steps)}</Text>
                </Pressable>
              </Fragment>
            );
          })}
          {others === 0 && (
            <Text style={styles.text}>
              {scope === 'amigos'
                ? 'Nenhum amigo no ranking ainda. Chame seus amigos para tocarem em "Participar do ranking" na aba Passos.'
                : 'Ninguém no ranking geral ainda.'}
            </Text>
          )}
        </>
      )}

      {scope === 'geral' && (
        <View style={styles.publicRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.publicLabel}>Aparecer no ranking geral</Text>
            <Text style={styles.publicHint}>Todos que participam veem seu nome, ícone e passos.</Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={togglePublic}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.pena}
          />
        </View>
      )}
      {
        <Pressable onPress={leave} hitSlop={8} style={styles.leaveButton} accessibilityRole="button">
          <Text style={styles.leave}>Sair do ranking</Text>
        </Pressable>
      }
    </Card>
  );
}

const styles = StyleSheet.create({
  leaveButton: { alignSelf: 'center', paddingTop: 4 },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  text: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  notice: { color: colors.text, fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 13 },
  tabs: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: colors.border },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: -2,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabOn: { borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 15 },
  periods: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  periodText: { color: colors.textFaint, fontFamily: fonts.bold, fontSize: 14 },
  periodOn: { color: colors.text },
  periodDot: { color: colors.textFaint, fontFamily: fonts.bold, fontSize: 14 },
  leave: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rowMe: { backgroundColor: colors.cardAlt },
  position: { width: 34, color: colors.textMuted, fontFamily: fonts.display, fontSize: 20 },
  name: { flex: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  steps: { color: colors.text, fontFamily: fonts.display, fontSize: 20, letterSpacing: 0.4 },
  gap: { color: colors.textFaint, fontFamily: fonts.bold, fontSize: 16, textAlign: 'center' },
  publicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  publicLabel: { color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  publicHint: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
});
