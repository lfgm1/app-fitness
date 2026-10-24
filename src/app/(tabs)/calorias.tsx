// Aba Calorias: o círculo enche conforme a pessoa registra o que comeu, até a meta do dia
// (calculada em src/lib/calories.ts). Embaixo, as refeições do dia, que a pessoa cria com o nome que
// quiser (ou adiciona uma refeição salva). Dá para voltar aos dias anteriores com as setas.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FoodSheet } from '@/components/FoodSheet';
import { MealOptions, NewMealSheet } from '@/components/MealSheets';
import { MEAL_NAME_MAX } from '@/lib/meals';
import { ProgressRing } from '@/components/ProgressRing';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { useProfile } from '@/data/profile';
import { useStore } from '@/data/store';
import type { FoodLog, SavedMeal } from '@/data/store';
import { WINDOW_DAYS, calorieTarget, isoDay, missingForCalories } from '@/lib/calories';
import type { CalorieTarget, MissingField } from '@/lib/calories';
import { portionLabel } from '@/lib/foods';
import { readWeekSteps, stepsAccess } from '@/lib/steps';
import type { DaySteps } from '@/lib/steps';
import { confirmAction, notify } from '@/lib/format';
import { formatSteps } from '@/lib/useSteps';
import { colors, fonts, outlineColor } from '@/theme';

// Quando passa da meta, a segunda volta do círculo fica laranja.
const OVER = colors.crista;
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MISSING_LABELS: Record<MissingField, string> = {
  weight: 'peso',
  height: 'altura',
  birthDate: 'data de nascimento',
  sex: 'sexo',
};
// Objetivo de calorias: muda o objetivo do perfil. "Manter" vale para força e saúde (os outros
// objetivos do perfil, que não mexem nas calorias).
type CalorieGoal = 'lose_fat' | 'maintain' | 'gain_muscle';
const GOAL_OPTIONS: [CalorieGoal, string][] = [
  ['lose_fat', 'Perder gordura'],
  ['maintain', 'Manter'],
  ['gain_muscle', 'Ganhar massa'],
];

function formatKcal(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, '.');
}

function clock() {
  return new Date();
}

/** Passos dos últimos 21 dias (a meta usa 14 dias fechados no domingo). Null se não dá para ler. */
function useRecentSteps() {
  const [steps, setSteps] = useState<DaySteps[] | null>(null);
  useEffect(() => {
    const load = () =>
      stepsAccess().then(async (access) =>
        setSteps(access === 'connected' ? await readWeekSteps(WINDOW_DAYS + 7) : null)
      );
    load();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && load());
    return () => sub.remove();
  }, []);
  return steps;
}

/** Janela "Como calculamos sua meta". */
function TargetInfo({ visible, onClose, info }: { visible: boolean; onClose: () => void; info: CalorieTarget }) {
  const rows: [string, string][] = [
    ['Gasto do corpo parado (taxa basal)', `${formatKcal(info.basal)} kcal`],
    [
      info.basis === 'moderado' ? 'Atividade (por enquanto, treino moderado)' : 'Gasto do dia, com atividade',
      `${formatKcal(info.expenditure)} kcal`,
    ],
  ];
  if (info.goalAdjust !== 0) {
    rows.push([
      info.goalAdjust < 0 ? 'Objetivo: perder gordura' : 'Objetivo: ganhar músculo',
      `${info.goalAdjust > 0 ? '+' : '−'}${formatKcal(Math.abs(info.goalAdjust))} kcal`,
    ]);
  }
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Sua meta</Text>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
          </View>
        ))}
        <View style={[styles.infoRow, styles.infoTotal]}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Meta do dia</Text>
          <Text style={[styles.infoValue, { color: colors.primary }]}>{formatKcal(info.target)} kcal</Text>
        </View>
        {(
          [
            [`Proteína (${String(info.proteinPerKg).replace('.', ',')} g por kg)`, info.protein],
            ['Gordura (25% das calorias)', info.fat],
            ['Carboidrato (o restante)', info.carbs],
          ] as const
        ).map(([label, grams]) => (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{grams} g</Text>
          </View>
        ))}
        <Text style={styles.infoText}>
          {info.basis === 'moderado'
            ? 'Ainda não temos nenhum dia seu completo, então usamos um treino moderado. A partir de amanhã, a meta passa a usar os seus treinos e passos de verdade.'
            : `Usamos a média dos seus últimos ${info.days} dias: ${info.workouts} treino${info.workouts === 1 ? '' : 's'} registrado${info.workouts === 1 ? '' : 's'}${
                info.avgSteps !== null ? ` e ${formatSteps(info.avgSteps)} passos por dia` : ''
              }. ${
                info.days >= WINDOW_DAYS
                  ? 'A meta fica a mesma a semana toda e é atualizada toda segunda.'
                  : 'Até completar 2 semanas de app, ela é atualizada todo dia.'
              }`}
        </Text>
        <Text style={styles.infoNote}>
          É uma estimativa feita com peso, altura, idade e sexo do seu perfil. Não substitui a orientação de um
          nutricionista.
        </Text>
        <Button title="Entendi" onPress={onClose} />
      </SafeAreaView>
    </Modal>
  );
}

export default function CaloriesScreen() {
  const { session } = useAuth();
  const { profile, saveProfile } = useProfile();
  const [goalError, setGoalError] = useState(false);
  const { sessions, foodLogs, savedMeals, addFoodLog, updateFoodLog, deleteFoodLog, saveMeal, deleteSavedMeal } =
    useStore();
  const steps = useRecentSteps();
  const [offset, setOffset] = useState(0);
  const [sheet, setSheet] = useState<{ meal: string; editing: FoodLog | null } | null>(null);
  const [newMeal, setNewMeal] = useState(false);
  const [options, setOptions] = useState<string | null>(null);
  // A refeição do menu de opções continua guardada enquanto a janela fecha (para o texto não sumir).
  const [menuMeal, setMenuMeal] = useState('');
  if (options !== null && options !== menuMeal) setMenuMeal(options);
  // Refeições abertas (por dia: "2026-10-24|Almoço"). Começam todas minimizadas (nome e calorias);
  // tocando no nome, abre a lista de alimentos.
  const [expanded, setExpanded] = useState<string[]>([]);
  const toggleMeal = (key: string) =>
    setExpanded((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  // Refeições criadas e ainda sem alimento (só aparecem até a pessoa sair da aba).
  const [emptyMeals, setEmptyMeals] = useState<{ day: string; name: string }[]>([]);
  const [info, setInfo] = useState(false);

  const [now] = useState(clock);
  const date = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return d;
  }, [now, offset]);
  const day = isoDay(date);
  const dayLabel =
    offset === 0
      ? 'Hoje'
      : offset === -1
        ? 'Ontem'
        : `${WEEKDAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;

  const since = useMemo(() => new Date(session?.user.created_at ?? now), [session, now]);
  const target = useMemo(
    () => (profile ? calorieTarget({ profile, sessions, steps, since, now: date }) : null),
    [profile, sessions, steps, since, date]
  );
  const missing = missingForCalories(profile);

  const logs = foodLogs.filter((l) => l.day === day);
  const total = logs.reduce(
    (sum, l) => ({
      kcal: sum.kcal + l.kcal,
      protein: sum.protein + l.protein,
      carbs: sum.carbs + l.carbs,
      fat: sum.fat + l.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  // As refeições do dia, na ordem em que foram criadas (o id de cada alimento começa pela hora).
  const meals: string[] = [];
  for (const log of [...logs].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!meals.includes(log.meal)) meals.push(log.meal);
  }
  for (const empty of emptyMeals) if (empty.day === day && !meals.includes(empty.name)) meals.push(empty.name);
  const mealItems = (meal: string) => logs.filter((l) => l.meal === meal);

  function createMeal(name: string) {
    setNewMeal(false);
    // A refeição nova já aparece aberta.
    setExpanded((prev) => [...prev, `${day}|${name}`]);
    if (!meals.includes(name)) setEmptyMeals((prev) => [...prev, { day, name }]);
    setSheet({ meal: name, editing: null });
  }

  function addSavedMeal(saved: SavedMeal) {
    setNewMeal(false);
    for (const item of saved.items) addFoodLog({ ...item, day, meal: saved.name });
  }

  function renameMeal(from: string, to: string) {
    setOptions(null);
    for (const item of mealItems(from)) updateFoodLog(item.id, { meal: to });
    setEmptyMeals((prev) => prev.map((m) => (m.day === day && m.name === from ? { ...m, name: to } : m)));
  }

  function saveForLater(meal: string) {
    setOptions(null);
    const items = mealItems(meal).map(({ foodId, foodName, unit, quantity, grams, kcal, protein, carbs, fat }) => ({
      foodId,
      foodName,
      unit,
      quantity,
      grams,
      kcal,
      protein,
      carbs,
      fat,
    }));
    if (items.length === 0) {
      notify('Refeição vazia', 'Adicione pelo menos um alimento antes de salvar.');
      return;
    }
    saveMeal(meal, items);
    notify('Refeição salva', `"${meal}" aparece em "Nova refeição" para você adicionar em outros dias.`);
  }

  /** Cria uma cópia da refeição no mesmo dia: "Almoço (2)", com os mesmos alimentos e porções. */
  function duplicateMeal(meal: string) {
    setOptions(null);
    const base = meal.replace(/ (d+)$/, '');
    let n = 2;
    let name = `${base} (${n})`;
    while (meals.includes(name)) name = `${base} (${++n})`;
    if (name.length > MEAL_NAME_MAX) name = `${base.slice(0, MEAL_NAME_MAX - 5)}… (${n})`;
    const items = mealItems(meal);
    if (items.length === 0) {
      setEmptyMeals((prev) => [...prev, { day, name }]);
      return;
    }
    for (const { id: _id, updatedAt: _u, deleted: _d, ...item } of items) addFoodLog({ ...item, meal: name });
  }

  // Fecha as opções primeiro e só então pergunta (a pergunta por cima da janela de opções deixava
  // as opções abertas depois de apagar).
  function deleteMeal(meal: string) {
    setOptions(null);
    setTimeout(
      () =>
        confirmAction('Apagar refeição?', `Os alimentos de "${meal}" deste dia são apagados.`, 'Apagar', () => {
          for (const item of mealItems(meal)) deleteFoodLog(item.id);
          setEmptyMeals((prev) => prev.filter((m) => !(m.day === day && m.name === meal)));
        }),
      300
    );
  }

  const calorieGoal: CalorieGoal =
    profile?.goal === 'lose_fat' || profile?.goal === 'gain_muscle' ? profile.goal : 'maintain';

  async function changeGoal(next: CalorieGoal) {
    if (!profile || next === calorieGoal) return;
    setGoalError(false);
    try {
      // "Manter" volta para saúde (se já era força ou saúde, nem chega aqui).
      await saveProfile({ ...profile, goal: next === 'maintain' ? 'health' : next });
    } catch {
      setGoalError(true);
    }
  }

  const progress = target ? total.kcal / target.target : 0;
  const left = target ? target.target - total.kcal : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.dayRow}>
        <Pressable onPress={() => setOffset((o) => o - 1)} hitSlop={10} accessibilityLabel="Dia anterior">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.dayLabel}>{dayLabel}</Text>
        <Pressable
          onPress={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset === 0}
          hitSlop={10}
          accessibilityLabel="Próximo dia">
          <Ionicons name="chevron-forward" size={24} color={offset === 0 ? colors.border : colors.text} />
        </Pressable>
      </View>

      {missing.length > 0 ? (
        <Card style={styles.missing}>
          <Ionicons name="person-circle-outline" size={44} color={colors.primary} />
          <Text style={styles.missingTitle}>Complete seu perfil</Text>
          <Text style={styles.missingText}>
            Para calcular quantas calorias você gasta por dia, precisamos de:{' '}
            {missing.map((m) => MISSING_LABELS[m]).join(', ')}.
          </Text>
          <Button title="Completar perfil" onPress={() => router.push('/editar-perfil')} />
        </Card>
      ) : (
        target && (
          <Card style={[styles.ringCard, progress > 1 && { borderColor: OVER }]}>
            <ProgressRing progress={progress} extraColor={OVER}>
              <Text style={styles.count}>{formatKcal(total.kcal)}</Text>
              <Text style={styles.of}>de {formatKcal(target.target)} kcal</Text>
              <Text style={[styles.left, left < 0 && { color: OVER }]}>
                {left >= 0 ? `Restam ${formatKcal(left)}` : `Passou ${formatKcal(-left)}`}
              </Text>
            </ProgressRing>
            <View style={styles.macros}>
              {(
                [
                  ['Proteína', total.protein, target.protein, false],
                  ['Carboidrato', total.carbs, target.carbs, true],
                  ['Gordura', total.fat, target.fat, true],
                ] as const
              ).map(([label, eaten, goal, canPass]) => {
                const value = Math.round(eaten);
                // Carboidrato e gordura acima da meta ficam laranja; proteína a mais não é problema.
                const over = canPass && value > goal;
                const done = !canPass && value >= goal;
                return (
                  <View key={label} style={styles.macro}>
                    <ProgressRing
                      progress={over ? 1 : goal > 0 ? Math.min(1, value / goal) : 0}
                      color={over ? OVER : colors.primary}
                      size={64}
                      stroke={7}>
                      <Text style={[styles.macroValue, over && { color: OVER }]}>{value}</Text>
                    </ProgressRing>
                    <Text style={styles.macroLabel}>{label}</Text>
                    <Text style={[styles.macroGoal, over && { color: OVER }, done && { color: colors.primary }]}>
                      {over ? `passou ${value - goal} g` : done ? 'meta batida' : `de ${goal} g`}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.goalBlock}>
              <Text style={styles.goalTitle}>Objetivo</Text>
              <View style={styles.goals}>
                {GOAL_OPTIONS.map(([key, label]) => {
                  const on = calorieGoal === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => changeGoal(key)}
                      style={[styles.goal, on && styles.goalOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}>
                      <Text style={[styles.goalText, on && { color: colors.primaryText }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {goalError && <Text style={styles.goalError}>Não deu para salvar o objetivo. Tente de novo.</Text>}
            </View>
            <Pressable onPress={() => setInfo(true)} hitSlop={8} style={styles.how} accessibilityRole="button">
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.howText}>Como calculamos</Text>
            </Pressable>
          </Card>
        )
      )}

      {meals.length === 0 && (
        <Text style={styles.empty}>Nenhuma refeição {offset === 0 ? 'hoje' : 'neste dia'} ainda.</Text>
      )}

      {meals.map((meal) => {
        const items = mealItems(meal);
        const kcal = items.reduce((sum, l) => sum + l.kcal, 0);
        const closed = !expanded.includes(`${day}|${meal}`);
        return (
          <Card key={meal} style={styles.meal}>
            <View style={styles.mealTop}>
              <Pressable
                onPress={() => toggleMeal(`${day}|${meal}`)}
                style={styles.mealTitle}
                accessibilityRole="button"
                accessibilityState={{ expanded: !closed }}
                accessibilityLabel={`${closed ? 'Abrir' : 'Minimizar'} ${meal}`}>
                <Ionicons name={closed ? 'chevron-forward' : 'chevron-down'} size={18} color={colors.textMuted} />
                <Text style={styles.mealName} numberOfLines={1}>
                  {meal}
                </Text>
              </Pressable>
              <Pressable onPress={() => setOptions(meal)} hitSlop={8} accessibilityLabel={`Opções de ${meal}`}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
              </Pressable>
              {kcal > 0 && <Text style={styles.mealKcal}>{formatKcal(kcal)} kcal</Text>}
              <Pressable
                onPress={() => setSheet({ meal, editing: null })}
                hitSlop={8}
                style={styles.add}
                accessibilityLabel={`Adicionar alimento em ${meal}`}>
                <Ionicons name="add" size={22} color={colors.primaryText} />
              </Pressable>
            </View>
            {closed && items.length > 0 && (
              <Text style={styles.mealEmpty}>
                {items.length} alimento{items.length === 1 ? '' : 's'}
              </Text>
            )}
            {!closed && items.length === 0 && (
              <Text style={styles.mealEmpty}>Toque no + para adicionar um alimento.</Text>
            )}
            {!closed &&
              items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSheet({ meal, editing: item })}
                  style={styles.item}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.foodName}, ${portionLabel(item.unit, item.quantity, item.foodId)}, ${item.kcal} kcal. Corrigir`}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.foodName}
                    </Text>
                    <Text style={styles.itemPortion}>{portionLabel(item.unit, item.quantity, item.foodId)}</Text>
                  </View>
                  <Text style={styles.itemKcal}>{formatKcal(item.kcal)}</Text>
                  <Pressable
                    onPress={() =>
                      confirmAction('Remover alimento?', `"${item.foodName}" sai de ${meal}.`, 'Remover', () =>
                        deleteFoodLog(item.id)
                      )
                    }
                    hitSlop={8}
                    style={styles.remove}
                    accessibilityLabel={`Remover ${item.foodName}`}>
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                </Pressable>
              ))}
          </Card>
        );
      })}

      <Button title="Nova refeição" icon="add" variant="secondary" onPress={() => setNewMeal(true)} />

      <Text style={styles.footnote}>Alimentos da tabela TACO (NEPA/Unicamp). Os valores são estimativas.</Text>

      {sheet && (
        <FoodSheet visible onClose={() => setSheet(null)} day={day} meal={sheet.meal} editing={sheet.editing} />
      )}
      {target && <TargetInfo visible={info} onClose={() => setInfo(false)} info={target} />}
      <NewMealSheet
        visible={newMeal}
        onClose={() => setNewMeal(false)}
        existing={meals}
        savedMeals={savedMeals}
        onCreate={createMeal}
        onUseSaved={addSavedMeal}
        onDeleteSaved={(m) => deleteSavedMeal(m.id)}
      />
      {/* Sempre montada (só abre e fecha): desmontar a janela aberta podia deixá-la na tela no navegador. */}
      <MealOptions
        visible={options !== null}
        onClose={() => setOptions(null)}
        meal={menuMeal}
        alreadySaved={savedMeals.some((m) => m.name.toLowerCase() === menuMeal.toLowerCase())}
        onRename={(to) => renameMeal(menuMeal, to)}
        onSave={() => saveForLater(menuMeal)}
        onDuplicate={() => duplicateMeal(menuMeal)}
        onDelete={() => deleteMeal(menuMeal)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  dayLabel: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  missing: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  missingTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 26, textTransform: 'uppercase' },
  missingText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  ringCard: { alignItems: 'center', gap: 14, paddingVertical: 20 },
  count: { color: colors.text, fontFamily: fonts.display, fontSize: 46, letterSpacing: 0.5 },
  of: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
  left: { color: colors.primary, fontFamily: fonts.bold, fontSize: 16, marginTop: 4 },
  macros: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-around' },
  macro: { alignItems: 'center' },
  macroValue: { color: colors.text, fontFamily: fonts.display, fontSize: 20 },
  macroLabel: { color: colors.text, fontFamily: fonts.semibold, fontSize: 12, marginTop: 4 },
  macroGoal: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  goalBlock: { alignSelf: 'stretch', gap: 8 },
  goalTitle: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  goals: { flexDirection: 'row', gap: 6 },
  goal: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  goalOn: { backgroundColor: colors.primary, borderColor: outlineColor },
  goalText: { color: colors.text, fontFamily: fonts.bold, fontSize: 13 },
  goalError: { color: colors.danger, fontFamily: fonts.regular, fontSize: 12 },
  how: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  howText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13 },
  meal: { gap: 8 },
  mealTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  mealEmpty: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 },
  empty: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  mealName: {
    flexShrink: 1,
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  mealKcal: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14 },
  add: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: outlineColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemName: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  itemPortion: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 },
  remove: { paddingLeft: 4 },
  itemKcal: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  footnote: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' },
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
  sheetTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  infoTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  infoLabel: { flex: 1, color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
  infoValue: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  infoText: { color: colors.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  infoNote: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
});
