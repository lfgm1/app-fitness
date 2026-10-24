// Junk foods da aba Calorias. Cada grupo (Cookie, Açaí, Pastel...) aparece como UM item na busca;
// ao tocar, a pessoa escolhe o sabor (com busca) e a porção na medida que faz sentido para ele:
// unidade, fatia, peça, bola... ou o tamanho do copo/porção (açaí e milkshake em ml; pipoca e batata
// em gramas).
//
// São estimativas do Gains Club, não da TACO: porções típicas de lanchonetes, padarias e fast food
// no Brasil, cruzadas com tabelas de contagem de calorias (FatSecret, TBCA/TACO para os ingredientes
// básicos, rótulos de redes) e ajustadas para a soma de proteína, carboidrato e gordura bater com as
// calorias. Valores por unidade (ou por 100 g/100 ml nos grupos com tamanho de copo/porção).

import type { Food } from '@/lib/foods';
import { PIZZA_FLAVOR_NAMES, PIZZA_FOODS, POPULAR_PIZZA_IDS, SLICE_GRAMS } from '@/lib/pizza';

type Unit = [singular: string, plural: string];
// [id, sabor, kcal, proteína, carboidrato, gordura, gramas da unidade?, nome da unidade?]
type Item = [
  id: number,
  flavor: string,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  grams?: number,
  unit?: Unit,
];

type GroupDef = {
  key: string;
  name: string;
  /** Palavras extras que acham o grupo na busca. */
  keywords: string;
  /** Medida e peso padrão de uma unidade (grupos por unidade). */
  unit?: Unit;
  grams?: number;
  /** Grupos por tamanho: os tamanhos de copo/porção; valores dos itens por 100 g ou 100 ml. */
  sizes?: [label: string, amount: number][];
  sizeUnit?: 'ml' | 'gramas';
  items: Item[];
  /** Os mais pedidos aparecem antes de buscar (se não tiver, os primeiros 12). */
  popular?: number[];
};

const UN: Unit = ['unidade', 'unidades'];

const DEFS: GroupDef[] = [
  {
    key: 'cookie',
    name: 'Cookie',
    keywords: 'biscoito cookies recheado',
    unit: ['cookie', 'cookies'],
    grams: 90,
    items: [
      [9400, 'Gotas de chocolate', 400, 5, 52, 19],
      [9401, 'Chocolate (double chocolate)', 410, 5, 52, 20],
      [9402, 'Chocolate branco', 410, 5, 54, 19],
      [9403, 'Red velvet', 400, 5, 54, 18],
      [9404, 'Recheado de Nutella', 470, 6, 55, 25, 100],
      [9405, 'Recheado de doce de leite', 450, 6, 60, 21, 100],
      [9406, 'Recheado de Ninho', 460, 7, 57, 23, 100],
      [9407, 'Recheado de Nutella com Ninho', 480, 7, 56, 25, 100],
      [9408, 'Recheado de pistache', 470, 7, 52, 26, 100],
      [9409, "M&M's", 420, 5, 56, 20],
      [9410, 'Ovomaltine', 430, 5, 58, 20],
      [9411, 'Kinder', 460, 6, 56, 24, 100],
      [9412, 'Oreo', 430, 5, 57, 20],
      [9413, 'Aveia e passas', 360, 5, 55, 14],
      [9414, 'Macadâmia com chocolate branco', 440, 5, 50, 24],
      [9415, 'Amendoim / paçoca', 430, 8, 50, 22],
      [9416, 'Industrializado (pequeno)', 48, 0.6, 6.5, 2.2, 10],
    ],
  },
  {
    key: 'acai',
    name: 'Açaí',
    keywords: 'acai tigela bowl copo',
    sizes: [
      ['300 ml', 300],
      ['400 ml', 400],
      ['500 ml', 500],
      ['700 ml', 700],
    ],
    sizeUnit: 'ml',
    // Por 100 ml.
    items: [
      [9420, 'Tradicional (com xarope)', 100, 0.9, 16, 3.6],
      [9421, 'Puro, sem açúcar', 60, 0.8, 6.2, 3.9],
      [9422, 'Com banana', 105, 1, 18, 3.3],
      [9423, 'Com granola', 125, 1.8, 19, 4.6],
      [9424, 'Com banana e granola', 130, 1.8, 21, 4.4],
      [9425, 'Com leite condensado', 140, 1.7, 23, 4.7],
      [9426, 'Com leite em pó (Ninho)', 135, 2.4, 19, 5.5],
      [9427, 'Com morango', 100, 1, 16.5, 3.4],
      [9428, 'Com paçoca', 140, 2.6, 19, 6],
      [9429, 'Com Nutella', 150, 1.8, 20, 7],
      [9430, 'Completo (banana, granola e leite condensado)', 165, 2.4, 28, 4.9],
      [9431, 'Com whey', 115, 5, 16, 3.5],
      [9432, 'Cupuaçu', 105, 1, 18, 3.2],
    ],
  },
  {
    key: 'milkshake',
    name: 'Milkshake',
    keywords: 'milk shake mcshake shake',
    sizes: [
      ['300 ml', 300],
      ['400 ml', 400],
      ['500 ml', 500],
      ['700 ml', 700],
    ],
    sizeUnit: 'ml',
    items: [
      [9440, 'Chocolate', 128, 3, 20, 4.1],
      [9441, 'Morango', 120, 2.8, 19.5, 3.4],
      [9442, 'Baunilha', 120, 2.9, 19, 3.6],
      [9443, 'Ovomaltine', 150, 3.2, 23, 5],
      [9444, 'Nutella', 160, 3.2, 21, 7],
      [9445, 'Doce de leite', 140, 3.2, 22, 4.3],
      [9446, 'Oreo / cookies', 145, 3, 22, 5],
      [9447, 'Ninho', 145, 3.8, 20, 5.5],
      [9448, 'Ninho com Nutella', 160, 3.6, 21, 6.8],
      [9449, 'Café', 118, 2.8, 18.5, 3.6],
      [9450, 'Pistache', 140, 3.4, 19, 5.6],
      [9451, 'Banana', 120, 2.9, 20, 3.1],
    ],
  },
  {
    key: 'sorvete',
    name: 'Sorvete',
    keywords: 'gelato massa bola casquinha sundae',
    unit: ['bola', 'bolas'],
    grams: 60,
    items: [
      [9460, 'Creme', 125, 2.2, 15, 6.3],
      [9461, 'Chocolate', 130, 2.4, 16, 6.3],
      [9462, 'Morango', 110, 1.8, 16, 4.3],
      [9463, 'Flocos', 130, 2.2, 16, 6.4],
      [9464, 'Napolitano', 125, 2.2, 15.5, 6],
      [9465, 'Baunilha', 120, 2.1, 15, 5.8],
      [9466, 'Doce de leite', 135, 2.6, 18, 5.8],
      [9467, 'Brigadeiro', 135, 2.4, 18, 6],
      [9468, 'Pistache', 135, 2.8, 15, 7.1],
      [9469, 'Coco', 130, 1.9, 15, 7],
      [9470, 'Cookies', 135, 2.2, 17, 6.5],
      [9471, 'Ninho trufado', 140, 2.8, 17, 6.8],
      [9472, 'Limão (sorbet)', 80, 0.2, 20, 0],
      [9473, 'Frutas vermelhas', 105, 1.6, 17, 3.6],
      [9474, 'Casquinha (fast food)', 160, 4, 25, 5, 100, ['casquinha', 'casquinhas']],
      [9475, 'Sundae de chocolate', 290, 6, 46, 9, 160, ['sundae', 'sundaes']],
    ],
  },
  {
    key: 'picole',
    name: 'Picolé',
    keywords: 'picole sorvete palito',
    unit: ['picolé', 'picolés'],
    grams: 70,
    items: [
      [9480, 'De fruta (água)', 70, 0.2, 17, 0],
      [9481, 'De fruta ao leite', 100, 1.6, 16, 3.3],
      [9482, 'Creme / ao leite', 120, 2, 15, 5.8],
      [9483, 'Chocolate', 130, 2, 16, 6.5],
      [9484, 'Com cobertura de chocolate (tipo Magnum)', 250, 3, 24, 16, 80],
      [9485, 'Coco', 125, 1.4, 15, 6.6],
    ],
  },
  {
    key: 'donut',
    name: 'Donut / sonho',
    keywords: 'donut donuts rosquinha sonho padaria',
    unit: UN,
    grams: 70,
    items: [
      [9500, 'Tradicional com açúcar', 250, 3.5, 30, 13],
      [9501, 'Cobertura de chocolate', 280, 3.5, 34, 14.5],
      [9502, 'Cobertura de morango', 270, 3.3, 35, 13],
      [9503, 'Recheado de doce de leite', 330, 5, 42, 15.5, 90],
      [9504, 'Recheado de Nutella', 350, 5, 41, 18.5, 90],
      [9505, 'Recheado de creme', 310, 4.5, 39, 15, 90],
      [9506, 'Recheado de goiabada', 300, 4, 42, 13, 90],
      [9507, 'Sonho de creme (padaria)', 280, 5, 36, 13, 90, ['sonho', 'sonhos']],
      [9508, 'Sonho de doce de leite (padaria)', 300, 5.2, 41, 13, 90, ['sonho', 'sonhos']],
    ],
  },
  {
    key: 'brownie',
    name: 'Brownie',
    keywords: 'brownie bolo chocolate',
    unit: ['pedaço', 'pedaços'],
    grams: 60,
    items: [
      [9520, 'Tradicional', 250, 3, 32, 13],
      [9521, 'Com nozes', 270, 3.6, 30, 15.5],
      [9522, 'Recheado de doce de leite', 290, 3.8, 39, 13.5, 70],
      [9523, 'Recheado de Nutella', 300, 3.8, 36, 16, 70],
      [9524, 'Recheado de Ninho', 295, 4.2, 37, 14.5, 70],
      [9525, 'Com sorvete (com 1 bola)', 375, 5, 47, 19, 120, ['porção', 'porções']],
    ],
  },
  {
    key: 'bolodepote',
    name: 'Bolo de pote',
    keywords: 'bolo pote',
    unit: ['pote', 'potes'],
    grams: 180,
    items: [
      [9540, 'Brigadeiro / chocolate', 520, 7, 70, 24],
      [9541, 'Ninho com Nutella', 560, 9, 68, 28],
      [9542, 'Prestígio', 520, 6, 66, 26],
      [9543, 'Red velvet', 480, 6, 66, 21],
      [9544, 'Cenoura com chocolate', 480, 6, 68, 20],
      [9545, 'Morango com Ninho', 470, 7.5, 64, 20.5],
      [9546, 'Doce de leite', 520, 8, 74, 21],
      [9547, 'Limão', 450, 6, 64, 19],
      [9548, 'Abacaxi com coco', 450, 5.5, 66, 18],
    ],
  },
  {
    key: 'docinho',
    name: 'Brigadeiro / docinho',
    keywords: 'brigadeiro docinho doce festa beijinho trufa',
    unit: UN,
    grams: 20,
    items: [
      [9560, 'Brigadeiro', 65, 0.9, 11, 2.2],
      [9561, 'Beijinho', 70, 1, 10, 3],
      [9562, 'Bicho de pé', 65, 0.9, 11, 2],
      [9563, 'Brigadeiro branco', 70, 1, 11, 2.6],
      [9564, 'Brigadeiro gourmet', 90, 1.2, 12, 4.2, 25],
      [9565, 'Cajuzinho', 70, 1.8, 9, 3.2],
      [9566, 'Olho de sogra', 70, 0.8, 11, 2.6],
      [9567, 'Trufa', 110, 1.2, 12, 6.5, 25],
      [9568, 'Bombom (tipo Sonho de Valsa)', 105, 1.2, 12, 5.8, 20],
      [9569, 'Pão de mel', 190, 2.5, 30, 7, 50],
    ],
  },
  {
    key: 'churros',
    name: 'Churros',
    keywords: 'churro churros',
    unit: ['churros', 'churros'],
    grams: 100,
    items: [
      [9580, 'Doce de leite', 350, 5, 48, 15.5],
      [9581, 'Chocolate', 360, 4.8, 47, 17],
      [9582, 'Nutella', 380, 5, 46, 19.5],
      [9583, 'Goiabada', 340, 3.8, 52, 13],
      [9584, 'Sem recheio (açúcar e canela)', 260, 3, 33, 13, 75],
      [9585, 'Mini churros (porção com 6)', 330, 3.8, 42, 16.5, 95, ['porção', 'porções']],
    ],
  },
  {
    key: 'esfiha',
    name: 'Esfiha',
    keywords: 'esfirra esfiha habibs',
    unit: UN,
    grams: 75,
    items: [
      [9600, 'Carne (aberta)', 180, 8, 22, 6.5],
      [9601, 'Queijo (aberta)', 200, 8, 22, 9],
      [9602, 'Frango (aberta)', 170, 9, 22, 5],
      [9603, 'Frango com catupiry (aberta)', 195, 9, 22, 8],
      [9604, 'Calabresa (aberta)', 210, 8, 22, 10],
      [9605, 'Escarola (aberta)', 150, 5, 22, 4.6],
      [9606, 'Carne (fechada)', 240, 9, 30, 9, 95],
      [9607, 'Queijo (fechada)', 260, 9.5, 30, 11, 95],
      [9608, 'Chocolate (doce)', 230, 4.5, 33, 8.8],
    ],
  },
  {
    key: 'pastel',
    name: 'Pastel',
    keywords: 'pastel feira frito',
    unit: ['pastel', 'pastéis'],
    grams: 120,
    items: [
      [9620, 'Carne', 300, 10, 28, 16.5],
      [9621, 'Queijo', 320, 11, 27, 18.5],
      [9622, 'Frango', 290, 11, 28, 15],
      [9623, 'Frango com catupiry', 320, 11, 28, 18],
      [9624, 'Pizza (queijo, presunto e tomate)', 320, 11, 28, 18],
      [9625, 'Palmito', 270, 6, 29, 14.5],
      [9626, 'Calabresa', 330, 10, 28, 19.5],
      [9627, 'Carne com queijo', 340, 13, 28, 19.5],
      [9628, 'Bauru', 310, 11.5, 28, 17],
      [9629, 'Carne seca com catupiry', 340, 12, 28, 20],
      [9630, 'Camarão', 290, 10, 28, 15],
      [9631, 'Chocolate', 360, 5, 42, 19],
      [9632, 'Banana com canela', 300, 3.5, 42, 13],
      [9633, 'Romeu e julieta', 330, 7, 40, 15.5],
    ],
  },
  {
    key: 'coxinha',
    name: 'Coxinha',
    keywords: 'coxinha salgado frito',
    unit: UN,
    grams: 90,
    items: [
      [9640, 'Frango', 245, 9, 28, 10.5],
      [9641, 'Frango com catupiry', 275, 9.5, 28, 14],
      [9642, 'Carne seca', 270, 10, 28, 13],
      [9643, 'Calabresa', 285, 9, 28, 15],
      [9644, 'De festa (mini)', 60, 2.2, 7, 2.6, 22],
    ],
  },
  {
    key: 'salgado',
    name: 'Salgado',
    keywords: 'salgado salgadinho festa lanchonete kibe quibe risole enroladinho empada croquete joelho bolinha',
    unit: UN,
    grams: 80,
    items: [
      [9660, 'Kibe frito', 200, 9, 18, 10],
      [9661, 'Risole de carne', 210, 7, 22, 10.5],
      [9662, 'Risole de presunto e queijo', 220, 8, 22, 11],
      [9663, 'Enroladinho de salsicha (assado)', 230, 7, 24, 11.5],
      [9664, 'Enroladinho de salsicha (frito)', 260, 7, 24, 15],
      [9665, 'Bolinha de queijo', 180, 6, 17, 10, 60],
      [9666, 'Empada de frango', 230, 6, 21, 13.5],
      [9667, 'Empada de palmito', 215, 4.5, 21, 12.5],
      [9668, 'Croquete de carne', 200, 8, 17, 11],
      [9669, 'Joelho (presunto e queijo)', 270, 10, 30, 12, 100],
      [9670, 'Pão de batata recheado', 260, 8, 34, 10, 90],
      [9671, 'Salgado de festa (mini, frito)', 60, 2, 6, 3.2, 20],
    ],
  },
  {
    key: 'hotdog',
    name: 'Cachorro-quente',
    keywords: 'hot dog cachorro quente dogao',
    unit: UN,
    grams: 150,
    items: [
      [9680, 'Simples (pão, salsicha e molho)', 300, 11, 32, 14],
      [9681, 'Completo (purê, batata palha, milho, queijo)', 520, 17, 55, 26, 250],
      [9682, 'Com 2 salsichas', 430, 17, 34, 25, 200],
      [9683, 'Com bacon e cheddar', 560, 21, 40, 35, 230],
      [9684, 'Prensado', 450, 16, 45, 22, 220],
    ],
  },
  {
    key: 'japones',
    name: 'Sushi / japonês',
    keywords: 'sushi japones japa temaki uramaki hossomaki niguiri sashimi hot roll harumaki guioza yakisoba',
    unit: ['peça', 'peças'],
    grams: 30,
    items: [
      [9700, 'Uramaki', 45, 1.5, 6, 1.6],
      [9701, 'Uramaki Filadélfia (cream cheese)', 52, 1.6, 6, 2.4],
      [9702, 'Hossomaki', 30, 1, 6, 0.3, 20],
      [9703, 'Niguiri de salmão', 55, 3, 7, 1.6, 35],
      [9704, 'Sashimi de salmão (fatia)', 40, 4, 0, 2.6, 20, ['fatia', 'fatias']],
      [9705, 'Hot roll (empanado)', 80, 2, 8, 4.5],
      [9706, 'Joe / gunkan', 60, 2.5, 6, 2.8],
      [9707, 'Skin roll', 55, 1.8, 6, 2.6],
      [9708, 'Temaki de salmão', 220, 9, 28, 8, 150, ['temaki', 'temakis']],
      [9709, 'Temaki Filadélfia (cream cheese)', 260, 9, 28, 12, 160, ['temaki', 'temakis']],
      [9710, 'Harumaki (rolinho primavera)', 110, 2.5, 11, 6, 40, UN],
      [9711, 'Guioza', 45, 2, 5, 1.8, 20, UN],
      [9712, 'Yakisoba (porção)', 560, 25, 70, 19, 400, ['porção', 'porções']],
    ],
  },
  {
    key: 'crepe',
    name: 'Crepe',
    keywords: 'crepe suico crepe',
    unit: ['crepe', 'crepes'],
    grams: 150,
    items: [
      [9720, 'Frango com catupiry', 400, 20, 35, 20],
      [9721, 'Queijo e presunto', 380, 19, 34, 18.5],
      [9722, 'Calabresa com queijo', 430, 17, 34, 25],
      [9723, 'Carne seca com queijo', 420, 22, 34, 21.5],
      [9724, 'Chocolate', 420, 8, 52, 20],
      [9725, 'Nutella com morango', 440, 8, 54, 21],
      [9726, 'Doce de leite', 410, 9, 56, 16.5],
      [9727, 'Banana com canela', 330, 7, 52, 10.5],
    ],
  },
  {
    key: 'tapioca',
    name: 'Tapioca recheada',
    keywords: 'tapioca beiju goma',
    unit: ['tapioca', 'tapiocas'],
    grams: 120,
    items: [
      [9740, 'Queijo coalho', 330, 9, 50, 10.5],
      [9741, 'Queijo e presunto', 360, 13, 50, 12],
      [9742, 'Frango com catupiry', 380, 15, 50, 13.5],
      [9743, 'Carne seca com queijo', 410, 17, 50, 15.5],
      [9744, 'Ovo e queijo', 340, 12, 50, 10],
      [9745, 'Coco com leite condensado', 380, 4, 64, 12],
      [9746, 'Banana com canela', 300, 2, 64, 4],
      [9747, 'Nutella', 400, 3.5, 63, 15],
    ],
  },
  {
    key: 'pipoca',
    name: 'Pipoca',
    keywords: 'pipoca cinema',
    sizes: [
      ['Saquinho (30 g)', 30],
      ['Pequena (50 g)', 50],
      ['Média (90 g)', 90],
      ['Grande (140 g)', 140],
    ],
    sizeUnit: 'gramas',
    // Por 100 g.
    items: [
      [9760, 'Salgada com manteiga (cinema)', 500, 8, 55, 28],
      [9761, 'Salgada (com óleo)', 460, 8, 58, 22],
      [9762, 'Doce (caramelo)', 400, 4, 78, 8],
      [9763, 'Micro-ondas manteiga', 480, 8, 55, 25],
      [9764, 'Natural (sem óleo)', 380, 12, 74, 4.5],
    ],
  },
  {
    key: 'chocolate',
    name: 'Chocolate',
    keywords: 'chocolate barra bombom kitkat kit kat lacta nestle',
    unit: ['barrinha', 'barrinhas'],
    grams: 25,
    items: [
      [9780, 'Ao leite (barrinha de 25 g)', 135, 1.8, 15, 7.5],
      [9781, 'Ao leite (barra de 90 g)', 490, 6.5, 54, 27, 90, ['barra', 'barras']],
      [9782, 'Meio amargo 70% (quadradinho)', 58, 0.9, 3.3, 4.5, 10, ['quadradinho', 'quadradinhos']],
      [9783, 'Branco (barrinha de 25 g)', 140, 1.6, 15, 8],
      [9784, 'Kit Kat (unidade de 41,5 g)', 215, 2.6, 26, 11, 41.5, UN],
      [9785, 'Bombom (unidade)', 105, 1.2, 12, 5.8, 20, UN],
      [9786, 'Trufa (unidade)', 120, 1.3, 13, 7, 25, UN],
      [9787, 'Barra recheada (unidade)', 200, 2.2, 25, 10, 40, UN],
    ],
  },
  {
    key: 'batata',
    name: 'Batata frita',
    keywords: 'batata frita fritas mc fritas porcao',
    sizes: [
      ['P (80 g)', 80],
      ['M (115 g)', 115],
      ['G (160 g)', 160],
      ['Porção para dividir (400 g)', 400],
    ],
    sizeUnit: 'gramas',
    // Por 100 g.
    items: [
      [9020, 'Tradicional', 296, 3.5, 38, 14],
      [9800, 'Com cheddar', 315, 4.5, 35, 17],
      [9801, 'Com cheddar e bacon', 330, 6, 33, 19],
      [9802, 'Rústica', 250, 3, 32, 12],
      [9803, 'Batata doce frita', 260, 2, 36, 12],
      [9804, 'Batata canoa', 270, 3.2, 34, 13],
    ],
  },
  {
    key: 'frango',
    name: 'Nuggets / frango frito',
    keywords: 'nuggets frango frito empanado kfc tiras asinha',
    unit: UN,
    grams: 18,
    items: [
      [9820, 'Nuggets', 50, 2.8, 3, 3],
      [9821, 'Tiras de frango empanado', 85, 6, 5, 4.5, 30],
      [9822, 'Asa de frango frita', 100, 8, 2, 6.8, 35],
      [9823, 'Pedaço de frango frito (tipo KFC)', 290, 22, 10, 18, 110, ['pedaço', 'pedaços']],
      [9824, 'Frango a passarinho (porção)', 650, 52, 8, 46, 300, ['porção', 'porções']],
    ],
  },
  {
    key: 'sobremesa',
    name: 'Sobremesa',
    keywords: 'sobremesa doce bolo torta pudim mousse pave cheesecake petit gateau bomba carolina',
    unit: ['fatia', 'fatias'],
    grams: 100,
    items: [
      [9840, 'Bolo de chocolate com cobertura', 330, 4.5, 45, 15, 90],
      [9841, 'Bolo de cenoura com chocolate', 300, 3.8, 43, 12.5, 90],
      [9842, 'Bolo de aniversário (recheado)', 360, 5, 50, 15.5, 110],
      [9843, 'Torta de limão', 320, 4.5, 40, 15.5],
      [9844, 'Torta holandesa', 380, 4.5, 34, 25],
      [9845, 'Cheesecake', 350, 6, 30, 23],
      [9846, 'Pudim de leite', 230, 6, 38, 6],
      [9847, 'Pavê', 320, 5, 40, 15.5, 120],
      [9848, 'Mousse de maracujá', 200, 3, 26, 9.5, 100, ['pote', 'potes']],
      [9849, 'Mousse de chocolate', 230, 4, 25, 13, 100, ['pote', 'potes']],
      [9850, 'Petit gâteau (com sorvete)', 500, 7, 55, 28, 160, ['porção', 'porções']],
      [9851, 'Bomba de chocolate', 260, 4, 30, 14, 80, UN],
      [9852, 'Carolina', 70, 1.2, 8, 3.7, 20, UN],
      [9853, 'Banoffee', 380, 4, 45, 21],
    ],
  },
  {
    key: 'sanduiche',
    name: 'Sanduíche',
    keywords: 'sanduiche lanche misto quente bauru beirute natural wrap americano',
    unit: UN,
    grams: 130,
    items: [
      [9860, 'Misto quente', 300, 15, 30, 13],
      [9861, 'Bauru', 450, 24, 40, 21, 200],
      [9862, 'Americano (presunto, queijo, ovo, salada)', 420, 21, 32, 23, 200],
      [9863, 'Beirute', 600, 33, 55, 27, 280],
      [9864, 'Natural de frango', 300, 18, 36, 9, 180],
      [9865, 'Wrap de frango', 400, 25, 38, 16, 200],
      [9866, 'Pão com linguiça', 520, 18, 45, 30, 200],
      [9867, 'Choripan', 560, 20, 45, 33, 220],
    ],
  },
];

export type JunkGroup = {
  key: string;
  name: string;
  keywords: string;
  foods: Food[];
  popular: Food[];
  sizes?: [label: string, amount: number][];
  sizeUnit?: 'ml' | 'gramas';
  /** Medida de cada sabor (grupos por unidade): nome e peso de 1 unidade. */
  unitOf: Map<number, { unit: Unit; grams: number }>;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

function build(def: GroupDef): JunkGroup {
  const unitOf = new Map<number, { unit: Unit; grams: number }>();
  const foods = def.items.map(([id, flavor, kcal, protein, carbs, fat, grams, unit]) => {
    // Grupos por tamanho já vêm por 100 g/ml; os por unidade são convertidos para 100 g.
    const g = def.sizes ? 100 : (grams ?? def.grams ?? 100);
    if (!def.sizes) unitOf.set(id, { unit: unit ?? def.unit ?? UN, grams: g });
    const k = 100 / g;
    return {
      id,
      name: `${def.name} (${flavor})`,
      group: 13,
      kcal: round1(kcal * k),
      protein: round1(protein * k),
      carbs: round1(carbs * k),
      fat: round1(fat * k),
    };
  });
  const popularIds = def.popular ?? foods.slice(0, 12).map((f) => f.id);
  return {
    key: def.key,
    name: def.name,
    keywords: def.keywords,
    foods,
    popular: popularIds.map((id) => foods.find((f) => f.id === id)!).filter(Boolean),
    sizes: def.sizes,
    sizeUnit: def.sizeUnit,
    unitOf,
  };
}

// A pizza é calculada pelos ingredientes (src/lib/pizza.ts) e entra aqui como mais um grupo.
const pizzaGroup: JunkGroup = {
  key: 'pizza',
  name: 'Pizza',
  keywords: 'pizza pizzaria fatia',
  foods: PIZZA_FOODS,
  popular: POPULAR_PIZZA_IDS.map((id) => PIZZA_FOODS.find((f) => f.id === id)!).filter(Boolean),
  unitOf: new Map(PIZZA_FOODS.map((f) => [f.id, { unit: ['fatia', 'fatias'] as Unit, grams: SLICE_GRAMS }])),
};

const BUILT = DEFS.map(build);

export const JUNK_GROUPS: JunkGroup[] = [pizzaGroup, ...BUILT];

/** Os sabores dos grupos (menos a pizza, que já vem de src/lib/pizza.ts). */
export const JUNK_FOODS: Food[] = BUILT.flatMap((g) => g.foods);

const GROUP_BY_FOOD = new Map(JUNK_GROUPS.flatMap((g) => g.foods.map((f) => [f.id, g] as const)));

/** O grupo de junk food do alimento (ou undefined, se for um alimento comum). */
export function junkGroupOf(foodId: number) {
  return GROUP_BY_FOOD.get(foodId);
}

/** "Cookie (Gotas de chocolate)" -> "Gotas de chocolate"; pizza: "Calabresa". */
export function flavorName(food: Food) {
  const pizza = PIZZA_FLAVOR_NAMES.get(food.id);
  if (pizza) return pizza;
  const match = food.name.match(/\((.*)\)$/);
  return match ? match[1] : food.name;
}
