import { Alert, Platform } from 'react-native';

/** 42.5 -> "42,5" (padrão brasileiro). */
export function formatWeight(value: number) {
  return String(Math.round(value * 100) / 100).replace('.', ',');
}


/** Aceita "42,5" ou "42.5". Retorna null se não for um número válido. */
export function parseNumber(text: string): number | null {
  const n = Number(text.replace(',', '.').trim());
  return text.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null;
}

/** Segundos -> "0:45" ou "1:10". */
export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Tempo digitado -> segundos. Aceita "1:10", "45" (segundos) ou "1.10". */
export function parseDuration(text: string): number | null {
  const t = text.trim().replace('.', ':').replace(',', ':');
  if (!t) return null;
  const match = /^(\d+)(?::(\d{1,2}))?$/.exec(t);
  if (!match) return null;
  if (match[2] === undefined) return Number(match[1]);
  const seconds = Number(match[2]);
  return seconds < 60 ? Number(match[1]) * 60 + seconds : null;
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
/** Uma janela de confirmação ou aviso do próprio app (veja components/DialogHost). */
export type DialogRequest = { title: string; message: string; confirmLabel?: string; onConfirm?: () => void };

let showDialog: ((request: DialogRequest) => void) | null = null;

/** O DialogHost se registra aqui para mostrar as janelas no navegador. */
export function setDialogHandler(handler: ((request: DialogRequest) => void) | null) {
  showDialog = handler;
}

// No navegador, as janelas do próprio navegador (window.confirm/alert) podem ser bloqueadas, principalmente
// no app instalado no iPhone. Por isso, no site, as confirmações usam a janela do próprio app.
export function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (showDialog) showDialog({ title, message, confirmLabel, onConfirm });
    else if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function notify(title: string, message: string) {
  if (Platform.OS !== 'web') Alert.alert(title, message);
  else if (showDialog) showDialog({ title, message });
  else window.alert(`${title}\n\n${message}`);
}

/** Formata enquanto a pessoa digita: "15031995" -> "15/03/1995". */
export function maskDate(text: string) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
}

/** "15/03/1995" -> "1995-03-15". Retorna null se a data não existir. */
export function parseBirthDate(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const valid =
    date.getFullYear() === Number(yyyy) && date.getMonth() === Number(mm) - 1 && date.getDate() === Number(dd);
  return valid ? `${yyyy}-${mm}-${dd}` : null;
}

/** "1995-03-15" -> "15/03/1995". */
export function formatBirthDate(iso: string) {
  const [yyyy, mm, dd] = iso.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

/** Idade completa em anos a partir de "AAAA-MM-DD". */
export function ageFrom(iso: string, now = new Date()) {
  const [yyyy, mm, dd] = iso.split('-').map(Number);
  let age = now.getFullYear() - yyyy;
  if (now.getMonth() + 1 < mm || (now.getMonth() + 1 === mm && now.getDate() < dd)) age--;
  return age;
}
