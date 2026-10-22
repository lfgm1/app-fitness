// Novidades do app que aparecem no topo da aba Início (uma por vez, a mais nova primeiro).
// O card fica até a pessoa fechar no X. Quem criou a conta depois da novidade não a vê.
// Para anunciar algo novo, é só adicionar um item no começo da lista.

export type NewsArt = 'frank-flap' | 'streak';

export type NewsItem = {
  id: string;
  /** Dia em que a novidade saiu (AAAA-MM-DD). */
  date: string;
  art: NewsArt;
  title: string;
  /** Frase curta do card. */
  summary: string;
  /** Explicação da janela "Ver como funciona". */
  intro: string;
  steps: string[];
};

export const NEWS: NewsItem[] = [
  {
    id: 'frank-flap',
    date: '2026-10-22',
    art: 'frank-flap',
    title: 'Frank Flap',
    summary: 'Jogue com o Frank enquanto descansa entre as séries.',
    intro: 'O descanso entre as séries ficou divertido: jogue com o Frank enquanto o cronômetro corre.',
    steps: [
      'No registrar treino, toque em Descansar.',
      'Escolha o tempo (ou um tempo seu).',
      'Toque na tela para o Frank voar entre as anilhas.',
      'Quando o descanso acaba, o jogo pausa e continua no próximo descanso.',
    ],
  },
  {
    id: 'streak-semanal',
    date: '2026-10-22',
    art: 'streak',
    title: 'Streak semanal',
    summary: 'Treine 3 dias na semana e deixe seu perfil pegando fogo.',
    intro:
      'Cada semana com treino em 3 dias diferentes soma 1 semana de streak. Quanto mais semanas seguidas, maior o fogo no seu perfil.',
    steps: [
      'Treine em 3 dias diferentes de segunda a domingo.',
      'A partir de 3 semanas seguidas, aparece fogo atrás do seu ícone.',
      'O fogo muda de nível: Faísca, Esquentando, Em chamas, Incêndio, Fogo azul e o lendário arco-íris.',
      'Se uma semana acabar com menos de 3 dias, o streak volta a zero.',
    ],
  },
];
