'use client';
import { useState } from 'react';

export function SetupForm({ onStart, error }: {
  onStart: (names: string[], start: number, sb: number, bb: number) => void;
  error: string;
}) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState<string[]>(['Alice', 'Bob']);
  const [start, setStart] = useState('1000');
  const [sb, setSb] = useState('5');
  const [bb, setBb] = useState('10');

  const setCountSafe = (n: number) => {
    setCount(n);
    setNames(prev => Array.from({ length: n }, (_, i) => prev[i] ?? ''));
  };

  return (
    <div className="setup">
      <h2>New game</h2>
      <div className="fields">
        <label className="field">
          <span>PLAYERS</span>
          <select value={count} onChange={e => setCountSafe(Number(e.target.value))}>
            {Array.from({ length: 9 }, (_, i) => i + 2).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="field"><span>START CHIPS</span>
          <input type="number" min={2} value={start} onChange={e => setStart(e.target.value)} />
        </label>
        <label className="field"><span>SMALL BLIND</span>
          <input type="number" min={1} value={sb} onChange={e => setSb(e.target.value)} />
        </label>
        <label className="field"><span>BIG BLIND</span>
          <input type="number" min={1} value={bb} onChange={e => setBb(e.target.value)} />
        </label>
      </div>
      <div className="names">
        {names.map((name, i) => (
          <label key={i} className="field">
            <span>SEAT {i + 1}</span>
            <input
              type="text"
              maxLength={16}
              value={name}
              placeholder={`Player ${i + 1}`}
              onChange={e => setNames(prev => prev.map((v, j) => (j === i ? e.target.value : v)))}
            />
          </label>
        ))}
      </div>
      <div className="error">{error}</div>
      <button className="primary" onClick={() => onStart(names, Number(start), Number(sb), Number(bb))}>
        START GAME
      </button>
    </div>
  );
}
