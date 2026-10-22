// Passos do dia, lidos do Apple Saúde (iPhone) ou do Health Connect (Android).
// Só funciona no app baixável (build do EAS): no Expo Go os módulos nativos não existem, então
// tudo aqui é carregado só na hora e qualquer falha vira "sem suporte", sem quebrar o app.
// No site, quem responde é o steps.web.ts.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';

export type DaySteps = { date: string; steps: number };

/**
 * unsupported: não dá para ler passos aqui (site, Expo Go, iPad sem Saúde).
 * install: Android sem o Health Connect (ou com versão velha): precisa instalar/atualizar pela Play Store.
 * ask: dá para ler, mas a pessoa ainda não autorizou.
 * connected: autorizado.
 */
export type StepsAccess = 'unsupported' | 'install' | 'ask' | 'connected';

/** Nome do app de saúde do celular, para os textos. */
export const healthAppName = Platform.OS === 'ios' ? 'Apple Saúde' : 'Health Connect';

// iPhone: o Apple Saúde não conta se a pessoa negou a leitura (por privacidade), só se já perguntou.
// Guardamos que ela já passou pela autorização para não pedir de novo a cada vez.
const ASKED_KEY = 'steps:connected';
const STEPS_IOS = 'HKQuantityTypeIdentifierStepCount';
// Página do Health Connect na Play Store (abre direto no passo a passo de instalação).
const HEALTH_CONNECT_STORE =
  'market://details?id=com.google.android.apps.healthdata&url=healthconnect%3A%2F%2Fonboarding';

/* eslint-disable @typescript-eslint/no-require-imports */
function healthKit(): typeof import('@kingstinct/react-native-healthkit') | null {
  try {
    return require('@kingstinct/react-native-healthkit');
  } catch {
    return null;
  }
}

function healthConnect(): typeof import('react-native-health-connect') | null {
  try {
    return require('react-native-health-connect');
  } catch {
    return null;
  }
}
/* eslint-enable @typescript-eslint/no-require-imports */

/** Começo e fim de um dia (hora local), `daysAgo` dias atrás. */
function dayRange(daysAgo: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysAgo);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(
    start.getDate()
  ).padStart(2, '0')}`;
  return { start, end, date };
}

/** Android: o Health Connect está pronto e o app tem a permissão de ler passos? */
async function androidGranted(hc: NonNullable<ReturnType<typeof healthConnect>>) {
  const granted = await hc.getGrantedPermissions();
  return granted.some((p) => p.recordType === 'Steps' && p.accessType === 'read');
}

/** Em que pé está o acesso aos passos neste celular. */
export async function stepsAccess(): Promise<StepsAccess> {
  try {
    if (Platform.OS === 'ios') {
      const hk = healthKit();
      if (!hk?.isHealthDataAvailable()) return 'unsupported';
      if ((await AsyncStorage.getItem(ASKED_KEY).catch(() => null)) === '1') return 'connected';
      // Já autorizou antes (por exemplo, antes de reinstalar o app)? Então não precisa pedir.
      const status = await hk.getRequestStatusForAuthorization({ toRead: [STEPS_IOS] });
      return (status as number) === 2 ? 'connected' : 'ask';
    }
    if (Platform.OS === 'android') {
      const hc = healthConnect();
      if (!hc) return 'unsupported';
      const sdk = await hc.getSdkStatus();
      // Android antigo demais (antes do 9) não tem Health Connect; nos outros dá para instalar/atualizar.
      if (sdk === hc.SdkAvailabilityStatus.SDK_UNAVAILABLE) return 'unsupported';
      if (sdk !== hc.SdkAvailabilityStatus.SDK_AVAILABLE) return 'install';
      if (!(await hc.initialize())) return 'unsupported';
      // No Android a pessoa pode tirar a permissão a qualquer hora: confere sempre.
      return (await androidGranted(hc)) ? 'connected' : 'ask';
    }
  } catch {
    // Módulo nativo ausente (Expo Go) ou erro do sistema.
  }
  return 'unsupported';
}

/** Abre a janela de autorização do Apple Saúde / Health Connect. Devolve se ficou autorizado. */
export async function connectSteps(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      const hk = healthKit();
      if (!hk) return false;
      await hk.requestAuthorization({ toRead: [STEPS_IOS] });
      // O iPhone não conta se a pessoa negou: se negou, os passos só aparecem zerados
      // (a tela mostra como liberar nos Ajustes).
      await AsyncStorage.setItem(ASKED_KEY, '1').catch(() => {});
      return true;
    }
    if (Platform.OS === 'android') {
      const hc = healthConnect();
      if (!hc || !(await hc.initialize())) return false;
      await hc.requestPermission([{ accessType: 'read', recordType: 'Steps' }]);
      return androidGranted(hc);
    }
  } catch {
    // A janela não abriu ou deu erro.
  }
  return false;
}

/** Abre onde a pessoa libera (ou tira) o acesso aos passos. */
export async function openHealthSettings() {
  try {
    if (Platform.OS === 'android') {
      healthConnect()?.openHealthConnectSettings();
      return;
    }
    // iPhone: o app Saúde (a permissão fica em Perfil > Apps > Gains Club).
    if (await Linking.canOpenURL('x-apple-health://')) await Linking.openURL('x-apple-health://');
    else await Linking.openSettings();
  } catch {
    Linking.openSettings().catch(() => {});
  }
}

/** Android: abre a Play Store para instalar ou atualizar o Health Connect. */
export function installHealthApp() {
  Linking.openURL(HEALTH_CONNECT_STORE).catch(() =>
    Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata').catch(() => {})
  );
}

/** Passos de um dia (0 = hoje). */
async function stepsOn(daysAgo: number): Promise<number> {
  const { start, end } = dayRange(daysAgo);
  if (Platform.OS === 'ios') {
    const hk = healthKit();
    if (!hk) return 0;
    const result = await hk.queryStatisticsForQuantity(STEPS_IOS, ['cumulativeSum'], {
      filter: { date: { startDate: start, endDate: end } },
      unit: 'count',
    });
    return Math.round(result.sumQuantity?.quantity ?? 0);
  }
  const hc = healthConnect();
  if (!hc) return 0;
  // O Health Connect já junta os passos de todas as fontes (celular, relógio) sem contar em dobro.
  const result = await hc.aggregateRecord({
    recordType: 'Steps',
    timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() },
  });
  return result.COUNT_TOTAL ?? 0;
}

/** Passos de hoje e dos 6 dias anteriores (o mais antigo primeiro). Null se não deu para ler. */
export async function readWeekSteps(): Promise<DaySteps[] | null> {
  try {
    if (Platform.OS === 'android') await healthConnect()?.initialize();
    const days = [6, 5, 4, 3, 2, 1, 0];
    const counts = await Promise.all(days.map(stepsOn));
    return days.map((d, i) => ({ date: dayRange(d).date, steps: counts[i] }));
  } catch {
    return null;
  }
}
