// Conversa com o banco de dados (Supabase): envia as mudanças feitas no
// celular e baixa as mudanças feitas em outros aparelhos.
//
// Como funciona:
// 1. Toda alteração é salva primeiro no celular e entra numa "fila de envio".
// 2. A fila é enviada ao banco. Um item só sai da fila depois que o banco confirma.
// 3. Depois, baixamos tudo o que mudou no banco desde a última vez.
// Se a internet cair no meio, nada se perde: a fila continua guardada.

import type { Exercise, MuscleGroup } from './exercises';
import type { Session, Workout, WorkoutBlock } from './store';
import { supabase } from '@/lib/supabase';

export type TableName = 'custom_exercises' | 'workouts' | 'sessions' | 'workout_blocks';

export type SyncRecord =
  | { table: 'custom_exercises'; record: Exercise }
  | { table: 'workouts'; record: Workout }
  | { table: 'sessions'; record: Session }
  | { table: 'workout_blocks'; record: WorkoutBlock };

export const outboxKey = (table: TableName, id: string) => `${table}:${id}`;

export function parseOutboxKey(key: string) {
  const i = key.indexOf(':');
  return { table: key.slice(0, i) as TableName, id: key.slice(i + 1) };
}

const PAGE_SIZE = 1000;
const TABLES: TableName[] = ['custom_exercises', 'workouts', 'sessions', 'workout_blocks'];

const iso = (value: string) => new Date(value).toISOString();

function toRow(item: SyncRecord, userId: string) {
  const deleted = Boolean(item.record.deleted);
  switch (item.table) {
    case 'custom_exercises':
      return {
        user_id: userId,
        id: item.record.id,
        name: item.record.name,
        muscle_group: item.record.group,
        deleted,
      };
    case 'workouts':
      return {
        user_id: userId,
        id: item.record.id,
        name: item.record.name,
        exercise_ids: item.record.exerciseIds,
        created_at: item.record.createdAt,
        deleted,
      };
    case 'sessions':
      return {
        user_id: userId,
        id: item.record.id,
        workout_id: item.record.workoutId,
        workout_name: item.record.workoutName,
        date: item.record.date,
        exercises: item.record.exercises,
        deleted,
      };
    case 'workout_blocks':
      return {
        user_id: userId,
        id: item.record.id,
        name: item.record.name,
        emoji: item.record.emoji,
        workout_ids: item.record.workoutIds,
        created_at: item.record.createdAt,
        deleted,
      };
  }
}

function fromRow(table: TableName, row: any): SyncRecord {
  const base = { id: row.id as string, updatedAt: row.updated_at as string, deleted: Boolean(row.deleted) };
  switch (table) {
    case 'custom_exercises':
      return {
        table,
        record: { ...base, name: row.name, group: row.muscle_group as MuscleGroup, custom: true },
      };
    case 'workouts':
      return {
        table,
        record: { ...base, name: row.name, exerciseIds: row.exercise_ids ?? [], createdAt: iso(row.created_at) },
      };
    case 'sessions':
      return {
        table,
        record: {
          ...base,
          workoutId: row.workout_id,
          workoutName: row.workout_name,
          date: iso(row.date),
          createdAt: row.created_at ? iso(row.created_at) : undefined,
          exercises: row.exercises ?? [],
        },
      };
    case 'workout_blocks':
      return {
        table,
        record: {
          ...base,
          name: row.name,
          emoji: row.emoji,
          workoutIds: row.workout_ids ?? [],
          createdAt: iso(row.created_at),
        },
      };
  }
}

/** Envia os registros para o banco. Só retorna sem erro se o banco confirmou tudo. */
export async function pushChanges(userId: string, items: SyncRecord[]) {
  for (const table of TABLES) {
    const rows = items.filter((i) => i.table === table).map((i) => toRow(i, userId));
    for (let start = 0; start < rows.length; start += PAGE_SIZE) {
      const { error } = await supabase
        .from(table)
        .upsert(rows.slice(start, start + PAGE_SIZE), { onConflict: 'user_id,id' });
      if (error) throw error;
    }
  }
}

/** Baixa tudo o que mudou no banco depois de `since` (ou tudo, se for a primeira vez). */
export async function pullChanges(since: string | null) {
  const records: SyncRecord[] = [];
  let latest = since;
  for (const table of TABLES) {
    for (let start = 0; ; start += PAGE_SIZE) {
      let query = supabase
        .from(table)
        .select('*')
        .order('updated_at')
        .range(start, start + PAGE_SIZE - 1);
      if (since) query = query.gt('updated_at', since);
      const { data, error } = await query;
      if (error) throw error;
      for (const row of data ?? []) {
        records.push(fromRow(table, row));
        if (!latest || row.updated_at > latest) latest = row.updated_at;
      }
      if (!data || data.length < PAGE_SIZE) break;
    }
  }
  return { records, latest };
}

/** Diferencia "sem internet" de outros erros. */
export function isNetworkError(error: unknown) {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('offline');
}
