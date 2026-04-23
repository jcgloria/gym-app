// app-screens.jsx — routines home + routine detail + exercise picker

// ─── Bottom Nav ──────────────────────────────────────────────
function BottomNav({ tab, onTab }) {
  const items = [
    { id: 'routines', label: 'Routines', icon: <Icon.home /> },
    { id: 'exercises', label: 'Exercises', icon: <Icon.dumbbell /> },
    { id: 'history', label: 'History', icon: <Icon.calendar /> },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 12px 28px',
      borderTop: `1px solid ${TOKENS.line}`,
      background: TOKENS.bg,
    }}>
      {items.map(it => {
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => onTab(it.id)} style={{
            flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '6px 0',
            color: active ? TOKENS.ink : TOKENS.subtle,
          }}>
            {it.icon}
            <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 500, letterSpacing: 0.1 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Color picker strip ─────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', padding: '4px 0 8px' }}>
      {ROUTINE_COLORS.map(c => {
        const active = c.id === value;
        return (
          <button key={c.id} onClick={() => onChange(c.id)} style={{
            width: 32, height: 32, borderRadius: 999,
            background: c.base, border: 'none', cursor: 'pointer',
            boxShadow: active ? `0 0 0 2.5px ${TOKENS.bg}, 0 0 0 4.5px ${c.base}` : 'none',
            transition: 'box-shadow 140ms ease',
            padding: 0,
          }} />
        );
      })}
    </div>
  );
}

// ─── Routines (Home) ────────────────────────────────────────
function RoutinesScreen({ nav }) {
  const s = useStore();
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState('clay');
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const lastByRoutine = React.useMemo(() => {
    const map = {};
    [...s.sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(x => {
      if (!map[x.routineId]) map[x.routineId] = x;
    });
    return map;
  }, [s.sessions]);

  const commit = () => {
    if (!name.trim()) return setAdding(false);
    const r = actions.addRoutine(name, color);
    setName(''); setColor('clay'); setAdding(false);
    nav.push({ name: 'routine', routineId: r.id });
  };

  const weekCount = React.useMemo(() => {
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - now.getDay());
    start.setHours(0,0,0,0);
    return s.sessions.filter(x => new Date(x.date) >= start).length;
  }, [s.sessions]);

  return (
    <Screen>
      <TopBar title=""
        left={
          <button onClick={() => setSettingsOpen(true)} style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: TOKENS.ink, cursor: 'pointer', padding: 0,
          }}>
            <Icon.settings />
          </button>
        }
        right={
          <button onClick={() => setAdding(true)} style={{
            width: 34, height: 34, borderRadius: 10,
            background: TOKENS.ink, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: TOKENS.bg, cursor: 'pointer', padding: 0,
          }}>
            <Icon.plus />
          </button>
        } />
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 20 }}>
        <LargeTitle eyebrow={weekCount > 0 ? `${weekCount} this week` : 'Let\u2019s go'}>Routines</LargeTitle>

        {s.routines.length === 0 ? (
          <EmptyState
            icon={<Icon.dumbbell />}
            title="No routines yet"
            body="Create a routine like Day A, Day B… Add exercises and start logging."
            action={<SecondaryButton onClick={() => setAdding(true)}><Icon.plus /> New routine</SecondaryButton>}
          />
        ) : (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {s.routines.map(r => {
              const last = lastByRoutine[r.id];
              const c = getRoutineColor(r.color);
              return (
                <div key={r.id} onClick={() => nav.push({ name: 'routine', routineId: r.id })}
                  style={{
                    background: TOKENS.surface, borderRadius: 16,
                    border: `1px solid ${TOKENS.line}`, padding: 0,
                    cursor: 'pointer', overflow: 'hidden',
                    display: 'flex',
                  }}>
                  {/* Color stripe */}
                  <div style={{ width: 5, background: c.base, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 16px 14px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 17, fontWeight: 600, letterSpacing: -0.3,
                        marginBottom: 4, color: TOKENS.ink,
                      }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: 13, color: TOKENS.muted, fontVariantNumeric: 'tabular-nums' }}>
                        {r.exerciseIds.length} exercise{r.exerciseIds.length === 1 ? '' : 's'}
                        {last && <span style={{ color: TOKENS.subtle }}>  ·  Last {fmt.relDay(last.date).toLowerCase()}</span>}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (r.exerciseIds.length === 0) { nav.push({ name: 'routine', routineId: r.id }); return; }
                        const sess = actions.createSession(r.id);
                        nav.push({ name: 'workout', sessionId: sess.id });
                      }}
                      style={{
                        height: 36, borderRadius: 10, padding: '0 16px',
                        background: c.ink, color: '#fff', border: 'none',
                        fontFamily: TOKENS.font, fontSize: 13, fontWeight: 700, letterSpacing: 0.2,
                        textTransform: 'uppercase',
                        cursor: 'pointer', flexShrink: 0,
                      }}>
                      Start
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav tab="routines" onTab={(t) => nav.setTab(t)} />

      <Sheet open={adding} onClose={() => setAdding(false)} title="New routine">
        <div style={{ padding: '0 20px' }}>
          <TextInput value={name} onChange={setName} placeholder="e.g. Day A — Push" autoFocus />
          <div style={{ marginTop: 14, marginBottom: 4, fontSize: 11, fontWeight: 600,
            letterSpacing: 1.2, textTransform: 'uppercase', color: TOKENS.subtle,
          }}>Color</div>
          <ColorPicker value={color} onChange={setColor} />
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <SecondaryButton onClick={() => setAdding(false)} style={{ flex: 1 }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={commit} style={{ flex: 1 }}>Create</PrimaryButton>
          </div>
        </div>
      </Sheet>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} store={s} />
    </Screen>
  );
}

// ─── Settings (export / import / reset) ─────────────────────
function SettingsSheet({ open, onClose, store }) {
  const fileRef = React.useRef(null);
  const [msg, setMsg] = React.useState('');

  const summary = `${store.exercises.length} exercise${store.exercises.length === 1 ? '' : 's'} · ${store.routines.length} routine${store.routines.length === 1 ? '' : 's'} · ${store.sessions.length} session${store.sessions.length === 1 ? '' : 's'}`;

  const handleExport = async () => {
    const json = JSON.stringify(store, null, 2);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `gym-backup-${today}.json`;
    const blob = new Blob([json], { type: 'application/json' });
    const file = new File([blob], filename, { type: 'application/json' });

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Gym backup' });
        return;
      }
    } catch (_e) { /* user cancelled or share failed — fall back */ }

    // Fallback: trigger a download.
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        if (!parsed || typeof parsed !== 'object') throw new Error('bad shape');
        if (!confirm('Replace all current data with the contents of this backup?')) return;
        actions.replaceAll(parsed);
        setMsg('Imported.');
        setTimeout(() => setMsg(''), 2000);
      } catch (err) {
        alert('Could not read this file. It must be a valid Gym backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (!confirm('Erase all routines, exercises, and sessions? This cannot be undone.')) return;
    actions.resetAll();
    setMsg('Reset.');
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12.5, color: TOKENS.muted, padding: '0 2px 4px', fontVariantNumeric: 'tabular-nums' }}>
          {summary}
        </div>

        <button onClick={handleExport} style={menuRowStyle()}>
          Export backup…
        </button>
        <button onClick={handleImportClick} style={menuRowStyle()}>
          Import backup…
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: 'none' }} />

        <div style={{ height: 4 }} />
        <button onClick={handleReset} style={{ ...menuRowStyle(), color: TOKENS.danger }}>
          Erase all data
        </button>

        {msg && (
          <div style={{ textAlign: 'center', fontSize: 13, color: TOKENS.muted, paddingTop: 6 }}>{msg}</div>
        )}
      </div>
    </Sheet>
  );
}

// ─── Routine detail ──────────────────────────────────────────
function RoutineScreen({ nav, routineId }) {
  const s = useStore();
  const routine = selectors.routineById(s, routineId);
  const [picking, setPicking] = React.useState(false);
  const [editingName, setEditingName] = React.useState(false);
  const [name, setName] = React.useState(routine?.name || '');
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => { setName(routine?.name || ''); }, [routine?.name]);

  if (!routine) return <Screen><TopBar title="Not found" onBack={() => nav.pop()} /></Screen>;

  const c = getRoutineColor(routine.color);
  const exercises = routine.exerciseIds.map(id => selectors.exerciseById(s, id)).filter(Boolean);

  const saveName = () => {
    if (name.trim() && name !== routine.name) actions.renameRoutine(routine.id, name.trim());
    setEditingName(false);
  };

  return (
    <Screen>
      {/* Colored header band */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 180,
        background: `linear-gradient(180deg, ${c.base}, ${c.soft} 80%, transparent)`,
        opacity: 0.35, pointerEvents: 'none',
      }} />
      <TopBar title="" onBack={() => nav.pop()} right={
        <button onClick={() => setMenuOpen(true)} style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'transparent', border: 'none', color: TOKENS.ink, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon.ellipsis /></button>
      } />
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 120, position: 'relative' }}>
        <div style={{ padding: '4px 24px 20px' }}>
          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
            textTransform: 'uppercase', color: c.ink, marginBottom: 10,
            padding: '4px 10px', borderRadius: 999, background: c.soft,
          }}>Routine</div>
          {editingName ? (
            <input
              value={name}
              autoFocus
              onChange={e => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => e.key === 'Enter' && e.target.blur()}
              style={{
                width: '100%', fontFamily: TOKENS.font,
                fontSize: 32, fontWeight: 700, letterSpacing: -1.1, lineHeight: 1.05,
                color: TOKENS.ink, border: 'none', borderBottom: `2px solid ${c.base}`,
                outline: 'none', padding: '2px 0', background: 'transparent',
              }}
            />
          ) : (
            <div onClick={() => setEditingName(true)} style={{
              fontSize: 32, fontWeight: 700, letterSpacing: -1.1, lineHeight: 1.05,
              color: TOKENS.ink, cursor: 'text',
            }}>{routine.name}</div>
          )}
          <div style={{ fontSize: 13, color: TOKENS.muted, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            {exercises.length} exercise{exercises.length === 1 ? '' : 's'}
          </div>
        </div>

        <div style={{
          padding: '0 24px 10px',
          fontSize: 11, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase',
          color: TOKENS.subtle,
        }}>Exercises</div>

        {exercises.length === 0 ? (
          <div style={{ padding: '0 16px' }}>
            <Card style={{
              padding: 22, textAlign: 'center', borderStyle: 'dashed',
              color: TOKENS.muted, fontSize: 14,
            }}>
              No exercises yet. Add your first below.
            </Card>
          </div>
        ) : (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exercises.map((e, idx) => (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
                borderRadius: 14, padding: '14px 16px',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: c.soft, color: c.ink,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}>{idx + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2, color: TOKENS.ink }}>{e.name}</div>
                </div>
                <button
                  onClick={() => actions.removeExerciseFromRoutine(routine.id, e.id)}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: 'none',
                    background: 'transparent', color: TOKENS.subtle, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                ><Icon.close /></button>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '14px 16px 16px' }}>
          <button onClick={() => setPicking(true)} style={{
            width: '100%', height: 48, borderRadius: 12,
            background: c.soft, color: c.ink,
            border: `1px solid ${c.soft}`,
            fontFamily: TOKENS.font, fontSize: 14.5, fontWeight: 600, letterSpacing: -0.1,
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Icon.plus /> Add exercise
          </button>
        </div>

        {/* Color picker inline */}
        <div style={{ padding: '6px 16px 4px' }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase',
            color: TOKENS.subtle, padding: '0 8px 10px',
          }}>Color</div>
          <div style={{
            background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
            borderRadius: 14, padding: '14px 12px',
          }}>
            <ColorPicker value={routine.color} onChange={(id) => actions.setRoutineColor(routine.id, id)} />
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '12px 16px 34px',
        background: `linear-gradient(to top, ${TOKENS.bg} 70%, transparent)`,
      }}>
        <button
          disabled={exercises.length === 0}
          onClick={() => {
            const sess = actions.createSession(routine.id);
            nav.replace({ name: 'workout', sessionId: sess.id });
          }}
          style={{
            width: '100%', height: 54, borderRadius: 14,
            background: exercises.length === 0 ? TOKENS.lineStrong : c.ink,
            color: exercises.length === 0 ? TOKENS.muted : '#fff', border: 'none',
            fontFamily: TOKENS.font, fontSize: 15, fontWeight: 700, letterSpacing: 0.3,
            textTransform: 'uppercase',
            cursor: exercises.length === 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          Start workout →
        </button>
      </div>

      <ExercisePicker
        open={picking}
        onClose={() => setPicking(false)}
        excludeIds={routine.exerciseIds}
        onPick={(id) => { actions.addExerciseToRoutine(routine.id, id); }}
        accent={c}
      />

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Routine options">
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => { setMenuOpen(false); setEditingName(true); }} style={menuRowStyle()}>
            Rename
          </button>
          <button onClick={() => {
            if (confirm('Delete this routine? Past sessions will be kept.')) {
              actions.deleteRoutine(routine.id);
              nav.pop();
            }
          }} style={{ ...menuRowStyle(), color: TOKENS.danger }}>
            Delete routine
          </button>
        </div>
      </Sheet>
    </Screen>
  );
}

const menuRowStyle = () => ({
  width: '100%', height: 52, padding: '0 18px',
  background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
  borderRadius: 12, textAlign: 'left', cursor: 'pointer',
  fontFamily: TOKENS.font, fontSize: 15, fontWeight: 500, color: TOKENS.ink,
});

// ─── Exercise picker (for adding to routine) ────────────────
function ExercisePicker({ open, onClose, excludeIds = [], onPick, accent }) {
  const s = useStore();
  const [q, setQ] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  const available = s.exercises.filter(e =>
    !excludeIds.includes(e.id) && e.name.toLowerCase().includes(q.toLowerCase())
  );

  const create = () => {
    if (!newName.trim()) return;
    const ex = actions.addExercise(newName);
    onPick(ex.id);
    setNewName(''); setCreating(false);
  };

  const inkColor = accent?.ink || TOKENS.accentInk;
  const softBg = accent?.soft || TOKENS.accentSoft;

  return (
    <Sheet open={open} onClose={onClose} title={creating ? 'New exercise' : 'Add exercise'}>
      {!creating ? (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TextInput value={q} onChange={setQ} placeholder="Search…" />
          <button onClick={() => setCreating(true)} style={{
            ...menuRowStyle(), color: inkColor, fontWeight: 600,
            background: softBg, border: `1px solid ${softBg}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon.plus /> Create new exercise
          </button>
          {available.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: TOKENS.muted, fontSize: 14 }}>
              {s.exercises.length === 0 ? 'Your library is empty.' : 'No matches.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {available.map(e => (
                <button key={e.id} onClick={() => { onPick(e.id); }} style={{
                  width: '100%', padding: '12px 16px', textAlign: 'left',
                  background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
                  borderRadius: 12, cursor: 'pointer', fontFamily: TOKENS.font,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: TOKENS.ink }}>{e.name}</div>
                  <div style={{ color: inkColor, fontSize: 13, fontWeight: 600 }}>Add</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextInput value={newName} onChange={setNewName} placeholder="Exercise name" autoFocus />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <SecondaryButton onClick={() => setCreating(false)} style={{ flex: 1 }}>Back</SecondaryButton>
            <PrimaryButton onClick={create} disabled={!newName.trim()} style={{ flex: 1 }}>Create & add</PrimaryButton>
          </div>
        </div>
      )}
    </Sheet>
  );
}

Object.assign(window, { BottomNav, RoutinesScreen, RoutineScreen, ExercisePicker, ColorPicker });
