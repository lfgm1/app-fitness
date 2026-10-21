// Perfil da pessoa: nome, nascimento e dados usados em metas e estimativas.
// Fica no banco (tabela profiles) com uma cópia no celular para abrir sem internet.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

export type Sex = 'male' | 'female' | 'unspecified';
export type Goal = 'gain_muscle' | 'lose_fat' | 'strength' | 'health';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type WeightUnit = 'kg' | 'lb';

export type Profile = {
  name: string | null;
  birthDate: string | null;
  sex: Sex | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: Goal | null;
  experience: Experience | null;
  dailyStepGoal: number | null;
  onboardingCompleted: boolean;
  /** Preferências de treino. */
  weightUnit: WeightUnit;
  defaultSets: number;
};

export const SEX_LABELS: Record<Sex, string> = {
  male: 'Masculino',
  female: 'Feminino',
  unspecified: 'Prefiro não informar',
};

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export const EXPERIENCE_HINTS: Record<Experience, string> = {
  beginner: 'Menos de 1 ano',
  intermediate: '1 a 5 anos',
  advanced: '5+ anos',
};

const EMPTY_PROFILE: Profile = {
  name: null,
  birthDate: null,
  sex: null,
  heightCm: null,
  weightKg: null,
  goal: null,
  experience: null,
  dailyStepGoal: null,
  onboardingCompleted: false,
  weightUnit: 'kg',
  defaultSets: 2,
};

 
function fromRow(row: any): Profile {
  return {
    name: row.name,
    birthDate: row.birth_date,
    sex: row.sex,
    heightCm: row.height_cm,
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    goal: row.goal,
    experience: row.experience,
    dailyStepGoal: row.daily_step_goal,
    onboardingCompleted: row.onboarding_completed,
    weightUnit: row.weight_unit ?? 'kg',
    defaultSets: row.default_sets ?? 2,
  };
}

function toRow(profile: Profile) {
  return {
    name: profile.name,
    birth_date: profile.birthDate,
    sex: profile.sex,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    goal: profile.goal,
    experience: profile.experience,
    daily_step_goal: profile.dailyStepGoal,
    onboarding_completed: profile.onboardingCompleted,
    weight_unit: profile.weightUnit,
    default_sets: profile.defaultSets,
  };
}

type ProfileStore = {
  /** null enquanto carrega (ou se não deu para carregar sem internet). */
  profile: Profile | null;
  loaded: boolean;
  /** Salva no banco. Lança erro se não conseguir (ex: sem internet). */
  saveProfile: (profile: Profile) => Promise<void>;
};

const ProfileContext = createContext<ProfileStore | null>(null);

export function ProfileProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const cacheKey = `fitness-app/profile/${userId}`;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await AsyncStorage.getItem(cacheKey).catch(() => null);
      if (cached && !cancelled) setProfile({ ...EMPTY_PROFILE, ...JSON.parse(cached) });
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
        if (error) throw error;
        const fresh = data ? fromRow(data) : EMPTY_PROFILE;
        if (!cancelled) setProfile(fresh);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(fresh));
      } catch (err) {
        console.warn('Não foi possível carregar o perfil', err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, userId]);

  const saveProfile = useCallback(
    async (next: Profile) => {
      const { error } = await supabase.from('profiles').upsert({ user_id: userId, ...toRow(next) });
      if (error) throw error;
      setProfile(next);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(next));
    },
    [cacheKey, userId]
  );

  const value = useMemo(() => ({ profile, loaded, saveProfile }), [profile, loaded, saveProfile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useProfile precisa estar dentro de <ProfileProvider>');
  return value;
}
