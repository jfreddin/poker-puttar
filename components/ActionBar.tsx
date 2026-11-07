'use client';
import { useState } from 'react';
import { actionInfo, potTotal, type ActionKind, type Game } from '@/lib/engine';

// Betting controls for the player to act. Amounts are street totals ("raise to").
export function ActionBar({ game, onAct }: {
  game: Game; onAct: (kind: ActionKind, amount?: number) => void;
}) {
  const info = actionInfo(game);
  if (!info) return null;
  const p = game.players[info.toAct];
  const pot = potTotal(game);
  const h = game.hand;
  const clamp = (v: number) => Math.min(info.maxTo, Math.max(info.minTo, Math.round(v)));
  const presets: [string, number][] = [
    ['MIN', info.minTo],
    ['½ POT', h.currentBet + Math.round((pot + info.toCall) / 2)],
    ['POT', h.currentBet + pot + info.toCall],
    ['ALL-IN', info.maxTo],
  ];
  const [raise, setRaise] = useState(String(info.minTo));
  const raiseNum = Number(raise);

  return (
    <div className="actions">
      <div className="action-buttons">
        <button className="danger" onClick={() => onAct('fold')}>FOLD</button>
        <button onClick={() => onAct('call')}>
          {info.canCheck ? 'CHECK' : `CALL ${info.toCall}`}
        </button>
        <button className="primary" disabled={!info.canRaise} onClick={() => onAct('raise', raiseNum)}>
          RAISE TO {raiseNum}
        </button>
        <button onClick={() => onAct('allin')}>ALL-IN {info.maxTo}</button>
      </div>

      {info.canRaise && (
        <div className="raise-panel">
          <input
            type="range"
            min={info.minTo}
            max={info.maxTo}
            step={1}
            value={clamp(raiseNum || info.minTo)}
            onChange={e => setRaise(e.target.value)}
            aria-label="Raise amount"
          />
          <input
            type="number"
            className="raise-input"
            value={raise}
            min={info.minTo}
            max={info.maxTo}
            onChange={e => setRaise(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onAct('raise', raiseNum); }}
            aria-label="Raise to amount"
          />
          <div className="presets">
            {presets.map(([label, v]) => (
              <button key={label} className="mini" onClick={() => setRaise(String(clamp(v)))}>{label}</button>
            ))}
          </div>
          <span className="muted">min raise to {info.minTo} · {p.name} has {p.stack}</span>
        </div>
      )}
    </div>
  );
}
