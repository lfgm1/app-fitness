import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Frank } from '@/components/Frank';
import { ShareSheet } from '@/components/ShareSheet';
import { Button, Card } from '@/components/ui';
import { useStore } from '@/data/store';
import { FRANK_PHASES, frankProgress, frankXp } from '@/lib/frank';
import { colors, fonts } from '@/theme';

function rangeLabel(index: number) {
  const phase = FRANK_PHASES[index];
  const next = FRANK_PHASES[index + 1];
  if (!next) return `${phase.from}+ XP`;
  const last = next.from - 1;
  if (last === phase.from) return `${phase.from} XP`;
  return `${phase.from} a ${last} XP`;
}

/** Todas as fases do Frank: as já alcançadas, a atual e as que ainda faltam. */
export default function FrankEvolutionsScreen() {
  const { sessions } = useStore();
  const [sharing, setSharing] = useState(false);
  const count = frankXp(sessions);
  const { current } = frankProgress(count);
  const currentIndex = FRANK_PHASES.findIndex((p) => p.phase === current.phase);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        O Frank evolui com XP: você ganha 1 XP por dia em que registra treino (só o primeiro treino do dia conta). Você
        tem <Text style={styles.count}>{count} XP</Text>.
      </Text>

      <Button title="Compartilhar meu Frank" icon="share-social-outline" onPress={() => setSharing(true)} />

      {FRANK_PHASES.map((phase, index) => {
        const isCurrent = index === currentIndex;
        const locked = index > currentIndex;
        const remaining = phase.from - count;
        return (
          <Card key={phase.phase} style={[styles.card, isCurrent && styles.cardCurrent]}>
            <View style={[styles.art, locked && styles.artLocked]}>
              <Frank phase={phase.phase} size={92} still={locked} />
              {locked && (
                <View style={styles.lock}>
                  <Ionicons name="lock-closed" size={18} color={colors.text} />
                </View>
              )}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.range}>{rangeLabel(index)}</Text>
              <Text style={[styles.name, locked && { color: colors.textMuted }]}>{phase.name}</Text>
              {isCurrent && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Você está aqui</Text>
                </View>
              )}
              {locked && <Text style={styles.remaining}>Faltam {remaining} XP</Text>}
            </View>
          </Card>
        );
      })}

      <ShareSheet
        visible={sharing}
        onClose={() => setSharing(false)}
        phase={current.phase}
        xp={count}
        variant="atual"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  intro: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  count: { color: colors.primary, fontFamily: fonts.bold },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardCurrent: { borderColor: colors.primary },
  art: { width: 92, alignItems: 'center' },
  artLocked: { opacity: 0.3 },
  lock: {
    position: 'absolute',
    top: '40%',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  range: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14 },
  name: { color: colors.text, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 28 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  badgeText: {
    color: colors.primaryText,
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  remaining: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 12, marginTop: 4 },
});
