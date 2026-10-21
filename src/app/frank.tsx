import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Frank } from '@/components/Frank';
import { Card } from '@/components/ui';
import { useStore } from '@/data/store';
import { FRANK_PHASES, frankProgress } from '@/lib/frank';
import type { FrankPhase } from '@/lib/frank';
import { colors, fonts } from '@/theme';

const DESCRIPTIONS: Record<FrankPhase, string> = {
  frango: 'Magrinho, suando com a barra vazia. Todo mundo começa aqui.',
  marombeiro: 'Ganhou peito e confiança. Faixa na cabeça e haltere no alto.',
  monstro: 'Peitoral largo, regata, corrente e óculos escuros. O topo da evolução.',
};

function rangeLabel(index: number) {
  const phase = FRANK_PHASES[index];
  const next = FRANK_PHASES[index + 1];
  return next ? `${phase.from} a ${next.from - 1} treinos` : `${phase.from}+ treinos`;
}

/** Todas as fases do Frank: as já alcançadas, a atual e as que ainda faltam. */
export default function FrankEvolutionsScreen() {
  const { sessions } = useStore();
  const count = sessions.length;
  const { current } = frankProgress(count);
  const currentIndex = FRANK_PHASES.findIndex((p) => p.phase === current.phase);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        O Frank evolui conforme você registra treinos. Você tem{' '}
        <Text style={styles.count}>
          {count} treino{count === 1 ? '' : 's'}
        </Text>{' '}
        registrado{count === 1 ? '' : 's'}.
      </Text>

      {FRANK_PHASES.map((phase, index) => {
        const isCurrent = index === currentIndex;
        const locked = index > currentIndex;
        const remaining = phase.from - count;
        return (
          <Card key={phase.phase} style={[styles.card, isCurrent && styles.cardCurrent]}>
            <View style={[styles.art, locked && styles.artLocked]}>
              <Frank phase={phase.phase} size={104} still={locked} />
              {locked && (
                <View style={styles.lock}>
                  <Ionicons name="lock-closed" size={18} color={colors.text} />
                </View>
              )}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.range}>{rangeLabel(index)}</Text>
              <Text style={[styles.name, locked && { color: colors.textMuted }]}>{phase.name}</Text>
              <Text style={styles.description}>{DESCRIPTIONS[phase.phase]}</Text>
              {isCurrent && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Você está aqui</Text>
                </View>
              )}
              {locked && (
                <Text style={styles.remaining}>
                  Faltam {remaining} treino{remaining === 1 ? '' : 's'}
                </Text>
              )}
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  intro: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  count: { color: colors.primary, fontFamily: fonts.bold },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardCurrent: { borderColor: colors.primary },
  art: { width: 104, alignItems: 'center' },
  artLocked: { opacity: 0.3 },
  lock: {
    position: 'absolute',
    top: '42%',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  range: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14 },
  name: { color: colors.text, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 30 },
  description: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  badgeText: { color: colors.primaryText, fontFamily: fonts.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  remaining: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 12, marginTop: 4 },
});
