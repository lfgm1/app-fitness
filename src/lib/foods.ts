// Alimentos da TACO (e as junk foods de src/lib/junkFoods.ts): busca (sem precisar de acento) e porções.
// A maioria vai em colher, concha ou gramas; os que se contam (ovo, pão, fruta, fatia de queijo, copo de
// leite...) vão por unidade ou gramas; e alguns por tamanho de copo/porção (açaí em ml, pipoca em g).

import { COMMON_FOOD_IDS, FIRST_EXTRA_FOOD_ID, FOOD_ALIASES, FOOD_ROWS } from '@/data/foods';
import { JUNK_FOODS, flavorName, junkGroupOf } from '@/lib/junkFoods';
import { PIZZA_FOODS } from '@/lib/pizza';

export type Food = {
  id: number;
  name: string;
  group: number;
  /** Valores por 100 g. */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type PortionUnit = 'colher' | 'concha' | 'unidade' | 'gramas' | 'ml';

const UNIT_LABELS: Record<Exclude<PortionUnit, 'unidade'>, [singular: string, plural: string]> = {
  colher: ['colher', 'colheres'],
  concha: ['concha', 'conchas'],
  gramas: ['g', 'g'],
  ml: ['ml', 'ml'],
};

export const FOODS: Food[] = [
  ...FOOD_ROWS.map(([id, name, group, kcal, protein, carbs, fat]) => ({
    id,
    name,
    group,
    kcal,
    protein,
    carbs,
    fat,
  })),
  ...PIZZA_FOODS,
  ...JUNK_FOODS,
];

const BY_ID = new Map(FOODS.map((f) => [f.id, f]));

export function getFood(id: number) {
  return BY_ID.get(id);
}

/** Busca de sabor dentro de um grupo de junk food; sem nada digitado, os mais pedidos. */
export function searchFlavors(group: { name: string; foods: Food[]; popular: Food[] }, query: string) {
  const skip = new Set([...normalize(group.name).split(/\W+/), 'de', 'com']);
  const words = normalize(query)
    .split(/\s+/)
    .filter((w) => w && !skip.has(w));
  if (words.length === 0) return group.popular;
  return group.foods.filter((f) => words.every((w) => normalize(flavorName(f)).includes(w)));
}

/** O alimento não é da TACO: os valores são uma estimativa do Gains Club. */
export function isEstimatedFood(food: Food) {
  return food.id >= FIRST_EXTRA_FOOD_ID;
}

/** "Feijão" -> "feijao": minúsculas e sem acento, para a busca. */
export function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

const NORMALIZED = new Map(FOODS.map((f) => [f.id, normalize(f.name)]));
const ALIASES = new Map(Object.entries(FOOD_ALIASES).map(([id, words]) => [Number(id), normalize(words)]));
const COMMON = new Set(COMMON_FOOD_IDS);
// Preparados (cozido, grelhado...) aparecem antes dos crus, que quase ninguém come.
const RAW = /\bcru(a|s|as)?\b/;

/**
 * Quão bem o nome (ou um apelido) combina com a busca; menor é melhor, null se não combina.
 * 0: igual; 1: começa com a busca; 2: todas as palavras começam palavras do nome; 3: aparecem no meio.
 */
export function matchScore(text: string, query: string): number | null {
  const q = normalize(query);
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length === 0 || !words.every((w) => text.includes(w))) return null;
  if (text === q) return 0;
  if (text.startsWith(q)) return 1;
  const textWords = text.split(/[\s-]+/);
  if (words.every((w) => textWords.some((t) => t.startsWith(w)))) return 2;
  return 3;
}

/** Busca por palavras (todas precisam aparecer no nome ou num apelido), com os mais prováveis primeiro. */
export function searchFoods(query: string, limit = 40): Food[] {
  const scored: { food: Food; score: number }[] = [];
  for (const food of FOODS) {
    // Junk foods com sabores aparecem como um item só (Pizza, Cookie...), não um por sabor.
    if (junkGroupOf(food.id)) continue;
    const name = NORMALIZED.get(food.id)!;
    const byName = matchScore(name, query);
    const alias = ALIASES.get(food.id);
    // Apelido conta quase como o nome ("filé de frango" acha o peito grelhado).
    const byAlias = alias ? matchScore(alias, query) : null;
    if (byName === null && byAlias === null) continue;
    let score = Math.min(byName ?? 9, byAlias === null ? 9 : byAlias + 0.5);
    if (RAW.test(name)) score += 0.6;
    if (COMMON.has(food.id)) score -= 1.2;
    score += name.length / 200;
    scored.push({ food, score });
  }
  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => s.food);
}

// Medidas de cada alimento. Cada um tem só as medidas que fazem sentido para ele:
// - por unidade (com o nome certo: ovo, fatia, filé, bife, copo...) e gramas — o que se conta;
// - colher, concha e gramas — só o que vai na concha (feijão, estrogonofe, caldos, mingau...);
// - só gramas — carne e peixe crus, frango inteiro, massa crua (ninguém mede isso em colher);
// - colher e gramas — o resto (arroz, farinha, açúcar, óleo, legumes cozidos, castanhas...).
// As regras usam o nome sem acento e em minúsculas. O primeiro que combinar vale.
// Pesos aproximados de medidas caseiras; a tela sempre mostra o peso usado.

// Peso de 1 colher de sopa cheia (ou de servir, no caso de arroz e pratos) e de 1 concha média.
const SPOON_DEFAULT = 20;
const LADLE_DEFAULT = 100;
const SPOON_RULES: [RegExp, number][] = [
  [/\b(azeite|oleo)\b/, 8],
  [/\b(manteiga|margarina|maionese|requeijao)\b/, 10],
  [/\b(acucar|achocolatado|farinha|farofa|aveia|granola|po\b|ralado|parmesao|fermento|gelatina|capuccino|cafe po)/, 12],
  [/\b(mel|geleia|doce de leite|creme de leite|leite condensado|melado|glicose)\b/, 15],
  [/\b(amendoim|amendoa|castanha-de-caju|gergelim|linhaca)\b/, 15],
  [/\b(arroz|carreteiro|baiao|estrogonofe|feijoada|tropeiro|carne seca|charque|acem|moido)\b/, 25],
];

// Vai na concha (além da colher).
const LADLE =
  /^(feijao (?!broto).*cozido|estrogonofe|feijoada|vatapa|dobradinha|sarapatel|manicoba|quibebe|vaca atolada|tacaca|tucupi|cuxa|camarao a baiana|canjica com leite|caldo de cana|macarrao molho|frango com acafrao|seleta|lentilha cozida)/;

// Só em gramas.
const GRAMS_ONLY =
  /(\b(cru|crua|crus|cruas)$|^frango inteiro|^frango caipira|^massa|^pastel massa|^lasanha|^macarrao trigo|^toucinho cru|^tremoco cru|^guandu|^grao-de-bico cru|^fecula|^polvilho|^milho amido|^creme de (arroz|milho) po|^farinha de mesocarpo)/;
// Mas estes, mesmo crus, se contam ou vão por colher (frutas, folhas, legumes de salada...).
const RAW_OK =
  /^(ovo|tomate|cebola|cenoura crua|pepino|pimentao|rabanete|repolho|cebolinha|salsa|manjericao|alfavaca|agriao|rucula|alface|acelga|almeirao|chicoria|couve|espinafre|mostarda folha|serralha|taioba|catalonha|caruru|aipo|alho|jilo|maxixe|quiabo|vagem|nabo|jurubeba|brocolis cru|couve-flor crua|abobrinha .*crua|beterraba crua|feijao broto|milho verde cru|castanha-do-brasil|noz crua|coco|amendoim grao|pinha|figo|ameixa|cacau|caju|abiu|atemoia|caja-manga|jambo|jamelao|macauba|pequi|tucuma|umbu)/;

// Alimentos que se contam: [regra, peso de 1 unidade (g), nome no singular, no plural].
type CountRule = [RegExp, grams: number, singular: string, plural: string];
const COUNT_RULES: CountRule[] = [
  // Ovos
  [/^ovo de codorna/, 10, 'ovo', 'ovos'],
  [/^clara de ovo/, 30, 'clara', 'claras'],
  [/^gema de ovo/, 17, 'gema', 'gemas'],
  [/^ovo (cozido|cru|frito|na frigideira)/, 50, 'ovo', 'ovos'],
  [/^omelete/, 100, 'omelete', 'omeletes'],
  // Pães, massas e salgados
  [/^pao (frances|trigo sovado)/, 50, 'pão', 'pães'],
  [/^pao de queijo/, 30, 'pão de queijo', 'pães de queijo'],
  [/^pao (de forma|aveia|gluten|milho|de soja)/, 25, 'fatia', 'fatias'],
  [/^torrada/, 8, 'torrada', 'torradas'],
  [/^biscoito/, 6, 'biscoito', 'biscoitos'],
  [/^bolo pronto/, 60, 'fatia', 'fatias'],
  [/^tapioca/, 100, 'tapioca', 'tapiocas'],
  [/^(pastel de (carne|queijo) frito|coxinha|quibe (assado|frito)|empada)/, 80, 'unidade', 'unidades'],
  [/^croquete de carne frito/, 30, 'croquete', 'croquetes'],
  [/^bolinho de arroz/, 30, 'bolinho', 'bolinhos'],
  [/^acaraje/, 140, 'acarajé', 'acarajés'],
  [/^charuto de repolho/, 80, 'charuto', 'charutos'],
  [/^bife a cavalo/, 250, 'prato', 'pratos'],
  [/^pamonha/, 150, 'pamonha', 'pamonhas'],
  [/^macarrao instantaneo/, 80, 'pacote', 'pacotes'],
  [/^polenta/, 80, 'pedaço', 'pedaços'],
  [/^cuscuz de milho/, 100, 'fatia', 'fatias'],
  [/^pipoca/, 10, 'xícara', 'xícaras'],
  // Carnes
  [/^hamburguer bovino/, 90, 'hambúrguer', 'hambúrgueres'],
  [/^almondegas de carne fritas/, 25, 'almôndega', 'almôndegas'],
  [/^(peito|file) de frango/, 120, 'filé', 'filés'],
  [/^coxa de frango/, 90, 'coxa', 'coxas'],
  [/^sobrecoxa de frango/, 110, 'sobrecoxa', 'sobrecoxas'],
  [/^asa de frango/, 40, 'asa', 'asas'],
  [/^coracao de frango grelhado/, 6, 'coração', 'corações'],
  [
    /^(contra-file|patinho|miolo de alcatra|file mignon|maminha|coxao mole|picanha|fraldinha|capa de contra-file)/,
    120,
    'bife',
    'bifes',
  ],
  [/^figado de (boi|frango) grelhado/, 100, 'bife', 'bifes'],
  [/^bisteca de porco/, 120, 'bisteca', 'bistecas'],
  [/^(lombo|pernil) de porco assado|^(cupim|lagarto) (assado|cozido)/, 50, 'fatia', 'fatias'],
  [/^peru assado/, 30, 'fatia', 'fatias'],
  [/^costela (de porco )?assada/, 100, 'pedaço', 'pedaços'],
  [/^linguica .*(frita|grelhada)/, 60, 'gomo', 'gomos'],
  [/^(presunto|mortadela|salame|apresuntado)/, 15, 'fatia', 'fatias'],
  // Peixes
  [/^file de (merluza|pescada|abadejo|tucunare|salmao)|^salmao sem pele grelhado/, 120, 'filé', 'filés'],
  [/^(cacao posta|pintado|corvina grande|corimbata|pescada branca frita)/, 120, 'posta', 'postas'],
  [/^sardinha (assada|frita)/, 40, 'sardinha', 'sardinhas'],
  [/^(atum|sardinha) conserva/, 120, 'lata', 'latas'],
  [/^camarao rio grande grande cozido/, 20, 'camarão', 'camarões'],
  // Queijos e laticínios
  [/^queijo (minas|mussarela|prato|pasteurizado)/, 20, 'fatia', 'fatias'],
  [/^queijo petit suisse/, 45, 'pote', 'potes'],
  [/^leite fermentado/, 80, 'frasco', 'frascos'],
  [/^(iogurte|bebida lactea)/, 170, 'pote', 'potes'],
  [/^soja queijo/, 30, 'fatia', 'fatias'],
  // Frutas
  [/^banana (prata|nanica|maca|ouro|da terra|figo|pacova)$/, 70, 'banana', 'bananas'],
  [/^maca (fuji|argentina)/, 130, 'maçã', 'maçãs'],
  [/^laranja (baia|da terra|lima|pera|valencia)$/, 180, 'laranja', 'laranjas'],
  [/^(tangerina|mexerica) (?!.*suco)/, 150, 'tangerina', 'tangerinas'],
  [/^kiwi/, 75, 'kiwi', 'kiwis'],
  [/^goiaba (branca|vermelha)/, 170, 'goiaba', 'goiabas'],
  [/^pessego aurora/, 110, 'pêssego', 'pêssegos'],
  [/^pera (park|williams)/, 160, 'pera', 'peras'],
  [/^caqui/, 110, 'caqui', 'caquis'],
  [/^manga (haden|palmer|tommy)/, 300, 'manga', 'mangas'],
  [/^morango$/, 12, 'morango', 'morangos'],
  [/^acerola$/, 12, 'acerola', 'acerolas'],
  [/^(ameixa|nespera|ciriguela|pitanga|umbu)$/, 25, 'unidade', 'unidades'],
  [/^(jabuticaba|uva (italia|rubi))$/, 6, 'unidade', 'unidades'],
  [/^(figo|caju|carambola|maracuja|limao tahiti)$/, 70, 'unidade', 'unidades'],
  [/^abacaxi$/, 75, 'fatia', 'fatias'],
  [/^mamao (formosa|papaia)$/, 150, 'fatia', 'fatias'],
  [/^(melancia|melao)$/, 200, 'fatia', 'fatias'],
  [/^(acai|abacaxi|acerola|caja|caju|cupuacu|graviola|manga|maracuja|pitanga|umbu) polpa/, 100, 'pacote', 'pacotes'],
  [/^(goiaba doce|banana doce em barra|marmelada)/, 30, 'fatia', 'fatias'],
  // Legumes que se contam
  [/^tomate$/, 100, 'tomate', 'tomates'],
  [/^cebola crua/, 70, 'cebola', 'cebolas'],
  [/^cenoura crua/, 100, 'cenoura', 'cenouras'],
  [/^batata (inglesa|doce) cozida/, 130, 'batata', 'batatas'],
  [/^mandioca (cozida|frita)/, 100, 'pedaço', 'pedaços'],
  [/^milho verde cru/, 150, 'espiga', 'espigas'],
  [/^palmito/, 30, 'unidade', 'unidades'],
  [
    /^(alface|rucula|agriao|acelga|almeirao$|chicoria|couve manteiga crua|espinafre .* cru$|mostarda folha|serralha|taioba)/,
    30,
    'porção',
    'porções',
  ],
  // Doces e oleaginosas
  [/^chocolate/, 6, 'quadradinho', 'quadradinhos'],
  [/^(cocada|quindim)/, 50, 'unidade', 'unidades'],
  [/^maria mole/, 30, 'unidade', 'unidades'],
  [/^rapadura/, 30, 'pedaço', 'pedaços'],
  [/^pacoca/, 20, 'paçoca', 'paçocas'],
  [/^pe-de-moleque/, 30, 'unidade', 'unidades'],
  [/^(castanha-do-brasil|noz crua)/, 5, 'unidade', 'unidades'],
  [/^coco cru/, 30, 'pedaço', 'pedaços'],
  [/^pinhao/, 7, 'pinhão', 'pinhões'],
  [/^azeitona/, 4, 'azeitona', 'azeitonas'],
  [/^caldo de (carne|galinha) tablete/, 10, 'tablete', 'tabletes'],
  // Bebidas
  [/^cafe coado/, 50, 'xícara', 'xícaras'],
  [/^cha .*infusao/, 180, 'xícara', 'xícaras'],
  [/^(cerveja|refrigerante|agua tonica)/, 350, 'lata', 'latas'],
  [/^cana aguardente/, 50, 'dose', 'doses'],
  [/^cana caldo/, 300, 'copo', 'copos'],
  [
    /^(leite (integral|desnatado|de cabra|de vaca achocolatado)|coco agua|bebida isotonica|soja extrato soluvel natural)|\bsuco\b/,
    200,
    'copo',
    'copos',
  ],
];

/** Peso e nome da unidade do alimento (junk food pelo grupo; os outros pelas regras acima). */
function countRule(food: Food): [unknown, number, string, string] | undefined {
  const junk = junkGroupOf(food.id)?.unitOf.get(food.id);
  if (junk) return [null, junk.grams, junk.unit[0], junk.unit[1]];
  const name = NORMALIZED.get(food.id) ?? normalize(food.name);
  return COUNT_RULES.find(([re]) => re.test(name));
}

/** As medidas que fazem sentido para o alimento (a primeira é a que já vem escolhida). */
export function unitsFor(food: Food): PortionUnit[] {
  const sized = junkGroupOf(food.id)?.sizeUnit;
  if (sized) return [sized];
  if (countRule(food)) return ['unidade', 'gramas'];
  const name = NORMALIZED.get(food.id) ?? normalize(food.name);
  if (LADLE.test(name)) return ['concha', 'colher', 'gramas'];
  if (GRAMS_ONLY.test(name) && !RAW_OK.test(name)) return ['gramas'];
  return ['colher', 'gramas'];
}

/** Nome da medida no botão: "Colher", "Concha", "Gramas" ou o nome da unidade ("Ovo", "Fatia", "Copo"). */
export function unitButtonLabel(food: Food, unit: PortionUnit) {
  const label = unit === 'unidade' ? (countRule(food)?.[2] ?? 'unidade') : unit === 'gramas' ? 'gramas' : unit;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function gramsPerUnit(food: Food, unit: PortionUnit) {
  // ml: líquidos e açaí contam como 1 g por ml.
  if (unit === 'gramas' || unit === 'ml') return 1;
  if (unit === 'concha') return LADLE_DEFAULT;
  if (unit === 'unidade') return countRule(food)?.[1] ?? 100;
  const name = NORMALIZED.get(food.id) ?? normalize(food.name);
  return SPOON_RULES.find(([re]) => re.test(name))?.[1] ?? SPOON_DEFAULT;
}

/** Calorias e macros de uma porção (arredondados para mostrar e guardar). */
export function portionNutrition(food: Food, grams: number) {
  const k = grams / 100;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    kcal: Math.round(food.kcal * k),
    protein: round1(food.protein * k),
    carbs: round1(food.carbs * k),
    fat: round1(food.fat * k),
  };
}

/** "2 colheres", "1 concha", "150 g", "2 ovos", "1 fatia". */
export function portionLabel(unit: PortionUnit, quantity: number, foodId?: number) {
  const food = foodId !== undefined ? getFood(foodId) : undefined;
  const rule = unit === 'unidade' && food ? countRule(food) : undefined;
  const [one, many] = unit === 'unidade' ? (rule ? [rule[2], rule[3]] : ['unidade', 'unidades']) : UNIT_LABELS[unit];
  const amount = Number.isInteger(quantity) ? String(quantity) : String(quantity).replace('.', ',');
  if (unit === 'gramas') return `${amount} g`;
  if (unit === 'ml') return `${amount} ml`;
  return `${amount} ${quantity === 1 ? one : many}`;
}
