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
