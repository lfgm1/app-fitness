// Refeições da aba Calorias: a pessoa dá o nome que quiser. Estes são só atalhos ao criar uma.

/** Refeição livre: a refeição "fora da dieta". Nela, os lanches e a pizza aparecem primeiro. */
export const FREE_MEAL = 'Refeição livre';

export const MEAL_SUGGESTIONS = [
  'Café da manhã',
  'Almoço',
  'Lanche',
  'Jantar',
  'Pré-treino',
  'Pós-treino',
  'Ceia',
  FREE_MEAL,
];

export function isFreeMeal(name: string) {
  return name.trim().toLowerCase() === FREE_MEAL.toLowerCase();
}

export const MEAL_NAME_MAX = 40;
