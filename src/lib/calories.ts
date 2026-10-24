// Meta de calorias do dia: quanto a pessoa gasta, ajustado pelo objetivo do perfil.
//
// 1. Taxa metabólica basal (o gasto do corpo parado): fórmula de Mifflin-St Jeor, com peso,
//    altura, idade e sexo.
// 2. Gasto de cada dia: basal × 1,2 (o mínimo do dia a dia) + os passos acima de 3.000 + os treinos
//    registrados (pela duração guardada ou, se não tiver, pelo número de séries).
// 3. A meta usa a média dos últimos 14 dias, fechada no domingo: fica a mesma a semana toda e só
//    muda na segunda. Nos primeiros 14 dias de app, usa a média dos dias que já existem (até ontem).
//    No primeiro dia, sem nenhum dia completo, conta como treino moderado (basal × 1,55).
// 4. Objetivo: perder gordura tira até 500 kcal (no máximo 20% do gasto); ganhar músculo soma 300.
//    A meta nunca fica abaixo da taxa basal.
// 5. Macros: proteína pelo peso (perder 2,2 g/kg, para não perder músculo comendo menos; ganhar
//    2,0 g/kg; manter 1,8 g/kg — dentro das faixas da ISSN para quem treina), gordura com 25% das
//    calorias e carboidrato com o que sobra.
// É uma estimativa: não substitui a orientação de nutricionista.

import type { Goal, Profile, Sex } from '@/data/profile';
import type { Session } from '@/data/store';
import type { DaySteps } from '@/lib/steps';

export const WINDOW_DAYS = 14;
const SEDENTARY = 1.2;
const MODERATE = 1.55;
// Passos que o "parado" (× 1,2) já inclui; só os passos acima disso somam.
const BASE_STEPS = 3000;
// Calorias por passo, por kg de peso (≈ 0,035 kcal por passo para 70 kg).
const KCAL_PER_STEP_PER_KG = 0.0005;
// Sem acesso aos passos (site, ou passos não conectados), supõe um dia comum.
const UNKNOWN_STEPS = 5000;
// Musculação: MET ≈ 5 (gasto por kg por hora). Treino sem duração guardada: 2,5 min por série.
const WORKOUT_MET = 5;
const MINUTES_PER_SET = 2.5;
const LOSE = 500;
const LOSE_MAX_SHARE = 0.2;
const GAIN = 300;
const PROTEIN_PER_KG = { lose_fat: 2.2, gain_muscle: 2, maintain: 1.8 } as const;
const FAT_SHARE = 0.25;

export type MissingField = 'weight' | 'height' | 'birthDate' | 'sex';

/** O que falta no perfil para calcular a taxa basal. */
export function missingForCalories(profile: Profile | null): MissingField[] {
  const missing: MissingField[] = [];
  if (!profile?.weightKg) missing.push('weight');
  if (!profile?.heightCm) missing.push('height');
  if (!profile?.birthDate) missing.push('birthDate');
  if (!profile?.sex) missing.push('sex');
  return missing;
}

function ageOn(birthDate: string, now: Date) {
  const [y, m, d] = birthDate.slice(0, 10).split('-').map(Number);
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age;
}

/** Taxa metabólica basal (kcal/dia), pela fórmula de Mifflin-St Jeor. */
export function basalRate(weightKg: number, heightCm: number, age: number, sex: Sex) {
  // Homem +5, mulher −161; sem informar, a média das duas.
  const bySex = sex === 'male' ? 5 : sex === 'female' ? -161 : -78;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + bySex;
}

export function isoDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Minutos de um treino: a duração guardada ou, se não tiver, pelo número de séries. */
export function workoutMinutes(session: Session) {
  if (session.durationMin) return session.durationMin;
  const sets = session.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  return sets * MINUTES_PER_SET;
}

export type CalorieTarget = {
  /** Meta do dia (kcal). */
  target: number;
  /** Gasto médio por dia (kcal), antes do ajuste do objetivo. */
  expenditure: number;
  basal: number;
  /** Ajuste do objetivo (negativo para perder, positivo para ganhar). */
  goalAdjust: number;
  /** "moderado": primeiro dia, sem dados; "dados": média dos dias com dados. */
  basis: 'moderado' | 'dados';
  /** Quantos dias entraram na média. */
  days: number;
  /** Médias usadas na conta (para a explicação). */
  avgSteps: number | null;
  avgWorkoutKcal: number;
  workouts: number;
  /** Metas de macros do dia (g) e a proteína usada por kg. */
  protein: number;
  carbs: number;
  fat: number;
  proteinPerKg: number;
};

type Input = {
  profile: Profile;
  sessions: Session[];
  /** Passos por dia (pelo menos os últimos 14), ou null se não dá para ler passos. */
  steps: DaySteps[] | null;
  /** Quando a pessoa começou a usar o app (criação da conta). */
  since: Date;
  now: Date;
};

export function calorieTarget({ profile, sessions, steps, since, now }: Input): CalorieTarget | null {
  if (missingForCalories(profile).length > 0) return null;
  const weight = profile.weightKg!;
  const basal = Math.round(basalRate(weight, profile.heightCm!, ageOn(profile.birthDate!, now), profile.sex!));

  // Janela: 14 dias fechados no último domingo; nos primeiros 14 dias de app, de quando começou até ontem.
  const today = startOfDay(now);
  const start = startOfDay(since);
  const daysOfApp = Math.round((today.getTime() - start.getTime()) / 86_400_000);
  let end: Date;
  let first: Date;
  if (daysOfApp >= WINDOW_DAYS) {
    const sinceMonday = (today.getDay() + 6) % 7;
    end = addDays(today, -sinceMonday - 1); // último domingo
    first = addDays(end, -(WINDOW_DAYS - 1));
    if (first < start) first = start;
  } else {
    end = addDays(today, -1);
    first = start;
  }

  const days: string[] = [];
  for (let d = first; d <= end; d = addDays(d, 1)) days.push(isoDay(d));

  let expenditure: number;
  let avgSteps: number | null = null;
  let avgWorkoutKcal = 0;
  let workouts = 0;
  if (days.length === 0) {
    expenditure = basal * MODERATE;
  } else {
    const inWindow = new Set(days);
    const stepsByDay = new Map((steps ?? []).map((s) => [s.date, s.steps]));
    let workoutKcal = 0;
    for (const s of sessions) {
      if (!inWindow.has(isoDay(new Date(s.date)))) continue;
      workouts++;
      workoutKcal += WORKOUT_MET * weight * (workoutMinutes(s) / 60);
    }
    const totalSteps = days.reduce((sum, d) => sum + (steps ? (stepsByDay.get(d) ?? 0) : UNKNOWN_STEPS), 0);
    avgSteps = steps ? Math.round(totalSteps / days.length) : null;
    const stepsKcal = days.reduce((sum, d) => {
      const count = steps ? (stepsByDay.get(d) ?? 0) : UNKNOWN_STEPS;
      return sum + Math.max(0, count - BASE_STEPS) * KCAL_PER_STEP_PER_KG * weight;
    }, 0);
    avgWorkoutKcal = Math.round(workoutKcal / days.length);
    expenditure = basal * SEDENTARY + stepsKcal / days.length + workoutKcal / days.length;
  }

  const goal: Goal | null = profile.goal;
  const goalAdjust =
    goal === 'lose_fat' ? -Math.min(LOSE, expenditure * LOSE_MAX_SHARE) : goal === 'gain_muscle' ? GAIN : 0;
  const target = Math.max(basal, Math.round((expenditure + goalAdjust) / 10) * 10);

  const proteinPerKg = PROTEIN_PER_KG[goal === 'lose_fat' || goal === 'gain_muscle' ? goal : 'maintain'];
  const protein = Math.round(proteinPerKg * weight);
  const fat = Math.round((target * FAT_SHARE) / 9);
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));

  return {
    target,
    protein,
    carbs,
    fat,
    proteinPerKg,
    expenditure: Math.round(expenditure),
    basal,
    goalAdjust: Math.round(goalAdjust),
    basis: days.length === 0 ? 'moderado' : 'dados',
    days: days.length,
    avgSteps,
    avgWorkoutKcal,
    workouts,
  };
}
