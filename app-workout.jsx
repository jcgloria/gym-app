// app-workout.jsx — active workout + exercises library + history + session detail

// A tiny star icon for PRs
const IconStar = (p={}) => <svg width="12" height="12" viewBox="0 0 12 12" {...p}><path d="M6 1l1.6 3.2 3.4.5-2.5 2.4.6 3.4L6 9l-3.1 1.5.6-3.4L1 4.7l3.4-.5L6 1z" fill="currentColor"/></svg>;
const IconUp = (p={}) => <svg width="10" height="10" viewBox="0 0 10 10" {...p}><path d="M5 2l4 5H1l4-5z" fill="currentColor"/></svg>;

function WorkoutScreen({ nav, sessionId }) {
  const s = useStore();
  const session = selectors.sessionById(s, sessionId);
  if (!session) return <Screen><TopBar title="Not found" onBack={() => nav.pop()} /></Screen>;

  const routine = selectors.routineById(s, session.routineId);
  const c = getRoutineColor(routine?.color);
  const [active, setActive] = React.useState(session.entries[0]?.exerciseId || null);
  const [finishOpen, setFinishOpen] = React.useState(false);

  const totalSets = session.entries.reduce((a, e) => a + e.sets.length, 0);

  const finish = (keep) => {
    setFinishOpen(false);
    if (!keep) actions.deleteSession(session.id);
    nav.reset({ name: 'tabs', tab: keep ? 'history' : 'routines' });
  };

  return (
    <Screen>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 200,
        background: `linear-gradient(180deg, ${c.base}, ${c.soft} 70%, transparent)`,
        opacity: 0.3, pointerEvents: 'none',
      }} />
      <TopBar
        title={fmt.dateLong(session.date)}
        onBack={() => setFinishOpen(true)}
        subtle
        right={
          <button onClick={() => setFinishOpen(true)} style={{
            height: 32, padding: '0 14px', borderRadius: 10,
            background: c.ink, color: '#fff', border: 'none',
            fontFamily: TOKENS.font, fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
            textTransform: ctaCase(), cursor: 'pointer',
          }}>Finish</button>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 24, position: 'relative' }}>
        <div style={{ padding: '4px 24px 20px' }}>
          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
            textTransform: 'uppercase', color: c.ink, marginBottom: 10,
            padding: '4px 10px', borderRadius: 999, background: c.soft,
          }}>{totalSets > 0 ? `${totalSets} set${totalSets === 1 ? '' : 's'} logged` : 'In progress'}</div>
          <div style={{
            fontSize: tweak('titleSize', 34), fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.05,
            color: TOKENS.ink,
          }}>{routine?.name || 'Workout'}</div>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {session.entries.map(entry => (
            <ExerciseBlock
              key={entry.exerciseId}
              session={session}
              entry={entry}
              color={c}
              open={active === entry.exerciseId}
              onToggle={() => setActive(active === entry.exerciseId ? null : entry.exerciseId)}
            />
          ))}
        </div>
      </div>

      <Sheet open={finishOpen} onClose={() => setFinishOpen(false)} title={totalSets > 0 ? 'Finish workout?' : 'Discard workout?'}>
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontSize: 14, color: TOKENS.muted, marginBottom: 16, lineHeight: 1.5 }}>
            {totalSets > 0
              ? `You've logged ${totalSets} set${totalSets === 1 ? '' : 's'}. Save this session to history?`
              : "You haven't logged anything yet. Leaving will discard this session."}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <SecondaryButton onClick={() => finish(false)} style={{ flex: 1, color: TOKENS.danger }}>Discard</SecondaryButton>
            {totalSets > 0 && (
              <button onClick={() => finish(true)} style={{
                flex: 1, height: 44, borderRadius: 12, background: TOKENS.ink,
                color: TOKENS.bg, border: 'none', fontFamily: TOKENS.font,
                fontSize: 14.5, fontWeight: 700, letterSpacing: 0.2, textTransform: ctaCase(),
                cursor: 'pointer',
              }}>Save</button>
            )}
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}

function ExerciseBlock({ session, entry, open, onToggle, color }) {
  const s = useStore();
  const ex = selectors.exerciseById(s, entry.exerciseId);
  const prevSessions = selectors.lastSessionsFor(s, entry.exerciseId, session.id, 3);
  const prevTop = selectors.prevTopSetFor(s, entry.exerciseId, session.id);
  const allTimeBest = selectors.bestSetFor(s, entry.exerciseId, session.id);

  const [weight, setWeight] = React.useState('');
  const [reps, setReps] = React.useState('');

  React.useEffect(() => {
    if (open && !weight && !reps) {
      const lastSet = prevSessions[0]?.entries.find(e => e.exerciseId === entry.exerciseId)?.sets[0];
      if (lastSet) { setWeight(String(lastSet.weight)); setReps(String(lastSet.reps)); }
    }
  }, [open]);

  if (!ex) return null;

  const add = () => {
    const w = parseFloat(weight); const r = parseInt(reps, 10);
    if (!isFinite(w) || !isFinite(r) || r <= 0) return;
    actions.addSet(session.id, entry.exerciseId, { weight: w, reps: r });
  };

  const setCount = entry.sets.length;
  const lastSet = prevSessions[0]?.entries.find(e => e.exerciseId === entry.exerciseId)?.sets[0];

  const cueFor = (st) => {
    if (allTimeBest && (st.weight > allTimeBest.weight || (st.weight === allTimeBest.weight && st.reps > allTimeBest.reps))) return 'pr';
    if (prevTop && (st.weight > prevTop.weight || (st.weight === prevTop.weight && st.reps >= prevTop.reps))) return 'up';
    return null;
  };

  // ─── Collapsed: quiet, minimal row ─────────────────────────────
  if (!open) {
    return (
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', background: TOKENS.surface,
        border: `1px solid ${TOKENS.line}`, borderRadius: 12,
        cursor: 'pointer', textAlign: 'left', fontFamily: TOKENS.font,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: 999,
          background: setCount > 0 ? color.base : TOKENS.lineStrong,
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 500, letterSpacing: -0.2, color: TOKENS.ink,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {ex.name}
            {allTimeBest && tweak('showPRs', true) && (
              <span style={{ color: color.ink, display: 'inline-flex', alignItems: 'center', opacity: 0.7 }}>
                <IconStar />
              </span>
            )}
          </div>
        </div>
        <div style={{
          fontFamily: TOKENS.fontDisplay, fontSize: 13, fontWeight: 600,
          color: setCount > 0 ? color.ink : TOKENS.subtle,
          fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
        }}>
          {setCount > 0 ? (
            `${setCount} set${setCount === 1 ? '' : 's'}`
          ) : lastSet ? (
            <span>{lastSet.weight}<span style={{ color: TOKENS.subtle, margin: '0 3px', fontWeight: 500 }}>×</span>{lastSet.reps}</span>
          ) : '—'}
        </div>
        <div style={{ color: TOKENS.subtle, display: 'flex' }}><Icon.chevron /></div>
      </button>
    );
  }

  // ─── Active: hero card ─────────────────────────────────────────
  return (
    <div style={{
      background: TOKENS.surface,
      border: `1.5px solid ${color.base}`,
      borderRadius: 20, overflow: 'hidden',
      boxShadow: `0 1px 0 ${TOKENS.line}, 0 20px 40px -24px ${color.base}40`,
      animation: 'fadeInUp 220ms cubic-bezier(.22,1,.36,1)',
    }}>
      {/* Header */}
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '18px 20px 12px', background: 'transparent', border: 'none',
        cursor: 'pointer', textAlign: 'left', fontFamily: TOKENS.font,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
            textTransform: 'uppercase', color: color.ink,
            marginBottom: 4,
          }}>Active</div>
          <div style={{
            fontSize: 22, fontWeight: 700, letterSpacing: -0.6, color: TOKENS.ink,
            display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.15,
          }}>
            {ex.name}
            {allTimeBest && tweak('showPRs', true) && (
              <span style={{ color: color.ink, display: 'inline-flex', alignItems: 'center' }} title={`PR: ${allTimeBest.weight}×${allTimeBest.reps}`}>
                <IconStar />
              </span>
            )}
          </div>
        </div>
        <div style={{
          color: TOKENS.subtle,
          transform: 'rotate(90deg)',
          marginTop: 22,
        }}><Icon.chevron /></div>
      </button>

      <div style={{ padding: '0 20px 20px' }}>
        {/* Previous sessions — large numerals */}
        {prevSessions.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase',
              color: TOKENS.subtle, marginBottom: 10,
            }}>Previous</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {prevSessions.map(prev => {
                const prevEntry = prev.entries.find(e => e.exerciseId === entry.exerciseId);
                return (
                  <div key={prev.id} style={{
                    background: TOKENS.bg, borderRadius: 12, padding: '10px 14px',
                    border: `1px solid ${TOKENS.line}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      fontSize: 11, color: TOKENS.muted, fontWeight: 600,
                      letterSpacing: 0.2, width: 56, flexShrink: 0,
                      textTransform: 'uppercase',
                    }}>{fmt.relDay(prev.date)}</div>
                    <div style={{
                      flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {prevEntry.sets.map((st, i) => (
                        <div key={i} style={{
                          fontFamily: TOKENS.fontDisplay,
                          fontSize: 15, fontWeight: 600,
                          color: TOKENS.ink, letterSpacing: -0.3,
                        }}>
                          <span>{st.weight}</span>
                          <span style={{ color: TOKENS.subtle, margin: '0 4px', fontWeight: 500 }}>×</span>
                          <span>{st.reps}</span>
                          {i < prevEntry.sets.length - 1 && (
                            <span style={{ color: TOKENS.lineStrong, margin: '0 8px 0 10px', fontWeight: 400 }}>·</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's sets — each set as prominent row */}
        {setCount > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase',
              color: color.ink, marginBottom: 10,
            }}>Today · {setCount} {setCount === 1 ? 'set' : 'sets'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {entry.sets.map((st, i) => {
                const cue = cueFor(st);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: color.soft, borderRadius: 12,
                    fontVariantNumeric: 'tabular-nums',
                    animation: 'fadeInUp 240ms cubic-bezier(.22,1,.36,1)',
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 999,
                      background: TOKENS.surface, color: color.ink,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      flexShrink: 0,
                    }}>{i + 1}</div>
                    <div style={{
                      flex: 1,
                      fontFamily: TOKENS.fontDisplay,
                      fontSize: 20, fontWeight: 600, color: TOKENS.ink,
                      letterSpacing: -0.4,
                    }}>
                      <span>{st.weight}</span>
                      <span style={{ color: TOKENS.muted, fontWeight: 500, fontSize: 13, marginLeft: 4 }}>lb</span>
                      <span style={{ color: TOKENS.subtle, margin: '0 8px', fontWeight: 500 }}>×</span>
                      <span>{st.reps}</span>
                    </div>
                    {cue === 'pr' && tweak('showPRs', true) && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '4px 8px', borderRadius: 999,
                        background: TOKENS.ink, color: TOKENS.bg,
                        fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                      }}><IconStar /> PR</div>
                    )}
                    {cue === 'up' && tweak('showUpCues', true) && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '4px 8px', borderRadius: 999,
                        background: TOKENS.surface, color: TOKENS.success,
                        fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                      }}><IconUp /> Up</div>
                    )}
                    <button
                      onClick={() => actions.removeSet(session.id, entry.exerciseId, i)}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: 'none',
                        background: 'transparent', color: TOKENS.subtle, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    ><Icon.close /></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Input — big, prominent */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'stretch',
        }}>
          <div style={{
            flex: 1, display: 'flex', gap: 2, alignItems: 'stretch',
            background: TOKENS.bg, padding: 6, borderRadius: 14,
            border: `1px solid ${TOKENS.line}`,
          }}>
            <InputPair label="lb" value={weight} onChange={setWeight} big />
            <div style={{ width: 1, background: TOKENS.line, margin: '8px 0' }} />
            <InputPair label="reps" value={reps} onChange={setReps} integer big />
          </div>
          <button onClick={add} disabled={!weight || !reps} style={{
            width: 72, borderRadius: 14,
            background: (!weight || !reps) ? TOKENS.lineStrong : color.ink,
            color: (!weight || !reps) ? TOKENS.muted : '#fff', border: 'none',
            fontFamily: TOKENS.font,
            fontSize: 14, fontWeight: 700, letterSpacing: 0.3, textTransform: ctaCase(),
            cursor: (!weight || !reps) ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            flexShrink: 0,
          }}>
            <Icon.plus /> Set
          </button>
        </div>
      </div>
    </div>
  );
}

function InputPair({ label, value, onChange, integer, big }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: big ? '6px 4px' : '2px 4px',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: 1.2,
        textTransform: 'uppercase', color: TOKENS.subtle, marginBottom: big ? 4 : 2,
      }}>{label}</div>
      <input
        inputMode={integer ? 'numeric' : 'decimal'}
        value={value}
        onChange={e => {
          const v = e.target.value.replace(integer ? /[^\d]/g : /[^\d.]/g, '');
          onChange(v);
        }}
        placeholder="0"
        style={{
          width: '100%', border: 'none', background: 'transparent',
          fontFamily: TOKENS.fontDisplay,
          fontSize: big ? 30 : 24, fontWeight: 600,
          color: TOKENS.ink, textAlign: 'center', outline: 'none',
          fontVariantNumeric: 'tabular-nums', padding: 0, letterSpacing: -0.5,
        }}
      />
    </div>
  );
}

function SetChip({ weight, reps, muted }) {
  return (
    <div style={{
      padding: '5px 9px', borderRadius: 7,
      background: muted ? TOKENS.surface : TOKENS.accentSoft,
      border: muted ? `1px solid ${TOKENS.line}` : 'none',
      fontSize: 12.5, fontWeight: 500, color: TOKENS.ink,
      fontVariantNumeric: 'tabular-nums',
    }}>
      <span style={{ fontWeight: 700 }}>{weight}</span>
      <span style={{ color: TOKENS.subtle, margin: '0 3px' }}>×</span>
      <span style={{ fontWeight: 700 }}>{reps}</span>
    </div>
  );
}

// ─── Exercises library ──────────────────────────────────────
function ExercisesScreen({ nav }) {
  const s = useStore();
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState('');
  const [q, setQ] = React.useState('');

  const filtered = s.exercises
    .filter(e => e.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const commit = () => {
    if (!name.trim()) return;
    actions.addExercise(name);
    setName(''); setAdding(false);
  };

  return (
    <Screen>
      <TopBar title="" right={
        <button onClick={() => setAdding(true)} style={{
          width: 34, height: 34, borderRadius: 10,
          background: TOKENS.ink, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: TOKENS.bg, cursor: 'pointer', padding: 0,
        }}><Icon.plus /></button>
      } />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <LargeTitle eyebrow="Library">Exercises</LargeTitle>
        <div style={{ padding: '0 16px 12px' }}>
          <TextInput value={q} onChange={setQ} placeholder="Search…" />
        </div>

        {s.exercises.length === 0 ? (
          <EmptyState
            icon={<Icon.dumbbell />}
            title="Your library is empty"
            body="Add exercises you train. You can also create them on the fly from a routine."
            action={<SecondaryButton onClick={() => setAdding(true)}><Icon.plus /> New exercise</SecondaryButton>}
          />
        ) : (
          <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(e => {
              const best = selectors.bestSetFor(s, e.id, null);
              return (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
                  borderRadius: 12, padding: '12px 16px',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2, color: TOKENS.ink }}>{e.name}</div>
                    {best && (
                      <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ color: TOKENS.accentInk, display: 'inline-flex', alignItems: 'center' }}><IconStar /></span>
                        PR {best.weight} × {best.reps}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { if (confirm(`Delete "${e.name}"?`)) actions.deleteExercise(e.id); }}
                    style={{
                      width: 34, height: 34, borderRadius: 10, border: 'none',
                      background: 'transparent', color: TOKENS.subtle, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  ><Icon.trash /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav tab="exercises" onTab={(t) => nav.setTab(t)} />

      <Sheet open={adding} onClose={() => setAdding(false)} title="New exercise">
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextInput value={name} onChange={setName} placeholder="Exercise name" autoFocus />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <SecondaryButton onClick={() => setAdding(false)} style={{ flex: 1 }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={commit} disabled={!name.trim()} style={{ flex: 1 }}>Add</PrimaryButton>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}

// ─── History ────────────────────────────────────────────────
function HistoryScreen({ nav }) {
  const s = useStore();
  const today = new Date();
  const [viewMonth, setViewMonth] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const sorted = [...s.sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Map day -> whether there was a workout. All workout dots use ink.
  const dayToColor = React.useMemo(() => {
    const m = {};
    s.sessions.forEach(x => {
      const d = new Date(x.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const day = d.getDate();
      if (!m[day]) m[day] = TOKENS.ink;
    });
    return m;
  }, [s.sessions, year, month]);

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goMonth = (dir) => {
    const m = new Date(viewMonth);
    m.setMonth(m.getMonth() + dir);
    setViewMonth(m);
  };

  // Streak count (consecutive days with workouts ending today or yesterday)
  const streak = React.useMemo(() => {
    const dayKeys = new Set(s.sessions.map(x => x.date.slice(0, 10)));
    let n = 0;
    const d = new Date(); d.setHours(0,0,0,0);
    // Allow starting from yesterday (rest day today is ok)
    let cur = new Date(d);
    if (!dayKeys.has(cur.toISOString().slice(0, 10))) {
      cur.setDate(cur.getDate() - 1);
    }
    while (dayKeys.has(cur.toISOString().slice(0, 10))) {
      n++;
      cur.setDate(cur.getDate() - 1);
    }
    return n;
  }, [s.sessions]);

  return (
    <Screen>
      <TopBar title="" />
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 20 }}>
        <LargeTitle eyebrow={streak > 0 && tweak('showStreak', true) ? `🔥 ${streak}-day streak` : `${s.sessions.length} workout${s.sessions.length === 1 ? '' : 's'}`}>History</LargeTitle>

        <div style={{ padding: '0 16px 20px' }}>
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button onClick={() => goMonth(-1)} style={{
                width: 34, height: 34, borderRadius: 10, border: 'none',
                background: 'transparent', color: TOKENS.ink, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon.back /></button>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2, color: TOKENS.ink }}>{monthLabel}</div>
              <button onClick={() => goMonth(1)} style={{
                width: 34, height: 34, borderRadius: 10, border: 'none',
                background: 'transparent', color: TOKENS.ink, cursor: 'pointer', transform: 'rotate(180deg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon.back /></button>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4,
            }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{
                  textAlign: 'center', fontSize: 10, fontWeight: 600,
                  color: TOKENS.subtle, letterSpacing: 0.5,
                }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const hasWorkout = Boolean(dayToColor[d]);
                const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
                return (
                  <div key={i} style={{
                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', fontSize: 13, fontWeight: 500,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 999,
                      background: hasWorkout ? TOKENS.ink : 'transparent',
                      color: hasWorkout ? TOKENS.bg : (isToday ? TOKENS.accentInk : TOKENS.ink),
                      border: isToday && !hasWorkout ? `1.5px solid ${TOKENS.accent}` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: hasWorkout ? 700 : 500,
                    }}>{d}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div style={{
          padding: '0 24px 10px',
          fontSize: 11, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase',
          color: TOKENS.subtle,
        }}>Recent sessions</div>

        {sorted.length === 0 ? (
          <EmptyState
            icon={<Icon.calendar />}
            title="No sessions yet"
            body="Finished workouts will appear here."
          />
        ) : (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map(sess => {
              const routine = selectors.routineById(s, sess.routineId);
              const c = getRoutineColor(routine?.color);
              const totalSets = sess.entries.reduce((a, e) => a + e.sets.length, 0);
              const volume = sess.entries.reduce((a, e) =>
                a + e.sets.reduce((b, st) => b + st.weight * st.reps, 0), 0);
              return (
                <div key={sess.id} onClick={() => nav.push({ name: 'session', sessionId: sess.id })}
                  style={{
                    background: TOKENS.surface, borderRadius: 14,
                    border: `1px solid ${TOKENS.line}`, padding: 0, overflow: 'hidden',
                    display: 'flex', cursor: 'pointer',
                  }}>
                  <div style={{ width: 4, background: c.base, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px 12px 12px' }}>
                    <div style={{
                      width: 44, textAlign: 'center',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: TOKENS.subtle, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                        {new Date(sess.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 26, fontWeight: 600, letterSpacing: -0.8, color: TOKENS.ink, lineHeight: 1 }}>
                        {new Date(sess.date).getDate()}
                      </div>
                    </div>
                    <div style={{ width: 1, alignSelf: 'stretch', background: TOKENS.line }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2, marginBottom: 3, color: TOKENS.ink }}>
                        {routine?.name || 'Workout'}
                      </div>
                      <div style={{ fontSize: 12.5, color: TOKENS.muted, fontVariantNumeric: 'tabular-nums' }}>
                        {totalSets} sets  ·  {Math.round(volume).toLocaleString()} lb volume
                      </div>
                    </div>
                    <div style={{ color: TOKENS.subtle }}><Icon.chevron /></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav tab="history" onTab={(t) => nav.setTab(t)} />
    </Screen>
  );
}

function SessionDetailScreen({ nav, sessionId }) {
  const s = useStore();
  const sess = selectors.sessionById(s, sessionId);
  if (!sess) return <Screen><TopBar title="Not found" onBack={() => nav.pop()} /></Screen>;
  const routine = selectors.routineById(s, sess.routineId);
  const c = getRoutineColor(routine?.color);
  const totalSets = sess.entries.reduce((a, e) => a + e.sets.length, 0);
  const volume = sess.entries.reduce((a, e) =>
    a + e.sets.reduce((b, st) => b + st.weight * st.reps, 0), 0);

  return (
    <Screen>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 180,
        background: `linear-gradient(180deg, ${c.base}, ${c.soft} 70%, transparent)`,
        opacity: 0.3, pointerEvents: 'none',
      }} />
      <TopBar title="Session" onBack={() => nav.pop()} right={
        <button onClick={() => {
          if (confirm('Delete this session?')) { actions.deleteSession(sess.id); nav.pop(); }
        }} style={{
          width: 34, height: 34, borderRadius: 10, border: 'none',
          background: 'transparent', color: TOKENS.subtle, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon.trash /></button>
      } />
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 28, position: 'relative' }}>
        <div style={{ padding: '4px 24px 20px' }}>
          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
            textTransform: 'uppercase', color: c.ink, marginBottom: 10,
            padding: '4px 10px', borderRadius: 999, background: c.soft,
          }}>{fmt.dateLong(sess.date)}</div>
          <div style={{
            fontSize: tweak('titleSize', 34), fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.05,
            color: TOKENS.ink,
          }}>{routine?.name || 'Workout'}</div>
        </div>

        <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
          <StatBox label="Sets" value={totalSets} />
          <StatBox label="Exercises" value={sess.entries.filter(e => e.sets.length > 0).length} />
          <StatBox label="Volume" value={Math.round(volume).toLocaleString()} suffix="lb" />
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sess.entries.filter(e => e.sets.length > 0).map(entry => {
            const ex = selectors.exerciseById(s, entry.exerciseId);
            if (!ex) return null;
            return (
              <div key={entry.exerciseId} style={{
                background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
                borderRadius: 14, padding: 16,
              }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2, marginBottom: 10, color: TOKENS.ink }}>
                  {ex.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {entry.sets.map((st, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontVariantNumeric: 'tabular-nums',
                      padding: '8px 0',
                      borderBottom: i < entry.sets.length - 1 ? `1px solid ${TOKENS.line}` : 'none',
                    }}>
                      <div style={{ width: 22, color: c.ink, fontSize: 11, fontWeight: 700 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, color: TOKENS.ink, fontFamily: TOKENS.fontDisplay, fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>
                        <span>{st.weight}</span>
                        <span style={{ color: TOKENS.muted, fontWeight: 500, fontSize: 12, marginLeft: 3 }}>lb</span>
                        <span style={{ color: TOKENS.subtle, margin: '0 8px', fontWeight: 500 }}>×</span>
                        <span>{st.reps}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}

function StatBox({ label, value, suffix }) {
  return (
    <div style={{
      flex: 1, background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
      borderRadius: 12, padding: '12px 14px',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: 1.2,
        textTransform: 'uppercase', color: TOKENS.subtle, marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontFamily: TOKENS.fontDisplay,
        fontSize: 24, fontWeight: 600, letterSpacing: -0.6,
        fontVariantNumeric: 'tabular-nums', color: TOKENS.ink,
      }}>
        {value}{suffix && <span style={{ fontSize: 11, fontWeight: 500, color: TOKENS.muted, marginLeft: 3, fontFamily: TOKENS.font, letterSpacing: 0 }}>{suffix}</span>}
      </div>
    </div>
  );
}

Object.assign(window, {
  WorkoutScreen, ExercisesScreen, HistoryScreen, SessionDetailScreen,
});
