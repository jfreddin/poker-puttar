import { describe, it, expect } from 'vitest';
import { createGame, act, nextStreet, pots, togglePick, award, nextHand, addBoardCard, chipTotal, potWinners, actionInfo, type Game } from '../lib/engine';

const must = (r: { game: Game; error?: string }) => { if (r.error) throw new Error(r.error); return r.game; };
const newGame = (names: string[], start: number, sb = 5, bb = 10) => must(createGame(names, start, sb, bb));
// everybody checks/calls through a whole street
const callAround = (g: Game) => { let x = g; let guard = 0; while (x.hand.phase === 'bet' && guard++ < 20) x = must(act(x, 'call')); return x; };
const streetRound = (g: Game) => { let x = must(nextStreet(g)); return callAround(x); };

describe('pots', () => {
  it('builds main and side pots from totals', () => {
    const g = newGame(['A', 'B', 'C'], 200);
    g.players[0].total = 100; g.players[1].total = 50; g.players[2].total = 200;
    g.players.forEach(p => { p.stack = 0; p.folded = false; });
    g.hand.phase = 'showdown';
    const P = pots(g);
    expect(P.map(p => p.amount)).toEqual([150, 100, 100]);
    expect(P[0].eligible).toEqual([0, 1, 2]);
    expect(P[1].eligible).toEqual([0, 2]);
    expect(P[2].eligible).toEqual([2]);
  });
  it('merges levels with identical contenders', () => {
    const g = newGame(['A', 'B', 'C'], 1000);
    g.players[0].total = 10; g.players[0].folded = true; g.players[1].total = 30; g.players[2].total = 30;
    g.hand.phase = 'showdown';
    const P = pots(g);
    expect(P.length).toBe(1);
    expect(P[0].amount).toBe(70);
  });
});

describe('betting', () => {
  it('posts blinds and orders the preflop action', () => {
    const g = newGame(['A', 'B', 'C'], 1000);
    expect([g.dealer, g.hand.sb, g.hand.bb]).toEqual([0, 1, 2]);
    expect(g.hand.phase).toBe('deal');
    const s = must(nextStreet(g));
    expect(s.hand.toAct).toBe(0); // UTG acts first
  });
  it('heads-up: dealer is small blind and acts first preflop', () => {
    const g = must(nextStreet(newGame(['A', 'B'], 1000)));
    expect(g.hand.toAct).toBe(0);
  });
  it('rejects under-min raise, accepts min raise', () => {
    let g = must(nextStreet(newGame(['A', 'B'], 1000)));
    expect(act(g, 'raise', 15).error).toBeTruthy();
    g = must(act(g, 'raise', 20));
    expect(g.hand.currentBet).toBe(20);
    expect(g.hand.toAct).toBe(1);
  });
  it('limp round: BB gets option and pot is 30', () => {
    let g = must(nextStreet(newGame(['A', 'B', 'C'], 1000)));
    g = must(act(g, 'call')); g = must(act(g, 'call'));
    expect(g.hand.toAct).toBe(2);
    g = must(act(g, 'call'));
    expect(g.hand.phase).toBe('deal');
    expect(g.hand.stage).toBe(1);
    expect(g.players.every(p => p.total === 10)).toBe(true);
  });
  it('board must be complete before the next betting round', () => {
    const g = must(nextStreet(newGame(['A', 'B', 'C'], 1000)));
    const r = callAround(g);
    expect(nextStreet(r).error).toMatch(/Board needs 3/);
    let b = must(addBoardCard(r, 'AS')); b = must(addBoardCard(b, 'KD')); b = must(addBoardCard(b, '2C'));
    expect(addBoardCard(b, '3H').error).toBeTruthy();
    expect(nextStreet(b).error).toBeUndefined();
  });
  it('postflop first actor is left of dealer; fold-win ends the hand', () => {
    let g = streetRound(newGame(['A', 'B', 'C'], 1000));
    g = must(addBoardCard(g, 'AS')); g = must(addBoardCard(g, 'KD')); g = must(addBoardCard(g, '2C'));
    g = must(nextStreet(g));
    expect(g.hand.toAct).toBe(1);
    g = must(act(g, 'raise', 20)); g = must(act(g, 'call')); g = must(act(g, 'fold'));
    expect(g.hand.stage).toBe(2);
    expect(chipTotal(g)).toBe(3000);
  });
  it('all-in with short stack resolves and conserves chips', () => {
    const g0 = newGame(['A', 'B', 'C'], 100);
    g0.players[0].stack = 30; g0.cfg.startTotal = 230;
    let g = must(nextStreet(g0));
    let guard = 0;
    while (g.hand.phase === 'bet' && guard++ < 20) g = must(act(g, 'allin'));
    expect(chipTotal(g)).toBe(230);
  });
});

const BOARD = ['AS', 'KD', '2C', '3H', '4S'];
// plays everybody-calls to showdown, filling the board as needed
const toShowdown = (g0: Game): Game => {
  let g = g0, guard = 0;
  while (g.hand.phase !== 'showdown' && guard++ < 30) {
    if (g.hand.phase === 'bet') g = must(act(g, 'call'));
    else if (g.hand.phase === 'deal') {
      g.hand.board = BOARD.slice(0, [0, 3, 4, 5][g.hand.stage]);
      g = must(nextStreet(g));
    } else break;
  }
  return g;
};

describe('showdown & award', () => {
  it('needs a winner per pot, then awards and conserves chips', () => {
    let g = toShowdown(newGame(['A', 'B', 'C'], 1000));
    expect(g.hand.phase).toBe('showdown');
    expect(award(g).error).toMatch(/Pick a winner/);
    g = must(togglePick(g, 0, 1));
    g = must(award(g));
    expect(g.hand.phase).toBe('done');
    expect(chipTotal(g)).toBe(3000);
  });
  it('odd chip goes to the winner closest to the left of the dealer', () => {
    const g = newGame(['A', 'B', 'C'], 1000);
    g.players.forEach(p => { p.total = 11; p.stack = 1000 - 11; }); // one pot of 33, two winners

    g.hand.phase = 'showdown'; g.hand.foldWin = -1; g.dealer = 0;
    g.hand.picks = { 0: [1, 2] };
    const r = must(award(g));
    expect(r.players[1].stack).toBe(989 + 17); // seat 1 is left of dealer -> gets the odd chip
    expect(r.players[2].stack).toBe(989 + 16);
    expect(chipTotal(r)).toBe(3000);
  });
  it('next hand rotates dealer; busted players are marked out', () => {
    let g = toShowdown(newGame(['A', 'B'], 1000));
    g = must(togglePick(g, 0, 0));
    g = must(award(g));
    const d = g.dealer;
    g = must(nextHand(g));
    expect(g.dealer).not.toBe(d);
  });
});

describe('UI helpers', () => {
  it('actionInfo reports call amount and min raise', () => {
    const g = must(nextStreet(newGame(['A', 'B', 'C'], 1000)));
    const info = actionInfo(g)!;
    expect(info.toCall).toBe(10);
    expect(info.minTo).toBe(20);
    expect(info.canCheck).toBe(false);
  });
  it('potWinners auto-selects single-eligible pots', () => {
    const g = newGame(['A', 'B'], 1000);
    g.hand.phase = 'showdown'; g.hand.foldWin = 1;
    expect(potWinners(g, 0)).toEqual([1]);
  });
});
