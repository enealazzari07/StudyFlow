// StudyFlow — Dashboard (v2: floating sidebar, compact, calm)
const { useState, useEffect, useRef } = React;

const MOCK_SETS = [
  { id: 's1', title: 'Mikroökonomie II', cards: 142, mastered: 87, due: 12, lastStudy: 'Heute', collaborators: ['Lara K', 'Tim R'], folder: 'Sommersemester 26' },
  { id: 's2', title: 'Statistik — Hypothesentests', cards: 68, mastered: 42, due: 8, lastStudy: 'Gestern', collaborators: [], folder: 'Sommersemester 26' },
  { id: 's3', title: 'Marketing Grundlagen', cards: 94, mastered: 94, due: 0, lastStudy: 'vor 3 T.', collaborators: ['Noah W'], folder: 'Wintersemester 25', done: true },
  { id: 's4', title: 'Französisch — B2 Vokabeln', cards: 320, mastered: 180, due: 24, lastStudy: 'Heute', collaborators: ['Mia S', 'Jan P', 'Lea F'], folder: 'Sprachen' },
  { id: 's5', title: 'Org. Chemie — Reaktionen', cards: 56, mastered: 12, due: 20, lastStudy: 'vor 5 T.', collaborators: [], folder: 'Sommersemester 26' },
  { id: 's6', title: 'Klausur Psychologie', cards: 0, mastered: 0, due: 0, lastStudy: '—', collaborators: [], folder: 'Sommersemester 26', draft: true },
];

const DOCK_ITEMS = [
  { id: 'home', label: 'Start', icon: <Icons.Home size={18}/> },
  { id: 'cards', label: 'Lernsets', icon: <Icons.Cards size={18}/> },
  { id: 'docs', label: 'Dokumente', icon: <Icons.Doc size={18}/> },
  { id: 'ai', label: 'Flow AI', icon: <Icons.Sparkles size={18}/> },
  { id: 'stats', label: 'Fortschritt', icon: <Icons.Chart size={18}/> },
  { id: 'settings', label: 'Einstellungen', icon: <Icons.Settings size={18}/> },
];

// ─────────────────────────────────────────────────────────────
// Sidebar — rounded white card, floats with margin around it
// ─────────────────────────────────────────────────────────────
const Sidebar = () => (
  <aside style={{
    width: 240,
    flexShrink: 0,
    margin: '14px 0 14px 14px',
    background: 'white',
    borderRadius: 18,
    border: '1px solid rgba(15,23,42,0.06)',
    boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    height: 'calc(100vh - 28px)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 4px' }}>
      <Icons.Logo size={26}/>
      <div style={{ fontFamily: 'Caveat', fontSize: 24, fontWeight: 600, color: '#0f172a' }}>StudyFlow</div>
    </div>

    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '9px 14px', fontSize: 13 }}>
      <Icons.Plus size={14}/> Neues Lernset
    </button>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, padding: '0 8px' }}>Bibliothek</div>
      {[
        { label: 'Alle Lernsets', count: 12, icon: <Icons.Cards size={15}/>, active: true },
        { label: 'Dokumente', count: 8, icon: <Icons.Doc size={15}/> },
        { label: 'Favoriten', count: 3, icon: <Icons.Star size={15}/> },
        { label: 'Geteilt mit mir', count: 5, icon: <Icons.Users size={15}/> },
      ].map(item => (
        <div key={item.label} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '7px 10px', borderRadius: 8,
          background: item.active ? '#f1f5f9' : 'transparent',
          color: item.active ? '#0f172a' : '#475569',
          fontSize: 13, fontWeight: item.active ? 500 : 400,
          cursor: 'pointer',
        }}>
          {item.icon}
          <span style={{ flex: 1 }}>{item.label}</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.count}</span>
        </div>
      ))}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: 6 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Ordner</span>
        <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <Icons.Plus size={13}/>
        </button>
      </div>
      {[
        'Sommersemester 26',
        'Wintersemester 25',
        'Sprachen',
        'Archiv',
      ].map(f => (
        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', fontSize: 13, color: '#475569', cursor: 'pointer', borderRadius: 8 }}>
          <Icons.Folder size={15}/>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f}</span>
        </div>
      ))}
    </div>

    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderTop: '1px solid rgba(15,23,42,0.06)', paddingTop: 14 }}>
      <Avatar name="Alex Meier" color="#6366f1" size={30}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Alex Meier</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>Free Plan</div>
      </div>
      <button style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
        <Icons.Settings size={15}/>
      </button>
    </div>
  </aside>
);

// ─────────────────────────────────────────────────────────────
// TopBar — inline on main content (no background panel)
// ─────────────────────────────────────────────────────────────
const TopBar = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
    <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
        <Icons.Search size={15}/>
      </div>
      <input
        className="input-paper"
        placeholder="Suchen…"
        style={{ paddingLeft: 36, background: 'white', padding: '8px 12px 8px 36px', fontSize: 13 }}
      />
      <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 3 }}>
        <kbd style={{ fontSize: 10, padding: '2px 5px', background: '#f1f5f9', borderRadius: 4, color: '#64748b', fontFamily: 'JetBrains Mono' }}>⌘K</kbd>
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
        2 online
      </div>
      <CollabAvatars users={[
        { name: 'Lara K', color: '#ec4899' },
        { name: 'Tim R', color: '#f59e0b' },
      ]}/>
      <div style={{ width: 1, height: 18, background: '#e2e8f0' }}></div>
      <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'inherit' }}>
        🔥 47
      </button>
      <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: 7, borderRadius: 8, cursor: 'pointer', color: '#475569', position: 'relative', display: 'flex' }}>
        <Icons.Bell size={15}/>
        <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, background: '#ef4444', borderRadius: '50%' }}></span>
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Set Row — clean, compact, no color, no emoji
// ─────────────────────────────────────────────────────────────
const SetRow = ({ set }) => {
  const pct = set.cards ? Math.round((set.mastered / set.cards) * 100) : 0;
  return (
    <a href={`lernset.html?id=${set.id}`} style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 110px 90px 70px 80px',
      alignItems: 'center',
      gap: 14,
      padding: '10px 14px',
      background: 'white',
      borderRadius: 10,
      border: '1px solid rgba(15,23,42,0.05)',
      transition: 'border-color 0.15s, background 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#fafbfc'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.05)'; e.currentTarget.style.background = 'white'; }}
    >
      {/* Title + folder */}
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{set.title}</div>
          {set.done && <span style={{ fontSize: 10, color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: 4, fontWeight: 500, flexShrink: 0 }}>Fertig</span>}
          {set.draft && <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontWeight: 500, flexShrink: 0 }}>Entwurf</span>}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {set.cards} Karten
          <span style={{ color: '#cbd5e1' }}>·</span>
          {set.lastStudy}
        </div>
      </div>

      {/* Progress */}
      <div>
        {!set.draft ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 3 }}>
              <span>{pct}%</span>
              <span>{set.mastered}/{set.cards}</span>
            </div>
            <div style={{ height: 4, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#0f172a', borderRadius: 999 }}></div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: '#94a3b8' }}>—</div>
        )}
      </div>

      {/* Due */}
      <div style={{ fontSize: 12, color: '#64748b' }}>
        {set.due > 0 ? (
          <span style={{ color: '#dc2626', fontWeight: 500 }}>{set.due} fällig</span>
        ) : (
          <span style={{ color: '#94a3b8' }}>keine fällig</span>
        )}
      </div>

      {/* Collaborators */}
      <div>
        {set.collaborators.length > 0 ? (
          <div style={{ display: 'flex' }}>
            {set.collaborators.slice(0, 3).map((c, i) => (
              <div key={c} style={{ marginLeft: i === 0 ? 0 : -6 }}>
                <Avatar name={c} size={22} ring/>
              </div>
            ))}
            {set.collaborators.length > 3 && <div style={{ marginLeft: -6, width: 22, height: 22, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>+{set.collaborators.length - 3}</div>}
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: '#cbd5e1' }}>Nur ich</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
        <button style={{ padding: '5px 10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, fontSize: 11.5, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500 }}>
          Lernen
        </button>
        <button style={{ padding: 5, background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <Icons.MoreH size={14}/>
        </button>
      </div>
    </a>
  );
};

// ─────────────────────────────────────────────────────────────
// Stats — compact
// ─────────────────────────────────────────────────────────────
const StatsRow = () => {
  const stats = [
    { label: 'Fällig heute', value: '44', sub: '~18 Min' },
    { label: 'Diese Woche', value: '287', sub: 'Karten geübt' },
    { label: 'Gemeistert', value: '68%', sub: '+4%' },
    { label: 'Lernzeit', value: '4h 12m', sub: 'diese Woche' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(15,23,42,0.05)' }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
          <div style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: '#0f172a', marginTop: 2, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [active, setActive] = useState('home');
  const [filter, setFilter] = useState('all');

  return (
    <div className="dot-paper" style={{ height: '100vh', overflow: 'hidden', display: 'flex' }}>
      <Sidebar/>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 22px 14px', minWidth: 0, gap: 16, overflow: 'hidden' }}>
        <TopBar/>

        {/* Greeting */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 24, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Servus, Alex.
            </h1>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              <span style={{ color: '#0f172a', fontWeight: 500 }}>44 Karten</span> fällig — ~18 Min.
            </span>
          </div>
        </div>

        <StatsRow/>

        {/* Lernsets section */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>Alle Lernsets</h2>
              <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', padding: 2, borderRadius: 7 }}>
                {[
                  { k: 'all', l: 'Alle' },
                  { k: 'due', l: 'Fällig' },
                  { k: 'shared', l: 'Geteilt' },
                ].map(t => (
                  <button key={t.k} onClick={() => setFilter(t.k)} style={{
                    padding: '4px 10px', background: filter === t.k ? 'white' : 'transparent',
                    border: 'none', borderRadius: 5, fontSize: 11.5,
                    color: filter === t.k ? '#0f172a' : '#64748b',
                    fontWeight: filter === t.k ? 500 : 400,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: filter === t.k ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
                  }}>{t.l}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ padding: '5px 10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 11.5, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                Zuletzt geübt <Icons.Chevron size={12}/>
              </button>
            </div>
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 110px 90px 70px 80px',
            gap: 14,
            padding: '0 14px',
            fontSize: 10.5, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <div>Name</div>
            <div>Fortschritt</div>
            <div>Status</div>
            <div>Team</div>
            <div></div>
          </div>

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4, paddingBottom: 70 }}>
            {MOCK_SETS.map(s => <SetRow key={s.id} set={s}/>)}
          </div>
        </div>
      </main>

      {/* Floating dock — centered, calm */}
      <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}>
        <Dock items={DOCK_ITEMS} active={active} onSelect={setActive}/>
      </div>

      <AIAssistant/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard/>);
