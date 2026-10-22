// Escolher o ícone de perfil: o ícone atual com o botão "Trocar ícone", que abre a grade com todos.

import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/social/Avatar';
import { Button, SectionTitle } from '@/components/ui';
import { AVATAR_ICONS } from '@/lib/avatars';
import { colors, fonts, hardShadow, outline, radius } from '@/theme';

const GROUPS = [
  ['pessoas', 'Pessoas'],
  ['objetos', 'Objetos'],
] as const;

type Props = { name: string; value: string | null; onChange: (icon: string | null) => void };

export function AvatarPicker({ name, value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  function pick(icon: string | null) {
    onChange(icon);
    setOpen(false);
  }

  return (
    <View style={styles.current}>
      <Avatar name={name} icon={value} size={88} />
      <Button title="Trocar ícone" icon="images-outline" variant="secondary" small onPress={() => setOpen(true)} />

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.title}>Ícone de perfil</Text>
            <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 10 }}>
              <Pressable
                style={[styles.letter, value === null && styles.selected]}
                onPress={() => pick(null)}
                accessibilityLabel="Usar a inicial do nome">
                <Avatar name={name} size={52} />
                <Text style={styles.letterText}>Usar a inicial do nome</Text>
              </Pressable>
              {GROUPS.map(([group, label]) => (
                <View key={group} style={{ gap: 8 }}>
                  <SectionTitle>{label}</SectionTitle>
                  <View style={styles.grid}>
                    {AVATAR_ICONS.filter((a) => a.group === group).map((a) => (
                      <Pressable
                        key={a.id}
                        onPress={() => pick(a.id)}
                        style={[styles.cell, value === a.id && styles.selected]}
                        accessibilityLabel={a.name}>
                        <Avatar icon={a.id} size={52} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
            <Button title="Fechar" variant="ghost" onPress={() => setOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  current: { alignItems: 'center', gap: 10, paddingVertical: 4 },
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
  letter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 3,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  letterText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
});
