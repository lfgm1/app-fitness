// Fases do Frank, o mascote: ele evolui conforme o número de treinos registrados.
// No começo as fases vêm rápido (o primeiro treino já "choca o ovo") para a pessoa pegar o hábito.

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
