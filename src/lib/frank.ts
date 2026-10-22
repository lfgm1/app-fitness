// Fases do Frank, o mascote: ele evolui com XP. A pessoa ganha 1 XP por dia em que registra treino
// (só o primeiro treino do dia conta), para não dar para "upar" registrando vários treinos seguidos.
// No começo as fases vêm rápido (o primeiro treino já "choca o ovo") para a pessoa pegar o hábito.

import type { Session } from '@/data/store';

export type FrankPhase = 'ovo' | 'pintinho' | 'frango' | 'rato' | 'gymbro' | 'shape' | 'gigachad' | 'aura';

export const FRANK_PHASES: { phase: FrankPhase; name: string; from: number }[] = [
  { phase: 'ovo', name: 'Ovo', from: 0 },
  { phase: 'pintinho', name: 'Pintinho', from: 1 },
  { phase: 'frango', name: 'Frango', from: 5 },
  { phase: 'rato', name: 'Rato de academia', from: 15 },
  { phase: 'gymbro', name: 'Gymbro', from: 30 },
  { phase: 'shape', name: 'Shape inexplicável', from: 60 },
  { phase: 'gigachad', name: 'Gigachad', from: 100 },
  { phase: 'aura', name: 'Aura infinita', from: 200 },
];

/**
 * XP do Frank: quantos dias diferentes a pessoa registrou treino. Conta o dia em que o treino foi
 * registrado no app (não a data escolhida, que pode ser no passado), no fuso do celular.
 */
export function frankXp(sessions: Pick<Session, 'date' | 'createdAt'>[]) {
  const days = new Set(sessions.map((s) => new Date(s.createdAt ?? s.date).toDateString()));
  return days.size;
}

/** Fase atual, a próxima e quanto XP falta para chegar nela. */
export function frankProgress(xp: number) {
  let index = 0;
  FRANK_PHASES.forEach((p, i) => {
    if (xp >= p.from) index = i;
  });
  const current = FRANK_PHASES[index];
  const next = FRANK_PHASES[index + 1];
  const progress = next ? (xp - current.from) / (next.from - current.from) : 1;
  return { current, next, remaining: next ? next.from - xp : 0, progress };
}
