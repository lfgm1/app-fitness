// Frank Flap: o jogo do descanso. A cabeça do Frank voa entre barras com anilhas.
// A partida de cada treino fica guardada aqui (na memória) e continua de onde parou a cada
// descanso. Ao salvar ou descartar o treino, ela é apagada (clearFlap).

export const FLAP_W = 276;
export const FLAP_H = 300;
export const GROUND = 22;

const FRANK_X = 70;
const FRANK_R = 14;
const GRAVITY = 0.32;
const JUMP = -5.2;
const SPEED = 2;
const GAP = 112;
const BAR_W = 40;
const BAR_EVERY = 150;

export type Bar = { x: number; gapY: number; passed: boolean };

export type FlapGame = {
  y: number;
  velocity: number;
  bars: Bar[];
  score: number;
  best: number;
  dead: boolean;
  /** Parado esperando o primeiro toque (no começo e ao continuar no próximo descanso). */
  waiting: boolean;
  /** Andou quanto (para o chão "correr"). */
  distance: number;
};

const games = new Map<string, FlapGame>();

function newRun(best: number): FlapGame {
  return { y: FLAP_H / 2, velocity: 0, bars: [], score: 0, best, dead: false, waiting: true, distance: 0 };
}

/** A partida do treino (cria uma nova na primeira vez). */
export function getFlap(workoutId: string) {
  let game = games.get(workoutId);
  if (!game) {
    game = newRun(0);
    games.set(workoutId, game);
  }
  return game;
}

/** Treino salvo ou descartado: o jogo começa do zero no próximo. */
export function clearFlap(workoutId: string) {
  games.delete(workoutId);
}

/** Novo descanso: o Frank fica parado no ar até o primeiro toque (para não cair antes de você reagir). */
export function holdFlap(workoutId: string) {
  const game = getFlap(workoutId);
  if (!game.dead) game.waiting = true;
}

/** Toque na tela: o Frank pula (ou recomeça a rodada, se bateu; o recorde do treino fica). */
export function flap(workoutId: string) {
  const game = getFlap(workoutId);
  if (game.dead) {
    games.set(workoutId, { ...newRun(game.best), waiting: false, velocity: JUMP });
    return;
  }
  game.waiting = false;
  game.velocity = JUMP;
}

/** Avança o jogo. "steps" = quantos quadros de 1/60 s se passaram. */
export function stepFlap(game: FlapGame, steps: number) {
  if (game.dead || game.waiting) return;
  game.distance += SPEED * steps;
  game.velocity += GRAVITY * steps;
  game.y += game.velocity * steps;

  const lastBar = game.bars[game.bars.length - 1];
  if (!lastBar || lastBar.x < FLAP_W - BAR_EVERY) {
    const min = 60 + GAP / 2;
    const max = FLAP_H - GROUND - 40 - GAP / 2;
    game.bars.push({ x: FLAP_W + 10, gapY: min + Math.random() * (max - min), passed: false });
  }
  for (const bar of game.bars) {
    bar.x -= SPEED * steps;
    if (!bar.passed && bar.x + BAR_W < FRANK_X) {
      bar.passed = true;
      game.score += 1;
      game.best = Math.max(game.best, game.score);
    }
    const insideX = FRANK_X + FRANK_R > bar.x && FRANK_X - FRANK_R < bar.x + BAR_W;
    const hitsBar = game.y - FRANK_R < bar.gapY - GAP / 2 || game.y + FRANK_R > bar.gapY + GAP / 2;
    if (insideX && hitsBar) game.dead = true;
  }
  game.bars = game.bars.filter((bar) => bar.x > -BAR_W - 10);
  if (game.y + FRANK_R > FLAP_H - GROUND || game.y - FRANK_R < 0) game.dead = true;
}

export const FLAP_LAYOUT = { FRANK_X, FRANK_R, GAP, BAR_W };
