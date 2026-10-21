// Regras de progressão: compara um treino com o anterior do mesmo exercício.
//
// - Progressão de carga: a maior carga do dia subiu (40kg -> 42,5kg).
// - Micro progressão: mesma carga máxima, mas com mais repetições
//   (40kg x 5 -> 40kg x 6), ou mais repetições somadas nessa carga
//   entre todas as séries (40x6, 40x5 -> 40x6, 40x6).
// - Manteve: igual ao treino anterior.
// - Regrediu: carga máxima menor, ou mesma carga com menos repetições.

import type { Session, SetEntry } from '@/data/store';

export type ProgressStatus = 'inicio' | 'carga' | 'micro' | 'manteve' | 'regrediu';

export type HistoryEntry = {
  sessionId: string;
  date: string;
  sets: SetEntry[];
  /** A melhor série do dia: maior carga e, nela, mais repetições. */
  best: SetEntry;
  /** Soma das repetições feitas na carga máxima do dia. */
  repsAtTop: number;
  status: ProgressStatus;
  /** Recorde pessoal: a melhor série do dia superou a melhor série de todos os treinos anteriores. */
  isPR: boolean;
};

export const STATUS_INFO: Record<ProgressStatus, { label: string; short: string }> = {
  inicio: { label: 'Primeiro registro', short: 'Início' },
  carga: { label: 'Progressão de carga', short: 'Carga ↑' },
  micro: { label: 'Micro progressão', short: 'Micro ↑' },
  manteve: { label: 'Manteve', short: 'Manteve' },
  regrediu: { label: 'Abaixo do anterior', short: 'Abaixo' },
};

/**
 * Se a série "a" é melhor que "b": mais carga ou, com a mesma carga, mais repetições.
 * Nos exercícios de tempo, mais segundos.
 */
export function beatsSet(a: SetEntry, b: SetEntry) {
  if (a.weight !== b.weight) return a.weight > b.weight;
  if (a.reps !== b.reps) return a.reps > b.reps;
  return (a.seconds ?? 0) > (b.seconds ?? 0);
}

/** O número principal de uma série: segundos nos exercícios de tempo, carga (kg) nos outros. */
export function setMetric(s: SetEntry) {
  return s.seconds ?? s.weight;
}

export function bestSet(sets: SetEntry[]): SetEntry {
  return sets.reduce((best, s) => (beatsSet(s, best) ? s : best), sets[0]);
}

function repsAtWeight(sets: SetEntry[], weight: number) {
  return sets.filter((s) => s.weight === weight).reduce((sum, s) => sum + s.reps, 0);
}

export function compareSets(prev: SetEntry[] | undefined, cur: SetEntry[]): ProgressStatus {
  if (!prev || prev.length === 0) return 'inicio';
  const a = bestSet(prev);
  const b = bestSet(cur);
  if (b.weight > a.weight) return 'carga';
  if (b.weight < a.weight) return 'regrediu';
  if (b.reps > a.reps) return 'micro';
  if (b.reps < a.reps) return 'regrediu';
  if ((b.seconds ?? 0) > (a.seconds ?? 0)) return 'carga';
  if ((b.seconds ?? 0) < (a.seconds ?? 0)) return 'regrediu';
  if (repsAtWeight(cur, b.weight) > repsAtWeight(prev, a.weight)) return 'micro';
  return 'manteve';
}

function byDate(a: Session, b: Session) {
  return a.date.localeCompare(b.date);
}

/** Todos os registros de um exercício, do mais antigo para o mais recente. */
export function exerciseHistory(sessions: Session[], exerciseId: string): HistoryEntry[] {
  const result: HistoryEntry[] = [];
  let prevSets: SetEntry[] | undefined;
  let record: SetEntry | undefined;
  for (const session of [...sessions].sort(byDate)) {
    const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex || ex.sets.length === 0) continue;
    const best = bestSet(ex.sets);
    result.push({
      sessionId: session.id,
      date: session.date,
      sets: ex.sets,
      best,
      repsAtTop: repsAtWeight(ex.sets, best.weight),
      status: compareSets(prevSets, ex.sets),
      isPR: record !== undefined && beatsSet(best, record),
    });
    prevSets = ex.sets;
    if (!record || beatsSet(best, record)) record = best;
  }
  return result;
}

/**
 * A melhor série de um exercício em todos os treinos antes de uma data (o recorde a ser batido).
 * O primeiro registro de um exercício não conta como recorde: ainda não há o que bater.
 */
export function recordBefore(sessions: Session[], exerciseId: string, beforeDate?: string) {
  let record: SetEntry | undefined;
  for (const session of sessions) {
    if (beforeDate && session.date >= beforeDate) continue;
    const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex || ex.sets.length === 0) continue;
    const best = bestSet(ex.sets);
    if (!record || beatsSet(best, record)) record = best;
  }
  return record;
}

/** Se as séries de um treino bateram o recorde pessoal do exercício. */
export function isPersonalRecord(sessions: Session[], exerciseId: string, sets: SetEntry[], date: string) {
  const record = recordBefore(sessions, exerciseId, date);
  return record !== undefined && sets.length > 0 && beatsSet(bestSet(sets), record);
}

/** O último registro de um exercício antes de uma data (ou o último de todos): data e séries. */
export function previousRecord(sessions: Session[], exerciseId: string, beforeDate?: string) {
  const sorted = [...sessions].sort(byDate).reverse();
  for (const session of sorted) {
    if (beforeDate && session.date >= beforeDate) continue;
    const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (ex && ex.sets.length > 0) return { date: session.date, sets: ex.sets };
  }
  return undefined;
}

/** As séries do último registro de um exercício antes de uma data (ou o último de todos). */
export function previousSets(sessions: Session[], exerciseId: string, beforeDate?: string) {
  return previousRecord(sessions, exerciseId, beforeDate)?.sets;
}
