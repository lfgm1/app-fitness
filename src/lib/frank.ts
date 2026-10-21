// Fases do Frank, o mascote: ele evolui conforme o número de treinos registrados.

export type FrankPhase = 'frango' | 'marombeiro' | 'monstro';

export const FRANK_PHASES: { phase: FrankPhase; name: string; from: number }[] = [
  { phase: 'frango', name: 'Frango', from: 0 },
  { phase: 'marombeiro', name: 'Marombeiro', from: 10 },
  { phase: 'monstro', name: 'Monstro', from: 50 },
];

/** Fase atual, a próxima e quanto falta para chegar nela. */
export function frankProgress(workoutCount: number) {
  let index = 0;
  FRANK_PHASES.forEach((p, i) => {
    if (workoutCount >= p.from) index = i;
  });
  const current = FRANK_PHASES[index];
  const next = FRANK_PHASES[index + 1];
  const progress = next ? (workoutCount - current.from) / (next.from - current.from) : 1;
  return { current, next, remaining: next ? next.from - workoutCount : 0, progress };
}
