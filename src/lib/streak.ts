// Streak semanal: cada semana (segunda a domingo) com treino em 3 dias diferentes soma 1.
// Conta o dia em que o treino foi registrado no app (como o XP do Frank), então não dá para
// "fechar" semanas antigas registrando treinos com data no passado.
// A semana atual ainda não quebra o streak: a pessoa tem até domingo para completar.

import type { Session } from '@/data/store';

export const DAYS_PER_WEEK = 3;

export type StreakLevel = 'nenhum' | 'faisca' | 'esquentando' | 'chamas' | 'incendio' | 'azul' | 'lendario';

export const STREAK_LEVELS: { level: StreakLevel; name: string; from: number; color: string }[] = [
  { level: 'nenhum', name: 'Sem fogo', from: 0, color: '#9AA0AB' },
  { level: 'faisca', name: 'Faísca', from: 3, color: '#FFC23D' },
  { level: 'esquentando', name: 'Esquentando', from: 6, color: '#FF7A45' },
  { level: 'chamas', name: 'Em chamas', from: 10, color: '#FF5C5C' },
  { level: 'incendio', name: 'Incêndio', from: 16, color: '#E0342B' },
  { level: 'azul', name: 'Fogo azul', from: 26, color: '#4CC9F0' },
  { level: 'lendario', name: 'Fogo lendário', from: 52, color: '#A78BFA' },
];

export function streakLevel(weeks: number) {
  let found = STREAK_LEVELS[0];
  for (const l of STREAK_LEVELS) if (weeks >= l.from) found = l;
  return found;
}

/** Segunda-feira 00:00 da semana do dia (no fuso do celular). */
function weekStart(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

const weekKey = (date: Date) => weekStart(date).toDateString();

export function computeStreak(sessions: Pick<Session, 'date' | 'createdAt'>[], now: Date) {
  // Dias diferentes com treino, agrupados por semana.
  const daysByWeek = new Map<string, Set<string>>();
  for (const s of sessions) {
    const day = new Date(s.createdAt ?? s.date);
    const key = weekKey(day);
    if (!daysByWeek.has(key)) daysByWeek.set(key, new Set());
    daysByWeek.get(key)!.add(day.toDateString());
  }
  const done = (start: Date) => (daysByWeek.get(start.toDateString())?.size ?? 0) >= DAYS_PER_WEEK;

  const thisWeek = weekStart(now);
  let weeks = done(thisWeek) ? 1 : 0;
  // Volta semana por semana a partir da passada, enquanto a semana estiver completa.
  const cursor = new Date(thisWeek);
  cursor.setDate(cursor.getDate() - 7);
  while (done(cursor)) {
    weeks += 1;
    cursor.setDate(cursor.getDate() - 7);
  }

  // Esta semana: quais dias (segunda a domingo) tiveram treino.
  const thisWeekDays = daysByWeek.get(thisWeek.toDateString()) ?? new Set<string>();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(thisWeek);
    d.setDate(d.getDate() + i);
    return thisWeekDays.has(d.toDateString());
  });
  const todayIndex = (now.getDay() + 6) % 7;

  // Quando o fogo apaga se a pessoa não treinar mais: fim da semana seguinte à última completa.
  let expiresAt: string | null = null;
  if (weeks > 0) {
    const lastDone = new Date(thisWeek);
    if (!done(thisWeek)) lastDone.setDate(lastDone.getDate() - 7);
    lastDone.setDate(lastDone.getDate() + 14);
    expiresAt = lastDone.toISOString();
  }

  return { weeks, days, todayIndex, thisWeekCount: thisWeekDays.size, level: streakLevel(weeks), expiresAt };
}

/** Streak de um perfil do Social como está agora (0 se não tem ou se já apagou). */
export function profileStreak(person?: { streakWeeks: number; streakExpiresAt: string | null } | null) {
  return person ? liveStreak(person.streakWeeks, person.streakExpiresAt) : 0;
}

/** "18 semanas" / "1 semana". */
export const weeksLabel = (weeks: number) => `${weeks} semana${weeks === 1 ? '' : 's'}`;

/** Streak de outra pessoa como está agora (apaga se passou da validade sem ela treinar). */
export function liveStreak(weeks: number, expiresAt: string | null, now: Date = new Date()) {
  if (!weeks || !expiresAt) return 0;
  return new Date(expiresAt).getTime() > now.getTime() ? weeks : 0;
}
