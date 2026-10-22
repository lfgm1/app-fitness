// Regras dos blocos de treino (pastas com treinos em ordem).

import type { Session, Workout, WorkoutBlock } from '@/data/store';

/** Os treinos do bloco que ainda existem, na ordem do bloco. */
export function blockWorkouts(block: WorkoutBlock, workouts: Workout[]) {
  return block.workoutIds.map((id) => workouts.find((w) => w.id === id)).filter((w): w is Workout => Boolean(w));
}

/** Data do último registro de um treino. */
export function lastDone(sessions: Session[], workoutId: string) {
  return sessions
    .filter((s) => s.workoutId === workoutId)
    .map((s) => s.date)
    .sort()
    .at(-1);
}

/**
 * Próximo treino pelo bloco: pega o último treino feito e, se ele estiver num bloco, sugere o
 * seguinte na ordem do bloco (depois do último, volta para o primeiro), mesmo que a pessoa tenha
 * pulado algum antes. Se o último treino não está em nenhum bloco, devolve null.
 */
export function nextInBlock(sessions: Session[], blocks: WorkoutBlock[], workouts: Workout[]) {
  const last = [...sessions].sort(
    (a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  )[0];
  if (!last) return null;
  for (const block of blocks) {
    const list = blockWorkouts(block, workouts);
    const index = list.findIndex((w) => w.id === last.workoutId);
    if (index === -1) continue;
    const position = (index + 1) % list.length;
    return { workout: list[position], block, position: position + 1, total: list.length };
  }
  return null;
}
