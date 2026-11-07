'use client';
import { pots, potWinners, type Game } from '@/lib/engine';

// Picks a winner for each pot (split pots can have several winners).
export function Showdown({ game, onPick, onAward, onNextHand }: {
  game: Game;
  onPick: (potIndex: number, player: number) => void;
  onAward: () => void;
  onNextHand: () => void;
}) {
  const h = game.hand;
  const list = pots(game);
  if (h.phase === 'done') {
    return (
      <div className="showdown">
        <div className="section-title">HAND COMPLETE</div>
        <ul className="results">{h.results.map(r => <li key={r}>{r}</li>)}</ul>
        <button className="primary" onClick={onNextHand}>NEXT HAND</button>
      </div>
    );
  }
  const ready = list.every((_, i) => potWinners(game, i).length > 0);
  return (
    <div className="showdown">
      <div className="section-title">SHOWDOWN</div>
      {list.map((pot, i) => (
        <div key={i} className="pot-row">
          <span className="pot-name">{i === 0 ? 'Main pot' : `Side pot ${i}`}</span>
          <span className="pot-amount">{pot.amount}</span>
          <div className="pot-choices">
            {pot.eligible.map(j => {
              const picked = potWinners(game, i).includes(j);
              return (
                <button key={j} className={picked ? 'sel' : ''} onClick={() => onPick(i, j)}>
                  {game.players[j].name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button className="primary" disabled={!ready} onClick={onAward}>AWARD POTS</button>
    </div>
  );
}

