// Janelas das refeições da aba Calorias:
// - NewMealSheet: criar uma refeição com o nome que quiser (com atalhos) ou adicionar uma refeição salva.
// - MealOptions: renomear, salvar para usar em outros dias ou apagar uma refeição do dia.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import type { SavedMeal } from '@/data/store';
import { confirmAction } from '@/lib/format';
import { MEAL_NAME_MAX, MEAL_SUGGESTIONS } from '@/lib/meals';
import { colors, fonts, outline, outlineColor, radius } from '@/theme';

function formatKcal(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, '.');
}

function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar" />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />
          {children}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type NewMealProps = {
  visible: boolean;
  onClose: () => void;
  /** Nomes das refeições que já existem no dia (os atalhos com esses nomes vão para o fim). */
  existing: string[];
  savedMeals: SavedMeal[];
  onCreate: (name: string) => void;
  onUseSaved: (meal: SavedMeal) => void;
  onDeleteSaved: (meal: SavedMeal) => void;
};

export function NewMealSheet({
  visible,
  onClose,
  existing,
  savedMeals,
  onCreate,
  onUseSaved,
  onDeleteSaved,
}: NewMealProps) {
  const [name, setName] = useState('');
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setName('');
  }
  const taken = new Set(existing.map((n) => n.toLowerCase()));
  // As que já existem no dia não somem: vão para o fim (escolher uma delas adiciona nela).
  const suggestions = [
    ...MEAL_SUGGESTIONS.filter((s) => !taken.has(s.toLowerCase())),
    ...MEAL_SUGGESTIONS.filter((s) => taken.has(s.toLowerCase())),
  ];
  const clean = name.trim();

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled" style={{ maxHeight: 560 }}>
        <Text style={styles.title}>Nova refeição</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome da refeição"
          placeholderTextColor={colors.textFaint}
          maxLength={MEAL_NAME_MAX}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={() => clean && onCreate(clean)}
        />
        {suggestions.length > 0 && (
          <View style={styles.chips}>
            {suggestions.map((s) => (
              <Pressable key={s} onPress={() => setName(s)} style={[styles.chip, name === s && styles.chipOn]}>
                <Text style={[styles.chipText, name === s && { color: colors.primaryText }]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Button title="Criar e adicionar alimento" onPress={() => onCreate(clean)} disabled={!clean} />

        {savedMeals.length > 0 && (
          <>
            <Text style={styles.section}>Refeições salvas</Text>
            {savedMeals.map((meal) => {
              const kcal = meal.items.reduce((sum, i) => sum + i.kcal, 0);
              return (
                <View key={meal.id} style={styles.saved}>
                  <Pressable
                    onPress={() => onUseSaved(meal)}
                    style={{ flex: 1 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Adicionar ${meal.name}`}>
                    <Text style={styles.savedName} numberOfLines={1}>
                      {meal.name}
                    </Text>
                    <Text style={styles.savedMeta} numberOfLines={1}>
                      {formatKcal(kcal)} kcal · {meal.items.map((i) => i.foodName).join(', ')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      confirmAction(
                        'Apagar refeição salva?',
                        `"${meal.name}" sai da sua lista. O que você já comeu nos outros dias continua igual.`,
                        'Apagar',
                        () => onDeleteSaved(meal)
                      )
                    }
                    hitSlop={8}
                    accessibilityLabel={`Apagar ${meal.name} das refeições salvas`}>
                    <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                  </Pressable>
                  <Pressable onPress={() => onUseSaved(meal)} hitSlop={8} style={styles.addSaved}>
                    <Ionicons name="add" size={20} color={colors.primaryText} />
                  </Pressable>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}

type OptionsProps = {
  visible: boolean;
  onClose: () => void;
  meal: string;
  /** Já existe uma refeição salva com esse nome (salvar de novo substitui). */
  alreadySaved: boolean;
  onRename: (name: string) => void;
  onSave: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function MealOptions({
  visible,
  onClose,
  meal,
  alreadySaved,
  onRename,
  onSave,
  onDuplicate,
  onDelete,
}: OptionsProps) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(meal);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setRenaming(false);
      setName(meal);
    }
  }
  const clean = name.trim();

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title} numberOfLines={1}>
        {meal}
      </Text>
      {renaming ? (
        <>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={MEAL_NAME_MAX}
            style={styles.input}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={() => clean && onRename(clean)}
          />
          <Button title="Salvar nome" onPress={() => onRename(clean)} disabled={!clean} />
        </>
      ) : (
        <>
          <Option icon="create-outline" label="Renomear" onPress={() => setRenaming(true)} />
          <Option icon="copy-outline" label="Duplicar refeição" onPress={onDuplicate} />
          <Option
            icon="bookmark-outline"
            label={alreadySaved ? 'Atualizar refeição salva' : 'Salvar para usar em outros dias'}
            onPress={onSave}
          />
          <Option
            icon="trash-outline"
            label="Apagar refeição"
            danger
            // A confirmação abre depois que esta janela fecha (quem chama cuida disso).
            onPress={onDelete}
          />
        </>
      )}
    </Sheet>
  );
}

function Option({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.option} accessibilityRole="button">
      <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.text} />
      <Text style={[styles.optionText, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 2.5,
    borderColor: outlineColor,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.textFaint },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius,
    backgroundColor: colors.background,
    ...outline,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 2, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontFamily: fonts.bold, fontSize: 13 },
  section: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 6,
  },
  saved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  savedName: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  savedMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  addSaved: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  optionText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
});
