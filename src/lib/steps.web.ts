// No site não há acesso ao Apple Saúde nem ao Health Connect: os passos ficam para o app baixável.
// O ranking continua funcionando no site para quem participa pelo celular.

export type DaySteps = { date: string; steps: number };
export type StepsAccess = 'unsupported' | 'install' | 'ask' | 'connected';

export const healthAppName = 'app de saúde';

export async function stepsAccess(): Promise<StepsAccess> {
  return 'unsupported';
}

export async function connectSteps(): Promise<boolean> {
  return false;
}

export async function openHealthSettings() {}

export function installHealthApp() {}

export async function readWeekSteps(): Promise<DaySteps[] | null> {
  return null;
}
