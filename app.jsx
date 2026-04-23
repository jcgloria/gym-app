// app.jsx — main app: router + root component

function useNav() {
  const [tab, setTab] = React.useState('routines');
  const [stack, setStack] = React.useState([]); // pages above the tab root

  return {
    tab, setTab: (t) => { setTab(t); setStack([]); },
    push: (page) => setStack(s => [...s, page]),
    pop: () => setStack(s => s.slice(0, -1)),
    replace: (page) => setStack(s => [...s.slice(0, -1), page]),
    reset: (opts) => { setStack([]); if (opts?.tab) setTab(opts.tab); },
    stack,
  };
}

function App() {
  const nav = useNav();
  const top = nav.stack[nav.stack.length - 1];

  let content;
  if (top) {
    switch (top.name) {
      case 'routine':
        content = <RoutineScreen nav={nav} routineId={top.routineId} />; break;
      case 'workout':
        content = <WorkoutScreen nav={nav} sessionId={top.sessionId} />; break;
      case 'session':
        content = <SessionDetailScreen nav={nav} sessionId={top.sessionId} />; break;
      default:
        content = null;
    }
  } else {
    switch (nav.tab) {
      case 'routines':  content = <RoutinesScreen nav={nav} />; break;
      case 'exercises': content = <ExercisesScreen nav={nav} />; break;
      case 'history':   content = <HistoryScreen nav={nav} />; break;
    }
  }

  return (
    <div key={top ? top.name + (top.routineId || top.sessionId || '') : nav.tab}
         style={{ height: '100%', animation: 'fadeIn 160ms ease-out' }}>
      {content}
    </div>
  );
}

// Mount inside the iOS device frame, centered
function Root() {
  React.useEffect(() => {
    applyTheme({ dark: false, accent: 'ink' });
  }, []);

  const [size, setSize] = React.useState(() => computeSize());
  React.useEffect(() => {
    const on = () => setSize(computeSize());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  function computeSize() {
    const w = window.innerWidth, h = window.innerHeight;
    const targetW = 390, targetH = 844;
    const pad = 24;
    const scale = Math.min(1, (w - pad * 2) / targetW, (h - pad * 2) / targetH);
    return { scale, targetW, targetH };
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#EDEDEA',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        transform: `scale(${size.scale})`,
        transformOrigin: 'center center',
      }}>
        <IOSDevice width={size.targetW} height={size.targetH}>
          <App />
        </IOSDevice>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
