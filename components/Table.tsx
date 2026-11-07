'use client';
import { BOARD_NEEDED, STAGES, pots, potWinners, type Game } from '@/lib/engine';
import { CardView } from './CardView';
import { ChipStack } from './ChipStack';
import { AnimatedNumber } from './AnimatedNumber';

// Seats sit on an ellipse; seat 0 is at the bottom.
function seatPos(i: number, n: number) {
  const t = Math.PI / 2 + (2 * Math.PI * i) / n;
  return { left: 50 + 40 * Math.cos(t), top: 50 + 38 * Math.sin(t) };
}

export function Table({ game }: { game: Game }) {
  const { players: P, hand: h, dealer } = game;
  const n = P.length;
  const potSum = P.reduce((s, p) => s + p.total, 0);
  const winners = new Set<number>();
  if (h.phase === 'showdown' || h.phase === 'done') {
    pots(game).forEach((_, i) => potWinners(game, i).forEach(w => winners.add(w)));
  }
  const sidePots = h.phase === 'showdown' ? pots(game).length : 0;
  const need = BOARD_NEEDED[Math.min(h.stage, 3)];

  let instruction = '';
  if (h.phase === 'over') instruction = h.log[0] ?? 'Game over';
  else if (h.phase === 'deal') instruction = `Deal ${h.stage === 0 ? 'hole cards' : `the ${STAGES[h.stage].toLowerCase()}`}. Then start betting.`;
  else if (h.phase === 'bet') instruction = `${P[h.toAct]?.name} to act`;
  else if (h.phase === 'showdown') instruction = 'Showdown: pick the winner(s) of each pot';
  else if (h.phase === 'done') instruction = 'Hand complete';

  return (
    <div className="felt-wrap">
      <div className="felt">
        <div className="felt-center">
          <div className="stage">{h.phase === 'over' ? 'GAME OVER' : STAGES[h.stage]}</div>
          <div className="pot-label">POT</div>
          <div className="pot-value"><AnimatedNumber value={potSum} /></div>
          <div className="pot-chips"><ChipStack key={potSum > 0 ? 'p' : 'e'} amount={potSum} max={12} /></div>
          {sidePots > 1 && <div className="side-count">{sidePots} pots</div>}
          <div className="board">
            {Array.from({ length: 5 }, (_, i) => {
              const code = h.board[i];
              const shownNeed = i < need;
              return code ? (
                <CardView key={`${game.handNo}-${i}-${code}`} code={code} size="sm" delay={i * 80} />
              ) : (
                <div key={`empty-${i}`} className={`pcard slot ${shownNeed ? 'needed' : ''}`} />
              );
            })}
          </div>
          <div className="instruction">{instruction}</div>
        </div>

        {P.map((p, i) => {
          const pos = seatPos(i, n);
          const active = h.phase === 'bet' && h.toAct === i;
          const isWinner = winners.has(i);
          const status = p.out ? 'OUT' : p.folded ? 'FOLDED' : p.allIn ? 'ALL-IN' : active ? 'TO ACT' : '';
          return (
            <div
              key={p.id}
              className={`seat ${active ? 'active' : ''} ${p.folded || p.out ? 'dim' : ''} ${isWinner ? 'winner' : ''}`}
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            >
              <div className="seat-cards">
                {!p.out && !p.folded && h.phase !== 'over' && (
                  <>
                    <CardView back size="xs" delay={i * 60} />
                    <CardView back size="xs" delay={i * 60 + 40} />
                  </>
                )}
              </div>
              <div className="seat-body">
                <div className="seat-name">
                  {p.name}
                  <span className="roles">
                    {i === dealer && <span className="tag dealer">D</span>}
                    {h.phase !== 'over' && i === h.sb && <span className="tag">SB</span>}
                    {h.phase !== 'over' && i === h.bb && <span className="tag">BB</span>}
                  </span>
                </div>
                <div className="seat-stack">{p.stack}</div>
                {p.bet > 0 && <div key={p.bet} className="bet-chip"><ChipStack amount={p.bet} max={6} /><span>{p.bet}</span></div>}
                {status && <div className="seat-status">{status}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
