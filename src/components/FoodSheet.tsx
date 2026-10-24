// Janela de adicionar (ou corrigir) um alimento numa refeição da aba Calorias.
// 1) Busca na TACO, sem precisar de acento; sem nada digitado, mostra os recentes e o atalho de
//    repetir a refeição de ontem. As junk foods com sabores (Pizza, Cookie, Açaí...) aparecem como um
//    item só, e o hambúrguer abre a tela de montar. 2) Sabor (se tiver) e porção: colher, concha,
//    unidade (com quantidade), gramas (digitado) ou o tamanho do copo/porção.
// As calorias e os macros aparecem na hora e ficam guardados no registro.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
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

import { BurgerBuilder } from '@/components/BurgerBuilder';
import { Button } from '@/components/ui';
import { useStore } from '@/data/store';
import type { FoodLog } from '@/data/store';
import {
  getFood,
  gramsPerUnit,
  isEstimatedFood,
  matchScore,
  normalize,
  portionLabel,
  portionNutrition,
  searchFlavors,
  searchFoods,
  unitButtonLabel,
  unitsFor,
} from '@/lib/foods';
import type { Food, PortionUnit } from '@/lib/foods';
import { BURGER_FOOD_ID, FRIES_FOOD_ID } from '@/lib/burger';
import { JUNK_GROUPS, flavorName, junkGroupOf } from '@/lib/junkFoods';
import type { JunkGroup } from '@/lib/junkFoods';
import { isFreeMeal } from '@/lib/meals';
import { colors, fonts, outline, outlineColor, radius } from '@/theme';

// O hambúrguer aparece como um alimento, mas ao tocar abre a tela de montar o lanche.
const BURGER = {
  name: 'Hambúrguer (monte o seu)',
  meta: 'pão, carne, queijo...',
  keywords: 'hamburguer lanche sanduiche x-burger x-salada x-bacon x-tudo smash burger',
};
// Na refeição livre, sem nada digitado, aparecem o hambúrguer, as junk foods e estas bebidas
// (refrigerante e cerveja, da TACO).
const FREE_MEAL_FOOD_IDS = [480, 474];

// O que acha cada grupo na busca: nome, palavras extras e os sabores.
const GROUP_HAYSTACK = new Map(
  JUNK_GROUPS.map((g) => [g.key, normalize([g.name, g.keywords, ...g.foods.map(flavorName)].join(' '))])
);

function matches(haystack: string, query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((w) => haystack.includes(w));
}

/** Texto ao lado do grupo na lista: "69 sabores", "300 a 700 ml". */
function groupMeta(group: JunkGroup) {
  if (group.sizes) {
    const amounts = group.sizes.map(([, n]) => n);
    const unit = group.sizeUnit === 'ml' ? 'ml' : 'g';
    return `${Math.min(...amounts)} a ${Math.max(...amounts)} ${unit}`;
  }
  return `${group.foods.length} sabores`;
}

const MAX_QUANTITY = 20;
const MAX_GRAMS = 5000;

type Props = {
  visible: boolean;
  onClose: () => void;
  day: string;
  /** Nome da refeição. */
  meal: string;
  /** Alimento já registrado, para corrigir a porção ou remover. */
  editing?: FoodLog | null;
};

/** O alimento de um registro (pela TACO; se não achar mais, refaz pelos valores guardados). */
function foodOf(log: FoodLog): Food {
  const food = getFood(log.foodId);
  if (food) return food;
  const per100 = (n: number) => (log.grams > 0 ? (n * 100) / log.grams : 0);
  return {
    id: log.foodId,
    name: log.foodName,
    group: 0,
    kcal: per100(log.kcal),
    protein: per100(log.protein),
    carbs: per100(log.carbs),
    fat: per100(log.fat),
  };
}

function previousDay(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function FoodSheet({ visible, onClose, day, meal, editing }: Props) {
  const { foodLogs, addFoodLog, updateFoodLog, deleteFoodLog } = useStore();
  const [query, setQuery] = useState('');
  const [food, setFood] = useState<Food | null>(null);
  const [unit, setUnit] = useState<PortionUnit>('colher');
  const [quantity, setQuantity] = useState(1);
  const [gramsText, setGramsText] = useState('100');
  // Montando um lanche (hambúrguer) em vez de escolher um alimento.
  const [building, setBuilding] = useState(false);
  // Busca de sabor (junk foods com sabores) e o tamanho escolhido (açaí, milkshake, pipoca, batata).
  const [flavorQuery, setFlavorQuery] = useState('');
  const [size, setSize] = useState(0);
  // Nome do último alimento adicionado (aparece como confirmação no topo da lista).
  const [added, setAdded] = useState<string | null>(null);

  // Toda vez que abre, começa do zero (ou no alimento que está sendo corrigido).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setQuery('');
      setBuilding(false);
      setAdded(null);
      if (editing) {
        const sizes = junkGroupOf(editing.foodId)?.sizes;
        setFood(foodOf(editing));
        setUnit(editing.unit);
        setFlavorQuery('');
        if (sizes) {
          // Tamanho: o maior que divide a quantidade certinho (ex.: 1000 ml = 2 copos de 500 ml).
          const fit = [...sizes].reverse().find(([, n]) => editing.quantity % n === 0)?.[1] ?? sizes[0][1];
          setSize(fit);
          setQuantity(Math.max(1, Math.round(editing.quantity / fit)));
        } else {
          setQuantity(editing.unit === 'gramas' ? 1 : editing.quantity);
          setGramsText(String(editing.unit === 'gramas' ? editing.quantity : 100));
        }
      } else {
        setFood(null);
        setUnit('colher');
        setQuantity(1);
        setGramsText('100');
      }
    }
  }

  const results = useMemo(() => searchFoods(query), [query]);

  // Recentes: os últimos alimentos diferentes que a pessoa registrou, com a última porção usada.
  const recents = useMemo(() => {
    const seen = new Set<number>();
    const list: FoodLog[] = [];
    for (const log of [...foodLogs].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))) {
      // O lanche montado não é um alimento da tabela: repete-se pela refeição de ontem.
      if (seen.has(log.foodId) || log.foodId === BURGER_FOOD_ID) continue;
      seen.add(log.foodId);
      list.push(log);
      if (list.length === 8) break;
    }
    return list;
  }, [foodLogs]);

  // Atalho: repetir a mesma refeição de ontem (só quando a de hoje ainda está vazia).
  const yesterday = useMemo(() => {
    const before = previousDay(day);
    const todayHas = foodLogs.some((l) => l.day === day && l.meal === meal);
    return todayHas ? [] : foodLogs.filter((l) => l.day === before && l.meal === meal);
  }, [foodLogs, day, meal]);

  const group = food ? junkGroupOf(food.id) : undefined;
  const sized = Boolean(group?.sizes);
  const grams = !food
    ? 0
    : sized
      ? size * quantity
      : unit === 'gramas'
        ? Math.min(MAX_GRAMS, Number(gramsText.replace(',', '.')) || 0)
        : quantity * gramsPerUnit(food, unit);
  const nutrition = food ? portionNutrition(food, grams) : null;
  const amount = sized ? size * quantity : unit === 'gramas' ? grams : quantity;
  const flavors = group ? searchFlavors(group, flavorQuery) : [];

  function pick(next: Food, from?: FoodLog) {
    setFood(next);
    const sizes = junkGroupOf(next.id)?.sizes;
    if (sizes) {
      // Copo/porção: o primeiro tamanho (ou o da última vez), 1 copo.
      const last = from ? sizes.find(([, n]) => from.quantity % n === 0)?.[1] : undefined;
      setUnit(unitsFor(next)[0]);
      setSize(last ?? sizes[0][1]);
      setQuantity(last && from ? Math.max(1, Math.round(from.quantity / last)) : 1);
      return;
    }
    // Com a última porção usada (recentes) ou, sem ela, 1 da primeira medida do alimento.
    if (from && unitsFor(next).includes(from.unit)) {
      setUnit(from.unit);
      if (from.unit === 'gramas') setGramsText(String(from.quantity));
      else setQuantity(from.quantity);
    } else {
      setUnit(unitsFor(next)[0]);
      setQuantity(1);
      setGramsText('100');
    }
  }

  function save() {
    if (!food || !nutrition || grams <= 0) return;
    const entry = {
      day,
      meal,
      foodId: food.id,
      foodName: food.name,
      unit,
      quantity: amount,
      grams: Math.round(grams * 10) / 10,
      ...nutrition,
    };
    if (editing) {
      updateFoodLog(editing.id, entry);
      onClose();
      return;
    }
    addFoodLog(entry);
    // Continua aberta para adicionar mais alimentos na mesma refeição (fecha no "Pronto").
    backToList(food.name);
  }

  /** Volta para a busca depois de adicionar, mostrando o que foi adicionado. */
  function backToList(name: string) {
    setAdded(name);
    setFood(null);
    setBuilding(false);
    setQuery('');
    setFlavorQuery('');
  }

  function repeatYesterday() {
    for (const { id: _id, updatedAt: _u, deleted: _d, ...log } of yesterday) addFoodLog({ ...log, day });
    backToList(`${yesterday.length} alimento${yesterday.length === 1 ? '' : 's'} de ontem`);
  }

  const yesterdayKcal = yesterday.reduce((sum, l) => sum + l.kcal, 0);

  function addBurger(
    burger: { name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number },
    friesGrams: number | null
  ) {
    addFoodLog({
      day,
      meal,
      foodId: BURGER_FOOD_ID,
      foodName: burger.name,
      unit: 'unidade',
      quantity: 1,
      grams: burger.grams,
      kcal: burger.kcal,
      protein: burger.protein,
      carbs: burger.carbs,
      fat: burger.fat,
    });
    const fries = getFood(FRIES_FOOD_ID);
    if (fries && friesGrams) {
      addFoodLog({
        day,
        meal,
        foodId: fries.id,
        foodName: fries.name,
        unit: 'gramas',
        quantity: friesGrams,
        grams: friesGrams,
        ...portionNutrition(fries, friesGrams),
      });
    }
    backToList(friesGrams ? 'Lanche e batata' : 'Lanche');
  }

  // O que já está nesta refeição (aparece na lista, com o total).
  const mealItems = foodLogs.filter((l) => l.day === day && l.meal === meal);
  const mealKcal = mealItems.reduce((sum, l) => sum + l.kcal, 0);

  const isBurger = editing?.foodId === BURGER_FOOD_ID;
  /** Abre um grupo de junk food: o sabor que estiver na busca ("pizza calabresa") já vem escolhido. */
  function openGroup(next: JunkGroup) {
    setFlavorQuery('');
    pick(searchFlavors(next, query)[0] ?? next.popular[0] ?? next.foods[0]);
  }

  const showBurger = matches(BURGER.keywords, query);
  const groups = JUNK_GROUPS.filter((g) => matches(GROUP_HAYSTACK.get(g.key)!, query));
  // Grupos que combinam pelo nome ("pizza", "açaí") vêm no topo; os que só têm um sabor com a palavra
  // ("frango" acha Pastel, Coxinha...) vêm depois dos alimentos, para não esconder o alimento buscado.
  const topGroups = groups.filter((g) => (matchScore(normalize(g.name), query) ?? 9) <= 2);
  const otherGroups = groups.filter((g) => !topGroups.includes(g));
  const freeMeal = isFreeMeal(meal);
  const freeMealFoods = FREE_MEAL_FOOD_IDS.map((id) => getFood(id)).filter((x): x is Food => Boolean(x));

  const burgerRow = (
    <Pressable key="burger" onPress={() => setBuilding(true)} style={styles.item} accessibilityRole="button">
      <Text style={styles.itemName} numberOfLines={1}>
        {BURGER.name}
      </Text>
      <Text style={styles.itemMeta}>{BURGER.meta}</Text>
    </Pressable>
  );
  const groupRow = (g: JunkGroup) => (
    <Pressable key={g.key} onPress={() => openGroup(g)} style={styles.item} accessibilityRole="button">
      <Text style={styles.itemName} numberOfLines={1}>
        {g.name}
      </Text>
      <Text style={styles.itemMeta}>{groupMeta(g)}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.header}>
            {(food || building) && !editing ? (
              <Pressable
                onPress={() => (building ? setBuilding(false) : setFood(null))}
                hitSlop={10}
                accessibilityLabel="Voltar">
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
            ) : (
              <View style={{ width: 24 }} />
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>
              {meal}
            </Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Fechar">
              <Ionicons name="close" size={26} color={colors.text} />
            </Pressable>
          </View>

          {isBurger && editing ? (
            // Lanche montado: mostra o que tem e deixa remover (para mudar, é só montar de novo).
            <View style={styles.portion}>
              <Text style={styles.foodName}>{editing.foodName}</Text>
              <View style={styles.result}>
                <Text style={styles.kcal}>{editing.kcal} kcal</Text>
                <View style={styles.macros}>
                  <Text style={styles.macro}>
                    <Text style={styles.macroValue}>{editing.protein} g</Text> proteína
                  </Text>
                  <Text style={styles.macro}>
                    <Text style={styles.macroValue}>{editing.carbs} g</Text> carboidrato
                  </Text>
                  <Text style={styles.macro}>
                    <Text style={styles.macroValue}>{editing.fat} g</Text> gordura
                  </Text>
                </View>
              </View>
              <Text style={styles.hint}>Para mudar o lanche, remova e monte de novo.</Text>
              <Button
                title="Remover"
                variant="danger"
                icon="trash-outline"
                onPress={() => {
                  deleteFoodLog(editing.id);
                  onClose();
                }}
              />
            </View>
          ) : building ? (
            <BurgerBuilder onAdd={addBurger} />
          ) : !food ? (
            <View style={{ flex: 1 }}>
              <View style={styles.search}>
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar alimento"
                  placeholderTextColor={colors.textFaint}
                  style={styles.searchInput}
                  autoFocus
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Limpar busca">
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>
              <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
                {added && (
                  <View style={styles.added}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    <Text style={styles.addedText} numberOfLines={1}>
                      {added} adicionado. Busque o próximo ou toque em Pronto.
                    </Text>
                  </View>
                )}
                {mealItems.length > 0 && query.trim() === '' && (
                  <View style={styles.plate}>
                    <View style={styles.plateTop}>
                      <Text style={styles.section}>Nesta refeição</Text>
                      <Text style={styles.plateTotal}>{Math.round(mealKcal)} kcal</Text>
                    </View>
                    {mealItems.map((item) => (
                      <View key={item.id} style={styles.plateRow}>
                        <Text style={styles.plateName} numberOfLines={1}>
                          {item.foodName}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {portionLabel(item.unit, item.quantity, item.foodId)} · {Math.round(item.kcal)}
                        </Text>
                        <Pressable
                          onPress={() => deleteFoodLog(item.id)}
                          hitSlop={8}
                          accessibilityLabel={`Remover ${item.foodName}`}>
                          <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
                {query.trim() === '' ? (
                  <>
                    {freeMeal && (
                      <>
                        <Text style={styles.section}>Mais pedidos na refeição livre</Text>
                        {burgerRow}
                        {JUNK_GROUPS.map(groupRow)}
                        {freeMealFoods.map((food) => (
                          <Pressable
                            key={food.id}
                            onPress={() => pick(food)}
                            style={styles.item}
                            accessibilityRole="button">
                            <Text style={styles.itemName} numberOfLines={1}>
                              {food.name}
                            </Text>
                            <Text style={styles.itemMeta}>{Math.round(food.kcal)} kcal</Text>
                          </Pressable>
                        ))}
                      </>
                    )}
                    {yesterday.length > 0 && (
                      <Pressable onPress={repeatYesterday} style={styles.repeat} accessibilityRole="button">
                        <Ionicons name="copy-outline" size={18} color={colors.primary} />
                        <Text style={styles.repeatText}>Repetir &quot;{meal}&quot; de ontem</Text>
                        <Text style={styles.itemMeta}>{Math.round(yesterdayKcal)} kcal</Text>
                      </Pressable>
                    )}
                    {recents.length > 0 ? (
                      <>
                        <Text style={styles.section}>Recentes</Text>
                        {recents.map((log) => (
                          <Pressable
                            key={log.foodId}
                            onPress={() => pick(foodOf(log), log)}
                            style={styles.item}
                            accessibilityRole="button">
                            <Text style={styles.itemName} numberOfLines={1}>
                              {log.foodName}
                            </Text>
                            <Text style={styles.itemMeta}>{portionLabel(log.unit, log.quantity, log.foodId)}</Text>
                          </Pressable>
                        ))}
                      </>
                    ) : (
                      yesterday.length === 0 &&
                      !freeMeal && (
                        <Text style={styles.hint}>Digite o nome do alimento, por exemplo: arroz, feijão, ovo.</Text>
                      )
                    )}
                  </>
                ) : results.length > 0 || groups.length > 0 || showBurger ? (
                  <>
                    {showBurger && burgerRow}
                    {topGroups.map(groupRow)}
                    {results.map((f) => (
                      <Pressable key={f.id} onPress={() => pick(f)} style={styles.item} accessibilityRole="button">
                        <Text style={styles.itemName} numberOfLines={2}>
                          {f.name}
                        </Text>
                        <Text style={styles.itemMeta}>{Math.round(f.kcal)} kcal</Text>
                      </Pressable>
                    ))}
                    {otherGroups.length > 0 && (
                      <>
                        <Text style={styles.section}>Também tem com esse sabor</Text>
                        {otherGroups.map(groupRow)}
                      </>
                    )}
                    <Text style={styles.hint}>Calorias por 100 g</Text>
                  </>
                ) : (
                  <Text style={styles.hint}>Nenhum alimento encontrado. Tente outra palavra.</Text>
                )}
                <Text style={styles.source}>Fonte: TACO – NEPA/Unicamp, 4ª edição</Text>
              </ScrollView>
              {mealItems.length > 0 && (
                <View style={styles.doneBar}>
                  <Button title={`Pronto · ${Math.round(mealKcal)} kcal`} icon="checkmark" onPress={onClose} />
                </View>
              )}
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.portion} keyboardShouldPersistTaps="handled">
              <Text style={styles.foodName}>{group ? group.name : food.name}</Text>

              {group && (
                <View style={{ gap: 8 }}>
                  <Text style={styles.section}>Sabor: {flavorName(food)}</Text>
                  {group.foods.length > 8 && (
                    <View style={styles.flavorSearch}>
                      <Ionicons name="search" size={16} color={colors.textMuted} />
                      <TextInput
                        value={flavorQuery}
                        onChangeText={setFlavorQuery}
                        placeholder={`Buscar entre ${group.foods.length} sabores`}
                        placeholderTextColor={colors.textFaint}
                        style={styles.flavorInput}
                        autoCorrect={false}
                      />
                    </View>
                  )}
                  {group.foods.length > 12 && flavorQuery.trim() === '' && (
                    <Text style={styles.flavorHint}>Mais pedidos</Text>
                  )}
                  <View style={styles.flavors}>
                    {(group.foods.length > 12 ? flavors : group.foods).map((p) => (
                      <Pressable
                        key={p.id}
                        onPress={() => setFood(p)}
                        style={[styles.flavor, p.id === food.id && styles.unitOn]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: p.id === food.id }}>
                        <Text style={[styles.flavorText, p.id === food.id && { color: colors.primaryText }]}>
                          {flavorName(p)}
                        </Text>
                      </Pressable>
                    ))}
                    {flavors.length === 0 && <Text style={styles.flavorHint}>Nenhum sabor com esse nome.</Text>}
                  </View>
                </View>
              )}

              {group?.sizes ? (
                <View style={{ gap: 8 }}>
                  <Text style={styles.section}>Tamanho</Text>
                  <View style={styles.flavors}>
                    {group.sizes.map(([label, n]) => (
                      <Pressable
                        key={label}
                        onPress={() => setSize(n)}
                        style={[styles.flavor, size === n && styles.unitOn]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: size === n }}>
                        <Text style={[styles.flavorText, size === n && { color: colors.primaryText }]}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.units}>
                  {unitsFor(food).map((u) => (
                    <Pressable
                      key={u}
                      onPress={() => setUnit(u)}
                      style={[styles.unit, unit === u && styles.unitOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: unit === u }}>
                      <Text style={[styles.unitText, unit === u && { color: colors.primaryText }]}>
                        {unitButtonLabel(food, u)}
                      </Text>
                      {u !== 'gramas' && (
                        <Text style={[styles.unitHint, unit === u && { color: colors.primaryText }]}>
                          ≈ {gramsPerUnit(food, u)} g
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {unit === 'gramas' && !sized ? (
                <View style={styles.gramsRow}>
                  <TextInput
                    value={gramsText}
                    onChangeText={(t) => setGramsText(t.replace(/[^\d,.]/g, ''))}
                    keyboardType="decimal-pad"
                    style={styles.gramsInput}
                    selectTextOnFocus
                    maxLength={6}
                    accessibilityLabel="Quantidade em gramas"
                  />
                  <Text style={styles.gramsUnit}>gramas</Text>
                </View>
              ) : (
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    style={[styles.round, quantity <= 1 && { opacity: 0.4 }]}
                    accessibilityLabel="Menos">
                    <Ionicons name="remove" size={24} color={colors.text} />
                  </Pressable>
                  <View style={{ alignItems: 'center', minWidth: 120 }}>
                    <Text style={styles.qty}>{quantity}</Text>
                    <Text style={styles.qtyLabel}>
                      {sized
                        ? `${group?.sizeUnit === 'ml' ? (quantity === 1 ? 'copo' : 'copos') : quantity === 1 ? 'porção' : 'porções'} (${grams} ${group?.sizeUnit === 'ml' ? 'ml' : 'g'})`
                        : `${portionLabel(unit, quantity, food.id).replace(/^\S+ /, '')} (${Math.round(grams)} g)`}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                    disabled={quantity >= MAX_QUANTITY}
                    style={[styles.round, quantity >= MAX_QUANTITY && { opacity: 0.4 }]}
                    accessibilityLabel="Mais">
                    <Ionicons name="add" size={24} color={colors.text} />
                  </Pressable>
                </View>
              )}

              {nutrition && (
                <View style={styles.result}>
                  <Text style={styles.kcal}>{nutrition.kcal} kcal</Text>
                  <View style={styles.macros}>
                    <Text style={styles.macro}>
                      <Text style={styles.macroValue}>{nutrition.protein} g</Text> proteína
                    </Text>
                    <Text style={styles.macro}>
                      <Text style={styles.macroValue}>{nutrition.carbs} g</Text> carboidrato
                    </Text>
                    <Text style={styles.macro}>
                      <Text style={styles.macroValue}>{nutrition.fat} g</Text> gordura
                    </Text>
                  </View>
                </View>
              )}

              <Button title={editing ? 'Salvar' : 'Adicionar'} onPress={save} disabled={grams <= 0} />
              {editing && (
                <Button
                  title="Remover"
                  variant="danger"
                  icon="trash-outline"
                  onPress={() => {
                    deleteFoodLog(editing.id);
                    onClose();
                  }}
                />
              )}
              <Text style={styles.source}>
                {isEstimatedFood(food)
                  ? 'Este alimento não está na TACO: os valores são uma estimativa do Gains Club.'
                  : 'Fonte: TACO – NEPA/Unicamp.'}{' '}
                As medidas caseiras são aproximadas.
              </Text>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: radius,
    backgroundColor: colors.card,
    ...outline,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 12 },
  list: { padding: 16, gap: 8, paddingBottom: 40 },
  section: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  itemName: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  itemMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 },
  repeat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  repeatText: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  flavors: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flavorSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  flavorInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 9 },
  flavorHint: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  flavor: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 2, borderColor: colors.border },
  flavorText: { color: colors.text, fontFamily: fonts.bold, fontSize: 13 },
  added: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addedText: { flex: 1, color: colors.primary, fontFamily: fonts.semibold, fontSize: 13 },
  plate: {
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  plateTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plateTotal: { color: colors.primary, fontFamily: fonts.bold, fontSize: 14 },
  plateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  plateName: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  doneBar: { padding: 16, borderTopWidth: 2, borderTopColor: colors.border, backgroundColor: colors.background },
  hint: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', marginTop: 8 },
  source: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', marginTop: 12 },
  portion: { padding: 16, gap: 18, paddingBottom: 40 },
  foodName: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  units: { flexDirection: 'row', gap: 8 },
  unit: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  unitOn: { backgroundColor: colors.primary, borderColor: outlineColor },
  unitText: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  unitHint: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  round: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: outlineColor,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { color: colors.text, fontFamily: fonts.display, fontSize: 48 },
  qtyLabel: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
  gramsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  gramsInput: {
    minWidth: 140,
    textAlign: 'center',
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 44,
    paddingVertical: 6,
    borderRadius: radius,
    backgroundColor: colors.card,
    ...outline,
  },
  gramsUnit: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 16 },
  result: {
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: radius,
    backgroundColor: colors.card,
    ...outline,
  },
  kcal: { color: colors.primary, fontFamily: fonts.display, fontSize: 40, letterSpacing: 0.5 },
  macros: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 },
  macro: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 },
  macroValue: { color: colors.text, fontFamily: fonts.bold },
});
