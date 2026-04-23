// app-theme.jsx — live theme tokens. Mutates TOKENS in place so existing
// consumers (which read TOKENS.bg etc at render time) pick up changes on re-render.

const LIGHT = {
  bg:      '#FAFAF9',
  surface: '#FFFFFF',
  ink:     '#1A1A1A',
  muted:   '#6B6B6B',
  subtle:  '#A0A0A0',
  line:    '#ECECEA',
  lineStrong: '#D8D8D5',
  shell:   '#EDEDEA',
  chipBg:  '#FFFFFF',
};

const DARK = {
  bg:      '#0E0E0E',
  surface: '#1A1A1A',
  ink:     '#F4F4F2',
  muted:   '#A0A099',
  subtle:  '#6B6B65',
  line:    '#262626',
  lineStrong: '#333333',
  shell:   '#000000',
  chipBg:  '#222222',
};

// Global accent palettes — NEUTRAL by default so per-routine colors aren't
// fighting an app-wide accent. Each has: accent, accentSoft, accentInk.
const ACCENTS = {
  ink:    { accent: 'oklch(0.28 0.01 250)', accentSoft: 'oklch(0.95 0.005 250)', accentInk: 'oklch(0.28 0.01 250)',
           accentDark: 'oklch(0.90 0.005 250)', accentSoftDark: 'oklch(0.22 0.01 250)', accentInkDark: 'oklch(0.90 0.005 250)' },
  stone:  { accent: 'oklch(0.55 0.02 70)',  accentSoft: 'oklch(0.95 0.01 70)',   accentInk: 'oklch(0.40 0.03 70)',
           accentDark: 'oklch(0.78 0.02 70)', accentSoftDark: 'oklch(0.22 0.015 70)', accentInkDark: 'oklch(0.82 0.02 70)' },
  ocean:  { accent: 'oklch(0.52 0.08 230)', accentSoft: 'oklch(0.95 0.02 230)',  accentInk: 'oklch(0.42 0.09 230)',
           accentDark: 'oklch(0.74 0.08 230)', accentSoftDark: 'oklch(0.22 0.04 230)', accentInkDark: 'oklch(0.80 0.08 230)' },
  clay:   { accent: 'oklch(0.55 0.09 40)',  accentSoft: 'oklch(0.95 0.02 40)',   accentInk: 'oklch(0.44 0.10 40)',
           accentDark: 'oklch(0.72 0.09 40)', accentSoftDark: 'oklch(0.22 0.04 40)', accentInkDark: 'oklch(0.80 0.09 40)' },
};

// Routine color palette — muted, couture tones. Lower chroma so each feels
// like a fabric/pigment choice, not a highlighter. 8 hues, all C ≤ 0.09.
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

// Returns the currently-selected primary (global +) color from Tweaks,
// or 'clay' as the default.
function getPrimaryColor() {
  const id = (typeof window !== 'undefined' && window.__gymTweaks && window.__gymTweaks.globalPlusColor) || 'clay';
  return getRoutineColor(id);
}

// Reads a single tweak value, falling back to `fallback`.
function tweak(key, fallback) {
  const t = (typeof window !== 'undefined' && window.__gymTweaks) || {};
  return (key in t) ? t[key] : fallback;
}

// CSS text-transform for CTA buttons (respects the "Uppercase CTAs" tweak).
function ctaCase() {
  return tweak('uppercaseCTAs', true) ? 'uppercase' : 'none';
}

// Live TOKENS — mutated on theme change so existing consumers just work
const TOKENS = {
  ...LIGHT,
  accent: ACCENTS.ink.accent,
  accentSoft: ACCENTS.ink.accentSoft,
  accentInk: ACCENTS.ink.accentInk,
  danger: '#B23A3A',
  success: 'oklch(0.55 0.08 145)',
  font: '"Inter", -apple-system, system-ui, sans-serif',
  fontDisplay: '"Space Grotesk", "Inter", -apple-system, system-ui, sans-serif',
};

function applyTheme({ dark, accent }) {
  const base = dark ? DARK : LIGHT;
  Object.assign(TOKENS, base);
  const a = ACCENTS[accent] || ACCENTS.ink;
  TOKENS.accent = dark ? a.accentDark : a.accent;
  TOKENS.accentSoft = dark ? a.accentSoftDark : a.accentSoft;
  TOKENS.accentInk = dark ? a.accentInkDark : a.accentInk;
  TOKENS.danger = dark ? '#E06C6C' : '#B23A3A';
  TOKENS.success = dark ? 'oklch(0.72 0.08 145)' : 'oklch(0.55 0.08 145)';
  // For dark mode, chip bg slightly lifts; for light, stays white
  TOKENS.chipBg = base.chipBg;
  // Update shell (area outside device)
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.background = base.shell;
  }
}

Object.assign(window, { TOKENS, applyTheme, ACCENTS, ROUTINE_COLORS, getRoutineColor, getPrimaryColor, tweak, ctaCase });
