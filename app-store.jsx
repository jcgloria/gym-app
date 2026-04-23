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

// No seed data — app starts empty.
function maybeSeed(s) {
  localStorage.setItem(STORAGE_KEY + ':seeded', '1');
  return s;
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
    setState(s => {
      const r = s.routines.find(x => x.id === id);
      const stampedColor = r?.color;
      return {
        ...s,
        routines: s.routines.filter(x => x.id !== id),
        sessions: s.sessions.map(x =>
          x.routineId === id && !x.color && stampedColor ? { ...x, color: stampedColor } : x
        ),
      };
    });
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
      color: routine?.color,
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
  replaceAll: (next) => {
    // Shallow-validate shape, then replace state wholesale.
    const safe = {
      exercises: Array.isArray(next?.exercises) ? next.exercises : [],
      routines:  Array.isArray(next?.routines)  ? next.routines  : [],
      sessions:  Array.isArray(next?.sessions)  ? next.sessions  : [],
    };
    setState(migrate(safe));
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
