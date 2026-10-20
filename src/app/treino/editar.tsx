import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ExercisePicker } from '@/components/ExercisePicker';
import { Button, Card, SectionTitle } from '@/components/ui';
import { useStore } from '@/data/store';
import { confirmAction } from '@/lib/format';
import { colors, radius } from '@/theme';

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { workouts, getExercise, saveWorkout, deleteWorkout } = useStore();
  const existing = id ? workouts.find((w) => w.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [exerciseIds, setExerciseIds] = useState<string[]>(existing?.exerciseIds ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);

  const canSave = name.trim().length > 0 && exerciseIds.length > 0;

  function toggle(exerciseId: string) {
    setExerciseIds((ids) =>
      ids.includes(exerciseId) ? ids.filter((x) => x !== exerciseId) : [...ids, exerciseId]
    );
  }

  function move(index: number, delta: number) {
    setExerciseIds((ids) => {
      const next = [...ids];
      const target = index + delta;
      if (target < 0 || target >= next.length) return ids;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function save() {
    saveWorkout({ id: existing?.id, name, exerciseIds });
    router.back();
  }

  function remove() {
    if (!existing) return;
    confirmAction(
      'Excluir treino?',
      `O treino "${existing.name}" será excluído. Os registros que você já fez continuam no histórico.`,
      'Excluir',
      () => {
        deleteWorkout(existing.id);
        router.back();
      }
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: existing ? 'Editar treino' : 'Novo treino' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionTitle>Nome do treino</SectionTitle>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder='Ex: "Peito", "Treino A", "Pernas"'
          placeholderTextColor={colors.textFaint}
          autoFocus={!existing}
        />

        <SectionTitle>Exercícios ({exerciseIds.length})</SectionTitle>
        {exerciseIds.length > 0 && (
          <Card style={{ padding: 0 }}>
            {exerciseIds.map((exerciseId, index) => {
              const exercise = getExercise(exerciseId);
              return (
                <View key={exerciseId} style={[styles.row, index > 0 && styles.rowBorder]}>
                  <Text style={styles.order}>{index + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exName}>{exercise?.name ?? 'Exercício removido'}</Text>
                    <Text style={styles.exGroup}>{exercise?.group}</Text>
                  </View>
                  <Pressable hitSlop={6} onPress={() => move(index, -1)} disabled={index === 0}>
                    <Ionicons name="chevron-up" size={22} color={index === 0 ? colors.border : colors.textMuted} />
                  </Pressable>
                  <Pressable
                    hitSlop={6}
                    onPress={() => move(index, 1)}
                    disabled={index === exerciseIds.length - 1}>
                    <Ionicons
                      name="chevron-down"
                      size={22}
                      color={index === exerciseIds.length - 1 ? colors.border : colors.textMuted}
                    />
                  </Pressable>
                  <Pressable hitSlop={6} onPress={() => toggle(exerciseId)} accessibilityLabel="Remover">
                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                  </Pressable>
                </View>
              );
            })}
          </Card>
        )}
        <Button title="Adicionar exercícios" icon="add" variant="secondary" onPress={() => setPickerOpen(true)} />

        <View style={{ height: 12 }} />
        <Button title="Salvar treino" icon="checkmark" onPress={save} disabled={!canSave} />
        {existing && <Button title="Excluir treino" icon="trash-outline" variant="danger" onPress={remove} />}
      </ScrollView>

      <ExercisePicker
        visible={pickerOpen}
        selectedIds={exerciseIds}
        onToggle={toggle}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    padding: 14,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  order: { color: colors.textFaint, fontWeight: '800', width: 18 },
  exName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  exGroup: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
});
