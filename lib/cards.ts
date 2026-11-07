// Card codes: rank + suit, e.g. "AS" (ace of spades), "TH" (ten of hearts).
export const RANK_CHARS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
export const SUIT_CHARS = ['S', 'H', 'D', 'C'] as const;
export const SUIT_SYMBOL: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

export const rankText = (code: string) => (code[0] === 'T' ? '10' : code[0]);
export const suitSymbol = (code: string) => SUIT_SYMBOL[code[1]] ?? '';
export const isRedSuit = (code: string) => code[1] === 'H' || code[1] === 'D';
export const allCodes = () => SUIT_CHARS.flatMap(s => RANK_CHARS.map(r => r + s));
