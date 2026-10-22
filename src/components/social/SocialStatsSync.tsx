// Mantém o resumo público do Clube (fase do Frank e números) igual aos treinos registrados.
// Não desenha nada: só atualiza o banco quando os números mudam.

import { useEffect } from 'react';

import { useAuth } from '@/data/auth';
import { updateMyStats } from '@/data/social';
import type { SocialProfile } from '@/data/social';
import { useStore } from '@/data/store';
import type { Session } from '@/data/store';
import { frankProgress, frankXp } from '@/lib/frank';
import { exerciseHistory } from '@/lib/progress';

type Stats = Pick<SocialProfile, 'phase' | 'workoutCount' | 'recordCount' | 'weekCount'>;

/** Segunda-feira desta semana, à meia-noite. */
function startOfWeek(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

export function computeStats(sessions: Session[], now: Date): Stats {
  const exerciseIds = [...new Set(sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))];
  const weekStart = startOfWeek(now).toISOString();
  return {
    phase: frankProgress(frankXp(sessions)).current.phase,
    workoutCount: sessions.length,
    recordCount: exerciseIds.reduce((sum, id) => sum + exerciseHistory(sessions, id).filter((h) => h.isPR).length, 0),
    weekCount: sessions.filter((s) => s.date >= weekStart).length,
  };
}

export function SocialStatsSync() {
  const { session } = useAuth();
  const { sessions, loaded } = useStore();
  const userId = session?.user.id;
  const key = loaded ? JSON.stringify(computeStats(sessions, new Date())) : null;

  useEffect(() => {
    if (!userId || !key) return;
    // Espera um pouco: vários treinos sincronizando de uma vez viram uma atualização só.
    const timer = setTimeout(() => {
      updateMyStats(userId, JSON.parse(key) as Stats).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [userId, key]);

  return null;
}
