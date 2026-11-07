import type { CSSProperties } from 'react';
import { rankText, suitSymbol, isRedSuit } from '@/lib/cards';

type Size = 'xs' | 'sm' | 'md' | 'lg';

// Shows a playing card as a picture: face with rank + suit corners and a big pip, or a card back.
export function CardView({ code, back = false, size = 'md', delay = 0 }: {
  code?: string; back?: boolean; size?: Size; delay?: number;
}) {
  const style = { animationDelay: `${delay}ms` } as CSSProperties;
  if (back || !code) {
    return <div className={`pcard back ${size}`} style={style} aria-label="face-down card" />;
  }
  const red = isRedSuit(code);
  const r = rankText(code), s = suitSymbol(code);
  return (
    <div className={`pcard face ${size} ${red ? 'red' : ''}`} style={style} aria-label={`${r} of ${s}`}>
      <span className="corner tl"><b>{r}</b><i>{s}</i></span>
      <span className="pip">{s}</span>
      <span className="corner br"><b>{r}</b><i>{s}</i></span>
    </div>
  );
}
