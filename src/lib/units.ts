// Unidade de peso escolhida pela pessoa (kg ou lb).
// Os pesos são sempre guardados em kg; a conversão acontece só ao mostrar e ao digitar.

import { useProfile } from '@/data/profile';
import type { WeightUnit } from '@/data/profile';
import type { SetEntry } from '@/data/store';
import { formatDuration, formatWeight } from '@/lib/format';

const KG_PER_LB = 0.45359237;

export function kgToUnit(kg: number, unit: WeightUnit) {
  return unit === 'kg' ? kg : Math.round((kg / KG_PER_LB) * 10) / 10;
}

export function unitToKg(value: number, unit: WeightUnit) {
  return unit === 'kg' ? value : value * KG_PER_LB;
}

export function useUnits() {
  const { profile } = useProfile();
  const unit: WeightUnit = profile?.weightUnit ?? 'kg';

  /** Peso (em kg) formatado na unidade escolhida, sem o sufixo: "42,5". */
  const weight = (kg: number) => formatWeight(kgToUnit(kg, unit));

  return {
    unit,
    weight,
    /** "42,5kg × 8" ou "93,7lb × 8". Nos exercícios de tempo: "0:45". */
    set: (s: SetEntry) => (s.seconds !== undefined ? formatDuration(s.seconds) : `${weight(s.weight)}${unit} × ${s.reps}`),
    /** Diferença entre duas séries: "+2,5kg" ou, nos exercícios de tempo, "+15s". Vazio se não mudou. */
    delta: (from: SetEntry, to: SetEntry) => {
      const timed = to.seconds !== undefined;
      const diff = timed ? (to.seconds ?? 0) - (from.seconds ?? 0) : to.weight - from.weight;
      if (diff === 0) return '';
      return `${diff > 0 ? '+' : '−'}${timed ? `${Math.abs(diff)}s` : `${weight(Math.abs(diff))}${unit}`}`;
    },
    /** Valor digitado na unidade escolhida -> kg para salvar. */
    toKg: (value: number) => unitToKg(value, unit),
  };
}
