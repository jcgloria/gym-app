// app-store.jsx — localStorage-backed data model + hooks for the gym app
// Data shape:
//   exercises: [{ id, name }]
//   routines:  [{ id, name, color, exerciseIds: [] }]
//   sessions:  [{ id, date (ISO), routineId, entries: [{ exerciseId, sets: [{ weight, reps }] }] }]

const STORAGE_KEY = 'gym-app-v1';

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultState = () => ({
  exercises: [],
  routines: [],
  sessions: [],
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return migrate({ ...defaultState(), ...parsed });
  } catch (e) {
    return defaultState();
  }
}

// Map old routine color IDs to new muted palette so pre-existing data still works
const COLOR_MIGRATION = {
  coral:   'clay',
  amber:   'sand',
  lime:    'sage',
  teal:    'mist',
  blue:    'steel',
  violet:  'iris',
  magenta: 'rose',
  slate:   'graphite',
};
const VALID_COLORS = new Set(['clay','sand','sage','mist','steel','iris','rose','graphite']);

function migrate(s) {
  if (!Array.isArray(s.routines)) return s;
  let changed = false;
  const routines = s.routines.map(r => {
    if (!r || VALID_COLORS.has(r.color)) return r;
    const mapped = COLOR_MIGRATION[r.color] || 'clay';
    changed = true;
    return { ...r, color: mapped };
  });
  return changed ? { ...s, routines } : s;
}

function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
}

// Seed with a light example dataset so the app isn't empty on first load.
// Marked so we only seed once.
function maybeSeed(s) {
  if (localStorage.getItem(STORAGE_KEY + ':seeded')) return s;
  localStorage.setItem(STORAGE_KEY + ':seeded', '1');
  if (s.exercises.length || s.routines.length || s.sessions.length) return s;

  const ex = [
    { id: uid(), name: 'Barbell Back Squat' },
    { id: uid(), name: 'Bench Press' },
    { id: uid(), name: 'Deadlift' },
    { id: uid(), name: 'Overhead Press' },
    { id: uid(), name: 'Pull-Up' },
    { id: uid(), name: 'Barbell Row' },
    { id: uid(), name: 'Romanian Deadlift' },
    { id: uid(), name: 'Incline Dumbbell Press' },
  ];
  const [squat, bench, dead, ohp, pullup, row, rdl, incline] = ex;

  const routines = [
    { id: uid(), name: 'Day A — Push',  color: 'clay',     exerciseIds: [bench.id, ohp.id, incline.id] },
    { id: uid(), name: 'Day B — Pull',  color: 'mist',     exerciseIds: [dead.id, pullup.id, row.id] },
    { id: uid(), name: 'Day C — Legs',  color: 'sand',     exerciseIds: [squat.id, rdl.id] },
  ];

  // Add a few historical sessions so "last 3 sessions" has something to show
  const today = new Date();
  const dateOffset = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  const sessions = [
    {
      id: uid(), date: dateOffset(9), routineId: routines[0].id,
      entries: [
        { exerciseId: bench.id, sets: [{ weight: 135, reps: 8 }, { weight: 155, reps: 6 }, { weight: 155, reps: 5 }] },
        { exerciseId: ohp.id, sets: [{ weight: 85, reps: 8 }, { weight: 85, reps: 7 }] },
        { exerciseId: incline.id, sets: [{ weight: 50, reps: 10 }, { weight: 55, reps: 8 }] },
      ],
    },
    {
      id: uid(), date: dateOffset(6), routineId: routines[0].id,
      entries: [
        { exerciseId: bench.id, sets: [{ weight: 135, reps: 8 }, { weight: 155, reps: 7 }, { weight: 165, reps: 5 }] },
        { exerciseId: ohp.id, sets: [{ weight: 85, reps: 8 }, { weight: 90, reps: 6 }] },
        { exerciseId: incline.id, sets: [{ weight: 55, reps: 9 }, { weight: 55, reps: 8 }] },
      ],
    },
    {
      id: uid(), date: dateOffset(3), routineId: routines[0].id,
      entries: [
        { exerciseId: bench.id, sets: [{ weight: 140, reps: 8 }, { weight: 160, reps: 6 }, { weight: 165, reps: 6 }] },
        { exerciseId: ohp.id, sets: [{ weight: 90, reps: 7 }, { weight: 90, reps: 6 }] },
        { exerciseId: incline.id, sets: [{ weight: 55, reps: 10 }, { weight: 60, reps: 7 }] },
      ],
    },
    {
      id: uid(), date: dateOffset(5), routineId: routines[2].id,
      entries: [
        { exerciseId: squat.id, sets: [{ weight: 185, reps: 8 }, { weight: 205, reps: 6 }, { weight: 215, reps: 5 }] },
        { exerciseId: rdl.id, sets: [{ weight: 155, reps: 10 }, { weight: 155, reps: 10 }] },
      ],
    },
  ];

  return { exercises: ex, routines, sessions };
}

// Single global store w/ React hook subscription
const listeners = new Set();
let state = maybeSeed(loadState());
saveState(state);

function setState(updater) {
  const next = typeof updater === 'function' ? updater(state) : updater;
  state = next;
  saveState(state);
  listeners.forEach(fn => fn());
}

function useStore() {
  const [, tick] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    listeners.add(tick);
    return () => listeners.delete(tick);
  }, []);
  return state;
}

// ─── Actions ─────────────────────────────────────────────────
const actions = {
  addExercise: (name) => {
    const ex = { id: uid(), name: name.trim() };
    setState(s => ({ ...s, exercises: [...s.exercises, ex] }));
    return ex;
  },
  deleteExercise: (id) => {
    setState(s => ({
      ...s,
      exercises: s.exercises.filter(e => e.id !== id),
      routines: s.routines.map(r => ({ ...r, exerciseIds: r.exerciseIds.filter(eid => eid !== id) })),
    }));
  },
  addRoutine: (name, color = 'clay') => {
    const r = { id: uid(), name: name.trim(), color, exerciseIds: [] };
    setState(s => ({ ...s, routines: [...s.routines, r] }));
    return r;
  },
  renameRoutine: (id, name) => {
    setState(s => ({ ...s, routines: s.routines.map(r => r.id === id ? { ...r, name } : r) }));
  },
  setRoutineColor: (id, color) => {
    setState(s => ({ ...s, routines: s.routines.map(r => r.id === id ? { ...r, color } : r) }));
  },
  deleteRoutine: (id) => {
    setState(s => ({ ...s, routines: s.routines.filter(r => r.id !== id) }));
  },
  setRoutineExercises: (routineId, exerciseIds) => {
    setState(s => ({
      ...s,
      routines: s.routines.map(r => r.id === routineId ? { ...r, exerciseIds } : r),
    }));
  },
  addExerciseToRoutine: (routineId, exerciseId) => {
    setState(s => ({
      ...s,
      routines: s.routines.map(r => r.id === routineId && !r.exerciseIds.includes(exerciseId)
        ? { ...r, exerciseIds: [...r.exerciseIds, exerciseId] } : r),
    }));
  },
  removeExerciseFromRoutine: (routineId, exerciseId) => {
    setState(s => ({
      ...s,
      routines: s.routines.map(r => r.id === routineId
        ? { ...r, exerciseIds: r.exerciseIds.filter(id => id !== exerciseId) } : r),
    }));
  },
  // Session lifecycle
  createSession: (routineId) => {
    const routine = state.routines.find(r => r.id === routineId);
    const session = {
      id: uid(),
      date: new Date().toISOString(),
      routineId,
      entries: (routine?.exerciseIds || []).map(eid => ({ exerciseId: eid, sets: [] })),
    };
    setState(s => ({ ...s, sessions: [...s.sessions, session] }));
    return session;
  },
  updateSession: (sessionId, patch) => {
    setState(s => ({
      ...s,
      sessions: s.sessions.map(x => x.id === sessionId ? { ...x, ...patch } : x),
    }));
  },
  addSet: (sessionId, exerciseId, setData) => {
    setState(s => ({
      ...s,
      sessions: s.sessions.map(x => {
        if (x.id !== sessionId) return x;
        const entries = [...x.entries];
        const idx = entries.findIndex(e => e.exerciseId === exerciseId);
        if (idx === -1) {
          entries.push({ exerciseId, sets: [setData] });
        } else {
          entries[idx] = { ...entries[idx], sets: [...entries[idx].sets, setData] };
        }
        return { ...x, entries };
      }),
    }));
  },
  updateSet: (sessionId, exerciseId, setIdx, patch) => {
    setState(s => ({
      ...s,
      sessions: s.sessions.map(x => {
        if (x.id !== sessionId) return x;
        return {
          ...x,
          entries: x.entries.map(e => {
            if (e.exerciseId !== exerciseId) return e;
            const sets = e.sets.map((st, i) => i === setIdx ? { ...st, ...patch } : st);
            return { ...e, sets };
          }),
        };
      }),
    }));
  },
  removeSet: (sessionId, exerciseId, setIdx) => {
    setState(s => ({
      ...s,
      sessions: s.sessions.map(x => {
        if (x.id !== sessionId) return x;
        return {
          ...x,
          entries: x.entries.map(e => e.exerciseId === exerciseId
            ? { ...e, sets: e.sets.filter((_, i) => i !== setIdx) }
            : e),
        };
      }),
    }));
  },
  deleteSession: (sessionId) => {
    setState(s => ({ ...s, sessions: s.sessions.filter(x => x.id !== sessionId) }));
  },
  resetAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + ':seeded');
    state = maybeSeed(defaultState());
    saveState(state);
    listeners.forEach(fn => fn());
  },
};

// ─── Selectors ───────────────────────────────────────────────
const selectors = {
  exerciseById: (s, id) => s.exercises.find(e => e.id === id),
  routineById: (s, id) => s.routines.find(r => r.id === id),
  sessionById: (s, id) => s.sessions.find(x => x.id === id),
  // Previous N finished sessions that include this exercise (excluding current)
  lastSessionsFor: (s, exerciseId, excludeSessionId, n = 3) => {
    return s.sessions
      .filter(x => x.id !== excludeSessionId)
      .filter(x => x.entries.some(e => e.exerciseId === exerciseId && e.sets.length > 0))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, n);
  },
  sessionsByDay: (s) => {
    const map = {};
    s.sessions.forEach(x => {
      const key = x.date.slice(0, 10);
      (map[key] ||= []).push(x);
    });
    return map;
  },
  // Returns the best (max weight) set ever for this exercise, excluding current session
  bestSetFor: (s, exerciseId, excludeSessionId) => {
    let best = null;
    s.sessions.forEach(x => {
      if (x.id === excludeSessionId) return;
      x.entries.forEach(e => {
        if (e.exerciseId !== exerciseId) return;
        e.sets.forEach(st => {
          if (!best || st.weight > best.weight || (st.weight === best.weight && st.reps > best.reps)) {
            best = st;
          }
        });
      });
    });
    return best;
  },
  // Top set (by weight) from the most recent previous session for this exercise
  prevTopSetFor: (s, exerciseId, excludeSessionId) => {
    const prev = s.sessions
      .filter(x => x.id !== excludeSessionId)
      .filter(x => x.entries.some(e => e.exerciseId === exerciseId && e.sets.length > 0))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    if (!prev) return null;
    const entry = prev.entries.find(e => e.exerciseId === exerciseId);
    return entry.sets.reduce((best, st) =>
      !best || st.weight > best.weight ? st : best, null);
  },
};

// ─── Formatting ──────────────────────────────────────────────
const fmt = {
  date: (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
  dateLong: (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  },
  relDay: (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const diff = Math.round((today - d) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return fmt.date(iso);
  },
};

Object.assign(window, { useStore, actions, selectors, fmt, uid });
