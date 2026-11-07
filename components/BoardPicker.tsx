'use client';
import { useState } from 'react';
import { RANK_CHARS, SUIT_CHARS, SUIT_SYMBOL } from '@/lib/cards';
import { CardView } from './CardView';

// Dealer enters the public board cards as they are turned over.
export function BoardPicker({ board, need, canEdit, onAdd, onRemove }: {
  board: string[]; need: number; canEdit: boolean;
  onAdd: (code: string) => void; onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const used = new Set(board);
  const full = board.length >= need;

  return (
    <div className="board-picker">
      <div className="board-row">
        {Array.from({ length: 5 }, (_, i) => {
          const code = board[i];
          if (code) return <CardView key={`${i}-${code}`} code={code} size="md" delay={0} />;
          const next = i === board.length && canEdit && !full;
          return (
            <button
              key={`slot-${i}`}
              className={`pcard slot ${i < need ? 'needed' : ''}`}
              disabled={!next}
              onClick={() => setOpen(true)}
              aria-label={next ? 'Add board card' : 'Empty board slot'}
            >
              {next ? '+' : ''}
            </button>
          );
        })}
      </div>

      <div className="board-actions">
        <span className="muted">
          {board.length}/{need} cards for this street
        </span>
        {canEdit && board.length > 0 && <button className="mini" onClick={onRemove}>REMOVE LAST</button>}
        {canEdit && !full && <button className="mini" onClick={() => setOpen(o => !o)}>{open ? 'CLOSE' : 'ADD CARD'}</button>}
      </div>

      {open && canEdit && !full && (
        <div className="picker">
          {SUIT_CHARS.map(suit => (
            <div key={suit} className={`picker-row ${suit === 'H' || suit === 'D' ? 'red' : ''}`}>
              {RANK_CHARS.map(rank => {
                const code = rank + suit;
                const taken = used.has(code);
                return (
                  <button
                    key={code}
                    className="pick-btn"
                    disabled={taken}
                    onClick={() => { onAdd(code); }}
                    aria-label={`${rank} of ${suit}`}
                  >
                    {rank === 'T' ? '10' : rank}{SUIT_SYMBOL[suit]}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
