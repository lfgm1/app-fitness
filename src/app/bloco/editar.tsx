import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, SectionTitle } from '@/components/ui';
import { useStore } from '@/data/store';
import { confirmAction } from '@/lib/format';
import { colors, fonts, outline, radius } from '@/theme';

const EMOJIS = ['💪', '🔥', '⚡', '🏋️', '🦵', '🐔', '🏆', '🗓️'];

/** Criar ou editar um bloco: nome, emoji e quais treinos entram, em que ordem. */
export default function EditBlockScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { blocks, workouts, saveBlock, deleteBlock } = useStore();
  const existing = id ? blocks.find((b) => b.id === id) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? EMOJIS[0]);
  // Treinos do bloco, na ordem (só os que ainda existem).
  const [selected, setSelected] = useState<string[]>(
    (existing?.workoutIds ?? []).filter((wid) => workouts.some((w) => w.id === wid))
  );

  const available = workouts.filter((w) => !selected.includes(w.id));
  const nameOf = (wid: string) => workouts.find((w) => w.id === wid)?.name ?? 'Treino';

  function move(index: number, delta: number) {
    setSelected((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function save() {
    const block = saveBlock({ id: existing?.id, name, emoji, workoutIds: selected });
    if (existing) router.back();
    else router.replace({ pathname: '/bloco/[id]', params: { id: block.id } });
  }

  function remove() {
    confirmAction(
      'Excluir bloco?',
      'Só a pasta é excluída: os treinos continuam em Meus treinos, com todo o histórico.',
      'Excluir',
      () => {
        deleteBlock(existing!.id);
        router.dismissTo('/treinos');
      }
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: existing ? 'Editar bloco' : 'Novo bloco' }} />

      <SectionTitle>Nome do bloco</SectionTitle>
      <View style={styles.field}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          maxLength={60}
          placeholder="Ex.: PPL + UP, Torso + Limbs"
          placeholderTextColor={colors.textFaint}
        />
      </View>
      <View style={styles.emojis}>
        {EMOJIS.map((e) => (
          <Pressable
            key={e}
            onPress={() => setEmoji(e)}
            style={[styles.emoji, e === emoji && styles.emojiOn]}
            accessibilityLabel={`Ícone ${e}`}>
            <Text style={styles.emojiText}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle>Treinos do bloco</SectionTitle>
      {selected.length === 0 && <Text style={styles.muted}>Toque em + nos treinos abaixo para colocar no bloco.</Text>}
      {selected.map((wid, index) => (
        <Card key={wid} style={styles.row}>
          <Text style={styles.position}>{index + 1}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {nameOf(wid)}
          </Text>
          <Pressable onPress={() => move(index, -1)} disabled={index === 0} hitSlop={6} accessibilityLabel="Subir">
            <Ionicons name="chevron-up" size={22} color={index === 0 ? colors.border : colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => move(index, 1)}
            disabled={index === selected.length - 1}
            hitSlop={6}
            accessibilityLabel="Descer">
            <Ionicons
              name="chevron-down"
              size={22}
              color={index === selected.length - 1 ? colors.border : colors.textMuted}
            />
          </Pressable>
          <Pressable
            onPress={() => setSelected((list) => list.filter((x) => x !== wid))}
            hitSlop={6}
            accessibilityLabel={`Tirar ${nameOf(wid)} do bloco`}>
            <Ionicons name="close" size={22} color={colors.danger} />
          </Pressable>
        </Card>
      ))}

      {available.length > 0 && <SectionTitle>Adicionar treinos</SectionTitle>}
      {available.map((workout) => (
        <Pressable key={workout.id} onPress={() => setSelected((list) => [...list, workout.id])}>
          <Card style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>
              {workout.name}
            </Text>
            <Ionicons name="add-circle" size={26} color={colors.primary} />
          </Card>
        </Pressable>
      ))}
      {workouts.length === 0 && (
        <Text style={styles.muted}>
          Você ainda não tem treinos. Crie o bloco e depois use “Criar treino neste bloco”.
        </Text>
      )}

      <Button title="Salvar bloco" icon="checkmark" onPress={save} disabled={!name.trim()} />
      {existing && <Button title="Excluir bloco" icon="trash-outline" variant="danger" onPress={remove} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  field: { paddingHorizontal: 14, backgroundColor: colors.card, borderRadius: radius, ...outline },
  input: { color: colors.text, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 13 },
  emojis: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emoji: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  emojiOn: { borderColor: colors.primary, backgroundColor: colors.cardAlt, borderWidth: 3 },
  emojiText: { fontSize: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  position: { color: colors.primary, fontFamily: fonts.display, fontSize: 22, width: 22, textAlign: 'center' },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, flex: 1 },
  muted: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
});
