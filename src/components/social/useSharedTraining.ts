// Monta treinos e blocos para enviar no Social e copia os que a pessoa recebe.

import type { MuscleGroup } from '@/data/exercises';
import type { SharedBlock, SharedWorkout } from '@/data/social';
import { useStore } from '@/data/store';
import type { Workout, WorkoutBlock } from '@/data/store';
import { blockWorkouts } from '@/lib/blocks';

export function useSharedTraining() {
  const { workouts, getExercise, addCustomExercise, saveWorkout, saveBlock } = useStore();

  /** Um treino montado no formato de envio (com os nomes dos exercícios). */
  function toSharedWorkout(workout: Workout): SharedWorkout {
    return {
      name: workout.name,
      exercises: workout.exerciseIds.map((id) => {
        const exercise = getExercise(id);
        return {
          id,
          name: exercise?.name ?? 'Exercício',
          group: exercise?.group ?? 'Corpo inteiro',
          custom: Boolean(exercise?.custom),
        };
      }),
    };
  }

  function toSharedBlock(block: WorkoutBlock): SharedBlock {
    return { name: block.name, emoji: block.emoji, workouts: blockWorkouts(block, workouts).map(toSharedWorkout) };
  }

  /** Copia um treino recebido para "Meus treinos" (exercícios que a pessoa não tem são criados). */
  function copyWorkout(shared: SharedWorkout) {
    const exerciseIds = shared.exercises.map((ex) =>
      getExercise(ex.id) ? ex.id : addCustomExercise(ex.name, ex.group as MuscleGroup).id
    );
    return saveWorkout({ name: shared.name, exerciseIds });
  }

  /** Copia um bloco recebido: cria todos os treinos dele e a pasta, na mesma ordem. */
  function copyBlock(shared: SharedBlock) {
    const workoutIds = shared.workouts.map((w) => copyWorkout(w).id);
    return saveBlock({ name: shared.name, emoji: shared.emoji, workoutIds });
  }

  return { toSharedWorkout, toSharedBlock, copyWorkout, copyBlock };
}
