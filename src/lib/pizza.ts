// Sabores de pizza (aba Calorias). As calorias de cada fatia são calculadas pela composição:
// a massa com molho de uma fatia de pizza grande (8 fatias) + a cobertura de cada sabor.
// São estimativas do Gains Club (porções típicas de pizzaria), não da TACO.

import type { Food } from '@/lib/foods';

/** Peso de uma fatia de pizza grande, com a cobertura (para converter em "por 100 g"). */
export const SLICE_GRAMS = 110;
/** Pizzas ficam nos ids 9200 a 9399 (fora da TACO). */
export const FIRST_PIZZA_ID = 9200;
export const LAST_PIZZA_ID = 9399;

type Macro = [kcal: number, protein: number, carbs: number, fat: number];

// Massa + molho de tomate de uma fatia (≈ 65 g).
const BASE: Macro = [150, 5, 24, 3.5];
// Massa doce (sem molho de tomate).
const SWEET_BASE: Macro = [145, 4.5, 24, 3.2];

// Cobertura por fatia: quantidade típica de cada ingrediente numa fatia.
const T = {
  mussarela: [76, 5.4, 0.8, 5.8], // 25 g
  catupiry: [40, 1.4, 0.4, 3.6], // 15 g
  cheddar: [60, 3.5, 0.2, 5], // 15 g
  provolone: [35, 2.6, 0.2, 2.7], // 10 g
  gorgonzola: [35, 2.1, 0.1, 2.9], // 10 g
  parmesao: [22, 1.8, 0, 1.5], // 5 g
  creamCheese: [50, 0.9, 0.6, 5], // 15 g
  calabresa: [66, 3.2, 0.4, 5.8], // 20 g
  presunto: [16, 2.1, 0.3, 0.6], // 15 g
  ovo: [15, 1.3, 0.1, 1], // 10 g
  bacon: [50, 2.7, 0, 4.3], // 10 g
  pepperoni: [75, 3, 0.3, 6.8], // 15 g
  salame: [47, 2.7, 0.2, 4], // 12 g
  lombo: [35, 6, 0, 1.2], // 20 g
  peru: [18, 2.6, 0.5, 0.5], // 15 g
  frango: [33, 6.4, 0, 0.6], // 20 g, desfiado
  carneSeca: [63, 5.4, 0, 4.4], // 20 g
  carneMoida: [45, 4.4, 0, 3], // 20 g
  picanha: [70, 5, 0, 5.5], // 25 g
  salsicha: [50, 2.6, 0.5, 4], // 20 g
  strogonoffFrango: [45, 4, 1.5, 2.6], // 30 g
  strogonoffCarne: [55, 4, 1.5, 3.6], // 30 g
  atum: [25, 3.9, 0, 1], // 15 g
  camarao: [20, 4.2, 0, 0.3], // 20 g
  aliche: [10, 1.5, 0, 0.5], // 5 g
  batataPalha: [44, 0.5, 4, 2.9], // 8 g
  cebola: [4, 0.1, 0.9, 0], // 10 g
  azeitona: [7, 0, 0.2, 0.7], // 5 g
  tomate: [3, 0.1, 0.6, 0], // 15 g
  tomateSeco: [17, 0.8, 2.5, 0.6], // 8 g
  brocolis: [5, 0.4, 0.6, 0.1], // 15 g
  milho: [10, 0.3, 2, 0.1], // 10 g
  ervilha: [8, 0.5, 1.3, 0], // 10 g
  palmito: [4, 0.4, 0.6, 0.1], // 15 g
  champignon: [4, 0.4, 0.5, 0], // 15 g
  abobrinha: [3, 0.2, 0.5, 0], // 15 g
  berinjela: [4, 0.2, 0.9, 0], // 15 g
  pimentao: [2, 0.1, 0.4, 0], // 8 g
  escarola: [3, 0.2, 0.5, 0], // 20 g
  rucula: [1, 0.1, 0.1, 0], // 5 g
  alho: [15, 0.2, 1, 1.1], // 3 g, frito
  abacaxi: [10, 0.1, 2.5, 0], // 20 g
  // Doces
  chocolate: [135, 1.8, 15, 7.5], // 25 g
  brigadeiro: [100, 1.5, 16, 3.5], // 25 g
  avela: [135, 1.5, 14.5, 7.7], // 25 g, creme de avelã
  docedeleite: [63, 1.4, 11, 1.4], // 20 g
  leiteCondensado: [49, 1.2, 8.4, 1.3], // 15 g
  goiabada: [55, 0.1, 15, 0], // 20 g
  coco: [33, 0.3, 1, 3.2], // 5 g, ralado
  banana: [29, 0.4, 7.8, 0], // 30 g
  canela: [19, 0, 5, 0], // 5 g, com açúcar
  morango: [6, 0.1, 1.4, 0], // 20 g
  granulado: [20, 0.2, 3.5, 0.6], // 5 g
  confete: [49, 0.5, 7, 2], // 10 g
} satisfies Record<string, Macro>;

type Topping = keyof typeof T;
// [id, sabor, ingredientes (com quantas porções de cada, ex.: 'mussarela*1.5'), doce?]
type FlavorDef = [id: number, name: string, toppings: string, sweet?: boolean];

const FLAVORS: FlavorDef[] = [
  [9200, 'Mussarela', 'mussarela*1.6 tomate azeitona'],
  [9201, 'Margherita', 'mussarela*1.3 tomate*1.5 parmesao'],
  [9202, 'Calabresa', 'calabresa*1.5 cebola azeitona'],
  [9203, 'Calabresa com mussarela', 'calabresa mussarela cebola'],
  [9204, 'Toscana', 'calabresa mussarela*1.2 cebola'],
  [9205, 'Portuguesa', 'mussarela presunto ovo*1.5 cebola ervilha azeitona'],
  [9206, 'Frango com catupiry', 'frango*1.5 catupiry*1.5 mussarela*0.5'],
  [9207, 'Frango com cheddar', 'frango*1.5 cheddar*1.3'],
  [9208, 'Frango com bacon', 'frango*1.3 bacon mussarela*0.8'],
  [9209, 'Caipira', 'frango*1.3 milho catupiry mussarela*0.5'],
  [9210, 'Quatro queijos', 'mussarela catupiry provolone gorgonzola parmesao'],
  [9211, 'Cinco queijos', 'mussarela catupiry provolone gorgonzola parmesao cheddar*0.6'],
  [9212, 'Três queijos', 'mussarela catupiry provolone'],
  [9213, 'Provolone', 'mussarela*0.6 provolone*2 tomate'],
  [9214, 'Gorgonzola', 'mussarela*0.8 gorgonzola*2'],
  [9215, 'Catupiry', 'catupiry*2.5 mussarela*0.5'],
  [9216, 'Cheddar com bacon', 'cheddar*1.3 bacon*1.3 mussarela*0.5'],
  [9217, 'Bacon', 'bacon*1.6 mussarela tomate'],
  [9218, 'Pepperoni', 'pepperoni*1.3 mussarela'],
  [9219, 'Salame', 'salame*1.5 mussarela'],
  [9220, 'Napolitana', 'mussarela*1.2 tomate*1.5 parmesao alho'],
  [9221, 'Baiana', 'calabresa*1.2 mussarela ovo cebola pimentao'],
  [9222, 'Atum', 'atum*1.5 cebola azeitona'],
  [9223, 'Atum com mussarela', 'atum*1.3 mussarela cebola'],
  [9224, 'Aliche', 'aliche*2 mussarela tomate'],
  [9225, 'Brócolis', 'brocolis*2 mussarela alho'],
  [9226, 'Brócolis com bacon', 'brocolis*1.5 bacon mussarela'],
  [9227, 'Milho', 'milho*2 mussarela'],
  [9228, 'Palmito', 'palmito*2 mussarela'],
  [9229, 'Champignon', 'champignon*2 mussarela'],
  [9230, 'Escarola', 'escarola*2 mussarela alho'],
  [9231, 'Abobrinha', 'abobrinha*2 mussarela parmesao'],
  [9232, 'Berinjela', 'berinjela*2 mussarela parmesao'],
  [9233, 'Vegetariana', 'mussarela brocolis milho palmito champignon tomate'],
  [9234, 'Rúcula com tomate seco', 'mussarela rucula tomateSeco*1.5'],
  [9235, 'Alho e óleo', 'mussarela alho*2 parmesao'],
  [9236, 'Lombo', 'lombo*1.5 mussarela cebola'],
  [9237, 'Lombo com catupiry', 'lombo*1.3 catupiry*1.3 mussarela*0.5'],
  [9238, 'Peito de peru', 'peru*1.5 mussarela'],
  [9239, 'Peito de peru com catupiry', 'peru*1.3 catupiry*1.3 mussarela*0.5'],
  [9240, 'Carne seca com catupiry', 'carneSeca*1.3 catupiry*1.3 cebola'],
  [9241, 'Strogonoff de frango', 'strogonoffFrango*1.5 mussarela batataPalha'],
  [9242, 'Strogonoff de carne', 'strogonoffCarne*1.5 mussarela batataPalha'],
  [9243, 'Camarão', 'camarao*1.5 mussarela catupiry*0.5'],
  [9244, 'Mexicana', 'carneMoida*1.5 mussarela pimentao cebola'],
  [9245, 'Picanha', 'picanha*1.3 mussarela cebola'],
  [9246, 'Hot dog', 'salsicha*1.5 mussarela batataPalha milho'],
  [9247, 'Siciliana', 'champignon bacon mussarela'],
  [9248, 'Americana', 'presunto bacon ovo mussarela'],
  [9249, 'Paulista', 'presunto ervilha ovo mussarela'],
  [9250, 'Moda da casa', 'mussarela presunto calabresa*0.8 bacon*0.8 ovo cebola'],
  [9251, 'Frango com milho', 'frango*1.5 milho mussarela'],
  [9252, 'Havaiana', 'presunto mussarela abacaxi*1.5'],
  [9253, 'Frango com batata palha', 'frango*1.5 catupiry batataPalha*1.3'],
  // Doces
  [9300, 'Chocolate', 'chocolate*1.2 granulado', true],
  [9301, 'Chocolate com morango', 'chocolate morango*1.5', true],
  [9302, 'Sensação', 'chocolate morango*1.5 leiteCondensado*0.5', true],
  [9303, 'Brigadeiro', 'brigadeiro*1.2 granulado', true],
  [9304, 'Prestígio', 'chocolate coco*2', true],
  [9305, 'Beijinho', 'leiteCondensado*1.5 coco*2', true],
  [9306, 'Banana com canela', 'banana*1.5 canela mussarela*0.5', true],
  [9307, 'Romeu e Julieta', 'mussarela goiabada*1.3', true],
  [9308, 'Doce de leite', 'docedeleite*1.5', true],
  [9309, 'Doce de leite com banana', 'docedeleite banana', true],
  [9310, 'Creme de avelã', 'avela*1.2', true],
  [9311, 'Creme de avelã com morango', 'avela morango*1.5', true],
  [9312, 'Confete', 'chocolate confete', true],
  [9313, 'Chocolate branco', 'chocolate*1.2', true],
  [9314, 'Chocolate com banana', 'chocolate banana', true],
];

// Os sabores mais pedidos aparecem primeiro, antes de buscar.
export const POPULAR_PIZZA_IDS = [9200, 9202, 9205, 9206, 9201, 9210, 9218, 9217, 9300, 9301, 9306, 9307];

function flavorMacro([, , toppings, sweet]: FlavorDef): Macro {
  const total: Macro = [...(sweet ? SWEET_BASE : BASE)];
  for (const part of toppings.split(' ')) {
    const [key, times] = part.split('*');
    const macro = T[key as Topping];
    if (!macro) throw new Error(`Ingrediente de pizza desconhecido: ${key}`);
    const k = times ? Number(times) : 1;
    for (let i = 0; i < 4; i++) total[i] += macro[i] * k;
  }
  return total;
}

const per100 = (n: number) => Math.round((n * 1000) / SLICE_GRAMS) / 10;

/** Nome do sabor ("Calabresa", "Romeu e Julieta") pelo id. */
export const PIZZA_FLAVOR_NAMES = new Map(FLAVORS.map(([id, name]) => [id, name]));

// "Pizza de calabresa" (minúscula), menos nomes próprios como Romeu e Julieta.
const lowerFirst = (name: string) => (name.startsWith('Romeu') ? name : name.charAt(0).toLowerCase() + name.slice(1));

/** Os sabores como alimentos (valores por 100 g, para a conta funcionar igual aos outros). */
export const PIZZA_FOODS: Food[] = FLAVORS.map((def) => {
  const [kcal, protein, carbs, fat] = flavorMacro(def);
  return {
    id: def[0],
    name: `Pizza de ${lowerFirst(def[1])}`,
    group: 13,
    kcal: per100(kcal),
    protein: per100(protein),
    carbs: per100(carbs),
    fat: per100(fat),
  };
});
