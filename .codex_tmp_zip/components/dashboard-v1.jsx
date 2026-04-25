// StudyFlow — Dashboard
const { useState, useEffect, useRef } = React;

const MOCK_SETS = [
  { id: 's1', title: 'Mikroökonomie II', emoji: '📊', cards: 142, mastered: 87, due: 12, color: '#6366f1', lastStudy: 'Heute', collaborators: ['Lara K', 'Tim R'] },
  { id: 's2', title: 'Statistik — Hypothesentests', emoji: '📈', cards: 68, mastered: 42, due: 8, color: '#10b981', lastStudy: 'Gestern', collaborators: [] },
  { id: 's3', title: 'Marketing Grundlagen', emoji: '📣', cards: 94, mastered: 94, due: 0, color: '#f59e0b', lastStudy: 'vor 3 T.', collaborators: ['Noah W'], done: true },
  { id: 's4', title: 'Französisch — B2 Vokabeln', emoji: '🇫🇷', cards: 320, mastered: 180, due: 24, color: '#ec4899', lastStudy: 'Heute', collaborators: ['Mia S', 'Jan P', 'Lea F'] },
  { id: 's5', title: 'Org. Chemie — Reaktionen', emoji: '🧪', cards: 56, mastered: 12, due: 20, color: '#8b5cf6', lastStudy: 'vor 5 T.', collaborators: [] },
  { id: 's6', title: 'Neu: Klausur Psych.', emoji: '🧠', cards: 0, mastered: 0, due: 0, color: '#06b6d4', lastStudy: '—', collaborators: [], draft: true },
];

const MOCK_DOCS = [
  { id: 'd1', title: 'Mikro_VL07_Elastizität.pdf', pages: 24, ai: true, date: 'Heute' },
  { id: 'd2', title: 'Stats_Übungsblatt_4.pdf', pages: 8, ai: false, date: 'Gestern' },
  { id: 'd3', title: 'Marketing_Skript_Kapitel3.pdf', pages: 42, ai: true, date: 'vor 2 T.' },
];

const DOCK_ITEMS = [
  { id: 'home', label: 'Start', icon: <Icons.Home size={22}/> },
  { id: 'cards', label: 'Lernsets', icon: <Icons.Cards size={22}/> },
  { id: 'docs', label: 'Dokumente', icon: <Icons.Doc size={22}/> },
  { id: 'ai', label: 'Flow AI', icon: <Icons.Sparkles size={22}/>, badge: '2' },
  { id: 'stats', label: 'Fortschritt', icon: <Icons.Chart size={22}/> },
  { id: 'settings', label: 'Einstellungen', icon: <Icons.Settings size={22}/> },
];

const SetCard = ({ set, size = 'md' }) => {
  const pct = set.cards ? Math.round((set.mastered / set.cards) * 100) : 0;
  const isLarge = size === 'lg';
  return (
    <a href={`lernset.html?id=${set.id}`} style={{
      display: 'block',
      position: 'relative',
      background: 'white',
      borderRadius: 16,
      padding: isLarge ? 24 : 18,
      border: '1px solid rgba(15,23,42,0.06)',
      boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 2px 8px rgba(15,23,42,0.04)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      overflow: 'hidden',
      minHeight: isLarge ? 200 : 160,
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.03), 0 2px 8px rgba(15,23,42,0.04)'; }}
    >
      {/* color corner */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: set.color }}></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: isLarge ? 34 : 26, lineHeight: 1 }}>{set.emoji}</div>
        {set.done && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#10b981', background: '#d1fae5', padding: '3px 8px', borderRadius: 999, fontWeight: 500 }}>
            <Icons.Check size={11}/> Fertig
          </div>
        )}
        {set.due > 0 && !set.draft && (
          <div style={{ fontSize: 11, color: '#dc2626', background: '#fee2e2', padding: '3px 8px', borderRadius: 999, fontWeight: 500 }}>
            {set.due} fällig
          </div>
        )}
        {set.draft && (
          <div style={{ fontSize: 11, color: '#6366f1', background: '#eef2ff', padding: '3px 8px', borderRadius: 999, fontWeight: 500 }}>
            Entwurf
          </div>
        )}
      </div>

      <div style={{ fontFamily: 'Instrument Sans', fontSize: isLarge ? 20 : 16, fontWeight: 600, color: '#0f172a', marginTop: 14, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
        {set.title}
      </div>

      {!set.draft ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
            <span style={{ fontFamily: 'Caveat', fontSize: isLarge ? 26 : 22, fontWeight: 600, color: set.color }}>{pct}%</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>gemeistert</span>
          </div>
          <div style={{ height: 5, background: '#f1f5f9', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: set.color, borderRadius: 999 }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 11.5, color: '#94a3b8' }}>
            <span>{set.cards} Karten · {set.lastStudy}</span>
            {set.collaborators.length > 0 && (
              <div style={{ display: 'flex' }}>
                {set.collaborators.slice(0, 3).map((c, i) => (
                  <div key={c} style={{ marginLeft: i === 0 ? 0 : -6 }}>
                    <Avatar name={c} size={20} ring/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>Leer — Karten hinzufügen ↗</div>
      )}
    </a>
  );
};

const Sidebar = () => (
  <aside style={{ width: 240, flexShrink: 0, padding: '28px 20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icons.Logo size={30}/>
      <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 600, color: '#0f172a' }}>StudyFlow</div>
    </div>

    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
      <Icons.Plus size={16}/> Neues Lernset
    </button>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Bibliothek</div>
      {[
        { label: 'Alle Lernsets', count: 12, icon: <Icons.Cards size={16}/>, active: true },
        { label: 'Dokumente', count: 8, icon: <Icons.Doc size={16}/> },
        { label: 'Favoriten', count: 3, icon: <Icons.Star size={16}/> },
        { label: 'Geteilt mit mir', count: 5, icon: <Icons.Users size={16}/> },
      ].map(item => (
        <div key={item.label} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 8,
          background: item.active ? '#eef2ff' : 'transparent',
          color: item.active ? '#4f46e5' : '#475569',
          fontSize: 13.5, fontWeight: item.active ? 500 : 400,
          cursor: 'pointer',
        }}>
          {item.icon}
          <span style={{ flex: 1 }}>{item.label}</span>
          <span style={{ fontSize: 11, color: item.active ? '#818cf8' : '#94a3b8' }}>{item.count}</span>
        </div>
      ))}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Ordner</div>
      {[
        { label: 'Sommersemester 26', color: '#6366f1' },
        { label: 'Wintersemester 25', color: '#f59e0b' },
        { label: 'Sprachen', color: '#ec4899' },
      ].map(f => (
        <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', fontSize: 13.5, color: '#475569', cursor: 'pointer', borderRadius: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: f.color, opacity: 0.85 }}></div>
          {f.label}
        </div>
      ))}
    </div>

    <div style={{ marginTop: 'auto', padding: 14, background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', borderRadius: 12, border: '1px solid #c7d2fe' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4f46e5', fontWeight: 600 }}>
        <Icons.Sparkles size={12}/> PRO UPGRADE
      </div>
      <div style={{ fontFamily: 'Caveat', fontSize: 18, fontWeight: 600, color: '#0f172a', marginTop: 4, lineHeight: 1.2 }}>Unbegrenzte AI-Nutzung</div>
      <button style={{ marginTop: 10, padding: '7px 12px', fontSize: 12, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', width: '100%', fontFamily: 'inherit', fontWeight: 500 }}>
        Jetzt upgraden
      </button>
    </div>
  </aside>
);

const TopBar = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', gap: 20 }}>
    <div style={{ flex: 1, maxWidth: 440, position: 'relative' }}>
      <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
        <Icons.Search size={16}/>
      </div>
      <input
        className="input-paper"
        placeholder="Lernsets, Karten, Dokumente durchsuchen…"
        style={{ paddingLeft: 40, background: 'white' }}
      />
      <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 3 }}>
        <kbd style={{ fontSize: 10, padding: '2px 6px', background: '#f1f5f9', borderRadius: 4, color: '#64748b', fontFamily: 'JetBrains Mono' }}>⌘</kbd>
        <kbd style={{ fontSize: 10, padding: '2px 6px', background: '#f1f5f9', borderRadius: 4, color: '#64748b', fontFamily: 'JetBrains Mono' }}>K</kbd>
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fef3c7', borderRadius: 999, fontSize: 12.5, fontWeight: 500, color: '#92400e' }}>
        🔥 47 Tage Streak
      </div>
      <button style={{ background: 'none', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer', color: '#475569', position: 'relative' }}>
        <Icons.Bell size={18}/>
        <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>
      </button>
      <Avatar name="Alex Meier" color="#6366f1" size={32}/>
    </div>
  </div>
);

const Greeting = () => {
  const now = new Date();
  const hour = now.getHours();
  const greet = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Servus' : 'Guten Abend';
  return (
    <div style={{ padding: '8px 32px 24px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 34, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
          {greet}, Alex.
        </h1>
        <span style={{ fontFamily: 'Caveat', fontSize: 28, color: '#6366f1', fontWeight: 600 }}>
          Zeit zu lernen!
        </span>
        <span style={{ position: 'relative', top: -4, transform: 'rotate(-8deg)', display: 'inline-block' }}>
          <Doodles.Arrow color="#818cf8" w={44}/>
        </span>
      </div>
      <div style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
        Du hast <span style={{ color: '#0f172a', fontWeight: 500 }}>44 Karten fällig</span> heute. Das schaffst du in ~18 Min.
      </div>
    </div>
  );
};

const StatsRow = () => {
  const stats = [
    { label: 'Fällig heute', value: 44, sub: '~18 Min', color: '#ef4444', icon: <Icons.Clock size={16}/> },
    { label: 'Diese Woche', value: 287, sub: 'Karten geübt', color: '#6366f1', icon: <Icons.Cards size={16}/> },
    { label: 'Gemeistert', value: '68%', sub: '+4% vs. letzte Woche', color: '#10b981', icon: <Icons.Check size={16}/> },
    { label: 'Lernzeit', value: '4h 12m', sub: 'Diese Woche', color: '#f59e0b', icon: <Icons.Chart size={16}/> },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, padding: '0 32px 28px' }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{s.label}</div>
            <div style={{ color: s.color, opacity: 0.8 }}>{s.icon}</div>
          </div>
          <div style={{ fontFamily: 'Instrument Sans', fontSize: 26, fontWeight: 600, color: '#0f172a', marginTop: 4, letterSpacing: '-0.02em' }}>{s.value}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
};

const SetsSection = () => (
  <div style={{ padding: '0 32px 32px' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 600, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>Deine Lernsets</h2>
        <span style={{ fontFamily: 'Caveat', fontSize: 18, color: '#94a3b8', fontWeight: 500 }}>— weiter so 💪</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12.5 }}>Zuletzt geübt</button>
        <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12.5 }}>
          <Icons.Plus size={13}/> Neu
        </button>
      </div>
    </div>

    {/* Bento grid */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridAutoRows: 'minmax(180px, auto)',
      gap: 14,
    }}>
      <div style={{ gridColumn: 'span 2', gridRow: 'span 1' }}>
        <SetCard set={MOCK_SETS[0]} size="lg"/>
      </div>
      <SetCard set={MOCK_SETS[1]}/>
      <SetCard set={MOCK_SETS[3]}/>
      <SetCard set={MOCK_SETS[2]}/>
      <SetCard set={MOCK_SETS[4]}/>
      <SetCard set={MOCK_SETS[5]}/>
    </div>
  </div>
);

const DocsSection = () => (
  <div style={{ padding: '0 32px 80px' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 600, color: '#0f172a', margin: 0 }}>Zuletzt hochgeladen</h2>
      <a href="ai-upload.html" className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12.5 }}>
        <Icons.Upload size={13}/> Hochladen
      </a>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      {MOCK_DOCS.map(d => (
        <div key={d.id} style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid rgba(15,23,42,0.06)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 44, height: 54, background: '#eef2ff', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1',
            position: 'relative', flexShrink: 0,
            boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
          }}>
            <Icons.Doc size={22}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{d.pages} Seiten · {d.date}</div>
            {d.ai && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, padding: '2px 8px', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', color: '#4f46e5', borderRadius: 999, fontSize: 11, fontWeight: 500, border: '1px solid #c7d2fe' }}>
                <Icons.Sparkles size={10}/> AI-verarbeitet
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Live cursors — fake movement
const FakeCursors = () => {
  const [cursors, setCursors] = useState([
    { name: 'Lara K', color: '#ec4899', x: 420, y: 380 },
    { name: 'Tim R', color: '#f59e0b', x: 820, y: 620 },
  ]);

  useEffect(() => {
    const iv = setInterval(() => {
      setCursors(cs => cs.map(c => ({
        ...c,
        x: Math.max(280, Math.min(1100, c.x + (Math.random() - 0.5) * 60)),
        y: Math.max(200, Math.min(700, c.y + (Math.random() - 0.5) * 40)),
      })));
    }, 1200);
    return () => clearInterval(iv);
  }, []);

  return <>{cursors.map(c => <LiveCursor key={c.name} {...c}/>)}</>;
};

const Dashboard = () => {
  const [active, setActive] = useState('home');
  return (
    <div className="dot-paper" style={{ minHeight: '100vh', position: 'relative' }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar/>
        <main style={{ flex: 1, background: 'rgba(255,255,255,0.5)', borderLeft: '1px solid rgba(15,23,42,0.06)', position: 'relative' }}>
          <TopBar/>
          {/* Collab bar (top-right over content) */}
          <div style={{ position: 'absolute', top: 78, right: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
              2 online
            </div>
            <CollabAvatars users={[
              { name: 'Lara K', color: '#ec4899' },
              { name: 'Tim R', color: '#f59e0b' },
              { name: 'Alex Meier', color: '#6366f1' },
            ]}/>
          </div>
          <Greeting/>
          <StatsRow/>
          <SetsSection/>
          <DocsSection/>
          <FakeCursors/>
        </main>
      </div>

      {/* Floating dock */}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}>
        <Dock items={DOCK_ITEMS} active={active} onSelect={setActive}/>
      </div>

      <AIAssistant/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard/>);
