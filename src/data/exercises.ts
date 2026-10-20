// Biblioteca de exercícios que já vem com o app.
// Para adicionar um novo, basta incluir o nome na lista do grupo muscular certo.

export const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Antebraço',
  'Quadríceps',
  'Posterior de coxa',
  'Glúteos',
  'Panturrilha',
  'Abdômen',
  'Trapézio',
  'Corpo inteiro',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type Exercise = {
  id: string;
  name: string;
  group: MuscleGroup;
  custom?: boolean;
  updatedAt?: string;
  deleted?: boolean;
};

const LIBRARY: Record<MuscleGroup, string[]> = {
  Peito: [
    'Supino reto com barra',
    'Supino reto com halteres',
    'Supino reto na máquina',
    'Supino reto no Smith',
    'Supino inclinado com barra',
    'Supino inclinado com halteres',
    'Supino inclinado na máquina',
    'Supino inclinado no Smith',
    'Supino declinado com barra',
    'Supino declinado com halteres',
    'Supino declinado na máquina',
    'Crucifixo reto com halteres',
    'Crucifixo inclinado com halteres',
    'Crucifixo declinado com halteres',
    'Crucifixo na máquina (Peck deck)',
    'Crossover polia alta',
    'Crossover polia média',
    'Crossover polia baixa',
    'Chest press',
    'Pullover com halter',
    'Flexão de braço',
    'Flexão de braço inclinada',
    'Flexão de braço declinada',
    'Mergulho nas paralelas (peito)',
    'Supino com pegada fechada (peito)',
    'Svend press',
  ],
  Costas: [
    'Puxada frontal aberta',
    'Puxada frontal fechada (triângulo)',
    'Puxada frontal supinada',
    'Puxada com pegada neutra',
    'Puxada unilateral na polia',
    'Barra fixa pronada',
    'Barra fixa supinada',
    'Barra fixa pegada neutra',
    'Barra fixa assistida',
    'Remada curvada com barra pronada',
    'Remada curvada com barra supinada',
    'Remada unilateral com halter (serrote)',
    'Remada baixa com triângulo',
    'Remada baixa pegada aberta',
    'Remada cavalinho (T-bar)',
    'Remada na máquina',
    'Remada articulada',
    'Remada no Smith',
    'Remada Pendlay',
    'Remada apoiada no banco (Seal row)',
    'Remada alta na polia',
    'Pulldown com corda',
    'Pulldown com barra reta',
    'Levantamento terra',
    'Levantamento terra sumô',
    'Rack pull',
    'Hiperextensão lombar',
    'Good morning',
  ],
  Ombros: [
    'Desenvolvimento com barra',
    'Desenvolvimento com halteres',
    'Desenvolvimento na máquina',
    'Desenvolvimento no Smith',
    'Desenvolvimento Arnold',
    'Desenvolvimento militar em pé',
    'Elevação lateral com halteres',
    'Elevação lateral na polia',
    'Elevação lateral na máquina',
    'Elevação lateral sentado',
    'Elevação frontal com halteres',
    'Elevação frontal com barra',
    'Elevação frontal com anilha',
    'Elevação frontal na polia',
    'Crucifixo inverso com halteres',
    'Crucifixo inverso na máquina (Peck deck invertido)',
    'Crucifixo inverso na polia',
    'Face pull',
    'Remada alta com barra',
    'Landmine press',
    'Rotação externa na polia',
  ],
  Bíceps: [
    'Rosca direta com barra reta',
    'Rosca direta com barra W',
    'Rosca alternada com halteres',
    'Rosca simultânea com halteres',
    'Rosca martelo',
    'Rosca martelo na polia (corda)',
    'Rosca concentrada',
    'Rosca Scott com barra',
    'Rosca Scott com halter',
    'Rosca Scott na máquina',
    'Rosca inclinada com halteres',
    'Rosca na polia baixa',
    'Rosca unilateral na polia',
    'Rosca bayesian (polia por trás)',
    'Rosca spider',
    'Rosca 21',
    'Rosca inversa',
    'Rosca na máquina',
  ],
  Tríceps: [
    'Tríceps pulley com barra',
    'Tríceps pulley com corda',
    'Tríceps pulley com barra V',
    'Tríceps pulley inverso',
    'Tríceps unilateral na polia',
    'Tríceps testa com barra',
    'Tríceps testa com halteres',
    'Tríceps francês com halter',
    'Tríceps francês na polia (corda)',
    'Tríceps coice com halter',
    'Tríceps coice na polia',
    'Supino fechado',
    'Mergulho no banco',
    'Mergulho nas paralelas (tríceps)',
    'Tríceps na máquina',
    'Extensão de tríceps acima da cabeça na polia',
  ],
  Antebraço: [
    'Rosca de punho',
    'Rosca de punho inversa',
    'Rosca de punho atrás das costas',
    'Farmer walk',
    'Rolo de punho',
    'Pegada estática na barra (dead hang)',
  ],
  Quadríceps: [
    'Agachamento livre com barra',
    'Agachamento frontal',
    'Agachamento no Smith',
    'Agachamento hack',
    'Agachamento goblet',
    'Agachamento sumô',
    'Agachamento búlgaro',
    'Agachamento sissy',
    'Agachamento na máquina (pendulum)',
    'Leg press 45°',
    'Leg press horizontal',
    'Cadeira extensora',
    'Cadeira extensora unilateral',
    'Afundo com halteres',
    'Afundo com barra',
    'Passada (avanço caminhando)',
    'Subida no banco (step up)',
    'Belt squat',
  ],
  'Posterior de coxa': [
    'Mesa flexora',
    'Cadeira flexora',
    'Flexora em pé unilateral',
    'Stiff com barra',
    'Stiff com halteres',
    'Levantamento terra romeno',
    'Levantamento terra unilateral',
    'Flexão nórdica',
    'Flexão de joelho na bola',
    'Good morning (posterior)',
  ],
  Glúteos: [
    'Elevação pélvica com barra (hip thrust)',
    'Elevação pélvica na máquina',
    'Ponte de glúteo',
    'Glúteo na polia (coice)',
    'Glúteo na máquina (coice)',
    'Cadeira abdutora',
    'Abdução na polia',
    'Coice no solo (quatro apoios)',
    'Agachamento sumô com halter',
    'Pull through na polia',
    'Cadeira adutora',
  ],
  Panturrilha: [
    'Panturrilha em pé na máquina',
    'Panturrilha sentado',
    'Panturrilha no leg press',
    'Panturrilha no Smith',
    'Panturrilha unilateral com halter',
    'Panturrilha no step (peso corporal)',
    'Panturrilha burrinho',
  ],
  Abdômen: [
    'Abdominal supra',
    'Abdominal infra',
    'Abdominal na polia (crunch)',
    'Abdominal na máquina',
    'Abdominal oblíquo',
    'Abdominal bicicleta',
    'Abdominal remador',
    'Abdominal canivete',
    'Elevação de pernas na barra',
    'Elevação de pernas no banco',
    'Elevação de joelhos nas paralelas',
    'Prancha',
    'Prancha lateral',
    'Roda abdominal',
    'Russian twist',
    'Pallof press',
    'Lenhador na polia',
    'Dead bug',
  ],
  Trapézio: [
    'Encolhimento com barra',
    'Encolhimento com halteres',
    'Encolhimento no Smith',
    'Encolhimento na máquina',
  ],
  'Corpo inteiro': [
    'Burpee',
    'Kettlebell swing',
    'Clean (arremesso)',
    'Power clean',
    'Snatch (arranco)',
    'Thruster',
    'Clean and jerk',
    'Turkish get-up',
    'Battle rope',
    'Sled push (trenó)',
  ],
};

function slug(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const DEFAULT_EXERCISES: Exercise[] = MUSCLE_GROUPS.flatMap((group) =>
  LIBRARY[group].map((name) => ({ id: slug(name), name, group }))
);

/** Busca sem diferenciar maiúsculas nem acentos ("triceps" encontra "Tríceps"). */
export function normalizeSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
