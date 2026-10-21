import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseImage } from '@/components/ExerciseImage';
import { Button } from '@/components/ui';
import { MUSCLE_GROUPS, normalizeSearch } from '@/data/exercises';
import type { Exercise, MuscleGroup } from '@/data/exercises';
import { useStore } from '@/data/store';
import { confirmAction } from '@/lib/format';
import { colors, fonts, outline, radius } from '@/theme';

type Props = {
  visible: boolean;
  selectedIds: string[];
  onToggle: (exerciseId: string) => void;
  onClose: () => void;
};

export function ExercisePicker({ visible, selectedIds, onToggle, onClose }: Props) {
  const { exercises, workouts, addCustomExercise, deleteCustomExercise } = useStore();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<MuscleGroup>('Peito');

  const filtered = useMemo(() => {
    const q = normalizeSearch(search);
    return exercises.filter(
      (e) => (!group || e.group === group) && (!q || normalizeSearch(e.name).includes(q))
    );
  }, [exercises, search, group]);

  function startCreating() {
    setNewName(search);
    setNewGroup(group ?? 'Peito');
    setCreating(true);
  }

  function removeExercise(exercise: Exercise) {
    const usedIn = workouts.filter((w) => w.exerciseIds.includes(exercise.id)).length;
    const impact =
      usedIn > 0
        ? `Ele será removido de ${usedIn} treino${usedIn === 1 ? '' : 's'} montado${usedIn === 1 ? '' : 's'}. `
        : '';
    confirmAction(
      'Excluir exercício?',
      `"${exercise.name}" será excluído. ${impact}Os registros que você já fez continuam no histórico.`,
      'Excluir',
      () => {
        if (selectedIds.includes(exercise.id)) onToggle(exercise.id);
        deleteCustomExercise(exercise.id);
      }
    );
  }

  function createExercise() {
    if (!newName.trim()) return;
    const exercise = addCustomExercise(newName, newGroup);
    onToggle(exercise.id);
    setCreating(false);
    setSearch('');
    setGroup(newGroup);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{creating ? 'Novo exercício' : 'Escolher exercícios'}</Text>
          <Pressable onPress={creating ? () => setCreating(false) : onClose} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>

        {creating ? (
          <View style={styles.createForm}>
            <Text style={styles.label}>Nome do exercício</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Ex: Supino com corrente"
              placeholderTextColor={colors.textFaint}
              autoFocus
            />
            <Text style={styles.label}>Grupo muscular</Text>
            <View style={styles.wrapChips}>
              {MUSCLE_GROUPS.map((g) => (
                <Chip key={g} label={g} active={newGroup === g} onPress={() => setNewGroup(g)} />
              ))}
            </View>
            <Button title="Criar e adicionar" icon="add" onPress={createExercise} disabled={!newName.trim()} />
          </View>
        ) : (
          <>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar exercício"
                placeholderTextColor={colors.textFaint}
              />
            </View>
            <View style={styles.chipsRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContent}>
                <Chip label="Todos" active={group === null} onPress={() => setGroup(null)} />
                {MUSCLE_GROUPS.map((g) => (
                  <Chip key={g} label={g} active={group === g} onPress={() => setGroup(g)} />
                ))}
              </ScrollView>
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
              ListHeaderComponent={
                <Pressable style={styles.createRow} onPress={startCreating}>
                  <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                  <Text style={styles.createText}>
                    {search.trim() ? `Criar "${search.trim()}"` : 'Criar exercício personalizado'}
                  </Text>
                </Pressable>
              }
              ListEmptyComponent={<Text style={styles.emptyText}>Nenhum exercício encontrado.</Text>}
              renderItem={({ item }) => {
                const selected = selectedIds.includes(item.id);
                return (
                  <Pressable
                    style={[styles.row, selected && styles.rowSelected]}
                    onPress={() => onToggle(item.id)}>
                    <ExerciseImage exerciseId={item.id} size={56} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{item.name}</Text>
                      <Text style={styles.rowGroup}>
                        {item.group}
                        {item.custom ? ' · personalizado' : ''}
                      </Text>
                    </View>
                    {item.custom && (
                      <Pressable
                        onPress={() => removeExercise(item)}
                        hitSlop={8}
                        accessibilityLabel={`Excluir exercício ${item.name}`}>
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                      </Pressable>
                    )}
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={selected ? colors.primary : colors.textFaint}
                    />
                  </Pressable>
                );
              }}
            />
            <View style={styles.footer}>
              <Button title={`Concluir (${selectedIds.length} selecionados)`} onPress={onClose} />
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { color: colors.text, fontSize: 25, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: radius,
    ...outline,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 12 },
  chipsRow: { height: 40, marginTop: 12, marginBottom: 8 },
  chipsContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    ...outline,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontFamily: fonts.semibold },
  chipTextActive: { color: colors.primaryText },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  createText: { color: colors.primary, fontSize: 16, fontFamily: fonts.bold },
  row: {
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  rowSelected: { backgroundColor: colors.cardAlt },
  rowName: { color: colors.text, fontSize: 16, fontFamily: fonts.semibold },
  rowGroup: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 24 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  createForm: { padding: 16 },
  label: { color: colors.textMuted, fontFamily: fonts.bold, marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    fontFamily: fonts.regular, fontSize: 16,
    padding: 14,
    borderRadius: radius,
    ...outline,
    marginBottom: 20,
  },
});
