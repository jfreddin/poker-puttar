import type { CSSProperties } from 'react';

const DENOMS = [500, 100, 25, 5, 1];

// Decorative 3D chip stack for an amount (greedy by denomination, capped in height).
export function ChipStack({ amount, max = 9 }: { amount: number; max?: number }) {
  const chips: number[] = [];
  let left = Math.max(0, Math.floor(amount));
  for (const d of DENOMS) {
    while (left >= d && chips.length < 60) { chips.push(d); left -= d; }
  }
  // Show small denominations at the bottom, thin out very tall stacks.
  const step = Math.max(1, Math.ceil(chips.length / max));
  const shown = chips.filter((_, i) => i % step === 0).reverse();
  return (
    <span className="chipstack" aria-hidden="true">
      {shown.map((d, i) => (
        <i key={i} className={`chip c${d}`} style={{ '--i': i, animationDelay: `${i * 35}ms` } as CSSProperties} />
      ))}
    </span>
  );
}
