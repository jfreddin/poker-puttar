export const HAND_RANKS: { name: string; cards: string[]; note: string }[] = [
  { name: 'Royal flush', cards: ['AS', 'KS', 'QS', 'JS', 'TS'], note: 'Ace-high straight, one suit' },
  { name: 'Straight flush', cards: ['9H', '8H', '7H', '6H', '5H'], note: 'Five in a row, one suit' },
  { name: 'Four of a kind', cards: ['KC', 'KD', 'KH', 'KS', '2C'], note: 'Four cards of one rank' },
  { name: 'Full house', cards: ['QS', 'QH', 'QD', '7C', '7H'], note: 'Three of one rank + a pair' },
  { name: 'Flush', cards: ['AD', 'JD', '8D', '5D', '2D'], note: 'Five cards of one suit' },
  { name: 'Straight', cards: ['TC', '9D', '8S', '7H', '6C'], note: 'Five in a row, mixed suits' },
  { name: 'Three of a kind', cards: ['8S', '8H', '8D', 'KC', '3S'], note: 'Three cards of one rank' },
  { name: 'Two pair', cards: ['AH', 'AC', '6D', '6S', '2H'], note: 'Two different pairs' },
  { name: 'Pair', cards: ['JS', 'JC', 'AD', '9H', '4S'], note: 'Two cards of one rank' },
  { name: 'High card', cards: ['AC', 'JH', '8D', '5S', '3C'], note: 'Nothing else; highest card wins' },
];

export const RULES: string[] = [
  'Blinds are posted automatically at the start of each hand. The dealer button moves one seat each hand.',
  'Pre-flop, action starts left of the big blind. After the flop, it starts with the first active seat left of the dealer.',
  'Check when nothing is owed. Call matches the current bet (all-in if short). Fold gives up your chips in the pot.',
  'A raise must be at least the size of the last raise. The raise box is your total for the street, not the extra amount.',
  'All-in puts your whole stack in. Side pots are made automatically when others have more chips in.',
  'A betting round ends when every active player has matched the bet or is all-in. Then the next card(s) are dealt.',
  'If everyone else folds, the last player takes the pot without a showdown.',
  'At showdown, pick the winner(s) of each pot. Split pots divide evenly; odd chips go to the seat left of the dealer.',
  'Players with 0 chips are out at the start of the next hand.',
  'Ace is high, and A-2-3-4-5 is the lowest straight. Ties are broken by the next-highest cards.',
];
