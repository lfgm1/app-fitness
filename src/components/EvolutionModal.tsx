// Tela cheia de "Evoluiu!", que aparece quando o treino salvo faz o Frank mudar de fase.

import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Frank } from '@/components/Frank';
import { RecordBurst } from '@/components/RecordBurst';
import { ShareSheet } from '@/components/ShareSheet';
import { Button } from '@/components/ui';
import { FRANK_PHASES } from '@/lib/frank';
import type { FrankPhase } from '@/lib/frank';
import { colors, fonts, outlineColor } from '@/theme';

type Props = {
  visible: boolean;
  phase: FrankPhase;
  xp: number;
  onClose: () => void;
};

export function EvolutionModal({ visible, phase, xp, onClose }: Props) {
  const [sharing, setSharing] = useState(false);
  const name = FRANK_PHASES.find((p) => p.phase === phase)?.name ?? phase;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.content}>
          <RecordBurst size="large" label="Evoluiu!" />
          <Frank phase={phase} size={210} entrance />
          <View style={styles.tag}>
            <Text style={styles.tagText}>{name}</Text>
          </View>
          <Text style={styles.unlocked}>Nova fase desbloqueada</Text>
          <Text style={styles.count}>{xp} XP</Text>
        </View>
        <View style={styles.actions}>
          <Button title="Compartilhar" icon="share-social-outline" onPress={() => setSharing(true)} />
          <Button title="Continuar" variant="secondary" onPress={onClose} />
        </View>
      </SafeAreaView>
      <ShareSheet visible={sharing} onClose={() => setSharing(false)} phase={phase} xp={xp} variant="evoluiu" />
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 24 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  tag: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: outlineColor,
    transform: [{ rotate: '-2deg' }],
  },
  tagText: {
    color: colors.primaryText,
    fontFamily: fonts.display,
    fontSize: 40,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  unlocked: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, marginTop: 4 },
  count: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
  actions: { gap: 12, width: '100%', maxWidth: 420, alignSelf: 'center' },
});
