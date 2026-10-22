// Escolher o ícone de um grupo: janela com todos os ícones, separados em Gains Club, Bandeiras e Temas.

import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GroupIcon } from '@/components/social/GroupIcon';
import { Button, SectionTitle } from '@/components/ui';
import { GROUP_ICONS } from '@/lib/groupIcons';
import { colors, fonts, hardShadow, outline, radius } from '@/theme';

const GROUPS = [
  ['gains', 'Gains Club'],
  ['bandeiras', 'Bandeiras'],
  ['temas', 'Temas'],
] as const;

type Props = { visible: boolean; value: string | null; onChange: (icon: string) => void; onClose: () => void };

export function GroupIconPicker({ visible, value, onChange, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Ícone do grupo</Text>
          <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ gap: 10 }}>
            {GROUPS.map(([group, label]) => (
              <View key={group} style={{ gap: 8 }}>
                <SectionTitle>{label}</SectionTitle>
                <View style={styles.grid}>
                  {GROUP_ICONS.filter((g) => g.group === group).map((g) => (
                    <Pressable
                      key={g.id}
                      onPress={() => {
                        onChange(g.id);
                        onClose();
                      }}
                      style={[styles.cell, value === g.id && styles.selected]}
                      accessibilityLabel={g.name}>
                      <GroupIcon icon={g.id} size={52} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <Button title="Fechar" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 },
  sheet: {
    gap: 10,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: radius + 4,
    ...outline,
    ...hardShadow(colors.primary),
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { padding: 3, borderRadius: 34, borderWidth: 3, borderColor: 'transparent' },
  selected: { borderColor: colors.primary },
});
