import { createGame, type Game, type Result } from './engine';

export interface AppState {
  past: Game[];          // undo history
  game: Game | null;
  error: string;
  ready: boolean;        // false until localStorage has been read (avoids hydration flicker)
}

export type Action =
  | { type: 'hydrate'; past: Game[]; game: Game | null }
  | { type: 'start'; names: string[]; start: number; sb: number; bb: number }
  | { type: 'apply'; fn: (g: Game) => Result }
  | { type: 'undo' }
  | { type: 'reset' }
  | { type: 'error'; msg: string };

export const initialState: AppState = { past: [], game: null, error: '', ready: false };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return { past: action.past, game: action.game, error: '', ready: true };
    case 'start': {
      const r = createGame(action.names, action.start, action.sb, action.bb);
      if (r.error) return { ...state, error: r.error };
      return { past: [], game: r.game, error: '', ready: true };
    }
    case 'apply': {
      if (!state.game) return state;
      const r = action.fn(state.game);
      if (r.error) return { ...state, error: r.error };
      return { ...state, past: [...state.past, state.game].slice(-300), game: r.game, error: '' };
    }
    case 'undo': {
      if (!state.past.length) return state;
      return { ...state, past: state.past.slice(0, -1), game: state.past[state.past.length - 1], error: '' };
    }
    case 'reset':
      return { ...initialState, ready: true };
    case 'error':
      return { ...state, error: action.msg };
  }
}

const KEY = 'poker-pot-next-v1';

export function loadSaved(): { past: Game[]; game: Game | null } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore: private mode or corrupt data */
  }
  return { past: [], game: null };
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ past: state.past, game: state.game }));
  } catch {
    /* ignore quota / private mode */
  }
}
