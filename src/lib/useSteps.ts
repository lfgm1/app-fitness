// Estado dos passos para as telas: lê ao abrir, atualiza quando a pessoa volta para o app
// (por exemplo, depois de liberar a permissão nos ajustes) e conecta quando ela pede.

import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { connectSteps, readWeekSteps, stepsAccess } from '@/lib/steps';
import type { DaySteps, StepsAccess } from '@/lib/steps';

export type StepsState = 'loading' | StepsAccess;

// Meta usada quando a pessoa não definiu uma no perfil.
export const DEFAULT_STEP_GOAL = 8000;

export function formatSteps(n: number) {
  return String(n).replace(/\B(?=(\d{3})+$)/g, '.');
}

/** Vê em que pé está o acesso e, se a pessoa já autorizou, lê a semana. */
async function fetchSteps(): Promise<{ state: StepsState; week: DaySteps[] | null }> {
  const access = await stepsAccess();
  return { state: access, week: access === 'connected' ? await readWeekSteps() : null };
}

export function useSteps() {
  const [state, setState] = useState<StepsState>('loading');
  const [week, setWeek] = useState<DaySteps[] | null>(null);
  // A pessoa tentou conectar e a permissão não veio (negou ou fechou a janela).
  const [denied, setDenied] = useState(false);

  const load = useCallback(() => {
    fetchSteps().then((r) => {
      setState(r.state);
      setWeek(r.week);
      if (r.state === 'connected') setDenied(false);
    });
  }, []);

  useEffect(() => {
    load();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && load());
    return () => sub.remove();
  }, [load]);

  async function connect() {
    const ok = await connectSteps();
    setDenied(!ok);
    load();
  }

  return { state, week, today: week?.at(-1)?.steps ?? 0, denied, connect };
}
