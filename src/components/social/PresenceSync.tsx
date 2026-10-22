// Avisa o banco, a cada minuto com o app aberto, que a pessoa está online e se tem treino em
// andamento (aparece para os amigos como "Treinando Upper"). Não desenha nada.

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/data/auth';
import { touchPresence } from '@/data/social';
import { useStore } from '@/data/store';

const EVERY_MS = 60 * 1000;

export function PresenceSync() {
  const { session } = useAuth();
  const { workouts, drafts, loaded } = useStore();
  const userId = session?.user.id;
  // Só qual treino tem rascunho e de que dia (digitar as séries não muda isso).
  const draftKey = Object.keys(drafts)
    .map((id) => `${id}|${drafts[id].date}`)
    .join(',');

  useEffect(() => {
    if (!userId || !loaded) return;
    // Treino em andamento hoje (um rascunho de dias atrás esquecido não conta).
    const today = new Date().toDateString();
    const activeId = draftKey
      .split(',')
      .map((entry) => entry.split('|'))
      .find(([, date]) => date && new Date(date).toDateString() === today)?.[0];
    const activity = (activeId && workouts.find((w) => w.id === activeId)?.name) || null;
    let timer: ReturnType<typeof setInterval> | null = null;
    const ping = () => touchPresence(activity).catch(() => {});
    const start = () => {
      if (timer) return;
      ping();
      timer = setInterval(ping, EVERY_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    // Só conta como online com o app na tela; em segundo plano para de avisar (e vira offline).
    if (AppState.currentState === 'active') start();
    const sub = AppState.addEventListener('change', (state) => (state === 'active' ? start() : stop()));
    return () => {
      stop();
      sub.remove();
    };
  }, [userId, loaded, draftKey, workouts]);

  return null;
}
