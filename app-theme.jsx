// app-theme.jsx — tokens + routine palette.

const TOKENS = {
  bg:      '#FAFAF9',
  surface: '#FFFFFF',
  ink:     '#1A1A1A',
  muted:   '#6B6B6B',
  subtle:  '#A0A0A0',
  line:    '#ECECEA',
  lineStrong: '#D8D8D5',
  chipBg:  '#FFFFFF',
  accent:     'oklch(0.28 0.01 250)',
  accentSoft: 'oklch(0.95 0.005 250)',
  accentInk:  'oklch(0.28 0.01 250)',
  danger:  '#B23A3A',
  success: 'oklch(0.55 0.08 145)',
  font:        '"Inter", -apple-system, system-ui, sans-serif',
  fontDisplay: '"Space Grotesk", "Inter", -apple-system, system-ui, sans-serif',
};

// Routine color palette — muted, couture tones (chroma ≤ 0.09).
const ROUTINE_COLORS = [
  { id: 'clay',     base: 'oklch(0.68 0.09 35)',   soft: 'oklch(0.95 0.02 35)',  ink: 'oklch(0.44 0.09 35)'  },
  { id: 'sand',     base: 'oklch(0.80 0.06 85)',   soft: 'oklch(0.96 0.02 85)',  ink: 'oklch(0.48 0.06 85)'  },
  { id: 'sage',     base: 'oklch(0.72 0.06 145)',  soft: 'oklch(0.95 0.02 145)', ink: 'oklch(0.44 0.06 145)' },
  { id: 'mist',     base: 'oklch(0.74 0.05 200)',  soft: 'oklch(0.95 0.02 200)', ink: 'oklch(0.44 0.06 200)' },
  { id: 'steel',    base: 'oklch(0.62 0.06 245)',  soft: 'oklch(0.95 0.02 245)', ink: 'oklch(0.42 0.07 245)' },
  { id: 'iris',     base: 'oklch(0.64 0.08 290)',  soft: 'oklch(0.95 0.02 290)', ink: 'oklch(0.44 0.09 290)' },
  { id: 'rose',     base: 'oklch(0.70 0.08 350)',  soft: 'oklch(0.95 0.02 350)', ink: 'oklch(0.46 0.09 350)' },
  { id: 'graphite', base: 'oklch(0.50 0.01 250)',  soft: 'oklch(0.94 0.003 250)',ink: 'oklch(0.32 0.01 250)' },
];

function getRoutineColor(id) {
  return ROUTINE_COLORS.find(c => c.id === id) || ROUTINE_COLORS[0];
}

Object.assign(window, { TOKENS, ROUTINE_COLORS, getRoutineColor });
