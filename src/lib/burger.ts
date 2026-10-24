// "Montar lanche" (aba Calorias): os ingredientes de um hambúrguer, com calorias e macros por
// unidade. São estimativas do Gains Club (lanchonetes e rótulos comuns), não da TACO.

import { FIRST_EXTRA_FOOD_ID } from '@/data/foods';

/** Id do lanche montado nos registros (não é um alimento da tabela). */
export const BURGER_FOOD_ID = FIRST_EXTRA_FOOD_ID + 99;
/** Batata frita de lanchonete (está na tabela de alimentos, por 100 g). */
export const FRIES_FOOD_ID = 9020;

export type Ingredient = {
  id: string;
  name: string;
  /** Como a quantidade aparece: "fatia", "colher"... */
  unit: [singular: string, plural: string];
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Nome curto para o nome do lanche ("2 smash"). */
  short: string;
};

export type IngredientGroup = { title: string; single?: boolean; items: Ingredient[] };

const i = (
  id: string,
  name: string,
  short: string,
  unit: [string, string],
  grams: number,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number
): Ingredient => ({ id, name, short, unit, grams, kcal, protein, carbs, fat });

export const BURGER_GROUPS: IngredientGroup[] = [
  {
    title: 'Pão',
    single: true,
    items: [
      i('pao', 'Pão de hambúrguer', 'pão comum', ['pão', 'pães'], 60, 170, 5.5, 30, 2.8),
      i('brioche', 'Pão brioche', 'brioche', ['pão', 'pães'], 70, 230, 6, 33, 8),
      i('australiano', 'Pão australiano', 'pão australiano', ['pão', 'pães'], 70, 200, 6, 37, 3),
      i('batata', 'Pão de batata', 'pão de batata', ['pão', 'pães'], 65, 190, 5, 33, 4),
      i('integral', 'Pão integral', 'pão integral', ['pão', 'pães'], 60, 155, 6, 27, 2.5),
      i('frances', 'Pão francês', 'pão francês', ['pão', 'pães'], 50, 150, 4, 29, 1.6),
      i('forma', 'Pão de forma (2 fatias)', 'pão de forma', ['pão', 'pães'], 50, 125, 4, 24, 1.5),
      i('ciabatta', 'Ciabatta', 'ciabatta', ['pão', 'pães'], 80, 210, 7, 40, 2.5),
      i('wrap', 'Wrap / tortilha', 'wrap', ['wrap', 'wraps'], 60, 180, 5, 30, 4.5),
      i('pita', 'Pão sírio', 'pão sírio', ['pão', 'pães'], 60, 165, 5.5, 33, 0.7),
    ],
  },
  {
    title: 'Carne',
    items: [
      i('smash', 'Smash (fina, 90 g)', 'smash', ['carne', 'carnes'], 70, 200, 15, 0, 15),
      i('blend120', 'Blend (120 g)', 'blend 120 g', ['carne', 'carnes'], 90, 270, 20, 0, 21),
      i('artesanal', 'Artesanal (150 g)', 'artesanal', ['carne', 'carnes'], 110, 350, 28, 0, 26),
      i('artesanal180', 'Artesanal (180 g)', 'artesanal 180 g', ['carne', 'carnes'], 135, 420, 33, 0, 31),
      i('costela', 'Costela (150 g)', 'costela', ['carne', 'carnes'], 110, 390, 26, 0, 31),
      i('picanha', 'Picanha (150 g)', 'picanha', ['carne', 'carnes'], 110, 380, 29, 0, 29),
      i('frango', 'Frango grelhado', 'frango grelhado', ['filé', 'filés'], 120, 190, 38, 0, 3),
      i('empanado', 'Frango empanado', 'frango empanado', ['filé', 'filés'], 120, 300, 18, 18, 17),
      i('crispy', 'Frango crispy', 'frango crispy', ['filé', 'filés'], 120, 330, 19, 22, 18),
      i('peixe', 'Peixe empanado', 'peixe empanado', ['filé', 'filés'], 100, 230, 12, 20, 11),
      i('pulled', 'Pulled pork', 'pulled pork', ['porção', 'porções'], 80, 160, 14, 5, 9),
      i('vegetal', 'Hambúrguer vegetal', 'vegetal', ['carne', 'carnes'], 113, 230, 20, 7, 14),
      i('salsicha', 'Salsicha', 'salsicha', ['salsicha', 'salsichas'], 50, 125, 6.5, 1.5, 10.5),
      i('calabresa', 'Calabresa', 'calabresa', ['porção', 'porções'], 30, 100, 4.8, 0.6, 8.7),
      i('frangoDesfiado', 'Frango desfiado', 'frango desfiado', ['porção', 'porções'], 50, 85, 16, 0, 2),
      i('carneMoida', 'Carne moída', 'carne moída', ['porção', 'porções'], 50, 110, 11, 0, 7),
    ],
  },
  {
    title: 'Queijo',
    items: [
      i('cheddar', 'Cheddar', 'cheddar', ['fatia', 'fatias'], 20, 75, 4, 0.5, 6),
      i('cheddarCremoso', 'Cheddar cremoso', 'cheddar cremoso', ['colher', 'colheres'], 30, 90, 3, 2, 8),
      i('mussarela', 'Mussarela', 'mussarela', ['fatia', 'fatias'], 20, 70, 4.5, 0.6, 5.5),
      i('prato', 'Queijo prato', 'prato', ['fatia', 'fatias'], 20, 72, 4.6, 0.4, 5.8),
      i('provolone', 'Provolone', 'provolone', ['fatia', 'fatias'], 20, 70, 5, 0.4, 5.3),
      i('gorgonzola', 'Gorgonzola', 'gorgonzola', ['porção', 'porções'], 20, 70, 4.2, 0.2, 5.8),
      i('parmesao', 'Parmesão', 'parmesão', ['colher', 'colheres'], 10, 44, 3.6, 0, 3),
      i('catupiry', 'Catupiry / requeijão', 'catupiry', ['colher', 'colheres'], 30, 80, 2.7, 0.9, 7.2),
      i('creamCheese', 'Cream cheese', 'cream cheese', ['colher', 'colheres'], 20, 66, 1.2, 0.8, 6.6),
      i('coalho', 'Queijo coalho', 'coalho', ['fatia', 'fatias'], 30, 95, 7, 0.5, 7),
      i('brie', 'Brie', 'brie', ['fatia', 'fatias'], 20, 67, 4, 0.1, 5.6),
      i('empanadoQueijo', 'Queijo empanado', 'queijo empanado', ['unidade', 'unidades'], 40, 150, 6, 9, 10),
    ],
  },
  {
    title: 'Extras',
    items: [
      i('bacon', 'Bacon', 'bacon', ['fatia', 'fatias'], 8, 40, 2.5, 0, 3.3),
      i('baconCubos', 'Bacon em cubos', 'bacon em cubos', ['colher', 'colheres'], 15, 75, 4, 0, 6.5),
      i('ovo', 'Ovo', 'ovo', ['ovo', 'ovos'], 50, 90, 6.7, 0.3, 6.8),
      i('presunto', 'Presunto', 'presunto', ['fatia', 'fatias'], 15, 16, 2.1, 0.3, 0.6),
      i('pepperoni', 'Pepperoni', 'pepperoni', ['porção', 'porções'], 15, 75, 3, 0.3, 6.8),
      i('cebolaCaramelizada', 'Cebola caramelizada', 'cebola caramelizada', ['porção', 'porções'], 30, 45, 0.5, 6, 2),
      i('cebolaCrispy', 'Cebola crispy', 'cebola crispy', ['porção', 'porções'], 15, 80, 1, 7, 5.5),
      i('cebolaRoxa', 'Cebola roxa', 'cebola roxa', ['porção', 'porções'], 15, 6, 0.2, 1.4, 0),
      i('onion', 'Onion rings', 'onion rings', ['porção', 'porções'], 50, 205, 2.5, 22, 12),
      i('alface', 'Alface', 'alface', ['porção', 'porções'], 15, 2, 0.2, 0.3, 0),
      i('tomate', 'Tomate', 'tomate', ['fatia', 'fatias'], 20, 4, 0.2, 0.8, 0),
      i('picles', 'Picles', 'picles', ['porção', 'porções'], 15, 2, 0.1, 0.4, 0),
      i('jalapeno', 'Jalapeño', 'jalapeño', ['porção', 'porções'], 10, 3, 0.1, 0.6, 0),
      i('champignon', 'Champignon / cogumelos', 'cogumelos', ['porção', 'porções'], 20, 6, 0.6, 0.6, 0.1),
      i('abacaxi', 'Abacaxi grelhado', 'abacaxi', ['fatia', 'fatias'], 40, 20, 0.2, 5, 0),
      i('rucula', 'Rúcula', 'rúcula', ['porção', 'porções'], 10, 2, 0.3, 0.2, 0),
      i('milho', 'Milho', 'milho', ['colher', 'colheres'], 20, 20, 0.6, 4, 0.3),
      i('ervilha', 'Ervilha', 'ervilha', ['colher', 'colheres'], 20, 16, 1, 2.6, 0),
      i('batataPalha', 'Batata palha', 'batata palha', ['porção', 'porções'], 10, 55, 0.6, 5, 3.6),
      i('pure', 'Purê de batata', 'purê', ['colher', 'colheres'], 40, 45, 0.8, 6, 2),
      i('vinagrete', 'Vinagrete', 'vinagrete', ['colher', 'colheres'], 20, 8, 0.2, 1.2, 0.3),
      i('guacamole', 'Guacamole', 'guacamole', ['colher', 'colheres'], 30, 50, 0.6, 2.6, 4.5),
      i('azeitona', 'Azeitona', 'azeitona', ['porção', 'porções'], 10, 14, 0.1, 0.4, 1.4),
    ],
  },
  {
    title: 'Molhos',
    items: [
      i('maionese', 'Maionese', 'maionese', ['colher', 'colheres'], 15, 100, 0.2, 0.5, 11),
      i('molhoCasa', 'Molho especial / da casa', 'molho da casa', ['colher', 'colheres'], 15, 80, 0.2, 2, 8),
      i('maioneseAlho', 'Maionese de alho / verde', 'maionese de alho', ['colher', 'colheres'], 15, 95, 0.2, 0.6, 10.4),
      i('ketchup', 'Ketchup', 'ketchup', ['colher', 'colheres'], 15, 17, 0.2, 4, 0),
      i('mostarda', 'Mostarda', 'mostarda', ['colher', 'colheres'], 15, 10, 0.6, 0.9, 0.5),
      i('mostardaMel', 'Mostarda e mel', 'mostarda e mel', ['colher', 'colheres'], 15, 45, 0.2, 5, 2.8),
      i('barbecue', 'Barbecue', 'barbecue', ['colher', 'colheres'], 15, 25, 0, 6, 0),
      i('tartaro', 'Molho tártaro', 'tártaro', ['colher', 'colheres'], 15, 75, 0.1, 1, 8),
      i('pimenta', 'Molho de pimenta / sriracha', 'pimenta', ['colher', 'colheres'], 10, 9, 0.2, 1.8, 0.1),
      i('geleiaPimenta', 'Geleia de pimenta', 'geleia de pimenta', ['colher', 'colheres'], 15, 40, 0, 10, 0),
      i('molhoTomate', 'Molho de tomate', 'molho de tomate', ['colher', 'colheres'], 15, 6, 0.2, 1.2, 0),
      i('cheddarMolho', 'Molho cheddar', 'molho cheddar', ['colher', 'colheres'], 20, 50, 1, 2, 4.2),
    ],
  },
];

export const ALL_INGREDIENTS = BURGER_GROUPS.flatMap((g) => g.items);

const plain = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Busca de ingrediente (sem acento), em todos os grupos. */
export function searchIngredients(query: string) {
  const words = plain(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return ALL_INGREDIENTS.filter((item) => words.every((w) => plain(item.name).includes(w)));
}

/** Batata frita: tamanho da porção em gramas. */
export const FRIES_SIZES: [label: string, grams: number][] = [
  ['P', 80],
  ['M', 115],
  ['G', 160],
];

/** Soma o lanche: calorias, macros, peso e o nome ("Lanche (brioche, 2 smash, 2 cheddar)"). */
export function burgerTotal(counts: Record<string, number>) {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let grams = 0;
  const parts: string[] = [];
  for (const item of ALL_INGREDIENTS) {
    const n = counts[item.id] ?? 0;
    if (n <= 0) continue;
    kcal += item.kcal * n;
    protein += item.protein * n;
    carbs += item.carbs * n;
    fat += item.fat * n;
    grams += item.grams * n;
    parts.push(n > 1 ? `${n} ${item.short}` : item.short);
  }
  const name = parts.length > 0 ? `Lanche (${parts.join(', ')})` : 'Lanche';
  return {
    name: name.length > 120 ? name.slice(0, 117) + '...' : name,
    grams: Math.round(grams),
    kcal: Math.round(kcal),
    protein: round1(protein),
    carbs: round1(carbs),
    fat: round1(fat),
  };
}
