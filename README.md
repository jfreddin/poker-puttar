# Poker Pot

Dealer and pot manager for a live home game. It tracks stacks, bets, raises, side pots and the public board. It does **not** store or show hole cards, so nothing private is visible on screen.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production build
npm test         # engine tests (vitest)
```

## What it does

- Setup: 2–10 players, names, starting chips, small and big blind.
- Blinds are posted automatically; the dealer button rotates each hand.
- Betting: fold, check/call, raise to a total (minimum enforced, presets for ½ pot, pot, all-in), all-in.
- Board entry: pick each board card from a card picker. The street only advances once the right number of cards is on the board.
- Pots: main and side pots are built automatically from each player's total contribution.
- Showdown: pick the winner(s) of each pot. Ties split evenly; odd chips go to the seat left of the dealer.
- Undo, persistence in the browser (localStorage), and a rules & hand-ranks panel.

## Layout

- `lib/engine.ts` — pure game engine (no React). All betting, pot and award logic lives here.
- `lib/store.ts` — reducer with undo history and localStorage persistence.
- `lib/cards.ts`, `lib/rules.ts` — card codes and the rules reference.
- `components/` — card art, felt table, action bar, board picker, showdown, setup, rules.
- `tests/engine.test.ts` — engine tests (pots, betting, odd chips, next hand).
