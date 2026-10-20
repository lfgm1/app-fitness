import { Alert, Platform } from 'react-native';

import type { SetEntry } from '@/data/store';

/** 42.5 -> "42,5" (padrão brasileiro). */
export function formatWeight(kg: number) {
  return String(Math.round(kg * 100) / 100).replace('.', ',');
}

export function formatSet(set: SetEntry) {
  return `${formatWeight(set.weight)}kg × ${set.reps}`;
}

/** Aceita "42,5" ou "42.5". Retorna null se não for um número válido. */
export function parseNumber(text: string): number | null {
  const n = Number(text.replace(',', '.').trim());
  return text.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const pad = (n: number) => String(n).padStart(2, '0');

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatShortDate(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function formatDateLong(iso: string) {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getDay()]}, ${formatDate(iso)}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Quantos dias antes de hoje (0 = hoje, 1 = ontem...). */
export function daysAgo(iso: string, now = new Date()) {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((start(now) - start(d)) / 86400000);
}

/** "Hoje", "Ontem" ou "Sáb, 18/10/2026". */
export function formatDayLabel(iso: string, now = new Date()) {
  const d = new Date(iso);
  if (sameDay(d, now)) return 'Hoje';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Ontem';
  return formatDateLong(iso);
}

/** Move a data alguns dias para trás (negativo) ou para frente (positivo). */
export function shiftDays(iso: string, delta: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + delta);
  return d.toISOString();
}

/** Pergunta de confirmação que funciona no celular e no navegador. */
export function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
