// Gera src/data/foods.ts a partir da TACO (NEPA/Unicamp, 4ª edição), usando os CSV organizados em
// https://github.com/raulfdm/taco-api (pasta references/csv: food.csv, nutrients.csv e categories.csv).
// Uso: node scripts/generate-foods.js <pasta-com-os-csv> src/data/foods.ts
const fs = require('fs');
const path = require('path');

const [dir, out] = process.argv.slice(2);

function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = !quoted;
      } else if (ch === ',' && !quoted) {
        cells.push(cur);
        cur = '';
      } else cur += ch;
    }
    cells.push(cur);
    rows.push(cells);
  }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const foods = parseCsv(fs.readFileSync(path.join(dir, 'food.csv'), 'utf8'));
const nutrients = new Map(parseCsv(fs.readFileSync(path.join(dir, 'nutrients.csv'), 'utf8')).map((n) => [n.foodId, n]));

// Nomes mais naturais para os alimentos mais comuns (o resto só perde as vírgulas).
const NAMES = {
  'Arroz, tipo 1, cozido': 'Arroz branco cozido',
  'Arroz, integral, cozido': 'Arroz integral cozido',
  'Pão, trigo, francês': 'Pão francês',
  'Pão, trigo, forma, integral': 'Pão de forma integral',
  'Pão, de queijo, assado': 'Pão de queijo',
  'Ovo, de galinha, inteiro, cozido/10minutos': 'Ovo cozido',
  'Ovo, de galinha, inteiro, frito': 'Ovo frito',
  'Ovo, de galinha, inteiro, cru': 'Ovo cru',
  'Ovo, de galinha, clara, cozida/10minutos': 'Clara de ovo cozida',
  'Ovo, de galinha, gema, cozida/10minutos': 'Gema de ovo cozida',
  'Frango, peito, sem pele, grelhado': 'Filé de frango grelhado',
  'Frango, peito, sem pele, cozido': 'Filé de frango cozido',
  'Feijão, carioca, cozido': 'Feijão carioca cozido',
  'Feijão, preto, cozido': 'Feijão preto cozido',
  'Leite, de vaca, integral': 'Leite integral',
  'Leite, de vaca, desnatado, UHT': 'Leite desnatado',
  'Banana, prata, crua': 'Banana prata',
  'Banana, nanica, crua': 'Banana nanica',
  'Maçã, Fuji, com casca, crua': 'Maçã fuji',
  'Batata, doce, cozida': 'Batata doce cozida',
  'Batata, inglesa, cozida': 'Batata inglesa cozida',
  'Aveia, flocos, crua': 'Aveia em flocos',
  'Tapioca, com manteiga': 'Tapioca com manteiga',
  'Café, infusão 10%': 'Café coado',
  'Tomate, com semente, cru': 'Tomate',
  'Tomate, salada': 'Salada de tomate',
  'Tomate, purê': 'Purê de tomate',
  'Tomate, extrato': 'Extrato de tomate',
  'Tomate, molho industrializado': 'Molho de tomate',
  'Refrigerante, tipo cola': 'Refrigerante de cola',
  'Refrigerante, tipo guaraná': 'Refrigerante de guaraná',
  'Refrigerante, tipo laranja': 'Refrigerante de laranja',
  'Refrigerante, tipo limão': 'Refrigerante de limão',
  'Refrigerante, tipo água tônica': 'Água tônica',
};

// A TACO não traz a composição destes dois (campos vazios na tabela). Usamos os valores de rótulo
// padrão do leite UHT (200 ml: integral 120 kcal, 6 g prot., 9 g carb., 6 g gord.; desnatado 70 kcal,
// 6 g, 10 g e 0 g), por 100 g.
const FILL = {
  457: { kcal: 35, protein: 3.1, carbohydrates: 4.9, lipids: 0 },
  458: { kcal: 60, protein: 3, carbohydrates: 4.5, lipids: 3 },
};

// Nomes mais simples, do jeito que se fala: "Carne, bovina, patinho, sem gordura, grelhado" vira
// "Patinho sem gordura grelhado"; "Frango, coxa, com pele, assada" vira "Coxa de frango com pele assada";
// "Merluza, filé, assado" vira "Filé de merluza assado"; frutas perdem o "crua" ("Mamão papaia").
const FRUIT_GROUP = '3';
const SALAD = /^(alface|rúcula|agrião|tomate|pepino|rabanete|acelga|almeirão|chicória)/i;
const OFFAL = ['fígado', 'língua', 'bucho', 'coração'];

function tidy(parts) {
  return parts
    .map((p, i) => (i === 0 ? p : p === 'UHT' ? p : p.toLowerCase()))
    .join(' ')
    .replace(/\/\d+ ?minutos/gi, '')
    .replace(/\b(fresco|fresca|congelado|congelada)\b/gi, '')
    .replace(/mingnon/gi, 'mignon')
    .replace(/lingüiça/gi, 'linguiça')
    .replace(/\s+/g, ' ')
    .trim();
}

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function cleanName(name, group) {
  if (NAMES[name]) return NAMES[name];
  const parts = name
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const [first, second, ...rest] = parts;
  const low = (first || '').toLowerCase();

  // Carne bovina: o corte vem primeiro.
  if (low === 'carne' && second?.toLowerCase() === 'bovina' && rest.length > 0) {
    const [cut, ...more] = rest;
    if (cut === 'seca') return tidy(['Carne seca', ...more]);
    if (OFFAL.includes(cut)) return tidy([`${cap(cut)} de boi`, ...more]);
    if (cut === 'almôndegas') return tidy(['Almôndegas de carne', ...more]);
    return tidy([cap(cut), ...more]);
  }
  // Frango e porco: "<parte> de frango".
  if ((low === 'frango' || low === 'porco') && second) {
    const part = second.toLowerCase();
    if (low === 'frango' && part === 'peito' && rest[0] === 'sem pele')
      return tidy(['Filé de frango', ...rest.slice(1)]);
    if (low === 'frango' && part === 'filé') return tidy(['Filé de frango', ...rest]);
    if (part === 'inteiro' || part === 'caipira') return tidy([`${cap(low)} ${part}`, ...rest]);
    if (part === 'com açafrão') return tidy(['Frango com açafrão']);
    return tidy([`${cap(part)} de ${low}`, ...rest]);
  }
  if (/^lingüiça$/i.test(first) && second) return tidy([`Linguiça de ${second.toLowerCase()}`, ...rest]);
  // Peixe em filé: "Filé de merluza assado".
  if (second?.toLowerCase() === 'filé') return tidy([`Filé de ${low}`, ...rest]);
  // Leite em pó.
  if (/^leite$/i.test(first) && parts.includes('pó')) {
    const kind = parts.includes('desnatado') ? 'desnatado' : 'integral';
    return `Leite em pó ${kind}`;
  }
  if (/^queijo$/i.test(first) && second === 'requeijão') return tidy(['Requeijão', ...rest]);
  if (/^queijo$/i.test(first) && second === 'mozarela') return 'Queijo mussarela';

  // Frutas e folhas de salada: sem o "cru/crua" (é como se come).
  let list = parts;
  if (group === FRUIT_GROUP || SALAD.test(first)) {
    list = parts.filter((p, i) => i === 0 || !/^cru(a)?$/i.test(p));
  }
  return tidy(list);
}

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
};

const list = foods
  .map((f) => {
    const n = FILL[f.id] ?? nutrients.get(f.id);
    return [
      Number(f.id),
      cleanName(f.name, f.categoryId),
      Number(f.categoryId),
      num(n?.kcal),
      num(n?.protein),
      num(n?.carbohydrates),
      num(n?.lipids),
    ];
  })
  .filter((f) => f[3] > 0 || /água|chá|café/i.test(f[1]));

// Alimentos que não estão na TACO, com valores estimados por nós (ids a partir de 9001, para não
// misturar com os da tabela). O app avisa que são estimativas do Gains Club.
// Ovo na frigideira com pouco óleo: o ovo cozido da TACO (146 kcal, 13,3 g prot., 0,6 g carb. e
// 9,5 g gord. por 100 g) + cerca de 2 g de azeite por ovo de 50 g (4 g de gordura por 100 g de ovo).
const EXTRA = [[9001, 'Ovo na frigideira (pouco óleo)', 9, 181, 13.3, 0.6, 13.5]];

// Pizzas, batata frita e outras junk foods ficam em src/lib/junkFoods.ts.
list.push(...EXTRA);

// Apelidos: frango grelhado = filé de frango; mussarela/muçarela; carne moída; bife...
const ALIASES = {
  410: 'peito de frango grelhado frango grelhado file de frango',
  408: 'peito de frango cozido frango cozido frango desfiado',
  409: 'peito de frango cru',
  406: 'frango assado',
  463: 'mozarela mucarela mussarela',
  3: 'arroz branco arroz cozido',
  561: 'feijao',
  377: 'bife',
  346: 'bife',
  370: 'bife alcatra',
  358: 'bife',
  326: 'carne moida',
  488: 'ovo cozido',
  490: 'ovo frito',
  474: 'cerveja',
  480: 'coca coca-cola refrigerante',
  481: 'guarana',
  468: 'requeijao',
  91: 'batata cozida',
  88: 'batata doce',
  // Carnes bovinas: "bife" e "carne" acham os cortes mais comuns.
};
for (const f of foods) {
  const n = f.name.toLowerCase();
  if (n.startsWith('carne, bovina')) ALIASES[f.id] = ((ALIASES[f.id] || '') + ' carne boi bife').trim();
  if (n.includes('acém, moído')) ALIASES[f.id] = ((ALIASES[f.id] || '') + ' carne moida').trim();
  if (n.startsWith('porco')) ALIASES[f.id] = ((ALIASES[f.id] || '') + ' carne de porco suino').trim();
  if (f.categoryId === '5') ALIASES[f.id] = ((ALIASES[f.id] || '') + ' peixe').trim();
}

// Os alimentos com nome ajustado são os mais comuns: aparecem primeiro na busca.
// Mais alguns do dia a dia que não tiveram o nome ajustado: bifes grelhados, carne moída, coxa e
// sobrecoxa assadas, salmão grelhado, alface e queijo mussarela.
const MORE_COMMON = [377, 346, 370, 358, 326, 396, 413, 317, 78, 79, 463];
const common = [
  ...foods.filter((f) => NAMES[f.name]).map((f) => Number(f.id)),
  ...MORE_COMMON,
  ...EXTRA.map((e) => e[0]),
];

const lines = list.map((f) => '  ' + JSON.stringify(f) + ',').join('\n');
const header = `// Tabela de alimentos do app, gerada a partir da TACO (Tabela Brasileira de Composição de Alimentos,
// NEPA/Unicamp, 4ª edição revisada e ampliada, 2011). Valores por 100 g do alimento.
// Leite integral e desnatado: a TACO não traz os valores; usamos os de rótulo padrão do leite UHT.
// Não edite à mão: gerado por scripts/generate-foods.js.
//
// Cada item: [id na TACO, nome, grupo, kcal, proteína (g), carboidrato (g), gordura (g)].

export type FoodRow = [id: number, name: string, group: number, kcal: number, protein: number, carbs: number, fat: number];

export const FOOD_GROUPS: Record<number, string> = ${JSON.stringify(
  Object.fromEntries(parseCsv(fs.readFileSync(path.join(dir, 'categories.csv'), 'utf8')).map((c) => [c.id, c.name])),
  null,
  2
)};

/** Ids a partir deste não são da TACO: são estimativas do Gains Club. */
export const FIRST_EXTRA_FOOD_ID = 9001;

/** Apelidos para a busca (o que a pessoa digita e não está no nome): id -> palavras. */
export const FOOD_ALIASES: Record<number, string> = ${JSON.stringify(ALIASES, null, 2)};

/** Alimentos do dia a dia (arroz, feijão, ovo...): aparecem primeiro na busca. */
export const COMMON_FOOD_IDS = ${JSON.stringify(common)};

export const FOOD_ROWS: FoodRow[] = [
${lines}
];
`;
fs.writeFileSync(out, header);
console.log('alimentos:', list.length);
