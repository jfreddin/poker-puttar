// Pure poker pot engine. Every function takes a Game and returns a new Game (or an error).
// Cards are tracked only for the public board; hole cards are never stored.

export type Phase = 'deal' | 'bet' | 'showdown' | 'done' | 'over';
export const STAGES = ['Pre-flop', 'Flop', 'Turn', 'River'] as const;
export const BOARD_NEEDED = [0, 3, 4, 5] as const; // cumulative board cards per stage

export interface Config { sb: number; bb: number; startTotal: number }
export interface Player {
  id: number; name: string; stack: number; bet: number; total: number;
  folded: boolean; allIn: boolean; acted: boolean; out: boolean;
}
export interface Hand {
  stage: number; phase: Phase; sb: number; bb: number;
  toAct: number; currentBet: number; minRaise: number;
  board: string[];                 // card codes like "AS", "TH"
  picks: Record<number, number[]>; // potIndex -> winner player indexes
  foldWin: number;                 // player index who won uncontested, else -1
  log: string[];
  results: string[];
}
export interface Game {
  cfg: Config; players: Player[]; dealer: number; handNo: number; hand: Hand;
}
export interface Pot { amount: number; eligible: number[] }
export type ActionKind = 'fold' | 'call' | 'raise' | 'allin';
export type Result = { game: Game; error?: string };

const emptyHand = (): Hand => ({
  stage: 0, phase: 'over', sb: -1, bb: -1, toAct: -1, currentBet: 0, minRaise: 0,
  board: [], picks: {}, foldWin: -1, log: [], results: [],
});
const clone = (g: Game): Game => structuredClone(g);
const fail = (game: Game, error: string): Result => ({ game, error });
const ok = (game: Game): Result => ({ game });

export function createGame(names: string[], start: number, sb: number, bb: number): Result {
  if (![start, sb, bb].every(Number.isFinite) || sb < 1 || bb < sb || start < bb * 2)
    return fail({} as Game, 'Check chips: SB ≥ 1, BB ≥ SB, start chips ≥ 2 × BB');
  const clean = names.map((n, i) => n.trim() || `Player ${i + 1}`);
  if (new Set(clean.map(n => n.toLowerCase())).size < clean.length)
    return fail({} as Game, 'Player names must be unique');
  const g: Game = {
    cfg: { sb, bb, startTotal: start * clean.length },
    players: clean.map((name, id) => ({
      id, name, stack: start, bet: 0, total: 0, folded: false, allIn: false, acted: false, out: false,
    })),
    dealer: -1, handNo: 0, hand: emptyHand(),
  };
  startHand(g);
  return ok(g);
}

/* ---------- helpers ---------- */
function canAct(p: Player) { return !p.out && !p.folded && !p.allIn; }

function nextAlive(g: Game, from: number): number {
  const n = g.players.length;
  for (let k = 1; k <= n; k++) {
    const i = (((from + k) % n) + n) % n;
    if (!g.players[i].out) return i;
  }
  return -1;
}

function findActor(g: Game, start: number): number {
  const n = g.players.length, h = g.hand;
  for (let k = 0; k < n; k++) {
    const i = (((start + k) % n) + n) % n;
    const p = g.players[i];
    if (canAct(p) && (!p.acted || p.bet < h.currentBet)) return i;
  }
  return -1;
}

function post(g: Game, i: number, amt: number) {
  const p = g.players[i];
  const x = Math.min(amt, p.stack);
  p.stack -= x; p.bet += x; p.total += x;
  if (p.stack === 0) p.allIn = true;
}

export function potTotal(g: Game): number { return g.players.reduce((s, p) => s + p.total, 0); }
export function chipTotal(g: Game): number { return g.players.reduce((s, p) => s + p.stack + p.total, 0); }

/* ---------- hand flow ---------- */
function startHand(g: Game) {
  const P = g.players;
  P.forEach(p => {
    if (p.stack <= 0) p.out = true;
    p.bet = 0; p.total = 0; p.folded = false; p.allIn = false; p.acted = false;
  });
  const alive = P.filter(p => !p.out).length;
  if (alive < 2) {
    const w = P.find(p => !p.out);
    g.hand = { ...emptyHand(), phase: 'over', log: [w ? `${w.name} wins the game` : 'Game over'] };
    return;
  }
  const dealer = nextAlive(g, g.dealer);
  g.dealer = dealer;
  g.handNo += 1;
  const sb = alive === 2 ? dealer : nextAlive(g, dealer);
  const bb = nextAlive(g, sb);
  post(g, sb, g.cfg.sb);
  post(g, bb, g.cfg.bb);
  g.hand = {
    ...emptyHand(), phase: 'deal', stage: 0, sb, bb,
    currentBet: Math.max(P[sb].bet, P[bb].bet), minRaise: g.cfg.bb,
    log: [
      `Hand ${g.handNo}: ${P[dealer].name} is dealer`,
      `${P[sb].name} posts small blind ${P[sb].bet}`,
      `${P[bb].name} posts big blind ${P[bb].bet}`,
    ],
  };
}

function beginBetting(g: Game) {
  const h = g.hand, P = g.players;
  if (h.stage > 0) { P.forEach(p => { p.bet = 0; p.acted = false; }); h.currentBet = 0; }
  h.minRaise = g.cfg.bb;
  h.phase = 'bet';
  h.toAct = h.stage === 0 ? h.bb : g.dealer; // settle() looks from toAct + 1
  settle(g);
}

function settle(g: Game) {
  const h = g.hand, P = g.players;
  const live = P.filter(p => !p.out && !p.folded);
  if (live.length === 1) {
    h.foldWin = P.indexOf(live[0]);
    h.phase = 'showdown';
    h.toAct = -1;
    h.log.push(`${live[0].name} wins uncontested`);
    return;
  }
  const can = P.filter(canAct);
  const needs = can.filter(p => !p.acted || p.bet < h.currentBet);
  const complete = needs.length === 0 || (can.length === 1 && can[0].bet === h.currentBet);
  if (!complete) {
    h.toAct = findActor(g, h.toAct + 1);
    return;
  }
  if (h.stage === 3) {
    h.phase = 'showdown';
    h.toAct = -1;
    h.log.push('Showdown');
    return;
  }
  h.stage += 1;
  h.phase = 'deal';
  h.toAct = -1;
  h.log.push(`${STAGES[h.stage]}: deal`);
}

function commit(g: Game, p: Player, to: number): string {
  const h = g.hand, P = g.players;
  const target = Math.min(to, p.bet + p.stack);
  const amt = target - p.bet;
  const before = h.currentBet;
  p.stack -= amt; p.bet += amt; p.total += amt; p.acted = true;
  if (p.stack === 0) p.allIn = true;
  const tag = p.allIn ? ' (all-in)' : '';
  if (target > before) {
    const inc = target - before;
    if (inc >= h.minRaise) h.minRaise = inc;
    h.currentBet = target;
    P.forEach(q => { if (q !== p && canAct(q)) q.acted = false; });
    return `raises to ${target}${tag}`;
  }
  return amt === 0 ? 'checks' : `calls ${amt}${tag}`;
}

/* ---------- public actions ---------- */
export interface ActionInfo {
  toAct: number; toCall: number; minTo: number; maxTo: number; canRaise: boolean; canCheck: boolean;
}
export function actionInfo(g: Game): ActionInfo | null {
  const h = g.hand;
  if (h.phase !== 'bet') return null;
  const p = g.players[h.toAct];
  const maxTo = p.bet + p.stack;
  return {
    toAct: h.toAct,
    toCall: Math.min(h.currentBet - p.bet, p.stack),
    minTo: Math.min(h.currentBet + h.minRaise, maxTo),
    maxTo,
    canRaise: maxTo > h.currentBet,
    canCheck: h.currentBet - p.bet === 0,
  };
}

export function act(g0: Game, kind: ActionKind, amount?: number): Result {
  const g = clone(g0);
  const h = g.hand;
  if (h.phase !== 'bet') return fail(g0, 'Betting is not open');
  const p = g.players[h.toAct];
  if (!p) return fail(g0, 'No player to act');
  if (kind === 'fold') {
    p.folded = true; p.acted = true;
    h.log.push(`${p.name} folds`);
  } else {
    let to: number;
    if (kind === 'call') to = h.currentBet;
    else if (kind === 'allin') to = p.bet + p.stack;
    else {
      const v = Math.floor(Number(amount));
      const maxTo = p.bet + p.stack;
      if (!Number.isFinite(v)) return fail(g0, 'Enter a raise amount');
      if (v > maxTo) return fail(g0, `Max you can bet is ${maxTo}`);
      if (v <= h.currentBet) return fail(g0, `Raise must be above ${h.currentBet}`);
      if (v < h.currentBet + h.minRaise && v !== maxTo)
        return fail(g0, `Min raise to ${h.currentBet + h.minRaise}`);
      to = v;
    }
    h.log.push(`${p.name} ${commit(g, p, to)}`);
  }
  settle(g);
  return ok(g);
}

export function nextStreet(g0: Game): Result {
  const g = clone(g0);
  const h = g.hand;
  if (h.phase !== 'deal') return fail(g0, 'Not time to deal');
  if (h.board.length !== BOARD_NEEDED[h.stage])
    return fail(g0, `Board needs ${BOARD_NEEDED[h.stage]} card(s) before betting`);
  beginBetting(g);
  return ok(g);
}

export function addBoardCard(g0: Game, code: string): Result {
  const g = clone(g0);
  const h = g.hand;
  if (h.phase !== 'deal') return fail(g0, 'Board can only change between betting rounds');
  if (h.board.includes(code)) return fail(g0, `${code} is already on the board`);
  const need = BOARD_NEEDED[h.stage];
  if (h.board.length >= need) return fail(g0, `Board already has ${need} card(s) for this street`);
  h.board.push(code);
  return ok(g);
}

export function removeBoardCard(g0: Game, index: number): Result {
  const g = clone(g0);
  if (g.hand.phase !== 'deal') return fail(g0, 'Board can only change between betting rounds');
  g.hand.board.splice(index, 1);
  return ok(g);
}

/* ---------- pots & showdown ---------- */
export function pots(g: Game): Pot[] {
  const h = g.hand, P = g.players;
  if (h.foldWin >= 0) return [{ amount: potTotal(g), eligible: [h.foldWin] }];
  const levels = [...new Set(P.map(p => p.total).filter(x => x > 0))].sort((a, b) => a - b);
  const out: Pot[] = [];
  let prev = 0, carry = 0;
  for (const L of levels) {
    let amt = carry; carry = 0;
    P.forEach(p => { amt += Math.min(p.total, L) - Math.min(p.total, prev); });
    const elig: number[] = [];
    P.forEach((p, i) => { if (!p.out && !p.folded && p.total >= L) elig.push(i); });
    if (elig.length) {
      const last = out[out.length - 1];
      // same contenders as the previous level => same pot, not a side pot
      if (last && last.eligible.join() === elig.join()) last.amount += amt;
      else out.push({ amount: amt, eligible: elig });
    } else carry = amt;
    prev = L;
  }
  if (carry > 0) {
    if (out.length) out[out.length - 1].amount += carry;
    else out.push({ amount: carry, eligible: P.map((_, i) => i).filter(i => !P[i].folded && !P[i].out) });
  }
  return out;
}

export function togglePick(g0: Game, potIndex: number, player: number): Result {
  const g = clone(g0);
  const pot = pots(g)[potIndex];
  if (!pot || !pot.eligible.includes(player)) return fail(g0, 'That player cannot win this pot');
  const cur = potWinners(g, potIndex).slice();
  const k = cur.indexOf(player);
  if (k >= 0) cur.splice(k, 1); else cur.push(player);
  g.hand.picks[potIndex] = cur;
  return ok(g);
}

export function award(g0: Game): Result {
  const g = clone(g0);
  const h = g.hand, P = g.players, n = P.length;
  const list = pots(g);
  const plan = list.map((pot, i) => h.picks[i] ?? (pot.eligible.length === 1 ? pot.eligible : []));
  if (h.phase !== 'showdown') return fail(g0, 'Hand is not at showdown');
  if (plan.some(w => w.length === 0)) return fail(g0, 'Pick a winner for every pot');
  const results: string[] = [];
  list.forEach((pot, i) => {
    // odd chips go to the winner closest to the left of the dealer
    const winners = plan[i].slice().sort((a, b) =>
      ((a - g.dealer - 1 + n) % n) - ((b - g.dealer - 1 + n) % n));
    const each = Math.floor(pot.amount / winners.length);
    const rem = pot.amount % winners.length;
    winners.forEach((w, k) => { P[w].stack += each + (k < rem ? 1 : 0); });
    const line = `${i === 0 ? 'Main pot' : 'Side pot ' + i} ${pot.amount} → ${winners.map(w => P[w].name).join(', ')}`;
    results.push(line);
    h.log.push(line);
  });
  P.forEach(p => { p.total = 0; p.bet = 0; });
  h.results = results;
  h.phase = 'done';
  h.picks = {};
  return ok(g);
}

export function nextHand(g0: Game): Result {
  const g = clone(g0);
  if (g.hand.phase !== 'done') return fail(g0, 'Finish the current hand first');
  startHand(g);
  return ok(g);
}

// Helper for the UI: a fold-win pot is decided automatically, anything else needs picks.
// Winners currently chosen for a pot (auto for single-eligible pots).
export function potWinners(g: Game, potIndex: number): number[] {
  const pot = pots(g)[potIndex];
  if (!pot) return [];
  return g.hand.picks[potIndex] ?? (pot.eligible.length === 1 ? pot.eligible : []);
}
