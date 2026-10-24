// Guarda os dados do app (treinos, registros, exercícios criados).
//
// Tudo é salvo primeiro no celular (AsyncStorage), para funcionar sem internet,
// e depois sincronizado com o banco de dados na nuvem (veja sync.ts).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';

import { DEFAULT_EXERCISES } from './exercises';
import type { Exercise, MuscleGroup } from './exercises';
import { isNetworkError, outboxKey, parseOutboxKey, pullChanges, pushChanges } from './sync';
import type { SyncRecord, TableName } from './sync';

/**
 * Uma série feita. Nos exercícios de tempo (ex: prancha) a série guarda só os segundos
 * (carga e repetições ficam 0).
 */
export type SetEntry = { weight: number; reps: number; seconds?: number };

export type SessionExercise = { exerciseId: string; sets: SetEntry[] };

/** Um treino criado pela pessoa, por exemplo "Peito" com 5 exercícios. */
export type Workout = {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: string;
  updatedAt?: string;
  deleted?: boolean;
};

/**
 * Bloco de treino: uma pasta com treinos em ordem (ex.: "PPL + UP"), só para organizar.
 * O mesmo treino pode estar em vários blocos.
 */
export type WorkoutBlock = {
  id: string;
  name: string;
  emoji: string;
  workoutIds: string[];
  createdAt: string;
  updatedAt?: string;
  deleted?: boolean;
};

/** Um treino feito em um dia, com as cargas e repetições de cada série. */
export type Session = {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  exercises: SessionExercise[];
  /** Quando foi registrado no app (o servidor confirma). É o que conta para o XP do Frank. */
  createdAt?: string;
  /**
   * Minutos de treino ativo (do primeiro ao último preenchimento, sem as pausas longas). Não aparece
   * para a pessoa: serve para estimar as calorias gastas. Vazio em treinos lançados depois ou antigos.
   */
  durationMin?: number;
  updatedAt?: string;
  deleted?: boolean;
};

/** Uma série ainda sendo digitada (texto, pode estar incompleta). */
export type DraftSet = { weight: string; reps: string };

/** Um treino em andamento, salvo automaticamente enquanto a pessoa registra. */
export type Draft = {
  date: string;
  sets: Record<string, DraftSet[]>;
  /** Exercícios adicionados só neste dia (não entram no treino montado). */
  extraIds?: string[];
  /** Exercícios do treino montado que foram pulados neste dia. */
  skippedIds?: string[];
  /** Tempo ativo até agora (ms) e a hora da última alteração, para a duração do treino. */
  activeMs?: number;
  lastActivityAt?: number;
};

/** Um alimento registrado numa refeição (aba Calorias). Calorias e macros já calculados. */
export type FoodLog = {
  id: string;
  /** Dia da refeição (AAAA-MM-DD, no celular). */
  day: string;
  /** Nome da refeição, escolhido pela pessoa ("Almoço", "Pré-treino"...). */
  meal: string;
  foodId: number;
  foodName: string;
  unit: 'colher' | 'concha' | 'unidade' | 'gramas' | 'ml';
  quantity: number;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  updatedAt?: string;
  deleted?: boolean;
};

/** Um alimento de uma refeição salva (a mesma porção é usada ao adicionar). */
export type SavedMealItem = Pick<
  FoodLog,
  'foodId' | 'foodName' | 'unit' | 'quantity' | 'grams' | 'kcal' | 'protein' | 'carbs' | 'fat'
>;

/** Refeição salva, para adicionar de uma vez em outro dia. */
export type SavedMeal = {
  id: string;
  name: string;
  items: SavedMealItem[];
  updatedAt?: string;
  deleted?: boolean;
};

type Data = {
  /** De qual conta são estes dados (undefined = dados de antes do login). */
  ownerId?: string;
  customExercises: Exercise[];
  workouts: Workout[];
  sessions: Session[];
  blocks: WorkoutBlock[];
  foodLogs: FoodLog[];
  savedMeals: SavedMeal[];
  /** Fila de envio: registros alterados no celular que o banco ainda não confirmou. */
  outbox: string[];
  /** Até quando já baixamos as mudanças do banco. */
  lastPulledAt: string | null;
};

const DATA_KEY = 'fitness-app/data/v1';
const DRAFTS_KEY = 'fitness-app/drafts/v1';
const SYNC_DELAY_MS = 1500;
const SYNC_INTERVAL_MS = 2 * 60 * 1000;

const emptyData = (ownerId: string): Data => ({
  ownerId,
  customExercises: [],
  workouts: [],
  sessions: [],
  blocks: [],
  foodLogs: [],
  savedMeals: [],
  outbox: [],
  lastPulledAt: null,
});

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Apaga os dados deste aparelho (usado ao sair da conta). */
export async function clearLocalData() {
  const profileKeys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('fitness-app/profile/'));
  await AsyncStorage.multiRemove([DATA_KEY, DRAFTS_KEY, ...profileKeys]);
}

// --- Ajudantes para ler e alterar as três coleções de forma genérica ---

type AnyRecord = Exercise | Workout | Session | WorkoutBlock | FoodLog | SavedMeal;

const COLLECTION = {
  custom_exercises: 'customExercises',
  workouts: 'workouts',
  sessions: 'sessions',
  workout_blocks: 'blocks',
  food_logs: 'foodLogs',
  saved_meals: 'savedMeals',
} as const satisfies Record<TableName, keyof Data>;

function getRecord(data: Data, table: TableName, id: string): AnyRecord | undefined {
  return (data[COLLECTION[table]] as AnyRecord[]).find((r) => r.id === id);
}

function putRecord(data: Data, table: TableName, record: AnyRecord): Data {
  const key = COLLECTION[table];
  const list = data[key] as AnyRecord[];
  const exists = list.some((r) => r.id === record.id);
  return { ...data, [key]: exists ? list.map((r) => (r.id === record.id ? record : r)) : [...list, record] };
}

function removeRecord(data: Data, table: TableName, id: string): Data {
  const key = COLLECTION[table];
  return { ...data, [key]: (data[key] as AnyRecord[]).filter((r) => r.id !== id) };
}

/** Grava uma alteração local e coloca na fila de envio. */
function change(data: Data, table: TableName, record: AnyRecord): Data {
  const stamped = { ...record, updatedAt: new Date().toISOString() };
  const key = outboxKey(table, record.id);
  const next = putRecord(data, table, stamped);
  return { ...next, outbox: next.outbox.includes(key) ? next.outbox : [...next.outbox, key] };
}

/** Prepara os dados salvos no aparelho para a conta que acabou de entrar. */
function adoptLocalData(raw: Partial<Data> | null, userId: string): { data: Data; keepDrafts: boolean } {
  if (!raw) return { data: emptyData(userId), keepDrafts: true };
  if (raw.ownerId && raw.ownerId !== userId) return { data: emptyData(userId), keepDrafts: false };

  const now = new Date().toISOString();
  const stamp = <T extends AnyRecord>(list: T[] | undefined) =>
    (list ?? []).map((r) => ({ ...r, updatedAt: r.updatedAt ?? now }));
  const data: Data = {
    ...emptyData(userId),
    ...raw,
    ownerId: userId,
    customExercises: stamp(raw.customExercises),
    workouts: stamp(raw.workouts),
    sessions: stamp(raw.sessions),
    blocks: stamp(raw.blocks),
    foodLogs: stamp(raw.foodLogs),
    savedMeals: stamp(raw.savedMeals),
    outbox: raw.outbox ?? [],
    lastPulledAt: raw.lastPulledAt ?? null,
  };

  // Dados de antes do login: envia tudo para a conta nova, para não perder nada.
  if (!raw.ownerId) {
    data.outbox = [
      ...data.customExercises.map((r) => outboxKey('custom_exercises', r.id)),
      ...data.workouts.map((r) => outboxKey('workouts', r.id)),
      ...data.sessions.map((r) => outboxKey('sessions', r.id)),
      ...data.blocks.map((r) => outboxKey('workout_blocks', r.id)),
      ...data.foodLogs.map((r) => outboxKey('food_logs', r.id)),
      ...data.savedMeals.map((r) => outboxKey('saved_meals', r.id)),
    ];
    data.lastPulledAt = null;
  }
  return { data, keepDrafts: true };
}

type Store = {
  loaded: boolean;
  exercises: Exercise[];
  customExercises: Exercise[];
  workouts: Workout[];
  sessions: Session[];
  blocks: WorkoutBlock[];
  /** Alimentos registrados (aba Calorias). */
  foodLogs: FoodLog[];
  savedMeals: SavedMeal[];
  drafts: Record<string, Draft>;
  syncNow: () => Promise<void>;
  /** Quantas alterações ainda não chegaram ao banco (valor atualizado na hora). */
  pendingNow: () => number;
  getExercise: (id: string) => Exercise | undefined;
  addCustomExercise: (name: string, group: MuscleGroup) => Exercise;
  /** Exclui um exercício criado pela pessoa e o tira dos treinos montados (o histórico é mantido). */
  deleteCustomExercise: (id: string) => void;
  saveWorkout: (workout: Pick<Workout, 'name' | 'exerciseIds'> & { id?: string }) => Workout;
  deleteWorkout: (id: string) => void;
  saveBlock: (block: Pick<WorkoutBlock, 'name' | 'emoji' | 'workoutIds'> & { id?: string }) => WorkoutBlock;
  deleteBlock: (id: string) => void;
  addSession: (session: Omit<Session, 'id' | 'createdAt'>) => Session;
  /** Corrige um treino já registrado (data e séries). */
  updateSession: (id: string, changes: Pick<Session, 'date' | 'exercises'>) => void;
  deleteSession: (id: string) => void;
  /** Apaga todo o histórico de treinos realizados (treinos montados e exercícios ficam). */
  deleteAllSessions: () => void;
  saveDraft: (workoutId: string, draft: Draft) => void;
  clearDraft: (workoutId: string) => void;
  addFoodLog: (log: Omit<FoodLog, 'id'>) => FoodLog;
  updateFoodLog: (id: string, changes: Partial<Omit<FoodLog, 'id'>>) => void;
  deleteFoodLog: (id: string) => void;
  /** Salva uma refeição para usar em outros dias (se já existe uma com o mesmo nome, substitui). */
  saveMeal: (name: string, items: SavedMealItem[]) => SavedMeal;
  deleteSavedMeal: (id: string) => void;
};

const StoreContext = createContext<Store | null>(null);

function persist(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch((err) => console.warn('Falha ao salvar dados', err));
}

export function StoreProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [data, setData] = useState<Data>(() => emptyData(userId));
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loaded, setLoaded] = useState(false);
  const dataRef = useRef(data);
  const draftsRef = useRef(drafts);
  const syncChain = useRef<Promise<void>>(Promise.resolve());
  const queuedSync = useRef<Promise<void> | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((fn: (prev: Data) => Data) => {
    const next = fn(dataRef.current);
    if (next === dataRef.current) return;
    dataRef.current = next;
    setData(next);
    persist(DATA_KEY, next);
  }, []);

  const updateDrafts = useCallback((fn: (prev: Record<string, Draft>) => Record<string, Draft>) => {
    const next = fn(draftsRef.current);
    draftsRef.current = next;
    setDrafts(next);
    persist(DRAFTS_KEY, next);
  }, []);

  /** Envia a fila e baixa as novidades do banco. Nunca lança erro. */
  const runSync = useCallback(async () => {
    try {
      // 1) Envia o que está na fila.
      const snapshot = dataRef.current;
      const items: SyncRecord[] = [];
      for (const key of snapshot.outbox) {
        const { table, id } = parseOutboxKey(key);
        const record = getRecord(snapshot, table, id);
        if (record) items.push({ table, record } as SyncRecord);
      }
      if (items.length > 0) await pushChanges(userId, items);

      // Tira da fila só o que foi confirmado e não mudou de novo enquanto enviava.
      const sent = new Map(items.map((i) => [outboxKey(i.table, i.record.id), i.record.updatedAt]));
      update((prev) => {
        let next = prev;
        const outbox = prev.outbox.filter((key) => {
          if (!sent.has(key)) return true;
          const { table, id } = parseOutboxKey(key);
          const current = getRecord(prev, table, id);
          if (current && current.updatedAt !== sent.get(key)) return true;
          if (current?.deleted) next = removeRecord(next, table, id); // exclusão confirmada
          return false;
        });
        return outbox.length === prev.outbox.length ? prev : { ...next, outbox };
      });

      // 2) Baixa o que mudou no banco (por exemplo, vindo de outro celular).
      const { records, latest } = await pullChanges(dataRef.current.lastPulledAt);
      update((prev) => {
        let next = prev;
        for (const { table, record } of records) {
          if (prev.outbox.includes(outboxKey(table, record.id))) continue; // a versão do celular é mais nova
          next = record.deleted ? removeRecord(next, table, record.id) : putRecord(next, table, record);
        }
        return latest === prev.lastPulledAt && next === prev ? prev : { ...next, lastPulledAt: latest };
      });
    } catch (err) {
      // Sem internet é esperado: a fila fica guardada e é enviada na próxima tentativa.
      if (!isNetworkError(err)) console.warn('Falha na sincronização', err);
    }
  }, [update, userId]);

  /**
   * Pede uma sincronização. Elas rodam uma de cada vez, em fila; se já houver
   * uma esperando, reaproveita. A promessa termina quando a sincronização pedida acabar.
   */
  const syncNow = useCallback(() => {
    if (queuedSync.current) return queuedSync.current;
    const run = syncChain.current.then(() => {
      queuedSync.current = null;
      return runSync();
    });
    queuedSync.current = run;
    syncChain.current = run;
    return run;
  }, [runSync]);

  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => void syncNow(), SYNC_DELAY_MS);
  }, [syncNow]);

  // Carrega os dados do aparelho e faz a primeira sincronização.
  useEffect(() => {
    let cancelled = false;
    Promise.all([AsyncStorage.getItem(DATA_KEY), AsyncStorage.getItem(DRAFTS_KEY)])
      .then(([rawData, rawDrafts]) => {
        if (cancelled) return;
        const { data: loadedData, keepDrafts } = adoptLocalData(rawData ? JSON.parse(rawData) : null, userId);
        dataRef.current = loadedData;
        setData(loadedData);
        persist(DATA_KEY, loadedData);
        const loadedDrafts = keepDrafts && rawDrafts ? (JSON.parse(rawDrafts) as Record<string, Draft>) : {};
        draftsRef.current = loadedDrafts;
        setDrafts(loadedDrafts);
        if (!keepDrafts) persist(DRAFTS_KEY, loadedDrafts);
      })
      .catch((err) => console.warn('Falha ao carregar dados', err))
      .finally(() => {
        if (cancelled) return;
        setLoaded(true);
        void syncNow();
      });
    return () => {
      cancelled = true;
    };
  }, [userId, syncNow]);

  // Sincroniza ao voltar para o app e periodicamente.
  useEffect(() => {
    if (!loaded) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNow();
    });
    const interval = setInterval(() => void syncNow(), SYNC_INTERVAL_MS);
    return () => {
      sub.remove();
      clearInterval(interval);
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [loaded, syncNow]);

  /** Alteração feita pela pessoa: salva no aparelho e agenda o envio. */
  const commit = useCallback(
    (table: TableName, record: AnyRecord) => {
      update((prev) => change(prev, table, record));
      scheduleSync();
    },
    [update, scheduleSync]
  );

  const saveDraft = useCallback(
    (workoutId: string, draft: Draft) => updateDrafts((prev) => ({ ...prev, [workoutId]: draft })),
    [updateDrafts]
  );
  const clearDraft = useCallback(
    (workoutId: string) => {
      if (!(workoutId in draftsRef.current)) return;
      updateDrafts((prev) => {
        const { [workoutId]: _removed, ...rest } = prev;
        return rest;
      });
    },
    [updateDrafts]
  );

  const store = useMemo<Store>(() => {
    const customExercises = data.customExercises.filter((e) => !e.deleted);
    const exercises = [...DEFAULT_EXERCISES, ...customExercises];
    // Exercícios personalizados excluídos continuam com nome nos registros antigos.
    const byId = new Map([...DEFAULT_EXERCISES, ...data.customExercises].map((e) => [e.id, e]));
    const workouts = data.workouts.filter((w) => !w.deleted);
    const sessions = data.sessions.filter((s) => !s.deleted);
    const blocks = data.blocks.filter((b) => !b.deleted);
    const foodLogs = data.foodLogs.filter((l) => !l.deleted);
    const savedMeals = data.savedMeals.filter((m) => !m.deleted);

    return {
      loaded,
      exercises,
      customExercises,
      workouts,
      sessions,
      blocks,
      foodLogs,
      savedMeals,
      drafts,
      syncNow,
      pendingNow: () => dataRef.current.outbox.length,
      getExercise: (id) => byId.get(id),

      addCustomExercise: (name, group) => {
        const exercise: Exercise = { id: 'custom-' + newId(), name: name.trim(), group, custom: true };
        commit('custom_exercises', exercise);
        return exercise;
      },

      deleteCustomExercise: (id) => {
        const existing = dataRef.current.customExercises.find((e) => e.id === id);
        if (!existing) return;
        commit('custom_exercises', { ...existing, deleted: true });
        for (const workout of dataRef.current.workouts) {
          if (!workout.deleted && workout.exerciseIds.includes(id)) {
            commit('workouts', { ...workout, exerciseIds: workout.exerciseIds.filter((x) => x !== id) });
          }
        }
      },

      saveWorkout: ({ id, name, exerciseIds }) => {
        const existing = id ? dataRef.current.workouts.find((w) => w.id === id) : undefined;
        const workout: Workout = existing
          ? { ...existing, name: name.trim(), exerciseIds }
          : { id: newId(), name: name.trim(), exerciseIds, createdAt: new Date().toISOString() };
        commit('workouts', workout);
        return workout;
      },

      deleteWorkout: (id) => {
        const existing = dataRef.current.workouts.find((w) => w.id === id);
        if (existing) commit('workouts', { ...existing, deleted: true });
        // Sai também dos blocos em que estava.
        for (const block of dataRef.current.blocks) {
          if (!block.deleted && block.workoutIds.includes(id)) {
            commit('workout_blocks', { ...block, workoutIds: block.workoutIds.filter((x) => x !== id) });
          }
        }
        clearDraft(id);
      },

      saveBlock: ({ id, name, emoji, workoutIds }) => {
        const existing = id ? dataRef.current.blocks.find((b) => b.id === id) : undefined;
        const block: WorkoutBlock = existing
          ? { ...existing, name: name.trim(), emoji, workoutIds }
          : { id: newId(), name: name.trim(), emoji, workoutIds, createdAt: new Date().toISOString() };
        commit('workout_blocks', block);
        return block;
      },

      deleteBlock: (id) => {
        // Os treinos do bloco continuam existindo (só a pasta some).
        const existing = dataRef.current.blocks.find((b) => b.id === id);
        if (existing) commit('workout_blocks', { ...existing, deleted: true });
      },

      addSession: (session) => {
        const saved: Session = { ...session, id: newId(), createdAt: new Date().toISOString() };
        commit('sessions', saved);
        return saved;
      },

      updateSession: (id, changes) => {
        const existing = dataRef.current.sessions.find((s) => s.id === id);
        if (existing) commit('sessions', { ...existing, ...changes });
      },

      deleteSession: (id) => {
        const existing = dataRef.current.sessions.find((s) => s.id === id);
        if (existing) commit('sessions', { ...existing, deleted: true });
      },

      deleteAllSessions: () => {
        // Uma única gravação para todos os registros, em vez de uma por registro.
        update((prev) =>
          prev.sessions
            .filter((s) => !s.deleted)
            .reduce((next, s) => change(next, 'sessions', { ...s, deleted: true }), prev)
        );
        scheduleSync();
      },

      saveDraft,
      clearDraft,

      addFoodLog: (log) => {
        const saved: FoodLog = { ...log, id: newId() };
        commit('food_logs', saved);
        return saved;
      },

      updateFoodLog: (id, changes) => {
        const existing = dataRef.current.foodLogs.find((l) => l.id === id);
        if (existing) commit('food_logs', { ...existing, ...changes });
      },

      deleteFoodLog: (id) => {
        const existing = dataRef.current.foodLogs.find((l) => l.id === id);
        if (existing) commit('food_logs', { ...existing, deleted: true });
      },

      saveMeal: (name, items) => {
        const clean = name.trim();
        const existing = dataRef.current.savedMeals.find(
          (m) => !m.deleted && m.name.toLowerCase() === clean.toLowerCase()
        );
        const meal: SavedMeal = existing ? { ...existing, name: clean, items } : { id: newId(), name: clean, items };
        commit('saved_meals', meal);
        return meal;
      },

      deleteSavedMeal: (id) => {
        const existing = dataRef.current.savedMeals.find((m) => m.id === id);
        if (existing) commit('saved_meals', { ...existing, deleted: true });
      },
    };
  }, [data, drafts, loaded, syncNow, commit, update, scheduleSync, saveDraft, clearDraft]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return store;
}
