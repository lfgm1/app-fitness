// "Montar lanche": a pessoa escolhe o pão e quantas unidades de cada ingrediente, e o app soma as
// calorias na hora. A batata frita, se tiver, entra como um item separado da refeição.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui';
import { BURGER_GROUPS, FRIES_SIZES, burgerTotal, searchIngredients } from '@/lib/burger';
import type { Ingredient } from '@/lib/burger';
import { colors, fonts, outlineColor } from '@/theme';

const MAX = 6;

type Props = {
  /** Lanche pronto (e o tamanho da batata em gramas, se tiver). */
  onAdd: (burger: ReturnType<typeof burgerTotal>, friesGrams: number | null) => void;
};

export function BurgerBuilder({ onAdd }: Props) {
  // Começa com o básico: pão comum e 1 carne smash.
  const [counts, setCounts] = useState<Record<string, number>>({ pao: 1, smash: 1 });
  const [fries, setFries] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const found = searchIngredients(query);
  const breadIds = new Set(BURGER_GROUPS[0].items.map((item) => item.id));
  const total = burgerTotal(counts);

  function set(id: string, n: number) {
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, Math.min(MAX, n)) }));
  }

  // Só um pão por lanche.
  function pickBread(id: string | null) {
    setCounts((prev) => {
      const next = { ...prev };
      for (const bread of breadIds) next[bread] = bread === id ? 1 : 0;
      return next;
    });
  }

  const bread = [...breadIds].find((id) => counts[id]) ?? null;

  const stepper = (item: Ingredient) => {
    const n = counts[item.id] ?? 0;
    return (
      <View key={item.id} style={[styles.row, n > 0 && styles.rowOn]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.kcal} kcal / {item.unit[0]}
          </Text>
        </View>
        <Pressable
          onPress={() => set(item.id, n - 1)}
          disabled={n === 0}
          hitSlop={6}
          style={[styles.round, n === 0 && { opacity: 0.35 }]}
          accessibilityLabel={`Menos ${item.name}`}>
          <Ionicons name="remove" size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.count}>{n}</Text>
        <Pressable
          onPress={() => (breadIds.has(item.id) ? pickBread(item.id) : set(item.id, n + 1))}
          disabled={n >= MAX || (breadIds.has(item.id) && n >= 1)}
          hitSlop={6}
          style={[styles.round, (n >= MAX || (breadIds.has(item.id) && n >= 1)) && { opacity: 0.35 }]}
          accessibilityLabel={`Mais ${item.name}`}>
          <Ionicons name="add" size={18} color={colors.text} />
        </Pressable>
      </View>
    );
  };
  const friesKcal = fries ? Math.round((fries * 296) / 100) : 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Montar lanche</Text>
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar ingrediente (ex.: bacon, cheddar)"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Limpar busca">
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        {query.trim() !== '' && (
          <View style={{ gap: 8 }}>
            {found.map(stepper)}
            {found.length === 0 && <Text style={styles.note}>Nenhum ingrediente com esse nome.</Text>}
          </View>
        )}
        {query.trim() === '' &&
          BURGER_GROUPS.map((group) => (
            <View key={group.title} style={{ gap: 8 }}>
              <Text style={styles.section}>{group.title}</Text>
              {group.single ? (
                <View style={styles.chips}>
                  {[...group.items.map((item) => [item.id, item.name] as const), [null, 'Sem pão'] as const].map(
                    ([id, name]) => (
                      <Pressable
                        key={name}
                        onPress={() => pickBread(id)}
                        style={[styles.chip, bread === id && styles.chipOn]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: bread === id }}>
                        <Text style={[styles.chipText, bread === id && { color: colors.primaryText }]}>{name}</Text>
                      </Pressable>
                    )
                  )}
                </View>
              ) : (
                group.items.map(stepper)
              )}
            </View>
          ))}

        <View style={{ gap: 8 }}>
          <Text style={styles.section}>Batata frita</Text>
          <View style={styles.chips}>
            {[
              { label: 'Sem batata', grams: null },
              ...FRIES_SIZES.map(([size, grams]) => ({ label: `${size} (${grams} g)`, grams })),
            ].map(({ label, grams }) => {
              const on = fries === grams;
              return (
                <Pressable
                  key={label}
                  onPress={() => setFries(grams)}
                  style={[styles.chip, on && styles.chipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}>
                  <Text style={[styles.chipText, on && { color: colors.primaryText }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.note}>Valores estimados pelo Gains Club (não são da TACO).</Text>
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.total}>{total.kcal + friesKcal} kcal</Text>
          <Text style={styles.meta}>
            {total.protein} g prot · {total.carbs} g carb · {total.fat} g gord
            {fries ? ` · + batata ${friesKcal} kcal` : ''}
          </Text>
        </View>
        <Button title="Adicionar" onPress={() => onAdd(total, fries)} disabled={total.kcal === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  section: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 2, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: outlineColor },
  chipText: { color: colors.text, fontFamily: fonts.bold, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowOn: { borderColor: colors.primary },
  name: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  round: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: outlineColor,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { width: 22, textAlign: 'center', color: colors.text, fontFamily: fonts.display, fontSize: 22 },
  note: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 10 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  total: { color: colors.primary, fontFamily: fonts.display, fontSize: 30 },
});
