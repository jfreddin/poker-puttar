'use client';
import { HAND_RANKS, RULES } from '@/lib/rules';
import { CardView } from './CardView';

export function RulesPanel() {
  return (
    <details className="rules">
      <summary>RULES &amp; HAND RANKS</summary>
      <div className="rules-grid">
        <div>
          <h3>HAND RANKS · 1 = strongest</h3>
          <ol className="hand-list">
            {HAND_RANKS.map(r => (
              <li key={r.name}>
                <div className="hand-name">{r.name} <span className="muted">· {r.note}</span></div>
                <div className="hand-cards">
                  {r.cards.map(c => <CardView key={c} code={c} size="xs" />)}
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3>RULES</h3>
          <ul className="rule-list">{RULES.map(r => <li key={r}>{r}</li>)}</ul>
        </div>
      </div>
    </details>
  );
}
