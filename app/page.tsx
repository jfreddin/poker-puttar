'use client';
import { useEffect, useReducer } from 'react';
import { reducer, initialState, loadSaved, saveState } from '@/lib/store';
import {
  act, actionInfo, addBoardCard, award, chipTotal, nextHand, nextStreet, potTotal,
  removeBoardCard, togglePick, BOARD_NEEDED, STAGES, type ActionKind, type Game, type Result,
} from '@/lib/engine';
import { SetupForm } from '@/components/SetupForm';
import { Table } from '@/components/Table';
import { BoardPicker } from '@/components/BoardPicker';
import { ActionBar } from '@/components/ActionBar';
import { Showdown } from '@/components/Showdown';
import { RulesPanel } from '@/components/RulesPanel';

export default function Page() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load the saved game after mount (keeps server and client markup identical).
  useEffect(() => {
    const s = loadSaved();
    dispatch({ type: 'hydrate', past: s.past, game: s.game });
  }, []);
  useEffect(() => { if (state.ready) saveState(state); }, [state]);

  const apply = (fn: (g: Game) => Result) => dispatch({ type: 'apply', fn });
  const game = state.game;

  if (!state.ready) return <Shell />;

  if (!game) {
    return (
      <Shell>
        <SetupForm
          error={state.error}
          onStart={(names, start, sb, bb) => dispatch({ type: 'start', names, start, sb, bb })}
        />
        <RulesPanel />
      </Shell>
    );
  }

  const h = game.hand;
  const total = chipTotal(game);
  const chipsOk = total === game.cfg.startTotal;
  const need = BOARD_NEEDED[Math.min(h.stage, 3)];
  const info = actionInfo(game);

  return (
    <Shell>
      <header className="topbar">
        <div><span className="muted">HAND</span> <b>{game.handNo}</b></div>
        <div><span className="muted">STREET</span> <b>{STAGES[h.stage]}</b></div>
        <div><span className="muted">BLINDS</span> <b>{game.cfg.sb}/{game.cfg.bb}</b></div>
        <div><span className="muted">POT</span> <b className="pot-top">{potTotal(game)}</b></div>
        <div className={chipsOk ? 'muted' : 'warn'}>CHIPS {total}{chipsOk ? '' : ' MISMATCH'}</div>
        <div className="topbar-buttons">
          <button className="mini" disabled={!state.past.length} onClick={() => dispatch({ type: 'undo' })}>UNDO</button>
          <button className="mini" onClick={() => { if (window.confirm('Reset the whole game?')) dispatch({ type: 'reset' }); }}>RESET</button>
        </div>
      </header>

      <Table game={game} />

      <section className="controls">
        {state.error && <div className="error">{state.error}</div>}

        {h.phase === 'over' && (
          <div className="over">
            <div className="section-title">{h.log[0]}</div>
            <button className="primary" onClick={() => dispatch({ type: 'reset' })}>NEW GAME</button>
          </div>
        )}

        {h.phase === 'deal' && (
          <div className="deal">
            <div className="section-title">DEALER</div>
            <p className="muted">
              {h.stage === 0
                ? 'Deal 2 hole cards to each player. Nothing is tracked here.'
                : `Burn 1 card, then turn over the ${STAGES[h.stage].toLowerCase()}. Enter it below.`}
            </p>
            {h.stage > 0 && (
              <BoardPicker
                board={h.board}
                need={need}
                canEdit
                onAdd={code => apply(g => addBoardCard(g, code))}
                onRemove={() => apply(g => removeBoardCard(g, g.hand.board.length - 1))}
              />
            )}
            <button className="primary" onClick={() => apply(g => nextStreet(g))}>
              {h.stage === 0 ? 'START BETTING' : `${STAGES[h.stage].toUpperCase()} DEALT · START BETTING`}
            </button>
          </div>
        )}

        {h.phase === 'bet' && info && (
          <ActionBar
            key={`${game.handNo}-${h.stage}-${h.toAct}-${h.currentBet}`}
            game={game}
            onAct={(kind: ActionKind, amount?: number) => apply(g => act(g, kind, amount))}
          />
        )}

        {(h.phase === 'showdown' || h.phase === 'done') && (
          <>
            <Showdown
              game={game}
              onPick={(pi, pl) => apply(g => togglePick(g, pi, pl))}
              onAward={() => apply(g => award(g))}
              onNextHand={() => apply(g => nextHand(g))}
            />
          </>
        )}

        {h.log.length > 0 && (
          <div className="log">
            {h.log.slice(-12).map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
      </section>

      <RulesPanel />
    </Shell>
  );
}

function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <main className="app">
      <h1 className="brand">POKER POT</h1>
      {children}
    </main>
  );
}
